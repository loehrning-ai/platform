"use client";

import { useState, type ReactNode } from "react";
import { GlasButton, GlasSheet } from "@/components/demos/glas";
import { CONDITIONS, type ConditionGap } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/conditions";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { rate } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import type { Fmt } from "./fmt";

type GapLine = ConditionGap["line"];

/** The quote cut at its gap phrases, each gap a button that explains which card line it leaves open. */
function QuoteWithGaps({
  quote,
  gaps,
  chosen,
  onChoose,
  textId,
}: {
  readonly quote: string;
  readonly gaps: readonly ConditionGap[];
  readonly chosen: GapLine | null;
  readonly onChoose: (line: GapLine) => void;
  readonly textId: string;
}) {
  const parts: ReactNode[] = [];
  let rest = quote;
  for (const gap of gaps) {
    const at = rest.indexOf(gap.phrase);
    if (at < 0) continue;
    parts.push(rest.slice(0, at));
    parts.push(
      <button key={gap.line} type="button" className="w02-gap" data-gap={gap.line} aria-pressed={chosen === gap.line} aria-controls={textId} onClick={() => onChoose(gap.line)}>
        {gap.phrase}
      </button>,
    );
    rest = rest.slice(at + gap.phrase.length);
  }
  parts.push(rest);
  return <>{parts}</>;
}

function ConditionBody({
  pack,
  fmt,
  chosen,
  onChoose,
  textId,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly chosen: GapLine | null;
  readonly onChoose: (line: GapLine) => void;
  readonly textId: string;
}) {
  const m = pack.merge;
  const condition = CONDITIONS[fmt.locale];
  const value = rate(condition.counter, "sep");
  return (
    <>
      <blockquote className="w02-condition-quote">
        „<QuoteWithGaps quote={fmt.t(condition.quote)} gaps={condition.gaps} chosen={chosen} onChoose={onChoose} textId={textId} />“
      </blockquote>
      <p className="w02-condition-line" data-w02-claude-condition="">
        {fmt.t(m.conditionUnits, { v: fmt.share(value / 1000) })}
      </p>
      <p className="w02-condition-line" id={textId} aria-live="polite" data-w02-gap-text="">
        {chosen ? (
          <>
            <span className="w02-tag" data-mine="">
              {m.gapLines[chosen]}
            </span>{" "}
            {m.gaps[chosen]}
          </>
        ) : (
          m.gapsLead
        )}
      </p>
    </>
  );
}

/**
 * Scene 3's document card: the release condition Claude proposed without the
 * skill, quoted word for word from the recorded take. It counts affected
 * units, so merging leaves it where it is; what it lacks are three lines of a
 * metric card, marked in the quote (our annotation, never Claude's words). On
 * a phone the card is a one-line plate that opens the quote in a sheet.
 */
export function ConditionCard({ pack, fmt, recordedOn }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly recordedOn: string }) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<GapLine | null>(null);
  const m = pack.merge;
  const head = `${m.conditionHead}, ${fmt.t(m.conditionDate, { date: fmt.fullDate(recordedOn) })}`;
  return (
    <div className="w02-doc w02-condition" data-w02-condition="">
      <p className="w02-doc-kicker">{head}</p>
      <div className="w02-condition-body">
        <ConditionBody pack={pack} fmt={fmt} chosen={chosen} onChoose={setChosen} textId="w02-condition-gap-inline" />
      </div>
      <div className="w02-condition-open">
        <GlasButton variant="plain" size="compact" trailingIcon="forward" onClick={() => setOpen(true)} data-w02-condition-open="">
          {m.conditionRead}
        </GlasButton>
      </div>
      <GlasSheet open={open} onClose={() => setOpen(false)} title={head} closeLabel={pack.close} resizeLabel={pack.resize}>
        <div className="w02-condition-sheet">
          <ConditionBody pack={pack} fmt={fmt} chosen={chosen} onChoose={setChosen} textId="w02-condition-gap-sheet" />
        </div>
      </GlasSheet>
    </div>
  );
}
