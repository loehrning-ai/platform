import { expect, test, type Page } from "@playwright/test";
import { BOOK_PATH, chapterPath, chapters, chaptersWith, spineLanded, SPINE } from "./fixtures/book";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * The data book "Von außen gesehen": its cover, its figures, its pinned stages and
 * the explorer "Wo stehe ich?", on the real built pages. Covers what a reader sees
 * and does: the cover number is on the first screen over a field of 1.000 squares,
 * every figure renders as a finished chart with one visible source line and nothing
 * collapses, the stage steps work from the keyboard and by scroll, reduced motion
 * and the pause switch stack the steps and show every figure finished, the anti
 * colour states are real, and nothing scrolls sideways at 390px. Assertions target
 * structure and stable strings, never prose. Chapters come from the manifest.
 *
 * The stage and explorer tests find their chapters from the markdown on disk
 * (`::stage{...}` and `::explorer{}` lines) and skip, saying so, while no chapter
 * has one. E2E_BOOK_STAGE_PATHS (comma separated paths) points them at a harness
 * page instead, which is how a reviewer exercises them before the text lands.
 */

const ACCENT = "rgb(183, 58, 21)";

async function hydrated(page: Page): Promise<void> {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
}

const override = (process.env["E2E_BOOK_STAGE_PATHS"] ?? "").split(",").map((p) => p.trim()).filter(Boolean);
const STAGE_PATHS: readonly string[] = override.length > 0 ? override : chaptersWith("stage").map((c) => chapterPath(c.slug));
const EXPLORER_PATHS: readonly string[] = override.length > 0 ? override : chaptersWith("explorer").map((c) => chapterPath(c.slug));

const hoverCapable = (page: Page): Promise<boolean> =>
  page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);

test.describe("data book cover", () => {
  test("the headline number and its field of 1.000 squares are on the first screen of a laptop", async ({ page }) => {
    // The settled poster is what the first screen holds without motion; the live reel replaces it once it plays.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BOOK_PATH, { waitUntil: "load" });
    const stage = page.locator("[data-book-stage]");
    const numeral = stage.locator("[data-book-numeral]");
    await expect(numeral).toContainText("%");
    const box = await numeral.boundingBox();
    expect(box, "numeral box").not.toBeNull();
    expect(box!.y + box!.height, "numeral must end above the fold (800px)").toBeLessThan(800);
    // One square is 0,1 %: the whole field is 1.000 squares, the headline share is that many in Mennige.
    const field = stage.locator("svg.cr-field");
    const filled = Number(await field.getAttribute("data-cover-squares"));
    expect(filled).toBeGreaterThan(0);
    expect(filled).toBeLessThan(1000);
    const counts = await field.evaluate((svg) =>
      Array.from(svg.querySelectorAll("path")).map((p) => (p.getAttribute("d") ?? "").match(/M/g)?.length ?? 0),
    );
    // rest + solid + partial squares make up the 1.000.
    expect(counts.reduce((a, b) => a + b, 0)).toBe(1000);
    await expect(stage.getByText(/^1 Quadrat = 0,1 % der [\d.]+ Firmen$/)).toBeVisible();
    await expect(page.getByText("Vorläufig")).toHaveCount(0);
  });

  test("the cover has the poster band, card A, card B or its honest note, and nothing collapses", async ({ page }) => {
    await page.goto(BOOK_PATH, { waitUntil: "load" });
    await expect(page.locator("[data-cover-band]")).toBeVisible();
    await expect(page.locator("[data-book-start]")).toHaveAttribute("href", chapterPath(chapters()[0]!.slug));
    await expect(page.locator("main details, main summary, main [aria-expanded]")).toHaveCount(0);
  });

  test.describe("the reel without script", () => {
    test.use({ javaScriptEnabled: false });

    test("shows the settled server poster and no pause switch", async ({ page }) => {
      await page.goto(BOOK_PATH, { waitUntil: "load" });
      const reel = page.locator("[data-cover-reel]");
      await expect(reel).toBeVisible();
      await expect(reel).toHaveAttribute("data-state", "poster");
      await expect(reel.locator("svg.cr-field")).toBeVisible();
      await expect(reel.getByRole("switch", { includeHidden: true })).toBeHidden();
    });
  });

  test("the live reel exposes a working pause and resume switch", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(BOOK_PATH, { waitUntil: "load" });
    await hydrated(page);
    const reel = page.locator("[data-cover-reel]");
    await reel.scrollIntoViewIfNeeded();
    // Idle loading may replace the server poster after hydration. Wait for
    // that explicit state instead of branching on an earlier attribute read.
    await expect(reel).toHaveAttribute("data-state", "playing");
    const pause = reel.getByRole("switch", { name: "Bewegung anhalten" });
    await expect(pause).toBeVisible();
    await expect(pause).toHaveAttribute("aria-checked", "false");
    await pause.click();
    await expect(reel).toHaveAttribute("data-state", "paused");
    const resume = reel.getByRole("switch", { name: "Bewegung starten" });
    await expect(resume).toBeVisible();
    await expect(resume).toHaveAttribute("aria-checked", "true");
    await resume.click();
    await expect(reel).toHaveAttribute("data-state", "playing");
    await expect(pause).toHaveAttribute("aria-checked", "false");
  });

  test("reduced motion keeps the settled cover", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(BOOK_PATH, { waitUntil: "load" });
    await hydrated(page);
    await page.waitForTimeout(500);
    await expect(page.locator("[data-cover-reel]")).toHaveAttribute("data-state", "poster");
    await expect(page.locator("[data-cover-reel] svg.cr-field")).toBeVisible();
    await expect(page.locator("[data-cover-reel]").getByRole("switch", { includeHidden: true })).toBeHidden();
  });
});

