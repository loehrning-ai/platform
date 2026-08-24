import { expect, test, type Page } from "@playwright/test";
import { settleFontsAndFrame } from "./fixtures/settle";

const LESSON_IDS = [
  "mental-model",
  "cap-pacelc",
  "modeling",
  "storage-formats",
  "lakehouse",
  "partitioning",
  "batch-elt",
  "streaming",
  "cdc-lambda-kappa",
  "idempotency",
  "sla-quality",
  "interview-playbook",
] as const;

const VIEWPORTS = [320, 390, 768, 1024, 1440] as const;

const LOCALES = [
  {
    locale: "de",
    prefix: "",
    landingTitle: "Datenplattformen anhand ihrer Systemgrenzen entwerfen.",
    firstLessonTitle: "Der Daten-Stack von oben nach unten",
  },
  {
    locale: "en",
    prefix: "/en",
    landingTitle: "Design data platforms from explicit system boundaries.",
    firstLessonTitle: "The Stack, Top to Bottom",
  },
] as const;

function paths(prefix: string) {
  const landing = `${prefix}/kurse/open-source/data-infrastructure`;
  const reader = `${landing}/kurs`;
  return {
    landing,
    reader,
    lessons: LESSON_IDS.map((lessonId) => `${reader}/${lessonId}`),
    certificate: `${reader}/zertifikat`,
    verification: `${landing}/verifizierung`,
  };
}

function encodeCertificateHash(): string {
  return Buffer.from(
    JSON.stringify({
      n: "Ada Lovelace",
      s: null,
      m: "completion",
      d: "2026-07-01T10:00:00.000Z",
      c: "data-infrastructure",
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
  await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });
  await settleFontsAndFrame(page);
}

async function continueLocally(page: Page) {
  const button = page.getByRole("button", {
    name: /^(?:Lokal weiterlernen|Continue locally)$/,
  });
  const gateAppeared = await button
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  if (gateAppeared) {
    await button.click({ timeout: 5_000 }).catch(async (error: unknown) => {
      if (await button.isVisible().catch(() => false)) throw error;
    });
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

async function expectContainedLayout(page: Page, label: string) {
  const geometry = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));

  expect(
    geometry.bodyScrollWidth,
    `${label}: body width exceeds viewport`,
  ).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(
    geometry.documentScrollWidth,
    `${label}: document width exceeds viewport`,
  ).toBeLessThanOrEqual(geometry.innerWidth + 1);
}

async function expectLocaleOwnedLinks(
  page: Page,
  locale: "de" | "en",
  label: string,
) {
  const links = await page
    .locator('a[href*="/kurse/open-source/data-infrastructure"]')
    .evaluateAll((elements) =>
      elements
        .filter((element) => !element.closest("[data-language-switch]"))
        .map(
          (element) => new URL((element as HTMLAnchorElement).href).pathname,
        ),
    );
  for (const pathname of links) {
    expect(pathname, `${label}: course link escaped the active locale`).toMatch(
      locale === "en"
        ? /^\/en\/kurse\/open-source\/data-infrastructure(?:\/|$)/
        : /^\/kurse\/open-source\/data-infrastructure(?:\/|$)/,
    );
  }
}

test("Data Infrastructure direct lesson deep links hydrate concurrently in DE and EN", async ({
  baseURL,
  browser,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "The concurrent cold-start regression runs once in Chromium.",
  );
  if (!baseURL) throw new Error("Playwright baseURL is required.");

  const lessonCases = [
    {
      locale: "de",
      path: "/kurse/open-source/data-infrastructure/kurs/mental-model",
      title: "Der Daten-Stack von oben nach unten",
    },
    {
      locale: "en",
      path: "/en/kurse/open-source/data-infrastructure/kurs/mental-model",
      title: "The Stack, Top to Bottom",
    },
  ] as const;
  const contexts = await Promise.all(
    lessonCases.map(() =>
      browser.newContext({
        baseURL,
        reducedMotion: "reduce",
        viewport: { width: 1024, height: 900 },
      }),
    ),
  );

  try {
    const pages = await Promise.all(
      contexts.map((context) => context.newPage()),
    );
    const browserErrors = lessonCases.map(() => [] as string[]);
    pages.forEach((page, index) => {
      page.on("pageerror", (error) => browserErrors[index].push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") {
          browserErrors[index].push(message.text());
        }
      });
    });

    const responses = await Promise.all(
      pages.map((page, index) =>
        page.goto(lessonCases[index].path, { waitUntil: "domcontentloaded" }),
      ),
    );
    responses.forEach((response, index) => {
      expect(response?.status(), lessonCases[index].path).toBe(200);
    });

    await Promise.all(pages.map((page) => settle(page)));
    for (const [index, lessonCase] of lessonCases.entries()) {
      const page = pages[index];
      expect(new URL(page.url()).pathname).toBe(lessonCase.path);
      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        lessonCase.locale,
      );
      await expect(
        page.getByRole("heading", { level: 1, name: lessonCase.title }),
      ).toBeVisible();
      expect(
        browserErrors[index],
        `${lessonCase.path}: browser errors`,
      ).toEqual([]);
    }
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

for (const width of VIEWPORTS) {
  for (const localeCase of LOCALES) {
    test(`Data Infrastructure ${localeCase.locale} complete route family reflows at ${width}px`, async ({
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

      const routeSet = paths(localeCase.prefix);
      const hash = encodeCertificateHash();
      const routes = [
        routeSet.landing,
        routeSet.reader,
        ...routeSet.lessons,
        routeSet.certificate,
        `${routeSet.verification}#${hash}`,
      ];

      for (const route of routes) {
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
          await expectLocaleOwnedLinks(page, localeCase.locale, route);
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
      await settle(page);
      await openLessonReference(page);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: localeCase.firstLessonTitle,
        }),
      ).toBeVisible();
      if (localeCase.locale === "de") {
        await expect(
          page.getByRole("button", { name: "1 Ereignis verfolgen" }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole("button", { name: "trace 1 event" }),
        ).toBeVisible();
      }
    });
  }
}
