import { test, expect, type Page } from "@playwright/test";
import { CANONICAL_LESSON_IDS } from "../../src/lib/courses/completion";
import {
  MODULE_IDS,
  MODULE_LESSON_COUNTS,
} from "../../src/lib/ai-native-operator/types";

/**
 * AI-Native Operator Course golden path: home -> module
 * -> lesson -> checkpoint -> quiz -> certificate -> QR verify, in one spec.
 * Mirrors route-claude.spec.ts/route-codex.spec.ts's established pattern,
 * with two deliberate differences reflecting this course's own structure:
 *   - module+lesson nesting (no flat lesson-id scheme): routes are
 *     /kurse/open-source/ai-native-operator/[moduleId]/[lessonNum].
 *   - the checkpoint leg exercises a reflect-box widget (this course's most
 *     common exercise kind, 23 of 30) rather than a quiz widget, since
 *     mindset/1 (the course's first lesson) has a reflect-box exercise, not
 *     an embedded per-lesson quiz — the 9 knowledge-check lessons carry the
 *     quiz widgets instead, exercised separately via the /quiz route.
 * Not yet executed in this environment as part of writing this spec — the
 * live `/qa` browser pass (this plan's own stage 13) exercises the same
 * flow directly against a running dev server instead.
 */

const COURSE_ROOT = "/kurse/open-source/ai-native-operator";
const LANDING = `/en${COURSE_ROOT}`;
const MODULE_ROUTE = `/en${COURSE_ROOT}/mindset`;
const LESSON_ROUTE = `/en${COURSE_ROOT}/mindset/1`;
const FINAL_LESSON_ROUTE = `/en${COURSE_ROOT}/measurement/4`;
const QUIZ_ROUTE = `/en${COURSE_ROOT}/quiz`;
const CERT_ROUTE = `/en${COURSE_ROOT}/zertifikat`;
const VERIFY_ROUTE = `/en${COURSE_ROOT}/verifizierung`;

const VIEWPORT_WIDTHS = [320, 390, 768, 1024, 1440] as const;
const LOCALES = [
  {
    locale: "de",
    prefix: "",
    landingMarker: "AI-Native Operator",
    firstLessonTitle: "Erst die Aufgabe wählen, dann das Werkzeug",
    invalidVerificationTitle: "Zertifikatcode nicht lesbar",
  },
  {
    locale: "en",
    prefix: "/en",
    landingMarker: "AI-Native Operator",
    firstLessonTitle: "Choose tasks before choosing tools",
    invalidVerificationTitle: "Certificate code unreadable",
  },
] as const;

const UNIFIED_KEY = "loehrning-progress-v2";

/** A canonical lesson-state payload with an optional current-format quiz pass. */
function completedAiNativeOperatorState(
  quizPassed: boolean,
  completedLessons = CANONICAL_LESSON_IDS["ai-native-operator"].length,
) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    courses: {
      "ai-native-operator": {
        lessons: Object.fromEntries(
          CANONICAL_LESSON_IDS["ai-native-operator"]
            .slice(0, completedLessons)
            .map((lessonId) => [
              lessonId,
              {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            ]),
        ),
        workshopQuiz: {
          passed: quizPassed,
          score: quizPassed ? 0.9 : 0,
          completedAt: quizPassed ? now : null,
        },
        capstoneSubmitted: false,
        startedAt: now,
        lastActivity: now,
      },
    },
    xp: 50,
    checkpoints: {},
    badges: {},
    streak: { days: 1, last: now.slice(0, 10) },
    lastActivity: now,
  };
}

function passedAiNativeOperatorState() {
  return completedAiNativeOperatorState(true);
}

async function seedProgress(page: Page, value: object) {
  await page.addInitScript(
    ([key, json]) => {
      window.localStorage.setItem(key, json);
    },
    [UNIFIED_KEY, JSON.stringify(value)] as const,
  );
}

