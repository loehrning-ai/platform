"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import {
  CV_LIVE_DENSITIES,
  CV_LIVE_LANGUAGES,
  CV_LIVE_TEMPLATES,
  composeCvYaml,
  type CvLiveChoice,
} from "@/lib/open-source/cv-live/compose";
import { CV_LIVE_COPY, type CvLiveCopy } from "@/lib/open-source/cv-live/copy";
import {
  CV_LIVE_DATA,
  CV_LIVE_MAX_STATIONS,
  cvLiveChoiceFromSearch,
  cvLiveDefaultChoice,
  cvLiveState,
  type CvLiveState,
} from "@/lib/open-source/cv-live/live-data";
import { CV_LIVE_ENGINE, CV_LIVE_SHORT_REVISION } from "@/lib/open-source/cv-live/pin";
import {
  cvLiveAdvice,
  cvLiveChangedLines,
  type CvLiveChange as Change,
} from "@/lib/open-source/cv-live/story";
import { CvSheet, SHEET_WIDTH_PX, type SheetMeasure } from "./cv-sheet";
import { CvLiveTakeHome } from "./cv-take-home";

const PAGE_PX = CV_LIVE_DATA.pagePx;
/** The gauge runs to a quarter page past the edge. */
const GAUGE_MAX_PX = PAGE_PX * 1.25;


const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const bodyCache = new Map<string, Promise<string>>();
function loadBody(key: string): Promise<string> {
  let pending = bodyCache.get(key);
  if (!pending) {
    pending = fetch(CV_LIVE_DATA.bodies[key].href).then((response) => {
      if (!response.ok) throw new Error(`${response.status} for ${key}`);
      return response.text();
    });
    pending.catch(() => bodyCache.delete(key));
    bodyCache.set(key, pending);
  }
  return pending;
}

function sameChoice(a: CvLiveChoice, b: CvLiveChoice): boolean {
  return (
    a.lang === b.lang &&
    a.template === b.template &&
    a.density === b.density &&
    a.stations === b.stations
  );
}

