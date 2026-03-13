import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import type { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role, inviteToken } = body;

    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required." }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone number is required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    if (phone) {
      const existing = await prisma.user.findFirst({ where: { phone } });
      if (existing) return NextResponse.json({ error: "An account with that phone already exists." }, { status: 409 });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    let assignedRole: Role = "LANDLORD";
    if (role === "PROPERTY_ADMIN") assignedRole = "PROPERTY_ADMIN";

    // Tenant invite token flow
    if (inviteToken) {
      const profile = await prisma.tenantProfile.findUnique({ where: { inviteToken } });
      if (!profile) return NextResponse.json({ error: "Invalid or expired invite link." }, { status: 400 });
      if (profile.inviteExpiry && profile.inviteExpiry < new Date()) {
        return NextResponse.json({ error: "This invite link has expired." }, { status: 400 });
      }
      const user = await prisma.user.create({
        data: { name, email: email ?? null, phone: phone ?? null, password: hashedPassword, role: "TENANT" },
      });
      await prisma.tenantProfile.update({
        where: { id: profile.id },
        data: { userId: user.id, inviteToken: null, status: "ACTIVE" },
      });
      return NextResponse.json({ success: true });
    }

    // Standard landlord / admin signup
    await prisma.user.create({
      data: { name, email: email ?? null, phone: phone ?? null, password: hashedPassword, role: assignedRole },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

