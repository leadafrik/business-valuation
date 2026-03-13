import type { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

export function getConversationScope(userId: string, role: Role) {
  if (isManagementRole(role)) {
    const propertyWhere = getManagementPropertyWhere(userId, role);
    if (!propertyWhere) {
      return null;
    }

    return {
      tenancy: {
        unit: {
          property: propertyWhere,
        },
      },
    };
  }

  if (role === "TENANT") {
    return {
      tenant: {
        userId,
      },
    };
  }

  return null;
}

export async function getAccessibleConversation(
  userId: string,
  role: Role,
  conversationId: string
) {
  const scope = getConversationScope(userId, role);
  if (!scope) {
    return null;
  }

  return prisma.tenantConversation.findFirst({
    where: {
      id: conversationId,
      ...scope,
    },
    select: {
      id: true,
      subject: true,
      createdById: true,
      tenant: {
        select: {
          id: true,
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
      },
    },
  });
}

export function uniqueUserIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
