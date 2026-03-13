import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role;
  const now = new Date();

  // Properties accessible by this user
  const propertyFilter =
    role === "SUPER_ADMIN"
      ? {}
      : role === "LANDLORD"
      ? { ownerId: userId }
      : {
          admins: { some: { userId } },
        };

  const [properties, openTickets] = await Promise.all([
    prisma.property.findMany({
      where: propertyFilter,
      include: {
        units: {
          include: {
            currentTenancy: {
              include: {
                payments: {
                  where: {
                    month: now.getMonth() + 1,
                    year: now.getFullYear(),
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.maintenanceTicket.count({
      where: {
        unit: {
          property: propertyFilter,
        },
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "ESCALATED"] },
      },
    }),
  ]);

  let totalUnits = 0;
  let occupiedUnits = 0;
  let vacantUnits = 0;
  let totalExpectedRent = 0;
  let totalCollectedRent = 0;
  let paidTenants = 0;
  let unpaidTenants = 0;
  let overduePayments = 0;

  for (const property of properties) {
    for (const unit of property.units) {
      totalUnits++;
      if (unit.status === "OCCUPIED") occupiedUnits++;
      else vacantUnits++;

      const tenancy = unit.currentTenancy;
      if (tenancy) {
        totalExpectedRent += tenancy.rentAmount;
        const payment = tenancy.payments[0];
        if (payment) {
          totalCollectedRent += payment.amountPaid;
          if (payment.status === "PAID") paidTenants++;
          else if (payment.status === "OVERDUE") overduePayments++;
          else unpaidTenants++;
        } else {
          unpaidTenants++;
        }
      }
    }
  }

  const totalOutstanding = totalExpectedRent - totalCollectedRent;
  const collectionRate =
    totalExpectedRent > 0
      ? Math.round((totalCollectedRent / totalExpectedRent) * 100)
      : 0;

  return NextResponse.json({
    totalProperties: properties.length,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    totalExpectedRent,
    totalCollectedRent,
    totalOutstanding,
    collectionRate,
    paidTenants,
    unpaidTenants,
    openTickets,
    overduePayments,
  });
}
