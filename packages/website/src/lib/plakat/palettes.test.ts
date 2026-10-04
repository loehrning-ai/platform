import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseGroupFor } from "@/lib/courses/tracks";
import { getWorkshops } from "@/lib/workshops";
import {
  COURSE_PLAKAT,
  coursePlakat,
  HOME_SCENE,
  hubPlakat,
  isPlakatKey,
  MOTIF_IDS,
  PAPER,
  PLAKAT,
  PLAKAT_KEYS,
  plakatClass,
  ROUTE_PLAKAT,
  UNSCENED_COURSE_IDS,
  WORKSHOP_PLAKAT,
  workshopPlakat,
} from "./palettes";

const WEBSITE = join(__dirname, "..", "..", "..");
const SRC_DIR = join(WEBSITE, "src");
const APP_DIR = join(SRC_DIR, "app");
const css = postcss.parse(readFileSync(join(APP_DIR, "globals.css"), "utf8"));

function declarations(selector: string): Map<string, string> {
  const found = new Map<string, string>();
  css.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((declaration) => {
      found.set(declaration.prop, declaration.value.trim().toLowerCase());
    });
  });
  return found;
}

function themeTokens(): Map<string, string> {
  const found = new Map<string, string>();
  css.walkAtRules("theme", (rule) => {
    rule.walkDecls((declaration) => {
      found.set(declaration.prop, declaration.value.trim().toLowerCase());
    });
  });
  return found;
}

/** Every non-test .tsx under src: pages and the components that render a frame for a route. */
function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") && !/\.test\.tsx$/.test(entry.name) ? [path] : [];
  });
}

/** Every `<TechnicalCourseFrame courseId=...>` value, resolving a same-file string constant. */
function technicalCourseIds(): { file: string; courseId: string }[] {
  return sourceFiles(SRC_DIR).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    const frames = [...source.matchAll(/<TechnicalCourseFrame\b[^>]*?\bcourseId=(?:"([^"]+)"|\{([A-Za-z_$][\w$]*)\})/gs)];
    return frames.map((match) => {
      if (match[1]) return { file: relative(WEBSITE, file), courseId: match[1] };
      const constant = new RegExp(`const\\s+${match[2]}\\s*=\\s*"([^"]+)"`).exec(source);
      if (!constant) throw new Error(`${relative(WEBSITE, file)}: cannot resolve courseId={${match[2]}}`);
      return { file: relative(WEBSITE, file), courseId: constant[1] };
    });
  });
}

