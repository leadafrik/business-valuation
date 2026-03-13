import type { Prisma } from "@prisma/client";

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/[\s()-]+/g, "");
  return normalized || null;
}

export function getUserContactClauses(email: string | null, phone: string | null) {
  const clauses: Prisma.UserWhereInput[] = [];

  if (email) {
    clauses.push({ email });
  }

  if (phone) {
    clauses.push({ phone });
  }

  return clauses;
}
