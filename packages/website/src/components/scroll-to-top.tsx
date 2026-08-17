"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // A hash link is an explicit request for a position on the page. Scrolling
    // to the top unconditionally undoes it: the browser jumps to the anchor
    // while parsing, this effect runs at hydration and yanks it back, and with
    // scroll-behavior: smooth the yank is visible. That silently broke every
    // deep link on the site — /kurse#tiefer-gehen from the nav and the footer,
    // #lernpfad, #open-source, #ki — which read as the anchor pointing at the
    // wrong section rather than as a scroll bug.
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <span
      data-scroll-to-top-runtime="true"
      hidden
      aria-hidden="true"
    />
  );
}
