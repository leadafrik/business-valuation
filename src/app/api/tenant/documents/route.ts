import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tenant/documents — documents for the logged-in tenant
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find this tenant's profile
  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!tenantProfile) {
    return NextResponse.json({ documents: [] });
  }

  // Get their active tenancy to find propertyId
  const tenancy = await prisma.tenancy.findFirst({
    where: { tenantId: tenantProfile.id, isActive: true },
    include: { unit: { select: { propertyId: true } } },
  });

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { tenantId: tenantProfile.id },
        ...(tenancy ? [{ propertyId: tenancy.unit.propertyId }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}
