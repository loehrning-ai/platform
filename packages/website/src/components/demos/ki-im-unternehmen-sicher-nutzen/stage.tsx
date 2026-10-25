"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import { sendFrame } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import type { Span } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/redact";
import type { Hit, Placeholder } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import type { AccountId, Light } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { LightGlyph } from "./glyphs";
import { Handle } from "./handle";
import { HitCard } from "./hit-card";

export const fill = (template: string, values: Readonly<Record<string, string | number>>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

export interface StageView {
  readonly text: string;
  readonly hits: readonly Hit[];
  readonly kept: ReadonlySet<string>;
  readonly placeholders: readonly Placeholder[];
  readonly slots: ReadonlyMap<string, number>;
  /** Detector hits the handle can still black out. */
  readonly n: number;
  /** The value the handle shows: the visitor's p plus the hint's lean. */
  readonly shown: number;
  /** What still goes along: the counter. */
  readonly counter: number;
  readonly steps: boolean;
  readonly settle: number;
  readonly closed: boolean;
  /** The rest scan and the unlock button are shown (not during the first beat). */
  readonly payoff: boolean;
  /** The limits line is drawn; its space is held before that. */
  readonly limits: boolean;
  /** The visitor's own text, not a sample: names without a title are always the open question. */
  readonly own: boolean;
  readonly rest: number;
  readonly doneCount: number;
  readonly stops: readonly number[];
  readonly sent: boolean;
  readonly sendT: number;
  /** Values that would fly in a send: kept and not yet blacked out. */
  readonly chips: readonly { readonly id: string; readonly value: string }[];
  /** Company names with a legal form that no hit covers: flagged next to the Rest-Scan. */
  readonly companies: number;
  readonly who: string | null;
  readonly canUndo: boolean;
  /** Capitalised word pairs no hit covers: names the detector cannot know. */
  readonly skipped: number;
  readonly nameSpans: readonly Span[];
  readonly account: AccountId;
  /** The light and its short reason: the account half of slide 7, felt next to the handle. */
  readonly light: Light;
  readonly lightWord: string;
  readonly lightReason: string;
}

interface Props {
  readonly copy: DemoPack;
  readonly view: StageView;
  readonly rootRef: RefObject<HTMLElement | null>;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly onTouch: () => void;
  readonly onChange: (p: number) => void;
  readonly onRelease: (p: number) => void;
  readonly onWord: (span: Span) => void;
  readonly onKeep: (id: string) => void;
  readonly onUndo: () => void;
  readonly onSend: () => void;
  readonly onReset: () => void;
  readonly onUnlock: () => void;
  readonly onAccount: (account: AccountId) => void;
}

const ACCOUNTS: readonly AccountId[] = ["personal", "team", "enterprise"];

const MAX_CHIPS = 8;
const chipLabel = (value: string) => (value.length > 26 ? `${value.slice(0, 25)}…` : value).replace(/\s+/g, " ");

interface Offset {
  readonly dx: number;
  readonly dy: number;
}

/**
 * Where each chip starts: on the raw detail it is made from, in the card above.
 * Measured once, in the layout effect of the tap that sends (before paint), as
 * the vector from the chip's own slot in the strip to that detail. The flight
 * is then translate(vector * away): a pure function of the send clock, each
 * chip from its own origin to its own slot, so none can sit on another.
 */
function useChipOrigins(sent: boolean, chips: StageView["chips"], root: RefObject<HTMLElement | null>) {
  const slots = useRef<(HTMLLIElement | null)[]>([]);
  const [origins, setOrigins] = useState<readonly Offset[]>([]);
  useLayoutEffect(() => {
    if (!sent) {
      setOrigins([]);
      return;
    }
    const sources = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-hit-id]") ?? []);
    setOrigins(
      chips.slice(0, MAX_CHIPS).map((chip, index) => {
        const from = sources.find((el) => el.dataset.hitId === chip.id)?.getBoundingClientRect();
        const to = slots.current[index]?.getBoundingClientRect();
        return from && to ? { dx: from.left - to.left, dy: from.top - to.top } : { dx: 0, dy: -120 };
      }),
    );
    // Measured once per send: the handle is disabled while sent, so the chips cannot change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent]);
  return { slots, origins };
}

/**
 * The hero: the counter of what goes along, the text as a card, the SENDEN
 * line, the handle. Everything on it is a pure function of the handle's p
 * (and, for a practice send, of sendT), so a finger can scrub it both ways.
 */
export function Stage({ copy, view, rootRef, inputRef, onTouch, onChange, onRelease, onWord, onKeep, onUndo, onSend, onReset, onUnlock, onAccount }: Props) {
  const ui = copy.stage;
  /** Zero is only "nothing" when no unflagged name may be left: otherwise it is a count of patterns, not a verdict. */
  const unsure = view.counter === 0 && view.skipped > 0;
  const label = unsure ? ui.counterCheck : view.counter === 0 ? ui.counterNone : view.counter === 1 ? ui.counterOne : ui.counterMany;
  const settled = view.settle >= 1;
  const { slots: slotRefs, origins } = useChipOrigins(view.sent, view.chips, rootRef);
  const shown = view.chips.slice(0, MAX_CHIPS);
  const shut = sendFrame(view.sendT);
  const more = view.chips.length - MAX_CHIPS;
  /** One tick per detail that is still on the raw side of the line; hollow ticks are the ones already blacked out. */
  const ticksTotal = Math.min(view.n + view.kept.size, 12);
  const ticksLive = Math.min(view.counter, ticksTotal);
  const askNames = view.skipped > 0 || view.own;
  const empty = view.chips.length === 0;
  /** Any pointer or key event on the stage ends the intro and the idle hint at once. */
  const trap = (_event: PointerEvent) => onTouch();
  const hush = view.sent ? shut.hush : 0;

  return (
    <section ref={rootRef} className="w05-stage" style={{ "--hush": hush } as CSSProperties} aria-label={copy.own.heading} onPointerDownCapture={trap} onKeyDownCapture={onTouch}>
      <div className="w05-counter-row">
        <div className="w05-counter" role="group" aria-label={view.counter === 0 && !unsure ? ui.counterNone : `${view.counter} ${label}`}>
          <span className="w05-digit" key={view.counter} aria-hidden="true">{view.counter}</span>
          <span className="w05-counter-label" data-zero={view.counter === 0 && !unsure ? "" : undefined} data-unsure={unsure ? "" : undefined} aria-hidden="true">{label}</span>
        </div>
        {view.canUndo ? (
          <button type="button" className="w05-btn w05-btn-small" onClick={onUndo}>{ui.undo}</button>
        ) : null}
      </div>

      <div className="w05-card">
        <HitCard
          text={view.text}
          hits={view.hits}
          kept={view.kept}
          placeholders={view.placeholders}
          slots={view.slots}
          n={view.n}
          p={view.shown}
          steps={view.steps}
          nameSpans={view.nameSpans}
          copy={copy}
          describedBy="w05-limits"
          onWord={onWord}
          onKeep={onKeep}
          onLeave={() => inputRef.current?.focus()}
        />
      </div>

      <div className="w05-gate" data-sent={view.sent ? "" : undefined} data-live={ticksLive > 0 ? "" : undefined}>
        <div className="w05-send-line">
          <span className="w05-send-word" aria-hidden="true">{ui.line}</span>
          <span className="w05-caption">{ui.caption}</span>
          <span className="w05-ticks" aria-hidden="true" data-live={ticksLive > 0 ? "" : undefined}>
            {Array.from({ length: ticksTotal }, (_, index) => (
              <span key={index} className="w05-tick" data-live={index < ticksLive ? "" : undefined} />
            ))}
          </span>
          <span className="w05-send-rule" aria-hidden="true">
            <span className="w05-send-shut" style={{ transform: `scaleX(${view.sent ? shut.line : 0})` }} />
          </span>
        </div>
      </div>

      <Handle
        id="w05-handle"
        label={ui.handle}
        value={view.shown}
        valueText={fill(ui.valueText, { done: view.doneCount, total: view.n })}
        disabled={view.sent}
        closed={view.closed}
        lockText={`${ui.lock} ${view.closed ? ui.lockClosed : ui.lockOpen}`}
        stops={view.stops}
        quantized={view.steps}
        inputRef={inputRef}
        onChange={onChange}
        onRelease={onRelease}
      />

      <div className="w05-acct">
        <div className="w05-segment w05-segment-small" role="radiogroup" aria-label={copy.own.account}>
          {ACCOUNTS.map((id) => (
            <label key={id} className="w05-choice">
              <input type="radio" name="w05-account" checked={view.account === id} onChange={() => onAccount(id)} />
              <span>{copy.own.accountsShort[id]}</span>
            </label>
          ))}
        </div>
        <p className="w05-chip-verdict" data-light={view.light} data-verdict-chip="">
          <LightGlyph light={view.light} />
          <span><strong>{view.lightWord}</strong> {view.lightReason}</span>
        </p>
      </div>

      <div className="w05-status">
        {view.sent ? (
          <div className="w05-chat">
            {empty ? null : (
              <ul className="w05-chips" aria-label={copy.send.strip}>
                {shown.map((chip, index) => {
                  const frame = sendFrame(view.sendT);
                  const origin = origins[index];
                  return (
                    <li
                      key={`${index}:${chip.id}`}
                      ref={(el) => {
                        slotRefs.current[index] = el;
                      }}
                      className="w05-chip-slot"
                      style={{ "--ghost": frame.ghost } as CSSProperties}
                    >
                      <span
                        className="w05-send-chip"
                        style={{
                          opacity: origin ? 1 : 0,
                          transform: origin ? `translate(${(origin.dx * frame.away).toFixed(1)}px, ${(origin.dy * frame.away).toFixed(1)}px)` : undefined,
                        }}
                      >
                        {chipLabel(chip.value)}
                      </span>
                    </li>
                  );
                })}
                {more > 0 ? <li className="w05-send-more">{fill(copy.send.more, { n: more })}</li> : null}
              </ul>
            )}
            <p className="w05-chat-title">{empty ? copy.send.stripEmpty : copy.send.strip}</p>
            <p className="w05-latch">{empty ? copy.send.latchEmpty : copy.send.latch}</p>
            <button type="button" className="w05-btn" onClick={onReset}>{copy.send.reset}</button>
          </div>
        ) : (
          <div className="w05-send-row">
            <button type="button" className="w05-btn" onClick={onSend}>{copy.send.button}</button>
            <span className="w05-send-note">{copy.send.note}</span>
          </div>
        )}
        {view.payoff && view.settle > 0 ? (
          <div className="w05-payoff" style={{ opacity: view.settle }}>
            <div className="w05-rest-block" aria-hidden={!settled}>
              <p className="w05-rest">{fill(ui.restScan, { n: view.rest })}</p>
              {view.companies > 0 ? <p className="w05-name-hint" data-company-hint="">{fill(ui.companyHint, { n: view.companies })}</p> : null}
              {askNames ? <p className="w05-name-hint" data-name-hint="">{view.own && view.skipped === 0 ? ui.nameHintOwn : ui.nameHint}</p> : null}
            </div>
            <button type="button" className="w05-btn w05-btn-primary w05-unlock" inert={!settled} onClick={onUnlock}>
              {ui.unlock}
            </button>
          </div>
        ) : null}
        <p id="w05-limits" className="w05-limits" data-on={view.limits ? "" : undefined}>{ui.limits}</p>
        {view.who ? <p className="w05-example">{fill(ui.example, { who: view.who })}</p> : null}
      </div>
    </section>
  );
}
