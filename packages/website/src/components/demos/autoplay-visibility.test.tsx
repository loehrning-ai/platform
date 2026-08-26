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

  it("stops the agent status loops on exit and completes a bounded replay after re-entry", () => {
    const { container } = render(<AgentPipelineDemo />);

    expectNoInfiniteAnimation(container);

    setIntersecting(true);
    expect(
      container.querySelectorAll('[style*="infinite"]').length,
    ).toBeGreaterThan(0);
    expect(container.querySelector('[aria-current="step"]')).not.toBeNull();

    setIntersecting(false);
    expectNoInfiniteAnimation(container);
    expect(container.querySelector('[aria-current="step"]')).toBeNull();

    setIntersecting(true);
    act(() => vi.advanceTimersByTime(5_100));

    expectNoInfiniteAnimation(container);
    expect(
      screen.getByText("KI-Einführung in 2 Phasen, Start Q3/2026."),
    ).toBeInTheDocument();
  });

  it("does not pulse outbound before visibility, stops on exit, and replays to review", () => {
    const { container } = render(<OutboundWorkflowDemo />);

    expectNoInfiniteAnimation(container);

    setIntersecting(true);
    expect(container.querySelectorAll('[style*="infinite"]')).toHaveLength(2);

    act(() => vi.advanceTimersByTime(400));
    expect(container.querySelectorAll('[style*="infinite"]')).toHaveLength(3);

    setIntersecting(false);
    expectNoInfiniteAnimation(container);

    setIntersecting(true);
    act(() => vi.advanceTimersByTime(3_000));

    expectNoInfiniteAnimation(container);
    expect(screen.getByText("● Versand simuliert 09:14")).toBeInTheDocument();

    const checklist = screen.getByRole("button", {
      name: "Was fehlt vor einem echten Versand?",
    });
    fireEvent.click(checklist);
    expect(checklist).toHaveAttribute("aria-expanded", "true");
  });

  it("unmounts the invoice scan loop on exit and completes a bounded replay after re-entry", () => {
    const { container } = render(<RechnungZuSapDemo />);

    expectNoInfiniteAnimation(container);

    setIntersecting(true);
    act(() => vi.advanceTimersByTime(300));
    expect(container.querySelectorAll('[style*="infinite"]')).toHaveLength(1);

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
