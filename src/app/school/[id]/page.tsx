"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import SiteNav from "@/components/SiteNav";
import AuthGate from "@/components/AuthGate";
import StarRating from "@/components/StarRating";
import schoolsData from "@/data/schools.json";
import draftPicksData from "@/data/draft-picks.json";
import { useSession } from "next-auth/react";
import { getUserData, setUserData, fetchUserDataFromDB, saveUserDataToDB } from "@/lib/userData";
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
  nil_url: string | null;
  high_academic: boolean;
  primary_color?: string | null;
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

// Coach photo component - tries to load from school's athletics site, falls back to styled initials
function CoachPhoto({ name, schoolName }: { name: string | null; schoolName: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!name) return;
    // Try to find a coach headshot via our API
    fetch(`/api/coach-photo?name=${encodeURIComponent(name)}&school=${encodeURIComponent(schoolName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setImgSrc(data.url);
      })
      .catch(() => {});
  }, [name, schoolName]);

  const initials = name
    ? name.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
    : "?";

  if (imgSrc && !error) {
    return (
      <img
        src={imgSrc}
        alt={name || "Coach"}
        className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover object-top shadow-md border-2 border-gray-100"
        onError={() => setError(true)}
      />
    );
  }

  // Styled initials fallback with gradient
  return (
    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-md border-2 border-gray-200">
      <span className="text-xl sm:text-2xl font-black text-white/80">{initials}</span>
    </div>
  );
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
  const { data: session, status: authStatus } = useSession();
  const isLoggedIn = authStatus === "authenticated" && !!session?.user;
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
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<string | null>(null);
  const [recentGames, setRecentGames] = useState<ScheduleGame[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<ScheduleGame[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [facilityPhotos, setFacilityPhotos] = useState<{ url: string; caption: string }[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [academicsData, setAcademicsData] = useState<{
    scorecard: {
      matched_name: string;
      student_faculty_ratio: number | null;
      in_state_tuition: number | null;
      out_of_state_tuition: number | null;
      avg_net_price: number | null;
      aid_percentage: number | null;
      sat_25: number | null;
      sat_75: number | null;
      act_25: number | null;
      act_75: number | null;
    } | null;
    apr: { school_name: string; apr: number; year: string } | null;
  } | null>(null);

  // Track last-saved values so we can detect unsaved changes
  const savedSnapshot = useRef({
    notes: "", lastContacted: "", recruitingStatus: "",
    theyvSeenMe: [] as string[], detail: "", myContactName: "", myContactEmail: "",
  });

  useEffect(() => {
    const schoolId = parseInt(id);
    // Load from localStorage first (instant)
    const ud = getUserData(schoolId);
    setPriority(ud.priority);
    setNotes(ud.notes);
    setLastContacted(ud.last_contacted || "");
    setRecruitingStatus(ud.recruiting_status || "");
    setTheyvSeenMe(ud.theyve_seen_me || []);
    setDetail(ud.detail || "");
    setMyContactName(ud.my_contact_name || "");
    setMyContactEmail(ud.my_contact_email || "");
    savedSnapshot.current = {
      notes: ud.notes, lastContacted: ud.last_contacted || "",
      recruitingStatus: ud.recruiting_status || "", theyvSeenMe: ud.theyve_seen_me || [],
      detail: ud.detail || "", myContactName: ud.my_contact_name || "",
      myContactEmail: ud.my_contact_email || "",
    };

    // If logged in, also fetch from DB (overwrites localStorage values)
    if (isLoggedIn) {
      fetchUserDataFromDB().then((dbData) => {
        const dbSchool = dbData[schoolId];
        if (dbSchool) {
          setPriority(dbSchool.priority);
          setNotes(dbSchool.notes);
          setLastContacted(dbSchool.last_contacted || "");
          setRecruitingStatus(dbSchool.recruiting_status || "");
          setTheyvSeenMe(dbSchool.theyve_seen_me || []);
          setDetail(dbSchool.detail || "");
          setMyContactName(dbSchool.my_contact_name || "");
          setMyContactEmail(dbSchool.my_contact_email || "");
          savedSnapshot.current = {
            notes: dbSchool.notes, lastContacted: dbSchool.last_contacted || "",
            recruitingStatus: dbSchool.recruiting_status || "", theyvSeenMe: dbSchool.theyve_seen_me || [],
            detail: dbSchool.detail || "", myContactName: dbSchool.my_contact_name || "",
            myContactEmail: dbSchool.my_contact_email || "",
          };
        }
      }).catch(() => {});
    }

    try {
      const saved = localStorage.getItem("nextbase_homeZip");
      if (saved && schoolData?.latitude && schoolData?.longitude) {
        const { lat, lng } = JSON.parse(saved);
        setDistanceFromHome(haversineDistance(lat, lng, schoolData.latitude, schoolData.longitude));
      }
    } catch { /* ignore */ }

    setMounted(true);
  }, [id, schoolData, isLoggedIn]);

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
  }, [schoolData]);

  useEffect(() => {
    if (!schoolData) return;
    // Only fetch stadium photos when we have a stadium name for accurate results
    if (!schoolData.stadium_name) {
      setFacilityPhotos([]);
      setPhotosLoading(false);
      return;
    }
    setPhotosLoading(true);
    fetch(`/api/stadium-photos?school=${encodeURIComponent(schoolData.name)}&stadium=${encodeURIComponent(schoolData.stadium_name)}&mascot=${encodeURIComponent(schoolData.mascot || "")}`)
      .then((r) => r.json())
      .then((data) => setFacilityPhotos(data.photos || []))
      .catch(() => setFacilityPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, [schoolData]);

  useEffect(() => {
    if (!schoolData) return;
    fetch(`/api/academics-data?school=${encodeURIComponent(schoolData.name)}&state=${encodeURIComponent(schoolData.state || "")}`)
      .then((r) => r.json())
      .then((data) => setAcademicsData(data))
      .catch(() => setAcademicsData(null));
  }, [schoolData]);

  const savePriority = (newPriority: number) => {
    setPriority(newPriority);
    setUserData(parseInt(id), { priority: newPriority });
    if (isLoggedIn) {
      saveUserDataToDB(parseInt(id), { priority: newPriority }).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveAll = async () => {
    setSaving(true);
    const updates = {
      notes,
      last_contacted: lastContacted || null,
      recruiting_status: recruitingStatus,
      theyve_seen_me: theyvSeenMe,
      detail,
      my_contact_name: myContactName,
      my_contact_email: myContactEmail,
    };
    setUserData(parseInt(id), updates);
    if (isLoggedIn) {
      try {
        await saveUserDataToDB(parseInt(id), updates);
      } catch { /* localStorage is the fallback */ }
    }
    savedSnapshot.current = {
      notes, lastContacted, recruitingStatus, theyvSeenMe,
      detail, myContactName, myContactEmail,
    };
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasUnsavedChanges = mounted && (
    notes !== savedSnapshot.current.notes ||
    lastContacted !== savedSnapshot.current.lastContacted ||
    recruitingStatus !== savedSnapshot.current.recruitingStatus ||
    JSON.stringify(theyvSeenMe) !== JSON.stringify(savedSnapshot.current.theyvSeenMe) ||
    detail !== savedSnapshot.current.detail ||
    myContactName !== savedSnapshot.current.myContactName ||
    myContactEmail !== savedSnapshot.current.myContactEmail
  );

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
  const draftCutoffYear = new Date().getFullYear() - 5;
  const draftPicksCount = ((draftPicksData as Record<string, DraftPick[]>)[school.name] || []).filter(p => p.year >= draftCutoffYear).length;
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
    <AuthGate>
    <div className="min-h-screen bg-gray-50">
      <header className="relative text-white overflow-x-clip overflow-y-visible z-30">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url('${facilityPhotos.length > 0 ? facilityPhotos[0].url : "https://images.unsplash.com/photo-1629219644109-b4df0ab25a7b?w=1920&q=80"}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex items-start justify-between">
            <BrandLogo size="lg" showTagline={true} />
            <SiteNav variant="dark" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* School identity card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex items-center gap-4 sm:gap-5 border-b border-gray-100">
            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
              {school.logo_url && !logoError ? (
                <img src={school.logo_url} alt={`${school.name} logo`} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" onError={() => setLogoError(true)} />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-gray-400">
                  {school.name.split(" ").map(w => w[0]).join("").slice(0, 3)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight truncate uppercase">{school.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {school.mascot && <span className="text-sm font-semibold text-gray-500">{school.mascot}</span>}
                {school.mascot && <span className="text-gray-300">|</span>}
                <span className="text-sm font-semibold text-blue-600">{school.conference}</span>
                {(school.city || school.state) && <span className="text-gray-300">|</span>}
                {(school.city || school.state) && (
                  <span className="text-sm font-semibold text-gray-500">{school.city}{school.city && school.state ? ", " : ""}{school.state}</span>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold border ${divColor[school.division] || "bg-gray-100 text-gray-800"}`}>
                {divLabel[school.division] || school.division}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StarRating value={priority} onChange={savePriority} size="sm" />
              <span className="text-xs text-gray-500 font-medium">
                {priority === 0 && "Not Rated"}
                {priority === 1 && "Mildly Interested"}
                {priority === 2 && "Interested"}
                {priority === 3 && "Very Interested"}
                {priority === 4 && "Top Choice"}
                {priority === 5 && "VIP"}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">{currentRecord ? "Current Record" : "Record"}</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {currentRecord || school.last_season_record || (scheduleLoading ? "..." : "-")}
              </p>
              {currentRecord && school.last_season_record && (
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Last Season: {school.last_season_record}</p>
              )}
              {!currentRecord && school.last_season_record && !scheduleLoading && (
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Last Season</p>
              )}
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Current Ranking</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">{school.current_ranking ? `#${school.current_ranking}` : "NR"}</p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Postseason</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {school.cws_appearances > 0 ? `${school.cws_appearances} CWS` : school.ncaa_regionals > 0 ? `${school.ncaa_regionals} Regional${school.ncaa_regionals !== 1 ? "s" : ""}` : "None"}
              </p>
              {school.cws_appearances > 0 && school.ncaa_regionals > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{school.ncaa_regionals} Regionals</p>
              )}
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Draft Picks</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {draftPicksCount}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">since {draftCutoffYear}</p>
            </div>
          </div>
        </div>

        {/* ===== RECRUITING TRACKER — Collapsible Banner ===== */}
        {(() => {
          const schoolColor = school.primary_color || "#1e3a5f";
          return (
        <div className="rounded-xl border-2 shadow-sm overflow-hidden" style={{ borderColor: `${schoolColor}40` }}>
          {/* Banner header — always visible */}
          <button
            onClick={() => setTrackerOpen(!trackerOpen)}
            className="w-full flex items-center gap-3 px-4 sm:px-6 py-3.5 transition-opacity hover:opacity-90 text-left"
            style={{ backgroundColor: schoolColor }}
          >
            <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="text-white font-bold text-sm sm:text-base">My Notes: Recruiting Tracker</span>
              {/* Status summary */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                {recruitingStatus ? (
                  <span className="text-white/80 text-xs sm:text-sm">{recruitingStatus}</span>
                ) : (
                  <span className="text-white/60 text-xs sm:text-sm italic">No status set — click to update</span>
                )}
                {lastContacted && (
                  <span className="text-white/60 text-xs">Last contacted: {lastContacted}</span>
                )}
                {notes && (
                  <span className="text-white/60 text-xs truncate max-w-[200px]">{notes}</span>
                )}
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-white shrink-0 transition-transform ${trackerOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expanded form */}
          {trackerOpen && (
            <div className="border-t p-4 sm:p-6" style={{ backgroundColor: `${schoolColor}08`, borderColor: `${schoolColor}30` }}>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* My Contact at this school */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">My Contact at {school.name}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                {hasUnsavedChanges && !saved && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg">
                    <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-amber-800 text-sm font-medium">You have unsaved changes</span>
                  </div>
                )}
                {saved && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800 text-sm font-semibold">Changes saved successfully</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className={`flex-1 sm:flex-none px-6 py-2.5 text-white rounded-lg disabled:opacity-50 font-medium transition-colors text-sm ${
                      hasUnsavedChanges && !saved ? "bg-amber-600 hover:bg-amber-700 animate-pulse" : "hover:opacity-90"
                    }`}
                    style={!(hasUnsavedChanges && !saved) ? { backgroundColor: schoolColor } : undefined}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          );
        })()}

        {/* ===== PROGRAM INFO SECTIONS ===== */}
        {/* Academics & School Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button onClick={() => setAcademicsOpen(!academicsOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Academics & School Info</span>
            <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${academicsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {academicsOpen && (
            <div className="border-t border-gray-100 p-4 sm:p-6 space-y-4">
              {school.public_private && (
                <p className="text-xs font-medium text-gray-500">{school.public_private === "Private" ? "Private Institution" : "Public Institution"}{distanceFromHome != null && <> | {distanceFromHome.toLocaleString()} miles from home</>}</p>
              )}
              {school.high_academic && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-yellow-800">High-Academic Institution</span>
                </div>
              )}

              {/* Stat cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {school.enrollment != null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Enrollment</p>
                    <p className="text-lg font-bold text-gray-900">{school.enrollment.toLocaleString()}</p>
                  </div>
                )}
                {school.acceptance_rate != null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Acceptance Rate</p>
                    <p className="text-lg font-bold text-gray-900">{school.acceptance_rate}%</p>
                  </div>
                )}
                {school.graduation_rate != null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Graduation Rate</p>
                    <p className="text-lg font-bold text-gray-900">{school.graduation_rate}%</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Student : Faculty</p>
                  <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.student_faculty_ratio != null ? `${academicsData.scorecard.student_faculty_ratio}:1` : "Not reported"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">In-State Tuition</p>
                  <p className="text-lg font-bold text-gray-900">{school.tuition ? `$${school.tuition.toLocaleString()}` : "N/A"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Out-of-State Tuition</p>
                  <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.out_of_state_tuition != null ? `$${academicsData.scorecard.out_of_state_tuition.toLocaleString()}` : "Not reported"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Avg Financial Aid</p>
                  <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.avg_net_price != null ? `$${academicsData.scorecard.avg_net_price.toLocaleString()}` : "Not reported"}</p>
                  {academicsData?.scorecard?.avg_net_price != null && (
                    <p className="text-[9px] text-gray-400 mt-0.5">Avg net price after aid</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">Receiving Aid</p>
                  <p className="text-lg font-bold text-gray-900">{academicsData?.scorecard?.aid_percentage != null ? `${academicsData.scorecard.aid_percentage}%` : "Not reported"}</p>
                </div>
              </div>

              {/* SAT / ACT middle 50% */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">SAT Middle 50%</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {academicsData?.scorecard?.sat_25 != null && academicsData?.scorecard?.sat_75 != null
                      ? `${academicsData.scorecard.sat_25}–${academicsData.scorecard.sat_75}`
                      : "Not reported"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">ACT Middle 50%</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {academicsData?.scorecard?.act_25 != null && academicsData?.scorecard?.act_75 != null
                      ? `${academicsData.scorecard.act_25}–${academicsData.scorecard.act_75}`
                      : "Not reported"}
                  </p>
                </div>
              </div>

              {/* NCAA Baseball APR */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium">NCAA Baseball APR</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Score out of 1,000. Programs below 930 face NCAA penalties.</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl sm:text-3xl font-black ${
                      academicsData?.apr?.apr != null
                        ? academicsData.apr.apr >= 930
                          ? "text-gray-900"
                          : "text-red-600"
                        : "text-gray-400"
                    }`}>
                      {academicsData?.apr?.apr != null ? academicsData.apr.apr : "Not reported"}
                    </p>
                    {academicsData?.apr?.year && (
                      <p className="text-[10px] text-gray-400">{academicsData.apr.year} data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coaching Staff */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button onClick={() => setCoachOpen(!coachOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Coaching Staff</span>
            <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${coachOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {coachOpen && (
            <div className="border-t border-gray-100 p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CoachPhoto name={school.head_coach_name} schoolName={school.name} />
                  <div>
                    <p className="text-sm sm:text-base text-gray-900 font-bold">{school.head_coach_name || "N/A"}</p>
                    <p className="text-xs text-gray-500">Head Coach</p>
                    {school.head_coach_email && (
                      <a href={`mailto:${school.head_coach_email}`} className="text-xs sm:text-sm text-blue-600 hover:underline break-all mt-1 block">
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
          )}
        </div>

        {/* Links & Social */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button onClick={() => setLinksOpen(!linksOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Links & Social</span>
            <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${linksOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {linksOpen && (
            <div className="border-t border-gray-100 p-4 sm:p-6">
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
                {school.division === "D1" && school.nil_url && (
                  <a href={school.nil_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 font-medium transition-colors">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span>NIL Information</span>
                      <span className="block text-xs text-emerald-500 font-normal">Name, Image & Likeness</span>
                    </div>
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
          )}
        </div>

        {/* Schedule */}
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

        {/* MLB Draft Picks — collapsible table */}
        {draftPicksCount > 0 && (() => {
          const picks = ((draftPicksData as Record<string, DraftPick[]>)[school.name] || []).filter(p => p.year >= draftCutoffYear);
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
            })()}

        {/* Latest News */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button onClick={() => setNewsOpen(!newsOpen)} className="w-full flex items-center gap-2 p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="flex-1 text-base sm:text-lg font-bold text-gray-900">Latest News</span>
            <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${newsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {newsOpen && (
            <div className="border-t border-gray-100 p-4 sm:p-6">
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

                {/* Stadium & Facilities Photos */}
                {facilityPhotos.length > 0 && (
                  <div className="p-4 sm:p-6 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Stadium Photos
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {facilityPhotos.map((photo, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxIdx(i)}
                          className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity group"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

        {/* Photo lightbox */}
        {lightboxIdx !== null && facilityPhotos[lightboxIdx] && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={facilityPhotos[lightboxIdx].url}
                alt={facilityPhotos[lightboxIdx].caption}
                className="w-full rounded-lg shadow-2xl"
              />
              {facilityPhotos[lightboxIdx].caption && (
                <p className="text-white/80 text-sm text-center mt-3">{facilityPhotos[lightboxIdx].caption}</p>
              )}
              <button
                onClick={() => setLightboxIdx(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {facilityPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIdx((lightboxIdx - 1 + facilityPhotos.length) % facilityPhotos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLightboxIdx((lightboxIdx + 1) % facilityPhotos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <BrandLogo size="sm" showTagline={false} />
          <p className="text-xs text-gray-500">ExtraBase is a product of JackJack Enterprises. Data is for informational purposes only. Go be great!</p>
        </div>
      </footer>
    </div>
    </AuthGate>
  );
}
