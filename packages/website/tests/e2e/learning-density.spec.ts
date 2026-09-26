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
    checkpoint: "/en/kurse/open-source/data-infrastructure/kurs/mental-model",
    nonCheckpoint: "/en/kurse/open-source/data-infrastructure/kurs/cap-pacelc",
  },
  {
    label: "Data Engineering Fundamentals",
    slug: "data-engineering-fundamentals",
    checkpoint: "/en/kurse/open-source/data-engineering-fundamentals/home",
    nonCheckpoint: "/en/kurse/open-source/data-engineering-fundamentals/fund",
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

test.describe("learning density and value contract", () => {
  test("Codex L01 puts the first prediction choice inside the initial mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLearningRoute(page, "/en/kurse/open-source/codex/kurs/L01");

    const mission = page.locator('[data-lesson-mission="codex"]');
    const firstChoice = mission
      .locator("[data-lesson-prediction-choice]")
      .first();
    const firstRadio = mission.getByRole("radio").first();

    await expectFullyInFirstViewportBand(
      page,
      firstChoice,
      "Codex L01 first prediction choice",
    );
    await continueLocally(page);
    await expect(firstRadio).toBeEnabled();
    await expectFullyInFirstViewportBand(
      page,
      firstChoice,
      "Codex L01 active first prediction choice",
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
      await expect(reference.locator("summary")).toBeVisible();
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

  // The workshop detail page follows workshop-standard 4.1 and
  // design-direction 7.2: the cover answers what the workshop is about and
  // where to start, a compact agenda follows, and the decision lab comes
  // right after it as a taste of the first act. The lab therefore no longer
  // starts in the first viewport (on a 390x664 phone the cover alone fills
  // it). What stays pinned: the cover's start action is inside the first
  // viewport, nothing but the agenda sits between the cover and the lab, and
  // the lab starts within two and a half viewports, which fails as soon as
  // material, case or any other section is moved above it.
  for (const route of WORKSHOP_ROUTES) {
    test(`${route} keeps its start action in the first viewport and the decision lab right after the agenda`, async ({
      page,
    }) => {
      await openLearningRoute(page, route);
      const start = page.locator("[data-cover-band] a").first();
      await expectFullyInFirstViewportBand(page, start, `${route} start action`);

      const lab = page.locator("[data-workshop-decision-lab]");
      await expect(lab, `${route} decision lab must render`).toBeVisible();
      const order = await lab.evaluate((element) => {
        const agenda = element.previousElementSibling;
        return {
          agendaHasRoute: Boolean(agenda?.querySelector("ol[data-route-mode]")),
          coverBeforeAgenda: Boolean(
            agenda?.previousElementSibling?.matches("[data-cover-band]"),
          ),
        };
      });
      expect(order.agendaHasRoute, `${route} agenda precedes the lab`).toBe(true);
      expect(order.coverBeforeAgenda, `${route} cover precedes the agenda`).toBe(true);

      const viewport = page.viewportSize()!;
      const bounds = await lab.boundingBox();
      expect(bounds, `${route} decision lab needs bounds`).not.toBeNull();
      expect(
        bounds!.y,
        `${route} decision lab must start within 2.5 viewports`,
      ).toBeLessThan(viewport.height * 2.5);
    });
  }
});
