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
import { PartitionSim } from "./partition-sim";

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

describe("PartitionSim", () => {
  it("defaults to the date strategy with a perfect-prune verdict", () => {
    render(<PartitionSim lessonId="di-partitioning" cpId="part" />);
    expect(
      screen.getByRole("img", {
        name: /Visualization of how a partitioning strategy/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 / 30")).toBeInTheDocument();
    expect(screen.getByText("perfect prune (1 of 30)")).toBeInTheDocument();
  });

  it("switching to the country strategy shows the skew warning and no-prune verdict", () => {
    render(<PartitionSim lessonId="di-partitioning" cpId="part" />);
    fireEvent.change(screen.getByLabelText("Partition strategy"), {
      target: { value: "country" },
    });
    expect(screen.getByText("⚠ US 62%")).toBeInTheDocument();
    expect(
      screen.getByText(/no prune, also: heavy US skew/),
    ).toBeInTheDocument();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi
      .fn()
      .mockReturnValue(null) as any;
    try {
      expect(() =>
        render(<PartitionSim lessonId="di-partitioning" cpId="part" />),
      ).not.toThrow();
      expect(
        screen.getByRole("img", { name: /Partition pruning/ }),
      ).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("scanning awards the checkpoint", () => {
    vi.useFakeTimers();
    render(<PartitionSim lessonId="di-partitioning" cpId="part" />);
    expect(isCheckpointDone("di-partitioning", "part")).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /scan/ }));
      vi.advanceTimersByTime(1000);
    });
    expect(isCheckpointDone("di-partitioning", "part")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });
});
