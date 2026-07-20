"use client";

import { m, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { EASE_OUT_EXPO as EASE } from "@/lib/animations";

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
          Fang beim KI-Führerschein an. Bücher, Demos und Workshops
          bleiben öffentlich lesbar, dein Fortschritt optional im Konto.
        </m.p>

        {/* Single CTA — staggered after the subtitle */}
        <m.div
          className="mt-10"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
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
