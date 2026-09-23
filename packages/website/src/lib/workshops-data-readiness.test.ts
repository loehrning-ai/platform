import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { getWorkshops } from "./workshops";

const root = resolve(process.cwd(), "public/workshops/datenbereitschaft-fuer-ki");
const read = (name: string) => readFileSync(resolve(root, name), "utf8");
const files = (directory = root): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);

describe("published Data Readiness workshop", () => {
  it("is the third workshop in both locales, with four usable entry points", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshops(locale)[2];
      expect(workshop.slug).toBe("datenbereitschaft-fuer-ki");
      expect(workshop.materials).toHaveLength(4);
      expect(workshop.materials.every((material) => material.language === "en")).toBe(true);
      expect(workshop.materials.some((material) => material.href.endsWith("/presenter.html"))).toBe(false);
    }
  });

  it("keeps the published file inventory and its content hashes exact", () => {
    const manifest = JSON.parse(read("bundle-manifest.json")) as { files: {path: string; sizeBytes: number; sha256: string}[] };
    for (const entry of manifest.files) {
      const bytes = readFileSync(resolve(root, entry.path));
      expect(bytes.length, entry.path).toBe(entry.sizeBytes);
      expect(createHash("sha256").update(bytes).digest("hex"), entry.path).toBe(entry.sha256);
    }
    const actual = files().map((file) => file.slice(root.length + 1)).sort();
    expect(actual).toEqual([...manifest.files.map((entry) => entry.path), "bundle-manifest.json"].sort());
  });

  it("resolves every local HTML and CSS dependency and omits uncleared visuals", () => {
    for (const file of files().filter((name) => /\.(html|css)$/.test(name))) {
      const content = readFileSync(file, "utf8");
      const references = [...content.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^\s)'";]+)["']?\)/g)];
      for (const match of references) {
        const reference = match[1] ?? match[2];
        if (/^(?:https?:|data:|#|\/)/.test(reference)) continue;
        expect(existsSync(resolve(dirname(file), reference.split(/[?#]/)[0])), `${file}: ${reference}`).toBe(true);
      }
    }
    expect(read("slides.html")).not.toMatch(/src=["'][^"']*(?:tim-loehr\.jpg|ask-data-(?:sources|captured-history)\.png)/);
    expect(read("slides.html")).toContain("Historical source setup, summarized");
  });

  it("always starts as replay without a network request, including loopback live URLs", async () => {
    for (const hostname of ["loehrning.ai", "localhost", "127.0.0.1"]) {
      let fetches = 0;
      const window: Record<string, unknown> = {
        FOLDLINE_REPLAY: { status: {} },
        location: { protocol: "https:", hostname, origin: `https://${hostname}`, search: "?mode=live" },
      };
      runInNewContext(read("lib/demo-adapter.js"), {
        window, document, EventTarget, CustomEvent, URLSearchParams,
        fetch: () => { fetches++; throw new Error("Network forbidden in public workshop"); },
      });
      const controller = window.FoldlineDemo as { initialize(): Promise<{ mode: string }> };
      expect((await controller.initialize()).mode).toBe("replay");
      expect(fetches).toBe(0);
    }
  });
});
