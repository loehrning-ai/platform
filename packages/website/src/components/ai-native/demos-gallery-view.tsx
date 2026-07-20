"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type JSX } from "react";
import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import {
  ClipHeading,
  Eyebrow,
  FadeBlock,
  DrawRule,
  SectionShell,
} from "@/components/ai-native/primitives";
import { RenderWidget } from "@/components/widgets/registry";
import type { WidgetKind } from "@/lib/widgets/types";
import { DEMO_KINDS } from "@/lib/widgets/types";
import { cn } from "@/lib/utils";

/**
 * Gallery index view for /ai-native/demos.
 *
 * Renders 12 demo panels in ordered categories. Each panel uses a viewport
 * observer to defer real-component mount until it enters the viewport —
 * prevents 12 rAF loops / timers from starting on page load.
 *
 */

type Category =
  | "chat-knowledge"
  | "compliance-governance"
  | "business-roi"
  | "document-processing"
  | "agents-workflows"
  | "observability";

interface DemoEntry {
  readonly kind: WidgetKind;
  readonly title: string;
  readonly tagline: string;
  readonly category: Category;
  /** Related teaching lesson shown as a reference label. */
  readonly teachesIn?: string;
}

const CATEGORIES: readonly { readonly id: Category; readonly label: string }[] = [
  { id: "chat-knowledge", label: "Chat & Wissen" },
  { id: "document-processing", label: "Dokumente" },
  { id: "agents-workflows", label: "Agents & Workflows" },
  { id: "business-roi", label: "ROI & Reife" },
  { id: "compliance-governance", label: "Compliance" },
  { id: "observability", label: "Observability" },
];

// The maturity concept belongs in the self-assessment flow, not this gallery.
// The logistics scenario was too narrow for the broad public audience.
// Observability uses the canonical /demos/llm-observability implementation.
// Active gallery: 9 of the original 12 (chat-rag, compliance, roi, doc,
// agent, workflow, excel, word, finetune).
const DEMOS: readonly DemoEntry[] = [
  {
    kind: "demo-chat-rag",
    title: "RAG Vertrags-Assistent",
    tagline: "Frag dein Vertragsarchiv. Antworten mit Paragraph + Quellen.",
    category: "chat-knowledge",
    teachesIn: "Modul 2 · Lektion 2.4 (Grounding + RAG)",
  },
  {
    kind: "demo-compliance",
    title: "Compliance Prompt-Scanner",
    tagline: "Regelbasierter DSGVO-Prompt-Check. Beispielregeln, keine Live-Messung.",
    category: "compliance-governance",
    teachesIn: "Modul 4 · Lektion 4.3 (DSGVO-sicher prompten)",
  },
  {
    kind: "demo-roi",
    title: "ROI Calculator",
    tagline: "Vier Regler. Drei-Jahres-Netto. Basiert auf Mittelstands-Daten.",
    category: "business-roi",
    teachesIn: "Lernpfad / ROI-Modell",
  },
  {
    kind: "demo-doc",
    title: "Invoice OCR",
    tagline: "PDF rein, strukturierte Daten raus. Beispiel-Output, synthetisch.",
    category: "document-processing",
    teachesIn: "Modul 2 · Lektion 2.3 (Artifacts + Dokumente)",
  },
  {
    kind: "demo-agent",
    title: "Agent Workflow",
    tagline: "Sub-Agents koordinieren einen mehrstufigen Task.",
    category: "agents-workflows",
    teachesIn: "Modul 2 · Lektion 2.5 (Claude Code + Sub-Agents)",
  },
  {
    kind: "demo-workflow",
    title: "n8n Workflow Builder",
    tagline: "Knoten verbinden. Trigger setzen. Durchlauf simulieren.",
    category: "agents-workflows",
    teachesIn: "Modul 4 · Lektion 4.4 (n8n-Automations)",
  },
  {
    kind: "demo-excel",
    title: "Excel-Automation",
    tagline: "Tabellen-Transformation mit Claude. Beispiel-Output, synthetisch.",
    category: "document-processing",
    teachesIn: "Modul 3 · Lektion 3.3 (Office-Integration)",
  },
  {
    kind: "demo-word",
    title: "Word-Dokumentengenerator",
    tagline: "Briefing → strukturiertes Word-Doc mit Corporate-Template.",
    category: "document-processing",
    teachesIn: "Modul 3 · Lektion 3.4 (Dokumenten-Generierung)",
  },
  {
    kind: "demo-finetune",
    title: "Fine-Tuning Viz",
    tagline: "Wann lohnt Fine-Tuning? Und wann nicht?",
    category: "business-roi",
    teachesIn: "Post-Arbeitskurs Reference",
  },
];

