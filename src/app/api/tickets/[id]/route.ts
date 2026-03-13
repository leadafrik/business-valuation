import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";
import { createAuditLog } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";

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
    select: {
      id: true,
      title: true,
      reportedBy: true,
      assignedTo: true,
      unit: {
        select: {
          id: true,
          unitNumber: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
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

  const recipients = new Map<
    string,
    { type: "TICKET_UPDATED"; title: string; body: string; metadata: Record<string, unknown> }
  >();

  if (existing.reportedBy !== session.user.id) {
    recipients.set(existing.reportedBy, {
      type: "TICKET_UPDATED",
      title: "Maintenance ticket updated",
      body: `${existing.title} for Unit ${existing.unit.unitNumber} has been updated.`,
      metadata: {
        ticketId: existing.id,
        propertyId: existing.unit.property.id,
        status: ticket.status,
      },
    });
  }

  if (
    body.assignedTo &&
    body.assignedTo !== session.user.id &&
    body.assignedTo !== existing.assignedTo
  ) {
    recipients.set(body.assignedTo, {
      type: "TICKET_UPDATED",
      title: "Ticket assigned to you",
      body: `${existing.title} at ${existing.unit.property.name} now needs your attention.`,
      metadata: {
        ticketId: existing.id,
        propertyId: existing.unit.property.id,
      },
    });
  }

  await Promise.all([
    createNotifications(
      Array.from(recipients.entries()).map(([userId, payload]) => ({
        userId,
        ...payload,
      }))
    ),
    createAuditLog({
      userId: session.user.id,
      action: "TICKET_UPDATED",
      entityType: "MaintenanceTicket",
      entityId: existing.id,
      metadata: {
        propertyId: existing.unit.property.id,
        status: body.status ?? ticket.status,
        assignedTo: body.assignedTo ?? ticket.assignedTo,
        commentAdded: Boolean(body.comment),
        internalComment: Boolean(body.comment && body.isInternal),
      },
    }),
  ]);

  return NextResponse.json(ticket);
}
