import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  COURSE_WORKSPACE_STORAGE_PREFIX,
  CourseWorkspaceFrame,
} from "./course-workspace-frame";

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
      return store.get(key) ?? null;
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
    configurable: true,
  });
}

const STORAGE_ID = "frame-test";
const STORAGE_KEY = `${COURSE_WORKSPACE_STORAGE_PREFIX}${STORAGE_ID}`;
const DOCKED_LAYOUT_MEDIA_QUERY = "(min-width: 1024px)";
const originalMatchMedia = window.matchMedia;
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

/**
 * jsdom performs no layout, so every element measures 0 wide. The frame now
 * treats an unmeasured container as too narrow to dock — stacking is the safe
 * default until a real width proves otherwise — so a docked-layout test has to
 * state the container width it is assuming, exactly as it already states the
 * viewport via matchMedia.
 */
function setContainerWidth(width: number): void {
  Element.prototype.getBoundingClientRect = function (): DOMRect {
    return {
      width,
      height: 600,
      top: 0,
      left: 0,
      right: width,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

function setDockedLayoutViewport(matches: boolean): void {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === DOCKED_LAYOUT_MEDIA_QUERY ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
}

function frameElement({
  locale = "en",
  id = "test-workspace-frame",
  storageId = STORAGE_ID,
  titleId = "test-workspace-title",
  title = "Evidence project",
}: {
  readonly locale?: "de" | "en";
  readonly id?: string;
  readonly storageId?: string;
  readonly titleId?: string;
  readonly title?: string;
} = {}) {
  return (
    <CourseWorkspaceFrame
      id={id}
      titleId={titleId}
      title={title}
      storageId={storageId}
      locale={locale}
      projectId={`project-${storageId}`}
      engineKind="data"
      header={<div>Persistent header</div>}
      brief={<h2 id={titleId}>{title}</h2>}
      workspace={<button type="button">Workspace action</button>}
    />
  );
}

function renderFrame(locale: "de" | "en" = "en") {
  return render(frameElement({ locale }));
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
  setDockedLayoutViewport(true);
  setContainerWidth(1200);
  window.localStorage.clear();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

afterEach(() => {
  cleanup();
  Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  window.matchMedia = originalMatchMedia;
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

describe("CourseWorkspaceFrame", () => {
  it("does not create a course-specific visit record before a layout choice", async () => {
    renderFrame();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Collapse project brief" }),
      ).toBeInTheDocument(),
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("collapses the brief without hiding the workspace and persists layout-only state", async () => {
    renderFrame();
    const frame = document.querySelector("#test-workspace-frame");
    expect(frame).toHaveAttribute("data-layout", "docked");
    expect(screen.getByLabelText("Project brief")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse project brief" }),
    );
    expect(screen.getByLabelText("Project brief")).not.toBeVisible();
    expect(
      screen.getByRole("button", { name: "Workspace action" }),
    ).toBeInTheDocument();
    expect(frame).toHaveAttribute(
      "aria-label",
      "Project workspace: Evidence project",
    );

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "{}",
      ) as Record<string, unknown>;
      expect(stored).toEqual({
        version: 1,
        briefCollapsed: true,
        docked: true,
        briefPercent: 40,
      });
      expect(JSON.stringify(stored)).not.toContain("Evidence project");
    });
  });

  it("toggles desktop docking while retaining compact stacking classes", () => {
    renderFrame();
    const frame = document.querySelector("#test-workspace-frame");
    const panes = screen.getByLabelText("Project workspace").parentElement;
    expect(panes).toHaveClass("lg:grid", "min-w-0");
    // Both tracks floor at 0 so the docked grid can always shrink into its
    // container. Fixed 16rem/20rem floors could not, which overflowed the
    // pane whenever the measured width was stale - notably at browser zoom,
    // where a rem is wider than the measurement implies. The real minimums
    // are enforced in percentage terms by getSplitBounds instead.
    expect(panes?.getAttribute("style")).toContain("minmax(0, 40fr)");
    expect(panes?.getAttribute("style")).toContain("minmax(0, 60fr)");
    expect(panes?.getAttribute("style")).not.toContain("16rem");
    expect(frame).toHaveClass("overflow-hidden");
    expect(
      screen.getByRole("separator", { name: "Resize project brief" }),
    ).toBeInTheDocument();

    const stack = screen.getByRole("button", { name: "Stack panes" });
    expect(stack).not.toHaveAttribute("aria-pressed");
    fireEvent.click(stack);
    expect(frame).toHaveAttribute("data-layout", "stacked");
    expect(
      screen.getByRole("button", { name: "Dock panes side by side" }),
    ).not.toHaveAttribute("aria-pressed");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("reports stacked layout and disables docking below the lg breakpoint", () => {
    setDockedLayoutViewport(false);
    renderFrame();

    const frame = document.querySelector("#test-workspace-frame");
    const dock = screen.getByRole("button", {
      name: "Dock panes side by side",
    });
    const panes = screen.getByLabelText("Project workspace").parentElement;

    expect(window.matchMedia).toHaveBeenCalledWith(DOCKED_LAYOUT_MEDIA_QUERY);
    expect(frame).toHaveAttribute("data-layout", "stacked");
    expect(dock).toBeDisabled();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    expect(panes).not.toHaveClass("lg:grid");
    expect(panes).not.toHaveAttribute("style");
  });

  it("resizes the docked brief with a bounded pointer drag", () => {
    renderFrame();
    const panes = screen.getByLabelText("Project workspace").parentElement;
    vi.spyOn(panes as HTMLDivElement, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 0,
      left: 100,
      top: 0,
      right: 1_100,
      bottom: 700,
      width: 1_000,
      height: 700,
      toJSON: () => ({}),
    });
    const separator = screen.getByRole("separator", {
      name: "Resize project brief",
    });
    fireEvent.pointerDown(separator, {
      button: 0,
      pointerId: 1,
      clientX: 500,
    });
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 650 });
    fireEvent.pointerUp(separator, { pointerId: 1, clientX: 650 });
    expect(separator).toHaveAttribute("aria-valuenow", "55");
  });

  it("resizes the docked brief with keyboard bounds and persists the ratio", async () => {
    renderFrame();
    const separator = screen.getByRole("separator", {
      name: "Resize project brief",
    });
    expect(separator).toHaveAttribute("aria-valuenow", "40");

    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(separator).toHaveAttribute("aria-valuenow", "42");
    fireEvent.keyDown(separator, { key: "End" });
    expect(separator).toHaveAttribute("aria-valuenow", "60");
    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(separator).toHaveAttribute("aria-valuenow", "60");

    await waitFor(() =>
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain(
        '"briefPercent":60',
      ),
    );
  });

  it("reports only feasible ratios when the container cannot render the configured maximum", async () => {
    renderFrame();
    const panes = screen.getByRole("region", {
      name: "Project workspace",
    }).parentElement;
    vi.spyOn(panes as HTMLDivElement, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 700,
      bottom: 700,
      width: 700,
      height: 700,
      toJSON: () => ({}),
    });
    fireEvent(window, new Event("resize"));

    const separator = screen.getByRole("separator", {
      name: "Resize project brief",
    });
    await waitFor(() =>
      expect(separator).toHaveAttribute("aria-valuemax", "53"),
    );
    fireEvent.keyDown(separator, { key: "End" });
    expect(separator).toHaveAttribute("aria-valuenow", "53");
    expect(panes?.getAttribute("style")).toContain("53fr");
  });

  it("stops resizing when pointer capture is lost", () => {
    renderFrame();
    const panes = screen.getByRole("region", {
      name: "Project workspace",
    }).parentElement;
    vi.spyOn(panes as HTMLDivElement, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 0,
      left: 100,
      top: 0,
      right: 1_100,
      bottom: 700,
      width: 1_000,
      height: 700,
      toJSON: () => ({}),
    });
    const separator = screen.getByRole("separator", {
      name: "Resize project brief",
    });
    fireEvent.pointerDown(separator, {
      button: 0,
      pointerId: 1,
      clientX: 500,
    });
    fireEvent.lostPointerCapture(separator, { pointerId: 1 });
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 650 });
    expect(separator).toHaveAttribute("aria-valuenow", "40");
  });

  it("enters full screen, moves focus, exits on Escape, and restores body overflow and focus", async () => {
    renderFrame();
    const enter = screen.getByRole("button", { name: "Enter full screen" });
    fireEvent.click(enter);
    const frame = document.querySelector<HTMLElement>("#test-workspace-frame");

    await waitFor(() => {
      expect(frame).toHaveAttribute("data-fullscreen", "true");
      expect(frame).toHaveAttribute("role", "dialog");
      expect(frame).toHaveAttribute("aria-modal", "true");
      expect(frame).toHaveFocus();
      expect(document.body.style.overflow).toBe("hidden");
      expect(document.documentElement.style.overflow).toBe("hidden");
    });
    const panes = screen.getByLabelText("Project workspace").parentElement;
    expect(panes).toHaveClass("overflow-y-auto", "lg:overflow-hidden");
    expect(screen.getByText("Escape exits full screen")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(frame).toHaveAttribute("data-fullscreen", "false");
      expect(document.body.style.overflow).toBe("");
      expect(document.documentElement.style.overflow).toBe("");
      expect(
        screen.getByRole("button", { name: "Enter full screen" }),
      ).toHaveFocus();
    });
  });

  it("makes the background inert and contains forward, reverse, and programmatic focus", async () => {
    render(
      <>
        <button type="button">Background before</button>
        {frameElement()}
        <button type="button">Background after</button>
      </>,
    );
    const before = screen.getByRole("button", { name: "Background before" });
    const after = screen.getByRole("button", { name: "Background after" });
    const enter = screen.getByRole("button", { name: "Enter full screen" });
    fireEvent.click(enter);

    const dialog = await screen.findByRole("dialog", {
      name: "Evidence project",
    });
    expect(before).toHaveAttribute("inert");
    expect(after).toHaveAttribute("inert");
    expect(dialog).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    after.focus();
    expect(dialog).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(enter).toHaveFocus());
    expect(before).not.toHaveAttribute("inert");
    expect(after).not.toHaveAttribute("inert");
  });

  it("serializes multiple full-screen frames and releases document state after the last closes", async () => {
    render(
      <>
        {frameElement({
          id: "first-frame",
          storageId: "first",
          titleId: "first-title",
          title: "First project",
        })}
        {frameElement({
          id: "second-frame",
          storageId: "second",
          titleId: "second-title",
          title: "Second project",
        })}
      </>,
    );
    const openers = screen.getAllByRole("button", {
      name: "Enter full screen",
    });
    fireEvent.click(openers[0]);
    await screen.findByRole("dialog", { name: "First project" });
    fireEvent.click(openers[1]);
    const second = await screen.findByRole("dialog", {
      name: "Second project",
    });
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.querySelector("#first-frame")).toHaveAttribute("inert");
    expect(second).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(document.querySelector("#second-frame")).toHaveAttribute(
        "data-fullscreen",
        "false",
      ),
    );
    expect(document.body.style.overflow).toBe("hidden");
    await waitFor(() =>
      expect(document.querySelector("#first-frame")).toHaveFocus(),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
    await waitFor(() => expect(openers[0]).toHaveFocus());
  });

  it("restores body overflow when a full-screen frame unmounts", async () => {
    document.body.style.overflow = "clip";
    const view = renderFrame();
    fireEvent.click(screen.getByRole("button", { name: "Enter full screen" }));
    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));
    view.unmount();
    expect(document.body.style.overflow).toBe("clip");
  });

  it("hydrates validated preferences and exposes equivalent German controls", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        briefCollapsed: true,
        docked: false,
        briefPercent: 55,
      }),
    );
    renderFrame("de");

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Projektbrief ausklappen" }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("toolbar", { name: "Arbeitsbereich-Layout" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bereiche nebeneinander andocken" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Vollbild öffnen" }),
    ).toBeInTheDocument();
  });
});
