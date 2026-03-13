import type { Prisma, Role } from "@prisma/client";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

export function getConversationWhereForUser(
  userId: string,
  role: Role
): Prisma.TenantConversationWhereInput | null {
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
