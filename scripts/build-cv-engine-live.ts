#!/usr/bin/env bun
/**
 * Pre-renders the CV Engine live example (/open-source/tools/cv-engine/live).
 *
 * Every page the example shows is real engine output: this script runs the
 * public cv-engine CLI (`engine/build.py`) at the pinned revision, in the
 * engine's own virtual environment, once per choice of language, template,
 * density and number of extra stations. It never imports or copies engine
 * code. From each run it keeps:
 *
 * - the exit code and the overflow message the CLI printed;
 * - WeasyPrint's natural content height, measured by the engine's own
 *   probe (`render.pdf_service._content_height_overflows`);
 * - the HTML inside `<main>`, deduplicated: it depends only on language,
 *   renderer and stations (the script asserts this), while template and
 *   density are two classes the page swaps;
 * - one stylesheet, rewritten for a shadow root (`:root` and `html, body`
 *   become `:host` and `.cv-body`, `@font-face` moves to the document);
 * - Inter as Latin woff2 subsets of the engine's own TTF files;
 * - the PDF for the base states and for every state that fits again after
 *   the overflow, loaded only on tap.
 *
 * Every written file gets a sha256 row in ASSET_MANIFEST.json, and
 * packages/website/src/lib/open-source/cv-live/live-data.json records the
 * pin, the measurements and the hashes. Rerun it when the pin moves:
 *
 *   bun scripts/build-cv-engine-live.ts --engine ../cv-engine \
 *     [--python ../cv-engine/.venv/bin/python]
 *
 * The engine checkout must sit exactly at CV_LIVE_ENGINE.revision with a
 * clean tree, and its venv needs requirements.lock installed. WeasyPrint
 * needs Pango; on macOS with Homebrew the script adds /opt/homebrew/lib to
 * DYLD_FALLBACK_LIBRARY_PATH for the child processes only.
 */

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CV_LIVE_DENSITIES,
  CV_LIVE_LANGUAGES,
  CV_LIVE_TEMPLATES,
  composeCvYaml,
  cvLiveStateKey,
  type CvLiveChoice,
} from "../packages/website/src/lib/open-source/cv-live/compose";
import { CV_LIVE_ENGINE } from "../packages/website/src/lib/open-source/cv-live/pin";
import { CV_LIVE_STATIONS } from "../packages/website/src/lib/open-source/cv-live/stations";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_PREFIX = "/artifacts/tools/cv-engine/live";
const PUBLIC_DIR = path.join(ROOT, "packages/website/public", PUBLIC_PREFIX);
const DATA_FILE = path.join(
  ROOT,
  "packages/website/src/lib/open-source/cv-live/live-data.json",
);
const MANIFEST_FILE = path.join(ROOT, "ASSET_MANIFEST.json");
const FONT_FAMILY = "CV Engine Inter";
const CONCURRENCY = 3;

/**
 * WeasyPrint heights via the engine's own probe; prints JSON. `naturalPx` is
 * what the engine's overflow gate compares (the deepest box, which for the
 * sidebar is its full-height rail); `mainPx` is the bottom of `<main>`, where
 * the text ends. Both come from the same tall-sheet render the gate uses.
 */
const PROBE = `
import json, pathlib, sys
engine = pathlib.Path(sys.argv[1])
sys.path.insert(0, str(engine / "engine"))
from render import resource_policy
from render import pdf_service
from weasyprint import HTML
html = pathlib.Path(sys.argv[2]).read_text("utf-8")
base = resource_policy.repo_base_url(engine)
fetcher = resource_policy.make_url_fetcher(repo_root=engine)
doc = HTML(string=html, base_url=base, url_fetcher=fetcher).render()
page = doc.pages[0]._page_box.height
_spills, natural = pdf_service._content_height_overflows(html, base, page, url_fetcher=fetcher)
probe_html = html.replace("</style>", pdf_service._PROBE_PAGE_CSS + "</style>", 1)
tall = HTML(string=probe_html, base_url=base, url_fetcher=fetcher).render().pages[0]._page_box
def find(box):
    if getattr(box, "element_tag", None) == "main":
        return box
    for child in getattr(box, "children", None) or []:
        found = find(child)
        if found is not None:
            return found
    return None
main = find(tall)
if main is None or abs(pdf_service._deepest_content_bottom(tall) - natural) > 0.01:
    sys.exit("probe disagrees with the engine's gate")
print(json.dumps({"pages": len(doc.pages), "pagePx": page, "naturalPx": natural,
                  "mainPx": main.position_y + main.margin_height()}))
`;

