import { test, expect, type Page } from "@playwright/test";

/**
 * /kurse hub smoke + interaction (regression coverage). The unified course hub:
 * three native German course-track cards (KI-Führerschein → EU AI Act → AI-Native)
 * with a cross-course progress indicator, a persona toggle, and a 6-stage
 * Kompetenzweg strip. Assertions target ROLES and stable test IDs, not copy, so
 * a wording refresh stays green while a real regression (missing track cards,
 * dead "Kurs starten" CTA, broken progress dots, mobile overflow) fails.
 *
 * Complementary to courses.spec.ts, which already covers the imported
 * open-source lane, link visibility, and axe - this file adds the console-error
 * smoke, a real navigation click into a track, and the persona interaction.
 */

const ROUTE = "/kurse";

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

// Native course tracks (h3 card headings) - source of truth: lib/courses/catalog.ts.
const NATIVE_TRACKS = [
  "KI-Führerschein",
  "EU AI Act Kurs",
  "AI-Native Arbeitskurs",
] as const;

test.describe("/kurse hub", () => {
  test("loads without login, shows the hero h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("KI lernen");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("renders the native course-track cards, progress indicator, and Kompetenzweg strip", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    for (const title of NATIVE_TRACKS) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }

    // The 6-stage learning-path strip is a stable landmark carrying its count
    // in the accessible name, so a silently emptied strip is caught.
    await expect(
      page.getByRole("navigation", { name: "KI-Kompetenzweg: 6 Stufen" }),
    ).toBeVisible();

    // Each native card exposes an ARIA progressbar (dots) + percentage pill,
    // rendered unconditionally (0% for a fresh visitor) - no auth/seed needed.
    await expect(
      page.getByRole("progressbar", { name: /Fortschritt.*KI-Führerschein/i }),
    ).toBeVisible();
    await expect(
      page.getByTestId("progress-pct-ki-fuehrerschein"),
    ).toBeVisible();
  });

  test("primary CTA navigates into a course track", async ({ page }) => {
    // "load" so the Next <Link> is hydrated before the click; clicking mid-
    // hydration cancels the client navigation and the URL stays on /kurse.
    await page.goto(ROUTE, { waitUntil: "load" });

    // Fresh visitor → label "Kurs starten", href = startHref of the track.
    const startCta = page.getByRole("link", {
      name: /Kurs starten.*KI-Führerschein/i,
    });
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", "/ki-fuehrerschein/kurs");

    await startCta.click();
    await expect(page).toHaveURL(/\/ki-fuehrerschein\/kurs/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("learning-goal recommendations link directly to the matching courses", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("persona-filter")).toBeVisible();

    const recommendations = [
      [
        "Alltag und sicherer Einsatz: direkt zum KI-Führerschein",
        "/ki-fuehrerschein",
      ],
      ["Regeln und Einordnen: direkt zum EU AI Act Kurs", "/eu-ai-act-kurs"],
      ["Aktiv mit KI arbeiten: direkt zum AI-Native Kurs", "/ai-native"],
    ] as const;

    for (const [name, href] of recommendations) {
      await expect(page.getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }
  });
});

test.describe("/kurse mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "KI-Führerschein" }),
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
