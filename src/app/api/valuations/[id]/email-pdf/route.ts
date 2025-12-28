import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generatePDF } from "@/lib/pdfGenerator";
import nodemailer from "nodemailer";
import { checkRateLimit, getResetTime } from "@/lib/rateLimit";

// Create email transporter only if SMTP is configured
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check SMTP configuration
    if (!transporter) {
      return NextResponse.json(
        { error: "Email service is not configured. Please contact administrator." },
        { status: 503 }
      );
    }

    // Rate limiting: max 5 PDF emails per user per 1 hour
    if (!checkRateLimit(`pdf-email:${session.user.email}`, 5, 60 * 60 * 1000)) {
      const resetTime = getResetTime(`pdf-email:${session.user.email}`);
      return NextResponse.json(
        { error: `Too many PDF email requests. Please try again in ${resetTime} seconds.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valuation = await prisma.valuation.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!valuation) {
      return NextResponse.json(
        { error: "Valuation not found" },
        { status: 404 }
      );
    }

    const scenarios = (() => {
      try {
        return valuation.scenariosData
          ? typeof valuation.scenariosData === 'string'
            ? JSON.parse(valuation.scenariosData)
            : valuation.scenariosData
          : {};
      } catch (e) {
        console.error('Failed to parse scenarios:', e);
        return {};
      }
    })();
    
    const valueDrivers = (() => {
      try {
        return valuation.valueDriversData
          ? typeof valuation.valueDriversData === 'string'
            ? JSON.parse(valuation.valueDriversData)
            : valuation.valueDriversData
          : [];
      } catch (e) {
        console.error('Failed to parse valueDrivers:', e);
        return [];
      }
    })();

    // Generate professional PDF
    const pdfBuffer = await generatePDF({
      businessName: valuation.businessName || "Unknown Business",
      sector: valuation.sector || "unknown",
      createdAt: valuation.createdAt,
      annualRevenue: valuation.annualRevenue,
      ebitda: valuation.ebitda || undefined,
      netIncome: valuation.netIncome || undefined,
      freeCashFlow: valuation.freeCashFlow || undefined,
      totalAssets: valuation.totalAssets || undefined,
      terminalGrowth: valuation.terminalGrowth || 0.03,
      projectionYears: valuation.projectionYears || 5,
      scenarios,
      valueDrivers,
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@valueke.com',
      to: email,
      subject: `Valuation Report: ${valuation.businessName}`,
      html: `
        <h2>Your Business Valuation Report</h2>
        <p>Dear ${user.name || "User"},</p>
        <p>Please find attached your valuation report for <strong>${valuation.businessName}</strong>.</p>
        <p><strong>Valuation Summary:</strong></p>
        <ul>
          <li>Conservative (Bank View): KES ${Math.round(scenarios.conservative?.weightedValue || 0).toLocaleString()}</li>
          <li>Base Case (Market View): KES ${Math.round(scenarios.base?.weightedValue || 0).toLocaleString()}</li>
          <li>Upside (Buyer View): KES ${Math.round(scenarios.upside?.weightedValue || 0).toLocaleString()}</li>
        </ul>
        <p>Use the <strong>Base Case</strong> for fundraising, <strong>Conservative</strong> for lending, and <strong>Upside</strong> for strategic buyer discussions.</p>
        <p>Best regards,<br/><strong>Business Valuation Tool for Kenya</strong></p>
      `,
      attachments: [
        {
          filename: `valuation-${valuation.businessName}-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Valuation report sent to ${email}`,
    });
  } catch (error) {
    console.error("Error emailing PDF:", error);
    return NextResponse.json(
      { error: "Failed to email valuation report", details: String(error) },
      { status: 500 }
    );
  }
}
