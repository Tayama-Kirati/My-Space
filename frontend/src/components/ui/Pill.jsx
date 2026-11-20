import React from "react";
import clsx from "clsx";

const TONES = {
  neutral: "bg-sunk text-ink-2",
  moss: "bg-moss-t text-moss-d",
  clay: "bg-clay-t text-clay-ink",
  sky: "bg-sky-t text-sky-ink",
};

export default function Pill({ tone = "neutral", className, children, ...rest }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold",
        TONES[tone] || TONES.neutral,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
