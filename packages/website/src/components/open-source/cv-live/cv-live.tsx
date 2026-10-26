"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Plus, RotateCcw } from "lucide-react";
import { CommandBlock } from "@/components/open-source/command-block";
import { CommandCopyButton } from "@/components/open-source/command-copy-button";
import type { Locale } from "@/lib/i18n/locale";
import {
  CV_LIVE_DENSITIES,
  CV_LIVE_LANGUAGES,
  CV_LIVE_TEMPLATES,
  composeCvYaml,
  type CvLiveChoice,
} from "@/lib/open-source/cv-live/compose";
import { CV_LIVE_COPY } from "@/lib/open-source/cv-live/copy";
import {
  CV_LIVE_DATA,
  CV_LIVE_MAX_STATIONS,
  cvLiveChoiceFromSearch,
  cvLiveDefaultChoice,
  cvLiveState,
  type CvLiveState,
} from "@/lib/open-source/cv-live/live-data";
import {
  CV_LIVE_COMMAND,
  CV_LIVE_ENGINE,
  CV_LIVE_SHORT_REVISION,
} from "@/lib/open-source/cv-live/pin";
import { CvSheet, SHEET_WIDTH_PX, type SheetMeasure } from "./cv-sheet";

const PAGE_PX = CV_LIVE_DATA.pagePx;
/** Room the readout needs beside the sheet. */
const READOUT_GAP_PX = 14;

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

