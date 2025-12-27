"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Sign-in Error
        </h1>
        <p className="text-sm text-gray-600 text-center">
          {error
            ? `There was a problem signing you in: ${error}`
            : "There was a problem signing you in. Please try again."}
        </p>
        <div className="flex justify-center">
          <Link
            href="/auth/signin"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}

