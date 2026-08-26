/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/**
 * demos-gallery-view.test.tsx (regression coverage)
 *
 * Exercises the LOGIC of the REAL <DemosGalleryView />: the client-side search
 * `matches()` predicate (case-insensitive substring across title / tagline /
 * kind / teachesIn), the category grouping that drops empty categories, the
 * "N/9" filtered counter, and the conditional Clear button.
 *
 * framer-motion (m.* -> plain elements, incl. m.create used by ClipHeading),
 * next/link and the heavy widget registry are mocked so nothing beyond the
 * gallery's own filter/group derivation is under test. The lazy demo bodies
 * never mount here anyway: the jsdom IntersectionObserver mock never fires, so
 * each panel stays a placeholder.
 */

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
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

vi.mock("@/components/widgets/registry", () => ({
  RenderWidget: () => null,
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MOTION_ONLY_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileInView",
    "custom",
    "viewport",
    "layout",
    "layoutId",
    "mode",
  ]);
  const cache = new Map<string, React.ElementType>();
  const make = (tag: string): React.ElementType => {
    if (!cache.has(tag)) {
      const Comp = React.forwardRef(function MotionMock(props: any, ref: any) {
        const rest: Record<string, unknown> = {};
        for (const key in props) {
          if (key !== "children" && !MOTION_ONLY_PROPS.has(key)) {
            rest[key] = props[key];
          }
        }
        return React.createElement(tag, { ...rest, ref }, props.children);
      });
      cache.set(tag, Comp);
    }
    return cache.get(tag)!;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === "create") {
          return (tag: unknown) => make(typeof tag === "string" ? tag : "div");
        }
        return typeof prop === "string" ? make(prop) : undefined;
      },
    },
  );
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    useReducedMotion: () => true,
    useInView: () => false,
    useMotionValue: (v: number) => ({ set: () => {}, get: () => v }),
    useSpring: (mv: unknown) => mv,
    useTransform: () => ({ get: () => "" }),
  };
});

import { DemosGalleryView } from "./demos-gallery-view";

const SEARCH_LABEL = "Kurssimulationen durchsuchen";

function typeQuery(value: string): void {
  fireEvent.change(screen.getByLabelText(SEARCH_LABEL), { target: { value } });
}

afterEach(() => {
  cleanup();
});

