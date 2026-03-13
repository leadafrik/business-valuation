import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMarketplaceStatus } from "@/lib/marketplace";

export async function GET() {
  const launchStatus = await getMarketplaceStatus();

  if (!launchStatus.enabled) {
    return NextResponse.json({
      ...launchStatus,
      listings: [],
    });
  }

  const listings = await prisma.propertyListing.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      monthlyRent: true,
      depositAmount: true,
      bedrooms: true,
      bathrooms: true,
      sqft: true,
      photos: true,
      publishedAt: true,
      property: {
        select: {
          name: true,
          city: true,
        },
      },
      unit: {
        select: {
          unitNumber: true,
        },
      },
    },
    orderBy: [
      {
        publishedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 48,
  });

  return NextResponse.json({
    ...launchStatus,
    listings,
  });
}
