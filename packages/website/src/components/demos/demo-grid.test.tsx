import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { DemoGrid, type DemoGridInitialFilters } from "./demo-grid";
import { trackDemoFilter } from "@/lib/analytics";
import { URL_STATE_CHANGE_EVENT } from "@/lib/navigation/url-state";

/**
 * demo-grid.test.tsx (regression coverage)
 *
 * DemoGrid seeds filter state from the URL, filters the REAL demos catalog via
 * filterDemos, mirrors the state into the URL through the History API (not a
 * Next navigation, to avoid the mobile/WebKit scroll-to-top jump), and renders
 * a tile per match or an empty state. We keep the real demos + filterDemos so
 * the counts are the genuine catalog counts (12 total; einstieg=3; RAG=1;
 * Outbound=1), mock the analytics spy, and stub DemoTile down to a slug marker
 * so matches can be counted / identified without pulling in every preview
 * component.
 */

vi.mock("@/lib/analytics", () => ({
  trackDemoFilter: vi.fn(),
}));

vi.mock("./demo-tile", () => ({
  DemoTile: ({ demo }: { demo: { slug: string } }) => (
    <a
      href={`/demos/${demo.slug}`}
      data-testid="demo-tile"
      data-demo-tile={demo.slug}
      data-slug={demo.slug}
    >
      {demo.slug}
    </a>
  ),
}));

function tileSlugs(): string[] {
  return screen
    .queryAllByTestId("demo-tile")
    .map((el) => el.getAttribute("data-slug") ?? "");
}

const DEFAULT_FILTERS: DemoGridInitialFilters = {
  level: "alle",
  category: "Alle",
  industry: "",
};

describe("<DemoGrid>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset jsdom's URL between tests so History-API assertions stay isolated.
    window.history.replaceState(null, "", "/");
  });

  it("renders every demo when no filter is seeded and reports the total count", () => {
    const { container } = render(<DemoGrid initialFilters={DEFAULT_FILTERS} />);
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(12);
    expect(screen.getByRole("status")).toHaveTextContent("12 Praxisbeispiele");
    // The mount effect reports the complete unfiltered state explicitly.
    expect(trackDemoFilter).toHaveBeenCalledWith("Alle", "alle", "alle");
    const levelFilters = screen.getByRole("group", { name: "Reifegrad" });
    expect(levelFilters.lastElementChild).toHaveClass("flex", "flex-wrap");
    expect(levelFilters.lastElementChild).not.toHaveClass("overflow-x-auto");
    expect(container.querySelector("[data-demo-filter-console]")).toBeTruthy();
    expect(container.querySelector("[data-demo-atlas]")).toBeTruthy();
    expect(container.querySelector(".lg\\:grid-cols-4")).toBeTruthy();
  });

  it("seeds filter state from the server-provided filters", () => {
    render(
      <DemoGrid initialFilters={{ ...DEFAULT_FILTERS, level: "einstieg" }} />,
    );
    // Deep link /demos?level=einstieg renders pre-filtered without any click.
    expect(tileSlugs().sort()).toEqual(["excel", "roi-rechner", "word"]);
  });

  it("filters to the matching level and mirrors it into the URL on chip click", () => {
    const urlStateListener = vi.fn();
    window.addEventListener(URL_STATE_CHANGE_EVENT, urlStateListener);
    render(<DemoGrid initialFilters={DEFAULT_FILTERS} />);
    const chip = screen.getByRole("button", { name: /Einstieg \(3\)/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(tileSlugs().sort()).toEqual(["excel", "roi-rechner", "word"]);
    expect(trackDemoFilter).toHaveBeenCalledWith("Alle", "einstieg", "alle");
    expect(window.location.search).toBe("?level=einstieg");
    expect(window.location.pathname).toBe("/demos");
    expect(urlStateListener).toHaveBeenCalledOnce();
    window.removeEventListener(URL_STATE_CHANGE_EVENT, urlStateListener);
  });

  it("exposes compact mobile selects with the same filter state contract", () => {
    render(<DemoGrid initialFilters={DEFAULT_FILTERS} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Reifegrad" }), {
      target: { value: "einstieg" },
    });
    expect(tileSlugs().sort()).toEqual(["excel", "roi-rechner", "word"]);
    expect(window.location.search).toBe("?level=einstieg");

    fireEvent.change(screen.getByRole("combobox", { name: "Kategorie" }), {
      target: { value: "RAG" },
    });
    expect(tileSlugs()).toEqual([]);
    expect(window.location.search).toBe("?level=einstieg&cat=RAG");
  });

  it("filters to a single category match", () => {
    render(<DemoGrid initialFilters={DEFAULT_FILTERS} />);
    // RAG has exactly one demo in the catalog.
    fireEvent.click(screen.getByRole("button", { name: /RAG \(1\)/ }));
    expect(tileSlugs()).toEqual(["rag-vertragsassistent"]);
    expect(window.location.search).toBe("?cat=RAG");
  });

  it("shows the empty state (no tiles) for a zero-match seeded combination", () => {
    // Outbound's only demo is 'mittel', so Outbound + fortg yields nothing.
    render(
      <DemoGrid
        initialFilters={{
          ...DEFAULT_FILTERS,
          category: "Outbound",
          level: "fortg",
        }}
      />,
    );
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(0);
    expect(screen.getByText("Keine Treffer.")).toBeInTheDocument();

    // The reset button clears every filter and restores the full catalog.
    fireEvent.click(
      screen.getByRole("button", { name: /Filter zurücksetzen/ }),
    );
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(12);
    expect(screen.queryByText("Keine Treffer.")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("clears a zero-result filter state with Escape", () => {
    render(
      <DemoGrid
        initialFilters={{
          ...DEFAULT_FILTERS,
          category: "Outbound",
          level: "fortg",
        }}
      />,
    );
    expect(screen.getByText("Keine Treffer.")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(12);
    expect(window.location.pathname).toBe("/demos");
  });

  it("clears all filters when Escape is pressed while the grid is present", () => {
    render(<DemoGrid initialFilters={DEFAULT_FILTERS} />);
    fireEvent.click(screen.getByRole("button", { name: /Einstieg \(3\)/ }));
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(3);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(screen.queryAllByTestId("demo-tile")).toHaveLength(12);
  });

  it("focuses the first filter with slash and traverses tiles with J/K", () => {
    render(<DemoGrid initialFilters={DEFAULT_FILTERS} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
    });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /Alle \(12\)/ }),
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(document.activeElement).toBe(screen.getAllByTestId("demo-tile")[0]);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(document.activeElement).toBe(screen.getAllByTestId("demo-tile")[1]);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    });
    expect(document.activeElement).toBe(screen.getAllByTestId("demo-tile")[0]);
  });

  it("server-renders the filtered gallery without a Next navigation context", () => {
    const markup = renderToStaticMarkup(
      <DemoGrid initialFilters={{ ...DEFAULT_FILTERS, level: "einstieg" }} />,
    );

    expect(markup.match(/data-testid="demo-tile"/g)).toHaveLength(3);
    expect(markup).toContain('data-slug="excel"');
    expect(markup).toContain('data-slug="roi-rechner"');
    expect(markup).toContain('data-slug="word"');
    expect(markup).not.toContain("Praxisbeispiele werden geladen");
  });
});
