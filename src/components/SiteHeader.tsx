"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import SiteNav from "@/components/SiteNav";
import type { LevelInfo } from "@/lib/levels";

interface SiteHeaderProps {
  backgroundImage?: string;
  activeNav?: string;
  onLogoClick?: () => void;
  onNavigate?: (href: string) => void;
  profilePic?: string | null;
  level?: LevelInfo | null;
  playerFirstName?: string;
}

const DEFAULT_BG = "https://images.unsplash.com/photo-1629219644109-b4df0ab25a7b?w=1920&q=80";

export default function SiteHeader({ backgroundImage, activeNav, onLogoClick, onNavigate, profilePic, level, playerFirstName }: SiteHeaderProps) {
  const showProfile = !!(profilePic || level);

  return (
    <header className="relative text-white overflow-x-clip overflow-y-visible z-30">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url('${backgroundImage || DEFAULT_BG}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className={`relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10 ${showProfile ? "pb-14 sm:pb-16" : ""}`}>
        <div className="flex items-start justify-between">
          <BrandLogo size="lg" showTagline={true} onClick={onLogoClick} />
          <SiteNav variant="dark" active={activeNav} onNavigate={onNavigate} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

      {/* Profile pic + level badge — overlaps into content below */}
      {showProfile && (
        <div className="absolute -bottom-14 sm:-bottom-16 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <Link href="/auth/profile" className="relative group">
            {/* Profile picture */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Level badge — positioned bottom-right of profile pic */}
            {level && (
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full ${level.color} flex items-center justify-center border-2 border-white shadow-md`}>
                <span className="text-white text-xs sm:text-sm font-black leading-none">{level.level}</span>
              </div>
            )}
          </Link>

          {/* Level name + description below the pic */}
          {level && (
            <div className="mt-2 text-center">
              <span className={`text-xs sm:text-sm font-black ${level.textColor}`}>
                {playerFirstName ? `${playerFirstName} — ` : ""}{level.name}
              </span>
              <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{level.description}</p>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