describe("palettes.ts matches the CSS scopes", () => {
  const theme = themeTokens();

  it.each(PLAKAT_KEYS)("%s: the .plakat scope carries the same hex values", (key) => {
    const palette = PLAKAT[key];
    const scope = declarations(`.plakat-${key}`);
    expect(scope.get("--color-background")).toBe(palette.ground);
    expect(scope.get("--color-scene-ground")).toBe(palette.ground);
    expect(scope.get("--color-foreground")).toBe(palette.ink);
    expect(scope.get("--color-scene-ink")).toBe(palette.ink);
    expect(scope.get("--color-brand-orange")).toBe(palette.ink);
    expect(scope.get("--color-scene-mid")).toBe(palette.mid);
    expect(scope.get("--color-scene-mark")).toBe(palette.mark);
    expect(scope.get("--color-scene-accent-text")).toBe(palette.accentText);
    expect(scope.get("--color-scene-line")).toBe(palette.ink);
    expect(scope.get("--color-scene-button")).toBe(palette.button);
    expect(scope.get("--color-scene-button-text")).toBe(palette.buttonText);
  });

  it.each(PLAKAT_KEYS)("%s: the filled scene button is never a near-black fill", (key) => {
    const { button, buttonText } = PLAKAT[key];
    // Luminance above #333 (0.033): Aubergine (0.023) reads as a black button.
    const channel = (hex: string, offset: number) => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (hex: string) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
    expect(luminance(button), `${key} button ${button}`).toBeGreaterThan(0.033);
    const [light, dark] = [luminance(button), luminance(buttonText)].sort((a, b) => b - a);
    expect((light + 0.05) / (dark + 0.05), `${key} button label`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(PLAKAT_KEYS)("%s: the page scene line on paper is the palette's line", (key) => {
    expect(declarations(`:root:has([data-plakat-page="${key}"])`).get("--color-scene-line")).toBe(
      PLAKAT[key].line,
    );
  });

  it("uses only colours defined once as @theme tokens", () => {
    const tokenValues = new Set(theme.values());
    for (const key of PLAKAT_KEYS) {
      const { ground, ink, mid, mark, accentText, button, buttonText, line, chartAccent } = PLAKAT[key];
      for (const hex of [ground, ink, mid, mark, accentText, button, buttonText, line, chartAccent]) {
        expect(hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(tokenValues.has(hex), `${key}: ${hex} has no @theme token`).toBe(true);
      }
    }
    // Mennige stays the one red: the lemons mid is the Mennige token itself.
    expect(PLAKAT.lemons.mid).toBe(theme.get("--color-mennige"));
  });

  it("keeps PAPER equal to the paper and ink tokens", () => {
    expect(PAPER).toEqual({
      kalkweiss: theme.get("--color-background"),
      bogen: theme.get("--color-paper"),
      druckschwarz: theme.get("--color-foreground"),
      schiefer: theme.get("--color-muted-foreground"),
      mennige: theme.get("--color-mennige"),
    });
  });

  it("keeps three distinct colours per scene and four distinct grounds", () => {
    for (const key of PLAKAT_KEYS) {
      const { ground, ink, mid } = PLAKAT[key];
      expect(new Set([ground, ink, mid]).size, key).toBe(3);
    }
    expect(new Set(PLAKAT_KEYS.map((key) => PLAKAT[key].ground)).size).toBe(4);
  });

  it("sets the numerals as the posters do: Himbeere for IDEA, a light 04 for autumn", () => {
    expect(PLAKAT.idea.numRole).toBe("mid");
    expect(PLAKAT.idea.cornerDots).toBe(true);
    expect(PLAKAT.autumn.numWeight).toBe(400);
    for (const key of ["lemons", "bloom", "autumn"] as const) {
      expect(PLAKAT[key].numRole).toBe("ink");
      expect(PLAKAT[key].cornerDots).toBe(false);
    }
  });

  it("exposes the scope class and key guard", () => {
    expect(plakatClass("autumn")).toBe("plakat-autumn");
    expect(PLAKAT_KEYS.every(isPlakatKey)).toBe(true);
    expect(isPlakatKey("graphit")).toBe(false);
    expect(isPlakatKey("toString")).toBe(false);
  });
});

describe("workshop palettes (locked, decision D3)", () => {
  it.each(["de", "en"] as const)("gives every %s workshop a palette and motif", (locale) => {
    for (const workshop of getWorkshops(locale)) {
      expect(workshopPlakat(workshop.slug), workshop.slug).toBeDefined();
    }
  });

  it("maps four workshops to four distinct palettes in the series order", () => {
    const byNumber = [...getWorkshops("de")]
      .sort((a, b) => a.number.localeCompare(b.number))
      .map((workshop) => [workshop.number, workshopPlakat(workshop.slug)?.plakat]);
    expect(byNumber).toEqual([
      ["01", "lemons"],
      ["02", "idea"],
      ["03", "bloom"],
      ["04", "autumn"],
    ]);
    expect(Object.keys(WORKSHOP_PLAKAT).sort()).toEqual(getWorkshops("de").map((w) => w.slug).sort());
    const motifs = Object.values(WORKSHOP_PLAKAT).map((entry) => entry.motif);
    expect(new Set(motifs).size).toBe(motifs.length);
  });

  it("gives the hub band the newest workshop's palette", () => {
    expect(hubPlakat(getWorkshops("de"))).toBe("autumn");
    expect(hubPlakat(getWorkshops("en"))).toBe("autumn");
    expect(
      hubPlakat([
        { slug: "ki-prognosen-einschaetzen", number: "01" },
        { slug: "datenbereitschaft-fuer-ki", number: "03" },
      ]),
    ).toBe("bloom");
    // An unmapped or empty list still yields a scene.
    expect(hubPlakat([{ slug: "unbekannt", number: "09" }])).toBe(ROUTE_PLAKAT.home);
    expect(hubPlakat([])).toBe(ROUTE_PLAKAT.home);
  });
});

describe("course palettes (grouped by track)", () => {
  it("maps every TechnicalCourseFrame courseId in src, or lists it as paper on purpose", () => {
    const frames = technicalCourseIds();
    expect(frames.length).toBeGreaterThanOrEqual(8);
    const unscened: readonly string[] = UNSCENED_COURSE_IDS;
    for (const { file, courseId } of frames) {
      if (unscened.includes(courseId)) {
        expect(coursePlakat(courseId), `${file}: ${courseId} is listed as paper`).toBeUndefined();
        continue;
      }
      expect(coursePlakat(courseId), `${file}: ${courseId}`).toBeDefined();
    }
    // The paper list names only ids a frame really uses, so it cannot hide a typo.
    const used = new Set(frames.map((frame) => frame.courseId));
    for (const courseId of UNSCENED_COURSE_IDS) expect(used.has(courseId), courseId).toBe(true);
  });

  it("maps every catalogue course: Grundlagenpfad Lemons 01 to 04, visual learning without numerals", () => {
    for (const course of COURSE_CATALOG) {
      const entry = coursePlakat(course.slug);
      expect(entry, course.slug).toBeDefined();
      if (courseGroupFor(course.slug) === "spine") {
        expect(entry?.plakat, course.slug).toBe("lemons");
        expect(entry?.numeral, course.slug).toBe(String(course.step).padStart(2, "0"));
      } else {
        expect(["idea", "bloom"], course.slug).toContain(entry?.plakat);
        expect(entry?.numeral, course.slug).toBeNull();
      }
    }
    const technical = COURSE_CATALOG.filter((course) => courseGroupFor(course.slug) !== "spine");
    const count = (plakat: string) => technical.filter((course) => coursePlakat(course.slug)?.plakat === plakat).length;
    expect([count("idea"), count("bloom")]).toEqual([1, 3]);
  });

  it("uses a sequence numeral once per value, only in the Grundlagenpfad", () => {
    const numerals = Object.values(COURSE_PLAKAT)
      .map((entry) => entry.numeral)
      .filter((numeral) => numeral !== null);
    expect(numerals).toEqual(["01", "02", "03", "04"]);
  });

  it("uses only known motifs and none of the retired UI-icon motifs", () => {
    const used = [...Object.values(WORKSHOP_PLAKAT), ...Object.values(COURSE_PLAKAT)].map((entry) => entry.motif);
    for (const motif of used) expect(MOTIF_IDS).toContain(motif);
    for (const retired of ["lines", "branch", "gauge", "bars"]) {
      expect(MOTIF_IDS as readonly string[]).not.toContain(retired);
    }
  });

  it("keeps the fixed route scenes and a home switch with no graphit ground", () => {
    expect(ROUTE_PLAKAT).toEqual({ home: "lemons", demos: "idea", blog: "idea" });
    expect(["lemons", "paper"]).toContain(HOME_SCENE);
    expect(HOME_SCENE).not.toBe("graphit");
  });
});

describe("static workshop materials use the same palette", () => {
  const COVER_TOKENS = ["--cover-ground", "--cover-ink", "--cover-mid"] as const;
  const tokensFile = (slug: string) => join(WEBSITE, "public", "workshops", slug, "lib", "tokens.css");

  function coverTokens(slug: string): Map<string, string> {
    const found = new Map<string, string>();
    if (!existsSync(tokensFile(slug))) return found;
    postcss.parse(readFileSync(tokensFile(slug), "utf8")).walkDecls((declaration) => {
      if (declaration.prop.startsWith("--cover-")) found.set(declaration.prop, declaration.value.trim().toLowerCase());
    });
    return found;
  }

  it("keeps every --cover-* value in lib/tokens.css equal to palettes.ts", () => {
    for (const [slug, { plakat }] of Object.entries(WORKSHOP_PLAKAT)) {
      const tokens = coverTokens(slug);
      const expected = { "--cover-ground": PLAKAT[plakat].ground, "--cover-ink": PLAKAT[plakat].ink, "--cover-mid": PLAKAT[plakat].mid };
      for (const name of COVER_TOKENS) {
        if (tokens.has(name)) expect(tokens.get(name), `${slug} ${name}`).toBe(expected[name]);
      }
    }
  });

  it("carries the cover tokens in every workshop once one carries them", () => {
    const counts = Object.keys(WORKSHOP_PLAKAT).map((slug) => {
      const tokens = coverTokens(slug);
      return COVER_TOKENS.filter((name) => tokens.has(name)).length;
    });
    const anyLanded = counts.some((count) => count > 0);
    for (const count of counts) expect(count).toBe(anyLanded ? COVER_TOKENS.length : 0);
  });

  it("carries --cover-ground, --cover-ink and --cover-mid in every public/workshops/<slug>/lib/tokens.css", () => {
    for (const slug of Object.keys(WORKSHOP_PLAKAT)) {
      const tokens = coverTokens(slug);
      for (const name of COVER_TOKENS) expect(tokens.has(name), `${slug} ${name}`).toBe(true);
    }
  });

  // Reads the canvas size from the RIFF header (VP8X, VP8L or lossy VP8).
  function webpSize(bytes: Buffer): { width: number; height: number } {
    expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
    expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    if (chunk === "VP8L") {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    expect(chunk).toBe("VP8 ");
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }

  it("renders every public/workshops/<slug>/card-preview.webp at 1200 by 630", () => {
    for (const slug of Object.keys(WORKSHOP_PLAKAT)) {
      const card = readFileSync(join(WEBSITE, "public", "workshops", slug, "card-preview.webp"));
      expect(webpSize(card), slug).toEqual({ width: 1200, height: 630 });
    }
  });

  it("keeps the generated poster materials and social cards in step with their builders", () => {
    // Both --check modes exit 1 (and execFileSync throws) on a stale file.
    for (const builder of ["build-static.mjs", "build-cards.mjs"]) {
      execFileSync(process.execPath, [join(WEBSITE, "scripts", "plakat", builder), "--check"], {
        cwd: WEBSITE,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    }
  });
});

describe("docs/plakat-pairings.md", () => {
  it("is exactly what scripts/plakat/build-pairings.mjs writes, with every floor met", () => {
    const script = join(WEBSITE, "scripts", "plakat", "build-pairings.mjs");
    // --check exits 1 (and execFileSync throws) when the file is stale or a
    // required pairing misses its floor.
    const out = execFileSync(process.execPath, [script, "--check"], {
      cwd: WEBSITE,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(out).toContain("(up to date)");
  });
});
