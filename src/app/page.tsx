"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // TEMPORARY: Bypass auth - redirect directly to valuation form
    router.push("/valuation/new");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">ValueKE</h1>
        <p className="text-xl mb-4">Business Valuation Platform</p>
        <p className="text-sm opacity-75">(Redirecting to valuation form...)</p>
      </div>
    </div>
  );
}
