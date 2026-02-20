"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MembershipPage() {
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState<"plan" | "payment" | "confirmation">("plan");
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));

    try {
      const res = await fetch("/api/user/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });

      if (res.ok) {
        await updateSession({ membershipActive: true });
        setStep("confirmation");
      }
    } catch {
      // Handle error
    }
    setProcessing(false);
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
          <span className="text-lg font-bold leading-none" style={{ fontFamily: "'Permanent Marker', cursive" }}>
            <span className="text-red-500">EXTRA</span><span className="text-white">BASE</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {step === "plan" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">Unlock Full Access</h2>
                <p className="text-sm text-gray-500 mt-1">One plan. Everything included.</p>
              </div>

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

                <button onClick={() => setStep("payment")} className="w-full px-4 py-3.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm">
                  Start Free Trial & Subscribe
                </button>
              </div>
            </>
          )}

          {step === "payment" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">Payment Details</h2>
                <p className="text-sm text-gray-500 mt-1">You won&apos;t be charged for 5 days</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input type="text" defaultValue="4242 4242 4242 4242" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                      <input type="text" defaultValue="12/28" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                      <input type="text" defaultValue="123" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                    <input type="text" defaultValue="Test User" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 mb-6">
                  <p className="text-xs text-amber-700 font-medium">This is a demo payment form. No real transaction will be processed.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("plan")} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">
                    Back
                  </button>
                  <button onClick={handlePurchase} disabled={processing} className="flex-1 px-4 py-3 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                        Processing...
                      </span>
                    ) : "Pay $19.99/year"}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "confirmation" && (
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome to ExtraBase!</h2>
              <p className="text-sm text-gray-500 mb-8">Your full membership is now active. You have unlimited access to all features.</p>

              <div className="space-y-3">
                <Link href="/" className="block px-4 py-3 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                  Explore Programs
                </Link>
                <Link href="/match" className="block px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                  Find My Matches
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
