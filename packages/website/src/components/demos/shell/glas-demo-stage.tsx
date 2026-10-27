"use client";

import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
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
import { useBeatClock } from "./beat-clock";
import { useDemoV4Page } from "./demo-v4-context";

/** How long the intro card takes to materialize out before it unmounts. */
const INTRO_LEAVE_MS = 320;

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
}) {
  const clock = useBeatClock();
  const page = useDemoV4Page();
  const copy = DEMOS_PAGE_COPY[clock.locale].v4;
  const headingId = useId();
  const inIntro = clock.phase === "intro";
  const [introMounted, setIntroMounted] = useState(inIntro);

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
    >
      <div className="demo4-data" data-demo-data="" inert={inIntro || undefined}>
        {children}
      </div>
      {!inIntro && caption ? (
        <GlasPanel material="regular" live={GLAS_PRIORITY.caption} className="demo4-caption" data-demo-caption="" aria-live="polite">
          {caption}
        </GlasPanel>
      ) : null}
      {dock ? <div className="demo4-dock-slot" inert={inIntro || undefined}>{dock}</div> : null}
      {!inIntro ? (
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
  step,
  nextLabel,
}: {
  readonly children?: ReactNode;
  readonly label?: string;
  readonly className?: string;
  /** The sentence under the path for an inner step ("Feld 2 von 5: die Einheit."); default: the beat's step. */
  readonly step?: ReactNode;
  /** The next button's label while an inner step takes the press ("Weiter: die Einheit"); default: the next beat. */
  readonly nextLabel?: string;
}) {
  const clock = useBeatClock();
  const copy = DEMOS_PAGE_COPY[clock.locale].v4;
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
      className={cx("demo4-dock", className)}
      data-demo-lever=""
    >
      <GlasWeg
        steps={steps}
        current={clock.index}
        doneUpTo={clock.index + (clock.beatDone ? 1 : 0)}
        sentence={
          <>
            <span className="sr-only">{copy.stepOf(clock.index + 1, steps.length)}: </span>
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
        copy={{ stepOf: copy.stepOf, prev: copy.prev, next: nextText, toGuide: copy.toGuide, nav: copy.wegNav }}
      />
      {clock.skippedCommit && clock.phase === "guided" ? (
        <p className="demo4-skipped">
          <GlasChip kind="status">{copy.suggestionTaken}</GlasChip>
        </p>
      ) : null}
      {children ? <div className="demo4-dock-controls">{children}</div> : null}
    </GlasGroup>
  );
}
