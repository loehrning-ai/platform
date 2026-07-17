"use client";

import { m, useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <m.div
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-brand-orange"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
