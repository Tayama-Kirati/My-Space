import React from "react";
import clsx from "clsx";

const baseInput =
  "w-full bg-white border border-line rounded-ctl outline-none text-ink " +
  "placeholder:text-ink-3/70 focus:border-moss focus:ring-[3px] focus:ring-moss/20";

export function Input({ className, ...rest }) {
  return (
    <input
      className={clsx(baseInput, "h-11 px-3.5", className)}
      {...rest}
    />
  );
}

export function Textarea({ className, rows = 6, ...rest }) {
  return (
    <textarea
      rows={rows}
      className={clsx(baseInput, "px-3.5 py-3 leading-relaxed resize-y", className)}
      {...rest}
    />
  );
}

export function Field({ label, htmlFor, className, children }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink-2">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export default Input;
