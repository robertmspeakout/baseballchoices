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
  const isMyList = activeTab === "mylist";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-6 shadow-sm">
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
    </div>
  );
}
