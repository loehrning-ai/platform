import { expect, test, type Locator, type Page } from "@playwright/test";

const TECHNICAL_COURSE_CASES = [
  {
    label: "Data Infrastructure",
    slug: "data-infrastructure",
    phoneFoldHidden: true,
    checkpoint: "/en/kurse/open-source/data-infrastructure/kurs/mental-model",
    nonCheckpoint: "/en/kurse/open-source/data-infrastructure/kurs/cap-pacelc",
  },
  {
    label: "Data Engineering Fundamentals",
    slug: "data-engineering-fundamentals",
    phoneFoldHidden: false,
    checkpoint: "/en/kurse/open-source/data-engineering-fundamentals/home",
    nonCheckpoint: "/en/kurse/open-source/data-engineering-fundamentals/fund",
  },
  {
    label: "Data Science",
    slug: "data-science",
    phoneFoldHidden: true,
    checkpoint: "/en/kurse/open-source/data-science/fund",
    nonCheckpoint: "/en/kurse/open-source/data-science/explore",
  },
  {
    label: "AI-Native Operator",
    slug: "ai-native-operator",
    phoneFoldHidden: true,
    checkpoint: "/en/kurse/open-source/ai-native-operator/mindset/1",
    nonCheckpoint: "/en/kurse/open-source/ai-native-operator/mindset/2",
  },
] as const;
const WORKSHOP_ROUTES = [
  "/workshops/ki-prognosen-einschaetzen",
  "/workshops/geschaeftsberichte-mit-ki-lesen",
  "/workshops/datenbereitschaft-fuer-ki",
  "/workshops/esg-berichte-mit-ki",
  "/workshops/audit-vorbereitung-mit-ki",
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
  await expect(
    page.locator('[data-scroll-progress-fill="top"]'),
    `${route} must expose only the top progress indicator`,
  ).toHaveCount(1);
  await expect(page.locator('[data-scroll-progress-fill="side"]')).toHaveCount(
    0,
  );
}

async function continueLocally(page: Page): Promise<void> {
  const button = page.getByRole("button", {
    name: /^(?:Lokal weiterlernen|Continue locally)$/,
  });
  const gateAppeared = await button
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  // WebKit can keep this in-flow panel in a transient layout pass after it is
  // visible. The interaction itself is the contract, not pointer hit-testing.
  if (gateAppeared) {
    await button
      .click({ force: true, timeout: 5_000 })
      .catch(async (error: unknown) => {
        // Ownership resolution can remove the optional gate between the
        // visibility probe and the click. Only that resolved state is success.
        if (await button.isVisible().catch(() => false)) throw error;
      });
  }
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
  expect(
    bounds!.y,
    `${label} must not start above the document`,
  ).toBeGreaterThanOrEqual(0);
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
    .poll(
      async () => {
        const viewport = page.viewportSize();
        const bounds = await locator.boundingBox();
        if (!viewport || !bounds) return Number.POSITIVE_INFINITY;
        return bounds.y + bounds.height;
      },
      { message: `${label} must fit completely inside the first viewport` },
    )
    .toBeLessThanOrEqual(Math.min(maximumBottom, page.viewportSize()!.height));
}

