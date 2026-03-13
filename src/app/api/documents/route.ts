import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/documents — list documents for current user's properties
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get property IDs this user owns or manages
  const [ownedProps, managedProps] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    }),
    prisma.propertyAdmin.findMany({
      where: { userId: session.user.id },
      select: { propertyId: true },
    }),
  ]);

  const propertyIds = [
    ...ownedProps.map((p) => p.id),
    ...managedProps.map((p) => p.propertyId),
  ];

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { propertyId: { in: propertyIds } },
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
