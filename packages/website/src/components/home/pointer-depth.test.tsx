import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POINTER_DEPTH_MAX_TILT, PointerDepthList } from "./pointer-depth";

let reducedMotion: boolean;

function renderList() {
  const view = render(
    <PointerDepthList as="ol" aria-label="Route" data-testid="list">
      <li>
        <a href="/a" data-depth-card data-testid="card">
          <span data-testid="inner">A</span>
        </a>
      </li>
      <li>
        <a href="/b" data-testid="plain">
          B
        </a>
      </li>
    </PointerDepthList>,
  );
  const card = view.getByTestId("card");
  vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
    top: 0,
    left: 0,
    width: 200,
    height: 100,
    right: 200,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  return { ...view, card };
}

function move(target: Element, pointerType: string, clientX: number, clientY: number) {
  // jsdom has no PointerEvent constructor; a MouseEvent carrying the
  // pointer fields reaches React's onPointerMove the same way.
  const event = new MouseEvent("pointermove", { bubbles: true, clientX, clientY });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(target, event);
}

beforeEach(() => {
  reducedMotion = false;
  vi.stubGlobal("requestAnimationFrame", (frame: (now: number) => void) => {
    frame(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("reduce") ? reducedMotion : false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PointerDepthList", () => {
  it("renders the requested list element with its props and children", () => {
    const { getByTestId } = renderList();
    const list = getByTestId("list");
    expect(list.tagName).toBe("OL");
    expect(list).toHaveAttribute("aria-label", "Route");
    expect(list.children).toHaveLength(2);
  });

  it("tilts the card under a mouse towards the pointer and moves the light", () => {
    const { card, getByTestId } = renderList();
    // Top-right corner: the card leans back at the top and right.
    move(getByTestId("inner"), "mouse", 200, 0);
    expect(card.style.getPropertyValue("--depth-x")).toBe("100.0%");
    expect(card.style.getPropertyValue("--depth-y")).toBe("0.0%");
    expect(card.style.getPropertyValue("--depth-rx")).toBe(
      `${POINTER_DEPTH_MAX_TILT.toFixed(2)}deg`,
    );
    expect(card.style.getPropertyValue("--depth-ry")).toBe(
      `${POINTER_DEPTH_MAX_TILT.toFixed(2)}deg`,
    );
  });

  it("lays the card flat again when the pointer leaves it", () => {
    const { card, getByTestId } = renderList();
    move(card, "mouse", 0, 100);
    expect(card.style.getPropertyValue("--depth-rx")).not.toBe("");
    fireEvent.pointerOut(card, { relatedTarget: getByTestId("plain") });
    expect(card.style.getPropertyValue("--depth-rx")).toBe("");
    expect(card.style.getPropertyValue("--depth-ry")).toBe("");
  });

  it("stays flat inside the card while the pointer moves between its parts", () => {
    const { card, getByTestId } = renderList();
    move(card, "mouse", 50, 50);
    const tilt = card.style.getPropertyValue("--depth-ry");
    fireEvent.pointerOut(card, { relatedTarget: getByTestId("inner") });
    expect(card.style.getPropertyValue("--depth-ry")).toBe(tilt);
  });

  it("never tilts for touch or pen", () => {
    const { card } = renderList();
    move(card, "touch", 200, 0);
    move(card, "pen", 200, 0);
    expect(card.getAttribute("style")).toBeNull();
  });

  it("keeps the light but drops the tilt under reduced motion", () => {
    reducedMotion = true;
    const { card } = renderList();
    move(card, "mouse", 100, 50);
    expect(card.style.getPropertyValue("--depth-x")).toBe("50.0%");
    expect(card.style.getPropertyValue("--depth-rx")).toBe("");
  });

  it("ignores cards without the depth hook", () => {
    const { getByTestId } = renderList();
    const plain = getByTestId("plain");
    move(plain, "mouse", 10, 10);
    expect(plain.getAttribute("style")).toBeNull();
  });
});