// @quarantine: times out on shared runners (2026-10-19). Excluded from the
// nightly run too until fixed; delete the test if still tagged after 14 days.
test.describe("learning density and value contract @quarantine", () => {
  test("Data Infrastructure lesson 1 puts the first prediction choice inside the initial mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLearningRoute(
      page,
      "/en/kurse/open-source/data-infrastructure/kurs/mental-model",
    );

    const mission = page.locator(
      '[data-lesson-mission="data-infrastructure"]',
    );
    const firstChoice = mission
      .locator("[data-lesson-prediction-choice]")
      .first();
    const firstRadio = mission.getByRole("radio").first();

    await expectFullyInFirstViewportBand(
      page,
      firstChoice,
      "Data Infrastructure lesson 1 first prediction choice",
    );
    await continueLocally(page);
    await expect(firstRadio).toBeEnabled();
    await expectFullyInFirstViewportBand(
      page,
      firstChoice,
      "Data Infrastructure lesson 1 active first prediction choice",
    );
  });

  test("the course gallery starts in the first viewport", async ({ page }) => {
    await openLearningRoute(page, "/kurse");
    await expectToStartInFirstViewportBand(
      page,
      page.locator("[data-learning-gallery]"),
      "course gallery",
    );
  });

  for (const course of TECHNICAL_COURSE_CASES) {
    test(`${course.label} checkpoint starts with one mission, studio, and the open lesson text`, async ({
      page,
    }) => {
      await openLearningRoute(page, course.checkpoint);

      const mission = page.locator(`[data-lesson-mission="${course.slug}"]`);
      await expect(mission).toHaveCount(1);
      await expectToStartInFirstViewportBand(
        page,
        mission,
        `${course.label} mission`,
      );
      await expect(page.locator("[data-course-project]")).toHaveCount(1);

      const reference = page.locator("details[data-lesson-reference]");
      await expect(reference).toHaveCount(1);
      // Where a checkpoint's mission already repeats the objective
      // (phoneFoldHidden), the lesson text stays open below sm without a fold
      // control; from sm, and in the other readers, it can fold.
      const phone = (page.viewportSize()?.width ?? 1280) < 640;
      if (phone && course.phoneFoldHidden) {
        await expect(reference.locator("summary")).toBeHidden();
      } else {
        await expect(reference.locator("summary")).toBeVisible();
      }
      expect(
        await reference.evaluate(
          (details) => (details as HTMLDetailsElement).open,
        ),
      ).toBe(true);
    });

    test(`${course.label} non-checkpoint starts directly on the open lesson text`, async ({
      page,
    }) => {
      await openLearningRoute(page, course.nonCheckpoint);

      await expect(page.locator("[data-lesson-mission]")).toHaveCount(0);
      await expect(page.locator("[data-course-project]")).toHaveCount(0);

      const content = page.locator("[data-lesson-shell-content]");
      const reference = page.locator("details[data-lesson-reference]");
      await expect(reference).toHaveCount(1);
      // The lesson head (Kopflinie, title) and the open text form one block,
      // and that block is the first thing in the reader.
      await expect(content.locator(":scope > *").first()).toHaveAttribute(
        "data-lesson-reference-block",
        "true",
      );
      await expect(reference.locator("summary")).toBeVisible();
      expect(
        await reference.evaluate(
          (details) => (details as HTMLDetailsElement).open,
        ),
      ).toBe(true);
      await expectToStartInFirstViewportBand(
        page,
        reference,
        `${course.label} reference`,
      );
    });
  }

  // The workshop detail page follows workshop-standard section 5: the band is
  // the poster, the stage under it holds the two action cards (and the scene),
  // then comes the always-visible kit explainer (nothing collapses). There is
  // no agenda section, no red-line jump nav, no exercise band, no outcomes
  // list and no visible case section. What stays pinned: the first action card
  // starts inside the first screen (a phone shows at least 56px of it), the
  // stage is the first section after the band, and no decision lab renders.
  for (const route of WORKSHOP_ROUTES) {
    test(`${route} keeps its first action card in the first screen and the stage right after the band`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 664 });
      await openLearningRoute(page, route);
      const card = page.locator("[data-workshop-stage] [data-action-card]").first();
      await expect(card).toBeVisible();
      const bounds = await card.boundingBox();
      expect(bounds, `${route} card A bounds`).not.toBeNull();
      expect(bounds!.y + 56, `${route} shows 56px of card A in 390 x 664`).toBeLessThanOrEqual(664);

      await expect(page.locator("[data-workshop-decision-lab]")).toHaveCount(0);
      await expect(page.locator("[data-workshop-redline], #ablauf, ol[data-route-mode]")).toHaveCount(0);
      await expect(page.locator("[data-workshop-brief], [data-workshop-need], #workshop-outcomes-heading")).toHaveCount(0);
      const stage = page.locator("[data-workshop-stage]");
      await expect(stage, `${route} stage must render`).toBeVisible();
      const order = await stage.evaluate((element) => ({
        bandBeforeStage: Boolean(element.previousElementSibling?.matches("[data-cover-band]")),
        cards: element.querySelectorAll("[data-action-card]").length,
        explainerAfter: Boolean(element.nextElementSibling?.matches("[data-stage-explainer]")),
        visibleCaseSection: Boolean(
          [...document.querySelectorAll("article > section")].some((section) => section.id === "fall"),
        ),
      }));
      expect(order.bandBeforeStage, `${route} band precedes the stage`).toBe(true);
      expect(order.cards, `${route} has two action cards`).toBe(2);
      expect(order.explainerAfter, `${route} kit explainer follows the stage`).toBe(true);
      expect(order.visibleCaseSection, `${route} has no visible case section`).toBe(false);
    });
  }
});
