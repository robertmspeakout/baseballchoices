"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: null },
  { label: "My Top Programs", href: "/#mylist", icon: "star" },
  { label: "AI Scout", href: "/ai-match", icon: "sparkle" },
  { label: "DI Programs", href: "/programs/d1", icon: null },
  { label: "DII Programs", href: "/programs/d2", icon: null },
  { label: "DIII Programs", href: "/programs/d3", icon: null },
  { label: "JUCO Programs", href: "/programs/juco", icon: null },
];


function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  star: StarIcon,
  sparkle: SparkleIcon,
};

interface Notification {
  id: string;
  schoolId: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  schoolLogo: string | null;
  read: boolean;
  createdAt: string;
}

const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  game_result: "trophy",
  game_today: "play",
  coach_change: "person",
  championship: "star",
  conference_change: "swap",
  ranking_change: "chart",
};

interface SiteNavProps {
  active?: string;
  variant?: "light" | "dark";
  onNavigate?: (href: string) => void;
}

export default function SiteNav({ active, variant = "light", onNavigate }: SiteNavProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef(false);

  const isLight = variant === "light";
  const isLoggedIn = !!session?.user;
  const firstName = (session?.user as Record<string, unknown>)?.firstName as string | undefined;

  // Close menus on click outside
  useEffect(() => {
    if (!open && !notifOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (open && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, notifOpen]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }, []);

  // Generate & fetch notifications on mount (throttled to once per session)
  useEffect(() => {
    if (!isLoggedIn || generatedRef.current) return;
    generatedRef.current = true;

    // Check if we generated recently (throttle to every 15 minutes)
    const lastGen = sessionStorage.getItem("notif_last_gen");
    const now = Date.now();
    const fifteenMin = 15 * 60 * 1000;

    if (!lastGen || now - parseInt(lastGen) > fifteenMin) {
      // Generate new notifications in the background, then fetch
      fetch("/api/notifications/generate")
        .then(() => {
          sessionStorage.setItem("notif_last_gen", String(now));
          fetchNotifications();
        })
        .catch(() => fetchNotifications());
    } else {
      fetchNotifications();
    }
  }, [isLoggedIn, fetchNotifications]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const isLocalNav = (href: string) => href === "/" || href.startsWith("/#");

  const handleClick = (item: typeof NAV_ITEMS[0]) => {
    setOpen(false);
    if (onNavigate && isLocalNav(item.href)) {
      onNavigate(item.href);
    }
  };

  const handleSignOut = () => {
    setOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTypeIcon = (type: string) => {
    const iconType = NOTIFICATION_TYPE_ICONS[type] || "bell";
    switch (iconType) {
      case "trophy":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "play":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "chart":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "star":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case "game_result": return "bg-green-100 text-green-600";
      case "game_today": return "bg-blue-100 text-blue-600";
      case "ranking_change": return "bg-purple-100 text-purple-600";
      case "championship": return "bg-yellow-100 text-yellow-600";
      case "coach_change": return "bg-orange-100 text-orange-600";
      case "conference_change": return "bg-indigo-100 text-indigo-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="relative flex items-center gap-1">
      {/* Desktop auth buttons — only for logged-out users */}
      {!isLoggedIn && (
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/auth/login"
            className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
              isLight ? "text-gray-700 hover:bg-gray-100" : "text-white/80 hover:bg-white/10"
            }`}
          >
            Log In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center px-4 py-2 bg-[#CC0000] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      )}

      {/* Notification bell — logged-in users only */}
      {isLoggedIn && (
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((o) => !o); setOpen(false); }}
            className={`relative p-2 rounded-lg transition-colors ${
              isLight
                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-white/80 hover:bg-white/15 hover:text-white"
            }`}
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div
              className={`absolute right-0 top-full mt-1 w-80 sm:w-96 max-h-[70vh] rounded-xl shadow-2xl overflow-hidden z-50 border flex flex-col ${
                isLight
                  ? "bg-white border-gray-200"
                  : "bg-gray-900/95 backdrop-blur-md border-white/10"
              }`}
            >
              {/* Header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b ${
                isLight ? "border-gray-100" : "border-white/5"
              }`}>
                <h3 className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <svg className={`w-8 h-8 mx-auto mb-2 ${isLight ? "text-gray-300" : "text-white/20"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className={`text-sm ${isLight ? "text-gray-400" : "text-white/40"}`}>
                      No notifications yet
                    </p>
                    <p className={`text-xs mt-1 ${isLight ? "text-gray-300" : "text-white/20"}`}>
                      Rate programs 4 or 5 stars to get alerts
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const content = (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 flex items-start gap-3 border-b transition-colors ${
                          isLight
                            ? `${notif.read ? "bg-white" : "bg-red-50/50"} border-gray-50 hover:bg-gray-50`
                            : `${notif.read ? "bg-transparent" : "bg-white/5"} border-white/5 hover:bg-white/10`
                        }`}
                      >
                        {/* School logo or type icon */}
                        <div className="shrink-0 mt-0.5">
                          {notif.schoolLogo ? (
                            <img
                              src={notif.schoolLogo}
                              alt=""
                              className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeBgColor(notif.type)}`}>
                              {getTypeIcon(notif.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-bold leading-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="shrink-0 w-2 h-2 mt-1 rounded-full bg-red-500" />
                            )}
                          </div>
                          <p className={`text-[11px] mt-0.5 leading-snug ${isLight ? "text-gray-500" : "text-white/50"}`}>
                            {notif.body}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${getTypeBgColor(notif.type)}`}>
                              {getTypeIcon(notif.type)}
                              {notif.type.replace(/_/g, " ")}
                            </span>
                            <span className={`text-[10px] ${isLight ? "text-gray-400" : "text-white/30"}`}>
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );

                    if (notif.link) {
                      return (
                        <a
                          key={notif.id}
                          href={notif.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                          onClick={() => setNotifOpen(false)}
                        >
                          {content}
                        </a>
                      );
                    }
                    return content;
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile / hamburger button */}
      <div ref={wrapperRef} className="relative">
        <button
          onClick={() => { setOpen((o) => !o); setNotifOpen(false); }}
          className={`p-2 rounded-lg transition-colors ${
            isLoggedIn
              ? isLight
                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-white/80 hover:bg-white/15 hover:text-white"
              : isLight
                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-white/80 hover:bg-white/15 hover:text-white"
          }`}
          aria-label={isLoggedIn ? "Account menu" : "Navigation menu"}
        >
          {isLoggedIn ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {open && (
          <div
            className={`absolute right-0 top-full mt-1 w-56 rounded-xl shadow-2xl overflow-hidden z-50 border ${
              isLight
                ? "bg-white border-gray-200"
                : "bg-gray-900/95 backdrop-blur-md border-white/10"
            }`}
          >
            {/* Logged-in: account-only menu. Logged-out: full nav + auth */}
            {isLoggedIn ? (
              <>
                {/* Greeting */}
                {firstName && (
                  <div className={`px-4 py-3 text-xs font-medium border-b ${isLight ? "text-gray-400 border-gray-100" : "text-white/40 border-white/5"}`}>
                    Hi, {firstName}
                  </div>
                )}
                <Link
                  href="/auth/profile"
                  onClick={() => setOpen(false)}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b ${
                    isLight
                      ? "text-gray-700 hover:bg-gray-50 border-gray-100"
                      : "text-white/80 hover:text-white hover:bg-white/10 border-white/5"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>
                <Link
                  href="/auth/account"
                  onClick={() => setOpen(false)}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b ${
                    isLight
                      ? "text-gray-700 hover:bg-gray-50 border-gray-100"
                      : "text-white/80 hover:text-white hover:bg-white/10 border-white/5"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  My Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
                    isLight
                      ? "text-red-600 hover:bg-red-50"
                      : "text-red-400 hover:bg-red-500/10"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </>
            ) : (
              <>
                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.label;
                  const Icon = item.icon ? iconMap[item.icon] : null;
                  const cls = `w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b last:border-0 ${
                    isLight
                      ? isActive
                        ? "bg-gray-900 text-white border-gray-200"
                        : "text-gray-700 hover:bg-gray-50 border-gray-100"
                      : isActive
                        ? "bg-white/15 text-white border-white/5"
                        : "text-white/80 hover:text-white hover:bg-white/10 border-white/5"
                  }`;

                  if (onNavigate && isLocalNav(item.href)) {
                    return (
                      <button
                        key={item.label}
                        onClick={(e) => {
                          e.preventDefault();
                          handleClick(item);
                        }}
                        className={cls}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {item.label}
                      </button>
                    );
                  }

                  if (isLocalNav(item.href)) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cls}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {item.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cls}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b ${
                    isLight
                      ? "text-gray-700 hover:bg-gray-50 border-gray-100"
                      : "text-white/80 hover:text-white hover:bg-white/10 border-white/5"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-[#CC0000] text-white hover:bg-red-700 transition-colors"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
