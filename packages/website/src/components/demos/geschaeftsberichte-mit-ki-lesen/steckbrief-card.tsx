"use client";

import { useState, type ReactNode } from "react";
import { GlasButton, GlasChip, GlasSegmented, GlasSheet } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { COUNTERS, PERIODS, type Counter, type Denom, type Period } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { CARD_LINES, lineWritten, linesWritten, type CardLine } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/demo-state";
import { lintCard } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import { craftLines, craftOwnCard, type CraftChoice } from "./craft-card";
import type { Fmt } from "./fmt";

const EDITABLE: readonly CardLine[] = ["numerator", "denominator", "period"];
const SHOWN_RULES = new Set(["R1", "R2", "R3", "R7"]);

/** The findings of the shared lint under each line of the CRAFT card (R1 Vorgänge, R2 no Nenner). */
function findingsFor(pack: DemoPack, fmt: Fmt, choice: CraftChoice, trigger: number): Readonly<Partial<Record<CardLine, string>>> {
  const out: Partial<Record<CardLine, string>> = {};
  for (const finding of lintCard(craftOwnCard(pack, fmt, choice, trigger))) {
    if (!SHOWN_RULES.has(finding.rule)) continue;
    const line = (finding.field === "trigger" ? "trigger" : finding.field) as CardLine;
    out[line] = [out[line], pack.own.rules[finding.rule]].filter(Boolean).join(" ");
  }
  return out;
}

/**
 * The visitor's CRAFT card: seven lines, each written by the scene that
 * teaches it. In scene 6 the lines Zähler, Nenner and Zeitraum open a sheet
 * to change them, and the shared lint speaks under a line as one sentence.
 */
export function SteckbriefCard({
  pack,
  fmt,
  choice,
  trigger,
  reached,
  editable,
  onChange,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly choice: CraftChoice;
  readonly trigger: number;
  readonly reached: number;
  readonly editable: boolean;
  readonly onChange: (patch: { counter?: Counter; denom?: Denom; period?: Period }) => void;
}) {
  const [editing, setEditing] = useState<CardLine | null>(null);
  const lines = craftLines(pack, fmt, choice, trigger);
  const findings = editable ? findingsFor(pack, fmt, choice, trigger) : {};
  const c = pack.chip;
  return (
    <div className="w02-doc w02-card" data-w02-card="">
      <p className="w02-doc-kicker">
        {c.label} <span className="w02-card-count">{fmt.t(c.count, { n: linesWritten(reached), max: CARD_LINES.length })}</span>
      </p>
      <p className="w02-card-title">{fmt.t(c.title)}</p>
      <dl className="w02-card-lines">
        {CARD_LINES.map((line) => {
          const written = lineWritten(line, reached);
          const canEdit = editable && EDITABLE.includes(line);
          return (
            <div key={line} className="w02-card-line" data-written={written ? "" : undefined} data-line={line}>
              <dt>{c.lines[line]}</dt>
              <dd>
                {written ? (
                  canEdit ? (
                    <button type="button" className="w02-card-edit" onClick={() => setEditing(line)} aria-label={`${c.lines[line]}: ${lines[line]}. ${pack.decide.change}`}>
                      {lines[line]}
                    </button>
                  ) : (
                    lines[line]
                  )
                ) : (
                  <span className="w02-card-empty">{c.empty}</span>
                )}
                {written && findings[line] ? <span className="w02-finding">{findings[line]}</span> : null}
              </dd>
            </div>
          );
        })}
      </dl>
      <GlasSheet open={editing !== null} onClose={() => setEditing(null)} title={editing ? c.lines[editing] : ""} closeLabel={pack.close} resizeLabel={pack.resize}>
        {editing === "numerator" ? (
          <GlasSegmented
            label={c.lines.numerator}
            wrap
            options={COUNTERS.map((value) => ({
              value,
              label: pack.counters[value].short,
            }))}
            value={choice.counter}
            onChange={(counter) => onChange({ counter })}
          />
        ) : null}
        {editing === "denominator" ? (
          <GlasSegmented
            label={c.lines.denominator}
            wrap
            options={(["per1000", "none"] as const).map((value) => ({
              value,
              label: fmt.t(pack.decide.denomOptions[value]),
            }))}
            value={choice.denom}
            onChange={(denom) => onChange({ denom })}
          />
        ) : null}
        {editing === "period" ? (
          <GlasSegmented
            label={c.lines.period}
            wrap
            options={PERIODS.map((value) => ({
              value,
              label: pack.period.options[value],
            }))}
            value={choice.period}
            onChange={(period) => onChange({ period })}
          />
        ) : null}
        {editing ? <p className="w02-sheet-lead">{lines[editing]}</p> : null}
      </GlasSheet>
    </div>
  );
}

/** Phone: the card as a chip ("3 von 7 Zeilen") that opens it in a sheet. */
export function SteckbriefChip({ pack, fmt, children, reached }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly reached: number; readonly children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const c = pack.chip;
  return (
    <div className="w02-chip-wrap">
      <GlasChip kind="status" icon="doc" onClick={() => setOpen(true)} label={`${c.label}, ${fmt.t(c.count, { n: linesWritten(reached), max: CARD_LINES.length })}`}>
        {c.label}{" "}
        {fmt.t(c.countShort, {
          n: linesWritten(reached),
          max: CARD_LINES.length,
        })}
      </GlasChip>
      <GlasSheet open={open} onClose={() => setOpen(false)} title={fmt.t(c.title)} closeLabel={pack.close} resizeLabel={pack.resize}>
        {children}
        <GlasButton variant="fill" size="compact" onClick={() => setOpen(false)}>
          {pack.close}
        </GlasButton>
      </GlasSheet>
    </div>
  );
}
