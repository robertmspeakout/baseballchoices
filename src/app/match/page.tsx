"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SearchOverlay from "@/components/SearchOverlay";
import AuthGate from "@/components/AuthGate";
import { loadProfile, loadPreferences, isProfileComplete, type PlayerProfile, type PlayerPreferences } from "@/lib/playerProfile";
import { getMatchResults, type MatchResult } from "@/lib/matchingEngine";
import { geocodeZip } from "@/lib/geo";
import { getAllUserData, setUserData, type UserData } from "@/lib/userData";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
    <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 3.5C8.5 6 9 9.5 8 13s-3.5 6-5.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M17.5 3.5C15.5 6 15 9.5 16 13s3.5 6 5.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
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
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [prefs, setPrefs] = useState<PlayerPreferences | null>(null);
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [userData, setUserDataState] = useState<Record<string, UserData>>({});
  const [showCount, setShowCount] = useState(20);
  const [showAll, setShowAll] = useState(false);
  const [userBgPic, setUserBgPic] = useState<string | null>(null);
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  // Load all schools from API
  useEffect(() => {
    async function loadSchools() {
      try {
        const firstRes = await fetch("/api/schools?pageSize=200&page=1");
        const firstData = await firstRes.json();
        let all = firstData.schools || [];
        const totalPages = firstData.pagination?.totalPages || 1;
        if (totalPages > 1) {
          const promises = [];
          for (let p = 2; p <= totalPages; p++) {
            promises.push(fetch(`/api/schools?pageSize=200&page=${p}`).then(r => r.json()));
          }
          const results = await Promise.all(promises);
          for (const r of results) {
            all = all.concat(r.schools || []);
          }
        }
        setAllSchools(all);
      } catch { /* ignore */ }
    }
    loadSchools();
  }, []);

  // Load profile and preferences (from DB if logged in, localStorage otherwise)
  useEffect(() => {
    if (status === "loading") return;

    async function loadData() {
      const localProfile = loadProfile();
      let p: PlayerProfile = localProfile;
      let pr: PlayerPreferences = loadPreferences();

      if (status === "authenticated" && session?.user) {
        try {
          const [profileRes, prefsRes] = await Promise.all([
            fetch("/api/user/profile"),
            fetch("/api/user/preferences"),
          ]);
          const dbProfile = profileRes.ok ? await profileRes.json() : null;
          const dbPrefs = prefsRes.ok ? await prefsRes.json() : null;

          if (dbProfile && dbProfile.primaryPosition) {
            const firstName = (session.user as Record<string, unknown>).firstName as string || "";
            p = {
              playerName: firstName,
              gradYear: dbProfile.gradYear?.toString() || "",
              primaryPosition: dbProfile.primaryPosition || "",
              secondaryPosition: dbProfile.secondaryPosition || "",
              city: dbProfile.city || "",
              state: dbProfile.state || "",
              zipCode: dbProfile.zipCode || "",
              highSchool: dbProfile.highSchool || "",
              travelBall: dbProfile.travelBall || "",
              profilePic: localProfile.profilePic,
              backgroundPic: localProfile.backgroundPic,
              gpa: dbProfile.gpa ? parseFloat(dbProfile.gpa) : null,
              gpaType: dbProfile.gpaType || "",
              satScore: dbProfile.satScore ? parseInt(dbProfile.satScore) : null,
              actScore: dbProfile.actScore ? parseInt(dbProfile.actScore) : null,
            };
          }

          if (dbPrefs && dbPrefs.divisionPreference) {
            pr = {
              divisionPreference: dbPrefs.divisionPreference || "both",
              maxDistanceFromHome: dbPrefs.maxDistanceFromHome || null,
              preferredRegions: dbPrefs.preferredRegions || [],
              maxTuition: dbPrefs.maxTuition || null,
              schoolSize: dbPrefs.schoolSize || "any",
              highAcademic: dbPrefs.highAcademic || false,
              competitiveness: dbPrefs.competitiveness || "any",
              draftImportance: dbPrefs.draftImportance || "no",
              preferredConferences: dbPrefs.preferredConferences || [],
              preferredTiers: dbPrefs.preferredTiers || [],
            };
          }
        } catch {
          // Fall back to localStorage data already loaded
        }
      }

      setProfile(p);
      setPrefs(pr);
      setUserDataState(getAllUserData());
      if (p.backgroundPic) setUserBgPic(p.backgroundPic);

      // Geocode zip
      if (p.zipCode) {
        setGeocoding(true);
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
    }

    loadData();
  }, [status, session]);

  // Run matching — only show 90%+ matches
  const allResults = useMemo(() => {
    if (!profile || !prefs) return [];
    return getMatchResults(allSchools, profile, prefs, homeCoords);
  }, [profile, prefs, homeCoords]);

  const results = useMemo(() => allResults.filter((r) => r.score >= 90), [allResults]);

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
    if (prefs.highAcademic) prefSummary.push("High Academic");
    if (prefs.competitiveness !== "any") prefSummary.push(prefs.competitiveness === "top25" ? "Top 25" : "Postseason");
    if (prefs.preferredRegions && prefs.preferredRegions.length > 0) {
      prefSummary.push(prefs.preferredRegions.join(", "));
    }
    if (prefs.preferredTiers && prefs.preferredTiers.length > 0) {
      prefSummary.push(prefs.preferredTiers.join(", "));
    }
  }

  return (
    <AuthGate>
    <div className="min-h-screen bg-gray-50">
      <SiteHeader backgroundImage={userBgPic || undefined} activeNav="My AI Matches" />

      {/* Results */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Section dropdown + search */}
        <div className="flex items-center border border-[#e0e0e5] bg-[#e8e8ed] rounded-[100px] hover:border-[#c0c0c5] hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all">
          <div className="relative flex-1 min-w-0">
            <select
              value="match"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "match") return;
                if (val === "mylist") router.push("/my-list");
                else if (val === "aiscout") router.push("/ai-match");
                else if (val === "D1") router.push("/programs/d1");
                else if (val === "D2") router.push("/programs/d2");
                else if (val === "D3") router.push("/programs/d3");
                else if (val === "JUCO") router.push("/programs/juco");
              }}
              className="w-full appearance-none bg-transparent px-[18px] py-[13px] pr-10 text-[14px] font-semibold text-gray-900 focus:outline-none cursor-pointer rounded-l-[100px] hover:bg-[rgba(0,0,0,0.03)] transition-colors"
            >
              <option value="mylist">My Top Programs</option>
              <option value="aiscout">AI Scout</option>
              <option value="D1">Division I Programs</option>
              <option value="D2">Division II Programs</option>
              <option value="D3">Division III Programs</option>
              <option value="JUCO">JUCO Programs</option>
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c1272d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="w-px self-stretch my-[10px] bg-[#c8c8cd]" />
          <button
            onClick={() => setSearchOverlayOpen(true)}
            className="shrink-0 w-[54px] flex items-center justify-center rounded-r-[100px] hover:bg-[rgba(0,0,0,0.03)] transition-colors self-stretch group"
            aria-label="Search"
          >
            <svg className="w-[17px] h-[17px] text-[#888] group-hover:text-[#555] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Active preference filters */}
        {prefSummary.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-700">Your Preferences</h3>
              <Link
                href="/auth/profile?step=3"
                className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                Edit Preferences
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {prefSummary.map((p, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 border border-gray-200">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No 90%+ Matches Found</h3>
            <p className="text-gray-600 mb-4">
              No programs scored 90% or higher with your current preferences. Try broadening your preferences — select &quot;Both&quot; for divisions, remove region restrictions, or adjust your tier/level settings.
            </p>
            <Link
              href="/auth/profile?step=3"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Edit Preferences
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              90% or above matches
            </p>

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
                            {["", "Mildly Interested", "Interested", "Very Interested", "Top Choice", "VIP"][priority]}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/school/${s.id}`}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        View & Edit →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* See All / Load More */}
            {!showAll && results.length > 20 && (
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

      <SearchOverlay
        open={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        schools={allSchools}
        conferences={[...new Set(allSchools.map((s: any) => s.conference).filter(Boolean))].sort() as string[]}
        activeTab="match"
      />

      <SiteFooter />
    </div>
    </AuthGate>
  );
}
