// Screenshot every slide at every build step (1920x1080).
//   node shoot.mjs <url> [--only=1,5,12] [--settle=1500] [--first=3200]
// W05_SHOTS sets the output folder (default: <tmp>/w05-shots). PW_CHROMIUM points at a browser binary if needed.
import { chromium } from "../../../node_modules/.bun/playwright@1.61.1/node_modules/playwright/index.mjs";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--")) || "http://localhost:8771/slides.html";
const opt = (name, fallback) => (args.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1] || fallback;
const only = opt("only", "") ? new Set(opt("only", "").split(",").map(Number)) : null;
const settle = Number(opt("settle", "1500"));
const first = Number(opt("first", "3400"));
const demo = args.includes("--demo-votes");
const reduced = args.includes("--reduced");
const out = process.env.W05_SHOTS || path.join(os.tmpdir(), "w05-shots");
fs.mkdirSync(out, { recursive: true });
const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};

const browser = await chromium.launch(launch);
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: reduced ? "reduce" : "no-preference" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
await page.reload();
await page.waitForTimeout(1500);
const slides = await page.evaluate(() => Array.from(document.querySelectorAll("deck-stage > section")).map((s) => ({ n: s.dataset.n, steps: parseInt(s.dataset.steps || "0", 10) })));
const vote = () => page.evaluate(() => {
  const slide = document.querySelector("deck-stage").querySelector("[data-deck-active]");
  const live = [...slide.querySelectorAll("[data-tally]")].filter((b) => !b.closest(".step:not(.is-in)") && b.getClientRects().length);
  live.forEach((b, i) => { for (let k = 0; k < ((i * 7 + 2) % 4) + 1; k += 1) b.click(); });
});
if (demo) {
  // vote on every slide once first so later slides (slide 12 reads slide 2) have numbers
  for (let idx = 0; idx < slides.length; idx += 1) {
    await page.evaluate((i) => document.querySelector("deck-stage").goTo(i), idx);
    for (let step = 0; step <= slides[idx].steps; step += 1) { await page.waitForTimeout(120); await vote(); if (step < slides[idx].steps) await page.keyboard.press("ArrowRight"); }
  }
  await page.evaluate(() => document.querySelector("deck-stage").goTo(0));
  await page.waitForTimeout(500);
}
for (let idx = 0; idx < slides.length; idx += 1) {
  if (only && !only.has(idx + 1)) continue;
  await page.evaluate((i) => document.querySelector("deck-stage").goTo(i), idx);
  for (let step = 0; step <= slides[idx].steps; step += 1) {
    await page.waitForTimeout(step === 0 ? first : settle);
    await page.screenshot({ path: `${out}/${String(idx + 1).padStart(2, "0")}-s${String(step).padStart(2, "0")}.png` });
    if (step < slides[idx].steps) await page.keyboard.press("ArrowRight");
  }
}
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no page errors", "->", out);
await browser.close();
