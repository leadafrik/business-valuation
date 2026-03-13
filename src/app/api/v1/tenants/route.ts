import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey, unauthorizedResponse } from "@/lib/apiKeyAuth";

/**
 * GET /api/v1/tenants
 * Returns all active tenancies for properties owned by the API key owner.
 *
 * Query params:
 *   page         (default 1)
 *   limit        (default 20, max 100)
 *   propertyId   (optional filter)
 *   status       (optional: ACTIVE | NOTICE_GIVEN | EXITED)
 */
export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const propertyId = searchParams.get("propertyId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const skip = (page - 1) * limit;

  // Get property IDs owned by this user
  const ownedPropertyIds = await prisma.property
    .findMany({ where: { ownerId: ctx.userId }, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  const where = {
    unit: {
      propertyId: propertyId
        ? { equals: propertyId }
        : { in: ownedPropertyIds },
    },
    ...(status ? { tenant: { status: status as any } } : {}),
  };

  const [tenancies, total] = await Promise.all([
    prisma.tenancy.findMany({
      where,
      include: {
        tenant: {
          include: { user: { select: { name: true, email: true, phone: true } } },
        },
        unit: { select: { unitNumber: true, propertyId: true } },
      },
      skip,
      take: limit,
      orderBy: { startDate: "desc" },
    }),
    prisma.tenancy.count({ where }),
  ]);

  return NextResponse.json({
    data: tenancies.map((t) => ({
      id: t.id,
      tenant: {
        name: t.tenant.user.name,
        email: t.tenant.user.email,
        phone: t.tenant.user.phone,
        status: t.tenant.status,
      },
      unit: t.unit.unitNumber,
      propertyId: t.unit.propertyId,
      rentAmount: t.rentAmount,
      depositAmount: t.deposit,
      startDate: t.startDate,
      endDate: t.endDate,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
