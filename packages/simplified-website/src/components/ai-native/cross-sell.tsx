// No "use client": zero hooks/interactivity here — this component only
// forwards serializable props/children to (client) primitives. Stays a
// Server Component (performance hardening: keeps it out of the client bundle).
import Link from "next/link";
import { FadeBlock } from "@/components/ai-native/primitives";

/* CrossSell — 3-card strip on card background with Kupfer top-border.
 * Points to KI-Führerschein (prerequisite), Glossar, Capstone Gallery. */

interface Card {
  readonly label: string;
  readonly title: string;
  readonly desc: string;
  readonly href: string;
  readonly cta: string;
}

const CARDS: readonly Card[] = [
  {
    label: "Voraussetzung",
    title: "KI-Führerschein",
    desc: "Das Minimum: wie Claude funktioniert, was DSGVO damit macht, welche Fallen es gibt. Vor dem Arbeitskurs lesen.",
    href: "/ki-fuehrerschein",
    cta: "Führerschein machen",
  },
  {
    label: "Begleitmaterial",
    title: "Glossar · 70 Begriffe",
    desc: "Von \u201EPrompt\u201C bis \u201EChain-of-Thought\u201C, auf Deutsch. Alles, was im Kurs vorausgesetzt wird.",
    href: "/ai-native/glossar",
    cta: "Glossar öffnen",
  },
  {
    label: "Praxis · Interaktive Demos",
    title: "Demo-Galerie",
    desc: "RAG-Assistent, PII-Scanner, ROI-Rechner, Invoice-OCR, n8n-Flow und Agents: alles ohne Anmeldung ausprobierbar. Simuliert, mit lokalem Kontext.",
    href: "/ai-native/demos",
    cta: "Demos öffnen",
  },
];

export function AiNativeCrossSell() {
  return (
    <section className="border-t border-border bg-card/40 py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid gap-6 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <FadeBlock key={card.title} delay={i}>
              <Link
                href={card.href}
                className="group flex h-full flex-col border border-t-[3px] border-border border-t-brand-orange bg-background p-7 transition-colors hover:bg-card-hover"
              >
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                  {card.label}
                </span>
                <h3 className="mt-3 text-[22px] font-bold leading-[1.2] tracking-[-0.01em] text-foreground">
                  {card.title}
                </h3>
                <p className="mt-3.5 flex-1 text-[15px] leading-[1.6] text-muted-foreground">
                  {card.desc}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-[14.5px] text-foreground underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-brand-orange group-hover:text-brand-orange">
                  → {card.cta}
                </span>
              </Link>
            </FadeBlock>
          ))}
        </div>
      </div>
    </section>
  );
}
