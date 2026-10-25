import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateBeats, type Beat } from "@/lib/demo-beats";
import { DEMO_TAKEHOME } from "@/lib/demo-takehome";
import { DEMO_SLUGS, getDemoBySlug } from "@/lib/demos";
import { listZipEntries } from "@/lib/zip/read";

/**
 * The folder contract every demo lane fulfils, walked over the five folders:
 *
 *   src/components/demos/<slug>/index.tsx        server: picks the locale pack, renders the client demo
 *   src/components/demos/<slug>/tile.tsx         server: the hub miniature, default export, ({locale, reducedMotion?})
 *   src/components/demos/<slug>/tile-motion.ts   the tile's tracks (MOTION), import-free apart from types
 *   src/lib/demo-cases/<slug>/copy.ts            server-only, both languages, plain data (COPY)
 *   src/app/demos/<slug>/{page,opengraph-image,error}.tsx   the route, importing only its own folder
 */
const SRC = join(__dirname, "../..");

function walk(relative: string): readonly string[] {
  const absolute = join(SRC, relative);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const path = `${relative}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const read = (file: string) => readFileSync(join(SRC, file), "utf8");
const sources = (slug: string) =>
  [...walk(`components/demos/${slug}`), ...walk(`lib/demo-cases/${slug}`)].filter(
    (file) => /\.(ts|tsx|css)$/.test(file) && !/\.test\.tsx?$/.test(file),
  );

/** Relative and @/ imports of a file that stay inside the demo's two folders. */
function localImports(file: string): readonly string[] {
  const text = read(file);
  const found: string[] = [];
  // `import type` is erased at build time and never reaches the browser.
  const runtime = text.replace(/^import\s+type\s[^;]*;/gm, "");
  for (const match of runtime.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
    const specifier = match[1] as string;
    let target: string | undefined;
    if (specifier.startsWith(".")) target = resolve(join(SRC, file, ".."), specifier).slice(SRC.length + 1);
    else if (specifier.startsWith("@/")) target = specifier.slice(2);
    if (!target) continue;
    for (const candidate of [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`, `${target}/index.tsx`]) {
      if (existsSync(join(SRC, candidate)) && /\.(ts|tsx)$/.test(candidate)) {
        found.push(candidate);
        break;
      }
    }
  }
  return found;
}

function reachable(start: readonly string[]): ReadonlySet<string> {
  const seen = new Set<string>();
  const queue = [...start];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...localImports(file));
  }
  return seen;
}

