import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoDetailLayout } from "./demo-detail-layout";
import { demos } from "@/lib/demos";

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ href, children, prefetch, ...rest }: any) =>
      React.createElement(
        "a",
        {
          href: typeof href === "string" ? href : "#",
          "data-prefetch": String(prefetch),
          ...rest,
        },
        children,
      ),
  };
});

/**
 * demo-detail-layout.test.tsx (regression coverage)
 *
 * DemoDetailLayout wires a Demo entry into the /demos/[slug] page. The logic
 * worth guarding lives in its private derivations: lessonLabel
 * (modul_x_lesson_y -> "Modul x · Lektion y"; block_n -> "Block n"), lessonHref
 * (module deep-link vs block deep-link), the KI-Kompetenzweg Stufe mapping per
 * demo level, the getNextDemo hand-off, and the related-books lookup. We drive
 * these through the DOM with REAL catalog entries and mock only the three heavy
 * presentational children (DemoShell, AnimatedMetaTable, EvidenceBadge) so the
 * assertions target the derivations rather than framer-motion / timers.
 */

vi.mock("./demo-shell", () => ({
  DemoShell: ({ demo }: { demo: { slug: string } }) => (
    <div data-testid="demo-shell" data-slug={demo.slug} />
  ),
}));

vi.mock("./animated-meta-table", () => ({
  AnimatedMetaTable: () => <div data-testid="animated-meta-table" />,
}));

vi.mock("./evidence-badge", () => ({
  EvidenceBadge: () => <div data-testid="evidence-badge" />,
}));

// excel: ai-native / modul_2_lesson_2 / einstieg
const excel = demos.find((d) => d.slug === "excel")!;
// rag: eu-ai-act-kurs / block_2 / mittel
const rag = demos.find((d) => d.slug === "rag-vertragsassistent")!;
// agent: ai-native / fortg
const agent = demos.find((d) => d.slug === "agent-pipeline")!;

describe("<DemoDetailLayout>", () => {
  it("renders the breadcrumb, category and level meta for the demo", () => {
    render(<DemoDetailLayout demo={excel} />);
    expect(
      screen.getByRole("link", { name: "Alle Praxisbeispiele" }),
    ).toHaveAttribute("href", "/demos");
    expect(
      screen.getByText(/Praxisbeispiel 01 · Grundlagen · Einstieg/),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Claude in Excel.",
    );
  });

  it("derives a module lesson label + deep link for a modul_x_lesson_y lessonId", () => {
    render(<DemoDetailLayout demo={excel} />);
    expect(screen.getByText(/Modul 2 · Lektion 2/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Lektion" })).toHaveAttribute(
      "href",
      "/ai-native/kurs/modul_2/modul_2_lesson_2",
    );
    expect(screen.getByRole("link", { name: "Zur Lektion" })).toHaveAttribute(
      "data-prefetch",
      "false",
    );
  });

  it("derives a block lesson label + deep link for a block_n lessonId", () => {
    render(<DemoDetailLayout demo={rag} />);
    expect(screen.getByText(/Block 2/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Lektion" })).toHaveAttribute(
      "href",
      "/eu-ai-act-kurs/kurs/block_2",
    );
    expect(screen.getByRole("link", { name: "Zur Lektion" })).toHaveAttribute(
      "data-prefetch",
      "false",
    );
  });

  it("maps each demo level to its KI-Kompetenzweg Stufe", () => {
    const { rerender } = render(<DemoDetailLayout demo={excel} />);
    expect(screen.getByText(/Stufe 3: Anwenden/)).toBeInTheDocument();

    rerender(<DemoDetailLayout demo={rag} />);
    expect(screen.getByText(/Stufe 4: Umsetzen/)).toBeInTheDocument();

    rerender(<DemoDetailLayout demo={agent} />);
    expect(screen.getByText(/Stufe 5: Gestalten/)).toBeInTheDocument();
  });

  it("links to the next demo in catalog order", () => {
    render(<DemoDetailLayout demo={excel} />);
    // excel is index 0 -> next is word (index 1).
    expect(
      screen.getByText(/Nächstes Praxisbeispiel · 02/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Weiter" })).toHaveAttribute(
      "href",
      "/demos/word?source=next-demo",
    );
  });

  it("surfaces no related book while its bookSlugs target is unpublished", () => {
    render(<DemoDetailLayout demo={excel} />);
    // excel.bookSlugs = ['ki-tools-selbststaendige'], which is pending
    // re-review and excluded from the public `books` catalog (see
    // lib/books.ts) — the related-books lookup filters it out, so no link
    // to it should render.
    const hrefs = screen
      .getAllByRole("link")
      .map((l) => l.getAttribute("href"));
    expect(hrefs).not.toContain("/buecher/ki-tools-selbststaendige");
  });

  it("renders the synthetic-data boundary label verbatim", () => {
    render(<DemoDetailLayout demo={excel} />);
    expect(screen.getByText(excel.syntheticDataLabel)).toBeInTheDocument();
  });

  it("places the instrument before evidence notes and the single primary continuation", () => {
    const { container } = render(<DemoDetailLayout demo={excel} />);
    const orderedSections = Array.from(
      container.querySelectorAll(
        "[data-demo-instrument], [data-demo-notes], [data-demo-continuation]",
      ),
    ).map((element) =>
      element.hasAttribute("data-demo-instrument")
        ? "instrument"
        : element.hasAttribute("data-demo-notes")
          ? "notes"
          : "continuation",
    );

    expect(orderedSections).toEqual(["instrument", "notes", "continuation"]);
    const continuation = container.querySelector("[data-demo-continuation]");
    expect(continuation?.querySelectorAll("a")).toHaveLength(1);
    expect(continuation?.querySelector("a")).toHaveClass("bg-brand-orange");
    expect(container.querySelector("[data-demo-detail-hero]")).toBeTruthy();
    expect(container.querySelector("[data-demo-detail-layout]")).toBeTruthy();
  });

  it("wires each industry to a filtered gallery link", () => {
    render(<DemoDetailLayout demo={excel} />);
    // excel.industries[0] === 'Controlling' -> /demos?industry=Controlling
    const hrefs = screen
      .getAllByRole("link")
      .map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/demos?industry=Controlling");
  });
});
