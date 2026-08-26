import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { COURSE_PROJECT_IDENTITIES } from "../../src/lib/course-projects/identity";
import type { CourseProjectEngineKind } from "../../src/lib/course-projects/types";
import { exposeAllAuditedContent } from "./fixtures/a11y-visibility";

type Locale = "de" | "en";
type EngineKind = CourseProjectEngineKind;
type CourseSurface = "workspace" | "protected-login";

interface CanonicalCourseCase {
  readonly slug: keyof typeof COURSE_PROJECT_IDENTITIES;
  readonly name: string;
  readonly locale: Locale;
  readonly route: string;
  readonly engine: EngineKind;
  readonly surface: CourseSurface;
}

interface ReaderCase extends CanonicalCourseCase {
  readonly surface: "workspace";
  readonly engineMarker: string;
  readonly activateLabel: string;
  readonly collapseLabel: string;
  readonly expandLabel: string;
  readonly openLabel: string;
  readonly closeLabel: string;
}

const READERS: readonly ReaderCase[] = [
  {
    slug: "claude",
    name: "Claude",
    locale: "en",
    route: "/en/kurse/open-source/claude/kurs/mental-model",
    engine: "prompt",
    surface: "workspace",
    engineMarker: "Sensitive-data warning",
    activateLabel: "Open studio",
    collapseLabel: "Collapse lesson navigation",
    expandLabel: "Expand lesson navigation",
    openLabel: "Open lesson navigation",
    closeLabel: "Close lesson navigation",
  },
  {
    slug: "codex",
    name: "Codex",
    locale: "de",
    route: "/kurse/open-source/codex/kurs/L01",
    engine: "repo",
    surface: "workspace",
    engineMarker: "Befehlsterminal",
    activateLabel: "Werkstatt öffnen",
    collapseLabel: "Lektionsnavigation einklappen",
    expandLabel: "Lektionsnavigation ausklappen",
    openLabel: "Lektionsnavigation öffnen",
    closeLabel: "Lektionsnavigation schließen",
  },
  {
    slug: "data-infrastructure",
    name: "Data Infrastructure",
    locale: "en",
    route: "/en/kurse/open-source/data-infrastructure/kurs/mental-model",
    engine: "data",
    surface: "workspace",
    engineMarker: "Telemetry query plan",
    activateLabel: "Open studio",
    collapseLabel: "Collapse lesson navigation",
    expandLabel: "Expand lesson navigation",
    openLabel: "Open lesson navigation",
    closeLabel: "Close lesson navigation",
  },
  {
    slug: "data-engineering-fundamentals",
    name: "Data Engineering Fundamentals",
    locale: "de",
    route: "/kurse/open-source/data-engineering-fundamentals/home",
    engine: "data",
    surface: "workspace",
    engineMarker: "Deduplizierungs- und Zeitplan",
    activateLabel: "Werkstatt öffnen",
    collapseLabel: "Kapitelnavigation einklappen",
    expandLabel: "Kapitelnavigation ausklappen",
    openLabel: "Kapitelnavigation öffnen",
    closeLabel: "Kapitelnavigation schließen",
  },
  {
    slug: "data-science",
    name: "Data Science",
    locale: "en",
    route: "/en/kurse/open-source/data-science/fund",
    engine: "data",
    surface: "workspace",
    engineMarker: "Pre-registered analysis plan",
    activateLabel: "Open studio",
    collapseLabel: "Collapse chapter navigation",
    expandLabel: "Expand chapter navigation",
    openLabel: "Open chapter navigation",
    closeLabel: "Close chapter navigation",
  },
  {
    slug: "ai-native-operator",
    name: "AI-Native Operator",
    locale: "de",
    route: "/kurse/open-source/ai-native-operator/mindset/1",
    engine: "prompt",
    surface: "workspace",
    engineMarker: "Warnung zu sensiblen Daten",
    activateLabel: "Werkstatt öffnen",
    collapseLabel: "Modulnavigation einklappen",
    expandLabel: "Modulnavigation ausklappen",
    openLabel: "Modulnavigation öffnen",
    closeLabel: "Modulnavigation schließen",
  },
] as const;

