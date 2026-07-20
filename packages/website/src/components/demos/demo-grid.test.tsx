import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { DemoGrid } from "./demo-grid";
import { trackDemoFilter } from "@/lib/analytics";

/**
 * demo-grid.test.tsx (regression coverage)
 *
 * DemoGrid seeds filter state from the URL, filters the REAL demos catalog via
 * filterDemos, mirrors the state into the URL through the History API (not a
 * Next navigation, to avoid the mobile/WebKit scroll-to-top jump), and renders
 * a tile per match or an empty state. We keep the real demos + filterDemos so
 * the counts are the genuine catalog counts (12 total; einstieg=3; RAG=1;
 * Outbound=1), mock next/navigation's useSearchParams (seedable per test), mock
 * the analytics spy, and stub DemoTile down to a slug marker so matches can be
 * counted / identified without pulling in every preview component.
 */

const nav = vi.hoisted(() => ({ params: new Map<string, string>() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => nav.params.get(key) ?? null,
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackDemoFilter: vi.fn(),
}));

vi.mock("./demo-tile", () => ({
  DemoTile: ({ demo }: { demo: { slug: string } }) => (
    <div data-testid="demo-tile" data-slug={demo.slug} />
  ),
}));

function tileSlugs(): string[] {
  return screen
    .queryAllByTestId("demo-tile")
    .map((el) => el.getAttribute("data-slug") ?? "");
}

describe("<DemoGrid>", () => {
  beforeEach(() => {
    nav.params = new Map();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset jsdom's URL between tests so History-API assertions stay isolated.
    window.history.replaceState(null, "", "/");
  });

  it("renders every demo when no filter is seeded and reports the total count", () => {
    render(<DemoGrid />);
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(12);
    expect(screen.getByText(/12 Praxisbeispiele/)).toBeInTheDocument();
    // The mount effect reports the (unfiltered) filter state once; the empty
    // industry is passed through as the placeholder ", ".
    expect(trackDemoFilter).toHaveBeenCalledWith("Alle", "alle", ", ");
  });

  it("seeds filter state from the URL search params", () => {
    nav.params = new Map([["level", "einstieg"]]);
    render(<DemoGrid />);
    // Deep link /demos?level=einstieg renders pre-filtered without any click.
    expect(tileSlugs().sort()).toEqual(["excel", "roi-rechner", "word"]);
  });

  it("filters to the matching level and mirrors it into the URL on chip click", () => {
    render(<DemoGrid />);
    const chip = screen.getByRole("button", { name: /Einstieg \(3\)/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(tileSlugs().sort()).toEqual(["excel", "roi-rechner", "word"]);
    expect(trackDemoFilter).toHaveBeenCalledWith("Alle", "einstieg", ", ");
    expect(window.location.search).toBe("?level=einstieg");
    expect(window.location.pathname).toBe("/demos");
  });

  it("filters to a single category match", () => {
    render(<DemoGrid />);
    // RAG has exactly one demo in the catalog.
    fireEvent.click(screen.getByRole("button", { name: /RAG \(1\)/ }));
    expect(tileSlugs()).toEqual(["rag-vertragsassistent"]);
    expect(window.location.search).toBe("?cat=RAG");
  });

  it("shows the empty state (no tiles) for a zero-match seeded combination", () => {
    // Outbound's only demo is 'mittel', so Outbound + fortg yields nothing.
    nav.params = new Map([
      ["cat", "Outbound"],
      ["level", "fortg"],
    ]);
    render(<DemoGrid />);
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(0);
    expect(screen.getByText("Keine Treffer.")).toBeInTheDocument();

    // The reset button clears every filter and restores the full catalog.
    fireEvent.click(screen.getByRole("button", { name: /Filter zurücksetzen/ }));
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(12);
    expect(screen.queryByText("Keine Treffer.")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("clears all filters when Escape is pressed while the grid is present", () => {
    render(<DemoGrid />);
    fireEvent.click(screen.getByRole("button", { name: /Einstieg \(3\)/ }));
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(3);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(12);
  });
});
