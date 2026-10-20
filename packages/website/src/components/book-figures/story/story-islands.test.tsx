import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  C12_STEP_TEXTS, C12_TIMELINE, C14_PLACEMENT, C1_DETAILS, C1_LADDER, C2_ICEBERG, C4_HEADLINE, C4_STEPS,
} from "./fixtures.provisional";
import { stepProgress } from "@/lib/figures";
import { AiActTimeline } from "./ai-act-timeline";
import { Calculator, calculate, CALCULATOR_DEFAULTS } from "./calculator";
import { IcebergScrub, ICEBERG_PARTS, tagIcebergParts } from "./iceberg-scrub";
import { Placement, cellFor, isTooFew } from "./placement";
import { SurveyLadder } from "./survey-ladder";
import { WaterfallStory } from "./waterfall-story";
import { renderFigure } from "@/lib/figures";

/* ------------------------------------------------------------ test doubles */

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class FakeObserver {
  static instances: FakeObserver[] = [];
  callback: ObserverCallback;
  targets: Element[] = [];
  options: IntersectionObserverInit | undefined;
  constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    FakeObserver.instances.push(this);
  }
  observe(target: Element) { this.targets.push(target); }
  unobserve() {}
  disconnect() { this.targets = []; }
  takeRecords() { return []; }
}

