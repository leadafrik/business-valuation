import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Consolidated SMTP configuration - supports both SMTP_* and EMAIL_* env vars for backward compatibility
let transporter: any = null;

// Initialize transporter only if email config is available
if (process.env.SMTP_HOST || process.env.EMAIL_HOST) {
  console.log('[EMAIL] Initializing email transporter...');
  console.log(`[EMAIL] SMTP Host: ${process.env.SMTP_HOST || process.env.EMAIL_HOST}`);
  console.log(`[EMAIL] SMTP Port: ${process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'}`);
  console.log(`[EMAIL] SMTP Secure: ${process.env.SMTP_SECURE || 'false'}`);
  console.log(`[EMAIL] SMTP User: ${process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '...' : 'not set'}`);
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
    secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });
  
  console.log('[EMAIL] Transporter initialized successfully');
} else {
  // Log warning if email is not configured
  console.warn('[EMAIL] Email configuration not found. OTP emails will not be sent.');
}

/**
 * Generate a cryptographically secure OTP code
 * Uses crypto.randomInt instead of Math.random for better security
 */
export function generateOTP(): string {
  // Generate 6-digit OTP using crypto for better randomness
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

export async function sendOTPEmail(email: string, otp: string) {
  // If email is not configured, log to console in development mode
  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n${'='.repeat(60)}`);
      console.log('📧 OTP EMAIL (Development Mode - Not Actually Sent)');
      console.log(`${'='.repeat(60)}`);
      console.log(`To: ${email}`);
      console.log(`Subject: Your ValueKE OTP Code`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Valid for: 10 minutes`);
      console.log(`${'='.repeat(60)}\n`);
      return true; // Pretend it was sent in dev mode
    } else {
      console.error('[EMAIL] Email service is not configured. Please set SMTP_HOST or EMAIL_HOST environment variables.');
      return false;
    }
  }

  try {
    console.log(`[EMAIL] Sending OTP to ${email}...`);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@valueke.com',
      to: email,
      subject: 'Your ValueKE OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ValueKE</h2>
          <p>Your OTP verification code is:</p>
          <h1 style="background: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px; font-size: 32px; color: #007bff;">
            ${otp}
          </h1>
          <p style="color: #666;">This code expires in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] OTP sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send OTP email to ${email}:`, error);
    return false;
  }
}

export function getOTPExpiry(): Date {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);
  return expiryTime;
}
