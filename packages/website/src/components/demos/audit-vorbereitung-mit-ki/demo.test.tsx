import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GlasRoot } from "@/components/demos/glas/glas-root";
import { BeatClockProvider, useBeatClock, type BeatClock } from "@/components/demos/shell/beat-clock";
import { DemoV4Provider } from "@/components/demos/shell/demo-v4-context";
import { BEATS } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/beats";
import { COPY } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { buildModel } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import Demo from "./demo";

vi.mock("server-only", () => ({}));

let clock: BeatClock;
function Grab() {
  clock = useBeatClock();
  return null;
}

function setMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const files = { skill: { href: "/skills/audit-nachweise.zip", download: "audit-nachweise.zip", size: "3 KB" }, kit: { href: "/kit.zip", download: "kit.zip", size: "90 KB" }, shown: ["project-instructions.md"] };
const intro = { kicker: "k", title: "t", sentences: ["a", "b", "c", "d"] as const, start: "s", explore: "e", footnote: "f", news: ["n"] };

function mount(locale: "de" | "en") {
  const tone = "hell" as const;
  return render(
    <GlasRoot as="article" tone={tone}>
      <BeatClockProvider beats={BEATS} locale={locale} shell="v4">
        <DemoV4Provider value={{ intro: intro as never, stageTone: tone }}>
          <Grab />
          <Demo copy={COPY[locale]} model={buildModel(locale)} files={files} />
        </DemoV4Provider>
      </BeatClockProvider>
    </GlasRoot>,
  );
}

beforeEach(() => {
  window.history.replaceState(null, "", "/demos/x");
  setMotion();
});
afterEach(cleanup);

const go = (id: string) =>
  act(() => {
    clock.seek(
      BEATS.findIndex((beat) => beat.id === id),
      "user",
    );
  });

