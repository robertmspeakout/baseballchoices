"use client";

import Link from "next/link";
import StarRating from "./StarRating";
import { useState, useEffect, useRef } from "react";

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
  logo_url?: string | null;
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

function SortHeader({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  column: string;
  sortBy: string;
  sortDir: string;
  onSort: (col: string) => void;
}) {
  const active = sortBy === column;
  return (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none whitespace-nowrap"
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <span className="text-blue-600">
            {sortDir === "asc" ? "\u25B2" : "\u25BC"}
          </span>
        )}
      </span>
    </th>
  );
}

const priorityLabels: Record<number, string> = {
  0: "",
  1: "Mildly Interested",
  2: "Interested",
  3: "Very Interested",
  4: "Top Choice",
  5: "VIP Choice",
};

function divisionBadge(division: string) {
  const colors: Record<string, string> = {
    D1: "bg-blue-100 text-blue-800",
    D2: "bg-green-100 text-green-800",
    D3: "bg-purple-100 text-purple-800",
    JUCO: "bg-orange-100 text-orange-800",
  };
  const labels: Record<string, string> = {
    D1: "D-I",
    D2: "D-II",
    D3: "D-III",
    JUCO: "JUCO",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
        colors[division] || "bg-gray-100 text-gray-800"
      }`}
    >
      {labels[division] || division}
    </span>
  );
}

function SchoolLogo({ school }: { school: School }) {
  const [error, setError] = useState(false);
  if (school.logo_url && !error) {
    return (
      <img
        src={school.logo_url}
        alt=""
        className="w-10 h-10 object-contain"
        onError={() => setError(true)}
      />
    );
  }
  return (
    <span className="text-sm font-bold text-gray-400">
      {school.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
    </span>
  );
}

function RecordBadge({ record, fallbackRecord, loading }: { record: string | null | undefined; fallbackRecord: string | null; loading: boolean }) {
  if (loading) {
    return (
      <span className="text-xs text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full animate-pulse">
        --
      </span>
    );
  }
  if (record) {
    return (
      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
        {record}
      </span>
    );
  }
  if (fallbackRecord) {
    return (
      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
        {fallbackRecord}
      </span>
    );
  }
  return null;
}

// Mobile card layout
function MobileCard({
  school,
  distances,
  onPriorityChange,
  currentRecord,
  recordLoading,
}: {
  school: School;
  distances: Record<number, number> | null;
  onPriorityChange: (schoolId: number, priority: number) => void;
  currentRecord: string | null | undefined;
  recordLoading: boolean;
}) {
  return (
    <Link href={`/school/${school.id}`} className="block bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
          <SchoolLogo school={school} />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-blue-700 font-bold text-base block truncate">
                {school.name}
              </span>
              <p className="text-xs text-gray-500 truncate">
                {school.mascot ? `${school.mascot} · ` : ""}{school.city}, {school.state}
              </p>
            </div>
            {school.current_ranking && (
              <span className="shrink-0 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold">
                #{school.current_ranking}
              </span>
            )}
          </div>
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {divisionBadge(school.division)}
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{school.conference}</span>
            <RecordBadge record={currentRecord} fallbackRecord={school.last_season_record} loading={recordLoading} />
            {distances && distances[school.id] != null && (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                {distances[school.id].toLocaleString()} mi
              </span>
            )}
          </div>
          {/* My Ranking */}
          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
            <StarRating
              value={school.priority}
              onChange={(v) => onPriorityChange(school.id, v)}
              size="sm"
            />
            {school.priority > 0 && (
              <span className="text-xs text-gray-500 font-medium">{priorityLabels[school.priority]}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
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
    <>
      {/* Mobile: Card layout */}
      <div className="lg:hidden space-y-3">
        {/* Sort controls for mobile */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
          >
            <option value="name">Name</option>
            <option value="conference">Conference</option>
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
        {schools.map((school) => (
          <MobileCard
            key={school.id}
            school={school}
            distances={distances}
            onPriorityChange={onPriorityChange}
            currentRecord={currentRecords[school.name]}
            recordLoading={(school.division === "D1" || school.division === "D2") && recordsLoading}
          />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="School" column="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="My Ranking" column="priority" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Div</th>
              <SortHeader label="Conference" column="conference" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="State" column="state" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <SortHeader label="Record" column="record" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Natl Ranking" column="ranking" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              {distances && (
                <SortHeader label="From Home" column="distance" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              )}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Coach</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {schools.map((school) => {
              const rec = currentRecords[school.name];
              const isFetchable = school.division === "D1" || school.division === "D2";
              return (
                <tr
                  key={school.id}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/school/${school.id}`}
                >
                  <td className="px-3 py-3">
                    <span className="text-blue-700 font-semibold">
                      {school.name}
                    </span>
                    <div className="text-xs text-gray-500">
                      {school.mascot ? `${school.mascot} · ` : ""}{school.city}, {school.state}
                    </div>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <StarRating
                      value={school.priority}
                      onChange={(v) => onPriorityChange(school.id, v)}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-3">{divisionBadge(school.division)}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{school.conference}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{school.state}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{school.public_private}</td>
                  <td className="px-3 py-3 text-sm text-gray-700 text-center">
                    {isFetchable && recordsLoading ? (
                      <span className="text-gray-300 animate-pulse">--</span>
                    ) : rec ? (
                      <span className="font-semibold text-emerald-700">{rec}</span>
                    ) : school.last_season_record ? (
                      <span className="font-medium text-gray-600">{school.last_season_record}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 text-center">
                    {school.current_ranking ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        #{school.current_ranking}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  {distances && (
                    <td className="px-3 py-3 text-sm text-gray-700 text-right">
                      {distances[school.id] != null
                        ? `${distances[school.id].toLocaleString()} mi`
                        : "-"}
                    </td>
                  )}
                  <td className="px-3 py-3 text-sm text-gray-700 max-w-[140px] truncate">
                    {school.head_coach_name || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
