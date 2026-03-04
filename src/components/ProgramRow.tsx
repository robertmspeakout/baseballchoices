"use client";

import Link from "next/link";
import StarRating from "./StarRating";
import { useState, useRef } from "react";

interface ProgramRowSchool {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  division: string;
  conference: string;
  current_ranking: number | null;
  logo_url?: string | null;
  website?: string | null;
  last_season_record: string | null;
  priority: number;
}

const divisionLabels: Record<string, string> = {
  D1: "D-I",
  D2: "D-II",
  D3: "D-III",
  JUCO: "JUCO",
};

const priorityLabels: Record<number, string> = {
  0: "",
  1: "Mildly Interested",
  2: "Interested",
  3: "Very Interested",
  4: "Top Choice",
  5: "VIP",
};

function RowLogo({ school }: { school: ProgramRowSchool }) {
  const [src, setSrc] = useState(school.logo_url || null);
  const triedFallback = useRef(false);

  function handleError() {
    if (!triedFallback.current && school.website) {
      triedFallback.current = true;
      try {
        const domain = new URL(school.website).hostname;
        setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      } catch {
        setSrc(null);
      }
    } else {
      setSrc(null);
    }
  }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="w-[42px] h-[42px] object-contain"
        onError={handleError}
      />
    );
  }
  return (
    <span className="text-[13px] font-bold text-gray-400">
      {school.name.split(" ").map((w) => w[0]).join("").slice(0, 3)}
    </span>
  );
}

interface ProgramRowProps {
  school: ProgramRowSchool;
  onPriorityChange: (schoolId: number, priority: number) => void;
  /** Optional extra content rendered below line 2 (e.g. match score, reasons) */
  extra?: React.ReactNode;
}

export default function ProgramRow({
  school,
  onPriorityChange,
  extra,
}: ProgramRowProps) {
  const divLabel = divisionLabels[school.division] || school.division;

  return (
    <Link
      href={`/school/${school.id}`}
      className="flex items-center bg-white rounded-xl border border-[rgba(0,0,0,0.05)] hover:border-[rgba(0,0,0,0.12)] hover:shadow-sm active:bg-gray-50 transition-all cursor-pointer select-none"
      style={{ padding: "10px 10px 10px 12px" }}
    >
      {/* Logo */}
      <div
        className="shrink-0 rounded-full bg-[#f5f5f7] border border-[rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden"
        style={{ width: 42, height: 42 }}
      >
        <RowLogo school={school} />
      </div>

      {/* Info block */}
      <div className="flex-1 min-w-0 ml-3">
        {/* Line 1: School name */}
        <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">
          {school.name}
        </p>

        {/* Line 2: Division · Mascot · Conference · City, State */}
        <p className="text-[11px] text-[#888] truncate leading-tight mt-[2px]">
          {divLabel}
          {school.mascot ? ` · ${school.mascot}` : ""}
          {school.conference ? <> · <span className="font-semibold text-[#666]">{school.conference}</span></> : ""}
          {school.city ? ` · ${school.city}, ${school.state}` : ""}
        </p>

        {/* Optional extra content (match reasons, etc.) */}
        {extra}

        {/* Line 3: Star rating + tier label */}
        <div className="flex items-center mt-[3px]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <StarRating
            value={school.priority}
            onChange={(v) => onPriorityChange(school.id, v)}
            size="xs"
          />
          {school.priority > 0 && (
            <span className="ml-1.5 font-bold text-[#aaa]" style={{ fontSize: "9.5px" }}>
              {priorityLabels[school.priority]}
            </span>
          )}
        </div>
      </div>

      {/* Right: Rank */}
      {school.current_ranking && (
        <div className="shrink-0 flex flex-col items-end ml-2 mr-1">
          <span className="text-[13px] font-extrabold text-[#c1272d] leading-tight">
            #{school.current_ranking}
          </span>
        </div>
      )}

      {/* Far right: Chevron */}
      <span className="shrink-0 text-[18px] text-[#ccc] ml-1 leading-none">&rsaquo;</span>
    </Link>
  );
}

export { type ProgramRowSchool, priorityLabels, divisionLabels };
