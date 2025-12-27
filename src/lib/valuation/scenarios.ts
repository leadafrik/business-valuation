/**
 * Valuation Scenarios - Conservative, Base, and Upside cases
 */

export interface ValuationScenario {
  name: string;
  perspective: string;
  dcf: number;
  comparable: number;
  assetBased: number;
  weighted: number;
  assumptions: {
    wacc: number;
    terminalGrowth: number;
    growthMultiplier: number;
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
  const conservativeWACC = baseWACC + 2;
  const conservativeGrowth = baseTerminalGrowth - 0.01;
  const conservativeMultiplier = 0.9; // 10% haircut on growth assumptions

  const conservativeScenario: ValuationScenario = {
    name: 'Conservative',
    perspective: 'Bank/Lender view - Lower risk tolerance',
    dcf: Math.round(dcfBase * conservativeMultiplier),
    comparable: Math.round(comparableBase * 0.85),
    assetBased: assetBase,
    weighted: 0,
    assumptions: {
      wacc: conservativeWACC,
      terminalGrowth: conservativeGrowth,
      growthMultiplier: conservativeMultiplier,
    },
  };
  conservativeScenario.weighted = Math.round(
    conservativeScenario.dcf * 0.4 +
      conservativeScenario.comparable * 0.2 +
      conservativeScenario.assetBased * 0.2
  );

  // Base: Current assumptions
  const baseScenario: ValuationScenario = {
    name: 'Base Case',
    perspective: 'Market view - Realistic assumptions',
    dcf: dcfBase,
    comparable: comparableBase,
    assetBased: assetBase,
    weighted: weightedBase,
    assumptions: {
      wacc: baseWACC,
      terminalGrowth: baseTerminalGrowth,
      growthMultiplier: 1.0,
    },
  };

  // Upside: Lower discount rate, higher growth, strategic premium
  const upscaleWACC = baseWACC - 1;
  const upscaleGrowth = baseTerminalGrowth + 0.01;
  const upscaleMultiplier = 1.15; // 15% uplift for growth + strategic premium

  const upscaleScenario: ValuationScenario = {
    name: 'Upside Case',
    perspective: 'Strategic buyer view - Growth + synergy potential',
    dcf: Math.round(dcfBase * upscaleMultiplier),
    comparable: Math.round(comparableBase * 1.25), // Strategic premium
    assetBased: assetBase,
    weighted: 0,
    assumptions: {
      wacc: upscaleWACC,
      terminalGrowth: upscaleGrowth,
      growthMultiplier: upscaleMultiplier,
    },
  };
  upscaleScenario.weighted = Math.round(
    upscaleScenario.dcf * 0.4 +
      upscaleScenario.comparable * 0.2 +
      upscaleScenario.assetBased * 0.2
  );

  return {
    conservative: conservativeScenario,
    base: baseScenario,
    upside: upscaleScenario,
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
