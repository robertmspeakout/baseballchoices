"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600" />
      </div>
    );
  }

  if (status === "authenticated") {
    return <>{children}</>;
  }

  // Not logged in — show gate overlay
  return (
    <div className="relative">
      <div className="overflow-hidden" style={{ maxHeight: 500 }}>
        <div className="blur-sm pointer-events-none opacity-60">
          {children}
        </div>
      </div>
      {/* Fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 text-center max-w-md mx-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-4">
            Create a free account to access all programs, AI matching, and more.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-6 py-2.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors mb-2"
          >
            Sign Up Free
          </Link>
          <div>
            <Link href="/auth/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