// These readers are server-protected. The provider-free Chromium project can
// prove the localized login boundary and responsive route contract, but must
// not pretend that it exercised the protected engine UI. Their engine mapping
// remains explicit so this matrix fails if any canonical course is omitted.
const PROTECTED_READERS: readonly CanonicalCourseCase[] = [
  {
    slug: "ki-fuehrerschein",
    name: "KI-Führerschein",
    locale: "de",
    route: "/ki-fuehrerschein/kurs/block_1",
    engine: "case",
    surface: "protected-login",
  },
  {
    slug: "eu-ai-act-kurs",
    name: "EU AI Act",
    locale: "en",
    route: "/en/eu-ai-act-kurs/kurs/block_1",
    engine: "case",
    surface: "protected-login",
  },
  {
    slug: "ai-native",
    name: "AI Native",
    locale: "de",
    route: "/ai-native/kurs/modul_1/modul_1_lesson_1",
    engine: "prompt",
    surface: "protected-login",
  },
  {
    slug: "ki-und-gesellschaft",
    name: "KI und Gesellschaft",
    locale: "en",
    route: "/en/ki-und-gesellschaft/kurs/block_1",
    engine: "case",
    surface: "protected-login",
  },
] as const;

const CANONICAL_COURSES: readonly CanonicalCourseCase[] = [
  ...READERS,
  ...PROTECTED_READERS,
];
const DEEP_INTERACTION_READERS = [READERS[0], READERS[1], READERS[2]] as const;
const CONTRACT_VIEWPORTS = [
  { width: 320, height: 760 },
  { width: 390, height: 844 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
  { width: 1728, height: 1117 },
] as const;
const SIDEBAR_STORAGE_KEY = "loehrning:lesson-shell:sidebar:v1";

function captureRuntimeFailures(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  return { consoleErrors, pageErrors };
}

async function gotoHydrated(page: Page, route: string, locale: Locale) {
  const response = await page.goto(route, { waitUntil: "load" });
  expect(response?.status(), `${route} must return HTTP 200`).toBe(200);
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  const primaryHeading = page.getByRole("heading", { level: 1 });
  await expect(primaryHeading).toHaveCount(1);
  await expect(primaryHeading).toBeVisible();
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
}

async function gotoProtectedLogin(page: Page, route: string, locale: Locale) {
  const response = await page.goto(route, { waitUntil: "load" });
  expect(
    response?.status(),
    `${route} login boundary must return HTTP 200`,
  ).toBe(200);
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);

  const current = new URL(page.url());
  expect(current.pathname).toBe(locale === "en" ? "/en/login" : "/login");
  expect(current.searchParams.get("next")).toBe(route);
  expect(current.searchParams.get("reason")).toBe("auth-not-configured");
}

async function gotoCanonicalCourse(page: Page, course: CanonicalCourseCase) {
  if (course.surface === "workspace") {
    await gotoHydrated(page, course.route, course.locale);
    return;
  }
  await gotoProtectedLogin(page, course.route, course.locale);
}

async function expectNoDocumentOverflow(page: Page, context: string) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    rootClientWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(
    geometry.rootScrollWidth,
    `${context}: document root must not overflow horizontally: ${JSON.stringify(geometry)}`,
  ).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(
    geometry.bodyScrollWidth,
    `${context}: body must not overflow horizontally: ${JSON.stringify(geometry)}`,
  ).toBeLessThanOrEqual(geometry.viewport + 1);
}

