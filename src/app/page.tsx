"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import SearchFilters from "@/components/SearchFilters";
import SchoolTable from "@/components/SchoolTable";
import schoolsData from "@/data/schools.json";
import { getAllUserData, setUserData, type UserData } from "@/lib/userData";
import { haversineDistance, geocodeZip } from "@/lib/geo";

interface School {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  division: string;
  public_private: string;
  conference: string;
  current_ranking: number | null;
  tuition: number | null;
  instagram: string | null;
  x_account: string | null;
  head_coach_name: string | null;
  head_coach_email: string | null;
  assistant_coach_name: string | null;
  assistant_coach_email: string | null;
  website: string | null;
  last_season_record: string | null;
  logo_url: string | null;
}

interface Filters {
  search: string;
  division: string;
  state: string;
  conference: string;
  publicPrivate: string;
  zip: string;
}

const TABS_BASE = [
  { key: "D1", label: "Division I" },
  { key: "D2", label: "Division II" },
] as const;
type TabKey = "home" | "mylist" | "D1" | "D2";

const PAGE_SIZE = 50;
const allSchools = schoolsData as School[];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("ranking");
  const [sortDir, setSortDir] = useState("asc");
  const [distances, setDistances] = useState<Record<number, number> | null>(null);
  const [userData, setUserDataState] = useState<Record<string, UserData>>({});
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    division: "",
    state: "",
    conference: "",
    publicPrivate: "",
    zip: "",
  });

  // Load user data from localStorage on mount
  useEffect(() => {
    setUserDataState(getAllUserData());
    setMounted(true);
  }, []);

  // Count rated programs
  const ratedCount = useMemo(() => {
    return Object.values(userData).filter((ud) => ud.priority > 0).length;
  }, [userData]);

  // If user is on "mylist" but has no rated programs, redirect to home
  useEffect(() => {
    if (activeTab === "mylist" && ratedCount === 0) {
      handleTabChange("home");
    }
  }, [ratedCount, activeTab]);

  // Compute filter options from data
  const filterOptions = useMemo(() => {
    const states = [...new Set(allSchools.map((s) => s.state).filter(Boolean))].sort();
    const conferences = [...new Set(allSchools.map((s) => s.conference).filter(Boolean))].sort();
    const divisions = [...new Set(allSchools.map((s) => s.division))].sort();
    // Per-division conference lists
    const divisionConferences: Record<string, string[]> = {};
    for (const div of divisions) {
      divisionConferences[div] = [...new Set(allSchools.filter((s) => s.division === div).map((s) => s.conference).filter(Boolean))].sort();
    }
    return { states, conferences, divisions, divisionConferences };
  }, []);

  // Merge schools with user data
  const schoolsWithUserData = useMemo(() => {
    return allSchools.map((school) => {
      const ud = userData[school.id] || { priority: 0, notes: "", last_contacted: null };
      return { ...school, priority: ud.priority, notes: ud.notes, last_contacted: ud.last_contacted, last_season_record: school.last_season_record, logo_url: school.logo_url };
    });
  }, [userData]);

  // Build the tabs list — "My Top Programs" only shows when user has rated programs
  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string }[] = [];
    if (ratedCount > 0) {
      list.push({ key: "mylist", label: "My Top Programs" });
    }
    list.push(...TABS_BASE);
    return list;
  }, [ratedCount]);

  // Get the base list based on active tab
  const baseList = useMemo(() => {
    if (activeTab === "home") {
      // Home page: Top 25 D1 programs
      return schoolsWithUserData
        .filter((s) => s.current_ranking != null && s.division === "D1")
        .sort((a, b) => (a.current_ranking || 999) - (b.current_ranking || 999))
        .slice(0, 25);
    }
    if (activeTab === "mylist") {
      // Only rated programs
      return schoolsWithUserData.filter((s) => s.priority > 0);
    }
    // Division tabs
    return schoolsWithUserData.filter((s) => s.division === activeTab);
  }, [activeTab, schoolsWithUserData]);

  // Filter — when searching, always search the full database
  const filtered = useMemo(() => {
    const source = filters.search ? schoolsWithUserData : baseList;
    return source.filter((school) => {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const searchable = [school.name, school.city, school.state, school.conference, school.head_coach_name, school.mascot]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      if (filters.state && school.state !== filters.state) return false;
      if (filters.conference && school.conference !== filters.conference) return false;
      if (filters.publicPrivate && school.public_private !== filters.publicPrivate) return false;
      return true;
    });
  }, [baseList, schoolsWithUserData, filters]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: string | number | null, bVal: string | number | null;
      switch (sortBy) {
        case "name": aVal = a.name; bVal = b.name; break;
        case "state": aVal = a.state; bVal = b.state; break;
        case "conference": aVal = a.conference; bVal = b.conference; break;
        case "ranking": aVal = a.current_ranking; bVal = b.current_ranking; break;
        case "record": aVal = a.last_season_record; bVal = b.last_season_record; break;
        case "priority": aVal = a.priority; bVal = b.priority; break;
        case "last_contacted": aVal = a.last_contacted; bVal = b.last_contacted; break;
        case "distance":
          aVal = distances?.[a.id] ?? null;
          bVal = distances?.[b.id] ?? null;
          break;
        default: aVal = a.name; bVal = b.name;
      }
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortBy, sortDir, distances]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters/tab change
  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, sortDir, activeTab]);

  // Set default sort when switching tabs
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "home") {
      setSortBy("ranking");
      setSortDir("asc");
    } else if (tab === "mylist") {
      setSortBy("priority");
      setSortDir("desc");
    } else {
      setSortBy("name");
      setSortDir("asc");
    }
    setFilters((f) => ({ ...f, search: "", state: "", conference: "", publicPrivate: "" }));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

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

  const handleZipSearch = async (zip: string) => {
    if (!zip) {
      setDistances(null);
      localStorage.removeItem("nextbase_homeZip");
      return;
    }
    const coords = await geocodeZip(zip);
    if (!coords) return;

    localStorage.setItem("nextbase_homeZip", JSON.stringify({ zip, lat: coords.lat, lng: coords.lng }));

    const dists: Record<number, number> = {};
    for (const school of allSchools) {
      if (school.latitude && school.longitude) {
        dists[school.id] = haversineDistance(coords.lat, coords.lng, school.latitude, school.longitude);
      }
    }
    setDistances(dists);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  const showDivisionFilters = activeTab === "D1" || activeTab === "D2";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative text-white overflow-hidden">
        {/* Full-bleed stadium photo background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=1920&q=80')" }}
        />
        {/* Dramatic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        {/* Hot accent slash across the right side */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 top-0 bottom-0 w-2/5 bg-gradient-to-l from-red-600/20 to-transparent skew-x-[-8deg]" />
          <div className="absolute -right-5 top-0 bottom-0 w-1 bg-red-500/40 skew-x-[-8deg]" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex items-center justify-between">
            <BrandLogo size="lg" showTagline={true} />
            {ratedCount > 0 && (
              <div className="text-center px-4 py-2 bg-red-600/20 backdrop-blur-md rounded-xl border border-red-500/30">
                <p className="text-2xl font-black text-red-400">{ratedCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-300/60">Tracking</p>
              </div>
            )}
          </div>
        </div>
        {/* Bottom edge - thick red accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
      </header>

      {/* Tab Navigation */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        {/* Desktop nav */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2 sm:py-2.5 hidden sm:flex items-center justify-between">
          <div className="inline-flex items-center gap-1">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-0.5">
              {/* Home button */}
              <button
                onClick={() => { handleTabChange("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  activeTab === "home"
                    ? "bg-gray-900 text-white shadow-md"
                    : "text-gray-400 hover:text-gray-800 hover:bg-gray-50"
                }`}
                title="Home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`relative px-6 py-2.5 rounded-lg text-base font-bold whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {tab.key === "mylist" && ratedCount > 0 && (
                    <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {ratedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <Link
            href="/match"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Find My Matches
          </Link>
        </div>

        {/* Mobile nav - accordion style */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { handleTabChange("home"); setMobileNavOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === "home"
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <button
                onClick={() => setMobileNavOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-sm font-bold text-gray-800"
              >
                {activeTab === "home" ? "Top 25" : tabs.find((t) => t.key === activeTab)?.label || "Browse"}
                {activeTab === "mylist" && ratedCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                    {ratedCount}
                  </span>
                )}
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <Link
              href="/match"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Matches
            </Link>
          </div>
          {mobileNavOpen && (
            <div className="border-t border-gray-100 px-4 py-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { handleTabChange(tab.key); setMobileNavOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    activeTab === tab.key
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                  {tab.key === "mylist" && ratedCount > 0 && (
                    <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                      activeTab === tab.key ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      {ratedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Instructional box on home page */}
        {activeTab === "home" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 sm:py-5 text-center">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">Where Will You Play?</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              Over {allSchools.length} programs are waiting. Rate schools with stars to build your personal list, or let our AI find your best fits.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/match"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Find My Matches
              </Link>
              <button
                onClick={() => handleTabChange("D1")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                Browse D1
              </button>
              <button
                onClick={() => handleTabChange("D2")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
              >
                Browse D2
              </button>
            </div>
          </div>
        )}

        {/* Section labels */}
        {activeTab === "home" && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Top 25 D1 Programs</h2>
        )}
        {activeTab === "mylist" && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Top Programs</h2>
        )}

        {showDivisionFilters && (
          <SearchFilters
            filters={filters}
            filterOptions={filterOptions}
            onChange={setFilters}
            onZipSearch={handleZipSearch}
            activeTab={activeTab}
          />
        )}

        <SchoolTable
          schools={paginated}
          distances={distances}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onPriorityChange={handlePriorityChange}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Prev
            </button>
            <span className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <BrandLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Data for informational purposes only.
            </p>
            <Link href="/admin" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
