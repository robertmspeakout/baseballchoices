"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import schoolsData from "@/data/schools.json";
import draftPicksData from "@/data/draft-picks.json";
import { getUserData, setUserData } from "@/lib/userData";
import { haversineDistance } from "@/lib/geo";

interface DraftPick {
  name: string;
  year: number;
  round: number;
  pick: number;
  team: string;
  position: string;
  current_level: string;
}

interface SchoolDetail {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  stadium_latitude: number | null;
  stadium_longitude: number | null;
  stadium_name: string | null;
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
  mlb_draft_picks: number | null;
  stadium_image_url: string | null;
  enrollment: number | null;
  acceptance_rate: number | null;
  graduation_rate: number | null;
  cws_appearances: number;
  ncaa_regionals: number;
  recruiting_questionnaire_url: string | null;
}

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

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

const RECRUITING_STATUSES = [
  "Researching",
  "Reached Out",
  "In Contact",
  "Mutual Interest",
  "Offer",
  "Committed",
];

const CONTACT_OPTIONS = [
  "Watched my video",
  "Saw me at a camp or showcase",
  "Came to my HS/travel game",
  "Evaluated me at their camp",
  "Spoke with my coach",
  "Followed me on social media",
];

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
  const [recruitingStatus, setRecruitingStatus] = useState("");
  const [theyvSeenMe, setTheyvSeenMe] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [myContactName, setMyContactName] = useState("");
  const [myContactEmail, setMyContactEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [distanceFromHome, setDistanceFromHome] = useState<number | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [draftExpanded, setDraftExpanded] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"info" | "tracking">("info");
  const [lastGame, setLastGame] = useState<ScheduleGame | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<ScheduleGame[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    const ud = getUserData(parseInt(id));
    setPriority(ud.priority);
    setNotes(ud.notes);
    setLastContacted(ud.last_contacted || "");
    setRecruitingStatus(ud.recruiting_status || "");
    setTheyvSeenMe(ud.theyve_seen_me || []);
    setDetail(ud.detail || "");
    setMyContactName(ud.my_contact_name || "");
    setMyContactEmail(ud.my_contact_email || "");

    try {
      const saved = localStorage.getItem("nextbase_homeZip");
      if (saved && schoolData?.latitude && schoolData?.longitude) {
        const { lat, lng } = JSON.parse(saved);
        setDistanceFromHome(haversineDistance(lat, lng, schoolData.latitude, schoolData.longitude));
      }
    } catch { /* ignore */ }

    setMounted(true);
  }, [id, schoolData]);

  useEffect(() => {
    if (!schoolData) return;
    setNewsLoading(true);
    fetch(`/api/news?school=${encodeURIComponent(schoolData.name)}`)
      .then((r) => r.json())
      .then((data) => setNews(data.articles || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [schoolData]);

  useEffect(() => {
    if (!schoolData) return;
    setScheduleLoading(true);
    fetch(`/api/schedule?school=${encodeURIComponent(schoolData.name)}`)
      .then((r) => r.json())
      .then((data) => {
        setLastGame(data.lastGame || null);
        setUpcomingGames(data.upcoming || []);
      })
      .catch(() => {
        setLastGame(null);
        setUpcomingGames([]);
      })
      .finally(() => setScheduleLoading(false));
  }, [schoolData]);

  const savePriority = (newPriority: number) => {
    setPriority(newPriority);
    setUserData(parseInt(id), { priority: newPriority });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveAll = () => {
    setSaving(true);
    setUserData(parseInt(id), {
      notes,
      last_contacted: lastContacted || null,
      recruiting_status: recruitingStatus,
      theyve_seen_me: theyvSeenMe,
      detail,
      my_contact_name: myContactName,
      my_contact_email: myContactEmail,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSeenMe = (option: string) => {
    setTheyvSeenMe((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
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
  const mapLat = school.stadium_latitude || school.latitude;
  const mapLng = school.stadium_longitude || school.longitude;

  const divLabel: Record<string, string> = {
    D1: "NCAA Division I", D2: "NCAA Division II",
    D3: "NCAA Division III", JUCO: "Junior College",
  };
  const divColor: Record<string, string> = {
    D1: "bg-blue-100 text-blue-800 border-blue-200",
    D2: "bg-green-100 text-green-800 border-green-200",
    D3: "bg-purple-100 text-purple-800 border-purple-200",
    JUCO: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const statusColor: Record<string, string> = {
    "Researching": "bg-gray-100 text-gray-700 border-gray-300",
    "Reached Out": "bg-blue-50 text-blue-700 border-blue-300",
    "In Contact": "bg-cyan-50 text-cyan-700 border-cyan-300",
    "Mutual Interest": "bg-purple-50 text-purple-700 border-purple-300",
    "Offer": "bg-amber-50 text-amber-700 border-amber-300",
    "Committed": "bg-green-50 text-green-700 border-green-300",
  };

  function formatNewsDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return ""; }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="relative bg-blue-950 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${school.stadium_image_url || "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/2019CWSVanderbiltVsLouisville.jpg/1600px-2019CWSVanderbiltVsLouisville.jpg"}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/40 to-blue-950/60" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-10 sm:pb-14">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors mb-6 sm:mb-10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
              {school.logo_url && !logoError ? (
                <img src={school.logo_url} alt={`${school.name} logo`} className="w-11 h-11 sm:w-16 sm:h-16 object-contain" onError={() => setLogoError(true)} />
              ) : (
                <span className="text-lg sm:text-2xl font-bold text-white/70">
                  {school.name.split(" ").map(w => w[0]).join("").slice(0, 3)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg truncate">{school.name}</h1>
              <p className="text-sm sm:text-base text-white/80 drop-shadow truncate">
                {school.mascot} &middot; {school.conference}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* School info card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden -mt-6 relative z-10">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold border ${divColor[school.division] || "bg-gray-100 text-gray-800"}`}>
                {divLabel[school.division] || school.division}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">{school.public_private}</span>
              <span className="text-xs text-gray-400">&middot;</span>
              <span className="text-xs sm:text-sm text-gray-500">{school.city}, {school.state}</span>
              {distanceFromHome != null && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {distanceFromHome.toLocaleString()} miles from home
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StarRating value={priority} onChange={savePriority} size="sm" />
              <span className="text-xs text-gray-500 font-medium">
                {priority === 0 && "Not Rated"}
                {priority === 1 && "Mildly Interested"}
                {priority === 2 && "Interested"}
                {priority === 3 && "Very Interested"}
                {priority === 4 && "Top Choice"}
                {priority === 5 && "VIP Choice"}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100">
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Current Record</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">0-0</p>
              {school.last_season_record && (
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Last Season: {school.last_season_record}</p>
              )}
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Current Ranking</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">{school.current_ranking ? `#${school.current_ranking}` : "NR"}</p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Postseason</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.cws_appearances > 0 ? `${school.cws_appearances} CWS` : school.ncaa_regionals > 0 ? `${school.ncaa_regionals} Reg.` : "None"}
              </p>
              {school.cws_appearances > 0 && school.ncaa_regionals > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{school.ncaa_regionals} Regionals</p>
              )}
            </div>
            <div className="p-3 sm:p-4 text-center col-span-1 hidden sm:block">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Type</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">{school.public_private}</p>
            </div>
            <div className="p-3 sm:p-4 text-center col-span-1 hidden sm:block">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Draft Picks</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.mlb_draft_picks ? school.mlb_draft_picks : "0"}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">since 2021</p>
            </div>
          </div>
        </div>

        {/* Detail Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveDetailTab("info")}
              className={`flex-1 px-4 py-3 text-sm sm:text-base font-semibold text-center transition-colors ${
                activeDetailTab === "info"
                  ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Program Info
            </button>
            <button
              onClick={() => setActiveDetailTab("tracking")}
              className={`flex-1 px-4 py-3 text-sm sm:text-base font-semibold text-center transition-colors ${
                activeDetailTab === "tracking"
                  ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Tracking
            </button>
          </nav>
        </div>

        {/* ===== PROGRAM INFO TAB ===== */}
        {activeDetailTab === "info" && (
          <>
            {/* Academics & School Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                Academics & School Info
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {school.enrollment && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Enrollment</p>
                    <p className="text-lg font-bold text-gray-900">{school.enrollment.toLocaleString()}</p>
                  </div>
                )}
                {school.acceptance_rate && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Acceptance Rate</p>
                    <p className="text-lg font-bold text-gray-900">{school.acceptance_rate}%</p>
                  </div>
                )}
                {school.graduation_rate && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Graduation Rate</p>
                    <p className="text-lg font-bold text-gray-900">{school.graduation_rate}%</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Tuition</p>
                  <p className="text-lg font-bold text-gray-900">{school.tuition ? `$${(school.tuition).toLocaleString()}` : "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Head Coach */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Head Coach
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-gray-900 font-semibold">{school.head_coach_name || "N/A"}</p>
                      {school.head_coach_email && (
                        <a href={`mailto:${school.head_coach_email}`} className="text-xs sm:text-sm text-blue-600 hover:underline break-all">
                          {school.head_coach_email}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      My Contact at {school.name}
                    </h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={myContactName}
                        onChange={(e) => setMyContactName(e.target.value)}
                        placeholder="Contact name at this school"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="email"
                        value={myContactEmail}
                        onChange={(e) => setMyContactEmail(e.target.value)}
                        placeholder="Contact email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
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
                    <a href={school.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors">
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12 2c-2 3-3 6-3 10s1 7 3 10m0-20c2 3 3 6 3 10s-1 7-3 10" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 9c2.5 1 5 1.5 8 1.5s5.5-.5 8-1.5M4 15c2.5-1 5-1.5 8-1.5s5.5.5 8 1.5" stroke="currentColor" strokeWidth="1" />
                        <path d="M5 10.5c2 .8 4.5 1.2 7 1.2s5-.4 7-1.2" stroke="red" strokeWidth="1" strokeDasharray="1.5 1.5" />
                        <path d="M5 13.5c2-.8 4.5-1.2 7-1.2s5 .4 7 1.2" stroke="red" strokeWidth="1" strokeDasharray="1.5 1.5" />
                      </svg>
                      Program Website
                    </a>
                  )}
                  {school.instagram && (
                    <a href={`https://instagram.com/${school.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg text-purple-700 font-medium transition-colors">
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
                    <a href={`https://x.com/${school.x_account.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800 font-medium transition-colors">
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

            {/* Latest Game & Upcoming Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </h2>

                {scheduleLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-blue-600" />
                    Loading schedule...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Latest Game Result */}
                    {lastGame && (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                        lastGame.result === "W"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}>
                        <span className={`text-lg font-extrabold ${
                          lastGame.result === "W" ? "text-green-700" : "text-red-700"
                        }`}>
                          {lastGame.result}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {lastGame.homeAway} {lastGame.opponent}
                          </p>
                          <p className="text-xs text-gray-500">{formatGameDate(lastGame.date)}</p>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{lastGame.score}</span>
                      </div>
                    )}

                    {/* Upcoming Games Table */}
                    {upcomingGames.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Upcoming Games</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Opponent</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Date / Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {upcomingGames.map((game, i) => (
                                <tr key={i} className="hover:bg-blue-50/30">
                                  <td className="px-3 py-2.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                                    {game.homeAway} {game.opponent}
                                  </td>
                                  <td className="px-3 py-2.5 text-sm text-gray-600 whitespace-nowrap">{game.location || "TBD"}</td>
                                  <td className="px-3 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                                    {formatGameDate(game.date)} &middot; {formatGameTime(game.date)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : !lastGame ? (
                      <p className="text-sm text-gray-400 py-2">No schedule data available</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* MLB Draft Picks — collapsible table */}
            {school.mlb_draft_picks != null && school.mlb_draft_picks > 0 && (() => {
              const picks = (draftPicksData as Record<string, DraftPick[]>)[school.name] || [];
              const mlbCount = picks.filter(p => p.current_level === "MLB").length;
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
                          {school.mlb_draft_picks} MLB Draft Picks
                          <span className="text-sm font-normal text-gray-500 ml-1.5">since 2021</span>
                        </h2>
                        <p className="text-xs text-gray-500">
                          {picks.length > 0 && mlbCount > 0
                            ? `${mlbCount} currently in MLB`
                            : picks.length > 0
                            ? "Players in minor league systems"
                            : "Players drafted to professional baseball"}
                        </p>
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
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Current</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {picks.sort((a, b) => b.year - a.year || a.round - b.round).map((pick, i) => (
                            <tr key={i} className="hover:bg-blue-50/30">
                              <td className="px-4 py-2.5">
                                <a
                                  href={`https://www.baseball-reference.com/search/search.fcgi?search=${encodeURIComponent(pick.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-700 hover:underline"
                                >
                                  {pick.name}
                                </a>
                              </td>
                              <td className="px-3 py-2.5 text-sm text-gray-700">{pick.year}</td>
                              <td className="px-3 py-2.5 text-sm text-gray-700">
                                Rd {pick.round}, #{pick.pick}
                              </td>
                              <td className="px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap">{pick.team}</td>
                              <td className="px-3 py-2.5 text-sm text-gray-700">{pick.position}</td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  pick.current_level === "MLB"
                                    ? "bg-green-100 text-green-800"
                                    : pick.current_level === "AAA"
                                    ? "bg-blue-100 text-blue-800"
                                    : pick.current_level === "AA"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {pick.current_level}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Latest News */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Latest News
              </h2>
              {newsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-blue-600" />
                  Loading news...
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-3">
                  {news.map((article, i) => (
                    <a key={i} href={article.link} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                        {article.source && <span className="font-medium text-gray-600">{article.source}</span>}
                        {article.source && article.pubDate && <span>&middot;</span>}
                        {article.pubDate && <span>{formatNewsDate(article.pubDate)}</span>}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-2">No recent news found</p>
              )}
            </div>

            {/* Location & Map */}
            {mapLat && mapLng && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {school.stadium_name ? school.stadium_name : "Location"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {school.city}, {school.state} {school.zip}
                    {distanceFromHome != null && (
                      <span className="ml-2 text-green-600 font-medium">
                        &middot; {distanceFromHome.toLocaleString()} miles from home
                      </span>
                    )}
                  </p>
                </div>
                <iframe
                  title={`Map of ${school.stadium_name || school.name}`}
                  className="w-full h-48 sm:h-64 border-t border-gray-100"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=16&output=embed`}
                />
              </div>
            )}
          </>
        )}

        {/* ===== MY TRACKING TAB ===== */}
        {activeDetailTab === "tracking" && (
          <>
            {/* Notes & Tracking */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Notes & Tracking
              </h2>
              <div className="space-y-4">
                {/* Recruiting Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Recruiting Status</label>
                  <div className="flex flex-wrap gap-2">
                    {RECRUITING_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => setRecruitingStatus(recruitingStatus === status ? "" : status)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                          recruitingStatus === status
                            ? statusColor[status] || "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Points of Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Points of Contact</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTACT_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleSeenMe(option)}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                          theyvSeenMe.includes(option)
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {theyvSeenMe.includes(option) && (
                          <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detail</label>
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={2}
                    placeholder="Additional recruiting details..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Last Contacted */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Contacted</label>
                    <input
                      type="date"
                      value={lastContacted}
                      onChange={(e) => setLastContacted(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes about this program, camp visits, conversations with coaches..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors text-sm"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  {saved && (
                    <span className="text-green-600 text-sm font-medium animate-pulse">Saved!</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
