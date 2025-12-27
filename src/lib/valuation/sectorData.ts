/**
 * Kenya SME Sector-Specific Risk Profiles and Discount Rates
 */

export interface SectorProfile {
  sector: string;
  description: string;
  riskProfile: "low" | "moderate" | "high" | "very-high";
  baseDiscountRate: number; // WACC
  riskPremium: number;
  typicalEbitdaMultiple: {
    min: number;
    max: number;
  };
  typicalRevenueMultiple: {
    min: number;
    max: number;
  };
  keyFactors: string[];
}

export const KENYAN_SECTOR_PROFILES: Record<string, SectorProfile> = {
  retail: {
    sector: "Retail & Wholesale",
    description:
      "Retail shops, supermarkets, and wholesale distributors in Kenya",
    riskProfile: "high",
    baseDiscountRate: 0.20,
    riskPremium: 0.08,
    typicalEbitdaMultiple: { min: 2.5, max: 4.0 },
    typicalRevenueMultiple: { min: 0.3, max: 0.8 },
    keyFactors: [
      "Customer footfall",
      "Location quality",
      "Inventory turnover",
      "Supplier contracts",
      "Competition intensity",
    ],
  },
  hospitality: {
    sector: "Hospitality (Hotels, Restaurants)",
    description:
      "Hotels, restaurants, and tourism-related hospitality businesses",
    riskProfile: "very-high",
    baseDiscountRate: 0.22,
    riskPremium: 0.12,
    typicalEbitdaMultiple: { min: 3.0, max: 5.0 },
    typicalRevenueMultiple: { min: 1.5, max: 3.0 },
    keyFactors: [
      "Occupancy rates",
      "Seasonal cycles",
      "Security & political risk",
      "Online reviews/reputation",
      "Location (tourism hubs)",
      "COVID recovery",
    ],
  },
  agribusiness: {
    sector: "Agribusiness & Agritech",
    description:
      "Farming, value-addition, agritech, export crops, horticulture",
    riskProfile: "high",
    baseDiscountRate: 0.20,
    riskPremium: 0.08,
    typicalEbitdaMultiple: { min: 3.0, max: 5.5 },
    typicalRevenueMultiple: { min: 0.5, max: 1.5 },
    keyFactors: [
      "Land quality & location",
      "Weather cycles",
      "Commodity prices",
      "Export certifications",
      "Contract farming agreements",
      "Seasonal cash flow",
    ],
  },
  tech: {
    sector: "Tech & Digital Startups",
    description:
      "SaaS, fintech, e-commerce, digital services, software companies",
    riskProfile: "high",
    baseDiscountRate: 0.22,
    riskPremium: 0.10,
    typicalEbitdaMultiple: { min: 4.0, max: 8.0 },
    typicalRevenueMultiple: { min: 3.0, max: 8.0 },
    keyFactors: [
      "Growth rate",
      "User retention & churn",
      "MRR/ARR",
      "Market scalability",
      "Regional expansion (East Africa)",
      "Technology moat",
      "Team capability",
    ],
  },
  manufacturing: {
    sector: "Manufacturing & Industrial",
    description: "Light & heavy manufacturing, industrial production",
    riskProfile: "moderate",
    baseDiscountRate: 0.18,
    riskPremium: 0.06,
    typicalEbitdaMultiple: { min: 4.0, max: 7.0 },
    typicalRevenueMultiple: { min: 0.8, max: 2.0 },
    keyFactors: [
      "Capacity utilization",
      "Production efficiency",
      "Equipment age & maintenance",
      "Long-term contracts",
      "Raw material costs",
      "Export certifications",
    ],
  },
  services: {
    sector: "Professional Services",
    description:
      "Consulting, accounting, legal, marketing, cleaning, security services",
    riskProfile: "low",
    baseDiscountRate: 0.16,
    riskPremium: 0.04,
    typicalEbitdaMultiple: { min: 3.5, max: 6.0 },
    typicalRevenueMultiple: { min: 1.0, max: 2.5 },
    keyFactors: [
      "Client base stability",
      "Billable hours & utilization",
      "Reputation & track record",
      "Team retention",
      "Long-term contracts",
      "Scalability without proportional cost increase",
    ],
  },
};

/**
 * Get WACC for a sector (includes macro risk premiums for Kenya)
 */
export function getWACC(sector: string, riskAdjustment: number = 0): number {
  const profile = KENYAN_SECTOR_PROFILES[sector];
  if (!profile) {
    return 0.28; // Default for unknown sectors
  }
  return profile.baseDiscountRate + profile.riskPremium + riskAdjustment;
}

/**
 * Macro risk factors for Kenya
 */
export const KENYA_MACRO_RISKS = {
  currencyVolatility: 0.02, // 2% added to WACC
  politicalRisk: 0.03, // 3% added for political uncertainty
  interestRateVolatility: 0.02, // 2% for interest rate risk
  infrastructureRisk: 0.01, // 1% for infrastructure limitations
};

export const BASE_RISK_FREE_RATE = 0.09; // Approx Kenyan government bond rate
export const MARKET_RISK_PREMIUM = 0.08; // Typical for emerging markets
