"use client";

import { useState, useRef, useEffect } from "react";

interface PillNavOption {
  value: string;
  label: string;
}

interface PillNavProps {
  options: PillNavOption[];
  value: string;
  onSelect: (value: string) => void;
  onSearchClick: () => void;
  className?: string;
}

export default function PillNav({ options, value, onSelect, onSearchClick, className = "" }: PillNavProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Pill bar */}
      <div className="flex items-center border border-[#e0e0e5] bg-white rounded-[100px] hover:border-[#c0c0c5] hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all">
        {/* Dropdown trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 flex items-center justify-between px-[18px] py-[13px] rounded-l-[100px] hover:bg-[rgba(0,0,0,0.03)] transition-colors cursor-pointer"
        >
          <span className="text-[14px] font-semibold text-gray-900 truncate">{selectedLabel}</span>
          <svg
            className={`shrink-0 ml-2 w-4 h-4 text-[#c1272d] transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px self-stretch my-[10px] bg-[#c8c8cd]" />

        {/* Search */}
        <button
          type="button"
          onClick={onSearchClick}
          className="shrink-0 w-[54px] flex items-center justify-center rounded-r-[100px] hover:bg-[rgba(0,0,0,0.03)] transition-colors self-stretch group"
          aria-label="Search"
        >
          <svg className="w-[17px] h-[17px] text-[#888] group-hover:text-[#555] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-[#e0e0e5] rounded-2xl shadow-lg overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setOpen(false);
                if (opt.value !== value) onSelect(opt.value);
              }}
              className={`w-full text-left px-[18px] py-[12px] text-[14px] font-semibold transition-colors cursor-pointer ${
                opt.value === value
                  ? "text-[#c1272d] bg-[#fdf2f2]"
                  : "text-gray-900 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
