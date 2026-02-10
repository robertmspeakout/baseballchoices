"use client";

interface Filters {
  search: string;
  division: string;
  state: string;
  conference: string;
  publicPrivate: string;
  priorityOnly: boolean;
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
  const update = (key: keyof Filters, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
      {/* Search bar */}
      <div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            placeholder="Search schools, cities, coaches, conferences..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <select
          value={filters.division}
          onChange={(e) => update("division", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
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
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
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
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
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
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Public & Private</option>
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </select>

        {/* Zip code input */}
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="Zip code"
            value={filters.zip}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5);
              update("zip", v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filters.zip.length === 5) {
                onZipSearch(filters.zip);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
            maxLength={5}
          />
          <button
            onClick={() => {
              if (filters.zip.length === 5) onZipSearch(filters.zip);
              else if (filters.zip === "") onZipSearch("");
            }}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            Mi
          </button>
        </div>

        {/* My List toggle */}
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={filters.priorityOnly}
            onChange={(e) => update("priorityOnly", e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>My List</span>
        </label>
      </div>
    </div>
  );
}
