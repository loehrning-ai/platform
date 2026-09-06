import { afterEach, describe, expect, it, vi } from "vitest";
import { focusMissionTarget } from "./focus-mission-target";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function rectangle(top: number, height: number): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    bottom: top + height,
    left: 0,
    right: 390,
    width: 390,
    height,
    toJSON: () => ({}),
  };
}

function targetAt(top: number) {
  const target = document.createElement("div");
  target.tabIndex = -1;
  target.scrollIntoView = vi.fn();
  vi.spyOn(target, "getBoundingClientRect").mockReturnValue(
    rectangle(top, 200),
  );
  const focus = vi.spyOn(target, "focus");
  document.body.append(target);
  return { target, focus };
}

describe("focusMissionTarget", () => {
  it("focuses without native auto-scroll and centers in one instant step", () => {
    const { target, focus } = targetAt(250);
    const scrollBy = vi
      .spyOn(window, "scrollBy")
      .mockImplementation(() => undefined);
    focusMissionTarget(target);
    expect(target).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(target.scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "instant",
    });
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("keeps the start of a long result below the actual occupied toolbar", () => {
    const toolbar = document.createElement("div");
    toolbar.setAttribute("data-lesson-shell-mobile-toolbar", "");
    vi.spyOn(toolbar, "getBoundingClientRect").mockReturnValue(
      rectangle(48, 48),
    );
    document.body.append(toolbar);
    const { target } = targetAt(50);
    const scrollBy = vi
      .spyOn(window, "scrollBy")
      .mockImplementation(() => undefined);
    focusMissionTarget(target);
    expect(scrollBy).toHaveBeenCalledWith({ top: -54, behavior: "instant" });
  });

  it("does nothing for a destination that no longer exists", () => {
    const scrollBy = vi
      .spyOn(window, "scrollBy")
      .mockImplementation(() => undefined);
    focusMissionTarget(null);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