describe.each(DEMO_SLUGS)("demo folder contract: %s", (slug) => {
  const files = sources(slug);

  it("has the five required files", () => {
    for (const file of [
      `components/demos/${slug}/index.tsx`,
      `components/demos/${slug}/tile.tsx`,
      `components/demos/${slug}/tile-motion.ts`,
      `lib/demo-cases/${slug}/copy.ts`,
    ]) {
      expect(existsSync(join(SRC, file)), file).toBe(true);
    }
    for (const file of ["page.tsx", "opengraph-image.tsx", "error.tsx"]) {
      expect(existsSync(join(SRC, "app/demos", slug, file)), file).toBe(true);
    }
  });

  it("keeps index.tsx and tile.tsx on the server, and tile.tsx free of css and client hooks", () => {
    expect(read(`components/demos/${slug}/index.tsx`)).not.toMatch(/^["']use client["']/m);
    const tile = read(`components/demos/${slug}/tile.tsx`);
    expect(tile).not.toMatch(/use client|\.css["']|useState|useEffect/);
    expect(tile).toMatch(/export default function \w+\(\{[^}]*\}: TileProps\)/);
  });

  it("makes the tile motion import-free apart from types, so the generator can run it", () => {
    const motion = read(`components/demos/${slug}/tile-motion.ts`);
    const imports = [...motion.matchAll(/^import\s+(.*)$/gm)].map((match) => match[1] as string);
    for (const line of imports) expect(line, slug).toMatch(/^type\s/);
    expect(motion).toMatch(/export const MOTION/);
  });

  it("ships one language: copy.ts is server-only and no client module reaches it", () => {
    expect(read(`lib/demo-cases/${slug}/copy.ts`)).toMatch(/^import "server-only";/m);
    const clientFiles = files.filter(
      (file) => /\.tsx?$/.test(file) && /^["']use client["']/.test(read(file).trimStart()),
    );
    for (const file of reachable(clientFiles)) {
      expect(file, `client bundle of ${slug} must not import the two-language pack`).not.toBe(
        `lib/demo-cases/${slug}/copy.ts`,
      );
    }
    // index.tsx hands exactly one pack to the client demo.
    expect(read(`components/demos/${slug}/index.tsx`)).toMatch(/COPY\[locale\]/);
  });

  it("holds plain data in both languages, with the same shape and no dashes", async () => {
    const { COPY } = await import(`@/lib/demo-cases/${slug}/copy.ts`);
    const shape = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(shape)
        : value && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
          : typeof value;
    expect(JSON.parse(JSON.stringify(COPY.de))).toEqual(COPY.de);
    expect(JSON.parse(JSON.stringify(COPY.en))).toEqual(COPY.en);
    expect(shape(COPY.en)).toEqual(shape(COPY.de));
    expect(JSON.stringify(COPY)).not.toMatch(/[–—]/);
  });

  it("is deterministic, offline and never collapsible", () => {
    for (const file of files) {
      const text = read(file);
      expect(text, file).not.toContain("next/dynamic");
      expect(text, file).not.toMatch(/setInterval\(|setTimeout\([^)]*Math\.random/);
      expect(text, file).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
      expect(text, file).not.toMatch(/<details|<summary|<Accordion|<Collapsible|role=["']tablist["']/);
      expect(text, file).not.toMatch(/Date\.now\(\)|new Date\(\)|Math\.random\(/);
    }
  });

  it("is mounted by its own route and by no other demo's", () => {
    const page = read(`app/demos/${slug}/page.tsx`);
    expect(page).toContain(`@/components/demos/${slug}"`);
    for (const other of DEMO_SLUGS.filter((candidate) => candidate !== slug)) {
      expect(page).not.toContain(other === slug ? "" : `components/demos/${other}`);
    }
    expect(page).not.toMatch(/components\/demos\/hub|tile/);
  });
});

/**
 * The v3 shell contract, for every demo that opted in (`shell: "v3"` in
 * src/lib/demos.ts). Each builder flips the flag when their demo moves onto
 * the shell; the integrator removes the flag once all five run on it.
 *
 *   src/lib/demo-cases/<slug>/beats.ts   BEATS: commit, reveal, tool, apply 0-3, own, takehome
 *   src/app/demos/<slug>/page.tsx         passes BEATS to renderDemoRoute
 *   src/lib/demo-takehome.ts              an entry; every beat kitFile is in the kit zip
 *   the demo renders DemoStage and DemoLever from @/components/demos/shell
 */
const SHELL_SELECTORS = [
  "[data-demo-page",
  "[data-demo-v3",
  "[data-cover-band",
  "[data-demo-promise",
  "[data-demo-synthetic",
  "[data-demo-question",
  "[data-plakat-art-phone",
  "[data-demo-workshop-link",
  "[data-demo-bar",
  "[data-beat-rail",
  "[data-demo-stage",
  "[data-demo-lever",
  "[data-demo-restart",
  "[data-demo-next",
  "[data-demo-privacy",
  "[data-closing-band",
  "[data-takehome",
  ".demo-bar",
  ".demo-rail",
  ".demo-stage",
  ".demo-caption",
  ".demo-lever",
  ".demo-next",
  ".demo-restart",
  ".demo-privacy",
  ".demo-grid",
  ".demo-aside",
  ".demo-main",
  ".glass",
];

const V3_SLUGS = DEMO_SLUGS.filter((slug) => getDemoBySlug(slug)?.shell === "v3");

describe("v3 shell contract", () => {
  it("lists the demos that opted in (none is fine while they migrate)", () => {
    expect(V3_SLUGS.every((slug) => DEMO_SLUGS.includes(slug))).toBe(true);
  });

  it.each(V3_SLUGS.length > 0 ? V3_SLUGS : ["(none yet)"])("%s meets the v3 contract", async (slug) => {
    if (slug === "(none yet)") return;
    const typed = slug as (typeof DEMO_SLUGS)[number];
    // beats: the kinds in order, at most eight
    expect(existsSync(join(SRC, `lib/demo-cases/${slug}/beats.ts`)), "beats.ts").toBe(true);
    const beatsSource = read(`lib/demo-cases/${slug}/beats.ts`);
    expect(beatsSource, "beats.ts is plain data, not server-only").not.toMatch(/server-only/);
    const { BEATS } = (await import(`@/lib/demo-cases/${slug}/beats.ts`)) as { BEATS: readonly Beat[] };
    expect(validateBeats(BEATS)).toEqual([]);

    // the route passes the beats
    const page = read(`app/demos/${slug}/page.tsx`);
    expect(page).toMatch(/renderDemoRoute\(SLUG, Demo, BEATS\)/);
    expect(page).toContain(`@/lib/demo-cases/${slug}/beats`);

    // a take-home entry; kit chips, instructions and beat kit files exist in the zip
    const takeHome = DEMO_TAKEHOME[typed];
    expect(takeHome, "DEMO_TAKEHOME entry").toBeDefined();
    if (!takeHome) return;
    for (const locale of ["de", "en"] as const) {
      const kit = takeHome.kit[locale];
      const zip = new Uint8Array(readFileSync(join(SRC, "..", "public", kit.href)));
      const paths = new Set(listZipEntries(zip).map((entry) => entry.path));
      for (const file of [...kit.shown, kit.instructions, kit.installDoc]) {
        expect(paths.has(file), `${kit.href}: ${file}`).toBe(true);
      }
      for (const beat of BEATS) {
        if (beat.kitFile) expect(paths.has(beat.kitFile), `${kit.href}: beat ${beat.id} ${beat.kitFile}`).toBe(true);
      }
    }

    // the demo uses the shell's stage and lever and never re-implements them
    const files = sources(slug);
    const code = files.filter((file) => /\.tsx?$/.test(file)).map((file) => read(file)).join("\n");
    expect(code).toMatch(/from "@\/components\/demos\/shell"/);
    expect(code).toMatch(/<DemoStage\b/);
    expect(code).toMatch(/<DemoLever\b/);
    for (const file of files) {
      const text = read(file);
      // the page never scrolls itself: scrolling goes through the shell's revealIfOffscreen in a tap handler
      expect(text, file).not.toMatch(/scrollIntoView|scrollTo\(|scrollBy\(|window\.scroll\(/);
      // keys belong to the shell (src/lib/demo-keys.ts)
      expect(text, file).not.toMatch(/addEventListener\(\s*["']key(?:down|up)["']/);
      expect(text, file).not.toMatch(/onKeyDown=\{[^}]*\b(?:ArrowLeft|ArrowRight|Escape)\b/);
      if (file.endsWith(".css")) {
        for (const selector of SHELL_SELECTORS) expect(text, `${file} selects ${selector}`).not.toContain(selector);
        // glass only through the one shared .glass class in globals.css
        expect(text, file).not.toMatch(/backdrop-filter/);
      }
    }
    expect(existsSync(join(SRC, `components/demos/${slug}/arrive.ts`)), "arrive.ts is gone").toBe(false);
  });
});
