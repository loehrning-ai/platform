import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "../../..");
const dirs = ["components/demos/ki-im-unternehmen-sicher-nutzen", "lib/demo-cases/ki-im-unternehmen-sicher-nutzen"];
const files = dirs.flatMap((dir) =>
  readdirSync(join(SRC, dir))
    .filter((name) => /\.(ts|tsx|css)$/.test(name) && !/\.test\.tsx?$/.test(name))
    .map((name) => ({ name: `${dir}/${name}`, text: readFileSync(join(SRC, dir, name), "utf8") })),
);

describe("W05 stays on the device and never collapses", () => {
  it("has no network primitive, no storage, no cookie, no clipboard read", () => {
    for (const { name, text } of files) {
      expect(text, name).not.toMatch(
        /\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie|history\.(?:push|replace)State|location\.(?:hash|search)\s*=/,
      );
    }
  });

  it("reads the clipboard only from the paste button, on the visitor's tap, and only into the text field", () => {
    const readers = files.filter(({ text }) => /readText|clipboard\.read\b/.test(text)).map(({ name }) => name);
    expect(readers).toEqual(["components/demos/ki-im-unternehmen-sicher-nutzen/own-text.tsx"]);
    const own = files.find(({ name }) => name.endsWith("own-text.tsx"))?.text ?? "";
    expect(own).not.toMatch(/useEffect|setTimeout|addEventListener/);
    expect(own).toMatch(/onClick=\{\(\) => \{[\s\S]*readText/);
  });

  it("has no details, accordion, expanded state or tabs", () => {
    for (const { name, text } of files) {
      expect(text, name).not.toMatch(/<details|<summary|aria-expanded|role=["']tab|<Accordion/);
    }
  });

  it("has no em or en dash and no gradient or box shadow in source", () => {
    for (const { name, text } of files) {
      expect(text, name).not.toMatch(/[–—]/);
      if (name.endsWith(".css")) expect(text.replace(/\/\*[\s\S]*?\*\//g, ""), name).not.toMatch(/gradient|box-shadow|text-shadow|filter:/);
    }
  });

  it("scopes every css rule under .w05 or a .w05- class", () => {
    const css = files.find((f) => f.name.endsWith("schleuse.css"))!.text.replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/(?:^|\})\s*([^{}@]+)\{/g)].map((m) => (m[1] as string).trim()).filter((s) => s && !/^(?:from|to|\d+%)$/.test(s));
    for (const selector of selectors) {
      const flat = selector.replace(/:where\(([^()]*)\)/g, (_, inner: string) => (inner.includes(".w05") ? ".w05" : ""));
      // The one exception: the route-scoped rules that tune the shell around this demo.
      for (const part of flat.split(",")) expect(part.trim(), part).toMatch(/\.w05|^\[data-demo-page="ki-im-unternehmen-sicher-nutzen"\]/);
    }
  });
});
