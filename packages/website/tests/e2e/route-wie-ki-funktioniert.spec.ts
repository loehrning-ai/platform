import { test, expect, type Page } from "@playwright/test";

/**
 * Route coverage for the "Wie Sprachmodelle arbeiten" conceptual block
 * (regression coverage). The hub at /wie-ki-funktioniert lists four lesson cards
 * that deep-link into /wie-ki-funktioniert/<lektionId>; every lesson page
 * carries a togglable "Kurze Selbstprüfung" comprehension check.
 *
 * Slugs are discovered from src/lib/wie-ki-funktioniert (backed by
 * content/wie-ki-funktioniert/*.json + generateStaticParams), not guessed.
 */

const HUB = "/wie-ki-funktioniert";
// Canonical first lesson slug (content/wie-ki-funktioniert/lektion-1-*.json).
// Used only as a stable deep-route probe.
const FIRST_LESSON = "lektion-1-vorhersage";

// Assert 200, no "Application error" boundary, and no console/page errors.
async function gotoClean(page: Page, url: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `status for ${url}`).toBe(200);
  await expect(page.locator("text=Application error").first()).toHaveCount(0);

  const meaningful = errors;
  expect(
    meaningful,
    `console errors on ${url}\n${meaningful.join("\n")}`,
  ).toEqual([]);
  return response;
}

test.describe("/wie-ki-funktioniert hub", () => {
  test("renders h1, four lesson cards, and no console errors", async ({
    page,
  }) => {
    await gotoClean(page, HUB);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Wie Sprachmodelle arbeiten",
    );

    const cards = page.getByTestId("lektion-cards");
    await expect(cards).toBeVisible();
    const lessonLinks = cards.getByRole("link");
    expect(
      await lessonLinks.count(),
      "hub must list the four lesson cards",
    ).toBeGreaterThanOrEqual(4);
    // Every card deep-links into a lesson under the block.
    await expect(lessonLinks.first()).toHaveAttribute(
      "href",
      /\/wie-ki-funktioniert\/lektion-/,
    );
  });

  test("clicking a lesson card navigates to that lesson", async ({ page }) => {
    await page.goto(HUB);
    const firstCard = page
      .getByTestId("lektion-cards")
      .getByRole("link")
      .first();
    const href = await firstCard.getAttribute("href");
    expect(href, "lesson card must carry a deep-link href").toMatch(
      /\/wie-ki-funktioniert\/lektion-/,
    );

    await firstCard.click();
    // App Router client-side navigation updates the URL only after the RSC
    // response arrives; on a cold dev compile that can exceed the default 5s
    // assertion timeout. Wait for the lesson breadcrumb back-link (which exists
    // only on lesson pages, never on the hub) before asserting the URL.
    await expect(
      page.getByRole("link", { name: /Wie Sprachmodelle arbeiten/ }).first(),
    ).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/wie-ki-funktioniert\/lektion-/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("/wie-ki-funktioniert/[lektionId] lesson", () => {
  test("deep route resolves and the comprehension check toggles", async ({
    page,
  }) => {
    await gotoClean(page, `${HUB}/${FIRST_LESSON}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const check = page.getByRole("button", { name: /Kurze Selbstpr(ü|u)fung/ });
    await expect(check).toBeVisible();
    // Collapsed on load; aria-expanded is bound to the same state that unhides
    // the answer region, so the toggle is a faithful proxy for "content shown".
    await expect(check).toHaveAttribute("aria-expanded", "false");

    // Retry the click as a web-first assertion so a not-yet-hydrated first
    // click (dev-mode React race) does not flake: the handler flips
    // aria-expanded to true once React has wired up the client component.
    await expect(async () => {
      await check.click();
      await expect(check).toHaveAttribute("aria-expanded", "true", {
        timeout: 1000,
      });
    }).toPass({ timeout: 15000 });
  });

  test("an unknown lesson slug renders the not-found page", async ({
    page,
  }) => {
    await page.goto(`${HUB}/diese-lektion-gibt-es-nicht`);
    // The [lektionId] route calls notFound() for unknown slugs, which renders
    // the app 404 boundary. Assert the rendered UI rather than the HTTP status:
    // the Turbopack dev server streams the boundary inside a 200 document while
    // production returns 404, but the not-found heading is present in both.
    await expect(
      page.getByRole("heading", { name: /Seite nicht gefunden/ }),
    ).toBeVisible();
  });
});

test.describe("/wie-ki-funktioniert mobile layout", () => {
  test("no horizontal overflow at 390px and primary content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoClean(page, HUB);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("lektion-cards")).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return { scrollWidth: el.scrollWidth, innerWidth: window.innerWidth };
    });
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
