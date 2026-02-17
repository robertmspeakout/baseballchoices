"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { loadProfile, loadPreferences, isProfileComplete, type PlayerProfile, type PlayerPreferences } from "@/lib/playerProfile";
import { getMatchResults, type MatchResult } from "@/lib/matchingEngine";
import { geocodeZip } from "@/lib/geo";
import { getAllUserData, setUserData, type UserData } from "@/lib/userData";
import schoolsData from "@/data/schools.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const allSchools = schoolsData as any[];

function SchoolLogo({ school }: { school: any }) {
  const [error, setError] = useState(false);
  if (school.logo_url && !error) {
    return (
      <img
        src={school.logo_url}
        alt=""
        className="w-10 h-10 object-contain"
        onError={() => setError(true)}
      />
    );
  }
  return (
    <span className="text-sm font-bold text-gray-400">
      {school.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-yellow-500" : score >= 40 ? "text-orange-500" : "text-red-400";
  const bgColor = score >= 80 ? "text-emerald-100" : score >= 60 ? "text-yellow-100" : score >= 40 ? "text-orange-100" : "text-red-100";

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="4" className={`stroke-current ${bgColor}`} />
        <circle
          cx="24" cy="24" r={radius} fill="none" strokeWidth="4"
          className={`stroke-current ${color}`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-black ${color}`}>{score}</span>
      </div>
    </div>
  );
}

function StarRatingInline({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(value === star ? 0 : star); }}
          className="focus:outline-none"
        >
          <svg
            className={`w-5 h-5 ${star <= value ? "text-yellow-400" : "text-gray-200"} hover:text-yellow-300 transition-colors`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function MatchPage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [prefs, setPrefs] = useState<PlayerPreferences | null>(null);
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [userData, setUserDataState] = useState<Record<string, UserData>>({});
  const [showCount, setShowCount] = useState(10);
  const [showAll, setShowAll] = useState(false);

  // Load profile and preferences
  useEffect(() => {
    const p = loadProfile();
    const pr = loadPreferences();
    setProfile(p);
    setPrefs(pr);
    setUserDataState(getAllUserData());

    // Geocode zip
    if (p.zipCode) {
      setGeocoding(true);
      // Check localStorage cache first
      const cached = localStorage.getItem("nextbase_homeZip");
      if (cached) {
        try {
          const c = JSON.parse(cached);
          if (c.zip === p.zipCode && c.lat && c.lng) {
            setHomeCoords({ lat: c.lat, lng: c.lng });
            setGeocoding(false);
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }
      geocodeZip(p.zipCode).then((coords) => {
        if (coords) {
          setHomeCoords(coords);
          localStorage.setItem("nextbase_homeZip", JSON.stringify({ zip: p.zipCode, ...coords }));
        }
        setGeocoding(false);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Run matching
  const results = useMemo(() => {
    if (!profile || !prefs) return [];
    return getMatchResults(allSchools, profile, prefs, homeCoords);
  }, [profile, prefs, homeCoords]);

  const visibleResults = results.slice(0, showCount);

  const handlePriorityChange = (schoolId: number, priority: number) => {
    setUserData(schoolId, { priority });
    setUserDataState((prev) => ({
      ...prev,
      [schoolId]: {
        ...(prev[schoolId] || { priority: 0, notes: "", last_contacted: null }),
        priority,
      },
    }));
  };

  // Redirect if no profile
  if (!loading && profile && !isProfileComplete(profile)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile First</h2>
          <p className="text-gray-600 mb-6">
            Tell us about yourself and what you&apos;re looking for so we can find your best-fit programs.
          </p>
          <Link
            href="/auth/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Build My Profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  if (loading || geocoding) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600" />
        <p className="text-gray-600 font-medium">Finding your best matches...</p>
      </div>
    );
  }

  // Summary of active preferences for the header
  const prefSummary: string[] = [];
  if (prefs) {
    if (prefs.divisionPreference !== "both") prefSummary.push(prefs.divisionPreference);
    if (prefs.maxDistanceFromHome) prefSummary.push(`Within ${prefs.maxDistanceFromHome} mi`);
    if (prefs.maxTuition) prefSummary.push(`Under $${(prefs.maxTuition / 1000).toFixed(0)}K`);
    if (prefs.schoolSize !== "any") prefSummary.push(`${prefs.schoolSize} school`);
    if (prefs.competitiveness !== "any") prefSummary.push(prefs.competitiveness === "top25" ? "Top 25" : "Postseason");
    if (prefs.preferredStates.length > 0) prefSummary.push(`${prefs.preferredStates.length} states`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 top-0 bottom-0 w-2/5 bg-gradient-to-l from-red-600/25 to-transparent skew-x-[-8deg]" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-white/60 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <span className="text-xs font-black text-white" style={{ fontStyle: "italic" }}>NB</span>
              </div>
              <span className="text-sm font-bold tracking-tight">Next<span className="text-red-400">Base</span></span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Your Top Matches
          </h1>
          {profile?.playerName && (
            <p className="text-white/60 mt-1">
              {results.length} programs matched for <span className="text-white font-semibold">{profile.playerName}</span>
            </p>
          )}

          {/* Preference pills */}
          {prefSummary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {prefSummary.map((p, i) => (
                <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/10">
                  {p}
                </span>
              ))}
              <Link
                href="/auth/profile"
                className="px-3 py-1 bg-red-600/30 backdrop-blur-sm rounded-full text-xs font-semibold border border-red-400/30 text-red-300 hover:bg-red-600/50 transition-colors"
              >
                Edit Preferences
              </Link>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
      </header>

      {/* Results */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Matches Found</h3>
            <p className="text-gray-600 mb-4">
              Try broadening your preferences — select &quot;Both&quot; for divisions, remove state restrictions, or increase your distance range.
            </p>
            <Link
              href="/auth/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Edit Preferences
            </Link>
          </div>
        ) : (
          <>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  {showAll ? "All Matches" : "Your Top 10 Matches"}
                </h2>
                <p className="text-sm text-gray-500">
                  {showAll
                    ? `${results.length} programs ranked by fit`
                    : `${results.length} total programs matched`}
                </p>
              </div>
              <Link
                href="/auth/profile"
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Edit Preferences
              </Link>
            </div>

            {/* Match cards */}
            <div className="grid gap-3">
              {visibleResults.map((match, idx) => {
                const s = match.school;
                const ud = userData[s.id];
                const priority = ud?.priority || 0;

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
                  >
                    <Link href={`/school/${s.id}`} className="block p-4">
                      <div className="flex items-start gap-3">
                        {/* Rank + Score */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">#{idx + 1}</span>
                          <ScoreRing score={match.score} />
                        </div>

                        {/* Logo */}
                        <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                          <SchoolLogo school={s} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {s.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {s.mascot ? `${s.mascot} · ` : ""}{s.city}, {s.state}
                              </p>
                            </div>
                            {s.current_ranking && (
                              <span className="shrink-0 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                #{s.current_ranking}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              s.division === "D1" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}>
                              {s.division === "D1" ? "D-I" : "D-II"}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{s.conference}</span>
                            {match.distance != null && (
                              <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                                {match.distance.toLocaleString()} mi
                              </span>
                            )}
                            {s.tuition && (
                              <span className="text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full font-medium">
                                ${(s.tuition / 1000).toFixed(0)}K/yr
                              </span>
                            )}
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                              {s.public_private}
                            </span>
                          </div>

                          {/* Match reasons */}
                          {match.reasons.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                              {match.reasons.map((r, i) => (
                                <span key={i} className="text-xs text-gray-600 flex items-center gap-1">
                                  <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Rating strip */}
                    <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <StarRatingInline value={priority} onChange={(v) => handlePriorityChange(s.id, v)} />
                        {priority > 0 && (
                          <span className="text-xs text-gray-500 font-medium">
                            {["", "Mildly Interested", "Interested", "Very Interested", "Top Choice", "VIP Choice"][priority]}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/school/${s.id}`}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* See All / Load More */}
            {!showAll && results.length > 10 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => { setShowAll(true); setShowCount(50); }}
                  className="px-8 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm"
                >
                  See All {results.length} Matches
                </button>
              </div>
            )}
            {showAll && showCount < results.length && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowCount((c) => c + 50)}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Show More ({results.length - showCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <span className="text-[8px] font-black text-white" style={{ fontStyle: "italic" }}>NB</span>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">NEXTBASE</span>
          </Link>
          <p className="text-xs text-gray-500">Data for informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