/** A state that fits while another density of the same content does not. */
function isRescue(state: CvLiveState): boolean {
  return (
    state.exitCode === 0 &&
    CV_LIVE_DENSITIES.some(
      (density) => cvLiveState({ ...state, density }).exitCode === 1,
    )
  );
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/yaml" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

function Readout({
  state,
  locale,
}: {
  readonly state: CvLiveState;
  readonly locale: Locale;
}) {
  const copy = CV_LIVE_COPY[locale];
  const failed = state.exitCode === 1;
  const detail = !failed
    ? copy.textEnds(state.mainPx, PAGE_PX, locale)
    : state.gate === "clipped"
      ? copy.clipped(Math.round(state.naturalPx - PAGE_PX))
      : state.overflowSection && state.overflowSection !== "(unknown)"
        ? copy.overflowAt(state.overflowSection)
        : copy.overflowUnknown;
  return (
    <div
      role="status"
      aria-live="polite"
      data-cv-status={failed ? "exit-1" : "exit-0"}
      className="flex flex-col gap-2"
    >
      <p className="font-mono text-xs leading-snug text-muted-foreground">
        $ build.py
      </p>
      <p
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
      <p className="text-pretty text-[0.8125rem] leading-snug text-muted-foreground sm:text-sm">
        {detail}
      </p>
      {failed ? (
        <p className="text-pretty text-[0.8125rem] leading-snug text-foreground sm:text-sm">
          {copy.noPdf}
        </p>
      ) : isRescue(state) ? (
        <p className="text-pretty text-[0.8125rem] font-semibold leading-snug text-foreground sm:text-sm">
          {copy.rescued}
        </p>
      ) : null}
    </div>
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
  const [choice, setChoice] = useState<CvLiveChoice>(defaults);
  const [shown, setShown] = useState({ choice: defaults, body: initialBody });
  const [measure, setMeasure] = useState<SheetMeasure | null>(null);
  const [scale, setScale] = useState(0.3);
  const frameRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const state = cvLiveState(shown.choice);

  // Deep links (`?vorlage=…&dichte=…&sprache=…&stationen=…`) are read once.
  useEffect(() => {
    const linked = cvLiveChoiceFromSearch(window.location.search, defaults);
    if (!sameChoice(linked, defaults)) setChoice(linked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let live = true;
    const key = cvLiveState(choice).body;
    loadBody(key)
      .then((body) => {
        if (live) setShown({ choice, body });
      })
      .catch(() => undefined);
    // Warm the next tap.
    if (choice.stations < CV_LIVE_MAX_STATIONS) {
      loadBody(cvLiveState({ ...choice, stations: choice.stations + 1 }).body).catch(
        () => undefined,
      );
    }
    return () => {
      live = false;
    };
  }, [choice]);

  // Scale the A4 sheet into the room the readout leaves, and keep the page
  // edge on screen: the sheet never grows taller than the view allows.
  useEffect(() => {
    const frame = frameRef.current;
    const readout = readoutRef.current;
    if (!frame || !readout) return;
    const fit = () => {
      const room = frame.clientWidth - readout.offsetWidth - READOUT_GAP_PX;
      const byWidth = room / SHEET_WIDTH_PX;
      // From lg the header sits above the stage, so the page, its spill and
      // the A4 edge have to fit below it on the first screen.
      const wide = window.innerWidth >= 1024;
      const byHeight = wide
        ? (window.innerHeight - 330) / (PAGE_PX * 1.2)
        : (window.innerHeight - 180) / (PAGE_PX * 1.12);
      setScale(Math.max(0.15, Math.min(byWidth, byHeight, 0.9)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  const restart = useCallback(
    () => setChoice((current) => cvLiveDefaultChoice(current.lang)),
    [],
  );

  // r and Shift+R start over, as in every deck and demo on this site.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "r" && event.key !== "R") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      // Radio choices keep the shortcut; fields that take text do not.
      if (
        target?.closest(
          "textarea, select, [contenteditable], input:not([type='radio']):not([type='checkbox'])",
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

  const update = (patch: Partial<CvLiveChoice>) =>
    setChoice((current) => ({ ...current, ...patch }));

  // A measurement counts only for the state it was taken on.
  const current = measure?.key === state.key ? measure : null;
  const textPx = current?.mainPx ?? state.mainPx;
  const spill = Math.max(0, textPx - PAGE_PX);
  const stageHeight = (PAGE_PX + Math.max(spill, 0)) * scale;
  const yaml = composeCvYaml(CV_LIVE_DATA.base[shown.choice.lang], shown.choice);
  const loading = !sameChoice(choice, shown.choice);

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
        className="mt-6 grid gap-4 [grid-template-areas:'controls'_'stage'_'lever'_'notes'] lg:mt-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-10 lg:gap-y-5 lg:[grid-template-areas:'controls_stage'_'lever_stage'_'notes_stage']"
        aria-label={copy.title}
      >
        <div className="flex min-w-0 flex-col gap-4 [grid-area:controls]">
          <Segmented
            legend={copy.controls.template}
            name="cv-template"
            options={CV_LIVE_TEMPLATES}
            value={choice.template}
            onChange={(template) => update({ template })}
          />
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <Segmented
              legend={copy.controls.lang}
              name="cv-lang"
              options={CV_LIVE_LANGUAGES}
              value={choice.lang}
              labelOf={(lang) => copy.langNames[lang]}
              onChange={(lang) => update({ lang })}
            />
            <Segmented
              legend={copy.controls.density}
              name="cv-density"
              options={CV_LIVE_DENSITIES}
              value={choice.density}
              onChange={(density) => update({ density })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 [grid-area:lever]">
          <div className="flex gap-2">
            <button
              type="button"
              data-cv-more=""
              disabled={choice.stations >= CV_LIVE_MAX_STATIONS}
              onClick={(event) => {
                event.currentTarget.blur();
                update({ stations: Math.min(CV_LIVE_MAX_STATIONS, choice.stations + 1) });
              }}
              className="inline-flex min-h-14 flex-1 items-center gap-3 border-2 border-foreground bg-foreground px-4 text-left text-base font-bold text-background transition-colors duration-100 hover:bg-background hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange disabled:cursor-not-allowed disabled:border-[var(--color-hairline)] disabled:bg-background disabled:text-muted-foreground"
            >
              <Plus size={18} aria-hidden="true" className="shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="leading-tight">
                  {choice.stations >= CV_LIVE_MAX_STATIONS ? copy.full : copy.more}
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

        <div className="flex flex-col gap-3 [grid-area:notes]">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {copy.privacy}
          </p>
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

        <div
          ref={frameRef}
          className="flex min-w-0 items-start [grid-area:stage]"
          style={{ gap: READOUT_GAP_PX }}
        >
          <div className="shrink-0">
            <div
              role="img"
              aria-label={copy.sheetLabel(shown.choice.template, shown.choice.density)}
              className="relative"
              style={{ width: SHEET_WIDTH_PX * scale, height: stageHeight }}
            >
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 border border-foreground bg-white"
                style={{ width: SHEET_WIDTH_PX * scale, height: PAGE_PX * scale }}
              />
              {spill > 0 ? (
                <div
                  aria-hidden="true"
                  data-cv-spill=""
                  className="absolute left-0 border-x border-b border-dashed border-brand-orange bg-brand-orange/10 motion-safe:transition-[height] motion-safe:duration-200"
                  style={{
                    top: PAGE_PX * scale,
                    width: SHEET_WIDTH_PX * scale,
                    height: spill * scale,
                  }}
                >
                  <span className="absolute bottom-0.5 left-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                    {copy.page2}
                  </span>
                </div>
              ) : null}
              {/* The sheet is laid out at LAYOUT_ZOOM times its size; its
                  layout box must not widen the page. */}
              <div className="absolute inset-0 overflow-hidden">
                <CvSheet
                  body={shown.body}
                  choice={shown.choice}
                  scale={scale}
                  onMeasured={setMeasure}
                />
              </div>
              {spill > 0 ? (
                <div
                  aria-hidden="true"
                  className="absolute left-0 border-t-2 border-brand-orange"
                  style={{ top: PAGE_PX * scale - 1, width: SHEET_WIDTH_PX * scale }}
                >
                  <span className="absolute right-0 top-0.5 bg-brand-orange px-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white">
                    {copy.edge}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <div ref={readoutRef} className="w-[8.25rem] shrink-0 sm:w-48">
            <Readout state={state} locale={locale} />
          </div>
        </div>
      </section>

      <TakeHome locale={locale} state={state} yaml={yaml} />
    </>
  );
}

function TakeHome({
  locale,
  state,
  yaml,
}: {
  readonly locale: Locale;
  readonly state: CvLiveState;
  readonly yaml: string;
}) {
  const copy = CV_LIVE_COPY[locale];
  const row =
    "grid gap-3 border-t border-foreground py-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-6";
  const title = "text-base font-bold tracking-[-0.01em]";
  const detail = "text-pretty text-sm leading-relaxed text-muted-foreground";
  const action =
    "inline-flex min-h-11 w-fit items-center gap-2 border-2 border-foreground bg-background px-4 text-sm font-semibold text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";
  const pdfName = state.pdf?.href.split("/").at(-1) ?? "";

  return (
    <section aria-labelledby="cv-live-take-home" className="mt-12 sm:mt-16" data-cv-take-home="">
      <h2 id="cv-live-take-home" className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">
        {copy.takeHome}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.takeHomeLead}
      </p>
      <div className="mt-6 border-b border-foreground">
        <div className={row}>
          <h3 className={title}>{copy.pdfTitle}</h3>
          <div className="flex flex-col gap-3">
            {state.pdf ? (
              <>
                <p className={`${detail} break-all`}>
                  {copy.pdfFile(pdfName, Math.round(state.pdf.sizeBytes / 1024))}
                </p>
                <a href={state.pdf.href} download className={action} data-cv-pdf="">
                  <Download size={16} aria-hidden="true" />
                  {copy.pdfButton}
                </a>
              </>
            ) : (
              <p className={detail}>{state.exitCode === 1 ? copy.noPdf : copy.pdfMissing}</p>
            )}
          </div>
        </div>
        <div className={row}>
          <h3 className={`${title} font-mono`}>{copy.yamlTitle}</h3>
          <div className="flex flex-col gap-3">
            <p className={detail}>{copy.yamlDetail}</p>
            <button
              type="button"
              className={action}
              data-cv-yaml=""
              onClick={() => download("cv.yaml", yaml)}
            >
              <Download size={16} aria-hidden="true" />
              {copy.yamlButton}
            </button>
          </div>
        </div>
        <div className={row}>
          <h3 className={title}>{copy.cliTitle}</h3>
          <div className="flex min-w-0 flex-col gap-3">
            <p className={detail}>{copy.cliDetail}</p>
            <CommandBlock command={CV_LIVE_COMMAND} label={copy.cliLabel} locale={locale} />
          </div>
        </div>
        <div className={row}>
          <h3 className={title}>{copy.promptTitle}</h3>
          <div className="flex min-w-0 flex-col gap-3">
            <p className={detail}>{copy.promptDetail}</p>
            <div className="flow-root border border-foreground bg-background p-1.5">
              <CommandCopyButton
                command={copy.prompt}
                label={copy.promptLabel}
                locale={locale}
                className="float-right ml-2"
              />
              <p className="px-1.5 py-2 text-sm leading-relaxed">{copy.prompt}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
