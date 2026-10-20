#!/usr/bin/env node
/**
 * Render the 30 s cover reel (packages/website/src/components/book-figures/reel)
 * to MP4. The reel is one pure function of time, `window.seek(t)`; this script
 * bundles it into a self-contained page (fonts inline, no network), drives it
 * frame by frame in Chromium, pipes the screenshots into ffmpeg and writes
 * H.264 yuv420p, no audio, at 1080x1920 (9:16) and 1920x1080 (16:9).
 *
 *   node scripts/render-reel.mjs --out DIR                   both formats, 30 fps, CRF 16
 *   node scripts/render-reel.mjs --out DIR --format tall --draft
 *   node scripts/render-reel.mjs --out DIR --sheet            contact sheet, one frame per beat
 *   node scripts/render-reel.mjs --out DIR --stills 1.2,3.4   PNG stills at these seconds
 *   node scripts/render-reel.mjs --out DIR --from 5 --to 12   only these seconds (MP4 excerpt)
 *   node scripts/render-reel.mjs --out DIR --check            layout and truth gate: bounds, overlaps, type floor, fonts, numbers vs token log
 *
 * Options: --fps 30  --crf 16  --preset slow  --sub 1 (sub-frames blended per frame, optional)
 *          --draft (CRF 23, veryfast)  --format tall|wide|both  --name reel
 * The film is silent on purpose (LinkedIn plays muted); claims are burned in.
 */

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEBSITE = path.join(ROOT, "packages", "website");
const REEL_DIR = path.join(WEBSITE, "src", "components", "book-figures", "reel");
const FONT_DIR = path.join(WEBSITE, "public", "fonts");
const SIZES = { tall: { w: 540, h: 960, tag: "9x16" }, wide: { w: 960, h: 540, tag: "16x9" } };
const FACES = [
  [400, "figtree-regular-v1.woff2"],
  [500, "figtree-medium-v1.woff2"],
  [600, "figtree-semibold-v1.woff2"],
  [700, "figtree-bold-v1.woff2"],
  [800, "figtree-extrabold-v1.woff2"],
];

function parseArgs(argv) {
  const o = { format: "both", fps: 30, crf: 16, preset: "slow", sub: 1, from: 0, to: 30, name: "reel" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--out") o.out = next();
    else if (a === "--format") o.format = next();
    else if (a === "--fps") o.fps = Number(next());
    else if (a === "--crf") o.crf = Number(next());
    else if (a === "--preset") o.preset = next();
    else if (a === "--sub") o.sub = Number(next());
    else if (a === "--from") o.from = Number(next());
    else if (a === "--to") o.to = Number(next());
    else if (a === "--name") o.name = next();
    else if (a === "--draft") { o.crf = 23; o.preset = "veryfast"; }
    else if (a === "--sheet") o.sheet = true;
    else if (a === "--stills") o.stills = next().split(",").map(Number);
    else if (a === "--check") o.check = true;
    else if (a === "--help" || a === "-h") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]); process.exit(0); }
    else throw new Error(`unknown option ${a}`);
  }
  if (!o.out) throw new Error("--out DIR is required");
  if (!["tall", "wide", "both"].includes(o.format)) throw new Error("--format tall|wide|both");
  return o;
}

