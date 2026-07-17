import Link from "next/link";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  ScrollText,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  type Vorlage,
  type VorlageCategory,
  type VorlageMeta,
} from "@/lib/vorlagen-shared";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import { DownloadButtons } from "./DownloadButtons";

interface Props {
  readonly vorlage: Vorlage;
  readonly related: readonly VorlageMeta[];
}

const CATEGORY_ICONS: Record<VorlageCategory, typeof ShieldAlert> = {
  pflicht: ShieldAlert,
  hygiene: ScrollText,
  werkzeug: Wrench,
};

const CATEGORY_TONE: Record<VorlageCategory, string> = {
  pflicht: "border-risk-red text-risk-red",
  hygiene: "border-brand-orange text-brand-orange",
  werkzeug: "border-brand-sand text-brand-sand",
};

/** Lightweight TOC builder. Picks ## (h2) headings only, in document order. */
function extractToc(markdown: string): readonly { id: string; text: string }[] {
  const lines = markdown.split("\n");
  const toc: { id: string; text: string }[] = [];
  for (const line of lines) {
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (match) {
      const text = match[1].replace(/[*`]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[äöüß]/g, (c) => ({ ä: "a", ö: "o", ü: "u", ß: "ss" })[c] ?? c)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      toc.push({ id, text });
    }
  }
  return toc;
}

/** Returns the first 2 H2 sections of the markdown for in-page preview.
 *  Drops the leading H1 (page hero already shows the title). */
function extractPreview(markdown: string, sectionCount = 2): string {
  const noTitle = markdown.replace(/^\s*#\s+.+\n+/, "");
  const lines = noTitle.split("\n");
  let h2Count = 0;
  let stopIdx = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      h2Count += 1;
      if (h2Count > sectionCount) {
        stopIdx = i;
        break;
      }
    }
  }
  return lines.slice(0, stopIdx).join("\n");
}

export function VorlageDetailContent({ vorlage, related }: Props) {
  const toc = extractToc(vorlage.body);
  const preview = extractPreview(vorlage.body, 2);
  const Icon = CATEGORY_ICONS[vorlage.category];

  return (
    <article className="bg-background pb-24">
      {/* Back-link strip */}
      <nav
        aria-label="Vorlagennavigation"
        className="border-b border-border/60 bg-card/20"
      >
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link
            href="/vorlagen"
            aria-label="Zurück zu allen Vorlagen"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-orange"
          >
            <ArrowLeft className="h-4 w-4" />
            Alle Vorlagen
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-none border bg-transparent px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] ${CATEGORY_TONE[vorlage.category]}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {CATEGORY_LABELS[vorlage.category]}
            </span>
            {vorlage.pflicht && (
              <span className="rounded-none border border-risk-red bg-risk-red/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-risk-red">
                Pflicht
              </span>
            )}
            {vorlage.articleRefs.map((ref) => (
              <span
                key={ref}
                className="rounded-none border border-border bg-card/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
              >
                {ref}
              </span>
            ))}
          </div>

          <h1 className="mb-5 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            {vorlage.title}
          </h1>

          <p className="mb-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {vorlage.jobToBeDone}
          </p>

          {/* Metric row */}
          <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-4">
            <Metric icon={FileText} label="Seiten" value={`${vorlage.pages}`} />
            <Metric
              icon={Clock}
              label="Lesedauer"
              value={`${vorlage.estReadMinutes} min`}
            />
            <Metric
              icon={CheckCircle2}
              label="Ausfüllen"
              value={`${vorlage.estCompleteMinutes} min`}
            />
            <Metric
              icon={Users}
              label="Zielgruppe"
              value={vorlage.audience.length ? `${vorlage.audience.length} Rollen` : "-"}
            />
          </div>

          {/* Access row */}
          <div className="mt-8">
            <DownloadButtons slug={vorlage.slug} downloads={vorlage.downloads} variant="primary" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Kostenlos und ohne Anmeldung. CC BY 4.0: Anpassen, intern weitergeben,
            in Prozesse übernehmen, Quellenangabe genügt.
          </p>
          {vorlage.lastReviewed && vorlage.nextReview && (
            <div className="mt-4">
              <FreshnessBadge
                lastReviewed={vorlage.lastReviewed}
                nextReview={vorlage.nextReview}
                riskClass={vorlage.riskClass || undefined}
              />
            </div>
          )}
        </div>
      </header>

      {/* Audience strip */}
      {vorlage.audience.length > 0 && (
        <section className="border-b border-border/60 bg-card/20">
          <div className="mx-auto max-w-5xl px-6 py-5">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Für wen
            </p>
            <p className="text-sm text-foreground/90">
              {vorlage.audience.join(" · ")}
            </p>
          </div>
        </section>
      )}

      {/* TOC + Preview */}
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[240px_1fr]">
        {/* TOC sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Was ist drin?
          </p>
          <ol className="space-y-1.5 border-l border-border pl-3">
            {toc.map((item, i) => (
              <li key={item.id} className="text-sm leading-snug text-muted-foreground">
                <span className="mr-1.5 font-mono text-[10px] text-brand-orange">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.text}
              </li>
            ))}
          </ol>
        </aside>

        {/* Body */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 border border-border bg-card/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-orange">
            <FileText className="h-3 w-3" />
            Vorschau · Abschnitte 1-2 von {toc.length}
          </div>

          <MarkdownRenderer content={preview} copyable />

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Vollständige Vorlage ({vorlage.pages} Seiten) im Lernbereich herunterladen:
            </p>
            <DownloadButtons slug={vorlage.slug} downloads={vorlage.downloads} variant="secondary" />
          </div>
        </div>
      </div>

      {/* Redaktionelle Hinweise */}
      {vorlage.editorNotes.length > 0 && (
        <section className="border-y border-border/60 bg-card/30">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <h2 className="mb-2 text-2xl font-bold tracking-[-0.03em]">
              Redaktionelle Hinweise
            </h2>
            <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
              Was Sie unbedingt anpassen müssen, und die häufigsten Fehler aus
              typischen Szenarien aus dem Mittelstand.
            </p>
            <ol className="space-y-3">
              {vorlage.editorNotes.map((note, i) => (
                <li
                  key={i}
                  className="flex gap-3 border-l-2 border-brand-orange bg-card/40 p-4"
                >
                  <span className="font-mono text-xs text-brand-orange">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/90">
                    {note}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Sources / Rechtsgrundlage */}
      {vorlage.sources.length > 0 && (
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <h2 className="mb-6 text-2xl font-bold tracking-[-0.03em]">
              Rechtsgrundlage und Quellen
            </h2>
            <ul className="space-y-2">
              {vorlage.sources.map((source) => (
                <li key={source.url} className="text-sm">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-orange underline decoration-brand-orange/30 transition-colors hover:text-kupfer-dark hover:decoration-kupfer-dark/60"
                  >
                    {source.title}
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground">
              Letzte fachliche Prüfung: {vorlage.lastReviewed}. Diese Vorlage
              ersetzt keine Rechtsberatung im Einzelfall.
            </p>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <h2 className="mb-6 text-2xl font-bold tracking-[-0.03em]">
              Passt dazu
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const RelIcon = CATEGORY_ICONS[r.category];
                return (
                  <Link
                    key={r.slug}
                    href={`/vorlagen/${r.slug}`}
                    className="group flex flex-col rounded-none border border-border border-t-[3px] border-t-brand-orange bg-card/30 p-5 transition-colors hover:bg-card/60"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <RelIcon className="h-4 w-4 text-brand-orange" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {CATEGORY_LABELS[r.category]}
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-semibold leading-snug group-hover:text-brand-orange">
                      {r.title}
                    </h3>
                    <p className="text-sm leading-snug text-muted-foreground">
                      {r.jobToBeDone}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA strip */}
      <section className="bg-card/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-none border border-border border-t-[3px] border-t-brand-orange bg-background p-8 sm:p-12">
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              Vorlagen sind ein Anfang
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              Kontext vor dem Ausfüllen klären.
            </h2>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Diese Vorlage ersetzt keine rechtliche oder organisatorische
              Einzelfallprüfung. Nutzen Sie die Kurse und die Methodikseiten,
              um Begriffe, Risiken und Zuständigkeiten sauber einzuordnen.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/eu-ai-act-kurs"
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-6 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
              >
                EU AI Act Kurs öffnen
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/blog/eu-ai-act-grundlagen"
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-background px-6 py-3 font-bold uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
              >
                EU AI Act Grundlagen lesen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof Clock;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-brand-orange" aria-hidden="true" />
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-base font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
