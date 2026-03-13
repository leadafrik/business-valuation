import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const propertyWhere = getManagementPropertyWhere(session.user.id, session.user.role);
  if (!propertyWhere) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenancies = await prisma.tenancy.findMany({
    where: {
      isActive: true,
      unit: {
        property: propertyWhere,
      },
    },
    select: {
      id: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      unit: {
        select: {
          id: true,
          unitNumber: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ tenancies });
}
