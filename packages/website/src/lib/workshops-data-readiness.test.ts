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
  it("is the third workshop in both locales, with exactly three entry points: course, guide and the Claude demo", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshops(locale)[2];
      expect(workshop.slug).toBe("datenbereitschaft-fuer-ki");
      expect(workshop.number).toBe("03");
      expect(workshop.materials).toHaveLength(3);
      expect(workshop.materials.map((material) => material.href.slice("/workshops/datenbereitschaft-fuer-ki/".length))).toEqual([
        "slides.html",
        "guide.html",
        "demo.html",
      ]);
      expect(workshop.materials.every((material) => material.kind === "html" && material.language === "en")).toBe(true);
      expect(workshop.materials.some((material) => material.href.endsWith("/presenter.html"))).toBe(false);
      // The lab, worksheet ZIP and builder guide stay published but are no longer offered here.
      expect(JSON.stringify(workshop)).not.toMatch(/readiness-lab\.html|data-readiness-kit\.zip|builder\.html|Browserlabor|browser lab|Bauanleitung|Builder guide/i);
      for (const material of workshop.materials) {
        expect(existsSync(resolve(root, material.href.slice("/workshops/datenbereitschaft-fuer-ki/".length).split("#")[0])), material.href).toBe(true);
      }
    }
  });

  it("states the delivery language and tells one storyline with the unchanged numbers in both locales", () => {
    const de = getWorkshops("de")[2];
    const en = getWorkshops("en")[2];
    expect(de.accessNote).toContain("Material auf Englisch, Einführung auf Deutsch.");
    expect(en.accessNote).toContain("materials are in English, the live session is introduced in German.");
    expect(en.accessNote).toMatch(/^The course and the demo need no account or installation;/);
    expect(de.accessNote).toMatch(/^Für Kurs und Demo brauchst du kein Konto und keine Installation;/);
    for (const workshop of [de, en]) expect(workshop.accessNote).toMatch(/August 2026/);
    expect(de.duration).toBe("~90 Minuten");
    expect(en.duration).toBe("~90 minutes");
    expect(de.materials[0]?.description).toMatch(/75 Minuten Kurs und 15 Minuten Fragen/);
    expect(en.materials[0]?.description).toMatch(/75 minutes of course and 15 minutes of questions/);
    expect(en.materials.map((material) => material.label)).toEqual(["Course · 26 scenes", "Learner guide", "Interactive demo · 10 min"]);
    expect(de.materials.map((material) => material.label)).toEqual(["Kurs · 26 Szenen", "Lernbegleiter", "Interaktive Demo · 10 Min."]);
    for (const workshop of [de, en]) expect(JSON.stringify(workshop)).not.toMatch(/certified|zertifiziert/i);
    expect(en.description).toContain("Show ending MRR by month for the last complete quarter");
    expect(en.description).toContain("-19,960 / 9,775 / 42,565");
    expect(en.description).toContain("334,675 / 344,450 / 387,015");
    expect(de.description).toContain("334.675 / 344.450 / 387.015");
    for (const workshop of [de, en]) {
      const text = JSON.stringify(workshop);
      expect(text).not.toMatch(/same model|gleiche[sn]? Modell|fünf Regeln|five rules|Regeln im Labor/i);
      expect(text).toMatch(/36/);
      expect(text).toMatch(/0 (?:of|von) 3/);
      expect(text).toMatch(/9 (?:of|von) 9/);
    }
    expect(JSON.stringify(en)).toMatch(/limited pilot, not signed off/);
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