/** Bundle the render page and wrap it into one offline HTML file. */
function buildPage(buildDir) {
  mkdirSync(buildDir, { recursive: true });
  const js = path.join(buildDir, "reel.js");
  const res = spawnSync("bun", ["build", path.join(REEL_DIR, "render-page.ts"), "--target", "browser", "--format", "iife", "--outfile", js], { encoding: "utf8" });
  if (res.status !== 0) throw new Error(`bun build failed\n${res.stdout}\n${res.stderr}`);
  const faces = FACES.map(([weight, file]) => {
    const b64 = readFileSync(path.join(FONT_DIR, file)).toString("base64");
    return `@font-face{font-family:"Figtree";font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
  }).join("\n");
  const css = readFileSync(path.join(REEL_DIR, "reel.css"), "utf8");
  const code = readFileSync(js, "utf8").replace(/<\/script/gi, "<\\/script");
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>reel</title><style>${faces}\nhtml,body{margin:0;background:#f3f0e9}\n${css}</style></head><body><div id="stage" class="reel-stage"></div><script>${code}</script></body></html>`;
  const file = path.join(buildDir, "index.html");
  writeFileSync(file, html);
  return file;
}

function loadPlaywright() {
  const require = createRequire(path.join(WEBSITE, "package.json"));
  return require("@playwright/test");
}

function ffmpegArgs(o, size, out) {
  const sub = o.sub;
  const vf = [];
  if (sub > 1) vf.push(`tmix=frames=${sub}`, `select='eq(mod(n\\,${sub})\\,${sub - 1})'`, `setpts=N/${o.fps}/TB`);
  vf.push("scale=out_color_matrix=bt709:out_range=tv", "format=yuv420p");
  return [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(o.fps * sub), "-i", "-",
    "-vf", vf.join(","), "-r", String(o.fps), "-c:v", "libx264", "-preset", o.preset, "-crf", String(o.crf),
    "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-an", "-movflags", "+faststart", out,
  ];
}

async function openStage(browser, format, pageUrl) {
  const size = SIZES[format];
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on("pageerror", (e) => { console.error("pageerror:", e.message); process.exit(1); });
  await page.goto(`${pageUrl}?format=${format === "tall" ? "tall" : "wide"}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 });
  return { page, stage: page.locator("#stage"), size };
}

async function renderMp4(browser, pageUrl, o, format) {
  const { page, stage, size } = await openStage(browser, format, pageUrl);
  const out = path.join(o.out, `${o.name}-${size.tag}.mp4`);
  const ff = spawn("ffmpeg", ffmpegArgs(o, size, out), { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => { ff.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg exit ${c}`)))); });
  const first = Math.round(o.from * o.fps);
  const last = Math.round(o.to * o.fps);
  const t0 = Date.now();
  for (let i = first; i < last; i += 1) {
    for (let s = 0; s < o.sub; s += 1) {
      const t = i / o.fps + (s - (o.sub - 1) / 2) / (o.fps * o.sub);
      await page.evaluate((x) => window.seek(x), t);
      const png = await stage.screenshot({ type: "png" });
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    }
    if (i % 90 === 0) process.stdout.write(`  ${size.tag} ${i - first}/${last - first}\r`);
  }
  ff.stdin.end();
  await done;
  await page.context().close();
  console.log(`${out}  ${last - first} frames  ${Math.round((Date.now() - t0) / 1000)} s`);
  return out;
}

async function renderStills(browser, pageUrl, o, format, times, prefix) {
  const { page, stage, size } = await openStage(browser, format, pageUrl);
  const files = [];
  for (const t of times) {
    await page.evaluate((x) => window.seek(x), t);
    const file = path.join(o.out, `${prefix}-${size.tag}-${t.toFixed(2).padStart(5, "0")}.png`);
    await stage.screenshot({ path: file, type: "png" });
    files.push(file);
  }
  await page.context().close();
  return files;
}

function contactSheet(files, out, cols, widthPx) {
  const list = path.join(path.dirname(out), `.sheet-${path.basename(out)}.txt`);
  writeFileSync(list, files.map((f) => `file '${f}'\nduration 1`).join("\n"));
  const rows = Math.ceil(files.length / cols);
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", `scale=${widthPx}:-1,tile=${cols}x${rows}:padding=6:color=0x8a857c`, "-frames:v", "1", out], { encoding: "utf8" });
  rmSync(list, { force: true });
  if (r.status !== 0) throw new Error(`contact sheet failed: ${r.stderr}`);
}


