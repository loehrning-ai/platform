"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ESCAPE_PRIORITY, GLAS_PRIORITY, GlasButton, GlasPanel, pushEscapeLayer } from "@/components/demos/glas";
import type { CardAction, CardState } from "@/lib/demo-cases/esg-berichte-mit-ki/card-state";
import { cardVerdict, needsHelp } from "@/lib/demo-cases/esg-berichte-mit-ki/card-state";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { EXPIRED_DAYS } from "@/lib/demo-cases/esg-berichte-mit-ki/figures";
import { BIO, STICHTAG } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import type { Status } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { PARTS, THREADS, type PartId } from "@/lib/demo-cases/esg-berichte-mit-ki/threads";
import { curve, Loupe, threadPath, useAnchors, useConnectDrag, type DragState } from "./connect";
import { DocCard, type LineMark } from "./doc-card";
import { FieldDrawing, RulerDrawing } from "./drawings";
import type { Fmt } from "./fmt";
import { StatusGlyph } from "./glyph";

export interface CardFace {
  /** The claim as printed: the kit's wording, or the bench's safe wording. */
  readonly claim: ReactNode;
  /** Changes when the wording changes, so the text crossfades. */
  readonly claimKey?: string;
  readonly place: string;
  readonly stichtag: string;
  readonly status: Status | null;
  readonly statusLabel?: string;
}

/**
 * The shelf card as a real object: a light card with the claim, where it
 * goes and the Stichtag chip. Its three parts carry handles while quotes are
 * connected; "strip" keeps only the handles, so the certificate gets the room.
 */
