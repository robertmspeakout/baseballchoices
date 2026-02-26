"use client";

import { useState, useEffect, useRef } from "react";
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

// Hook to fetch current-season records for visible schools
function useCurrentRecords(schools: School[]) {
  const [records, setRecords] = useState<Record<string, string | null>>({});
  const fetchedRef = useRef<Set<string>>(new Set());
  const failedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Fetch for D1 and D2 schools that we haven't successfully fetched yet
    const toFetch = schools
      .filter((s) => (s.division === "D1" || s.division === "D2") && !fetchedRef.current.has(s.name) && !failedRef.current.has(s.name))
      .map((s) => s.name)
      .slice(0, 25);

    if (toFetch.length === 0) return;

    // Mark as in-flight (use failedRef temporarily, promote to fetchedRef on success)
    const inFlight = new Set(toFetch);

    fetch(`/api/records?schools=${encodeURIComponent(toFetch.join(","))}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.records) {
          setRecords((prev) => ({ ...prev, ...data.records }));
          // Mark successfully fetched schools
          for (const name of Object.keys(data.records)) {
            fetchedRef.current.add(name);
            inFlight.delete(name);
          }
        }
        // Mark remaining as failed (allow retry on next render)
        for (const name of inFlight) {
          failedRef.current.add(name);
        }
      })
      .catch(() => {
        // On network error, mark all as failed so they can be retried
        for (const name of inFlight) {
          failedRef.current.add(name);
        }
      });
  }, [schools]);

  return records;
}

export default function SchoolTable({
  schools,
  distances,
  sortBy,
  sortDir,
  onSort,
  onPriorityChange,
}: SchoolTableProps) {
  const currentRecords = useCurrentRecords(schools);
  const hasAnyFetchable = schools.some((s) => s.division === "D1" || s.division === "D2");
  const recordsLoading = hasAnyFetchable && Object.keys(currentRecords).length === 0;

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
        {schools.map((school) => {
          const isFetchable = school.division === "D1" || school.division === "D2";
          return (
            <ProgramRow
              key={school.id}
              school={school}
              currentRecord={currentRecords[school.name]}
              recordLoading={isFetchable && recordsLoading}
              onPriorityChange={onPriorityChange}
            />
          );
        })}
      </div>
    </div>
  );
}
