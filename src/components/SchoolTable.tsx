"use client";

import ProgramRow from "./ProgramRow";

interface School {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  division: string;
  public_private: string;
  conference: string;
  current_ranking: number | null;
  tuition: number | null;
  priority: number;
  last_contacted: string | null;
  head_coach_name: string | null;
  high_academic?: boolean;
  logo_url?: string | null;
  website?: string | null;
  last_season_record: string | null;
}

interface SchoolTableProps {
  schools: School[];
  distances: Record<number, number> | null;
  sortBy: string;
  sortDir: string;
  onSort: (column: string) => void;
  onPriorityChange: (schoolId: number, priority: number) => void;
}

export default function SchoolTable({
  schools,
  distances,
  sortBy,
  sortDir,
  onSort,
  onPriorityChange,
}: SchoolTableProps) {
  if (schools.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="mx-auto w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-base font-medium">No schools found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-xs text-gray-500 font-medium">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
        >
          <option value="name">Name</option>
          <option value="state">State</option>
          <option value="ranking">National Ranking</option>
          <option value="priority">My Ranking</option>
          {distances && <option value="distance">Distance from Home</option>}
        </select>
        <button
          onClick={() => onSort(sortBy)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
        >
          {sortDir === "asc" ? "\u25B2 Asc" : "\u25BC Desc"}
        </button>
      </div>

      {/* Compact rows */}
      <div className="flex flex-col" style={{ gap: 5 }}>
        {schools.map((school) => (
          <ProgramRow
            key={school.id}
            school={school}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </div>
  );
}
