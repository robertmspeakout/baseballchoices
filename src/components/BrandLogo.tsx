import Link from "next/link";

type BrandSize = "sm" | "md" | "lg";

interface BrandLogoProps {
  size?: BrandSize;
  showTagline?: boolean;
  linkHome?: boolean;
  onClick?: () => void;
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
    tagline: "text-[8px] sm:text-xs",
    spacer: "h-3.5 sm:h-5",
  },
};

export default function BrandLogo({ size = "lg", showTagline = true, linkHome = true, onClick }: BrandLogoProps) {
  const cfg = sizeConfig[size];

  const content = (
    <div className="relative inline-block select-none">
      <div className={`${cfg.text} font-bold leading-none whitespace-nowrap`} style={{ fontFamily: "var(--font-marker)" }}>
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
            College baseball recruiting, simplified.
          </p>
        </>
      )}
    </div>
  );

  if (linkHome) {
    return (
      <Link
        href="/"
        className="hover:opacity-90 transition-opacity"
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
}
