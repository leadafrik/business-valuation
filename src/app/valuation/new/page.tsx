"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { KENYAN_SECTOR_PROFILES } from "@/lib/valuation/sectorData";

const sectors = Object.keys(KENYAN_SECTOR_PROFILES);

export default function NewValuation() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoWACC, setAutoWACC] = useState(true);
  const [showWACCHelp, setShowWACCHelp] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    sector: "retail",
    annualRevenue: 0,
    ebitda: 0,
    netIncome: 0,
    freeCashFlow: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    discountRate: 0,
    terminalGrowth: 0.04,
    projectionYears: 5,
  });

  // Get auto WACC based on sector
  const getAutoWACC = () => {
    const sectorData = KENYAN_SECTOR_PROFILES[formData.sector as keyof typeof KENYAN_SECTOR_PROFILES];
    return sectorData ? Math.round(sectorData.baseDiscountRate * 100) : 20;
  };

  const discountRate = autoWACC ? getAutoWACC() : formData.discountRate;

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
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
          : parseFloat(value) || 0,
    }));
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

      if (formData.annualRevenue <= 0) {
        setError("Annual revenue must be greater than 0");
        setIsLoading(false);
        return;
      }

      // Use auto WACC if enabled, otherwise use manual
      const submitData = {
        ...formData,
        discountRate: autoWACC ? getAutoWACC() : formData.discountRate,
      };

      const res = await fetch("/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to calculate valuation");
        setIsLoading(false);
        return;
      }

      const result = await res.json();
      router.push(`/valuation/${result.id}`);
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
                    value={formData.netIncome}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Free Cash Flow (KES)
                  </label>
                  <input
                    type="number"
                    name="freeCashFlow"
                    value={formData.freeCashFlow}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Total Assets (KES)
                  </label>
                  <input
                    type="number"
                    name="totalAssets"
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
                      💡 What is WACC?
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
                      <strong>WACC (Weighted Average Cost of Capital):</strong> The discount rate used to value a business. 
                      It reflects the risk profile of your business based on the sector. Higher risk sectors have higher WACC.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Our estimate:</strong> {discountRate}% for {KENYAN_SECTOR_PROFILES[formData.sector].sector}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Enable "Auto Calculate" to use sector-specific rates, or enter your own based on your company's risk profile.
                    </p>
                  </div>
                )}

                {autoWACC ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-gray-700">
                      <strong>Auto WACC:</strong> {discountRate}% (Sector: {KENYAN_SECTOR_PROFILES[formData.sector].sector})
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
        </div>
      </main>
    </div>
  );
}
