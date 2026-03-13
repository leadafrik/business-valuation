import type { Prisma, Role } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

export function isManagementRole(role: Role) {
  return role === "SUPER_ADMIN" || role === "LANDLORD" || role === "PROPERTY_ADMIN";
}

export function getManagementPropertyWhere(
  userId: string,
  role: Role
): Prisma.PropertyWhereInput | null {
  if (role === "SUPER_ADMIN") return {};
  if (role === "LANDLORD") return { ownerId: userId };
  if (role === "PROPERTY_ADMIN") {
    return { admins: { some: { userId } } };
  }

  return null;
}

export async function canManageProperty(
  user: AuthenticatedUser,
  propertyId: string
) {
  const scope = getManagementPropertyWhere(user.id, user.role);
  if (!scope) return false;

  const count = await prisma.property.count({
    where: {
      id: propertyId,
      ...scope,
    },
  });

  return count > 0;
}

export async function getAccessibleUnit(
  user: AuthenticatedUser,
  unitId: string
) {
  if (isManagementRole(user.role)) {
    const scope = getManagementPropertyWhere(user.id, user.role);
    if (!scope) return null;

    return prisma.unit.findFirst({
      where: {
        id: unitId,
        property: scope,
      },
      select: {
        id: true,
        propertyId: true,
        unitNumber: true,
        rentAmount: true,
        status: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        currentTenancy: {
          select: {
            id: true,
            tenantId: true,
            isActive: true,
          },
        },
      },
    });
  }

  if (user.role === "TENANT") {
    return prisma.unit.findFirst({
      where: {
        id: unitId,
        currentTenancy: {
          is: {
            isActive: true,
            tenant: {
              userId: user.id,
            },
          },
        },
      },
      select: {
        id: true,
        propertyId: true,
        unitNumber: true,
        rentAmount: true,
        status: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        currentTenancy: {
          select: {
            id: true,
            tenantId: true,
            isActive: true,
          },
        },
      },
    });
  }

  return null;
}

export async function getManagedTenancy(
  user: AuthenticatedUser,
  tenancyId: string,
  month?: number,
  year?: number
) {
  const scope = getManagementPropertyWhere(user.id, user.role);
  if (!scope) return null;

  return prisma.tenancy.findFirst({
    where: {
      id: tenancyId,
      unit: {
        property: scope,
      },
    },
    include: {
      unit: {
        select: {
          id: true,
          propertyId: true,
          rentAmount: true,
        },
      },
      payments:
        month && year
          ? {
              where: {
                month,
                year,
              },
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
            }
          : false,
    },
  });
}
