// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy";
import Demo from "./demo";

function mockMedia(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({ matches: reduced && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }),
  );
  watchers.length = 0;
  partial.length = 0;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe() {
        const entry = (visible: number) =>
          ({ isIntersecting: true, intersectionRect: { height: visible }, boundingClientRect: { height: 400 } }) as unknown as IntersectionObserverEntry;
        watchers.push(() => this.callback([entry(400)], this as unknown as IntersectionObserver));
        partial.push(() => this.callback([entry(150)], this as unknown as IntersectionObserver));
      }
      disconnect() {}
      unobserve() {}
    },
  );
}

/** The stage-in-view callbacks the demo registered; calling one is "the stage scrolled into view". */
const watchers: (() => void)[] = [];
/** The same callbacks with only 150 of the stage's 400 px on screen. */
const partial: (() => void)[] = [];

const slider = () => screen.getByRole("slider");
const arith = () => document.querySelector("[data-arith]")?.textContent ?? "";

beforeEach(() => {
  vi.useFakeTimers();
  mockMedia(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Stufe oder Treppe? demo", () => {
  it("starts in the hero state: -19.960, the stamp, the first arithmetic line", () => {
    render(<Demo copy={COPY.de} />);
    expect(slider().getAttribute("aria-valuenow")).toBe("0");
    expect(slider().getAttribute("aria-valuetext")).toBe("Stufe: Veränderung pro Monat");
    expect(arith()).toContain("−19.960 + 9.775 + 42.565 = 32.380");
    expect(document.body.textContent).toContain("nie < 0");
  });

  it("moves the lever by keyboard and keeps the buttons in sync", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.keyDown(slider(), { key: "End" });
    expect(slider().getAttribute("aria-valuenow")).toBe("100");
    expect(slider().getAttribute("aria-valuetext")).toBe("Treppe: Stand am Monatsende");
    expect(screen.getByRole("radio", { name: "Treppe" }).getAttribute("aria-checked")).toBe("true");
    expect(arith()).toContain("354.635 + 32.380 = 387.015");
    fireEvent.keyDown(slider(), { key: "ArrowDown" });
    expect(slider().getAttribute("aria-valuenow")).toBe("95");
    fireEvent.keyDown(slider(), { key: "Home" });
    expect(slider().getAttribute("aria-valuenow")).toBe("0");
    expect(slider().getAttribute("aria-valuetext")).toBe("Stufe: Veränderung pro Monat");
  });

  it("announces only the settled states", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.keyDown(slider(), { key: "End" });
    const live = document.querySelectorAll('[role="status"]')[0] as HTMLElement;
    expect(live.textContent).toContain("Jetzt: Treppe. Apr: 334.675");
    expect(live.textContent).toContain("32.380");
    fireEvent.keyDown(slider(), { key: "PageDown" });
    expect(live.textContent).toContain("Jetzt: Treppe");
  });

  it("starts settled under reduced motion with the old figure kept beside the counter", async () => {
    mockMedia(true);
    render(<Demo copy={COPY.en} />);
    await act(async () => {});
    expect(slider().getAttribute("aria-valuenow")).toBe("100");
    expect(document.body.textContent).toContain("Those were the steps.");
    expect(document.body.textContent).toContain("Step was: −€19,960");
  });

  it("gives the operator results for both readings", () => {
    render(<Demo copy={COPY.de} />);
    expect(document.querySelector(".dr3-result")?.textContent).toContain("32.380");
    fireEvent.click(screen.getByRole("radio", { name: "Ende minus Start" }));
    expect(document.querySelector(".dr3-result")?.textContent).toContain("−17.595");
    expect(document.querySelector(".dr3-result")?.textContent).toContain("aufgezeichnete KI-Antwort");
    // The lever came to the staircase: the control shows that reading's right answer first.
    fireEvent.keyDown(slider(), { key: "End" });
    expect(screen.getByRole("radio", { name: "Ende" }).getAttribute("aria-checked")).toBe("true");
    expect(document.querySelector(".dr3-result")?.textContent).toContain("387.015");
    expect(document.querySelector(".dr3-result")?.textContent).not.toContain("beschreibt nichts");
    fireEvent.click(screen.getByRole("radio", { name: "Ende minus Start" }));
    expect(document.querySelector(".dr3-result")?.textContent).toContain("32.380");
    fireEvent.click(screen.getByRole("radio", { name: "Summe" }));
    expect(document.querySelector(".dr3-result")?.textContent).toContain("1.066.140");
  });

  it("reads the visitor's numbers, guesses the reading and keeps the example on garbage", () => {
    render(<Demo copy={COPY.de} />);
    const values = screen.getByLabelText(/Werte/);
    fireEvent.change(values, { target: { value: "12k; 3; 4" } });
    expect(document.querySelector(".dr3-status")?.textContent).toBe("Nicht lesbar. Ein Wert ist keine Zahl (kein k, kein Mio, höchstens 2 Nachkommastellen). Das Beispiel bleibt.");
    fireEvent.change(values, { target: { value: "5; 6" } });
    expect(document.querySelector(".dr3-status")?.textContent).toBe("Nicht lesbar. Es braucht 3 bis 6 Zahlen. Das Beispiel bleibt.");
    expect(arith()).toContain("−19.960");
    fireEvent.change(values, { target: { value: "100; -20; 300" } });
    expect(document.querySelector(".dr3-status")?.textContent).toContain("Deine Zahlen sind geladen.");
    expect(document.body.textContent).toContain("sehr wahrscheinlich eine Veränderung");
    expect(document.querySelector('[data-block="board"] pre')?.textContent).toContain("100, −20 und 300 ergeben zusammen 380");
  });

  it("builds the takeaways from the input and switches variants in place", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.change(screen.getByLabelText(/Name der Spalte/), { target: { value: "umsatz" } });
    fireEvent.change(screen.getByLabelText(/Werte/), { target: { value: "-5;6;7" } });
    expect(document.querySelector('[data-block="def"] pre')?.textContent).toContain("Kennzahl: umsatz");
    fireEvent.click(screen.getByRole("radio", { name: "YAML" }));
    expect(document.querySelector('[data-block="def"] pre')?.textContent).toContain("slug: umsatz");
    fireEvent.click(screen.getByRole("radio", { name: "Mensch" }));
    expect(document.querySelector('[data-block="ask"] pre')?.textContent).toContain("Ist umsatz ein Stand oder eine Veränderung");
  });

  it("copies with the clipboard, shows the confirmation, and falls back to a selection", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<Demo copy={COPY.de} />);
    const block = document.querySelector('[data-block="board"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(within(block).getByRole("button", { name: "Kopieren" }));
    });
    expect(writeText).toHaveBeenCalledWith(block.querySelector("pre")?.textContent);
    expect(within(block).getByRole("button").textContent).toBe("Kopiert");
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(within(block).getByRole("button").textContent).toBe("Kopieren");

    writeText.mockRejectedValue(new Error("denied"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Alle drei kopieren" }));
    });
    expect(screen.getByRole("button", { name: /Markiert/ })).toBeDefined();
    expect(window.getSelection()?.toString().length).toBeGreaterThan(0);
  });

  it("never collapses, never calls the network, never stores the input", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const beacon = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon: beacon, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<Demo copy={COPY.de} />);
    fireEvent.change(screen.getByLabelText(/Werte/), { target: { value: "334.675; 344.450; 387.015" } });
    fireEvent.change(screen.getByLabelText(/Start/), { target: { value: "354.635" } });
    fireEvent.keyDown(slider(), { key: "End" });
    expect(document.querySelector("details, summary, [aria-expanded]")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("renders the English pack", () => {
    render(<Demo copy={COPY.en} />);
    expect(slider().getAttribute("aria-valuetext")).toBe("Step: change per month");
    expect(arith()).toContain("−19,960 + 9,775 + 42,565 = 32,380");
  });

  it("shows the month labels of the language, not German ones, in the English chart and table", () => {
    render(<Demo copy={COPY.en} />);
    const months = [...document.querySelectorAll(".dr3-month")].map((node) => node.textContent);
    expect(months).toEqual(["Apr", "May", "Jun"]);
    expect(document.querySelector("table")?.textContent).toContain("May");
    expect(document.body.textContent).not.toContain("Mai");
  });

  it("never rounds the visitor's decimals away", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.change(screen.getByLabelText(/Werte/), { target: { value: "1,2 3,4 5,6" } });
    fireEvent.click(screen.getByRole("radio", { name: "Veränderung" }));
    expect(document.querySelector('[data-block="board"] pre')?.textContent).toContain("1,2, 3,4 und 5,6 ergeben zusammen 10,2");
    expect(document.querySelector(".dr3-counter")?.textContent).toBe("10,2");
    expect([...document.querySelectorAll(".dr3-barlabel")].map((node) => node.textContent)).toEqual(["1,2", "3,4", "5,6"]);
  });

  it("uses the first level as the start for levels without one, and says so", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.change(screen.getByLabelText(/Werte/), { target: { value: "120; 135; 180" } });
    fireEvent.click(screen.getByRole("radio", { name: "Stand" }));
    fireEvent.keyDown(slider(), { key: "End" });
    expect(arith()).toContain("120 + 60 = 180");
    expect(document.querySelector(".dr3-status")?.textContent).toContain("Ohne Start kennt das Bild die Veränderung im ersten Monat nicht");
    // all three typed levels are bars and parts of the sum
    expect(document.querySelectorAll("[data-bar]")).toHaveLength(3);
    expect(document.querySelector("[data-ticker]")?.textContent).toContain("435");
    expect(document.querySelector('[data-block="board"] pre')?.textContent).toContain("435");
  });

  it("flags an assumed start of zero and leaves out the pair that would rest on it", () => {
    render(<Demo copy={COPY.de} />);
    expect(document.querySelector(".dr3-pair")).not.toBeNull();
    fireEvent.change(screen.getByLabelText(/Werte/), { target: { value: "-5; 6; 7" } });
    expect(document.querySelector(".dr3-pair")).toBeNull();
    expect(document.querySelector(".dr3-status")?.textContent).toContain("Ohne Start rechnet das Bild mit 0");
    fireEvent.keyDown(slider(), { key: "End" });
    expect(arith()).toContain("0 + 8 = 8");
    expect(document.querySelector("[data-arith]")?.textContent).toContain("Start angenommen: 0");
    expect(document.querySelector('[data-block="board"] pre')?.textContent).not.toContain("Der Stand am Ende");
    fireEvent.change(screen.getByLabelText(/Start/), { target: { value: "100" } });
    expect(document.querySelector(".dr3-pair")).not.toBeNull();
  });

  it("draws the closing proof to scale: one block for the last level, one block per month for the sum", () => {
    render(<Demo copy={COPY.de} />);
    expect(document.querySelector("[data-ticker]")?.textContent).toBe("Alle Stände addiert: 1.066.140. Etwa 2,75-mal der letzte Stand.");
    const widths = [...document.querySelectorAll<HTMLElement>(".dr3-pair-row:nth-of-type(n) .dr3-pair-block")].map((node) => Number.parseFloat(node.style.width));
    // last / sum = 36.3 %, and the three months fill the row
    expect(widths[0]).toBeCloseTo((387_015 / 1_066_140) * 100, 2);
    expect(widths.slice(1).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 2);
    expect(document.querySelector(".dr3-pair-small")).toBeNull();
  });

  it("prints ONE counter and one label per bar, whatever p is", () => {
    render(<Demo copy={COPY.de} />);
    for (const key of ["Home", "PageUp", "ArrowUp", "ArrowUp", "End"]) {
      fireEvent.keyDown(slider(), { key });
      expect(document.querySelectorAll(".dr3-counter")).toHaveLength(1);
      expect(document.querySelectorAll(".dr3-barlabel")).toHaveLength(3);
      expect(document.querySelectorAll("[data-tag]")).toHaveLength(1);
    }
    fireEvent.keyDown(slider(), { key: "Home" });
    expect(document.querySelector(".dr3-counter")?.textContent?.replace(/\u00a0/g, " ")).toBe("−19.960 €");
    expect(document.querySelector("[data-tag]")?.textContent).toBe("Veränderung?");
    fireEvent.keyDown(slider(), { key: "End" });
    expect(document.querySelector(".dr3-counter")?.textContent?.replace(/\u00a0/g, " ")).toBe("334.675 €");
    expect(document.querySelector("[data-tag]")?.textContent).toBe("Stand!");
  });

  it("gives the visitor's numbers the lever moment: the lever goes to their reading and pulls", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.click(screen.getByRole("button", { name: "Beispiel: Stände" }));
    expect(slider().getAttribute("aria-valuenow")).toBe("100");
    expect(document.querySelector(".dr3-guess")).not.toBeNull();
    expect(document.querySelector("[data-live]")).toBeNull();
  });

  it("leaves the name chip out while the visitor's column has no name", () => {
    render(<Demo copy={COPY.de} />);
    expect(document.querySelector("[data-chip]")).not.toBeNull();
    fireEvent.change(screen.getByLabelText(/Werte/), { target: { value: "-5;6;7" } });
    expect(document.querySelector("[data-chip]")).toBeNull();
    fireEvent.change(screen.getByLabelText(/Name der Spalte/), { target: { value: "umsatz" } });
    expect(document.querySelector("[data-chip]")).not.toBeNull();
  });

  it("explains the board sentence of the reading the lever shows", () => {
    render(<Demo copy={COPY.de} />);
    const board = () => document.querySelector('[data-block="board"]')?.textContent ?? "";
    expect(board()).toContain("ergeben zusammen 32.380");
    fireEvent.keyDown(slider(), { key: "End" });
    expect(board()).toContain("Ins Board-Paket gehört der letzte Stand: 387.015");
    expect(board()).toContain("Gilt für die Lesart: Stand (Treppe)");
  });

  it("never plays the intro over a visitor who got there first", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.change(screen.getByLabelText(/Werte/), { target: { value: "334.675; 344.450; 387.015" } });
    fireEvent.change(screen.getByLabelText(/Start/), { target: { value: "354.635" } });
    expect(slider().getAttribute("aria-valuenow")).toBe("0");
    act(() => {
      for (const arrive of watchers) arrive();
      vi.advanceTimersByTime(4000);
    });
    expect(slider().getAttribute("aria-valuenow")).not.toBe("0");
  });

  it("waits for the whole stage: a stage that is only partly on screen does not start the intro", () => {
    render(<Demo copy={COPY.de} />);
    act(() => {
      for (const arrive of partial) arrive();
      vi.advanceTimersByTime(2500);
    });
    expect(slider().getAttribute("aria-valuenow")).toBe("0");
    act(() => {
      for (const arrive of watchers) arrive();
      vi.advanceTimersByTime(2000);
    });
    expect(slider().getAttribute("aria-valuenow")).not.toBe("0");
  });

  it("plays the intro when the stage comes into view and nobody touched anything", () => {
    render(<Demo copy={COPY.de} />);
    expect(watchers.length).toBe(1);
  });
});
