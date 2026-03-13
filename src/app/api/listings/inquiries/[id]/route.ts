import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";
import { createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_STATUSES = new Set(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]);

export async function PATCH(req: NextRequest, { params }: RouteContext) {
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

  const { id } = await params;
  const inquiry = await prisma.listingInquiry.findFirst({
    where: {
      id,
      listing: {
        property: propertyWhere,
      },
    },
    select: {
      id: true,
      status: true,
      userId: true,
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  }

  const body = await req.json();
  const nextStatus = typeof body.status === "string" ? body.status : "";

  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid inquiry status." }, { status: 400 });
  }

  const updatedInquiry = await prisma.listingInquiry.update({
    where: { id: inquiry.id },
    data: { status: nextStatus },
  });

  if (inquiry.userId && inquiry.userId !== session.user.id && inquiry.status !== nextStatus) {
    await createNotification({
      userId: inquiry.userId,
      type: "LISTING_INQUIRY",
      title: "Inquiry updated",
      body: `${inquiry.listing.title} is now marked ${nextStatus.toLowerCase()}.`,
      metadata: {
        inquiryId: inquiry.id,
        listingId: inquiry.listing.id,
        status: nextStatus,
      },
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "LISTING_INQUIRY_STATUS_UPDATED",
    entityType: "ListingInquiry",
    entityId: inquiry.id,
    metadata: {
      listingId: inquiry.listing.id,
      previousStatus: inquiry.status,
      nextStatus,
    },
  });

  return NextResponse.json({ inquiry: updatedInquiry });
}
