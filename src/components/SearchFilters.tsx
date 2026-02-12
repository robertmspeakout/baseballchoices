"use client";

interface Filters {
  search: string;
  division: string;
  state: string;
  conference: string;
  publicPrivate: string;
  zip: string;
}

interface FilterOptions {
  states: string[];
  conferences: string[];
  divisions: string[];
}

interface SearchFiltersProps {
  filters: Filters;
  filterOptions: FilterOptions;
  onChange: (filters: Filters) => void;
  onZipSearch: (zip: string) => void;
}

export default function SearchFilters({
  filters,
  filterOptions,
  onChange,
  onZipSearch,
}: SearchFiltersProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <select
          value={filters.division}
          onChange={(e) => update("division", e.target.value)}
          className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Divisions</option>
          {filterOptions.divisions.map((d) => (
            <option key={d} value={d}>
              {d === "JUCO" ? "Junior College" : `Division ${d.replace("D", "")}`}
            </option>
          ))}
        </select>

        <select
          value={filters.state}
          onChange={(e) => update("state", e.target.value)}
          className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          {filterOptions.states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filters.conference}
          onChange={(e) => update("conference", e.target.value)}
          className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Conferences</option>
          {filterOptions.conferences.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.publicPrivate}
          onChange={(e) => update("publicPrivate", e.target.value)}
          className="px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Public & Private</option>
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </select>

        {/* Zip code distance search */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            placeholder="Your zip code"
            value={filters.zip}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5);
              update("zip", v);
              if (v.length === 5) {
                onZipSearch(v);
              } else if (v === "") {
                onZipSearch("");
              }
            }}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
            maxLength={5}
          />
        </div>

      </div>
    </div>
  );
}
