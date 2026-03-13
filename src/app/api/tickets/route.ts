import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tickets
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const propertyId = searchParams.get("propertyId");

  const userId = session.user.id;
  const role = session.user.role;

  let whereUnit = {};
  if (role === "TENANT") {
    whereUnit = { currentTenancy: { tenant: { userId } } };
  } else if (role === "LANDLORD") {
    whereUnit = { property: { ownerId: userId } };
  } else if (role === "PROPERTY_ADMIN") {
    whereUnit = { property: { admins: { some: { userId } } } };
  }

  const tickets = await prisma.maintenanceTicket.findMany({
    where: {
      unit: {
        ...(propertyId ? { propertyId } : {}),
        ...whereUnit,
      },
      ...(status ? { status: status as any } : {}),
    },
    include: {
      unit: {
        include: { property: { select: { name: true } } },
      },
      comments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tickets);
}

// POST /api/tickets – create a new ticket
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { unitId, title, description, category, priority, photos } = body;

  if (!unitId || !title || !description) {
    return NextResponse.json({ error: "Unit, title, and description are required." }, { status: 400 });
  }

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      unitId,
      reportedBy: session.user.id,
      title,
      description,
      category: category ?? "GENERAL",
      priority: priority ?? "MEDIUM",
      photos: photos ?? [],
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
