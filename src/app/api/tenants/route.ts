import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import {
  getAccessibleUnit,
  getManagementPropertyWhere,
  isManagementRole,
} from "@/lib/access";
import { createAuditLog } from "@/lib/audit";
import {
  getUserContactClauses,
  normalizeEmail,
  normalizePhone,
} from "@/lib/identity";
import { createNotification } from "@/lib/notifications";

// GET /api/tenants
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  const search = searchParams.get("q") ?? "";

  const userId = session.user.id;
  const role = session.user.role;

  const propertyWhere = getManagementPropertyWhere(userId, role);
  if (!propertyWhere) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenancies = await prisma.tenancy.findMany({
    where: {
      isActive: true,
      unit: {
        property: propertyId ? { id: propertyId, ...propertyWhere } : propertyWhere,
      },
    },
    include: {
      tenant: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, image: true } },
        },
      },
      unit: {
        include: {
          property: { select: { id: true, name: true } },
          payments: {
            where: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by search term
  const filtered = search
    ? tenancies.filter((t) => {
        const name = t.tenant.user?.name?.toLowerCase() ?? "";
        const phone = t.tenant.user?.phone?.toLowerCase() ?? "";
        const unit = t.unit.unitNumber.toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || phone.includes(q) || unit.includes(q);
      })
    : tenancies;

  return NextResponse.json(filtered);
}

// POST /api/tenants – Add tenant to a unit
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Only managers can add tenants." }, { status: 403 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const {
    unitId,
    startDate,
    rentAmount,
    deposit,
    nationalId,
  } = body;

  if (!name || !unitId || !startDate) {
    return NextResponse.json({ error: "Name, unit, and start date are required." }, { status: 400 });
  }
  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
  }

  const unit = await getAccessibleUnit(
    { id: session.user.id, role: session.user.role },
    unitId
  );
  if (!unit) return NextResponse.json({ error: "Unit not found." }, { status: 404 });
  if (unit.status === "OCCUPIED" || unit.currentTenancy?.isActive) {
    return NextResponse.json({ error: "This unit is already occupied." }, { status: 409 });
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await prisma.$transaction(async (tx) => {
    const contactClauses = getUserContactClauses(email, phone);
    const existingUsers = contactClauses.length
      ? await tx.user.findMany({
          where: {
            OR: contactClauses,
          },
        })
      : [];

    const uniqueUsers = Array.from(
      new Map(existingUsers.map((user) => [user.id, user])).values()
    );

    if (uniqueUsers.length > 1) {
      throw new Error("That email and phone belong to different accounts.");
    }

    let user = uniqueUsers[0] ?? null;

    if (user && user.role !== "TENANT") {
      throw new Error("A non-tenant account already uses that email or phone.");
    }

    let tenantProfile;

    if (!user) {
      user = await tx.user.create({
        data: {
          name,
          email: email ?? null,
          phone: phone ?? null,
          role: "TENANT",
        },
      });

      tenantProfile = await tx.tenantProfile.create({
        data: {
          userId: user.id,
          nationalId,
          phone,
          inviteToken,
          inviteExpiry,
          status: "PENDING_APPROVAL",
        },
      });
    } else {
      tenantProfile = await tx.tenantProfile.upsert({
        where: { userId: user.id },
        update: {
          nationalId,
          inviteToken,
          inviteExpiry,
          ...(phone ? { phone } : {}),
        },
        create: {
          userId: user.id,
          nationalId,
          phone,
          inviteToken,
          inviteExpiry,
          status: "PENDING_APPROVAL",
        },
      });
    }

    const tenancy = await tx.tenancy.create({
      data: {
        unitId: unit.id,
        tenantId: tenantProfile.id,
        startDate: new Date(startDate),
        rentAmount: Number(rentAmount ?? unit.rentAmount),
        deposit: deposit ? Number(deposit) : null,
        isActive: true,
        activeForUnitId: unit.id,
      },
    });

    await tx.unit.update({
      where: { id: unit.id },
      data: { status: "OCCUPIED" },
    });

    await tx.tenantProfile.update({
      where: { id: tenantProfile.id },
      data: { status: "ACTIVE" },
    });

    return {
      tenancy,
      tenantUserId: user.id,
      propertyName: unit.property.name,
      unitNumber: unit.unitNumber,
    };
  }).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Failed to add tenant.";
    return { error: message };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await Promise.all([
    createNotification({
      userId: result.tenantUserId,
      type: "TENANT_INVITE",
      title: "Your tenancy is ready",
      body: `You have been added to Unit ${result.unitNumber} at ${result.propertyName}.`,
      metadata: {
        tenancyId: result.tenancy.id,
        inviteToken,
      },
    }),
    createAuditLog({
      userId: session.user.id,
      action: "TENANT_ADDED",
      entityType: "Tenancy",
      entityId: result.tenancy.id,
      metadata: {
        unitId,
        unitNumber: result.unitNumber,
        propertyName: result.propertyName,
        tenantUserId: result.tenantUserId,
      },
    }),
  ]);

  return NextResponse.json({ tenancy: result.tenancy, inviteToken }, { status: 201 });
}
