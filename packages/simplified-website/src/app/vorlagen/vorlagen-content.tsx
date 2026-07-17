"use client";

import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  FileText,
  ScrollText,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  type VorlageCategory,
  type VorlageMeta,
} from "@/lib/vorlagen-shared";

interface Props {
  readonly vorlagen: readonly VorlageMeta[];
}

const CATEGORY_ICON: Record<VorlageCategory, typeof ShieldAlert> = {
  pflicht: ShieldAlert,
  hygiene: ScrollText,
  werkzeug: Wrench,
};

const CATEGORY_TONE: Record<VorlageCategory, string> = {
  pflicht: "border-risk-red text-risk-red",
  hygiene: "border-brand-orange text-brand-orange",
  werkzeug: "border-brand-sand text-brand-sand",
};

const CATEGORY_BG: Record<VorlageCategory, string> = {
  pflicht: "bg-risk-red/5 border-risk-red/30",
  hygiene: "bg-brand-orange/5 border-brand-orange/30",
  werkzeug: "bg-brand-sand/5 border-brand-sand/30",
};

const CATEGORIES: readonly VorlageCategory[] = ["pflicht", "hygiene", "werkzeug"];

export function VorlagenContent({ vorlagen }: Props) {
  const totalPages = vorlagen.reduce((sum, v) => sum + v.pages, 0);
  const pflichtCount = vorlagen.filter((v) => v.pflicht).length;

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/60 bg-card/20 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <m.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange"
          >
            Ressourcenbibliothek · Kursbegleitende Arbeitsblätter
          </m.p>
          <m.h1
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            variants={fadeUp}
            className="mb-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl"
          >
            Keine Theorieablage.<br />
            Nutzbare Vorlagen.
          </m.h1>
          <m.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            variants={fadeUp}
            className="mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground"
          >
            {vorlagen.length} Governance-Artefakte aus den Kursen, mit denen
            Sie EU AI Act Compliance, Datenschutz und KI-Steuerung im eigenen
            Haus strukturieren. Kostenlos und ohne Anmeldung, mit Editor&apos;s Notes
            und realistischen Mittelstand-Beispielen.
          </m.p>

          {/* Manifest */}
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mb-10 grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                label: "Kursbegleitend",
                body: "Jede Vorlage gehört zu einem Lernschritt: verstehen, einordnen, dokumentieren.",
              },
              {
                label: "Mit Rechtsgrundlage",
                body: "Pflicht- und Compliance-Vorlagen führen konkrete Rechtsquellen; operative Werkzeuge verweisen auf passende Governance-Nachweise.",
              },
              {
                label: "Ohne Anmeldung",
                body: "Markdown, PDF und verfügbare CSV-Dateien lassen sich direkt und ohne Lernkonto herunterladen.",
              },
            ].map((item, i) => (
              <m.div
                key={item.label}
                custom={i}
                variants={staggerItem}
                className="rounded-none border border-border bg-card/40 p-5"
              >
                <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                  {String(i + 1).padStart(2, "0")} · {item.label}
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {item.body}
                </p>
              </m.div>
            ))}
          </m.div>

          {/* Stats */}
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { value: `${vorlagen.length}`, label: "Vorlagen" },
              { value: `${pflichtCount}`, label: "Pflicht-Artefakte" },
              { value: `${totalPages}`, label: "Seiten gesamt" },
              { value: "CC BY 4.0", label: "Lizenz" },
            ].map((stat, i) => (
              <m.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                className="rounded-none border border-border bg-card/30 p-4 text-center"
              >
                <p className="font-mono text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          {CATEGORIES.map((cat) => {
            const items = vorlagen.filter((v) => v.category === cat);
            if (items.length === 0) return null;
            const Icon = CATEGORY_ICON[cat];

            return (
              <div key={cat} className="mb-20 last:mb-0">
                <div className="mb-8 flex items-start gap-4 sm:items-center">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-none border ${CATEGORY_BG[cat]}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${cat === "pflicht" ? "text-risk-red" : cat === "hygiene" ? "text-brand-orange" : "text-brand-sand"}`}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                      {CATEGORY_LABELS[cat]}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                      {CATEGORY_DESCRIPTIONS[cat]}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((v) => (
                    <VorlageCard key={v.slug} vorlage={v} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="rounded-none border border-border border-t-[3px] border-t-brand-orange bg-background p-8 sm:p-12">
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              Vorlagen im Lernpfad
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              Erst Kursblock verstehen, dann Dokument anpassen.
            </h2>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Die Vorlagen sind Arbeitsblätter. Für konkrete Systeme müssen
              Datenquellen, Risiken, Rollen und Verantwortlichkeiten intern
              geprüft, angepasst und aktuell gehalten werden.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/eu-ai-act-kurs"
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-6 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
              >
                EU AI Act Kurs öffnen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function VorlageCard({ vorlage }: { readonly vorlage: VorlageMeta }) {
  const tone = CATEGORY_TONE[vorlage.category];
  return (
    <Link
      href={`/vorlagen/${vorlage.slug}`}
      className="group flex h-full flex-col rounded-none border border-border border-t-[3px] border-t-brand-orange bg-card/30 p-6 transition-colors hover:bg-card/60"
    >
      {/* Top row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            {vorlage.pages} Seiten
          </span>
        </div>
        {vorlage.pflicht && (
          <span
            className={`rounded-none border bg-transparent px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${tone}`}
          >
            Pflicht
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold leading-snug tracking-[-0.02em] group-hover:text-brand-orange">
        {vorlage.title}
      </h3>

      {/* Job-to-be-done */}
      <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {vorlage.jobToBeDone}
      </p>

      {/* Article refs */}
      {vorlage.articleRefs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {vorlage.articleRefs.slice(0, 3).map((ref) => (
            <span
              key={ref}
              className="rounded-none border border-border bg-card/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
            >
              {ref}
            </span>
          ))}
          {vorlage.articleRefs.length > 3 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              + {vorlage.articleRefs.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {vorlage.estReadMinutes} min
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange opacity-70 transition-opacity group-hover:opacity-100">
          Vorlage öffnen
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
