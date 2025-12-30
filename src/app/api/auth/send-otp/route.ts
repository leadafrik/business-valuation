import { prisma } from '@/lib/prisma';
import { sendOTPEmail, generateOTP, getOTPExpiry } from '@/lib/email';
import { SendOTPSchema, safeParseRequest } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit, getResetTime } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body with Zod schema
    const validation = safeParseRequest(SendOTPSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: `Validation error: ${validation.error}` },
        { status: 400 }
      );
    }

    const email = validation.data.email;

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

    // Don't reveal whether email exists (prevents user enumeration)
    // Just continue if user exists but not verified, or if new user
    if (existingUser && existingUser.emailVerified) {
      // Return success response to not leak account existence
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    
    console.log(`[OTP] Generated OTP for ${email}: ${otp}`);
    
    // Hash OTP before storing (never store plaintext OTPs)
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Create or update user with hashed OTP and attempt tracking
    try {
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
      console.log(`[OTP] User record upserted for ${email}`);
    } catch (dbError) {
      console.error(`[OTP] Database error for ${email}:`, dbError);
      return NextResponse.json(
        { error: 'Failed to process request. Please try again.' },
        { status: 500 }
      );
    }

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      console.error(`[OTP] Failed to send OTP email to ${email}`);
      // In production, return server error; in dev, email will be logged to console
      return NextResponse.json(
        { 
          error: process.env.NODE_ENV === 'production' 
            ? 'Email service is not available. Please contact support.'
            : 'OTP sent, but email delivery failed. Check server logs for the code.'
        },
        { status: 500 }
      );
    }

    console.log(`[OTP] Successfully sent OTP email to ${email}`);
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('[OTP] Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
