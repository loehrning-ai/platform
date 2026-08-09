"use client";

import { m, useScroll } from "framer-motion";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

function ScrollProgressContent() {
  const { scrollYProgress } = useScroll();

  return (
    <m.div
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-brand-orange"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

export const ScrollProgress = withMotionProvider(ScrollProgressContent);
