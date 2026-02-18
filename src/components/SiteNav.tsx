"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: null },
  { label: "My Top Programs", href: "/#mylist", icon: "star" },
  { label: "My AI Matches", href: "/match", icon: "sparkle" },
  { label: "All Division 1", href: "/#D1", icon: null },
  { label: "All Division 2", href: "/#D2", icon: null },
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

interface SiteNavProps {
  active?: string;
  variant?: "light" | "dark";
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

            // On the home page (onNavigate provided), use client-side tab switching
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

            // On other pages, use <a> for hash links to force full navigation
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

            // For non-hash links (e.g. /match), use Next.js Link
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
        </div>
      )}
    </div>
  );
}
