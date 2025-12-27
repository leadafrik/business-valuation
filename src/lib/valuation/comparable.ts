/**
 * Comparable Transactions / Market Multiples Valuation
 * Based on similar businesses or market benchmarks
 */

interface MultipleValuationInputs {
  annualRevenue: number;
  ebitda?: number;
  netIncome?: number;
  multiple: number;
  multipleType: "revenue" | "ebitda" | "earnings";
}

interface MultipleValuationResult {
  valuationValue: number;
  multipleType: string;
  multiple: number;
}

export function calculateComparableValuation(
  inputs: MultipleValuationInputs
): MultipleValuationResult {
  const { multipleType, multiple } = inputs;
  let basis = 0;

  if (multipleType === "revenue") {
    basis = inputs.annualRevenue;
  } else if (multipleType === "ebitda" && inputs.ebitda) {
    basis = inputs.ebitda;
  } else if (multipleType === "earnings" && inputs.netIncome) {
    basis = inputs.netIncome;
  } else {
    throw new Error(`Missing basis for ${multipleType} multiple`);
  }

  return {
    valuationValue: basis * multiple,
    multipleType,
    multiple,
  };
}

/**
 * Kenya sector-specific multiples
 */
export const KENYAN_SECTOR_MULTIPLES = {
  retail: {
    revenue: { min: 0.3, max: 0.8 },
    ebitda: { min: 2.5, max: 4.0 },
  },
  hospitality: {
    revenue: { min: 1.5, max: 3.0 },
    ebitda: { min: 3.0, max: 5.0 },
  },
  agribusiness: {
    revenue: { min: 0.5, max: 1.5 },
    ebitda: { min: 3.0, max: 5.5 },
  },
  tech: {
    revenue: { min: 3.0, max: 8.0 },
    arr: { min: 3.0, max: 8.0 }, // ARR = Annual Recurring Revenue
  },
  manufacturing: {
    revenue: { min: 0.8, max: 2.0 },
    ebitda: { min: 4.0, max: 7.0 },
  },
  services: {
    revenue: { min: 1.0, max: 2.5 },
    ebitda: { min: 3.5, max: 6.0 },
  },
};

export type SectorName = keyof typeof KENYAN_SECTOR_MULTIPLES;

export function getSectorMultiples(sector: SectorName, multipleType: string) {
  const sectorData = KENYAN_SECTOR_MULTIPLES[sector] as any;
  return sectorData?.[multipleType] || null;
}
