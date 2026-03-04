"use client";

import { Suspense, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SearchOverlay from "@/components/SearchOverlay";
import PillNav from "@/components/PillNav";
import AuthGate from "@/components/AuthGate";
import SchoolTable from "@/components/SchoolTable";
import { loadProfile, savePreferences, type PlayerProfile } from "@/lib/playerProfile";
import { useSchools } from "@/lib/SchoolsContext";
import { getAllUserData, setUserData, fetchUserDataFromDB, saveUserDataToDB, bulkSyncToDB, type UserData } from "@/lib/userData";
import AIScoutIntake, { composeIntakeMessage, type IntakeAnswers } from "@/components/AIScoutIntake";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SchoolCard {
  id: number;
  name: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  schools?: SchoolCard[];
}

// Strip all [SCHOOL_ID:...] markers from display text (multiple patterns for safety)
function stripMarkers(text: string): string {
  return text
    .replace(/\s*\[SCHOOL_ID:\s*\d+\s*\]/gi, "")
    .replace(/\s*\[SCHOOL[-_\s]*ID\s*:\s*\d+\s*\]/gi, "")
    .replace(/\[SCHOOL[^\]]*\]/gi, "");
}

// Convert **bold** to <strong> tags, and **School** [SCHOOL_ID:xx] to clickable links
function renderInlineFormatting(text: string): string {
  // Step 1: Convert **Name** [SCHOOL_ID:xxx] into linked school names (before stripping markers)
  let html = text.replace(
    /\*\*(.*?)\*\*\s*\[SCHOOL_ID:\s*(\d+)\s*\]/gi,
    (_match, name, id) => `__LINK_START_${id}__${name}__LINK_END__`
  );
  // Step 2: Strip any remaining markers
  html = stripMarkers(html);
  // Step 3: Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Step 4: Restore school links as <a> tags
  html = html.replace(
    /__LINK_START_(\d+)__(.*?)__LINK_END__/g,
    (_match, id, name) =>
      `<a href="/school/${id}?from=ai" class="font-bold text-red-700 underline underline-offset-2 decoration-red-300 hover:text-red-900 hover:decoration-red-500">${name}</a>`
  );
  // Step 5: Handle remaining **bold** text (non-school bold)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  return html;
}

// Format assistant messages with bold, bullets, numbered lists, and headers
function FormattedMessage({ content }: { content: string }) {
  // Keep markers intact — renderInlineFormatting converts them to clickable links
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Markdown headers (## Header or # Header) — render as bold text, not literal hashtags
        const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const text = headerMatch[2];
          const sizeClass = level === 1 ? "text-base font-black" : level === 2 ? "text-sm font-bold" : "text-sm font-semibold";
          return (
            <p key={i} className={`${sizeClass} text-gray-900 mt-1`}
               dangerouslySetInnerHTML={{ __html: renderInlineFormatting(text) }} />
          );
        }

        // Bullet points
        if (line.match(/^[\-•]\s/)) {
          const bulletContent = line.replace(/^[\-•]\s/, "");
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-red-500 shrink-0 mt-0.5">&bull;</span>
              <span dangerouslySetInnerHTML={{ __html: renderInlineFormatting(bulletContent) }} />
            </div>
          );
        }

        // Numbered lists
        if (line.match(/^\d+[\.\)]\s/)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span dangerouslySetInnerHTML={{ __html: renderInlineFormatting(line) }} />
            </div>
          );
        }

        // Empty line = spacing
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }

        // Regular text (bold renders as <strong>)
        return <p key={i} dangerouslySetInnerHTML={{ __html: renderInlineFormatting(line) }} />;
      })}
    </div>
  );
}

