import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey, unauthorizedResponse } from "@/lib/apiKeyAuth";

/**
 * GET /api/v1/units
 * Returns all units across properties owned by the API key owner.
 *
 * Query params:
 *   page        (default 1)
 *   limit       (default 20, max 100)
 *   propertyId  (optional filter)
 *   status      (optional: OCCUPIED | VACANT | RESERVED | UNDER_MAINTENANCE)
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

  const ownedPropertyIds = await prisma.property
    .findMany({ where: { ownerId: ctx.userId }, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  const where: any = {
    propertyId: propertyId ? { equals: propertyId } : { in: ownedPropertyIds },
    ...(status ? { status } : {}),
  };

  const [units, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      include: {
        property: { select: { name: true, address: true } },
        currentTenancy: {
          include: {
            tenant: {
              include: { user: { select: { name: true, phone: true } } },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: [{ propertyId: "asc" }, { unitNumber: "asc" }],
    }),
    prisma.unit.count({ where }),
  ]);

  return NextResponse.json({
    data: units.map((u) => ({
      id: u.id,
      propertyId: u.propertyId,
      propertyName: u.property.name,
      propertyAddress: u.property.address,
      unitNumber: u.unitNumber,
      floor: u.floor,
      block: u.block,
      type: u.type,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      sqft: u.sqft,
      rentAmount: u.rentAmount,
      depositAmount: u.depositAmount,
      status: u.status,
      currentTenant: u.currentTenancy
        ? {
            name: u.currentTenancy.tenant.user.name,
            phone: u.currentTenancy.tenant.user.phone,
            rentAmount: u.currentTenancy.rentAmount,
            startDate: u.currentTenancy.startDate,
          }
        : null,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