describe("<DemosGalleryView> default listing", () => {
  it("puts the search instrument in the header and keeps one 44px+ primary action", () => {
    const { container } = render(<DemosGalleryView />);
    const frame = container.querySelector(
      '[data-technical-course="ai-native-demos"]',
    );
    const search = screen.getByLabelText(SEARCH_LABEL);
    expect(frame?.querySelector("header")?.contains(search)).toBe(true);
    expect(search).toHaveClass("min-h-12");

    const primary = frame?.querySelectorAll(
      '[data-workspace-primary-action="true"]',
    );
    expect(primary).toHaveLength(1);
    expect(primary?.[0]).toHaveClass("min-h-12");

    for (const link of frame?.querySelectorAll(
      'nav[aria-label="Simulationskategorien"] a',
    ) ?? []) {
      expect(link).toHaveClass("min-h-11");
    }

    typeQuery("excel");
    expect(screen.getByRole("button", { name: "Leeren" })).toHaveClass(
      "min-h-11",
      "min-w-11",
    );
  });

  it("shows all 9 demos, a 9/9 counter, and only the non-empty categories", () => {
    render(<DemosGalleryView />);

    // 9 active demos, none filtered out.
    expect(screen.getByText("9/9")).toBeInTheDocument();

    // Category jump-nav counts (label + item count). Observability has no active
    // demo, so its chip (and section) must be absent entirely.
    expect(screen.getByText("Chat & Wissen (1)")).toBeInTheDocument();
    expect(screen.getByText("Dokumente (3)")).toBeInTheDocument();
    expect(screen.getByText("Agents & Workflows (2)")).toBeInTheDocument();
    expect(screen.getByText("ROI & Reife (2)")).toBeInTheDocument();
    expect(screen.getByText("Compliance (1)")).toBeInTheDocument();
    expect(screen.queryByText(/Observability/)).toBeNull();

    // A few demo titles are present.
    expect(screen.getByText("RAG Vertrags-Assistent")).toBeInTheDocument();
    expect(screen.getByText("Excel-Automation")).toBeInTheDocument();
    expect(screen.getByText("ROI Calculator")).toBeInTheDocument();
  });

  it("hides the Clear button until a query is entered", () => {
    render(<DemosGalleryView />);
    expect(screen.queryByRole("button", { name: "Leeren" })).toBeNull();
  });

  it("renders the English catalog and localized course route", () => {
    render(<DemosGalleryView locale="en" />);
    expect(
      screen.getByText("Contract retrieval assistant"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Search course simulations"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Start the course/ })[0],
    ).toHaveAttribute("href", "/en/ai-native/kurs/modul_1");
    expect(screen.queryByText("RAG Vertrags-Assistent")).toBeNull();
  });
});

describe("<DemosGalleryView> search filtering", () => {
  it("narrows to a single demo + its category on a title match", () => {
    render(<DemosGalleryView />);
    typeQuery("excel");

    expect(screen.getByText("1/9")).toBeInTheDocument();
    // Only the Dokumente category survives (Excel-Automation lives there).
    expect(screen.getByText("Dokumente (1)")).toBeInTheDocument();
    expect(screen.queryByText("Chat & Wissen (1)")).toBeNull();
    expect(screen.queryByText("ROI & Reife (2)")).toBeNull();

    expect(screen.getByText("Excel-Automation")).toBeInTheDocument();
    expect(screen.queryByText("ROI Calculator")).toBeNull();
    expect(screen.queryByText("RAG Vertrags-Assistent")).toBeNull();
  });

  it("matches on the widget kind, not just the visible title", () => {
    render(<DemosGalleryView />);
    // "chat" only appears in the kind `demo-chat-rag` (not in its title/tagline).
    typeQuery("chat");

    expect(screen.getByText("1/9")).toBeInTheDocument();
    expect(screen.getByText("RAG Vertrags-Assistent")).toBeInTheDocument();
    expect(screen.queryByText("Excel-Automation")).toBeNull();
  });

  it("matches on tagline / teachesIn text", () => {
    render(<DemosGalleryView />);
    // "dsgvo" only appears in the compliance demo's tagline + teachesIn.
    typeQuery("dsgvo");

    expect(screen.getByText("1/9")).toBeInTheDocument();
    expect(screen.getByText("Compliance Prompt-Scanner")).toBeInTheDocument();
    expect(screen.queryByText("Excel-Automation")).toBeNull();
  });

  it("is case-insensitive and trims surrounding whitespace", () => {
    render(<DemosGalleryView />);
    typeQuery("  EXCEL  ");

    expect(screen.getByText("1/9")).toBeInTheDocument();
    expect(screen.getByText("Excel-Automation")).toBeInTheDocument();
  });

  it("shows an empty result set (0/9) for a query that matches nothing", () => {
    render(<DemosGalleryView />);
    typeQuery("zzzznope");

    expect(screen.getByText("0/9")).toBeInTheDocument();
    expect(screen.queryByText("Excel-Automation")).toBeNull();
    expect(screen.queryByText("RAG Vertrags-Assistent")).toBeNull();
    // No category survived, so no jump-nav chips remain.
    expect(screen.queryByText("Dokumente (3)")).toBeNull();
  });
});

describe("<DemosGalleryView> Clear affordance", () => {
  it("appears once a query exists and resets the query + counter on click", () => {
    render(<DemosGalleryView />);
    typeQuery("excel");
    expect(screen.getByText("1/9")).toBeInTheDocument();

    const clear = screen.getByRole("button", { name: "Leeren" });
    fireEvent.click(clear);

    // Query cleared -> counter back to the full 9/9 and input emptied.
    expect(screen.getByText("9/9")).toBeInTheDocument();
    expect(
      (screen.getByLabelText(SEARCH_LABEL) as HTMLInputElement).value,
    ).toBe("");
  });
});
