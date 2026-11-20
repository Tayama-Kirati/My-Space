import React from "react";
import clsx from "clsx";

const VARIANTS = {
  primary: "bg-moss text-white hover:bg-moss-d",
  secondary: "bg-surface text-ink border border-line hover:bg-sunk",
  ghost: "bg-transparent text-ink-2 hover:bg-sunk hover:text-ink",
  light: "bg-recap-fg text-recap-bg hover:opacity-90",
  outlineLight:
    "bg-transparent text-recap-fg border border-recap-fg/40 hover:bg-recap-fg/10",
};

/**
 * Polymorphic button. Pass `as={Link} to="/x"` for router links, or `as="a" href`.
 * `size="icon"` makes a 44x44 square. `icon` renders a leading lucide icon.
 */
export default function Button({
  as: Comp = "button",
  variant = "primary",
  size,
  icon: Icon,
  iconSize = 16,
  className,
  children,
  ...rest
}) {
  return (
    <Comp
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-ctl font-semibold text-sm whitespace-nowrap transition-colors",
        "min-h-[44px]",
        size === "icon" ? "w-11 px-0" : "px-[18px]",
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
    </Comp>
  );
}
