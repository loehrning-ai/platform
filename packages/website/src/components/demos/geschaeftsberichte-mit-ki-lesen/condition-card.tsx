"use client";

import { useState } from "react";
import { GlasButton } from "@/components/demos/glas";
import { CONDITIONS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/conditions";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { FALLBACK_CONDITION } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import { mergeStepRate, rate } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import type { Fmt } from "./fmt";

/**
 * Scene 3's document card: the release condition Claude proposed without the
 * skill, quoted from the recorded take, checked live against the merges.
 * Claude's condition counts affected units, so merging leaves it where it
 * is; the labelled "Angenommen" condition counts records and only the merge
 * meets it.
 */
export function ConditionCard({ pack, fmt, merges, recordedOn }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly merges: number; readonly recordedOn: string }) {
  const [open, setOpen] = useState(false);
  const m = pack.merge;
  const condition = CONDITIONS[fmt.locale];
  const value = rate(condition.counter, "sep", merges);
  const assumed = mergeStepRate(merges);
  const met = assumed < FALLBACK_CONDITION.value;
  return (
    <div className="w02-doc w02-condition" data-open={open ? "" : undefined} data-w02-condition="">
      <p className="w02-doc-kicker">
        {m.conditionHead}, {fmt.t(m.conditionDate, { date: fmt.fullDate(recordedOn) })}
      </p>
      <blockquote className="w02-condition-quote" id="w02-condition-quote">
        „{fmt.t(condition.quote)}“
      </blockquote>
      <p className="w02-condition-line" data-w02-claude-condition="">
        {fmt.t(m.conditionUnits, { v: fmt.share(value / 1000) })}
      </p>
      <p className="w02-condition-line w02-assumed" data-w02-assumed="">
        <span className="w02-tag" data-source="demo">
          {m.assumedTag}
        </span>{" "}
        {fmt.t(m.assumedHead, { t: fmt.n(FALLBACK_CONDITION.value) })}{" "}
        {met ? fmt.t(m.assumedAfter, { v: fmt.n(assumed, 2) }) : fmt.t(m.assumedBefore, { v: fmt.n(mergeStepRate(0), 2) })}
      </p>
      <div className="w02-condition-toggle">
        <GlasButton variant="plain" size="compact" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="w02-condition-quote">
          {m.conditionRead}
        </GlasButton>
      </div>
    </div>
  );
}
