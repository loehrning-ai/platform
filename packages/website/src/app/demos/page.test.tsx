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
  it("renders the lab atlas cover, inspection rail, and reviewed facts", async () => {
    const { container } = render(
      await DemosPage({ searchParams: Promise.resolve({}) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Arbeitsabläufe prüfen. Annahmen sichtbar machen.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("complementary", { name: "Was hier geprüft wird" }),
    ).toBeVisible();
    expect(screen.getByText("Eingaben und Annahmen")).toBeVisible();
    expect(screen.getByText("12", { exact: true })).toBeVisible();
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
