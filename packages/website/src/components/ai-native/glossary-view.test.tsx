import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * glossary-view.test.tsx (regression coverage)
 *
 * GlossaryView is a props-driven reference page. Its only real logic is the
 * live search: `filtered` is a useMemo that returns null for an empty query
 * (grouped browse view) and otherwise a case-insensitive term-OR-definition
 * substring filter across every entry. We drive the real search box and assert
 * which terms survive, the empty-state, the Clear reset, and the related-term
 * anchor id derivation. framer-motion-free primitives + next/link are stubbed
 * to bare host elements so we exercise GlossaryView's own filtering, nothing
 * else.
 */

vi.mock("@/components/ai-native/primitives", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    ClipHeading: ({ children, as }: { children: unknown; as?: string }) =>
      createElement(as ?? "h2", null, children as never),
    Eyebrow: ({ children }: { children: unknown }) =>
      createElement("p", null, children as never),
    FadeBlock: ({ children }: { children: unknown }) =>
      createElement("div", null, children as never),
  };
});

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    default: ({
      children,
      href,
      className,
    }: {
      children: unknown;
      href: string;
      className?: string;
    }) => createElement("a", { href, className }, children as never),
  };
});

import { GlossaryView, useGlossaryEyebrow } from "./glossary-view";

const groups = [
  {
    key: "claude" as const,
    num: "01",
    label: "Claude",
    entries: [
      {
        term: "Prompt",
        category: "claude" as const,
        definition: "Eine Anweisung an das Sprachmodell.",
        related: [] as readonly string[],
      },
      {
        term: "Kontext-Fenster",
        category: "claude" as const,
        definition: "Das Token-Budget pro Anfrage.",
        // Related term is deliberately NOT another entry's term, so the term
        // "Prompt" appears exactly once (its own <dt>) in the browse view.
        related: ["Halluzination"] as readonly string[],
      },
    ],
  },
  {
    key: "regulatorik" as const,
    num: "02",
    label: "Regulatorik",
    entries: [
      {
        term: "DSGVO",
        category: "regulatorik" as const,
        definition: "Europaeische Datenschutzgrundverordnung.",
        related: [] as readonly string[],
      },
    ],
  },
];

function renderView() {
  return render(
    <GlossaryView
      groups={groups}
      totalTerms={3}
      version="1.4"
      lastUpdated="14. Juli 2026"
    />,
  );
}

describe("<GlossaryView> search", () => {
  it("keeps search, category navigation, and disclosure controls at 44px or larger", () => {
    const { container } = renderView();
    const search = screen.getByLabelText("Glossar durchsuchen");
    expect(
      container
        .querySelector('[data-technical-course="ai-native-glossary"] header')
        ?.contains(search),
    ).toBe(true);
    expect(search).toHaveClass("min-h-12");
    for (const link of screen.getAllByRole("link", {
      name: /Claude|Regulatorik/,
    })) {
      if (link.getAttribute("href")?.startsWith("#cat-")) {
        expect(link).toHaveClass("min-h-11");
      }
    }
    fireEvent.change(search, { target: { value: "prompt" } });
    expect(screen.getByRole("button", { name: "Leeren" })).toHaveClass(
      "min-h-11",
      "min-w-11",
    );
    expect(screen.getByText("Referenzstatus").closest("summary")).toHaveClass(
      "min-h-12",
    );
  });

  it("shows the grouped browse view (all terms + category headings) with no query", () => {
    renderView();
    expect(screen.getByLabelText("Glossar durchsuchen")).not.toHaveAttribute(
      "readonly",
    );
    // Both category headings render (the h2 appends a period).
    expect(screen.getByText("Claude.")).toBeInTheDocument();
    expect(screen.getByText("Regulatorik.")).toBeInTheDocument();
    // Every term visible.
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    expect(screen.getByText("Kontext-Fenster")).toBeInTheDocument();
    expect(screen.getByText("DSGVO")).toBeInTheDocument();
    // Header count line and version metadata are the passed props.
    expect(screen.getByText("3 Einträge · 2 Kategorien")).toBeInTheDocument();
    expect(
      screen.getByText("Version 1.4 · zuletzt aktualisiert 14. Juli 2026"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Regulatorik/ })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("renders a related-term link whose anchor is the encoded lowercase term", () => {
    renderView();
    // Kontext-Fenster relates to "Halluzination" -> #term-halluzination.
    const rel = screen.getByRole("link", { name: "Halluzination" });
    expect(rel).toHaveAttribute("href", "#term-halluzination");
  });

  it("filters to a single term matching in the term field (case-insensitive)", () => {
    renderView();
    fireEvent.change(screen.getByLabelText("Glossar durchsuchen"), {
      target: { value: "prompt" },
    });
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    // Non-matching entries disappear, and the grouped h2 headings are gone.
    expect(screen.queryByText("DSGVO")).toBeNull();
    expect(screen.queryByText("Kontext-Fenster")).toBeNull();
    expect(screen.queryByText("Claude.")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("1 Treffer");
  });

  it("matches on the definition text even when the term does not contain the query", () => {
    renderView();
    fireEvent.change(screen.getByLabelText("Glossar durchsuchen"), {
      target: { value: "datenschutz" },
    });
    // "DSGVO" term has no "datenschutz", but its definition does.
    expect(screen.getByText("DSGVO")).toBeInTheDocument();
    expect(screen.queryByText("Prompt")).toBeNull();
  });

  it("shows the empty state for a query that matches nothing", () => {
    renderView();
    fireEvent.change(screen.getByLabelText("Glossar durchsuchen"), {
      target: { value: "quantenphysik" },
    });
    expect(
      screen.getByText("Keine Treffer. Versuche einen anderen Begriff."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Prompt")).toBeNull();
    expect(screen.queryByText("DSGVO")).toBeNull();
  });

  it("Leeren resets the query back to the grouped browse view", () => {
    renderView();
    const input = screen.getByLabelText("Glossar durchsuchen");
    fireEvent.change(input, { target: { value: "prompt" } });
    expect(screen.queryByText("DSGVO")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Leeren" }));
    // Back to grouped view: category headings + all terms return.
    expect(screen.getByText("Claude.")).toBeInTheDocument();
    expect(screen.getByText("DSGVO")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("renders English search chrome and a locale-prefixed course link", () => {
    render(
      <GlossaryView
        groups={groups}
        totalTerms={3}
        version="1.4"
        lastUpdated="14 July 2026"
        locale="en"
      />,
    );
    expect(screen.getByLabelText("Search glossary")).toBeInTheDocument();
    expect(screen.getByText("3 entries · 2 categories")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Course" })).toHaveAttribute(
      "href",
      "/en/ai-native",
    );
  });
});

describe("useGlossaryEyebrow()", () => {
  it("returns the reference eyebrow element", () => {
    function Host() {
      return useGlossaryEyebrow();
    }
    render(<Host />);
    expect(screen.getByText("Referenz · Glossar")).toBeInTheDocument();
  });
});
