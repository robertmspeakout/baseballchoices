"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "xs" | "sm" | "md" | "lg";
  readonly?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  const [animating, setAnimating] = useState<number | null>(null);

  const starSize = size === "xs" ? "text-[17px]" : size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";
  // Generous tap targets for mobile (xs uses tighter spacing for compact rows)
  const tapTarget = size === "xs" ? "p-[3px] -m-[1px]" : size === "sm" ? "p-1.5 -m-1" : size === "lg" ? "p-3 -m-2" : "p-2 -m-1.5";

  const handleClick = (star: number) => {
    if (readonly || !onChange) return;
    setAnimating(star);
    onChange(star === value ? 0 : star);
    setTimeout(() => setAnimating(null), 300);
  };

  return (
    <div className={`flex ${readonly ? "" : "cursor-pointer"}`} role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (animating != null && animating >= star ? animating : value);
        const isPulsing = animating != null && star <= animating;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            className={`${starSize} ${tapTarget} select-none transition-all duration-150 ${
              readonly
                ? "cursor-default"
                : "cursor-pointer hover:scale-125 active:scale-95"
            } ${isActive ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"} ${
              isPulsing ? "animate-star-pulse" : ""
            }`}
            title={readonly ? `${value} stars` : `Set to ${star} star${star > 1 ? "s" : ""}`}
          >
            &#9733;
          </button>
        );
      })}
    </div>
  );
}
