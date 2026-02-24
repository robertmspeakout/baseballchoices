"use client";

import BrandLogo from "@/components/BrandLogo";
import SiteNav from "@/components/SiteNav";

interface SiteHeaderProps {
  backgroundImage?: string;
  activeNav?: string;
  onLogoClick?: () => void;
  onNavigate?: (href: string) => void;
  profilePic?: string | null;
}

const DEFAULT_BG = "https://images.unsplash.com/photo-1629219644109-b4df0ab25a7b?w=1920&q=80";

export default function SiteHeader({ backgroundImage, activeNav, onLogoClick, onNavigate, profilePic }: SiteHeaderProps) {
  return (
    <header className="relative text-white overflow-x-clip overflow-y-visible z-30">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url('${backgroundImage || DEFAULT_BG}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-start justify-between">
          <BrandLogo size="lg" showTagline={true} onClick={onLogoClick} />
          <SiteNav variant="dark" active={activeNav} onNavigate={onNavigate} profilePic={profilePic} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
    </header>
  );
}
