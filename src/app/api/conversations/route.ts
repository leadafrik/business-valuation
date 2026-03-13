import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";
import { getConversationWhereForUser } from "@/lib/conversations";

export async function GET() {
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

  const conversations = await prisma.tenantConversation.findMany({
    where: conversationWhere,
    include: {
      tenant: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      tenancy: {
        select: {
          id: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      messages: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const openingMessage = typeof body.body === "string" ? body.body.trim() : "";

  if (!subject || !openingMessage) {
    return NextResponse.json(
      { error: "Subject and opening message are required." },
      { status: 400 }
    );
  }

  let tenancy:
    | {
        id: string;
        tenantId: string;
        tenant: {
          user: {
            id: string;
            name: string | null;
          };
        };
        unit: {
          unitNumber: string;
          property: {
            id: string;
            name: string;
            ownerId: string;
            admins: Array<{ userId: string }>;
          };
        };
      }
    | null = null;

  if (isManagementRole(session.user.role)) {
    const propertyWhere = getManagementPropertyWhere(session.user.id, session.user.role);
    if (!propertyWhere) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenancyId =
      typeof body.tenancyId === "string" && body.tenancyId.trim()
        ? body.tenancyId.trim()
        : "";

    if (!tenancyId) {
      return NextResponse.json({ error: "Choose a tenant tenancy." }, { status: 400 });
    }

    tenancy = await prisma.tenancy.findFirst({
      where: {
        id: tenancyId,
        isActive: true,
        unit: {
          property: propertyWhere,
        },
      },
      select: {
        id: true,
        tenantId: true,
        tenant: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        unit: {
          select: {
            unitNumber: true,
            property: {
              select: {
                id: true,
                name: true,
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
    });
  } else if (session.user.role === "TENANT") {
    tenancy = await prisma.tenancy.findFirst({
      where: {
        isActive: true,
        tenant: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        tenantId: true,
        tenant: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        unit: {
          select: {
            unitNumber: true,
            property: {
              select: {
                id: true,
                name: true,
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
    });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!tenancy) {
    return NextResponse.json(
      { error: "Active tenancy context was not found for this conversation." },
      { status: 404 }
    );
  }

  const conversation = await prisma.tenantConversation.create({
    data: {
      tenancyId: tenancy.id,
      tenantId: tenancy.tenantId,
      createdById: session.user.id,
      subject,
      lastMessageAt: new Date(),
      messages: {
        create: {
          senderId: session.user.id,
          body: openingMessage,
        },
      },
    },
    include: {
      tenant: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      tenancy: {
        select: {
          unit: {
            select: {
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const recipientIds = Array.from(
    new Set(
      [
        tenancy.tenant.user.id,
        tenancy.unit.property.ownerId,
        ...tenancy.unit.property.admins.map((admin) => admin.userId),
      ].filter((userId): userId is string => Boolean(userId))
    )
  ).filter((userId) => userId !== session.user.id);

  await createNotifications(
    recipientIds.map((userId) => ({
      userId,
      type: "TENANT_MESSAGE",
      title: subject,
      body:
        openingMessage.length > 140
          ? `${openingMessage.slice(0, 137)}...`
          : openingMessage,
      metadata: {
        conversationId: conversation.id,
        tenancyId: tenancy.id,
      },
    }))
  );

  await createAuditLog({
    userId: session.user.id,
    action: "TENANT_CONVERSATION_CREATED",
    entityType: "TenantConversation",
    entityId: conversation.id,
    metadata: {
      tenancyId: tenancy.id,
      tenantId: tenancy.tenantId,
      propertyId: tenancy.unit.property.id,
    },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
