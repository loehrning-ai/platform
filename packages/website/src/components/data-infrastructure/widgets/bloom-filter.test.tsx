import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { BloomFilter } from "./bloom-filter";

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

describe("BloomFilter", () => {
  it("renders the canvas and add/check/reset controls", () => {
    render(<BloomFilter lessonId="di-storage-formats" cpId="bf" />);
    expect(
      screen.getByRole("img", { name: /Bloom filter visualization/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ add" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "? check" })).toBeInTheDocument();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi
      .fn()
      .mockReturnValue(null) as any;
    try {
      expect(() =>
        render(<BloomFilter lessonId="di-storage-formats" cpId="bf" />),
      ).not.toThrow();
      expect(
        screen.getByRole("img", { name: /bits set after/ }),
      ).toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("adding a key awards the checkpoint and never returns a false negative for that key", () => {
    render(<BloomFilter lessonId="di-storage-formats" cpId="bf" />);
    expect(isCheckpointDone("di-storage-formats", "bf")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "+ add" }));
    expect(isCheckpointDone("di-storage-formats", "bf")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);

    fireEvent.change(screen.getByLabelText("key to check"), {
      target: { value: "user_42" },
    });
    fireEvent.click(screen.getByRole("button", { name: "? check" }));
    expect(screen.getByRole("status")).toHaveTextContent(/maybe/);
  });

  it("checking a definitely-absent key reports 'definitely not'", () => {
    render(<BloomFilter lessonId="di-storage-formats" cpId="bf" />);
    fireEvent.change(screen.getByLabelText("key to check"), {
      target: { value: "zzz_never_added" },
    });
    fireEvent.click(screen.getByRole("button", { name: "? check" }));
    expect(screen.getByRole("status")).toHaveTextContent(/definitely not/);
  });

  it("reset clears the added/bits counters", () => {
    render(<BloomFilter lessonId="di-storage-formats" cpId="bf" />);
    fireEvent.click(screen.getByRole("button", { name: "+ add" }));
    fireEvent.click(screen.getByRole("button", { name: "reset" }));
    expect(
      screen.getAllByText("0", { selector: "b" }).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
