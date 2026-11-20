import React from "react";
import clsx from "clsx";
import { Star } from "lucide-react";

/**
 * value: 0..5 (filled up to Math.round). interactive: pass onChange(n).
 */
export default function StarRating({
  value = 0,
  size = 16,
  onChange,
  className,
  "aria-label": ariaLabel,
}) {
  const interactive = typeof onChange === "function";
  const rounded = Math.round(value);
  return (
    <span
      role="img"
      aria-label={ariaLabel || `${rounded} of 5 stars`}
      className={clsx("inline-flex gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rounded;
        const star = (
          <Star
            size={size}
            strokeWidth={1.5}
            className="text-gold"
            fill={filled ? "currentColor" : "none"}
          />
        );
        return interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="leading-none"
          >
            {star}
          </button>
        ) : (
          <span key={n} className="leading-none">
            {star}
          </span>
        );
      })}
    </span>
  );
}
