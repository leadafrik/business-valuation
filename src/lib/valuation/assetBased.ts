/**
 * Asset-Based Valuation
 * For asset-heavy businesses or those with limited earnings history
 */

interface AssetBasedInputs {
  totalAssets: number;
  totalLiabilities: number;
  adjustments?: {
    realEstateValue?: number; // Adjustment for land/property
    intangibles?: number; // Goodwill, brands
    other?: number;
  };
}

interface AssetBasedResult {
  netAssetValue: number;
  adjustedNetAssetValue: number;
  adjustmentSummary: Record<string, number>;
}

export function calculateAssetBasedValuation(
  inputs: AssetBasedInputs
): AssetBasedResult {
  const { totalAssets, totalLiabilities, adjustments = {} } = inputs;

  const netAssetValue = totalAssets - totalLiabilities;

  let totalAdjustments = 0;
  const adjustmentSummary: Record<string, number> = {};

  if (adjustments.realEstateValue) {
    adjustmentSummary.realEstate = adjustments.realEstateValue;
    totalAdjustments += adjustments.realEstateValue;
  }

  if (adjustments.intangibles) {
    adjustmentSummary.intangibles = adjustments.intangibles;
    totalAdjustments += adjustments.intangibles;
  }

  if (adjustments.other) {
    adjustmentSummary.other = adjustments.other;
    totalAdjustments += adjustments.other;
  }

  return {
    netAssetValue,
    adjustedNetAssetValue: netAssetValue + totalAdjustments,
    adjustmentSummary,
  };
}
