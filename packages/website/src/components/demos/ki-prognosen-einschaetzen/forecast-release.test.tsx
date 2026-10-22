import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FORECAST_COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { MORNINGS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import { rightOption } from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import { STATE_KEY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/storage";
import { buildTakeaways, ownerText } from "@/lib/demo-cases/ki-prognosen-einschaetzen/takeaways";
import ForecastReleaseDemo from "./index";

const DE = FORECAST_COPY.de;
const EN = FORECAST_COPY.en;

function units(index: number): HTMLInputElement {
  return document.getElementById(`fr-units-${index}`) as HTMLInputElement;
}

function setSplit(values: readonly [number, number, number]) {
  values.forEach((value, i) => fireEvent.change(units(i), { target: { value: String(value) } }));
}

function checkButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: DE.split.check }) as HTMLButtonElement;
}

function optionButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".fr-options button"));
}

/** Split as in the case, check, continue, name the planner, start. */
function playToMorningOne() {
  setSplit([500, 370, 180]);
  fireEvent.click(checkButton());
  fireEvent.click(screen.getByRole("button", { name: DE.split.continueOwn }));
  fireEvent.click(screen.getByRole("button", { name: DE.mornings.ownerOptions.plannerOnDuty }));
  fireEvent.click(screen.getByRole("button", { name: DE.mornings.start }));
}

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = "";
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Demo 01, first render", () => {
  it("renders the case strip, all three steps, the sources and the full takeaways", () => {
    const { container } = render(<ForecastReleaseDemo locale="de" />);
    expect(screen.getByRole("heading", { level: 2, name: DE.caseStrip.heading })).toBeInTheDocument();
    for (const id of ["verteilen", "morgen", "ergebnis", "mitnehmen", "quellen"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(screen.getByText(DE.takeaways.rule)).toBeInTheDocument();
    expect(screen.getByTestId("fr-check-text").textContent).toBe(
      buildTakeaways({ owner: null, blanks: [], copy: DE }).check,
    );
    expect(container.querySelectorAll("[id^='fr-blank-']")).toHaveLength(8);
  });

  it("has no collapsible UI and no role=status inside the mount", () => {
    const { container } = render(<ForecastReleaseDemo locale="de" />);
    expect(container.querySelector("details, summary, [aria-expanded]")).toBeNull();
    expect(container.querySelector("[role='status']")).toBeNull();
  });

  it("renders English completely", () => {
    render(<ForecastReleaseDemo locale="en" />);
    expect(screen.getByRole("heading", { level: 2, name: EN.caseStrip.heading })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: EN.split.check })).toBeDisabled();
    expect(screen.getByText(EN.takeaways.rule)).toBeInTheDocument();
  });
});

describe("Part 1: the split", () => {
  it("keeps Prüfen disabled until exactly 1,050 are split", () => {
    render(<ForecastReleaseDemo locale="de" />);
    expect(checkButton()).toBeDisabled();
    setSplit([700, 300, 100]);
    expect(checkButton()).toBeDisabled();
    setSplit([500, 370, 179]);
    expect(checkButton()).toBeDisabled();
    fireEvent.change(units(2), { target: { value: "180" } });
    expect(checkButton()).toBeEnabled();
  });

  it("steps by 10 with the arrow keys and by 50 with Shift", () => {
    render(<ForecastReleaseDemo locale="de" />);
    setSplit([500, 370, 100]);
    fireEvent.keyDown(units(2), { key: "ArrowUp" });
    expect(units(2).value).toBe("110");
    fireEvent.keyDown(units(2), { key: "ArrowUp", shiftKey: true });
    expect(units(2).value).toBe("160");
  });

  it("shows feedback after the check and removes the inputs once the split is taken on", () => {
    render(<ForecastReleaseDemo locale="de" />);
    setSplit([500, 370, 180]);
    fireEvent.click(checkButton());
    expect(screen.getByRole("heading", { level: 3, name: DE.split.feedbackHeading })).toBeInTheDocument();
    expect(screen.getByText(DE.split.headlineAll)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: DE.split.continueOwn }));
    expect(units(0)).toBeNull();
    expect(document.activeElement?.id).toBe("fr-h-mornings");
  });
});

