import { test, expect, type Page } from "@playwright/test";

/**
 * /kurse hub smoke + interaction (regression coverage). The unified course hub:
 * four native German course-track cards with cross-course progress indicators
 * and direct learning-goal recommendations. Assertions target roles and stable
 * test IDs so a wording refresh stays green while a real regression (missing track cards,
 * dead "Kurs starten" CTA, broken progress dots, mobile overflow) fails.
 *
 * Complementary to courses.spec.ts, which already covers the imported
 * open-source lane, link visibility, and axe - this file adds the console-error
 * smoke, a real navigation click into a track, and the persona interaction.
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
    await expect(h1).toContainText("KI lernen");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("renders all four native course-track cards and their progress indicators", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    for (const title of NATIVE_TRACKS) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Der Lernpfad",
        exact: true,
      }),
    ).toBeVisible();

    for (const title of NATIVE_TRACKS) {
      await expect(
        page.getByRole("progressbar", { name: `Fortschritt ${title}` }),
      ).toBeVisible();
    }
  });

  test("primary CTA links to the course track, which login-gates an anonymous visitor", async ({
    page,
  }) => {
    // "load" so the Next <Link> is hydrated before the click; clicking mid-
    // hydration cancels the client navigation and the URL stays on /kurse.
    await page.goto(ROUTE, { waitUntil: "load" });

    // Fresh visitor → label "Kurs starten", href = startHref of the track.
    const startCta = page.getByRole("link", {
      name: /Kurs starten.*KI-Führerschein/i,
    });
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", "/ki-fuehrerschein/kurs");

    // KI-Führerschein's /kurs* is login-gated (exception to policy D1 — see
    // src/lib/crawl/contract.ts PROTECTED_PATHS), so an anonymous click is
    // redirected to /login with next= pointing back at the hub.
    await startCta.click();
    await page.waitForURL(/\/login/);
    const url = new URL(page.url());
    expect(url.pathname, "CTA must land on /login for an anonymous visitor").toBe(
      "/login",
    );
    expect(url.searchParams.get("next")).toBe("/ki-fuehrerschein/kurs");
    expect(url.searchParams.get("reason")).toBe("auth-not-configured");
  });

  test("learning-goal recommendations link directly to the matching courses", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("persona-filter")).toBeVisible();

    const recommendations = [
      [
        "Alltag und sicherer Einsatz: direkt zum Kurs KI-Führerschein",
        "/ki-fuehrerschein",
      ],
      [
        "Gesellschaft und Ethik verstehen: direkt zum Kurs KI und Gesellschaft",
        "/ki-und-gesellschaft",
      ],
      [
        "Regeln und Einordnen: direkt zum Kurs EU AI Act Kurs",
        "/eu-ai-act-kurs",
      ],
      [
        "Aktiv mit KI arbeiten: direkt zum Kurs AI-Native Arbeitskurs",
        "/ai-native",
      ],
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
