import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMarketplaceStatus } from "@/lib/marketplace";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const launchStatus = await getMarketplaceStatus();
  if (!launchStatus.enabled) {
    return NextResponse.json(
      {
        error: "The rentals marketplace is not live yet.",
        ...launchStatus,
      },
      { status: 403 }
    );
  }

  const { slug } = await params;
  const listing = await prisma.propertyListing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      description: true,
      monthlyRent: true,
      depositAmount: true,
      bedrooms: true,
      bathrooms: true,
      sqft: true,
      photos: true,
      publishedAt: true,
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
      },
      unit: {
        select: {
          id: true,
          unitNumber: true,
        },
      },
      _count: {
        select: {
          inquiries: true,
        },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...launchStatus,
    listing,
  });
}
