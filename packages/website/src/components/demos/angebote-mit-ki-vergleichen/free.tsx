"use client";

import { GlasButton, GlasSegmented, GlasSlider, GlasToggle } from "@/components/demos/glas";
import { FIELDS, type Field } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/basis";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import type { FreeState, Unit } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/demo-state";
import type { CostRow } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import type { Fmt } from "./fmt";
import { PaperSlider } from "./paper";

/**
 * Free play (P24), the sheet "Die Basis": every lever at once. It opens as printed with every field
 * off, so discovery still happens here. The quantity is a fixed label, not a lever. With the
 * visitor's own offers the fields and the paper price are off, with one sentence why.
 */
export function FreeLevers({
  pack,
  fmt,
  kit,
  free,
  flip,
  hasOwn,
  answer,
  onChange,
  onGuide,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly kit: readonly CostRow[];
  readonly free: FreeState;
  readonly flip: number;
  readonly hasOwn: boolean;
  /** The answering sentence, also in the dock while the sheet is closed. */
  readonly answer: string;
  readonly onChange: (patch: Partial<FreeState>) => void;
  readonly onGuide: () => void;
}) {
  const f = pack.free;
  const own = free.data === "own" && hasOwn;
  const locked = own || free.unit === "printed";
  const toggle = (field: Field, on: boolean) => onChange({ fields: FIELDS.filter((candidate) => (candidate === field ? on : free.fields.includes(candidate))) });
  return (
    <div className="av4-sheet-body av4-free" data-av4-free="">
      <p className="av4-answer" aria-live="polite" data-av4-answer="">
        {answer}
      </p>
      <p className="av4-fixed">{f.qty}</p>
      <GlasSegmented<Unit>
        label={pack.einheit.control}
        options={[
          { value: "printed", label: pack.einheit.printed },
          { value: "piece", label: pack.einheit.piece },
        ]}
        value={own ? "piece" : free.unit}
        onChange={(unit) => onChange({ unit })}
      />
      <GlasToggle checked={free.fields.includes("lieferort")} onChange={(on) => toggle("lieferort", on)} label={f.lieferort} disabled={locked} />
      <GlasToggle checked={free.fields.includes("einmalig")} onChange={(on) => toggle("einmalig", on)} label={f.einmalig} disabled={locked} />
      <GlasToggle checked={free.fields.includes("zahlung")} onChange={(on) => toggle("zahlung", on)} label={f.zahlung} disabled={locked} />
      <PaperSlider pack={pack} fmt={fmt} kit={kit} v={free.v} cap={free.cap} flip={flip} onChange={(v) => onChange({ v })} disabled={locked} />
      <GlasSlider
        label={fmt.t(pack.papier.capSlider, { cap: fmt.pct(free.cap ?? 10, 1) })}
        value={free.cap ?? 10}
        min={0}
        max={10}
        step={0.1}
        bigStep={1}
        onChange={(cap) => onChange({ cap: cap >= 10 ? null : cap })}
        format={(cap) => fmt.t(pack.papier.short, { v: fmt.pct(cap, 1) })}
        valueText={(cap) => fmt.t(pack.papier.capSlider, { cap: fmt.pct(cap, 1) })}
        disabled={locked}
      />
      <GlasSegmented<"kit" | "own">
        label={f.data}
        options={[
          { value: "kit", label: f.kit },
          { value: "own", label: f.own },
        ]}
        value={own ? "own" : "kit"}
        onChange={(data) => onChange({ data })}
      />
      {free.data === "own" ? <p className="av4-note">{hasOwn ? f.ownLocked : f.ownNone}</p> : null}
      <GlasButton variant="plain" size="compact" icon="back" onClick={onGuide} data-av4-to-guide="">
        {f.toGuide}
      </GlasButton>
    </div>
  );
}
