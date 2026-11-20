import React from "react";
import clsx from "clsx";

/**
 * Segmented control / tabs.
 * options: [{ value, label, icon?, count? }]
 * role: "tablist" | "group"
 */
export default function Segmented({
  options,
  value,
  onChange,
  ariaLabel,
  role = "group",
  className,
}) {
  const isTabs = role === "tablist";
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={clsx(
        "inline-flex flex-wrap gap-1 p-1 rounded-[12px] bg-sunk",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange?.(opt.value)}
            role={isTabs ? "tab" : undefined}
            aria-selected={isTabs ? active : undefined}
            aria-pressed={!isTabs ? active : undefined}
            className={clsx(
              "inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-[9px] text-[13px] font-semibold transition-colors",
              active
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(35,28,20,.12)]"
                : "bg-transparent text-ink-2 hover:text-ink"
            )}
          >
            {Icon ? <Icon size={14} /> : null}
            {opt.label}
            {opt.count != null && (
              <span className="text-xs text-ink-3 font-medium">{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