function fail(message: string): never {
  console.error(`build-cv-engine-live: ${message}`);
  process.exit(1);
}

function argument(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const engineDir = path.resolve(argument("--engine") ?? fail("--engine <cv-engine checkout> is required"));
const python = path.resolve(argument("--python") ?? path.join(engineDir, ".venv/bin/python"));
if (!existsSync(path.join(engineDir, "engine/build.py"))) fail(`${engineDir} is not a cv-engine checkout`);
if (!existsSync(python)) fail(`no python at ${python}; create the engine venv first`);

const childEnv = {
  ...process.env,
  DYLD_FALLBACK_LIBRARY_PATH: [process.env.DYLD_FALLBACK_LIBRARY_PATH, "/opt/homebrew/lib"]
    .filter(Boolean)
    .join(":"),
};

function git(...args: string[]): string {
  const result = spawnSync("git", ["-C", engineDir, ...args], { encoding: "utf8" });
  if (result.status !== 0) fail(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout;
}

const head = git("rev-parse", "HEAD").trim();
if (head !== CV_LIVE_ENGINE.revision) {
  fail(`engine HEAD is ${head}, the pin is ${CV_LIVE_ENGINE.revision}`);
}
const dirty = git("status", "--porcelain", "--", "engine", "design", "content/examples", "requirements.lock").trim();
if (dirty) fail(`engine tree is not clean at the pin:\n${dirty}`);

const base = Object.fromEntries(
  CV_LIVE_LANGUAGES.map((lang) => [
    lang,
    git("show", `${CV_LIVE_ENGINE.revision}:${CV_LIVE_ENGINE.personaPaths[lang]}`),
  ]),
) as Record<(typeof CV_LIVE_LANGUAGES)[number], string>;

interface RunResult {
  readonly choice: CvLiveChoice;
  readonly key: string;
  readonly yaml: string;
  readonly exitCode: number;
  readonly stderr: string;
  readonly html: string;
  readonly pdf: Buffer | null;
  readonly pages: number;
  readonly pagePx: number;
  readonly naturalPx: number;
  readonly mainPx: number;
}

function run(command: string, args: readonly string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: engineDir, env: childEnv });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

const work = mkdtempSync(path.join(tmpdir(), "cv-live-"));

async function renderChoice(choice: CvLiveChoice): Promise<RunResult> {
  const key = cvLiveStateKey(choice);
  const yaml = composeCvYaml(base[choice.lang], choice);
  const stem = path.join(work, key);
  writeFileSync(`${stem}.yaml`, yaml);
  const build = await run(python, ["-I", "engine/build.py", "--config", `${stem}.yaml`, "--output", `${stem}.pdf`]);
  if (build.code !== 0 && build.code !== 1) fail(`${key}: build.py exited ${build.code}\n${build.stderr}`);
  const pdfExists = existsSync(`${stem}.pdf`);
  if ((build.code === 0) !== pdfExists) fail(`${key}: exit ${build.code} but PDF present=${pdfExists}`);
  // One retry: under parallel load a WeasyPrint child has been seen to die
  // without output; a second failure is real and stops the script.
  let probe = await run(python, ["-I", "-c", PROBE, engineDir, `${stem}.html`]);
  if (probe.code !== 0) probe = await run(python, ["-I", "-c", PROBE, engineDir, `${stem}.html`]);
  if (probe.code !== 0) fail(`${key}: probe exited ${probe.code}\n${probe.stderr}`);
  const measured = JSON.parse(probe.stdout.trim().split("\n").at(-1) ?? "{}");
  return {
    choice,
    key,
    yaml,
    exitCode: build.code,
    stderr: build.stderr,
    html: readFileSync(`${stem}.html`, "utf8"),
    pdf: pdfExists ? readFileSync(`${stem}.pdf`) : null,
    pages: measured.pages,
    pagePx: measured.pagePx,
    naturalPx: measured.naturalPx,
    mainPx: measured.mainPx,
  };
}

const choices: CvLiveChoice[] = [];
for (const lang of CV_LIVE_LANGUAGES)
  for (const template of CV_LIVE_TEMPLATES)
    for (const density of CV_LIVE_DENSITIES)
      for (let stations = 0; stations <= CV_LIVE_STATIONS[lang].length; stations++)
        choices.push({ lang, template, density, stations });

const results: RunResult[] = [];
{
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < choices.length) {
        const choice = choices[next++];
        results.push(await renderChoice(choice));
        process.stdout.write(`\r${results.length}/${choices.length}`);
      }
    }),
  );
  process.stdout.write("\n");
}
results.sort((a, b) => choices.indexOf(a.choice) - choices.indexOf(b.choice));

