// Mid-flight screenshots of the most animated moments, taken at timestamps after the trigger.
//   node motion-shoot.mjs <url> [s1,s3,s4,s5,s6,s7,s9,s12]
// W05_SHOTS sets the output folder. Timing is real time (a screenshot costs about 80 ms), so names carry the target time.
import { chromium } from "../../../node_modules/.bun/playwright@1.61.1/node_modules/playwright/index.mjs";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2] || "http://localhost:8771/slides.html";
const which = (process.argv[3] || "s1,s3,s4,s5,s6,s7,s9,s12").split(",");
const out = path.join(process.env.W05_SHOTS || path.join(os.tmpdir(), "w05-shots"), "motion");
fs.mkdirSync(out, { recursive: true });
const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
await page.reload();
await page.waitForTimeout(1500);
const go = (i) => page.evaluate((n) => document.querySelector("deck-stage").goTo(n), i);
const press = (k) => page.keyboard.press(k);
const wait = (ms) => page.waitForTimeout(ms);
// take shots at the given offsets (ms) from now
async function shots(name, offsets) {
  const t0 = Date.now();
  for (const ms of offsets) {
    const left = ms - (Date.now() - t0);
    if (left > 0) await wait(left);
    await page.screenshot({ path: `${out}/${name}-${String(ms).padStart(5, "0")}ms.png` });
  }
}
const presets = {
  // cover: kinetic type, then the gate loop (green, amber, red)
  async s1() { await go(1); await wait(300); await go(0); await shots("s1", [250, 600, 1000, 1700, 2800, 4300, 5600, 7100, 8700, 9500]); },
  // reality: rings fill and the numbers count up
  async s3() { await go(1); await wait(300); await go(2); await shots("s3", [250, 600, 1000, 1600]); },
  // send one prompt: the cursor path, the press, the dot leaving
  async s4() { await go(3); await shots("s4", [1000, 1800, 2700, 3600, 4000, 4500]); },
  // two rulebooks: plan toggle, labels cross-morph, eye opens, audit chip drops in
  async s5() { await go(4); await wait(2200); await press("ArrowRight"); await shots("s5-team", [90, 220, 420, 900]); await press("ArrowRight"); await shots("s5-ent", [90, 260, 520, 1100]); },
  // where it lives: packet leaves the window, files wave and fly, then the globe
  async s6() { await go(5); await wait(1500); await press("ArrowRight"); await shots("s6-a", [250, 600, 1300]); await press("ArrowRight"); await shots("s6-b", [300, 700, 1100, 1600, 2300]); await press("ArrowRight"); await shots("s6-c", [300, 900, 1700, 2800]); },
  // lights: the card drops in, a drag to a lamp, the flip
  async s7() { await go(6); await wait(1500); await press("ArrowRight"); await shots("s7-drop", [90, 200, 420]);
    await page.mouse.move(600, 600); await page.mouse.down(); await page.mouse.move(900, 560, { steps: 8 }); await page.mouse.move(1280, 450, { steps: 10 });
    await shots("s7-drag", [30, 250]); await page.mouse.up(); await shots("s7-drop2", [120, 330, 700]);
    await press("ArrowRight"); await shots("s7-flip", [90, 200, 330, 500, 1100]); },
  // AI Act: boxes rise, timeline draws, a use card flies to its box
  async s9() { await go(8); await wait(1500); await press("ArrowRight"); await shots("s9-a", [200, 500, 1000]); await press("ArrowRight"); await press("ArrowRight"); await shots("s9-b", [250, 700, 1300]);
    await press("ArrowRight"); await wait(900); await press("ArrowRight"); await shots("s9-c", [60, 140, 220, 330, 450, 650, 1000]); await press("ArrowRight"); await shots("s9-d", [100, 250, 400, 600, 900]); },
  // end vote: stamps thud in, then the page assembles itself
  async s12() { await go(10); await wait(300); await go(11); await wait(1800); await press("ArrowRight"); await shots("s12-stamp", [70, 150, 300, 700]); await press("ArrowRight"); await press("ArrowRight"); await wait(900);
    await press("ArrowRight"); await shots("s12-page", [300, 800, 1400, 2000, 2900]); await press("ArrowRight"); await shots("s12-end", [150, 400, 900]); },
};
for (const w of which) { if (presets[w]) { await presets[w](); console.log("done", w); } }
await browser.close();
