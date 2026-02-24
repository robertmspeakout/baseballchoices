"use client";

import { useEffect, useRef, useState } from "react";
import { getUserData, setUserData, fetchUserDataFromDB, saveUserDataToDB } from "@/lib/userData";

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

interface RecruitingTrackerProps {
  schoolId: number;
  schoolName: string;
  schoolColor: string;
  isLoggedIn: boolean;
}

export default function RecruitingTracker({ schoolId, schoolName, schoolColor, isLoggedIn }: RecruitingTrackerProps) {
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
  const [trackerOpen, setTrackerOpen] = useState(false);

  // Track last-saved values so we can detect unsaved changes
  const savedSnapshot = useRef({
    notes: "", lastContacted: "", recruitingStatus: "",
    theyvSeenMe: [] as string[], detail: "", myContactName: "", myContactEmail: "",
  });

  useEffect(() => {
    // Load from localStorage first (instant)
    const ud = getUserData(schoolId);
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

    setMounted(true);
  }, [schoolId, isLoggedIn]);

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
    setUserData(schoolId, updates);
    if (isLoggedIn) {
      try {
        await saveUserDataToDB(schoolId, updates);
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

  const statusColor: Record<string, string> = {
    "Researching": "bg-gray-100 text-gray-700 border-gray-300",
    "Reached Out": "bg-blue-50 text-blue-700 border-blue-300",
    "In Contact": "bg-cyan-50 text-cyan-700 border-cyan-300",
    "Mutual Interest": "bg-purple-50 text-purple-700 border-purple-300",
    "Offer": "bg-amber-50 text-amber-700 border-amber-300",
    "Committed": "bg-green-50 text-green-700 border-green-300",
  };

  return (
    <div className="rounded-xl border-2 shadow-sm overflow-hidden" style={{ borderColor: `${schoolColor}40` }}>
      {/* Banner header -- always visible */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">My Contact at {schoolName}</label>
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
}
