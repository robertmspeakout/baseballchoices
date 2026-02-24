"use client";

import { useEffect, useState } from "react";

interface DraftPick {
  name: string;
  year: number;
  round: number;
  pick: number;
  team: string;
  position: string;
  current_level: string;
}

interface DraftHistoryProps {
  schoolName: string;
}

export default function DraftHistory({ schoolName }: DraftHistoryProps) {
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [draftExpanded, setDraftExpanded] = useState(false);

  const draftCutoffYear = new Date().getFullYear() - 5;

  useEffect(() => {
    fetch(`/api/draft-picks?school=${encodeURIComponent(schoolName)}`)
      .then((r) => r.json())
      .then((data) => setDraftPicks(data.picks || []))
      .catch(() => setDraftPicks([]));
  }, [schoolName]);

  const filteredDraftPicks = draftPicks.filter(p => p.year >= draftCutoffYear);
  const picks = filteredDraftPicks;

  if (picks.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <img
                src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
                alt="MLB"
                className="w-10 h-10 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {picks.length} MLB Draft Pick{picks.length !== 1 ? "s" : ""}
                  <span className="text-sm font-normal text-gray-500 ml-1.5">since {draftCutoffYear}</span>
                </h2>
              </div>
            </div>
            {/* Prominent expand button */}
            {picks.length > 0 && (
              <button
                onClick={() => setDraftExpanded(!draftExpanded)}
                className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  draftExpanded
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                }`}
              >
                {draftExpanded ? "Hide Player Details" : `View All ${picks.length} Players`}
                <svg
                  className={`w-4 h-4 transition-transform ${draftExpanded ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {draftExpanded && picks.length > 0 && (
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Player</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Year</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Selection</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {picks.sort((a, b) => b.year - a.year || a.round - b.round).map((pick, i) => (
                    <tr key={i} className="hover:bg-blue-50/30">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                        {pick.name}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-700">{pick.year}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-700">
                        Rd {pick.round}, #{pick.pick}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap">{pick.team}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-700">{pick.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
  );
}
