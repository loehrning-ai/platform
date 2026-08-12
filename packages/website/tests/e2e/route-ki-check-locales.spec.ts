import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  KI_CHECK_CONTENT,
  KI_CHECK_UI_COPY,
} from "../../src/lib/ki-check/localization";
import type { Locale } from "../../src/lib/i18n/locale";

const CASES = [
  { locale: "de", path: "/ki-check", lang: "de" },
  { locale: "en", path: "/en/ki-check", lang: "en" },
] as const satisfies readonly {
  locale: Locale;
  path: string;
  lang: string;
}[];

const WIDTHS = [320, 390, 768, 1024, 1440] as const;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectContained(page: Page, label: string) {
  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
  }));
  expect(
    geometry.scrollWidth,
    `${label}: ${geometry.scrollWidth}px document at ${geometry.innerWidth}px viewport`,
  ).toBeLessThanOrEqual(geometry.innerWidth + 1);
}

async function waitForDocumentScrollToSettle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        let previousY = window.scrollY;
        let stableFrames = 0;
        let frameCount = 0;

        const check = () => {
          const currentY = window.scrollY;
          stableFrames =
            Math.abs(currentY - previousY) <= 0.5 ? stableFrames + 1 : 0;
          previousY = currentY;
          frameCount += 1;

          if (stableFrames >= 3) {
            resolve();
            return;
          }
          if (frameCount >= 300) {
            reject(new Error("Document scrolling did not settle within 300 frames."));
            return;
          }
          requestAnimationFrame(check);
        };

        requestAnimationFrame(check);
      }),
  );
}

async function scrollIntoViewAndClick(
  page: Page,
  control: Locator,
) {
  await expect(control).toBeEnabled();
  await control.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await waitForDocumentScrollToSettle(page);
  await expect(control).toBeInViewport({ ratio: 0.95 });
  await control.click();
}

for (const width of WIDTHS) {
  test(`KI check completes in German and English without overflow at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit width matrix runs once in Chromium.",
    );
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });

    for (const route of CASES) {
      const errors = collectErrors(page);
      const content = KI_CHECK_CONTENT[route.locale];
      const ui = KI_CHECK_UI_COPY[route.locale];
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), route.path).toBe(200);
      expect(response?.headers()["x-robots-tag"], route.path).toBeUndefined();
      await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://loehrning.ai${route.path}`,
      );
      await expect(page.locator('link[hreflang="de"]')).toHaveAttribute(
        "href",
        "https://loehrning.ai/ki-check",
      );
      await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
        "href",
        "https://loehrning.ai/en/ki-check",
      );
      await expect(
        page.getByRole("heading", { level: 1, name: ui.quizTitle }),
      ).toBeVisible();
      await expectContained(page, `${route.path} initial`);

      for (let index = 0; index < content.questions.length; index += 1) {
        const question = content.questions[index];
        const option = question.options[0];
        await expect(
          page.getByRole("heading", { level: 2, name: question.text }),
        ).toBeVisible();
        await scrollIntoViewAndClick(
          page,
          page.getByRole("button", { name: option.text }),
        );
        await expect(
          page.getByText(option.meaning, { exact: true }),
        ).toBeVisible();
        await expectContained(page, `${route.path} question ${index + 1}`);
        await scrollIntoViewAndClick(
          page,
          page.getByRole("button", {
            name: index === content.questions.length - 1 ? ui.result : ui.next,
            exact: true,
          }),
        );
      }

      await expect(
        page.getByRole("heading", { level: 1, name: ui.resultTitle }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: ui.startCourse }),
      ).toHaveAttribute(
        "href",
        route.locale === "de"
          ? "/ki-fuehrerschein/kurs"
          : "/en/ki-fuehrerschein/kurs",
      );
      await expectContained(page, `${route.path} result`);
      expect(errors, `${route.path} console errors`).toEqual([]);
    }
  });
}
