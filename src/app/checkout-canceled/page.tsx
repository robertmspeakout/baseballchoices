"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

export default function CheckoutCanceledPage() {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setRedirecting(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setRedirecting(false);
        return;
      }

      window.location.replace(data.url);
    } catch {
      setError("Network error. Please check your connection.");
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-start justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-3">
            You&apos;ve cancelled your subscription process.
          </h1>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-6">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-3 mt-6">
            <button
              onClick={handleSubscribe}
              disabled={redirecting}
              className="w-full px-4 py-3.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {redirecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Redirecting to checkout...
                </span>
              ) : (
                "Go Back & Subscribe"
              )}
            </button>
            <Link
              href="/"
              className="block w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors text-center"
            >
              Continue with a Free Trial
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
