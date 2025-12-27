/**
 * Valuation Scenarios - Conservative, Base, and Upside cases
 */

export interface ValuationScenario {
  name: string;
  perspective: string;
  weightedValue: number;
  assumptions: {
    wacc: number;
    terminalGrowth: number;
  };
}

export function calculateScenarios(
  dcfBase: number,
  comparableBase: number,
  assetBase: number,
  weightedBase: number,
  baseWACC: number,
  baseTerminalGrowth: number
): Record<string, ValuationScenario> {
  // Conservative: Higher discount rate, lower growth
  const conservativeGrowth = Math.max(baseTerminalGrowth - 0.01, 0);
  const conservativeMultiplier = 0.9; // 10% haircut

  // Calculate conservative weighted value
  const conservativeDCF = Math.max(dcfBase * conservativeMultiplier, 0);
  const conservativeComparable = Math.max(comparableBase * 0.85, 0);
  const conservativeAsset = Math.max(assetBase * 0.85, 0);
  const conservativeWeighted = Math.round(
    conservativeDCF * 0.4 + conservativeComparable * 0.3 + conservativeAsset * 0.3
  );

  const conservativeScenario: ValuationScenario = {
    name: 'Conservative',
    perspective: 'Bank/Lender view',
    weightedValue: conservativeWeighted,
    assumptions: {
      wacc: baseWACC + 0.02,
      terminalGrowth: conservativeGrowth,
    },
  };

  // Base: Current assumptions
  const baseScenario: ValuationScenario = {
    name: 'Base Case',
    perspective: 'Market view',
    weightedValue: Math.round(weightedBase),
    assumptions: {
      wacc: baseWACC,
      terminalGrowth: baseTerminalGrowth,
    },
  };

  // Upside: Lower discount rate, higher growth
  const upsideWACC = Math.max(baseWACC - 0.01, 0); // -1%
  const upsideGrowth = baseTerminalGrowth + 0.01;
  const upsideMultiplier = 1.15; // 15% uplift

  // Calculate upside weighted value
  const upsideDCF = Math.max(dcfBase * upsideMultiplier, 0);
  const upsideComparable = Math.max(comparableBase * 1.25, 0);
  const upsideAsset = Math.max(assetBase * 1.1, 0);
  const upsideWeighted = Math.round(
    upsideDCF * 0.4 + upsideComparable * 0.3 + upsideAsset * 0.3
  );

  const upsideScenario: ValuationScenario = {
    name: 'Upside',
    perspective: 'Strategic buyer view',
    weightedValue: upsideWeighted,
    assumptions: {
      wacc: upsideWACC,
      terminalGrowth: upsideGrowth,
    },
  };

  return {
    conservative: conservativeScenario,
    base: baseScenario,
    upside: upsideScenario,
  };
}

export function calculateSensitivity(
  baseValue: number,
  baseWACC: number
): { wacc: number; range: string }[] {
  return [
    { wacc: baseWACC - 2, range: `+${Math.round(((baseValue * 1.15 - baseValue) / baseValue) * 100)}%` },
    { wacc: baseWACC - 1, range: `+${Math.round(((baseValue * 1.08 - baseValue) / baseValue) * 100)}%` },
    { wacc: baseWACC, range: 'Base' },
    { wacc: baseWACC + 1, range: `-${Math.round(((baseValue - baseValue * 0.92) / baseValue) * 100)}%` },
    { wacc: baseWACC + 2, range: `-${Math.round(((baseValue - baseValue * 0.85) / baseValue) * 100)}%` },
  ];
}

export const VALUE_DRIVERS_BY_SECTOR: Record<string, Array<{ action: string; impact: number }>> = {
  retail: [
    { action: 'Improve financial record quality & formalize accounting', impact: 15 },
    { action: 'Reduce dependency on owner/founder', impact: 12 },
    { action: 'Establish long-term supplier contracts', impact: 10 },
    { action: 'Reduce customer concentration (top 3 < 30%)', impact: 10 },
    { action: 'Invest in inventory management systems', impact: 8 },
    { action: 'Expand into adjacent locations', impact: 12 },
  ],
  hospitality: [
    { action: 'Improve occupancy rates & pricing strategy', impact: 20 },
    { action: 'Formalize booking systems (online presence)', impact: 14 },
    { action: 'Establish corporate/tour operator partnerships', impact: 12 },
    { action: 'Reduce owner operational dependency', impact: 15 },
    { action: 'Diversify revenue (events, conferences, etc.)', impact: 10 },
    { action: 'Certify staff & implement quality standards', impact: 8 },
  ],
  agribusiness: [
    { action: 'Secure long-term offtake agreements', impact: 18 },
    { action: 'Improve yield through better inputs/training', impact: 14 },
    { action: 'Reduce market price dependency (contracts)', impact: 16 },
    { action: 'Invest in land formalization & title', impact: 12 },
    { action: 'Diversify crops/products', impact: 10 },
    { action: 'Establish irrigation systems', impact: 13 },
  ],
  tech: [
    { action: 'Grow monthly recurring revenue (MRR)', impact: 20 },
    { action: 'Reduce customer acquisition cost (CAC)', impact: 12 },
    { action: 'Improve retention rates & reduce churn', impact: 15 },
    { action: 'Build proprietary technology/IP', impact: 18 },
    { action: 'Achieve profitability milestone', impact: 16 },
    { action: 'Expand into adjacent markets', impact: 14 },
  ],
  manufacturing: [
    { action: 'Secure long-term customer contracts', impact: 16 },
    { action: 'Improve capacity utilization', impact: 12 },
    { action: 'Reduce working capital requirements', impact: 10 },
    { action: 'Invest in modern equipment/automation', impact: 14 },
    { action: 'Develop proprietary products/IP', impact: 15 },
    { action: 'Reduce supplier concentration & costs', impact: 11 },
  ],
  services: [
    { action: 'Build repeatable service delivery model', impact: 14 },
    { action: 'Reduce founder/key person dependency', impact: 16 },
    { action: 'Establish high-value client contracts', impact: 12 },
    { action: 'Improve margins through service packaging', impact: 13 },
    { action: 'Build team & management structure', impact: 15 },
    { action: 'Achieve consistent revenue growth >20% YoY', impact: 18 },
  ],
};
