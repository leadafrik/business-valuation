import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = session.user.id;
  const role = session.user.role;
  const propertyWhere = getManagementPropertyWhere(userId, role);
  if (!propertyWhere) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const months: { label: string; month: number; year: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString("en-KE", { month: "short", year: "2-digit" }), month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const props = await prisma.property.findMany({
    where: propertyWhere,
    select: { id: true },
  });
  const propertyIds = props.map((p) => p.id);

  if (propertyIds.length === 0) {
    return NextResponse.json({
      monthly: months.map(({ label }) => ({ month: label, expected: 0, collected: 0 })),
      occupancy: [],
      arrears: months.map(({ label }) => ({ month: label, amount: 0 })),
      delinquent: [],
      leaseExpiries: [],
      documentExpiries: [],
      operations: {
        urgentTickets: 0,
        unresolvedTickets: 0,
        expiringLeases: 0,
        expiringDocuments: 0,
      },
      totals: {
        totalExpected: 0,
        totalCollected: 0,
        rate: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
      },
    });
  }

  // Monthly data
  const monthly = await Promise.all(
    months.map(async ({ label, month, year }) => {
      const payments = await prisma.payment.findMany({
        where: { month, year, tenancy: { unit: { propertyId: { in: propertyIds } } } },
        select: { amountDue: true, amountPaid: true },
      });
      const expected = payments.reduce((s, p) => s + p.amountDue, 0);
      const collected = payments.reduce((s, p) => s + p.amountPaid, 0);
      return { month: label, expected, collected };
    })
  );

  // Occupancy
  const units = await prisma.unit.findMany({
    where: { propertyId: { in: propertyIds } },
    select: { status: true },
  });
  const occ: Record<string, number> = { OCCUPIED: 0, VACANT: 0, UNDER_MAINTENANCE: 0, RESERVED: 0 };
  units.forEach((u) => { occ[u.status] = (occ[u.status] ?? 0) + 1; });
  const occupancy = [
    { name: "Occupied", value: occ.OCCUPIED, color: "#16a34a" },
    { name: "Vacant", value: occ.VACANT, color: "#f59e0b" },
    { name: "Maintenance", value: occ.UNDER_MAINTENANCE, color: "#ef4444" },
    { name: "Reserved", value: occ.RESERVED, color: "#3b82f6" },
  ].filter((o) => o.value > 0);

  // Arrears trend
  const arrears = await Promise.all(
    months.map(async ({ label, month, year }) => {
      const payments = await prisma.payment.findMany({
        where: { month, year, tenancy: { unit: { propertyId: { in: propertyIds } } }, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } },
        select: { amountDue: true, amountPaid: true },
      });
      const amount = payments.reduce((s, p) => s + Math.max(0, p.amountDue - p.amountPaid), 0);
      return { month: label, amount };
    })
  );

  // Top delinquent tenants
  const delinquentPayments = await prisma.payment.groupBy({
    by: ["tenancyId"],
    where: {
      status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
      tenancy: { unit: { propertyId: { in: propertyIds } } },
    },
    _sum: { amountDue: true, amountPaid: true },
    orderBy: { _sum: { amountDue: "desc" } },
    take: 10,
  });

  const tenancyDetails = await prisma.tenancy.findMany({
    where: { id: { in: delinquentPayments.map((d) => d.tenancyId) } },
    include: { tenant: { include: { user: { select: { name: true } } } }, unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
  });

  const delinquent = delinquentPayments
    .map((dp) => {
      const t = tenancyDetails.find((td) => td.id === dp.tenancyId);
      if (!t) return null;
      const balance = Math.max(0, (dp._sum.amountDue ?? 0) - (dp._sum.amountPaid ?? 0));
      return { tenant: t.tenant.user.name, unit: t.unit.unitNumber, property: t.unit.property.name, balance };
    })
    .filter(Boolean)
    .sort((a, b) => b!.balance - a!.balance)
    .slice(0, 8);

  const openTicketStatuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "AWAITING_PARTS", "ESCALATED"] as const;
  const [urgentTickets, unresolvedTickets, leaseExpiriesRaw, documentExpiriesRaw] =
    await Promise.all([
      prisma.maintenanceTicket.count({
        where: {
          unit: { propertyId: { in: propertyIds } },
          status: { in: openTicketStatuses as unknown as any[] },
          priority: { in: ["HIGH", "URGENT"] },
        },
      }),
      prisma.maintenanceTicket.count({
        where: {
          unit: { propertyId: { in: propertyIds } },
          status: { in: openTicketStatuses as unknown as any[] },
        },
      }),
      prisma.tenancy.findMany({
        where: {
          isActive: true,
          endDate: {
            not: null,
            gte: now,
            lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
          unit: {
            propertyId: { in: propertyIds },
          },
        },
        include: {
          tenant: { include: { user: { select: { name: true } } } },
          unit: { select: { unitNumber: true, property: { select: { name: true } } } },
        },
        orderBy: { endDate: "asc" },
        take: 8,
      }),
      prisma.document.findMany({
        where: {
          expiresAt: {
            not: null,
            gte: now,
            lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          },
          OR: [
            { propertyId: { in: propertyIds } },
            {
              tenant: {
                tenancies: {
                  some: {
                    isActive: true,
                    unit: { propertyId: { in: propertyIds } },
                  },
                },
              },
            },
          ],
        },
        include: {
          property: { select: { name: true } },
          tenant: { include: { user: { select: { name: true } } } },
        },
        orderBy: { expiresAt: "asc" },
        take: 8,
      }),
    ]);

  const msPerDay = 24 * 60 * 60 * 1000;
  const leaseExpiries = leaseExpiriesRaw.map((tenancy) => ({
    tenant: tenancy.tenant.user.name ?? "Tenant",
    unit: tenancy.unit.unitNumber,
    property: tenancy.unit.property.name,
    endDate: tenancy.endDate!.toISOString(),
    daysLeft: Math.max(
      0,
      Math.ceil((tenancy.endDate!.getTime() - now.getTime()) / msPerDay)
    ),
  }));

  const documentExpiries = documentExpiriesRaw.map((document) => ({
    id: document.id,
    name: document.name,
    type: document.type ?? "other",
    property: document.property?.name ?? null,
    tenant: document.tenant?.user.name ?? null,
    expiresAt: document.expiresAt!.toISOString(),
    daysLeft: Math.max(
      0,
      Math.ceil((document.expiresAt!.getTime() - now.getTime()) / msPerDay)
    ),
  }));

  // Totals
  const allPayments = await prisma.payment.aggregate({
    where: { tenancy: { unit: { propertyId: { in: propertyIds } } } },
    _sum: { amountDue: true, amountPaid: true },
  });
  const totalExpected = allPayments._sum.amountDue ?? 0;
  const totalCollected = allPayments._sum.amountPaid ?? 0;
  const rate = totalExpected ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return NextResponse.json({
    monthly,
    occupancy,
    arrears,
    delinquent,
    leaseExpiries,
    documentExpiries,
    operations: {
      urgentTickets,
      unresolvedTickets,
      expiringLeases: leaseExpiries.length,
      expiringDocuments: documentExpiries.length,
    },
    totals: {
      totalExpected,
      totalCollected,
      rate,
      occupiedUnits: occ.OCCUPIED,
      vacantUnits: occ.VACANT,
    },
  });
}
