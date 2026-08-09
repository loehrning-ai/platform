/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";

/**
 * agent-demo.test.tsx (regression coverage)
 *
 * Drives the REAL exported <AgentDemo /> component (not a mirrored copy of its
 * SCRIPT). We mock framer-motion down to plain elements so the assertions only
 * depend on the component's own state machine (useEffect + setTimeout), and we
 * force prefers-reduced-motion so the scripted delays collapse (scale 0.2) and
 * fake timers can flush the whole pipeline instantly.
 *
 * What is exercised for real: the static tile/log/memo render, the click ->
 * "running" transition (disabled button + "wird verfasst" placeholder), the
 * full pipeline completion (14 log events + the decision memo), and the
 * re-run path.
 */

vi.mock("framer-motion", async () => {
  const React = await import("react");
  // Declared INSIDE the factory: vi.mock is hoisted above module-scope
  // consts, so referencing an outer const here would hit the TDZ.
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
    "whileDrag",
    "drag",
    "dragConstraints",
    "layout",
    "layoutId",
    "custom",
    "viewport",
    "mode",
    "onAnimationStart",
    "onAnimationComplete",
    "onUpdate",
  ]);
  const cache = new Map<string, React.ElementType>();
  const make = (tag: string): React.ElementType => {
    if (!cache.has(tag)) {
      const Comp = React.forwardRef(function MotionMock(
        props: any,
        ref: any,
      ) {
        // Pass DOM/aria/style/handlers straight through; drop the
        // framer-only animation props so React does not warn.
        const rest: Record<string, unknown> = {};
        for (const key in props) {
          if (key !== "children" && !MOTION_ONLY_PROPS.has(key)) {
            rest[key] = props[key];
          }
        }
        return React.createElement(
          tag,
          { ...rest, ref },
          props.children,
        );
      });
      cache.set(tag, Comp);
    }
    return cache.get(tag)!;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, tag) =>
        typeof tag === "string" ? make(tag) : undefined,
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
  };
});

import { AgentDemo } from "./agent-demo";

function setReducedMotion(reduced: boolean): void {
  (window as any).matchMedia = (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  // Force reduced motion: the component multiplies every scripted delay by 0.2,
  // so the final "done" timeout lands at 1020ms of fake time.
  setReducedMotion(true);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("<AgentDemo> initial (idle) render", () => {
  it("exposes the labelled region and the four specialised agents", () => {
    const { container } = render(<AgentDemo />);

    expect(
      screen.getByRole("region", { name: "Praxisbeispiel: Multi-Agent-Workflow" }),
    ).toBeInTheDocument();

    // The four agent tiles.
    expect(screen.getByText("Scout")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Kritiker")).toBeInTheDocument();
    expect(screen.getByText("Redakteur")).toBeInTheDocument();

    // Their models: Sonnet is shared by two agents.
    expect(screen.getByText("small-classifier")).toBeInTheDocument();
    expect(screen.getByText("analysis-model")).toBeInTheDocument();
    expect(screen.getAllByText("general-model")).toHaveLength(2);

    // A couple of the (unique) task strings.
    expect(
      container.textContent,
    ).toContain("Sucht im Archiv nach relevanten Präzedenzfällen");
    expect(
      container.textContent,
    ).toContain("Verfasst strukturiertes Memo für Geschäftsführung");
  });

  it("shows the idle button label, an empty log and the memo placeholder", () => {
    const { container } = render(<AgentDemo />);

    expect(screen.getByRole("button")).toHaveTextContent("Pipeline starten");
    expect(screen.getByRole("button")).not.toBeDisabled();

    expect(screen.getByText("› AGENT.LOG")).toBeInTheDocument();
    expect(
      screen.getByText("// warten auf pipeline start…"),
    ).toBeInTheDocument();
    expect(container.textContent).toContain("0 ereignisse");

    // Memo panel shows its "not yet run" placeholder, no memo body.
    expect(
      container.textContent,
    ).toContain("MEMO ERSCHEINT NACH PIPELINE-ABSCHLUSS");
    expect(container.textContent).not.toContain("2,4k TOKENS");
  });
});

describe("<AgentDemo> pipeline run", () => {
  it("transitions to a disabled, running state on click", () => {
    const { container } = render(<AgentDemo />);

    fireEvent.click(screen.getByRole("button"));

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Läuft");
    // While running (and not yet done) the memo panel shows the "wird verfasst"
    // placeholder, not the finished memo.
    expect(container.textContent).toContain("MEMO WIRD VERFASST");
    expect(container.textContent).not.toContain("2,4k TOKENS");
  });

  it("streams every scripted log event and reveals the finished memo", () => {
    const { container } = render(<AgentDemo />);

    fireEvent.click(screen.getByRole("button"));
    act(() => {
      // Reduced-motion scale is 0.2, so 5100ms * 0.2 = 1020ms completes it.
      vi.advanceTimersByTime(1500);
    });

    // All 14 scripted steps landed in the log.
    expect(container.textContent).toContain("14 ereignisse");
    expect(container.textContent).toContain("Starte Archiv-Suche…");

    // Button flips back to a fresh, enabled "restart" state.
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Erneut starten");

    // Decision memo is now rendered with its sections + export affordance.
    expect(container.textContent).toContain("2,4k TOKENS · 18 QUELLEN");
    expect(
      container.textContent,
    ).toContain("KI-Einführung in 2 Phasen, Start Q3/2026.");
    expect(screen.getByText("§1 · KERNTHESE")).toBeInTheDocument();
    expect(screen.getByText("§2 · RISIKEN")).toBeInTheDocument();
    expect(screen.getByText("§3 · NÄCHSTE SCHRITTE")).toBeInTheDocument();
    expect(container.textContent).toContain("PDF EXPORT");
    // The idle placeholder is gone once the pipeline has finished.
    expect(
      container.textContent,
    ).not.toContain("MEMO ERSCHEINT NACH PIPELINE-ABSCHLUSS");
  });

  it("can be re-run: a second click clears the log and returns to running", () => {
    const { container } = render(<AgentDemo />);

    fireEvent.click(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(container.textContent).toContain("14 ereignisse");

    // Second run resets the log back to empty and re-enters the running state.
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveTextContent("Läuft");
    expect(container.textContent).toContain("0 ereignisse");
    expect(
      screen.getByText("// warten auf pipeline start…"),
    ).toBeInTheDocument();
  });
});
