import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canManageProperty,
  getManagementPropertyWhere,
  isManagementRole,
} from "@/lib/access";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");

  const userId = session.user.id;
  const role = session.user.role;

  let propertyWhere: Record<string, unknown> = {};
  if (role === "SUPER_ADMIN" || role === "LANDLORD" || role === "PROPERTY_ADMIN") {
    propertyWhere = getManagementPropertyWhere(userId, role) ?? {};
  } else if (role === "TENANT") {
    // Tenant sees announcements for their property
    const tenancy = await prisma.tenancy.findFirst({
      where: { tenant: { userId }, isActive: true },
      include: { unit: { select: { propertyId: true } } },
    });
    if (tenancy) propertyWhere = { id: tenancy.unit.propertyId };
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      property: propertyId ? { id: propertyId, ...propertyWhere } : propertyWhere,
    },
    include: {
      property: { select: { name: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagementRole(session.user.role)) {
    return NextResponse.json({ error: "Only managers can post announcements." }, { status: 403 });
  }

  const body = await req.json();
  const { propertyId, title, body: bodyText, isPinned, sendSms, sendEmail } = body;

  if (!propertyId || !title || !bodyText) {
    return NextResponse.json({ error: "Property, title, and body are required." }, { status: 400 });
  }

  const canAccess = await canManageProperty(
    { id: session.user.id, role: session.user.role },
    propertyId
  );
  if (!canAccess) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      propertyId,
      authorId: session.user.id,
      title,
      body: bodyText,
      isPinned: isPinned ?? false,
      sendSms: sendSms ?? false,
      sendEmail: sendEmail ?? false,
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}
