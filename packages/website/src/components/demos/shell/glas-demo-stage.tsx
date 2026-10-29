"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { GLAS_PRIORITY } from "@/components/demos/glas/budget";
import { GlasButton } from "@/components/demos/glas/button";
import { GlasChip } from "@/components/demos/glas/chip";
import { GlasStage } from "@/components/demos/glas/feld";
import type { Feld } from "@/components/demos/glas/feld-math";
import { DemoIntro } from "@/components/demos/glas/intro";
import { GlasGroup, GlasPanel } from "@/components/demos/glas/panel";
import { GlasWeg } from "@/components/demos/glas/weg";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import type { GlasTone } from "@/lib/glas";
import { useBeatClock } from "./beat-clock";
import { useDemoV4Page } from "./demo-v4-context";

/** How long the intro card takes to materialize out before it unmounts. */
const INTRO_LEAVE_MS = 320;

/**
 * Where keyboard focus goes when the intro leaves: the stage itself (tabindex -1, out of the tab
 * order). The next Tab reaches the picture's first control, then the dock, never the page below;
 * the arrow keys keep driving the clock, because no slider or button owns them yet.
 */
export function focusStage(stage: HTMLElement): void {
  if (!stage.hasAttribute("tabindex")) stage.setAttribute("tabindex", "-1");
  stage.focus({ preventScroll: true });
}

/**
 * The v4 stage (Glas): the field, the demo's data, the caption on glass, the
 * dock, and, before "Starten", the intro card over the living field. The
 * demo draws `children` as a pure function of the clock (beat, progress,
 * phase) and its own state; the stage never fades or filters (it is the
 * backdrop root). "Von vorn" sits top right, the same as r and Shift+R.
 */
export function DemoGlasStage({
  label,
  feld,
  children,
  caption,
  dock,
  className,
  style,
  readingTone,
  restartInDock,
}: {
  /** Accessible name of the stage (what the picture shows). */
  readonly label: string;
  /** The field under everything: feldFor(plakat, positions) from @/components/demos/glas. */
  readonly feld: Feld;
  /** The data layer: chart, table or document, drawn from the kit. */
  readonly children: ReactNode;
  /** What just happened and why it matters (language-standard B.6), two or three sentences. */
  readonly caption?: ReactNode;
  /** The dock: <DemoDock> with this beat's controls. */
  readonly dock?: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  /**
   * The tone of the reading surfaces (intro card and caption) when it differs
   * from the stage's: "hell" puts light reading glass over a dark field, while
   * the dock keeps the stage tone.
   */
  readonly readingTone?: GlasTone;
  /** The demo's dock carries "Von vorn" (<DemoDock restart>): nothing floats over the top right of the stage. */
  readonly restartInDock?: boolean;
}) {
  const clock = useBeatClock();
  const page = useDemoV4Page();
  const copy = DEMOS_PAGE_COPY[clock.locale].v4;
  const headingId = useId();
  const inIntro = clock.phase === "intro";
  // The last beat ends with the Claude window the page hands in, above the demo's own take-home.
  const finale = !inIntro && clock.beat.kind === "takehome" && page.claude ? page.claude : null;
  const [introMounted, setIntroMounted] = useState(inIntro);
  const dataRef = useRef<HTMLDivElement | null>(null);
  const wasIntro = useRef(inIntro);

  // Leaving the intro unmounts the focused "Starten": hand focus to the demo, not to <body>.
  useEffect(() => {
    const left = wasIntro.current && !inIntro;
    wasIntro.current = inIntro;
    if (!left) return;
    const frame = requestAnimationFrame(() => {
      const stage = dataRef.current?.closest<HTMLElement>("[data-demo-stage]");
      if (!stage) return;
      const active = document.activeElement;
      if (active && active !== document.body && !active.closest(".demo4-intro-layer")) return;
      focusStage(stage);
    });
    return () => cancelAnimationFrame(frame);
  }, [inIntro]);

  useEffect(() => {
    if (inIntro) {
      setIntroMounted(true);
      return;
    }
    if (clock.reducedMotion) {
      setIntroMounted(false);
      return;
    }
    const timer = setTimeout(() => setIntroMounted(false), INTRO_LEAVE_MS);
    return () => clearTimeout(timer);
  }, [clock.reducedMotion, inIntro]);

  return (
    <GlasStage
      as="figure"
      feld={feld}
      tone={page.stageTone}
      label={label}
      stageRef={clock.registerStage}
      className={cx("demo4-stage", className)}
      style={style}
      data-demo-stage=""
      data-demo-phase={clock.phase}
      data-demo-finale={finale ? "" : undefined}
    >
      <div ref={dataRef} className="demo4-data" data-demo-data="" inert={inIntro || undefined}>
        {finale}
        {children}
      </div>
      {!inIntro && caption ? (
        <GlasPanel material="regular" tone={readingTone} live={GLAS_PRIORITY.caption} className="demo4-caption" data-demo-caption="" aria-live="polite">
          {caption}
        </GlasPanel>
      ) : null}
      {dock ? <div className="demo4-dock-slot" inert={inIntro || undefined}>{dock}</div> : null}
      {!inIntro && !restartInDock ? (
        <GlasPanel material="thin" shape="capsule" live={false} className="demo4-restart">
          <GlasButton
            variant="icon"
            size="compact"
            icon="replay"
            label={copy.restart}
            onClick={clock.restart}
            disabled={clock.rewinding}
            aria-keyshortcuts="R Shift+R"
            data-demo-restart=""
          />
        </GlasPanel>
      ) : null}
      {introMounted ? (
        <div className="demo4-intro-layer" data-leaving={inIntro ? undefined : ""}>
          <DemoIntro
            content={page.intro}
            headingId={headingId}
            leaving={!inIntro}
            tone={readingTone}
            onStart={clock.start}
            onExplore={clock.explore}
          />
        </div>
      ) : null}
    </GlasStage>
  );
}

