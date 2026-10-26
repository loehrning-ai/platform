"use client";

import { GlasButton, GlasSlider } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import type { CostRow } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import { paperNumbers } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stage";
import { paperReadout } from "./captions";
import type { Fmt } from "./fmt";

const TICKS = [0, 3, 5, 7, 10] as const;

/**
 * Beat 3: the paper rise at offer C, 0 to 10 % in steps of 0,1. The turning point is a tick of its own
 * with a button that jumps to it; the value above the thumb says who is cheaper and by how much. No
 * tween while dragging: the bars follow the value as it is. The thumb shows the rise; the line under
 * the track says who is cheaper, so the header of the control stays one line on a phone.
 */
export function PaperSlider({
  pack,
  fmt,
  kit,
  v,
  cap,
  flip,
  onChange,
  disabled,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly kit: readonly CostRow[];
  readonly v: number;
  readonly cap: number | null;
  readonly flip: number;
  readonly onChange: (v: number) => void;
  readonly disabled?: boolean;
}) {
  const p = pack.papier;
  const readout = (value: number) => (value > 0 ? paperReadout(pack, fmt, kit, value, cap) : "");
  const short = (value: number) => fmt.t(p.short, { v: fmt.pct(value, 1) });
  // The jump lands on the first tenth past the turning point, so A is cheaper there.
  const past = Math.ceil(flip * 10) / 10;
  return (
    <div className="av4-paper-control" data-av4-paper="">
      <GlasSlider
        label={p.slider}
        value={v}
        min={0}
        max={10}
        step={0.1}
        bigStep={1}
        onChange={onChange}
        format={short}
        valueText={(value) => fmt.t(p.value, { v: fmt.pct(value, 1) })}
        announce={(value) => readout(value) || fmt.t(p.value, { v: fmt.pct(value, 1) })}
        ticks={[{ value: flip }, ...TICKS.map((value) => ({ value, label: fmt.pct(value, 0) }))]}
        disabled={disabled}
      />
      <div className="av4-paper-foot">
        <p className="av4-paper-readout" data-av4-readout="" data-ahead={paperNumbers(kit, v, cap).cMinusA > 0 ? "A" : "C"} aria-hidden="true">
          {paperReadout(pack, fmt, kit, v, cap)}
        </p>
        <GlasButton variant="plain" size="compact" onClick={() => onChange(past)} disabled={disabled} aria-label={fmt.t(p.notchJump, { flip: fmt.pct(flip, 2) })} data-av4-flip="">
          <span className="av4-notch-mark" aria-hidden="true" />
          {fmt.t(p.notch, { flip: fmt.pct(flip, 2) })}
        </GlasButton>
      </div>
    </div>
  );
}