describe("Part 2: owner and mornings", () => {
  it("offers the start only for an owner who can decide today", () => {
    render(<ForecastReleaseDemo locale="de" />);
    setSplit([500, 370, 180]);
    fireEvent.click(checkButton());
    fireEvent.click(screen.getByRole("button", { name: DE.split.continueOwn }));
    fireEvent.click(screen.getByRole("button", { name: DE.mornings.ownerOptions.analytics }));
    expect(screen.queryByRole("button", { name: DE.mornings.start })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: DE.mornings.ownerOptions.plannerOnDuty }));
    expect(screen.getByRole("button", { name: DE.mornings.start })).toBeInTheDocument();
  });

  it("takes one answer per morning, then moves focus to the stamp", () => {
    render(<ForecastReleaseDemo locale="de" />);
    playToMorningOne();
    expect(optionButtons()).toHaveLength(3);
    fireEvent.click(optionButtons()[0] as HTMLButtonElement);
    expect(optionButtons()).toHaveLength(0);
    expect(document.activeElement?.className).toContain("fr-stamp-line");
  });

  it("plays seven right mornings to a 7 of 7 result and keeps it on reload", () => {
    const { unmount } = render(<ForecastReleaseDemo locale="de" />);
    playToMorningOne();
    MORNINGS.forEach((morning, day) => {
      const index = morning.options.indexOf(rightOption(morning));
      fireEvent.click(optionButtons()[index] as HTMLButtonElement);
      fireEvent.click(screen.getByRole("button", { name: day === 6 ? DE.mornings.toResult : DE.mornings.next }));
    });
    expect(screen.getByText(DE.result.score(7))).toBeInTheDocument();
    expect(document.activeElement?.id).toBe("fr-h-result");
    expect(window.localStorage.getItem(STATE_KEY)).not.toBeNull();
    unmount();

    render(<ForecastReleaseDemo locale="de" />);
    expect(screen.getByText(DE.result.score(7))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: DE.result.restart }));
    expect(units(0)).not.toBeNull();
    expect(document.activeElement?.id).toBe("fr-h-split");
  });

  it("offers Woche neu starten during the mornings, not on the first step", () => {
    render(<ForecastReleaseDemo locale="de" />);
    expect(screen.queryByRole("button", { name: DE.result.restart })).toBeNull();
    playToMorningOne();
    fireEvent.click(optionButtons()[0] as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: DE.result.restart }));
    expect(units(0)).not.toBeNull();
    expect(units(0).value).toBe("0");
    expect(document.activeElement?.id).toBe("fr-h-split");
    expect(window.localStorage.getItem(STATE_KEY)).toBeNull();
  });

  it("says when a saved week is picked up, and starts over from that line", () => {
    const { unmount } = render(<ForecastReleaseDemo locale="de" />);
    expect(screen.queryByText(/^Fortgesetzt/)).toBeNull();
    playToMorningOne();
    fireEvent.click(optionButtons()[0] as HTMLButtonElement);
    unmount();

    render(<ForecastReleaseDemo locale="de" />);
    expect(screen.getByText("Fortgesetzt: Morgen 1 von 7")).toBeInTheDocument();
    expect(document.querySelector(".fr")?.getAttribute("data-step")).toBe("mornings");
    fireEvent.click(screen.getByRole("button", { name: DE.thread.resumedRestart }));
    expect(screen.queryByText(/^Fortgesetzt/)).toBeNull();
    expect(units(0)).not.toBeNull();
    expect(document.activeElement?.id).toBe("fr-h-split");
    expect(window.localStorage.getItem(STATE_KEY)).toBeNull();
  });

  it("offers an undo after a restart that brings the week back", () => {
    render(<ForecastReleaseDemo locale="de" />);
    playToMorningOne();
    fireEvent.click(screen.getByRole("button", { name: DE.result.restart }));
    expect(screen.getByText(DE.thread.restarted)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: DE.thread.undo }));
    expect(document.querySelector(".fr")?.getAttribute("data-step")).toBe("mornings");
    expect(screen.queryByText(DE.thread.restarted)).toBeNull();
  });

  it("drops the resumed line once the week moves on", () => {
    const { unmount } = render(<ForecastReleaseDemo locale="en" />);
    setSplit([500, 370, 180]);
    fireEvent.click(screen.getByRole("button", { name: EN.split.check }));
    unmount();

    render(<ForecastReleaseDemo locale="en" />);
    expect(screen.getByText("Resumed: Split")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: EN.split.continueOwn }));
    expect(screen.queryByText(/^Resumed/)).toBeNull();
    expect(screen.getByRole("button", { name: EN.result.restart })).toBeInTheDocument();
  });

  it("opens Part 2 directly from #morgen with the median plan", () => {
    window.location.hash = "#morgen";
    const { container } = render(<ForecastReleaseDemo locale="de" />);
    expect(container.querySelector(".fr")?.getAttribute("data-step")).toBe("mornings");
    expect(screen.getByText(DE.mornings.fallback)).toBeInTheDocument();
  });
});

