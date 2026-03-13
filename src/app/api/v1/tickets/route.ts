import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey, unauthorizedResponse } from "@/lib/apiKeyAuth";

/**
 * GET /api/v1/tickets
 * Returns maintenance tickets for properties owned by the API key owner.
 *
 * Query params:
 *   page        (default 1)
 *   limit       (default 20, max 100)
 *   propertyId  (optional filter)
 *   status      (optional: OPEN | IN_PROGRESS | RESOLVED | CLOSED | ESCALATED)
 *   priority    (optional: LOW | MEDIUM | HIGH | URGENT)
 *   category    (optional: PLUMBING | ELECTRICAL | STRUCTURAL | etc.)
 */
export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const propertyId = searchParams.get("propertyId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const skip = (page - 1) * limit;

  const ownedPropertyIds = await prisma.property
    .findMany({ where: { ownerId: ctx.userId }, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  const where: any = {
    unit: {
      propertyId: propertyId ? { equals: propertyId } : { in: ownedPropertyIds },
    },
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(category ? { category } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where,
      include: {
        unit: {
          select: {
            unitNumber: true,
            propertyId: true,
            property: { select: { name: true } },
          },
        },
        _count: { select: { comments: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);

  return NextResponse.json({
    data: tickets.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      unitNumber: t.unit.unitNumber,
      propertyId: t.unit.propertyId,
      propertyName: t.unit.property.name,
      reportedBy: t.reportedBy,
      assignedTo: t.assignedTo,
      costEstimate: t.costEstimate,
      commentCount: t._count.comments,
      resolvedAt: t.resolvedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
