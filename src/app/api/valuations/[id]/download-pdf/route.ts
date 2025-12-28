import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generatePDF } from "@/lib/pdfGenerator";

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

    return new NextResponse(new Uint8Array(pdfBuffer), {
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
