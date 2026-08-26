import { expect, test, type Page } from "@playwright/test";
import {
  CANONICAL_SECTION_IDS,
  lessonCompletionEvidenceCheckpointId,
} from "../../src/lib/courses/completion";
import { checkpointKey } from "../../src/lib/progress/types";
import { settleFontsAndFrame } from "./fixtures/settle";

const LESSON_IDS = [
  "L01",
  "L02",
  "L03",
  "L04",
  "L05",
  "L06",
  "L07",
  "L08",
  "L09",
  "L10",
  "L11",
  "L12",
] as const;

const VIEWPORTS = [320, 390, 768, 1024, 1440] as const;
const UNIFIED_KEY = "loehrning-progress-v2";

const LOCALES = [
  {
    locale: "de",
    prefix: "",
    landingTitle: "Codex kontrolliert im Repository einsetzen.",
    firstLessonTitle: "Was Codex tatsächlich ist",
    completed: "Navigations-Checkpoint gespeichert",
  },
  {
    locale: "en",
    prefix: "/en",
    landingTitle: "Use Codex under explicit repository controls.",
    firstLessonTitle: "What Codex Actually Is",
    completed: "Navigation checkpoint saved",
  },
] as const;

function paths(prefix: string) {
  const landing = `${prefix}/kurse/open-source/codex`;
  const reader = `${landing}/kurs`;
  return {
    landing,
    reader,
    lessons: LESSON_IDS.map((lessonId) => `${reader}/${lessonId}`),
    certificate: `${reader}/zertifikat`,
    verification: `${landing}/verifizierung`,
  };
}

function completedCodexState(
  completedLessonIds: readonly string[] = LESSON_IDS,
) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    courses: {
      codex: {
        lessons: Object.fromEntries(
          completedLessonIds.map((id) => [
            id,
            {
              sectionsRead: [...CANONICAL_SECTION_IDS.codex[id]],
              quizScore: null,
              quizTotal: null,
              completed: true,
              exercisesCompleted: {},
            },
          ]),
        ),
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: now,
        lastActivity: now,
      },
    },
    xp: 50,
    checkpoints: Object.fromEntries(
      completedLessonIds.map((id) => [
        checkpointKey(id, lessonCompletionEvidenceCheckpointId("codex")),
        true,
      ]),
    ),
    badges: {},
    streak: { days: 1, last: now.slice(0, 10) },
    lastActivity: now,
  };
}

async function seedProgress(page: Page, state: object) {
  await page.addInitScript(
    ([key, serialized]) => {
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, serialized);
      }
    },
    [UNIFIED_KEY, JSON.stringify(state)] as const,
  );
}

