import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ESG_COPY } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { ESG_LOGIC } from "@/lib/demo-cases/esg-berichte-mit-ki/logic";
import { TAKEAWAYS } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import TenFactsDemo from "./index";
import { createReducer, hintIndex, initialState, mondayPhase, nextOpen } from "./state";

const demoReducer = createReducer(ESG_LOGIC);

const DE = ESG_COPY.de;

type Plan = readonly [id: string, status: string, detail: string, action?: "yes" | "no"];

const KEY_PLAN: readonly Plan[] = [
  ["bussgeld", "ok", "z13-14", "no"],
  ["wasser", "ok", "z3-14", "no"],
  ["kopf", "ok", "z3-5", "no"],
  ["unfall", "ok", "z4-7", "no"],
  ["ghg", "notFound", "diesel"],
  ["mix", "notFound", "supplier"],
  ["zert", "check", "expired"],
  ["pv", "check", "estimate"],
  ["glas", "ok", "z3-5", "yes"],
  ["strom", "notFound", "sept"],
];

function card(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`section[data-slot="${slot}"]`);
  if (!element) throw new Error(`no card ${slot}`);
  return element;
}

function choose(slot: string, decision: string, value: string) {
  const input = card(slot).querySelector<HTMLInputElement>(
    `fieldset[data-decision="${decision}"] input[value="${value}"]`,
  );
  if (!input) throw new Error(`no ${decision}=${value} on ${slot}`);
  fireEvent.click(input);
}

function stamp([id, status, detail, action]: Plan, openFirst = true) {
  if (openFirst) {
    const index = KEY_PLAN.findIndex((plan) => plan[0] === id);
    fireEvent.click(document.querySelectorAll<HTMLButtonElement>(".eb-index-btn")[index] as HTMLButtonElement);
  }
  choose(id, "status", status);
  choose(id, "detail", detail);
  if (action) choose(id, "action", action);
  fireEvent.click(within(card(id)).getByRole("button", { name: DE.card.check }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("W04 demo, first render", () => {
  it("renders card 1, all 14 rows open, the Monday lock and all three takeaways", () => {
    const { container } = render(<TenFactsDemo locale="de" />);
    expect(screen.getByRole("heading", { level: 2, name: DE.card.heading(1, "Bußgelder und Korruption 2023-2025") })).toBeInTheDocument();
    expect(screen.getByText(DE.date.friday)).toBeInTheDocument();
    expect(screen.getByText(DE.spoiler)).toBeInTheDocument();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(14);
    expect(screen.getAllByText(DE.feedback.open, { selector: ".eb-cell-open" })).toHaveLength(14);
    expect(screen.getByText(DE.monday.locked)).toBeInTheDocument();
    for (const title of DE.takeaways.titles) expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(DE.card.hints[0])).toBeInTheDocument();
    expect(container.querySelector("details, summary, [aria-expanded]")).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelectorAll('.eb-index-btn[aria-current="step"]')).toHaveLength(1);
  });

  it("renders the English copy for locale en", () => {
    render(<TenFactsDemo locale="en" />);
    expect(screen.getByText(ESG_COPY.en.date.friday)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fact 1 of 10: Fines and corruption 2023-2025" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Answer sheet" })).toBeInTheDocument();
    expect(screen.getAllByText("from the kit", { selector: ".eb-from-kit" })).toHaveLength(2);
  });
});

