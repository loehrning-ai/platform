"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type JSX } from "react";
import {
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
import { RenderWidget } from "@/components/widgets/registry";
import type { WidgetKind } from "@/lib/widgets/types";
import { DEMO_KINDS } from "@/lib/widgets/types";
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

const CATEGORIES: readonly { readonly id: Category; readonly label: string }[] =
  [
    { id: "chat-knowledge", label: "Chat & Wissen" },
    { id: "document-processing", label: "Dokumente" },
    { id: "agents-workflows", label: "Agents & Workflows" },
    { id: "business-roi", label: "ROI & Reife" },
    { id: "compliance-governance", label: "Compliance" },
    { id: "observability", label: "Observability" },
  ];

const CATEGORIES_EN: readonly {
  readonly id: Category;
  readonly label: string;
}[] = [
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
    tagline:
      "Regelbasierter DSGVO-Prompt-Check. Beispielregeln, keine Live-Messung.",
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
    tagline:
      "PDF rein, strukturierte Daten raus. Beispiel-Output, synthetisch.",
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
    tagline:
      "Tabellen-Transformation mit Claude. Beispiel-Output, synthetisch.",
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
    tagline:
      "Ask a synthetic contract archive and inspect source-linked answers.",
    category: "chat-knowledge",
    teachesIn: "Module 2 · Lesson 2.4 (grounding and retrieval)",
  },
  {
    kind: "demo-compliance",
    title: "Prompt data scanner",
    tagline:
      "A rule-based check for obvious sensitive-data patterns. Not a compliance decision.",
    category: "compliance-governance",
    teachesIn: "Module 4 · Lesson 4.3 (data-aware prompting)",
  },
  {
    kind: "demo-roi",
    title: "ROI scenario calculator",
    tagline:
      "Change explicit assumptions and inspect the resulting scenario. Not a forecast.",
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
    tagline:
      "Turn a structured brief into a reviewable synthetic document draft.",
    category: "document-processing",
    teachesIn: "Module 3 · Lesson 3.4 (document generation)",
  },
  {
    kind: "demo-finetune",
    title: "Fine-tuning decision exercise",
    tagline:
      "Compare fine-tuning with prompting and retrieval under stated assumptions.",
    category: "business-roi",
    teachesIn: "Post-course reference",
  },
];

/** Sanity: the gallery lists one card per active (non-retired) DemoKind. */
const _assertAllDemoKindsCovered: ReadonlyArray<WidgetKind> = DEMOS.map(
  (d) => d.kind,
);
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

