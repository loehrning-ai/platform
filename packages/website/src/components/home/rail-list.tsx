"use client";

import type { ComponentProps } from "react";
import { getMotionAwareScrollBehavior } from "@/lib/animation-policy";

/**
 * A horizontal rail's list that keeps a keyboard-focused tile fully inside
 * the rail (WCAG 2.4.11): a tile cut at the screen edge otherwise keeps part
 * of its ring off-screen, because the browser does not scroll a partly
 * visible element on focus. Focus events bubble, so one listener on the list
 * covers every tile; the tiles themselves stay server-rendered children.
 * The rail's `scroll-px-*` keeps the tile off the gutter edge.
 */
export function RailList({ children, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      {...props}
      onFocus={(event) => {
        if (!(event.target instanceof HTMLElement)) return;
        event.target.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: getMotionAwareScrollBehavior(),
        });
      }}
    >
      {children}
    </ul>
  );
}
