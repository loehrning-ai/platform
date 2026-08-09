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
import { L09ToolbeltBuilder } from "./l09-toolbelt-builder";

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

describe("L09ToolbeltBuilder", () => {
  it("starts with an empty belt", () => {
    render(<L09ToolbeltBuilder lessonId="L09" cpId="bespoke" />);
    expect(screen.getByText("belt: 0 / 5")).toBeInTheDocument();
  });

  it("picking a needed tool adds it to the belt permanently", () => {
    render(<L09ToolbeltBuilder lessonId="L09" cpId="bespoke" />);
    fireEvent.click(screen.getByText("vitest"));
    expect(screen.getByText("belt: 1 / 5")).toBeInTheDocument();
  });

  it("picking a mismatched tool shows that it is not required and reverts", () => {
    vi.useFakeTimers();
    render(<L09ToolbeltBuilder lessonId="L09" cpId="bespoke" />);
    fireEvent.click(screen.getByText("pytest"));
    expect(
      screen.getByText(/not required by this scenario/),
    ).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(
      screen.queryByText(/not required by this scenario/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("belt: 0 / 5")).toBeInTheDocument();
  });

  it("awards the checkpoint once all 5 needed tools are placed", () => {
    render(<L09ToolbeltBuilder lessonId="L09" cpId="bespoke" />);
    for (const id of [
      "vitest",
      "eslint",
      "docker-compose",
      "postgres-test-db",
    ]) {
      fireEvent.click(screen.getByText(id));
    }
    expect(isCheckpointDone("L09", "bespoke")).toBe(false);
    fireEvent.click(screen.getByText("make ci"));
    expect(isCheckpointDone("L09", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/TOOL SET RECORDED/)).toBeInTheDocument();
  });
});
