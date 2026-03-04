"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SearchFilters from "@/components/SearchFilters";
import SearchOverlay from "@/components/SearchOverlay";
import PillNav from "@/components/PillNav";
import SchoolTable from "@/components/SchoolTable";
import NewsTicker from "@/components/NewsTicker";
import { getAllUserData, setUserData, fetchUserDataFromDB, saveUserDataToDB, bulkSyncToDB, type UserData } from "@/lib/userData";
import { haversineDistance, geocodeZip } from "@/lib/geo";
import marketingContent from "@/data/marketing.json";
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
  instagram: string | null;
  x_account: string | null;
  head_coach_name: string | null;
  head_coach_email: string | null;
  head_coach_tenure_start: number | null;
  head_coach_record: string | null;
  assistant_coach_name: string | null;
  assistant_coach_email: string | null;
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

const TABS_BASE = [
  { key: "D1", label: "All Division I" },
  { key: "D2", label: "All Division II" },
  { key: "D3", label: "All Division III" },
  { key: "JUCO", label: "All JUCO" },
] as const;
type TabKey = "home" | "mylist" | "D1" | "D2" | "D3" | "JUCO";

const PAGE_SIZE = 50;

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

/* ── VIP Card Component ─────────────────────────────────── */
/* ── VIP Carousel with arrows + touch scroll ────────────── */
function VIPCarousel({ schools, batchRecords }: { schools: (School & { priority: number })[]; batchRecords: Record<string, string | null> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Show 4- and 5-star schools as featured cards
  const vipSchools = schools.filter((s) => s.priority >= 4);

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
    <div className="mb-2">
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
              <VIPCard school={school} record={batchRecords[school.name] || null} />
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

function VIPCard({ school, record }: { school: School & { priority: number; high_academic?: boolean; recruiting_status?: string }; record: string | null }) {
  const [logoError, setLogoError] = useState(false);
  const hasOffer = school.recruiting_status === "Offer";

  const displayRecord = record || school.last_season_record;

  return (
    <Link href={`/school/${school.id}`} className="group block">
      <div className={`relative rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg ${hasOffer ? "bg-gradient-to-b from-yellow-900/90 to-gray-900 border-2 border-yellow-500/60 hover:border-yellow-400 hover:shadow-yellow-500/20 ring-1 ring-yellow-500/20" : "bg-gray-900 border border-gray-700 hover:border-red-500/60 hover:shadow-red-500/10"}`}>
        {/* Top accent */}
        <div className={`h-1 ${hasOffer ? "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" : "bg-gradient-to-r from-red-700 via-red-500 to-red-700"}`} />

        <div className="p-5 flex flex-col items-center text-center">
          {/* Stars — show as many as the school's priority rating */}
          <div className="flex items-center gap-0.5 mb-3">
            {Array.from({ length: school.priority }, (_, i) => i + 1).map((s) => (
              <svg key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1.5 text-xs font-semibold text-yellow-400/80 uppercase tracking-wide">{school.priority === 5 ? "VIP" : "Top Choice"}</span>
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
          <p className="text-sm text-gray-400 mb-3">Recruiting Status: <span className={`font-semibold ${hasOffer ? "text-yellow-400" : "text-white"}`}>{school.recruiting_status || "None"}</span></p>

          {/* View Details button */}
          <div className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${hasOffer ? "bg-yellow-600/20 text-yellow-400 group-hover:bg-yellow-600 group-hover:text-white" : "bg-red-600/20 text-red-400 group-hover:bg-red-600 group-hover:text-white"}`}>
            View & Edit
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("ranking");
  const [sortDir, setSortDir] = useState("asc");
  const [distances, setDistances] = useState<Record<number, number> | null>(null);
  const [userData, setUserDataState] = useState<Record<string, UserData>>({});
  const [mounted, setMounted] = useState(false);
  const [playerFirstName, setPlayerFirstName] = useState("");
  const [userBgPic, setUserBgPic] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    division: "",
    state: "",
    conference: "",
    publicPrivate: "",
    zip: "",
    region: "",
  });
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  // Server-loaded school data
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);
  const [schoolCount, setSchoolCount] = useState(0);

  // Batch VIP records
  const [vipRecords, setVipRecords] = useState<Record<string, string | null>>({});

  // Load all schools from API on mount
  useEffect(() => {
    async function loadSchools() {
      try {
        // Fetch all schools (paginate through all pages)
        const firstRes = await fetch("/api/schools?pageSize=200&page=1");
        const firstData = await firstRes.json();
        let all = firstData.schools || [];
        const totalPages = firstData.pagination?.totalPages || 1;
        setSchoolCount(firstData.pagination?.total || all.length);

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
        setSchoolsLoaded(true);
      } catch {
        setSchoolsLoaded(true);
      }
    }
    loadSchools();
  }, []);

  // Load user data on mount — from DB for logged-in users, localStorage for guests
  useEffect(() => {
    // Start with localStorage data (instant, avoids blank flash)
    setUserDataState(getAllUserData());

    // If logged in, fetch from DB and sync
    if (isLoggedIn) {
      const localData = getAllUserData();
      const localHasData = Object.values(localData).some((ud) => ud.priority > 0);

      fetchUserDataFromDB().then((dbData) => {
        const dbHasData = Object.keys(dbData).length > 0;

        if (dbHasData) {
          // DB has data — DB wins, merge over localStorage
          setUserDataState((prev) => ({ ...prev, ...dbData }));
        } else if (localHasData) {
          // DB is empty but localStorage has rankings — one-time sync to DB
          bulkSyncToDB(localData).catch(() => {});
        }
      }).catch(() => {});
    }

    const profile = loadProfile();
    if (profile.playerName) {
      setPlayerFirstName(profile.playerName.trim().split(/\s+/)[0]);
    }
    if (profile.backgroundPic) setUserBgPic(profile.backgroundPic);
    // Use session firstName if available
    if (isLoggedIn && session?.user) {
      const fn = (session.user as Record<string, unknown>).firstName as string;
      if (fn) setPlayerFirstName(fn);
    }
    // Restore active tab from URL hash on mount
    const hash = window.location.hash.replace("#", "");
    if (["mylist", "D1", "D2", "D3", "JUCO"].includes(hash)) {
      setActiveTab(hash as TabKey);
    }
    // Listen for hash changes (e.g. navigating back from /match to /#mylist)
    const onHashChange = () => {
      const h = window.location.hash.replace("#", "");
      if (["mylist", "D1", "D2", "D3", "JUCO"].includes(h)) {
        setActiveTab(h as TabKey);
      } else if (!h) {
        setActiveTab("home");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    setMounted(true);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [isLoggedIn, session]);

  // Count rated programs
  const ratedCount = useMemo(() => {
    return Object.values(userData).filter((ud) => ud.priority > 0).length;
  }, [userData]);

  // If logged in and on home (no hash), auto-switch to mylist
  useEffect(() => {
    if (isLoggedIn && activeTab === "home" && !window.location.hash) {
      handleTabChange("mylist");
    }
  }, [isLoggedIn]);

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
  }, [allSchools]);

  // Merge schools with user data
  const schoolsWithUserData = useMemo(() => {
    return allSchools.map((school) => {
      const ud = userData[school.id] || { priority: 0, notes: "", last_contacted: null, recruiting_status: "" };
      return { ...school, priority: ud.priority, notes: ud.notes, last_contacted: ud.last_contacted, recruiting_status: ud.recruiting_status || "", last_season_record: school.last_season_record, logo_url: school.logo_url };
    });
  }, [allSchools, userData]);

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
        const searchable = [school.name, school.city, school.state, STATE_NAMES[school.state], school.conference, school.head_coach_name, school.mascot]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      if (filters.state && school.state !== filters.state) return false;
      if (filters.conference && school.conference !== filters.conference) return false;
      if (filters.publicPrivate === "highAcademic" && !school.high_academic) return false;
      if (filters.region && REGIONS[filters.region] && !REGIONS[filters.region].includes(school.state)) return false;
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
        case "division": aVal = a.division; bVal = b.division; break;
        case "ranking": aVal = a.current_ranking; bVal = b.current_ranking; break;
        case "high_academic": aVal = a.high_academic ? 1 : 0; bVal = b.high_academic ? 1 : 0; break;
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

  // Batch fetch VIP records when VIP schools change
  const vipSchoolNames = useMemo(() => {
    return sorted
      .filter((s) => s.priority >= 4 && (s.division === "D1" || s.division === "D2"))
      .map((s) => s.name);
  }, [sorted]);

  const vipFetchedRef = useRef<string>("");
  useEffect(() => {
    const key = vipSchoolNames.join(",");
    if (!key || key === vipFetchedRef.current) return;
    vipFetchedRef.current = key;

    fetch(`/api/records?schools=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.records) {
          setVipRecords((prev) => ({ ...prev, ...data.records }));
        }
      })
      .catch(() => {});
  }, [vipSchoolNames]);

  // Schools for the live ticker — user's 4 and 5 star rated schools only
  const tickerSchools = useMemo(() => {
    return schoolsWithUserData
      .filter((s) => s.priority >= 4)
      .map((s) => ({ name: s.name, logo_url: s.logo_url }));
  }, [schoolsWithUserData]);

  // Persist sort state in sessionStorage so back-navigation preserves it
  const saveSortState = (tab: string, sort: string, dir: string) => {
    try { sessionStorage.setItem(`eb_sort_${tab}`, JSON.stringify({ sort, dir })); } catch {}
  };
  const loadSortState = (tab: string): { sort: string; dir: string } | null => {
    try {
      const raw = sessionStorage.getItem(`eb_sort_${tab}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  // Set default sort when switching tabs
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", tab === "home" ? "/" : `#${tab}`);
    // Restore saved sort or use defaults
    const saved = loadSortState(tab);
    if (saved) {
      setSortBy(saved.sort);
      setSortDir(saved.dir);
    } else if (tab === "home") {
      setSortBy("ranking");
      setSortDir("asc");
    } else if (tab === "mylist") {
      setSortBy("priority");
      setSortDir("desc");
    } else {
      setSortBy("name");
      setSortDir("asc");
    }
    setFilters((f) => ({ ...f, search: "", state: "", conference: "", publicPrivate: "", region: "" }));
  }, []);

  const handleSort = (column: string) => {
    let newDir = "asc";
    if (sortBy === column) {
      newDir = sortDir === "asc" ? "desc" : "asc";
    }
    setSortBy(column);
    setSortDir(newDir);
    saveSortState(activeTab, column, newDir);
  };

  const handlePriorityChange = (schoolId: number, priority: number) => {
    // Always save to localStorage (works offline / guest)
    setUserData(schoolId, { priority });
    setUserDataState((prev) => ({
      ...prev,
      [schoolId]: {
        ...(prev[schoolId] || { priority: 0, notes: "", last_contacted: null }),
        priority,
      },
    }));
    // Also persist to DB for logged-in users
    if (isLoggedIn) {
      saveUserDataToDB(schoolId, { priority }).catch(() => {});
    }
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

  if (!mounted || status === "loading" || !schoolsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  const showDivisionFilters = activeTab === "D1" || activeTab === "D2" || activeTab === "D3" || activeTab === "JUCO";

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <SiteHeader
        backgroundImage={userBgPic || undefined}
        activeNav={activeTab === "home" ? "Home" : activeTab === "mylist" ? "My Top Programs" : activeTab === "D1" ? "All Division I" : activeTab === "D2" ? "All Division 2" : activeTab === "D3" ? "All Division 3" : activeTab === "JUCO" ? "All JUCO" : undefined}
        onLogoClick={() => { handleTabChange(isLoggedIn ? "mylist" : "home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onNavigate={(href) => {
          const tab = href === "/" ? (isLoggedIn ? "mylist" : "home") : href === "/#mylist" ? "mylist" : href === "/#D1" ? "D1" : href === "/#D2" ? "D2" : href === "/#D3" ? "D3" : href === "/#JUCO" ? "JUCO" : null;
          if (tab) {
            handleTabChange(tab as TabKey);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />

      {/* ── Landing sections (home tab, non-logged-in only) ──────────────── */}
      {/* All text below is driven by src/data/marketing.json — edit that file to change copy */}
      {activeTab === "home" && status === "unauthenticated" && (
        <>
          {/* Hero */}
          <section
            className="relative py-12 sm:py-19 text-center overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #0d0d0d 100%)" }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(245,197,24,0.08) 0%, transparent 70%)" }} />
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
                {marketingContent.hero.headline.split("\n").map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </h2>
              <p className="text-base sm:text-lg text-gray-400 mb-6 max-w-xl mx-auto">
                {marketingContent.hero.subtext}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                <Link
                  href="/membership"
                  className="px-6 py-3 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  {marketingContent.hero.ctaButton}
                </Link>
                <a
                  href="#how-it-works"
                  className="px-6 py-3 border-2 border-white/30 text-white rounded-xl text-sm font-bold hover:border-white/60 transition-colors"
                  onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
                >
                  {marketingContent.hero.secondaryButton}
                </a>
              </div>
              <p className="text-sm text-gray-400">
                Already subscribed?{" "}
                <Link href="/auth/login" className="text-white underline hover:text-gray-200 transition-colors">
                  Login
                </Link>
              </p>
              {"footerNote" in marketingContent.hero && (
                <p className="text-xs text-gray-500 mt-2">{(marketingContent.hero as Record<string, string>).footerNote}</p>
              )}
            </div>
          </section>

          {/* Stats Bar */}
          <section className="bg-[#111] py-2 sm:py-4">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-row items-center justify-center divide-x divide-white/20 text-center">
              {marketingContent.statsBar.items.map((item, i) => (
                <div key={i} className="px-3 sm:px-8">
                  <span className="text-white font-bold text-xs sm:text-lg">{item.label === "Programs" ? `${schoolCount || allSchools.length}+` : item.value}</span>
                  <span className="text-gray-400 text-[10px] sm:text-sm ml-1">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="bg-gray-100 py-12 sm:py-16">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-4">{marketingContent.howItWorks.title}</h2>
              <div className="text-center mb-8">
                <button
                  onClick={() => setShowDemoVideo(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Watch Demo
                </button>
              </div>
              <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                {marketingContent.howItWorks.steps.map((step, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-200">
                    <div className="text-4xl mb-4">{step.emoji}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonial */}
          <section className="bg-[#1a1a2e] py-10 sm:py-14">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
              <p className="text-base sm:text-lg text-white italic leading-relaxed mb-4">
                &ldquo;{marketingContent.testimonial.quote}&rdquo;
              </p>
              <p className="text-sm text-gray-400">
                &mdash; {marketingContent.testimonial.attribution}
              </p>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-gray-100 py-12 sm:py-16">
            <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8">{marketingContent.pricing.title}</h2>
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{marketingContent.pricing.planName}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-3">
                  <span className="text-4xl font-black text-gray-900">{marketingContent.pricing.price}</span>
                  <span className="text-sm text-gray-500">{marketingContent.pricing.period}</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">{marketingContent.pricing.subtitle}</p>
                <ul className="space-y-3 text-left mb-6">
                  {marketingContent.pricing.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature.replace("{{PROGRAM_COUNT}}", String(schoolCount || allSchools.length))}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/membership" className="block w-full px-4 py-3.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm text-center">
                  {marketingContent.pricing.ctaButton}
                </Link>
                <p className="text-xs text-gray-400 mt-3">{marketingContent.pricing.footerNote}</p>
              </div>
            </div>
          </section>

          {/* Why We Built This */}
          <section className="bg-white py-12 sm:py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">{marketingContent.whyWeBuiltThis.title}</h2>
              <div className="mb-6">
                <img
                  src="/images/family.jpg"
                  alt="The family behind ExtraBase"
                  className="mx-auto rounded-full w-40 h-40 sm:w-48 sm:h-48 object-cover object-top shadow-lg border-4 border-gray-200"
                />
              </div>
              {marketingContent.whyWeBuiltThis.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-base text-gray-600 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-8 mb-4">{marketingContent.whyWeBuiltThis.whatWeDontDo.title}</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {marketingContent.whyWeBuiltThis.whatWeDontDo.text}
              </p>
            </div>
          </section>
        </>
      )}

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Instructional box — logged-in users only */}
        {/* Section labels */}
        {activeTab === "home" && isLoggedIn && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Top 25 D1 Programs</h2>
        )}
        {(activeTab === "mylist" || activeTab === "D1" || activeTab === "D2" || activeTab === "D3" || activeTab === "JUCO") && (
          <PillNav
            value={activeTab === "mylist" ? "mylist" : activeTab}
            options={[
              { value: "mylist", label: "My Top Programs" },
              { value: "ai-scout", label: "AI Scout" },
              { value: "D1", label: "Division I Programs" },
              { value: "D2", label: "Division II Programs" },
              { value: "D3", label: "Division III Programs" },
              { value: "JUCO", label: "JUCO Programs" },
            ]}
            onSelect={(val) => {
              if (val === "ai-scout") router.push("/ai-match");
              else handleTabChange(val as TabKey);
            }}
            onSearchClick={() => setSearchOverlayOpen(true)}
          />
        )}

        {/* Full-screen search overlay */}
        <SearchOverlay
          open={searchOverlayOpen}
          onClose={() => setSearchOverlayOpen(false)}
          schools={allSchools}
          conferences={filterOptions.conferences}
          activeTab={activeTab}
        />

        {/* VIP Cards Carousel — only on mylist tab (hidden during search) */}
        {activeTab === "mylist" && !filters.search && sorted.some((s) => s.priority >= 4) && (
          <h3 className="text-base font-bold text-gray-700 -mt-2">My Four & Five Star Programs</h3>
        )}
        {activeTab === "mylist" && !filters.search && <VIPCarousel schools={sorted} batchRecords={vipRecords} />}
  {/* Live Ticker — only on My Top Programs tab */}
        {activeTab === "mylist" && isLoggedIn && tickerSchools.length > 0 && !filters.search && (
          <NewsTicker schools={tickerSchools} />
        )}
        {/* All Ranked Programs header — only on mylist when VIP exists */}
        {activeTab === "mylist" && !filters.search && sorted.some((s) => s.priority === 5) && (
          <h3 className="text-base font-bold text-gray-700 mt-2">All My Ranked Programs</h3>
        )}

        {/* Empty state — logged-in user on mylist with no ranked programs */}
        {/* Shows a full preview (VIP cards, ticker, rows) overlaid with white gradient + CTA */}
        {activeTab === "mylist" && !filters.search && isLoggedIn && sorted.length === 0 && (() => {
          const fakePriorities = [5, 5, 4, 4, 3, 3, 2];
          const previewSchools = allSchools
            .filter(s => s.current_ranking != null && s.division === "D1")
            .sort((a, b) => (a.current_ranking || 999) - (b.current_ranking || 999))
            .slice(0, 7);
          const vipPreview = previewSchools.slice(0, 4);
          return (
            <div className="relative -mt-2">
              {/* Faded preview behind the overlay */}
              <div className="pointer-events-none select-none" aria-hidden="true">

                {/* Fake "My Four & Five Star Programs" header */}
                <h3 className="text-base font-bold text-gray-700 mb-2">My Four & Five Star Programs</h3>

                {/* Fake VIP Cards Carousel */}
                <div className="flex gap-4 overflow-hidden pb-2 mb-3">
                  {vipPreview.map((school, i) => {
                    const stars = fakePriorities[i] || 4;
                    return (
                      <div key={school.id} className="shrink-0 w-72 sm:w-80">
                        <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-700">
                          <div className="h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
                          <div className="p-5 flex flex-col items-center text-center">
                            <div className="flex items-center gap-0.5 mb-3">
                              {Array.from({ length: stars }, (_, si) => (
                                <svg key={si} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-1.5 text-xs font-semibold text-yellow-400/80 uppercase tracking-wide">{stars === 5 ? "VIP" : "Top Choice"}</span>
                            </div>
                            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4 shadow-lg">
                              {school.logo_url ? (
                                <img src={school.logo_url} alt="" className="w-20 h-20 object-contain" />
                              ) : (
                                <span className="text-2xl font-black text-gray-400">{school.name.split(" ").map(w => w[0]).join("").slice(0, 3)}</span>
                              )}
                            </div>
                            <h4 className="text-lg font-black text-white mb-0.5">{school.name.toUpperCase()}</h4>
                            <p className="text-sm text-gray-400 mb-3">{school.mascot}</p>
                            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">{school.division}</span>
                              <span className="text-gray-600">·</span>
                              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">{school.conference}</span>
                              <span className="text-gray-600">·</span>
                              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">{school.city}, {school.state}</span>
                            </div>
                            {school.current_ranking && (
                              <div className="text-sm text-gray-300">Rank: <span className="font-semibold text-red-400">#{school.current_ranking}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fake LIVE ticker */}
                <div className="bg-[#1a1a2e] border-l-4 border-yellow-500 rounded-lg overflow-hidden mb-3">
                  <div className="flex items-center">
                    <div className="shrink-0 px-3 sm:px-4 py-2.5 flex items-center gap-1.5 border-r border-white/10">
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-yellow-500">LIVE</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center whitespace-nowrap py-2.5">
                        {vipPreview.map((school, idx) => (
                          <span key={idx} className="inline-flex items-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5">
                              {school.logo_url && <img src={school.logo_url} alt="" className="w-5 h-5 rounded-full object-contain bg-white shrink-0" />}
                              <span className="text-xs sm:text-sm font-semibold text-white">{school.name}</span>
                              <span className="text-[10px] sm:text-xs text-gray-400 ml-0.5">{school.last_season_record || ""}</span>
                            </span>
                            <span className="text-yellow-600/50 mx-3 text-xs">&#9670;</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fake "All My Ranked Programs" header */}
                <h3 className="text-base font-bold text-gray-700 mb-2">All My Ranked Programs</h3>

                {/* Fake program rows */}
                <div className="flex flex-col" style={{ gap: 5 }}>
                  {previewSchools.map((school, i) => {
                    const divLabel = school.division === "D1" ? "D-I" : school.division === "D2" ? "D-II" : school.division === "D3" ? "D-III" : "JUCO";
                    const stars = fakePriorities[i] || 3;
                    const tierLabel = stars === 5 ? "VIP" : stars === 4 ? "Top Choice" : stars === 3 ? "Very Interested" : "Interested";
                    return (
                      <div key={school.id} className="flex items-center bg-white rounded-xl border border-[rgba(0,0,0,0.05)]" style={{ padding: "10px 10px 10px 12px" }}>
                        <div className="shrink-0 rounded-full bg-[#f5f5f7] border border-[rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden" style={{ width: 42, height: 42 }}>
                          {school.logo_url ? (
                            <img src={school.logo_url} alt="" className="w-[42px] h-[42px] object-contain" />
                          ) : (
                            <span className="text-[13px] font-bold text-gray-400">{school.name.split(" ").map(w => w[0]).join("").slice(0, 3)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 ml-3">
                          <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">{school.name}</p>
                          <p className="text-[11px] text-[#888] truncate leading-tight mt-[2px]">
                            {divLabel} · {school.mascot} · <span className="font-semibold text-[#666]">{school.conference}</span> · {school.city}, {school.state}
                          </p>
                          <div className="flex items-center mt-[3px]">
                            {Array.from({ length: 5 }, (_, si) => (
                              <svg key={si} className={`w-3.5 h-3.5 ${si < stars ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1.5 font-bold text-[#aaa]" style={{ fontSize: "9.5px" }}>{tierLabel}</span>
                          </div>
                        </div>
                        {school.current_ranking && (
                          <div className="shrink-0 flex flex-col items-end ml-2 mr-1">
                            <span className="text-[13px] font-extrabold text-[#c1272d] leading-tight">#{school.current_ranking}</span>
                          </div>
                        )}
                        <span className="shrink-0 text-[18px] text-[#ccc] ml-1 leading-none">&rsaquo;</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* White gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(249,250,251,0.15) 0%, rgba(249,250,251,0.55) 20%, rgba(249,250,251,0.85) 40%, rgba(249,250,251,0.97) 55%, rgba(249,250,251,1) 70%)" }} />

              {/* CTA card floating near the top */}
              <div className="absolute inset-x-0 top-0 flex justify-center px-4" style={{ paddingTop: "18%" }}>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 text-center max-w-md w-full">
                  <div className="inline-flex items-center gap-1.5 bg-yellow-50 rounded-full px-3 py-1 mb-3">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Your Top Programs</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">
                    {playerFirstName ? `${playerFirstName}, your favorites will live here` : "Your favorites will live here"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Browse {schoolCount || allSchools.length}+ programs, tap the stars to rate them, and your personalized list builds itself right here.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button onClick={() => handleTabChange("D1")} className="w-full sm:w-auto px-5 py-2.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                      Browse Programs
                    </button>
                    <button onClick={() => router.push("/ai-match")} className="w-full sm:w-auto px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI Scout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {status === "unauthenticated" && activeTab !== "home" ? (
          /* Auth gate when not logged in on non-home tabs */
          <div className="flex justify-center py-12">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 text-center max-w-md mx-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700 font-medium mb-4">
                Create a free account to access all {schoolCount || allSchools.length} programs and unlock AI matching.
              </p>
              <Link
                href="/membership"
                className="inline-block px-6 py-2.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors mb-2"
              >
                Sign Up Free
              </Link>
              <div>
                <Link href="/auth/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  Already have an account? Log in
                </Link>
              </div>
            </div>
          </div>
        ) : isLoggedIn ? (
          <SchoolTable
            schools={paginated}
            distances={distances}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            onPriorityChange={handlePriorityChange}
          />
        ) : null}

        {/* Pagination */}
        {totalPages > 1 && (activeTab !== "home" || isLoggedIn) && (
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

      <SiteFooter onLogoClick={() => { handleTabChange(isLoggedIn ? "mylist" : "home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

      {/* Demo video modal */}
      {showDemoVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setShowDemoVideo(false)}
        >
          <div
            className="relative w-full max-w-sm mx-auto"
            style={{ aspectRatio: "9/16" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDemoVideo(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src="https://drive.google.com/file/d/1XzaLSmul-lzo3df6txx_I9lXPzIXV6Kc/preview"
              className="w-full h-full rounded-2xl"
              allow="autoplay"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
