"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "My Top Programs", href: "/#mylist" },
  { label: "My AI Matches", href: "/match", highlight: true },
  { label: "All Division 1", href: "/#D1" },
  { label: "All Division 2", href: "/#D2" },
];

/* Sparkle/wand icon for AI Matches */
function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

interface SiteNavProps {
  /** Current active item label for highlighting (optional) */
  active?: string;
  /** Visual variant: "light" for dark-on-white, "dark" for white-on-dark */
  variant?: "light" | "dark";
  /** Optional callback for tab-like items on the home page */
  onNavigate?: (href: string) => void;
}

export default function SiteNav({ active, variant = "light", onNavigate }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  const isLight = variant === "light";

  const isLocalNav = (href: string) => href === "/" || href.startsWith("/#");

  const handleClick = (item: typeof NAV_ITEMS[0]) => {
    setOpen(false);
    if (onNavigate && isLocalNav(item.href)) {
      onNavigate(item.href);
    }
  };

  return (
    <div className="relative">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`p-2 rounded-lg transition-colors ${
          isLight
            ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            : "text-white/80 hover:bg-white/15 hover:text-white"
        }`}
        aria-label="Navigation menu"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 top-full mt-1 w-56 rounded-xl shadow-2xl overflow-hidden z-50 border ${
            isLight
              ? "bg-white border-gray-200"
              : "bg-gray-900/95 backdrop-blur-md border-white/10"
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.label;

            // "My AI Matches" gets special red styling
            if (item.highlight) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => handleClick(item)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b last:border-0 ${
                    isLight
                      ? "bg-red-600 text-white hover:bg-red-700 border-gray-200"
                      : "bg-red-600 text-white hover:bg-red-700 border-white/5"
                  }`}
                >
                  <AIIcon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (onNavigate && isLocalNav(item.href)) {
                    e.preventDefault();
                    handleClick(item);
                  } else {
                    handleClick(item);
                  }
                }}
                className={`block px-4 py-3 text-sm font-bold transition-colors border-b last:border-0 ${
                  isLight
                    ? isActive
                      ? "bg-gray-900 text-white border-gray-200"
                      : "text-gray-700 hover:bg-gray-50 border-gray-100"
                    : isActive
                      ? "bg-white/15 text-white border-white/5"
                      : "text-white/80 hover:text-white hover:bg-white/10 border-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
