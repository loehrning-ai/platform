import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}

import { __resetCacheForTests, isCheckpointDone } from "@/lib/progress";
import { MatrixGridWidget } from "./matrix-grid";

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
});

describe("MatrixGridWidget (plan 013 stage 5)", () => {
  const rows = ["Internal email draft", "Board-facing number"];
  const cols = ["Skim", "Read carefully", "Verify against source"];

  it("renders one radiogroup per row", () => {
    render(<MatrixGridWidget lessonId="mindset/3" cpId="matrix" rows={rows} cols={cols} />);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(2);
  });

  it("does not award the checkpoint until every row has a pick", () => {
    render(<MatrixGridWidget lessonId="mindset/3" cpId="matrix" rows={rows} cols={cols} />);
    fireEvent.click(screen.getByRole("radio", { name: "Internal email draft — Skim" }));
    expect(isCheckpointDone("mindset/3", "matrix")).toBe(false);
    fireEvent.click(screen.getByRole("radio", { name: "Board-facing number — Verify against source" }));
    expect(isCheckpointDone("mindset/3", "matrix")).toBe(true);
  });

  it("marks the chosen cell aria-checked and persists the pick", () => {
    render(<MatrixGridWidget lessonId="mindset/3" cpId="matrix" rows={rows} cols={cols} />);
    const cell = screen.getByRole("radio", { name: "Internal email draft — Skim" });
    fireEvent.click(cell);
    expect(cell).toHaveAttribute("aria-checked", "true");
    const raw = window.localStorage.getItem("matrix::mindset/3::matrix");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({ "Internal email draft": 0 });
  });

  it("handles empty rows without awarding", () => {
    render(<MatrixGridWidget lessonId="mindset/3" cpId="matrix" rows={[]} cols={cols} />);
    expect(isCheckpointDone("mindset/3", "matrix")).toBe(false);
  });
});
