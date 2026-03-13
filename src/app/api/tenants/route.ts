import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// GET /api/tenants
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  const search = searchParams.get("q") ?? "";

  const userId = session.user.id;
  const role = session.user.role;

  const propertyWhere =
    role === "SUPER_ADMIN" ? {} : role === "LANDLORD" ? { ownerId: userId } : { admins: { some: { userId } } };

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

  const body = await req.json();
  const { name, email, phone, unitId, startDate, rentAmount, deposit, nationalId } = body;

  if (!name || !unitId || !startDate) {
    return NextResponse.json({ error: "Name, unit, and start date are required." }, { status: 400 });
  }
  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
  }

  // Check if unit exists and is vacant
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) return NextResponse.json({ error: "Unit not found." }, { status: 404 });
  if (unit.status === "OCCUPIED") {
    return NextResponse.json({ error: "This unit is already occupied." }, { status: 409 });
  }

  // Create or find user account
  let user = await prisma.user.findFirst({
    where: email ? { email } : { phone },
  });

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  let tenantProfile: Awaited<ReturnType<typeof prisma.tenantProfile.create>>;

  if (!user) {
    // Create a placeholder user (they will complete registration via invite)
    user = await prisma.user.create({
      data: {
        name,
        email: email ?? null,
        phone: phone ?? null,
        role: "TENANT",
      },
    });

    tenantProfile = await prisma.tenantProfile.create({
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
    // Ensure tenant profile exists
    tenantProfile = await prisma.tenantProfile.upsert({
      where: { userId: user.id },
      update: { nationalId, inviteToken, inviteExpiry },
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

  // Create tenancy
  const tenancy = await prisma.tenancy.create({
    data: {
      unitId,
      tenantId: tenantProfile.id,
      startDate: new Date(startDate),
      rentAmount: Number(rentAmount ?? unit.rentAmount),
      deposit: deposit ? Number(deposit) : null,
      isActive: true,
      activeForUnitId: unitId,
    },
  });

  // Mark unit as occupied
  await prisma.unit.update({
    where: { id: unitId },
    data: { status: "OCCUPIED" },
  });

  // Update tenant profile status
  await prisma.tenantProfile.update({
    where: { id: tenantProfile.id },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ tenancy, inviteToken }, { status: 201 });
}
