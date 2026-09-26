/**
 * demo-tile.test.tsx (regression coverage)
 *
 * DemoTile is the gallery card: a next/link to the detail page that carries the
 * gallery origin and renders the demo metadata (number, category + lead
 * industry, evidence and level chips, schematic preview).
 * We drive its real logic:
 *  - the deeplink href (`?source=gallery`) + accessible label + data attribute,
 *  - the raw demo.n in the kicker,
 *  - the `industries[0] ? " · x" : ""` kicker conditional,
 *  - one paper sheet for every demo, dark or not, with meta chips,
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
import { getGalleryPreview } from "./demo-gallery-registry";

vi.mock("next/link", () => ({
  default: ({
    children,
    prefetch,
    ...props
  }: {
    children: ReactNode;
    prefetch?: boolean;
    [key: string]: unknown;
  }) => (
    <a {...props} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
}));

vi.mock("./demo-gallery-registry", () => ({
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
        demo={makeDemo({
          slug: "word",
          title: "Claude in Word.",
          titleKicker: "Verträge.",
        })}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/demos/word?source=gallery");
    expect(link).toHaveAttribute(
      "aria-label",
      "Praxisbeispiel öffnen: Claude in Word",
    );
    expect(link).toHaveAttribute("data-demo-tile", "word");
    expect(link).toHaveAttribute("data-demo-size", "s-med");
    expect(link).toHaveAttribute("data-prefetch", "false");
    expect(link).toHaveClass("demo-gallery-tile");
  });

  it("renders the same preview-led tile whatever the registry size", () => {
    const { container } = render(
      <DemoTile demo={makeDemo({ size: "s-hero" })} />,
    );
    const link = screen.getByRole("link");
    const preview = container.querySelector("[data-demo-preview]");
    const heading = screen.getByRole("heading", { level: 3 });

    // Uniform grid (blueprint 6.14): no spans, a fixed 4:3 preview panel.
    expect(link.className).not.toMatch(/col-span|row-span/);
    expect(preview).toHaveClass("aspect-[4/3]", "bg-inset");
    expect(preview).toBeTruthy();
    expect(preview).toHaveAttribute("aria-hidden", "true");
    expect(
      (preview as HTMLElement).compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(preview).toHaveClass("motion-reduce:transition-none");
    expect(container.querySelector("[data-demo-preview-content]")).toHaveClass(
      "motion-reduce:transform-none",
      "motion-reduce:transition-none",
    );
  });

  it("shows the raw demo number in the kicker", () => {
    render(<DemoTile demo={makeDemo({ n: "03" })} />);
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("renders evidence and level from the registry as one caption line", () => {
    const { container } = render(<DemoTile demo={makeDemo({ level: "fortg" })} />);
    const meta = container.querySelector("[data-demo-tile-meta]");
    expect(meta).toHaveTextContent("Synthetisch · Fortgeschritten");
    expect(meta).toHaveClass("text-caption", "text-muted-foreground");
    expect(container.querySelector("[data-chip]")).toBeNull();
  });

  it("renders the full description and the plain name as a one-colour heading", () => {
    const demo = makeDemo();
    render(<DemoTile demo={demo} />);
    const description = screen.getByText(demo.description);
    expect(description.className).not.toContain("line-clamp");
    // Only the name, without its full stop; the task phrase is not repeated.
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent(/^Claude in Excel$/);
    expect(heading).toHaveClass("text-balance", "hyphens-manual", "text-foreground");
    expect(screen.queryByText(demo.titleKicker)).toBeNull();
  });

  it("appends the lead industry to the category when one is present", () => {
    const { container } = render(
      <DemoTile
        demo={makeDemo({
          category: "Grundlagen",
          industries: ["Controlling", "Finance"],
        })}
      />,
    );
    // Only the FIRST industry is shown next to the category.
    expect(container.textContent).toContain("Grundlagen · Controlling");
    expect(container.textContent).not.toContain("Finance");
  });

  it("shows the bare category (no separator) when there is no industry", () => {
    const { container } = render(
      <DemoTile demo={makeDemo({ category: "Grundlagen", industries: [] })} />,
    );
    expect(container.textContent).toContain("Grundlagen");
    expect(container.textContent).not.toContain("Controlling");
  });

  it("renders a dark-engine demo on the same paper sheet as every other tile", () => {
    render(<DemoTile demo={makeDemo({ dark: true })} />);
    const link = screen.getByRole("link");
    // Borderless like every tile; the preview panel is the only box.
    expect(link.className).not.toMatch(/\bborder\b|bg-card|bg-foreground|dark-section/);
    // Hover darkens the panel only: no lift, no offset shadow.
    expect(link.className).not.toMatch(/shadow|translate/);
  });

  it("renders the gallery preview only when the registry supplies one", () => {
    // Default (registry returns undefined): no preview marker.
    const { unmount } = render(<DemoTile demo={makeDemo()} />);
    expect(screen.queryByTestId("preview")).toBeNull();
    unmount();

    mockedPreview.mockReturnValue(() => <div data-testid="preview" />);
    render(<DemoTile demo={makeDemo()} />);
    expect(screen.getByTestId("preview")).toBeInTheDocument();
  });
});