async function expectTruthfulStackingAt768(
  page: Page,
  course: CanonicalCourseCase,
) {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.waitForFunction(() => window.innerWidth === 768);

  const studio = page.locator(
    `[data-course-project][data-engine-kind="${course.engine}"]`,
  );
  await expect(studio).toHaveCount(1);
  await expect(studio).toHaveAttribute("data-layout", "stacked");
  await expect(
    studio.getByRole("button", {
      name:
        course.locale === "de"
          ? "Bereiche nebeneinander andocken"
          : "Dock panes side by side",
    }),
  ).toBeDisabled();
  await expect(studio.getByRole("separator")).toHaveCount(0);

  const paneGeometry = await studio.evaluate((element) => {
    const brief = element.querySelector<HTMLElement>('[id$="-brief-pane"]');
    const workspace = element.querySelector<HTMLElement>(
      '[id$="-workspace-pane"]',
    );
    if (!brief || !workspace) return null;
    const briefBounds = brief.getBoundingClientRect();
    const workspaceBounds = workspace.getBoundingClientRect();
    return {
      briefBottom: briefBounds.bottom,
      workspaceTop: workspaceBounds.top,
    };
  });
  expect(
    paneGeometry,
    `${course.name}: both panes must render at 768px`,
  ).not.toBeNull();
  expect(paneGeometry!.workspaceTop).toBeGreaterThanOrEqual(
    paneGeometry!.briefBottom - 1,
  );
  await expectNoDocumentOverflow(
    page,
    `${course.name} 768px stacked workspace`,
  );
}

async function numericWidth(locator: ReturnType<Page["locator"]>) {
  return locator.evaluate((element) => element.getBoundingClientRect().width);
}

async function activateStudio(page: Page, reader: ReaderCase) {
  const studio = page.locator(
    `[data-course-project][data-engine-kind="${reader.engine}"]`,
  );
  await expect(studio).toHaveCount(1);
  await studio.getByRole("button", { name: reader.activateLabel }).click();
  await expect(
    studio.getByText(reader.engineMarker, { exact: false }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  return studio;
}

async function lessonMissionState(
  page: Page,
  courseSlug: string,
  lessonId: string,
) {
  const key = `loehrning:lesson-mission:v1:${courseSlug}:${encodeURIComponent(lessonId)}`;
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  }, key);
}

async function openMobileNavigation(page: Page, reader: ReaderCase) {
  const button = page.getByRole("button", { name: reader.openLabel });
  try {
    await button.click({ timeout: 1_500 });
    return;
  } catch {
    const interceptedByNextDevPortal = await button.evaluate((element) => {
      const rectangle = element.getBoundingClientRect();
      const topElement = document.elementFromPoint(
        rectangle.left + rectangle.width / 2,
        rectangle.top + rectangle.height / 2,
      );
      return topElement?.closest("nextjs-portal") !== null;
    });
    expect(
      interceptedByNextDevPortal,
      "Only Next development chrome may intercept the fixed mobile navigation control",
    ).toBe(true);
    await button.evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
  }
}