function Segmented<T extends string>({
  legend,
  name,
  options,
  value,
  labelOf,
  onChange,
}: {
  readonly legend: string;
  readonly name: string;
  readonly options: readonly T[];
  readonly value: T;
  readonly labelOf?: (option: T) => string;
  readonly onChange: (next: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-px border border-foreground bg-foreground">
        {options.map((option) => {
          const active = option === value;
          return (
            <label
              key={option}
              className={`relative inline-flex min-h-11 flex-auto cursor-pointer items-center justify-center px-2.5 font-mono text-[0.8125rem] transition-colors duration-100 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-brand-orange ${
                active
                  ? "bg-foreground font-bold text-background"
                  : "bg-background text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={active}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {labelOf ? labelOf(option) : option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The CLI's verdict for the state on screen. The pill stamps when the exit
 * code flips; the gauge fills to where the text ends, Mennige past the A4
 * edge. Numbers never count: they switch to the engine's value at once.
 */
function Readout({
  state,
  textPx,
  locale,
}: {
  readonly state: CvLiveState;
  readonly textPx: number;
  readonly locale: Locale;
}) {
  const copy = CV_LIVE_COPY[locale];
  const failed = state.exitCode === 1;
  const pill = useRef<HTMLParagraphElement>(null);
  const previous = useRef(state.exitCode);
  useEffect(() => {
    if (previous.current === state.exitCode) return;
    previous.current = state.exitCode;
    if (reducedMotion()) return;
    pill.current?.animate(
      [{ transform: "scale(1.18)" }, { transform: "scale(0.97)" }, { transform: "none" }],
      { duration: 240, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );
  }, [state.exitCode]);
  const detail = !failed
    ? copy.textEnds(state.mainPx, PAGE_PX, locale)
    : state.gate === "clipped"
      ? copy.clipped(Math.round(state.naturalPx - PAGE_PX))
      : state.overflowSection && state.overflowSection !== "(unknown)"
        ? copy.overflowAt(state.overflowSection)
        : copy.overflowUnknown;
  const edgeAt = (PAGE_PX / GAUGE_MAX_PX) * 100;
  const ink = (Math.min(textPx, PAGE_PX) / GAUGE_MAX_PX) * 100;
  const over =
    (Math.min(Math.max(0, textPx - PAGE_PX), GAUGE_MAX_PX - PAGE_PX) / GAUGE_MAX_PX) * 100;
  const fill = "motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out";
  return (
    <div
      role="status"
      aria-live="polite"
      data-cv-status={failed ? "exit-1" : "exit-0"}
      className="flex flex-col gap-2"
    >
      <p className="font-mono text-xs leading-snug text-muted-foreground">$ build.py</p>
      <p
        ref={pill}
        className={`inline-flex w-fit items-center border-2 px-2 py-1 font-mono text-lg font-bold leading-none sm:text-2xl ${
          failed
            ? "border-brand-orange bg-brand-orange text-white"
            : "border-foreground bg-background text-foreground"
        }`}
      >
        exit {state.exitCode}
      </p>
      <p className="text-sm font-semibold leading-snug text-foreground">
        {copy.pages(Math.max(1, state.pages))}
      </p>
      <div
        aria-hidden="true"
        data-cv-gauge=""
        className="relative mt-1 h-2 border border-foreground bg-background"
      >
        <div className={`absolute inset-y-0 left-0 bg-foreground ${fill}`} style={{ width: `${ink}%` }} />
        <div
          className={`absolute inset-y-0 bg-brand-orange ${fill}`}
          style={{ left: `${edgeAt}%`, width: `${over}%` }}
        />
        <div
          className="absolute -inset-y-1.5 w-0.5 bg-brand-orange"
          style={{ left: `calc(${edgeAt}% - 1px)` }}
        />
      </div>
      <p className="text-pretty text-[0.8125rem] leading-snug text-muted-foreground sm:text-sm">
        {detail}
      </p>
    </div>
  );
}

/**
 * The A4 sheet, its Mennige edge and the spill below it. The frame grows
 * with the spill, so the overflowing lines appear as the zone opens.
 */
function SheetFrame({
  body,
  choice,
  scale,
  spillPx,
  animate,
  onMeasured,
}: {
  readonly body: string;
  readonly choice: CvLiveChoice;
  readonly scale: number;
  readonly spillPx: number;
  readonly animate: boolean;
  readonly onMeasured?: (measure: SheetMeasure) => void;
}) {
  const grow = "motion-safe:transition-[height] motion-safe:duration-300 motion-safe:ease-out";
  return (
    <div
      className={`relative ${grow}`}
      style={{ width: SHEET_WIDTH_PX * scale, height: (PAGE_PX + spillPx) * scale }}
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 border border-foreground bg-white"
        style={{ width: SHEET_WIDTH_PX * scale, height: PAGE_PX * scale }}
      />
      <div
        aria-hidden="true"
        data-cv-spill={spillPx > 0 ? "" : undefined}
        className={`absolute left-0 border-x border-b border-dashed border-brand-orange bg-brand-orange/10 ${grow} ${
          spillPx > 0 ? "" : "invisible"
        }`}
        style={{ top: PAGE_PX * scale, width: SHEET_WIDTH_PX * scale, height: spillPx * scale }}
      />
      {/* The sheet is laid out at LAYOUT_ZOOM times its size; its layout box
          must not widen the page. */}
      <div className="absolute inset-0 overflow-hidden">
        <CvSheet
          body={body}
          choice={choice}
          scale={scale}
          animate={animate}
          onMeasured={onMeasured}
        />
      </div>
      <div
        aria-hidden="true"
        data-cv-edge=""
        className="absolute left-0 h-0.5 bg-brand-orange"
        style={{ top: PAGE_PX * scale - 1, width: SHEET_WIDTH_PX * scale }}
      />
    </div>
  );
}

/** The page at 96 dpi, the size WeasyPrint sets it; pans on a phone. */
function ZoomDialog({
  open,
  onClose,
  body,
  choice,
  spillPx,
  copy,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly body: string;
  readonly choice: CvLiveChoice;
  readonly spillPx: number;
  readonly copy: CvLiveCopy;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      data-cv-zoom=""
      aria-labelledby="cv-zoom-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-background p-0 text-foreground backdrop:bg-foreground/70 sm:m-auto sm:h-[min(92dvh,72rem)] sm:w-[min(92vw,56rem)] sm:border-2 sm:border-foreground"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-foreground py-1 pl-4 pr-1">
          <h2 id="cv-zoom-title" className="text-sm font-bold">
            {copy.zoomTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-orange"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div
          tabIndex={0}
          role="region"
          aria-label={copy.zoomTitle}
          className="min-h-0 flex-1 overflow-auto overscroll-contain p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-orange"
        >
          {open ? (
            <SheetFrame body={body} choice={choice} scale={1} spillPx={spillPx} animate={false} />
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

/**
 * The cv.yaml for the state on screen, with the lines the last change
 * touched marked and scrolled into view: the cause beside the effect.
 */
function YamlPane({
  yaml,
  marked,
  copy,
}: {
  readonly yaml: string;
  readonly marked: [number, number] | null;
  readonly copy: CvLiveCopy;
}) {
  const box = useRef<HTMLDivElement>(null);
  const lines = yaml.replace(/\n$/, "").split("\n");
  const first = marked?.[0] ?? null;
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const row =
      first === null ? null : node.querySelector<HTMLElement>(`[data-line="${first}"]`);
    const top = row ? Math.max(0, row.offsetTop - node.clientHeight / 4) : 0;
    node.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [first, yaml]);
  return (
    <figure className="min-w-0 border border-foreground bg-background" data-cv-yaml-pane="">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-foreground px-3 py-2">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">
          {copy.yamlPane}
        </span>
        <span className="text-xs text-muted-foreground">{copy.yamlPaneNote}</span>
      </figcaption>
      <div
        ref={box}
        tabIndex={0}
        role="region"
        aria-label={copy.yamlPane}
        className="relative h-48 overflow-auto overscroll-contain py-2 font-mono text-xs leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-orange lg:h-56"
      >
        <pre className="min-w-max">
          {lines.map((line, index) => {
            const on = marked !== null && index >= marked[0] && index <= marked[1];
            return (
              <span
                key={index}
                data-line={index}
                data-marked={on ? "" : undefined}
                className={`block pr-3 ${
                  on ? "bg-brand-orange/10 shadow-[inset_3px_0_0_var(--color-brand-orange)]" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className="mr-3 inline-block w-8 select-none pr-1 text-right text-muted-foreground"
                >
                  {index + 1}
                </span>
                {line || " "}
              </span>
            );
          })}
        </pre>
      </div>
    </figure>
  );
}

export function CvLive({
  locale,
  initialBody,
}: {
  readonly locale: Locale;
  /** The default state's body, rendered on the server so the first paint needs no fetch. */
  readonly initialBody: string;
}) {
  const copy = CV_LIVE_COPY[locale];
  const defaults = cvLiveDefaultChoice(locale === "en" ? "en" : "de");
  const [target, setTarget] = useState<{ choice: CvLiveChoice; change: Change }>({
    choice: defaults,
    change: null,
  });
  const [shown, setShown] = useState<{ choice: CvLiveChoice; body: string; change: Change }>({
    choice: defaults,
    body: initialBody,
    change: null,
  });
  const [measure, setMeasure] = useState<SheetMeasure | null>(null);
  const [scale, setScale] = useState(0.3);
  const [zoomed, setZoomed] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const choice = target.choice;
  const state = cvLiveState(shown.choice);
  const wanted = cvLiveState(choice);

  // Deep links (`?vorlage=…&dichte=…&sprache=…&stationen=…`) are read once.
  useEffect(() => {
    const linked = cvLiveChoiceFromSearch(window.location.search, defaults);
    if (!sameChoice(linked, defaults)) setTarget({ choice: linked, change: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let live = true;
    loadBody(cvLiveState(target.choice).body)
      .then((body) => {
        if (live) setShown({ choice: target.choice, body, change: target.change });
      })
      .catch(() => undefined);
    // Warm the next tap.
    if (target.choice.stations < CV_LIVE_MAX_STATIONS) {
      loadBody(
        cvLiveState({ ...target.choice, stations: target.choice.stations + 1 }).body,
      ).catch(() => undefined);
    }
    return () => {
      live = false;
    };
  }, [target]);

  // The sheet takes the width its cell gives it, up to the real A4 size.
  useEffect(() => {
    const cell = cellRef.current;
    if (!cell) return;
    const fit = () =>
      setScale(Math.max(0.15, Math.min(cell.clientWidth / SHEET_WIDTH_PX, 1)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(cell);
    return () => observer.disconnect();
  }, []);

  const restart = useCallback(
    () =>
      setTarget((current) => ({
        choice: cvLiveDefaultChoice(current.choice.lang),
        change: null,
      })),
    [],
  );

  // r and Shift+R start over, as in every deck and demo on this site. Not
  // while a choice, a field or the full-size page has the keyboard.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "r" && event.key !== "R") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (event.defaultPrevented) return;
      if (document.querySelector("dialog[open]")) return;
      const focused = event.target as HTMLElement | null;
      if (
        focused?.closest(
          "input, textarea, select, [contenteditable], fieldset, [role='radiogroup'], [role='slider'], [role='tablist']",
        )
      )
        return;
      event.preventDefault();
      restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restart]);

  // The address follows the choice, so a state can be shared as a link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("vorlage", choice.template);
    params.set("dichte", choice.density);
    params.set("sprache", choice.lang);
    params.set("stationen", String(choice.stations));
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}?${params.toString()}${window.location.hash}`,
    );
  }, [choice]);

  const update = (patch: Partial<CvLiveChoice>, change: Change) =>
    setTarget((current) => ({ choice: { ...current.choice, ...patch }, change }));

  // A measurement counts only for the state it was taken on.
  const current = measure?.key === state.key ? measure : null;
  const textPx = current?.mainPx ?? state.mainPx;
  const spill = Math.max(0, textPx - PAGE_PX);
  const yaml = composeCvYaml(CV_LIVE_DATA.base[shown.choice.lang], shown.choice);
  const marked = cvLiveChangedLines(yaml, shown.choice, shown.change);
  const loading = !sameChoice(choice, shown.choice);
  const advice = cvLiveAdvice(state, copy);
  const pageFull = wanted.exitCode === 1;
  const canAdd = !pageFull && choice.stations < CV_LIVE_MAX_STATIONS;

  // After "one more job", bring the A4 edge into view once, so the effect of
  // the tap is on screen; the sticky column with the button stays put.
  const followed = useRef<string | null>(null);
  useEffect(() => {
    if (!current || shown.change !== "more" || followed.current === current.key) return;
    followed.current = current.key;
    // Below lg the sheet sits right above the button already.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const edge = cellRef.current?.querySelector("[data-cv-edge]");
    if (!edge) return;
    const bottom = edge.getBoundingClientRect().bottom + Math.min(spill * scale, 160) + 32;
    if (bottom > window.innerHeight) {
      window.scrollBy({
        top: bottom - window.innerHeight,
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    }
  }, [current, shown.change, spill, scale]);

  return (
    <>
      <section
        data-cv-live=""
        data-state={state.key}
        data-exit={state.exitCode}
        data-engine-main-px={state.mainPx}
        data-engine-natural-px={state.naturalPx}
        data-measured-state={current?.key}
        data-measured-main-px={current ? current.mainPx.toFixed(1) : undefined}
        data-measured-natural-px={current ? current.naturalPx.toFixed(1) : undefined}
        aria-busy={loading}
        aria-label={copy.title}
        className="mt-6 grid grid-cols-[minmax(0,1fr)_8.25rem] gap-x-3.5 gap-y-4 [grid-template-areas:'controls_controls'_'sheet_readout'_'lever_lever'_'advice_advice'_'yaml_yaml'] sm:grid-cols-[minmax(0,1fr)_12rem] lg:mt-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-x-12 lg:[grid-template-areas:'left_sheet']"
      >
        <div className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5 lg:self-start lg:[grid-area:left]">
          <div className="flex min-w-0 flex-col gap-4 [grid-area:controls]">
            <Segmented
              legend={copy.controls.template}
              name="cv-template"
              options={CV_LIVE_TEMPLATES}
              value={choice.template}
              onChange={(template) => update({ template }, "template")}
            />
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <Segmented
                legend={copy.controls.lang}
                name="cv-lang"
                options={CV_LIVE_LANGUAGES}
                value={choice.lang}
                labelOf={(lang) => copy.langNames[lang]}
                onChange={(lang) => update({ lang }, "lang")}
              />
              <Segmented
                legend={copy.controls.density}
                name="cv-density"
                options={CV_LIVE_DENSITIES}
                value={choice.density}
                onChange={(density) => update({ density }, "density")}
              />
            </div>
          </div>

          <div className="min-w-0 self-start [grid-area:readout]">
            <Readout state={state} textPx={textPx} locale={locale} />
          </div>

          <div className="flex flex-col gap-2 [grid-area:lever]">
            <div className="flex gap-2">
              <button
                type="button"
                data-cv-less=""
                aria-label={copy.less}
                title={copy.less}
                disabled={choice.stations === 0}
                onClick={(event) => {
                  event.currentTarget.blur();
                  update({ stations: Math.max(0, choice.stations - 1) }, "less");
                }}
                className="inline-flex min-h-14 w-12 shrink-0 items-center justify-center border-2 border-foreground bg-background text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange disabled:cursor-not-allowed disabled:border-[var(--color-hairline)] disabled:text-muted-foreground disabled:hover:bg-background"
              >
                <Minus size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                data-cv-more=""
                disabled={!canAdd}
                onClick={(event) => {
                  event.currentTarget.blur();
                  update(
                    { stations: Math.min(CV_LIVE_MAX_STATIONS, choice.stations + 1) },
                    "more",
                  );
                }}
                className="inline-flex min-h-14 min-w-0 flex-1 items-center gap-3 border-2 border-foreground bg-foreground px-4 text-left text-base font-bold text-background transition-colors duration-100 hover:bg-background hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange disabled:cursor-not-allowed disabled:border-[var(--color-hairline)] disabled:bg-background disabled:text-muted-foreground"
              >
                <Plus size={18} aria-hidden="true" className="shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="leading-tight">
                    {pageFull ? copy.pageFull : canAdd ? copy.more : copy.full}
                  </span>
                  <span className="font-mono text-xs font-normal tabular-nums">
                    {copy.stationsCount(choice.stations, CV_LIVE_MAX_STATIONS)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                data-cv-restart=""
                onClick={restart}
                aria-keyshortcuts="r Shift+R"
                className="inline-flex min-h-14 shrink-0 items-center gap-2 border-2 border-foreground bg-background px-3 text-sm font-semibold text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                <RotateCcw size={16} aria-hidden="true" />
                {copy.restart}
              </button>
            </div>
            <p className="hidden text-xs text-muted-foreground lg:block">{copy.keyHint}</p>
          </div>

          <p
            aria-live="polite"
            data-cv-advice=""
            className="min-h-11 text-pretty text-sm font-semibold leading-snug text-foreground [grid-area:advice]"
          >
            {advice}
          </p>

          <div className="min-w-0 [grid-area:yaml]">
            <YamlPane yaml={yaml} marked={marked} copy={copy} />
          </div>
        </div>

        <div ref={cellRef} className="min-w-0 [grid-area:sheet]">
          <button
            type="button"
            data-cv-zoom-open=""
            aria-haspopup="dialog"
            aria-label={`${copy.zoom}. ${copy.sheetLabel(shown.choice.template, shown.choice.density)}`}
            onClick={() => setZoomed(true)}
            className="group relative block cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"
          >
            {/* The page is a picture of the PDF; the label names it, the dialog shows it. */}
            <span aria-hidden="true" className="block">
              <SheetFrame
                body={shown.body}
                choice={shown.choice}
                scale={scale}
                spillPx={spill}
                animate
                onMeasured={setMeasure}
              />
            </span>
            <span aria-hidden="true" className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 border border-foreground bg-background px-1.5 py-0.5 font-mono text-xs font-bold text-foreground transition-colors duration-100 group-hover:bg-foreground group-hover:text-background">
              <Maximize2 size={12} aria-hidden="true" />
              {copy.zoomChip}
            </span>
          </button>
          <div
            aria-hidden="true"
            className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.12em]"
          >
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-0.5 w-5 bg-brand-orange" />
              {copy.edge}
            </span>
            {spill > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-brand-orange">
                <span className="h-2.5 w-4 border border-dashed border-brand-orange bg-brand-orange/10" />
                {copy.page2}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <ZoomDialog
        open={zoomed}
        onClose={() => setZoomed(false)}
        body={shown.body}
        choice={shown.choice}
        spillPx={spill}
        copy={copy}
      />

      <div className="mt-8 grid max-w-3xl gap-3">
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{copy.privacy}</p>
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
          {copy.provenance(CV_LIVE_SHORT_REVISION, CV_LIVE_DATA.states.length)}{" "}
          <a
            href={CV_LIVE_ENGINE.pullRequestHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {copy.pending(CV_LIVE_ENGINE.pullRequest)}
          </a>
        </p>
      </div>

      <CvLiveTakeHome locale={locale} state={state} yaml={yaml} />
    </>
  );
}