function localizedRoutes(prefix: string) {
  const root = `${prefix}${COURSE_ROOT}`;
  const modules = MODULE_IDS.map((moduleId) => `${root}/${moduleId}`);
  const lessons = MODULE_IDS.flatMap((moduleId) =>
    Array.from(
      { length: MODULE_LESSON_COUNTS[moduleId] },
      (_, index) => `${root}/${moduleId}/${index + 1}`,
    ),
  );
  const verificationHash = encodeCertHash({
    n: "Ada Lovelace",
    s: 91,
    m: "quiz",
    d: "2026-07-21T10:00:00.000Z",
    c: "ai-native-operator",
    v: 1,
  });
  return {
    root,
    modules,
    lessons,
    quiz: `${root}/quiz`,
    certificate: `${root}/zertifikat`,
    verificationValid: `${root}/verifizierung#${verificationHash}`,
    verificationInvalid: `${root}/verifizierung#not_base64!`,
    moduleNotFound: `${root}/not-a-module`,
    lessonNotFound: `${root}/mindset/999`,
  };
}

async function settleFullPage(page: Page) {
  await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = Math.max(320, Math.floor(window.innerHeight * 0.75));
    // The bound matters. scrollHeight is re-read every iteration, and scrolling
    // is what makes lazy widgets load, so on a page that grows as it is walked
    // the loop's own exit condition keeps receding. That never returns, and
    // because it hangs inside page.evaluate it surfaces as a silent test
    // timeout rather than an error. 60 steps is far past any real page.
    for (
      let y = 0, steps = 0;
      y < document.documentElement.scrollHeight && steps < 60;
      y += step, steps += 1
    ) {
      window.scrollTo(0, y);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }
    window.scrollTo(0, 0);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect(
    page.locator(
      '[aria-label="Widget wird geladen"], [aria-label="Widget is loading"]',
    ),
  ).toHaveCount(0, { timeout: 15_000 });
}

async function expectOperatorGeometryContained(page: Page, context: string) {
  const geometry = await page.evaluate(() => {
    const root = document.querySelector("main") ?? document.body;
    const isVisible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 1 &&
        rect.height > 1
      );
    };
    const describe = (element: Element) => ({
      tag: element.tagName.toLowerCase(),
      className:
        typeof element.className === "string"
          ? element.className.slice(0, 120)
          : "",
      text: (element.textContent ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120),
    });
    const descendants = Array.from(root.querySelectorAll("*"));
    const scrollContainerFor = (element: Element) => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== root) {
        const style = getComputedStyle(ancestor);
        if (["auto", "scroll"].includes(style.overflowX)) return ancestor;
        ancestor = ancestor.parentElement;
      }
      return null;
    };

    const viewportOffenders = descendants
      .filter((element) => {
        if (!isVisible(element) || element.closest(".sr-only")) return false;
        if (scrollContainerFor(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      })
      .map(describe);

    const clippedContent = descendants
      .filter((element) => {
        if (!(element instanceof HTMLElement) || !isVisible(element)) {
          return false;
        }
        if (
          element.closest(".sr-only") ||
          scrollContainerFor(element) ||
          element.matches("input, textarea, select")
        ) {
          return false;
        }
        const style = getComputedStyle(element);
        return (
          ["hidden", "clip"].includes(style.overflowX) &&
          element.clientWidth > 0 &&
          element.scrollWidth > element.clientWidth + 1
        );
      })
      .map(describe);

    const horizontalScrollers = descendants
      .filter((element): element is HTMLElement => {
        if (!(element instanceof HTMLElement) || !isVisible(element)) {
          return false;
        }
        const style = getComputedStyle(element);
        return (
          ["auto", "scroll"].includes(style.overflowX) &&
          element.scrollWidth > element.clientWidth + 1
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          ...describe(element),
          role: element.getAttribute("role"),
          ariaLabel: element.getAttribute("aria-label"),
          tabIndex: element.tabIndex,
          left: rect.left,
          right: rect.right,
        };
      });

    const focusableOffenders = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    )
      .filter((element) => {
        if (!isVisible(element)) return false;
        const scroller = scrollContainerFor(element);
        if (scroller && element !== scroller) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      })
      .map(describe);

    return {
      viewportWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportOffenders,
      clippedContent,
      horizontalScrollers,
      focusableOffenders,
    };
  });

  expect(geometry.bodyScrollWidth, context).toBeLessThanOrEqual(
    geometry.viewportWidth + 1,
  );
  expect(geometry.documentScrollWidth, context).toBeLessThanOrEqual(
    geometry.viewportWidth + 1,
  );
  expect(geometry.viewportOffenders, context).toEqual([]);
  expect(geometry.clippedContent, context).toEqual([]);
  expect(geometry.focusableOffenders, context).toEqual([]);
  for (const scroller of geometry.horizontalScrollers) {
    expect(scroller.role, context).toBe("region");
    expect(scroller.ariaLabel, context).toBeTruthy();
    expect(scroller.tabIndex, context).toBe(0);
    expect(scroller.left, context).toBeGreaterThanOrEqual(-1);
    expect(scroller.right, context).toBeLessThanOrEqual(
      geometry.viewportWidth + 1,
    );
  }
}

