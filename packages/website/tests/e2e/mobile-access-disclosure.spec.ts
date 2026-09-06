import { expect, test, type Locator, type Page } from "@playwright/test";
import { settleFontsAndFrame } from "./fixtures/settle";
import {
  collectBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/** Provider-free build contract; no authentication or provider responses are mocked. */
const COPY = {
  de: {
    open: "Ohne Lernkonto",
    recommendation: "Offener Einstieg ohne Lernkonto",
    unavailable: "Hier nicht verfügbar",
    overviewAction: "Hier nicht verfügbar · Kursübersicht",
    alternative: "Offene Alternative ohne Lernkonto: Claude Course",
    foundation: "KI-Führerschein",
  },
  en: {
    open: "No account needed",
    recommendation: "Open starting point without an account",
    unavailable: "Unavailable here",
    overviewAction: "Unavailable here · Course overview",
    alternative: "Open alternative without an account: Claude Course",
    foundation: "AI Fundamentals",
  },
} as const;

async function openHydrated(page: Page, route: string): Promise<void> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response?.status(), route).toBe(200);
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await settleFontsAndFrame(page);
}

/** Visibility alone does not detect clipped text or a fixed bar covering a link. */
async function expectReadable(target: Locator): Promise<void> {
  await expect(target).toBeVisible();
  const geometry = await target.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const text = range.getBoundingClientRect();
    const header = document
      .querySelector("[data-nav-header-row]")
      ?.getBoundingClientRect();
    const bar = document
      .querySelector("[data-mobile-tab-bar]")
      ?.getBoundingClientRect();
    const point = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    return {
      left: box.left,
      right: box.right,
      top: box.top,
      bottom: box.bottom,
      textLeft: text.left,
      textRight: text.right,
      textTop: text.top,
      textBottom: text.bottom,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      viewportWidth: document.documentElement.clientWidth,
      headerBottom: header && header.height > 0 ? header.bottom : 0,
      visibleBottom: bar && bar.height > 0 ? bar.top : window.innerHeight,
      unobscured: point === element || element.contains(point),
    };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.headerBottom);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.visibleBottom);
  expect(geometry.textLeft).toBeGreaterThanOrEqual(geometry.left - 1);
  expect(geometry.textRight).toBeLessThanOrEqual(geometry.right + 1);
  expect(geometry.textTop).toBeGreaterThanOrEqual(geometry.top - 1);
  expect(geometry.textBottom).toBeLessThanOrEqual(geometry.bottom + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.unobscured).toBe(true);
}

