// Deck audit: walks every slide at every build step and checks the rules the deck lives by.
//   node audit.mjs [url]   (default http://localhost:8771/slides.html; serve the workshop folder first)
// Checks per visible state: no text under 24px (HTML, SVG and pseudo content), no block over 25 words (prompt cards excepted),
// no text clipped by the slide edge or an overflow:hidden ancestor, no external request, no page error.
import { chromium } from "../../../node_modules/.bun/playwright@1.61.1/node_modules/playwright/index.mjs";

const url = process.argv[2] || "http://localhost:8771/slides.html";
const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
const external = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()} ${r.failure() && r.failure().errorText}`));
page.on("request", (r) => { const u = r.url(); if (!/^(http:\/\/(localhost|127\.0\.0\.1)|data:|blob:)/.test(u)) external.push(u); });
await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
await page.reload();
await page.waitForTimeout(1500);

const slides = await page.evaluate(() => Array.from(document.querySelectorAll("deck-stage > section")).map((s) => ({ n: s.dataset.n, steps: parseInt(s.dataset.steps || "0", 10) })));

const check = () => page.evaluate(() => {
  const slide = document.querySelector("deck-stage > section[data-deck-active]");
  const sr = slide.getBoundingClientRect();
  const stage = slide.offsetWidth ? sr.width / slide.offsetWidth : 1;
  const out = [];
  const visible = (el) => {
    for (let e = el; e && e !== slide.parentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
    }
    return true;
  };
  const words = (t) => (t.match(/\S+/g) || []).length;
  const clipOf = (el, r) => {
    for (let a = el.parentElement; a && a !== slide; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && !a.classList.contains("w") && !a.classList.contains("amb")) {
        const ar = a.getBoundingClientRect();
        if (r.right > ar.right + 3 || r.bottom > ar.bottom + 3 || r.left < ar.left - 3 || r.top < ar.top - 3) return a.className || a.tagName;
      }
    }
    return "";
  };
  slide.querySelectorAll("*").forEach((el) => {
    const own = Array.from(el.childNodes).filter((c) => c.nodeType === 3 && c.nodeValue.trim());
    const isSvgText = el.tagName.toLowerCase() === "text" || el.tagName.toLowerCase() === "tspan";
    if (own.length && visible(el)) {
      const cs = getComputedStyle(el);
      let px = parseFloat(cs.fontSize);
      if (isSvgText && el.getScreenCTM) px *= el.getScreenCTM().a / stage;
      const r = el.getBoundingClientRect();
      const label = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || el.tagName;
      const txt = el.textContent.trim().slice(0, 36);
      if (px < 23.95) out.push({ kind: "font", px: Math.round(px * 10) / 10, label, txt });
      if (r.width && !el.closest("[data-decor]") && (r.right > sr.right + 2 || r.bottom > sr.bottom + 2 || r.left < sr.left - 2 || r.top < sr.top - 2)) out.push({ kind: "off-slide", label, txt });
      const clipper = r.width ? clipOf(el, r) : "";
      if (clipper) out.push({ kind: "clipped", label, txt, by: String(clipper) });
      if (!el.closest(".pc-body") && words(el.textContent) > 25) out.push({ kind: "words", n: words(el.textContent), label, txt });
    }
    for (const pseudo of ["::before", "::after"]) {
      const cs = getComputedStyle(el, pseudo);
      if (cs.content && cs.content !== "none" && cs.content !== "normal" && cs.content !== '""' && visible(el) && parseFloat(cs.fontSize) < 23.95) {
        out.push({ kind: "font-pseudo", px: parseFloat(cs.fontSize), label: el.className || el.tagName, pseudo, content: cs.content.slice(0, 24) });
      }
    }
  });
  return out;
});

const problems = [];
let states = 0;
for (let idx = 0; idx < slides.length; idx += 1) {
  await page.evaluate((i) => document.querySelector("deck-stage").goTo(i), idx);
  for (let step = 0; step <= slides[idx].steps; step += 1) {
    await page.waitForTimeout(step === 0 ? 3300 : 1250);
    const found = await check();
    states += 1;
    // dedupe within a state
    const seen = new Set();
    for (const f of found) { const k = JSON.stringify(f); if (!seen.has(k)) { seen.add(k); problems.push({ slide: slides[idx].n, step, ...f }); } }
    if (step < slides[idx].steps) await page.keyboard.press("ArrowRight");
  }
}
// structure: every .step has a step number inside its slide's range
const structure = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll("deck-stage > section").forEach((s) => {
    const max = parseInt(s.dataset.steps || "0", 10);
    s.querySelectorAll(".step").forEach((el) => {
      const from = parseInt(el.dataset.step || "1", 10);
      if (from > max) bad.push(`${s.dataset.n}: .step data-step=${from} above data-steps=${max}`);
    });
  });
  return bad;
});
for (const [i, p] of problems.entries()) if (i < 80) console.log(JSON.stringify(p));
if (problems.length > 80) console.log(`... ${problems.length - 80} more`);
structure.forEach((b) => console.log("structure:", b));
console.log("page errors:", errors.length ? [...new Set(errors)] : "none");
console.log("external requests:", external.length ? [...new Set(external)] : "none");
console.log(`states checked: ${states}, problems: ${problems.length + structure.length + errors.length + external.length}`);
await browser.close();
process.exit(problems.length + structure.length + errors.length + external.length ? 1 : 0);
