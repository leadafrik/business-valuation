import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";

// DELETE /api/documents/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const managementScope =
    isManagementRole(session.user.role)
      ? getManagementPropertyWhere(session.user.id, session.user.role)
      : null;

  const doc = await prisma.document.findFirst({
    where: {
      id: params.id,
      OR: [
        { uploadedBy: session.user.id },
        ...(managementScope ? [{ property: managementScope }] : []),
      ],
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.document.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
