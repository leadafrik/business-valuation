import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/properties/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const scope = getManagementPropertyWhere(session.user.id, session.user.role);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const property = await prisma.property.findFirst({
    where: { id, ...scope },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      admins: { include: { user: { select: { id: true, name: true, email: true } } } },
      units: {
        include: {
          currentTenancy: {
            include: {
              tenant: { include: { user: { select: { name: true, email: true, phone: true } } } },
              payments: {
                where: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
                take: 1,
              },
            },
          },
        },
        orderBy: { unitNumber: "asc" },
      },
      _count: { select: { units: true, announcements: true } },
    },
  });

  if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  return NextResponse.json(property);
}

// PATCH /api/properties/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const scope = getManagementPropertyWhere(session.user.id, session.user.role);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  const existing = await prisma.property.findFirst({
    where: { id, ...scope },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const property = await prisma.property.update({
    where: { id: existing.id },
    data: {
      name: body.name,
      address: body.address,
      city: body.city,
      county: body.county,
      type: body.type,
      description: body.description,
      amenities: body.amenities,
      isActive: body.isActive,
    },
  });

  return NextResponse.json(property);
}

// DELETE /api/properties/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["LANDLORD", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only property owners can delete properties." }, { status: 403 });
  }
  const { id } = await params;
  const scope = getManagementPropertyWhere(session.user.id, session.user.role);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.property.findFirst({
    where: { id, ...scope },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  await prisma.property.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}
