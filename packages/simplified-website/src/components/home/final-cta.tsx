"use client";

import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Play,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { EASE_OUT_EXPO as EASE } from "@/lib/animations";

// The public resources named in the subtitle, as warm icon chips that also
// link straight through. Colour rotates so the row is not one flat tone.
const RESOURCE_CHIPS: ReadonlyArray<{
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly tint: string;
}> = [
  { label: "Bücher", href: "/buecher", icon: BookOpen, tint: "text-brand-amber" },
  { label: "Vorlagen", href: "/vorlagen", icon: FileText, tint: "text-brand-orange" },
  { label: "Demos", href: "/demos", icon: Play, tint: "text-brand-sand" },
  {
    label: "Workshops",
    href: "/workshops",
    icon: Presentation,
    tint: "text-brand-amber",
  },
];

export function FinalCta() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section spacing="default" className="scroll-mt-24" data-testid="final-cta">
      <Container size="3xl" className="text-center">
        {/* Section rule — draws itself */}
        <m.div
          className="mb-12 h-px w-full bg-border"
          initial={prefersReducedMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ transformOrigin: "left" }}
        />

        {/* Heading — most dramatic entrance on the page */}
        <div className="overflow-visible pb-2">
          <m.h2
            className="font-bold leading-[1.02] tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            Lernpfad starten.
          </m.h2>
        </div>

        {/* Subtitle — staggered after heading */}
        <m.p
          className="mx-auto mt-8 max-w-md text-lg text-muted-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
        >
          Fang beim KI-Führerschein an. Bücher, Vorlagen, Demos und Workshops
          bleiben öffentlich lesbar, dein Fortschritt optional im Konto.
        </m.p>

        {/* Public-resource chips — icons + colour, and a shortcut into each area */}
        <m.div
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
        >
          {RESOURCE_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 shadow-card transition-[background-color,box-shadow] hover:bg-card-hover hover:shadow-card-hover"
            >
              <chip.icon
                size={15}
                strokeWidth={1.75}
                className={chip.tint}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground group-hover:text-foreground">
                {chip.label}
              </span>
            </Link>
          ))}
        </m.div>

        {/* Single CTA — staggered after chips */}
        <m.div
          className="mt-8"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.6, duration: 0.5, ease: EASE }}
        >
          <BrandButton href="/kurse" variant="primary" surface="light">
            Kurse öffnen <ArrowRight size={15} />
          </BrandButton>
        </m.div>

        {/* Single orange rule — signature close */}
        <m.div
          className="mx-auto mt-20 h-px w-full bg-brand-orange"
          initial={prefersReducedMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ transformOrigin: "left" }}
        />

        {/* Code-comment signature — maker's mark */}
        <m.p
          className="mt-4 text-right font-mono text-[10px] text-muted-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          // loehrning.ai
        </m.p>
      </Container>
    </Section>
  );
}
