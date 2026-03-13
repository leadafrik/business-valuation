import prisma from "@/lib/prisma";
import { getManagementPropertyWhere } from "@/lib/access";
import type { Role } from "@prisma/client";

export const MARKETPLACE_USER_THRESHOLD = 10000;

export async function getMarketplaceStatus() {
  const userCount = await prisma.user.count();

  return {
    enabled: userCount >= MARKETPLACE_USER_THRESHOLD,
    userCount,
    threshold: MARKETPLACE_USER_THRESHOLD,
  };
}

export function slugifyListingTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateListingSlug(title: string) {
  const base = slugifyListingTitle(title) || "listing";
  let slug = base;
  let index = 1;

  while (await prisma.propertyListing.findUnique({ where: { slug } })) {
    index += 1;
    slug = `${base}-${index}`;
  }

  return slug;
}

export async function getManagedPropertyIds(userId: string, role: Role) {
  const propertyWhere = getManagementPropertyWhere(userId, role);
  if (!propertyWhere) {
    return [];
  }

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    select: { id: true },
  });

  return properties.map((property) => property.id);
}