describe("Takeaways", () => {
  it("copies the exact check text and confirms visibly", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ForecastReleaseDemo locale="de" />);
    const article = screen.getByRole("article", { name: DE.takeaways.titles[1] });
    await act(async () => {
      fireEvent.click(within(article).getByRole("button"));
    });
    expect(writeText).toHaveBeenCalledWith(buildTakeaways({ owner: null, blanks: [], copy: DE }).check);
    expect(within(article).getByRole("button").textContent).toBe(DE.takeaways.copied);
  });

  it("fills sentence 5 with the owner once the mornings start", () => {
    render(<ForecastReleaseDemo locale="de" />);
    playToMorningOne();
    expect((document.getElementById("fr-blank-7") as HTMLInputElement).value).toBe(
      ownerText({ key: "plannerOnDuty", custom: "" }, DE),
    );
  });

  const ownerField = () => document.getElementById("fr-blank-7") as HTMLTextAreaElement;
  const sentenceFive = () => document.querySelectorAll(".fr-sentence-text")[4]?.textContent ?? "";
  const ROLE = "die Teamleitung Disposition";

  /** Woche neu starten from morning 1, then the same split with an own role. */
  function restartWithOwnRole() {
    fireEvent.click(optionButtons()[0] as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: DE.result.restart }));
    setSplit([500, 370, 180]);
    fireEvent.click(checkButton());
    fireEvent.click(screen.getByRole("button", { name: DE.split.continueOwn }));
    fireEvent.click(screen.getByRole("button", { name: DE.mornings.ownerOptions.custom }));
    fireEvent.change(document.getElementById("fr-custom-role") as HTMLInputElement, { target: { value: ROLE } });
    fireEvent.click(screen.getByRole("button", { name: DE.mornings.customUse }));
    fireEvent.click(screen.getByRole("button", { name: DE.mornings.start }));
  }

  it("swaps an untouched prefill for the new role after a restart, also after a reload", () => {
    const { unmount } = render(<ForecastReleaseDemo locale="de" />);
    playToMorningOne();
    expect(ownerField().value).toBe(DE.takeaways.ownerDefault);
    unmount();

    // The prefill marker is stored next to the draft, so the rule holds after a reload.
    render(<ForecastReleaseDemo locale="de" />);
    restartWithOwnRole();
    expect(ownerField().value).toBe(ROLE);
    expect(sentenceFive()).toBe(`Bei einem Nein entscheidet ${ROLE}, bevor etwas rausgeht.`);
    expect(screen.getByTestId("fr-check-text").textContent).toContain(`Ein Nein: ${ROLE} entscheidet`);
  });

  it("keeps sentence 5 when the visitor edited it before the restart", () => {
    render(<ForecastReleaseDemo locale="de" />);
    playToMorningOne();
    fireEvent.change(ownerField(), { target: { value: "die Filialleitung" } });
    restartWithOwnRole();
    expect(ownerField().value).toBe("die Filialleitung");
    expect(sentenceFive()).toContain("die Filialleitung");
  });
});

describe("Reduced motion", () => {
  it("shows the end state at once", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("reduce"),
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
    const raf = vi.spyOn(window, "requestAnimationFrame");
    render(<ForecastReleaseDemo locale="de" />);
    setSplit([500, 370, 180]);
    fireEvent.click(checkButton());
    expect(raf).not.toHaveBeenCalled();
    const segments = document.querySelectorAll<HTMLElement>(".fr-seg");
    expect(segments).toHaveLength(3);
    segments.forEach((segment) => expect(segment.getAttribute("style")).toContain("translate(0.000%, calc(0.0000 *"));
  });
});
