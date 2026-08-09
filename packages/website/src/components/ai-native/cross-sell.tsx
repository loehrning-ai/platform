// No "use client": zero hooks/interactivity here — this component only
// forwards serializable props/children to (client) primitives. Stays a
// Server Component (performance hardening: keeps it out of the client bundle).
import Link from "next/link";
import { FadeBlock } from "@/components/ai-native/primitives";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

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
    label: "Empfohlene Grundlage",
    title: "KI-Führerschein",
    desc: "Kompakte Einführung in KI-Systeme, Datenschutz, praktische Nutzung und Prüfung von Ergebnissen.",
    href: "/ki-fuehrerschein",
    cta: "KI-Führerschein öffnen",
  },
  {
    label: "Begleitmaterial",
    title: "Glossar · 70 Begriffe",
    desc: "Definitionen für technische, organisatorische und regulatorische Begriffe des Kurses.",
    href: "/ai-native/glossar",
    cta: "Glossar öffnen",
  },
  {
    label: "Lokale Simulationen",
    title: "Kurssimulationen",
    desc: "Neun Browser-Beispiele zu Kurslektionen. Sie verwenden synthetische Daten und senden keine Anbieteranfrage.",
    href: "/ai-native/demos",
    cta: "Simulationen öffnen",
  },
];

const CARDS_EN: readonly Card[] = [
  {
    label: "Recommended foundation",
    title: "AI Fundamentals",
    desc: "A concise introduction to AI systems, data protection, practical use and output checking.",
    href: "/ki-fuehrerschein",
    cta: "Open AI Fundamentals",
  },
  {
    label: "Reference",
    title: "Glossary · 70 terms",
    desc: "Definitions for the technical, organizational and regulatory terms used in the course.",
    href: "/ai-native/glossar",
    cta: "Open the glossary",
  },
  {
    label: "Local simulations",
    title: "Course simulation gallery",
    desc: "Nine browser-based examples connected to course lessons. They use synthetic data and make no live provider request.",
    href: "/ai-native/demos",
    cta: "Open the simulations",
  },
];

export function AiNativeCrossSell({ locale = "de" }: { readonly locale?: Locale }) {
  const cards = locale === "en" ? CARDS_EN : CARDS;
  return (
    <section className="border-t border-border bg-card/40 py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card, i) => (
            <FadeBlock key={card.title} delay={i}>
              <Link
                href={localizeHref(card.href, locale)}
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
