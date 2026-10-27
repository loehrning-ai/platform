// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { isKeyOwningTarget, resolveDemoKey } from "./demo-keys";

function element(tag: string, attributes: Record<string, string> = {}, inside?: string) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  if (inside) {
    const parent = document.createElement("div");
    parent.setAttribute("role", inside);
    parent.appendChild(node);
    document.body.appendChild(parent);
  }
  return node;
}

describe("resolveDemoKey", () => {
  it("binds exactly ArrowRight, ArrowLeft, r, Shift+R and Escape", () => {
    expect(resolveDemoKey({ key: "ArrowRight" })).toBe("next");
    expect(resolveDemoKey({ key: "ArrowLeft" })).toBe("prev");
    expect(resolveDemoKey({ key: "r" })).toBe("reset");
    expect(resolveDemoKey({ key: "R" })).toBe("reset");
    expect(resolveDemoKey({ key: "Escape" })).toBe("escape");
    for (const key of [" ", "Enter", "Home", "End", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "p", "P", "0", "1", "5", "9", "Backspace", "a", "z"]) {
      expect(resolveDemoKey({ key }), key).toBeNull();
    }
  });

  it("never fires with Ctrl, Meta or Alt (Cmd+R and Ctrl+R still reload), on repeat or when already handled", () => {
    expect(resolveDemoKey({ key: "r", metaKey: true })).toBeNull();
    expect(resolveDemoKey({ key: "R", ctrlKey: true })).toBeNull();
    expect(resolveDemoKey({ key: "ArrowRight", altKey: true })).toBeNull();
    expect(resolveDemoKey({ key: "ArrowRight", repeat: true })).toBeNull();
    expect(resolveDemoKey({ key: "ArrowRight", defaultPrevented: true })).toBeNull();
  });

  it("leaves keys to form controls, editable text and arrow-owning widgets", () => {
    for (const target of [
      element("input"),
      element("textarea"),
      element("select"),
      element("div", { role: "slider" }),
      element("div", { role: "radiogroup" }),
      element("button", { role: "tab" }),
      element("span", {}, "slider"),
      element("button", {}, "tablist"),
    ]) {
      expect(isKeyOwningTarget(target), target.outerHTML).toBe(true);
      expect(resolveDemoKey({ key: "r", target })).toBeNull();
      expect(resolveDemoKey({ key: "ArrowRight", target })).toBeNull();
    }
    const editable = element("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(resolveDemoKey({ key: "r", target: editable })).toBeNull();
    expect(resolveDemoKey({ key: "r", target: element("button") })).toBe("reset");
    expect(resolveDemoKey({ key: "ArrowRight", target: document.body })).toBe("next");
  });
});
