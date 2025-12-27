import nodemailer from 'nodemailer';

// Consolidated SMTP configuration - supports both SMTP_* and EMAIL_* env vars for backward compatibility
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
  secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  try {
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
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTPExpiry(): Date {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);
  return expiryTime;
}
