import { test, expect } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * /kurse hub smoke + interaction (regression coverage). The unified course hub:
 * four ordered foundation rows with cross-course progress indicators,
 * a learning-goal decision, and one explicit next proof. Assertions target roles
 * and stable test IDs so a wording refresh stays green while a real regression
 * (missing rows, dead proof CTA, broken progress bars, mobile overflow) fails.
 *
 * Complementary to courses.spec.ts, which already covers the imported
 * open-source lane, link visibility, and axe - this file adds the console-error
 * smoke, a real navigation click into a track, and the goal interaction.
 */

const ROUTE = "/kurse";
const CLAUDE_START = "/kurse/open-source/claude/kurs/mental-model";

// Native course tracks (h3 card headings) - source of truth: lib/courses/catalog.ts.
const NATIVE_TRACKS = [
  "KI-Führerschein",
  "KI und Gesellschaft",
  "EU AI Act Kurs",
  "AI-Native Arbeitskurs",
] as const;

test.describe("/kurse hub", () => {
  test("loads without login, shows the hero h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("KI verstehen");

    const noise = meaningfulBrowserErrors(errors);
    expect(
      noise,
      `console errors on ${ROUTE}\n${formatBrowserErrors(noise)}`,
    ).toEqual([]);
  });

  test("renders all four native course-track cards and their progress indicators", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // The selected-path instrument intentionally repeats its next course in
    // the complete ledger. Scope card assertions to the ledger so the test
    // keeps strict locator semantics while preserving that useful repetition.
    const allCourses = page.getByRole("region", { name: "Alle Kurse" });

    for (const title of NATIVE_TRACKS) {
      await expect(
        allCourses.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    }

    await expect(
      allCourses.getByRole("heading", {
        level: 3,
        name: "Grundlagenpfad",
        exact: true,
      }),
    ).toBeVisible();

    // The teaser carries no progress meter: progress affordances live on the
    // account catalog. What each row states instead is the course duration.
    await expect(allCourses.getByRole("progressbar")).toHaveCount(0);
  });

  test("primary CTA discloses an open course and reaches its public lesson", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });

    // Provider-free cold start offers one disclosed open task. Direct gated
    // route protection is covered separately in route-ki-fuehrerschein.spec.ts.
    const proof = page.getByTestId("next-proof");
    await expect(
      proof.getByRole("heading", { name: "Claude Course", exact: true }),
    ).toBeVisible();
    await expect(
      proof.getByText("Offener Einstieg ohne Lernkonto", { exact: true }),
    ).toBeVisible();
    await expect(proof.getByRole("link")).toHaveCount(1);
    await expect(
      proof.locator("[data-open-course-alternative]"),
    ).toHaveCount(0);
    const startCta = proof.getByRole("link", {
      name: /^Nachweis beginnen\s*:\s*Claude Course$/,
    });
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", CLAUDE_START);

    await startCta.click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === CLAUDE_START && url.search === "" && url.hash === "",
    );
    await expect(page.locator('[data-lesson-mission="claude"]')).toBeVisible();
  });

  test("learning goals retain their course and disclose its available actions", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // The goal buttons are server-rendered but inert until React attaches
    // their handlers, and a click that lands first is swallowed with no error,
    // leaving the URL without its goal param. Wait for the hydration marker
    // before clicking rather than racing it.
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });

    const goals = page.getByRole("group", { name: "Lernziel auswählen" });
    await expect(goals).toBeVisible();
    await expect(goals.getByRole("button")).toHaveCount(4);

    const decisions = [
      {
        label: "Sicher starten",
        goal: "start",
        course: "KI-Führerschein",
        href: "/ki-fuehrerschein",
        alternative: { course: "Claude Course", href: CLAUDE_START },
      },
      {
        label: "Folgen beurteilen",
        goal: "judge",
        course: "KI und Gesellschaft",
        href: "/ki-und-gesellschaft",
        alternative: {
          course: "Data Science Fundamentals",
          href: "/kurse/open-source/data-science",
        },
      },
      {
        label: "Mit KI bauen",
        goal: "build",
        course: "AI-Native Arbeitskurs",
        href: "/ai-native",
        alternative: { course: "Claude Course", href: CLAUDE_START },
      },
      {
        label: "Daten entscheiden",
        goal: "data",
        course: "Data Engineering Fundamentals",
        href: "/kurse/open-source/data-engineering-fundamentals/home",
        alternative: null,
      },
    ] as const;

    const proof = page.getByTestId("next-proof");
    for (const { label, goal, course, href, alternative } of decisions) {
      const button = goals.getByRole("button", { name: label });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(goals.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(page).toHaveURL(new RegExp(`[?&]goal=${goal}(?:&|$)`));
      await expect(
        proof.getByRole("heading", { name: course, exact: true }),
      ).toBeVisible();

      // One primary action remains strict even when a separate open alternative
      // is valid. Never turn a selected unavailable course into another course.
      const primary = proof.locator("a:not([data-open-course-alternative])");
      const actionLabel = alternative
        ? "Hier nicht verfügbar · Kursübersicht"
        : "Nachweis beginnen";
      await expect(primary).toHaveCount(1);
      await expect(primary).toBeVisible();
      await expect(primary).toHaveAttribute("href", href);
      await expect(primary.locator("span").first()).toHaveText(actionLabel);
      await expect(primary).toHaveAccessibleName(
        new RegExp(`^${actionLabel}\\s*:\\s*${course}$`),
      );

      const openAlternative = proof.locator("[data-open-course-alternative]");
      await expect(proof.getByRole("link")).toHaveCount(alternative ? 2 : 1);
      await expect(openAlternative).toHaveCount(alternative ? 1 : 0);
      if (alternative) {
        await expect(openAlternative).toBeVisible();
        await expect(openAlternative).toHaveAccessibleName(
          `Offene Alternative ohne Lernkonto: ${alternative.course}`,
        );
        await expect(openAlternative).toHaveAttribute("href", alternative.href);
      }
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
    const allCourses = page.getByRole("region", { name: "Alle Kurse" });
    await expect(
      allCourses.getByRole("heading", {
        name: "KI-Führerschein",
        exact: true,
      }),
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

for (const route of ["/kurse", "/en/kurse"] as const) {
  test(`${route} renders the complete ten-course atlas`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const atlas = page.getByTestId("learning-atlas");
    await expect(atlas).toBeVisible();
    await expect(atlas.locator("[data-course-slug]")).toHaveCount(10);
    // The ledger brief's zero-image rule, restored. Cover thumbnails were
    // tried and removed: the artwork crops to mush at the size a dense row
    // allows, and the imported courses carry only site screenshots.
    await expect(atlas.locator("img")).toHaveCount(0);
    await expect(
      page.getByRole("group", {
        name: route.startsWith("/en/")
          ? "Choose a learning goal"
          : "Lernziel auswählen",
      }),
    ).toBeVisible();
  });
}
