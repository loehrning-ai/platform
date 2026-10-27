/**
 * W05 static guards: the visitor's files stay in the tab, the only browser
 * storage holds the audit date and the window, no <details> hides content,
 * the css stays inside .w05 and off the glass, and the copy fills every slot
 * of the gap template it renders but the signature.
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
      expect(text, name).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.sendBeacon|<form\b[^>]*action=/);
    }
  });

  it("keeps browser storage to the audit settings in use-own-folder.ts", () => {
    for (const { name, text } of sources) {
      if (name === "use-own-folder.ts") continue;
      expect(text, name).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    }
    const hook = readFileSync(path.join(here, "use-own-folder.ts"), "utf8");
    expect(hook).toContain("w05-audit-settings");
  });

  it("uses no <details> and scopes every css rule under .w05", () => {
    for (const { name, text } of sources) expect(text, name).not.toMatch(/<details|<summary/);
    const css = readFileSync(path.join(here, "w05.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/(^|})\s*([^{}@]+)\{/g)].map((match) => match[2].trim()).filter((sel) => !/^(from|to|\d+%)$/.test(sel));
    for (const selector of selectors) {
      for (const part of selector.split(",")) expect(part.trim(), part).toMatch(/^\.w05/);
    }
    // Glass belongs to glas.css: no filter and no gradient here (radii are the content cards' own).
    expect(css).not.toMatch(/backdrop-filter|gradient/);
  });

  it("fills every slot of the gap template it renders", async () => {
    const { COPY } = await import("@/lib/demo-cases/audit-vorbereitung-mit-ki/copy");
    const { buildModel } = await import("@/lib/demo-cases/audit-vorbereitung-mit-ki/model");
    const { renderGapRequest } = await import("@/lib/demo-cases/audit-vorbereitung-mit-ki/render");
    const model = buildModel();
    for (const locale of ["de", "en"] as const) {
      const vorlage = readFileSync(
        path.join(process.cwd(), "content/vorlagen", locale === "de" ? "luecken-anfrage.md" : "en/luecken-anfrage.md"),
        "utf8",
      );
      expect(COPY[locale].gapTemplate).toBe(vorlage);
      for (const row of model.rows.filter((entry) => entry.best.status !== "covered")) {
        const mail = renderGapRequest(row.best, model.context, COPY[locale].gapTemplate, locale);
        // Only the sender's name stays open: the person who sends it signs it.
        const open = [...mail.matchAll(/\[[A-Za-zÄÖÜäöü][^\]\n]*\]/g)].map((match) => match[0]);
        expect(open, `${locale} ${row.item.id}`).toEqual([locale === "de" ? "[Name]" : "[name]"]);
      }
    }
  });
});
