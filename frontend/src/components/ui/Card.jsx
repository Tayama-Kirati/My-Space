import React from "react";
import clsx from "clsx";

export default function Card({ as: Comp = "div", className, children, ...rest }) {
  return (
    <Comp
      className={clsx("bg-surface border border-line rounded-card", className)}
      {...rest}
    >
      {children}
    </Comp>
  );
}
