/**
 * W05 static guards: what the visitor writes stays in the tab and is not stored at all (no browser
 * storage, no network call), no <details> hides content, the css stays inside .w05 and off the glass,
 * the client never loads the kit or the oracle (the server page hands it plain data), and the copy
 * names only slots the demo fills.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const here = path.join(process.cwd(), "src/components/demos/audit-vorbereitung-mit-ki");
const lib = path.join(process.cwd(), "src/lib/demo-cases/audit-vorbereitung-mit-ki");
const read = (dir: string) =>
  readdirSync(dir)
    .filter((name) => /\.(tsx?|css)$/.test(name) && !name.includes(".test."))
    .map((name) => ({ name, text: readFileSync(path.join(dir, name), "utf8") }));
const sources = [...read(here), ...read(lib)];

describe("W05 demo, static guards", () => {
  it("sends nothing anywhere", () => {
    for (const { name, text } of sources) {
      expect(text, name).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|<form\b[^>]*action=/);
    }
  });

  it("uses no browser storage at all", () => {
    for (const { name, text } of sources) expect(text, name).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  });

  it("keeps the kit, the oracle and the server-only copy out of the client files", () => {
    for (const { name, text } of read(here)) {
      if (!/^(demo|scene-.*|fmt|dock-caption|copy-button)\.tsx?$/.test(name)) continue;
      // Types may come from the model; values may not (they would pull the kit into the browser bundle).
      const imports = [...text.matchAll(/^import (type )?[^;]*? from "([^"]+)";$/gm)];
      for (const match of imports) {
        const [, type, from] = match;
        if (/demo-cases\/audit-vorbereitung-mit-ki\/(kit|oracle|vocab|lines|copy|model)$/.test(from as string)) {
          expect(type, `${name} imports a value from ${from}`).toBe("type ");
        }
      }
    }
  });

  it("uses no <details> and scopes every css rule under .w05", () => {
    for (const { name, text } of sources) expect(text, name).not.toMatch(/<details|<summary/);
    const css = readFileSync(path.join(here, "w05.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/(^|})\s*([^{}@]+)\{/g)].map((match) => (match[2] as string).trim()).filter((sel) => !/^(from|to|\d+%)$/.test(sel));
    for (const selector of selectors) {
      for (const part of selector.split(",")) expect(part.trim(), part).toMatch(/^\.w05/);
    }
    // Glass belongs to glas.css: no filter and no gradient here.
    expect(css).not.toMatch(/backdrop-filter|gradient/);
  });

  it("names only slots the demo fills", async () => {
    const { COPY } = await import("@/lib/demo-cases/audit-vorbereitung-mit-ki/copy");
    const known = new Set(["n", "guesses", "label", "notice", "day", "need", "days", "date", "calendar", "working", "people", "month", "listed", "titles", "id", "status", "guess", "paper", "file", "periodEnd", "paid", "weekday", "total", "covered", "weak", "gap", "over", "under", "files", "visit", "papers"]);
    const walk = (value: unknown, trail: string): void => {
      if (typeof value === "string") {
        for (const slot of value.matchAll(/\{(\w+)\}/g)) expect(known.has(slot[1] as string), `${trail}: {${slot[1]}}`).toBe(true);
      } else if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, `${trail}[${index}]`));
      else if (value && typeof value === "object") for (const [key, entry] of Object.entries(value)) walk(entry, `${trail}.${key}`);
    };
    walk(COPY.de, "de");
    walk(COPY.en, "en");
  });
});
