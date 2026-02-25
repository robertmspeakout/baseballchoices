"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SearchOverlay from "@/components/SearchOverlay";
import PillNav from "@/components/PillNav";
import AuthGate from "@/components/AuthGate";
import { loadProfile, savePreferences, type PlayerProfile } from "@/lib/playerProfile";
import { useSchools } from "@/lib/SchoolsContext";
import AIScoutIntake, { type IntakeAnswers } from "@/components/AIScoutIntake";

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

// Build the "View in ExtraBase" URL with school IDs
function buildResultsUrl(schools: SchoolCard[]): string {
  const ids = schools.map((s) => s.id).join(",");
  return `/ai-results?ids=${ids}`;
}

// Format assistant messages with bold, bullets, numbered lists, and headers
function FormattedMessage({ content }: { content: string }) {
  // Keep markers intact — renderInlineFormatting converts them to clickable links
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
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
function ViewResultsButton({ schools }: { schools: SchoolCard[] }) {
  if (!schools || schools.length === 0) return null;
  return (
    <div className="mt-3">
      <a
        href={buildResultsUrl(schools)}
        className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 transition-all shadow-md"
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
      </a>
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
      lastAssistantMsgRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
                schoolSize: prefs.schoolSize || "",
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
      schoolSize: (answers.schoolSize || "any") as "small" | "medium" | "large" | "any",
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
        schoolSize: answers.schoolSize || "any",
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
    setMessages([userMessage]);
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
        setMessages([userMessage, {
          role: "assistant",
          content: data.error || "You've used all 20 AI Scout messages for this month.",
        }]);
      } else if (!res.ok) {
        setMessages([userMessage, {
          role: "assistant",
          content: data.error || "Something went wrong. Please try again.",
        }]);
      } else {
        setMessages([userMessage, {
          role: "assistant",
          content: data.reply,
          schools: data.schools || [],
        }]);
      }
    } catch {
      setMessages([userMessage, {
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

  const atLimit = remaining <= 0;

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
                // Always reset to landing page (3 buttons) or intake form
                setMessages([]);
                const done = localStorage.getItem(INTAKE_DONE_KEY) === "true";
                setShowIntake(!done);
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
              onCancel={intakeValues ? () => { setShowIntake(false); setMessages([]); } : undefined}
              onReset={intakeValues ? () => {
                localStorage.removeItem(INTAKE_DONE_KEY);
                localStorage.removeItem(INTAKE_ANSWERS_KEY);
                sessionStorage.removeItem(CHAT_STORAGE_KEY);
                setMessages([]);
                setIntakeValues(undefined);
                setShowIntake(true);
              } : undefined}
            />
          ) : (
            <div className="flex-1">
              {/* Edit Answers bar — shown when there are messages and intake was completed */}
              {messages.length > 0 && intakeValues && (
                <div className="px-4 pt-3 pb-1">
                  <button
                    onClick={() => setShowIntake(true)}
                    className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit your AI Scout Profile
                  </button>
                </div>
              )}

              <div className="p-4 space-y-4">
                {messages.length === 0 && !loading && (() => {
                  const savedSnippet = getSavedChatSnippet();
                  const savedSchools = getSavedSchools();
                  return (
                    <div className="flex flex-col items-center py-2 w-full max-w-lg mx-auto">
                      {/* Consistent AI Scout header */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-black text-gray-900 mb-4">AI Scout</h2>

                      {savedSnippet ? (
                        <div className="w-full space-y-2.5">
                          {/* 1. View current results */}
                          {savedSchools.length > 0 && (
                            <a
                              href={buildResultsUrl(savedSchools)}
                              className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold">View current results</p>
                                <p className="text-xs text-red-100">{savedSchools.length} programs matched</p>
                              </div>
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </a>
                          )}

                          {/* 2. Edit answers */}
                          <button
                            onClick={() => setShowIntake(true)}
                            className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Edit your AI Scout Profile</p>
                          </button>

                          {/* 3. Continue conversation with snippet */}
                          <button
                            onClick={() => {
                              const saved = loadSavedChat();
                              if (saved.length > 0) {
                                hasInteracted.current = true;
                                setMessages(saved);
                              }
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-700">Continue your last conversation</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">You: {savedSnippet.userMsg}</p>
                              <p className="text-xs text-gray-400 truncate">Scout: {savedSnippet.assistantMsg}</p>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center">
                          Tell me what you&apos;re looking for and I&apos;ll find programs that fit.
                        </p>
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
                        <ViewResultsButton schools={msg.schools} />
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

              {/* Input area */}
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
            </div>
          )}
        </main>

        <SiteFooter />
      </div>
    </AuthGate>
  );
}
