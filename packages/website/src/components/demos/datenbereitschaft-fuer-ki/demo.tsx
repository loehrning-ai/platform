"use client";

import "./demo.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FOLDLINE } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { formatNumber } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import { DEFAULT_WIDTH, PHONE_HEIGHT } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/geometry";
import { EMPTY_FIELDS, readFields, type Fields } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/input";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";
import { INTRO_MS, introAt, OWN_MS, ownAt, sceneAt } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/scene";
import { exampleSeries, formatters, type OpId, type Reading, type Series } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/series";
import { fill, joinList } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";
import { Head } from "./head";
import { Lever } from "./lever";
import { defaultOp, Operators } from "./operators";
import { OwnNumbers } from "./own-numbers";
import { SceneSvg } from "./scene";
import { ScalePair } from "./scale-pair";
import { TakeBlocks } from "./take-blocks";
import { useProgress } from "./use-progress";

const reducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The visitor's samples: the workshop's numbers, written the way this locale writes them. */
function sampleFields(kind: Reading, example: Series, pack: DemoPack): Fields {
  const num = (value: number) => formatNumber(value, pack.locale);
  const values = kind === "change" ? example.changes : example.levels;
  return {
    values: values.map(num).join("; "),
    start: num(example.startLevel),
    name: example.name,
    table: FOLDLINE.table,
    neverNeg: true,
  };
}

/**
 * The size of the drawing box in px: the box is as big, so chart text keeps its size on every
 * screen. Its height comes from the CSS (a phone height, a share of the viewport on wide
 * screens), which also reserves the room before this runs, so nothing jumps.
 */
