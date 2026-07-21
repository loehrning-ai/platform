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
import { SlotFillWidget } from "./slot-fill";

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

describe("SlotFillWidget ", () => {
  const placeholders = ["Agent A — role", "Agent B — role", "Agent C — role"];

  it("renders one text input per placeholder", () => {
    render(<SlotFillWidget lessonId="engineering/3" cpId="slots" placeholders={placeholders} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
  });

  it("does not award the checkpoint until every slot is filled", () => {
    render(<SlotFillWidget lessonId="engineering/3" cpId="slots" placeholders={placeholders} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Bug-fixer" } });
    fireEvent.change(inputs[1], { target: { value: "Feature-builder" } });
    expect(isCheckpointDone("engineering/3", "slots")).toBe(false);
    fireEvent.change(inputs[2], { target: { value: "Refactorer" } });
    expect(isCheckpointDone("engineering/3", "slots")).toBe(true);
  });

  it("does not count a whitespace-only slot as filled", () => {
    render(<SlotFillWidget lessonId="engineering/3" cpId="slots" placeholders={placeholders} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "A" } });
    fireEvent.change(inputs[1], { target: { value: "B" } });
    fireEvent.change(inputs[2], { target: { value: "   " } });
    expect(isCheckpointDone("engineering/3", "slots")).toBe(false);
  });

  it("persists slot values to localStorage as an ordered array", () => {
    render(<SlotFillWidget lessonId="engineering/3" cpId="slots" placeholders={placeholders} />);
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "Feature-builder" } });
    const raw = window.localStorage.getItem("slots::engineering/3::slots");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual(["", "Feature-builder", ""]);
  });
});