describe("W05 demo scenes", () => {
  for (const locale of ["de", "en"] as const) {
    it(`${locale}: draws every scene from the model without an open slot`, () => {
      const { container } = mount(locale);
      act(() => clock.start());
      for (const beat of BEATS) {
        go(beat.id);
        const data = container.querySelector("[data-w05-data]");
        expect(data, beat.id).not.toBeNull();
        expect(data?.textContent ?? "", beat.id).not.toMatch(/\{\w+\}/);
        expect(container.querySelector("[data-demo-caption]")?.textContent ?? "", beat.id).not.toMatch(/\{\w+\}/);
      }
    });
  }

  it("de: the first scene has thirteen cards and three guess groups; the guesses stay until the restart", () => {
    const { container } = mount("de");
    act(() => clock.start());
    expect(container.querySelectorAll(".w05-card")).toHaveLength(13);
    expect(container.querySelectorAll("[data-guess]")).toHaveLength(3);
    const first = container.querySelector('[data-w05-card="L01"] .glas-chip') as HTMLElement;
    fireEvent.click(first);
    expect(container.querySelector('[data-w05-card="L01"] .glas-chip[aria-pressed="true"]')).not.toBeNull();
  });

  it("de: the x-ray counts 693 rows, opens a lens and the late edit keeps the old value", () => {
    const { container } = mount("de");
    act(() => clock.start());
    go("roentgen");
    expect(container.querySelector("[data-w05-rows]")?.getAttribute("data-w05-rows")).toBe("693");
    fireEvent.click(container.querySelector('[data-w05-row="L05"]') as HTMLElement);
    expect(container.querySelector('[data-w05-lens="L05"]')?.textContent).toContain("E-07");
    go("nachtrag");
    fireEvent.click(container.querySelector("[data-w05-late-edit]") as HTMLElement);
    expect(container.querySelector("[data-w05-ghost]")).not.toBeNull();
    fireEvent.click(container.querySelector("[data-w05-late-write]") as HTMLElement);
    expect(container.querySelector("[data-w05-note]")?.textContent).toContain("Titel:");
  });

  for (const locale of ["de", "en"] as const) {
    it(`${locale}: the clock reads short, unclear, fits for 25, 26 and 27 and prints no weekend date and no doubled stop`, () => {
      const { container } = mount(locale);
      act(() => clock.start());
      go("uhr");
      const radios = [...container.querySelectorAll('[role="radio"]')] as HTMLElement[];
      expect(radios).toHaveLength(3);
      const seen: string[] = [];
      for (const radio of radios) {
        fireEvent.click(radio);
        const verdict = container.querySelector("[data-w05-verdict]")?.getAttribute("data-w05-verdict") ?? "";
        const data = container.querySelector("[data-w05-data]")?.textContent ?? "";
        const caption = container.querySelector("[data-demo-caption]")?.textContent ?? "";
        seen.push(verdict);
        // 28 and 29 November 2026 are a Saturday and a Sunday: never printed as a date.
        expect(`${data} ${caption} ${radio.textContent}`, verdict).not.toMatch(/\b2[89]\.? (Nov|November)\b/);
        expect(data, verdict).not.toMatch(/\.\.(\s|$)/);
        expect(data, verdict).toMatch(/Art\.\s55/);
        // The count of working days is a label with a number, never "1 Arbeitstage".
        expect(data, verdict).not.toMatch(/\b1 (Arbeitstage|working days)\b/);
      }
      expect(seen).toEqual(["short", "unclear", "fits"]);
      fireEvent.click(radios[2] as HTMLElement);
      expect(container.querySelector("[data-w05-data]")?.textContent ?? "").toMatch(locale === "de" ? /Mo 30\. Nov\./ : /Mon 30 Nov/);
    });
  }

  it("de: an own paper never reaches covered", () => {
    const { container } = mount("de");
    act(() => clock.start());
    go("ordner-eigen");
    fireEvent.change(container.querySelector("[data-w05-own-text]") as HTMLElement, { target: { value: "Vertragsregister" } });
    const paper = container.querySelector("[data-w05-own-paper]") as HTMLElement;
    for (const chip of paper.querySelectorAll(".glas-chip")) fireEvent.click(chip);
    expect(paper.getAttribute("data-status")).toBe("open");
  });

  it("de: the briefing never names the weekday of the visit", () => {
    const { container } = mount("de");
    act(() => clock.start());
    go("mitnehmen");
    const text = container.querySelector("[data-w05-briefing]")?.textContent ?? "";
    expect(text).toContain("27. November 2026");
    expect(text).not.toMatch(/\b(Freitag|Fr)\b/);
    // The paper rule keeps the inspector's own date (Art. 55), the date is a Monday, and no sentence ends twice.
    expect(text).toMatch(/Art\.\s55/);
    expect(text).toContain("Mo 30. Nov.");
    expect(text).not.toMatch(/\.\.(\s|$)/);
  });

  it("de: the take-home names each file with its size and one button", () => {
    const { container } = mount("de");
    act(() => clock.start());
    go("mitnehmen");
    expect(container.querySelector('[data-w05-file="kit"]')?.textContent).toContain("90 KB");
    expect(container.querySelector('[data-w05-file="skill"]')?.textContent).toContain("3 KB");
    expect(container.querySelectorAll("#mitnehmen a[download]")).toHaveLength(2);
  });

  it("de: an own paper shows a neutral state until a test is ticked", () => {
    const { container } = mount("de");
    act(() => clock.start());
    go("ordner-eigen");
    fireEvent.change(container.querySelector("[data-w05-own-text]") as HTMLElement, { target: { value: "Arbeitsvertrag" } });
    const paper = container.querySelector("[data-w05-own-paper]") as HTMLElement;
    expect(paper.getAttribute("data-status")).toBe("idle");
    fireEvent.click(paper.querySelector(".glas-chip") as HTMLElement);
    expect(paper.getAttribute("data-status")).toBe("gap");
  });
});
