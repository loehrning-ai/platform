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
 * these through the DOM with REAL catalog entries and mock only the heavy
 * presentational children (DemoShell, which also carries the evidence line,
 * and AnimatedMetaTable) so the assertions target the derivations rather than
 * framer-motion / timers.
 */

vi.mock("./demo-shell", () => ({
  DemoShell: ({ demo }: { demo: { slug: string } }) => (
    <div data-testid="demo-shell" data-slug={demo.slug} />
  ),
}));

vi.mock("./animated-meta-table", () => ({
  AnimatedMetaTable: () => <div data-testid="animated-meta-table" />,
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
    // The H1 is the plain name: no full stop, no second sentence.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Claude in Excel$/,
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

  it("names the course once, in the continuation, without a stage label", () => {
    const { container } = render(<DemoDetailLayout demo={agent} />);
    const continuation = container.querySelector("[data-demo-continuation]");
    expect(continuation).toHaveTextContent(/Im Kurs · Modul \d+ · Lektion \d+/);
    // The stage label contradicted the learning graph; the page no longer
    // carries one, and no second "Weiterlernen" block repeats the course.
    expect(container.textContent).not.toMatch(/Stufe \d|Weiterlernen/);
    expect(screen.queryByRole("heading", { name: "Im Kurs" })).toBeNull();
  });

  it("links to the next demo in catalog order", () => {
    const { container } = render(<DemoDetailLayout demo={excel} />);
    // excel is index 0 -> next is word (index 1).
    expect(
      screen.getByText(/Nächstes Praxisbeispiel · 02/),
    ).toBeInTheDocument();
    // Same order as the course side: kicker, title, action. The title names
    // the target, the button keeps the tile's verb, and its accessible name
    // starts with that visible text and adds the target.
    const next = container.querySelector("[data-demo-next]");
    expect(next?.children[1]).toHaveTextContent(/^Claude in Word$/);
    expect(next?.children[1]).toHaveClass("text-fluid-h3", "font-bold");
    const link = screen.getByRole("link", {
      name: "Beispiel öffnen: Claude in Word",
    });
    expect(link).toHaveAttribute("href", "/demos/word?source=next-demo");
    expect(link).toHaveTextContent(/^Beispiel öffnen$/);
    // Below md the halves stack, so a hairline separates them.
    expect(next).toHaveClass("max-md:border-t", "max-md:border-hairline");
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

  it("states what is invented once, in the four-row run table", () => {
    const { container } = render(<DemoDetailLayout demo={excel} />);
    // getByText throws on duplicates: the data row says it once. The
    // evidence line now lives in the (mocked) engine header, not the page.
    expect(screen.getByText(excel.syntheticDataLabel)).toBeInTheDocument();
    expect(container.querySelector("[data-evidence-line]")).toBeNull();
    const labels = Array.from(
      container.querySelectorAll("[data-demo-run-rows] dt"),
    ).map((dt) => dt.textContent);
    expect(labels).toEqual(["Daten", "Ausführung", "Externe Aktionen", "Abbruch"]);
    // Fixed label column, baseline-aligned with the value.
    const row = container.querySelector("[data-demo-run-rows] > div");
    expect(row).toHaveClass("grid-cols-[8.5rem_minmax(0,1fr)]", "items-baseline");
    expect(screen.queryByText(/^Sandbox-Szenario/)).toBeNull();
    expect(screen.queryByText("Sandbox-Grenze")).toBeNull();
  });

  it("gives the actions row a short value, not the evidence-line phrase", () => {
    // outbound-workflow is the review_gated demo.
    const outbound = demos.find((d) => d.slug === "outbound-workflow")!;
    const { container } = render(<DemoDetailLayout demo={outbound} />);
    const values = Array.from(
      container.querySelectorAll("[data-demo-run-rows] > div"),
    ).map((row) => [
      row.querySelector("dt")?.textContent,
      row.querySelector("dd")?.textContent,
    ]);
    expect(values).toContainEqual(["Externe Aktionen", "Simuliert, mit Freigabe-Schritt"]);
    expect(container.textContent).not.toContain("Freigabe-Schritt simuliert");
  });

  it("uses one-colour headings and a paper band for a dark engine", () => {
    const { container } = render(<DemoDetailLayout demo={agent} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/^Agent-Pipeline$/);
    expect(h1).toHaveClass("text-balance", "hyphens-manual");
    expect(h1.querySelector("span")).toBeNull();
    const hero = container.querySelector("[data-demo-detail-hero]");
    expect(hero?.className).not.toContain("dark-section");
    expect(
      screen.getByRole("heading", { level: 2, name: "So läuft dieses Beispiel" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aufgezeichnete Spur")).toBeInTheDocument();
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
    expect(container.querySelectorAll("a.bg-brand-orange")).toHaveLength(1);
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
    // Text links, not boxed chips that look like filter buttons.
    const link = screen.getByRole("link", {
      name: "Praxisbeispiele im Arbeitskontext Controlling",
    });
    expect(link).toHaveClass("min-h-11", "underline");
    // decoration-border only colours the underline; no box border utilities.
    expect(link.className).not.toMatch(/(?:^|\s)border(?:-|\s|$)/);
  });
});
