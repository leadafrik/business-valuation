import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Consolidated SMTP configuration - supports both SMTP_* and EMAIL_* env vars for backward compatibility
let transporter: any = null;
let emailConfigured = false;

// Initialize transporter only if email config is available
if (process.env.SMTP_HOST || process.env.EMAIL_HOST) {
  try {
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
    const smtpSecure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    
    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP credentials (user/pass) are required but not provided');
    }

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    emailConfigured = true;
    console.log(`[EMAIL] ✓ Email transporter initialized for ${smtpHost}:${smtpPort}`);
  } catch (error) {
    console.error('[EMAIL] ✗ Failed to initialize email transporter:', error instanceof Error ? error.message : error);
  }
} else {
  console.error('[EMAIL] ✗ SMTP configuration not found. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
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
  if (!emailConfigured || !transporter) {
    console.error(`[EMAIL] ✗ Email service not configured. Cannot send OTP to ${email}`);
    return false;
  }

  try {
    console.log(`[EMAIL] Sending OTP to ${email}...`);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@valueke.com',
      to: email,
      subject: 'Your ValueKE OTP Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0066cc; margin: 0;">ValueKE</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Business Valuation Platform</p>
          </div>
          
          <div style="background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email</h2>
            <p style="color: #666; margin: 0 0 30px 0; font-size: 16px;">Your one-time password (OTP) is:</p>
            
            <div style="background: #0066cc; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 40px; font-weight: bold; letter-spacing: 5px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </p>
            </div>
            
            <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">This code expires in 10 minutes</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you didn't request this code, please ignore this email or contact support if you have concerns about your account security.
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              © 2025 ValueKE. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Your ValueKE verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✓ OTP sent successfully to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[EMAIL] ✗ Failed to send OTP to ${email}:`, errorMessage);
    return false;
  }
}

export function getOTPExpiry(): Date {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);
  return expiryTime;
}
