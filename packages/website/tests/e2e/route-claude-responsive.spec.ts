import { expect, test, type Page } from "@playwright/test";
import { settleWholePage } from "./fixtures/settle";

const LESSON_IDS = [
  "mental-model",
  "anatomy",
  "context",
  "claude-md",
  "iteration",
  "gdocs",
  "agents",
  "reviews",
  "grounding",
  "team",
  "evals",
  "safety",
] as const;
const VIEWPORT_WIDTHS = [320, 390, 768, 1024, 1440] as const;
const UNIFIED_KEY = "loehrning-progress-v2";

const LOCALES = [
  {
    locale: "de",
    prefix: "",
    landingTitle: "Claude mit klarer Struktur einsetzen.",
    firstLessonTitle: "Was Claude tatsächlich ist",
    completedLabel: "Lektion abgeschlossen",
  },
  {
    locale: "en",
    prefix: "/en",
    landingTitle: "Use Claude with clear structure.",
    firstLessonTitle: "What Claude actually is",
    completedLabel: "Lesson complete",
  },
] as const;

function routes(prefix: string) {
  const landing = `${prefix}/kurse/open-source/claude`;
  const reader = `${landing}/kurs`;
  return {
    landing,
    reader,
    lessons: LESSON_IDS.map((lessonId) => `${reader}/${lessonId}`),
    quiz: `${reader}/quiz`,
    certificate: `${reader}/zertifikat`,
    verification: `${landing}/verifizierung`,
  };
}

