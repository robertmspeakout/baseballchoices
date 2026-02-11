"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import schoolsData from "@/data/schools.json";
import { getUserData, setUserData } from "@/lib/userData";

interface SchoolDetail {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  zip: string;
  division: string;
  public_private: string;
  conference: string;
  current_ranking: number | null;
  tuition: number | null;
  instagram: string | null;
  x_account: string | null;
  head_coach_name: string | null;
  head_coach_email: string | null;
  assistant_coach_name: string | null;
  assistant_coach_email: string | null;
  website: string | null;
  last_season_record: string | null;
  logo_url: string | null;
}

export default function SchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const schoolData = (schoolsData as SchoolDetail[]).find((s) => s.id === parseInt(id));

  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState("");
  const [lastContacted, setLastContacted] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Load user data from localStorage on mount
  useEffect(() => {
    const ud = getUserData(parseInt(id));
    setPriority(ud.priority);
    setNotes(ud.notes);
    setLastContacted(ud.last_contacted || "");
    setMounted(true);
  }, [id]);

  const savePriority = (newPriority: number) => {
    setPriority(newPriority);
    setUserData(parseInt(id), { priority: newPriority });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveNotes = () => {
    setSaving(true);
    setUserData(parseInt(id), {
      notes,
      last_contacted: lastContacted || null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!schoolData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">School not found</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  const school = schoolData;

  const divLabel: Record<string, string> = {
    D1: "NCAA Division I",
    D2: "NCAA Division II",
    D3: "NCAA Division III",
    JUCO: "Junior College",
  };

  const divColor: Record<string, string> = {
    D1: "bg-blue-100 text-blue-800 border-blue-200",
    D2: "bg-green-100 text-green-800 border-green-200",
    D3: "bg-purple-100 text-purple-800 border-purple-200",
    JUCO: "bg-orange-100 text-orange-800 border-orange-200",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* School header card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-8 border-b border-gray-100">
            <div className="flex items-start gap-3 sm:gap-5">
              {/* School Logo - visible on all screens */}
              <div className="shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                {school.logo_url && !logoError ? (
                  <img
                    src={school.logo_url}
                    alt={`${school.name} logo`}
                    className="w-11 h-11 sm:w-16 sm:h-16 object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-lg sm:text-2xl font-bold text-gray-400">
                    {school.name.split(" ").map(w => w[0]).join("").slice(0, 3)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">{school.name}</h1>
                  <span
                    className={`shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                      divColor[school.division] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {divLabel[school.division] || school.division}
                  </span>
                </div>
                <p className="text-sm sm:text-lg text-gray-600 truncate">
                  {school.mascot} &middot; {school.city}, {school.state}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {school.conference} &middot; {school.public_private}
                </p>
                {/* Priority - inline on mobile */}
                <div className="flex items-center gap-2 mt-2">
                  <StarRating
                    value={priority}
                    onChange={savePriority}
                    size="sm"
                  />
                  <span className="text-xs text-gray-400">Your Priority</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats - 3 cols on mobile for better fit, 5 on desktop */}
          <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100">
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">2024 Record</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.last_season_record || "N/A"}
              </p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Ranking</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.current_ranking ? `#${school.current_ranking}` : "NR"}
              </p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Tuition</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.tuition ? `$${(school.tuition / 1000).toFixed(0)}k` : "N/A"}
              </p>
            </div>
            <div className="p-3 sm:p-4 text-center col-span-1 hidden sm:block">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Type</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.public_private}
              </p>
            </div>
            <div className="p-3 sm:p-4 text-center col-span-1 hidden sm:block">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Division</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.division === "JUCO" ? "JUCO" : school.division.replace("D", "D-")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coaching Staff */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Coaching Staff
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-[10px] sm:text-xs uppercase text-gray-500 font-medium">Head Coach</p>
                <p className="text-sm sm:text-base text-gray-900 font-semibold">{school.head_coach_name || "N/A"}</p>
                {school.head_coach_email && (
                  <a
                    href={`mailto:${school.head_coach_email}`}
                    className="text-xs sm:text-sm text-blue-600 hover:underline break-all"
                  >
                    {school.head_coach_email}
                  </a>
                )}
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase text-gray-500 font-medium">Assistant Coach</p>
                <p className="text-sm sm:text-base text-gray-900 font-semibold">{school.assistant_coach_name || "N/A"}</p>
                {school.assistant_coach_email && (
                  <a
                    href={`mailto:${school.assistant_coach_email}`}
                    className="text-xs sm:text-sm text-blue-600 hover:underline break-all"
                  >
                    {school.assistant_coach_email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Links & Social */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Links & Social
            </h2>
            <div className="space-y-3">
              {school.website && (
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  Program Website
                </a>
              )}
              {school.instagram && (
                <a
                  href={`https://instagram.com/${school.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg text-purple-700 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  <div>
                    <span>Follow on Instagram</span>
                    <span className="block text-xs text-purple-500 font-normal">{school.instagram}</span>
                  </div>
                </a>
              )}
              {school.x_account && (
                <a
                  href={`https://x.com/${school.x_account.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <div>
                    <span>Follow on X</span>
                    <span className="block text-xs text-gray-500 font-normal">{school.x_account}</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Notes and Tracking Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Your Notes & Tracking
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Contacted
              </label>
              <input
                type="date"
                value={lastContacted}
                onChange={(e) => setLastContacted(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Notes about this program, camp visits, conversations with coaches..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-sm sm:text-base"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors text-sm sm:text-base"
              >
                {saving ? "Saving..." : "Save Notes"}
              </button>
              {saved && (
                <span className="text-green-600 text-sm font-medium animate-pulse">
                  Saved!
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
