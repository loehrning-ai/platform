/**
 * Outlined monochrome icons for Glas controls (20px grid, 1.75 stroke,
 * round caps). Always aria-hidden: the control carries the name.
 */

import type { SVGProps } from "react";

export type GlasIconName =
  | "play"
  | "pause"
  | "replay"
  | "copy"
  | "download"
  | "close"
  | "back"
  | "forward"
  | "check"
  | "doc"
  | "upload"
  | "plus"
  | "mic"
  | "send"
  | "menu"
  | "compose"
  | "sidebar"
  | "chevron-down"
  | "skip"
  | "info"
  | "search"
  | "home"
  | "code"
  | "sliders"
  | "folder";

const PATHS: Record<GlasIconName, string> = {
  play: "M6.5 4.5v11l9-5.5z",
  pause: "M7 4.5v11M13 4.5v11",
  replay: "M4.5 9.5a5.5 5.5 0 1 0 1.8-4.1M4 2.5v4h4",
  copy: "M7 7h9v9H7zM4 13V4h9",
  download: "M10 3.5v9M6 9l4 4 4-4M4 16.5h12",
  close: "M5 5l10 10M15 5L5 15",
  back: "M12.5 4.5L7 10l5.5 5.5",
  forward: "M7.5 4.5L13 10l-5.5 5.5",
  check: "M4.5 10.5l3.5 3.5 7.5-8",
  doc: "M5.5 2.5h6l3 3v12h-9zM11.5 2.5v3h3M8 10h5M8 13h5",
  upload: "M10 13.5v-9M6 8l4-4 4 4M4 16.5h12",
  plus: "M10 4v12M4 10h12",
  mic: "M10 3a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0v-4A2.5 2.5 0 0 1 10 3zM5 9.5a5 5 0 0 0 10 0M10 14.5V17",
  send: "M10 15.5v-11M5.5 9L10 4.5 14.5 9",
  menu: "M3.5 6h13M3.5 10h13M3.5 14h13",
  compose: "M4 16h3l8.5-8.5-3-3L4 13zM11 6l3 3",
  sidebar: "M3.5 4.5h13v11h-13zM8 4.5v11",
  "chevron-down": "M5.5 8l4.5 4.5L14.5 8",
  skip: "M5 4.5l7 5.5-7 5.5zM14.5 4.5v11",
  info: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 9v4.5M10 6.5v.5",
  search: "M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM12.5 12.5L16.5 16.5",
  home: "M3.5 9.5L10 4l6.5 5.5V16h-13z",
  code: "M7 6l-4 4 4 4M13 6l4 4-4 4",
  sliders: "M4 6h7M15 6h1M4 14h1M9 14h7M11 4v4M7 12v4",
  folder: "M2.5 5.5h5l1.5 2h8.5v8.5h-15z",
};

export function GlasIcon({ name, ...props }: { readonly name: GlasIconName } & SVGProps<SVGSVGElement>) {
  const filled = name === "play";
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
