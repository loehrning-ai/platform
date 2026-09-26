"use client";

import { useId, useState } from "react";
import type { DemoEvidenceMode, DemoExternalActionMode } from "@/lib/demos";
import type { Locale } from "@/lib/i18n/locale";
import {
  DEMO_ACTION_LABELS,
  DEMO_EVIDENCE_COPY,
  DEMOS_PAGE_COPY,
} from "@/lib/demos-ui-copy";
import { Pictogram, type PictogramName } from "@/components/werk";
import { useDemoLocale } from "./demo-locale";

/** One deck pictogram per execution mode; the word always sits beside it. */
const EVIDENCE_ICON: Record<DemoEvidenceMode, PictogramName> = {
  synthetic: "table",
  rule_based: "checklist",
  recorded_trace: "demo",
  live_api: "export",
};

/**
 * Plus when closed, minus when open: a disclosure mark, not a scroll arrow.
 * Square caps and miter joins, like the deck pictograms. It sits after the
 * visible "Was heißt das?" label, so the minus never reads as a dash inside
 * the evidence phrase.
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
 * The evidence line of a demo engine: execution mode and external-action mode
 * as one plain caption phrase ("Synthetisch · Aktionen simuliert"), the
 * optional invented-data note, and a last, labelled disclosure button that
 * expands the explanation of the mode.
 *
 * It renders two siblings (the line and, when open, the explanation) so a
 * wrapping flex parent such as the DemoShell header can give the explanation
 * its own full-width row without moving the button that opened it. In block
 * flow the two simply stack.
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
  const disclosure = DEMOS_PAGE_COPY[locale].evidence;

  return (
    <>
      <div
        data-evidence-line
        className="flex min-w-0 flex-wrap items-center gap-x-3 text-caption text-muted-foreground"
      >
        <span
          className="inline-flex min-w-0 items-center gap-1.5"
          data-evidence-mode={evidenceMode}
        >
          <Pictogram
            name={EVIDENCE_ICON[evidenceMode]}
            className="size-4 shrink-0 text-foreground"
          />
          <span className="text-foreground">{evidenceCopy.label}</span>
          {actionLabel ? (
            <span data-evidence-actions>
              <span aria-hidden="true">· </span>
              {actionLabel}
            </span>
          ) : null}
        </span>
        {note ? <span className="min-w-0 break-words">{note}</span> : null}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={disclosure.explainAria(evidenceCopy.label)}
          className="inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none"
        >
          {disclosure.explain}
          <DisclosureGlyph open={open} />
        </button>
      </div>
      <p
        id={detailsId}
        hidden={!open}
        data-evidence-details={open ? "" : undefined}
        className="basis-full max-w-[64ch] pb-3 text-caption text-muted-foreground"
      >
        {evidenceCopy.tooltip}
      </p>
    </>
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
