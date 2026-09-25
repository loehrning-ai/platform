import { createRequire } from 'node:module';
import fs from 'node:fs';
const ROOT = new URL('../../../../', import.meta.url).pathname;
const require = createRequire(ROOT + 'packages/website/package.json');
const { chromium } = require('@playwright/test');
const axePath = (() => {
  try { return require.resolve('axe-core/axe.min.js'); } catch {
    const bun = ROOT + 'node_modules/.bun/';
    const dir = fs.readdirSync(bun).find(d => d.startsWith('axe-core@'));
    return `${bun}${dir}/node_modules/axe-core/axe.min.js`;
  }
})();
const axeSource = fs.readFileSync(axePath, 'utf8');
const HERE = new URL('.', import.meta.url).pathname;
const URL_ = 'file://' + HERE + 'preview/builder.html';
const SHOTS = HERE + 'shots/';
const mode = process.argv[2] || 'all';

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const report = { console: [], requests: [], drift: null, overflow: {}, axe: {} };
async function open(width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) report.console.push(`[${width}] ${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => report.console.push(`[${width}] pageerror: ${e.message}`));
  page.on('request', r => { const u = r.url(); if (!u.startsWith('file://') && !u.startsWith('data:')) report.requests.push(u); });
  await page.goto(URL_);
  await page.waitForTimeout(400);
  return { ctx, page };
}
async function axe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 4).map(n => n.target.join(' ')) }));
  });
  report.axe[label] = res;
}
async function overflow(page, label) {
  report.overflow[label] = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.width && r.right > w + 1 && !e.closest('pre, .parts, .sr-only, .sprite') ) bad.push(`${e.tagName.toLowerCase()}.${e.className && e.className.baseVal === undefined ? e.className : ''} right=${Math.round(r.right)}`);
    });
    return { scrollW: document.documentElement.scrollWidth, clientW: w, bad: bad.slice(0, 12) };
  });
}
async function shotEl(page, sel, name) {
  const h = await page.$(sel);
  await h.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.getElementById('strip').style.visibility='hidden'); await page.waitForTimeout(950);
  await h.screenshot({ path: SHOTS + name + '.png' }); await page.evaluate(() => document.getElementById('strip').style.visibility='');
}

// ------------------------------------------------ desktop
{
  const { ctx, page } = await open(1440, 900);
  report.drift = await page.evaluate(() => window.__numberDrift);
  if (mode === 'all' || mode === 'full') await page.screenshot({ path: SHOTS + 'desktop-full.png', fullPage: true });
  await page.screenshot({ path: SHOTS + 'desktop-top.png' });
  await axe(page, 'desktop-initial');
  await overflow(page, 'desktop');
  // M1
  await page.click('#tub-next'); await page.click('#tub-next'); await page.click('#tub-next'); await page.click('#tub-next');
  await page.check('#tub-recorded');
  await shotEl(page, '#m1', 'm1-recorded');
  await page.uncheck('#tub-recorded'); await page.check('#tub-empty');
  report.quiz = {};
  for (const v of ['32,380.00', '32 380 EUR', '€32.380', '1,066,140', '-17,595']) {
    await page.fill('#tub-answer', v); await page.click('#tub-quiz button[type=submit]');
    report.quiz[v] = (await page.textContent('#tub-verdict')).slice(0, 40);
  }
  await page.fill('#tub-answer', '32380'); await page.click('#tub-quiz button[type=submit]');
  await shotEl(page, '#m1', 'm1-empty-quiz');
  // M2
  await page.click('[data-card="ending"]'); await page.click('[data-tray-btn="additive"]');
  await page.click('[data-card="netnew"]'); await page.click('[data-tray-btn="additive"]');
  await page.click('[data-card="churn"]'); await page.click('[data-tray-btn="non"]');
  await page.fill('#pool-range', '6000'); await page.dispatchEvent('#pool-range', 'input');
  await shotEl(page, '#m2', 'm2');
  // M3
  await page.click('[data-sem="with"]'); await page.click('#m3-readers .btn:nth-child(4)');
  await shotEl(page, '#m3', 'm3');
  // M4
  await page.click('#m4-trace'); await page.waitForTimeout(1500);
  await page.click('#m4-traps .btn:nth-child(3)');
  await page.check('#m4-direct');
  await shotEl(page, '#m4', 'm4');
  // M5
  await page.click('#m5-cols .colbtn:nth-child(2)'); await page.click('#m5-fix');
  await shotEl(page, '#m5', 'm5-fixed');
  await page.click('[data-m5mode="quiz"]'); await page.click('#m5-cols .colbtn:nth-child(4)');
  await shotEl(page, '#m5', 'm5-quiz');
  // M6
  await page.fill('#grain-range', '1'); await page.dispatchEvent('#grain-range', 'input');
  await page.waitForTimeout(900);
  await page.hover('[data-rule="ratio"]');
  await page.check('#ddl-break');
  await page.click('#tradeoff-tabs .btn:nth-child(2)');
  await shotEl(page, '#m6', 'm6');
  // M7
  await page.check('input[name="m7req"][value="emails"]'); await page.check('#m7-ignore'); await page.click('#m7-send');
  await shotEl(page, '#m7', 'm7-emails-ignored');
  await page.uncheck('#m7-ignore');
  await page.check('input[name="m7req"][value="temp"]'); await page.check('#m7-temp'); await page.click('#m7-send');
  await shotEl(page, '#m7', 'm7-temp');
  // M8
  report.m8 = {};
  for (const i of [1, 2, 3]) {
    await page.click(`#m8-tabs .btn:nth-child(${i})`);
    report.m8[i] = await page.$$eval('#m8-tree .file', bs => bs.map(b => b.textContent));
    if (i === 1) await shotEl(page, '#m8', 'm8-project');
  }
  await page.click('#m8-tree .file >> nth=0'); await page.click('#m8-cred');
  await shotEl(page, '#m8', 'm8');
  // M9
  await page.fill('#age-range', '60'); await page.dispatchEvent('#age-range', 'input');
  await shotEl(page, '#m9', 'm9-60h');
  await page.check('#age-invent');
  await shotEl(page, '#m9', 'm9-invent');
  // M10
  report.m10runs = await page.$$eval('#m10-runs tbody tr', rs => rs.map(r => r.innerText.replace(/\s+/g, ' ')));
  await page.click('#m10-chips .btn:nth-child(1)');
  await shotEl(page, '#m10', 'm10-chip');
  await page.click('#m10-version');
  await shotEl(page, '#m10', 'm10-invalid');
  // M11
  await page.click('#m11-tabs .btn:nth-child(5)');
  await page.click('#m11-yours');
  await shotEl(page, '#m11', 'm11');
  // M12
  await page.click('#m12-example');
  await shotEl(page, '#m12', 'm12');
  // M13
  await page.click('#m13-filters .btn:nth-child(7)'); await page.fill('#m13-q', 'TEMP');
  await page.click('#m13-list li:not([hidden]) summary >> nth=0');
  await shotEl(page, '#m13', 'm13');
  await axe(page, 'desktop-after');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: SHOTS + 'print.pdf', format: 'A4' }).catch(e => report.console.push('pdf: ' + e.message));
  await ctx.close();
}
// ------------------------------------------------ phone
{
  const { ctx, page } = await open(375, 812);
  if (mode === 'all' || mode === 'full') await page.screenshot({ path: SHOTS + 'phone-full.png', fullPage: true });
  await page.screenshot({ path: SHOTS + 'phone-top.png' });
  await overflow(page, 'phone');
  await page.click('#m7-send');
  await shotEl(page, '#m7', 'phone-m7');
  await shotEl(page, '#m1', 'phone-m1');
  await shotEl(page, '#m10', 'phone-m10');
  await axe(page, 'phone');
  await ctx.close();
}
// ------------------------------------------------ reduced motion
{
  const { ctx, page } = await open(1024, 800, { reduce: true });
  await page.click('#m4-trace');
  await page.click('#m7-send');
  await page.waitForTimeout(100);
  report.reduced = await page.evaluate(() => ({ m4: document.querySelectorAll('#m4-ledger li').length, m7: document.querySelector('#m7-result').textContent.slice(0, 80) }));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(HERE + 'report.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 6000));
