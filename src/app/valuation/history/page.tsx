"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Valuation {
  id: string;
  businessName: string;
  sector: string;
  valuationValue: number;
  createdAt: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ValuationHistory() {
  const { status } = useSession();
  const router = useRouter();
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    async function fetchValuations() {
      try {
        const res = await fetch("/api/valuations");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load valuations");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setValuations(data);
      } catch (err) {
        setError("Failed to load valuations");
      } finally {
        setLoading(false);
      }
    }

    fetchValuations();
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container py-6">
          <h1 className="text-2xl font-bold text-gray-800">My Valuations</h1>
        </div>
      </header>

      <main className="container py-10">
        {loading && <p>Loading valuations...</p>}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!loading && !error && valuations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-700 mb-4">
              You have not created any valuations yet.
            </p>
            <Link
              href="/valuation/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Valuation
            </Link>
          </div>
        )}

        {!loading && !error && valuations.length > 0 && (
          <div className="bg-white rounded-lg shadow divide-y">
            {valuations.map((valuation) => (
              <div key={valuation.id} className="p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {valuation.businessName}
                  </h2>
                  <p className="text-sm text-gray-600">{valuation.sector}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(valuation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(valuation.valuationValue)}
                  </p>
                  <Link
                    href={`/valuation/${valuation.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
