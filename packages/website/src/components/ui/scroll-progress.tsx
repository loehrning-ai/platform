"use client";

import { m, useScroll } from "framer-motion";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

function ScrollProgressContent() {
  const { scrollYProgress } = useScroll();

  return (
    <div
      aria-hidden="true"
      data-scroll-progress
      className="pointer-events-none fixed inset-0 z-[60]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-brand-orange/25">
        <m.div
          data-scroll-progress-fill="top"
          className="h-[2px] w-full origin-left bg-brand-orange motion-reduce:hidden"
          style={{ scaleX: scrollYProgress }}
        />
      </div>
    </div>
  );
}

export const ScrollProgress = withMotionProvider(ScrollProgressContent);
