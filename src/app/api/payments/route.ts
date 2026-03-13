import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/payments
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  const status = searchParams.get("status");
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : new Date().getMonth() + 1;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

  const userId = session.user.id;
  const role = session.user.role;
  const propertyWhere = role === "SUPER_ADMIN" ? {} : role === "LANDLORD" ? { ownerId: userId } : { admins: { some: { userId } } };

  const payments = await prisma.payment.findMany({
    where: {
      month,
      year,
      ...(status ? { status: status as any } : {}),
      unit: {
        property: propertyId ? { id: propertyId, ...propertyWhere } : propertyWhere,
      },
    },
    include: {
      tenancy: {
        include: {
          tenant: { include: { user: { select: { name: true, email: true, phone: true } } } },
        },
      },
      unit: {
        include: {
          property: { select: { name: true } },
        },
      },
      receipt: true,
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(payments);
}

// POST /api/payments – manually record a payment (admin/landlord)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tenancyId, unitId, amountDue, amountPaid, dueDate, paidDate, paymentMethod, transactionId, month, year, notes } = body;

  if (!tenancyId || !unitId || !amountDue || !month || !year) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Check for duplicate transaction ID
  if (transactionId) {
    const dup = await prisma.payment.findFirst({ where: { transactionId } });
    if (dup) return NextResponse.json({ error: "A payment with this transaction ID already exists." }, { status: 409 });
  }

  const paid = Number(amountPaid ?? 0);
  const due = Number(amountDue);
  const newStatus = paid >= due ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

  const payment = await prisma.payment.upsert({
    where: { tenancyId_month_year: { tenancyId, month, year } },
    update: {
      amountPaid: paid,
      paidDate: paidDate ? new Date(paidDate) : new Date(),
      paymentMethod: paymentMethod ?? null,
      transactionId: transactionId ?? null,
      status: newStatus as any,
      verificationMethod: "MANUAL",
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      notes,
    },
    create: {
      tenancyId,
      unitId,
      amountDue: due,
      amountPaid: paid,
      dueDate: new Date(dueDate),
      paidDate: paid > 0 ? (paidDate ? new Date(paidDate) : new Date()) : null,
      status: newStatus as any,
      paymentMethod: paymentMethod ?? null,
      transactionId: transactionId ?? null,
      verificationMethod: "MANUAL",
      verifiedBy: session.user.id,
      verifiedAt: paid > 0 ? new Date() : null,
      month,
      year,
      notes,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
