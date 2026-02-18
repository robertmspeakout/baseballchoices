import Link from "next/link";

type BrandSize = "sm" | "md" | "lg";

interface BrandLogoProps {
  size?: BrandSize;
  showTagline?: boolean;
  linkHome?: boolean;
}

const sizeConfig = {
  sm: {
    text: "text-lg sm:text-xl",
    tagline: "text-[7px] sm:text-[8px]",
    spacer: "h-2.5",
  },
  md: {
    text: "text-2xl sm:text-3xl",
    tagline: "text-[8px] sm:text-[9px]",
    spacer: "h-3",
  },
  lg: {
    text: "text-4xl sm:text-6xl",
    tagline: "text-sm sm:text-xl",
    spacer: "h-5 sm:h-7",
  },
};

export default function BrandLogo({ size = "lg", showTagline = true, linkHome = true }: BrandLogoProps) {
  const cfg = sizeConfig[size];

  const content = (
    <div className="relative inline-block select-none">
      <div className={`${cfg.text} font-bold leading-none whitespace-nowrap`} style={{ fontFamily: "'Permanent Marker', cursive" }}>
        <span className="text-red-500">EXTRA</span>
        <span className="text-white">BASE</span>
      </div>
      {showTagline && (
        <>
          <div className={cfg.spacer} />
          <p
            className={`${cfg.tagline} absolute left-0 right-0 bottom-0 font-semibold text-white/60 whitespace-nowrap text-center`}
            style={{ letterSpacing: "0.25em" }}
          >
            Your Personal AI Recruiting Edge
          </p>
        </>
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
