import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get tenant profile and active tenancy
  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId },
    include: {
      tenancies: {
        where: { isActive: true },
        include: {
          unit: { include: { property: { select: { name: true, address: true } } } },
          payments: { where: { month, year }, take: 1 },
        },
        take: 1,
      },
    },
  });

  if (!tenantProfile || tenantProfile.tenancies.length === 0) {
    return NextResponse.json({ tenancy: null, openTickets: 0, unreadNotices: 0 });
  }

  const tenancy = tenantProfile.tenancies[0];
  const payment = tenancy.payments[0] ?? null;

  // Open tickets raised by this user
  const openTickets = await prisma.maintenanceTicket.count({
    where: { reportedBy: userId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "AWAITING_PARTS"] } },
  });

  // Unread notifications (proxy for unread notices)
  const unreadNotices = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return NextResponse.json({
    tenancy: {
      id: tenancy.id,
      rentAmount: tenancy.rentAmount,
      startDate: tenancy.startDate.toISOString(),
      endDate: tenancy.endDate?.toISOString(),
      unit: {
        unitNumber: tenancy.unit.unitNumber,
        property: tenancy.unit.property,
      },
      thisMonthPayment: payment
        ? { id: payment.id, status: payment.status, amountPaid: payment.amountPaid, amountDue: payment.amountDue }
        : null,
    },
    openTickets,
    unreadNotices,
  });
}