/**
 * The dock (one glass surface, Apple's GlassEffectContainer): the guided path
 * with "Zurück" and "Weiter", then this beat's controls as fills. In free
 * play the path collapses into "Zur Führung". It rises when the intro leaves.
 */
export function DemoDock({
  children,
  label,
  className,
  compact,
  step,
  nextLabel,
  restart,
  stepOf,
  lead,
}: {
  readonly children?: ReactNode;
  readonly label?: string;
  readonly className?: string;
  /**
   * On a phone, keeps the dock to one path row and the controls: the step
   * sentence, the "Vorschlag übernommen" chip and the slider's label line
   * become screen-reader text, and "Weiter" drops the next step's name, for
   * a demo whose caption and chart already say all of it.
   */
  readonly compact?: boolean;
  /** The sentence under the path for an inner step ("Jetzt der Preis je Karton.", never a second count); default: the beat's step. */
  readonly step?: ReactNode;
  /** The next button's label while an inner step takes the press ("Weiter: die Einheit"); default: the next beat. */
  readonly nextLabel?: string;
  /** "Von vorn" at the end of the path row (with <DemoGlasStage restartInDock>). */
  readonly restart?: boolean;
  /** Names the dot count when a demo counts its own steps inside the beats ("Teil 6 von 8"). */
  readonly stepOf?: (n: number, total: number) => string;
  /** Content above the path row (a demo's caption line or its prediction). */
  readonly lead?: ReactNode;
}) {
  const clock = useBeatClock();
  const copy = DEMOS_PAGE_COPY[clock.locale].v4;
  const countOf = stepOf ?? copy.stepOf;
  const locale = clock.locale;
  const steps = clock.beats.map((beat) => ({ id: beat.id, label: beat.label[locale] }));
  const nextBeat = clock.beats[clock.index + 1];
  const stepSentence = step ?? clock.beat.step?.[locale] ?? `${clock.beat.label[locale]}.`;
  const nextText = nextLabel ?? (nextBeat?.nextName ? copy.nextTo(nextBeat.nextName[locale]) : copy.next);
  return (
    <GlasGroup
      label={label ?? copy.wegNav}
      material="regular"
      shape="card"
      appear={clock.phase === "intro" ? "out" : "in"}
      className={cx("demo4-dock", compact && "is-compact", className)}
      data-demo-lever=""
    >
      {lead}
      <GlasWeg
        steps={steps}
        current={clock.index}
        doneUpTo={clock.index + (clock.beatDone ? 1 : 0)}
        sentence={
          <>
            <span className="sr-only">{countOf(clock.index + 1, steps.length)}: </span>
            {stepSentence}
          </>
        }
        onJump={(index) => clock.seek(index)}
        onPrev={clock.prev}
        onNext={clock.next}
        nextReady={clock.beatDone}
        canNext={clock.index < clock.beats.length - 1 || nextLabel !== undefined}
        free={clock.phase === "free"}
        onToGuide={clock.toGuide}
        copy={{ stepOf: countOf, prev: copy.prev, next: nextText, nextShort: compact ? copy.next : undefined, toGuide: copy.toGuide, nav: copy.wegNav }}
        trailing={
          restart && clock.phase !== "intro" ? (
            <GlasButton
              variant="icon"
              size="compact"
              icon="replay"
              label={copy.restart}
              onClick={clock.restart}
              disabled={clock.rewinding}
              aria-keyshortcuts="R Shift+R"
              className="demo4-dock-restart"
              data-demo-restart=""
            />
          ) : undefined
        }
      />
      {clock.skippedCommit && clock.phase === "guided" && clock.beats[clock.index - 1]?.kind === "commit" ? (
        <p className="demo4-skipped">
          <GlasChip kind="status">{copy.suggestionTaken}</GlasChip>
        </p>
      ) : null}
      {children ? <div className="demo4-dock-controls">{children}</div> : null}
    </GlasGroup>
  );
}
