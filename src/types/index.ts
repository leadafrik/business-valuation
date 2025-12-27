export type Sector = "retail" | "hospitality" | "agribusiness" | "tech" | "manufacturing" | "services";

export type ValuationType = "dcf" | "comparable" | "asset-based" | "multiple";

export interface ValuationRequest {
  businessName: string;
  businessDescription?: string;
  sector: Sector;
  annualRevenue: number;
  ebitda?: number;
  netIncome?: number;
  freeCashFlow?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  discountRate?: number;
  terminalGrowth?: number;
  projectionYears?: number;
}

export interface ValuationResult {
  valuationType: ValuationType;
  value: number;
  multiple?: number;
  assumptions: Record<string, any>;
  methodology: string;
}

export interface SectorDataType {
  sector: Sector;
  typicalEbitdaMultiple?: number;
  typicalRevenueMultiple?: number;
  typicalDiscountRate?: number;
  riskProfile: "low" | "moderate" | "high";
}
