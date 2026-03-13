import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAccessibleUnit, getManagementPropertyWhere } from "@/lib/access";

// GET /api/tickets
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statuses = searchParams.getAll("status").filter(Boolean);
  const propertyId = searchParams.get("propertyId");

  const userId = session.user.id;
  const role = session.user.role;

  let whereUnit = {};
  if (role === "TENANT") {
    whereUnit = {
      currentTenancy: {
        is: {
          isActive: true,
          tenant: { userId },
        },
      },
    };
  } else {
    const propertyWhere = getManagementPropertyWhere(userId, role);
    if (!propertyWhere) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    whereUnit = { property: propertyWhere };
  }

  const tickets = await prisma.maintenanceTicket.findMany({
    where: {
      unit: {
        ...(propertyId ? { propertyId } : {}),
        ...whereUnit,
      },
      ...(statuses.length === 1
        ? { status: statuses[0] as any }
        : statuses.length > 1
        ? { status: { in: statuses as any[] } }
        : {}),
    },
    include: {
      unit: {
        include: { property: { select: { name: true } } },
      },
      _count: { select: { comments: true } },
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

  const unit = await getAccessibleUnit(
    { id: session.user.id, role: session.user.role },
    unitId
  );
  if (!unit) {
    return NextResponse.json({ error: "Unit not found." }, { status: 404 });
  }

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      unitId: unit.id,
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
