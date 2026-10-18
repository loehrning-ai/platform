import { chromium } from "../../../node_modules/.bun/playwright@1.61.1/node_modules/playwright/index.mjs";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
const SHOTS = process.env.W05_SHOTS || path.join(os.tmpdir(), "w05-shots");
fs.mkdirSync(SHOTS, { recursive: true });
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const browser = await chromium.launch(LAUNCH);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:8765/slides.html");
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
await page.reload(); await page.waitForTimeout(1200);
const slides = await page.evaluate(() => Array.from(document.querySelectorAll("deck-stage > section")).map((s) => parseInt(s.dataset.steps || "0", 10)));
const seen = new Map();
let idx = 0;
for (const steps of slides) {
  idx++;
  for (let st = 0; st <= steps; st++) {
    await page.waitForTimeout(1400);
    const r = await page.evaluate(() => {
      const out = window.DECK.audit().filter((x) => x.kind === "font");
      const slide = window.DECK.current();
      const clipped = [];
      slide.querySelectorAll("*").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.opacity === "0" || cs.visibility === "hidden") return;
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        if (el.children.length === 0 && el.textContent.trim() && el.closest("[data-deck-active]")) {
          const sr = slide.getBoundingClientRect();
          if (r.right > sr.right + 2 || r.bottom > sr.bottom + 2 || r.left < sr.left - 2) clipped.push(el.className + ":" + el.textContent.trim().slice(0, 30));
        }
      });
      return { fonts: out, clipped };
    });
    const key = `${idx}.${st}`;
    if (r.fonts.length || r.clipped.length) seen.set(key, r);
    await page.keyboard.press("ArrowRight");
  }
}
for (const [k, v] of seen) console.log(k, JSON.stringify(v).slice(0, 400));
console.log("errors:", errors.length ? errors : "none", "flagged states:", seen.size);
await browser.close();
