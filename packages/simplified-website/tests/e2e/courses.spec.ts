import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { IMPORTED_COURSE_CATALOG } from "../../src/lib/courses/catalog";

/**
 * shared course architecture — E2E coverage for the new course
 * surfaces:
 *   1. `/kurse` unified hub renders the native progression and imported lane.
 *   2. AI-Native has a public, non-sales preview page.
 *   3. AI-Native course internals, quiz, certificate form, and lessons are
 *      public-noindex learning surfaces, not login walls.
 *
 * Storage seeding uses the unified v2 schema (`loehrning-progress-v2`) shipped
 * in — never the two retired legacy keys.
 */

const UNIFIED_KEY = "loehrning-progress-v2";

/** A minimal unified-store payload with the AI-Native workshop quiz passed. */
function passedAiNativeState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    courses: {
      "ai-native": {
        lessons: {},
        workshopQuiz: { passed: true, score: 90, completedAt: now },
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

async function seedProgress(page: Page, value: object) {
  // Inject before any app script runs so the first render already sees it.
  await page.addInitScript(
    ([key, json]) => {
      window.localStorage.setItem(key, json);
    },
    [UNIFIED_KEY, JSON.stringify(value)] as const,
  );
}

async function assertNoBlockingAxe(page: Page, label: string) {
  // Wait until Framer Motion entrance animations have settled. Sampling axe
  // mid-fade reports false color-contrast failures because the opacity tween
  // blends the (AA-safe) token colour toward the card behind it. We honour the
  // page's final, settled state — which is what a real user reads.
  await page.waitForFunction(() => {
    const animations = document.getAnimations?.() ?? [];
    return animations.every((a) => a.playState !== "running");
  }, null, { timeout: 5_000 }).catch(() => {
    /* no Web Animations in flight (or unsupported) — proceed */
  });
  await page.waitForTimeout(150);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  if (blocking.length > 0) {
    for (const v of blocking) {
      console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
    }
  }
  expect(
    blocking,
    `axe found ${blocking.length} serious/critical violations on ${label}`,
  ).toEqual([]);
}

test.describe("/kurse unified hub", () => {
  test("renders the native progression and imported open-source lane (no 404)", async ({ page }) => {
    const res = await page.goto("/kurse", { waitUntil: "domcontentloaded" });
    expect(res?.status(), "/kurse should not 404").toBeLessThan(400);

    await expect(page.locator("h1")).toContainText("KI lernen");

    await expect(page.locator("body")).toContainText("KI-Führerschein");
    await expect(page.locator("body")).toContainText("EU AI Act Kurs");
    await expect(page.locator("body")).toContainText("AI-Native Arbeitskurs");

    await expect(page.locator("body")).toContainText(
      "Optionale technische Vertiefung aus dem GitHub-Kursrepo",
    );
    for (const course of IMPORTED_COURSE_CATALOG) {
      await expect(
        page.locator("body"),
      ).toContainText(course.title);
    }
  });

  test("links to each native and imported course", async ({ page }) => {
    await page.goto("/kurse", { waitUntil: "domcontentloaded" });
    for (const href of ["/ki-fuehrerschein", "/eu-ai-act-kurs", "/ai-native"]) {
      await expect(
        page.locator(`a[href^="${href}"]`).first(),
      ).toBeVisible();
    }
    for (const href of [
      "/kurse/open-source/data-engineering-fundamentals",
      "/kurse/open-source/data-science",
      "/kurse/open-source/data-infrastructure",
      "/kurse/open-source/codex",
      "/kurse/open-source/claude",
      "/kurse/open-source/ai-native-operator",
    ]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  for (const course of IMPORTED_COURSE_CATALOG) {
    test(`renders imported detail page: ${course.slug}`, async ({ page }) => {
      const res = await page.goto(course.href, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(400);

      await expect(page.getByRole("heading", { name: course.title })).toBeVisible();
      await expect(page.getByAltText(course.imageAlt)).toBeVisible();
      await expect(page.locator("body")).toContainText(course.lessonCountLabel);
      await expect(page.getByText(course.integrationNote)).toBeVisible();

      for (const fact of course.sourceFacts) {
        await expect(page.getByText(fact).first()).toBeVisible();
      }

      await expect(page.getByRole("link", { name: /Extern öffnen/ })).toHaveAttribute(
        "href",
        course.launchHref,
      );
      await expect(page.getByRole("link", { name: /GitHub-Quelle/ })).toHaveAttribute(
        "href",
        course.sourceCommitHref,
      );
      await expect(page.getByRole("link", { name: /MIT-Lizenz/ })).toHaveAttribute(
        "href",
        course.licenseHref,
      );
      await expect(page.getByText(/eigener Browser-Speicherung/)).toBeVisible();
      await expect(page.getByText(/Warum nicht direkt eingebettet/)).toBeVisible();
    });
  }

  test("serves every imported screenshot and license asset", async ({ request }) => {
    for (const course of IMPORTED_COURSE_CATALOG) {
      const image = await request.get(course.imageSrc);
      expect(image.status(), `${course.slug} screenshot`).toBe(200);
      expect(image.headers()["content-type"]).toMatch(/image\/jpeg/);

      const license = await request.get(course.licenseHref);
      expect(license.status(), `${course.slug} license`).toBe(200);
      expect(await license.text()).toMatch(/MIT License/);
    }
  });

  test("unknown imported course route returns 404", async ({ page }) => {
    const res = await page.goto("/kurse/open-source/not-a-course", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(404);
  });

  test("imported-course progress-like storage never activates native progress UI", async ({
    page,
  }) => {
    await seedProgress(page, {
      schemaVersion: 2,
      courses: {
        claude: {
          lessons: { "01": { completed: true } },
          workshopQuiz: { passed: true, score: 100, completedAt: "2026-06-18T00:00:00.000Z" },
          startedAt: "2026-06-18T00:00:00.000Z",
          lastActivity: "2026-06-18T00:00:00.000Z",
        },
        "data-science": {
          lessons: { "01": { completed: true } },
          workshopQuiz: { passed: true, score: 100, completedAt: "2026-06-18T00:00:00.000Z" },
          startedAt: "2026-06-18T00:00:00.000Z",
          lastActivity: "2026-06-18T00:00:00.000Z",
        },
      },
      xp: 999,
      checkpoints: {},
      badges: {},
      streak: { days: 9, last: "2026-06-18" },
      lastActivity: "2026-06-18T00:00:00.000Z",
    });

    await page.goto("/kurse", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kurse-gamification")).toHaveCount(0);
    await expect(page.getByTestId("progress-dots-claude")).toHaveCount(0);
    await expect(page.getByTestId("progress-dots-data-science")).toHaveCount(0);
    await expect(page.getByText("Fortschritt teilen")).toHaveCount(0);

    await page.goto("/kurse/open-source/claude", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Weiterlernen")).toHaveCount(0);
    await expect(page.getByText("Fortschritt teilen")).toHaveCount(0);
    await expect(page.locator('[data-testid^="progress-dots-"]')).toHaveCount(0);
  });

  test("is axe-clean", async ({ page }) => {
    await page.goto("/kurse", { waitUntil: "domcontentloaded" });
    await assertNoBlockingAxe(page, "/kurse");
  });
});

test.describe("AI-Native public preview and public-noindex course app", () => {
  test("public course preview has no price or premium gate", async ({
    page,
  }) => {
    await page.goto("/ai-native", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/199\s*€|199€|20\s*€\s*\/\s*Modul/);
    expect(body).not.toMatch(/Jetzt kaufen|Jetzt sichern|Premium · /);
  });

  test("course index renders without login", async ({ page }) => {
    const res = await page.goto("/ai-native/kurs", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("a course lesson renders without login", async ({
    page,
  }) => {
    const res = await page.goto("/ai-native/kurs/modul_4/modul_4_lesson_1", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("lesson shortcuts stay inside the reader and ignore nested controls", async ({
    page,
  }) => {
    await page.goto("/ai-native/kurs/modul_4/modul_4_lesson_1", {
      waitUntil: "domcontentloaded",
    });
    const reader = page.locator("#lesson-body");
    await expect(reader).toHaveAttribute("data-current-index", "0");

    const markRead = page.getByRole("button", {
      name: "Abschnitt 1 als gelesen markieren",
    });
    await markRead.focus();
    await page.keyboard.press("ArrowDown");
    await expect(reader).toHaveAttribute("data-current-index", "0");

    await reader.focus();
    await page.keyboard.press("ArrowDown");
    await expect(reader).toHaveAttribute("data-current-index", "1");
  });

  test("module page renders without login", async ({ page }) => {
    const res = await page.goto("/ai-native/kurs/modul_4", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Workshop quiz → certificate gate", () => {
  test("certificate form renders without login and uses local proof state", async ({
    page,
  }) => {
    const res = await page.goto("/ai-native/kurs/zertifikat", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("local progress can unlock the public certificate surface", async ({ page }) => {
    await seedProgress(page, passedAiNativeState());
    const res = await page.goto("/ai-native/kurs/zertifikat", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("the workshop quiz route renders without login", async ({
    page,
  }) => {
    const res = await page.goto("/ai-native/kurs/quiz", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("certificate verification page", () => {
  test("shows an invalid state without a hash and is axe-clean", async ({
    page,
  }) => {
    await page.goto("/ai-native/verifizierung", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText("Zertifikatcode nicht lesbar")).toBeVisible();
    await assertNoBlockingAxe(page, "/ai-native/verifizierung");
  });
});
