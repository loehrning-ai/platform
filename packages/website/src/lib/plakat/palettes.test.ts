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
  PLAKAT,
  PLAKAT_KEYS,
  plakatClass,
  ROUTE_PLAKAT,
  WORKSHOP_PLAKAT,
  workshopPlakat,
} from "./palettes";

const WEBSITE = join(__dirname, "..", "..", "..");
const APP_DIR = join(WEBSITE, "src", "app");
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

function pageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return entry.name === "page.tsx" ? [path] : [];
  });
}

/** Every `<TechnicalCourseFrame courseId=...>` value, resolving a same-file string constant. */
function technicalCourseIds(): { file: string; courseId: string }[] {
  return pageFiles(APP_DIR).flatMap((file) => {
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
  });

  it.each(PLAKAT_KEYS)("%s: the page scene line on paper is the palette's line", (key) => {
    expect(declarations(`:root:has([data-plakat-page="${key}"])`).get("--color-scene-line")).toBe(
      PLAKAT[key].line,
    );
  });

  it("uses only colours defined once as @theme tokens", () => {
    const tokenValues = new Set(theme.values());
    for (const key of PLAKAT_KEYS) {
      const { ground, ink, mid, mark, accentText, line, chartAccent } = PLAKAT[key];
      for (const hex of [ground, ink, mid, mark, accentText, line, chartAccent]) {
        expect(hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(tokenValues.has(hex), `${key}: ${hex} has no @theme token`).toBe(true);
      }
    }
    // Mennige stays the one red: the lemons mid is the Mennige token itself.
    expect(PLAKAT.lemons.mid).toBe(theme.get("--color-mennige"));
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
  it("maps every TechnicalCourseFrame courseId in src/app", () => {
    const frames = technicalCourseIds();
    expect(frames.length).toBeGreaterThanOrEqual(10);
    for (const { file, courseId } of frames) {
      expect(coursePlakat(courseId), `${file}: ${courseId}`).toBeDefined();
    }
  });

  it("maps every catalogue course: Grundlagenpfad Lemons 01 to 04, Technikkurse without numerals", () => {
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
    expect([count("idea"), count("bloom")]).toEqual([3, 3]);
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

  it("keeps the fixed route scenes and the home fallback switch", () => {
    expect(ROUTE_PLAKAT).toEqual({ home: "lemons", demos: "idea", blog: "idea" });
    expect(["lemons", "graphit"]).toContain(HOME_SCENE);
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

  // Lands with the deck covers and social cards (build group G5). The owner of
  // this file turns both into assertions once public/workshops is regenerated.
  it.todo("carries --cover-ground, --cover-ink and --cover-mid in every public/workshops/<slug>/lib/tokens.css");
  it.todo("renders every public/workshops/<slug>/card-preview.webp at 1200 by 630");
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
