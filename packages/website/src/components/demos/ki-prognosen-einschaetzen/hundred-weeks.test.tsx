import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { HundredWeeks } from "./hundred-weeks";
import { makeFrame, capAt, columnPaths, redLabelBox } from "./geometry";
import { magnet, nextDetent } from "./line-handle";

function mockMedia(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

const count = () => document.querySelector("[data-hw-count]")?.textContent;
const slider = () => screen.getByRole("slider");

beforeEach(() => {
  mockMedia(true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("HundredWeeks, reduced motion (the static end state)", () => {
  it("shows 76 of 100 at 1.050 with every layer and the 1.180 chip reading 50/100", () => {
    render(<HundredWeeks copy={COPY.de} />);
    expect(count()).toBe("76");
    expect(slider().getAttribute("aria-valuenow")).toBe("1050");
    expect(slider().getAttribute("aria-valuetext")).toBe(
      "Lager 1.050, in 76 von 100 möglichen Startwochen zu wenig",
    );
    const chip = document.querySelector(
      '[data-hw-chip="forecast"]',
    ) as HTMLElement;
    expect(chip.textContent).toContain("1.180");
    expect(chip.textContent).toContain("50/100");
    expect(document.querySelector("[data-hw-waage]")).not.toBeNull();
    expect(document.querySelector("[data-hw-strip]")).not.toBeNull();
    expect(
      document.querySelector("[data-hw]")?.getAttribute("data-layer"),
    ).toBe("3");
  });

  it("moves with the keys and says so in the slider text", () => {
    render(<HundredWeeks copy={COPY.de} />);
    fireEvent.keyDown(slider(), { key: "ArrowUp" });
    expect(slider().getAttribute("aria-valuenow")).toBe("1060");
    fireEvent.keyDown(slider(), { key: "ArrowUp", shiftKey: true });
    expect(slider().getAttribute("aria-valuenow")).toBe("1110");
    // 1110 + 100 would be 1210: the step crosses the forecast mark and lands on it.
    fireEvent.keyDown(slider(), { key: "PageUp" });
    expect(slider().getAttribute("aria-valuenow")).toBe("1180");
    fireEvent.keyDown(slider(), { key: "PageUp" });
    expect(slider().getAttribute("aria-valuenow")).toBe("1268");
    fireEvent.keyDown(slider(), { key: "PageUp" });
    expect(slider().getAttribute("aria-valuenow")).toBe("1320");
    fireEvent.keyDown(slider(), { key: "PageUp" });
    expect(slider().getAttribute("aria-valuenow")).toBe("1420");
    fireEvent.keyDown(slider(), { key: "End" });
    expect(slider().getAttribute("aria-valuenow")).toBe("1500");
    fireEvent.keyDown(slider(), { key: "Home" });
    expect(slider().getAttribute("aria-valuenow")).toBe("500");
    expect(count()).toBe("100");
  });

  it("jumps to the next detent with Enter and the chips set the line", () => {
    render(<HundredWeeks copy={COPY.de} />);
    fireEvent.keyDown(slider(), { key: "Enter" });
    expect(slider().getAttribute("aria-valuenow")).toBe("1180");
    expect(count()).toBe("50");
    fireEvent.click(
      document.querySelector('[data-hw-chip="p90"]') as HTMLElement,
    );
    expect(count()).toBe("10");
    fireEvent.click(
      document.querySelector('[data-hw-chip="best"]') as HTMLElement,
    );
    expect(slider().getAttribute("aria-valuenow")).toBe("1268");
    expect(count()).toBe("25");
    fireEvent.click(
      document.querySelector('[data-hw-chip="today"]') as HTMLElement,
    );
    expect(count()).toBe("76");
  });

  it("moves the diamond with the Waage and the takeaways follow the line", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const group = screen.getByRole("radiogroup", {
      name: COPY.de.controls.waageLabel,
    });
    fireEvent.click(within(group).getByRole("radio", { name: "9x" }));
    expect(
      document.querySelector('[data-hw-chip="best"]')?.textContent,
    ).toContain("1.320");
    fireEvent.click(within(group).getByRole("radio", { name: "1x" }));
    expect(
      document.querySelector('[data-hw-chip="best"]')?.textContent,
    ).toContain("1.180");
    fireEvent.click(
      document.querySelector('[data-hw-chip="forecast"]') as HTMLElement,
    );
    const mail = document.querySelector("[data-hw-text]")?.textContent ?? "";
    expect(mail).toContain("Lager 1.180: In 50 von 100");
    expect(mail).toContain("Bei gleichem Gewicht");
  });

  it("scrubs to another week: the strip counts follow, the line stays", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const strip = screen.getByRole("radiogroup", {
      name: COPY.de.controls.stripLabel,
    });
    const cells = within(strip).getAllByRole("radio");
    expect(
      cells.map((cell) => cell.querySelector(".hw-cell-count")?.textContent),
    ).toEqual(["0", "0", "19", "60", "76", "63", "18"]);
    expect(cells[4]?.getAttribute("aria-label")).toBe(
      "Woche Start, in 76 von 100 zu wenig",
    );
    fireEvent.keyDown(cells[4] as HTMLElement, { key: "ArrowLeft" });
    expect(count()).toBe("60");
    expect(slider().getAttribute("aria-valuenow")).toBe("1050");
  });

  it("says what is wrong while the visitor types, keeps the last valid chart, and resets to the workshop case", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const p50 = screen.getByLabelText(COPY.de.form.p50) as HTMLInputElement;
    fireEvent.change(p50, { target: { value: "900" } });
    // No blur, no pause: the message and the last-valid note are there at once.
    expect(
      screen.getAllByText(COPY.de.form.errors.order).length,
    ).toBeGreaterThan(0);
    expect(p50.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(COPY.de.form.lastValid)).toBeTruthy();
    expect(count()).toBe("76");
    fireEvent.change(p50, { target: { value: "1.100" } });
    expect(screen.queryByText(COPY.de.form.lastValid)).toBeNull();
    expect(
      document.querySelector("[data-hw]")?.getAttribute("data-source"),
    ).toBe("own");
    expect(document.querySelector("[data-hw-strip]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: COPY.de.form.reset }));
    expect(
      document.querySelector("[data-hw]")?.getAttribute("data-source"),
    ).toBe("workshop");
    expect(count()).toBe("76");
    expect(document.querySelector("[data-hw-strip]")).not.toBeNull();
  });

  it("puts the order error under the range field that is being typed, with the note kept until the input is valid", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const p10 = screen.getByLabelText(COPY.de.form.p10) as HTMLInputElement;
    fireEvent.change(p10, { target: { value: "1500" } });
    const note = document.getElementById(
      p10.getAttribute("aria-describedby") as string,
    ) as HTMLElement;
    expect(note.getAttribute("aria-live")).toBe("polite");
    expect(note.textContent).toContain(COPY.de.form.errors.order);
    expect(note.textContent).toContain(COPY.de.form.lastValid);
    fireEvent.change(p10, { target: { value: "150" } });
    expect(note.textContent).not.toContain(COPY.de.form.lastValid);
    expect(p10.getAttribute("aria-invalid")).toBeNull();
  });

  it("takes all six fields in a row: the chip, the slider and the mail follow the typed stock, in the typed unit", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const type = (label: string, value: string) =>
      fireEvent.change(screen.getByLabelText(label) as HTMLInputElement, {
        target: { value },
      });
    type(COPY.de.form.p10, "400");
    type(COPY.de.form.p50, "500");
    type(COPY.de.form.p90, "700");
    type(COPY.de.form.supply, "550");
    type(COPY.de.form.ratio, "2");
    type(COPY.de.form.unit, "Kisten");
    const today = document.querySelector('[data-hw-chip="today"]') as HTMLElement;
    expect(today.textContent).toContain("550");
    expect(today.getAttribute("aria-pressed")).toBe("true");
    expect(slider().getAttribute("aria-valuenow")).toBe("550");
    expect(slider().getAttribute("aria-valuetext")).toContain("Lager 550");
    const mail = document.querySelector("[data-hw-text]")?.textContent ?? "";
    expect(mail).toContain("Prognose 500 Kisten (Spanne 400 bis 700), Lager 550:");
    expect(mail).toContain("die fehlenden Kisten zuerst");
    expect(mail).not.toContain("übrige Kisten");
    expect(mail).toContain("2-mal so schwer wie eine übrige Einheit");
  });

  it("moves the line to a typed stock even after the visitor dragged it, and to a typed range only while it is untouched", () => {
    render(<HundredWeeks copy={COPY.de} />);
    fireEvent.keyDown(slider(), { key: "End" });
    const p90 = screen.getByLabelText(COPY.de.form.p90) as HTMLInputElement;
    fireEvent.change(p90, { target: { value: "1.400" } });
    expect(slider().getAttribute("aria-valuenow")).toBe("1500");
    fireEvent.change(
      screen.getByLabelText(COPY.de.form.supply) as HTMLInputElement,
      { target: { value: "1.100" } },
    );
    expect(slider().getAttribute("aria-valuenow")).toBe("1100");
  });

  it("leaves the stock field quiet while it is emptied, and says so when the visitor leaves it", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const supply = screen.getByLabelText(COPY.de.form.supply) as HTMLInputElement;
    fireEvent.change(supply, { target: { value: "" } });
    expect(screen.queryByText(COPY.de.form.errors.number)).toBeNull();
    fireEvent.blur(supply);
    expect(screen.getByText(COPY.de.form.errors.number)).toBeTruthy();
  });

  it("shows the numbers in English with English separators", () => {
    render(<HundredWeeks copy={COPY.en} />);
    expect(slider().getAttribute("aria-valuetext")).toBe(
      "Stock 1,050, short in 76 of 100 possible launch weeks",
    );
    expect(document.querySelector("[data-hw-text]")?.textContent).toContain(
      "Forecast 1,180 units",
    );
  });

  it("copies the shown text, and falls back to execCommand when the clipboard rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    render(<HundredWeeks copy={COPY.de} />);
    const shown = document.querySelector("[data-hw-text]")?.textContent;
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", {
          name: COPY.de.takeaways.copy,
        })[0] as HTMLElement,
      );
    });
    expect(writeText).toHaveBeenCalledWith(shown);
    expect(exec).toHaveBeenCalledWith("copy");
    expect(
      screen.getAllByText(COPY.de.takeaways.copied).length,
    ).toBeGreaterThan(0);
  });

  it("offers select-and-copy when both paths fail", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) },
    });
    (document as unknown as { execCommand: unknown }).execCommand = vi
      .fn()
      .mockReturnValue(false);
    render(<HundredWeeks copy={COPY.de} />);
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", {
          name: COPY.de.takeaways.copy,
        })[0] as HTMLElement,
      );
    });
    expect(
      screen.getAllByRole("button", { name: COPY.de.takeaways.selectCopy })
        .length,
    ).toBe(1);
  });

  it("makes no network call and writes no storage during a full interaction", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const send = vi.fn();
    vi.stubGlobal("navigator", { ...navigator, sendBeacon: send });
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<HundredWeeks copy={COPY.de} />);
    fireEvent.keyDown(slider(), { key: "Enter" });
    fireEvent.click(
      document.querySelector('[data-hw-chip="best"]') as HTMLElement,
    );
    fireEvent.change(screen.getByLabelText(COPY.de.form.p90), {
      target: { value: "1.400" },
    });
    fireEvent.blur(screen.getByLabelText(COPY.de.form.p90));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(
      document.querySelector("details, summary, [role=tablist]"),
    ).toBeNull();
  });
});

