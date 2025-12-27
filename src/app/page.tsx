"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 container">
        <h1 className="text-2xl font-bold text-white">ValuateKE</h1>
        <div className="space-x-4">
          <Link href="/auth/signin" className="text-white hover:text-blue-200">
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container text-center text-white py-20">
        <h2 className="text-5xl font-bold mb-6">
          Value Your SME Like a Pro
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Professional business valuation methods tailored for Kenyan SMEs.
          DCF, Comparable, Asset-based, and Multiple valuations in minutes.
        </p>
        <Link
          href="/auth/signup"
          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 inline-block"
        >
          Get Started Free
        </Link>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="container">
          <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <h4 className="text-xl font-semibold mb-4">📊 Multiple Methods</h4>
              <p>DCF, Comparable Transactions, Asset-based, and Multiples</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h4 className="text-xl font-semibold mb-4">🇰🇪 Kenya-Specific</h4>
              <p>Sector data and risk adjustments for Kenyan market dynamics</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h4 className="text-xl font-semibold mb-4">📄 Reports</h4>
              <p>Generate professional PDF reports with full methodology</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
