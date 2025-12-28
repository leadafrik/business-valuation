import PDFDocument from "pdfkit";

export interface PdfValuationData {
  businessName: string;
  sector: string;
  createdAt: Date;
  annualRevenue: number;
  ebitda?: number;
  netIncome?: number;
  freeCashFlow?: number;
  totalAssets?: number;
  terminalGrowth: number;
  projectionYears: number;
  scenarios: {
    conservative?: { weightedValue: number; assumptions: { wacc: number } };
    base?: { weightedValue: number; assumptions: { wacc: number } };
    upside?: { weightedValue: number; assumptions: { wacc: number } };
  };
  valueDrivers: Array<{ action: string; impact: number }>;
}

export async function generatePDF(data: PdfValuationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    doc.on("error", reject);

    // Helper function
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    // ============ TITLE & HEADER ============
    doc.fontSize(28).font("Helvetica-Bold").text("Business Valuation Report");
    doc.fontSize(14).text(data.businessName);
    doc.fontSize(11).text(`${data.sector.charAt(0).toUpperCase() + data.sector.slice(1)} Sector`);
    doc.moveDown();

    // Report info
    doc.fontSize(10).font("Helvetica");
    doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`);
    doc.text(`Valuation Date: ${new Date(data.createdAt).toLocaleDateString('en-KE')}`);
    doc.moveDown(1.5);

    // ============ RECOMMENDED VALUATION ============
    const conservative = data.scenarios.conservative?.weightedValue || 0;
    const base = data.scenarios.base?.weightedValue || 0;
    const upside = data.scenarios.upside?.weightedValue || 0;
    const recommended = (conservative + base * 2 + upside) / 4;

    doc.fontSize(12).font("Helvetica-Bold").text("RECOMMENDED VALUATION");
    doc.fontSize(24).font("Helvetica-Bold").text(formatCurrency(recommended));
    doc.fontSize(10).font("Helvetica").text(`Range: ${formatCurrency(conservative)} to ${formatCurrency(upside)}`);
    doc.moveDown(1.5);

    // ============ SCENARIO SUMMARY ============
    doc.fontSize(13).font("Helvetica-Bold").text("Valuation Scenarios");
    doc.moveDown(0.5);

    const scenarios = [
      {
        name: "Conservative (Bank View)",
        value: conservative,
        wacc: data.scenarios.conservative?.assumptions?.wacc || 0,
      },
      {
        name: "Base Case (Market View)",
        value: base,
        wacc: data.scenarios.base?.assumptions?.wacc || 0,
      },
      {
        name: "Upside (Buyer View)",
        value: upside,
        wacc: data.scenarios.upside?.assumptions?.wacc || 0,
      },
    ];

    doc.fontSize(10).font("Helvetica");
    scenarios.forEach((scenario) => {
      doc.text(`${scenario.name}: ${formatCurrency(scenario.value)} (WACC: ${(scenario.wacc * 100).toFixed(1)}%)`);
    });
    doc.moveDown(1.5);

    // ============ FINANCIAL INPUTS ============
    doc.fontSize(13).font("Helvetica-Bold").text("Financial Inputs");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");

    const inputs = [
      { label: "Annual Revenue", value: data.annualRevenue },
      ...(data.ebitda ? [{ label: "EBITDA", value: data.ebitda }] : []),
      ...(data.netIncome ? [{ label: "Net Income", value: data.netIncome }] : []),
      ...(data.freeCashFlow ? [{ label: "Free Cash Flow", value: data.freeCashFlow }] : []),
      ...(data.totalAssets ? [{ label: "Total Assets", value: data.totalAssets }] : []),
    ];

    inputs.forEach((input) => {
      doc.text(`${input.label}: ${formatCurrency(input.value)}`);
    });
    doc.moveDown(1);

    // ============ ASSUMPTIONS ============
    doc.fontSize(13).font("Helvetica-Bold").text("Valuation Assumptions");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Terminal Growth Rate: ${(data.terminalGrowth * 100).toFixed(1)}%`);
    doc.text(`Projection Period: ${data.projectionYears} years`);
    doc.moveDown(1);

    // ============ VALUE DRIVERS ============
    if (data.valueDrivers && data.valueDrivers.length > 0) {
      doc.fontSize(13).font("Helvetica-Bold").text("Value Drivers: How to Increase Valuation");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");

      data.valueDrivers.slice(0, 8).forEach((driver, index) => {
        doc.text(`${index + 1}. ${driver.action}: +${driver.impact}% impact`);
      });
      doc.moveDown(1);
    }

    // ============ USAGE GUIDE ============
    doc.fontSize(13).font("Helvetica-Bold").text("How to Use This Valuation");
    doc.moveDown(0.5);
    doc.fontSize(9).font("Helvetica");
    doc.text("• Use Base Case for fundraising and realistic negotiations");
    doc.text("• Use Conservative for bank lending and risk assessment");
    doc.text("• Use Upside for strategic buyer discussions and M&A");
    doc.text("• Focus on value drivers to improve enterprise value over time");
    doc.moveDown(1.5);

    // ============ FOOTER ============
    doc.fontSize(8).font("Helvetica");
    doc.text(
      "This valuation is based on financial inputs and assumptions provided. It represents a best estimate based on valuation methodologies and sector data. Actual market values may differ. Confidential.",
      { align: "center" }
    );

    doc.end();
  });
}