function stubMedia(matching: readonly string[]) {
  window.matchMedia = ((query: string) => ({
    matches: matching.some((m) => query.includes(m)),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}


/** Plays every pending animation frame deterministically (no real-time waits, so a loaded machine cannot time out). */
function useFrameClock() {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
}
function playFrames(ms = 800) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

const progressOf = (container: Element, selector: string): number => {
  const svg = container.querySelector(`${selector} svg`);
  return Number(svg?.getAttribute("data-progress"));
};

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  stubMedia([]);
  window.scrollBy = vi.fn() as unknown as typeof window.scrollBy;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------ CLS-safe heights */

function viewBoxHeight(svg: Element | null): number {
  return Number((svg?.getAttribute("viewBox") ?? "0 0 0 0").split(" ")[3]);
}

describe("reserved heights", () => {
  it.each([
    ["C4 waterfall", C4_HEADLINE],
    ["C1 ladder", C1_LADDER],
    ["C12 timeline", C12_TIMELINE],
    ["C2 iceberg", C2_ICEBERG],
  ] as const)("%s keeps the same viewBox height at every progress", (_name, spec) => {
    for (const width of [360, 640]) {
      const heights = [0, 0.25, 0.5, 0.75, 1].map((p) => {
        const { container, unmount } = render(renderFigure(spec, p, { width }));
        const h = viewBoxHeight(container.querySelector("svg"));
        unmount();
        return h;
      });
      expect(new Set(heights).size).toBe(1);
    }
  });

  it("the calculator and the placement plot keep their height whatever the input", () => {
    const spec = (hours: number, rate: number, tool: number) => {
      const { container, unmount } = render(<Calculator />);
      const get = (n: number) => container.querySelector<HTMLInputElement>(`.bf-field:nth-child(${n}) input`)!;
      fireEvent.change(get(1), { target: { value: String(hours) } });
      fireEvent.change(get(2), { target: { value: String(rate) } });
      fireEvent.change(get(3), { target: { value: String(tool) } });
      const h = [...container.querySelectorAll(".bf-svg--wide svg")].map(viewBoxHeight);
      unmount();
      return h;
    };
    const a = spec(0, 10, 0);
    const b = spec(20, 150, 500);
    const c = spec(1, 10, 500);
    expect(new Set([...a, ...b, ...c]).size).toBe(1);

    const heights = new Set<number>();
    const { container } = render(<Placement data={C14_PLACEMENT} />);
    const [industry, region] = screen.getAllByRole("combobox");
    for (const [i, r] of [["", ""], ["it", "sued"], ["verkehr", "ost"], ["bau", "nord"]]) {
      fireEvent.change(industry!, { target: { value: i } });
      fireEvent.change(region!, { target: { value: r } });
      heights.add(viewBoxHeight(container.querySelector(".bf-svg--wide svg")));
    }
    expect(heights.size).toBe(1);
  });

  it("renders both layouts with unique accessible-name ids", () => {
    const { container } = render(<SurveyLadder spec={C1_LADDER} details={C1_DETAILS} />);
    const ids = [...container.querySelectorAll("[id]")].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll("svg[role='img']")).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------- C4 */

describe("C4 waterfall story", () => {
  it("renders four step cards, the pinned stage and one stacked figure per step", () => {
    const { container } = render(<WaterfallStory spec={C4_HEADLINE} steps={C4_STEPS} />);
    expect(container.querySelectorAll("[data-step-index]")).toHaveLength(4);
    expect(container.querySelector(".bf-wf")).toHaveAttribute("data-step", "0");
    expect(container.querySelectorAll(".bf-wf-static svg")).toHaveLength(4);
    expect(screen.getAllByText(/Schritt 1 von 4/).length).toBeGreaterThan(0);
    expect(progressOf(container, ".bf-wf-chart")).toBe(stepProgress(C4_HEADLINE, 0));
    // The stacked figures show their own step; the last one is the finished chart.
    const stacked = [...container.querySelectorAll(".bf-wf-static svg")].map((s) => Number(s.getAttribute("data-progress")));
    expect(stacked).toEqual([0.25, 0.5, 0.75, 1]);
  });

  it("uses one IntersectionObserver on the step cards, and its band sets data-step", () => {
    useFrameClock();
    const { container } = render(<WaterfallStory spec={C4_HEADLINE} steps={C4_STEPS} />);
    expect(FakeObserver.instances).toHaveLength(1);
    const observer = FakeObserver.instances[0]!;
    expect(observer.targets).toHaveLength(4);
    expect(observer.options?.rootMargin).toBe("-68% 0px -30% 0px");
    const cards = observer.targets;
    act(() => observer.callback([{ target: cards[2], isIntersecting: true }]));
    expect(container.querySelector(".bf-wf")).toHaveAttribute("data-step", "2");
    expect(container.querySelector("[data-step-index='2']")).toHaveAttribute("data-active", "true");
    playFrames();
    expect(progressOf(container, ".bf-wf-chart")).toBeCloseTo(stepProgress(C4_HEADLINE, 2), 2);
    act(() => observer.callback([{ target: cards[2], isIntersecting: false }, { target: cards[3], isIntersecting: true }]));
    expect(container.querySelector(".bf-wf")).toHaveAttribute("data-step", "3");
    playFrames();
    expect(progressOf(container, ".bf-wf-chart")).toBe(1);
  });

  it("step buttons are real buttons that jump to a step and name it", () => {
    const { container } = render(<WaterfallStory spec={C4_HEADLINE} steps={C4_STEPS} />);
    const nav = screen.getByRole("navigation", { name: "Schritte der Abbildung" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).not.toHaveAttribute("tabindex", "-1");
    }
    expect(buttons[0]).toHaveAttribute("aria-current", "step");
    fireEvent.click(buttons[1]!);
    expect(container.querySelector(".bf-wf")).toHaveAttribute("data-step", "1");
    expect(buttons[1]).toHaveAttribute("aria-current", "step");
    expect(buttons[0]).not.toHaveAttribute("aria-current");
    expect(buttons[1]).toHaveAccessibleName(/Schritt 2: Nur eigene Domains/);
    expect(window.scrollBy).toHaveBeenCalled();
  });

  it("announces the step through a polite live region", () => {
    render(<WaterfallStory spec={C4_HEADLINE} steps={C4_STEPS} />);
    const live = document.querySelector(".bf-wf-count");
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("reduced motion jumps to the step without easing", () => {
    stubMedia(["prefers-reduced-motion: reduce"]);
    const { container } = render(<WaterfallStory spec={C4_HEADLINE} steps={C4_STEPS} />);
    const buttons = within(screen.getByRole("navigation", { name: "Schritte der Abbildung" })).getAllByRole("button");
    fireEvent.click(buttons[2]!);
    expect(progressOf(container, ".bf-wf-chart")).toBe(stepProgress(C4_HEADLINE, 2));
  });

  it("always has the finished chart in the data table and says it is provisional on request", () => {
    render(<WaterfallStory spec={C4_HEADLINE} steps={C4_STEPS} provisional />);
    expect(screen.getByText(/Vorläufige Werte/)).toBeInTheDocument();
    expect(screen.queryByText("Daten & Grenzen")).toBeNull();
    expect(document.querySelector("details, summary")).toBeNull();
    expect(screen.getByRole("link", { name: "Daten als CSV" })).toHaveAttribute("download");
    expect(document.querySelector("[data-source-line]")?.textContent).toContain("Grenze:");
  });
});

/* ------------------------------------------------------------------- C2 */

describe("C2 iceberg", () => {
  it("tags the parts the engine draws, in order", () => {
    const svg = renderFigure(C2_ICEBERG, 1, { width: 360 });
    const { svg: tagged, tagged: ok } = tagIcebergParts(svg as never);
    expect(ok).toBe(true);
    const { container } = render(tagged);
    for (const part of ICEBERG_PARTS) {
      expect(container.querySelector(`.bf-ice-${part.name}`)?.tagName.toLowerCase()).toBe(part.tag);
    }
    expect(container.querySelectorAll(".bf-ice-part")).toHaveLength(ICEBERG_PARTS.filter((p) => p.moves).length);
  });

  it("leaves the figure untouched when the engine's part order changes", () => {
    const svg = renderFigure(C2_ICEBERG, 1, { width: 360 }) as never;
    const broken = { ...(svg as object), props: { ...(svg as { props: object }).props, children: [] } } as never;
    expect(tagIcebergParts(broken).tagged).toBe(false);
  });

  it("renders the finished iceberg with numbers as text and no inline animation state", () => {
    const { container } = render(<IcebergScrub spec={C2_ICEBERG} />);
    expect(container.querySelector("svg")).toHaveAttribute("data-progress", "1");
    expect(container.querySelector(".bf-ice")).toHaveAttribute("data-phase", "idle");
    expect(container.querySelector("svg [transform]")).toBeNull();
    expect(container.querySelector("svg [opacity]")).toBeNull();
    expect(screen.getByText(/Sichtbar sind 2,2 Prozent/)).toBeInTheDocument();
  });

  it("falls back to an observer that plays once when scroll timelines are missing", () => {
    vi.stubGlobal("CSS", { supports: () => false });
    const { container } = render(<IcebergScrub spec={C2_ICEBERG} />);
    const observer = FakeObserver.instances[0]!;
    act(() => observer.callback([{ isIntersecting: false }]));
    expect(container.querySelector(".bf-ice")).toHaveAttribute("data-phase", "armed");
    act(() => observer.callback([{ isIntersecting: true }]));
    expect(container.querySelector(".bf-ice")).toHaveAttribute("data-phase", "in");
  });

  it("does not arm the fallback when the iceberg is already on screen at load", () => {
    vi.stubGlobal("CSS", { supports: () => false });
    const { container } = render(<IcebergScrub spec={C2_ICEBERG} />);
    act(() => FakeObserver.instances[0]!.callback([{ isIntersecting: true }]));
    expect(container.querySelector(".bf-ice")).toHaveAttribute("data-phase", "idle");
  });

  it("adds no observer where the browser has scroll timelines", () => {
    vi.stubGlobal("CSS", { supports: () => true });
    render(<IcebergScrub spec={C2_ICEBERG} />);
    expect(FakeObserver.instances).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------- C1 */

describe("C1 survey ladder", () => {
  it("slides the dots in once when it first scrolls into view", () => {
    useFrameClock();
    const { container } = render(<SurveyLadder spec={C1_LADDER} details={C1_DETAILS} />);
    expect(progressOf(container, ".bf-svg--wide")).toBe(1);
    const observer = FakeObserver.instances[0]!;
    act(() => observer.callback([{ isIntersecting: false }]));
    expect(progressOf(container, ".bf-svg--wide")).toBe(0);
    act(() => observer.callback([{ isIntersecting: true }]));
    playFrames();
    expect(progressOf(container, ".bf-svg--wide")).toBe(1);
  });

  it("stays finished under reduced motion", () => {
    stubMedia(["prefers-reduced-motion: reduce"]);
    const { container } = render(<SurveyLadder spec={C1_LADDER} details={C1_DETAILS} />);
    expect(FakeObserver.instances).toHaveLength(0);
    expect(progressOf(container, ".bf-svg--wide")).toBe(1);
  });

  it("shows the wording of the chosen source and only that panel", () => {
    const { container } = render(<SurveyLadder spec={C1_LADDER} details={C1_DETAILS} />);
    const open = () => [...container.querySelectorAll(".bf-lad-detail[data-open='true']")];
    expect(open()).toHaveLength(1);
    expect(open()[0]).toHaveTextContent("20 bis 57 Prozent");
    fireEvent.click(screen.getByRole("button", { name: /^Destatis, 26\s%/ }));
    expect(open()).toHaveLength(1);
    expect(open()[0]).toHaveTextContent("Nutzt Ihr Unternehmen eine der folgenden Technologien");
    expect(screen.getByRole("button", { name: /^Destatis, 26\s%/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /^Destatis, 26\s%/ }));
    expect(open()[0]).toHaveTextContent("20 bis 57 Prozent");
  });

  it("picks a source from a click on the figure itself", () => {
    const { container } = render(<SurveyLadder spec={C1_LADDER} details={C1_DETAILS} />);
    fireEvent.click(container.querySelector(".bf-svg--wide [data-id='bitkom'] circle")!);
    expect(container.querySelector(".bf-lad-detail[data-open='true']")).toHaveTextContent("Inwieweit setzt Ihr Unternehmen KI ein");
  });

  it("keeps our own 4,0 % on a separate axis labelled as another measure", () => {
    const { container } = render(<SurveyLadder spec={C1_LADDER} details={C1_DETAILS} />);
    const svg = container.querySelector(".bf-svg--wide svg")!;
    expect(svg.textContent).toContain("Anderes Maß, eigene Achse");
    expect(svg.querySelector("[data-id='ours']")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Unser Maß, 4,0\s%, anderes Maß/ })).toBeInTheDocument();
    // Four survey rungs share the 0 to 100 axis; ours has its own 0 to 10 axis.
    expect(svg.textContent).toMatch(/10\s%/);
  });
});

/* ------------------------------------------------------------------ C12 */

describe("C12 AI Act timeline", () => {
  it("starts finished and steps through the stages with toggle buttons", () => {
    useFrameClock();
    const { container } = render(<AiActTimeline spec={C12_TIMELINE} stepTexts={C12_STEP_TEXTS} />);
    expect(progressOf(container, ".bf-svg--wide")).toBe(1);
    const all = screen.getByRole("button", { name: "Alle Stufen zeigen" });
    expect(all).toHaveAttribute("aria-pressed", "true");
    const second = screen.getByRole("button", { name: /Stufe 2 von 4/ });
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Pflicht zur KI-Kompetenz");
    playFrames();
    expect(progressOf(container, ".bf-svg--wide")).toBeCloseTo(0.5, 2);
    fireEvent.click(all);
    playFrames();
    expect(progressOf(container, ".bf-svg--wide")).toBe(1);
  });

  it("jumps without easing under reduced motion", () => {
    stubMedia(["prefers-reduced-motion: reduce"]);
    const { container } = render(<AiActTimeline spec={C12_TIMELINE} stepTexts={C12_STEP_TEXTS} />);
    fireEvent.click(screen.getByRole("button", { name: /Stufe 1 von 4/ }));
    expect(progressOf(container, ".bf-svg--wide")).toBe(0.25);
  });

  it("never says the rules are met, certified or compliant", () => {
    const { container } = render(<AiActTimeline spec={C12_TIMELINE} stepTexts={C12_STEP_TEXTS} />);
    expect(container.textContent).not.toMatch(/compliant|certified|zertifiziert|konform/i);
  });
});

/* ------------------------------------------------------------------ C13 */

describe("C13 calculator", () => {
  it("is plain arithmetic: value, net and break-even", () => {
    const r = calculate({ hours: 4, rate: 50, tool: 40 });
    expect(r.timeValue).toBeCloseTo(866, 0);
    expect(r.net).toBeCloseTo(826, 0);
    expect(r.breakEvenHours).toBeCloseTo(40 / (50 * 4.33), 5);
    expect(calculate({ hours: 1, rate: 0, tool: 10 }).breakEvenHours).toBeNull();
    expect(calculate({ hours: 0, rate: 50, tool: 40 }).net).toBe(-40);
  });

  it("gives every range input a spoken value and updates it", () => {
    render(<Calculator />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(3);
    expect(sliders[0]).toHaveAttribute("aria-valuetext", "4 Stunden pro Woche");
    expect(sliders[1]).toHaveAttribute("aria-valuetext", "50 Euro pro Stunde");
    expect(sliders[2]).toHaveAttribute("aria-valuetext", "40 Euro pro Monat");
    fireEvent.change(sliders[0]!, { target: { value: "1" } });
    expect(sliders[0]).toHaveAttribute("aria-valuetext", "1 Stunde pro Woche");
    fireEvent.change(sliders[2]!, { target: { value: "200" } });
    expect(sliders[2]).toHaveAttribute("aria-valuetext", "200 Euro pro Monat");
    for (const slider of sliders) expect(slider).toHaveAccessibleName();
  });

  it("states the result in words, never a return rate", () => {
    render(<Calculator />);
    const result = screen.getByRole("status");
    expect(result).toHaveTextContent("4 Stunden pro Woche zu 50 €");
    expect(document.body.textContent).not.toMatch(/ROI|Rendite|Return|Prozent Rendite/i);
    expect(result.textContent).not.toMatch(/%/);
    fireEvent.change(screen.getAllByRole("slider")[2]!, { target: { value: "500" } });
    fireEvent.change(screen.getAllByRole("slider")[0]!, { target: { value: "1" } });
    expect(result).toHaveTextContent(/kostet .* mehr, als die gesparte Zeit wert ist/);
  });

  it("resets to the example values", () => {
    render(<Calculator />);
    fireEvent.change(screen.getAllByRole("slider")[1]!, { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "Startwerte" }));
    expect(screen.getAllByRole("slider")[1]).toHaveValue(String(CALCULATOR_DEFAULTS.rate));
  });

  it("sends and stores nothing", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const setItem = vi.spyOn(window.localStorage, "setItem");
    render(<Calculator />);
    fireEvent.change(screen.getAllByRole("slider")[0]!, { target: { value: "9" } });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ C14 */

describe("C14 placement", () => {
  it("has two labelled selects and an idle prompt", () => {
    render(<Placement data={C14_PLACEMENT} />);
    expect(screen.getByLabelText("Branchengruppe")).toBeInTheDocument();
    expect(screen.getByLabelText("Region")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Wähle Branche und Region");
  });

  it("marks the chosen group and prints n, share and interval", () => {
    const { container } = render(<Placement data={C14_PLACEMENT} />);
    fireEvent.change(screen.getByLabelText("Branchengruppe"), { target: { value: "it" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "sued" } });
    expect(screen.getByRole("status")).toHaveTextContent(/940 Websites.*13,6 Prozent.*Intervall/);
    expect(container.querySelector(".bf-svg--wide [data-id='it']")).not.toHaveAttribute("opacity");
    expect(container.querySelector(".bf-svg--wide [data-id='handel']")).toHaveAttribute("opacity", "0.4");
  });

  it("says zu wenige Daten under 5 hits and prints no number", () => {
    const { container } = render(<Placement data={C14_PLACEMENT} />);
    fireEvent.change(screen.getByLabelText("Branchengruppe"), { target: { value: "bau" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "ost" } });
    const result = screen.getByRole("status");
    expect(result).toHaveTextContent("Zu wenige Daten");
    expect(result).toHaveTextContent("weniger als 5");
    expect(result.textContent).not.toMatch(/\d+,\d+ Prozent/);
    expect(container.querySelector(".bf-place-result")).toHaveAttribute("data-state", "few");
    // The plot hatches the suppressed row and prints the label instead of a value.
    expect(container.querySelector(".bf-svg--wide svg")!.textContent).toContain("weniger als 5");
  });

  it("applies the k = 5 rule to the baked data", () => {
    for (const [key, cell] of Object.entries(C14_PLACEMENT.cells)) {
      if (cell.hits !== null) expect(cell.hits, key).toBeGreaterThanOrEqual(5);
      if (cell.hits === null) {
        expect(cell.value, key).toBeNull();
        expect(cell.lo, key).toBeNull();
      }
    }
    expect(isTooFew(cellFor(C14_PLACEMENT, "bau", "ost"))).toBe(true);
    expect(isTooFew(cellFor(C14_PLACEMENT, "it", "sued"))).toBe(false);
    expect(isTooFew(cellFor(C14_PLACEMENT, "nope", "ost"))).toBe(true);
  });

  it("lets nothing leave the browser", () => {
    const fetchSpy = vi.fn();
    const beacon = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: beacon });
    const setItem = vi.spyOn(window.localStorage, "setItem");
    render(<Placement data={C14_PLACEMENT} />);
    fireEvent.change(screen.getByLabelText("Branchengruppe"), { target: { value: "it" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "nord" } });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(screen.getByText(/bleibt in diesem Browser/)).toBeInTheDocument();
  });
});
