"use client";

import { ArrowGlyph, cx } from "@/components/werk";
import {
  LIGHTS,
  fmt,
  initialState,
  judge,
  type LocalScene,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import { commitFrames, dialFrame, revealFrame } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import type { W05Text } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import type { DialState, Light, RouteKey } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { DeviceGlyph, LightGlyph, LightLabel } from "./glyphs";
import { RouteStrip } from "./route-strip";
import type { SceneRun } from "./store";
import { WhatIf } from "./what-if";

interface Props {
  readonly scene: LocalScene;
  readonly run: SceneRun;
  readonly text: W05Text;
  /** Commit timeline t (reveal, then slot drop). */
  readonly commitT: number;
  /** Dial change t. */
  readonly dialT: number;
  readonly dialChanged: readonly RouteKey[];
  /** Which moment moved last: the route strip shows only that one. */
  readonly lastMoment: "reveal" | "dial";
  readonly onCommit: (light: Light) => void;
  readonly onDial: (dial: DialState) => void;
  readonly onNext: (() => void) | null;
}

export function sceneHeadingId(id: string): string {
  return `w05-${id}-heading`;
}
export function verdictHeadingId(id: string): string {
  return `w05-${id}-verdict`;
}

/**
 * One scene: who pastes what where, three lamps to commit, then the verdict,
 * the route and the dials. The attempt comes before the key; what a scene has
 * shown, it keeps showing.
 */
export function SceneCard({
  scene,
  run,
  text,
  commitT,
  dialT,
  dialChanged,
  lastMoment,
  onCommit,
  onDial,
  onNext,
}: Props) {
  const copy = text.ui;
  const start = initialState(scene);
  const startAccount = text.accounts[start.account];
  const startDevice = scene.devices[start.account] ?? "browser";
  const deviceWord = text.deviceWord[startDevice];
  const committed = run.picked !== null;
  const verdict = run.picked ? judge(scene, run.picked) : null;
  const reveal = revealFrame(lastMoment === "reveal" ? commitFrames(commitT).reveal : 1);
  const dialFrameNow = dialFrame(lastMoment === "dial" ? dialT : 1, dialChanged);
  const packetX = lastMoment === "dial" ? dialFrameNow.packet.x : reveal.packet.x;
  const nowDevice = scene.devices[run.dial.account] ?? startDevice;
  const legendId = `w05-${scene.id}-ask`;

  return (
    <article
      id={scene.id}
      aria-labelledby={sceneHeadingId(scene.id)}
      className="plakat-sage scroll-mt-24 border-2 border-[#1f4a38] p-4 sm:p-6"
      data-scene={scene.id}
      data-committed={committed ? "" : undefined}
    >
      {/* On a laptop the account chip shares the name's line when it fits,
          so the lamps start higher on the first screen. */}
      <div className="lg:flex lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-2">
        <h3
          id={sceneHeadingId(scene.id)}
          tabIndex={-1}
          className="flex flex-wrap items-baseline gap-x-2 text-[#1f4a38]"
        >
          <span className="text-[1.75rem] font-bold leading-none sm:text-[2rem]">{scene.person}</span>
          <span className="text-[0.9375rem] font-semibold">
            · {fmt(copy.progress, { order: scene.order })} · {scene.role}
          </span>
        </h3>

        <p className="mt-2 inline-flex max-w-full items-center gap-2 border-[1.5px] border-[#1f4a38] bg-[var(--color-paper)] px-2.5 py-1.5 text-[0.9375rem] font-semibold leading-snug lg:mt-0">
          <DeviceGlyph device={startDevice} className="size-5" />
          <span>
            {startAccount.label}
            {deviceWord ? ` · ${deviceWord}` : ""}
          </span>
        </p>
      </div>

      <p className="mt-2.5 text-[1.0625rem] leading-snug lg:mt-2">
        <span className="font-bold">{scene.verb}</span> {scene.what}
      </p>
      <p className="mt-2 flex flex-wrap gap-1.5">
        {scene.parts.map((part) => (
          <span
            key={part}
            className="border border-[#1f4a38] bg-[var(--color-inset)] px-1.5 py-0.5 font-mono text-[0.8125rem] font-semibold"
          >
            {part}
          </span>
        ))}
      </p>

      <fieldset className="w05-lamps mt-4 lg:mt-3" aria-describedby={committed ? verdictHeadingId(scene.id) : undefined}>
        <legend id={legendId} className="mb-2 text-[1.0625rem] font-bold">
          {copy.ask}
        </legend>
        <div className="w05-lamps w05-lamps__row">
          {LIGHTS.map((light) => {
            const words = copy.lights[light];
            const isPicked = run.picked === light;
            const isKey = committed && scene.key === light;
            return (
              <button
                key={light}
                type="button"
                className="w05-lamp anti-btn"
                aria-pressed={isPicked}
                aria-disabled={committed ? true : undefined}
                aria-label={`${words.word}: ${words.rule}`}
                data-lamp={light}
                onClick={() => {
                  if (!committed) onCommit(light);
                }}
              >
                <LightGlyph light={light} className="size-9 lg:size-7" />
                <span className="grid gap-0.5">
                  {/* The tags sit on the word's line, so a committed lamp keeps its height. */}
                  <span className="w05-lamp__word">
                    <span className={cx("text-[1.0625rem] font-bold leading-tight", `w05-light-${light}`)}>
                      {words.word}
                    </span>
                    {committed && (isPicked || isKey) ? (
                      <span className="w05-lamp__tags" aria-hidden="true">
                        {isPicked ? <span className="w05-tag">{copy.you}</span> : null}
                        {isKey ? (
                          <span
                            className="w05-tag w05-tag--answer"
                            data-t={reveal.lamp.opacity.toFixed(2)}
                            style={{ opacity: reveal.lamp.opacity, transform: `scale(${reveal.lamp.scale})` }}
                          >
                            {copy.answer}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[0.9375rem] leading-snug">{words.rule}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {committed && verdict && run.picked ? (
        <div className="mt-3 grid gap-3">
          <section aria-labelledby={verdictHeadingId(scene.id)} className="border-2 border-[#1f4a38] bg-[var(--color-paper)] p-3 sm:p-4" data-verdict={verdict.direction}>
            <h4
              id={verdictHeadingId(scene.id)}
              tabIndex={-1}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[1.0625rem]"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold">{copy.you}:</span>
                <LightLabel light={run.picked} copy={copy} glyphClassName="size-5" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold">{copy.answer}:</span>
                <LightLabel light={scene.key} copy={copy} glyphClassName="size-5" />
              </span>
            </h4>
            {/* The class and the reason share a paragraph: one block, not three. */}
            <p className="mt-1.5 text-[1rem] leading-snug">
              <strong className="mr-1.5 text-[1.125rem] font-bold leading-tight" data-direction="">
                {copy.direction[verdict.direction]}
              </strong>
              {scene.reason}
            </p>
            {verdict.line ? (
              <p className="mt-1 text-[1rem] leading-snug text-muted-foreground">{verdict.line}</p>
            ) : null}
            {scene.flag ? (
              <p className="mt-2 border-l-[3px] border-[var(--color-risk-red)] pl-3 text-[0.9375rem] font-semibold leading-snug" data-flag="">
                {scene.flag.text}
              </p>
            ) : null}
            {scene.afterNote ? (
              <p className="mt-2 border-l-[3px] border-[var(--color-bernstein)] pl-3 text-[0.9375rem] leading-snug" data-after-note="">
                {scene.afterNote}
              </p>
            ) : null}
          </section>

          <RouteStrip
            text={text}
            account={run.dial.account}
            device={nowDevice}
            headingId={`w05-${scene.id}-route`}
            packetX={packetX}
            rows={lastMoment === "reveal" ? reveal.rows : { opacity: 1, y: 0 }}
            underline={lastMoment === "dial" ? dialFrameNow.underline : {}}
            t={lastMoment === "reveal" ? commitFrames(commitT).reveal : dialT}
          />

          <WhatIf
            scene={scene}
            text={text}
            dial={run.dial}
            headingId={`w05-${scene.id}-change`}
            onDial={onDial}
          />

          {onNext ? (
            <button type="button" className="w05-btn w05-btn--scene anti-btn w-full sm:w-auto sm:justify-self-start" onClick={onNext} data-next="">
              {copy.next}
              <ArrowGlyph direction="right" className="size-4" />
            </button>
          ) : (
            <a href="#freitag" className="w05-btn w05-btn--scene anti-btn w-full sm:w-auto sm:justify-self-start" data-to-friday="">
              {copy.toFriday}
              <ArrowGlyph direction="down" className="size-4" />
            </a>
          )}
        </div>
      ) : null}
    </article>
  );
}
