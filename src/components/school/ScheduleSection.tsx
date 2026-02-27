"use client";

import { useEffect, useState } from "react";

interface ScheduleGame {
  date: string;
  opponent: string;
  opponentLogo: string;
  location: string;
  homeAway: string;
  score: string | null;
  result: string | null;
  completed: boolean;
}

interface ScheduleSectionProps {
  schoolName: string;
  logoUrl?: string;
}

function formatGameDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return ""; }
}

function formatGameTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch { return "TBD"; }
}

export default function ScheduleSection({ schoolName, logoUrl }: ScheduleSectionProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<string | null>(null);
  const [recentGames, setRecentGames] = useState<ScheduleGame[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<ScheduleGame[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    setScheduleLoading(true);
    const espnId = logoUrl?.match(/espncdn\.com\/.*\/(\d+)\.\w+$/)?.[1] || "";
    fetch(`/api/schedule?school=${encodeURIComponent(schoolName)}${espnId ? `&espn_id=${espnId}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setCurrentRecord(data.record || null);
        setRecentGames(data.recentGames || []);
        setUpcomingGames(data.upcoming || []);
      })
      .catch(() => {
        setCurrentRecord(null);
        setRecentGames([]);
        setUpcomingGames([]);
      })
      .finally(() => setScheduleLoading(false));
  }, [schoolName, logoUrl]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setScheduleOpen(!scheduleOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Schedule</span>
        <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${scheduleOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {scheduleOpen && (
      <div className="border-t border-gray-100 p-4 sm:p-6">
            {scheduleLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-blue-600" />
                Loading schedule...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Record */}
                {currentRecord && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Record:</span>
                    <span className="text-lg font-bold text-gray-900">{currentRecord}</span>
                  </div>
                )}

                {/* Recent Games (hidden if no completed games) */}
                {recentGames.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Games</h3>
                    {/* Mobile: card layout */}
                    <div className="sm:hidden space-y-2">
                      {recentGames.map((game, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className={`shrink-0 w-8 text-center px-1.5 py-0.5 rounded text-xs font-bold ${
                            game.result === "W" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {game.result}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{game.homeAway} {game.opponent}</p>
                            <p className="text-xs text-gray-500">{formatGameDate(game.date)}</p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-gray-700">{game.score}</span>
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Result</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Opponent</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {recentGames.map((game, i) => (
                            <tr key={i} className="hover:bg-blue-50/30">
                              <td className="px-3 py-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                  game.result === "W" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {game.result}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{game.homeAway} {game.opponent}</td>
                              <td className="px-3 py-2.5 text-sm font-semibold text-gray-700">{game.score}</td>
                              <td className="px-3 py-2.5 text-sm text-gray-500">{formatGameDate(game.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Upcoming Games */}
                {upcomingGames.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Upcoming Games</h3>
                    {/* Mobile: card layout */}
                    <div className="sm:hidden space-y-2">
                      {upcomingGames.slice(0, 3).map((game, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">{game.homeAway} {game.opponent}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{formatGameDate(game.date)} &middot; {formatGameTime(game.date)}</span>
                          </div>
                          {game.location && <p className="text-xs text-gray-400 mt-0.5 truncate">{game.location}</p>}
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Opponent</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Date / Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {upcomingGames.slice(0, 3).map((game, i) => (
                            <tr key={i} className="hover:bg-blue-50/30">
                              <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{game.homeAway} {game.opponent}</td>
                              <td className="px-3 py-2.5 text-sm text-gray-600">{game.location || "TBD"}</td>
                              <td className="px-3 py-2.5 text-sm text-gray-600">
                                {formatGameDate(game.date)} &middot; {formatGameTime(game.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : recentGames.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No schedule data available</p>
                ) : null}
              </div>
            )}
          </div>
      )}
        </div>
  );
}
