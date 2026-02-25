"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

interface SiteFooterProps {
  onLogoClick?: () => void;
}

export default function SiteFooter({ onLogoClick }: SiteFooterProps) {
  return (
    <footer className="bg-gray-900 mt-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <BrandLogo size="sm" showTagline={false} onClick={onLogoClick} />
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-gray-600">Build {process.env.NEXT_PUBLIC_BUILD_VERSION || "v8.8"}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center sm:text-left">
          ExtraBase is a product of JackJack Enterprises. Data is for informational purposes only. Go be great!
        </p>
      </div>
    </footer>
  );
}
