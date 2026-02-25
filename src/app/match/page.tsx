"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SearchOverlay from "@/components/SearchOverlay";
import PillNav from "@/components/PillNav";
import ProgramRow from "@/components/ProgramRow";
import AuthGate from "@/components/AuthGate";
import { loadProfile, loadPreferences, isProfileComplete, type PlayerProfile, type PlayerPreferences } from "@/lib/playerProfile";
import { getMatchResults, type MatchResult } from "@/lib/matchingEngine";
import { geocodeZip } from "@/lib/geo";
import { getAllUserData, setUserData, type UserData } from "@/lib/userData";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
        <PillNav
          value="match"
          options={[
            { value: "mylist", label: "My Top Programs" },
            { value: "aiscout", label: "AI Scout" },
            { value: "D1", label: "Division I Programs" },
            { value: "D2", label: "Division II Programs" },
            { value: "D3", label: "Division III Programs" },
            { value: "JUCO", label: "JUCO Programs" },
          ]}
          onSelect={(val) => {
            if (val === "mylist") router.push("/my-list");
            else if (val === "aiscout") router.push("/ai-match");
            else if (val === "D1") router.push("/programs/d1");
            else if (val === "D2") router.push("/programs/d2");
            else if (val === "D3") router.push("/programs/d3");
            else if (val === "JUCO") router.push("/programs/juco");
          }}
          onSearchClick={() => setSearchOverlayOpen(true)}
        />

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

            {/* Match rows */}
            <div className="flex flex-col" style={{ gap: 5 }}>
              {visibleResults.map((match, idx) => {
                const s = match.school;
                const ud = userData[s.id];
                const priority = ud?.priority || 0;

                return (
                  <ProgramRow
                    key={s.id}
                    school={{ ...s, priority }}
                    onPriorityChange={handlePriorityChange}
                    extra={
                      <div className="flex items-center gap-2 mt-[2px]">
                        <span className="text-[11px] font-bold text-emerald-600">#{idx + 1} · {match.score}% match</span>
                        {match.distance != null && (
                          <span className="text-[11px] text-[#888]">{match.distance.toLocaleString()} mi</span>
                        )}
                      </div>
                    }
                  />
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
