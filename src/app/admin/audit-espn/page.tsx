"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AuditEspnPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [singleResult, setSingleResult] = useState<any>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [fullMode, setFullMode] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const url = fullMode ? "/api/admin/audit-espn?full=1" : "/api/admin/audit-espn";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `HTTP ${res.status}`);
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err.message || "Fetch failed");
    }
    setLoading(false);
  };

  const searchSchool = async () => {
    if (!schoolSearch.trim()) return;
    setSingleLoading(true);
    setSingleResult(null);
    try {
      const res = await fetch(`/api/admin/audit-espn?school=${encodeURIComponent(schoolSearch.trim())}`);
      const json = await res.json();
      setSingleResult(json);
    } catch (err: any) {
      setSingleResult({ error: err.message });
    }
    setSingleLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" showTagline={false} />
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-900/30 px-2 py-1 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
              &larr; School Admin
            </Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ESPN ID Audit</h1>
        <p className="text-sm text-gray-500 mb-6">
          Verify ESPN team ID mappings and find correct IDs for schools.
        </p>

        {/* Single school lookup */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Look Up a School</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchSchool()}
              placeholder="e.g. Portland"
              className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={searchSchool}
              disabled={singleLoading || !schoolSearch.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {singleLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {singleResult && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(singleResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Full audit */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Full Audit</h2>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={fullMode}
                onChange={(e) => setFullMode(e.target.checked)}
                className="rounded border-gray-300"
              />
              Include all D1 schools (not just curated map)
            </label>
            <button
              onClick={runAudit}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Auditing..." : "Run Audit"}
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.espnTeamsCount}</div>
                  <div className="text-xs text-gray-500">ESPN Teams</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{data.summary?.correct}</div>
                  <div className="text-xs text-green-600">Correct</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">{data.summary?.mismatches}</div>
                  <div className="text-xs text-red-600">Mismatches</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{data.summary?.notInEspn}</div>
                  <div className="text-xs text-yellow-600">Not in ESPN</div>
                </div>
              </div>

              {/* Mismatches */}
              {data.mismatches?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Mismatches</h3>
                  <div className="bg-red-50 rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-red-200">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">School</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">Curated ID</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">ESPN Name</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">Suggested Fix</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {data.mismatches.map((m: any) => (
                          <tr key={m.school}>
                            <td className="px-4 py-2 font-medium text-gray-900">{m.school}</td>
                            <td className="px-4 py-2 text-gray-600">{m.curatedId}</td>
                            <td className="px-4 py-2 text-gray-600">{m.espnName}</td>
                            <td className="px-4 py-2 text-green-700 font-mono">
                              {data.corrections?.[m.school] || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Not in ESPN */}
              {data.notInEspn?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-yellow-700 mb-2">Not Found in ESPN</h3>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <ul className="text-sm text-gray-700 space-y-1">
                      {data.notInEspn.map((item: any) => (
                        <li key={item.school}>
                          <span className="font-medium">{item.school}</span> (ID: {item.id})
                          {data.corrections?.[item.school] && (
                            <span className="ml-2 text-green-700">→ suggested: {data.corrections[item.school]}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Unmapped (full mode) */}
              {data.unmapped?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Unmapped D1 Schools ({data.unmapped.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <ul className="text-sm text-gray-700 space-y-1">
                      {data.unmapped.map((item: any) => (
                        <li key={item.name}>
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-2 text-gray-500">({item.status})</span>
                          {item.candidates && (
                            <span className="ml-2 text-xs text-gray-400">
                              candidates: {item.candidates.map((c: any) => `${c.displayName} (${c.id})`).join(", ")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Suggested new entries (full mode) */}
              {data.suggestedNewEntriesCount > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-2">
                    Suggested New Entries ({data.suggestedNewEntriesCount})
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(data.suggestedNewEntries, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Corrected map */}
              <details className="bg-gray-50 rounded-lg">
                <summary className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 rounded-lg">
                  Full Corrected Map ({Object.keys(data.correctedMap || {}).length} entries)
                </summary>
                <div className="px-4 pb-4">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {JSON.stringify(data.correctedMap, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
