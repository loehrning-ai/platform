import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import Demo from "./demo";

const plain = (text: string | null) => (text ?? "").replace(/[\u202f\u00a0]/g, " ");

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    onchange: null,
    dispatchEvent: () => false,
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const number = () => plain(screen.getByTestId("giant-number").textContent);

describe("Monatsgrenze demo (reduced motion: no intro, jumps to targets)", () => {
  it("shows the hero: +26 % and the -20 % twin for reduced motion, ruler span, no collapsible UI", () => {
    const { container } = render(<Demo copy={COPY.de} />);
    expect(number()).toContain("+26 %");
    expect(number()).toContain("−20 %");
    expect(screen.getByTestId("weeks-label").textContent).toBe("Wochen: 4 | 5");
    expect(container.querySelector("details, summary, [role=tablist]")).toBeNull();
  });

  it("moves the cut with the slider keys and speaks the headline in aria-valuetext", () => {
    render(<Demo copy={COPY.de} />);
    const slider = screen.getByRole("slider", { name: COPY.de.stage.handleLabel });
    expect(slider.getAttribute("aria-valuetext")).toBe("Schnitt nach Woche 4, Schlagzeile plus 25,8 Prozent");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("aria-valuenow")).toBe("5");
    expect(slider.getAttribute("aria-valuetext")).toBe("Schnitt nach Woche 5, Schlagzeile minus 20,2 Prozent");
    expect(screen.getByTestId("live").textContent).toContain("Schlagzeile minus 20,2 Prozent");
    fireEvent.keyDown(slider, { key: "End" });
    expect(slider.getAttribute("aria-valuenow")).toBe("6");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("aria-valuenow")).toBe("6");
    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider.getAttribute("aria-valuenow")).toBe("3");
  });

  it("nudges by buttons, stops at three weeks per side and flips to +0,7 % per week", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.click(screen.getByRole("button", { name: COPY.de.stage.nudgeL }));
    expect(screen.getByTestId("weeks-label").textContent).toBe("Wochen: 3 | 6");
    expect(screen.getByRole("button", { name: COPY.de.stage.nudgeL })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: COPY.de.stage.nudgeR }));
    fireEvent.click(within(screen.getByRole("radiogroup", { name: COPY.de.stage.switchLabel })).getByRole("radio", { name: "Pro Woche" }));
    expect(number()).toContain("+0,7 %");
    expect(screen.getByTestId("span").textContent).toContain("bis +2,3");
    expect(document.body.textContent).toContain("Rund 97 % des Anstiegs sind die zusätzliche Woche.");
  });

  it("recomputes the result card from the visitor's own numbers and names what is missing", () => {
    render(<Demo copy={COPY.de} />);
    const valueA = screen.getByPlaceholderText("Wert Monat A");
    fireEvent.change(valueA, { target: { value: "100.000" } });
    expect(document.body.textContent).not.toContain("Beispiel: NORTHWIND");
    expect(document.body.textContent).toContain("Deine Zahlen");
    fireEvent.change(valueA, { target: { value: "" } });
    expect(screen.getAllByRole("alert").map((node) => node.textContent).join(" ")).toContain("Es fehlt: Wert A");
    fireEvent.change(valueA, { target: { value: "17,2 Mio" } });
    expect(screen.getAllByRole("alert").map((node) => node.textContent).join(" ")).toContain("volle Zahl");
    fireEvent.click(screen.getByRole("button", { name: "Zurück zum Beispiel" }));
    expect((valueA as HTMLInputElement).value).toBe("17.233.647");
  });

  it("shows the full takeaway texts before any button and copies with a visible confirmation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("isSecureContext", true);
    render(<Demo copy={COPY.de} />);
    const sentence = screen.getByTestId("take-sentence").textContent ?? "";
    expect(sentence).toContain("Rund 97 % des Anstiegs sind die zusätzliche Woche.");
    expect(screen.getByTestId("take-rules").textContent).toContain("## 1. Gleich lange Zeiträume");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Satz kopieren" }));
    });
    expect(writeText).toHaveBeenCalledWith(sentence);
    expect(screen.getAllByText("Kopiert").length).toBeGreaterThan(0);
  });

  it("falls back to execCommand when the clipboard API is missing", async () => {
    vi.stubGlobal("navigator", {});
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
    render(<Demo copy={COPY.en} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
    });
    expect(exec).toHaveBeenCalledWith("copy");
    expect(screen.getAllByText("Copied").length).toBeGreaterThan(0);
  });

  it("makes no network call at any point", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const open = vi.spyOn(XMLHttpRequest.prototype, "open");
    render(<Demo copy={COPY.de} />);
    fireEvent.keyDown(screen.getByRole("slider", { name: COPY.de.stage.handleLabel }), { key: "ArrowRight" });
    fireEvent.change(screen.getByPlaceholderText("Wert Monat B"), { target: { value: "5" } });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("switches Act 2 to per 1.000 and orders the defect rows by rate in the screen reader list", () => {
    render(<Demo copy={COPY.de} />);
    expect(plain(document.body.textContent)).toContain("CRAFT liegt 21 % vor NEST.");
    fireEvent.click(screen.getByRole("radio", { name: "pro 1.000 Stück" }));
    expect(document.body.textContent).toContain("CRAFT hat das 2,2-Fache der nächstschlechten Linie.");
    expect(screen.getByRole("slider", { name: COPY.de.act2.trigLabel }).getAttribute("aria-valuetext")).toBe("Auslöser 2,51 je 1.000 Stück");
    fireEvent.click(screen.getByRole("button", { name: COPY.de.act2.trigDown }));
    expect(screen.getByRole("slider", { name: COPY.de.act2.trigLabel }).getAttribute("aria-valuenow")).toBe("2.41");
    expect(screen.getByTestId("take-rules").textContent).toContain("Oktober unter 2,41 Defektmeldungen je 1.000 Stück");
  });

  it("closes Act 2 with the payoff and labels the trigger line on the chart", () => {
    render(<Demo copy={COPY.de} />);
    expect(document.body.textContent).not.toContain("Das Wachstum war Kalender. Das Defektproblem bleibt.");
    expect(screen.getByText(COPY.de.act2.trigHint)).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "pro 1.000 Stück" }));
    expect(document.body.textContent).toContain("Das Wachstum war Kalender. Das Defektproblem bleibt.");
    expect(document.querySelector(".mg-trigger-tag")?.textContent).toBe("Auslöser 2,51");
    fireEvent.click(screen.getByRole("button", { name: COPY.de.act2.trigDown }));
    expect(document.querySelector(".mg-trigger-tag")?.textContent).toBe("Auslöser 2,41");
  });

  it("gives one message for a missing or Mio value, and a neutral line in Mitnehmen", () => {
    render(<Demo copy={COPY.de} />);
    const valueA = screen.getByPlaceholderText("Wert Monat A");
    fireEvent.change(valueA, { target: { value: "" } });
    expect(screen.getAllByText(/Es fehlt: Wert A/)).toHaveLength(1);
    expect(screen.getByText(COPY.de.take.empty)).toBeTruthy();
    fireEvent.change(valueA, { target: { value: "17,2 Mio" } });
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.queryByText(/Es fehlt/)).toBeNull();
  });

  it("says what the calendar did when the headline falls", () => {
    render(<Demo copy={COPY.de} />);
    fireEvent.change(screen.getByPlaceholderText("Wert Monat A"), { target: { value: "5000" } });
    fireEvent.change(screen.getByPlaceholderText("Anzahl A"), { target: { value: "3" } });
    fireEvent.change(screen.getByPlaceholderText("Wert Monat B"), { target: { value: "3000" } });
    fireEvent.change(screen.getByPlaceholderText("Anzahl B"), { target: { value: "4" } });
    const card = plain(document.querySelector(".mg-result")?.textContent ?? "");
    expect(card).toContain("Pro Lieferwoche fällt es noch stärker (−55,0 %): der Kalender hat den Rückgang verdeckt.");
    expect(card).toContain("Unterschied");
    expect(card).toContain("−15,0 PP");
    expect(card).not.toContain("keiner");
    expect(screen.getByTestId("take-sentence").textContent).toContain("der Kalender hat den Rückgang verdeckt");
  });

  it("keeps weekend rows of a pasted daily list in the total and says so", () => {
    render(<Demo copy={COPY.de} />);
    const rows: string[] = [];
    for (let day = 1; day <= 31; day += 1) rows.push(`2023-08-${String(day).padStart(2, "0")}\t100`);
    for (let day = 1; day <= 30; day += 1) rows.push(`2023-09-${String(day).padStart(2, "0")}\t110`);
    fireEvent.change(screen.getByRole("textbox", { name: /Excel/ }), { target: { value: rows.join("\n") } });
    expect(document.body.textContent).toContain("Tageswerte inklusive Sa und So");
    expect((screen.getByPlaceholderText("Wert Monat A") as HTMLInputElement).value).toBe("3.100");
    expect((screen.getByPlaceholderText("Wert Monat B") as HTMLInputElement).value).toBe("3.300");
    expect(document.body.textContent).toContain("30 Kalendertage");
    expect(screen.getByRole("radio", { name: "Kalendertage" })).toBeTruthy();
  });
});