async function expectLocaleOwnedOperatorLinks(
  page: Page,
  locale: "de" | "en",
  context: string,
) {
  const paths = await page
    .locator('a[href*="/kurse/open-source/ai-native-operator"]')
    .evaluateAll((links) =>
      links
        .filter((link) => !link.closest("[data-language-switch]"))
        .map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
  for (const pathname of paths) {
    expect(pathname, `${context}: locale escaped`).toMatch(
      locale === "en"
        ? /^\/en\/kurse\/open-source\/ai-native-operator(?:\/|$)/
        : /^\/kurse\/open-source\/ai-native-operator(?:\/|$)/,
    );
  }
}

async function expectLocalizedOperatorChrome(
  page: Page,
  locale: "de" | "en",
  context: string,
) {
  const chrome = (
    await page
      .locator(
        "button, label, summary, [role='status'], [aria-label], [data-widget-frame] > div:first-child",
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => !element.closest("pre, code"))
          .map((element) =>
            [
              element.textContent ?? "",
              element.getAttribute("aria-label") ?? "",
            ].join(" "),
          )
          .join("\n"),
      )
  ).replace(/\s+/g, " ");
  const forbidden =
    locale === "de"
      ? /(?:Loading progress|Complete lesson|Lesson completed|Next lesson|Open module navigation|Close module navigation|Answer options|Quick check|Reflection|Assessment|Fill in the slots|selected)/i
      : /(?:Fortschritt wird geladen|Lektion abschließen|Lektion abgeschlossen|Nächste Lektion|Modulnavigation öffnen|Modulnavigation schließen|Antwortmöglichkeiten|Kurze Prüfung|Reflexion|Einschätzung|Felder ausfüllen|gewählt)/i;
  expect(chrome, `${context}: foreign-language interface chrome`).not.toMatch(
    forbidden,
  );
}

