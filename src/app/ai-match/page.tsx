"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthGate from "@/components/AuthGate";
import { loadProfile, type PlayerProfile } from "@/lib/playerProfile";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SchoolCard {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  division: string;
  conference: string;
  logo_url: string | null;
  primary_color: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  schools?: SchoolCard[];
}

// Strip [SCHOOL_ID:123] markers from display text
function stripSchoolMarkers(text: string): string {
  return text.replace(/\s*\[SCHOOL_ID:\d+\]/g, "");
}

// Division badge color mapping
function divisionColor(div: string) {
  switch (div) {
    case "D1": return "bg-blue-100 text-blue-800";
    case "D2": return "bg-green-100 text-green-800";
    case "D3": return "bg-purple-100 text-purple-800";
    default: return "bg-orange-100 text-orange-800";
  }
}

// School result cards rendered below AI messages
function SchoolCards({ schools }: { schools: SchoolCard[] }) {
  if (!schools || schools.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {schools.map((school) => (
        <a
          key={school.id}
          href={`/school/${school.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md active:bg-gray-50 transition-all text-left"
        >
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt=""
              className="w-10 h-10 rounded-full object-contain bg-gray-50 border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-gray-400">
                {school.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{school.name}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${divisionColor(school.division)}`}>
                {school.division}
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-600">
                {school.conference}
              </span>
              <span className="text-xs text-gray-500">
                {school.city}, {school.state}
              </span>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ))}
    </div>
  );
}

// Format assistant messages with basic markdown-like formatting
function FormattedMessage({ content }: { content: string }) {
  const cleaned = stripSchoolMarkers(content);
  const lines = cleaned.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Bold text
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Bullet points
        if (line.match(/^[\-\*•]\s/)) {
          const bulletContent = line.replace(/^[\-\*•]\s/, "");
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-red-500 shrink-0 mt-0.5">&bull;</span>
              <span dangerouslySetInnerHTML={{ __html: bulletContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          );
        }

        // Numbered lists
        if (line.match(/^\d+[\.\)]\s/)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span dangerouslySetInnerHTML={{ __html: formatted }} />
            </div>
          );
        }

        // Empty line = spacing
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }

        // Regular text
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
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
      className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
        listening
          ? "bg-red-600 text-white animate-pulse"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
      }`}
      title={listening ? "Stop listening" : "Voice input"}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}

const STARTER_PROMPTS = [
  "I want a competitive D1 program in the South with good academics",
  "I'm looking for a small school where I can play right away",
  "Find me programs with strong MLB draft records",
  "I want to stay close to home and keep tuition low",
];

export default function AIMatchPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [userBgPic, setUserBgPic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

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

      if (!res.ok) {
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
    // Auto-send voice input
    sendMessage(text);
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <SiteHeader backgroundImage={userBgPic || undefined} activeNav="AI Scout" />

        <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex flex-col">
          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Scout</h1>
                <p className="text-xs text-gray-500">
                  Describe what you&apos;re looking for in your own words — or use the mic to talk.
                </p>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 300, maxHeight: "60vh" }}>
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mb-1">Tell me what you&apos;re looking for</h2>
                  <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                    Describe your ideal college baseball program and I&apos;ll find the best matches for you.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {STARTER_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(prompt)}
                        className="text-left px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 font-medium transition-colors"
                      >
                        &quot;{prompt}&quot;
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
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
                      <SchoolCards schools={msg.schools} />
                    )}
                  </div>
                </div>
              ))}

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

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-200 p-3 bg-gray-50/50">
              <div className="flex items-end gap-2">
                <MicButton onTranscript={handleVoiceTranscript} />
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you're looking for..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                AI Scout uses your profile to personalize recommendations. Results are suggestions — always do your own research.
              </p>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </AuthGate>
  );
}
