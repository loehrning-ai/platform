// TEMPORARY (to be reverted): capture a main-thread trace with JS samples.
const { chromium } = require("@playwright/test");
(async () => {
  const [url, out] = process.argv.slice(2);
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await browser.startTracing(page, { path: out, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "v8.execute", "disabled-by-default-v8.cpu_profiler", "toplevel", "blink.user_timing", "loading"] });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  await browser.stopTracing();
  await browser.close();
})();