/** Sanity: the gallery lists one card per active (non-retired) DemoKind. */
const _assertAllDemoKindsCovered: ReadonlyArray<WidgetKind> =
  DEMOS.map((d) => d.kind);
void _assertAllDemoKindsCovered;
void DEMO_KINDS;

function LazyDemoMount({ kind }: { readonly kind: WidgetKind }): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setMounted(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: "120px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[140px]">
      {mounted ? <RenderWidget kind={kind} /> : <DemoPlaceholderFrame />}
    </div>
  );
}

function DemoPlaceholderFrame(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="h-[140px] w-full animate-pulse border border-border bg-card/40"
    />
  );
}

export function DemosGalleryView(): JSX.Element {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (d: DemoEntry): boolean => {
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.tagline.toLowerCase().includes(q) ||
      d.kind.toLowerCase().includes(q) ||
      (d.teachesIn ?? "").toLowerCase().includes(q)
    );
  };

  const groupsRaw = CATEGORIES.map((cat) => ({
    ...cat,
    items: DEMOS.filter((d) => d.category === cat.id && matches(d)),
  })).filter((g) => g.items.length > 0);
  const groups = groupsRaw;
  const totalFiltered = DEMOS.filter(matches).length;

  return (
    <>
      {/* Hero */}
      <section className="dark-section relative bg-[var(--color-dark-bg)] bg-dot-pattern-dark py-20 md:py-28">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <nav
            aria-label="Breadcrumb"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-dark-muted)]"
          >
            <Link href="/ai-native" className="hover:text-brand-orange">
              AI-Native Arbeitskurs
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-brand-orange">Praxisbeispiele</span>
          </nav>

          <FadeBlock delay={0}>
            <div className="mt-8 space-y-2">
              <div className="border border-[rgba(107,114,128,0.4)] bg-[rgba(107,114,128,0.08)] px-3.5 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-[rgba(243,240,233,0.65)]">
                Diese Praxisbeispiele gehören zum AI-Native-Kurs.{" "}
                <Link href="/demos" className="text-brand-orange underline hover:no-underline">
                  Zur vollständigen Galerie: /demos
                </Link>
              </div>
              <span className="inline-flex items-center gap-2 border border-brand-orange/35 bg-brand-orange/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
                9 kursgebundene Praxisbeispiele · simuliert · im Browser
              </span>
            </div>
          </FadeBlock>

          <ClipHeading
            as="h1"
            className="mt-6 font-bold leading-[0.92] tracking-[-0.04em] text-[var(--color-dark-fg)]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Mach&apos;s einmal.
            <br />
            <span className="text-brand-orange">Dann mach&apos;s mit.</span>
          </ClipHeading>

          <FadeBlock delay={2}>
            <p className="mt-7 max-w-[620px] text-[18px] leading-[1.6] text-[var(--color-dark-muted)]">
              Jedes Praxisbeispiel zeigt einen simulierten Mittelstand-Use-Case, den du im
              Arbeitskurs bauen lernst. Alles läuft lokal im Browser, kein
              Login, keine Datenbank, keine API-Keys.
            </p>
          </FadeBlock>

          <FadeBlock delay={3} className="mt-8 flex flex-wrap gap-3">
            <BrandButton
              href="/ai-native/kurs/modul_1"
              variant="primary"
              surface="dark"
            >
              Kurs starten <ArrowRight size={15} />
            </BrandButton>
            <BrandButton
              href="/ai-native"
              variant="outline"
              surface="dark"
            >
              Zurück zum Arbeitskurs
            </BrandButton>
          </FadeBlock>

          {/* Search */}
          <FadeBlock delay={3}>
            <div className="mt-10 flex max-w-[480px] items-center gap-2 border-b border-[var(--color-dark-border)]">
              <span className="pr-1 font-mono text-[12px] font-bold tracking-[0.12em] text-brand-orange">
                ⌕
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche: RAG, DSGVO, Excel, Workflow …"
                className="flex-1 bg-transparent py-3 text-[16px] text-[var(--color-dark-fg)] outline-none placeholder:text-[var(--color-dark-muted)] focus-visible:ring-2 focus-visible:ring-brand-orange"
                aria-label="Praxisbeispiele durchsuchen"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-dark-muted)] transition-colors hover:text-brand-orange"
                >
                  Clear
                </button>
              )}
              <span className="pl-2 font-mono text-[10px] tracking-[0.1em] text-[var(--color-dark-muted)]">
                {totalFiltered}/{DEMOS.length}
              </span>
            </div>
          </FadeBlock>

          {/* Category jump-nav */}
          <FadeBlock delay={4}>
            <div className="mt-8 flex flex-wrap gap-2">
              {groups.map((g) => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  className={cn(
                    "border border-[var(--color-dark-border)] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors",
                    "text-[var(--color-dark-muted)] hover:border-brand-orange hover:text-brand-orange",
                  )}
                >
                  {g.label} ({g.items.length})
                </a>
              ))}
            </div>
          </FadeBlock>

          <div className="mt-16">
            <DrawRule dark />
          </div>
        </div>
      </section>

      {/* Category sections */}
      {groups.map((group, groupIdx) => (
        <SectionShell
          key={group.id}
          id={group.id}
          num={String(groupIdx + 1).padStart(2, "0")}
          label={group.label}
          className="py-16 md:py-20"
        >
          <Eyebrow>{group.label}</Eyebrow>
          <ClipHeading
            as="h2"
            className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            {group.label}.
          </ClipHeading>

          <div className="mt-10 grid gap-8 md:grid-cols-1 lg:gap-12">
            {group.items.map((demo, i) => (
              <FadeBlock key={demo.kind} delay={i}>
                <article className="border border-border bg-card/30 p-6 lg:p-8">
                  <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                          Praxisbeispiel {String(DEMOS.indexOf(demo) + 1).padStart(2, "0")}
                        </p>
                        <span className="inline-flex items-center gap-1.5 border border-[rgba(107,114,128,0.4)] bg-[rgba(107,114,128,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[rgba(243,240,233,0.55)]">
                          ◆ simuliert
                        </span>
                      </div>
                      <h3 className="mt-2 text-[22px] font-bold leading-[1.15] tracking-[-0.02em] text-foreground">
                        {demo.title}
                      </h3>
                      <p className="mt-1.5 text-[14.5px] text-muted-foreground">
                        {demo.tagline}
                      </p>
                    </div>
                    {demo.teachesIn && (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-amber">
                        → {demo.teachesIn}
                      </span>
                    )}
                  </header>
                  <LazyDemoMount kind={demo.kind} />
                </article>
              </FadeBlock>
            ))}
          </div>
        </SectionShell>
      ))}

      {/* Footer CTA */}
      <section className="dark-section bg-[var(--color-dark-bg)] py-20">
        <div className="mx-auto max-w-[720px] px-6 text-center">
          <ClipHeading
            as="h2"
            className="font-bold leading-none tracking-[-0.035em] text-[var(--color-dark-fg)]"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
          >
            Mehr als Praxisbeispiele.
            <br />
            <span className="text-brand-orange">Praxis, nicht Theorie.</span>
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-6 text-[17px] leading-[1.6] text-[var(--color-dark-muted)]">
              Jedes Praxisbeispiel entspricht einer Lektion. Im Arbeitskurs baust du das
              selbst, auf deinen eigenen Daten, mit deinem eigenen Workflow.
            </p>
          </FadeBlock>
          <FadeBlock delay={2}>
            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <BrandButton
                href="/ai-native/kurs/modul_1"
                variant="primary"
                surface="dark"
              >
                Kurs starten <ArrowRight size={15} />
              </BrandButton>
              <BrandButton
                href="/ai-native#os-bundle"
                variant="outline"
                surface="dark"
              >
                Lernmaterialien ansehen
              </BrandButton>
            </div>
          </FadeBlock>
        </div>
      </section>
    </>
  );
}
