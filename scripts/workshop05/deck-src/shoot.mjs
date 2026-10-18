import { chromium } from "../../../node_modules/.bun/playwright@1.61.1/node_modules/playwright/index.mjs";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
const SHOTS = process.env.W05_SHOTS || path.join(os.tmpdir(), "w05-shots");
fs.mkdirSync(SHOTS, { recursive: true });
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const url = process.argv[2];
const only = process.argv[3] ? new Set(process.argv[3].split(",").map(Number)) : null;
const out = SHOTS;
const browser = await chromium.launch(LAUNCH);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
await page.reload();
await page.waitForTimeout(1500);
const slides = await page.evaluate(() => Array.from(document.querySelectorAll("deck-stage > section")).map((s) => ({ n: s.dataset.n, steps: parseInt(s.dataset.steps || "0", 10) })));
let idx = 0;
for (const s of slides) {
  idx += 1;
  for (let step = 0; step <= s.steps; step++) {
    if (!only || only.has(idx)) {
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `${out}/${String(idx).padStart(2, "0")}-s${step}.png` });
    }
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
  }
}
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no page errors");
await browser.close();
