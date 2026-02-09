"use client";

import { useCallback, useEffect, useState } from "react";
import SearchFilters from "@/components/SearchFilters";
import SchoolTable from "@/components/SchoolTable";

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

interface Filters {
  search: string;
  division: string;
  state: string;
  conference: string;
  publicPrivate: string;
  priorityOnly: boolean;
  zip: string;
}

export default function Home() {
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [distances, setDistances] = useState<Record<number, number> | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    division: "",
    state: "",
    conference: "",
    publicPrivate: "",
    priorityOnly: false,
    zip: "",
  });

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "50",
      sortBy,
      sortDir,
    });
    if (filters.search) params.set("search", filters.search);
    if (filters.division) params.set("division", filters.division);
    if (filters.state) params.set("state", filters.state);
    if (filters.conference) params.set("conference", filters.conference);
    if (filters.publicPrivate) params.set("publicPrivate", filters.publicPrivate);
    if (filters.priorityOnly) params.set("priorityOnly", "true");

    const res = await fetch(`/api/schools?${params}`);
    const data = await res.json();
    setSchools(data.schools);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, sortBy, sortDir, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchSchools, 200);
    return () => clearTimeout(timer);
  }, [fetchSchools]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, sortDir]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const handlePriorityChange = async (schoolId: number, priority: number) => {
    await fetch(`/api/user-data/${schoolId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, priority } : s))
    );
  };

  const handleZipSearch = async (zip: string) => {
    if (!zip) {
      setDistances(null);
      return;
    }
    const res = await fetch(`/api/distance?zip=${zip}`);
    if (res.ok) {
      const data = await res.json();
      setDistances(data.distances);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-xl p-2.5">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2C12 2 5 8 5 12s3.13 10 7 10 7-6 7-10S12 2 12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 12h20" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                BaseballChoices
              </h1>
              <p className="text-blue-200 text-sm sm:text-base">
                College Baseball Recruiting Directory
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{total} programs</span>
          <span className="text-gray-300">|</span>
          <span>D-I, D-II, D-III & Junior College</span>
          {distances && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-green-700 font-medium">
                Showing distances from {filters.zip}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          onZipSearch={handleZipSearch}
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
          </div>
        ) : (
          <>
            <SchoolTable
              schools={schools}
              distances={distances}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onPriorityChange={handlePriorityChange}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 text-center text-sm text-gray-500">
          BaseballChoices &mdash; Your college baseball recruiting companion.
          Data for informational purposes only.
        </div>
      </footer>
    </div>
  );
}
