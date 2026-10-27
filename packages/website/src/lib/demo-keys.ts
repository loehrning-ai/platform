/**
 * The demo key contract, the same words as the decks (scripts/workshops/
 * deck-keys.js): ArrowRight next, ArrowLeft previous, r or Shift+R back to the
 * start, Escape closes an open detail card. Nothing else is bound: digits,
 * Space, Enter, Home, End, P and swipes belong to focused controls or to the
 * page. Pure, so the guards are unit-tested without a browser.
 */

export type DemoKeyAction = "next" | "prev" | "reset" | "escape";

/** The part of a KeyboardEvent the resolver reads. */
export interface DemoKeyEventLike {
  readonly key: string;
  readonly metaKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
  readonly repeat?: boolean;
  readonly defaultPrevented?: boolean;
  readonly target?: unknown;
}

/** Roles that own the arrow keys themselves. */
const ARROW_OWNING_ROLES = new Set(["slider", "radiogroup", "radio", "tablist", "tab", "listbox", "option", "spinbutton", "textbox", "combobox", "menu", "menuitem", "grid"]);

interface ElementLike {
  readonly tagName?: string;
  readonly isContentEditable?: boolean;
  getAttribute?(name: string): string | null;
  closest?(selector: string): unknown;
}

/** True when the key belongs to the focused element: a form control, editable text or an arrow-owning widget. */
export function isKeyOwningTarget(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const element = target as ElementLike;
  const tag = (element.tagName ?? "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (element.isContentEditable) return true;
  const role = element.getAttribute?.("role") ?? "";
  if (ARROW_OWNING_ROLES.has(role)) return true;
  // An element inside a widget (a thumb inside a slider group) counts too.
  const owner = element.closest?.(
    'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="slider"], [role="radiogroup"], [role="tablist"], [role="listbox"], [role="spinbutton"], [role="textbox"], [role="combobox"], [role="grid"]',
  );
  return Boolean(owner);
}

/** The action for one keydown, or null when the shell must leave the key alone. */
export function resolveDemoKey(event: DemoKeyEventLike): DemoKeyAction | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  if (event.repeat || event.defaultPrevented) return null;
  if (isKeyOwningTarget(event.target)) return null;
  switch (event.key) {
    case "ArrowRight":
      return "next";
    case "ArrowLeft":
      return "prev";
    case "r":
    case "R":
      return "reset";
    case "Escape":
      return "escape";
    default:
      return null;
  }
}