/* ---------- Split each document into stylesheet, wrapper and body ---------- */

const DOC = /^<!DOCTYPE html>\n<html lang="(\w+)">\n<head>\n<meta charset="UTF-8">\n<title>[^<]*<\/title>\n<style>([\s\S]*)<\/style>\n<\/head>\n<body class="([^"]+)">\n<main ([^>]+)>\n([\s\S]*)\n<\/main>\n<\/body>\n<\/html>$/;

function renderer(template: string): "standard" | "rail" {
  return template === "sidebar" ? "rail" : "standard";
}

/** The wrapper the page rebuilds around a body; asserted equal to the engine's. */
function expectedWrapper(choice: CvLiveChoice) {
  return {
    bodyClass: `template-${choice.template} paper-white`,
    mainAttributes: `class="page density-${choice.density}" data-template="${choice.template}" data-renderer="${renderer(choice.template)}" data-paper="white"`,
  };
}

let css: string | null = null;
const bodies = new Map<string, string>();
const stateBody = new Map<string, string>();
for (const result of results) {
  const match = DOC.exec(result.html);
  if (!match) fail(`${result.key}: the engine's HTML no longer has the expected shape`);
  const [, lang, style, bodyClass, mainAttributes, inner] = match;
  if (lang !== result.choice.lang) fail(`${result.key}: <html lang="${lang}">`);
  const wrapper = expectedWrapper(result.choice);
  if (bodyClass !== wrapper.bodyClass || mainAttributes !== wrapper.mainAttributes) {
    fail(`${result.key}: wrapper differs from the one the page rebuilds`);
  }
  if (css === null) css = style;
  else if (css !== style) fail(`${result.key}: stylesheet differs between states`);
  if (/<script|<iframe|<link|<style|<img|\son\w+\s*=|javascript:/i.test(inner)) {
    fail(`${result.key}: body contains active or external content`);
  }
  for (const [, href] of inner.matchAll(/href="([^"]*)"/g)) {
    if (!/^(mailto:|https:\/\/)/.test(href)) fail(`${result.key}: unexpected link ${href}`);
  }
  const bodyKey = `${result.choice.lang}-${renderer(result.choice.template)}-${result.choice.stations}`;
  const known = bodies.get(bodyKey);
  if (known === undefined) bodies.set(bodyKey, inner);
  else if (known !== inner) fail(`${result.key}: body differs from ${bodyKey}`);
  stateBody.set(result.key, bodyKey);
}
if (css === null) fail("no stylesheet");

/* ---------- Stylesheet for the shadow root, fonts for the document ---------- */

const FACE = /@font-face \{\s*font-family: '([^']+)';\s*src: url\('[^']*\/design\/fonts\/([\w-]+)\.ttf'\) format\('truetype'\);\s*font-weight: (\d+);\s*font-style: (\w+);\s*\}/g;
const faces = [...css.matchAll(FACE)].map(([, family, file, weight, style]) => ({ family, file, weight: Number(weight), style }));
if (faces.length === 0) fail("no @font-face rules found");
let shadowCss = css.replace(FACE, "");
if (/@font-face/.test(shadowCss)) fail("an @font-face rule was not recognised");
const rewrite = (from: string, to: string) => {
  if (!shadowCss.includes(from)) fail(`stylesheet no longer contains ${JSON.stringify(from)}`);
  shadowCss = shadowCss.split(from).join(to);
};
rewrite(":root {", ":host {");
rewrite("html, body {", ".cv-body {");
rewrite("'Inter'", `'${FONT_FAMILY}'`);
shadowCss = `/* cv-engine ${CV_LIVE_ENGINE.revision}, rewritten for a shadow root by scripts/build-cv-engine-live.ts */\n${shadowCss.replace(/\n{3,}/g, "\n\n").trim()}\n`;

