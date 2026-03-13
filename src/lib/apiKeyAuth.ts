import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type ApiKeyContext = {
  userId: string;
  keyId: string;
};

/**
 * Validates the X-API-Key header and returns the owning user context.
 * Returns null if the key is missing, invalid, expired, or revoked.
 */
export async function validateApiKey(
  req: NextRequest
): Promise<ApiKeyContext | null> {
  const rawKey = req.headers.get("x-api-key");
  if (!rawKey || !rawKey.startsWith("rntf_")) return null;

  // Extract prefix (first 13 chars: "rntf_" + 8 chars)
  const prefix = rawKey.substring(0, 13);

  // Find candidate keys matching this prefix
  const candidates = await prisma.apiKey.findMany({
    where: {
      keyPrefix: prefix,
      isActive: true,
    },
  });

  for (const candidate of candidates) {
    const match = await bcrypt.compare(rawKey, candidate.keyHash);
    if (match) {
      // Check expiry
      if (candidate.expiresAt && candidate.expiresAt < new Date()) {
        return null;
      }
      // Update lastUsedAt without blocking response
      prisma.apiKey
        .update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      return { userId: candidate.userId, keyId: candidate.id };
    }
  }

  return null;
}

/**
 * Returns a 401 JSON response for invalid API keys.
 */
export function unauthorizedResponse(message = "Invalid or missing API key") {
  return NextResponse.json({ error: message }, { status: 401 });
}
