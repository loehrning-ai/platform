// No "use client": zero hooks/interactivity here — this component only
// forwards serializable props/children to (client) primitives. Stays a
// Server Component (performance hardening: keeps it out of the client bundle).
import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import {
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";

/* FinalCta — dark dot-grid centered closer.
 * "Der einfachste Weg AI-native zu werden: anfangen." */

export function AiNativeFinalCta() {
  return (
    <section
      id="final"
      className="dark-section bg-[var(--color-dark-bg)] bg-dot-pattern-dark"
      style={{ padding: "120px 0" }}
    >
      <div className="mx-auto max-w-[860px] px-6 text-center">
        <FadeBlock delay={0}>
          <Eyebrow className="text-brand-sand">Noch Fragen, oder los?</Eyebrow>
        </FadeBlock>
        <ClipHeading
          as="h2"
          className="mt-4 font-bold leading-none tracking-[-0.035em] text-[var(--color-dark-fg)]"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          Der einfachste Weg AI-native zu werden:
          <br />
          <span className="text-brand-orange">anfangen.</span>
        </ClipHeading>
        <FadeBlock delay={2}>
          <p className="mt-6 text-[18px] leading-[1.55] text-[var(--color-dark-muted)]">
            Komplett kostenlos: alle vier Module, 27 Lektionen und Fortschritt
            ohne Anmeldung. Keine Kreditkarte, keine Bezahlstufe.
          </p>
        </FadeBlock>
        <FadeBlock delay={4}>
          <div className="mt-10 flex flex-wrap justify-center gap-3.5">
            <BrandButton
              href="/ai-native/kurs/modul_1"
              variant="primary"
              surface="dark"
            >
              Kurs starten <ArrowRight size={14} />
            </BrandButton>
            <BrandButton
              href="/ai-native/fluency-test"
              variant="outline"
              surface="dark"
            >
              Zuerst Fluency-Test · 5 min
            </BrandButton>
          </div>
        </FadeBlock>
        <FadeBlock delay={6}>
          <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-dark-muted)]">
            Dies ist kein Rechtsrat. Keine Erfolgsgarantie. Bildungsangebot
            nach UWG.
          </p>
        </FadeBlock>
      </div>
    </section>
  );
}
