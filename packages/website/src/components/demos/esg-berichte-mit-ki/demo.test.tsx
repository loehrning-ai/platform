import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import Demo from "./demo";
import Tile from "./tile";

function mockMatchMedia(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

const figure = (container: HTMLElement) => container.querySelector(".esg-field__num")?.textContent;
/** The bill stays shut until something is guessed: this makes a guess with the keyboard. */
const guess = (container: HTMLElement, key = "PageUp") => fireEvent.keyDown(container.querySelector(".esg-slot") as HTMLElement, { key });
const takeText = (container: HTMLElement, id: string) => container.querySelector(`[data-take="${id}"] .esg-block__text`)?.textContent ?? "";

describe("Elf von zwölf (component)", () => {
  beforeEach(() => mockMatchMedia(true));
  afterEach(() => vi.unstubAllGlobals());

  it("starts on the hero state: the draft figure, a hole, NOT FOUND", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    expect(figure(container)).toBe("279,7");
    expect(screen.getByText("NOT FOUND")).toBeTruthy();
    expect(container.querySelectorAll("[role=img]").length).toBeGreaterThanOrEqual(12);
  });

  it("moves the guess with the keyboard, in half steps, and says it in aria-valuetext", () => {
    const { container } = render(<Demo pack={COPY.en} />);
    const slot = container.querySelector(".esg-slot") as HTMLElement;
    fireEvent.keyDown(slot, { key: "ArrowUp" });
    fireEvent.keyDown(slot, { key: "PageUp" });
    expect(slot.getAttribute("aria-valuenow")).toBe("5.5");
    expect(slot.getAttribute("aria-valuetext")).toBe("estimated 5.5 MWh");
    expect(figure(container)).toBe("285.2");
    expect(screen.getByText("NEEDS CHECK")).toBeTruthy();
    fireEvent.keyDown(slot, { key: "End" });
    expect(slot.getAttribute("aria-valuenow")).toBe("45");
    fireEvent.keyDown(slot, { key: "Home" });
    expect(slot.getAttribute("aria-valuenow")).toBe("0");
  });

  it("the guess changes the number, never the takeaways", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    const before = container.querySelector('[data-take="answer"] .esg-block__text')?.textContent;
    fireEvent.keyDown(container.querySelector(".esg-slot") as HTMLElement, { key: "PageUp" });
    expect(container.querySelector('[data-take="answer"] .esg-block__text')?.textContent).toBe(before);
    expect(before).toContain("NOT FOUND");
  });

  it("opens the bill (reduced motion: at once), locks the guess, and scrubs back both ways", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.keyDown(container.querySelector(".esg-slot") as HTMLElement, { key: "PageUp" });
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    expect(figure(container)).toBe("320,9");
    expect(screen.getByText("OK")).toBeTruthy();
    expect(container.querySelectorAll(".esg-ladder__row")).toHaveLength(5);
    expect(container.querySelector(".esg-slot")?.getAttribute("aria-readonly")).toBe("true");
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "0.5" } });
    expect(slider.getAttribute("aria-valuetext")).toBe("Rechnung geöffnet 50 %");
    fireEvent.change(slider, { target: { value: "0" } });
    expect(figure(container)).toBe("284,7");
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    fireEvent.click(screen.getByRole("button", { name: /neu tippen/ }));
    expect(figure(container)).toBe("284,7");
  });

  it("keeps the bill shut until the first guess, and hides the rewind slider until the bill was opened", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    const open = container.querySelector(".esg-reveal .esg-btn") as HTMLButtonElement;
    expect(open.getAttribute("aria-disabled")).toBe("true");
    expect(open.textContent).toBe("Erst tippen, dann öffnen.");
    fireEvent.click(open);
    expect(figure(container)).toBe("279,7");
    expect(container.querySelector("input[type=range]")).toBeNull();
    guess(container);
    expect(open.getAttribute("aria-disabled")).toBeNull();
    expect(open.textContent).toBe("EL-25-09 öffnen");
    expect(container.querySelector("input[type=range]")).toBeNull();
    fireEvent.click(open);
    expect(figure(container)).toBe("320,9");
    expect(container.querySelector(".esg-reveal__label")?.textContent).toBe("Ziehen zum Zurückspulen");
  });

  it("a guess of exactly 0 is a deliberate no-guess: the ladder has four rows and no ghost", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    guess(container, "Home");
    fireEvent.click(screen.getByRole("button", { name: /öffnen/ }));
    expect(container.querySelectorAll(".esg-ladder__row")).toHaveLength(4);
    expect(container.querySelector(".esg-legend__item--guess")).toBeNull();
  });

  it("copies the answer line and confirms it, with a fallback when the clipboard is blocked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<Demo pack={COPY.de} />);
    const buttons = screen.getAllByRole("button", { name: "Kopieren" });
    await act(async () => fireEvent.click(buttons[0] as HTMLElement));
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0]?.[0]).toContain("mindestens 279,7 MWh belegt");
    expect(screen.getByText("Kopiert")).toBeTruthy();
  });

  it("draws the invoice sheet with 41,2 while the bill opens, and the off-by label once it landed", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    guess(container, "End");
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "0.4" } });
    expect(container.querySelector(".esg-sheet")?.textContent).toContain("EL-25-09");
    expect(container.querySelector(".esg-sheet__val")?.textContent).toBe("41,2 MWh");
    expect(container.querySelector(".esg-off")).toBeNull();
    fireEvent.change(slider, { target: { value: "1" } });
    expect(container.querySelector(".esg-sheet")).toBeNull();
    expect(container.querySelector(".esg-off")?.textContent).toBe("daneben um 3,8 MWh");
  });

  it("puts the Leiter straight after the stage and before the takeaways", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    guess(container);
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    const order = [...container.querySelectorAll(".esg-main, .esg-ladder, .esg-side")].map((node) => node.className);
    expect(order).toEqual(["esg-main", "esg-ladder", "esg-side"]);
  });

  it("switches series: water is complete, its mail is disabled; own numbers read a paste", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.click(screen.getByLabelText("Wasser 2025"));
    expect(figure(container)).toBe("4.630");
    expect(screen.getByText("OK")).toBeTruthy();
    expect((container.querySelector('[data-take="mail"] button') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("Meine Zahlen"));
    expect(container.querySelector(".esg-empty")).toBeTruthy();
    fireEvent.change(container.querySelector(".esg-own__text") as HTMLTextAreaElement, {
      target: { value: "Jan 21.400\nFeb 19.800\nxyz" },
    });
    expect(container.querySelector(".esg-count")?.textContent).toBe("2/12");
    expect(container.querySelectorAll(".esg-issue--unread")).toHaveLength(1);
    // German "21.400" is plain thousands: read silently, no chip
    expect(figure(container)).toBe("41.200");
    expect(container.querySelectorAll(".esg-chip")).toHaveLength(0);
    // "19,800" is three decimals in German: read as 19,8 and shown with the other reading
    fireEvent.change(container.querySelector(".esg-own__text") as HTMLTextAreaElement, {
      target: { value: "Jan 21,400\nFeb 19,800" },
    });
    expect(figure(container)).toBe("41,2");
    // one chip for the whole doubtful reading, not one per row
    expect(container.querySelectorAll(".esg-chip")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Komma als Dezimal gelesen: Jan 21,400 = 21,4\. Als 21\.400 lesen\? \(2 Werte\)/ }));
    expect(figure(container)).toBe("41.200");
    expect(container.querySelector(".esg-chip")?.getAttribute("aria-pressed")).toBe("true");
  });

  it("reads 24 000 with a space as 24000 and marks a zero for confirmation", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.click(screen.getByLabelText("Meine Zahlen"));
    fireEvent.change(container.querySelector(".esg-own__text") as HTMLTextAreaElement, {
      target: { value: "Jan 21 400\nAug 24 000\nSep 0" },
    });
    expect(figure(container)).toBe("45.400");
    expect(container.textContent).toContain("Null?");
  });

  it("drops the example's label and unit as soon as a number changes, and on Leeren", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.click(screen.getByLabelText("Meine Zahlen"));
    fireEvent.click(screen.getByRole("button", { name: "Beispiel einsetzen" }));
    const answer = () => container.querySelector('[data-take="answer"] .esg-block__text')?.textContent ?? "";
    expect(answer()).toContain("Stromverbrauch 2025: mindestens");
    expect(answer()).toContain("kWh");
    expect(container.querySelector(".esg-own__prefilled")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Januar, gelesener Wert"), { target: { value: "1000" } });
    expect(answer()).not.toContain("Stromverbrauch");
    expect(answer()).not.toContain("kWh");
    expect((container.querySelector(".esg-own__field input") as HTMLInputElement).value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Leeren" }));
    expect(container.querySelector(".esg-empty")).toBeTruthy();
  });

  it("after the bill the takeaways still show the hole by default; the 12 of 12 variant is the second view", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    guess(container);
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    expect(takeText(container, "answer")).toContain("NOT FOUND");
    expect(takeText(container, "mail")).toContain("Fehlende Stromrechnung 09/2025");
    expect((container.querySelector('[data-take="mail"] button') as HTMLButtonElement).disabled).toBe(false);
    expect(container.querySelector("[data-take-tag]")?.textContent).toBe("Vor dem Öffnen: 11 von 12");
    fireEvent.click(screen.getByLabelText("Mit Rechnung"));
    expect(takeText(container, "answer")).toContain("320,9 MWh aus 12 von 12 Monatsrechnungen");
    expect(takeText(container, "answer")).not.toContain("NOT FOUND");
    expect(takeText(container, "mail")).toBe("Nichts fehlt");
    expect(container.querySelector("[data-take-tag]")?.textContent).toBe("Mit Rechnung: 12 von 12");
    fireEvent.click(screen.getByLabelText("Vor dem Öffnen"));
    // the mail's subject sits right on its body, and the bill number never breaks at a hyphen
    expect(takeText(container, "mail")).not.toContain("\n\n");
    expect(container.querySelector('[data-take="mail"] .esg-nowrap')?.textContent).toBe("EL-25-09");
  });

  it("the bill's legend entry waits for the bar, the envelope is only on the open button, the repeat button is an outline", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    expect(container.querySelector(".esg-reveal .esg-btn__icon")).toBeTruthy();
    guess(container);
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "0.1" } });
    expect(container.querySelector(".esg-legend__item--bill")).toBeNull();
    fireEvent.change(slider, { target: { value: "0.6" } });
    expect(container.querySelector(".esg-legend__item--bill")).toBeTruthy();
    fireEvent.change(slider, { target: { value: "1" } });
    const again = screen.getByRole("button", { name: /neu tippen/ });
    expect(again.className).toContain("esg-btn--ghost");
    expect(again.querySelector(".esg-btn__icon")).toBeNull();
    // one message at a time: the button when the bill is open, the lock note only while it is half open
    expect(container.querySelector("#esg-locked")).toBeNull();
    fireEvent.change(slider, { target: { value: "0.5" } });
    expect(container.querySelector("#esg-locked")?.textContent).toBe("Zum Neu tippen die Rechnung ganz schließen.");
  });

  it("never prints a unit-less result: a placeholder stands in, the label leads, no stray spaces", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.click(screen.getByLabelText("Meine Zahlen"));
    fireEvent.change(container.querySelector("textarea") as HTMLTextAreaElement, {
      target: { value: "Jan 21.400\nFeb 19.800\nMär 20.600\nApr 19.200\nMai 22.500\nJun 26.800\nJul 30.400\nAug 32.100\nOkt 38.700\nNov 25.300\nDez 22.900" },
    });
    const line = takeText(container, "answer");
    // no label typed: the copied line is nameless ("Meine Reihe" is only the heading), the mail says "diese Zahlen"
    expect(line.startsWith("Mindestens 279.700 [Einheit] belegt")).toBe(true);
    expect(line).not.toContain("Meine Reihe");
    expect(takeText(container, "mail")).toContain("für diese Zahlen fehlt mir die Rechnung für September");
    // the cap sentence drops a missing unit instead of printing brackets
    const facts = container.querySelector(".esg-ownfacts")?.textContent ?? "";
    expect(facts).not.toContain("[");
    expect(`${line} ${facts}`).not.toMatch(/ [.,;:]/);
    expect(container.querySelector(".esg-field__label")?.textContent).toBe("Meine Reihe");
  });

  it("does not add a value of another size silently: it warns, asks for the unit and needs a check", () => {
    const { container } = render(<Demo pack={COPY.en} />);
    fireEvent.click(screen.getByLabelText("My numbers"));
    fireEvent.change(container.querySelector("textarea") as HTMLTextAreaElement, {
      target: { value: "Jan 21.400\nFeb 19.800\nMar 20,6\nApr 19.200\nMay 22.500\nJun 26.800\nJul 30.400\nAug 32.100\nSep 31.000\nOct 38.700\nNov 25.300\nDec 22.900" },
    });
    expect(container.querySelector(".esg-field__note")?.textContent).toBe("March does not fit the size of the other values. Check the unit.");
    expect(container.querySelector(".esg-pill")?.textContent).toBe("NEEDS CHECK");
    // the paste says "dot is the decimal sign" against the page language: one visible chip to flip it
    expect(container.querySelectorAll(".esg-chip")).toHaveLength(1);
    expect(container.querySelector(".esg-chip")?.textContent).toMatch(/^Dot read as thousands/);
  });

  it("puts the example button above the paste area, and the chart above both", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.click(screen.getByLabelText("Meine Zahlen"));
    const example = screen.getByRole("button", { name: "Beispiel einsetzen" });
    const area = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(example.compareDocumentPosition(area) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(example);
    const plot = container.querySelector(".esg-plot") as HTMLElement;
    expect(plot.compareDocumentPosition(container.querySelector(".esg-own") as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("asks for the unit of pasted numbers instead of asserting one", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.click(screen.getByLabelText("Meine Zahlen"));
    fireEvent.change(container.querySelector("textarea") as HTMLTextAreaElement, { target: { value: "Jan 21.400\nFeb 19.800" } });
    expect(container.querySelector(".esg-field__unit--ask")?.textContent).toBe("Einheit?");
    expect(container.textContent).not.toContain("MWh");
  });

  it("gives every gauge its own heading and draws the Leiter on a cut axis", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    guess(container);
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    const heads = [...container.querySelectorAll(".esg-gauge__label")].map((node) => node.textContent);
    expect(heads).toEqual(["Entwurf: Monate belegt", "Entwurf: kWh belegt"]);
    expect(container.querySelector(".esg-ladder__axis")?.textContent).toBe("Achse ab 270 MWh, links gekürzt. Schraffiert: der Abstand zur Rechnung.");
    expect([...container.querySelectorAll(".esg-ladder__off")].map((node) => node.textContent)).toContain("41,2 daneben");
    // every row carries a break and its spoken text names the miss; labels start with a capital
    expect(container.querySelectorAll(".esg-ladder__cut").length).toBe(container.querySelectorAll(".esg-ladder__row").length);
    const spoken = [...container.querySelectorAll(".esg-ladder__row .esg-sr")].map((node) => node.textContent ?? "");
    expect(spoken.some((text) => /Entwurf: 279,7 MWh, 41,2 daneben/.test(text))).toBe(true);
    for (const label of container.querySelectorAll(".esg-ladder__label")) expect(label.textContent?.[0]).toBe(label.textContent?.[0]?.toUpperCase());
    // the zoomed bars are far apart: draft and the biggest-month row differ by more than a third of the track
    const widths = [...container.querySelectorAll<HTMLElement>(".esg-ladder__row .esg-ladder__fill")].map((node) => parseFloat(node.style.width));
    expect(Math.max(...widths) - Math.min(...widths)).toBeGreaterThan(50);
  });

  it("shows the Leiter's five labelled slots before the bill (desktop css), and swaps them for the real rows", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    const pending = container.querySelector(".esg-ladder--pending") as HTMLElement;
    expect(pending.getAttribute("aria-hidden")).toBe("true");
    expect(pending.querySelectorAll(".esg-ladder__row")).toHaveLength(5);
    expect(pending.textContent).toContain("?");
    guess(container);
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    expect(container.querySelector(".esg-ladder--pending")).toBeNull();
    expect(container.querySelector(".esg-ladder")).toBeTruthy();
  });

  it("announces the opened bill in a polite live region", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    guess(container);
    fireEvent.click(screen.getByRole("button", { name: /EL-25-09 öffnen/ }));
    const live = [...container.querySelectorAll('[role="status"][aria-live="polite"]')].map((node) => node.textContent);
    expect(live).toContain("Rechnung EL-25-09 geöffnet. Gesamt 320,9 MWh.");
  });

  it("fixes a unit slip in the hero: the chip sits under the number, the outlier is cut and the others keep their height", () => {
    const { container } = render(<Demo pack={COPY.de} />);
    fireEvent.click(screen.getByLabelText("Meine Zahlen"));
    fireEvent.change(container.querySelector("textarea") as HTMLTextAreaElement, {
      target: { value: "Jan 21.400\nFeb 19,8\nMär 20,6\nApr 19,2\nMai 22,5\nJun 26,8\nJul 30,4\nAug 32,1\nOkt 38,7\nNov 25,3\nDez 22,9" },
    });
    const hero = container.querySelector(".esg-field") as HTMLElement;
    expect(hero.querySelector(".esg-field__flip")?.textContent).toMatch(/^Punkt als Tausender gelesen: Jan 21\.400 = 21\.400\. Als 21,4 lesen\?/);
    // the chart is scaled to the eleven that agree: the tallest of them (38,7) is well over half the plot, the slip is cut
    const bars = [...container.querySelectorAll<SVGRectElement>(".esg-plot__svg rect")].filter((node) => node.getAttribute("fill") === "var(--esg-ink)" && node.getAttribute("height") !== "2");
    const heights = bars.map((node) => Number(node.getAttribute("height")));
    expect(Math.max(...heights)).toBeLessThanOrEqual(136.5);
    expect(heights.filter((value) => value > 60).length).toBeGreaterThan(1);
    expect(container.querySelectorAll(".esg-plot__svg polygon").length).toBe(2);
    fireEvent.click(hero.querySelector(".esg-field__flip") as HTMLElement);
    expect(figure(container)).toBe("279,7");
    expect(container.querySelectorAll(".esg-plot__svg polygon").length).toBe(0);
  });
});

describe("hub tile", () => {
  it("is a silent svg in both languages with the end frame figures, and no script", () => {
    for (const locale of ["de", "en"] as const) {
      const { container, unmount } = render(<Tile locale={locale} />);
      const text = container.textContent ?? "";
      expect(text).toContain(locale === "de" ? "320,9" : "320.9");
      expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
      unmount();
    }
  });
  it("ships its end frame in the generated css", () => {
    const css = readFileSync(join(__dirname, "../hub/tile-scenes.css"), "utf8");
    expect(css).toContain('[data-scene="w04"] [data-t="bill"]');
  });
});
