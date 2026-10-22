import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_TEXT } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy";
import MakeTheNumberRightDemo from "./index";
import { copyText } from "./takeaways";

const WEBSITE = join(__dirname, "../../../..");

function mockReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

/** The client's name from the deck's resolution scene, never written into a file. */
function clientName(): string {
  const deck = readFileSync(join(WEBSITE, "public/workshops/datenbereitschaft-fuer-ki/slides.html"), "utf8");
  const start = deck.search(/<section[^>]*id="resolution"/);
  const scene = deck.slice(start, deck.indexOf("</section>", start));
  return (/×\s*([^<\s][^<]*)</.exec(scene)?.[1] ?? "").trim();
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.location.hash = "";
  mockReducedMotion(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function input(request: string, blank: string, value: string): HTMLInputElement {
  const el = document.querySelector<HTMLInputElement>(`#anfrage-${request} fieldset[data-blank="${blank}"] input[value="${value}"]`);
  if (!el) throw new Error(`no ${request}/${blank}/${value}`);
  return el;
}

function pick(request: string, definition: Record<string, string>) {
  for (const [blank, value] of Object.entries(definition)) fireEvent.click(input(request, blank, value));
}

function submit(request: string) {
  const button = document.querySelector<HTMLButtonElement>(`button[data-check="${request}"]`);
  if (!button) throw new Error(`no check ${request}`);
  fireEvent.click(button);
}

const receipt = (id: string) => document.querySelector<HTMLElement>(`[data-receipt="${id}"]`) as HTMLElement;

describe("server render", () => {
  it.each(["de", "en"] as const)("renders every request, every receipt and the full take-aways in %s", (locale) => {
    const html = renderToString(<MakeTheNumberRightDemo locale={locale} />);
    for (const id of ["anfrage-01", "anfrage-02", "anfrage-03", "anfrage-04", "anfrage-05", "mitnehmen"]) {
      expect(html).toContain(`id="${id}"`);
    }
    for (const id of ["01", "02", "03", "05", "G01", "C01", "R01", "R02", "F01"]) {
      expect(html).toContain(`data-receipt="${id}"`);
    }
    for (const card of DEMO_TEXT[locale].takeaways) {
      // React escapes quotes in text; compare one plain line of each card.
      expect(html).toContain(card.title);
    }
  });

  it("has no collapsible UI", () => {
    const { container } = render(<MakeTheNumberRightDemo locale="de" />);
    expect(container.querySelector("details, summary, [aria-expanded]")).toBeNull();
  });

  it("gives every group a legend", () => {
    const { container } = render(<MakeTheNumberRightDemo locale="de" />);
    const fieldsets = container.querySelectorAll("fieldset");
    expect(fieldsets.length).toBeGreaterThan(20);
    for (const fieldset of fieldsets) expect(fieldset.querySelector(":scope > legend")?.textContent?.trim()).toBeTruthy();
  });

  it("renders English without German UI words and without the client's name", () => {
    const html = renderToString(<MakeTheNumberRightDemo locale="en" />);
    const de = DEMO_TEXT.de;
    const en = DEMO_TEXT.en;
    const german = [de.check, de.requestWord, de.copy, ...Object.values(de.verdicts), ...Object.values(de.legends)].filter(
      (word) => !Object.values(en).includes(word),
    );
    for (const word of german) expect(html).not.toContain(`>${word}<`);
    expect(html).not.toContain("Anfrage 0");
    expect(html).not.toContain("Prüfen");
    const name = clientName();
    expect(name.length).toBeGreaterThan(3);
    for (const locale of ["de", "en"] as const) {
      expect(renderToString(<MakeTheNumberRightDemo locale={locale} />).toLowerCase()).not.toContain(name.toLowerCase());
    }
  });
});

describe("definition requests", () => {
  it("solves 01 and says Stimmt, focus on the receipt heading", () => {
    render(<MakeTheNumberRightDemo locale="de" />);
    pick("01", { kind: "level", grain: "perMonth", period: "eachMonth", table: "analytics.mrr_summary_monthly" });
    submit("01");
    expect(receipt("01").dataset.verdict).toBe("correct");
    expect(receipt("01").textContent).toContain(DEMO_TEXT.de.verdicts.correct);
    expect(document.activeElement?.tagName).toBe("H3");
    expect(document.querySelector('[data-rail="01"]')?.getAttribute("data-status")).toBe("solved");
    expect(document.querySelector('[data-live]')?.textContent).toContain(DEMO_TEXT.de.verdicts.correct);
  });

  it("marks a receipt out of date after a change, and run 2 offers the blank to change", () => {
    render(<MakeTheNumberRightDemo locale="de" />);
    pick("01", { kind: "level", grain: "single", period: "sumMonths", table: "analytics.mrr_summary_monthly" });
    submit("01");
    expect(receipt("01").dataset.verdict).toBe("wrong");
    expect(receipt("01").querySelector("[data-change-blank]")).toBeNull();
    submit("01");
    const change = receipt("01").querySelector<HTMLButtonElement>("[data-change-blank]");
    expect(change?.dataset.changeBlank).toBe("period");
    fireEvent.click(change as HTMLButtonElement);
    expect((document.activeElement as HTMLElement | null)?.closest("fieldset")?.dataset.blank).toBe("period");
    fireEvent.click(input("01", "grain", "perMonth"));
    expect(receipt("01").dataset.stale).toBe("true");
    expect(receipt("01").textContent).toContain(DEMO_TEXT.de.stale);
  });

  it("focuses the first open blank on an open run", () => {
    render(<MakeTheNumberRightDemo locale="de" />);
    pick("03", { kind: "rate" });
    submit("03");
    expect(receipt("03").dataset.verdict).toBe("open");
    const blank = (document.activeElement as HTMLElement | null)?.closest("fieldset")?.dataset.blank;
    expect(blank).toBeTruthy();
    expect(blank).not.toBe("kind");
  });

  it("pools 05 and says the export average is wrong first", () => {
    render(<MakeTheNumberRightDemo locale="en" />);
    pick("05", { kind: "rate", table: "analytics.attrition_by_department_quarter", combine: "averageRates", base: "startOfQuarter" });
    submit("05");
    expect(receipt("05").dataset.verdict).toBe("wrong");
    pick("05", { combine: "pool" });
    submit("05");
    expect(receipt("05").dataset.verdict).toBe("correct");
  });
});

describe("triage cards", () => {
  it("shows the follow-up part only once the behaviour is right", () => {
    render(<MakeTheNumberRightDemo locale="de" />);
    const card = document.querySelector<HTMLElement>('[data-card="R02"]') as HTMLElement;
    fireEvent.click(card.querySelector('input[value="answer"]') as HTMLInputElement);
    fireEvent.click(card.querySelector("button[data-check-card]") as HTMLButtonElement);
    const first = receipt("R02");
    expect(first.dataset.verdict).toBe("wrong");
    const parts = first.querySelector("[data-parts]")?.textContent ?? "";
    expect(parts).not.toContain(DEMO_TEXT.de.parts.lock);

    fireEvent.click(card.querySelector('input[value="refuse"]') as HTMLInputElement);
    fireEvent.click(card.querySelector('input[value="sqlGuard"]') as HTMLInputElement);
    fireEvent.click(card.querySelector("button[data-check-card]") as HTMLButtonElement);
    expect(receipt("R02").dataset.verdict).toBe("wrong");
    expect(receipt("R02").querySelector("[data-parts]")?.textContent).toContain(DEMO_TEXT.de.parts.lock);

    fireEvent.click(card.querySelector('input[value="postgresRole"]') as HTMLInputElement);
    fireEvent.click(card.querySelector("button[data-check-card]") as HTMLButtonElement);
    expect(receipt("R02").dataset.verdict).toBe("correct");
  });

  it("builds the ask-back sentence live from the ticked gaps", () => {
    render(<MakeTheNumberRightDemo locale="de" />);
    const card = document.querySelector<HTMLElement>('[data-card="C01"]') as HTMLElement;
    const ask = () => card.querySelector("[data-ask-back]")?.textContent ?? "";
    const before = ask();
    fireEvent.click(card.querySelector('input[value="period"]') as HTMLInputElement);
    expect(ask()).not.toBe(before);
  });
});

describe("take-aways", () => {
  it("copies the card text exactly, without the example, and confirms visibly", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<MakeTheNumberRightDemo locale="de" />);
    const test = DEMO_TEXT.de.takeaways.find((card) => card.example);
    expect(test).toBeDefined();
    const button = document.querySelector<HTMLButtonElement>(`button[data-copy="${test?.id}"]`) as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeText).toHaveBeenCalledWith(test?.text);
    expect(String(writeText.mock.calls[0][0])).not.toContain(test?.example?.text.slice(0, 20));
    expect(button.textContent).toContain(DEMO_TEXT.de.copied);
  });

  it("copies a no-break space between number and unit as a plain space", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    await expect(copyText("19 von 200 = 9,5\u00a0%")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("19 von 200 = 9,5 %");
  });

  it("falls back to execCommand when the clipboard is missing", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: exec });
    render(<MakeTheNumberRightDemo locale="en" />);
    const button = document.querySelector<HTMLButtonElement>('button[data-copy="definition"]') as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(button);
    });
    expect(exec).toHaveBeenCalledWith("copy");
    expect(button.textContent).toContain(DEMO_TEXT.en.copied);
  });
});