async function expectAxeClean(page: Page, context: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await exposeAllAuditedContent(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(
    results.violations,
    `${context}: axe reported ${results.violations.length} WCAG violations`,
  ).toEqual([]);
}

test.describe("canonical course workspace", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The canonical responsive acceptance matrix runs once in Chromium.",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("the canonical matrix names all ten courses and every project engine", () => {
    expect(CANONICAL_COURSES.map((course) => course.slug).sort()).toEqual(
      Object.keys(COURSE_PROJECT_IDENTITIES).sort(),
    );
    for (const course of CANONICAL_COURSES) {
      expect(COURSE_PROJECT_IDENTITIES[course.slug].engineKind).toBe(
        course.engine,
      );
    }
    expect(
      [...new Set(CANONICAL_COURSES.map((course) => course.engine))].sort(),
    ).toEqual(["case", "data", "prompt", "repo"]);
  });

  for (const course of CANONICAL_COURSES) {
    test(`${course.name} ${course.locale}: canonical 320/390/768/1024/1440/1728 overflow contract`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      const failures = captureRuntimeFailures(page);

      await page.setViewportSize(CONTRACT_VIEWPORTS[0]);
      await gotoCanonicalCourse(page, course);

      const studio = page.locator(
        `[data-course-project][data-engine-kind="${course.engine}"]`,
      );
      if (course.surface === "workspace") {
        await expect(studio).toHaveCount(1);
        await expect(studio).toHaveAttribute("data-engine-kind", course.engine);
        const mobileToolbar = page.locator(
          "[data-lesson-shell-mobile-toolbar]",
        );
        await expect(mobileToolbar).toBeVisible();
        await expect
          .poll(() =>
            mobileToolbar.evaluate(
              (element) => getComputedStyle(element).position,
            ),
          )
          .toBe("sticky");
        const [toolbarBox, contentBox] = await Promise.all([
          mobileToolbar.boundingBox(),
          page.locator("[data-lesson-shell-content]").boundingBox(),
        ]);
        expect(toolbarBox).not.toBeNull();
        expect(contentBox).not.toBeNull();
        expect(toolbarBox!.y + toolbarBox!.height).toBeLessThanOrEqual(
          contentBox!.y + 1,
        );
      } else {
        // Protected core-course engines require the authenticated-live project.
        // Anonymous Chromium must prove the login boundary, not claim an engine
        // interaction that never rendered.
        await expect(studio).toHaveCount(0);
      }

      for (const viewport of CONTRACT_VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.waitForFunction(
          (width) => window.innerWidth === width,
          viewport.width,
        );
        await expectNoDocumentOverflow(
          page,
          `${course.name} ${viewport.width}px ${course.surface}`,
        );
      }

      if (course.surface === "workspace") {
        await expectTruthfulStackingAt768(page, course);
      }

      expect(failures.consoleErrors, `${course.name}: console errors`).toEqual(
        [],
      );
      expect(failures.pageErrors, `${course.name}: page errors`).toEqual([]);
    });
  }

  for (const reader of DEEP_INTERACTION_READERS) {
    test(`${reader.name} ${reader.locale}: wide shell, localized collapse control, and ${reader.engine} studio`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: 1440, height: 1000 });
      const failures = captureRuntimeFailures(page);

      await gotoHydrated(page, reader.route, reader.locale);

      const sidebar = page.locator("[data-lesson-shell-desktop-sidebar]");
      const content = page.locator("[data-lesson-shell-content]");
      await expect(sidebar).toBeVisible();
      await expect(sidebar).toHaveAttribute("data-collapsed", "false");

      const expandedSidebarWidth = await numericWidth(sidebar);
      const expandedContentWidth = await numericWidth(content);
      expect(
        expandedSidebarWidth,
        `${reader.name}: expanded course navigation should settle at the compact 240px width`,
      ).toBeGreaterThanOrEqual(238);
      expect(expandedSidebarWidth).toBeLessThanOrEqual(242);
      expect(
        expandedContentWidth,
        `${reader.name}: the workspace must use materially more than a narrow article column`,
      ).toBeGreaterThan(900);

      await page.getByRole("button", { name: reader.collapseLabel }).click();
      await expect(sidebar).toHaveAttribute("data-collapsed", "true");
      await expect(
        page.getByRole("button", { name: reader.expandLabel }),
      ).toBeVisible();
      await expect
        .poll(() => numericWidth(sidebar), {
          message: `${reader.name}: collapsed rail should settle at 64px`,
        })
        .toBeLessThanOrEqual(66);
      await expect
        .poll(() => numericWidth(content), {
          message: `${reader.name}: collapsing the rail should widen the workspace`,
        })
        .toBeGreaterThan(expandedContentWidth + 150);

      await activateStudio(page, reader);
      await expectNoDocumentOverflow(page, `${reader.name} desktop studio`);
      expect(failures.consoleErrors, `${reader.name}: console errors`).toEqual(
        [],
      );
      expect(failures.pageErrors, `${reader.name}: page errors`).toEqual([]);
    });
  }

  test("the collapsed rail persists across a course navigation and reload", async ({
    page,
  }) => {
    test.setTimeout(75_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const reader = READERS[0];
    const sidebar = page.locator("[data-lesson-shell-desktop-sidebar]");

    await gotoHydrated(page, reader.route, reader.locale);
    await page.getByRole("button", { name: reader.collapseLabel }).click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    await expect
      .poll(() =>
        page.evaluate((key) => localStorage.getItem(key), SIDEBAR_STORAGE_KEY),
      )
      .toBe("collapsed");

    await gotoHydrated(page, "/en/kurse/open-source/claude/kurs/anatomy", "en");
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    await expect(
      page.getByRole("button", { name: reader.expandLabel }),
    ).toBeVisible();

    await page.reload({ waitUntil: "load" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    await expect.poll(() => numericWidth(sidebar)).toBeLessThanOrEqual(66);

    await page.getByRole("button", { name: reader.expandLabel }).click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
    await expect
      .poll(() =>
        page.evaluate((key) => localStorage.getItem(key), SIDEBAR_STORAGE_KEY),
      )
      .toBe("expanded");
  });

  test("opening the repository instrument does not count as manipulation; changing a control does", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript(() => window.localStorage.clear());
    const reader = READERS[1];
    const failures = captureRuntimeFailures(page);

    await gotoHydrated(page, reader.route, reader.locale);
    const mission = page.locator('[data-lesson-mission="codex"]');
    await expect(mission).toHaveCount(1);

    await mission.getByRole("radio").first().check();
    await mission
      .getByRole("button", {
        name: "Prognose festlegen und Signal aufdecken",
      })
      .click();
    await mission.getByRole("button", { name: "Nächstes Signal" }).click();
    await mission.getByRole("button", { name: /Instrument öffnen/ }).click();

    const nextSignal = mission.getByRole("button", {
      name: "Nächstes Signal",
    });
    await expect(
      mission.getByText("Aktueller Schritt: 02/07 · Manipulieren", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(nextSignal).toHaveCount(0);
    await expect
      .poll(() => lessonMissionState(page, "codex", "L01"))
      .toMatchObject({ workspaceOpened: true, manipulated: false });

    const studio = page.locator(
      '[data-course-project][data-engine-kind="repo"]',
    );
    await expect(
      studio.getByText(reader.engineMarker, { exact: false }).first(),
    ).toBeVisible({ timeout: 15_000 });
    const spec = studio.getByRole("textbox", {
      name: "Editierbarer AGENTS.md-Auftrag",
    });
    const contract =
      "Scope: src/retry.ts. Nicht-Ziel: API ändern. Akzeptanz: Retry-Test grün.";
    await spec.fill(contract);

    await expect(nextSignal).toBeVisible();
    await expect
      .poll(() => lessonMissionState(page, "codex", "L01"))
      .toMatchObject({ workspaceOpened: true, manipulated: true });
    const persisted = await page.evaluate(() =>
      window.localStorage.getItem("loehrning:lesson-mission:v1:codex:L01"),
    );
    expect(persisted).not.toContain(contract);
    expect(failures.consoleErrors, "mission circuit: console errors").toEqual(
      [],
    );
    expect(failures.pageErrors, "mission circuit: page errors").toEqual([]);
  });

  test("the full-screen workspace is a focus-contained modal and Escape restores its opener", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript(() => window.localStorage.clear());
    const reader = READERS[1];
    const failures = captureRuntimeFailures(page);

    await gotoHydrated(page, reader.route, reader.locale);
    const studio = await activateStudio(page, reader);
    const enterFullscreen = studio.getByRole("button", {
      name: "Vollbild öffnen",
    });
    const initialOverflow = await page.evaluate(() => ({
      body: document.body.style.overflow,
      root: document.documentElement.style.overflow,
    }));
    await enterFullscreen.focus();
    await enterFullscreen.click();

    await expect(studio).toHaveAttribute("data-fullscreen", "true");
    await expect(studio).toHaveAttribute("role", "dialog");
    await expect(studio).toHaveAttribute("aria-modal", "true");
    await expect(studio).toBeFocused();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          body: document.body.style.overflow,
          root: document.documentElement.style.overflow,
        })),
      )
      .toEqual({ body: "hidden", root: "hidden" });

    const modalBoundary = await page.evaluate(() => {
      const dialog = document.querySelector<HTMLElement>(
        '[data-course-project][data-fullscreen="true"]',
      );
      const ownedBackground = Array.from(
        document.querySelectorAll<HTMLElement>("[data-course-workspace-inert]"),
      );
      const outsideFocusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !dialog?.contains(element) &&
          element.getClientRects().length > 0 &&
          !element.closest("[inert]"),
      );
      return {
        ownedBackground: ownedBackground.length,
        allOwnedBackgroundIsInert: ownedBackground.every((element) =>
          element.hasAttribute("inert"),
        ),
        outsideFocusables: outsideFocusables.length,
      };
    });
    expect(modalBoundary.ownedBackground).toBeGreaterThan(0);
    expect(modalBoundary.allOwnedBackgroundIsInert).toBe(true);
    expect(modalBoundary.outsideFocusables).toBe(0);

    await page.keyboard.press("Shift+Tab");
    expect(
      await studio.evaluate((dialog) =>
        dialog.contains(document.activeElement),
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");

    await expect(studio).toHaveAttribute("data-fullscreen", "false");
    await expect(studio).not.toHaveAttribute("role", "dialog");
    await expect(enterFullscreen).toBeFocused();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          body: document.body.style.overflow,
          root: document.documentElement.style.overflow,
        })),
      )
      .toEqual(initialOverflow);
    await expect(page.locator("[data-course-workspace-inert]")).toHaveCount(0);
    await expectNoDocumentOverflow(page, "Codex full-screen lifecycle");
    expect(failures.consoleErrors, "full-screen: console errors").toEqual([]);
    expect(failures.pageErrors, "full-screen: page errors").toEqual([]);
  });

  test("the mobile lesson drawer removes global site chrome from interaction and restores it exactly", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const reader = READERS[1];
    const failures = captureRuntimeFailures(page);

    await gotoHydrated(page, reader.route, reader.locale);
    const cdp = await page.context().newCDPSession(page);
    const globalNavigation = page.locator("nav.no-js-primary-nav");
    await expect(globalNavigation).toBeVisible();
    await expect(globalNavigation).not.toHaveAttribute("inert");
    await expect(globalNavigation).not.toHaveAttribute(
      "data-lesson-drawer-inert",
    );

    await openMobileNavigation(page, reader);
    const drawer = page.getByRole("dialog", { name: /navigation/i });
    await expect(drawer).toBeVisible();
    await expect(globalNavigation).toHaveAttribute("inert");
    await expect(globalNavigation).toHaveAttribute(
      "data-lesson-drawer-inert",
      "true",
    );
    expect(
      await globalNavigation.evaluate(
        (element) => element instanceof HTMLElement && element.inert,
      ),
    ).toBe(true);
    const lockedAccessibilityTree = await cdp.send(
      "Accessibility.getFullAXTree",
    );
    expect(
      lockedAccessibilityTree.nodes.some(
        (node) =>
          node.role?.value === "navigation" &&
          node.name?.value === "Hauptnavigation" &&
          !node.ignored,
      ),
    ).toBe(false);

    const scriptedFocusContained = await page.evaluate(() => {
      const escapeTarget = document.createElement("button");
      escapeTarget.type = "button";
      escapeTarget.textContent = "Late outside control";
      document.body.append(escapeTarget);
      escapeTarget.focus();
      const dialog = document.querySelector<HTMLElement>(
        '[role="dialog"][aria-modal="true"]',
      );
      const contained = dialog?.contains(document.activeElement) ?? false;
      escapeTarget.remove();
      return contained;
    });
    expect(scriptedFocusContained).toBe(true);

    const lessonClose = drawer.getByRole("button", {
      name: reader.closeLabel,
    });
    await lessonClose.click();
    await expect(drawer).toBeHidden();
    await expect(globalNavigation).not.toHaveAttribute("inert");
    await expect(globalNavigation).not.toHaveAttribute(
      "data-lesson-drawer-inert",
    );
    const restoredAccessibilityTree = await cdp.send(
      "Accessibility.getFullAXTree",
    );
    expect(
      restoredAccessibilityTree.nodes.some(
        (node) =>
          node.role?.value === "navigation" &&
          node.name?.value === "Hauptnavigation" &&
          !node.ignored,
      ),
    ).toBe(true);
    const lessonToggle = page.getByRole("button", { name: reader.openLabel });
    await expect
      .poll(() =>
        page.evaluate(() => ({
          activeLabel: document.activeElement?.getAttribute("aria-label"),
          activeTag: document.activeElement?.tagName,
          lessonDrawerOwners: document.querySelectorAll(
            "[data-lesson-drawer-inert]",
          ).length,
        })),
      )
      .toEqual({
        activeLabel: reader.openLabel,
        activeTag: "BUTTON",
        lessonDrawerOwners: 0,
      });
    await expect(lessonToggle).toBeFocused();

    const globalHome = globalNavigation.locator("a").first();
    await globalHome.focus();
    await expect(globalHome).toBeFocused();
    await expectNoDocumentOverflow(page, "mobile drawer modal lifecycle");
    expect(failures.consoleErrors, "mobile drawer: console errors").toEqual([]);
    expect(failures.pageErrors, "mobile drawer: page errors").toEqual([]);
    await cdp.detach();
  });

  for (const reader of DEEP_INTERACTION_READERS) {
    test(`${reader.name} ${reader.locale} at 390px: contained drawer and axe-clean ${reader.engine} studio`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 390, height: 844 });
      const failures = captureRuntimeFailures(page);

      await gotoHydrated(page, reader.route, reader.locale);
      await expect(
        page.locator("[data-lesson-shell-desktop-sidebar]"),
      ).toBeHidden();
      await expectNoDocumentOverflow(page, `${reader.name} mobile reader`);

      await openMobileNavigation(page, reader);
      const drawer = page.getByRole("dialog");
      await expect(drawer).toBeVisible();
      await expect
        .poll(async () => (await drawer.boundingBox())?.x ?? -Infinity, {
          message: `${reader.name}: drawer entrance transition must settle inside the viewport`,
        })
        .toBeGreaterThanOrEqual(-1);
      const drawerBox = await drawer.boundingBox();
      expect(drawerBox).not.toBeNull();
      expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(391);
      await expect(
        drawer.getByRole("button", { name: reader.closeLabel }),
      ).toBeVisible();
      await drawer
        .getByRole("button", { name: reader.closeLabel })
        .click({ timeout: 5_000 });
      await expect(drawer).toBeHidden();

      const studio = await activateStudio(page, reader);
      const studioGeometry = await studio.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }));
      expect(studioGeometry.left).toBeGreaterThanOrEqual(-1);
      expect(studioGeometry.right).toBeLessThanOrEqual(391);
      expect(studioGeometry.scrollWidth).toBeLessThanOrEqual(
        studioGeometry.clientWidth + 1,
      );
      await expectNoDocumentOverflow(page, `${reader.name} mobile studio`);
      await expectAxeClean(
        page,
        `${reader.name} activated ${reader.engine} studio`,
      );

      expect(failures.consoleErrors, `${reader.name}: console errors`).toEqual(
        [],
      );
      expect(failures.pageErrors, `${reader.name}: page errors`).toEqual([]);
    });
  }
});
