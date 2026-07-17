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
 * doc-demo.test.tsx (regression coverage)
 *
 * Drives the REAL exported <DocDemo /> invoice-extraction component. framer-
 * motion is mocked to plain elements, and prefers-reduced-motion is forced so
 * the component takes its `if (reducedMotion) setScanY(1)` branch and never
 * touches requestAnimationFrame/performance - leaving the four-stage pipeline
 * driven purely by setTimeout, which fake timers flush deterministically
 * (delays are scaled by 0.1 in reduced motion, so extraction lands at 370ms).
 *
 * Covered for real: the idle render (invoice preview + stage list + idle CTA),
 * the click -> "Verarbeitet…" running state, and the finished render that
 * mounts the extracted SAMPLE_DATA (confidence, USt-ID, IBAN, line items,
 * brutto) while dropping the idle placeholder.
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

import { DocDemo } from "./doc-demo";

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
  setReducedMotion(true);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("<DocDemo> initial (idle) render", () => {
  it("renders the labelled region, invoice preview and pipeline stages", () => {
    const { container } = render(<DocDemo />);

    expect(
      screen.getByRole("region", { name: "Praxisbeispiel: Rechnungserkennung" }),
    ).toBeInTheDocument();

    // Heading + intro copy.
    expect(container.textContent).toContain("Vom Scan zum");
    expect(container.textContent).toContain("Buchungsentwurf");
    expect(
      container.textContent,
    ).toContain(
      "Simulierter Ablauf: Extraktion, Plausibilitätscheck und Exportvorschlag.",
    );

    // The four pipeline stages (title + detail).
    expect(screen.getByText("OCR")).toBeInTheDocument();
    expect(screen.getByText("Struktur-Parsing")).toBeInTheDocument();
    expect(screen.getByText("Validierung")).toBeInTheDocument();
    expect(screen.getByText("Export-Entwurf")).toBeInTheDocument();
    expect(screen.getByText("Azure Form Recognizer")).toBeInTheDocument();
    expect(screen.getByText("Claude Opus 4.5 · tool_use")).toBeInTheDocument();
    expect(screen.getByText("UStG §14 · SKR03")).toBeInTheDocument();

    // Static invoice preview text.
    expect(container.textContent).toContain("FIKTIVWERK-BEISPIEL AG");
    expect(container.textContent).toContain("RE-2026-04211");
  });

  it("shows the idle CTA and no extracted data yet", () => {
    const { container } = render(<DocDemo />);

    expect(screen.getByRole("button")).toHaveTextContent("Extrahieren");
    expect(screen.getByRole("button")).not.toBeDisabled();

    expect(
      container.textContent,
    ).toContain("um die Verarbeitung zu starten");
    // The extracted-data panel (and its unique USt-ID) is not mounted yet.
    expect(container.textContent).not.toContain("Extrahierte Daten");
    expect(container.textContent).not.toContain("DE000000000 (DUMMY)");
    expect(container.textContent).not.toContain("97% confidence");
  });
});

describe("<DocDemo> extraction run", () => {
  it("enters a disabled 'Verarbeitet…' state on click", () => {
    render(<DocDemo />);

    fireEvent.click(screen.getByRole("button"));

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Verarbeitet");
  });

  it("mounts the extracted SAMPLE_DATA after the pipeline completes", () => {
    const { container } = render(<DocDemo />);

    fireEvent.click(screen.getByRole("button"));
    act(() => {
      // Reduced-motion scale is 0.1; extraction fires at 3700ms * 0.1 = 370ms.
      vi.advanceTimersByTime(800);
    });

    // Button reaches its terminal, re-runnable "Fertig" state.
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Neu starten");

    // The data panel is now mounted with the explicitly fictional values.
    expect(screen.getByText("Extrahierte Daten")).toBeInTheDocument();
    expect(container.textContent).toContain("97% confidence");
    expect(container.textContent).toContain("FIKTIVWERK-BEISPIEL AG · Musterstadt (rein fiktiv)");
    expect(container.textContent).toContain("DE000000000 (DUMMY)");
    expect(container.textContent).toContain("DE00 0000 0000 0000 0000 00 (DUMMY)");

    // Line items + brutto total.
    expect(screen.getByText("Leistung")).toBeInTheDocument();
    expect(screen.getByText("Summe")).toBeInTheDocument();
    expect(
      container.textContent,
    ).toContain("Industrie-Sensoren Typ S-2200");
    expect(container.textContent).toContain("Wartungsvertrag 12M");
    expect(container.textContent).toContain("100.317,00 €");

    // Idle placeholder is replaced by the data panel.
    expect(
      container.textContent,
    ).not.toContain("um die Verarbeitung zu starten");
  });

  it("can be re-run from the finished state", () => {
    render(<DocDemo />);

    fireEvent.click(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Neu starten");

    // A second click restarts the pipeline (back to a disabled running state).
    fireEvent.click(screen.getByRole("button"));
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Verarbeitet");
  });
});
