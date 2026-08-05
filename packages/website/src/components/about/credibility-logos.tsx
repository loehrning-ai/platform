"use client";

import { m } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { TIM_ENTITY } from "@/lib/seo/entity";

// A "past stations" band: the real, officially-coloured brand marks of former
// employers. Former employers are named as biography only;
// TIM_ENTITY.noEndorsementNotice makes the "no endorsement" framing explicit
// right below.
//
// Sizes are optical, not literal: Apple's and Meta's marks are flat single
// glyphs that stay crisp at ~30px. Red Bull's is the full corporate lockup
// (two bulls and sun above the wordmark) with far more detail, so at that
// same size it collapses into an illegible blob. It needs a larger box to
// resolve to the same visual weight as the other two.
const STATIONS = [
  { name: "Apple", src: "/ueber-mich/logos/apple.svg", size: "h-7 w-7 sm:h-8 sm:w-8", px: 32 },
  { name: "Red Bull", src: "/ueber-mich/logos/red-bull.svg", size: "h-11 w-11 sm:h-[52px] sm:w-[52px]", px: 52 },
  { name: "Meta", src: "/ueber-mich/logos/meta.svg", size: "h-7 w-7 sm:h-8 sm:w-8", px: 32 },
] as const;

export function CredibilityLogos() {
  return (
    <section className="border-t border-border/50 py-12" aria-label="Frühere Stationen">
      <div className="mx-auto max-w-4xl px-6">
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="js-reveal"
        >
          <m.p
            custom={0}
            variants={fadeUp}
            className="js-reveal text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Kuratiert von jemandem, der hier gearbeitet hat
          </m.p>
          <m.ul
            custom={1}
            variants={fadeUp}
            className="js-reveal mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16"
          >
            {STATIONS.map((s) => (
              <li key={s.name} className="flex h-8 items-center sm:h-[52px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={s.name}
                  width={s.px}
                  height={s.px}
                  loading="lazy"
                  decoding="async"
                  className={`${s.size} opacity-90 transition-[opacity,transform] duration-200 hover:scale-110 hover:opacity-100`}
                />
              </li>
            ))}
          </m.ul>
          <m.p
            custom={2}
            variants={fadeUp}
            className="js-reveal mx-auto mt-7 max-w-xl text-center text-xs leading-relaxed text-muted-foreground"
          >
            {TIM_ENTITY.noEndorsementNotice}
          </m.p>
        </m.div>
      </div>
    </section>
  );
}
