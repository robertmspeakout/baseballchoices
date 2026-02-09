"use client";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div className={`flex gap-0.5 ${readonly ? "" : "cursor-pointer"}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => {
            if (!readonly && onChange) {
              onChange(star === value ? 0 : star);
            }
          }}
          className={`${sizeClass} ${
            readonly ? "cursor-default" : "hover:scale-110 transition-transform"
          } ${star <= value ? "text-yellow-400" : "text-gray-300"}`}
          title={readonly ? `${value} stars` : `Set to ${star} star${star > 1 ? "s" : ""}`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
