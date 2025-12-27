import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password, name } = await req.json();

    if (!email || !otp || !password || !name) {
      return NextResponse.json(
        { error: 'Email, OTP, password, and name are required' },
        { status: 400 }
      );
    }

    // Find user with valid OTP
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please request OTP first.' },
        { status: 400 }
      );
    }

    if (!user.otp || user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with verified email and password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        name,
        emailVerified: new Date(),
        otp: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
