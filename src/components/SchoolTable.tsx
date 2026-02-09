"use client";

import Link from "next/link";
import StarRating from "./StarRating";

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
}

interface SchoolTableProps {
  schools: School[];
  distances: Record<number, number> | null;
  sortBy: string;
  sortDir: string;
  onSort: (column: string) => void;
  onPriorityChange: (schoolId: number, priority: number) => void;
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

function formatTuition(tuition: number | null): string {
  if (!tuition) return "-";
  return `$${tuition.toLocaleString()}`;
}

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
        <svg className="mx-auto w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium">No schools found</p>
        <p className="text-sm">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader label="School" column="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Div</th>
            <SortHeader label="Conference" column="conference" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="State" column="state" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
            <SortHeader label="Rank" column="ranking" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Tuition" column="tuition" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            {distances && (
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Miles</th>
            )}
            <SortHeader label="Priority" column="priority" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Coach</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {schools.map((school) => (
            <tr key={school.id} className="hover:bg-blue-50/50 transition-colors">
              <td className="px-3 py-3">
                <Link
                  href={`/school/${school.id}`}
                  className="text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                >
                  {school.name}
                </Link>
                <div className="text-xs text-gray-500">
                  {school.mascot} &middot; {school.city}, {school.state}
                </div>
              </td>
              <td className="px-3 py-3">{divisionBadge(school.division)}</td>
              <td className="px-3 py-3 text-sm text-gray-700">{school.conference}</td>
              <td className="px-3 py-3 text-sm text-gray-700">{school.state}</td>
              <td className="px-3 py-3 text-sm text-gray-700">{school.public_private}</td>
              <td className="px-3 py-3 text-sm text-gray-700 text-center">
                {school.current_ranking ? (
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold">
                    #{school.current_ranking}
                  </span>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
              <td className="px-3 py-3 text-sm text-gray-700">
                {formatTuition(school.tuition)}
              </td>
              {distances && (
                <td className="px-3 py-3 text-sm text-gray-700 text-right">
                  {distances[school.id] != null
                    ? `${distances[school.id].toLocaleString()} mi`
                    : "-"}
                </td>
              )}
              <td className="px-3 py-3">
                <StarRating
                  value={school.priority}
                  onChange={(v) => onPriorityChange(school.id, v)}
                  size="sm"
                />
              </td>
              <td className="px-3 py-3 text-sm text-gray-700 max-w-[140px] truncate">
                {school.head_coach_name || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