const interFaces = faces.filter((face) => face.family === "Inter");
const usedCharacters = new Set<string>();
for (const inner of bodies.values()) {
  const text = inner.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  for (const character of text) usedCharacters.add(character);
}
// Generated content in the stylesheet (the bullet) and the full printable
// ASCII and Latin-1 ranges, so a later pin with new words still renders.
const unicodes = new Set<number>([0x2022]);
for (let code = 0x20; code <= 0x7e; code++) unicodes.add(code);
for (let code = 0xa0; code <= 0xff; code++) unicodes.add(code);
for (const character of usedCharacters) if (character.trim()) unicodes.add(character.codePointAt(0)!);
const unicodeArgument = [...unicodes].sort((a, b) => a - b).map((code) => code.toString(16).padStart(4, "0")).join(",");

/* ---------- Write files ---------- */

rmSync(PUBLIC_DIR, { recursive: true, force: true });
for (const dir of ["body", "fonts", "pdf"]) mkdirSync(path.join(PUBLIC_DIR, dir), { recursive: true });

interface WrittenFile {
  readonly href: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}
const written: (WrittenFile & { kind: "html" | "css" | "font" | "pdf"; detail: string })[] = [];
function writePublic(relative: string, bytes: Buffer | string, kind: "html" | "css" | "font" | "pdf", detail: string): WrittenFile {
  const absolute = path.join(PUBLIC_DIR, relative);
  writeFileSync(absolute, bytes);
  const stored = readFileSync(absolute);
  const file = { href: `${PUBLIC_PREFIX}/${relative}`, sha256: sha256(stored), sizeBytes: stored.length };
  written.push({ ...file, kind, detail });
  return file;
}

const cssFile = writePublic("cv.css", shadowCss, "css", "stylesheet");
const bodyFiles: Record<string, WrittenFile> = {};
for (const [key, inner] of bodies) bodyFiles[key] = writePublic(`body/${key}.html`, `${inner}\n`, "html", key);

const fontFiles = interFaces.map((face) => {
  const out = path.join(work, `${face.file}.woff2`);
  const subset = spawnSync(
    python,
    ["-I", "-m", "fontTools.subset", path.join(engineDir, "design/fonts", `${face.file}.ttf`), `--unicodes=${unicodeArgument}`, "--layout-features=*", "--flavor=woff2", "--no-hinting", `--output-file=${out}`],
    { encoding: "utf8", env: childEnv },
  );
  if (subset.status !== 0) fail(`subsetting ${face.file}: ${subset.stderr}`);
  const file = writePublic(`fonts/${face.file}.woff2`, readFileSync(out), "font", face.file);
  return { family: FONT_FAMILY, weight: face.weight, style: face.style, ...file };
});

// PDFs: the base state of every template, density and language, and every
// state that fits again after the page overflowed (the rescue).
function wantsPdf(result: RunResult): boolean {
  if (result.exitCode !== 0) return false;
  if (result.choice.stations === 0) return true;
  return results.some(
    (other) =>
      other.choice.lang === result.choice.lang &&
      other.choice.template === result.choice.template &&
      other.choice.stations === result.choice.stations &&
      other.exitCode === 1,
  );
}

function overflowFrom(stderr: string): { gate: "pages" | "clipped"; label: string | null } {
  const section = /First section on the overflow page: '([^']+)'/.exec(stderr);
  if (section) return { gate: "pages", label: section[1] };
  if (/clipped below the A4 edge/.test(stderr)) return { gate: "clipped", label: null };
  fail(`unrecognised overflow message: ${stderr}`);
}

const pageHeights = new Set(results.map((result) => result.pagePx.toFixed(4)));
if (pageHeights.size !== 1) fail("page height differs between states");

