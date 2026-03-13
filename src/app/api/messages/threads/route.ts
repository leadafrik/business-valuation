import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotification, createNotifications } from "@/lib/notifications";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";
import { getConversationScope, uniqueUserIds } from "@/lib/messages";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = getConversationScope(session.user.id, session.user.role);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversations = await prisma.tenantConversation.findMany({
    where: scope,
    include: {
      tenant: {
        include: {
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
          isActive: true,
          unit: {
            select: {
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
      },
      messages: {
        include: {
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
  const subject =
    typeof body.subject === "string" && body.subject.trim()
      ? body.subject.trim()
      : "Tenant conversation";
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!messageBody) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  let tenancy:
    | {
        id: string;
        tenantId: string;
        tenant: { userId: string };
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
    if (!body.tenancyId) {
      return NextResponse.json({ error: "Select the tenancy to message." }, { status: 400 });
    }

    const propertyWhere = getManagementPropertyWhere(session.user.id, session.user.role);
    if (!propertyWhere) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    tenancy = await prisma.tenancy.findFirst({
      where: {
        id: body.tenancyId,
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
            userId: true,
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
        id: body.tenancyId ?? undefined,
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
            userId: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
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
          body: messageBody,
        },
      },
    },
    include: {
      tenant: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      tenancy: {
        select: {
          id: true,
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
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (isManagementRole(session.user.role)) {
    await Promise.all([
      createNotification({
        userId: tenancy.tenant.userId,
        type: "TENANT_MESSAGE",
        title: subject,
        body: messageBody,
        metadata: {
          conversationId: conversation.id,
          tenancyId: tenancy.id,
        },
      }),
      createAuditLog({
        userId: session.user.id,
        action: "TENANT_CONVERSATION_CREATED",
        entityType: "TenantConversation",
        entityId: conversation.id,
        metadata: {
          tenancyId: tenancy.id,
          propertyId: tenancy.unit.property.id,
        },
      }),
    ]);
  } else {
    const recipients = uniqueUserIds([
      tenancy.unit.property.ownerId,
      ...tenancy.unit.property.admins.map((admin) => admin.userId),
    ]).filter((userId) => userId !== session.user.id);

    await createNotifications(
      recipients.map((userId) => ({
        userId,
        type: "TENANT_MESSAGE",
        title: subject,
        body: messageBody,
        metadata: {
          conversationId: conversation.id,
          tenancyId: tenancy.id,
        },
      }))
    );
  }

  return NextResponse.json({ conversation }, { status: 201 });
}
