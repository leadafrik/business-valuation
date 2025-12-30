"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // TEMPORARY: Auth check disabled for development
  // if (status === "unauthenticated") {
  //   router.push("/auth/signin");
  //   return null;
  // }

  // if (status === "loading") {
  //   return <div className="text-center py-10">Loading...</div>;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome, {session?.user?.name}</p>
              <a
                href="/api/auth/signout"
                className="text-sm text-blue-600 hover:underline"
              >
                Sign out
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">New Valuation</h2>
            <p className="text-gray-600 mb-6">
              Start a new business valuation using DCF, comparable multiples, or
              asset-based methods tailored to your sector.
            </p>
            <Link
              href="/valuation/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Valuation
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">My Valuations</h2>
            <p className="text-gray-600 mb-6">
              View, edit, and download reports for all your previous
              valuations.
            </p>
            <Link
              href="/valuation/history"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              View History
            </Link>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">1. Choose Your Sector</h3>
              <p className="text-gray-600">
                Select from retail, hospitality, agribusiness, tech,
                manufacturing, or services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                2. Enter Financial Data
              </h3>
              <p className="text-gray-600">
                Provide revenue, EBITDA, assets, and other relevant metrics.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">3. Get Results</h3>
              <p className="text-gray-600">
                Receive multiple valuation methods with Kenya-specific risk
                adjustments.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">4. Download Report</h3>
              <p className="text-gray-600">
                Export a professional PDF report with full methodology.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
