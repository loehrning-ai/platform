import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L02SandboxBox } from "./l02-sandbox-box";

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
  if (typeof window.localStorage === "undefined" || typeof window.localStorage.setItem !== "function") {
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

describe("L02SandboxBox", () => {
  it("starts with filesystem + tests on, everything else off", () => {
    render(<L02SandboxBox lessonId="L02" cpId="bespoke" />);
    expect(screen.getByLabelText("filesystem")).toBeChecked();
    expect(screen.getByLabelText("tests")).toBeChecked();
    expect(screen.getByLabelText("network")).not.toBeChecked();
    expect(screen.getByLabelText("env vars")).not.toBeChecked();
    expect(screen.getByLabelText("secrets")).not.toBeChecked();
    expect(screen.getByText("codex can verify work")).toBeInTheDocument();
  });

  it("turning tests off flips the verification readout", () => {
    render(<L02SandboxBox lessonId="L02" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("tests"));
    expect(screen.getByText("codex cannot verify work — flying blind")).toBeInTheDocument();
  });

  it("shows a transient warning when network is turned on, then clears it", () => {
    vi.useFakeTimers();
    render(<L02SandboxBox lessonId="L02" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("network"));
    expect(screen.getByRole("alert")).toHaveTextContent("NET ON");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("awards the checkpoint once every capability has been toggled at least once", () => {
    render(<L02SandboxBox lessonId="L02" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("filesystem"));
    fireEvent.click(screen.getByLabelText("tests"));
    fireEvent.click(screen.getByLabelText("network"));
    fireEvent.click(screen.getByLabelText("env vars"));
    expect(isCheckpointDone("L02", "bespoke")).toBe(false);
    fireEvent.click(screen.getByLabelText("secrets"));
    expect(isCheckpointDone("L02", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });
});