describe("HundredWeeks, motion allowed", () => {
  it("shows the first frame of the count-in while it waits, hides the Waage and the strip, and hands over on the first key", () => {
    mockMedia(false);
    render(<HundredWeeks copy={COPY.de} />);
    expect(
      document.querySelector("[data-hw]")?.getAttribute("data-phase"),
    ).toBe("wait");
    expect(document.querySelector("[data-hw-waage]")).toBeNull();
    expect(document.querySelector("[data-hw-strip]")).toBeNull();
    // The first frame is the start of the count-in, not the finished 76 that
    // would reset to zero a moment later.
    expect(count()).toBe("0");
    fireEvent.keyDown(slider(), { key: "ArrowUp" });
    expect(
      document.querySelector("[data-hw]")?.getAttribute("data-phase"),
    ).toBe("live");
    expect(slider().getAttribute("aria-valuenow")).toBe("1060");
    expect(document.querySelector("[data-hw-waage]")).not.toBeNull();
    expect(document.querySelector("[data-hw-strip]")).toBeNull();
  });

  it("orders the phone column count, chart, chips, Waage, week strip, legend, notes", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "src/components/demos/ki-prognosen-einschaetzen/hundred-weeks.css",
      ),
      "utf8",
    );
    const order = (selector: string) =>
      Number(
        new RegExp(`\\${selector}\\s*\\{\\s*order:\\s*(\\d+)`).exec(css)?.[1],
      );
    const sequence = [
      ".hw-counter-slot",
      ".hw-stage",
      ".hw-chips",
      ".hw-waage",
      ".hw-strip-wrap",
      ".hw-under",
      ".hw-notes",
    ].map(order);
    expect(sequence).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("hides the replay button when motion is reduced, and shows it otherwise", () => {
    const { unmount } = render(<HundredWeeks copy={COPY.de} />);
    expect(document.querySelector("[data-hw-replay]")).toBeNull();
    unmount();
    mockMedia(false);
    render(<HundredWeeks copy={COPY.de} />);
    expect(document.querySelector("[data-hw-replay]")).not.toBeNull();
  });

  it("reveals the Waage after eight idle seconds", () => {
    mockMedia(false);
    vi.useFakeTimers();
    render(<HundredWeeks copy={COPY.de} />);
    fireEvent.focus(slider());
    expect(document.querySelector("[data-hw-waage]")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(8100);
    });
    expect(document.querySelector("[data-hw-waage]")).not.toBeNull();
    expect(document.querySelector("[data-hw-status]")?.textContent).toBe(
      COPY.de.controls.announceLayer2,
    );
  });
});

