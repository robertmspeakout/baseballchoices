"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "no-token">(
    token ? "verifying" : "no-token"
  );
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Verification failed.");
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        setError("Something went wrong. Please try again.");
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (resending || !email) return;
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend verification email.");
        setResending(false);
        return;
      }

      setResent(true);
      setResending(false);
      setTimeout(() => setResent(false), 5000);
    } catch {
      setError("Failed to resend. Please try again.");
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {status === "verifying" && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-300 border-t-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verifying your email...</h2>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment.</p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-sm text-gray-500 mt-2 mb-8">
            Your email has been confirmed. You&apos;re all set.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Go to ExtraBase
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">{error}</p>
          {email && (
            <div>
              {resent ? (
                <p className="text-sm text-green-600 font-medium">New verification email sent! Check your inbox.</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-block px-6 py-3 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Send New Verification Email"}
                </button>
              )}
            </div>
          )}
          <div className="mt-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              Go to ExtraBase
            </Link>
          </div>
        </div>
      )}

      {status === "no-token" && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            We sent a verification link to<br />
            <span className="font-semibold text-gray-700">{email || "your email"}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to verify your address.
          </p>
          {email && (
            <div className="mb-4">
              {resent ? (
                <p className="text-sm text-green-600 font-medium">New email sent! Check your inbox.</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Didn\u2019t receive it? Resend verification email"}
                </button>
              )}
            </div>
          )}
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            Go to ExtraBase
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-950 text-white">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-lg font-bold leading-none" style={{ fontFamily: "var(--font-marker)" }}><span className="text-red-500">EXTRA</span><span className="text-white">BASE</span></span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-600" />}>
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  );
}
