"use client";

import { m } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { TIM_ENTITY } from "@/lib/seo/entity";

// A subtle, grayscale "past stations" band: the logos of former employers,
// shown small and low-contrast so the page gains credibility without shouting.
// Former employers are named as biography only; TIM_ENTITY.noEndorsementNotice
// makes the "no endorsement" framing explicit right below.
//
// The SVGs in /public/ueber-mich/logos are neutral placeholder wordmarks. Drop
// each company's OFFICIAL brand-kit SVG at the same path to swap in the real
// mark — no code change needed.
const STATIONS = [
  { name: "Apple", src: "/ueber-mich/logos/apple.svg" },
  { name: "Red Bull", src: "/ueber-mich/logos/red-bull.svg" },
  { name: "Meta", src: "/ueber-mich/logos/meta.svg" },
] as const;

export function CredibilityLogos() {
  return (
    <section className="border-t border-border/50 py-12" aria-label="Frühere Stationen">
      <div className="mx-auto max-w-4xl px-6">
        <m.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <m.p
            custom={0}
            variants={fadeUp}
            className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Kuratiert von jemandem, der hier gearbeitet hat
          </m.p>
          <m.ul
            custom={1}
            variants={fadeUp}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16"
          >
            {STATIONS.map((s) => (
              <li key={s.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={s.name}
                  width={120}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-auto opacity-55 grayscale transition-opacity duration-200 hover:opacity-90 sm:h-7"
                />
              </li>
            ))}
          </m.ul>
          <m.p
            custom={2}
            variants={fadeUp}
            className="mx-auto mt-7 max-w-xl text-center text-xs leading-relaxed text-muted-foreground"
          >
            {TIM_ENTITY.noEndorsementNotice}
          </m.p>
        </m.div>
      </div>
    </section>
  );
}
