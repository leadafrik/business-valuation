import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const scenarios = valuation.scenariosData
      ? JSON.parse(valuation.scenariosData as string)
      : {};
    const valueDrivers = valuation.valueDriversData
      ? JSON.parse(valuation.valueDriversData as string)
      : [];

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Collect chunks
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => resolve());
      doc.on("error", reject);

      // Build PDF content
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Business Valuation Report", { align: "center" })
        .moveDown();

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Business: ${valuation.businessName}`)
        .text(`Sector: ${valuation.sector}`)
        .text(
          `Date: ${new Date(valuation.createdAt).toLocaleDateString()}`
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
      doc.text(`Conservative (Bank View): KES ${Math.round(conservative).toLocaleString()}`);
      doc.text(`Base Case (Market View): KES ${Math.round(base).toLocaleString()}`);
      doc.text(`Upside (Buyer View): KES ${Math.round(upside).toLocaleString()}`);
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
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Financial Inputs")
        .moveDown(0.5);

      doc.fontSize(10).font("Helvetica");
      doc.text(`Annual Revenue: KES ${Math.round(valuation.annualRevenue).toLocaleString()}`);
      if (valuation.ebitda) doc.text(`EBITDA: KES ${Math.round(valuation.ebitda).toLocaleString()}`);
      if (valuation.netIncome) doc.text(`Net Income: KES ${Math.round(valuation.netIncome).toLocaleString()}`);
      if (valuation.freeCashFlow) doc.text(`Free Cash Flow: KES ${Math.round(valuation.freeCashFlow).toLocaleString()}`);
      doc.moveDown();

      // Value Drivers
      if (valueDrivers && valueDrivers.length > 0) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Value Drivers: How to Increase Valuation")
          .moveDown(0.5);

        doc.fontSize(10).font("Helvetica");
        valueDrivers.slice(0, 6).forEach((driver: any, index: number) => {
          doc.text(`${index + 1}. ${driver.action} (+${driver.impact}%)`);
        });
        doc.moveDown();
      }

      // Assumptions
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Assumptions")
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Terminal Growth Rate: ${(valuation.terminalGrowth! * 100).toFixed(1)}%`)
        .text(`Projection Years: ${valuation.projectionYears}`)
        .moveDown(2);

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "This valuation is based on the financial inputs and assumptions provided. It represents a best estimate based on sector data and market conditions.",
          { align: "center" }
        );

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="valuation-${params.id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: String(error) },
      { status: 500 }
    );
  }
}
