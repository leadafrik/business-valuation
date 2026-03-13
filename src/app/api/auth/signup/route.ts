import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import type { Role } from "@prisma/client";
import {
  getUserContactClauses,
  normalizeEmail,
  normalizePhone,
} from "@/lib/identity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;
    const inviteToken =
      typeof body.inviteToken === "string" && body.inviteToken.trim()
        ? body.inviteToken.trim()
        : null;

    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required." }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone number is required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const contactClauses = getUserContactClauses(email, phone);
    const existingUsers = contactClauses.length
      ? await prisma.user.findMany({
          where: {
            OR: contactClauses,
          },
          select: {
            id: true,
            email: true,
            phone: true,
            password: true,
            role: true,
          },
        })
      : [];

    const uniqueUsers = Array.from(
      new Map(existingUsers.map((user) => [user.id, user])).values()
    );

    if (uniqueUsers.length > 1) {
      return NextResponse.json(
        {
          error:
            "That email and phone belong to different accounts. Use one contact method or sign in.",
        },
        { status: 409 }
      );
    }

    const existingUser = uniqueUsers[0] ?? null;

    const hashedPassword = await bcryptjs.hash(password, 12);

    let assignedRole: Role = "LANDLORD";
    if (role === "PROPERTY_ADMIN") assignedRole = "PROPERTY_ADMIN";
    if (role === "TENANT") assignedRole = "TENANT";

    // Tenant invite token flow
    if (inviteToken) {
      const profile = await prisma.tenantProfile.findUnique({
        where: { inviteToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              password: true,
            },
          },
        },
      });
      if (!profile) return NextResponse.json({ error: "Invalid or expired invite link." }, { status: 400 });
      if (profile.inviteExpiry && profile.inviteExpiry < new Date()) {
        return NextResponse.json({ error: "This invite link has expired." }, { status: 400 });
      }

      if (existingUser && existingUser.id !== profile.user.id) {
        return NextResponse.json(
          { error: "That email or phone is already linked to another account." },
          { status: 409 }
        );
      }

      if (profile.user.password) {
        return NextResponse.json(
          { error: "This tenant account is already active. Sign in instead." },
          { status: 409 }
        );
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: profile.user.id },
          data: {
            name,
            email: email ?? profile.user.email ?? null,
            phone: phone ?? profile.user.phone ?? null,
            password: hashedPassword,
            role: "TENANT",
          },
        }),
        prisma.tenantProfile.update({
          where: { id: profile.id },
          data: {
            inviteToken: null,
            inviteExpiry: null,
            phone: phone ?? profile.phone ?? null,
            status: "ACTIVE",
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    if (existingUser) {
      if (existingUser.role !== "TENANT") {
        return NextResponse.json(
          { error: "An account with that email or phone already exists." },
          { status: 409 }
        );
      }

      if (assignedRole !== "TENANT") {
        return NextResponse.json(
          { error: "That contact is already reserved for a tenant account." },
          { status: 409 }
        );
      }

      if (existingUser.password) {
        return NextResponse.json(
          { error: "An account with that email or phone already exists." },
          { status: 409 }
        );
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            email: email ?? existingUser.email ?? null,
            phone: phone ?? existingUser.phone ?? null,
            password: hashedPassword,
            role: "TENANT",
          },
        }),
        prisma.tenantProfile.upsert({
          where: { userId: existingUser.id },
          update: {
            inviteToken: null,
            inviteExpiry: null,
            ...(phone ? { phone } : {}),
          },
          create: {
            userId: existingUser.id,
            phone,
            status: "PENDING_APPROVAL",
          },
        }),
      ]);

      return NextResponse.json({ success: true, claimedExistingAccount: true });
    }

    // Standard self-signup
    const user = await prisma.user.create({
      data: { name, email: email ?? null, phone: phone ?? null, password: hashedPassword, role: assignedRole },
    });

    if (assignedRole === "TENANT") {
      await prisma.tenantProfile.create({
        data: {
          userId: user.id,
          phone: phone ?? null,
          status: "PENDING_APPROVAL",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