describe("HundredWeeks, layers and the counter", () => {
  it("brings the week strip with the first tap on the Waage, not before", () => {
    mockMedia(false);
    render(<HundredWeeks copy={COPY.de} />);
    const layer = () =>
      document.querySelector("[data-hw]")?.getAttribute("data-layer");
    fireEvent.click(
      document.querySelector('[data-hw-chip="forecast"]') as HTMLElement,
    );
    expect(layer()).toBe("2");
    expect(document.querySelector("[data-hw-waage]")).not.toBeNull();
    expect(document.querySelector("[data-hw-strip]")).toBeNull();
    // Tapping the rating that is already chosen counts as the first Waage tap.
    fireEvent.click(screen.getByRole("radio", { name: "1x" }));
    expect(layer()).toBe("3");
    expect(document.querySelector("[data-hw-strip]")).not.toBeNull();
    expect(document.querySelector("[data-hw-status]")?.textContent).toBe(
      COPY.de.controls.announceLayer3,
    );
  });

  it("writes the count in ink, not alarm red, while fewer than 10 weeks are short", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const numeral = () =>
      document.querySelector("[data-hw-count]") as HTMLElement;
    expect(numeral().hasAttribute("data-low")).toBe(false);
    fireEvent.keyDown(slider(), { key: "End" });
    expect(count()).toBe("0");
    expect(numeral().hasAttribute("data-low")).toBe(true);
  });
});

