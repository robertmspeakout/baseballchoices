"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface School {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  division: string;
  conference: string;
  head_coach_name: string | null;
  logo_url: string | null;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Full school list to search through */
  schools: School[];
  /** Unique conference names for quick-filter chips */
  conferences: string[];
  /** Current active tab — quick filters only shown for D1/mylist */
  activeTab?: string;
}

/* ------------------------------------------------------------------ */
/*  State name map (for search matching)                               */
/* ------------------------------------------------------------------ */
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

/* Major conferences shown as quick-filter chips */
const QUICK_CONFERENCES = [
  "SEC", "Big 12", "ACC", "Big Ten", "Big East", "Big West",
  "American Athletic", "Atlantic 10", "Conference USA", "Sun Belt",
  "Missouri Valley", "SWAC", "WAC", "Ivy League",
];

const RECENT_KEY = "bc_recent_searches";
const MAX_RECENTS = 8;

/* ------------------------------------------------------------------ */
/*  Helper: read / write recent searches from localStorage             */
/* ------------------------------------------------------------------ */
function getRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}
function addRecent(term: string) {
  const list = getRecents().filter((t) => t !== term);
  list.unshift(term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
}
function clearRecents() {
  localStorage.removeItem(RECENT_KEY);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function SearchOverlay({ open, onClose, schools, conferences, activeTab }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0); // for stagger animation

  /* ---- Sync recents from localStorage when overlay opens ---- */
  useEffect(() => {
    if (open) {
      setRecents(getRecents());
      setQuery("");
      setVisibleCount(0);
      // Auto-focus after slide-up animation (350ms)
      const t = setTimeout(() => inputRef.current?.focus(), 380);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* ---- Lock body scroll when open ---- */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Push a history entry so hardware back closes the overlay
      window.history.pushState({ searchOverlay: true }, "");
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ---- Handle hardware / browser back button ---- */
  useEffect(() => {
    if (!open) return;
    const handler = (e: PopStateEvent) => {
      // If the overlay pushed state, close it instead of navigating
      if (open) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [open, onClose]);

  /* ---- Search logic (mirrors existing filter) ---- */
  const results = query.trim()
    ? schools.filter((s) => {
        const term = query.toLowerCase();
        const searchable = [s.name, s.city, s.state, STATE_NAMES[s.state], s.conference, s.head_coach_name, s.mascot]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(term);
      }).slice(0, 50)
    : [];

  /* ---- Stagger animation for results ---- */
  useEffect(() => {
    if (results.length === 0) { setVisibleCount(0); return; }
    setVisibleCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i >= results.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [results.length, query]);

  /* ---- Handlers ---- */
  const close = useCallback(() => {
    // Pop the history entry we pushed
    if (window.history.state?.searchOverlay) {
      window.history.back();
    }
    onClose();
  }, [onClose]);

  const handleSelect = (school: School) => {
    addRecent(school.name);
    // Close overlay without history.back — router.push handles navigation
    onClose();
    router.push(`/school/${school.id}`);
  };

  const handleChip = (conf: string) => {
    setQuery(conf);
    inputRef.current?.focus();
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleClearRecents = () => {
    clearRecents();
    setRecents([]);
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  /* ---- Quick-filter chips: only for D1/mylist tabs, only conferences that exist ---- */
  const showChips = !activeTab || activeTab === "mylist" || activeTab === "D1";
  const availableChips = showChips ? QUICK_CONFERENCES.filter((c) => conferences.includes(c)) : [];

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white transition-transform duration-[350ms] ease-out ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ willChange: "transform" }}
    >
      {/* ---- Top bar: input + cancel ---- */}
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-gray-200 bg-white">
        <div className="relative flex-1">
          {/* Magnifying glass inside input */}
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all programs"
            className="w-full pl-10 pr-10 py-3 bg-gray-100 border border-gray-300 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {/* Clear (X) button — only when there's text */}
          {hasQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-300 text-white"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button onClick={close} className="shrink-0 text-sm font-semibold text-blue-600 px-1 py-2">
          Cancel
        </button>
      </div>

      {/* ---- Scrollable body ---- */}
      <div className="overflow-y-auto overscroll-contain" style={{ height: "calc(100dvh - 70px - env(safe-area-inset-top, 0px))" }}>

        {/* ===== DEFAULT STATE (no query) ===== */}
        {!hasQuery && (
          <div className="px-4 py-4 space-y-6">
            {/* Quick Filters */}
            {availableChips.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Quick Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {availableChips.map((conf) => (
                    <button
                      key={conf}
                      onClick={() => handleChip(conf)}
                      className="px-3.5 py-1.5 bg-gray-100 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                    >
                      {conf}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Recent Searches</h3>
                  <button onClick={handleClearRecents} className="text-xs text-blue-600 font-medium">Clear</button>
                </div>
                <div className="space-y-0">
                  {recents.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-800">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== RESULTS STATE ===== */}
        {hasQuery && results.length > 0 && (
          <div className="px-3 py-3 flex flex-col" style={{ gap: 5 }}>
            {results.map((school, idx) => {
              const divLabel = ({ D1: "D-I", D2: "D-II", D3: "D-III", JUCO: "JUCO" } as Record<string, string>)[school.division] || school.division;
              return (
                <button
                  key={school.id}
                  onClick={() => handleSelect(school)}
                  className="flex items-center bg-white rounded-xl border border-[rgba(0,0,0,0.05)] hover:border-[rgba(0,0,0,0.12)] hover:shadow-sm active:bg-gray-50 transition-all text-left"
                  style={{
                    padding: "10px 10px 10px 12px",
                    opacity: idx < visibleCount ? 1 : 0,
                    transform: idx < visibleCount ? "translateY(0)" : "translateY(8px)",
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                  }}
                >
                  {/* Logo */}
                  <div className="shrink-0 rounded-full bg-[#f5f5f7] border border-[rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden" style={{ width: 42, height: 42 }}>
                    {school.logo_url ? (
                      <img src={school.logo_url} alt="" className="w-[42px] h-[42px] object-contain" />
                    ) : (
                      <span className="text-[13px] font-bold text-gray-400">{school.name.charAt(0)}</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 ml-3">
                    <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">{school.name}</p>
                    <p className="text-[11px] text-[#888] truncate leading-tight mt-[2px]">
                      {divLabel}
                      {school.mascot ? ` · ${school.mascot}` : ""}
                      {school.conference ? <> · <span className="font-semibold text-[#666]">{school.conference}</span></> : ""}
                      {school.city ? ` · ${school.city}, ${school.state}` : ""}
                    </p>
                  </div>
                  {/* Chevron */}
                  <span className="shrink-0 text-[18px] text-[#ccc] ml-1 leading-none">&rsaquo;</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {hasQuery && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-base font-semibold text-gray-700 mb-1">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-gray-500">
              Try a different school, coach, or city
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
