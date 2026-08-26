import { expect, test } from "@playwright/test";
import { TECHNICAL_COURSE_ROUTES } from "../../src/lib/technical-courses/routes";

const COURSES = Object.values(TECHNICAL_COURSE_ROUTES);

function frameSelector(course: (typeof COURSES)[number]): string {
  return course.courseSlug === "data-science"
    ? ".ds-v8-scope"
    : `[data-technical-course="${course.courseSlug}"]`;
}

function primaryActionSelector(course: (typeof COURSES)[number]): string {
  return course.courseSlug === "data-science"
    ? ".ov-hero-cta a.btn-primary"
    : "header a.bg-brand-orange";
}

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`technical course landings / ${viewport.name}`, () => {
    test.use({ viewport });

    for (const course of COURSES) {
      test(`${course.courseSlug} keeps its first action visible and contains its layout`, async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });

        await page.goto(course.basePath, {
          waitUntil: "domcontentloaded",
        });

        const frame = page.locator(frameSelector(course)).first();
        const primaryAction = frame.locator(primaryActionSelector(course));
        await expect(frame).toBeVisible();
        await expect(frame.locator("h1")).toBeVisible();
        await expect(primaryAction).toBeVisible();
        await expect(primaryAction).toHaveCount(1);

        const actionBox = await primaryAction.boundingBox();
        expect(actionBox).not.toBeNull();
        expect(
          (actionBox?.y ?? viewport.height) + (actionBox?.height ?? 0),
        ).toBeLessThan(viewport.height);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);

        const undersizedText = await frame.evaluate((root) =>
          [...root.querySelectorAll("*")]
            .filter((node) => {
              const element = node as HTMLElement;
              const rect = element.getBoundingClientRect();
              return (
                element.children.length === 0 &&
                (element.textContent ?? "").trim().length > 0 &&
                !element.closest("svg, [aria-hidden='true']") &&
                rect.width > 0 &&
                rect.height > 0 &&
                Number.parseFloat(getComputedStyle(element).fontSize) < 12
              );
            })
            .map((node) => (node.textContent ?? "").trim().slice(0, 40)),
        );
        expect(undersizedText).toEqual([]);

        const undersizedControls = await frame.evaluate((root) =>
          [...root.querySelectorAll("a, button, select, summary")]
            .filter((node) => {
              const rect = node.getBoundingClientRect();
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                (rect.width < 44 || rect.height < 44)
              );
            })
            .map((node) => (node.textContent ?? "").trim().slice(0, 40)),
        );
        expect(undersizedControls).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  });
}

test.describe("technical course landing keyboard entry", () => {
  for (const course of COURSES) {
    test(`${course.courseSlug} opens the canonical first unit with Enter`, async ({
      page,
    }) => {
      await page.goto(course.basePath, {
        waitUntil: "domcontentloaded",
      });
      const primaryAction = page
        .locator(frameSelector(course))
        .first()
        .locator(primaryActionSelector(course));
      const destination = await primaryAction.getAttribute("href");

      expect(destination).toBeTruthy();
      await primaryAction.focus();
      await expect(primaryAction).toBeFocused();
      await page.keyboard.press("Enter");
      await page.waitForURL((url) => url.pathname === destination);
    });
  }
});
