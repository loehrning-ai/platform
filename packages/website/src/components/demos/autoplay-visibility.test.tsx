import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgentPipelineDemo from "./agent-pipeline-demo";
import OutboundWorkflowDemo from "./outbound-workflow-demo";
import RechnungZuSapDemo from "./rechnung-zu-sap-demo";

class ControlledIntersectionObserver {
  static latest: ControlledIntersectionObserver | null = null;

  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0.25];

  constructor(
    private readonly callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {
    ControlledIntersectionObserver.latest = this;
  }

  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  setIntersecting(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const originalIntersectionObserver = globalThis.IntersectionObserver;
const originalMatchMedia = window.matchMedia;

function setReducedMotion(reduced: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

function setIntersecting(isIntersecting: boolean): void {
  const observer = ControlledIntersectionObserver.latest;
  if (!observer) throw new Error("Demo did not create an IntersectionObserver");
  act(() => observer.setIntersecting(isIntersecting));
}

function expectNoInfiniteAnimation(container: HTMLElement): void {
  expect(container.querySelectorAll('[style*="infinite"]')).toHaveLength(0);
}

describe("demo autoplay visibility lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
    ControlledIntersectionObserver.latest = null;
    globalThis.IntersectionObserver =
      ControlledIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    globalThis.IntersectionObserver = originalIntersectionObserver;
    window.matchMedia = originalMatchMedia;
  });

  it("shows the agent memo on load, replays only on click, and pauses off-screen", () => {
    const { container } = render(<AgentPipelineDemo />);
    const memo = "KI-Einführung in 2 Phasen, Start Q3/2026.";

    // Final state first: the memo and the full trace are there on load.
    expectNoInfiniteAnimation(container);
    expect(screen.getByText(memo)).toBeInTheDocument();
    expect(screen.getByText("Schritt 14 / 14")).toBeInTheDocument();

    // Scrolling the engine into view does not start a run by itself.
    setIntersecting(true);
    act(() => vi.advanceTimersByTime(5_100));
    expect(screen.getByText("Schritt 14 / 14")).toBeInTheDocument();
    expect(container.querySelector('[aria-current="step"]')).toBeNull();

    // "Neu abspielen" is the only trigger; the current step is marked by
    // tone and edge, never by a looping animation.
    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    expect(container.querySelector('[aria-current="step"]')).not.toBeNull();
    expectNoInfiniteAnimation(container);
    expect(screen.getByText(memo)).toBeInTheDocument();

    // Leaving the viewport pauses the run.
    setIntersecting(false);
    expect(container.querySelector('[aria-current="step"]')).toBeNull();

    // Re-entry completes one bounded run and settles on the final state.
    setIntersecting(true);
    act(() => vi.advanceTimersByTime(5_100));
    expectNoInfiniteAnimation(container);
    expect(screen.getByText("Schritt 14 / 14")).toBeInTheDocument();
    expect(container.querySelector('[aria-current="step"]')).toBeNull();
    expect(screen.getByText(memo)).toBeInTheDocument();
  });

  it("shows the outbound draft on load, replays only on click, and never loops", () => {
    const { container } = render(<OutboundWorkflowDemo />);

    // Final state first, with no looping pulse, scan or caret.
    expectNoInfiniteAnimation(container);
    expect(screen.getByText("Versand simuliert 09:14")).toBeInTheDocument();

    // Entering the viewport does not start a run by itself.
    setIntersecting(true);
    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByText("Schritt 4 / 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    expect(screen.getByText("Schritt 0 / 4")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();
    expectNoInfiniteAnimation(container);

    // Leaving the viewport pauses the replay at the start.
    setIntersecting(false);
    expect(screen.getByText("Schritt 0 / 4")).toBeInTheDocument();

    // Re-entry completes one bounded run and settles on the final state.
    setIntersecting(true);
    act(() => vi.advanceTimersByTime(3_000));
    expectNoInfiniteAnimation(container);
    expect(screen.getByText("Versand simuliert 09:14")).toBeInTheDocument();

    const checklist = screen.getByRole("button", {
      name: "Was fehlt vor einem echten Versand?",
    });
    fireEvent.click(checklist);
    expect(checklist).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the invoice extract on load and runs one finite scan per replay", () => {
    const { container } = render(<RechnungZuSapDemo />);

    expectNoInfiniteAnimation(container);
    expect(screen.getByText("Industrie-Sensoren Typ S-2200")).toBeInTheDocument();

    setIntersecting(true);
    act(() => vi.advanceTimersByTime(3_600));
    expect(screen.getByText("Schritt 4 / 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "↻ Neu abspielen" }));
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText("Schritt 1 / 4")).toBeInTheDocument();
    // The OCR scan line plays once; nothing loops.
    expectNoInfiniteAnimation(container);

    setIntersecting(false);
    expectNoInfiniteAnimation(container);
    expect(
      screen.getByText(/Extrahierte Felder erscheinen nach UStG-Validierung/),
    ).toBeInTheDocument();

    setIntersecting(true);
    act(() => vi.advanceTimersByTime(3_600));

    expectNoInfiniteAnimation(container);
    expect(
      screen.getByText("Industrie-Sensoren Typ S-2200"),
    ).toBeInTheDocument();
  });

  it.each([
    ["agent pipeline", AgentPipelineDemo],
    ["outbound workflow", OutboundWorkflowDemo],
    ["invoice extraction", RechnungZuSapDemo],
  ])("keeps %s static under reduced motion", (_name, Demo) => {
    setReducedMotion(true);
    const { container } = render(<Demo />);

    expectNoInfiniteAnimation(container);
  });
});
