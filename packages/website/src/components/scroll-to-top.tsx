"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
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
