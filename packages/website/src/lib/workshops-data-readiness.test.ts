import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { getWorkshops } from "./workshops";

const root = resolve(process.cwd(), "public/workshops/datenbereitschaft-fuer-ki");
const read = (name: string) => readFileSync(resolve(root, name), "utf8");
const files = (directory = root): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);

describe("published Data Readiness workshop", () => {
  it("is the third workshop in both locales and lists every learner-facing file, grouped by phase", () => {
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshops(locale)[2];
      expect(workshop.slug).toBe("datenbereitschaft-fuer-ki");
      expect(workshop.number).toBe("03");
      const relative = workshop.materials.map((material) => material.href.slice("/workshops/datenbereitschaft-fuer-ki/".length));
      expect(relative).toEqual([
        "slides.html",
        "presenter.html",
        "demo.html",
        "data-readiness-kit.zip",
        "guide.html",
        "data-readiness-kit/readiness-lab.html",
        "builder.html",
      ]);
      expect(workshop.materials.map(({ role, phase }) => `${role}/${phase}`)).toEqual([
        "deck/during",
        "presenter/during",
        "demo/during",
        "kit/during",
        "guide/after",
        "lab/after",
        "builder/after",
      ]);
      expect(workshop.materials.filter((material) => material.primary).map((material) => material.role)).toEqual(["deck"]);
      // Presenter view, demo, lab and builder guide are extras; the outcomes do not depend on them.
      expect(workshop.materials.filter((material) => material.optional).map((material) => material.role)).toEqual(["presenter", "demo", "lab", "builder"]);
      expect(workshop.materials.every((material) => material.language === "en")).toBe(true);
      for (const material of workshop.materials) {
        expect(existsSync(resolve(root, material.href.slice("/workshops/datenbereitschaft-fuer-ki/".length).split("#")[0])), material.href).toBe(true);
      }
      // Every HTML page at the bundle root and the browser lab is a learner-facing material.
      const pages = readdirSync(root).filter((name) => name.endsWith(".html"));
      for (const page of pages) expect(relative, page).toContain(page);
    }
  });

  it("states the delivery language and tells one storyline with the unchanged numbers in both locales", () => {
    const de = getWorkshops("de")[2];
    const en = getWorkshops("en")[2];
    expect(de.accessNote).toContain("Material auf Englisch, Einführung auf Deutsch.");
    expect(en.accessNote).toContain("materials are in English, the live session is introduced in German.");
    expect(en.accessNote).toMatch(/^The deck, learner guide and demo need only a browser;/);
    expect(de.accessNote).toMatch(/^Für Deck, Lernbegleiter und Demo brauchst du nur einen Browser;/);
    for (const workshop of [de, en]) expect(workshop.accessNote).toMatch(/August 2026/);
    expect(de.duration).toBe("~90 Minuten");
    expect(en.duration).toBe("~90 minutes");
    expect(de.materials[0]?.description).toMatch(/75 Minuten Programm und 15 Minuten Fragen/);
    expect(en.materials[0]?.description).toMatch(/75 minutes of content and 15 minutes of questions/);
    expect(en.materials.map((material) => material.label)).toEqual([
      "Deck · 26 scenes",
      "Presenter view",
      "Interactive demo · 10 min",
      "Readiness kit · .zip",
      "Learner guide",
      "Browser lab · 12 min",
      "Builder guide",
    ]);
    expect(de.materials.map((material) => material.label)).toEqual([
      "Deck · 26 Szenen",
      "Moderationsansicht",
      "Interaktive Demo · 10 Min.",
      "Readiness-Kit · .zip",
      "Lernbegleiter",
      "Browserlabor · 12 Min.",
      "Builder-Leitfaden",
    ]);
    expect(de.materials.find((material) => material.kind === "zip")?.sizeLabel).toBe("1,1 MB");
    expect(en.materials.find((material) => material.kind === "zip")?.sizeLabel).toBe("1.1 MB");
    // The size label stays true to the published archive (1,144,739 bytes).
    expect(statSync(resolve(root, "data-readiness-kit.zip")).size).toBeGreaterThan(1_050_000);
    expect(statSync(resolve(root, "data-readiness-kit.zip")).size).toBeLessThan(1_150_000);
    for (const workshop of [de, en]) expect(JSON.stringify(workshop)).not.toMatch(/certified|zertifiziert/i);
    // Workshop 03 calls itself a workshop, never a "course" (an SQL course is something it leaves out).
    expect(JSON.stringify(de).replace("Ein SQL-Kurs", "")).not.toMatch(/Kurs/);
    expect(JSON.stringify(en).replace("An SQL course", "")).not.toMatch(/\bcourses?\b/i);
    expect(en.question).toBe("Show ending MRR by month for the last complete quarter.");
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
      expect(workshop.provenance.liveRunAt).toBe("2026-09-25");
      expect(workshop.provenance.aiOutputsRecordedAt).toBe("2026-08");
    }
    expect(JSON.stringify(en)).toMatch(/limited pilot, not signed off/);
  });

  it("takes its agenda from the deck's acts: 75 minutes of main path plus 15 minutes of questions", () => {
    const slides = read("slides.html");
    const seconds = new Map<string, number>();
    for (const [tag] of slides.matchAll(/<section\b[^>]*>/g)) {
      if (!/data-kind="main"/.test(tag)) continue;
      const act = /data-act="(\d+)"/.exec(tag)?.[1];
      const value = Number(/data-seconds="(\d+)"/.exec(tag)?.[1] ?? 0);
      if (act !== undefined) seconds.set(act, (seconds.get(act) ?? 0) + value);
    }
    expect([...seconds.keys()]).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
    const deckMinutes = [...seconds.values()].reduce((sum, value) => sum + value, 0) / 60;
    expect(deckMinutes).toBe(75);
    for (const locale of ["de", "en"] as const) {
      const workshop = getWorkshops(locale)[2];
      expect(workshop.agendaSource).toBe("deck");
      const acts = workshop.agenda.filter((item) => item.mode !== "live");
      expect(acts).toHaveLength(seconds.size);
      for (const [index, item] of acts.entries()) {
        // Whole minutes, never more than one minute away from the deck's own timing.
        expect(Math.abs(item.minutes - (seconds.get(String(index)) ?? 0) / 60), item.label).toBeLessThanOrEqual(1);
      }
      expect(acts.reduce((sum, item) => sum + item.minutes, 0)).toBe(deckMinutes);
      expect(workshop.minutesLive).toBe(deckMinutes + 15);
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
