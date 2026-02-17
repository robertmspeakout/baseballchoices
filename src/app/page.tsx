"use client";

import { useEffect, useMemo, useState } from "react";
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

const TABS = [
  { key: "mylist", label: "My List" },
  { key: "D1", label: "Division I" },
  { key: "D2", label: "Division II" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const PAGE_SIZE = 50;
const allSchools = schoolsData as School[];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("mylist");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("priority");
  const [sortDir, setSortDir] = useState("desc");
  const [distances, setDistances] = useState<Record<number, number> | null>(null);
  const [userData, setUserDataState] = useState<Record<string, UserData>>({});
  const [mounted, setMounted] = useState(false);
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

  // Compute filter options from data
  const filterOptions = useMemo(() => {
    const states = [...new Set(allSchools.map((s) => s.state).filter(Boolean))].sort();
    const conferences = [...new Set(allSchools.map((s) => s.conference).filter(Boolean))].sort();
    const divisions = [...new Set(allSchools.map((s) => s.division))].sort();
    return { states, conferences, divisions };
  }, []);

  // Merge schools with user data
  const schoolsWithUserData = useMemo(() => {
    return allSchools.map((school) => {
      const ud = userData[school.id] || { priority: 0, notes: "", last_contacted: null };
      return { ...school, priority: ud.priority, notes: ud.notes, last_contacted: ud.last_contacted, last_season_record: school.last_season_record, logo_url: school.logo_url };
    });
  }, [userData]);

  // Get the base list based on active tab
  const baseList = useMemo(() => {
    if (activeTab === "mylist") {
      const rated = schoolsWithUserData.filter((s) => s.priority > 0);
      if (rated.length > 0) return rated;
      // Fallback: show top 25 ranked D1 programs
      return schoolsWithUserData
        .filter((s) => s.current_ranking != null && s.division === "D1")
        .sort((a, b) => (a.current_ranking || 999) - (b.current_ranking || 999))
        .slice(0, 25);
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
    if (tab === "mylist") {
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

  const isMyListEmpty = ratedCount === 0;
  const showingFallback = activeTab === "mylist" && isMyListEmpty;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative text-white overflow-hidden">
        {/* Multi-layer background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        {/* Ambient glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-red-600/20 to-orange-500/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-gradient-to-tr from-blue-600/15 to-cyan-400/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
          {/* Diagonal accent */}
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-red-600/8 to-transparent skew-x-[-12deg] translate-x-20" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Icon mark */}
              <div className="relative animate-float">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 border border-red-400/20">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-sm" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M9,4 Q14,11 14,16 Q14,21 9,28" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M23,4 Q18,11 18,16 Q18,21 23,28" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-red-500/20 rounded-xl blur-md -z-10" />
              </div>
              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
                  <span
                    className="bg-clip-text text-transparent animate-shimmer"
                    style={{
                      backgroundImage: "linear-gradient(90deg, #fff 0%, #fff 40%, #f87171 50%, #fff 60%, #fff 100%)",
                      backgroundSize: "200% auto",
                    }}
                  >
                    NEXTBASE
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mt-0.5">
                  College Baseball Recruiting
                </p>
              </div>
            </div>

            {/* Stats pills - desktop */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-gray-300">{allSchools.filter(s => s.division === "D1").length} D1</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
                <span className="text-xs font-medium text-gray-300">{allSchools.filter(s => s.division === "D2").length} D2</span>
              </div>
              {ratedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-full px-3 py-1.5">
                  <span className="text-xs font-bold text-red-400">{ratedCount} tracked</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
      </header>

      {/* Tab Navigation */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2 sm:py-2.5">
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-bold whitespace-nowrap transition-all duration-200 ${
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
      </div>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* My List empty state */}
        {showingFallback && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 text-center">
            <svg className="mx-auto w-10 h-10 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-1">Start Building Your List</h3>
            <p className="text-sm text-blue-700 mb-3">
              Rate programs with stars to add them to your personal list. Showing the Top 25 ranked D1 programs below to get you started.
            </p>
            <button
              onClick={() => handleTabChange("D1")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse All D1 Programs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Section label for My List */}
        {activeTab === "mylist" && !showingFallback && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Top Programs</h2>
        )}

        {/* Section label for fallback Top 25 */}
        {showingFallback && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Top 25 D1 Programs</h2>
        )}

        <SearchFilters
          filters={filters}
          filterOptions={filterOptions}
          onChange={setFilters}
          onZipSearch={handleZipSearch}
        />

        {/* Browse all link - below filters, above results */}
        {activeTab === "mylist" && (
          <div className="flex gap-4">
            <button
              onClick={() => handleTabChange("D1")}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Browse all D1 Programs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => handleTabChange("D2")}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Browse all D2 Programs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">NEXTBASE</span>
          </div>
          <p className="text-xs text-gray-500">
            Data for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
