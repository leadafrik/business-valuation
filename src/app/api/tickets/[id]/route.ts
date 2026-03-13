import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tickets/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const accessWhere =
    session.user.role === "TENANT"
      ? {
          unit: {
            currentTenancy: {
              is: {
                isActive: true,
                tenant: { userId: session.user.id },
              },
            },
          },
        }
      : (() => {
          const propertyWhere = getManagementPropertyWhere(
            session.user.id,
            session.user.role
          );
          return propertyWhere ? { unit: { property: propertyWhere } } : null;
        })();

  if (!accessWhere) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id, ...accessWhere },
    include: {
      unit: { include: { property: { select: { name: true, id: true } } } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(ticket);
}

// PATCH /api/tickets/[id] – update status, assign, add comment
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Only managers can update tickets." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const propertyWhere = getManagementPropertyWhere(session.user.id, session.user.role);
  if (!propertyWhere) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.maintenanceTicket.findFirst({
    where: { id, unit: { property: propertyWhere } },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
  if (body.costEstimate !== undefined) updates.costEstimate = Number(body.costEstimate);
  if (body.status === "RESOLVED") updates.resolvedAt = new Date();

  const ticket = await prisma.maintenanceTicket.update({
    where: { id: existing.id },
    data: updates,
  });

  // Add a comment if provided
  if (body.comment) {
    await prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: session.user.id,
        content: body.comment,
        isInternal: body.isInternal ?? false,
      },
    });
  }

  return NextResponse.json(ticket);
}
