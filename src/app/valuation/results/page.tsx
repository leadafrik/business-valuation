'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

interface Scenario {
  assumptions: {
    wacc: number;
    terminalGrowth: number;
  };
  weightedValue: number;
}

interface ValueDriver {
  action: string;
  impact: number;
}

interface ValuationResult {
  scenarios: {
    conservative: Scenario;
    base: Scenario;
    upside: Scenario;
  };
  valueDrivers: ValueDriver[];
  finalValuation: number;
  sector: string;
  id: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [emailingSending, setEmailSending] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const valuationId = searchParams.get('id');
      if (!valuationId) {
        router.push('/valuation/new');
        return;
      }

      try {
        const response = await fetch(`/api/valuations/${valuationId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          router.push('/valuation/new');
        }
      } catch (error) {
        console.error('Failed to fetch valuation:', error);
        router.push('/valuation/new');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, router]);

  const handleDownloadPDF = async () => {
    if (!data?.id) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/valuations/${data.id}/download-pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `valuation-${data.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleEmailPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.id || !emailAddress) return;

    setEmailSending(true);
    try {
      const response = await fetch(`/api/valuations/${data.id}/email-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress }),
      });

      if (response.ok) {
        setShowEmailModal(false);
        setEmailAddress('');
        alert('PDF sent successfully!');
      } else {
        alert('Failed to send PDF');
      }
    } catch (error) {
      console.error('Failed to email PDF:', error);
      alert('Error sending PDF');
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your valuation...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red-600">Failed to load valuation results</p>
        <Link href="/valuation/new" className="text-blue-600 hover:underline mt-4 inline-block">
          Start new valuation
        </Link>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const scenarios = data.scenarios;
  const conservative = scenarios.conservative.weightedValue;
  const base = scenarios.base.weightedValue;
  const upside = scenarios.upside.weightedValue;

  const conservativeWACC = scenarios.conservative.assumptions.wacc;
  const baseWACC = scenarios.base.assumptions.wacc;
  const upsideWACC = scenarios.upside.assumptions.wacc;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Valuation Results</h1>
        <p className="text-slate-600 mt-2">
          Business Valuation Assessment for {data.sector.charAt(0).toUpperCase() + data.sector.slice(1)} Sector
        </p>
      </div>

      {/* 3-Scenario Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Conservative Scenario */}
        <div className="bg-white rounded-lg shadow-lg border-l-4 border-orange-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Conservative</h2>
            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
              Bank View
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">Valuation Range</p>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(conservative)}
            </p>
          </div>
          <div className="bg-orange-50 rounded p-3 text-sm">
            <p className="text-slate-700">
              <span className="font-semibold">WACC:</span> {(conservativeWACC * 100).toFixed(1)}%
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Assumes higher risk, lower growth
            </p>
          </div>
        </div>

        {/* Base Scenario */}
        <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-6 md:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Base Case</h2>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              Market View
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">Most Likely Value</p>
            <p className="text-4xl font-bold text-blue-600">
              {formatCurrency(base)}
            </p>
          </div>
          <div className="bg-blue-50 rounded p-3 text-sm">
            <p className="text-slate-700">
              <span className="font-semibold">WACC:</span> {(baseWACC * 100).toFixed(1)}%
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Based on your inputs and sector profile
            </p>
          </div>
        </div>

        {/* Upside Scenario */}
        <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Upside</h2>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              Buyer View
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">Strategic Premium</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(upside)}
            </p>
          </div>
          <div className="bg-green-50 rounded p-3 text-sm">
            <p className="text-slate-700">
              <span className="font-semibold">WACC:</span> {(upsideWACC * 100).toFixed(1)}%
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Includes synergies and buyer premium
            </p>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-slate-900 mb-3">What Do These Ranges Mean?</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>
            <span className="font-semibold text-orange-600">Conservative:</span> What a bank might lend against (most cautious view)
          </li>
          <li>
            <span className="font-semibold text-blue-600">Base Case:</span> Your realistic valuation based on current performance
          </li>
          <li>
            <span className="font-semibold text-green-600">Upside:</span> What a strategic buyer might pay with synergies
          </li>
        </ul>
      </div>

      {/* Value Drivers Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">How to Increase Your Valuation</h2>
        <p className="text-slate-600 mb-6">
          These sector-specific actions can materially increase your business value:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.valueDrivers.map((driver, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900 flex-1">{driver.action}</p>
                <div className="ml-4 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                  +{driver.impact}%
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Estimated impact on enterprise value
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Sensitivity to Discount Rate (WACC)</h2>
        <p className="text-slate-600 mb-6">
          How small changes in discount rate affect valuation:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Scenario</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">WACC</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Valuation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-3 text-slate-900">Conservative</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">{(conservativeWACC * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(conservative)}</td>
              </tr>
              <tr className="bg-blue-50 border-b border-slate-200">
                <td className="px-4 py-3 text-slate-900">Base Case</td>
                <td className="px-4 py-3 text-blue-600 font-semibold">{(baseWACC * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-slate-900 font-bold">{formatCurrency(base)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-900">Upside</td>
                <td className="px-4 py-3 text-green-600 font-semibold">{(upsideWACC * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(upside)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white mb-8">
        <h3 className="text-2xl font-bold mb-4">Next Steps</h3>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start">
            <span className="mr-3 text-2xl">✓</span>
            <span>Download or email this valuation to share with lenders or investors</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-2xl">✓</span>
            <span>Focus on the value drivers above to improve your enterprise value</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-2xl">✓</span>
            <span>Use the base case for fundraising, the conservative for lending</span>
          </li>
        </ul>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? 'Downloading...' : '📥 Download PDF'}
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-blue-500 hover:bg-blue-400 font-semibold px-6 py-2 rounded transition"
          >
            ✉️ Email PDF
          </button>
          <Link
            href="/valuation/new"
            className="bg-blue-500 hover:bg-blue-400 font-semibold px-6 py-2 rounded transition text-center"
          >
            ➕ New Valuation
          </Link>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Email Valuation Report</h3>
            <form onSubmit={handleEmailPDF} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={emailingSending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
                >
                  {emailingSending ? 'Sending...' : 'Send PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailAddress('');
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-slate-600 border-t border-slate-300 pt-8">
        <p>
          This valuation is based on your inputs and industry benchmarks for Kenya's {data.sector} sector.
        </p>
        <p className="mt-2">
          For questions or refinement, <Link href="/" className="text-blue-600 hover:underline">contact support</Link>.
        </p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
