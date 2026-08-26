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
import { L10GitGraphOrchestrator } from "./l10-git-graph-orchestrator";

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

describe("L10GitGraphOrchestrator", () => {
  it("renders Ready initially", () => {
    render(<L10GitGraphOrchestrator lessonId="L10" cpId="bespoke" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Launch: T1: add health endpoint",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Launch: T2: refactor logger" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Launch: T3: typed config loader",
      }),
    ).toBeInTheDocument();
  });

  it("launching T1 alone completes it without showing a conflict", () => {
    vi.useFakeTimers();
    render(<L10GitGraphOrchestrator lessonId="L10" cpId="bespoke" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Launch: T1: add health endpoint",
      }),
    );
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByText("T1: completed.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "T1: add health endpoint: Done",
      }),
    ).toBeDisabled();
    expect(screen.queryByText("Merge Conflict")).not.toBeInTheDocument();
  });

  it("shows a merge conflict once T2 and T3 both complete, and resolving it plus T1 awards the checkpoint", () => {
    vi.useFakeTimers();
    render(<L10GitGraphOrchestrator lessonId="L10" cpId="bespoke" />);
    const launchButtons = screen.getAllByRole("button", { name: /^Launch:/ });
    // launchButtons order matches TASKS: [T1, T2, T3]
    fireEvent.click(launchButtons[1]); // T2
    fireEvent.click(launchButtons[2]); // T3
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(screen.getByText("Merge Conflict")).toBeInTheDocument();
    expect(isCheckpointDone("L10", "bespoke")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Rebase T3 on T2" }));
    expect(screen.queryByText("Merge Conflict")).not.toBeInTheDocument();
    expect(isCheckpointDone("L10", "bespoke")).toBe(false); // T1 not launched yet

    fireEvent.click(
      screen.getByRole("button", {
        name: "Launch: T1: add health endpoint",
      }),
    );
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(isCheckpointDone("L10", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("unmounting mid-run clears every pending interval instead of leaking them", () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = render(
      <L10GitGraphOrchestrator lessonId="L10" cpId="bespoke" />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Launch: T1: add health endpoint",
      }),
    );
    act(() => {
      vi.advanceTimersByTime(150);
    });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("keeps the task title in the in-progress count control", () => {
    vi.useFakeTimers();
    render(<L10GitGraphOrchestrator lessonId="L10" cpId="bespoke" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Launch: T2: refactor logger" }),
    );
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(
      screen.getByRole("button", {
        name: "T2: refactor logger: in-progress, 1/8 progress steps",
      }),
    ).toBeDisabled();
  });
});
