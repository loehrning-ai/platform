import { afterEach, describe, expect, it } from "vitest";
import {
  isInsideHorizontalScrollRegion,
  isInteractiveShortcutTarget,
} from "./keyboard-shortcuts";

afterEach(() => {
  document.body.replaceChildren();
});

describe("keyboard shortcut guards", () => {
  it("treats descendants of native and ARIA controls as interactive", () => {
    document.body.innerHTML = `
      <button><span id="button-child">Weiter</span></button>
      <div role="slider"><span id="slider-child">50</span></div>
      <div contenteditable="true"><span id="editable-child">Text</span></div>
    `;

    expect(
      isInteractiveShortcutTarget(document.querySelector("#button-child")),
    ).toBe(true);
    expect(
      isInteractiveShortcutTarget(document.querySelector("#slider-child")),
    ).toBe(true);
    expect(
      isInteractiveShortcutTarget(document.querySelector("#editable-child")),
    ).toBe(true);
  });

  it("leaves non-interactive reader prose eligible for shortcuts", () => {
    document.body.innerHTML = `<article id="reader" tabindex="0"><p id="prose">Absatz</p></article>`;
    const reader = document.querySelector("#reader");
    expect(
      isInteractiveShortcutTarget(document.querySelector("#prose"), reader),
    ).toBe(false);
  });

  it("treats aria-modal dialogs and their descendants as shortcut boundaries", () => {
    document.body.innerHTML = `
      <section role="dialog" aria-modal="true" id="dialog">
        <p id="dialog-content">Modal content</p>
      </section>
      <section role="alertdialog" aria-modal="true" id="alert-dialog">
        <p id="alert-content">Modal alert</p>
      </section>
    `;

    expect(
      isInteractiveShortcutTarget(document.querySelector("#dialog")),
    ).toBe(true);
    expect(
      isInteractiveShortcutTarget(document.querySelector("#dialog-content")),
    ).toBe(true);
    expect(
      isInteractiveShortcutTarget(document.querySelector("#alert-content")),
    ).toBe(true);
  });

  it("recognises descendants of horizontal overflow regions", () => {
    document.body.innerHTML = `
      <div style="overflow-x: auto"><table><tbody><tr><td id="cell">Wert</td></tr></tbody></table></div>
      <div data-horizontal-scroll><code id="code">lange Zeile</code></div>
    `;

    expect(
      isInsideHorizontalScrollRegion(document.querySelector("#cell")),
    ).toBe(true);
    expect(
      isInsideHorizontalScrollRegion(document.querySelector("#code")),
    ).toBe(true);
  });
});
