import { expect, test as base, type BrowserContext, type Page } from "@playwright/test";
import { collectBrowserErrors, meaningfulBrowserErrors } from "./console";

export const HYDRATED = '[data-app-hydration-marker="true"][data-hydrated="true"]';

export async function withBrowserErrorGate<T>(page: Page, action: () => Promise<T>): Promise<T> {
  const errors = collectBrowserErrors(page);
  const result = await action();
  expect(meaningfulBrowserErrors(errors)).toEqual([]);
  return result;
}

/** Attach before navigation so unrelated script errors cannot leave a green capability result. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await withBrowserErrorGate(page, () => use(page));
  },
});

export async function openApp(page: Page, route: string): Promise<void> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response?.status(), route).toBe(200);
  await page.locator(HYDRATED).waitFor({ state: "attached" });
  await expect(page.locator("main h1")).toHaveCount(1);
  // LessonReference keeps the authored h1 hidden and renders its title with a heading role.
  const heading = page.locator("main").getByRole("heading", { level: 1 });
  await expect(heading).toHaveCount(1);
  await expect(heading).toBeVisible();
}

export async function expectContained(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

/** Each handoff gets its own document; cancelled prefetches cannot leak from an earlier route. */
export async function inNewPage(context: BrowserContext, action: (page: Page) => Promise<void>): Promise<void> {
  const page = await context.newPage();
  try {
    await withBrowserErrorGate(page, async () => {
      await action(page);
      await expectContained(page);
    });
  } finally {
    await page.close();
  }
}
