import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";
import type { Role } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

async function getAccessibleInquiry(id: string, userId: string, role: Role) {
  if (role === "SUPER_ADMIN" || role === "LANDLORD" || role === "PROPERTY_ADMIN") {
    const propertyWhere = getManagementPropertyWhere(userId, role);
    if (!propertyWhere) {
      return null;
    }

    return prisma.listingInquiry.findFirst({
      where: {
        id,
        listing: {
          property: propertyWhere,
        },
      },
      select: {
        id: true,
        userId: true,
        listing: {
          select: {
            id: true,
            title: true,
            createdById: true,
          },
        },
      },
    });
  }

  return prisma.listingInquiry.findFirst({
    where: {
      id,
      OR: [
        { userId },
        {
          tenantProfile: {
            is: {
              userId,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      userId: true,
      listing: {
        select: {
          id: true,
          title: true,
          createdById: true,
        },
      },
    },
  });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const inquiry = await getAccessibleInquiry(id, session.user.id, session.user.role);

  if (!inquiry) {
    return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  }

  const body = await req.json();
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!messageBody) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  const senderIsManagement = isManagementRole(session.user.role);
  const senderLabel =
    session.user.name?.trim() ||
    (senderIsManagement ? "RentiFlow team" : "Prospective tenant");

  const message = await prisma.inquiryMessage.create({
    data: {
      inquiryId: inquiry.id,
      senderId: session.user.id,
      senderLabel,
      body: messageBody,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  const notificationRecipient = senderIsManagement
    ? inquiry.userId
    : inquiry.listing.createdById;

  if (notificationRecipient && notificationRecipient !== session.user.id) {
    await createNotification({
      userId: notificationRecipient,
      type: "LISTING_MESSAGE",
      title: senderIsManagement
        ? `Reply on ${inquiry.listing.title}`
        : `New message on ${inquiry.listing.title}`,
      body:
        messageBody.length > 140
          ? `${messageBody.slice(0, 137)}...`
          : messageBody,
      metadata: {
        inquiryId: inquiry.id,
        listingId: inquiry.listing.id,
      },
    });
  }

  if (senderIsManagement) {
    await createAuditLog({
      userId: session.user.id,
      action: "LISTING_INQUIRY_MESSAGE_SENT",
      entityType: "ListingInquiry",
      entityId: inquiry.id,
      metadata: {
        listingId: inquiry.listing.id,
      },
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}