function usePlotSize(node: React.RefObject<HTMLElement | null>): { readonly width: number; readonly height: number } {
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: PHONE_HEIGHT });
  useEffect(() => {
    const target = node.current;
    if (!target) return;
    const measure = () => {
      const width = target.clientWidth;
      const height = target.clientHeight;
      if (width > 0 && height > 0) setSize((current) => (Math.abs(current.width - width) >= 1 || Math.abs(current.height - height) >= 1 ? { width, height } : current));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const watcher = new ResizeObserver(measure);
    watcher.observe(target);
    return () => watcher.disconnect();
  }, [node]);
  return size;
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

export default function Demo({ copy }: { readonly copy: DemoPack }) {
  const pack = copy;
  const { ui } = pack;
  const locale = pack.locale;
  const example = useMemo(() => exampleSeries(ui.months), [ui.months]);
  const progress = useProgress(0);
  const { p, play, cancel, set, animateTo } = progress;
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const size = usePlotSize(canvas);
  const touchedRef = useRef(false);
  const watcher = useRef<IntersectionObserver | null>(null);
  const [touched, setTouched] = useState(false);
  const [live, setLive] = useState(false);
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [override, setOverride] = useState<Reading | null>(null);
  const [pick, setPick] = useState<{ readonly reading: Reading; readonly op: OpId } | null>(null);
  const [settled, setSettled] = useState<Reading>("change");

  const read = useMemo(
    () => readFields(fields, override, (n) => fill(ui.monthShort, { n })),
    [fields, override, ui.monthShort],
  );
  const series = read.status === "ok" ? read.series : example;
  const scene = useMemo(() => sceneAt(series, p, fields.neverNeg), [series, p, fields.neverNeg]);
  const reading: Reading = p < 0.5 ? "change" : "level";
  // The operator on show is the right answer of the reading until the visitor tries another one.
  const op = pick && pick.reading === reading ? pick.op : defaultOp(reading);
  const fmt = formatters(series, locale);

  // Derived while rendering: the last state the lever came to rest in.
  if (p === 0 && settled !== "change") setSettled("change");
  else if (p === 1 && settled !== "level") setSettled("level");

  // The intro: once the scene is on screen, pull the lever and bring it back to the hero state.
  // It never runs over a visitor: any touch, key or edit before it starts disarms it for good.
  useEffect(() => {
    if (reducedMotion()) {
      set(1);
      return;
    }
    const node = stage.current;
    if (!node || touchedRef.current) return;
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (touchedRef.current) {
          observer.disconnect();
          return;
        }
        // Only when the whole stage is on screen (or all of it that the screen can hold).
        const whole = entries.some((entry) => entry.isIntersecting && entry.intersectionRect.height >= Math.min(entry.boundingClientRect.height, window.innerHeight - 80) * 0.9);
        if (started || !whole) return;
        started = true;
        observer.disconnect();
        play(INTRO_MS, introAt);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 0.9, 0.95, 1] },
    );
    watcher.current = observer;
    observer.observe(node);
    return () => observer.disconnect();
  }, [play, set]);

  const touch = () => {
    touchedRef.current = true;
    watcher.current?.disconnect();
    cancel();
    setTouched(true);
    setLive(true);
  };

  const goTo = (target: number) => {
    touch();
    if (reducedMotion()) set(target);
    else animateTo(target, 700);
  };

  const apply = (nextFields: Fields, nextOverride: Reading | null) => {
    setFields(nextFields);
    setOverride(nextOverride);
    const next = readFields(nextFields, nextOverride, (n) => fill(ui.monthShort, { n }));
    const before = read.status === "ok" ? read.kind : null;
    if (next.status === "ok" && next.kind !== before) goTo(next.kind === "level" ? 1 : 0);
  };

  // Bring the stage into view, so the reaction is seen. Never smooth under reduced motion.
  const showStage = useCallback(() => {
    const node = stage.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight - 72) return;
    node.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
  }, []);

  // The visitor's own numbers get the same lever moment as the example: once they are done with a
  // field (paste, leaving it, a sample) and the numbers read, the stage scrolls into view and the
  // lever pulls to the other reading and back to the one their numbers are.
  const committed = useRef(false);
  const revealed = useRef("");
  const [tick, setTick] = useState(0);
  const onCommit = (when: "paste" | "done") => {
    committed.current = true;
    if (when === "done") setTick((count) => count + 1);
  };
  useEffect(() => {
    if (!committed.current) return;
    if (read.status !== "ok") {
      committed.current = false;
      return;
    }
    const key = `${fields.values}|${fields.start}|${fields.neverNeg}|${override ?? ""}`;
    committed.current = false;
    if (key === revealed.current) return;
    revealed.current = key;
    const base: 0 | 1 = read.kind === "level" ? 1 : 0;
    touchedRef.current = true;
    watcher.current?.disconnect();
    setTouched(true);
    setLive(true);
    showStage();
    set(base);
    if (reducedMotion()) return;
    play(OWN_MS, (ms) => ownAt(ms, base));
  }, [read, tick, fields, override, play, set, showStage]);

  const status = (() => {
    if (!live) return "";
    const at = sceneAt(series, settled === "level" ? 1 : 0, fields.neverNeg);
    const month = series.months[0] ?? "";
    const value = fmt.money(at.counter);
    const growth = settled === "level" ? fill(ui.statusGrowth, { growth: fmt.money(sum(series.changes)) }) : "";
    return fill(settled === "level" ? ui.statusLevel : ui.statusChange, { month, value }) + growth;
  })();

  const label = fill(ui.sceneLabelBoth, {
    changes: joinList(series.changes.map((v) => fmt.num(v)), pack.take.and),
    levels: joinList(series.levels.map((v) => fmt.num(v)), pack.take.and),
  });

  return (
    <div
      className="dr3"
      data-hint={touched ? undefined : ""}
      data-p={p === 0 ? "0" : p === 1 ? "1" : "mid"}
      onPointerDownCapture={touch}
      onKeyDownCapture={touch}
    >
      <div ref={stage} className="dr3-stage">
        <Lever
          p={p}
          ui={ui}
          onTouch={touch}
          onScrub={set}
          onRelease={(value) => {
            if (value < 0.08 || value > 0.92) {
              const target = value < 0.08 ? 0 : 1;
              if (reducedMotion()) set(target);
              else animateTo(target, 180);
            }
          }}
        />
        <div className="dr3-plot">
          <Head series={series} scene={scene} pack={pack} width={size.width} />
          <div className="dr3-canvas" ref={canvas}>
            <SceneSvg series={series} scene={scene} pack={pack} label={label} width={size.width} height={size.height} />
          </div>
          <p className="dr3-caption" aria-hidden="true">
            <strong style={{ opacity: scene.sentence }}>{ui.sentence}</strong>
          </p>
        </div>
      </div>
      <p className="dr3-sr" role="status">
        {status}
      </p>
      <table className="dr3-sr">
        <caption>{ui.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col" />
            {series.months.map((month) => (
              <th key={month} scope="col">
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {([["change", ui.readingChange, series.changes], ["level", ui.readingLevel, series.levels]] as const).map(([id, name, values]) => (
            <tr key={id}>
              <th scope="row">{name}</th>
              {values.map((value, index) => (
                <td key={index}>{fmt.money(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <Operators
        series={series}
        reading={reading}
        op={op}
        onOp={(next) => setPick({ reading, op: next })}
        onReading={(r) => goTo(r === "level" ? 1 : 0)}
        pack={pack}
      />
      <ScalePair series={series} pair={scene.pair} pack={pack} />
      <OwnNumbers
        fields={fields}
        read={read}
        override={override}
        pack={pack}
        onFields={(next) => apply(next, override)}
        onOverride={(kind) => apply(fields, kind)}
        onSample={(kind) => apply(sampleFields(kind, example, pack), null)}
        onCommit={onCommit}
        onReset={() => {
          apply(EMPTY_FIELDS, null);
          goTo(0);
        }}
      />
      <TakeBlocks series={series} pack={pack} reading={reading} />
    </div>
  );
}
