"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import SiteNav from "@/components/SiteNav";
import AuthGate from "@/components/AuthGate";

interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  trialExpiresAt: string;
  membershipActive: boolean;
  createdAt: string;
  trialActive: boolean;
  daysRemaining: number;
}

export default function AccountPage() {
  const { status } = useSession();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/account")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setAccount(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getMembershipStatus = () => {
    if (!account) return { label: "-", color: "bg-gray-100 text-gray-700" };
    if (account.membershipActive) {
      return { label: "Active Member", color: "bg-green-100 text-green-800 border-green-200" };
    }
    if (account.trialActive) {
      return { label: "Free Trial", color: "bg-blue-100 text-blue-800 border-blue-200" };
    }
    return { label: "Trial Expired", color: "bg-red-100 text-red-800 border-red-200" };
  };

  const membershipStatus = getMembershipStatus();

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="relative text-white overflow-visible z-30">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1629219644109-b4df0ab25a7b?w=1920&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
            <div className="flex items-start justify-between">
              <BrandLogo size="lg" showTagline={true} />
              <SiteNav variant="dark" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
          <h1 className="text-2xl font-black text-gray-900">My Account</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : account ? (
            <>
              {/* Account Info */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Account Information
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="px-5 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Name</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {account.firstName} {account.lastName}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {account.email}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Member Since</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(account.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Membership */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    Membership
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="px-5 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${membershipStatus.color}`}
                    >
                      {membershipStatus.label}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Plan</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {account.membershipActive ? "Premium" : "Free Trial"}
                    </span>
                  </div>
                  {account.trialActive && !account.membershipActive && (
                    <div className="px-5 py-3 flex justify-between items-center">
                      <span className="text-sm text-gray-500">Trial Expires</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(account.trialExpiresAt)}{" "}
                        <span className="text-xs text-gray-400">
                          ({account.daysRemaining} day{account.daysRemaining !== 1 ? "s" : ""}{" "}
                          remaining)
                        </span>
                      </span>
                    </div>
                  )}
                  {!account.trialActive && !account.membershipActive && (
                    <div className="px-5 py-3 flex justify-between items-center">
                      <span className="text-sm text-gray-500">Trial Expired</span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatDate(account.trialExpiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment (placeholder) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Payment Information
                  </h2>
                </div>
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-gray-400">
                    No payment method on file.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Payment options will be available when you upgrade your membership.
                  </p>
                </div>
              </div>

              {/* Quick links */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/auth/profile"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Edit Profile
                </Link>
                <Link
                  href="/#mylist"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  My Top Programs
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-500">Unable to load account information.</p>
            </div>
          )}
        </main>
      </div>
    </AuthGate>
  );
}
