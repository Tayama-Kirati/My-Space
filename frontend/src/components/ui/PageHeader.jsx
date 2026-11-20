import React from "react";
import clsx from "clsx";
import Stats from "./Stats";

/**
 * eyebrow + h1 + optional subtitle on the left; right side = optional stats + action.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  stats,
  action,
  className,
}) {
  return (
    <section
      className={clsx(
        "flex items-end justify-between gap-6 flex-wrap pt-12 pb-7",
        className
      )}
    >
      <div>
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="font-serif font-medium text-ink text-[34px] sm:text-[44px] leading-[1.1] tracking-[-0.01em]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2.5 text-ink-2 text-base max-w-[560px]">{subtitle}</p>
        )}
      </div>
      {(stats || action) && (
        <div className="flex gap-8 items-end flex-wrap">
          {stats && (Array.isArray(stats) ? <Stats items={stats} /> : stats)}
          {action}
        </div>
      )}
    </section>
  );
}
