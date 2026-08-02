import type { KeyboardEvent } from "react";

export type RovingOrientation = "horizontal" | "vertical" | "both";

interface RovingFocusOptions {
  readonly currentIndex: number;
  readonly itemCount: number;
  readonly onMove: (nextIndex: number) => void;
  readonly orientation?: RovingOrientation;
}

/**
 * Implements the shared keyboard model for radio groups, tablists, and
 * listboxes. Each consumer marks its composite with `data-roving-group` and
 * its items with `data-roving-item`.
 */
export function handleRovingFocusKeyDown<T extends HTMLElement>(
  event: KeyboardEvent<T>,
  {
    currentIndex,
    itemCount,
    onMove,
    orientation = "both",
  }: RovingFocusOptions,
): boolean {
  if (itemCount <= 0) return false;

  const horizontal = orientation === "horizontal" || orientation === "both";
  const vertical = orientation === "vertical" || orientation === "both";
  let nextIndex: number | null = null;

  switch (event.key) {
    case "ArrowRight":
      if (horizontal) nextIndex = (currentIndex + 1) % itemCount;
      break;
    case "ArrowDown":
      if (vertical) nextIndex = (currentIndex + 1) % itemCount;
      break;
    case "ArrowLeft":
      if (horizontal) nextIndex = (currentIndex - 1 + itemCount) % itemCount;
      break;
    case "ArrowUp":
      if (vertical) nextIndex = (currentIndex - 1 + itemCount) % itemCount;
      break;
    case "Home":
      nextIndex = 0;
      break;
    case "End":
      nextIndex = itemCount - 1;
      break;
  }

  if (nextIndex === null) return false;

  event.preventDefault();
  onMove(nextIndex);

  const group = event.currentTarget.closest<HTMLElement>(
    "[data-roving-group]",
  );
  const items = group?.querySelectorAll<HTMLElement>("[data-roving-item]");
  items?.[nextIndex]?.focus();
  return true;
}

/** Exactly one item in a composite remains in the document Tab sequence. */
export function rovingTabIndex(
  selectedIndex: number | null | undefined,
  itemIndex: number,
): 0 | -1 {
  return (selectedIndex ?? 0) === itemIndex ? 0 : -1;
}