describe("HundredWeeks, the chart stays quiet", () => {
  it("names only the line that sits under the handle, never the forecast on its own", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const names = () =>
      [...document.querySelectorAll(".hw-tag text")].map(
        (node) => node.textContent,
      );
    expect(names()).toEqual(["heute"]);
    fireEvent.click(
      document.querySelector('[data-hw-chip="p90"]') as HTMLElement,
    );
    expect(names()).toEqual(["oben"]);
    fireEvent.keyDown(slider(), { key: "Home" });
    expect(names()).toEqual([]);
  });

  it("writes one big label on the red: 'fehlt in 76 von 100', and none when nothing is short", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const label = () => document.querySelector(".hw-red-label text")?.textContent;
    expect(label()).toBe("fehlt in 76 von 100");
    fireEvent.keyDown(slider(), { key: "End" });
    expect(label()).toBeUndefined();
  });

  it("keeps the p-letters and the averages shorthand to the working block", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const root = document.querySelector("[data-hw]") as HTMLElement;
    const clone = root.cloneNode(true) as HTMLElement;
    clone.querySelector("[data-hw-takeaways]")?.remove();
    const text = `${clone.textContent} ${[...clone.querySelectorAll("[aria-label],[aria-valuetext]")].map((n) => n.getAttribute("aria-label")).join(" ")}`;
    expect(text).not.toMatch(/\bp(10|50|90)\b|Ø|Waage/);
  });

  it("cycles through the marks on Enter, wraps at the ends and goes back with Shift+Enter", () => {
    render(<HundredWeeks copy={COPY.de} />);
    const value = () => slider().getAttribute("aria-valuenow");
    fireEvent.click(
      document.querySelector('[data-hw-chip="p90"]') as HTMLElement,
    );
    // Above the last mark nothing is left: wrap to the first.
    fireEvent.keyDown(slider(), { key: "Enter" });
    expect(value()).toBe("1050");
    fireEvent.keyDown(slider(), { key: "Enter" });
    expect(value()).toBe("1180");
    fireEvent.keyDown(slider(), { key: "Enter" });
    expect(value()).toBe("1268");
    fireEvent.keyDown(slider(), { key: "Enter", shiftKey: true });
    expect(value()).toBe("1180");
    fireEvent.keyDown(slider(), { key: "Enter", shiftKey: true });
    fireEvent.keyDown(slider(), { key: "Enter", shiftKey: true });
    expect(value()).toBe("1320");
    fireEvent.keyDown(slider(), { key: "End" });
    fireEvent.keyDown(slider(), { key: "Enter" });
    expect(value()).toBe("1050");
  });
});

