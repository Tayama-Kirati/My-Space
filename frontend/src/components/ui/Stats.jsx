import React from "react";
import clsx from "clsx";

/** items: [{ value, label }] */
export default function Stats({ items, className }) {
  return (
    <div className={clsx("flex flex-wrap gap-8", className)}>
      {items.map((s, i) => (
        <div key={i}>
          <b className="block font-serif font-medium text-[28px] leading-tight text-ink">
            {s.value}
          </b>
          <span className="text-xs font-medium text-ink-3">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
