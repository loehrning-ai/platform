import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DemoGridInitialFilters } from "@/components/demos/demo-grid";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { expectCapsInsideScene } from "@/test/plakat-scene";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(async () => "de"),
}));

vi.mock("@/components/demos/demo-grid", () => ({
  DemoGrid: ({
    initialFilters,
  }: {
    readonly initialFilters: DemoGridInitialFilters;
  }) => (
    <div
      data-testid="demo-grid"
      data-level={initialFilters.level}
      data-category={initialFilters.category}
      data-industry={initialFilters.industry}
    />
  ),
}));

import DemosPage from "./page";

describe("DemosPage URL filter boundary", () => {
  it("renders the IDEA band and registry-derived stats, without a check-list box", async () => {
    const { container } = render(
      await DemosPage({ searchParams: Promise.resolve({}) }),
    );

    const h1 = screen.getByRole("heading", {
      level: 1,
      name: DEMOS_PAGE_COPY.de.catalog.heading,
    });
    expect(h1).toBeVisible();
    // One colour: no accent span inside the headline. It is the poster
    // title in the scene mid (Himbeere, display size only).
    expect(h1.querySelector("span")).toBeNull();
    expect(h1).toHaveClass("poster-title", "text-scene-mid");
    expect(h1.getAttribute("style")).toMatch(/--fit:\s*\d/);
    // The caps line names the collection; the count lives in the stats below.
    expect(h1.previousElementSibling).toHaveClass("plakat-caps");
    expect(h1.previousElementSibling).toHaveTextContent("Praxisbeispiele · im Browser");
    // Below sm the caps line keeps one row: the detail drops.
    expect(
      Array.from(h1.previousElementSibling?.querySelectorAll("span") ?? []).some(
        (span) => span.classList.contains("max-sm:hidden") && span.textContent === " · im Browser",
      ),
    ).toBe(true);
    // The band: IDEA scope, one halftone image, four corner dots, and no
    // caption or label type inside it (SPEC §3.1 type budget).
    const band = h1.closest("[data-cover-band]");
    expect(band).toHaveClass("plakat-idea");
    expect(band?.closest("[data-demo-atlas-hero]")).toBeTruthy();
    expect(band?.querySelectorAll("[data-halftone]")).toHaveLength(1);
    expect(band?.querySelectorAll("circle").length).toBe(4);
    expect(band?.querySelector(".text-caption, .text-label, [role=group]")).toBeNull();
    expectCapsInsideScene(container);
    // The stat line says what runs and what is simulated; no scope box
    // repeats it, and the lede is one sentence at every width.
    expect(container.querySelector("[data-demo-scope]")).toBeNull();
    expect(screen.queryByText("Eingaben und Annahmen")).toBeNull();
    expect(
      screen.getByText(DEMOS_PAGE_COPY.de.catalog.introduction).querySelector("span"),
    ).toBeNull();

    const stats = screen.getByRole("group", { name: "Umfang der Sammlung" });
    const values = Array.from(stats.querySelectorAll("dd.text-num-lg")).map(
      (node) => node.textContent,
    );
    // 12 demos, 3 execution modes in use, 0 actions that reach a real system.
    expect(values).toEqual(["12", "3", "0"]);
    // The stats sit on paper below the band. Below sm the StatRow gives way
    // to one caption line with the same registry numbers.
    expect(stats.closest("[data-cover-band]")).toBeNull();
    expect(stats.parentElement).toHaveClass("max-sm:hidden");
    // One unbreakable item per entry and a CSS separator that a clipping
    // wrapper hides at each line start, so a wrap never leaves a line
    // starting or ending with "·"; the zero
    // count reads as a plain phrase instead of "0 Außenaktionen".
    const statsLine = container.querySelector("[data-demo-stats-line]");
    expect(
      Array.from(statsLine?.querySelectorAll("li") ?? []).map(
        (node) => node.textContent,
      ),
    ).toEqual([
      "12 Beispiele",
      "nichts wird wirklich gesendet",
    ]);
    expect(statsLine?.textContent).not.toContain("·");
    expect(statsLine?.querySelector("li")).toHaveClass("whitespace-nowrap");
    expect(statsLine).toHaveClass("-ml-[1em]");
    expect(statsLine?.parentElement).toHaveClass("overflow-hidden", "sm:hidden");
    expect(container.querySelector("[data-demo-atlas-hero]")).toBeTruthy();
  });

  it("passes allowlisted URL filters to the server-rendered grid", async () => {
    render(
      await DemosPage({
        searchParams: Promise.resolve({
          level: "mittel",
          cat: "RAG",
          industry: "Finance",
        }),
      }),
    );

    const grid = screen.getByTestId("demo-grid");
    expect(grid).toHaveAttribute("data-level", "mittel");
    expect(grid).toHaveAttribute("data-category", "RAG");
    expect(grid).toHaveAttribute("data-industry", "Finance");
  });

  it("uses unfiltered defaults when URL filters are absent", async () => {
    render(
      await DemosPage({
        searchParams: Promise.resolve({}),
      }),
    );

    const grid = screen.getByTestId("demo-grid");
    expect(grid).toHaveAttribute("data-level", "alle");
    expect(grid).toHaveAttribute("data-category", "Alle");
    expect(grid).toHaveAttribute("data-industry", "");
  });

  it("rejects unknown and repeated URL filters instead of reflecting them", async () => {
    render(
      await DemosPage({
        searchParams: Promise.resolve({
          level: ["einstieg", "fortg"],
          cat: "<script>alert(1)</script>",
          industry: ["Finance", "HR"],
        }),
      }),
    );

    const grid = screen.getByTestId("demo-grid");
    expect(grid).toHaveAttribute("data-level", "alle");
    expect(grid).toHaveAttribute("data-category", "Alle");
    expect(grid).toHaveAttribute("data-industry", "");
  });
});
