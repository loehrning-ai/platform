import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BarsFigure,
  DotplotFigure,
  DumbbellFigure,
  FunnelFigure,
  LorenzFigure,
  TickerFigure,
  TilemapFigure,
  WaffleFigure,
} from "../index";
import {
  BARS_SPITZENANTEILE,
  BARS_TEXTMENGE,
  BARS_VORHERSAGE,
  DOTPLOT_BRANCHEN,
  DUMBBELL_DETAILS,
  DUMBBELL_LAENDER,
  FUNNEL_KREISE,
  LORENZ_STELLEN,
  TICKER_HEADLINE,
  TILEMAP_LAENDER,
  TILEMAP_REGIONS,
  WAFFLE_CHIPS,
  WAFFLE_SAGEN_ZEIGEN,
} from "../fixtures";

const ALL = {
  bars: <BarsFigure spec={BARS_TEXTMENGE} provisional />,
  waffle: <WaffleFigure spec={WAFFLE_SAGEN_ZEIGEN} chips={WAFFLE_CHIPS} />,
  dotplot: <DotplotFigure spec={DOTPLOT_BRANCHEN} />,
  tilemap: <TilemapFigure spec={TILEMAP_LAENDER} regions={TILEMAP_REGIONS} />,
  funnel: <FunnelFigure spec={FUNNEL_KREISE} />,
  dumbbell: <DumbbellFigure spec={DUMBBELL_LAENDER} details={DUMBBELL_DETAILS} />,
  lorenz: <LorenzFigure spec={LORENZ_STELLEN} bars={BARS_SPITZENANTEILE} />,
  ticker: <TickerFigure spec={TICKER_HEADLINE} />,
} as const;

function html(node: React.ReactElement): Document {
  const doc = document.implementation.createHTMLDocument("t");
  doc.body.innerHTML = renderToString(node);
  return doc;
}