describe("W04 demo, one card by keyboard and pointer", () => {
  it("gates Prüfen until every decision is set and clears decisions 2 and 3 on a new status", () => {
    render(<TenFactsDemo locale="de" />);
    const button = within(card("bussgeld")).getByRole("button", { name: DE.card.check });
    expect(button).toBeDisabled();
    choose("bussgeld", "status", "ok");
    choose("bussgeld", "detail", "z13-14");
    expect(button).toBeDisabled();
    choose("bussgeld", "action", "no");
    expect(button).toBeEnabled();
    choose("bussgeld", "status", "check");
    expect(card("bussgeld").querySelector('fieldset[data-decision="action"]')).toBeNull();
    const reasons = card("bussgeld").querySelectorAll<HTMLInputElement>('fieldset[data-decision="detail"] input');
    expect([...reasons].some((input) => input.checked)).toBe(false);
    expect(button).toBeDisabled();
  });

  it("puts the feedback in place, focuses it, announces it and fills Q5 and F1", () => {
    const { container } = render(<TenFactsDemo locale="de" />);
    stamp(KEY_PLAN[0] as Plan, false);
    const grade = screen.getByRole("heading", { level: 3, name: DE.feedback.grades.right });
    expect(grade).toHaveFocus();
    expect(screen.getByText("Fakt 1: Richtig.")).toBeInTheDocument();
    expect(container.querySelector('tr[data-row="Q5"] .eb-cell-status')).toHaveTextContent("OK");
    expect(container.querySelector('tr[data-row="F1"] .eb-cell-status')).toHaveTextContent("OK");
    expect(screen.getByText(DE.sheet.filled(2))).toBeInTheDocument();
    // The decisive lines are marked and the answer stays locked.
    expect(card("bussgeld").querySelectorAll(".eb-ln[data-decisive]")).toHaveLength(2);
    expect(card("bussgeld").querySelector('fieldset[data-decision="status"]')).toBeDisabled();
    // Weiter moves to fact 2 and takes focus there.
    fireEvent.click(screen.getByRole("button", { name: DE.feedback.next(2) }));
    expect(screen.getByRole("heading", { level: 2, name: /Fakt 2 von 10/ })).toHaveFocus();
    expect(screen.getByText(DE.card.hints[1])).toBeInTheDocument();
  });

  it("grades glass with Nein half right and prints the action line", () => {
    const { container } = render(<TenFactsDemo locale="de" />);
    stamp(["glas", "ok", "z3-5", "no"]);
    expect(screen.getByRole("heading", { level: 3, name: DE.feedback.grades.half })).toBeInTheDocument();
    expect(screen.getByText(DE.feedback.glasAction)).toBeInTheDocument();
    expect(container.querySelector('tr[data-row="Q6"] .eb-yours')).toHaveTextContent("deins: OK, ohne Aufgabe");
  });
});

describe("W04 demo, the whole run", () => {
  it("plays ten facts, the Monday and keeps the copied text exact", async () => {
    const writes: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async (text: string) => void writes.push(text)) },
    });
    const { container, unmount } = render(<TenFactsDemo locale="de" />);
    for (const plan of KEY_PLAN) stamp(plan);
    expect(screen.getByText(DE.sheet.allMatch)).toBeInTheDocument();
    expect(screen.getByText(DE.sheet.tally(5, 1, 2))).toBeInTheDocument();
    expect(screen.getByText(DE.sheet.tally(2, 2, 2))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: DE.monday.start }));
    expect(screen.getByTestId("eb-date")).toHaveTextContent(DE.date.monday);
    fireEvent.click(screen.getByRole("button", { name: /^F2/ }));
    fireEvent.click(screen.getByRole("button", { name: /^F3/ }));
    expect(screen.getByRole("button", { name: /^F2/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: DE.monday.openInvoice }));
    fireEvent.click(container.querySelector('input[name="eb-invoice"][value="41200"]') as HTMLInputElement);
    fireEvent.click(within(container.querySelector("#montag") as HTMLElement).getByRole("button", { name: DE.card.check }));
    expect(container.querySelector(".eb-fb-inline")).toHaveTextContent(DE.monday.invoiceMath);
    expect(screen.getByText(DE.monday.mixNote)).toBeInTheDocument();
    stamp(["monday", "ok", "b3-13+inv", "no"], false);
    expect(screen.getByTestId("eb-score")).toHaveTextContent("Du hast 2 von 2 Änderungen getroffen.");
    // Only status changes are listed as changes; Q1 keeps its status and says why.
    const reveal = screen.getByTestId("eb-reveal");
    const lists = reveal.querySelectorAll("ul.eb-reveal-list");
    expect([...(lists[0]?.querySelectorAll("li") ?? [])].map((li) => li.dataset.row)).toEqual(["F2", "F3"]);
    expect(lists[1]?.querySelector('li[data-row="Q1"]')).toHaveTextContent(/279,7.*320,9 MWh, bleibt NOT FOUND: Der Anteil/);
    // The reveal is announced politely; focus stays where it was.
    expect(screen.getAllByText(`${DE.monday.revealHeading}. Du hast 2 von 2 Änderungen getroffen.`).length).toBe(1);
    expect(screen.getByText(DE.sheet.tally(3, 3, 0))).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: /^Kopieren/ });
    await act(async () => {
      fireEvent.click(buttons[2] as HTMLElement);
    });
    expect(writes[0]).toBe(TAKEAWAYS.de[2].text);
    expect(screen.getAllByText(DE.takeaways.copied).length).toBeGreaterThan(0);
    // The page runs on the DE locale pack: no text was read from a locale it does not carry.
    expect(container.textContent).not.toMatch(/undefined|NaN|\{\w+\}/);
    unmount();

    // A different run copies the same text.
    render(<TenFactsDemo locale="de" />);
    stamp(["wasser", "check", "conflict"]);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /^Kopieren/ })[2] as HTMLElement);
    });
    expect(writes[1]).toBe(writes[0]);
    expect(screen.getByText(DE.takeaways.missed)).toBeInTheDocument();
  });

  it("shows the month strip's end state at once under reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("reduce"),
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
    const { container } = render(<TenFactsDemo locale="de" />);
    stamp(["strom", "notFound", "sept"]);
    expect(container.querySelector(".eb-strip")).toHaveAttribute("data-t", "end");
    expect(screen.getByText(DE.feedback.coverage)).toBeInTheDocument();
  });
});

