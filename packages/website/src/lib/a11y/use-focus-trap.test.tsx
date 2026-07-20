import { describe, it, expect, vi } from "vitest";
import { render, renderHook, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { useFocusTrap } from "./use-focus-trap";

/**
 * use-focus-trap.test.tsx (regression coverage)
 *
 * Real-behaviour coverage for the a11y focus-trap hook used by the modal-style
 * surfaces (buecher flip-through, mobile nav). renderHook alone leaves the ref
 * unattached, so most cases mount a small <Trap> harness that binds the returned
 * ref to a real <div> and drives keyboard events through jsdom. Assertions read
 * document.activeElement and the KeyboardEvent's prevent-default result (via
 * fireEvent's boolean return) -- the hook's two observable outputs -- so they
 * track the documented guarantees, not implementation details:
 *   - move focus into the trap on open (first focusable, or the node itself),
 *   - cycle Tab / Shift+Tab at the boundaries,
 *   - Escape -> onClose,
 *   - restore focus + detach the listener on close.
 */

/** Configurable harness: binds the trap ref and keeps an outside trigger. */
function Trap({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);
  return (
    <div>
      <button data-testid="outside" type="button">
        outside
      </button>
      <div ref={ref} data-testid="trap">
        {children}
      </div>
    </div>
  );
}

/** Three plain focusable buttons: first / middle / last. */
const threeButtons = (
  <>
    <button data-testid="first" type="button">
      first
    </button>
    <button data-testid="middle" type="button">
      middle
    </button>
    <button data-testid="last" type="button">
      last
    </button>
  </>
);

describe("useFocusTrap", () => {
  it("returns a ref object that is null before it is attached, and is a no-op then", () => {
    const onClose = vi.fn();
    // renderHook never attaches the ref, so ref.current stays null and the
    // effect hits its `if (!node) return` guard: no throw, no onClose.
    const { result } = renderHook(() => useFocusTrap(true, onClose));
    expect(result.current).toHaveProperty("current");
    expect(result.current.current).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not move focus into the trap while open is false", () => {
    render(
      <Trap open={false} onClose={vi.fn()}>
        {threeButtons}
      </Trap>,
    );
    // The `if (!open) return` branch means nothing inside the trap is focused.
    expect(document.activeElement).not.toBe(
      document.querySelector('[data-testid="first"]'),
    );
  });

  it("focuses the first focusable child when open flips to true", () => {
    const { getByTestId } = render(
      <Trap open onClose={vi.fn()}>
        {threeButtons}
      </Trap>,
    );
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("skips a disabled leading button and focuses the first enabled one", () => {
    const { getByTestId } = render(
      <Trap open onClose={vi.fn()}>
        <button data-testid="disabled" type="button" disabled>
          off
        </button>
        <button data-testid="enabled" type="button">
          on
        </button>
      </Trap>,
    );
    // `button:not([disabled])` excludes the disabled node from the list.
    expect(document.activeElement).toBe(getByTestId("enabled"));
    expect(document.activeElement).not.toBe(getByTestId("disabled"));
  });

  it("skips an aria-hidden focusable and focuses the next one", () => {
    const { getByTestId } = render(
      <Trap open onClose={vi.fn()}>
        <button data-testid="hidden" type="button" aria-hidden="true">
          hidden
        </button>
        <button data-testid="visible" type="button">
          visible
        </button>
      </Trap>,
    );
    // The explicit `.filter(el => !el.hasAttribute("aria-hidden"))` drops it.
    expect(document.activeElement).toBe(getByTestId("visible"));
  });

  it("focuses the node itself with tabIndex -1 when it has no focusables", () => {
    const { getByTestId } = render(<Trap open onClose={vi.fn()} />);
    const node = getByTestId("trap");
    expect(node.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(node);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <Trap open onClose={onClose}>
        {threeButtons}
      </Trap>,
    );
    fireEvent.keyDown(getByTestId("first"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores keys other than Tab and Escape", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <Trap open onClose={onClose}>
        {threeButtons}
      </Trap>,
    );
    const first = getByTestId("first");
    fireEvent.keyDown(first, { key: "a" });
    fireEvent.keyDown(first, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
    // Focus is untouched by unrelated keys.
    expect(document.activeElement).toBe(first);
  });

  it("wraps Tab from the last element back to the first and prevents default", () => {
    const { getByTestId } = render(
      <Trap open onClose={vi.fn()}>
        {threeButtons}
      </Trap>,
    );
    const first = getByTestId("first");
    const last = getByTestId("last");
    last.focus();
    // fireEvent returns false when a handler called preventDefault on a
    // cancelable event -> proves the trap intercepted the Tab.
    const notPrevented = fireEvent.keyDown(last, { key: "Tab" });
    expect(notPrevented).toBe(false);
    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab from the first element to the last and prevents default", () => {
    const { getByTestId } = render(
      <Trap open onClose={vi.fn()}>
        {threeButtons}
      </Trap>,
    );
    const first = getByTestId("first");
    const last = getByTestId("last");
    first.focus();
    const notPrevented = fireEvent.keyDown(first, {
      key: "Tab",
      shiftKey: true,
    });
    expect(notPrevented).toBe(false);
    expect(document.activeElement).toBe(last);
  });

  it("lets Tab pass through when focus is on a middle element", () => {
    const { getByTestId } = render(
      <Trap open onClose={vi.fn()}>
        {threeButtons}
      </Trap>,
    );
    const middle = getByTestId("middle");
    middle.focus();
    // Neither boundary matched -> no preventDefault, so fireEvent returns true
    // and the hook leaves focus where it is.
    const notPrevented = fireEvent.keyDown(middle, { key: "Tab" });
    expect(notPrevented).toBe(true);
    expect(document.activeElement).toBe(middle);
  });

  it("prevents default on Tab when the trap has no focusables", () => {
    const { getByTestId } = render(<Trap open onClose={vi.fn()} />);
    const node = getByTestId("trap");
    const notPrevented = fireEvent.keyDown(node, { key: "Tab" });
    expect(notPrevented).toBe(false);
  });

  it("restores focus to the previously-focused element on close", () => {
    const onClose = vi.fn();
    const { getByTestId, rerender } = render(
      <Trap open={false} onClose={onClose}>
        {threeButtons}
      </Trap>,
    );
    const outside = getByTestId("outside");
    outside.focus();
    expect(document.activeElement).toBe(outside);

    // Open: snapshots `outside` as the restore target, moves focus inside.
    rerender(
      <Trap open onClose={onClose}>
        {threeButtons}
      </Trap>,
    );
    expect(document.activeElement).toBe(getByTestId("first"));

    // Close: cleanup restores focus to the snapshotted element.
    rerender(
      <Trap open={false} onClose={onClose}>
        {threeButtons}
      </Trap>,
    );
    expect(document.activeElement).toBe(outside);
  });

  it("detaches the keydown listener on close so Escape no longer fires onClose", () => {
    const onClose = vi.fn();
    const { getByTestId, rerender } = render(
      <Trap open onClose={onClose}>
        {threeButtons}
      </Trap>,
    );
    // Listener is live while open.
    fireEvent.keyDown(getByTestId("first"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <Trap open={false} onClose={onClose}>
        {threeButtons}
      </Trap>,
    );
    onClose.mockClear();

    // After close the document listener is removed -> Escape is a no-op.
    fireEvent.keyDown(getByTestId("outside"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
