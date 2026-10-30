import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { chapters } from "./fixtures/book";
import { exposeAllAuditedContent } from "./fixtures/a11y-visibility";
import { expectContained, HYDRATED, inNewPage, openApp, test } from "./fixtures/smoke";
import { trackScriptRequests } from "./fixtures/script-readiness";

/** Twenty capability cases, not a sample of whatever specs happen to be quick. */
test.use({ contextOptions: { reducedMotion: "reduce" } });
test.setTimeout(45_000);
const assetManifest = JSON.parse(readFileSync(path.resolve(process.cwd(), "../../ASSET_MANIFEST.json"), "utf8")) as {
  assets: Array<{ path: string; sizeBytes: number; sha256: string }>;
};
const courses = [
  { capability: "workshop-w04", slug: "esg-berichte-mit-ki", scene: "weingut", company: "Crvena Zemja" },
  { capability: "workshop-w05", slug: "audit-vorbereitung-mit-ki", scene: "company", company: "Vardar Works" },
] as const;

for (const locale of ["de", "en"] as const) {
  const prefix = locale === "de" ? "" : "/en";
  const tag = (capability: string) => `@smoke-${capability}-${locale}`;

  test(`${locale}: navigation and locale preserve URL state`, { tag: tag("navigation") }, async ({ page }) => {
    const scripts = trackScriptRequests(page);
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await openApp(page, `${prefix}/kurse?source=smoke#main-content`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      // The root marker can precede the catalogue island. Exercise its real
      // URL-state handler before replacing the document through the locale link.
      const goal = page.locator('[data-learning-goal="judge"]');
      await goal.click();
      await expect(goal).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(new RegExp(`${prefix}/kurse\\?source=smoke&goal=judge#main-content$`));
      const other = locale === "de" ? "en" : "de";
      const destination = `${other === "en" ? "/en" : ""}/kurse?source=smoke&goal=judge#main-content`;
      const destinationUrl = new RegExp(`${destination.replace("?", "\\?")}$`);
      const switcher = page.locator('[data-language-switch]:visible').first().locator(`a[hreflang="${other}"]`);
      await expect(switcher).toHaveAttribute("href", destination);
      await scripts.waitForReady();
      await Promise.all([
        page.waitForURL(destinationUrl, { waitUntil: "load" }),
        switcher.click(),
      ]);
      await page.locator(HYDRATED).waitFor({ state: "attached" });
      await expect(page).toHaveURL(destinationUrl);
      await expect(page.locator("html")).toHaveAttribute("lang", other);
      await expect(page.locator('[data-learning-goal="judge"]')).toHaveAttribute("aria-pressed", "true");
      await expectContained(page);
    } finally {
      scripts.dispose();
    }
  });

  test(`${locale}: a public learning interaction records local progress`, { tag: tag("learning") }, async ({ page }) => {
    await openApp(page, `${prefix}/kurse/open-source/ai-native-operator/mindset/1`);
    const reflection = page.getByRole("textbox", { name: locale === "de" ? "Reflexion" : "Reflect", exact: true });
    const local = page.getByRole("button", { name: locale === "de" ? "Lokal weiterlernen" : "Continue locally", exact: true });
    await expect.poll(async () => await reflection.isEditable() || await local.isVisible()).toBe(true);
    if (await local.isVisible()) await local.click();
    await expect(reflection).toBeEditable();
    await reflection.fill("Synthetic smoke exercise: compare a draft with its source.");
    await expect(reflection.locator('xpath=ancestor::*[@data-widget-frame][1]')).toHaveAttribute("data-done", "1");
    await expect.poll(() => page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem("loehrning-progress-v2") ?? "{}");
      return progress.checkpoints?.["mindset/1::exercise"] === true;
    })).toBe(true);
  });

  for (const course of courses) {
    test(`${locale}: ${course.capability} entry, kit, deck and recorded demo`, { tag: tag(course.capability) }, async ({ context }) => {
      let deck = "";
      let demo = "";
      await inNewPage(context, async (page) => {
        await openApp(page, `${prefix}/workshops/${course.slug}`);
        const stage = page.locator("[data-workshop-stage]");
        deck = (await stage.locator('a[href$="slides.html"]').getAttribute("href"))!;
        demo = (await stage.locator('a[href*="/demos/"]').getAttribute("href"))!;
        expect(deck).toContain(`/workshops/${course.slug}/`);
        expect(demo).toContain(`${prefix}/demos/${course.slug}`);
        await expect(page.locator("[data-cover-band]")).toContainText("Tim");
      });
      await inNewPage(context, async (page) => {
        await openApp(page, `${prefix}/workshops/${course.slug}/kit`);
        await expect(page.locator("main")).toContainText("Codex");
        if (course.capability === "workshop-w04") {
          await expect(page.locator("[data-kit-setup-step]")).toHaveCount(4);
          await expect(page.locator("[data-kit-setup]")).toContainText("Set project instructions");
          await expect(page.locator("[data-kit-setup]")).toContainText("Add files or photos");
        } else {
        const tabs = page.locator("[data-kit-tab]");
        await expect(tabs).not.toHaveCount(0);
        for (let index = 0; index < await tabs.count(); index++) {
          await tabs.nth(index).click();
          await expect(page.locator(`[data-kit-panel="${index + 1}"]`)).toBeVisible();
        }
        }
        const link = page.locator('[data-kit-download] a[href$=".zip"]');
        const href = (await link.getAttribute("href"))!;
        const expected = assetManifest.assets.find((asset) => asset.path === `packages/website/public${href}`);
        expect(expected, href).toBeDefined();
        const pending = page.waitForEvent("download");
        await link.click();
        const download = await pending;
        const bytes = readFileSync((await download.path())!);
        expect(bytes.subarray(0, 2).toString("ascii")).toBe("PK");
        expect(bytes.length).toBe(expected!.sizeBytes);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(expected!.sha256);
      });
      await inNewPage(context, async (page) => {
        await page.goto(deck, { waitUntil: "domcontentloaded" });
        await expect(page.locator("#cover")).toHaveAttribute("data-deck-active", "");
        await page.keyboard.press("ArrowRight");
        await expect(page.locator(`#${course.scene}`)).toHaveAttribute("data-deck-active", "");
        const pending = page.waitForEvent("popup");
        await page.keyboard.press("p");
        const presenter = await pending;
        await expect(presenter.locator("#pv-conn")).toHaveAttribute("data-state", "live");
        await presenter.close();
      });
      await inNewPage(context, async (page) => {
        await openApp(page, demo);
        await expect(page.locator("[data-demo-intro-body]")).toContainText(course.company);
        await page.locator("[data-demo-start]").click();
        if (course.capability === "workshop-w04") {
          const send = page.locator("[data-w4a-send]");
          await expect(send).toBeVisible();
          await send.click();
          await expect(page.locator('[data-w4a-turn="schritt-1"]')).toHaveAttribute("data-phase", "done");
          await expect(page.locator('[data-w4a-turn="schritt-1"] [data-w4a-answer]')).toContainText("September 2025");
        } else {
          await expect(page.locator("[data-w05-row]")).toHaveCount(8);
          await page.getByRole("slider").first().focus();
          await page.keyboard.press("ArrowRight");
          await page.locator('[data-w05-commit="keep"]').click();
          await expect(page.locator("[data-w05-lead]")).toHaveCount(0);
        }
      });
      if (course.capability === "workshop-w05") {
        await inNewPage(context, async (page) => {
          await openApp(page, `${demo}${demo.includes("?") ? "&" : "?"}beat=claude`);
          const stage = page.locator('[data-demo-stage] [data-w05-probe="recorded"]');
          const send = stage.locator("[data-w05-send]");
          await expect(send).toHaveAccessibleName(locale === "de" ? "Aufzeichnung abspielen" : "Play the recording");
          await send.click();
          // Reduced motion completes immediately; the full demo suite covers normal-motion stop controls.
          await expect(send).toHaveAttribute("data-state", "again");
          await expect(stage).toHaveAttribute("data-w05-done", "");
          await expect(page.locator("[data-w05-answer]")).not.toBeEmpty();
          await expect(page.locator("[data-w05-window]")).toContainText("Claude Code");
        });
      }
    });
  }

  test(`${locale}: book next and previous links remain usable`, { tag: tag("reader") }, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const [first, second] = chapters(locale);
    await openApp(page, `${prefix}/buecher/ki-landschaft/${first!.slug}`);
    await page.locator('[data-book-reader-ready]').waitFor({ state: "attached" });
    await page.keyboard.press("End");
    const nav = page.getByRole("navigation", { name: locale === "de" ? "Kapitelnavigation" : "Chapter navigation", exact: true });
    const next = nav.getByRole("link", { name: locale === "de" ? /^Weiter:/ : /^Next:/ });
    await expect(next).toHaveAttribute("href", `${prefix}/buecher/ki-landschaft/${second!.slug}`);
    await next.click();
    await page.locator(HYDRATED).waitFor({ state: "attached" });
    const previous = page.getByRole("navigation", { name: locale === "de" ? "Kapitelnavigation" : "Chapter navigation", exact: true }).getByRole("link", { name: locale === "de" ? /^Zurück:/ : /^Previous:/ });
    const box = await previous.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(44);
    await previous.click();
    await expect(page).toHaveURL(new RegExp(`${first!.slug}$`));
    await expectContained(page);
  });

  test(`${locale}: glossary search and clear retain semantic definitions`, { tag: tag("glossary") }, async ({ page }) => {
    await openApp(page, `${prefix}/ai-native/glossar`);
    const search = page.getByRole("searchbox");
    await expect(search).toBeEditable();
    await search.fill("no-such-smoke-term");
    await expect(page.getByText(locale === "de" ? "Keine Treffer. Versuche einen anderen Begriff." : "No results. Try another term.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: locale === "de" ? "Leeren" : "Clear", exact: true }).click();
    await expect(search).toHaveValue("");
    await expect(page.locator("main dl dt").first()).toBeVisible();
    expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  });

  for (const [capability, route] of [
    ["accessibility-home", "/"],
    ["accessibility-reader", `/buecher/ki-landschaft/${chapters(locale)[0]!.slug}`],
    ["accessibility-demo", "/demos/audit-vorbereitung-mit-ki"],
  ] as const) {
    test(`${locale}: ${capability} is accessible and contained at phone width`, { tag: tag(capability) }, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await openApp(page, `${prefix}${route === "/" ? "" : route}` || "/");
      await exposeAllAuditedContent(page);
      await expectContained(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test(`${locale}: public and protected HTTP boundaries stay truthful`, { tag: tag("http-contract") }, async ({ request }) => {
    for (const route of ["/konto", "/ai-native/kurs", "/ki-fuehrerschein/kurs"]) {
      const response = await request.get(`${prefix}${route}`, { maxRedirects: 0 });
      expect([302, 303, 307, 308]).toContain(response.status());
      expect(response.headers().location).toContain("/login");
    }
    expect((await request.get("/api/progress")).status()).toBe(503);
    const unknown = await request.get(`${prefix}/smoke-route-that-does-not-exist`);
    expect(unknown.status()).toBe(404);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    for (const privatePath of ["/konto", "/ai-native/kurs", "/ki-fuehrerschein/kurs"]) expect(xml).not.toContain(privatePath);
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const robotRules = await robots.text();
    expect(robotRules).toContain("Disallow: /konto");
    expect(robotRules).toContain("/api/progress");
    const llms = await request.get("/llms.txt");
    expect(llms.status()).toBe(200);
    const discovery = await llms.text();
    for (const privatePath of ["/konto", "/ki-transformation-check"]) expect(discovery).not.toContain(privatePath);
    const knowledge = await request.get("/api/knowledge-graph.json");
    expect(knowledge.status()).toBe(200);
    expect((await knowledge.json()).site.url).toBe("https://loehrning.ai");
  });
}
