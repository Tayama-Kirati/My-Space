import React from "react";
import clsx from "clsx";
import { Image as ImageIcon } from "lucide-react";

/** Diagonal paper-stripe placeholder for missing images. */
export default function Placeholder({ className, iconSize = 22, style }) {
  return (
    <div
      className={clsx(
        "ph-stripes flex items-center justify-center text-ink-3",
        className
      )}
      style={style}
    >
      <ImageIcon size={iconSize} />
    </div>
  );
}