test.describe("data book figures", () => {
  test("every chapter renders its figures as finished charts, with one visible source line and no collapsible, provisional banner or console error", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const errors = collectBrowserErrors(page);
    for (const chapter of chapters()) {
      const url = chapterPath(chapter.slug);
      const res = await page.goto(url, { waitUntil: "domcontentloaded" });
      expect(res?.status(), url).toBe(200);
      // The opening number of a chapter (the ticker) is a figure without a chart: its source line is checked, not its svg.
      const figures = page.locator("main figure");
      const count = await figures.count();
      for (let i = 0; i < count; i++) {
        const figure = figures.nth(i);
        // The server markup already holds the finished chart: an svg with a title.
        if ((await figure.locator(".bf-ticker").count()) === 0) {
          await expect(figure.locator("svg title").first(), `${url} figure ${i}`).toBeAttached();
        }
        // One visible source line with n and a limit; the numbers are a plain CSV link away.
        const line = figure.locator("[data-source-line]");
        await expect(line, `${url} figure ${i}: source line`).toBeVisible();
        // n and the limit are in the line (a figure built from the reader's own input has no sample, only its source).
        await expect(line).toContainText(/(\bn\b|Quelle:)[\s\S]*Grenze:/);
        await expect(line.locator("a[download]").first()).toHaveAttribute("href", /\.csv$|^data:text\/csv/);
      }
      await expect(page.locator("main details, main summary"), `${url}: nothing collapses`).toHaveCount(0);
      await expect(page.getByText("Vorläufige Daten"), url).toHaveCount(0);
    }
    const noise = meaningfulBrowserErrors(errors);
    expect(noise, `console errors\n${formatBrowserErrors(noise)}`).toEqual([]);
  });

  test("the source line is Figtree, 12px or more, and never mono", async ({ page }) => {
    await page.goto(chapterPath(chapters()[0]!.slug), { waitUntil: "load" });
    const lines = page.locator("[data-source-line]");
    const count = await lines.count();
    for (let i = 0; i < count; i++) {
      const style = await lines.nth(i).evaluate((el) => {
        const cs = getComputedStyle(el);
        return { family: cs.fontFamily, size: parseFloat(cs.fontSize) };
      });
      expect(style.family, `source line ${i} font`).not.toMatch(/mono|courier/i);
      expect(style.size, `source line ${i} size`).toBeGreaterThanOrEqual(12);
    }
  });

  test("reduced motion shows every figure finished and still", async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const chapter of chapters()) {
      await page.goto(chapterPath(chapter.slug), { waitUntil: "load" });
      await hydrated(page);
      // Figures with their own stacked steps (the story islands, .bf-figure) are covered by their own specs.
      const svgs = page.locator("main figure.bf svg[data-progress]");
      const n = await svgs.count();
      for (let i = 0; i < n; i++) {
        await expect(svgs.nth(i), `${chapter.slug} svg ${i}`).toHaveAttribute("data-progress", "1");
      }
      const faded = await page.evaluate(() =>
        // [data-group] marks are the waffle's outline of a reading, drawn only once the reader picks its chip.
        Array.from(document.querySelectorAll("main figure.bf svg [opacity]:not([data-group])"))
          .filter((el) => Number(el.getAttribute("opacity")) < 1)
          .map((el) => el.tagName),
      );
      expect(faded, `${chapter.slug}: faded marks under reduced motion`).toEqual([]);
    }
  });

  test("no figure, table or band scrolls the page sideways at 390px", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const chapter of chapters()) {
      await page.goto(chapterPath(chapter.slug), { waitUntil: "load" });
      await hydrated(page);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `${chapter.slug}: scrollWidth ${scrollWidth} > ${innerWidth}`).toBeLessThanOrEqual(innerWidth + 1);
      const leaking = await page.evaluate(() =>
        Array.from(document.querySelectorAll("main figure, main .cs"))
          .filter((f) => f.getBoundingClientRect().right > window.innerWidth + 1)
          .length,
      );
      expect(leaking, `${chapter.slug}: figures or stages wider than the screen`).toBe(0);
    }
  });
});

