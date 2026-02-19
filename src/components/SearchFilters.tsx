"use client";

import { REGIONS } from "@/lib/playerProfile";

const REGION_NAMES = Object.keys(REGIONS);

interface Filters {
  search: string;
  division: string;
  state: string;
  conference: string;
  publicPrivate: string;
  zip: string;
  region: string;
}

interface FilterOptions {
  states: string[];
  conferences: string[];
  divisions: string[];
  divisionConferences?: Record<string, string[]>;
}

interface SearchFiltersProps {
  filters: Filters;
  filterOptions: FilterOptions;
  onChange: (filters: Filters) => void;
  onZipSearch: (zip: string) => void;
  activeTab?: string; // "mylist" | "D1" | "D2" | "D3"
}

export default function SearchFilters({
  filters,
  filterOptions,
  onChange,
  activeTab,
}: SearchFiltersProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  // When on a division tab, hide division dropdown and filter conferences to that division
  const isDivisionTab = activeTab === "D1" || activeTab === "D2" || activeTab === "D3";
  const visibleConferences = isDivisionTab
    ? filterOptions.conferences.filter((c) =>
        filterOptions.divisionConferences?.[activeTab!]?.includes(c) ?? true
      )
    : filterOptions.conferences;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
      {/* Search bar */}
      <div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search schools, coaches, cities..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isDivisionTab ? "lg:grid-cols-4" : "lg:grid-cols-6"} gap-2 sm:gap-3`}>
        {!isDivisionTab && (
          <select
            value={filters.division}
            onChange={(e) => update("division", e.target.value)}
            className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Division</option>
            {filterOptions.divisions.map((d) => (
              <option key={d} value={d}>
                {d === "JUCO" ? "Junior College" : `Division ${d.replace("D", "")}`}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.conference}
          onChange={(e) => update("conference", e.target.value)}
          className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Conference</option>
          {visibleConferences.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.region}
          onChange={(e) => update("region", e.target.value)}
          className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Region</option>
          {REGION_NAMES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filters.state}
          onChange={(e) => update("state", e.target.value)}
          className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">State</option>
          {filterOptions.states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={() => update("publicPrivate", filters.publicPrivate === "highAcademic" ? "" : "highAcademic")}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 border rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            filters.publicPrivate === "highAcademic"
              ? "bg-yellow-50 text-yellow-800 border-yellow-400"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <svg className={`w-4 h-4 ${filters.publicPrivate === "highAcademic" ? "text-yellow-500" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          High Academic
        </button>

      </div>
    </div>
  );
}
