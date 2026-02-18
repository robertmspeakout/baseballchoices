"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "My Top Programs", href: "/#mylist" },
  { label: "My AI Matches", href: "/match" },
  { label: "All Division 1", href: "/#D1" },
  { label: "All Division 2", href: "/#D2" },
];

interface SiteNavProps {
  /** Current active item label for highlighting (optional) */
  active?: string;
  /** Visual variant: "light" for dark-on-white, "dark" for white-on-dark */
  variant?: "light" | "dark";
}

export default function SiteNav({ active, variant = "light" }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  const isLight = variant === "light";

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
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
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
