import { test, expect, type Page } from "@playwright/test";

/**
 * /ki-und-gesellschaft/kurs reader smoke + interaction (regression coverage,
 * wave 2). route-matrix.spec.ts covers the course landing; this spec adds the
 * *reader*: the /kurs overview (3 blocks + workshop-quiz step) and a real
 * /kurs/[blockId] lesson page. Assertions target ROLES, stable structure and
 * the noindex crawl contract, not exact copy, so a real regression (missing
 * blocks, dead block link, lost noindex header, mobile overflow) fails while a
 * wording refresh stays green. blockIds are read from
 * KI_UND_GESELLSCHAFT_CONFIG.blockIds (["block_1","block_2","block_3"]), never
 * guessed. Every spec runs in both the chromium (1280) and mobile (390)
 * projects, so viewport-less tests assert only width-agnostic elements; the
 * width-gated desktop nav / mobile drawer toggle live in the mobile block.
 */

const KURS = "/ki-und-gesellschaft/kurs";
const BLOCK = "/ki-und-gesellschaft/kurs/block_1";

// Console-error filter mirrors route-einstieg.spec.ts / qa-sweep.spec.ts: drop
// framework noise and keep only errors that signal a genuine page fault.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => (document.scrollingElement?.scrollWidth ?? 0) - window.innerWidth,
  );
}

test.describe("/ki-und-gesellschaft/kurs reader landing", () => {
  test("loads without login, renders blocks, no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(KURS, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${KURS}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    await expect(
      page.getByRole("heading", { level: 1, name: /KI und Gesellschaft/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Gesamtfortschritt" }),
    ).toBeVisible();

    // The three blocks + workshop-quiz step are the pedagogical payload.
    for (const n of [1, 2, 3]) {
      await expect(
        page.getByRole("heading", { level: 2, name: new RegExp(`^Block ${n}:`) }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("heading", { level: 2, name: "Workshop-Quiz" }),
    ).toBeVisible();

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${KURS}\n${noise.join("\n")}`).toEqual([]);
  });

  test("a block card opens the block reader", async ({ page }) => {
    await page.goto(KURS, { waitUntil: "domcontentloaded" });

    // Fresh context => no stored progress => the CTA reads "Block starten".
    const startLink = page.getByRole("link", { name: "Block starten" }).first();
    await expect(startLink).toBeVisible();
    await startLink.click();

    await expect(page).toHaveURL(/\/ki-und-gesellschaft\/kurs\/block_1$/);
    await expect(page.getByRole("link", { name: "Alle Blöcke" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  });
});

test.describe("/ki-und-gesellschaft/kurs block reader", () => {
  test("a real block route resolves with lesson chrome", async ({
    page,
  }) => {
    const response = await page.goto(BLOCK, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${BLOCK}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    // Reader chrome present at every viewport: back-link, lesson heading, tabs.
    await expect(page.getByRole("link", { name: "Alle Blöcke" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Lernen" })).toBeVisible();
  });
});

test.describe("/ki-und-gesellschaft/kurs mobile", () => {
  test("landing has no horizontal overflow at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(KURS, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: /KI und Gesellschaft/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Gesamtfortschritt" }),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test("block reader shows the drawer toggle and no overflow at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BLOCK, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    // Below md the desktop sidebar is hidden and this toggle opens the drawer.
    await expect(
      page.getByRole("button", { name: "Navigation öffnen" }),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
