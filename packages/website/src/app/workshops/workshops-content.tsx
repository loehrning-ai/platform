"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ChevronRight, Clock, Presentation, Users } from "lucide-react";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
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
          <m.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange"
          >
            Live-Workshops · Zum Nachbauen
          </m.p>
          <m.h1
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            variants={fadeUp}
            className="mb-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl"
          >
            Kein Vortrag.<br />
            Ein gebauter KI-Analyst.
          </m.h1>
          <m.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            variants={fadeUp}
            className="mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground"
          >
            {workshops.length} Live-Workshop{workshops.length === 1 ? "" : "s"} aus der
            kostenlosen KI-Lernplattform: Du baust in der Claude-App live mit, arbeitest
            an einem realistischen Übungsfall und nimmst das komplette Material zum
            Nachbauen mit deinen eigenen Zahlen mit.
          </m.p>

          {/* Manifest */}
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                label: "Live und geführt",
                body: "Jeder Workshop läuft Schritt für Schritt mit, kein vorproduziertes Video, keine Theorie ohne Anwendung.",
              },
              {
                label: "Synthetische Übungsfälle",
                body: "Alle Fallbeispiele sind offen als erfunden gekennzeichnet: realistische Zahlen, kein echtes Unternehmen.",
              },
              {
                label: "Material zum Mitnehmen",
                body: "Slides, Field Card und ein Übungs-Kit stehen kostenlos und ohne Anmeldung zum Download bereit.",
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
        </div>
      </section>

      {/* Workshop list */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => (
              <WorkshopCard key={workshop.slug} workshop={workshop} />
            ))}
          </div>
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
              Erst Grundlagen verstehen, dann live mitbauen.
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

function WorkshopCard({ workshop }: { readonly workshop: Workshop }) {
  return (
    <Link
      href={`/workshops/${workshop.slug}`}
      className="group flex h-full flex-col rounded-none border border-border border-t-[3px] border-t-brand-orange bg-card/30 p-6 transition-colors hover:bg-card/60"
    >
      {/* Top row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            {workshop.format}
          </span>
        </div>
      </div>

      {/* Title */}
      <h2 className="mb-2 text-lg font-semibold leading-snug tracking-[-0.02em] group-hover:text-brand-orange">
        {workshop.title}
      </h2>

      {/* Description */}
      <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {workshop.description}
      </p>

      {/* Meta */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-none border border-border bg-card/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {workshop.duration}
        </span>
        <span className="inline-flex items-center gap-1 rounded-none border border-border bg-card/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          <Users className="h-3 w-3" />
          {workshop.audience.length} Zielgruppen
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          {workshop.steps.length} Schritte
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange opacity-70 transition-opacity group-hover:opacity-100">
          Workshop öffnen
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
