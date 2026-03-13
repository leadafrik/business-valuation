import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotification, createNotifications } from "@/lib/notifications";
import { isManagementRole } from "@/lib/access";
import { getAccessibleConversation, uniqueUserIds } from "@/lib/messages";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await getAccessibleConversation(
    session.user.id,
    session.user.role,
    id
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const body = await req.json();
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!messageBody) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.tenantConversationMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
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
    }),
    prisma.tenantConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        lastMessageAt: new Date(),
      },
    }),
  ]);

  if (isManagementRole(session.user.role)) {
    if (conversation.tenant.user.id !== session.user.id) {
      await createNotification({
        userId: conversation.tenant.user.id,
        type: "TENANT_MESSAGE",
        title: conversation.subject,
        body: messageBody,
        metadata: {
          conversationId: conversation.id,
          tenancyId: conversation.tenancy.id,
        },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "TENANT_CONVERSATION_MESSAGE_SENT",
      entityType: "TenantConversation",
      entityId: conversation.id,
      metadata: {
        tenancyId: conversation.tenancy.id,
        propertyId: conversation.tenancy.unit.property.id,
      },
    });
  } else {
    const recipients = uniqueUserIds([
      conversation.tenancy.unit.property.ownerId,
      ...conversation.tenancy.unit.property.admins.map((admin) => admin.userId),
    ]).filter((userId) => userId !== session.user.id);

    await createNotifications(
      recipients.map((userId) => ({
        userId,
        type: "TENANT_MESSAGE",
        title: conversation.subject,
        body: messageBody,
        metadata: {
          conversationId: conversation.id,
          tenancyId: conversation.tenancy.id,
        },
      }))
    );
  }

  return NextResponse.json({ message }, { status: 201 });
}
