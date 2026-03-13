import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey, unauthorizedResponse } from "@/lib/apiKeyAuth";

/**
 * GET /api/v1/payments
 * Returns payment records for properties owned by the API key owner.
 *
 * Query params:
 *   page         (default 1)
 *   limit        (default 20, max 100)
 *   propertyId   (optional filter)
 *   status       (optional: PENDING | PAID | PARTIAL | LATE | WAIVED)
 *   from         (optional ISO date, e.g. 2026-01-01)
 *   to           (optional ISO date)
 */
export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const propertyId = searchParams.get("propertyId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const skip = (page - 1) * limit;

  const ownedPropertyIds = await prisma.property
    .findMany({ where: { ownerId: ctx.userId }, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  const where: any = {
    tenancy: {
      unit: {
        propertyId: propertyId ? { equals: propertyId } : { in: ownedPropertyIds },
      },
    },
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          dueDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        tenancy: {
          include: {
            tenant: {
              include: { user: { select: { name: true, phone: true } } },
            },
            unit: { select: { unitNumber: true, propertyId: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { dueDate: "desc" },
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({
    data: payments.map((p) => ({
      id: p.id,
      tenant: {
        name: p.tenancy.tenant.user.name,
        phone: p.tenancy.tenant.user.phone,
      },
      unit: p.tenancy.unit.unitNumber,
      propertyId: p.tenancy.unit.propertyId,
      amountDue: p.amountDue,
      amountPaid: p.amountPaid,
      status: p.status,
      dueDate: p.dueDate,
      paidDate: p.paidDate,
      transactionId: p.transactionId,
      paymentMethod: p.paymentMethod,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
