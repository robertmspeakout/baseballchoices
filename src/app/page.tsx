"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import SiteNav from "@/components/SiteNav";
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
  recruitingStatus: string;
}

const TABS_BASE = [
  { key: "D1", label: "All Division 1" },
  { key: "D2", label: "All Division 2" },
] as const;
type TabKey = "home" | "mylist" | "D1" | "D2";

const PAGE_SIZE = 50;
const allSchools = schoolsData as School[];

/* ── VIP Card Component ─────────────────────────────────── */
/* ── VIP Carousel with arrows + touch scroll ────────────── */
function VIPCarousel({ schools }: { schools: (School & { priority: number })[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const vipSchools = schools.filter((s) => s.priority === 5);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [vipSchools.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(":scope > *")?.offsetWidth || 300;
    el.scrollBy({ left: dir === "left" ? -cardWidth - 16 : cardWidth + 16, behavior: "smooth" });
  };

  if (vipSchools.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        <h3 className="text-lg font-bold text-gray-900">VIP Programs</h3>
      </div>

      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          data-vip-scroll=""
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`[data-vip-scroll]::-webkit-scrollbar { display: none; }`}</style>
          {vipSchools.map((school) => (
            <div key={school.id} className="snap-start shrink-0 w-72 sm:w-80">
              <VIPCard school={school} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function VIPCard({ school }: { school: School & { priority: number; high_academic?: boolean } }) {
  const [logoError, setLogoError] = useState(false);
  const [record, setRecord] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current || !school.name) return;
    fetched.current = true;
    fetch(`/api/records?schools=${encodeURIComponent(school.name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.records?.[school.name]) setRecord(data.records[school.name]);
      })
      .catch(() => {});
  }, [school.name]);

  const displayRecord = record || school.last_season_record;

  return (
    <Link href={`/school/${school.id}`} className="group block">
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 hover:border-red-500/60 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10">
        {/* Red top accent */}
        <div className="h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

        <div className="p-5 flex flex-col items-center text-center">
          {/* Stars */}
          <div className="flex items-center gap-0.5 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1.5 text-xs font-semibold text-yellow-400/80 uppercase tracking-wide">VIP Choice</span>
          </div>

          {/* Logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform">
            {school.logo_url && !logoError ? (
              <img
                src={school.logo_url}
                alt={`${school.name} logo`}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-gray-400">
                {school.name.split(" ").map((w) => w[0]).join("").slice(0, 3)}
              </span>
            )}
          </div>

          {/* School name */}
          <h4 className="text-lg sm:text-xl font-black text-white mb-0.5 group-hover:text-red-400 transition-colors">
            {school.name.toUpperCase()}
          </h4>
          <p className="text-sm text-gray-400 mb-3">{school.mascot}</p>

          {/* Info pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">{school.division}</span>
            <span className="text-gray-600">·</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">{school.conference}</span>
            <span className="text-gray-600">·</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">{school.city}, {school.state}</span>
          </div>

          {/* Record & Ranking */}
          <div className="flex items-center justify-center gap-3 text-sm mb-3">
            {displayRecord && (
              <span className="text-gray-300">Record: <span className="font-semibold text-white">{displayRecord}</span></span>
            )}
            {school.current_ranking && (
              <span className="text-gray-300">Rank: <span className="font-semibold text-red-400">#{school.current_ranking}</span></span>
            )}
          </div>

          {/* Head Coach */}
          {school.head_coach_name && (
            <p className="text-sm text-gray-400 mb-1">Head Coach: <span className="font-semibold text-white">{school.head_coach_name}</span></p>
          )}

          {/* Recruiting Status */}
          <p className="text-sm text-gray-400 mb-3">Recruiting Status: <span className="font-semibold text-white">{(school as any).recruiting_status || "None"}</span></p>

          {/* View Details button */}
          <div className="px-4 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-semibold uppercase tracking-wide group-hover:bg-red-600 group-hover:text-white transition-all">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as TabKey;
      if (["home", "mylist", "D1", "D2"].includes(hash)) return hash;
    }
    return "home";
  });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("ranking");
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
    zip: "",
    recruitingStatus: "",
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
      const ud = userData[school.id] || { priority: 0, notes: "", last_contacted: null, recruiting_status: "" };
      return { ...school, priority: ud.priority, notes: ud.notes, last_contacted: ud.last_contacted, recruiting_status: ud.recruiting_status || "", last_season_record: school.last_season_record, logo_url: school.logo_url };
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
      if (filters.publicPrivate === "highAcademic" && !(school as any).high_academic) return false;
      if (filters.recruitingStatus && (school as any).recruiting_status !== filters.recruitingStatus) return false;
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
    window.history.replaceState(null, "", tab === "home" ? "/" : `#${tab}`);
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
    setFilters((f) => ({ ...f, search: "", state: "", conference: "", publicPrivate: "", recruitingStatus: "" }));
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
      <header className="relative text-white overflow-visible z-30">
        {/* Full-bleed baseball photo background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1629219644109-b4df0ab25a7b?w=1920&q=80')" }}
        />
        {/* Left-to-right gradient for logo contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex items-start justify-between">
            <BrandLogo size="lg" showTagline={true} onClick={() => { handleTabChange("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
            <SiteNav
              variant="dark"
              active={activeTab === "home" ? "Home" : activeTab === "mylist" ? "My Top Programs" : activeTab === "D1" ? "All Division 1" : activeTab === "D2" ? "All Division 2" : undefined}
              onNavigate={(href) => {
                const tab = href === "/" ? "home" : href === "/#mylist" ? "mylist" : href === "/#D1" ? "D1" : href === "/#D2" ? "D2" : null;
                if (tab) {
                  handleTabChange(tab as TabKey);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          </div>
        </div>
        {/* Bottom edge - thick red accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Instructional box on home page */}
        {activeTab === "home" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 sm:py-5 text-center">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">Where Will You Play?</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              Over {allSchools.length} baseball programs are waiting. Rate schools with stars to build your personal list, or let our AI find your best fits.
            </p>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTabChange("mylist")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  My Top Programs
                </button>
                <Link
                  href="/match"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  My AI Matches
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTabChange("D1")}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  <span className="hidden sm:inline">Browse D1 Programs</span>
                  <span className="sm:hidden">Browse D1</span>
                </button>
                <button
                  onClick={() => handleTabChange("D2")}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  <span className="hidden sm:inline">Browse D2 Programs</span>
                  <span className="sm:hidden">Browse D2</span>
                </button>
              </div>
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

        {/* VIP Cards Carousel — only on mylist tab */}
        {activeTab === "mylist" && <VIPCarousel schools={sorted} />}

        {/* All Ranked Programs header — only on mylist when VIP exists */}
        {activeTab === "mylist" && sorted.some((s) => s.priority === 5) && (
          <h3 className="text-base font-bold text-gray-700 mt-2">All Ranked Programs</h3>
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
          <BrandLogo size="sm" showTagline={false} onClick={() => { handleTabChange("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              ExtraBase is a product of JackJack Enterprises. Data is for informational purposes only. Go be great!
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