/** Layout gate over the whole loop: bounds, overlapping boxes, type floor, face. */
async function runCheck(browser, pageUrl, o, format) {
  const { page, size } = await openStage(browser, format, pageUrl);
  const pad = format === "tall" ? 36 : 48;
  const problems = [];
  const step = 0.05;
  let frames = 0;
  let worstMs = 0;
  for (let t = 0; t < 30; t += step) {
    const r = await page.evaluate((x) => {
      const t0 = performance.now();
      window.seek(x);
      const ms = performance.now() - t0;
      const stage = document.getElementById("stage").getBoundingClientRect();
      const items = [];
      document.querySelectorAll("#stage .rt").forEach((el) => {
        const b = el.getBoundingClientRect();
        const m = /inset\(([-\d.]+)% ([-\d.]+)% ([-\d.]+)% ([-\d.]+)%\)/.exec(el.style.clipPath);
        const R = m ? Number(m[2]) : 0;
        const L = m ? Number(m[4]) : 0;
        const cs = getComputedStyle(el);
        items.push({
          k: el.dataset.k, role: el.className.replace("rt rt-", ""),
          l: b.left - stage.left + (L / 100) * b.width, r: b.right - stage.left - (R / 100) * b.width,
          t: b.top - stage.top, b: b.bottom - stage.top, fs: parseFloat(cs.fontSize), ff: cs.fontFamily,
          knock: el.style.background !== "",
        });
      });
      const logged = window.__log().map((x) => x.s).join(" ");
      const texts = [...document.querySelectorAll("#stage .rt")].map((el) => ({ k: el.dataset.k, text: el.textContent }));
      return { items, ms, logged, texts };
    }, t);
    for (const { k, text } of r.texts) {
      for (const num of text.match(/\d[\d.,]*\d|\d/g) ?? []) {
        if (num !== "1" && !r.logged.includes(num)) problems.push({ t, k, what: `number ${num} on screen is not in the token log` });
      }
    }
    frames += 1;
    worstMs = Math.max(worstMs, r.ms);
    const live = r.items.filter((i) => i.r - i.l > 1);
    for (const i of live) {
      if (!/Figtree/.test(i.ff)) problems.push({ t, k: i.k, what: `font ${i.ff}` });
      if (i.fs < 16.9) problems.push({ t, k: i.k, what: `type ${i.fs}px below the 17 px floor` });
      if (i.l < pad - (i.knock ? 7 : 0.5) && i.role !== "label") problems.push({ t, k: i.k, what: `left ${i.l.toFixed(1)} inside the ${pad}px gutter` });
      if (i.r > size.w - pad + 0.5 && !(i.role === "label" || i.knock)) problems.push({ t, k: i.k, what: `right ${i.r.toFixed(1)} beyond the gutter` });
      if (i.r > size.w - 12) problems.push({ t, k: i.k, what: `right ${i.r.toFixed(1)} near the stage edge` });
    }
    for (let a = 0; a < live.length; a += 1) {
      for (let b = a + 1; b < live.length; b += 1) {
        const p = live[a];
        const q = live[b];
        const w = Math.min(p.r, q.r) - Math.max(p.l, q.l);
        const h = Math.min(p.b, q.b) - Math.max(p.t, q.t);
        // Different lines of one item are separate boxes with the same key.
        if (p.k === q.k) continue;
        if (w > 3 && h > 6) problems.push({ t, k: `${p.k} x ${q.k}`, what: `boxes overlap ${w.toFixed(0)}x${h.toFixed(0)}` });
      }
    }
  }
  await page.context().close();
  const file = path.join(o.out, `check-${size.tag}.json`);
  writeFileSync(file, JSON.stringify({ frames, worstSeekMs: Math.round(worstMs), problems }, null, 1));
  const uniq = new Map();
  for (const p of problems) { const key = `${p.k}|${p.what.replace(/[\d.]+/g, "#")}`; if (!uniq.has(key)) uniq.set(key, p); }
  console.log(`${size.tag}: ${frames} frames, worst seek ${Math.round(worstMs)} ms, ${problems.length} problem frames, ${uniq.size} distinct`);
  for (const p of uniq.values()) console.log(`  t=${p.t.toFixed(2)} ${p.k}: ${p.what}`);
  return problems.length === 0;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  mkdirSync(o.out, { recursive: true });
  const pageFile = buildPage(path.join(o.out, ".build"));
  const pageUrl = `file://${pageFile}`;
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const formats = o.format === "both" ? ["tall", "wide"] : [o.format];
  try {
    if (o.check) {
      let ok = true;
      for (const f of formats) ok = (await runCheck(browser, pageUrl, o, f)) && ok;
      if (!ok) process.exitCode = 1;
    } else if (o.stills || o.sheet) {
      const beats = JSON.parse(readFileSync(path.join(REEL_DIR, "beats.json"), "utf8")).beats.map((b) => b.t);
      for (const f of formats) {
        const times = o.stills ?? beats;
        const files = await renderStills(browser, pageUrl, o, f, times, o.sheet ? "beat" : "still");
        if (o.sheet) {
          const tag = SIZES[f].tag;
          contactSheet(files, path.join(o.out, `contact-${tag}.png`), f === "tall" ? 8 : 5, f === "tall" ? 270 : 384);
          console.log(`contact sheet: ${path.join(o.out, `contact-${tag}.png`)} (${files.length} beats)`);
        }
      }
    } else {
      for (const f of formats) await renderMp4(browser, pageUrl, o, f);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