function encodeCertificateHash(): string {
  return Buffer.from(
    JSON.stringify({
      n: "Ada Lovelace",
      s: null,
      m: "completion",
      d: "2026-07-01T10:00:00.000Z",
      c: "codex",
      v: 1,
    }),
    "utf8",
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function settle(page: Page) {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await settleFontsAndFrame(page);
}

async function continueLocally(page: Page, locale?: "de" | "en") {
  const button = page.getByRole("button", {
    name:
      locale === "de"
        ? "Lokal weiterlernen"
        : locale === "en"
          ? "Continue locally"
          : /^(?:Lokal weiterlernen|Continue locally)$/,
  });
  const gateAppeared = await button
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  if (gateAppeared) {
    await button.click({ timeout: 5_000 }).catch(async (error: unknown) => {
      // Ownership resolution can remove the optional gate between the
      // visibility probe and the click. Treat only that resolved state as
      // success; a still-visible, blocked control remains a real failure.
      if (await button.isVisible().catch(() => false)) throw error;
    });
    await expect(button).toBeHidden();
  }
}

async function openLessonReference(page: Page) {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await continueLocally(page);
  await expect(page.locator("[data-learning-owner-panel]")).toBeHidden({
    timeout: 15_000,
  });
  const reference = page.locator("details[data-lesson-reference]");
  await expect(reference).toHaveCount(1);
  await expect(reference).toBeVisible();
  await expect(reference).toHaveJSProperty("open", false);
  await reference.locator(":scope > summary").click();
  await expect(reference).toHaveJSProperty("open", true);
}

async function expectVisibleRouteHeading(
  page: Page,
  route: string,
  lessonRoutes: readonly string[],
) {
  if (lessonRoutes.includes(route)) {
    const headings = page.getByRole("heading", { level: 1 });
    await expect(headings, route).toHaveCount(1);
    await expect(headings, route).toBeVisible();
    return;
  }
  await expect(page.locator("h1").first(), route).toBeVisible();
}

function visibleLanguageSwitchLink(page: Page, name: RegExp) {
  return page
    .locator("[data-language-switch]:visible")
    .getByRole("link", { name })
    .first();
}

async function expectContainedLayout(page: Page, label: string) {
  const geometry = await page.evaluate(() => {
    const tolerance = 1;
    const viewportRight = window.innerWidth + tolerance;
    const escaped = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.right <= 0 ||
          rect.left >= window.innerWidth ||
          (rect.left >= -tolerance && rect.right <= viewportRight)
        ) {
          return false;
        }

        for (
          let ancestor = element.parentElement;
          ancestor && ancestor !== document.body;
          ancestor = ancestor.parentElement
        ) {
          const ancestorRect = ancestor.getBoundingClientRect();
          const overflowX = getComputedStyle(ancestor).overflowX;
          if (
            (overflowX === "auto" || overflowX === "scroll") &&
            ancestor.scrollWidth > ancestor.clientWidth + tolerance &&
            ancestorRect.left >= -tolerance &&
            ancestorRect.right <= viewportRight
          ) {
            return false;
          }
        }
        return true;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      });

    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      escaped,
    };
  });

  expect(
    geometry.bodyScrollWidth,
    `${label}: body width ${geometry.bodyScrollWidth}px exceeds ${geometry.innerWidth}px`,
  ).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(
    geometry.documentScrollWidth,
    `${label}: document width ${geometry.documentScrollWidth}px exceeds ${geometry.innerWidth}px`,
  ).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(
    geometry.escaped,
    `${label}: visible elements escape the viewport`,
  ).toEqual([]);
}

async function expectLocaleOwnedCodexLinks(
  page: Page,
  locale: "de" | "en",
  label: string,
) {
  const paths = await page
    .locator('a[href*="/kurse/open-source/codex"]')
    .evaluateAll((links) =>
      links
        .filter((link) => !link.closest("[data-language-switch]"))
        .map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
  expect(paths.length, `${label}: no internal Codex links`).toBeGreaterThan(0);
  for (const pathname of paths) {
    if (locale === "en") {
      expect(pathname, `${label}: English link lost /en`).toMatch(
        /^\/en\/kurse\/open-source\/codex(?:\/|$)/,
      );
    } else {
      expect(pathname, `${label}: German link gained /en`).toMatch(
        /^\/kurse\/open-source\/codex(?:\/|$)/,
      );
    }
  }
}

for (const width of VIEWPORTS) {
  for (const localeCase of LOCALES) {
    test(`Codex ${localeCase.locale} landing and all 12 lessons reflow at ${width}px`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium",
        "The explicit five-width matrix runs once in Chromium.",
      );
      test.setTimeout(240_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });

      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });

      const routeSet = paths(localeCase.prefix);
      for (const route of [
        routeSet.landing,
        routeSet.reader,
        ...routeSet.lessons,
      ]) {
        await test.step(route, async () => {
          browserErrors.length = 0;
          const response = await page.goto(route, {
            waitUntil: "domcontentloaded",
          });
          expect(response?.status(), route).toBe(200);
          await settle(page);
          if (routeSet.lessons.includes(route)) {
            await openLessonReference(page);
            await settle(page);
          }
          await expectVisibleRouteHeading(page, route, routeSet.lessons);
          await expect(page.locator("html"), route).toHaveAttribute(
            "lang",
            localeCase.locale,
          );
          await expectContainedLayout(
            page,
            `${localeCase.locale}/${width}/${route}`,
          );
          await expectLocaleOwnedCodexLinks(page, localeCase.locale, route);
          expect(browserErrors, `${route}: browser errors`).toEqual([]);
        });
      }

      await page.goto(routeSet.landing, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: localeCase.landingTitle,
        }),
      ).toBeVisible();
      await page.goto(routeSet.lessons[0], { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: localeCase.firstLessonTitle,
        }),
      ).toBeVisible();
    });
  }
}

