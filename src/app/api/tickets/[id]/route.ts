import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tickets/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
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
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
  if (body.costEstimate !== undefined) updates.costEstimate = Number(body.costEstimate);
  if (body.status === "RESOLVED") updates.resolvedAt = new Date();

  const ticket = await prisma.maintenanceTicket.update({
    where: { id },
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
