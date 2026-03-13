import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { getConversationWhereForUser } from "@/lib/conversations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationWhere = getConversationWhereForUser(
    session.user.id,
    session.user.role
  );
  if (!conversationWhere) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const conversation = await prisma.tenantConversation.findFirst({
    where: {
      id,
      ...conversationWhere,
    },
    select: {
      id: true,
      subject: true,
      tenant: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
      tenancy: {
        select: {
          id: true,
          unit: {
            select: {
              property: {
                select: {
                  id: true,
                  ownerId: true,
                  admins: {
                    select: {
                      userId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

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

  const recipientIds = Array.from(
    new Set(
      [
        conversation.tenant.user.id,
        conversation.tenancy.unit.property.ownerId,
        ...conversation.tenancy.unit.property.admins.map((admin) => admin.userId),
      ].filter((userId): userId is string => Boolean(userId))
    )
  ).filter((userId) => userId !== session.user.id);

  await createNotifications(
    recipientIds.map((userId) => ({
      userId,
      type: "TENANT_MESSAGE",
      title: conversation.subject,
      body:
        messageBody.length > 140
          ? `${messageBody.slice(0, 137)}...`
          : messageBody,
      metadata: {
        conversationId: conversation.id,
        tenancyId: conversation.tenancy.id,
        propertyId: conversation.tenancy.unit.property.id,
      },
    }))
  );

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

  return NextResponse.json({ message }, { status: 201 });
}