async function expectTapTarget(target: Locator): Promise<void> {
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function expectDestination(page: Page, pathname: string): Promise<void> {
  await expect(page).toHaveURL(
    (url) => url.pathname === pathname && url.search === "" && url.hash === "",
  );
  await expect(page.locator("main")).toBeVisible();
}

for (const locale of ["de", "en"] as const) {
  for (const width of [320, 390] as const) {
    test.describe(`provider-free access: ${locale} at ${width}px`, () => {
      const copy = COPY[locale];
      const prefix = locale === "en" ? "/en" : "";
      const lesson = `${prefix}/kurse/open-source/claude/kurs/mental-model`;
      const overview = `${prefix}/ki-fuehrerschein`;
      const atlasRoute = `${prefix}/kurse`;

      test.beforeEach(async ({ page }, testInfo) => {
        test.skip(
          !["mobile-chromium", "mobile-webkit"].includes(testInfo.project.name),
          "The explicit phone matrix runs in both mobile browser engines.",
        );
        test.setTimeout(90_000);
        await page.setViewportSize({ width, height: 844 });
        await page.addInitScript(() => localStorage.clear());
      });

      test("home discloses its first open task before the first tap", async ({
        page,
      }, testInfo) => {
        const errors = collectBrowserErrors(page);
        await openHydrated(page, prefix || "/");
        const card = page.locator("[data-home-continue-card]");
        await expect(card).toHaveAttribute("data-home-continue-card", "start");
        await expect(card).toHaveAttribute("data-home-course-access", "open");
        await expect(card).toHaveAttribute("href", lesson);
        await expect(card).toContainText("Claude Course");
        const disclosure = card.locator("[data-home-access-label]");
        await expect(disclosure).toHaveText(copy.open);
        // No scroll before these checks: the first decision must already fit.
        await expectReadable(disclosure);
        await expectTapTarget(card);
        const cardBox = await card.boundingBox();
        expect(cardBox!.height).toBe(76);
        await page.screenshot({
          path: testInfo.outputPath("home-before-tap.png"),
        });
        await testInfo.attach("home-before-tap", {
          path: testInfo.outputPath("home-before-tap.png"),
          contentType: "image/png",
        });
        await card.tap();
        await expectDestination(page, lesson);
        await expect(
          page.locator('[data-lesson-mission="claude"]'),
        ).toBeVisible();
        expect(meaningfulBrowserErrors(errors)).toEqual([]);
      });

      test("the unchosen atlas default offers a disclosed open course", async ({
        page,
      }, testInfo) => {
        const errors = collectBrowserErrors(page);
        await openHydrated(page, atlasRoute);
        const proof = page.getByTestId("next-proof");
        await expect(
          proof.getByRole("heading", { name: "Claude Course" }),
        ).toBeVisible();
        await expect(
          proof.getByText(copy.recommendation, { exact: true }),
        ).toBeVisible();
        await expect(
          proof.locator("[data-open-course-alternative]"),
        ).toHaveCount(0);
        const unavailable = page.locator(
          '[data-course-slug="ki-fuehrerschein"]',
        );
        await expect(unavailable).toHaveAttribute(
          "data-course-access",
          "unavailable",
        );
        await expect(
          unavailable.locator("[data-course-access-label]"),
        ).toHaveText(copy.unavailable);
        const action = proof.getByRole("link");
        await expect(action).toHaveAttribute("href", lesson);
        await proof.scrollIntoViewIfNeeded();
        await settleFontsAndFrame(page);
        await expectReadable(
          proof.getByText(copy.recommendation, { exact: true }),
        );
        await expectReadable(action.locator("span").first());
        await expectTapTarget(action);
        await page.screenshot({
          path: testInfo.outputPath("atlas-default-before-tap.png"),
        });
        await testInfo.attach("atlas-default-before-tap", {
          path: testInfo.outputPath("atlas-default-before-tap.png"),
          contentType: "image/png",
        });
        await action.tap();
        await expectDestination(page, lesson);
        await expect(
          page.locator('[data-lesson-mission="claude"]'),
        ).toBeVisible();
        expect(meaningfulBrowserErrors(errors)).toEqual([]);
      });

      test("an explicit start goal retains its course and names the open alternative", async ({
        page,
      }, testInfo) => {
        const errors = collectBrowserErrors(page);
        const explicitRoute = `${atlasRoute}?goal=start`;
        await openHydrated(page, explicitRoute);
        await expect(
          page.locator('[data-learning-goal="start"]'),
        ).toHaveAttribute("aria-pressed", "true");
        const proof = page.getByTestId("next-proof");
        await expect(
          proof.getByRole("heading", { name: copy.foundation, exact: true }),
        ).toBeVisible();
        const action = proof.getByRole("link").first();
        await expect(action).toHaveAttribute("href", overview);
        await expect(action).toContainText(copy.overviewAction);
        const alternative = proof.locator("[data-open-course-alternative]");
        await expect(alternative).toHaveText(copy.alternative);
        await expect(alternative).toHaveAttribute("href", lesson);
        await proof.scrollIntoViewIfNeeded();
        await settleFontsAndFrame(page);
        await expectReadable(action.locator("span").first());
        await expectReadable(alternative);
        await expectTapTarget(action);
        await expectTapTarget(alternative);
        await page.screenshot({
          path: testInfo.outputPath("atlas-explicit-before-tap.png"),
        });
        await testInfo.attach("atlas-explicit-before-tap", {
          path: testInfo.outputPath("atlas-explicit-before-tap.png"),
          contentType: "image/png",
        });

        await action.tap();
        await expectDestination(page, overview);
        await expect(page.locator("main h1")).toBeVisible();
        await openHydrated(page, explicitRoute);
        await expect(
          proof.getByRole("heading", { name: copy.foundation, exact: true }),
        ).toBeVisible();
        await alternative.tap();
        await expectDestination(page, lesson);
        await expect(
          page.locator('[data-lesson-mission="claude"]'),
        ).toBeVisible();
        expect(meaningfulBrowserErrors(errors)).toEqual([]);
      });
    });
  }
}
