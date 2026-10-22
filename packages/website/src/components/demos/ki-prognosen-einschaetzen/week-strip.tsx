import type { Outcome } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import type { StampKey } from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import { OutcomeGlyph } from "./glyphs";

export interface WeekSlot {
  readonly outcome: Outcome;
  readonly stamp: StampKey;
}

interface Props {
  readonly slots: readonly (WeekSlot | null)[];
  /** Index of today's morning, or null on the result. */
  readonly today: number | null;
  /** A slot whose stamp is still in flight: its glyph appears on landing. */
  readonly landing?: number | null;
  readonly copy: ForecastCopy;
  readonly id?: string;
}

/** The week as a record: seven slots, past stamps, today marked. */
export function WeekStrip({ slots, today, landing = null, copy, id }: Props) {
  const m = copy.mornings;
  return (
    <ol className="fr-week" aria-label={m.weekLabel} id={id}>
      {slots.map((slot, i) => {
        const state = slot ? m.stamps[slot.stamp] : i === today ? m.slotToday : m.slotOpen;
        return (
          <li
            key={i}
            className="fr-slot"
            data-slot={i}
            data-outcome={slot?.outcome}
            data-today={i === today ? "" : undefined}
            aria-current={i === today ? "step" : undefined}
          >
            <span className="fr-slot-day" aria-hidden="true">
              {i + 1}
            </span>
            {slot ? (
              <span className="fr-slot-mark" aria-hidden="true" style={landing === i ? { opacity: 0 } : undefined}>
                <OutcomeGlyph outcome={slot.outcome} />
              </span>
            ) : null}
            <span className="sr-only">{m.slotName(i + 1, state)}</span>
          </li>
        );
      })}
    </ol>
  );
}