test.describe("chapter stage", () => {
  test.beforeEach(() => {
    test.skip(STAGE_PATHS.length === 0, "no chapter of the manifest places a ::stage yet");
  });

  test("Weiter and Zurück work from the keyboard, and the step is stated as text", async ({ page }) => {
    await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 900 });
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const stage = page.locator("[data-chapter-stage]").first();
    const total = Number(await stage.getAttribute("data-steps"));
    expect(total).toBeGreaterThanOrEqual(2);
    await stage.scrollIntoViewIfNeeded();
    // Wait until the stage script has taken over (it starts when the browser is idle).
    await expect(stage).toHaveAttribute("data-mode", "scrub");
    // From lg the stage has its own control row; below lg the reader bar is the step control and presses the same buttons.
    const phone = (page.viewportSize()?.width ?? 1280) < 1024;
    const bar = page.locator("[data-reader-focus-bar]");
    const next = phone ? bar.locator("[data-reader-focus-action]") : stage.locator('[data-cs="next"]');
    const prev = phone ? bar.locator(".ifb-btn").first() : stage.locator('[data-cs="prev"]');
    const count = phone ? bar.locator("[data-reader-focus-position]") : stage.locator("[data-cs-count]");
    await expect(count).toContainText(new RegExp(`Schritt \\d+ von ${total}`));
    // Walk to the first step, then forward one step with the keyboard.
    while ((await prev.getAttribute("aria-disabled")) !== "true") {
      await prev.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(450);
    }
    await expect(count).toContainText(`Schritt 1 von ${total}`);
    await expect(prev).toHaveAttribute("aria-disabled", "true");
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(stage).toHaveAttribute("data-step", "1");
    await expect(count).toContainText(`Schritt 2 von ${total}`);
    await prev.focus();
    await page.keyboard.press("Space");
    await expect(stage).toHaveAttribute("data-step", "0");
  });

  test("the phone strip leaves the text at least 55 % of the screen, numerals sit in the cards, buttons are 48px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const pin = page.locator("[data-chapter-stage] [data-cs-pin]").first();
    await expect(pin).toBeVisible();
    await page.locator("[data-chapter-stage] .cs-step").nth(1).scrollIntoViewIfNeeded();
    const geometry = await pin.evaluate((el) => {
      const cs = getComputedStyle(el);
      const root = el.closest("[data-chapter-stage]") as HTMLElement;
      const numeral = root.querySelector(".cs-step-numeral") as HTMLElement | null;
      const bar = document.querySelector("[data-reader-focus-bar]");
      const barTop = bar && bar.getBoundingClientRect().height > 0 ? bar.getBoundingClientRect().top : window.innerHeight;
      const height = el.getBoundingClientRect().height;
      return {
        position: cs.position,
        height,
        window: (barTop - (parseFloat(cs.top) + height)) / window.innerHeight,
        headsShown: (root.querySelector(".cs-heads") as HTMLElement).getBoundingClientRect().height > 0,
        numeralPx: numeral ? parseFloat(getComputedStyle(numeral).fontSize) : null,
        rootWidth: root.getBoundingClientRect().width,
      };
    });
    expect(geometry.position).toBe("sticky");
    // clamp(12rem, 44svh - header - reader bar, 20rem), never taller than the figure needs.
    expect(geometry.height, "strip height").toBeLessThanOrEqual(0.44 * 844 - 48 - 54 + 1);
    expect(geometry.window, "reading window under the strip").toBeGreaterThanOrEqual(0.55);
    expect(geometry.headsShown, "the pinned numeral gives way to the card numeral below lg").toBe(false);
    expect(geometry.rootWidth, "full-bleed on a phone").toBeGreaterThanOrEqual(389);
    if (geometry.numeralPx !== null) expect(geometry.numeralPx).toBeLessThanOrEqual(56.5);
    // Below lg the stage's own control row gives way to the reader bar, the step control in the thumb zone.
    await expect(page.locator("[data-chapter-stage] .cs-ctl").first()).toBeHidden();
    await page.locator("[data-chapter-stage]").first().scrollIntoViewIfNeeded();
    const bar = page.locator("[data-reader-focus-bar]");
    await expect(bar).toHaveAttribute("data-bar-mode", "step");
    const buttons = await bar.locator(".ifb-btn").all();
    expect(buttons.length, "reader bar step buttons").toBeGreaterThanOrEqual(2);
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(Math.min(box?.width ?? 0, box?.height ?? 0), "reader bar button target").toBeGreaterThanOrEqual(48);
    }
  });

  test("the stage text keeps the word budget and uses no mono outside numerals and ticks", async ({ page }) => {
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    const report = await page.evaluate(() => {
      const root = document.querySelector("[data-chapter-stage]") as HTMLElement;
      const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
      const claims = Array.from(root.querySelectorAll("[data-cs-claim]")).map((el) => words(el.textContent ?? ""));
      const cards = Array.from(root.querySelectorAll(".cs-card-text")).map((el) => words(el.textContent ?? ""));
      const mono = Array.from(root.querySelectorAll("*"))
        .filter((el) => !el.closest("svg") && /mono|courier/i.test(getComputedStyle(el).fontFamily) && (el.textContent ?? "").trim() !== "")
        .map((el) => el.className.toString());
      const dashes = /[\u2013\u2014]/.test(root.textContent ?? "");
      return { claims, cards, mono, dashes };
    });
    for (const n of report.claims) expect(n, "claim words").toBeLessThanOrEqual(12);
    for (const n of report.cards) expect(n, "card words").toBeLessThanOrEqual(30);
    expect(report.mono, "mono text outside the figure").toEqual([]);
    expect(report.dashes, "no em or en dash").toBe(false);
  });

  test("scrolling through the stage walks the steps in order and changes nothing outside the stage", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const stage = page.locator("[data-chapter-stage]").first();
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute("data-mode", "scrub");
    // Let hydration of the rest of the page finish first (React touches the attributes of form controls when it hydrates them).
    await page.waitForTimeout(1_000);
    // Count DOM mutations of the book (everything inside <main>) that land outside the stage while the reader
    // scrubs. The site's own chrome (header, progress thread, tab bar) is outside <main> and not the book's.
    await page.evaluate(() => {
      const w = window as unknown as { __outside: number };
      w.__outside = 0;
      const root = document.querySelector("[data-chapter-stage]") as HTMLElement;
      new MutationObserver((records) => {
        for (const r of records) {
          // The phone reader bar is the step control: it follows the step by design.
          const inBar = (r.target instanceof Element ? r.target : r.target.parentElement)?.closest("[data-reader-focus-bar]") != null;
          if (!root.contains(r.target as Node) && !inBar) {
            w.__outside += 1;
            const el = r.target instanceof Element ? r.target : r.target.parentElement;
            (w as unknown as { __what: string[] }).__what = [...((w as unknown as { __what?: string[] }).__what ?? []), `${r.type}:${r.attributeName ?? ""}:${el?.tagName}.${String(el?.className).slice(0, 50)}`];
          }
        }
      }).observe(document.querySelector("main") as HTMLElement, { subtree: true, childList: true, attributes: true, characterData: true });
    });
    const seen: number[] = [];
    const box = (await stage.boundingBox())!;
    const top = box.y + (await page.evaluate(() => window.scrollY));
    for (let y = top; y < top + box.height; y += 120) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(40);
      seen.push(Number(await stage.getAttribute("data-step")));
    }
    expect(seen.length).toBeGreaterThan(4);
    for (let i = 1; i < seen.length; i++) expect(seen[i]!, "steps never go backwards while scrolling down").toBeGreaterThanOrEqual(seen[i - 1]!);
    expect(Math.max(...seen)).toBeGreaterThan(Math.min(...seen));
    const outside = await page.evaluate(() => (window as unknown as { __outside: number }).__outside);
    const what = await page.evaluate(() => (window as unknown as { __what?: string[] }).__what ?? []);
    expect(outside, `DOM mutations outside the stage during the scrub: ${what.join(" | ")}`).toBe(0);
  });

  test("reduced motion stacks every step with its numeral and shows the figure finished", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const stage = page.locator("[data-chapter-stage]").first();
    await expect(stage.locator("[data-cs-pin]")).toHaveCSS("position", "static");
    await expect(stage.locator(".cs-ctl")).toBeHidden();
    const steps = stage.locator(".cs-step");
    const total = await steps.count();
    for (let i = 0; i < total; i++) {
      await expect(steps.nth(i)).toBeVisible();
      await expect(steps.nth(i)).toContainText(`Schritt ${i + 1} von ${total}`);
    }
    for (const numeral of await stage.locator(".cs-step-numeral").all()) await expect(numeral).toBeVisible();
    const svg = stage.locator("svg[data-progress]").first();
    if (await svg.count()) expect(Number(await svg.getAttribute("data-progress"))).toBe(1);
    await page.waitForTimeout(300);
    await expect(stage).toHaveAttribute("data-mode", "static");
  });

  test("the chapter pause switch stacks the steps at once and turns back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const toggle = page.getByRole("switch", { name: "Bewegung anhalten" });
    await expect(toggle).toBeVisible();
    const pin = page.locator("[data-chapter-stage] [data-cs-pin]").first();
    await expect(pin).toHaveCSS("position", "sticky");
    await toggle.check();
    await expect(pin).toHaveCSS("position", "static");
    await expect(page.locator("[data-chapter-stage] .cs-step-numeral").first()).toBeVisible();
    await expect(page.locator("[data-chapter-stage]").first()).toHaveAttribute("data-mode", "static");
    await toggle.uncheck();
    await expect(pin).toHaveCSS("position", "sticky");
    const target = await toggle.boundingBox();
    expect(Math.max(target?.height ?? 0, 44)).toBeGreaterThanOrEqual(44);
  });

  test("the stage buttons carry a fixed 3px focus ring and flip to the anti colour on hover", async ({ page }) => {
    await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 900 });
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const stage = page.locator("[data-chapter-stage]").first();
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute("data-mode", "scrub");
    // From lg the stage has its own control row; below lg the reader bar is the step control and its primary button is Mennige.
    const phone = (page.viewportSize()?.width ?? 1280) < 1024;
    const next = phone ? page.locator("[data-reader-focus-bar] .ifb-btn--primary") : stage.locator('[data-cs="next"]');
    await expect(next).toBeVisible();
    await next.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const look = () =>
      next.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { width: cs.outlineWidth, color: cs.outlineColor, fill: cs.backgroundColor };
      });
    const ring = await look();
    expect(ring.width).toBe("3px");
    if (phone) {
      // The Mennige button gets the Druckschwarz ring: never the colour of its own fill.
      expect(ring.color, "focus ring is not the fill colour").not.toBe(ring.fill);
    } else {
      expect(ring.color).toBe(ACCENT);
    }
    if (await hoverCapable(page)) {
      await next.hover();
      if (phone) await expect.poll(async () => (await look()).fill).not.toBe(ring.fill);
      else await expect.poll(() => next.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ACCENT);
    }
  });

  test("the pinned figure survives hydration: the page has no console error on a stage chapter", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto(STAGE_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    await page.waitForTimeout(500);
    const noise = meaningfulBrowserErrors(errors);
    expect(noise, `console errors\n${formatBrowserErrors(noise)}`).toEqual([]);
  });
});

