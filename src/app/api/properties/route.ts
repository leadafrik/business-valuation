import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";
import { createAuditLog } from "@/lib/audit";

// GET /api/properties – list all properties for current landlord/admin
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const userId = session.user.id;
  const role = session.user.role;

  const where = getManagementPropertyWhere(userId, role);
  if (!where) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const properties = await prisma.property.findMany({
    where: {
      ...where,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    },
    include: {
      _count: { select: { units: true } },
      units: { select: { status: true }, },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(properties);
}

// POST /api/properties – create a new property
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["LANDLORD", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only landlords can create properties." }, { status: 403 });
  }

  const body = await req.json();
  const { name, address, city, county, type, description, amenities } = body;

  if (!name || !address) {
    return NextResponse.json({ error: "Name and address are required." }, { status: 400 });
  }

  // Generate a unique property code
  const code = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) + Math.floor(1000 + Math.random() * 9000);

  const property = await prisma.property.create({
    data: {
      name,
      code,
      address,
      city,
      county,
      type: type ?? "APARTMENT_COMPLEX",
      description,
      amenities,
      ownerId: session.user.id,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "PROPERTY_CREATED",
    entityType: "Property",
    entityId: property.id,
    metadata: {
      name: property.name,
      code: property.code,
      city: property.city,
      type: property.type,
    },
  });

  return NextResponse.json(property, { status: 201 });
}
