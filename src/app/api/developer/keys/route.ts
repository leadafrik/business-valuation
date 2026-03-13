import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// GET /api/developer/keys — list all keys for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

// POST /api/developer/keys — create a new key
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, expiresInDays } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 });
  }

  // Enforce max 10 active keys per user
  const activeCount = await prisma.apiKey.count({
    where: { userId: session.user.id, isActive: true },
  });
  if (activeCount >= 10) {
    return NextResponse.json(
      { error: "Maximum of 10 active API keys allowed" },
      { status: 400 }
    );
  }

  // Generate the raw key: rntf_ + 32 random hex chars = rntf_<32>
  const randomPart = crypto.randomBytes(16).toString("hex"); // 32 chars
  const rawKey = `rntf_${randomPart}`;
  const keyPrefix = rawKey.substring(0, 13); // "rntf_" + first 8 hex chars

  // Hash the full key
  const keyHash = await bcrypt.hash(rawKey, 10);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      keyPrefix,
      keyHash,
      expiresAt,
    },
  });

  // Return the raw key ONCE — it won't be shown again
  return NextResponse.json({
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    rawKey, // only returned on creation
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  });
}
