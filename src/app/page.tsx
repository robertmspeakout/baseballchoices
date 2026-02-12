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
  priorityOnly: boolean;
  zip: string;
}

const TABS = [
  { key: "mylist", label: "My List" },
  { key: "D1", label: "Division I Programs" },
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
    priorityOnly: false,
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
      <header className="relative bg-blue-950 text-white shadow-lg overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Inside_TD_Ameritrade_Park_Omaha.jpg/1600px-Inside_TD_Ameritrade_Park_Omaha.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/80 to-blue-950/85" />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:block bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
              <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="2.5" />
                <path d="M18,8 Q28,20 28,32 Q28,44 18,56" stroke="white" strokeWidth="2" fill="none" />
                <path d="M46,8 Q36,20 36,32 Q36,44 46,56" stroke="white" strokeWidth="2" fill="none" />
                <line x1="20" y1="12" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="19" y1="18" x2="23" y2="19" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="19" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="19" y1="30" x2="24" y2="30" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="19" y1="36" x2="24" y2="35" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="19" y1="42" x2="23" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="20" y1="48" x2="24" y2="45" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="44" y1="12" x2="40" y2="14" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="45" y1="18" x2="41" y2="19" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="45" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="45" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="45" y1="36" x2="40" y2="35" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="45" y1="42" x2="41" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
                <line x1="44" y1="48" x2="40" y2="45" stroke="currentColor" strokeWidth="1.5" className="text-red-300" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                NextBase
              </h1>
              <p className="text-blue-200 text-xs sm:text-base mt-0.5 sm:mt-1">
                Your college baseball recruiting personal assistant
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <nav className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-700 border-b-2 border-blue-700"
                    : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                }`}
              >
                {tab.label}
                {tab.key === "mylist" && ratedCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {ratedCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Top Programs</h2>
            <button
              onClick={() => handleTabChange("D1")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse all D1 Programs &rarr;
            </button>
          </div>
        )}

        {/* Section label for fallback Top 25 */}
        {showingFallback && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Top 25 D1 Programs</h2>
          </div>
        )}

        <SearchFilters
          filters={filters}
          filterOptions={filterOptions}
          onChange={setFilters}
          onZipSearch={handleZipSearch}
        />

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
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 text-center text-sm text-gray-500">
          NextBase &mdash; Your college baseball recruiting personal assistant.
          Data for informational purposes only.
        </div>
      </footer>
    </div>
  );
}