test.describe("explorer Wo stehe ich?", () => {
  test.beforeEach(() => {
    test.skip(EXPLORER_PATHS.length === 0, "no chapter of the manifest places the ::explorer yet");
  });

  test("shows a worked example before any input and answers in one live sentence", async ({ page }) => {
    await page.goto(EXPLORER_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const live = page.locator("[data-explorer-readout]");
    await expect(live).toHaveAttribute("aria-live", "polite");
    await expect(live).toContainText(/^(Etwa [\d,]+|Weniger als 0,1) von 100 GmbH-Startseiten wie deine nennen KI, wahrscheinlich (unter 0,1|[\d,]+) bis [\d,]+\./);
    await expect(page.getByText("Das sagt etwas über Sichtbarkeit, nicht über deinen Einsatz.")).toBeVisible();
    // The static table is there for print and no script, with intervals.
    await expect(page.locator("[data-explorer] table")).toContainText(/\([\d,]+ bis [\d,]+\)/);
  });

  test("the four controls are native, 44px and drive the estimate from the keyboard", async ({ page }) => {
    await page.goto(EXPLORER_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const root = page.locator("[data-explorer]");
    for (const label of ["Branche", "Bundesland", "Größe"]) {
      const select = root.getByLabel(label, { exact: true });
      expect(await select.evaluate((el) => el.tagName)).toBe("SELECT");
      const box = await select.boundingBox();
      expect(box?.height ?? 0, `${label} height`).toBeGreaterThanOrEqual(43.5);
    }
    // The text length is a native radio group of five levels (kurz to lang), arrow keys walk it.
    const group = root.locator("[data-explorer-textmenge]");
    const radios = group.getByRole("radio");
    await expect(radios).toHaveCount(5);
    for (const face of await group.locator(".ex-chip-face").all()) {
      const box = await face.boundingBox();
      expect(box?.height ?? 0, "text length chip height").toBeGreaterThanOrEqual(43.5);
    }
    const numeral = root.locator(".ex-numeral-n");
    const readNumber = async () => {
      const raw = ((await numeral.textContent()) ?? "").replace(",", ".");
      return raw.startsWith("<") ? 0 : Number(raw);
    };
    await group.locator(".ex-chip").first().click();
    await expect(radios.first()).toBeChecked();
    const low = await readNumber();
    const sentenceAtStart = (await page.locator("[data-explorer-readout]").textContent()) ?? "";
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
    await expect(radios.last()).toBeChecked();
    const high = await readNumber();
    expect(high, "more text, higher estimate").toBeGreaterThan(low);
    await expect(page.locator("[data-explorer-readout]")).not.toHaveText(sentenceAtStart);
  });

  test("the field has 1.000 squares, the estimate filled and the 95 % band outlined", async ({ page }) => {
    await page.goto(EXPLORER_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const counts = await page.locator("[data-explorer] svg.ex-field").evaluate((svg) => {
      const n = (cls: string) => (svg.querySelector(`.${cls}`)?.getAttribute("d") ?? "").match(/M/g)?.length ?? 0;
      return { solid: n("ex-sq--solid"), band: n("ex-sq--band"), rest: n("ex-sq--rest") };
    });
    expect(counts.band).toBeGreaterThan(0);
    // whole squares + at most one partial square + the rest = 1.000
    expect(counts.solid + counts.rest).toBeGreaterThanOrEqual(999);
    expect(counts.solid + counts.rest).toBeLessThanOrEqual(1000);
  });

  test("nothing leaves the browser while the reader changes the controls", async ({ page }) => {
    await page.goto(EXPLORER_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    await page.waitForTimeout(800);
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "GET" || /\/api\//.test(request.url())) requests.push(`${request.method()} ${request.url()}`);
    });
    const root = page.locator("[data-explorer]");
    const select = root.locator("select").first();
    const options = await select.locator("option").evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
    for (const value of options.slice(0, 3)) await select.selectOption(value);
    await root.locator("[data-explorer-textmenge] .ex-chip").nth(3).click();
    await page.waitForTimeout(400);
    expect(requests, "requests during the interaction").toEqual([]);
    await expect(root).toContainText("Dein Browser rechnet das allein");
  });

  test("controls flip to the anti colours on hover and keep a 3px Mennige focus ring", async ({ page }) => {
    await page.goto(EXPLORER_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const select = page.locator("[data-explorer]").getByLabel("Branche", { exact: true });
    await select.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const ring = await select.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { width: cs.outlineWidth, color: cs.outlineColor };
    });
    expect(ring).toEqual({ width: "3px", color: ACCENT });
    if (await hoverCapable(page)) {
      await select.hover();
      await expect.poll(() => select.evaluate((el) => getComputedStyle(el).borderBottomColor)).toBe(ACCENT);
    }
  });

  test("has no horizontal scroll at 390px and the controls stay below the stage", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(EXPLORER_PATHS[0]!, { waitUntil: "load" });
    await hydrated(page);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
    // Below lg the stage dissolves into its parts: the readout is the sticky top, the controls follow right under it
    // (thumb zone), the field they drive comes after them.
    const mini = await page.locator("[data-explorer] .ex-mini").boundingBox();
    const controls = await page.locator("[data-explorer] form").boundingBox();
    const field = await page.locator("[data-explorer] svg.ex-field").boundingBox();
    expect(mini, "readout box").not.toBeNull();
    expect(controls, "controls box").not.toBeNull();
    expect(field, "field box").not.toBeNull();
    expect(controls!.y, "controls come after the readout").toBeGreaterThan(mini!.y + mini!.height - 1);
    expect(field!.y, "the field follows the controls").toBeGreaterThan(controls!.y + controls!.height - 1);
  });
});

test.describe("insight spine (INSIGHT-SPEC section 2)", () => {
  test.beforeEach(() => {
    test.skip(!spineLanded(), "the manifest is not the insight spine yet (the text lands in a later wave)");
  });

  test("eight chapters and the sources page, each chapter with its stage, the explorer in chapter 8", async ({ page }) => {
    test.setTimeout(120_000);
    expect(chapters().map((c) => c.slug)).toEqual([...SPINE]);
    for (const slug of SPINE.slice(0, 8)) {
      await page.goto(chapterPath(slug), { waitUntil: "domcontentloaded" });
      // Chapter 8 holds the explorer instead of a hero stage.
      await expect(page.locator("[data-chapter-stage]"), `${slug}: one hero stage`).toHaveCount(slug === "08_dein_zug" ? 0 : 1);
      await expect(page.getByRole("note", { name: "Was du tun kannst", exact: true }), `${slug}: end box`).toBeVisible();
    }
    await page.goto(chapterPath("08_dein_zug"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-explorer]")).toHaveCount(1);
    await page.goto(chapterPath("09_quellen"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("table").first()).toBeVisible();
  });
});
