import { expect, test, type Locator, type Page } from "@playwright/test";

const TECHNICAL_COURSE_CASES = [
  {
    label: "Claude",
    slug: "claude",
    checkpoint: "/en/kurse/open-source/claude/kurs/mental-model",
    nonCheckpoint: "/en/kurse/open-source/claude/kurs/anatomy",
  },
  {
    label: "Codex",
    slug: "codex",
    checkpoint: "/kurse/open-source/codex/kurs/L01",
    nonCheckpoint: "/kurse/open-source/codex/kurs/L02",
  },
  {
    label: "Data Infrastructure",
    slug: "data-infrastructure",
    checkpoint:
      "/en/kurse/open-source/data-infrastructure/kurs/mental-model",
    nonCheckpoint:
      "/en/kurse/open-source/data-infrastructure/kurs/cap-pacelc",
  },
  {
    label: "Data Engineering Fundamentals",
    slug: "data-engineering-fundamentals",
    checkpoint:
      "/en/kurse/open-source/data-engineering-fundamentals/home",
    nonCheckpoint:
      "/en/kurse/open-source/data-engineering-fundamentals/fund",
  },
  {
    label: "Data Science",
    slug: "data-science",
    checkpoint: "/en/kurse/open-source/data-science/fund",
    nonCheckpoint: "/en/kurse/open-source/data-science/explore",
  },
  {
    label: "AI-Native Operator",
    slug: "ai-native-operator",
    checkpoint: "/en/kurse/open-source/ai-native-operator/mindset/1",
    nonCheckpoint: "/en/kurse/open-source/ai-native-operator/mindset/2",
  },
] as const;
const WORKSHOP_ROUTES = [
  "/workshops/ki-prognosen-einschaetzen",
  "/workshops/geschaeftsberichte-mit-ki-lesen",
] as const;

async function openLearningRoute(page: Page, route: string): Promise<void> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `HTTP status for ${route}`).toBe(200);

  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await expect(
    page.locator("[data-scroll-progress]"),
    `${route} must mount the global progress thread exactly once`,
  ).toHaveCount(1);
}

async function expectToStartInFirstViewportBand(
  page: Page,
  locator: Locator,
  label: string,
): Promise<void> {
  await expect(locator, `${label} must render`).toBeVisible();
  const viewport = page.viewportSize();
  const bounds = await locator.boundingBox();

  expect(viewport, `${label} needs a configured viewport`).not.toBeNull();
  expect(bounds, `${label} needs measurable bounds`).not.toBeNull();
  expect(bounds!.y, `${label} must not start above the document`).toBeGreaterThanOrEqual(0);
  expect(
    bounds!.y,
    `${label} must begin before the first viewport ends`,
  ).toBeLessThan(viewport!.height);
}

async function expectFullyInFirstViewportBand(
  page: Page,
  locator: Locator,
  label: string,
  maximumBottom = page.viewportSize()!.height,
): Promise<void> {
  await expectToStartInFirstViewportBand(page, locator, label);
  await expect
    .poll(async () => {
      const viewport = page.viewportSize();
      const bounds = await locator.boundingBox();
      if (!viewport || !bounds) return Number.POSITIVE_INFINITY;
      return bounds.y + bounds.height;
    }, { message: `${label} must fit completely inside the first viewport` })
    .toBeLessThanOrEqual(
      Math.min(maximumBottom, page.viewportSize()!.height),
    );
}

test.describe("learning density and value contract", () => {
  test("the course gallery starts in the first viewport", async ({ page }) => {
    await openLearningRoute(page, "/kurse");
    await expectToStartInFirstViewportBand(
      page,
      page.locator("[data-learning-gallery]"),
      "course gallery",
    );
  });

  for (const course of TECHNICAL_COURSE_CASES) {
    test(`${course.label} checkpoint starts with one mission, studio, and closed reference`, async ({
      page,
    }) => {
      await openLearningRoute(page, course.checkpoint);

      const mission = page.locator(
        `[data-lesson-mission="${course.slug}"]`,
      );
      await expect(mission).toHaveCount(1);
      await expectToStartInFirstViewportBand(
        page,
        mission,
        `${course.label} mission`,
      );
      await expect(page.locator("[data-course-project]")).toHaveCount(1);

      const reference = page.locator("details[data-lesson-reference]");
      await expect(reference).toHaveCount(1);
      await expect(reference.locator("summary")).toBeVisible();
      expect(
        await reference.evaluate(
          (details) => (details as HTMLDetailsElement).open,
        ),
      ).toBe(false);
    });

    test(`${course.label} non-checkpoint starts directly on one closed reference`, async ({
      page,
    }) => {
      await openLearningRoute(page, course.nonCheckpoint);

      await expect(page.locator("[data-lesson-mission]")).toHaveCount(0);
      await expect(page.locator("[data-course-project]")).toHaveCount(0);

      const content = page.locator("[data-lesson-shell-content]");
      const reference = page.locator("details[data-lesson-reference]");
      await expect(reference).toHaveCount(1);
      await expect(content.locator(":scope > *").first()).toHaveAttribute(
        "data-lesson-reference",
        "true",
      );
      await expect(reference.locator("summary")).toBeVisible();
      expect(
        await reference.evaluate(
          (details) => (details as HTMLDetailsElement).open,
        ),
      ).toBe(false);
      await expectToStartInFirstViewportBand(
        page,
        reference,
        `${course.label} reference`,
      );
    });
  }

  test("How Language Models Work starts with a self-check and closed evidence", async ({
    page,
  }) => {
    // The brand face is optional on a cold visit. Validate the denser fallback
    // path explicitly so a warm local font cache cannot hide a first-visit
    // overflow that Linux CI or a slow connection will expose.
    await page.route("**/*.woff2", (route) => route.abort());
    await page.setViewportSize({ width: 375, height: 667 });
    await openLearningRoute(
      page,
      "/en/wie-ki-funktioniert/lektion-1-vorhersage",
    );

    const check = page.getByRole("button", {
      name: "Compare with criteria",
    });
    await expectFullyInFirstViewportBand(
      page,
      check,
      "language-model check",
      640,
    );
    await expect(check).toBeDisabled();
    await expect(check).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("textbox", { name: "Your answer" }).fill("x");
    await expect(check).toBeEnabled();
    await check.click();

    const criteria = page.locator('[id^="check-"][id$="-content"]');
    await expect(criteria).toBeVisible();
    await expectFullyInFirstViewportBand(
      page,
      criteria,
      "language-model criteria",
    );

    const reference = page.locator("details[data-lesson-reference]");
    await expect(reference).toHaveCount(1);
    expect(
      await reference.evaluate(
        (details) => (details as HTMLDetailsElement).open,
      ),
    ).toBe(false);
  });

  for (const route of WORKSHOP_ROUTES) {
    test(`${route} starts its decision lab in the first viewport`, async ({
      page,
    }) => {
      await openLearningRoute(page, route);
      await expectToStartInFirstViewportBand(
        page,
        page.locator("[data-workshop-decision-lab]"),
        `${route} decision lab`,
      );
    });
  }
});
