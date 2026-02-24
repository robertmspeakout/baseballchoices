"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SearchFilters from "@/components/SearchFilters";
import SearchOverlay from "@/components/SearchOverlay";
import SchoolTable from "@/components/SchoolTable";
import { getAllUserData, setUserData, fetchUserDataFromDB, saveUserDataToDB, bulkSyncToDB, type UserData } from "@/lib/userData";
import { haversineDistance, geocodeZip } from "@/lib/geo";
import { loadProfile, REGIONS } from "@/lib/playerProfile";

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
  head_coach_name: string | null;
  website: string | null;
  last_season_record: string | null;
  logo_url: string | null;
  high_academic?: boolean;
}

interface Filters {
  search: string;
  division: string;
  state: string;
  conference: string;
  publicPrivate: string;
  zip: string;
  region: string;
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

const PAGE_SIZE = 50;

type ViewMode = "mylist" | "D1" | "D2" | "D3" | "JUCO" | "ai";

interface ProgramsViewProps {
  mode: ViewMode;
  pageTitle: string;
  activeNavLabel: string;
}

export default function ProgramsView({ mode, pageTitle, activeNavLabel }: ProgramsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  // Parse ids from URL for AI results mode
  const aiIds = useMemo(() => {
    if (mode !== "ai") return null;
    const idsParam = searchParams.get("ids");
    if (!idsParam) return null;
    return idsParam.split(",").map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  }, [mode, searchParams]);

  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);
  const [userData, setUserDataState] = useState<Record<string, UserData>>({});
  const [mounted, setMounted] = useState(false);
  const [userBgPic, setUserBgPic] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(mode === "mylist" ? "priority" : "name");
  const [sortDir, setSortDir] = useState(mode === "mylist" ? "desc" : "asc");
  const [distances, setDistances] = useState<Record<number, number> | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "", division: "", state: "", conference: "", publicPrivate: "", zip: "", region: "",
  });
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  // Load schools
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
          for (const r of results) all = all.concat(r.schools || []);
        }
        setAllSchools(all);
        setSchoolsLoaded(true);
      } catch {
        setSchoolsLoaded(true);
      }
    }
    loadSchools();
  }, []);

  // Load user data
  useEffect(() => {
    setUserDataState(getAllUserData());
    if (isLoggedIn) {
      const localData = getAllUserData();
      const localHasData = Object.values(localData).some((ud) => ud.priority > 0);
      fetchUserDataFromDB().then((dbData) => {
        const dbHasData = Object.keys(dbData).length > 0;
        if (dbHasData) {
          setUserDataState((prev) => ({ ...prev, ...dbData }));
        } else if (localHasData) {
          bulkSyncToDB(localData).catch(() => {});
        }
      }).catch(() => {});
    }
    const profile = loadProfile();
    if (profile.backgroundPic) setUserBgPic(profile.backgroundPic);
    setMounted(true);
  }, [isLoggedIn]);

  const filterOptions = useMemo(() => {
    const states = [...new Set(allSchools.map(s => s.state).filter(Boolean))].sort();
    const conferences = [...new Set(allSchools.map(s => s.conference).filter(Boolean))].sort();
    const divisions = [...new Set(allSchools.map(s => s.division))].sort();
    const divisionConferences: Record<string, string[]> = {};
    for (const div of divisions) {
      divisionConferences[div] = [...new Set(allSchools.filter(s => s.division === div).map(s => s.conference).filter(Boolean))].sort();
    }
    return { states, conferences, divisions, divisionConferences };
  }, [allSchools]);

  const schoolsWithUserData = useMemo(() => {
    return allSchools.map(school => {
      const ud = userData[school.id] || { priority: 0, notes: "", last_contacted: null, recruiting_status: "" };
      return { ...school, priority: ud.priority, notes: ud.notes, last_contacted: ud.last_contacted, recruiting_status: ud.recruiting_status || "" };
    });
  }, [allSchools, userData]);

  const baseList = useMemo(() => {
    if (mode === "mylist") return schoolsWithUserData.filter(s => s.priority > 0);
    if (mode === "ai" && aiIds) {
      // Preserve the order from AI recommendations
      const byId = new Map(schoolsWithUserData.map(s => [s.id, s]));
      return aiIds.map(id => byId.get(id)).filter(Boolean) as typeof schoolsWithUserData;
    }
    return schoolsWithUserData.filter(s => s.division === mode);
  }, [mode, schoolsWithUserData, aiIds]);

  const filtered = useMemo(() => {
    const source = filters.search ? schoolsWithUserData : baseList;
    return source.filter(school => {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const searchable = [school.name, school.city, school.state, STATE_NAMES[school.state], school.conference, school.head_coach_name, school.mascot].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      if (filters.state && school.state !== filters.state) return false;
      if (filters.conference && school.conference !== filters.conference) return false;
      if (filters.publicPrivate === "highAcademic" && !school.high_academic) return false;
      if (filters.region && REGIONS[filters.region] && !REGIONS[filters.region].includes(school.state)) return false;
      return true;
    });
  }, [baseList, schoolsWithUserData, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: string | number | null, bVal: string | number | null;
      switch (sortBy) {
        case "name": aVal = a.name; bVal = b.name; break;
        case "state": aVal = a.state; bVal = b.state; break;
        case "ranking": aVal = a.current_ranking; bVal = b.current_ranking; break;
        case "priority": aVal = a.priority; bVal = b.priority; break;
        case "distance": aVal = distances?.[a.id] ?? null; bVal = distances?.[b.id] ?? null; break;
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

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filters, sortBy, sortDir]);

  const handleSort = (column: string) => {
    let newDir = "asc";
    if (sortBy === column) newDir = sortDir === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortDir(newDir);
  };

  const handlePriorityChange = (schoolId: number, priority: number) => {
    setUserData(schoolId, { priority });
    setUserDataState(prev => ({
      ...prev,
      [schoolId]: { ...(prev[schoolId] || { priority: 0, notes: "", last_contacted: null }), priority },
    }));
    if (isLoggedIn) saveUserDataToDB(schoolId, { priority }).catch(() => {});
  };

  const handleZipSearch = async (zip: string) => {
    if (!zip) { setDistances(null); return; }
    const coords = await geocodeZip(zip);
    if (!coords) return;
    const dists: Record<number, number> = {};
    for (const school of allSchools) {
      if (school.latitude && school.longitude) {
        dists[school.id] = haversineDistance(coords.lat, coords.lng, school.latitude, school.longitude);
      }
    }
    setDistances(dists);
  };

  if (!mounted || status === "loading" || !schoolsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <SiteHeader backgroundImage={userBgPic || undefined} activeNav={activeNavLabel} />

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {mode !== "ai" && <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <select
                value={mode === "mylist" ? "mylist" : mode}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "ai-scout") router.push("/ai-match");
                  else if (val === "mylist") router.push("/my-list");
                  else if (val === "D1") router.push("/programs/d1");
                  else if (val === "D2") router.push("/programs/d2");
                  else if (val === "D3") router.push("/programs/d3");
                  else if (val === "JUCO") router.push("/programs/juco");
                }}
                className="w-full appearance-none bg-gray-50 border border-gray-400 rounded-lg px-4 py-3 pr-10 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] cursor-pointer"
              >
                <option value="mylist">My Top Programs</option>
                <option value="ai-scout">AI Scout</option>
                <option value="D1">Division I Programs</option>
                <option value="D2">Division II Programs</option>
                <option value="D3">Division III Programs</option>
                <option value="JUCO">JUCO Programs</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#CC0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {/* Search icon button */}
            <button
              onClick={() => setSearchOverlayOpen(true)}
              className="shrink-0 w-[42px] h-[42px] flex items-center justify-center bg-gray-50 border border-gray-400 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>}

        {/* Full-screen search overlay */}
        <SearchOverlay
          open={searchOverlayOpen}
          onClose={() => setSearchOverlayOpen(false)}
          schools={allSchools}
          conferences={filterOptions.conferences}
          activeTab={mode}
        />

        {mode === "ai" && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">AI Scout Recommendations</h2>
                  <p className="text-xs text-gray-500">{sorted.length} programs matched your search</p>
                </div>
              </div>
              <Link href="/ai-match" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to AI Scout
              </Link>
            </div>
          </div>
        )}

        {mode === "mylist" && !filters.search && sorted.length === 0 && (
          <div className="flex justify-center py-10">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
              <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No programs ranked yet</h3>
              <p className="text-sm text-gray-600 mb-6">
                Start building your list! Browse programs by division and use the star ratings to rank your favorites.
              </p>
              <p className="text-sm text-gray-600">
                Browse:{" "}
                <Link href="/programs/d1" className="text-blue-600 font-semibold hover:underline">Division I</Link>{" | "}
                <Link href="/programs/d2" className="text-blue-600 font-semibold hover:underline">Division II</Link>{" | "}
                <Link href="/programs/d3" className="text-blue-600 font-semibold hover:underline">Division III</Link>{" | "}
                <Link href="/programs/juco" className="text-blue-600 font-semibold hover:underline">JUCO</Link>
              </p>
            </div>
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Prev</button>
            <span className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
