import {
  describe,
  it,
  expect,
  beforeAll,
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
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { StackFlow } from "./stack-flow";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      removeItem: (k: string) => store.delete(k),
      setItem: (k: string, v: string) => store.set(k, String(v)),
    },
    writable: true,
    configurable: true,
  });
}

beforeAll(() => {
  if (
    typeof window.localStorage === "undefined" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("StackFlow", () => {
  it("renders all six stack layers and a canvas", () => {
    render(<StackFlow lessonId="di-mental-model" cpId="flow" />);
    for (const name of [
      "source",
      "log",
      "processing",
      "storage",
      "serving",
      "consume",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("img", { name: /Animated diagram of an event flowing/ }),
    ).toBeInTheDocument();
  });

  it("keeps the mobile canvas shrinkable inside a vertically composed control surface", () => {
    render(<StackFlow lessonId="di-mental-model" cpId="flow" />);

    const canvas = screen.getByRole("img", {
      name: /Animated diagram of an event flowing/,
    });
    const canvasWrap = canvas.parentElement;
    const simulation = canvasWrap?.parentElement;
    const labelRail = canvasWrap?.previousElementSibling;
    const controls = screen.getByRole("button", {
      name: /trace 1 event/,
    }).parentElement;

    expect(canvas).toHaveClass("min-w-0", "max-w-full", "w-full");
    expect(canvasWrap).toHaveClass("min-w-0", "flex-1");
    expect(simulation).toHaveClass("min-w-0");
    expect(labelRail).toHaveClass("w-[92px]", "sm:w-[180px]");
    expect(controls).toHaveClass("flex-col", "sm:flex-row", "min-w-0");
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi
      .fn()
      .mockReturnValue(null) as any;
    try {
      expect(() =>
        render(<StackFlow lessonId="di-mental-model" cpId="flow" />),
      ).not.toThrow();
      expect(
        screen.getByRole("img", { name: /An event flows source/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("img", { name: /Animated diagram/ }),
      ).not.toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("awards the checkpoint after tracing three events", () => {
    vi.useFakeTimers();
    render(<StackFlow lessonId="di-mental-model" cpId="flow" />);
    const playBtn = screen.getByRole("button", { name: /trace 1 event/ });
    expect(isCheckpointDone("di-mental-model", "flow")).toBe(false);

    for (let i = 0; i < 3; i++) {
      act(() => {
        fireEvent.click(playBtn);
        vi.advanceTimersByTime(1000);
      });
    }

    expect(isCheckpointDone("di-mental-model", "flow")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("burst and storm controls exist and can be clicked without crashing", () => {
    vi.useFakeTimers();
    render(<StackFlow lessonId="di-mental-model" cpId="flow" />);
    expect(() => {
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /burst/ }));
        vi.advanceTimersByTime(2000);
      });
    }).not.toThrow();
    expect(() => {
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /storm/ }));
        vi.advanceTimersByTime(3000);
      });
    }).not.toThrow();
  });
});
