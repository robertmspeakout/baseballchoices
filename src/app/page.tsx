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

const PAGE_SIZE = 50;
const allSchools = schoolsData as School[];

export default function Home() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
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

  // Filter
  const filtered = useMemo(() => {
    return schoolsWithUserData.filter((school) => {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const searchable = [school.name, school.city, school.state, school.conference, school.head_coach_name, school.mascot]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      if (filters.division && school.division !== filters.division) return false;
      if (filters.state && school.state !== filters.state) return false;
      if (filters.conference && school.conference !== filters.conference) return false;
      if (filters.publicPrivate && school.public_private !== filters.publicPrivate) return false;
      if (filters.priorityOnly && school.priority === 0) return false;
      return true;
    });
  }, [schoolsWithUserData, filters]);

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, sortDir]);

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

    // Persist zip + coords so detail pages can show distance too
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with CWS Omaha stadium background */}
      <header className="relative bg-blue-950 text-white shadow-lg overflow-hidden">
        {/* Charles Schwab Field (CWS) background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Inside_TD_Ameritrade_Park_Omaha.jpg/1600px-Inside_TD_Ameritrade_Park_Omaha.jpg')" }}
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/80 to-blue-950/85" />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-10">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Baseball icon */}
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
          {/* Stats badges */}
          <div className="mt-3 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/10 backdrop-blur rounded-full text-xs sm:text-sm font-medium border border-white/10">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {sorted.length} Programs
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/10 backdrop-blur rounded-full text-xs sm:text-sm font-medium border border-white/10">
              NCAA D-I
            </span>
            {distances && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 backdrop-blur rounded-full text-xs sm:text-sm font-medium border border-green-400/20 text-green-200">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                From {filters.zip}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
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
