import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

// Create email transporter (reuse from OTP service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function generatePDF(valuation: any, scenarios: any, valueDrivers: any) {
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Build PDF content
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("Business Valuation Report", { align: "center" })
    .moveDown();

  doc
    .fontSize(12)
    .font("Helvetica")
    .text(`Business: ${valuation.businessName}`, { align: "left" })
    .text(`Sector: ${valuation.sector}`, { align: "left" })
    .text(
      `Date: ${new Date(valuation.createdAt).toLocaleDateString()}`,
      { align: "left" }
    )
    .moveDown();

  // Scenarios section
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Valuation Scenarios")
    .moveDown(0.5);

  const conservative = scenarios.conservative?.weightedValue || 0;
  const base = scenarios.base?.weightedValue || 0;
  const upside = scenarios.upside?.weightedValue || 0;

  doc.fontSize(11).font("Helvetica");
  doc.text(`Conservative (Bank View): KES ${conservative.toLocaleString()}`);
  doc.text(
    `Base Case (Market View): KES ${base.toLocaleString()}`,
    { underline: true }
  );
  doc.text(`Upside (Buyer View): KES ${upside.toLocaleString()}`);
  doc.moveDown();

  // WACC Info
  const conservativeWACC = scenarios.conservative?.assumptions?.wacc || 0;
  const baseWACC = scenarios.base?.assumptions?.wacc || 0;
  const upsideWACC = scenarios.upside?.assumptions?.wacc || 0;

  doc.text(`Conservative WACC: ${(conservativeWACC * 100).toFixed(1)}%`);
  doc.text(`Base WACC: ${(baseWACC * 100).toFixed(1)}%`);
  doc.text(`Upside WACC: ${(upsideWACC * 100).toFixed(1)}%`);
  doc.moveDown();

  // Financial Inputs
  doc.fontSize(16).font("Helvetica-Bold").text("Financial Inputs");
  doc.fontSize(11).font("Helvetica").moveDown(0.5);
  doc.text(
    `Annual Revenue: KES ${valuation.annualRevenue.toLocaleString()}`
  );
  if (valuation.ebitda)
    doc.text(`EBITDA: KES ${valuation.ebitda.toLocaleString()}`);
  if (valuation.netIncome)
    doc.text(`Net Income: KES ${valuation.netIncome.toLocaleString()}`);
  if (valuation.freeCashFlow)
    doc.text(
      `Free Cash Flow: KES ${valuation.freeCashFlow.toLocaleString()}`
    );
  doc.moveDown();

  // Value Drivers
  if (valueDrivers.length > 0) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Value Drivers: How to Increase Valuation")
      .moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    valueDrivers.forEach((driver: any, index: number) => {
      doc.text(
        `${index + 1}. ${driver.action} (+${driver.impact}%)`
      );
    });
    doc.moveDown();
  }

  // Assumptions section
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Assumptions")
    .moveDown(0.5);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Terminal Growth Rate: ${(valuation.terminalGrowth! * 100).toFixed(1)}%`
    )
    .text(`Projection Years: ${valuation.projectionYears}`)
    .moveDown();

  // Footer
  doc
    .fontSize(8)
    .font("Helvetica")
    .text(
      "This valuation is based on the financial inputs and assumptions provided. It represents a best estimate based on sector data and market conditions.",
      { align: "center" }
    );

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

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

    const scenarios_parsed = (() => {
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
    
    const valueDrivers_parsed = (() => {
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

    // Generate PDF
    const pdfBuffer = await generatePDF(valuation, scenarios_parsed, valueDrivers_parsed);

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
          <li>Conservative (Bank View): KES ${scenarios_parsed.conservative?.weightedValue?.toLocaleString() || 0}</li>
          <li>Base Case (Market View): KES ${scenarios_parsed.base?.weightedValue?.toLocaleString() || 0}</li>
          <li>Upside (Buyer View): KES ${scenarios_parsed.upside?.weightedValue?.toLocaleString() || 0}</li>
        </ul>
        <p>Use these valuations for fundraising, lending, or strategic decisions.</p>
        <p>Best regards,<br/>Business Valuation Tool</p>
      `,
      attachments: [
        {
          filename: `valuation-${params.id}.pdf`,
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
      { error: "Failed to email valuation report" },
      { status: 500 }
    );
  }
}
