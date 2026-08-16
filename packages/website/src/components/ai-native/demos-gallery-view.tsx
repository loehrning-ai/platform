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
import { localizeHref, type Locale } from "@/lib/i18n/locale";

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

const CATEGORIES_EN: readonly { readonly id: Category; readonly label: string }[] = [
  { id: "chat-knowledge", label: "Chat and knowledge" },
  { id: "document-processing", label: "Documents" },
  { id: "agents-workflows", label: "Agents and workflows" },
  { id: "business-roi", label: "Business cases" },
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

const DEMOS_EN: readonly DemoEntry[] = [
  {
    kind: "demo-chat-rag",
    title: "Contract retrieval assistant",
    tagline: "Ask a synthetic contract archive and inspect source-linked answers.",
    category: "chat-knowledge",
    teachesIn: "Module 2 · Lesson 2.4 (grounding and retrieval)",
  },
  {
    kind: "demo-compliance",
    title: "Prompt data scanner",
    tagline: "A rule-based check for obvious sensitive-data patterns. Not a compliance decision.",
    category: "compliance-governance",
    teachesIn: "Module 4 · Lesson 4.3 (data-aware prompting)",
  },
  {
    kind: "demo-roi",
    title: "ROI scenario calculator",
    tagline: "Change explicit assumptions and inspect the resulting scenario. Not a forecast.",
    category: "business-roi",
    teachesIn: "Course reference · business-case method",
  },
  {
    kind: "demo-doc",
    title: "Invoice extraction",
    tagline: "Map a synthetic invoice to structured fields and a review queue.",
    category: "document-processing",
    teachesIn: "Module 2 · Lesson 2.3 (Artifacts and documents)",
  },
  {
    kind: "demo-agent",
    title: "Agent pipeline",
    tagline: "Inspect a simulated multi-step research and review process.",
    category: "agents-workflows",
    teachesIn: "Module 2 · Lesson 2.5 (Claude Code and sub-agents)",
  },
  {
    kind: "demo-workflow",
    title: "n8n supply-chain workflow",
    tagline: "Configure a simulated workflow and inspect its review gates.",
    category: "agents-workflows",
    teachesIn: "Module 4 · Lesson 4.4 (n8n automation)",
  },
  {
    kind: "demo-excel",
    title: "Spreadsheet transformation",
    tagline: "Apply a documented transformation to synthetic worksheet data.",
    category: "document-processing",
    teachesIn: "Module 3 · Lesson 3.3 (office integration)",
  },
  {
    kind: "demo-word",
    title: "Document drafting",
    tagline: "Turn a structured brief into a reviewable synthetic document draft.",
    category: "document-processing",
    teachesIn: "Module 3 · Lesson 3.4 (document generation)",
  },
  {
    kind: "demo-finetune",
    title: "Fine-tuning decision exercise",
    tagline: "Compare fine-tuning with prompting and retrieval under stated assumptions.",
    category: "business-roi",
    teachesIn: "Post-course reference",
  },
];

/** Sanity: the gallery lists one card per active (non-retired) DemoKind. */
const _assertAllDemoKindsCovered: ReadonlyArray<WidgetKind> =
  DEMOS.map((d) => d.kind);
void _assertAllDemoKindsCovered;
void DEMO_KINDS;

function LazyDemoMount({
  kind,
  locale,
}: {
  readonly kind: WidgetKind;
  readonly locale: Locale;
}): JSX.Element {
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
    <div ref={ref} className="min-h-[140px] min-w-0">
      {mounted ? (
        <RenderWidget kind={kind} locale={locale} />
      ) : (
        <DemoPlaceholderFrame />
      )}
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

export function DemosGalleryView({ locale = "de" }: { readonly locale?: Locale }): JSX.Element {
  const isEnglish = locale === "en";
  const categories = isEnglish ? CATEGORIES_EN : CATEGORIES;
  const demos = isEnglish ? DEMOS_EN : DEMOS;
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  const groupsRaw = categories.map((cat) => ({
    ...cat,
    items: demos.filter((d) => d.category === cat.id && matches(d)),
  })).filter((g) => g.items.length > 0);
  const groups = groupsRaw;
  const totalFiltered = demos.filter(matches).length;

  return (
    <>
      {/* Hero */}
      <section className="dark-section relative bg-[var(--color-dark-bg)] bg-dot-pattern-dark py-20 md:py-28">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <nav
            aria-label="Breadcrumb"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-dark-muted)]"
          >
            <Link href={localizeHref("/ai-native", locale)} className="hover:text-brand-orange">
              {isEnglish ? "AI-Native Workflow Course" : "AI-Native Arbeitskurs"}
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-brand-orange">{isEnglish ? "Simulations" : "Simulationen"}</span>
          </nav>

          <FadeBlock delay={0}>
            <div className="mt-8 space-y-2">
              <div className="border border-[rgba(107,114,128,0.4)] bg-[rgba(107,114,128,0.08)] px-3.5 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-[rgba(243,240,233,0.65)]">
                {isEnglish
                  ? "These simulations are connected to AI-Native course lessons."
                  : "Diese Simulationen gehören zu Lektionen des AI-Native-Kurses."}{" "}
                <Link href={localizeHref("/demos", locale)} className="text-brand-orange underline hover:no-underline">
                  {isEnglish ? "Open the complete simulation catalog" : "Vollständigen Beispielkatalog öffnen"}
                </Link>
              </div>
              <span className="inline-flex items-center gap-2 border border-brand-orange/35 bg-brand-orange/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
                9 {isEnglish ? "course simulations · synthetic data · in-browser" : "Kurssimulationen · synthetische Daten · im Browser"}
              </span>
            </div>
          </FadeBlock>

          <ClipHeading
            as="h1"
            className="mt-6 font-bold leading-[0.92] tracking-[-0.04em] text-[var(--color-dark-fg)]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            {isEnglish ? "Inspect the process." : "Ablauf prüfen."}
            <br />
            <span className="text-brand-orange">{isEnglish ? "Change the assumptions." : "Annahmen verändern."}</span>
          </ClipHeading>

          <FadeBlock delay={2}>
            <p className="mt-7 max-w-[620px] text-[18px] leading-[1.6] text-[var(--color-dark-muted)]">
              {isEnglish
                ? "Each panel is a browser simulation with synthetic data. It illustrates a process and its controls; it does not call a provider or measure real operational performance."
                : "Jedes Panel ist eine Browser-Simulation mit synthetischen Daten. Es zeigt einen Ablauf und seine Kontrollen; es ruft keinen Anbieter auf und misst keine reale Betriebsleistung."}
            </p>
          </FadeBlock>

          <FadeBlock delay={3} className="mt-8 flex flex-wrap gap-3">
            <BrandButton
              href={localizeHref("/ai-native/kurs/modul_1", locale)}
              prefetch={false}
              variant="primary"
              surface="dark"
            >
              {isEnglish ? "Start the course" : "Kurs starten"} <ArrowRight size={15} />
            </BrandButton>
            <BrandButton
              href={localizeHref("/ai-native", locale)}
              variant="outline"
              surface="dark"
            >
              {isEnglish ? "Back to the course" : "Zurück zum Arbeitskurs"}
            </BrandButton>
          </FadeBlock>

          {/* Search */}
          <FadeBlock delay={3}>
            <div className="mt-10 flex max-w-[480px] items-center gap-2 border-b border-[var(--color-dark-border)]">
              <span className="pr-1 font-mono text-[12px] font-bold tracking-[0.12em] text-brand-orange">
                ⌕
              </span>
              {/* min-w-0 is load-bearing: an input carries an intrinsic default
                  width, and a flex item cannot shrink below its automatic
                  minimum, so flex-1 alone holds this row wider than a 320px
                  viewport and pushes the result counter off-screen. */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                readOnly={!hydrated}
                aria-disabled={!hydrated}
                placeholder={isEnglish ? "Search: RAG, GDPR, spreadsheet, workflow …" : "Suche: RAG, DSGVO, Excel, Workflow …"}
                className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-[var(--color-dark-fg)] outline-none placeholder:text-[var(--color-dark-muted)] focus-visible:ring-2 focus-visible:ring-brand-orange"
                aria-label={isEnglish ? "Search course simulations" : "Kurssimulationen durchsuchen"}
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
                {totalFiltered}/{demos.length}
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

          <div className="mt-10 grid min-w-0 gap-8 md:grid-cols-1 lg:gap-12">
            {group.items.map((demo, i) => (
              <FadeBlock key={demo.kind} delay={i} className="min-w-0">
                <article className="min-w-0 border border-border bg-card/30 p-6 lg:p-8">
                  <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                          {isEnglish ? "Simulation" : "Simulation"} {String(demos.indexOf(demo) + 1).padStart(2, "0")}
                        </p>
                        <span className="inline-flex items-center gap-1.5 border border-[rgba(107,114,128,0.4)] bg-[rgba(107,114,128,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[rgba(243,240,233,0.55)]">
                          ◆ {isEnglish ? "simulated" : "simuliert"}
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
                  <LazyDemoMount kind={demo.kind} locale={locale} />
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
            {isEnglish ? "From simulation" : "Von der Simulation"}
            <br />
            <span className="text-brand-orange">{isEnglish ? "to a bounded workflow." : "zum begrenzten Workflow."}</span>
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-6 text-[17px] leading-[1.6] text-[var(--color-dark-muted)]">
              {isEnglish
                ? "The course explains the assumptions, review criteria and failure modes behind these examples before you adapt a workflow to your own context."
                : "Der Kurs erklärt Annahmen, Prüfkriterien und Fehlermöglichkeiten hinter den Beispielen, bevor du einen Ablauf an deinen Kontext anpasst."}
            </p>
          </FadeBlock>
          <FadeBlock delay={2}>
            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <BrandButton
                href={localizeHref("/ai-native/kurs/modul_1", locale)}
                prefetch={false}
                variant="primary"
                surface="dark"
              >
                {isEnglish ? "Start the course" : "Kurs starten"} <ArrowRight size={15} />
              </BrandButton>
              <BrandButton
                href={localizeHref("/ai-native#os-bundle", locale)}
                variant="outline"
                surface="dark"
              >
                {isEnglish ? "View course materials" : "Lernmaterialien ansehen"}
              </BrandButton>
            </div>
          </FadeBlock>
        </div>
      </section>
    </>
  );
}
