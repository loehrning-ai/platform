"use client";

import { GlasButton, GlasSlider } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import type { CostRow } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import { paperNumbers } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stage";
import { paperReadout } from "./captions";
import type { Fmt } from "./fmt";

const TICKS = [0, 3, 5, 7, 10] as const;
/** The top of both tracks: the paper rise the kit plays through, in per cent. */
export const PAPER_MAX = 10;

/**
 * Beat 3: the paper rise at offer C, 0 to 10 % in steps of 0,1, and, once the rise has passed the
 * turning point, a second track of the same width for the cap: the highest rise Brandtwerk would pay
 * a surcharge on. The turning point is a tick of its own with a button that jumps to it. No tween
 * while dragging: the bars follow the value as it is. The negotiation email opens from here.
 */
export function PaperSlider({
  pack,
  fmt,
  kit,
  v,
  cap,
  flip,
  showCap,
  onChange,
  onCap,
  onMail,
  disabled,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly kit: readonly CostRow[];
  readonly v: number;
  readonly cap: number | null;
  readonly flip: number;
  /** The cap track appears once the rise has passed the turning point. */
  readonly showCap: boolean;
  readonly onChange: (v: number) => void;
  readonly onCap?: (cap: number) => void;
  readonly onMail?: () => void;
  readonly disabled?: boolean;
}) {
  const p = pack.papier;
  const readout = (value: number) => (value > 0 ? paperReadout(pack, fmt, kit, value, cap) : "");
  const short = (value: number) => fmt.t(p.short, { v: fmt.pct(value, 1) });
  const capShort = (value: number) => fmt.t(p.capShort, { cap: fmt.pct(value, 1) });
  // The jump lands on the first tenth past the turning point, so A is cheaper there.
  const past = Math.ceil(flip * 10) / 10;
  const ahead = paperNumbers(kit, v, cap).cMinusA > 0 ? "A" : "C";
  return (
    <div className="av4-paper-control" data-av4-paper="" data-cap={showCap && onCap ? "" : undefined}>
      <GlasSlider
        label={p.slider}
        value={v}
        min={0}
        max={PAPER_MAX}
        step={0.1}
        bigStep={1}
        onChange={onChange}
        format={short}
        valueText={(value) => fmt.t(p.value, { v: fmt.pct(value, 1) })}
        announce={(value) => readout(value) || fmt.t(p.value, { v: fmt.pct(value, 1) })}
        ticks={[{ value: flip }, ...TICKS.map((value) => ({ value, label: fmt.pct(value, 0) }))]}
        disabled={disabled}
      />
      <p className="av4-paper-readout" data-av4-readout="" data-ahead={ahead} aria-hidden="true">
        {v > 0 ? paperReadout(pack, fmt, kit, v, cap) : p.readoutZero}
      </p>
      {showCap && onCap ? (
        <div className="av4-cap-track" data-av4-cap="">
          <GlasSlider
            label={p.capLabel}
            value={cap ?? PAPER_MAX}
            min={0}
            max={PAPER_MAX}
            step={0.1}
            bigStep={1}
            onChange={onCap}
            format={capShort}
            valueText={(value) => fmt.t(p.capSlider, { cap: fmt.pct(value, 1) })}
            ticks={[{ value: flip }, ...TICKS.map((value) => ({ value }))]}
            disabled={disabled}
          />
        </div>
      ) : null}
      <div className="av4-paper-foot">
        <GlasButton variant="plain" size="compact" onClick={() => onChange(past)} disabled={disabled} aria-label={fmt.t(p.notchJump, { flip: fmt.pct(flip, 2) })} data-av4-flip="">
          <span className="av4-notch-mark" aria-hidden="true" />
          {fmt.t(p.notch, { flip: fmt.pct(flip, 2) })}
        </GlasButton>
        {onMail && showCap ? (
          <GlasButton variant="fill" size="compact" icon="doc" onClick={onMail} data-av4-mail-open="">
            {p.mail}
          </GlasButton>
        ) : null}
      </div>
    </div>
  );
}
