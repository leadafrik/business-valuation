import { prisma } from '@/lib/prisma';
import { sendOTPEmail, generateOTP, getOTPExpiry } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit, getResetTime } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Rate limiting: max 3 OTP requests per email per 15 minutes
    if (!checkRateLimit(`otp:${email}`, 3, 15 * 60 * 1000)) {
      const resetTime = getResetTime(`otp:${email}`);
      return NextResponse.json(
        { error: `Too many OTP requests. Please try again in ${resetTime} seconds.` },
        { status: 429 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    
    // Hash OTP before storing (never store plaintext OTPs)
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Create or update user with hashed OTP and attempt tracking
    await prisma.user.upsert({
      where: { email },
      update: {
        otp: hashedOTP,
        otpExpiresAt: otpExpiry,
        otpAttempts: 0, // Reset attempts on new OTP
      },
      create: {
        email,
        otp: hashedOTP,
        otpExpiresAt: otpExpiry,
        otpAttempts: 0,
      },
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
