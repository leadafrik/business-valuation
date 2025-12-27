import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit, getResetTime } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password, name } = await req.json();

    if (!email || !otp || !password || !name) {
      return NextResponse.json(
        { error: 'Email, OTP, password, and name are required' },
        { status: 400 }
      );
    }

    // Rate limiting: prevent brute force OTP verification (max 5 attempts per 15 minutes)
    if (!checkRateLimit(`verify:${email}`, 5, 15 * 60 * 1000)) {
      const resetTime = getResetTime(`verify:${email}`);
      return NextResponse.json(
        { error: `Too many verification attempts. Please try again in ${resetTime} seconds.` },
        { status: 429 }
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

    // Check attempt limit (max 5 attempts) to prevent brute force
    if (user.otpAttempts && user.otpAttempts >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Hash provided OTP and compare with stored hash
    const hashedProvidedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    
    if (!user.otp || user.otp !== hashedProvidedOTP) {
      // Increment failed attempts
      await prisma.user.update({
        where: { email },
        data: { otpAttempts: (user.otpAttempts || 0) + 1 },
      });
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
        otpAttempts: 0, // Reset attempts after successful verification
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