describe("Monatsgrenze demo (first ten seconds)", () => {
  const observers: { callback: IntersectionObserverCallback; target: Element | null; options: IntersectionObserverInit | undefined }[] = [];
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        entry: (typeof observers)[number];
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          this.entry = { callback, target: null, options };
          observers.push(this.entry);
        }
        observe(target: Element) {
          this.entry.target = target;
        }
        disconnect() {}
      },
    );
  });

  it("renders the finished +26 % hero at once (never an empty box) and watches the chart, not the hero", () => {
    const { container } = render(<Demo copy={COPY.de} />);
    expect(container.querySelector(".mg")?.hasAttribute("data-boot")).toBe(false);
    expect(number()).toContain("+26 %");
    expect(observers).toHaveLength(1);
    expect(observers[0]?.target?.classList.contains("mg-chart")).toBe(true);
    expect(observers[0]?.target?.querySelector("[role=slider]")).not.toBeNull();
    const margin = observers[0]?.options?.rootMargin ?? "";
    expect(Number(/(\d+)px 0px$/.exec(margin)?.[1] ?? /-(\d+)px/.exec(margin)?.[1])).toBeGreaterThanOrEqual(80);
    expect([observers[0]?.options?.threshold].flat().some((t) => (t ?? 0) >= 0.95)).toBe(true);
  });
});

