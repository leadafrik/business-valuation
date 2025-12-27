/**
 * DCF (Discounted Cash Flow) Valuation
 * Suitable for SMEs with predictable cash flows
 */

interface DCFInputs {
  freeCashFlow: number;
  growthRate: number; // Annual growth rate (e.g., 0.10 for 10%)
  discountRate: number; // WACC
  projectionYears: number;
  terminalGrowth: number;
}

interface DCFResult {
  presentValue: number;
  terminalValue: number;
  enterpriseValue: number;
  breakdown: {
    year: number;
    fcf: number;
    discount: number;
    pv: number;
  }[];
}

export function calculateDCF(inputs: DCFInputs): DCFResult {
  const {
    freeCashFlow: initialFCF,
    growthRate,
    discountRate,
    projectionYears,
    terminalGrowth,
  } = inputs;

  // Validate inputs to prevent invalid calculations
  if (discountRate <= terminalGrowth) {
    throw new Error('Discount rate must be greater than terminal growth rate');
  }
  
  if (terminalGrowth < 0 || terminalGrowth > 0.05) {
    throw new Error('Terminal growth should be between 0% and 5%');
  }
  
  if (discountRate <= 0 || discountRate > 0.5) {
    throw new Error('Discount rate should be between 0% and 50%');
  }
  
  if (growthRate < 0 || growthRate > 0.5) {
    throw new Error('Growth rate should be between 0% and 50%');
  }

  // Project FCF for N years
  const breakdown: DCFResult["breakdown"] = [];
  let totalPV = 0;

  for (let year = 1; year <= projectionYears; year++) {
    const fcf = initialFCF * Math.pow(1 + growthRate, year);
    const discountFactor = Math.pow(1 + discountRate, year);
    const pv = fcf / discountFactor;

    breakdown.push({
      year,
      fcf,
      discount: discountFactor,
      pv,
    });

    totalPV += pv;
  }

  // Terminal Value (Gordon Growth Model)
  // Note: This formula requires discountRate > terminalGrowth (validated above)
  const finalYearFCF =
    initialFCF * Math.pow(1 + growthRate, projectionYears);
  const terminalValue =
    (finalYearFCF * (1 + terminalGrowth)) / (discountRate - terminalGrowth);

  // PV of Terminal Value
  const pvTerminalValue =
    terminalValue / Math.pow(1 + discountRate, projectionYears);

  const enterpriseValue = totalPV + pvTerminalValue;

  return {
    presentValue: totalPV,
    terminalValue,
    enterpriseValue,
    breakdown,
  };
}

/**
 * Helper: Estimate FCF from Revenue and EBITDA margin
 */
export function estimateFCF(
  ebitda: number,
  depreciationAmortization: number = 0,
  taxes: number = 0,
  capex: number = 0,
  changeInWorkingCapital: number = 0
): number {
  return ebitda - depreciationAmortization - taxes - capex - changeInWorkingCapital;
}
