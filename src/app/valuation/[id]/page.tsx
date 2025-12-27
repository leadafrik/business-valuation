'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function ValuationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    // Redirect to results page with the ID
    router.replace(`/valuation/results?id=${id}`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your valuation results...</p>
      </div>
    </div>
  );
}

