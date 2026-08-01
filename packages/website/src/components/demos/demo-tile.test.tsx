/**
 * demo-tile.test.tsx (regression coverage)
 *
 * DemoTile is the gallery card: a next/link to the detail page that carries the
 * gallery origin and renders the demo metadata (number padded against the
 * total, level badge, category + lead industry, thumbnail).
 * We drive its real logic:
 *  - the deeplink href (`?source=gallery`) + accessible label + data attribute,
 *  - String(total).padStart(2, "0") vs the raw demo.n,
 *  - the `industries[0] ? " - x" : ""` footer conditional,
 *  - levelColorClass picking a dark-tile vs light-tile ink for the level badge,
 *  - the gallery-preview slot rendering only when the registry supplies one.
 *
 * next/link, the analytics dispatcher and the preview registry are mocked so the
 * assertions target DemoTile's own rendering, not Next routing or preview chunks.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Demo } from "@/lib/demos";
import { DemoTile } from "./demo-tile";
import { getGalleryPreview } from "./demo-component-registry";

vi.mock("next/link", () => ({
  default: ({ children, prefetch, ...props }: { children: ReactNode; prefetch?: boolean; [key: string]: unknown }) => (
    <a {...props} data-prefetch={String(prefetch)}>{children}</a>
  ),
}));

vi.mock("./demo-component-registry", () => ({
  getGalleryPreview: vi.fn(() => undefined),
}));

const mockedPreview = vi.mocked(getGalleryPreview);

function makeDemo(overrides: Partial<Demo> = {}): Demo {
  return {
    id: "excel",
    slug: "excel",
    n: "01",
    category: "Grundlagen",
    level: "einstieg",
    size: "s-med",
    dark: false,
    accent: true,
    title: "Claude in Excel.",
    titleKicker: "Formel, Pivot, Prognose.",
    background: "Excel-Add-In - Microsoft 365 - keine neue Software",
    description: "Beschreibung der Demo als Fliesstext.",
    tags: ["Excel"],
    meta: [],
    industries: ["Controlling"],
    illustrative: true,
    courseSlug: "ai-native",
    bookSlugs: [],
    templateSlugs: [],
    evidenceMode: "synthetic",
    externalActionMode: "none",
    syntheticDataLabel: "Fiktiv.",
    riskNotes: [],
    lastReviewed: "2026-06-19",
    ...overrides,
  };
}

describe("<DemoTile>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPreview.mockReturnValue(undefined);
  });

  it("links to the detail page with the gallery source and an accessible label", () => {
    render(
      <DemoTile
        demo={makeDemo({ slug: "word", title: "Claude in Word.", titleKicker: "Verträge." })}
        total={12}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/demos/word?source=gallery");
    expect(link).toHaveAttribute("aria-label", "Praxisbeispiel öffnen: Claude in Word. Verträge.");
    expect(link).toHaveAttribute("data-demo-tile", "word");
    expect(link).toHaveAttribute("data-prefetch", "false");
    expect(link).toHaveClass("demo-gallery-tile");
  });

  it("shows the raw demo number and the zero-padded total", () => {
    render(<DemoTile demo={makeDemo({ n: "03" })} total={7} />);
    // demo.n is printed verbatim; total is padded to two digits.
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("07")).toBeInTheDocument();
  });

  it("renders the level label from DEMO_LEVEL_LABELS", () => {
    render(<DemoTile demo={makeDemo({ level: "fortg" })} total={7} />);
    expect(screen.getByText("Fortgeschritten")).toBeInTheDocument();
  });

  it("renders the description, title kicker and tech-stack background", () => {
    const demo = makeDemo();
    render(<DemoTile demo={demo} total={7} />);
    expect(screen.getByText(demo.description)).toBeInTheDocument();
    expect(screen.getByText(demo.titleKicker)).toBeInTheDocument();
    expect(screen.getByText(demo.background)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: `${demo.title} ${demo.titleKicker}`,
      }),
    ).toBeInTheDocument();
  });

  it("appends the lead industry to the category when one is present", () => {
    const { container } = render(
      <DemoTile demo={makeDemo({ category: "Grundlagen", industries: ["Controlling", "Finance"] })} total={7} />,
    );
    // Only the FIRST industry is shown next to the category.
    expect(container.textContent).toContain("Controlling");
    expect(container.textContent).not.toContain("Finance");
  });

  it("shows the bare category (no separator) when there is no industry", () => {
    const { container } = render(
      <DemoTile demo={makeDemo({ category: "Grundlagen", industries: [] })} total={7} />,
    );
    expect(container.textContent).toContain("Grundlagen");
    expect(container.textContent).not.toContain("Controlling");
  });

  it("uses a light-tile ink for the level badge on a light demo", () => {
    render(<DemoTile demo={makeDemo({ level: "einstieg", dark: false })} total={7} />);
    const badge = screen.getByText("Einstieg");
    // Light einstieg badge uses the darker green ink #166534 for AA on cream.
    expect(badge.className).toContain("#166534");
  });

  it("uses a dark-tile ink for the level badge on a dark demo", () => {
    render(<DemoTile demo={makeDemo({ level: "einstieg", dark: true })} total={7} />);
    const badge = screen.getByText("Einstieg");
    // Dark einstieg badge uses the bright green var, not the light-tile ink.
    expect(badge.className).toContain("text-[var(--color-risk-green)]");
    expect(badge.className).not.toContain("#166534");
  });

  it("renders the gallery preview only when the registry supplies one", () => {
    // Default (registry returns undefined): no preview marker.
    const { unmount } = render(<DemoTile demo={makeDemo()} total={7} />);
    expect(screen.queryByTestId("preview")).toBeNull();
    unmount();

    mockedPreview.mockReturnValue(() => <div data-testid="preview" />);
    render(<DemoTile demo={makeDemo()} total={7} />);
    expect(screen.getByTestId("preview")).toBeInTheDocument();
  });
});
