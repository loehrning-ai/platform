"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Presentation } from "lucide-react";
import type { Workshop } from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { WORKSHOP_PAGE_COPY } from "./workshop-copy";

interface Props {
  readonly workshops: readonly Workshop[];
  readonly locale: Locale;
}

export function WorkshopsContent({ workshops, locale }: Props) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/60 bg-card/20 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.kicker}
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            {copy.headingLead}<br />
            {copy.headingSecond}
          </h1>
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {copy.introduction(workshops.length)}
          </p>

          {/* Manifest */}
          <div className="grid gap-4 sm:grid-cols-3">
            {copy.principles.map((item, i) => (
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
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 border-b border-border pb-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.available}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {copy.availableDescription}
            </p>
          </div>
          <div
            className={
              workshops.length === 1
                ? "grid max-w-md gap-4"
                : workshops.length === 2
                  ? "grid gap-4 sm:grid-cols-2"
                  : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {workshops.length === 0 ? (
              <p role="status" className="border border-border bg-card/30 p-5 text-sm text-muted-foreground">
                {copy.empty}
              </p>
            ) : null}
            {workshops.map((workshop) => (
              <div key={workshop.slug} className="h-full">
                <WorkshopCard workshop={workshop} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="rounded-none border border-border border-t-[3px] border-t-brand-orange bg-background p-8 sm:p-12">
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.learningPathKicker}
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              {copy.learningPathHeading}
            </h2>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {copy.learningPathBody}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={localizeHref("/kurse", locale)}
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-6 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
              >
                {copy.viewCourses}
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

function WorkshopCard({
  workshop,
  locale,
}: {
  readonly workshop: Workshop;
  readonly locale: Locale;
}) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;
  const rows = [
    { label: copy.duration, value: workshop.duration },
    { label: copy.steps, value: pad(workshop.steps.length) },
    { label: copy.audiences, value: pad(workshop.audience.length) },
    { label: copy.materials, value: `${pad(workshop.materials.length)} ${copy.downloads}` },
  ] as const;

  return (
    <div className="group relative flex h-full flex-col rounded-none border border-border border-t-[3px] border-t-brand-orange bg-card/30 transition-colors hover:bg-card/60">
      {/* A real frame of the workshop's own material, so the two cards are
          told apart by what you actually get rather than by a step count.
          Decorative: the heading below is the accessible name, and the
          sr-only paragraph carries the facts. Lazy by default; both files
          are ~25 KB and sit below the fold. */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-background/60">
        <Image
          src={`/workshops/${workshop.slug}/card-preview.webp`}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <span
          aria-hidden="true"
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 border border-foreground/15 bg-background/85 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-foreground backdrop-blur-sm"
        >
          <Presentation className="h-3 w-3" aria-hidden="true" />
          {workshop.format}
        </span>
        {/* Schrittleiste: one tick per step, filling on hover. Shows the
            shape of the workshop without making the raw count the headline. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex gap-px">
          {workshop.steps.map((step, i) => (
            <span
              key={step.title}
              className="h-1 flex-1 bg-foreground/20 transition-colors duration-200 group-hover:bg-brand-orange"
              style={{ transitionDelay: `${i * 35}ms` }}
            />
          ))}
        </div>
      </div>

      <dl
        aria-hidden="true"
        className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em]"
      >
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-bold text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="mb-2 text-xl font-semibold leading-snug tracking-[-0.02em] group-hover:text-brand-orange">
          {/* Stretched link: names the card by its title alone and keeps the
              whole card clickable without pouring the plate into the link's
              accessible name. */}
          <Link
            href={localizeHref(`/workshops/${workshop.slug}`, locale)}
            className="after:absolute after:inset-0"
          >
            {workshop.title}
          </Link>
        </h2>
        <p className="sr-only">
          {copy.cardFacts({
            format: workshop.format,
            duration: workshop.duration,
            steps: workshop.steps.length,
            audiences: workshop.audience.length,
            materials: workshop.materials.length,
          })}
        </p>
        <p className="mb-5 line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {workshop.summary}
        </p>
        {/* The format already reads on the plate chip over the preview, so
            this row carries only the call to action. */}
        <div className="flex items-center justify-end border-t border-border pt-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange opacity-70 transition-opacity group-hover:opacity-100">
            {copy.openWorkshop}
            <ChevronRight className="h-3 w-3 arrow-nudge" />
          </span>
        </div>
      </div>
    </div>
  );
}