test.describe("Codex locale continuity and record surfaces", () => {
  test("progress survives a full-document locale switch on the same lesson", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/kurse/open-source/codex/kurs/L01", {
      waitUntil: "domcontentloaded",
    });
    await settle(page);
    await continueLocally(page, "de");
    await openLessonReference(page);
    const uncheckedSections = page.getByRole("button", {
      name: "Abschnitt als geprüft bestätigen",
    });
    while ((await uncheckedSections.count()) > 0) {
      await uncheckedSections.first().click();
    }
    await page
      .getByRole("textbox", { name: "Entscheidung oder Änderung" })
      .fill("Ich prüfe diese Änderung in der Praxis.");
    const saveCheckpoint = page.getByRole("button", {
      name: "Checkpoint speichern",
    });
    await expect(saveCheckpoint).toBeEnabled();
    await saveCheckpoint.click();
    await expect(
      page.getByText("Navigations-Checkpoint gespeichert", { exact: true }),
    ).toBeVisible();

    const switchToEnglish = visibleLanguageSwitchLink(
      page,
      /Englische Oberfläche/,
    );
    await switchToEnglish.click();
    await expect(page).toHaveURL(/\/en\/kurse\/open-source\/codex\/kurs\/L01$/);
    await settle(page);
    await continueLocally(page, "en");
    await openLessonReference(page);
    await expect(
      page.getByText("Navigation checkpoint saved", { exact: true }),
    ).toBeVisible();
  });

  test("certificate eligibility and localized record pages use the same progress", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await seedProgress(page, completedCodexState());
    for (const localeCase of LOCALES) {
      const routeSet = paths(localeCase.prefix);
      const response = await page.goto(routeSet.certificate, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await settle(page);
      await continueLocally(page, localeCase.locale);
      await expect(page.locator("h1").first()).toBeVisible();
      await expectContainedLayout(page, `${localeCase.locale}/certificate`);
      await expectLocaleOwnedCodexLinks(
        page,
        localeCase.locale,
        routeSet.certificate,
      );
    }
  });

  test("valid and malformed verification fragments render honestly in both locales", async ({
    page,
  }) => {
    const hash = encodeCertificateHash();
    for (const localeCase of LOCALES) {
      const routeSet = paths(localeCase.prefix);
      await page.goto(`${routeSet.verification}#${hash}`, {
        waitUntil: "domcontentloaded",
      });
      await settle(page);
      await expect(page.getByText("Ada Lovelace")).toBeVisible();
      await expect(
        page.getByText(
          localeCase.locale === "de" ? "QR-Daten gelesen" : "QR data read",
          { exact: true },
        ),
      ).toBeVisible();
      await expectContainedLayout(page, `${localeCase.locale}/valid-record`);

      await page.goto(`${routeSet.verification}?case=invalid#not_base64!`, {
        waitUntil: "domcontentloaded",
      });
      await settle(page);
      await expect(
        page.getByRole("heading", {
          level: 2,
          name:
            localeCase.locale === "de"
              ? "Zertifikatcode nicht lesbar"
              : "Certificate code unreadable",
        }),
      ).toBeVisible();
    }
  });

  test("language switching preserves and decodes the certificate fragment byte-for-byte", async ({
    page,
  }) => {
    const hash = encodeCertificateHash();
    await page.goto(`/kurse/open-source/codex/verifizierung#${hash}`, {
      waitUntil: "domcontentloaded",
    });
    await settle(page);
    const englishLink = visibleLanguageSwitchLink(page, /Englische Oberfläche/);
    await expect(englishLink).toHaveAttribute(
      "href",
      `/en/kurse/open-source/codex/verifizierung#${hash}`,
    );
    await englishLink.click();
    await expect(page).toHaveURL(
      `/en/kurse/open-source/codex/verifizierung#${hash}`,
    );
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
  });

  test("representative long German widgets remain usable at 200 percent zoom", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit zoom audit runs once in Chromium.",
    );
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const lessonId of ["L03", "L04", "L06", "L07", "L10", "L12"]) {
      const route = `/kurse/open-source/codex/kurs/${lessonId}`;
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await settle(page);
      await openLessonReference(page);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      await expectContainedLayout(page, `de/zoom-200/${lessonId}`);
      const headings = page.getByRole("heading", { level: 1 });
      await expect(headings).toHaveCount(1);
      await expect(headings).toBeVisible();
    }
  });
});
