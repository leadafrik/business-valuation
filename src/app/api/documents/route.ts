import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canManageProperty,
  getManagementPropertyWhere,
  isManagementRole,
} from "@/lib/access";

// GET /api/documents — list documents for current user's properties
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const propertyWhere = getManagementPropertyWhere(
    session.user.id,
    session.user.role
  );
  if (!propertyWhere) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { property: propertyWhere },
        { uploadedBy: session.user.id },
      ],
    },
    include: {
      property: { select: { name: true } },
      tenant: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

// POST /api/documents — upload a document (metadata only — configure Vercel Blob for file storage)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Only managers can upload documents here." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || file?.name || "Untitled";
    const type = (formData.get("type") as string) || "other";
    const propertyId = (formData.get("propertyId") as string) || null;
    const tenantId = (formData.get("tenantId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (propertyId) {
      const canAccess = await canManageProperty(
        { id: session.user.id, role: session.user.role },
        propertyId
      );
      if (!canAccess) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
    }

    if (tenantId) {
      const propertyWhere = getManagementPropertyWhere(
        session.user.id,
        session.user.role
      );
      if (!propertyWhere) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const tenant = await prisma.tenantProfile.findFirst({
        where: {
          id: tenantId,
          tenancies: {
            some: {
              isActive: true,
              unit: {
                property: propertyWhere,
              },
            },
          },
        },
        select: { id: true },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }
    }

    // ─── File storage ──────────────────────────────────────────────────────────
    // For production, replace this with Vercel Blob:
    //   import { put } from "@vercel/blob";
    //   const blob = await put(file.name, file, { access: "public" });
    //   const url = blob.url;
    //
    // For now we store a placeholder URL — install Vercel Blob with:
    //   npm install @vercel/blob
    //   and add BLOB_READ_WRITE_TOKEN to .env
    // ──────────────────────────────────────────────────────────────────────────
    const url = `/uploads/${Date.now()}-${file.name}`;

    const document = await prisma.document.create({
      data: {
        name,
        url,
        type,
        propertyId: propertyId || null,
        tenantId: tenantId || null,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json({ document });
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