const states = results.map((result) => {
  const overflow = result.exitCode === 1 ? overflowFrom(result.stderr) : null;
  const pdf = wantsPdf(result) ? writePublic(`pdf/mira-kessler-${result.key}.pdf`, result.pdf!, "pdf", result.key) : null;
  return {
    key: result.key,
    ...result.choice,
    exitCode: result.exitCode,
    pages: result.pages,
    naturalPx: Math.round(result.naturalPx * 10) / 10,
    mainPx: Math.round(result.mainPx * 10) / 10,
    gate: overflow ? overflow.gate : "fits",
    overflowSection: overflow?.label ?? null,
    body: stateBody.get(result.key)!,
    yamlSha256: sha256(result.yaml),
    pdf,
  };
});

const data = {
  generatedBy: "scripts/build-cv-engine-live.ts",
  renderedWith: CV_LIVE_ENGINE.revision,
  pagePx: Math.round(results[0].pagePx * 100) / 100,
  slackPx: 2,
  base,
  css: cssFile,
  fonts: fontFiles,
  bodies: bodyFiles,
  states,
};
writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);

/* ---------- ASSET_MANIFEST.json rows ---------- */

const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"));
const repoPrefix = `packages/website/public${PUBLIC_PREFIX}/`;
const kept = manifest.assets.filter((row: { path: string }) => !row.path.startsWith(repoPrefix));
const commit = `https://github.com/loehrning-ai/cv-engine/commit/${CV_LIVE_ENGINE.revision}`;
// The stylesheet is plain text under the engine's MIT license; the manifest
// only takes binaries and the text formats the publication scanner knows.
const rows = written.filter((file) => file.kind !== "css").map((file) => {
  const repoPath = `packages/website/public${file.href}`;
  if (file.kind === "font") {
    return {
      path: repoPath,
      sizeBytes: file.sizeBytes,
      sha256: file.sha256,
      owner: "Rasmus Andersson and The Inter Project Authors",
      source: `Latin woff2 subset of design/fonts/${file.detail}.ttf at ${commit}, renamed to "${FONT_FAMILY}", by scripts/build-cv-engine-live.ts`,
      license: "OFL-1.1",
      redistribution: "Redistribution of this OFL-1.1 font is permitted with its license notice; see LICENSES/OFL-1.1.txt",
      redistributionLicenseHref: "/artifacts/../LICENSES/OFL-1.1.txt",
    };
  }
  return {
    path: repoPath,
    sizeBytes: file.sizeBytes,
    sha256: file.sha256,
    owner: "Tim Löhr",
    source: `Rendered by engine/build.py at ${commit} (pull request ${CV_LIVE_ENGINE.pullRequest}, pending upstream merge) from the invented person in content/examples plus invented stations; ${file.kind} ${file.detail}, written by scripts/build-cv-engine-live.ts`,
    license: "MIT",
    redistribution: "Permitted under the corresponding file at public/artifacts/tools/cv-engine/LICENSE.txt",
    redistributionLicenseHref: "/artifacts/tools/cv-engine/LICENSE.txt",
  };
});
const anchor = kept.findIndex((row: { path: string }) => row.path === "packages/website/public/artifacts/tools/cv-engine/screenshot.webp");
if (anchor < 0) fail("ASSET_MANIFEST.json has no cv-engine screenshot row to anchor on");
manifest.assets = [...kept.slice(0, anchor + 1), ...rows, ...kept.slice(anchor + 1)];
// The manifest is stored with non-ASCII characters escaped, like Python's
// json.dumps; keep that so the diff shows only the rows this script owns.
const asciiJson = JSON.stringify(manifest, null, 2).replace(
  /[\u0080-\uffff]/g,
  (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
);
writeFileSync(MANIFEST_FILE, `${asciiJson}\n`);

rmSync(work, { recursive: true, force: true });

const summary = states.reduce<Record<string, number>>((acc, state) => {
  acc[`exit ${state.exitCode}`] = (acc[`exit ${state.exitCode}`] ?? 0) + 1;
  return acc;
}, {});
const bytes = written.reduce((sum, file) => sum + file.sizeBytes, 0);
console.log(`${states.length} states (${JSON.stringify(summary)}), ${bodies.size} bodies, ${fontFiles.length} fonts, ${written.filter((file) => file.kind === "pdf").length} PDFs, ${(bytes / 1024).toFixed(0)} KB written`);