// Prominent CTA to view ALL matched programs on the full results page
function ViewResultsButton({ schools, onViewResults }: { schools: SchoolCard[]; onViewResults?: () => void }) {
  if (!schools || schools.length === 0) return null;
  return (
    <div className="mt-3">
      <button
        onClick={onViewResults}
        className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 transition-all shadow-md text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">View all {schools.length} matches</p>
          <p className="text-xs text-red-100">Compare, rank, and research every program side by side</p>
        </div>
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice input. Try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) onTranscript(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onTranscript]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
        listening
          ? "bg-red-600 text-white animate-pulse"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
      }`}
      title={listening ? "Stop listening" : "Voice input"}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}

const CHAT_STORAGE_KEY = "ai_scout_chat";
const INTAKE_DONE_KEY = "ai_scout_intake_done";
const INTAKE_ANSWERS_KEY = "ai_scout_intake_answers";

function loadSavedIntakeAnswers(): Partial<IntakeAnswers> | undefined {
  try {
    const raw = localStorage.getItem(INTAKE_ANSWERS_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch { return undefined; }
}

function loadSavedChat(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function getSavedChatSnippet(): { userMsg: string; assistantMsg: string } | null {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const msgs: ChatMessage[] = JSON.parse(raw);
    if (msgs.length < 2) return null;
    const lastUser = [...msgs].reverse().find(m => m.role === "user");
    const lastAssistant = [...msgs].reverse().find(m => m.role === "assistant");
    if (!lastUser || !lastAssistant) return null;
    return {
      userMsg: lastUser.content.length > 80 ? lastUser.content.slice(0, 80) + "..." : lastUser.content,
      assistantMsg: stripMarkers(lastAssistant.content).length > 100 ? stripMarkers(lastAssistant.content).slice(0, 100) + "..." : stripMarkers(lastAssistant.content),
    };
  } catch { return null; }
}

function getSavedSchools(): SchoolCard[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const msgs: ChatMessage[] = JSON.parse(raw);
    // Collect all unique schools from assistant messages
    const seen = new Set<number>();
    const schools: SchoolCard[] = [];
    for (const msg of msgs) {
      if (msg.schools) {
        for (const s of msg.schools) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            schools.push(s);
          }
        }
      }
    }
    return schools;
  } catch { return []; }
}

export default function AIMatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
      </div>
    }>
      <AIMatchContent />
    </Suspense>
  );
}

function AIMatchContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { schools: allSchools, conferences } = useSchools();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [userBgPic, setUserBgPic] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(20);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [intakeValues, setIntakeValues] = useState<Partial<IntakeAnswers> | undefined>(undefined);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [userDataState, setUserDataState] = useState<Record<string, UserData>>({});
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const lastAssistantMsgRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInteracted = useRef(false);

  // Reset AI Scout state when ?reset=true is in the URL (for testing first-time experience)
  useEffect(() => {
    if (searchParams.get("reset") === "true") {
      localStorage.removeItem(INTAKE_DONE_KEY);
      localStorage.removeItem(INTAKE_ANSWERS_KEY);
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
      setMessages([]);
      setIntakeValues(undefined);
      setShowIntake(true);
      // Clear GPA/SAT/ACT from DB profile so stale scores don't get sent to AI
      fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gpa: null, satScore: null, actScore: null }),
      }).catch(() => {});
      router.replace("/ai-match", { scroll: false });
      return;
    }
    // Auto-resume conversation when navigating back from results page
    if (searchParams.get("resume") === "true") {
      const saved = loadSavedChat();
      if (saved.length > 0) {
        setMessages(saved);
      }
      router.replace("/ai-match", { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist conversation to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Load player profile
  useEffect(() => {
    if (status === "loading") return;

    async function loadData() {
      let p: PlayerProfile = loadProfile();

      if (status === "authenticated" && session?.user) {
        try {
          const res = await fetch("/api/user/profile");
          const dbProfile = res.ok ? await res.json() : null;
          if (dbProfile && dbProfile.primaryPosition) {
            const firstName = (session.user as Record<string, unknown>).firstName as string || "";
            p = {
              playerName: firstName,
              gradYear: dbProfile.gradYear?.toString() || "",
              primaryPosition: dbProfile.primaryPosition || "",
              secondaryPosition: dbProfile.secondaryPosition || "",
              city: dbProfile.city || "",
              state: dbProfile.state || "",
              zipCode: dbProfile.zipCode || "",
              highSchool: dbProfile.highSchool || "",
              travelBall: dbProfile.travelBall || "",
              profilePic: p.profilePic,
              backgroundPic: p.backgroundPic,
              gpa: dbProfile.gpa ? parseFloat(dbProfile.gpa) : null,
              gpaType: dbProfile.gpaType || "",
              satScore: dbProfile.satScore ? parseInt(dbProfile.satScore) : null,
              actScore: dbProfile.actScore ? parseInt(dbProfile.actScore) : null,
            };
          }
        } catch { /* fallback to localStorage */ }
      }

      setProfile(p);
      if (p.backgroundPic) setUserBgPic(p.backgroundPic);
    }

    loadData();
  }, [status, session]);

  // Load user data for SchoolTable star ratings
  const isLoggedIn = status === "authenticated" && !!session?.user;
  useEffect(() => {
    setUserDataState(getAllUserData());
    if (isLoggedIn) {
      const localData = getAllUserData();
      const localHasData = Object.values(localData).some((ud) => ud.priority > 0);
      fetchUserDataFromDB().then((dbData) => {
        const dbHasData = Object.keys(dbData).length > 0;
        if (dbHasData) {
          setUserDataState((prev) => ({ ...prev, ...dbData }));
        } else if (localHasData) {
          bulkSyncToDB(localData).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  // Fetch remaining message count on mount
  useEffect(() => {
    fetch("/api/ai-match")
      .then(res => res.json())
      .then(data => { if (data.remaining !== undefined) setRemaining(data.remaining); })
      .catch(() => {});
  }, []);

  // Auto-scroll to the top of the latest AI reply
  useEffect(() => {
    if (hasInteracted.current && lastAssistantMsgRef.current) {
      // Use requestAnimationFrame + small delay to ensure DOM layout is settled
      // before scrolling, so the element's position is accurate.
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (lastAssistantMsgRef.current) {
            const el = lastAssistantMsgRef.current;
            const y = el.getBoundingClientRect().top + window.scrollY - 12;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }, 50);
      });
    }
  }, [messages]);

  // Check if intake questionnaire has been completed, and load saved answers
  useEffect(() => {
    const done = localStorage.getItem(INTAKE_DONE_KEY) === "true";
    const hasSavedChat = !!sessionStorage.getItem(CHAT_STORAGE_KEY);
    // Show intake form if never completed and no existing conversation
    if (!done && !hasSavedChat) {
      setShowIntake(true);
    }
    // Also show intake form when intake was done but session chat is gone
    // (e.g. new tab, browser restart) — so the user can re-run the AI
    // instead of seeing an empty page with just an "Edit" button
    if (done && !hasSavedChat) {
      setShowIntake(true);
    }
    // Load saved intake answers for pre-filling the edit form
    if (done) {
      const saved = loadSavedIntakeAnswers();
      if (saved) {
        setIntakeValues(saved);
      } else {
        // Fallback: rebuild intake values from preferences API + profile
        (async () => {
          try {
            const [prefsRes, profileRes] = await Promise.all([
              fetch("/api/user/preferences"),
              fetch("/api/user/profile"),
            ]);
            const prefs = prefsRes.ok ? await prefsRes.json() : null;
            const prof = profileRes.ok ? await profileRes.json() : null;
            if (prefs) {
              const rebuilt: Partial<IntakeAnswers> = {
                divisions: prefs.preferredDivisions || [],
                conferenceTiers: prefs.preferredTiers || [],
                competitiveness: prefs.competitiveness || "",
                regions: prefs.preferredRegions || [],
                maxTuition: prefs.maxTuition || null,
                tuitionChoice: prefs.maxTuition ? String(prefs.maxTuition) : (prefs.maxTuition === null ? "any" : ""),
                schoolSize: Array.isArray(prefs.schoolSize) ? prefs.schoolSize : (prefs.schoolSize ? [prefs.schoolSize] : ["any"]),
                highAcademic: prefs.highAcademic ?? false,
                draftImportance: prefs.draftImportance === "high" ? "yes" : (prefs.draftImportance || ""),
                gpa: prof?.gpa || "",
                satScore: prof?.satScore ? String(prof.satScore) : "",
                actScore: prof?.actScore ? String(prof.actScore) : "",
                intendedMajor: "",
              };
              setIntakeValues(rebuilt);
              // Persist so we don't need to fetch again
              localStorage.setItem(INTAKE_ANSWERS_KEY, JSON.stringify(rebuilt));
            }
          } catch { /* ignore — form will just be empty */ }
        })();
      }
    }
  }, []);

  // Handle intake form completion — save preferences and auto-send to AI
  const handleIntakeComplete = async (message: string, answers: IntakeAnswers) => {
    // Map divisions array to divisionPreference value
    const divPref = answers.divisions.length === 1 ? answers.divisions[0] : "all";

    // Save preferences to localStorage
    savePreferences({
      divisionPreference: divPref as "D1" | "D2" | "both",
      maxDistanceFromHome: answers.maxDistance,
      preferredRegions: answers.regions,
      maxTuition: answers.maxTuition,
      schoolSize: (answers.schoolSize && answers.schoolSize.length > 0 ? answers.schoolSize : ["any"]) as ("small" | "medium" | "large" | "any")[],
      highAcademic: answers.highAcademic,
      competitiveness: (answers.competitiveness || "any") as "top25" | "postseason" | "any",
      draftImportance: (answers.draftImportance || "no") as "yes" | "no",
      preferredConferences: [],
      preferredTiers: answers.conferenceTiers || [],
    });

    // Save preferences to DB (fire and forget)
    fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        divisionPreference: divPref,
        preferredDivisions: answers.divisions,
        maxDistanceFromHome: answers.maxDistance,
        preferredRegions: answers.regions,
        maxTuition: answers.maxTuition,
        schoolSize: answers.schoolSize && answers.schoolSize.length > 0 ? answers.schoolSize : ["any"],
        highAcademic: answers.highAcademic,
        competitiveness: answers.competitiveness || "any",
        draftImportance: answers.draftImportance || "no",
        preferredTiers: answers.conferenceTiers || [],
      }),
    }).catch(() => {});

    // Save GPA/SAT/ACT to user profile (fire and forget)
    // Always send all three so blank values clear old data
    fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gpa: answers.gpa || null,
        satScore: answers.satScore || null,
        actScore: answers.actScore || null,
      }),
    }).catch(() => {});

    // Mark intake as done and save values for editing
    localStorage.setItem(INTAKE_DONE_KEY, "true");
    localStorage.setItem(INTAKE_ANSWERS_KEY, JSON.stringify(answers));
    setIntakeValues(answers);

    // Hide form, clear any old conversation
    setShowIntake(false);
    sessionStorage.removeItem(CHAT_STORAGE_KEY);

    // Auto-send the composed message to the AI (don't auto-scroll — let user read from top)
    const userMessage: ChatMessage = { role: "user", content: message };
    const firstName = profile?.playerName || "";
    const loadingMsg: ChatMessage = {
      role: "assistant",
      content: firstName
        ? `Hey ${firstName}, thanks for that information. I'm loading up your results now!`
        : "Thanks for that information. I'm loading up your results now!",
    };
    setMessages([userMessage, loadingMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [userMessage],
          playerProfile: profile,
        }),
      });

      const data = await res.json();
      if (data.remaining !== undefined) setRemaining(data.remaining);

      if (res.status === 429) {
        setMessages([userMessage, loadingMsg, {
          role: "assistant",
          content: data.error || "You've used all 20 AI Scout messages for this month.",
        }]);
      } else if (!res.ok) {
        setMessages([userMessage, loadingMsg, {
          role: "assistant",
          content: data.error || "Something went wrong. Please try again.",
        }]);
      } else {
        setMessages([userMessage, loadingMsg, {
          role: "assistant",
          content: data.reply,
          schools: data.schools || [],
        }]);
      }
    } catch {
      setMessages([userMessage, loadingMsg, {
        role: "assistant",
        content: "Network error — please check your connection and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    hasInteracted.current = true;
    const userMessage: ChatMessage = { role: "user", content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const res = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          playerProfile: profile,
        }),
      });

      const data = await res.json();

      if (data.remaining !== undefined) {
        setRemaining(data.remaining);
      }

      if (res.status === 429) {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.error || "You've used all 20 AI Scout messages for this month. Check back when your limit resets!",
        }]);
      } else if (!res.ok) {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.error || "Something went wrong. Please try again.",
        }]);
      } else {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.reply,
          schools: data.schools || [],
        }]);
      }
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Network error — please check your connection and try again.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    sendMessage(text);
  };

  const handleResetAI = () => {
    localStorage.removeItem(INTAKE_DONE_KEY);
    localStorage.removeItem(INTAKE_ANSWERS_KEY);
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    setMessages([]);
    setIntakeValues(undefined);
    setShowIntake(true);
    setShowResetConfirm(false);
    // Clear GPA/SAT/ACT from DB profile so stale scores don't get sent to AI
    fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gpa: null, satScore: null, actScore: null }),
    }).catch(() => {});
  };

  // Build school list for embedded results table
  const savedSchoolsForTable = useMemo(() => getSavedSchools(), [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const resultsSchools = useMemo(() => {
    if (savedSchoolsForTable.length === 0) return [];
    const idSet = new Set(savedSchoolsForTable.map((s) => s.id));
    const idOrder = new Map(savedSchoolsForTable.map((s, i) => [s.id, i]));
    const matched = allSchools
      .filter((s) => idSet.has(s.id))
      .map((school) => {
        const ud = userDataState[school.id] || { priority: 0, notes: "", last_contacted: null, recruiting_status: "" };
        return { ...school, priority: ud.priority, notes: ud.notes, last_contacted: ud.last_contacted, recruiting_status: ud.recruiting_status || "" };
      });
    // Default: preserve AI-recommended order
    matched.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
    return matched;
  }, [savedSchoolsForTable, allSchools, userDataState]);

  const sortedResults = useMemo(() => {
    const arr = [...resultsSchools];
    arr.sort((a, b) => {
      let aVal: string | number | null, bVal: string | number | null;
      switch (sortBy) {
        case "name": aVal = a.name; bVal = b.name; break;
        case "state": aVal = a.state; bVal = b.state; break;
        case "ranking": aVal = a.current_ranking; bVal = b.current_ranking; break;
        case "priority": aVal = a.priority; bVal = b.priority; break;
        default: aVal = a.name; bVal = b.name;
      }
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [resultsSchools, sortBy, sortDir]);

  const handleResultsSort = (column: string) => {
    let newDir = "asc";
    if (sortBy === column) newDir = sortDir === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortDir(newDir);
  };

  const handlePriorityChange = (schoolId: number, priority: number) => {
    setUserData(schoolId, { priority });
    setUserDataState((prev) => ({
      ...prev,
      [schoolId]: { ...(prev[schoolId] || { priority: 0, notes: "", last_contacted: null }), priority },
    }));
    if (isLoggedIn) saveUserDataToDB(schoolId, { priority }).catch(() => {});
  };

  // Navigate from conversation to landing page (shows embedded results)
  const handleViewResults = () => {
    setMessages([]);
  };

  const atLimit = remaining <= 0;
  // Show reset link when there's been any interaction (intake done or messages exist)


  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <SiteHeader backgroundImage={userBgPic || undefined} activeNav="AI Scout" />

        <main className="flex-1 max-w-[1400px] mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex flex-col">
          {/* Division dropdown + search */}
          <PillNav
            className="mb-4"
            value="ai-scout"
            options={[
              { value: "mylist", label: "My Top Programs" },
              { value: "ai-scout", label: "AI Scout" },
              { value: "D1", label: "Division I Programs" },
              { value: "D2", label: "Division II Programs" },
              { value: "D3", label: "Division III Programs" },
              { value: "JUCO", label: "JUCO Programs" },
            ]}
            onSelect={(val) => {
              if (val === "ai-scout") {
                // Go to landing page (results + buttons) if profile is done, otherwise show intake form
                setMessages([]);
                const done = localStorage.getItem(INTAKE_DONE_KEY) === "true";
                if (!done) {
                  setShowIntake(true);
                } else {
                  setShowIntake(false);
                }
              }
              else if (val === "mylist") router.push("/#mylist");
              else if (val === "D1") router.push("/programs/d1");
              else if (val === "D2") router.push("/programs/d2");
              else if (val === "D3") router.push("/programs/d3");
              else if (val === "JUCO") router.push("/programs/juco");
            }}
            onSearchClick={() => setSearchOverlayOpen(true)}
          />

          <SearchOverlay
            open={searchOverlayOpen}
            onClose={() => setSearchOverlayOpen(false)}
            schools={allSchools}
            conferences={conferences}
            activeTab="ai-scout"
          />

          {/* Intake form or Chat area */}
          {showIntake ? (
            <AIScoutIntake
              onComplete={handleIntakeComplete}
              initialValues={intakeValues}
              isEditing={!!intakeValues}
              onClearAnswers={() => {
                localStorage.removeItem(INTAKE_DONE_KEY);
                localStorage.removeItem(INTAKE_ANSWERS_KEY);
                sessionStorage.removeItem(CHAT_STORAGE_KEY);
                setMessages([]);
                setIntakeValues(undefined);
                setShowIntake(true);
              }}
            />
          ) : (
            <div className="flex-1">
              {/* Navigation bar — shown when there are messages and intake was completed */}
              {messages.length > 0 && intakeValues && (
                <div className="px-4 pt-3 pb-1">
                  <button
                    onClick={() => setShowIntake(true)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
                  >
                    &larr; Edit my Profile
                  </button>
                </div>
              )}

              <div className="p-4 space-y-4">
                {/* Landing page — shown when no active conversation */}
                {messages.length === 0 && !loading && (() => {
                  const savedSnippet = getSavedChatSnippet();
                  return (
                    <div className="w-full">
                      {/* Action buttons */}
                      {savedSnippet && (
                        <div className="max-w-lg mx-auto w-full space-y-2.5 mb-6">
                          {/* Continue conversation — red */}
                          <button
                            onClick={() => {
                              const saved = loadSavedChat();
                              if (saved.length > 0) {
                                hasInteracted.current = true;
                                setMessages(saved);
                              }
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition-colors shadow-md"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white">Continue Your AI Scout Chat</p>
                              <p className="text-xs text-white/70 truncate mt-0.5">You: {savedSnippet.userMsg}</p>
                              <p className="text-xs text-white/50 truncate">Scout: {savedSnippet.assistantMsg}</p>
                            </div>
                          </button>

                          {/* Edit AI Scout Profile */}
                          <button
                            onClick={() => setShowIntake(true)}
                            className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Edit my Profile</p>
                          </button>

                          {/* Reset AI Profile */}
                          <button
                            onClick={() => setShowResetConfirm(true)}
                            className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Reset my AI Profile</p>
                          </button>
                        </div>
                      )}

                      {/* Embedded results — shown when AI has matched schools */}
                      {sortedResults.length > 0 && (
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 mb-3">Your AI Scout Results</h2>
                          <SchoolTable
                            schools={sortedResults}
                            distances={null}
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleResultsSort}
                            onPriorityChange={handlePriorityChange}
                          />
                        </div>
                      )}

                      {/* Edit profile button when there are results but no active conversation */}
                      {!savedSnippet && sortedResults.length > 0 && (
                        <div className="max-w-lg mx-auto w-full space-y-2.5">
                          <button
                            onClick={() => setShowIntake(true)}
                            className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Edit my Profile</p>
                          </button>
                          <button
                            onClick={() => setShowResetConfirm(true)}
                            className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Reset my AI Profile</p>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {messages.map((msg, i) => {
                  // Find the index of the last assistant message to attach the scroll ref
                  const lastAssistantIdx = messages.reduce((acc, m, idx) => m.role === "assistant" ? idx : acc, -1);
                  return (
                  <div
                    key={i}
                    ref={msg.role === "assistant" && i === lastAssistantIdx ? lastAssistantMsgRef : undefined}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[85%]">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-red-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <FormattedMessage content={msg.content} />
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.role === "assistant" && msg.schools && msg.schools.length > 0 && (
                        <ViewResultsButton schools={msg.schools} onViewResults={handleViewResults} />
                      )}
                    </div>
                  </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Input area — hidden on landing page (3 buttons) */}
              {(messages.length > 0 || loading) && (
              <div className="sticky bottom-0 border-t border-gray-200 p-3 bg-white/95 backdrop-blur-sm">
                {atLimit ? (
                  <div className="text-center py-3">
                    <p className="text-sm font-semibold text-gray-700">You&apos;ve used all 20 AI Scout messages this month</p>
                    <p className="text-xs text-gray-500 mt-1">Your limit resets in 30 days. In the meantime, explore programs directly!</p>
                    <a href="/programs/d1" className="inline-block mt-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                      Browse Programs
                    </a>
                  </div>
                ) : (
                  <>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Tell me what you're looking for..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
                      style={{ minHeight: "80px" }}
                      disabled={loading}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <MicButton onTranscript={handleVoiceTranscript} />
                      <div className="text-center px-2">
                        <p className="text-[10px] text-gray-400">
                          {remaining} of 20 messages remaining this month
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          This AI will only talk baseball with you. Results are suggestions.
                        </p>
                      </div>
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          )}
        </main>

        {/* Reset confirmation modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Reset AI Scout?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                This will erase your AI Scout profile, all conversations, and matched results. You&apos;ll start over from scratch as if you&apos;re using AI Scout for the first time.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetAI}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Yes, reset everything
                </button>
              </div>
            </div>
          </div>
        )}

        <SiteFooter />
      </div>
    </AuthGate>
  );
}
