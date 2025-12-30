"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { KENYAN_SECTOR_PROFILES, getWACC } from "@/lib/valuation/sectorData";

const sectors = Object.keys(KENYAN_SECTOR_PROFILES);

function formatPercent(rate: number) {
  return Math.round(rate * 1000) / 10;
}

export default function NewValuation() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoWACC, setAutoWACC] = useState(true);
  const [showWACCHelp, setShowWACCHelp] = useState(false);
  const [showFCFHelper, setShowFCFHelper] = useState(false);
  const [estimatedFCF, setEstimatedFCF] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    sector: "retail",
    annualRevenue: "",
    ebitda: "",
    netIncome: "",
    freeCashFlow: "",
    totalAssets: "",
    totalLiabilities: "",
    discountRate: "",
    terminalGrowth: 0.04,
    projectionYears: 5,
  });

  // Helper to safely convert form string values to numbers
  const getNumericValue = (val: string | number): number => {
    const parsed = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(parsed) ? 0 : parsed;
  };

  const autoWACCDecimal = getWACC(formData.sector);
  const autoWACCPercent = formatPercent(autoWACCDecimal);

  // TEMPORARY: Auth check disabled for development
  // if (status === "unauthenticated") {
  //   router.push("/auth/signin");
  //   return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "businessDescription" || name === "sector" || name === "businessName"
          ? value
          : value, // Keep numeric inputs as strings for display (empty string = no value)
    }));
  };

  const handleEstimateFCF = () => {
    // Estimate FCF as NetIncome × 80% (conservative estimate)
    const netIncomeValue = getNumericValue(formData.netIncome);
    
    if (netIncomeValue > 0) {
      const estimated = netIncomeValue * 0.8;
      setEstimatedFCF(estimated);
    }
  };

  const handleUseEstimatedFCF = () => {
    if (estimatedFCF !== null) {
      setFormData((prev) => ({
        ...prev,
        freeCashFlow: estimatedFCF as any,
      }));
      setShowFCFHelper(false);
      setEstimatedFCF(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!formData.businessName.trim()) {
        setError("Business name is required");
        setIsLoading(false);
        return;
      }

      const revenueValue = getNumericValue(formData.annualRevenue);

      if (revenueValue <= 0) {
        setError("Annual revenue must be greater than 0");
        setIsLoading(false);
        return;
      }

      const discountRateValue = getNumericValue(formData.discountRate);

      if (!autoWACC && discountRateValue <= 0) {
        setError("Discount rate must be greater than 0");
        setIsLoading(false);
        return;
      }

      // Convert string form values to numbers for submission
      const submitData = {
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
        sector: formData.sector,
        annualRevenue: revenueValue,
        ebitda: getNumericValue(formData.ebitda),
        netIncome: getNumericValue(formData.netIncome),
        freeCashFlow: getNumericValue(formData.freeCashFlow),
        totalAssets: getNumericValue(formData.totalAssets),
        totalLiabilities: getNumericValue(formData.totalLiabilities),
        discountRate: autoWACC ? autoWACCDecimal : (discountRateValue / 100),
        terminalGrowth: formData.terminalGrowth,
        projectionYears: formData.projectionYears,
      };

      // Navigate to assumptions check page with encoded form data
      const encodedData = encodeURIComponent(JSON.stringify(submitData));
      router.push(`/valuation/assumptions-check?data=${encodedData}`);
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container py-6">
          <h1 className="text-2xl font-bold text-gray-800">Create Valuation</h1>
        </div>
      </header>

      {/* Form */}
      <main className="container py-10">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Info */}
            <fieldset className="border-b pb-6">
              <legend className="text-lg font-semibold text-gray-800 mb-4">
                Business Information
              </legend>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Business Description
                </label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Sector *
                </label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {KENYAN_SECTOR_PROFILES[sector].sector}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>

            {/* Financial Data */}
            <fieldset className="border-b pb-6">
              <legend className="text-lg font-semibold text-gray-800 mb-4">
                Financial Data
              </legend>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Annual Revenue (KES) *
                  </label>
                  <input
                    type="number"
                    name="annualRevenue"
                    placeholder="e.g., 50000000"
                    value={formData.annualRevenue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    EBITDA (KES)
                  </label>
                  <input
                    type="number"
                    name="ebitda"
                    placeholder="e.g., 7500000"
                    value={formData.ebitda}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Net Income (KES)
                  </label>
                  <input
                    type="number"
                    name="netIncome"
                    placeholder="e.g., 5000000"
                    value={formData.netIncome}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Free Cash Flow (KES)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="freeCashFlow"
                      placeholder="e.g., 4000000"
                      value={formData.freeCashFlow}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFCFHelper(true)}
                      className="px-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg text-sm font-semibold whitespace-nowrap"
                    >
                      Don't know?
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Total Assets (KES)
                  </label>
                  <input
                    type="number"
                    name="totalAssets"
                    placeholder="e.g., 25000000"
                    value={formData.totalAssets}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Total Liabilities (KES)
                  </label>
                  <input
                    type="number"
                    name="totalLiabilities"
                    placeholder="e.g., 10000000"
                    value={formData.totalLiabilities}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </fieldset>

            {/* Assumptions */}
            <fieldset className="pb-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
              <legend className="text-lg font-semibold text-gray-800 mb-4">
                Valuation Assumptions
              </legend>

              {/* WACC Section */}
              <div className="mb-6 p-4 bg-white rounded border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Discount Rate (WACC)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowWACCHelp(!showWACCHelp)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      What is WACC?
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoWACC"
                      checked={autoWACC}
                      onChange={(e) => setAutoWACC(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="autoWACC" className="text-gray-700 font-semibold">
                      Auto Calculate
                    </label>
                  </div>
                </div>

                {showWACCHelp && (
                  <div className="bg-blue-100 border-l-4 border-blue-600 p-4 mb-4 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>WACC (Weighted Average Cost of Capital):</strong>{" "}
                      The discount rate used to value a business. It reflects the
                      risk profile of your business based on the sector. Higher
                      risk sectors have higher WACC.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Our estimate:</strong> {autoWACCPercent}% for{" "}
                      {KENYAN_SECTOR_PROFILES[formData.sector].sector}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Enable "Auto Calculate" to use sector-specific rates, or
                      enter your own based on your company's risk profile.
                    </p>
                  </div>
                )}

                {autoWACC ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-gray-700">
                      <strong>Auto WACC:</strong> {autoWACCPercent}% (Sector:{" "}
                      {KENYAN_SECTOR_PROFILES[formData.sector].sector})
                    </p>
                  </div>
                ) : (
                  <input
                    type="number"
                    name="discountRate"
                    value={formData.discountRate}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Enter discount rate %"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Terminal Growth Rate
                  </label>
                  <input
                    type="number"
                    name="terminalGrowth"
                    value={formData.terminalGrowth}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">(e.g., 0.04 for 4%)</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Projection Years
                  </label>
                  <input
                    type="number"
                    name="projectionYears"
                    value={formData.projectionYears}
                    onChange={handleInputChange}
                    min="3"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </fieldset>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Calculating..." : "Calculate Valuation"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-400 text-white font-semibold py-3 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* FCF Helper Modal */}
          {showFCFHelper && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Estimate Free Cash Flow</h3>
                
                <div className="mb-6 space-y-4">
                  <div>
                    <p className="text-gray-700 font-semibold mb-2">Net Income:</p>
                    <p className="text-lg text-blue-600 font-bold">
                      {getNumericValue(formData.netIncome) > 0
                        ? `KES ${getNumericValue(formData.netIncome).toLocaleString()}`
                        : "Not provided"}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Estimation method:</strong> Net Income × 80% (conservative estimate accounting for capital expenditures and working capital changes)
                    </p>
                    {estimatedFCF !== null && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-gray-700 font-semibold mb-1">Estimated Free Cash Flow:</p>
                        <p className="text-2xl text-green-600 font-bold">
                          KES {estimatedFCF.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleEstimateFCF}
                    disabled={getNumericValue(formData.netIncome) <= 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Calculate Estimate
                  </button>
                  <button
                    type="button"
                    onClick={handleUseEstimatedFCF}
                    disabled={estimatedFCF === null}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Use This Estimate
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowFCFHelper(false);
                    setEstimatedFCF(null);
                  }}
                  className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
