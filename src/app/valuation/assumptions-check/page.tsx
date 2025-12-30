'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KENYAN_SECTOR_PROFILES } from '@/lib/valuation/sectorData';

interface FormData {
  sector?: string;
  totalAssets?: number;
  totalLiabilities?: number;
  businessName?: string;
  annualRevenue?: number;
  [key: string]: any;
}

function AssumptionCheckForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  // Parse form data from URL params with error handling
  let formData: FormData = {};
  const formDataStr = searchParams.get('data');
  if (formDataStr) {
    try {
      formData = JSON.parse(decodeURIComponent(formDataStr));
    } catch (err) {
      console.error('Failed to parse form data:', err);
      setError('Invalid form data. Please start over.');
      // Redirect back to form after a delay
      useEffect(() => {
        const timer = setTimeout(() => router.push('/valuation/new'), 2000);
        return () => clearTimeout(timer);
      }, []);
    }
  }

  const [assumptions, setAssumptions] = useState({
    terminalGrowthCheck: 'moderate',
    growthYear1: 5,
    growthYear2: 5,
    growthYear3to5: 4,
    fcfConfirm: false,
    riskFactors: [] as string[],
  });

  const sector = formData.sector ? KENYAN_SECTOR_PROFILES[formData.sector] : undefined;
  // Use the submitted discount rate if available, otherwise use sector base rate
  const submittedWACC = formData.discountRate ? formData.discountRate * 100 : null;
  const baseWACC = submittedWACC !== null ? submittedWACC : (sector ? sector.baseDiscountRate * 100 : 20);

  // Calculate risk adjustment from leverage
  const leverageRatio =
    formData.totalAssets && formData.totalAssets > 0
      ? ((formData.totalLiabilities || 0) / formData.totalAssets) * 100
      : 0;
  const leverageAdjustment = leverageRatio > 50 ? 2 : leverageRatio > 30 ? 1 : 0;
  const riskAdjustment = assumptions.riskFactors.length * 0.5;
  // Calculate final WACC by adding leverage and risk adjustments to base WACC
  const finalWACC = Math.round((baseWACC + leverageAdjustment + riskAdjustment) * 10) / 10;

  const handleRiskFactorToggle = (factor: string) => {
    setAssumptions((prev) => ({
      ...prev,
      riskFactors: prev.riskFactors.includes(factor)
        ? prev.riskFactors.filter((f) => f !== factor)
        : [...prev.riskFactors, factor],
    }));
  };

  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate terminal growth
    if (!assumptions.terminalGrowthCheck) {
      setError('Please answer the terminal growth question');
      return;
    }

    // Validate FCF confirmation
    if (!assumptions.fcfConfirm) {
      setError('Please confirm that the FCF estimate is realistic for your business');
      return;
    }

    // Create enriched form data
    const enrichedData = {
      ...formData,
      discountRate: finalWACC / 100, // Convert percentage to decimal (21.5 -> 0.215)
      terminalGrowth:
        assumptions.terminalGrowthCheck === 'conservative' ? 0.025 : 0.04,
      projectedGrowthRates: [
        assumptions.growthYear1,
        assumptions.growthYear2,
        assumptions.growthYear3to5,
      ],
      riskFactors: assumptions.riskFactors,
      waaccBreakdown: {
        baseSector: baseWACC,
        leverageAdjustment,
        riskAdjustment,
        total: finalWACC,
      },
    };

    // Submit valuation with enriched data
    try {
      const res = await fetch('/api/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to calculate valuation');
        return;
      }

      const result = await res.json();
      router.push(`/valuation/${result.id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const riskFactorsList = [
    { id: 'founder-dependent', label: 'Heavily founder-dependent' },
    { id: 'single-customer', label: 'Single customer >30% revenue' },
    { id: 'regulatory-risk', label: 'Regulatory/License renewal risk' },
    { id: 'supply-chain', label: 'Single-point supply chain' },
    { id: 'seasonality', label: 'High seasonal volatility' },
    { id: 'market-risk', label: 'Competitive market pressure' },
    { id: 'key-employee', label: 'Key employee dependency' },
    { id: 'debt-heavy', label: 'High debt burden' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container py-6">
          <h1 className="text-2xl font-bold text-gray-800">Verify Your Assumptions</h1>
          <p className="text-gray-600 mt-2">
            Let's make sure your valuation is based on realistic assumptions
          </p>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleProceed} className="space-y-8">
            {/* Terminal Growth Check */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                1. Terminal Growth Rate
              </h2>
              <div className="bg-yellow-50 p-4 rounded mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Context:</strong> Kenya's long-term GDP growth is ~3-4%. Your business
                  terminal growth (perpetual growth rate) should generally not exceed this.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Your setting:</strong> {assumptions.terminalGrowthCheck === 'conservative' ? '2.5%' : '4%'}
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="terminalGrowth"
                    value="conservative"
                    checked={assumptions.terminalGrowthCheck === 'conservative'}
                    onChange={(e) =>
                      setAssumptions((prev) => ({
                        ...prev,
                        terminalGrowthCheck: e.target.value,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="ml-3 text-gray-700">
                    <strong>Conservative (2.5%):</strong> Business will grow below Kenya's GDP. Safe choice for mature
                    businesses.
                  </span>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="terminalGrowth"
                    value="moderate"
                    checked={assumptions.terminalGrowthCheck === 'moderate'}
                    onChange={(e) =>
                      setAssumptions((prev) => ({
                        ...prev,
                        terminalGrowthCheck: e.target.value,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="ml-3 text-gray-700">
                    <strong>Moderate (4%):</strong> Align with Kenya's GDP. For growth-stage businesses.
                  </span>
                </label>
              </div>
            </div>

            {/* Growth Projections */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                2. Expected Revenue Growth (Next 5 Years)
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Enter annual growth rates. This drives the DCF valuation heavily.
              </p>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { year: 'Year 1', state: 'growthYear1' },
                  { year: 'Year 2', state: 'growthYear2' },
                  { year: 'Years 3-5 (avg)', state: 'growthYear3to5' },
                ].map((item) => (
                  <div key={item.state}>
                    <label className="block text-gray-700 font-semibold mb-2">
                      {item.year}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={assumptions[item.state as 'growthYear1' | 'growthYear2' | 'growthYear3to5']}
                        onChange={(e) =>
                          setAssumptions((prev) => ({
                            ...prev,
                            [item.state]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                      <span className="ml-2 text-gray-600">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FCF Verification */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                3. Free Cash Flow Verification
              </h2>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Your FCF:</strong> KES {formData.freeCashFlow?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Net Income:</strong> KES {formData.netIncome?.toLocaleString() || '0'}
                </p>
                {formData.netIncome > 0 && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Implied Margin:</strong>{' '}
                    {Math.round((formData.freeCashFlow / formData.netIncome) * 100)}%
                  </p>
                )}
              </div>

              <label className="flex items-center mt-4 p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={assumptions.fcfConfirm}
                  onChange={(e) =>
                    setAssumptions((prev) => ({
                      ...prev,
                      fcfConfirm: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700">
                  ✓ I confirm this FCF estimate is realistic for my business
                </span>
              </label>
            </div>

            {/* Risk Factors */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                4. Business Risk Factors
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Each checked factor adds 0.5% to your discount rate. This reflects higher risk.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {riskFactorsList.map((factor) => (
                  <label
                    key={factor.id}
                    className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={assumptions.riskFactors.includes(factor.id)}
                      onChange={() => handleRiskFactorToggle(factor.id)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 text-sm text-gray-700">{factor.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Risk Adjustment:</strong> +{riskAdjustment.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* WACC Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-2 border-blue-500">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Your Final Discount Rate (WACC)
              </h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Base Sector Rate ({formData.sector ? KENYAN_SECTOR_PROFILES[formData.sector]?.sector : 'Unknown'}):</span>
                  <span className="font-semibold">{baseWACC.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Leverage Adjustment (Debt/Assets):</span>
                  <span className="font-semibold">+{leverageAdjustment.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Factor Adjustment:</span>
                  <span className="font-semibold">+{riskAdjustment.toFixed(1)}%</span>
                </div>
                <div className="border-t-2 border-blue-300 pt-2 flex justify-between">
                  <span className="font-bold text-blue-900">Final WACC:</span>
                  <span className="text-2xl font-bold text-blue-900">{finalWACC.toFixed(1)}%</span>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                This reflects your business's risk profile within Kenya's market context.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700"
              >
                Calculate Valuation with These Assumptions
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-400 text-white font-semibold py-3 rounded-lg hover:bg-gray-500"
              >
                Back to Edit
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AssumptionCheckPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssumptionCheckForm />
    </Suspense>
  );
}
