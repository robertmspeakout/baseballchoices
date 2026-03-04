"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthGate from "@/components/AuthGate";
import { loadProfile } from "@/lib/playerProfile";

interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  trialExpiresAt: string;
  membershipActive: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
  trialActive: boolean;
  daysRemaining: number;
}

export default function AccountPage() {
  const { status } = useSession();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBgPic, setUserBgPic] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (p.backgroundPic) setUserBgPic(p.backgroundPic);
  }, []);

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
        <SiteHeader backgroundImage={userBgPic || undefined} />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
          <h1 className="text-2xl font-black text-gray-900">My Account</h1>

          {/* Upgrade banner for non-members */}
          {!loading && account && !account.membershipActive && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              <div className="px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#CC0000] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {account.trialActive
                        ? `${account.daysRemaining} day${account.daysRemaining !== 1 ? "s" : ""} left on your free trial`
                        : "Your free trial has expired"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Upgrade to Premium for $19.99/year — full access to 927+ programs, AI matching, and more.
                    </p>
                  </div>
                </div>
                <Link
                  href="/membership"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CC0000] text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Upgrade Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          )}

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

              {/* Payment & Billing */}
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
                    Payment & Billing
                  </h2>
                </div>
                {account.membershipActive ? (
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-bold text-green-700">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Subscription Active
                      </span>
                      <span className="text-xs text-gray-400">$24.99/year</span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/stripe/portal", { method: "POST" });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                        } catch {
                          // Portal not available — may not have stripeCustomerId yet
                        }
                      }}
                      className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage Billing
                    </button>
                    <p className="text-[11px] text-gray-400 text-center">Update payment method, view invoices, or cancel via Stripe</p>
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-gray-500 mb-3">
                      No active subscription.
                    </p>
                    <Link
                      href="/membership"
                      className="inline-block px-5 py-2.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                      Subscribe Now
                    </Link>
                  </div>
                )}
              </div>

              {/* Preferences */}
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Preferences
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Program alerts</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Get notified about scores, games, and news for your top-rated programs
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!account) return;
                        const newVal = !account.notificationsEnabled;
                        setAccount({ ...account, notificationsEnabled: newVal });
                        try {
                          await fetch("/api/user/account", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ notificationsEnabled: newVal }),
                          });
                        } catch {
                          // Revert on error
                          setAccount({ ...account, notificationsEnabled: !newVal });
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        account?.notificationsEnabled ? "bg-red-600" : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={account?.notificationsEnabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                          account?.notificationsEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
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
              </div>

              {/* Cancel account */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
                >
                  Cancel my account
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-500">Unable to load account information.</p>
            </div>
          )}
        </main>

        {/* Cancel account confirmation modal */}
        {showCancelConfirm && account && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Your Account?</h3>
              </div>

              <div className="space-y-3 mb-5">
                {account.trialActive && !account.membershipActive && (
                  <p className="text-sm text-gray-600">
                    You have <span className="font-bold text-gray-900">{account.daysRemaining} day{account.daysRemaining !== 1 ? "s" : ""}</span> remaining on your free trial.
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  If you cancel, your account and all associated data will be permanently deleted, including:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 pl-4">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 shrink-0">&bull;</span>
                    Your player profile and preferences
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 shrink-0">&bull;</span>
                    Your saved programs and recruiting notes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 shrink-0">&bull;</span>
                    All AI Scout conversations and results
                  </li>
                </ul>
                <p className="text-sm text-gray-600">
                  You will lose access to ExtraBase immediately. You can always sign up again with a new account.
                </p>
              </div>

              {cancelError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-red-700">{cancelError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCancelConfirm(false); setCancelError(""); }}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Keep my account
                </button>
                <button
                  onClick={async () => {
                    setCancelling(true);
                    setCancelError("");
                    try {
                      const res = await fetch("/api/user/account", { method: "DELETE" });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        setCancelError(data.error || "Something went wrong. Please try again.");
                        setCancelling(false);
                        return;
                      }
                      // Clear local data
                      localStorage.clear();
                      sessionStorage.clear();
                      // Sign out and redirect to home
                      await signOut({ callbackUrl: "/" });
                    } catch {
                      setCancelError("Network error. Please check your connection and try again.");
                      setCancelling(false);
                    }
                  }}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {cancelling ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      Cancelling...
                    </span>
                  ) : (
                    "Yes, cancel my account"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <SiteFooter />
      </div>
    </AuthGate>
  );
}
