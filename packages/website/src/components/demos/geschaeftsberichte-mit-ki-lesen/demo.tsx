"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { derive, prefill, type OwnState } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/compare-state";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { MAX_CUT, MIN_CUT, REPORT_CUT, REVENUES, UNITS, WEEKS, WORKSHOP } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { fill, formatNumber, formatPercent } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import { HANDLE_AT, SLOT, STAGE } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/geometry";
import { calendarShare, clamp, northwind } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import { smoothstep } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/motion";
import { Act2 } from "./act2";
import { DragHandle } from "./drag-handle";
import { Chart, Ruler, numberAt, unitsGrowthAt } from "./stage";
import { SwitchTwo } from "./switch-two";
import { TakeawayCard, type TakeStatus } from "./takeaway-card";
import { useScene } from "./use-scene";
import { YourCompare } from "./your-compare";
import "./demo.css";

const spoken = (pack: DemoPack, fraction: number) => {
  const rounded = Math.round(Math.abs(fraction) * 1000) / 10;
  const sign = rounded === 0 ? "" : fraction < 0 ? pack.spoken.minus : pack.spoken.plus;
  return `${sign} ${formatNumber(rounded, pack.locale, { digits: 1 })} ${pack.spoken.percent}`.trim();
};

function Chevron({ dir }: { readonly dir: "l" | "r" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="22" height="22">
      <path d={dir === "l" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

export default function Demo({ copy }: { readonly copy: DemoPack }) {
  const ctl = useScene();
  const { scene } = ctl;
  const [mode, setMode] = useState<0 | 1>(0);
  const [act2Mode, setAct2Mode] = useState<0 | 1>(0);
  const [act2Used, setAct2Used] = useState(false);
  const [trigger, setTrigger] = useState<number>(WORKSHOP.defaultTriggerPer1000);
  const [visited, setVisited] = useState<readonly number[]>([REPORT_CUT, REPORT_CUT + 1]);
  const [own, setOwn] = useState<OwnState>(() => prefill(copy));
  const [announce, setAnnounce] = useState("");
  const [takeStatus, setTakeStatus] = useState<TakeStatus>(null);
  const [room, setRoom] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  // Where the line is heading, kept in a ref that is written the instant a press lands. The scene only catches up frame
  // by frame, so reading it for "current + step" dropped every press that came before the tween had finished.
  const cutTarget = useRef<number>(REPORT_CUT);
  const plot = useRef<{ id: number; x: number; y: number; touch: boolean; active: boolean } | null>(null);
  const t = copy.stage;
  const ownDerived = useMemo(() => derive(own, copy), [own, copy]);

  // First run. The stage always renders its finished hero state (+26 %, two towers), also on the server, so there is never an
  // empty box. The pass then replays once from its first frame, when the whole chart (columns plus handle) is on screen above
  // the fixed phone nav, or 0,7 s after any part of it is (a desktop chart can sit half below the fold). Reduced motion, no
  // script, no observer, or a touch before it starts: the hero state stays.
  useEffect(() => {
    const node = chartRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const go = () => {
      observer.disconnect();
      clearTimeout(timer);
      ctl.startIntro();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (entry.intersectionRatio >= 0.98) go();
        else if (entry.intersectionRatio > 0) timer ??= setTimeout(go, 700);
        else {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      // The bottom margin keeps the chart clear of the fixed tab bar (56 px) plus 32 px of air.
      { threshold: [0, 0.98], rootMargin: "0px 0px -88px 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("room") === "1") setRoom(true);
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if ((event.key === "r" || event.key === "R") && !event.metaKey && !event.ctrlKey && !event.altKey) setRoom((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const liveFor = useCallback(
    (k: number) =>
      fill(t.live, {
        a: k,
        b: REVENUES.length - k,
        h: spoken(copy, northwind.headline(k)),
        p: spoken(copy, northwind.perUnit(k)),
      }),
    [copy, t.live],
  );

  const settleCut = useCallback(
    (raw: number) => {
      const k = clamp(Math.round(raw), MIN_CUT, MAX_CUT);
      cutTarget.current = k;
      ctl.to("cutF", k, 320);
      setVisited((list) => (list.includes(k) ? list : [...list, k].sort((a, b) => a - b)));
      setAnnounce(liveFor(k));
    },
    [ctl, liveFor],
  );

  const current = Math.round(clamp(scene.cutF, MIN_CUT, MAX_CUT));
  const nudge = (step: number) => {
    ctl.skipIntro();
    const k = clamp(cutTarget.current + step, MIN_CUT, MAX_CUT);
    if (k !== cutTarget.current) settleCut(k);
  };

  // The whole plot is a drag target, not only the handle. A mouse grabs at once; a finger only once the move is mostly
  // horizontal (the SVG keeps touch-action pan-y, so a vertical swipe still scrolls the page and a tap snaps to a week).
  const cutAt = (clientX: number) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return cutTarget.current;
    return clamp((((clientX - rect.left) / rect.width) * STAGE.width - STAGE.pad) / SLOT, MIN_CUT, MAX_CUT);
  };
  const plotDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".mg-handle")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    ctl.skipIntro();
    const touch = event.pointerType !== "mouse";
    plot.current = { id: event.pointerId, x: event.clientX, y: event.clientY, touch, active: false };
    if (!touch) {
      plot.current.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      ctl.to("cutF", Math.round(cutAt(event.clientX)), 160);
      cutTarget.current = Math.round(cutAt(event.clientX));
    }
  };
  const plotMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = plot.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.active) {
      const dx = Math.abs(event.clientX - drag.x);
      const dy = Math.abs(event.clientY - drag.y);
      if (!(dx > 8 && dx > dy)) return;
      drag.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    ctl.set({ cutF: cutAt(event.clientX) });
    cutTarget.current = Math.round(cutAt(event.clientX));
  };
  const plotUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = plot.current;
    if (!drag || drag.id !== event.pointerId) return;
    plot.current = null;
    // Position, not scene: a press without a move has only just started its 160 ms tween.
    if (event.type === "pointerup") settleCut(cutAt(event.clientX));
    else if (drag.active) settleCut(ctl.read().cutF);
  };
  const changeMode = (value: 0 | 1) => {
    ctl.skipIntro();
    setMode(value);
    ctl.to("m", value, 720);
    setAnnounce(liveFor(current));
  };
  const changeAct2 = (value: 0 | 1) => {
    ctl.skipIntro();
    setAct2Mode(value);
    if (value === 1) setAct2Used(true);
    ctl.to("u", value, 720);
  };

  const value = numberAt(scene);
  // Reduced motion states the surprise as a pair (+26 % | -20 %). Only until the first input: after that the number is the
  // one the line stands on, never a stale second value (the stack is 0 until the visitor, or the pass, has moved anything).
  const pairOn = scene.s === 0 && scene.m === 0 && scene.cutF === REPORT_CUT;
  const hNow = northwind.headline(current);
  const pNow = northwind.perUnit(current);
  const share = calendarShare(hNow, pNow);
  const extra = REVENUES.length - 2 * current;
  const stamp =
    hNow > 0 && share !== null
      ? fill(extra === 1 ? t.stampOne : t.stampMany, { s: Math.round(share * 100), n: copy.numWords[extra] ?? extra })
      : mode === 1
        ? fill(t.stampPerNeg, { p: formatPercent(pNow, copy.locale, { digits: 1 }), h: formatPercent(hNow, copy.locale, { digits: 0 }) })
        : t.stampNeg;
  const span = northwind.span();
  const rulerAlt = fill(t.rulerAlt, {
    a: formatNumber(span.head[0] * 100, copy.locale, { digits: 1, sign: true }),
    b: formatNumber(span.head[1] * 100, copy.locale, { digits: 1, sign: true }),
    c: formatNumber(span.per[0] * 100, copy.locale, { digits: 1, sign: true }),
    d: formatNumber(span.per[1] * 100, copy.locale, { digits: 1, sign: true }),
  });
  const cutBase = Math.floor(clamp(scene.cutF, MIN_CUT, MAX_CUT));
  const cutFrac = clamp(scene.cutF, MIN_CUT, MAX_CUT) - cutBase;
  const cutNext = cutFrac > 0.02 ? cutBase + 1 : cutBase;
  const labelFor = (k: number) => fill(t.weeks, { a: k, b: REVENUES.length - k });
  // The label crosses over with the number: both read the same cutF, so they never disagree mid-flip.
  const labelMix = cutFrac > 0.02 ? smoothstep(0.35, 0.65, cutFrac) : 0;
  const handleText = fill(mode === 0 ? t.handleValue : t.handleValuePer, {
    k: current,
    h: spoken(copy, hNow),
    p: spoken(copy, pNow),
  });
  const withTick = (patch: Partial<OwnState>) => setOwn((previous) => ({ ...previous, ...patch }));

  return (
    <div className="mg" data-room={room ? "" : undefined} data-mode={mode}>
        <section className="mg-card mg-stage" aria-label={t.region} onPointerDownCapture={ctl.skipIntro}>
          <div className="mg-stage-inner">
            <div className="mg-main">
              <div className="mg-hero">
                <div className="mg-numrow">
                  <p className="mg-number" data-testid="giant-number" data-neg={value < 0 ? "" : undefined} aria-hidden="true">
                    <span>{formatPercent(value, copy.locale, { auto: true })}</span>
                    {pairOn && <span className="mg-alt">{` | ${formatPercent(northwind.headline(REPORT_CUT + 1), copy.locale, { auto: true })}`}</span>}
                  </p>
                  <div className="mg-numside">
                    <p className="mg-ask" data-flash={scene.ask > 0.5 ? "" : undefined}>{t.ask}</p>
                    <p className="mg-sub">{t.sub}</p>
                    <p className="mg-units-note" style={{ opacity: smoothstep(0.5, 1, scene.m) }}>
                      {fill(t.unitsNote, { x: formatPercent(unitsGrowthAt(scene), copy.locale, { digits: 1 }) })}
                    </p>
                  </div>
                </div>
                <div
                  className="mg-chart mg-plot"
                  ref={chartRef}
                  onPointerDown={plotDown}
                  onPointerMove={plotMove}
                  onPointerUp={plotUp}
                  onPointerCancel={plotUp}
                >
                  <Chart scene={scene} pack={copy} />
                  <DragHandle
                    at={(STAGE.pad + scene.cutF * SLOT) / STAGE.width}
                    top={HANDLE_AT}
                    label={t.handleLabel}
                    min={MIN_CUT}
                    max={MAX_CUT}
                    now={current}
                    valueText={handleText}
                    pulse={scene.pulse}
                    onStart={ctl.skipIntro}
                    onDrag={(fraction) => {
                      const raw = clamp((fraction * STAGE.width - STAGE.pad) / SLOT, MIN_CUT, MAX_CUT);
                      cutTarget.current = Math.round(raw);
                      ctl.set({ cutF: raw });
                    }}
                    onDragEnd={() => settleCut(ctl.read().cutF)}
                    onKey={(key) => {
                      ctl.skipIntro();
                      const step = key === "ArrowLeft" || key === "ArrowDown" || key === "PageDown" ? -1 : key === "ArrowRight" || key === "ArrowUp" || key === "PageUp" ? 1 : 0;
                      if (step !== 0) nudge(step);
                      else if (key === "Home") settleCut(MIN_CUT);
                      else if (key === "End") settleCut(MAX_CUT);
                      else return false;
                      return true;
                    }}
                  />
                </div>
              </div>
              <div className="mg-cutbar">
                <button type="button" className="mg-btn mg-icon-btn" aria-label={t.nudgeL} disabled={current <= MIN_CUT} onClick={() => nudge(-1)}>
                  <Chevron dir="l" />
                </button>
                <p className="mg-weeks" data-testid="weeks-label">
                  <span style={{ opacity: cutNext === cutBase ? 1 : 1 - labelMix }}>{labelFor(cutBase)}</span>
                  {cutNext !== cutBase && <span className="mg-weeks-next" aria-hidden="true" style={{ opacity: labelMix }}>{labelFor(cutNext)}</span>}
                </p>
                <button type="button" className="mg-btn mg-icon-btn" aria-label={t.nudgeR} disabled={current >= MAX_CUT} onClick={() => nudge(1)}>
                  <Chevron dir="r" />
                </button>
              </div>
            </div>
            <div className="mg-side">
              <SwitchTwo id="mg-mode" label={t.switchLabel} options={[t.sw1, t.sw2]} value={mode} onChange={changeMode} />
              <div className="mg-rulerwrap">
                <Ruler scene={scene} visited={visited} pack={copy} />
              </div>
              <div className="mg-slot" data-armed={scene.m >= 0.5 ? "" : undefined}>
                <p className="mg-hint-line" aria-hidden={mode === 1} style={{ opacity: 1 - smoothstep(0.1, 0.5, scene.m) }}>{t.hint}</p>
                <p className="mg-stamp" aria-hidden={mode === 0} style={{ opacity: smoothstep(0.7, 1, scene.m) }}>{stamp}</p>
              </div>
              <p className="mg-note">{`${t.rulerCap} ${t.minWeeks} ${t.attr}`}</p>
              <button type="button" className="mg-btn mg-room-toggle" aria-pressed={room} onClick={() => setRoom((v) => !v)}>
                {t.room}
              </button>
            </div>
          </div>
          <p className="mg-sr" role="img" aria-label={rulerAlt} />
          <p className="mg-sr" aria-live="polite" data-testid="live">{announce}</p>
          <table className="mg-sr">
            <caption>{t.tableCaption}</caption>
            <thead>
              <tr>{t.tableHead.map((head) => <th key={head} scope="col">{head}</th>)}</tr>
            </thead>
            <tbody>
              {WEEKS.map((week, index) => (
                <tr key={week.start}>
                  <th scope="row">{week.start}</th>
                  <td>{formatNumber(REVENUES[index] ?? 0, copy.locale)}</td>
                  <td>{formatNumber(UNITS[index] ?? 0, copy.locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {/* Two columns on a desktop (finding + sentence | your numbers + rules), one on a phone, where CSS order puts the sentence
            right after Dein Vergleich and the long rules file last. */}
        <div className="mg-colL">
          <Act2
            scene={scene}
            pack={copy}
            mode={act2Mode}
            trigger={trigger}
            onMode={changeAct2}
            onTrigger={setTrigger}
            onStart={ctl.skipIntro}
          />
          <TakeawayCard pack={copy} facts={ownDerived.facts} trigger={trigger} withDefects={act2Used} part="text" status={takeStatus} onStatus={setTakeStatus} />
        </div>
        <div className="mg-colR">
          <YourCompare
            pack={copy}
            own={own}
            derived={ownDerived}
            onChange={withTick}
            onReplace={setOwn}
            onStart={ctl.skipIntro}
          />
          <TakeawayCard pack={copy} facts={ownDerived.facts} trigger={trigger} withDefects={act2Used} part="rules" status={takeStatus} onStatus={setTakeStatus} />
        </div>
    </div>
  );
}
