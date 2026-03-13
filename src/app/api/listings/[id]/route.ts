import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

type RouteContext = { params: Promise<{ id: string }> };
const LISTING_STATUSES = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);

function parseOptionalNumber(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const propertyWhere = getManagementPropertyWhere(session.user.id, session.user.role);
  if (!propertyWhere) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const listing = await prisma.propertyListing.findFirst({
    where: {
      id,
      property: propertyWhere,
    },
    include: {
      property: { select: { id: true, name: true, address: true, city: true } },
      unit: { select: { id: true, unitNumber: true, status: true } },
      inquiries: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          tenantProfile: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          messages: {
            include: {
              sender: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const propertyWhere = getManagementPropertyWhere(session.user.id, session.user.role);
  if (!propertyWhere) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.propertyListing.findFirst({
    where: {
      id,
      property: propertyWhere,
    },
    select: {
      id: true,
      propertyId: true,
      status: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  for (const key of ["title", "summary", "description"]) {
    if (body[key] !== undefined) {
      updates[key] = String(body[key]).trim();
    }
  }

  if (body.photos !== undefined) {
    updates.photos = Array.isArray(body.photos)
      ? body.photos
          .filter((item: unknown): item is string => typeof item === "string")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];
  }

  for (const key of ["bedrooms", "bathrooms", "sqft", "monthlyRent", "depositAmount"]) {
    if (body[key] === undefined) {
      continue;
    }

    const parsed = parseOptionalNumber(body[key]);
    if (Number.isNaN(parsed)) {
      return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
    }

    updates[key] = parsed;
  }

  if (body.status !== undefined) {
    if (!LISTING_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid listing status." }, { status: 400 });
    }

    updates.status = body.status;
    updates.publishedAt = body.status === "PUBLISHED" ? new Date() : null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  const listing = await prisma.propertyListing.update({
    where: { id: existing.id },
    data: updates,
  });

  await createAuditLog({
    userId: session.user.id,
    action: "LISTING_UPDATED",
    entityType: "PropertyListing",
    entityId: listing.id,
    metadata: {
      propertyId: existing.propertyId,
      status: listing.status,
      changedFields: Object.keys(updates),
    },
  });

  return NextResponse.json({ listing });
}