export function ShelfCard({
  pack,
  face,
  layout,
  handles,
  picking,
  linked,
  handleProps,
  registerHandle,
}: {
  readonly pack: Pack;
  readonly face: CardFace;
  readonly layout: "full" | "strip";
  readonly handles: boolean;
  readonly picking?: PartId | null;
  readonly linked?: Readonly<Partial<Record<PartId, Status>>>;
  readonly handleProps?: (part: PartId) => Record<string, unknown>;
  readonly registerHandle?: (part: PartId) => (node: HTMLElement | null) => void;
}) {
  return (
    <article className="w4-card" data-layout={layout} data-w4-card="" aria-label={pack.card.kicker}>
      {layout === "full" ? (
        <>
          <p className="w4-card-kicker">
            <span>{pack.card.kicker}</span>
            {face.status && face.statusLabel ? (
              <span className="w4-card-status" data-w4-card-status={face.status}>
                <StatusGlyph status={face.status} label={face.statusLabel} size={20} />
              </span>
            ) : null}
          </p>
          <p key={face.claimKey} className="w4-card-claim" data-w4-claim="">
            {face.claim}
          </p>
          <p className="w4-card-place">{face.place}</p>
          <p className="w4-card-chip">{face.stichtag}</p>
        </>
      ) : null}
      {handles ? (
        <div className="w4-handles" role="group" aria-label={pack.connect.instruction[1]}>
          {PARTS.map((part) => {
            const status = linked?.[part];
            return (
              <button
                key={part}
                type="button"
                className="w4-handle"
                ref={registerHandle?.(part)}
                data-w4-handle={part}
                data-state={picking === part ? "picking" : status ? "linked" : undefined}
                aria-pressed={picking === part}
                aria-label={status ? undefined : pack.card.connect.replace("{part}", part === "stichtag" ? face.stichtag : pack.card.parts[part])}
                {...(handleProps?.(part) ?? {})}
              >
                <span className="w4-handle-dot" aria-hidden="true" />
                <span className="w4-handle-text">{part === "stichtag" ? face.stichtag : pack.card.parts[part]}</span>
                {status ? <StatusGlyph status={status} label={pack.statuses[status]} size={16} /> : null}
              </button>
            );
          })}
          {layout === "strip" && face.status && face.statusLabel ? (
            <span className="w4-card-status" data-w4-card-status={face.status} data-pop="">
              <StatusGlyph status={face.status} label={face.statusLabel} size={20} />
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/** An empty document slot: the name of the document that belongs here. */
export function DocSlot({ kicker, name, filled = false, children }: { readonly kicker: string; readonly name: string; readonly filled?: boolean; readonly children?: ReactNode }) {
  return (
    <div className="w4-slot" data-filled={filled ? "" : undefined} data-w4-slot="">
      <span className="w4-slot-kicker">{kicker}</span>
      <span className="w4-slot-name">{name}</span>
      {children}
    </div>
  );
}

function readoutFor(
  pack: Pack,
  fmt: Fmt,
  state: CardState,
  onShow: (part: PartId) => void,
): { key: string; body: ReactNode } | null {
  const last = state.last;
  // While a new part is being connected, the dock's caption says which line to find.
  if (state.picking && (!last || last.part !== state.picking)) return null;
  if (!last) return null;
  if (!last.accepted) {
    const hints = pack.connect.hints[last.part] as Readonly<Record<string, string>>;
    const hint = hints[String(last.line)] ?? fmt.t(pack.connect.picking, { part: pack.card.parts[last.part] });
    return {
      key: `miss-${last.part}-${last.line}-${state.misses[last.part]}`,
      body: (
        <>
          <p>{hint}</p>
          {needsHelp(state, last.part) ? (
            <GlasButton variant="fill" size="compact" onClick={() => onShow(last.part)} data-w4-show-line="">
              {pack.connect.showLine}
            </GlasButton>
          ) : null}
        </>
      ),
    };
  }
  const sentences = fmt.ts(pack.connect.readouts[last.part], { days: EXPIRED_DAYS });
  const slot = THREADS[last.part].slot;
  return {
    key: `land-${last.part}`,
    body: (
      <>
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
        {last.part === "flaeche" ? (
          <figure className="w4-readout-figure" aria-label={pack.connect.field}>
            <FieldDrawing outline="all" cellarLabel={pack.connect.cellar} pulse />
          </figure>
        ) : null}
        {last.part === "stichtag" ? (
          <figure className="w4-readout-figure" aria-label={pack.connect.ruler}>
            <RulerDrawing
              stichtag={STICHTAG}
              gapLabel={fmt.t(pack.connect.gap, { days: EXPIRED_DAYS })}
              dates={{ from: fmt.date(BIO.validFrom), until: fmt.date(BIO.validUntil), pin: fmt.date(STICHTAG) }}
            />
          </figure>
        ) : null}
        {slot ? <DocSlot kicker={pack.connect.missingDoc} name={pack.connect.slots[slot]} /> : null}
      </>
    ),
  };
}

/**
 * Scene 1: the shelf card over the certificate. Beat 1 shows both at rest
 * (the guess is in the dock); beat 2 collapses the card into its handles and
 * the visitor connects each part to a line.
 */
export function CardScene({
  pack,
  fmt,
  kit,
  state,
  dispatch,
  connecting,
  reducedMotion,
  onDragChange,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly state: CardState;
  readonly dispatch: (action: CardAction) => void;
  readonly connecting: boolean;
  readonly reducedMotion: boolean;
  readonly onDragChange?: (drag: DragState<PartId> | null) => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const verdict = cardVerdict(state);
  const { anchors, register } = useAnchors(container, [state.links, state.picking, connecting, verdict]);
  const { drag, handlers } = useConnectDrag<PartId>({
    container,
    onLand: (part, line) => dispatch({ type: "land", part, line }),
    onTap: (part, keyboard) => {
      dispatch({ type: "pick", part: state.picking === part ? null : part });
      if (keyboard) {
        // Keyboard: the first line takes the focus, ArrowUp and ArrowDown move on.
        requestAnimationFrame(() => container.current?.querySelector<HTMLButtonElement>("button[data-w4-line]")?.focus());
      }
    },
    onDragChange,
  });

  // A tap on a line while a part is picked connects it.
  const picking = connecting && (state.picking !== null || drag !== null);

  useEffect(() => {
    if (!state.picking) return;
    const part = state.picking;
    // Escape cancels the pick first, before the shell's own Escape.
    return pushEscapeLayer(ESCAPE_PRIORITY.popover, () => {
      dispatch({ type: "pick", part: null });
      container.current?.querySelector<HTMLButtonElement>(`[data-w4-handle="${part}"]`)?.focus();
    });
  }, [dispatch, state.picking]);

  const linked: Partial<Record<PartId, Status>> = {};
  const marks: Record<number, LineMark> = {};
  for (const part of PARTS) {
    const line = state.links[part];
    if (line === undefined) continue;
    const status = THREADS[part].status;
    linked[part] = status;
    marks[line] = { status, label: fmt.t(pack.card.connected, { part: pack.card.parts[part], n: line, status: pack.statuses[status] }) };
  }
  const glowPart = state.last && !state.last.accepted && needsHelp(state, state.last.part) ? state.last.part : null;
  const readout = connecting ? readoutFor(pack, fmt, state, (part) => dispatch({ type: "show", part })) : null;
  // On a phone the readout floats over the certificate's lower lines; "Schließen" puts it away until the next one.
  const [closedKey, setClosedKey] = useState<string | null>(null);
  const shownReadout = readout && readout.key !== closedKey ? readout : null;
  const face: CardFace = {
    claim: kit.claim.text,
    place: kit.claim.place,
    stichtag: fmt.t(pack.card.stichtag, { date: fmt.date(STICHTAG) }),
    status: verdict,
    statusLabel: verdict ? fmt.t(pack.card.status, { status: pack.statuses[verdict] }) : undefined,
  };
  // While connecting (and after the verdict) the card is its handles, so the certificate keeps its room.
  const layout = connecting ? "strip" : "full";

  return (
    <div ref={container} className="w4-s1" data-connecting={connecting ? "" : undefined} data-layout={layout} data-motion={reducedMotion ? "reduced" : undefined} data-w4-scene="karte">
      <div className="w4-s1-card">
        <ShelfCard
          pack={pack}
          face={face}
          layout={layout}
          handles={connecting}
          picking={state.picking}
          linked={linked}
          registerHandle={(part) => register(`handle:${part}`)}
          handleProps={(part) => ({ ...handlers(part) })}
        />
      </div>
      <div className="w4-s1-doc">
        <DocCard
          name={kit.certificate.name}
          subtitle={kit.invented}
          lines={kit.certificate.lines.filter((line) => line.n > 2)}
          marks={marks}
          glow={glowPart ? THREADS[glowPart].target : null}
          hot={drag?.line ?? null}
          picking={picking}
          pickLabel={(line) => `${fmt.t(pack.connect.pickLine, { n: line.n })}: ${line.text}`}
          onPick={(n) => {
            if (state.picking) dispatch({ type: "land", part: state.picking, line: n });
          }}
          lineRef={(n) => register(`line:${n}`)}
        />
      </div>
      <svg className="w4-threads" aria-hidden="true" focusable="false">
        {PARTS.map((part, lane) => {
          const line = state.links[part];
          const from = anchors[`handle:${part}`];
          const to = line === undefined ? undefined : anchors[`line:${line}`];
          if (!from || !to || !connecting) return null;
          return <path key={part} d={threadPath(from, to, lane)} className="w4-thread" data-status={THREADS[part].status} />;
        })}
        {drag && anchors[`handle:${drag.part}`] ? <path d={curve(anchors[`handle:${drag.part}`] as { x: number; y: number }, drag.at)} className="w4-thread" data-live="" /> : null}
      </svg>
      {drag && drag.line !== null ? (
        <Loupe at={drag.at}>
          <span className="w4-loupe-n">{drag.line}</span> {kit.certificate.lines.find((line) => line.n === drag.line)?.text}
        </Loupe>
      ) : null}
      {shownReadout ? (
        <GlasPanel key={shownReadout.key} material="regular" shape="card" live={GLAS_PRIORITY.readout} className="w4-readout" data-w4-readout="" data-pop="">
          <GlasButton variant="icon" size="compact" icon="close" label={pack.close} onClick={() => setClosedKey(shownReadout.key)} className="w4-readout-close" data-w4-readout-close="" />
          <div className="w4-readout-body" aria-live="polite">
            {shownReadout.body}
          </div>
        </GlasPanel>
      ) : null}
    </div>
  );
}
