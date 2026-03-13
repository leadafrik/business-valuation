import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseMpesaText, matchReceiptToPayment } from "@/lib/mpesaParser";
import prisma from "@/lib/prisma";

/**
 * POST /api/payments/parse-receipt
 * Body: { rawText: string, paymentId?: string }
 * 
 * Parses an M-Pesa SMS text and optionally matches it against a payment record.
 * Returns parsed data + match result.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rawText, paymentId } = await req.json();
  if (!rawText || typeof rawText !== "string") {
    return NextResponse.json({ error: "rawText is required." }, { status: 400 });
  }

  const parsed = parseMpesaText(rawText);

  if (!paymentId) {
    return NextResponse.json({ parsed });
  }

  // If paymentId given, match against that payment
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      tenancy: {
        include: {
          tenant: { include: { user: { select: { name: true } } } },
        },
      },
      unit: true,
    },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  // Get all existing transaction IDs to check for duplicates
  const existing = await prisma.payment.findMany({
    where: { transactionId: { not: null } },
    select: { transactionId: true },
  });

  const match = matchReceiptToPayment(parsed, {
    tenantName: payment.tenancy.tenant.user?.name ?? "",
    amountDue: payment.amountDue,
    month: payment.month,
    year: payment.year,
    existingTransactionIds: existing.map((p) => p.transactionId!).filter(Boolean),
  });

  // If auto-approve, update the payment automatically
  if (match.autoApprove && parsed.transactionId && parsed.amount) {
    const paid = parsed.amount;
    const status = paid >= payment.amountDue ? "PAID" : "PARTIAL";

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amountPaid: paid,
        paidDate: new Date(),
        transactionId: parsed.transactionId,
        status: status as any,
        verificationMethod: "AUTO_MATCHED",
        verifiedAt: new Date(),
        verifiedBy: session.user.id,
      },
    });

    // Save receipt record
    await prisma.paymentReceipt.upsert({
      where: { paymentId },
      update: {
        rawOcrText: rawText,
        parsedData: parsed as any,
        confidence: match.confidence,
        flaggedReason: match.flags.length > 0 ? match.flags.join(", ") : null,
      },
      create: {
        paymentId,
        rawOcrText: rawText,
        parsedData: parsed as any,
        confidence: match.confidence,
        flaggedReason: match.flags.length > 0 ? match.flags.join(", ") : null,
      },
    });
  }

  return NextResponse.json({ parsed, match });
}