/** Encode a certificate payload exactly like generateCertificatePdf's QR does. */
function encodeCertHash(payload: {
  n: string;
  s: number;
  m: "quiz";
  d: string;
  c: "ai-native-operator";
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

for (const width of VIEWPORT_WIDTHS) {
  for (const localeCase of LOCALES) {
    test(`AI-Native Operator ${localeCase.locale}: landing, 9 modules, 39 lessons, assessment and recovery states reflow at ${width}px`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium",
        "The explicit bilingual five-width matrix runs once in Chromium.",
      );
      test.setTimeout(600_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await seedProgress(page, passedAiNativeOperatorState());

      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });

      const routeSet = localizedRoutes(localeCase.prefix);
      const auditedRoutes = [
        { path: routeSet.root, status: 200 },
        ...routeSet.modules.map((path) => ({ path, status: 200 })),
        ...routeSet.lessons.map((path) => ({ path, status: 200 })),
        { path: routeSet.quiz, status: 200 },
        { path: routeSet.certificate, status: 200 },
        { path: routeSet.verificationValid, status: 200 },
        { path: routeSet.verificationInvalid, status: 200 },
        { path: routeSet.moduleNotFound, status: 404 },
        { path: routeSet.lessonNotFound, status: 404 },
      ] as const;

      expect(routeSet.modules).toHaveLength(9);
      expect(routeSet.lessons).toHaveLength(39);

      for (const route of auditedRoutes) {
        await test.step(route.path, async () => {
          browserErrors.length = 0;
          const response = await page.goto(route.path, {
            waitUntil: "domcontentloaded",
          });
          if (response) {
            expect(
              response.status(),
              `${localeCase.locale}/${width}/${route.path}`,
            ).toBe(route.status);
          } else {
            // Hash-only navigation is resolved in the current document and
            // therefore has no HTTP response. The base verification route was
            // already checked immediately before this recovery-state case.
            const actual = new URL(page.url());
            const target = new URL(route.path, actual);
            expect(
              actual.pathname,
              `${localeCase.locale}/${width}/${route.path}: pathname`,
            ).toBe(target.pathname);
            expect(
              actual.hash,
              `${localeCase.locale}/${width}/${route.path}: hash`,
            ).toBe(target.hash);
          }
          await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
          await settleFullPage(page);
          await expect(page.locator("html"), route.path).toHaveAttribute(
            "lang",
            localeCase.locale,
          );
          await expect(page.locator("h1").first(), route.path).toBeVisible();
          await expect(
            page.locator(
              "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
            ),
          ).toHaveCount(0);
          await expectOperatorGeometryContained(
            page,
            `${localeCase.locale}/${width}/${route.path}`,
          );
          await expectLocaleOwnedOperatorLinks(
            page,
            localeCase.locale,
            `${localeCase.locale}/${width}/${route.path}`,
          );
          await expectLocalizedOperatorChrome(
            page,
            localeCase.locale,
            `${localeCase.locale}/${width}/${route.path}`,
          );
          const unexpectedBrowserErrors =
            route.status === 404
              ? browserErrors.filter(
                  (message) =>
                    !/Failed to load resource: the server responded with a status of 404 \(Not Found\)/.test(
                      message,
                    ),
                )
              : browserErrors;
          expect(
            unexpectedBrowserErrors,
            `${route.path}: browser errors`,
          ).toEqual([]);
        });
      }

      await page.goto(routeSet.root, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: localeCase.landingMarker,
        }),
      ).toBeVisible();
      await page.goto(routeSet.lessons[0], {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: localeCase.firstLessonTitle,
        }),
      ).toBeVisible();
      await page.goto(routeSet.verificationInvalid, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", {
          name: localeCase.invalidVerificationTitle,
        }),
      ).toBeVisible();
    });
  }
}

