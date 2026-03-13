import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageProperty, isManagementRole } from "@/lib/access";
import { createAuditLog } from "@/lib/audit";
import { generateListingSlug, getManagedPropertyIds } from "@/lib/marketplace";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const propertyIds = await getManagedPropertyIds(session.user.id, session.user.role);
  if (!propertyIds.length) {
    return NextResponse.json({ listings: [] });
  }

  const listings = await prisma.propertyListing.findMany({
    where: {
      propertyId: { in: propertyIds },
    },
    include: {
      property: {
        select: { id: true, name: true, city: true },
      },
      unit: {
        select: { id: true, unitNumber: true, status: true },
      },
      _count: {
        select: { inquiries: true },
      },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    propertyId,
    unitId,
    title,
    summary,
    description,
    monthlyRent,
    depositAmount,
    bedrooms,
    bathrooms,
    sqft,
    photos,
    status,
  } = body;

  if (!propertyId || !title || !summary || !description || monthlyRent === undefined) {
    return NextResponse.json(
      { error: "Property, title, summary, description, and rent are required." },
      { status: 400 }
    );
  }

  const canAccess = await canManageProperty(
    { id: session.user.id, role: session.user.role },
    propertyId
  );
  if (!canAccess) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  let unitData:
    | {
        id: string;
        unitNumber: string;
        bedrooms: number | null;
        bathrooms: number | null;
        sqft: number | null;
        depositAmount: number | null;
      }
    | null = null;

  if (unitId) {
    unitData = await prisma.unit.findFirst({
      where: {
        id: unitId,
        propertyId,
      },
      select: {
        id: true,
        unitNumber: true,
        bedrooms: true,
        bathrooms: true,
        sqft: true,
        depositAmount: true,
      },
    });

    if (!unitData) {
      return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }
  }

  const slug = await generateListingSlug(title);
  const listingStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  const listing = await prisma.propertyListing.create({
    data: {
      propertyId,
      unitId: unitData?.id ?? null,
      createdById: session.user.id,
      title,
      slug,
      summary,
      description,
      monthlyRent: Number(monthlyRent),
      depositAmount:
        depositAmount !== undefined && depositAmount !== null && depositAmount !== ""
          ? Number(depositAmount)
          : unitData?.depositAmount ?? null,
      bedrooms:
        bedrooms !== undefined && bedrooms !== null && bedrooms !== ""
          ? Number(bedrooms)
          : unitData?.bedrooms ?? null,
      bathrooms:
        bathrooms !== undefined && bathrooms !== null && bathrooms !== ""
          ? Number(bathrooms)
          : unitData?.bathrooms ?? null,
      sqft:
        sqft !== undefined && sqft !== null && sqft !== ""
          ? Number(sqft)
          : unitData?.sqft ?? null,
      photos: Array.isArray(photos) ? photos.filter(Boolean) : [],
      status: listingStatus,
      publishedAt: listingStatus === "PUBLISHED" ? new Date() : null,
    },
    include: {
      property: { select: { id: true, name: true, city: true } },
      unit: { select: { id: true, unitNumber: true } },
      _count: { select: { inquiries: true } },
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "LISTING_CREATED",
    entityType: "PropertyListing",
    entityId: listing.id,
    metadata: {
      propertyId,
      unitId: unitData?.id ?? null,
      status: listing.status,
      slug: listing.slug,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}