describe("Monatsgrenze demo (presses that arrive faster than the frames)", () => {
  beforeEach(() => {
    // No animation frame ever runs: the scene stays where it was, like a phone that taps faster than it paints.
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });
  const live = () => screen.getByTestId("live").textContent ?? "";

  it("counts every arrow key press: four presses from 4 | 5 end on 6 | 3, four back end on 3 | 6", () => {
    render(<Demo copy={COPY.de} />);
    const slider = screen.getByRole("slider", { name: COPY.de.stage.handleLabel });
    for (let i = 0; i < 4; i += 1) fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(live()).toContain("Schnitt 6 | 3");
    for (let i = 0; i < 4; i += 1) fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(live()).toContain("Schnitt 3 | 6");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(live()).toContain("Schnitt 5 | 4");
  });

  it("counts every tap on the 48 px chevrons too", () => {
    render(<Demo copy={COPY.de} />);
    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole("button", { name: COPY.de.stage.nudgeL }));
    expect(live()).toContain("Schnitt 3 | 6");
  });

  it("snaps to the nearest week when the plot itself is tapped, not only the handle", () => {
    const { container } = render(<Demo copy={COPY.de} />);
    const plot = container.querySelector(".mg-plot") as HTMLElement;
    plot.getBoundingClientRect = () => ({ left: 0, top: 0, right: 360, bottom: 180, width: 360, height: 180, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(plot, { clientX: 300, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(plot, { clientX: 300, clientY: 120, pointerId: 1 });
    expect(live()).toContain("Schnitt 6 | 3");
    fireEvent.pointerDown(plot, { clientX: 40, clientY: 120, pointerId: 2 });
    fireEvent.pointerUp(plot, { clientX: 40, clientY: 120, pointerId: 2 });
    expect(live()).toContain("Schnitt 3 | 6");
  });
});

describe("Monatsgrenze demo (one voice per fact)", () => {
  it("renders the question beside the number and one range label on the ruler", () => {
    render(<Demo copy={COPY.de} />);
    expect(screen.getByText("Stimmt das?")).toBeTruthy();
    expect(plain(screen.getByTestId("span").textContent)).toBe("Spanne −50,0 % bis +104,5 %");
  });

  it("keeps no empty live regions: at most the one announcer and the one takeaway status", () => {
    render(<Demo copy={COPY.de} />);
    const live = [...document.querySelectorAll("[role=status], [aria-live]")];
    expect(live.filter((node) => (node.textContent ?? "") === "" && node.getAttribute("data-testid") !== "live")).toHaveLength(1);
    fireEvent.change(screen.getByRole("textbox", { name: /Excel/ }), { target: { value: "nichts Brauchbares" } });
    expect(screen.getAllByRole("status").filter((node) => /Keine Zeile/.test(node.textContent ?? ""))).toHaveLength(1);
  });

  it("names each Act 2 row once in the text of the chart, in either view", () => {
    const { container } = render(<Demo copy={COPY.en} />);
    const names = () => [...container.querySelectorAll(".mg-act2 svg text")].map((node) => node.textContent).filter((text) => /^(CRAFT|NEST|AURA|PULSE)$/.test(text ?? ""));
    expect(names().sort()).toEqual(["AURA", "CRAFT", "NEST", "PULSE"]);
    fireEvent.click(screen.getByRole("radio", { name: "per 1,000 units" }));
    expect(names().sort()).toEqual(["AURA", "CRAFT", "NEST", "PULSE"]);
  });

  it("shows the ratio chip on CRAFT only once the per-1.000 bars have landed", () => {
    const { container } = render(<Demo copy={COPY.de} />);
    expect(container.querySelector(".mg-chip")).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "pro 1.000 Stück" }));
    expect(plain(container.querySelector(".mg-chip-text")?.textContent ?? null)).toBe("2,2 × NEST");
  });
});

describe("Monatsgrenze demo (css contract)", () => {
  const css = readFileSync(join(process.cwd(), "src/components/demos/geschaeftsberichte-mit-ki-lesen/demo.css"), "utf8");

  it("hides the room-mode button below 80rem and never reserves a blank pre-boot box", () => {
    expect(css).toMatch(/\.mg-room-toggle \{\s*display: none;/);
    expect(css).not.toContain("data-boot");
    const desktop = css.slice(css.indexOf("@media (min-width: 80rem)"));
    expect(desktop).toMatch(/\.mg-room-toggle \{\s*display: flex;/);
  });
});
