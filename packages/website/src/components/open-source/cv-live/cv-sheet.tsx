"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cvLiveStateKey, type CvLiveChoice } from "@/lib/open-source/cv-live/compose";
import {
  CV_LIVE_DATA,
  cvLiveWrapper,
} from "@/lib/open-source/cv-live/live-data";

/** A4 at 96 dpi: 210 mm wide. The page height comes from WeasyPrint. */
export const SHEET_WIDTH_PX = 793.7;

/**
 * The page is laid out at four times its size and scaled back down. WebKit
 * snaps border widths to device pixels and line boxes to 1/64 px; at 1x a
 * 0.6pt rule on a 2x screen loses 0.3 px per heading and a full page drifts
 * almost 3 px from WeasyPrint. At 4x the drift stays below 1 px in both
 * engines at every device pixel ratio.
 */
export const LAYOUT_ZOOM = 4;

/**
 * Additions to the engine's stylesheet for the preview, nothing else:
 * `min-height: 0` is the same override the engine's own overflow probe
 * applies, so the measured height is the natural height WeasyPrint reports.
 * The outer frame draws the A4 sheet instead.
 */
const PREVIEW_CSS = `:host{display:block}main.page{min-height:0!important;background:transparent!important}.cv-body{background:transparent!important;zoom:${LAYOUT_ZOOM}}`;

export interface SheetMeasure {
  /** The state this measurement belongs to. */
  readonly key: string;
  /** Bottom of `<main>`: where the text ends. */
  readonly mainPx: number;
  /** What the engine's gate compares: `<main>` or its `::before` rail. */
  readonly naturalPx: number;
}

/**
 * Heights in the engine's CSS px, measured like its probe. The rendered
 * box is compared with the rendered sheet width (A4, 793.7 px), so neither
 * the zoom nor the scale transform enters the number. The `::before` rail
 * has no box of its own; its computed height is converted with the same
 * ratio the main box shows, whatever unit an engine reports under zoom.
 */
function measure(key: string, host: HTMLElement, main: HTMLElement): SheetMeasure {
  const hostWidth = host.getBoundingClientRect().width;
  if (hostWidth <= 0) return { key, mainPx: 0, naturalPx: 0 };
  const mainPx = (main.getBoundingClientRect().height / hostWidth) * SHEET_WIDTH_PX;
  const computedMain = Number.parseFloat(getComputedStyle(main).height) || 0;
  const before = getComputedStyle(main, "::before");
  const railComputed =
    before.content && before.content !== "none"
      ? Number.parseFloat(before.height) || 0
      : 0;
  const rail = computedMain > 0 ? (railComputed * mainPx) / computedMain : 0;
  return { key, mainPx, naturalPx: Math.max(mainPx, rail) };
}

/**
 * One engine page inside a shadow root: the engine's stylesheet cannot leak
 * into the site and the site's cannot reach the page. No iframe, so the
 * Content Security Policy (`frame-src 'none'`) stays as it is.
 */
export function CvSheet({
  body,
  choice,
  scale,
  onMeasured,
}: {
  readonly body: string;
  readonly choice: CvLiveChoice;
  readonly scale: number;
  readonly onMeasured: (measure: SheetMeasure) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const measured = useRef(onMeasured);
  useLayoutEffect(() => {
    measured.current = onMeasured;
  });

  // The shadow root and its stylesheet are created once; a choice only
  // swaps classes and the body, exactly what differs between engine runs.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.shadowRoot) return;
    const root = host.attachShadow({ mode: "open" });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CV_LIVE_DATA.css.href;
    link.addEventListener("load", () => setReady(true), { once: true });
    const style = document.createElement("style");
    style.textContent = PREVIEW_CSS;
    const wrapper = document.createElement("div");
    wrapper.className = "cv-body";
    wrapper.append(document.createElement("main"));
    root.append(link, style, wrapper);
  }, []);

  useEffect(() => {
    const root = hostRef.current?.shadowRoot;
    const wrapper = root?.querySelector<HTMLDivElement>(".cv-body");
    const main = wrapper?.querySelector("main");
    if (!wrapper || !main) return;
    const { bodyClass, mainAttributes } = cvLiveWrapper(choice);
    wrapper.className = `cv-body ${bodyClass}`;
    wrapper.lang = choice.lang;
    for (const [name, value] of Object.entries(mainAttributes)) {
      main.setAttribute(name, value);
    }
    // Static engine output from this site's own public folder, checked by
    // scripts/build-cv-engine-live.ts for scripts, handlers and foreign links.
    main.innerHTML = body;
    if (!ready) return;
    let live = true;
    const weights = [...new Set(CV_LIVE_DATA.fonts.map((font) => font.weight))];
    Promise.all(
      weights.map((weight) =>
        document.fonts.load(`${weight} 12px "${CV_LIVE_DATA.fonts[0].family}"`),
      ),
    )
      .catch(() => undefined)
      .then(() => {
        const host = hostRef.current;
        if (live && host) measured.current(measure(cvLiveStateKey(choice), host, main));
      });
    return () => {
      live = false;
    };
  }, [body, choice, ready]);

  return (
    <div
      ref={hostRef}
      data-cv-sheet=""
      data-ready={ready ? "" : undefined}
      // A picture of the page: the engine's mailto and https links inside
      // stay out of the tab order and the accessibility tree.
      inert
      aria-hidden="true"
      className="pointer-events-none origin-top-left select-none"
      style={{
        width: SHEET_WIDTH_PX * LAYOUT_ZOOM,
        transform: `scale(${scale / LAYOUT_ZOOM})`,
      }}
    />
  );
}
