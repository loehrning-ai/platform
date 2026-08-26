import { test, expect, type Page } from "@playwright/test";

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

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
}

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
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("KI verstehen");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual(
      [],
    );
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

    for (const title of NATIVE_TRACKS) {
      await expect(
        allCourses.getByRole("progressbar", {
          name: `Fortschritt ${title}`,
        }),
      ).toBeVisible();
    }
  });

  test("primary CTA links to the course track, which login-gates an anonymous visitor", async ({
    page,
  }) => {
    // "load" so the Next <Link> is hydrated before the click; clicking mid-
    // hydration cancels the client navigation and the URL stays on /kurse.
    await page.goto(ROUTE, { waitUntil: "load" });

    // Fresh visitor → one explicit next proof, href = startHref of the track.
    const startCta = page.getByRole("link", {
      name: /Nachweis beginnen.*KI-Führerschein/i,
    });
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", "/ki-fuehrerschein/kurs");

    // KI-Führerschein's /kurs* is login-gated (exception to policy D1 — see
    // src/lib/crawl/contract.ts PROTECTED_PATHS), so an anonymous click is
    // redirected to /login with next= pointing back at the hub.
    await startCta.click();
    await page.waitForURL(/\/login/);
    const url = new URL(page.url());
    expect(
      url.pathname,
      "CTA must land on /login for an anonymous visitor",
    ).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/ki-fuehrerschein/kurs");
    expect(url.searchParams.get("reason")).toBe("auth-not-configured");
  });

  test("learning goals reorder the path and expose one matching next proof", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const goals = page.getByRole("group", { name: "Lernziel auswählen" });
    await expect(goals).toBeVisible();

    const decisions = [
      ["Sicher starten", "start", "/ki-fuehrerschein/kurs"],
      ["Folgen beurteilen", "judge", "/ki-und-gesellschaft/kurs"],
      ["Mit KI bauen", "build", "/ai-native/kurs/modul_1"],
      [
        "Daten entscheiden",
        "data",
        "/kurse/open-source/data-engineering-fundamentals/home",
      ],
    ] as const;

    for (const [label, goal, href] of decisions) {
      const button = goals.getByRole("button", { name: label });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(new RegExp(`[?&]goal=${goal}(?:&|$)`));
      await expect(
        page.getByTestId("next-proof").getByRole("link"),
      ).toHaveAttribute("href", href);
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
  test(`${route} renders the complete image-free course ledger`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const atlas = page.getByTestId("learning-atlas");
    await expect(atlas).toBeVisible();
    await expect(atlas.locator("[data-course-slug]")).toHaveCount(10);
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
