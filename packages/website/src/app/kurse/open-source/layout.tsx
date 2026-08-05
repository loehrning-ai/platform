import type { ReactNode } from "react";

/**
 * The technical course tree is English while the surrounding platform
 * navigation remains German. Mark the complete course subtree as an English
 * language part for assistive technology and browser language tools.
 */
export default function OpenSourceCoursesLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <div lang="en">{children}</div>;
}