describe("geometry", () => {
  const frame = makeFrame(358, 320, [500, 1500]);

  it("spends the width on the plot: a full-bleed 390 px chart gets about 296 px for the 100 weeks", () => {
    const wide = makeFrame(390, 330, [500, 1500]);
    expect(wide.right - wide.left).toBeGreaterThanOrEqual(290);
    expect(wide.unit).toBeCloseTo((wide.right - wide.left) / 100, 5);
  });

  it("magnets to a detent within 8 px and releases beyond it", () => {
    const y = (value: number) =>
      frame.bottom - ((value - 500) / 1000) * (frame.bottom - frame.top);
    expect(capAt(frame, y(1180) + 5, [1050, 1180])).toBe(1180);
    expect(capAt(frame, y(1180) + 12, [1050, 1180])).not.toBe(1180);
  });

  it("draws each class as one polygon and cuts the weeks apart with seams", () => {
    const samples = Array.from({ length: 100 }, (_, k) => 900 + k * 5);
    const paths = columnPaths(frame, samples, 1050);
    for (const path of [paths.ink, paths.short, paths.left]) {
      expect((path.match(/M/g) ?? []).length).toBe(1);
      expect(path.endsWith("Z")).toBe(true);
    }
    expect(paths.pending).toBe("");
    // 99 gaps between 100 weeks: 90 plain ones and 9 after every tenth week.
    expect((paths.seams.match(/M/g) ?? []).length).toBe(90);
    expect((paths.tens.match(/M/g) ?? []).length).toBe(9);
  });

  it("leaves the weeks the scan has not reached as a grey silhouette", () => {
    const samples = Array.from({ length: 100 }, (_, k) => 900 + k * 5);
    const paths = columnPaths(frame, samples, 1050, 8);
    expect(paths.short).toBe("");
    expect(paths.ink.length).toBeGreaterThan(0);
    expect(paths.pending.length).toBeGreaterThan(0);
    expect(paths.tails).toBe("");
    const none = columnPaths(frame, samples, 1050, 0);
    expect(none.ink).toBe("");
    expect(none.pending.length).toBeGreaterThan(0);
  });

  it("snaps an arrow step to a mark it crosses or ends within 8 units of, and never holds the line on a mark", () => {
    const marks = [1050, 1180, 1268, 1320];
    expect(magnet(1050, 1060, marks)).toBe(1060);
    expect(magnet(1170, 1180, marks)).toBe(1180);
    expect(magnet(1172, 1182, marks)).toBe(1180);
    expect(magnet(1110, 1210, marks)).toBe(1180);
    expect(magnet(1180, 1190, marks)).toBe(1190);
    expect(magnet(1200, 1190, marks)).toBe(1190);
    expect(magnet(1190, 1180, marks)).toBe(1180);
    expect(magnet(1500, 1300, marks)).toBe(1320);
    expect(magnet(1000, 1010, marks)).toBe(1010);
  });

  it("cycles marks with wraparound in both directions", () => {
    const marks = [1320, 1050, 1180, 1268];
    expect(nextDetent(1050, marks, 1)).toBe(1180);
    expect(nextDetent(1320, marks, 1)).toBe(1050);
    expect(nextDetent(1500, marks, 1)).toBe(1050);
    expect(nextDetent(1050, marks, -1)).toBe(1320);
    expect(nextDetent(1100, marks, -1)).toBe(1050);
    expect(nextDetent(1100, [], 1)).toBe(1100);
  });

  it("puts the red label on the red when it is tall enough there, above the staircase when it is not, and nowhere without red", () => {
    const wide = makeFrame(744, 470, [500, 1500]);
    const samples = Array.from({ length: 100 }, (_, k) => 980 + k * 3.4);
    const inside = redLabelBox(wide, samples, 1050, 150, 28);
    expect(inside).not.toBeNull();
    const capY =
      wide.bottom - ((1050 - 500) / 1000) * (wide.bottom - wide.top);
    expect((inside?.y ?? 0) + 28).toBeLessThan(capY);
    expect((inside?.x ?? 0) + 150).toBeLessThanOrEqual(wide.right);
    // A line near the top leaves a sliver of red: the label goes above the stairs.
    const sliver = redLabelBox(wide, samples, 1300, 150, 28);
    const topOfStairs =
      wide.bottom -
      (((samples[99] as number) - 500) / 1000) * (wide.bottom - wide.top);
    expect((sliver?.y ?? 99) + 28).toBeLessThanOrEqual(topOfStairs);
    expect(redLabelBox(wide, samples, 1500, 150, 28)).toBeNull();
  });
});