test.describe("AI-Native Operator Course golden path", () => {
  test("home: landing renders and links into Module 01", async ({ page }) => {
    const res = await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const startCta = page.locator(`a[href="${LESSON_ROUTE}"]`).first();
    await expect(startCta).toBeVisible();
  });

  test("home: incomplete learners see assessment requirements without gated links", async ({
    page,
  }) => {
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute("data-assessment-state", "locked");
    await expect(assessment.getByRole("status")).toContainText(
      "Complete all 39 lessons",
    );
    await expect(assessment.getByText("Quiz locked")).toBeVisible();
    await expect(assessment.locator(`a[href="${QUIZ_ROUTE}"]`)).toHaveCount(0);
    await expect(assessment.locator(`a[href="${CERT_ROUTE}"]`)).toHaveCount(0);
  });

  test("final lesson: continuation cannot bypass an uncompleted final lesson", async ({
    page,
  }) => {
    await seedProgress(page, completedAiNativeOperatorState(false, 38));
    await page.goto(FINAL_LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });

    await page
      .getByRole("link", { name: "Continue to final assessment" })
      .click();

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute("data-assessment-state", "locked");
    await expect(assessment.getByRole("status")).toContainText(
      "1 lesson remaining",
    );
    await expect(assessment.locator(`a[href="${QUIZ_ROUTE}"]`)).toHaveCount(0);
    await expect(assessment.locator(`a[href="${CERT_ROUTE}"]`)).toHaveCount(0);
  });

  test("final lesson: the continuation reaches the anchored assessment and quiz", async ({
    page,
  }) => {
    await seedProgress(page, completedAiNativeOperatorState(false));
    await page.goto(FINAL_LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });

    const continueToAssessment = page.getByRole("link", {
      name: "Continue to final assessment",
    });
    await expect(continueToAssessment).toHaveAttribute(
      "href",
      `${LANDING}#final-assessment`,
    );
    await continueToAssessment.click();
    await expect(page).toHaveURL(new RegExp(`${LANDING}#final-assessment$`));

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute("data-assessment-state", "ready");
    const startQuiz = assessment.getByRole("link", {
      name: "Start workshop quiz",
    });
    await expect(startQuiz).toHaveAttribute("href", QUIZ_ROUTE);
    await startQuiz.click();
    await expect(page).toHaveURL(new RegExp(`${QUIZ_ROUTE}$`));
    await expect(page.getByTestId("workshop-quiz-header")).toBeVisible();
  });

  test("home: passed learners can retake or follow the certificate link", async ({
    page,
  }) => {
    await seedProgress(page, passedAiNativeOperatorState());
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute("data-assessment-state", "passed");
    await expect(
      assessment.getByRole("link", { name: "Retake quiz" }),
    ).toHaveAttribute("href", QUIZ_ROUTE);
    const certificate = assessment.getByRole("link", {
      name: "Download Course Completion Record",
    });
    await expect(certificate).toHaveAttribute("href", CERT_ROUTE);
    await certificate.click();
    await expect(page).toHaveURL(new RegExp(`${CERT_ROUTE}$`));
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("module: the module hub links into lesson 1", async ({ page }) => {
    const res = await page.goto(MODULE_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });

    const lessonLink = page.locator(`a[href="${LESSON_ROUTE}"]`).first();
    await expect(lessonLink).toBeVisible();
    await lessonLink.click();
    await expect(page).toHaveURL(new RegExp(`${LESSON_ROUTE}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("checkpoint: typing into mindset/1's reflect-box exercise awards a checkpoint", async ({
    page,
  }) => {
    const res = await page.goto(LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });

    // mindset/1's exercise (modules/m01-mindset.ts): a reflect-box widget
    // with the source's own prompt text.
    await expect(
      page.getByText(
        "List three tasks from this week that took more than 30 minutes",
        { exact: false },
      ),
    ).toBeVisible();

    // The draft only persists once Auth identity resolves: until then the
    // owner namespace is "unknown" and writes are discarded by design, which
    // also resets the textarea. Retry the entry until it sticks so the
    // checkpoint assertion below measures the widget, not that race.
    const reflectBox = page.getByRole("textbox", { name: "Reflect" });
    await expect(async () => {
      await reflectBox.fill("Drafted the weekly status update by hand.");
      await expect(reflectBox).toHaveValue(
        "Drafted the weekly status update by hand.",
        { timeout: 2_000 },
      );
    }).toPass({ timeout: 15_000 });

    const widgetFrame = page.locator(
      '[data-widget-kind="reflect-box"] [data-widget-frame]',
    );
    await expect(widgetFrame).toHaveAttribute("data-done", "1", {
      timeout: 10_000,
    });
    await expect
      .poll(
        () =>
          page.evaluate((key) => {
            const raw = window.localStorage.getItem(key);
            if (!raw) return false;
            const parsed = JSON.parse(raw) as {
              checkpoints?: Record<string, boolean>;
            };
            return parsed.checkpoints?.["mindset/1::exercise"] === true;
          }, UNIFIED_KEY),
        { timeout: 10_000 },
      )
      .toBe(true);
  });

  test("quiz: direct access stays locked until every lesson is complete", async ({
    page,
  }) => {
    const res = await page.goto(QUIZ_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Complete every lesson first" }),
    ).toBeVisible();
  });

  test("certificate: completed lessons plus a passed quiz unlock the surface", async ({
    page,
  }) => {
    await seedProgress(page, passedAiNativeOperatorState());
    const res = await page.goto(CERT_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("QR verify: a real certificate payload round-trips through the verification page", async ({
    page,
  }) => {
    const hash = encodeCertHash({
      n: "Ada Lovelace",
      s: 91,
      m: "quiz",
      d: "2026-07-21T10:00:00.000Z",
      c: "ai-native-operator",
      v: 1,
    });
    await page.goto(`${VERIFY_ROUTE}#${hash}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Course completion record: AI-Native Operator",
      }),
    ).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
