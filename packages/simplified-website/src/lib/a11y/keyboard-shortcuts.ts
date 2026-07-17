const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='link']",
  "[role='listbox']",
  "[role='menuitem']",
  "[role='option']",
  "[role='radio']",
  "[role='slider']",
  "[role='spinbutton']",
  "[role='switch']",
  "[role='tab']",
  "[role='textbox']",
  "[tabindex]:not([tabindex='-1'])",
  "[data-keyboard-shortcuts='ignore']",
].join(",");

function targetElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

/** True when a shortcut originated in, or below, an interactive control. */
export function isInteractiveShortcutTarget(
  target: EventTarget | null,
  boundary?: Element | null,
): boolean {
  let element = targetElement(target);
  while (element && element !== boundary) {
    if (element.matches(INTERACTIVE_SELECTOR)) return true;
    element = element.parentElement;
  }
  return false;
}

/**
 * True when horizontal arrow keys belong to a scrollable region rather than
 * page-level navigation. Overflow intent is enough: a responsive table or
 * code block may only overflow at narrower viewports.
 */
export function isInsideHorizontalScrollRegion(
  target: EventTarget | null,
): boolean {
  let element = targetElement(target);
  while (element && element !== document.documentElement) {
    if (element.hasAttribute("data-horizontal-scroll")) return true;
    const style = window.getComputedStyle(element);
    if (style.overflowX === "auto" || style.overflowX === "scroll") {
      return true;
    }
    element = element.parentElement;
  }
  return false;
}
