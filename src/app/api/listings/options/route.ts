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

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    select: {
      id: true,
      name: true,
      city: true,
      units: {
        select: {
          id: true,
          unitNumber: true,
          status: true,
          rentAmount: true,
          bedrooms: true,
          bathrooms: true,
          sqft: true,
          depositAmount: true,
        },
        orderBy: {
          unitNumber: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({ properties });
}
