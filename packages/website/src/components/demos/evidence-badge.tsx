"use client";

import { useId, useState } from "react";
import type { DemoEvidenceMode, DemoExternalActionMode } from "@/lib/demos";
import type { Locale } from "@/lib/i18n/locale";
import { DEMO_ACTION_LABELS, DEMO_EVIDENCE_COPY } from "@/lib/demos-ui-copy";
import { Pictogram, type PictogramName } from "@/components/werk";
import { useDemoLocale } from "./demo-locale";

/** One deck pictogram per execution mode; the word always sits beside it. */
const EVIDENCE_ICON: Record<DemoEvidenceMode, PictogramName> = {
  synthetic: "table",
  rule_based: "checklist",
  recorded_trace: "demo",
  live_api: "export",
};

const DISCLOSURE_COPY: Record<Locale, (label: string) => string> = {
  de: (label) => `Evidenzmodus: ${label}. Details einblenden.`,
  en: (label) => `Evidence mode: ${label}. Show details.`,
};

/**
 * Plus when closed, minus when open: a disclosure mark, not a scroll arrow.
 * Square caps and miter joins, like the deck pictograms.
 */
function DisclosureGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      data-disclosure-glyph={open ? "open" : "closed"}
    >
      <path d="M3 8h10" />
      {open ? null : <path d="M8 3v10" />}
    </svg>
  );
}

/**
 * The single evidence line above a demo engine: execution mode (a disclosure
 * button that expands the explanation), the external-action mode when there
 * is one, and optionally one sentence that says what is invented (the detail
 * page puts that in its "Daten" row instead, so it is said once). It replaces the
 * stacked coloured badges and boxed disclaimers: evidence stays visible and
 * quiet, in a caption line next to the thing it qualifies.
 */
export function EvidenceBadge({
  evidenceMode,
  externalActionMode,
  note,
  locale = "de",
}: {
  evidenceMode: DemoEvidenceMode;
  externalActionMode: DemoExternalActionMode;
  /** What in this example is invented, e.g. the catalog's syntheticDataLabel. */
  note?: string;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const evidenceCopy = DEMO_EVIDENCE_COPY[locale][evidenceMode];
  const actionLabel = DEMO_ACTION_LABELS[locale][externalActionMode];

  return (
    <div data-evidence-line>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={DISCLOSURE_COPY[locale](evidenceCopy.label)}
          data-evidence-mode={evidenceMode}
          className="inline-flex min-h-11 items-center gap-2 text-label text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none"
        >
          <Pictogram name={EVIDENCE_ICON[evidenceMode]} className="size-4" />
          {evidenceCopy.label}
          <DisclosureGlyph open={open} />
        </button>
        {actionLabel ? (
          <span data-evidence-actions>
            <span aria-hidden="true" className="hidden sm:inline">
              ·{" "}
            </span>
            {actionLabel}
          </span>
        ) : null}
        {note ? (
          <span className="min-w-0 break-words">
            <span aria-hidden="true" className="hidden sm:inline">
              ·{" "}
            </span>
            {note}
          </span>
        ) : null}
      </div>
      {open ? (
        <p
          id={detailsId}
          data-evidence-details
          className="mt-1 max-w-[64ch] text-caption text-muted-foreground"
        >
          {evidenceCopy.tooltip}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Inline simulation note: one caption line before a metric or an interactive
 * element, stated next to the claim it qualifies. No box and no left bar; the
 * muted token follows the engine's scope, so it stays AA on paper and inside
 * a dark engine frame.
 */
export function SimulationDisclosure({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useDemoLocale();
  return (
    <div
      className="mb-3 text-caption text-muted-foreground"
      role="note"
      aria-label={
        locale === "de" ? "Hinweis zur Simulation" : "Simulation notice"
      }
    >
      {children}
    </div>
  );
}
