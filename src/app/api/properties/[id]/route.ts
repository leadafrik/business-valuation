import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/properties/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
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
  const body = await req.json();

  const property = await prisma.property.update({
    where: { id },
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
  const { id } = await params;

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
