import { test, expect, type Page } from "@playwright/test";

/**
 * /eu-ai-act-kurs smoke + funnel (regression coverage wave 2). Stufe 3 of the
 * login-free learning path: a course landing that funnels into the hub at
 * /eu-ai-act-kurs/kurs, from which every real block (EU_AI_ACT_KURS_CONFIG
 * .blockIds = block_1..block_6) resolves at /eu-ai-act-kurs/kurs/block_N.
 * Assertions target ROLES, hrefs, and stable structure so a wording refresh
 * stays green while a dead funnel, unresolved block, or mobile overflow fails.
 */

const LANDING = "/eu-ai-act-kurs";
const HUB = "/eu-ai-act-kurs/kurs";
const BLOCK = "/eu-ai-act-kurs/kurs/block_1"; // first real blockId, always prerendered

// Console-error filter mirrors route-einstieg.spec.ts / qa-sweep.spec.ts: drop
// framework noise (hydration, prefetch, chunk 404s, Vercel Analytics) and keep
// only errors that signal a genuine page fault.
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

test.describe("/eu-ai-act-kurs landing", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${LANDING}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/EU AI Act/i);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${LANDING}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("shows the curriculum section and a funnel CTA into the hub", async ({
    page,
  }) => {
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    // Curriculum section header: catches a stripped block list.
    await expect(
      page.getByRole("heading", { name: "Was du lernst." }),
    ).toBeVisible();

    // Primary funnel CTA (rendered top + bottom); first must resolve to the hub.
    const startCta = page
      .getByRole("link", { name: "Kostenlosen Kurs starten" })
      .first();
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", HUB);
  });
});

test.describe("/eu-ai-act-kurs funnel + block resolution", () => {
  test("start CTA navigates to the hub and exposes a real block link", async ({
    page,
  }) => {
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    await page
      .getByRole("link", { name: "Kostenlosen Kurs starten" })
      .first()
      .click();

    await expect(page).toHaveURL(/\/eu-ai-act-kurs\/kurs$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "EU AI Act Kurs" }),
    ).toBeVisible();

    // First block card links to the real first blockId (fresh progress => label
    // "Block starten"; regex also tolerates a restored-progress "Weitermachen").
    const firstBlockLink = page
      .getByRole("link", { name: /Block starten|Weitermachen/i })
      .first();
    await expect(firstBlockLink).toBeVisible();
    await expect(firstBlockLink).toHaveAttribute("href", BLOCK);
  });

  test("a /kurs/block_1 block page resolves for anonymous readers", async ({
    page,
  }) => {
    const response = await page.goto(BLOCK, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${BLOCK}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    // Server-rendered block shell: back link + ordinal prove it is not notFound.
    await expect(page.getByRole("link", { name: "Alle Blöcke" })).toBeVisible();
    await expect(page.getByText(/Block 1 \/ 6/)).toBeVisible();

    // Lesson body renders a level-2 title (block pages have no h1).
    await expect(
      page.getByRole("heading", { level: 2 }).first(),
    ).toBeVisible();
  });
});

test.describe("/eu-ai-act-kurs mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Kostenlosen Kurs starten" }).first(),
    ).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