describe("server markup is the finished figure (no JS)", () => {
  it.each(Object.entries(ALL))("%s: figure, both variants, source line, CSV and table", (_name, node) => {
    const doc = html(node);
    const figure = doc.querySelector("figure.bf");
    expect(figure).not.toBeNull();
    // finished: every svg is at progress 1 and carries an accessible name and text
    const svgs = [...doc.querySelectorAll("svg[data-figure]")];
    if (_name !== "ticker") {
      expect(svgs.length).toBeGreaterThanOrEqual(2);
      for (const svg of svgs) {
        expect(svg.getAttribute("data-progress")).toBe("1");
        expect(svg.getAttribute("role")).toBe("img");
        expect(svg.querySelector("title")?.textContent?.length).toBeGreaterThan(3);
        expect(svg.querySelector("desc")?.textContent?.length).toBeGreaterThan(20);
      }
      // ids must not clash between the two variants (patterns resolve per svg)
      const ids = [...doc.querySelectorAll("[id]")].map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    // nothing collapses: no disclosure widget anywhere in the figure
    expect(doc.querySelector("details, summary")).toBeNull();
    expect(doc.body.textContent).not.toContain("Daten & Grenzen");
    // one visible source line: n, the date and the limit, then a plain CSV link
    const line = doc.querySelector<HTMLElement>("p.bf-sourceline");
    expect(line, "source line").not.toBeNull();
    expect(line?.textContent).toMatch(/n = [\d.]+/);
    expect(line?.textContent).toMatch(/Stand \d{2}\.\d{2}\.2026/);
    expect(line?.textContent).toContain("Grenze:");
    const csv = line?.querySelector<HTMLAnchorElement>("a.bf-csv");
    expect(csv?.getAttribute("href")).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(csv?.hasAttribute("download")).toBe(true);
    // the plotted numbers stay as a table for assistive technology (visually hidden, never focusable)
    const hidden = doc.querySelector(".bf-source-block > .bf-sr");
    expect(hidden?.querySelector("table")).not.toBeNull();
    expect(hidden?.querySelector("[tabindex]")).toBeNull();
    // nothing interactive is live before hydration
    expect(doc.querySelector(".bf-hit")).toBeNull();
    for (const c of doc.querySelectorAll(".bf-controls")) expect(c.getAttribute("data-ready")).toBe("false");
  });

  it("flags provisional data in the head and nowhere else", () => {
    expect(html(ALL.bars).querySelector(".bf-flag")?.textContent).toBe("Vorläufige Daten");
    expect(html(ALL.dotplot).querySelector(".bf-flag")).toBeNull();
  });

  it("lorenz has two tables and two CSV links; the ticker prints the final number", () => {
    const lorenz = html(ALL.lorenz);
    expect(lorenz.querySelectorAll("a.bf-csv")).toHaveLength(2);
    expect(lorenz.querySelectorAll("table")).toHaveLength(2);
    const ticker = html(ALL.ticker);
    expect(ticker.querySelector(".bf-sr")?.textContent).toBe("4,0 %");
    expect(ticker.querySelector(".bf-ticker-number")?.textContent).toContain("4,0");
  });

  it("the waffle table lists the three groups of the nested readings", () => {
    const rows = [...html(ALL.waffle).querySelectorAll("tbody tr")].map((r) => r.textContent ?? "");
    expect(rows.some((r) => r.includes("enge Lesart") && r.includes("25"))).toBe(true);
    expect(rows.some((r) => r.includes("nur weite Lesart") && r.includes("39"))).toBe(true);
  });
});

/* -------------------------------------------------------------- client */

function stubMedia(motion: boolean): void {
  const mm = (q: string) => ({
    matches: q.includes("no-preference") ? motion : false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  vi.stubGlobal("matchMedia", mm);
  window.matchMedia = mm as never;
}

describe("client islands", () => {
  beforeEach(() => {
    stubMedia(false);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const hits = (): HTMLButtonElement[] => [...document.querySelectorAll<HTMLButtonElement>("button.bf-hit")];

  it("hydrates to one variant, shows controls and gives every item a named 44px button", () => {
    render(<BarsFigure spec={BARS_VORHERSAGE} sortable />);
    expect(document.querySelectorAll("svg[data-figure]")).toHaveLength(1);
    expect(document.querySelector(".bf-controls")?.getAttribute("data-ready")).toBe("true");
    const buttons = hits();
    expect(buttons).toHaveLength(7);
    for (const b of buttons) {
      expect(b.getAttribute("aria-label")).toMatch(/\d,\d\d$/);
      expect(parseInt(b.style.width, 10)).toBeGreaterThanOrEqual(44);
      expect(parseInt(b.style.height, 10)).toBeGreaterThanOrEqual(44);
    }
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  it("keyboard: arrows move, Enter pins with aria-pressed, the line announces it, Escape clears", () => {
    render(<BarsFigure spec={BARS_VORHERSAGE} />);
    const detail = document.querySelector(".bf-detail") as HTMLElement;
    expect(detail.getAttribute("aria-live")).toBe("polite");
    const hint = detail.textContent;
    const [first] = hits();
    act(() => first?.focus());
    expect(detail.textContent).toContain("Textmenge der Website");
    const group = screen.getByRole("group", { name: "Einzelne Balken" });
    fireEvent.keyDown(first as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("aria-label")).toContain("Technik der Website");
    expect(hits().filter((b) => b.tabIndex === 0)).toHaveLength(1);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(document.activeElement?.getAttribute("aria-label")).toContain("Alles zusammen");
    fireEvent.click(document.activeElement as HTMLElement);
    expect(document.activeElement?.getAttribute("aria-pressed")).toBe("true");
    act(() => (document.activeElement as HTMLElement).blur());
    expect(detail.textContent).toContain("Alles zusammen");
    fireEvent.keyDown(within(group).getAllByRole("button")[0] as HTMLElement, { key: "Escape" });
    expect(detail.textContent).toBe(hint);
  });

  it("pins on click and marks the figure through the engine's highlight", () => {
    render(<TilemapFigure spec={TILEMAP_LAENDER} regions={TILEMAP_REGIONS} />);
    const sn = hits().find((b) => b.dataset["hit"] === "SN") as HTMLButtonElement;
    fireEvent.click(sn);
    expect(sn.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector(".bf-detail")?.textContent).toContain("Sachsen: 1,2");
    const tile = document.querySelector('svg [data-id="SN"] rect');
    expect(tile?.getAttribute("stroke-width")).toBe("3");
  });

  it("tile map: arrows follow the 4 x 4 grid and a suppressed Land says 'weniger als 5'", () => {
    render(<TilemapFigure spec={TILEMAP_LAENDER} regions={TILEMAP_REGIONS} />);
    const by = hits().find((b) => b.dataset["hit"] === "SH") as HTMLButtonElement;
    act(() => by.focus());
    fireEvent.keyDown(by, { key: "ArrowRight" });
    expect(document.activeElement?.getAttribute("data-hit")).toBe("HH");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("data-hit")).toBe("HB");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement?.getAttribute("data-hit")).toBe("ST");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Sachsen-Anhalt: weniger als 5 Treffer");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement?.getAttribute("data-hit")).toBe("MV");
  });

  it("tile map: East and West toggle marks the region and shows both raw shares", () => {
    render(<TilemapFigure spec={TILEMAP_LAENDER} regions={TILEMAP_REGIONS} />);
    const osten = screen.getByRole("button", { name: "Osten" });
    expect(osten.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(osten);
    expect(osten.getAttribute("aria-pressed")).toBe("true");
    const text = document.querySelector(".bf-detail")?.textContent ?? "";
    expect(text).toContain("Osten (5 Länder)");
    expect(text).toContain("Westen (10 Länder)");
    expect(document.querySelector('svg [data-id="MV"] rect')?.getAttribute("stroke-width")).toBe("2");
  });

  it("sort toggle reorders the rows and the keyboard order with them", () => {
    render(<BarsFigure spec={BARS_VORHERSAGE} sortable />);
    const order = () => hits().map((b) => b.dataset["hit"]);
    expect(order()[0]).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Nach Wert" }));
    expect(order()[0]).toBe("alles");
    expect(screen.getByRole("button", { name: "Nach Wert" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("dotplot: collapsed shows the extremes, the toggle shows all 39, suppressed rows are hatched", () => {
    render(<DotplotFigure spec={DOTPLOT_BRANCHEN} />);
    expect(hits()).toHaveLength(12);
    expect(hits()[0]?.getAttribute("aria-label")).toContain("IT-Dienstleistung");
    fireEvent.click(screen.getByRole("button", { name: "Alle 39 Branchen zeigen" }));
    expect(hits()).toHaveLength(39);
    expect(document.querySelector("svg pattern")).not.toBeNull();
    const suppressed = hits().filter((b) => b.getAttribute("aria-label")?.includes("weniger als 5"));
    expect(suppressed).toHaveLength(12);
    fireEvent.click(screen.getByRole("button", { name: "Nach Branchennummer" }));
    expect(hits()[0]?.dataset["hit"]).toBe("wz01");
  });

  it("funnel: only the outliers are pointable", () => {
    render(<FunnelFigure spec={FUNNEL_KREISE} />);
    const labels = hits().map((b) => b.getAttribute("aria-label"));
    expect(labels.length).toBe(6);
    expect(labels.join(" ")).toContain("München");
    expect(document.querySelectorAll("svg circle").length).toBeGreaterThan(100);
  });

  it("dumbbell: the metric toggle ranks rows; details carry both raw values", () => {
    render(<DumbbellFigure spec={DUMBBELL_LAENDER} details={DUMBBELL_DETAILS} />);
    expect(hits()[0]?.dataset["hit"]).toBe("BE");
    fireEvent.click(screen.getByRole("button", { name: "KI-Wort auf Websites" }));
    expect(hits()[0]?.dataset["hit"]).toBe("HH");
    fireEvent.click(hits()[0] as HTMLElement);
    expect(document.querySelector(".bf-detail")?.textContent).toContain("Hamburg");
    // suppressed web values sort last
    expect(hits().slice(-2).map((b) => b.dataset["hit"]).sort()).toEqual(["SL", "ST"]);
  });

  it("waffle: a reading relights the dots (narrow 25, broad 64) and its sentence says the number depends on the reading", () => {
    render(<WaffleFigure spec={WAFFLE_SAGEN_ZEIGEN} chips={WAFFLE_CHIPS} />);
    const accent = () => document.querySelectorAll('svg rect[data-group][fill="#b73a15"]').length;
    fireEvent.click(screen.getByRole("button", { name: "Weite Lesart" }));
    expect(accent()).toBe(64);
    fireEvent.click(screen.getByRole("button", { name: "Enge Lesart" }));
    expect(accent()).toBe(25);
    expect(document.querySelector(".bf-detail")?.textContent).toContain("Enge Lesart: 25 von 100");
    expect(document.querySelector(".bf-detail")?.textContent).toContain("hängt davon ab, was man konkret nennt");
    expect(document.querySelectorAll("svg rect[data-group]")).toHaveLength(100);
  });

  it("lorenz: the range input moves the mark and aria-valuetext says why", () => {
    render(<LorenzFigure spec={LORENZ_STELLEN} bars={BARS_SPITZENANTEILE} />);
    const slider = screen.getByLabelText("Größte Arbeitgeber, Anteil") as HTMLInputElement;
    expect(slider.getAttribute("aria-valuetext")).toContain("44");
    fireEvent.change(slider, { target: { value: "5" } });
    expect(slider.getAttribute("aria-valuetext")).toBe("Die größten 5 % der Arbeitgeber halten 33 % der Stellen.");
    expect(document.querySelector("svg")?.textContent).toContain("halten 33");
  });

  it("without motion allowed or when already on screen the figure never starts empty", () => {
    render(<BarsFigure spec={BARS_TEXTMENGE} />);
    expect(document.querySelector("svg")?.getAttribute("data-progress")).toBe("1");
  });
});

describe("reveal on enter (motion allowed)", () => {
  let cb: ((e: Array<{ isIntersecting: boolean }>) => void) | null = null;
  const frames: Array<(t: number) => void> = [];
  let now = 0;

  beforeEach(() => {
    stubMedia(true);
    cb = null;
    frames.length = 0;
    now = 0;
    class IO {
      constructor(c: (e: Array<{ isIntersecting: boolean }>) => void) { cb = c; }
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = IO as never;
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    window.requestAnimationFrame = ((f: (t: number) => void) => { frames.push(f); return frames.length; }) as never;
    window.cancelAnimationFrame = (() => undefined) as never;
    window.performance.now = () => now;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 3000, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 3000, toJSON: () => ({}) });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const progress = () => document.querySelector("svg[data-figure]")?.getAttribute("data-progress");
  const step = (ms: number) => act(() => { now += ms; frames.splice(0).forEach((f) => f(now)); });

  it("starts at 0 below the fold, plays once when it enters, ends at the clean finished state", () => {
    render(<BarsFigure spec={BARS_TEXTMENGE} />);
    expect(progress()).toBe("0");
    expect(document.querySelectorAll("button.bf-hit")).toHaveLength(0);
    act(() => cb?.([{ isIntersecting: true }]));
    step(0);
    step(200);
    const mid = Number(progress());
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    step(400);
    expect(progress()).toBe("1");
    // the finished svg has no transform and no partial opacity left
    const svg = document.querySelector("svg[data-figure]") as SVGElement;
    expect(svg.querySelectorAll("[transform]")).toHaveLength(0);
    expect(svg.querySelectorAll("[opacity]")).toHaveLength(0);
    expect(document.querySelectorAll("button.bf-hit").length).toBe(5);
  });

  it("the ticker counts from 0 to the final number and the screen reader copy never changes", () => {
    render(<TickerFigure spec={TICKER_HEADLINE} />);
    const live = document.querySelector(".bf-ticker-number > span[aria-hidden]:not(.bf-ticker-sizer)") as HTMLElement;
    expect(live.textContent).toBe("0,0 %");
    expect(document.querySelector(".bf-ticker-number .bf-sr")?.textContent).toBe("4,0 %");
    act(() => cb?.([{ isIntersecting: true }]));
    step(0);
    step(210);
    const mid = parseFloat((live.textContent ?? "").replace(",", "."));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(4);
    step(500);
    expect(live.textContent).toBe("4,0 %");
  });
});
