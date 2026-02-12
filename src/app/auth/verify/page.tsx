"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newCode[i] = pasted[i];
      }
      setCode(newCode);
      const nextEmpty = Math.min(pasted.length, 5);
      inputRefs.current[nextEmpty]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/auth/profile";
    }, 1200);
  };

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
        <p className="text-sm text-gray-500 mt-2">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-gray-700">{email || "your email"}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter verification code
          </label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              Verifying...
            </span>
          ) : (
            "Verify Email"
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          Didn&apos;t receive the code?{" "}
          {resent ? (
            <span className="text-green-600 font-medium">Code resent!</span>
          ) : (
            <button onClick={handleResend} className="text-blue-600 hover:text-blue-800 font-medium">
              Resend code
            </button>
          )}
        </p>
      </div>

      <div className="text-center mt-4">
        <Link href="/auth/register" className="text-sm text-gray-400 hover:text-gray-600">
          Use a different email
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-950 text-white">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/auth/register" className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold">NextBase</h1>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600" />}>
          <VerifyForm />
        </Suspense>
      </main>
    </div>
  );
}