describe("motion", () => {
  it("starts no animation frame under reduced motion", () => {
    mockReducedMotion(true);
    const raf = vi.spyOn(window, "requestAnimationFrame");
    render(<MakeTheNumberRightDemo locale="de" />);
    pick("01", { kind: "level", grain: "single", period: "sumMonths", table: "analytics.mrr_summary_monthly" });
    submit("01");
    expect(receipt("01").querySelector('[data-reading="stackLevels"]')).not.toBeNull();
    expect(raf).not.toHaveBeenCalled();
  });

  it("animates the tower when motion is allowed", () => {
    mockReducedMotion(false);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    render(<MakeTheNumberRightDemo locale="de" />);
    pick("01", { kind: "level", grain: "single", period: "sumMonths", table: "analytics.mrr_summary_monthly" });
    submit("01");
    expect(raf).toHaveBeenCalled();
  });
});

describe("receipt values", () => {
  it("break only before =, after a comma or before a count's noun", async () => {
    const { valueChunks } = await import("./receipt");
    expect(valueChunks("19 von 200 = 9,5\u00a0%")).toEqual(["19 von 200", "= 9,5\u00a0%"]);
    expect(valueChunks("0 von 0, keine Quote")).toEqual(["0 von 0,", "keine Quote"]);
    expect(valueChunks("1.066.140\u00a0€")).toEqual(["1.066.140\u00a0€"]);
    expect(valueChunks("206 Beschäftigte")).toEqual(["206", "Beschäftigte"]);
    expect(valueChunks("+25 accounts")).toEqual(["+25", "accounts"]);
    expect(valueChunks("keine prüfbare Zahl")).toEqual(["keine prüfbare Zahl"]);
  });
});
