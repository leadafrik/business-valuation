import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getManagedTenancy,
  getManagementPropertyWhere,
  isManagementRole,
} from "@/lib/access";

// GET /api/payments
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  const status = searchParams.get("status");
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : new Date().getMonth() + 1;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

  const userId = session.user.id;
  const role = session.user.role;
  const propertyWhere = getManagementPropertyWhere(userId, role);
  if (!propertyWhere) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
          unit: {
            include: {
              property: { select: { name: true } },
            },
          },
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
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Only managers can record payments." }, { status: 403 });
  }

  const body = await req.json();
  const { tenancyId, amountDue, amountPaid, dueDate, paidDate, paymentMethod, transactionId, month, year, notes } = body;

  if (!tenancyId || !month || !year) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const resolvedMonth = Number(month);
  const resolvedYear = Number(year);
  const tenancy = await getManagedTenancy(
    { id: session.user.id, role: session.user.role },
    tenancyId,
    resolvedMonth,
    resolvedYear
  );
  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  const existingPayment = tenancy.payments[0] ?? null;

  // Check for duplicate transaction ID
  if (transactionId) {
    const dup = await prisma.payment.findFirst({
      where: {
        transactionId,
        ...(existingPayment ? { NOT: { id: existingPayment.id } } : {}),
      },
    });
    if (dup) return NextResponse.json({ error: "A payment with this transaction ID already exists." }, { status: 409 });
  }

  const paid = Number(amountPaid ?? 0);
  const due = Number(amountDue ?? existingPayment?.amountDue ?? tenancy.rentAmount);
  const newStatus = paid >= due ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
  const resolvedDueDate = dueDate
    ? new Date(dueDate)
    : existingPayment?.dueDate ?? new Date(resolvedYear, resolvedMonth - 1, 1);
  const resolvedPaidDate =
    paid > 0
      ? paidDate
        ? new Date(paidDate)
        : existingPayment?.paidDate ?? new Date()
      : null;

  const payment = await prisma.payment.upsert({
    where: { tenancyId_month_year: { tenancyId, month: resolvedMonth, year: resolvedYear } },
    update: {
      amountDue: due,
      amountPaid: paid,
      dueDate: resolvedDueDate,
      paidDate: resolvedPaidDate,
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
      unitId: tenancy.unit.id,
      amountDue: due,
      amountPaid: paid,
      dueDate: resolvedDueDate,
      paidDate: resolvedPaidDate,
      status: newStatus as any,
      paymentMethod: paymentMethod ?? null,
      transactionId: transactionId ?? null,
      verificationMethod: "MANUAL",
      verifiedBy: session.user.id,
      verifiedAt: paid > 0 ? new Date() : null,
      month: resolvedMonth,
      year: resolvedYear,
      notes,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
