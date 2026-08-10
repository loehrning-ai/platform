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
import { localizeHref, type Locale } from "@/lib/i18n/locale";

/* Final course-access section. */

export function AiNativeFinalCta({ locale = "de" }: { readonly locale?: Locale }) {
  const isEnglish = locale === "en";
  return (
    <section
      id="final"
      className="bg-background"
      style={{ padding: "120px 0" }}
    >
      <div className="mx-auto max-w-[860px] px-6 text-center">
        <FadeBlock delay={0}>
          <Eyebrow>{isEnglish ? "Course access" : "Kurszugang"}</Eyebrow>
        </FadeBlock>
        <ClipHeading
          as="h2"
          className="mt-4 font-bold leading-none tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          {isEnglish ? "Start with one bounded task." : "Mit einer begrenzten Aufgabe beginnen."}
          <br />
          <span className="text-brand-orange">
            {isEnglish ? "Document how you review it." : "Prüfung dokumentieren."}
          </span>
        </ClipHeading>
        <FadeBlock delay={2}>
          <p className="mt-6 text-[18px] leading-[1.55] text-muted-foreground">
            {isEnglish
              ? "All four modules and 27 lessons are free. A learning account stores progress; no payment details are requested."
              : "Alle vier Module und 27 Lektionen sind kostenlos. Ein Lernkonto speichert den Fortschritt; Zahlungsdaten werden nicht abgefragt."}
          </p>
        </FadeBlock>
        <FadeBlock delay={4}>
          <div className="mt-10 flex flex-wrap justify-center gap-3.5">
            <BrandButton
              href={localizeHref("/ai-native/kurs/modul_1", locale)}
              prefetch={false}
              variant="primary"
            >
              {isEnglish ? "Start with a free learning account" : "Kostenlos mit Lernkonto starten"} <ArrowRight size={14} />
            </BrandButton>
            <BrandButton
              href={localizeHref("/ai-native/fluency-test", locale)}
              variant="outline"
            >
              {isEnglish ? "Take the fluency self-assessment first" : "Zuerst Fluency-Selbsttest"}
            </BrandButton>
          </div>
        </FadeBlock>
        <FadeBlock delay={6}>
          <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {isEnglish
              ? "Educational material. Not legal advice, an external assessment or a performance guarantee."
              : "Bildungsangebot. Keine Rechtsberatung, externe Prüfung oder Erfolgsgarantie."}
          </p>
        </FadeBlock>
      </div>
    </section>
  );
}
