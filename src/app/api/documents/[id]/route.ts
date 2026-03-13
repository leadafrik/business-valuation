import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getManagementPropertyWhere, isManagementRole } from "@/lib/access";
import { createAuditLog } from "@/lib/audit";
import { deleteStoredDocument } from "@/lib/documentStorage";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/documents/[id]
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const managementScope =
    isManagementRole(session.user.role)
      ? getManagementPropertyWhere(session.user.id, session.user.role)
      : null;

  const doc = await prisma.document.findFirst({
    where: {
      id,
      OR: [
        { uploadedBy: session.user.id },
        ...(managementScope ? [{ property: managementScope }] : []),
      ],
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.document.delete({ where: { id } });
  await deleteStoredDocument(doc.url);
  await createAuditLog({
    userId: session.user.id,
    action: "DOCUMENT_DELETED",
    entityType: "Document",
    entityId: doc.id,
    metadata: {
      name: doc.name,
      propertyId: doc.propertyId,
      tenantId: doc.tenantId,
      type: doc.type,
    },
  });

  return NextResponse.json({ success: true });
}
