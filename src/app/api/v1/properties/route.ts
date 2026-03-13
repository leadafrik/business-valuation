import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey, unauthorizedResponse } from "@/lib/apiKeyAuth";

/**
 * GET /api/v1/properties
 * Returns all properties owned by the API key owner.
 *
 * Query params:
 *   page     (default 1)
 *   limit    (default 20, max 100)
 */
export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: ctx.userId },
      include: {
        _count: { select: { units: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where: { ownerId: ctx.userId } }),
  ]);

  return NextResponse.json({
    data: properties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      county: p.county,
      totalUnits: p._count.units,
      createdAt: p.createdAt,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
