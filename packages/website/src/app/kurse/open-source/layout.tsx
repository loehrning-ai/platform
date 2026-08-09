import type { ReactNode } from "react";

/**
 * Technical courses inherit the request language from the root document.
 * Keeping a second async locale wrapper here is redundant and, under a cold
 * streamed render, can move React's hydration cursor inside the wrapper before
 * the wrapper fiber itself is claimed.
 */
export default function OpenSourceCoursesLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
