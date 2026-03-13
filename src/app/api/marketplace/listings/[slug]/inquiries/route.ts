import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getMarketplaceStatus } from "@/lib/marketplace";
import { createNotifications } from "@/lib/notifications";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
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
      createdById: true,
      property: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const session = await auth();
  const body = await req.json();
  const messageBody = typeof body.message === "string" ? body.message.trim() : "";
  const email =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim()
      : session?.user?.email?.trim() || null;
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : session?.user?.phone?.trim() || null;
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : session?.user?.name?.trim() || "Prospective tenant";

  if (!messageBody) {
    return NextResponse.json({ error: "Tell the landlord what you need." }, { status: 400 });
  }

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Add at least one contact method so the landlord can reach you." },
      { status: 400 }
    );
  }

  const tenantProfile =
    session?.user?.id && session.user.role === "TENANT"
      ? await prisma.tenantProfile.findUnique({
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
        })
      : null;

  const inquiry = await prisma.listingInquiry.create({
    data: {
      listingId: listing.id,
      userId: session?.user?.id ?? null,
      tenantProfileId: tenantProfile?.id ?? null,
      name,
      email,
      phone,
      messages: {
        create: {
          senderId: session?.user?.id ?? null,
          senderLabel: name,
          body: messageBody,
        },
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const recipients = Array.from(
    new Set([listing.createdById, listing.property.ownerId].filter(Boolean))
  ).filter((userId) => userId !== session?.user?.id);

  await createNotifications(
    recipients.map((userId) => ({
      userId,
      type: "LISTING_INQUIRY",
      title: `New inquiry on ${listing.title}`,
      body: `${name} asked about this listing.`,
      metadata: {
        inquiryId: inquiry.id,
        listingId: listing.id,
      },
    }))
  );

  return NextResponse.json(
    {
      inquiryId: inquiry.id,
      conversationAvailable: Boolean(session?.user?.id),
    },
    { status: 201 }
  );
}