describe("W04 demo, deep links", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("opens the card a hash names, on load and on hashchange", () => {
    window.history.replaceState(null, "", "#zert");
    render(<TenFactsDemo locale="de" />);
    expect(screen.getByRole("heading", { level: 2, name: /Fakt 7 von 10/ })).toBeInTheDocument();
    act(() => {
      window.history.replaceState(null, "", "#pv");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("heading", { level: 2, name: /Fakt 8 von 10/ })).toBeInTheDocument();
  });

  it("ignores a malformed hash on load and on hashchange instead of crashing", () => {
    window.history.replaceState(null, "", "#%E0%A4%A");
    expect(window.location.hash).toBe("#%E0%A4%A");
    expect(() => decodeURIComponent(window.location.hash.slice(1))).toThrow(URIError);
    render(<TenFactsDemo locale="de" />);
    expect(screen.getByRole("heading", { level: 2, name: /Fakt 1 von 10/ })).toBeInTheDocument();
    act(() => {
      window.history.replaceState(null, "", "#%");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("heading", { level: 2, name: /Fakt 1 von 10/ })).toBeInTheDocument();
    // The next well-formed link still works.
    act(() => {
      window.history.replaceState(null, "", "#strom");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("heading", { level: 2, name: /Fakt 10 von 10/ })).toBeInTheDocument();
  });
});

describe("state", () => {
  it("never submits an incomplete card and keeps the first answer", () => {
    let state = initialState();
    state = demoReducer(state, { type: "submit", slot: "bussgeld" });
    expect(state.cards.bussgeld.submitted).toBeUndefined();
    state = demoReducer(state, { type: "status", slot: "bussgeld", status: "notFound" });
    state = demoReducer(state, { type: "detail", slot: "bussgeld", detail: "decl" });
    state = demoReducer(state, { type: "submit", slot: "bussgeld" });
    expect(state.cards.bussgeld.verdict?.grade).toBe("wrong");
    const again = demoReducer(state, { type: "status", slot: "bussgeld", status: "ok" });
    expect(again).toBe(state);
    expect(hintIndex(state, "bussgeld")).toBe(0);
    expect(hintIndex(state, "kopf")).toBe(1);
    expect(nextOpen(state, "bussgeld")).toBe("wasser");
    expect(mondayPhase(state)).toBe("locked");
    expect(demoReducer(state, { type: "startMonday" })).toBe(state);
  });
});

describe("W04 month strip, motion only in view", () => {
  it("holds at t = 0 until the strip is 60 % visible, then plays once", async () => {
    let fire: ((ratio: number) => void) | undefined;
    const thresholds: number[] = [];
    class FakeObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        thresholds.push(...([options?.threshold ?? []].flat() as number[]));
        fire = (ratio) =>
          callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], this as never);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    // jsdom does not paint, so it runs no animation frames: a 16 ms frame clock stands in.
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 16),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
    const { MonthStrip } = await import("./month-strip");
    const { container } = render(
      <MonthStrip mode="count" label="strip" noBill="keine Rechnung" septLabel="41,2 MWh" year={{ before: "11 Monate" }} />,
    );
    const strip = container.querySelector(".eb-strip") as HTMLElement;
    expect(thresholds).toContain(0.6);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });
    expect(strip.dataset.t).toBe("start");
    await act(async () => {
      fire?.(0.3);
    });
    expect(strip.dataset.t).toBe("start");
    await act(async () => {
      fire?.(0.7);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    });
    expect(strip.dataset.t).toBe("end");
    vi.unstubAllGlobals();
  });
});
