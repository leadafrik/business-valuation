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

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@")) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  if (/^2540[17]\d{8}$/.test(digits)) {
    return `+254${digits.slice(4)}`;
  }

  if (/^254[17]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^0[17]\d{8}$/.test(digits)) {
    return `+254${digits.slice(1)}`;
  }

  if (/^[17]\d{8}$/.test(digits)) {
    return `+254${digits}`;
  }

  return null;
}

export function isPhoneLike(value: unknown) {
  return normalizePhone(value) !== null;
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
