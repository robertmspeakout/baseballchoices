"use client";

import { useEffect, useRef, useState } from "react";
import type { TickerItem } from "@/app/api/ticker/route";

interface NewsTickerProps {
  schools: { name: string; logo_url: string | null }[];
}

export default function NewsTicker({ schools }: NewsTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const speedRef = useRef(1); // px per frame

  // Drag / swipe state
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // Fetch ticker data
  useEffect(() => {
    if (schools.length === 0) {
      setLoading(false);
      return;
    }

    const payload = JSON.stringify(schools.map((s) => ({ name: s.name, logo: s.logo_url })));
    fetch(`/api/ticker?schools=${encodeURIComponent(payload)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schools]);

  // Smooth scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;

    const animate = () => {
      if (!paused && el) {
        el.scrollLeft += speedRef.current;
        // When we've scrolled past the first copy, reset to create infinite loop
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [items, paused]);

  if (schools.length === 0) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-[#1a1a2e] border-l-4 border-yellow-500 rounded-lg overflow-hidden">
        <div className="flex items-center gap-6 px-4 py-2.5">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-yellow-500/80">LIVE</span>
          <div className="flex gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/10 animate-pulse" />
                <div className="w-32 h-3 rounded bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const typeIcon = (type: TickerItem["type"]) => {
    switch (type) {
      case "score":
        return (
          <svg className="w-3 h-3 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 11.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 10.586V7z" />
          </svg>
        );
      case "next_game":
        return (
          <svg className="w-3 h-3 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case "record":
        return (
          <svg className="w-3 h-3 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
    }
  };

  // Duplicate items for seamless infinite scroll
  const tickerItems = [...items, ...items];

  /* ---- Mouse drag handlers ---- */
  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = el.scrollLeft;
    setPaused(true);
    el.style.cursor = "grabbing";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - dragStartX.current;
    el.scrollLeft = dragScrollLeft.current - dx;
  };

  const onMouseUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const el = scrollRef.current;
    if (el) el.style.cursor = "grab";
    // Resume auto-scroll after a short delay
    setTimeout(() => setPaused(false), 1500);
  };

  /* ---- Touch drag handlers ---- */
  const onTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragging.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragScrollLeft.current = el.scrollLeft;
    setPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.touches[0].clientX - dragStartX.current;
    el.scrollLeft = dragScrollLeft.current - dx;
  };

  const onTouchEnd = () => {
    dragging.current = false;
    // Resume auto-scroll after a short delay
    setTimeout(() => setPaused(false), 2000);
  };

  return (
    <div className="bg-[#1a1a2e] border-l-4 border-yellow-500 rounded-lg overflow-hidden">
      <div className="flex items-center">
        {/* LIVE label */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 flex items-center gap-1.5 border-r border-white/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
          </span>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-yellow-500">LIVE</span>
        </div>

        {/* Scrolling ticker — draggable */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-hidden select-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { if (dragging.current) onMouseUp(); else setPaused(false); }}
          onMouseEnter={() => { if (!dragging.current) setPaused(true); }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <style>{`.ticker-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="ticker-scroll flex items-center whitespace-nowrap py-2.5">
            {tickerItems.map((item, idx) => {
              const inner = (
                <span className="inline-flex items-center gap-1.5">
                  {/* School logo */}
                  {item.schoolLogo && (
                    <img
                      src={item.schoolLogo}
                      alt=""
                      className="w-5 h-5 rounded-full object-contain bg-white shrink-0"
                    />
                  )}
                  {typeIcon(item.type)}
                  <span className="text-xs sm:text-sm font-semibold text-white">{item.text}</span>
                  <span className="text-[10px] sm:text-xs text-gray-400 ml-0.5">{item.subtext}</span>
                </span>
              );

              return (
                <span key={idx} className="inline-flex items-center">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center hover:bg-white/5 rounded px-2 py-0.5 transition-colors"
                      onClick={(e) => { e.stopPropagation(); if (dragging.current) e.preventDefault(); }}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      {inner}
                      <svg className="w-3 h-3 text-gray-500 ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="px-2 py-0.5">{inner}</span>
                  )}
                  {/* Separator diamond */}
                  <span className="text-yellow-600/50 mx-3 text-xs select-none">&#9670;</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