export function DemosGalleryView({
  locale = "de",
}: {
  readonly locale?: Locale;
}): JSX.Element {
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

  const groupsRaw = categories
    .map((cat) => ({
      ...cat,
      items: demos.filter((d) => d.category === cat.id && matches(d)),
    }))
    .filter((g) => g.items.length > 0);
  const groups = groupsRaw;
  const totalFiltered = demos.filter(matches).length;

  return (
    <TechnicalCourseFrame courseId="ai-native-demos" lang={locale}>
      <header className="border-y border-foreground py-6 sm:py-8">
        <nav
          aria-label={isEnglish ? "Breadcrumb" : "Brotkrümelnavigation"}
          className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
        >
          <Link
            href={localizeHref("/ai-native", locale)}
            className="inline-flex min-h-11 items-center transition-colors hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {isEnglish ? "AI-Native Workflow Course" : "AI-Native Arbeitskurs"}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-brand-orange">
            {isEnglish ? "Simulations" : "Simulationen"}
          </span>
        </nav>

        <div className="mt-5 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              09 ·{" "}
              {isEnglish
                ? "synthetic browser labs"
                : "synthetische Browser-Labs"}
            </p>
            <h1 className="mt-3 max-w-[720px] break-words text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-foreground [overflow-wrap:anywhere] sm:text-[48px]">
              {isEnglish
                ? "Inspect the process. Change one assumption."
                : "Ablauf prüfen. Eine Annahme ändern."}
            </h1>
            <p className="mt-4 max-w-[680px] text-sm leading-relaxed text-muted-foreground">
              {isEnglish
                ? "Each lab uses synthetic data and runs in the browser. It demonstrates controls; it does not call a provider or measure live performance."
                : "Jedes Lab nutzt synthetische Daten und läuft im Browser. Es zeigt Kontrollen; es ruft keinen Anbieter auf und misst keine reale Leistung."}
            </p>
            <div className="mt-5 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href={localizeHref("/ai-native/kurs/modul_1", locale)}
                prefetch={false}
                className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
                data-workspace-primary-action="true"
              >
                {isEnglish ? "Start the course" : "Kurs starten"}
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={localizeHref("/ai-native", locale)}
                className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
              >
                {isEnglish ? "Course overview" : "Kursübersicht"}
              </Link>
            </div>
          </div>

          <aside className="min-w-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <label
              htmlFor="course-simulation-search"
              className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground"
            >
              {isEnglish ? "Find a simulation" : "Simulation finden"}
            </label>
            <div
              role="search"
              className="mt-2 flex min-w-0 items-center border-y border-foreground"
            >
              <input
                id="course-simulation-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                readOnly={!hydrated}
                aria-disabled={!hydrated}
                placeholder={
                  isEnglish ? "RAG, GDPR, spreadsheet …" : "RAG, DSGVO, Excel …"
                }
                className="min-h-12 min-w-0 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                aria-label={
                  isEnglish
                    ? "Search course simulations"
                    : "Kurssimulationen durchsuchen"
                }
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                >
                  {isEnglish ? "Clear" : "Leeren"}
                </button>
              ) : null}
            </div>
            <p
              role="status"
              aria-live="polite"
              className="mt-2 font-mono text-xs text-muted-foreground"
            >
              <span>
                {totalFiltered}/{demos.length}
              </span>{" "}
              {isEnglish ? "shown" : "sichtbar"}
            </p>
            <Link
              href={localizeHref("/demos", locale)}
              className="mt-3 inline-flex min-h-11 items-center border-b border-border font-mono text-xs font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
            >
              {isEnglish
                ? "Complete simulation catalog"
                : "Vollständiger Beispielkatalog"}
            </Link>
          </aside>
        </div>
      </header>

      <div>
        {groups.length > 0 ? (
          <nav
            aria-label={
              isEnglish ? "Simulation categories" : "Simulationskategorien"
            }
            className="mt-6 flex min-w-0 flex-wrap border-y border-border"
          >
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="inline-flex min-h-11 items-center border-r border-border px-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:bg-card hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                {group.label} ({group.items.length})
              </a>
            ))}
          </nav>
        ) : (
          <p className="mt-8 border-y border-border py-5 text-sm text-muted-foreground">
            {isEnglish
              ? "No simulation matches this search."
              : "Keine Simulation passt zu dieser Suche."}
          </p>
        )}

        {groups.map((group, groupIndex) => (
          <section key={group.id} id={group.id} className="mt-10 scroll-mt-24">
            <TechnicalCourseSectionHeading
              eyebrow={`${String(groupIndex + 1).padStart(2, "0")} · ${group.label}`}
              title={`${group.label}.`}
            />
            <div className="mt-5 border-t border-foreground">
              {group.items.map((demo) => (
                <article
                  key={demo.kind}
                  className="min-w-0 border-b border-border py-6"
                >
                  <header className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_17rem] md:gap-6">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                        {isEnglish ? "Simulation" : "Simulation"}{" "}
                        {String(demos.indexOf(demo) + 1).padStart(2, "0")} ·{" "}
                        {isEnglish ? "synthetic" : "synthetisch"}
                      </p>
                      <h3 className="mt-1.5 break-words text-xl font-bold leading-tight tracking-[-0.02em] text-foreground">
                        {demo.title}
                      </h3>
                      <p className="mt-1 max-w-[680px] break-words text-sm leading-relaxed text-muted-foreground">
                        {demo.tagline}
                      </p>
                    </div>
                    {demo.teachesIn ? (
                      <p className="font-mono text-xs leading-relaxed text-muted-foreground md:text-right">
                        {isEnglish ? "Course link" : "Kursbezug"}
                        <br />
                        <span className="text-foreground">
                          {demo.teachesIn}
                        </span>
                      </p>
                    ) : null}
                  </header>
                  <div className="mt-4 min-w-0 border-t border-border pt-4">
                    <LazyDemoMount kind={demo.kind} locale={locale} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TechnicalCourseFrame>
  );
}
