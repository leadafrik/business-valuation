import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey, unauthorizedResponse } from "@/lib/apiKeyAuth";

/**
 * POST /api/v1/payments/record
 * Record a payment against an existing payment record (by ID) or by tenancy + month/year.
 *
 * Body (JSON):
 *   paymentId       String  (required if no tenancyId)
 *   tenancyId       String  (required if no paymentId — combined with month + year)
 *   month           Int     (1-12, required with tenancyId)
 *   year            Int     (required with tenancyId)
 *   amountPaid      Float   (required)
 *   transactionId   String  (optional — M-Pesa code or bank ref)
 *   paymentMethod   String  (optional — MPESA | BANK_TRANSFER | CASH)
 *   notes           String  (optional)
 */
export async function POST(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) return unauthorizedResponse();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { paymentId, tenancyId, month, year, amountPaid, transactionId, paymentMethod, notes } = body;

  if (typeof amountPaid !== "number" || amountPaid <= 0) {
    return NextResponse.json({ error: "amountPaid must be a positive number" }, { status: 400 });
  }

  // Resolve the target payment record
  let payment;

  if (paymentId) {
    payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { tenancy: { include: { unit: { include: { property: true } } } } },
    });
  } else if (tenancyId && month && year) {
    payment = await prisma.payment.findUnique({
      where: { tenancyId_month_year: { tenancyId, month: Number(month), year: Number(year) } },
      include: { tenancy: { include: { unit: { include: { property: true } } } } },
    });
  } else {
    return NextResponse.json(
      { error: "Provide either paymentId, or tenancyId + month + year" },
      { status: 400 }
    );
  }

  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  // Verify the payment belongs to a property owned by this API key's user
  const propertyOwnerId = payment.tenancy.unit.property.ownerId;
  if (propertyOwnerId !== ctx.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine new status
  const totalPaid = payment.amountPaid + amountPaid;
  const newStatus =
    totalPaid >= payment.amountDue
      ? "PAID"
      : totalPaid > 0
      ? "PARTIAL"
      : payment.status;

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      amountPaid: totalPaid,
      status: newStatus as any,
      paidDate: newStatus === "PAID" ? new Date() : payment.paidDate,
      transactionId: transactionId ?? payment.transactionId,
      paymentMethod: paymentMethod ?? payment.paymentMethod,
      notes: notes ?? payment.notes,
      verificationMethod: "MANUAL" as any,
      verifiedAt: new Date(),
      verifiedBy: ctx.userId,
    },
  });

  return NextResponse.json({
    id: updated.id,
    amountDue: updated.amountDue,
    amountPaid: updated.amountPaid,
    status: updated.status,
    paidDate: updated.paidDate,
    transactionId: updated.transactionId,
  });
}
