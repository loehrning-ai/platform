import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DemoGridInitialFilters } from "@/components/demos/demo-grid";

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
  it("renders the paper hero, the check list and registry-derived stats", async () => {
    const { container } = render(
      await DemosPage({ searchParams: Promise.resolve({}) }),
    );

    const h1 = screen.getByRole("heading", {
      level: 1,
      name: "KI-Arbeitsabläufe prüfen",
    });
    expect(h1).toBeVisible();
    // One colour: no accent span inside the headline.
    expect(h1.querySelector("span")).toBeNull();
    expect(screen.getByText("Praxisbeispiele · 12")).toBeVisible();
    expect(
      screen.getByRole("list", { name: "Was du an jedem Beispiel prüfst" }),
    ).toBeVisible();
    expect(screen.getByText("Eingaben und Annahmen")).toBeVisible();

    const stats = screen.getByRole("group", { name: "Umfang der Sammlung" });
    const values = Array.from(stats.querySelectorAll("dd.text-num-lg")).map(
      (node) => node.textContent,
    );
    // 12 demos, 3 execution modes in use, 0 actions that reach a real system.
    expect(values).toEqual(["12", "3", "0"]);
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
