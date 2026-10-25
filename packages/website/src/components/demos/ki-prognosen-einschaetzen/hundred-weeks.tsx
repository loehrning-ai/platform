"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CASE_AXIS,
  CASE_SUPPLY,
  CASE_WEEKS,
  DEFAULT_RATIO,
  LAUNCH_INDEX,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/case";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import {
  fill,
  formatNumber,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/format";
import {
  GHOST_FROM,
  INTRO_MS,
  introFrame,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/intro";
import {
  axisDomain,
  computeStats,
  interpolateBand,
  scenarios,
  shortCount,
  type Band,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/quantile";
import { buildTakeaways } from "@/lib/demo-cases/ki-prognosen-einschaetzen/texts";
import {
  followSupply,
  supplyRelation,
  validateOwn,
  type FieldError,
  type FieldName,
  type OwnCase,
  type RawCase,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/validate";
import { scrollNeeded, whenScrollSettled } from "./arrive";
import { Counter, SnapChips, WeekStrip, Waage, type Chip } from "./controls";
import { makeFrame } from "./geometry";
import { LineHandle } from "./line-handle";
import { OwnCase as OwnCaseForm } from "./own-case";
import { MiniBar } from "./mini-bar";
import { PatternDefs, StaircaseChart, type Detent } from "./staircase-chart";
import { TakeawayBlocks } from "./takeaways";
import {
  useProgress,
  useReducedMotion,
  useVisibility,
  useWidth,
} from "./use-seek";

type Phase = "static" | "wait" | "intro" | "live";
type Layer = 1 | 2 | 3;

const WEEK_MS = 500;
const SCRUB_RELEASE_MS = 200;
const IDLE_REVEAL_MS = 8000;
const ANNOUNCE_MS = 450;
/** Chart heights: the desktop chart is at least 640 x 460 (a projector read), the phone one leaves room for the counter above it. */
const DESKTOP_CHART = 470;
const PHONE_CHART = 300;
/** How long after the last touch outside the chart the mini bar may stay, unless a control still has focus. */
const ENGAGED_MS = 2500;
/** The count-in starts when this share of the chart is on screen: nobody should miss it below the fold. */
const ARRIVE = 0.6;
/** After hydration the empty frame waits this long (the count-in starts once 60% of the chart is in view). */
const HOLD_MS = 250;
/** Back in view without being touched: the ghost hand plays again, at most this many times. */
const REPLAYS_ON_RETURN = 2;

const ease = (x: number) => x * x * (3 - 2 * x);
const CASE_BAND = CASE_WEEKS[LAUNCH_INDEX] as Band;

function initialFields(locale: "de" | "en"): RawCase {
  const n = (value: number) => formatNumber(value, locale);
  return {
    p10: n(CASE_BAND.p10),
    p50: n(CASE_BAND.p50),
    p90: n(CASE_BAND.p90),
    supply: n(CASE_SUPPLY),
    ratio: String(DEFAULT_RATIO),
    unit: "",
  };
}

function Legend({
  copy,
  request,
}: {
  readonly copy: DemoPack;
  readonly request: number | null;
}) {
  const id = useId().replace(/:/g, "");
  const n = (value: number) => formatNumber(value, copy.locale);
  const swatch = (fillValue: string, extra = "") => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        width="16"
        height="16"
        fill={fillValue}
        className={`hw-sw ${extra}`}
      />
    </svg>
  );
  return (
    <>
      <svg
        width="0"
        height="0"
        className="hw-defs"
        aria-hidden="true"
        focusable="false"
      >
        <PatternDefs id={id} />
      </svg>
      <ul className="hw-legend" aria-hidden="true">
        <li>
          {swatch(`url(#${id}-hatch)`)}
          {copy.chart.legend.short}
        </li>
        <li>
          {swatch("var(--hw-ink)")}
          {copy.chart.legend.enough}
        </li>
        <li>
          {swatch(`url(#${id}-dots)`)}
          {copy.chart.legend.left}
        </li>
        {request !== null ? (
          <li>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              aria-hidden="true"
              focusable="false"
            >
              <line x1="0" x2="16" y1="8" y2="8" className="hw-request" />
            </svg>
            {fill(copy.chart.request, { n: n(request) })}
          </li>
        ) : null}
      </ul>
    </>
  );
}

export function HundredWeeks({ copy }: { readonly copy: DemoPack }) {
  const locale = copy.locale;
  const n = (value: number) => formatNumber(value, locale);
  const reduced = useReducedMotion();

  // The case: the workshop week, or the visitor's own numbers.
  const [fields, setFields] = useState<RawCase>(() => initialFields(locale));
  const [errors, setErrors] = useState<readonly FieldError[]>([]);
  const [valid, setValid] = useState<OwnCase>({
    band: CASE_BAND,
    supply: CASE_SUPPLY,
    ratio: DEFAULT_RATIO,
    unit: "",
  });
  const [source, setSource] = useState<"workshop" | "own">("workshop");
  /** The stock follows the forecast: it sat outside the visitor's range and was moved. */
  const [supplyMoved, setSupplyMoved] = useState(false);
  const supplyEdited = useRef(false);
  /** The visitor moved the line themselves (handle, keys or a chip). */
  const capTouched = useRef(false);
  const own = source === "own";
  const fieldsRef = useRef(fields);
  const lastField = useRef<FieldName>("p50");
  const engagedTimer = useRef<number | undefined>(undefined);

  // The week: committed position, plus a tween while it moves to a new one.
  const [w, setW] = useState(LAUNCH_INDEX);
  const [tween, setTween] = useState<{
    from: number;
    to: number;
    ms: number;
    key: number;
  } | null>(null);
  const tweenRef = useRef(tween);
  tweenRef.current = tween;
  const tweenP = useProgress(
    tween ? tween.key : null,
    tween?.ms ?? WEEK_MS,
    useCallback(() => {
      const finished = tweenRef.current;
      if (finished) setW(finished.to);
      setTween(null);
    }, []),
  );
  const wShown = tween
    ? tween.from + (tween.to - tween.from) * ease(tweenP)
    : w;

  // Intro, cap and layers.
  const [phase, setPhase] = useState<Phase>("static");
  const [introFrom, setIntroFrom] = useState(0);
  const [introRun, setIntroRun] = useState(0);
  const interacted = useRef(false);
  const wasOut = useRef(false);
  const returns = useRef(0);
  const [capLive, setCapLive] = useState(CASE_SUPPLY);
  const [layer, setLayer] = useState<Layer>(1);
  const [announce, setAnnounce] = useState("");
  const [engaged, setEngaged] = useState(false);
  const [snapKey, setSnapKey] = useState(0);
  const [stageRef] = useVisibility<HTMLDivElement>(0);
  /** The answer is the count: the mini bar stands in only while it is off screen. */
  const [counterRef, counterSeen] = useVisibility<HTMLDivElement>(0);
  const [arriveRef, arrive] = useVisibility<HTMLDivElement>(ARRIVE);
  /** The page has brought the chart into the first screen (or did not need to). */
  const [placed, setPlaced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [chartRef, width] = useWidth<HTMLDivElement>(358);
  const announceTimer = useRef<number | undefined>(undefined);
  const mountedAt = useRef(0);

  const progress = useProgress(
    phase === "intro" ? introRun : null,
    (1 - introFrom) * INTRO_MS,
    useCallback(() => {
      setCapLive(CASE_SUPPLY);
      setPhase("live");
    }, []),
  );
  // Before the count-in the page shows its first frame (nothing counted yet),
  // so there is no finished picture that resets to zero.
  const P = phase === "wait" ? 0 : introFrom + (1 - introFrom) * progress;

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);
  useEffect(() => {
    if (reduced === null) return;
    if (reduced) {
      setPhase("live");
      setLayer(3);
    } else setPhase((current) => (current === "static" ? "wait" : current));
  }, [reduced]);
  const play = useCallback((from: number) => {
    setIntroFrom(from);
    setIntroRun((run) => run + 1);
    setPhase("intro");
  }, []);
  // Until the chart is on screen the page shows the finished picture (76 of
  // 100), never an empty frame; the count-in starts once most of the chart is
  // in view, and not before the finished picture has been there for HOLD_MS.
  useEffect(() => {
    if (phase !== "wait") return;
    let userMoved = false;
    let stopWatching = () => {};
    const mark = () => {
      userMoved = true;
    };
    const events = ["wheel", "touchstart", "keydown"] as const;
    for (const name of events)
      window.addEventListener(name, mark, { passive: true });
    const wait = Math.max(0, HOLD_MS - (performance.now() - mountedAt.current));
    const timer = window.setTimeout(() => {
      const chart = stageRef.current;
      const counter = counterRef.current;
      const dy = chart && counter && !userMoved ? scrollNeeded(chart, counter) : 0;
      if (dy < 8) {
        setPlaced(true);
        return;
      }
      window.scrollBy({ top: dy, behavior: "smooth" });
      stopWatching = whenScrollSettled(() => setPlaced(true));
    }, wait);
    return () => {
      window.clearTimeout(timer);
      stopWatching();
      for (const name of events) window.removeEventListener(name, mark);
    };
  }, [phase, stageRef, counterRef]);
  useEffect(() => {
    if (phase !== "wait" || !placed || !arrive.enough) return;
    play(0);
  }, [phase, placed, arrive.enough, play]);
  // Scrolled away and back without touching anything: the ghost hand shows it again.
  useEffect(() => {
    if (phase !== "live" || reduced !== false) return;
    if (!arrive.enough) {
      wasOut.current = true;
      return;
    }
    if (
      wasOut.current &&
      !interacted.current &&
      returns.current < REPLAYS_ON_RETURN
    ) {
      wasOut.current = false;
      returns.current += 1;
      play(GHOST_FROM);
    }
  }, [phase, arrive.enough, reduced, play]);
  useEffect(
    () => () => {
      window.clearTimeout(announceTimer.current);
      window.clearTimeout(engagedTimer.current);
    },
    [],
  );

  const reveal = useCallback(
    (to: Layer) => {
      setLayer((current) => {
        if (to <= current) return current;
        const { announceLayer2, announceLayer3 } = copy.controls;
        setAnnounce(
          to === 2
            ? announceLayer2
            : current === 1
              ? `${announceLayer2}. ${announceLayer3}`
              : announceLayer3,
        );
        return to;
      });
    },
    [copy.controls],
  );

  useEffect(() => {
    if (phase !== "live" || layer === 3) return;
    const timer = window.setTimeout(
      () => reveal(layer === 1 ? 2 : 3),
      IDLE_REVEAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase, layer, reveal]);

  // The data behind this frame.
  const week = own ? null : interpolateBand(CASE_WEEKS, wShown);
  const band: Band = week ?? valid.band;
  const request = week ? week.request : null;
  const supply = own ? valid.supply : CASE_SUPPLY;
  const { ratio, unit } = valid;
  const samples = useMemo(
    () => scenarios({ p10: band.p10, p50: band.p50, p90: band.p90 }),
    [band.p10, band.p50, band.p90],
  );

  const intro = phase === "intro" || phase === "wait";
  const frame0 = intro
    ? introFrame(P, null, Math.round(band.p50), supply)
    : null;
  const cap = frame0 ? frame0.cap : capLive;
  const scanned = frame0 ? frame0.visible : 100;

  const domain = own ? axisDomain(samples, supply) : CASE_AXIS;
  const frame = makeFrame(
    width,
    width >= 520 ? DESKTOP_CHART : PHONE_CHART,
    domain,
  );
  const stats = computeStats(samples, cap, ratio, band);
  const short = frame0 ? shortCount(samples, cap, scanned) : stats.short;
  const optimum = Math.round(stats.optimum);

  const bestValue = layer >= 2 ? optimum : null;
  const detents = useMemo<Detent[]>(
    () => [
      {
        id: "today",
        value: Math.round(supply),
        name: copy.chart.detents.today,
      },
      {
        id: "forecast",
        value: Math.round(band.p50),
        name: copy.chart.detents.forecast,
      },
      { id: "p90", value: Math.round(band.p90), name: copy.chart.detents.p90 },
      ...(bestValue !== null
        ? [
            {
              id: "best" as const,
              value: bestValue,
              name: copy.chart.detents.best,
            },
          ]
        : []),
    ],
    [supply, band.p50, band.p90, bestValue, copy.chart.detents],
  );
  const chips: Chip[] = detents.map((detent) => ({
    id: detent.id,
    name: copy.controls.chipNames[detent.id],
    value: detent.value,
    short: shortCount(samples, detent.value),
  }));

  // Takeaways follow the settled line, never the intro ghost.
  const takeCap = phase === "live" ? Math.round(capLive) : supply;
  const texts = useMemo(
    () =>
      buildTakeaways(copy, {
        band: { p10: band.p10, p50: band.p50, p90: band.p90 },
        cap: takeCap,
        ratio,
        unit,
        weighted: layer >= 2,
      }),
    [copy, band.p10, band.p50, band.p90, takeCap, ratio, unit, layer],
  );

  const scheduleAnnounce = useCallback(
    (value: number, delay: number) => {
      window.clearTimeout(announceTimer.current);
      announceTimer.current = window.setTimeout(
        () =>
          setAnnounce(
            fill(copy.controls.announce, { n: shortCount(samples, value) }),
          ),
        delay,
      );
    },
    [copy.controls.announce, samples],
  );

  // Visitor input.
  const touch = useCallback(() => {
    interacted.current = true;
    if (phase === "intro") {
      setCapLive(
        Math.round(introFrame(P, null, Math.round(band.p50), supply).cap),
      );
      setPhase("live");
    } else if (phase === "wait") setPhase("live");
  }, [phase, P, band.p50, supply]);

  const setCap = useCallback(
    (next: number, final: boolean) => {
      interacted.current = true;
      capTouched.current = true;
      const detent = detents.some((item) => item.value === next);
      setCapLive((previous) => {
        if (previous !== next && detent) setSnapKey((key) => key + 1);
        return next;
      });
      if (Math.round(next) !== Math.round(cap)) reveal(2);
      if (final) scheduleAnnounce(next, ANNOUNCE_MS);
    },
    [cap, detents, reveal, scheduleAnnounce],
  );

  const pickChip = (chip: Chip) => {
    touch();
    capTouched.current = true;
    setCapLive(chip.value);
    setSnapKey((key) => key + 1);
    reveal(2);
    scheduleAnnounce(chip.value, 0);
  };

  const pickRatio = (next: number) => {
    interacted.current = true;
    setFields((current) => ({ ...current, ratio: String(next) }));
    fieldsRef.current = { ...fieldsRef.current, ratio: String(next) };
    setValid((current) => ({ ...current, ratio: next }));
    setErrors((current) => current.filter((error) => error.field !== "ratio"));
    // The first tap on the Waage brings the week strip (layer 3).
    reveal(3);
  };

  const goToWeek = (index: number, ms = WEEK_MS) => {
    interacted.current = true;
    reveal(3);
    if (reduced) {
      setTween(null);
      setW(index);
      return;
    }
    setTween((current) => ({
      from: current ? wShown : w,
      to: index,
      ms,
      key: (current?.key ?? 0) + 1,
    }));
  };
  const scrubWeek = (value: number) => {
    interacted.current = true;
    reveal(3);
    setTween(null);
    setW(value);
  };

  // Every keystroke is judged at once (cheap and pure): a valid case moves the
  // chart on the spot, an invalid one keeps the last valid chart and says why
  // under the field that is being edited. An emptied field stays quiet until
  // the visitor leaves it.
  const judge = useCallback(
    (raw: RawCase, field: FieldName, leaving: boolean) => {
      const result = validateOwn(raw, locale);
      if (!result.ok) {
        const edited = raw[field].trim() === "";
        setErrors(
          result.errors
            .map((error) =>
              // The order error belongs to the range field being edited.
              error.key === "order" &&
              (field === "p10" || field === "p50" || field === "p90")
                ? { ...error, field }
                : error,
            )
            .filter(
              (error) =>
                leaving || !(edited && error.field === field && error.key === "number"),
            ),
        );
        return;
      }
      setErrors([]);
      setValid(result.value);
      interacted.current = true;
      if (
        field === "p10" ||
        field === "p50" ||
        field === "p90" ||
        field === "supply"
      ) {
        setSource("own");
        setTween(null);
        setPhase("live");
        // The Lager field is the stock itself: the line goes there. A range
        // edit moves the line only while the visitor has not set it.
        if (field === "supply" || !capTouched.current)
          setCapLive(Math.round(result.value.supply));
      }
    },
    [locale],
  );

  const changeField = (field: FieldName, text: string) => {
    let next = { ...fieldsRef.current, [field]: text };
    if (field === "supply") {
      supplyEdited.current = true;
      setSupplyMoved(false);
    } else if (
      !supplyEdited.current &&
      (field === "p10" || field === "p50" || field === "p90")
    ) {
      // The stock follows the new forecast while it would sit outside the range.
      const moved = followSupply(next, locale);
      if (moved !== null) next = { ...next, supply: moved };
      setSupplyMoved(moved !== null);
    }
    fieldsRef.current = next;
    lastField.current = field;
    setFields(next);
    judge(next, field, false);
  };

  const leaveField = () => judge(fieldsRef.current, lastField.current, true);

  const reset = () => {
    capTouched.current = false;
    const initial = initialFields(locale);
    fieldsRef.current = initial;
    supplyEdited.current = false;
    setSupplyMoved(false);
    setFields(initial);
    setErrors([]);
    setValid({
      band: CASE_BAND,
      supply: CASE_SUPPLY,
      ratio: DEFAULT_RATIO,
      unit: "",
    });
    setSource("workshop");
    setTween(null);
    setW(LAUNCH_INDEX);
    setCapLive(CASE_SUPPLY);
    setPhase("live");
  };

  const cells = CASE_WEEKS.map((item, index) => ({
    label: copy.controls.stripCells[index] as string,
    short: shortCount(scenarios(item), cap),
  }));

  const rounded = Math.round(cap);
  // The mini bar shows only while the count is off screen AND the visitor is
  // working a control (focus or a tap); it leaves ENGAGED_MS after the last
  // touch unless a control outside the chart still has focus.
  const controlFocused = () => {
    const active = document.activeElement;
    return Boolean(
      active &&
        active !== document.body &&
        rootRef.current?.contains(active) &&
        !stageRef.current?.contains(active),
    );
  };
  const armEngaged = () => {
    window.clearTimeout(engagedTimer.current);
    engagedTimer.current = window.setTimeout(() => {
      if (controlFocused()) armEngaged();
      else setEngaged(false);
    }, ENGAGED_MS);
  };
  const keepInView = (event: { target: EventTarget }) => {
    if (stageRef.current?.contains(event.target as Node)) return;
    setEngaged(true);
    armEngaged();
  };

  const supplyNote: "moved" | "far" | null = !own
    ? null
    : supplyMoved
      ? "moved"
      : supplyRelation(valid.band, valid.supply) === "far"
        ? "far"
        : null;

  return (
    <div
      ref={rootRef}
      className="hw"
      data-hw=""
      data-phase={phase}
      data-layer={layer}
      data-source={source}
      onFocusCapture={keepInView}
      onPointerDownCapture={keepInView}
    >
      <p className="hw-sr" role="status" aria-live="polite" data-hw-status="">
        {announce}
      </p>

      {engaged && !counterSeen.any ? (
        <MiniBar
          copy={copy}
          samples={samples}
          cap={cap}
          short={short}
          domain={domain}
          display={n(rounded)}
        />
      ) : null}

      <div className="hw-grid">
        <div className="hw-left">
          <div ref={stageRef} className="hw-stage">
            <div ref={arriveRef}>
              <div ref={chartRef} className="hw-chart" data-hw-chart="">
                <StaircaseChart
                  copy={copy}
                  frame={frame}
                  samples={samples}
                  band={band}
                  cap={cap}
                  short={short}
                  scanned={scanned}
                  detents={detents}
                  request={request}
                  lo={domain[0]}
                  showAxisTag={domain[0] > 0}
                  snapKey={snapKey}
                />
                <LineHandle
                  frame={frame}
                  cap={cap}
                  detents={detents.map((detent) => detent.value)}
                  label={copy.controls.sliderLabel}
                  hint={copy.controls.sliderHint}
                  valueText={fill(copy.controls.sliderValue, {
                    cap: n(rounded),
                    n: short,
                  })}
                  display={n(rounded)}
                  ghost={Boolean(frame0?.ghostVisible)}
                  onChange={setCap}
                  onTouch={touch}
                />
              </div>
            </div>
          </div>
          <div className="hw-under">
            <Legend copy={copy} request={request} />
            {reduced === true ? null : (
              <button
                type="button"
                className="hw-btn hw-replay"
                data-hw-replay=""
                onClick={() => {
                  interacted.current = false;
                  returns.current = 0;
                  setCapLive(Math.round(supply));
                  play(0);
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M3 2.5v11l10-5.5z" fill="currentColor" />
                </svg>
                {copy.controls.replay}
              </button>
            )}
          </div>
          {layer >= 3 && !own ? (
            <WeekStrip
              copy={copy}
              cells={cells}
              w={wShown}
              onScrub={scrubWeek}
              onPick={(index) => goToWeek(index)}
              onRelease={(value) =>
                goToWeek(Math.round(value), SCRUB_RELEASE_MS)
              }
            />
          ) : null}
        </div>

        <div className="hw-right">
          <div ref={counterRef} className="hw-counter-slot">
            <Counter
              copy={copy}
              short={short}
              own={own}
              stats={layer >= 2 ? stats : null}
              settled={scanned >= 100}
            />
          </div>
          <SnapChips copy={copy} chips={chips} cap={cap} onPick={pickChip} />
          {layer >= 2 ? (
            <Waage
              copy={copy}
              ratio={ratio}
              optimum={stats.optimum}
              stats={stats}
              onPick={pickRatio}
            />
          ) : null}
          <div className="hw-notes">
            <p className="hw-note">
              {copy.chart.xCaption} {copy.chart.tailCue} {copy.chart.assumption}
            </p>
            <p className="hw-footnote">{copy.chart.footnote}</p>
          </div>
        </div>
      </div>

      <OwnCaseForm
        copy={copy}
        fields={fields}
        errors={errors}
        supplyNote={supplyNote}
        onChange={changeField}
        onReset={reset}
        onCommit={leaveField}
      />
      <TakeawayBlocks copy={copy} texts={texts} />
    </div>
  );
}
