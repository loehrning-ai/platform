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
  it("is the third workshop in both locales, with five usable entry points", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshops(locale)[2];
      expect(workshop.slug).toBe("datenbereitschaft-fuer-ki");
      expect(workshop.materials).toHaveLength(5);
      expect(workshop.materials.map((material) => material.href.slice("/workshops/datenbereitschaft-fuer-ki/".length))).toEqual([
        "guide.html",
        "slides.html",
        "data-readiness-kit/readiness-lab.html",
        "data-readiness-kit.zip",
        "builder.html",
      ]);
      expect(workshop.materials.every((material) => material.language === "en")).toBe(true);
      expect(workshop.materials.some((material) => material.href.endsWith("/presenter.html"))).toBe(false);
    }
  });

  it("states the same delivery language and labels the builder guide as an optional follow-up in both locales", () => {
    const de = getWorkshops("de")[2];
    const en = getWorkshops("en")[2];
    expect(de.accessNote).toContain("Material auf Englisch, Einführung auf Deutsch.");
    expect(en.accessNote).toContain("Materials are in English; the live session is introduced in German.");
    const builderDe = de.materials.find((material) => material.href.endsWith("/builder.html"));
    const builderEn = en.materials.find((material) => material.href.endsWith("/builder.html"));
    expect(builderEn?.label).toBe("Builder guide: semantic layer, warehouse and Claude setup");
    expect(builderDe?.label).toMatch(/^Bauanleitung: .*\(Englisch\)$/);
    expect(builderEn?.description).toMatch(/Optional follow-up for data teams, separate from the 75-minute beginner course/);
    expect(builderDe?.description).toMatch(/Optionale Vertiefung für Datenteams, getrennt vom 75-minütigen Einsteigerkurs/);
    // One vocabulary for the lab across surfaces: five choices, not five rules.
    for (const workshop of [de, en]) expect(JSON.stringify(workshop)).not.toMatch(/fünf Regeln|five rules|Regeln im Labor/);
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
    expect(read("slides.html")).not.toMatch(/src=["'][^"']*ask-data-(?:sources|captured-history)\.png/);
    expect(read("slides.html")).toContain("Historical source setup, summarized");
  });

  it("keeps the established host portrait on slide two without broadening asset rights", () => {
    const slides = read("slides.html");
    const scenes = [...slides.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<\/section>/g)];
    expect(scenes[1]?.[1]).toBe("host");
    expect(scenes[1]?.[0]).toContain('src="./assets/tim-loehr.jpg"');
    for (const text of ["Experience", "Education", "Meta", "Red Bull", "Apple", "Amazon", "City University of Hong Kong", "TH Nuremberg", "timloehr.me"]) {
      expect(scenes[1]?.[0]).toContain(text);
    }
    expect(slides).not.toContain("Workshop host symbol");
    const portrait = readFileSync(resolve(root, "assets/tim-loehr.jpg"));
    expect(portrait.equals(readFileSync(resolve(root, "../geschaeftsberichte-mit-ki-lesen/assets/tim-loehr.jpg")))).toBe(true);
    expect(createHash("sha256").update(portrait).digest("hex")).toBe("3df97f11e0ccc2cc6ada1216eeec12c80725764857b011bd3f9ce79e792401c4");
    const assets = JSON.parse(readFileSync(resolve(process.cwd(), "../../ASSET_MANIFEST.json"), "utf8")).assets as { path: string; license: string; redistribution: string }[];
    const existing = assets.find((asset) => asset.path.endsWith("/geschaeftsberichte-mit-ki-lesen/assets/tim-loehr.jpg"));
    const restored = assets.find((asset) => asset.path.endsWith("/datenbereitschaft-fuer-ki/assets/tim-loehr.jpg"));
    expect(restored?.license).toBe(existing?.license);
    expect(restored?.redistribution).toBe(existing?.redistribution);
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
