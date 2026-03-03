"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function MembershipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
      </div>
    }>
      <MembershipContent />
    </Suspense>
  );
}

function MembershipContent() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  // Check for return from Stripe
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  // If returned from successful checkout, refresh session to pick up membershipActive
  useEffect(() => {
    if (success) {
      updateSession({ membershipActive: true });
    }
  }, [success, updateSession]);

  const handleCheckout = async () => {
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

      // Redirect to Stripe-hosted Checkout
      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection.");
      setRedirecting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to manage your membership.</p>
          <Link href="/auth/login?callbackUrl=/membership" className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-950 text-white">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-lg font-bold leading-none" style={{ fontFamily: "var(--font-marker)" }}>
            <span className="text-red-500">EXTRA</span><span className="text-white">BASE</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">

          {/* Success — returned from Stripe after payment */}
          {success && (
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome to ExtraBase!</h2>
              <p className="text-sm text-gray-500 mb-8">Your membership is now active. You have unlimited access to all features.</p>

              <div className="space-y-3">
                <Link href="/" className="block px-4 py-3 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                  Explore Programs
                </Link>
                <Link href="/ai-match" className="block px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                  Try AI Scout
                </Link>
              </div>
            </div>
          )}

          {/* Canceled — user backed out of Stripe */}
          {canceled && (
            <div className="text-center mb-8">
              <div className="mx-auto w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-1">No worries!</h2>
              <p className="text-sm text-gray-500 mb-6">Your checkout was canceled. You can try again whenever you&apos;re ready.</p>
            </div>
          )}

          {/* Plan selection (default view, or shown again after cancel) */}
          {!success && (
            <>
              {!canceled && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-gray-900">Unlock Full Access</h2>
                  <p className="text-sm text-gray-500 mt-1">One plan. Everything included.</p>
                </div>
              )}

              <div className="bg-white rounded-2xl border-2 border-[#CC0000] p-6 shadow-lg">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-gray-900">$19.99</span>
                  <span className="text-sm text-gray-500">/year</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">ExtraBase Full Access</h3>

                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm font-semibold text-green-800">Includes 5-day risk-free trial</p>
                  <p className="text-xs text-green-600 mt-0.5">Cancel anytime during your trial — no charge.</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    "Full access to 927+ college baseball programs",
                    "AI-powered program matching",
                    "Unlimited school tracking & notes",
                    "Coach contact information",
                    "Academic & tuition comparisons",
                    "Recruiting status management",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={redirecting}
                  className="w-full px-4 py-3.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {redirecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      Redirecting to checkout...
                    </span>
                  ) : "Start Free Trial & Subscribe"}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-gray-400">Secure checkout powered by Stripe</p>
                </div>
              </div>

              {session.user.membershipActive && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-blue-800 font-semibold">You already have an active membership!</p>
                  <Link href="/auth/account" className="text-sm text-blue-600 underline mt-1 inline-block">
                    Manage your account
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
