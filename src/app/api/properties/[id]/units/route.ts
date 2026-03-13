import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageProperty, isManagementRole } from "@/lib/access";

// GET /api/properties/[id]/units
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: propertyId } = await params;
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const canAccess = await canManageProperty(
    { id: session.user.id, role: session.user.role },
    propertyId
  );
  if (!canAccess) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const units = await prisma.unit.findMany({
    where: { propertyId },
    include: {
      currentTenancy: {
        include: {
          tenant: {
            include: { user: { select: { name: true, email: true, phone: true } } },
          },
          payments: {
            where: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
            take: 1,
          },
        },
      },
    },
    orderBy: { unitNumber: "asc" },
  });

  return NextResponse.json(units);
}

// POST /api/properties/[id]/units
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: propertyId } = await params;
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();

  if (!body.unitNumber || !body.rentAmount) {
    return NextResponse.json({ error: "Unit number and rent amount are required." }, { status: 400 });
  }

  const canAccess = await canManageProperty(
    { id: session.user.id, role: session.user.role },
    propertyId
  );
  if (!canAccess) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const unit = await prisma.$transaction(async (tx) => {
    const created = await tx.unit.create({
      data: {
        propertyId,
        unitNumber: body.unitNumber,
        floor: body.floor,
        block: body.block,
        type: body.type,
        bedrooms: body.bedrooms ? Number(body.bedrooms) : null,
        bathrooms: body.bathrooms ? Number(body.bathrooms) : null,
        sqft: body.sqft ? Number(body.sqft) : null,
        rentAmount: Number(body.rentAmount),
        depositAmount: body.depositAmount ? Number(body.depositAmount) : null,
        meterNumber: body.meterNumber,
        notes: body.notes,
      },
    });

    await tx.property.update({
      where: { id: propertyId },
      data: { totalUnits: { increment: 1 } },
    });

    return created;
  });

  return NextResponse.json(unit, { status: 201 });
}