function completedClaudeState(quizPassed: boolean) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    courses: {
      claude: {
        lessons: Object.fromEntries(
          LESSON_IDS.map((id) => [
            id,
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
          score: quizPassed ? 0.92 : 0,
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
      s: 92,
      m: "quiz",
      d: "2026-07-01T10:00:00.000Z",
      c: "claude",
      v: 1,
    }),
    "utf8",
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function continueLocally(page: Page, locale: "de" | "en") {
  const button = page.getByRole("button", {
    name:
      locale === "de"
        ? "Lokal ohne Kontosynchronisierung fortfahren"
        : "Continue locally without account sync",
  });
  const appeared = await button
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    await button.click();
    await expect(button).toBeHidden();
  }
}

function visibleLanguageSwitchLink(page: Page, name: RegExp) {
  return page
    .locator("[data-language-switch]:visible")
    .getByRole("link", { name })
    .first();
}

async function settleFullPage(page: Page) {
  // Two frames per step: this spec's original walk paired them, and a
  // single frame leaves the first click after the walk racing an
  // unstable element on WebKit.
  await settleWholePage(page, { framesPerStep: 2 });
  await expect(
    page.locator(
      '[aria-label="Widget wird geladen"], [aria-label="Widget is loading"]',
    ),
  ).toHaveCount(0, { timeout: 15_000 });
}

async function waitForWorkshopQuestionTransition(page: Page) {
  const questionFrame = page
    .locator("h2[id^='workshop-quiz-question-']")
    .locator("..");
  await expect
    .poll(
      () =>
        questionFrame.evaluate((element) => {
          const transform = getComputedStyle(element).transform;
          return transform === "none"
            ? 0
            : Math.abs(new DOMMatrixReadOnly(transform).m41);
        }),
      { message: "workshop question transition did not settle" },
    )
    .toBeLessThanOrEqual(1);
}

async function expectClaudeGeometryContained(page: Page, context: string) {
  const measure = () => page.evaluate(() => {
    const root = document.querySelector("main");
    if (!root) throw new Error("Main content region is missing");

    // The 200%-zoom audit sets documentElement.style.zoom, and under CSS zoom
    // getBoundingClientRect() reports zoomed pixels while window.innerWidth
    // stays in CSS pixels. Comparing them directly makes every full-width
    // element look twice as wide as the viewport at zoom 2 — an element that
    // exactly fills the layout width lands on innerWidth and tips over on any
    // sub-pixel rounding. Normalise the rect back to CSS pixels first, which
    // is the space the viewport is measured in.
    const cssPixelRect = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const zoom = (element as HTMLElement).currentCSSZoom || 1;
      return {
        left: rect.left / zoom,
        right: rect.right / zoom,
        width: rect.width / zoom,
        height: rect.height / zoom,
      };
    };

    const isVisible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = cssPixelRect(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 1 &&
        rect.height > 1
      );
    };
    // Geometry belongs in the failure message. A tag/class/text triple names
    // the offender but not by how much it escapes, and the difference between
    // a sub-pixel rounding artifact and a genuinely wide box decides the fix.
    // Reproducing this locally is expensive when it only appears on CI, so the
    // numbers have to survive in the report itself.
    const description = (element: Element) => {
      const rect = cssPixelRect(element);
      return {
        tag: element.tagName.toLowerCase(),
        className:
          typeof element.className === "string"
            ? element.className.slice(0, 120)
            : "",
        text: (element.textContent ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 120),
        left: Math.round(rect.left * 100) / 100,
        right: Math.round(rect.right * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        viewport: window.innerWidth,
      };
    };

    const descendants = Array.from(root.querySelectorAll("*"));
    const viewportOffenders = descendants
      .filter((element) => {
        if (!isVisible(element) || element.closest(".sr-only")) return false;
        const scroller = element.closest<HTMLElement>(
          '[data-horizontal-scroll], [data-claude-horizontal-scroll="true"]',
        );
        if (scroller && element !== scroller) return false;
        const rect = cssPixelRect(element);
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      })
      .map(description);

    const clippedContent = descendants
      .filter((element) => {
        if (!(element instanceof HTMLElement) || !isVisible(element)) {
          return false;
        }
        if (
          element.closest(
            '.sr-only, [data-horizontal-scroll], [data-claude-horizontal-scroll="true"]',
          )
        ) {
          return false;
        }
        // Diagram canvases deliberately crop absolutely positioned labels at
        // their plotted edge. Their accessible equivalent is the role/img
        // label, so this is not hidden prose or an inaccessible scroller.
        if (
          element.getAttribute("role") === "img" ||
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
      // Naming the clipping ancestor is not enough to fix anything: the box
      // that has to change is whichever descendant is too wide to fit inside
      // it. Report the overflow and the widest child so the failure points at
      // the element to fix rather than at the one that noticed.
      .map((element) => {
        let widest: {
          tag: string;
          className: string;
          text: string;
          width: number;
        } | null = null;
        for (const child of element.querySelectorAll("*")) {
          const width = cssPixelRect(child).width;
          if (widest && width <= widest.width) continue;
          widest = {
            tag: child.tagName.toLowerCase(),
            className:
              typeof child.className === "string"
                ? child.className.slice(0, 90)
                : "",
            text: (child.textContent ?? "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 60),
            width: Math.round(width * 100) / 100,
          };
        }
        return {
          ...description(element),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          overflowBy: element.scrollWidth - element.clientWidth,
          widestChild: widest,
        };
      });

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
        const rect = cssPixelRect(element);
        return {
          ...description(element),
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
        const rect = cssPixelRect(element);
        return (
          rect.left < -1 ||
          rect.right > window.innerWidth + 1 ||
          element.clientWidth === 0 ||
          element.clientHeight === 0
        );
      })
      .map(description);

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

  // One sample can land mid-animation. The quiz slides its question frame in
  // horizontally, so a child is legitimately outside the viewport for a few
  // frames before it settles, and the wrapper reflows with it. CI is slow
  // enough to catch that frame: the offender it reported measured flush with
  // the viewport again by the time it was described. Settle first, then assert,
  // so a transient frame cannot fail the run while a box that stays outside
  // still does.
  const settleDeadline = Date.now() + 3_000;
  let geometry = await measure();
  while (
    geometry.viewportOffenders.length +
      geometry.clippedContent.length +
      geometry.focusableOffenders.length >
      0 &&
    Date.now() < settleDeadline
  ) {
    await page.waitForTimeout(100);
    geometry = await measure();
  }

  expect(geometry.bodyScrollWidth, context).toBeLessThanOrEqual(
    geometry.viewportWidth + 1,
  );
  expect(geometry.documentScrollWidth, context).toBeLessThanOrEqual(
    geometry.viewportWidth + 1,
  );
  // Distinct messages: these three arrays share a shape, so a shared
  // context string leaves the report ambiguous about which check failed.
  expect(
    geometry.viewportOffenders,
    `${context}: elements escape the viewport`,
  ).toEqual([]);
  expect(
    geometry.clippedContent,
    `${context}: content is clipped and unreachable`,
  ).toEqual([]);
  expect(
    geometry.focusableOffenders,
    `${context}: focusable controls are out of reach`,
  ).toEqual([]);
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

async function expectLocaleOwnedClaudeLinks(
  page: Page,
  locale: "de" | "en",
  context: string,
) {
  const paths = await page
    .locator('a[href*="/kurse/open-source/claude"]')
    .evaluateAll((links) =>
      links
        .filter((link) => !link.closest("[data-language-switch]"))
        .map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
  expect(paths.length, `${context}: no internal Claude links`).toBeGreaterThan(
    0,
  );
  for (const pathname of paths) {
    const expected =
      locale === "en"
        ? /^\/en\/kurse\/open-source\/claude(?:\/|$)/
        : /^\/kurse\/open-source\/claude(?:\/|$)/;
    expect(pathname, `${context}: locale escaped`).toMatch(expected);
  }
}

async function expectLocalizedInterfaceChrome(
  page: Page,
  locale: "de" | "en",
  context: string,
) {
  const chrome = (
    await page
      .locator(
        "button, label, summary, h1, h2, h3, [role='group'], [role='status']",
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
      ? /\b(?:Mark as read|Complete lesson|Lesson complete|Next lesson|Previous lesson|Key takeaway|Run prompt|Run both|Grade prompt|Assess rewrite|Check entries|Start loop|Run final review|What Claude actually is)\b/i
      : /(?:Als gelesen markieren|Lektion abschließen|Lektion abgeschlossen|Nächste Lektion|Vorherige Lektion|Kernaussage|Prompt simulieren|Beide simulieren|Prompt bewerten|Überarbeitung prüfen|Eingaben prüfen|Schleife starten|Abschlussprüfung starten|Was Claude tatsächlich ist)/i;
  expect(chrome, `${context}: foreign-language interface chrome`).not.toMatch(
    forbidden,
  );
}

for (const width of VIEWPORT_WIDTHS) {
  for (const localeCase of LOCALES) {
    test(`Claude ${localeCase.locale} landing, reader, all lessons, quiz and records reflow at ${width}px`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium",
        "The explicit five-width matrix runs once in Chromium.",
      );
      test.setTimeout(300_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });

      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });

      const routeSet = routes(localeCase.prefix);
      const auditedRoutes = [
        routeSet.landing,
        routeSet.reader,
        ...routeSet.lessons,
        routeSet.quiz,
        routeSet.certificate,
        routeSet.verification,
      ];
      for (const route of auditedRoutes) {
        await test.step(route, async () => {
          browserErrors.length = 0;
          const response = await page.goto(route, {
            waitUntil: "domcontentloaded",
          });
          expect(response?.status(), `${width}px ${route}`).toBe(200);
          await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
          await settleFullPage(page);
          await expect(page.locator("html"), route).toHaveAttribute(
            "lang",
            localeCase.locale,
          );
          await expectClaudeGeometryContained(
            page,
            `${localeCase.locale}/${width}/${route}`,
          );
          if (route !== routeSet.quiz && route !== routeSet.certificate) {
            await expectLocaleOwnedClaudeLinks(
              page,
              localeCase.locale,
              `${localeCase.locale}/${width}/${route}`,
            );
          }
          await expectLocalizedInterfaceChrome(
            page,
            localeCase.locale,
            `${localeCase.locale}/${width}/${route}`,
          );
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
      await page.goto(routeSet.lessons[0], {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: localeCase.firstLessonTitle,
        }),
      ).toBeVisible();
    });
  }
}

test.describe("Claude locale continuity and record surfaces", () => {
  test("progress survives a full-document locale switch on the same lesson", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/kurse/open-source/claude/kurs/mental-model", {
      waitUntil: "domcontentloaded",
    });
    await settleFullPage(page);
    await continueLocally(page, "de");

    const unread = page.getByRole("button", {
      name: "Als gelesen markieren",
    });
    while ((await unread.count()) > 0) {
      await unread.first().click();
    }
    const complete = page.getByRole("button", {
      name: "Lektion abschließen",
    });
    await expect(complete).toBeEnabled();
    await complete.click();
    await expect(
      page.getByText("Lektion abgeschlossen", { exact: true }),
    ).toBeVisible();

    const englishLink = visibleLanguageSwitchLink(
      page,
      /Englische Oberfläche/,
    );
    await englishLink.click();
    await expect(page).toHaveURL(
      /\/en\/kurse\/open-source\/claude\/kurs\/mental-model$/,
    );
    await settleFullPage(page);
    await continueLocally(page, "en");
    await expect(
      page.getByText("Lesson complete", { exact: true }),
    ).toBeVisible();
  });

  test("German and English quiz controls share progress and support keyboard operation", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await seedProgress(page, completedClaudeState(true));

    for (const localeCase of LOCALES) {
      const routeSet = routes(localeCase.prefix);
      const response = await page.goto(routeSet.quiz, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await settleFullPage(page);
      await continueLocally(page, localeCase.locale);
      const header = page.getByTestId("workshop-quiz-header");
      await expect(header).toBeVisible({ timeout: 15_000 });
      await expect(
        header.getByText(
          localeCase.locale === "de" ? "Workshop-Quiz" : "Workshop quiz",
          { exact: true },
        ),
      ).toBeVisible();
      const options = page.getByRole("radio");
      await expect(options.first()).toBeVisible();
      await options.first().focus();
      await page.keyboard.press("ArrowDown");
      await expect(options.nth(1)).toBeFocused();
      await page.keyboard.press("Space");
      await expect(
        page.getByRole("button", {
          name: localeCase.locale === "de" ? "Weiter" : "Next",
          exact: true,
        }),
      ).toBeFocused();
      await waitForWorkshopQuestionTransition(page);
      await expectClaudeGeometryContained(
        page,
        `${localeCase.locale}/keyboard-quiz`,
      );
    }
  });

  test("certificate eligibility and certificate copy are localized without changing identity", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await seedProgress(page, completedClaudeState(true));
    for (const localeCase of LOCALES) {
      const routeSet = routes(localeCase.prefix);
      const response = await page.goto(routeSet.certificate, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await continueLocally(page, localeCase.locale);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name:
            localeCase.locale === "de"
              ? "Teilnahmebestätigung: Claude-Kurs"
              : "Claude Course",
        }),
      ).toBeVisible({ timeout: 15_000 });
      await expectClaudeGeometryContained(
        page,
        `${localeCase.locale}/certificate`,
      );
      await expectLocaleOwnedClaudeLinks(
        page,
        localeCase.locale,
        `${localeCase.locale}/certificate`,
      );
    }
  });

  test("valid, malformed, and locale-switched verification fragments remain truthful", async ({
    page,
  }) => {
    const hash = encodeCertificateHash();
    for (const localeCase of LOCALES) {
      const routeSet = routes(localeCase.prefix);
      await page.goto(`${routeSet.verification}#${hash}`, {
        waitUntil: "domcontentloaded",
      });
      await settleFullPage(page);
      await expect(page.getByText("Ada Lovelace")).toBeVisible();
      await expect(
        page.getByText(
          localeCase.locale === "de" ? "QR-Daten gelesen" : "QR data read",
          { exact: true },
        ),
      ).toBeVisible();
      await expectClaudeGeometryContained(
        page,
        `${localeCase.locale}/valid-verification`,
      );

      await page.goto(`${routeSet.verification}#not_base64!`, {
        waitUntil: "domcontentloaded",
      });
      await settleFullPage(page);
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

    await page.goto(`/kurse/open-source/claude/verifizierung#${hash}`, {
      waitUntil: "domcontentloaded",
    });
    await settleFullPage(page);
    const englishLink = visibleLanguageSwitchLink(
      page,
      /Englische Oberfläche/,
    );
    await expect(englishLink).toHaveAttribute(
      "href",
      `/en/kurse/open-source/claude/verifizierung#${hash}`,
    );
    await englishLink.click();
    await expect(page).toHaveURL(
      `/en/kurse/open-source/claude/verifizierung#${hash}`,
    );
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
  });

  test("all lessons remain usable at 200 percent zoom in both locales", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit zoom audit runs once in Chromium.",
    );
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const localeCase of LOCALES) {
      for (const route of routes(localeCase.prefix).lessons) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await settleFullPage(page);
        await page.evaluate(() => {
          document.documentElement.style.zoom = "2";
        });
        await expectClaudeGeometryContained(
          page,
          `${localeCase.locale}/zoom-200/${route}`,
        );
        await expect(page.locator("h1").first()).toBeVisible();
      }
    }
  });

  test("landing metadata is bilingual while readers and records remain noindex", async ({
    page,
  }) => {
    for (const localeCase of LOCALES) {
      const routeSet = routes(localeCase.prefix);
      await page.goto(routeSet.landing, { waitUntil: "domcontentloaded" });
      await expect(
        page.locator('link[rel="alternate"][hreflang="de"]'),
      ).toHaveAttribute("href", /\/kurse\/open-source\/claude$/);
      await expect(
        page.locator('link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", /\/en\/kurse\/open-source\/claude$/);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /index, follow/i,
      );
      const jsonLdText = await page
        .locator("#claude-course-jsonld")
        .textContent();
      expect(jsonLdText).not.toBeNull();
      const jsonLd = JSON.parse(jsonLdText ?? "{}") as {
        "@id": string;
        inLanguage: string;
        url: string;
      };
      expect(jsonLd["@id"]).toBe(
        "https://loehrning.ai/kurse/open-source/claude#course",
      );
      expect(jsonLd.inLanguage).toBe(
        localeCase.locale === "de" ? "de-DE" : "en-GB",
      );
      expect(new URL(jsonLd.url).pathname).toBe(routeSet.landing);

      for (const privateRoute of [
        routeSet.reader,
        routeSet.lessons[0],
        routeSet.quiz,
        routeSet.certificate,
        routeSet.verification,
      ]) {
        await page.goto(privateRoute, { waitUntil: "domcontentloaded" });
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          /noindex, follow/i,
        );
      }
    }
  });
});
