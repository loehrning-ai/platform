"use client";

import { m } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

interface SectionHeaderProps {
  readonly eyebrow?: string;
  readonly eyebrowColor?: string;
  readonly heading: string;
  readonly description?: string;
  readonly centered?: boolean;
}

function SectionHeaderContent({
  eyebrow,
  eyebrowColor = "text-brand-orange",
  heading,
  description,
  centered = true,
}: SectionHeaderProps) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`js-reveal mb-16 ${centered ? "text-center" : ""}`}
    >
      {eyebrow && (
        <m.p
          custom={0}
          variants={fadeUp}
          className={`js-reveal text-sm font-semibold uppercase tracking-wider ${eyebrowColor}`}
        >
          {eyebrow}
        </m.p>
      )}
      <m.h2
        custom={eyebrow ? 1 : 0}
        variants={fadeUp}
        className="js-reveal mt-3 text-[clamp(1.75rem,1.2rem+2.4vw,2.5rem)] font-bold tracking-[-0.04em] text-balance"
      >
        {heading}
      </m.h2>
      {description && (
        <m.p
          custom={eyebrow ? 2 : 1}
          variants={fadeUp}
          className="js-reveal mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
        >
          {description}
        </m.p>
      )}
    </m.div>
  );
}

export const SectionHeader = withMotionProvider(SectionHeaderContent);
