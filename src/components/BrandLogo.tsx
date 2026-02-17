import Link from "next/link";

// Colors matched from brand image:
// "NEXT" = warm pink/salmon
// "BASE" = warm peach/cream
// Tagline = muted gold/tan

type BrandSize = "sm" | "md" | "lg";

interface BrandLogoProps {
  size?: BrandSize;
  showTagline?: boolean;
  linkHome?: boolean;
}

const sizeConfig = {
  sm: {
    text: "text-lg sm:text-xl",
    tagline: "text-[7px] sm:text-[8px] tracking-[0.2em]",
    gap: "gap-0",
  },
  md: {
    text: "text-2xl sm:text-3xl",
    tagline: "text-[9px] sm:text-[10px] tracking-[0.25em]",
    gap: "gap-0.5",
  },
  lg: {
    text: "text-4xl sm:text-6xl",
    tagline: "text-[10px] sm:text-xs tracking-[0.3em]",
    gap: "gap-1",
  },
};

export default function BrandLogo({ size = "lg", showTagline = true, linkHome = true }: BrandLogoProps) {
  const cfg = sizeConfig[size];

  const content = (
    <div className={`flex flex-col ${cfg.gap} select-none`}>
      <div className={`${cfg.text} font-bold leading-none`} style={{ fontFamily: "'Permanent Marker', cursive" }}>
        <span className="text-red-500">NEXT</span>
        <span className="text-white">BASE</span>
      </div>
      {showTagline && (
        <p className={`${cfg.tagline} uppercase font-semibold text-white/60`}>
          Your Personal AI Recruiting Edge
        </p>
      )}
    </div>
  );

  if (linkHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
