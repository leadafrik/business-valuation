import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/developer/keys/[id] — revoke a key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = await prisma.apiKey.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  await prisma.apiKey.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
