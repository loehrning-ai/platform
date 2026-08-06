"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ChevronRight, Presentation } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import type { Workshop } from "@/lib/workshops";

interface Props {
  readonly workshops: readonly Workshop[];
}

export function WorkshopsContent({ workshops }: Props) {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/60 bg-card/20 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            Selbstlern-Workshops · Zum Nachbauen
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Kein Vortrag.<br />
            Ein gebauter KI-Analyst.
          </h1>
          <p className="mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {workshops.length} Selbstlern-Workshop{workshops.length === 1 ? "" : "s"} aus der
            kostenlosen KI-Lernplattform: Du baust in der Claude-App Schritt für Schritt mit,
            arbeitest an einem realistischen Übungsfall und nimmst das komplette Material zum
            Nachbauen mit deinen eigenen Zahlen mit.
          </p>

          {/* Manifest */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Geführt im Selbststudium",
                body: "Jeder Workshop führt Schritt für Schritt durch den Aufbau. Es gibt derzeit keine Termine oder Buchung.",
              },
              {
                label: "Synthetischer Hauptfall, echter Zweitfall",
                body: "Der Hauptfall ist offen als erfunden gekennzeichnet: realistische Zahlen, kein echtes Unternehmen. Fall 2 wendet dieselbe Methode auf die öffentlich eingereichten Quartalszahlen eines echten Unternehmens an.",
              },
              {
                label: "Material zum Mitnehmen",
                body: "Slides, Field Card und Übungs-Kit stehen kostenlos und ohne Anmeldung bereit. Die aktuelle Materialfassung ist Englisch.",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className="rounded-none border border-border bg-card/40 p-5"
              >
                <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                  {String(i + 1).padStart(2, "0")} · {item.label}
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop list */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <m.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {workshops.map((workshop) => (
              <m.div key={workshop.slug} variants={staggerItem} className="js-reveal h-full">
                <WorkshopCard workshop={workshop} />
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="rounded-none border border-border border-t-[3px] border-t-brand-orange bg-background p-8 sm:p-12">
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              Workshops im Lernpfad
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              Erst Grundlagen verstehen, dann selbst nachbauen.
            </h2>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Die Workshops setzen keine Vorkenntnisse voraus, ergänzen sich aber gut mit
              den Kursen: dort vertiefst du die Begriffe, hier wendest du sie in einem
              geführten Übungsfall an.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/kurse"
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-6 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
              >
                Kurse ansehen
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const pad = (value: number) => String(value).padStart(2, "0");

function WorkshopCard({ workshop }: { readonly workshop: Workshop }) {
  const rows = [
    { label: "Dauer", value: workshop.duration },
    { label: "Schritte", value: pad(workshop.steps.length) },
    { label: "Zielgruppen", value: pad(workshop.audience.length) },
    { label: "Material", value: `${pad(workshop.materials.length)} Downloads` },
  ] as const;

  return (
    <div className="group relative flex h-full flex-col rounded-none border border-border border-t-[3px] border-t-brand-orange bg-card/30 transition-colors hover:bg-card/60">
      {/* Typenschild: the workshop's facts as a data plate. Every future
          workshop generates its own from duration/steps/audience/materials,
          so the card needs no photography. Numeral stays ink: the single
          Kupfer accent on this view is the top border + CTA. */}
      <div className="relative border-b border-border bg-background/60 bg-dot-pattern p-5">
        <span aria-hidden="true" className="absolute left-2 top-2 h-1 w-1 bg-foreground/25" />
        <span aria-hidden="true" className="absolute right-2 top-2 h-1 w-1 bg-foreground/25" />
        <span aria-hidden="true" className="absolute bottom-2 left-2 h-1 w-1 bg-foreground/25" />
        <span aria-hidden="true" className="absolute bottom-2 right-2 h-1 w-1 bg-foreground/25" />
        <div
          aria-hidden="true"
          className="flex items-baseline justify-between gap-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <Presentation className="h-3.5 w-3.5" aria-hidden="true" />
            {workshop.format}
          </span>
          <span>zum Nachbauen</span>
        </div>
        <span aria-hidden="true" className="mt-2 block h-px w-full bg-border" />
        <div aria-hidden="true" className="grid grid-cols-[1fr_auto] gap-x-4">
          <dl className="mt-1">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-border/60 py-[6px] font-mono text-[10.5px] uppercase tracking-[0.08em] last:border-b-0"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="min-w-0 text-right font-bold text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <span
            aria-hidden="true"
            className="mt-2 font-mono text-[52px] font-bold leading-none tracking-[-0.04em] text-foreground/15"
          >
            {pad(workshop.steps.length)}
          </span>
        </div>
        {/* Schrittleiste: the step rail fills on hover, demonstrating the
            step count the plate states. Decorative; the dl carries the fact. */}
        <div aria-hidden="true" className="mt-3 flex gap-1">
          {workshop.steps.map((step, i) => (
            <span
              key={step.title}
              className="h-1 flex-1 bg-border transition-colors duration-200 group-hover:bg-foreground/40"
              style={{ transitionDelay: `${i * 35}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="mb-2 text-lg font-semibold leading-snug tracking-[-0.02em] group-hover:text-brand-orange">
          {/* Stretched link: names the card by its title alone and keeps the
              whole card clickable without pouring the plate into the link's
              accessible name. */}
          <Link
            href={`/workshops/${workshop.slug}`}
            className="after:absolute after:inset-0"
          >
            {workshop.title}
          </Link>
        </h2>
        <p className="sr-only">
          {workshop.format}. Dauer: {workshop.duration}. {workshop.steps.length}{" "}
          Schritte. {workshop.audience.length} Zielgruppen.{" "}
          {workshop.materials.length} Downloads.
        </p>
        <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
          {workshop.description}
        </p>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {workshop.format}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange opacity-70 transition-opacity group-hover:opacity-100">
            Workshop öffnen
            <ChevronRight className="h-3 w-3 arrow-nudge" />
          </span>
        </div>
      </div>
    </div>
  );
}
