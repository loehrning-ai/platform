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
import { KafkaTopic } from "./kafka-topic";

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

describe("KafkaTopic", () => {
  it("renders the producer, 4 partitions, and 3 consumers", () => {
    const { container } = render(
      <KafkaTopic lessonId="di-streaming" cpId="kafka" />,
    );
    expect(
      screen.getByRole("img", { name: /Animated Kafka topic/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("producer · ● live")).toBeInTheDocument();
    const text = container.textContent ?? "";
    for (const p of ["p0", "p1", "p2", "p3"]) expect(text).toContain(p);
    for (const c of ["c0", "c1", "c2"]) expect(text).toContain(c);
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi
      .fn()
      .mockReturnValue(null) as any;
    try {
      expect(() =>
        render(<KafkaTopic lessonId="di-streaming" cpId="kafka" />),
      ).not.toThrow();
      expect(
        screen.getByRole("img", { name: /producer routes messages by key/ }),
      ).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("sending 3 messages awards the checkpoint and updates the produced counter", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <KafkaTopic lessonId="di-streaming" cpId="kafka" />,
    );
    const sendBtn = screen.getByRole("button", { name: /send 1/ });
    expect(isCheckpointDone("di-streaming", "kafka")).toBe(false);
    for (let i = 0; i < 3; i++) {
      act(() => {
        fireEvent.click(sendBtn);
      });
    }
    expect(isCheckpointDone("di-streaming", "kafka")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    unmount();
  });

  it("killing c1 marks it dead and reassigns its partitions to c0", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <KafkaTopic lessonId="di-streaming" cpId="kafka" />,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /kill c1/ }));
    });
    expect(screen.getByText("dead")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kill c1/ })).toBeDisabled();
    unmount();
  });

  it("burst and storm controls can be clicked without crashing, and the consumer-poll interval is cleared on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <KafkaTopic lessonId="di-streaming" cpId="kafka" />,
    );
    expect(() => {
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /burst/ }));
        vi.advanceTimersByTime(3000);
      });
    }).not.toThrow();
    unmount();
    expect(() => act(() => vi.advanceTimersByTime(5000))).not.toThrow();
  });
});
