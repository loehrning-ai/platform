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
import { CdcFlow } from "./cdc-flow";

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

describe("CdcFlow", () => {
  it("renders the Kappa diagram by default with real stage labels", () => {
    render(<CdcFlow lessonId="di-cdc-lambda-kappa" cpId="cdc" />);
    expect(
      screen.getByRole("img", { name: /Kappa architecture/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/One pipeline\. Re-process/)).toBeInTheDocument();
  });

  it("switches to the Lambda diagram on tab click, showing the killer-flaw callout", () => {
    render(<CdcFlow lessonId="di-cdc-lambda-kappa" cpId="cdc" />);
    fireEvent.click(
      screen.getByRole("tab", { name: "Lambda (speed + batch)" }),
    );
    expect(
      screen.getByRole("img", { name: /Lambda architecture/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Two pipelines computing the same logic/),
    ).toBeInTheDocument();
  });

  it("uses stable course-namespaced tab and panel ids", () => {
    render(<CdcFlow lessonId="di-cdc-lambda-kappa" cpId="cdc" />);
    expect(
      screen.getByRole("tab", { name: "Kappa (one stream)" }),
    ).toHaveAttribute(
      "aria-controls",
      "data-infra-di-cdc-lambda-kappa-cdc-kappa-panel",
    );
    expect(
      screen.getByRole("tabpanel", { name: "Kappa (one stream)" }),
    ).toHaveAttribute("id", "data-infra-di-cdc-lambda-kappa-cdc-kappa-panel");
  });

  it("wires tabs to panels and supports roving horizontal keyboard navigation", () => {
    render(<CdcFlow lessonId="di-cdc-lambda-kappa" cpId="cdc" />);
    const tabs = screen.getAllByRole("tab");
    const initialPanel = screen.getByRole("tabpanel");

    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);
    expect(tabs[0]).toHaveAttribute("aria-controls", initialPanel.id);
    expect(initialPanel).toHaveAttribute("aria-labelledby", tabs[0].id);

    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });

    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0]);
    const activePanel = screen.getByRole("tabpanel");
    expect(tabs[1]).toHaveAttribute("aria-controls", activePanel.id);
    expect(activePanel).toHaveAttribute("aria-labelledby", tabs[1].id);
    expect(
      screen.getByRole("img", { name: /Lambda architecture/ }),
    ).toBeInTheDocument();
  });

  it("awards the checkpoint once on claiming XP, idempotently", () => {
    render(<CdcFlow lessonId="di-cdc-lambda-kappa" cpId="cdc" />);
    const btn = screen.getByRole("button", { name: /Got it/ });
    fireEvent.click(btn);
    expect(isCheckpointDone("di-cdc-lambda-kappa", "cdc")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    fireEvent.click(screen.getByRole("button", { name: /claimed/ }));
    expect(getXp()).toBe(XP.CHECKPOINT);
  });
});
