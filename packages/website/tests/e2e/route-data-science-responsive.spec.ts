import { expect, test, type Page } from "@playwright/test";
import { settleFontsAndFrame } from "./fixtures/settle";

const COURSE_ROOT = "/kurse/open-source/data-science";
const CHAPTER_SLUGS = [
  "",
  "fund",
  "explore",
  "clean",
  "feature",
  "model",
  "eval",
  "interp",
  "exp",
  "causal",
  "peek",
  "deploy",
  "cap",
] as const;
const VIEWPORT_WIDTHS = [320, 390, 768, 1024, 1440] as const;
const LOCALES = ["de", "en"] as const;
const MAX_RUNTIME_ERRORS_PER_CASE = 20;

const DENSE_COPY = {
  de: {
    threshold: "Entscheidungsschwellenwert",
    runAa: "1 000 A/A-Tests ausführen",
    actualFpr: "Tatsächliche FPR",
    hypotheses: "Anzahl getesteter Hypothesen",
    mde: "Minimal nachweisbarer Effekt (MDE)",
    registry: "Model Registry prüfen",
    missedCost: "Kosten je übersehenem Betrugsfall in Dollar",
    falseAlertCost: "Kosten je Fehlalarm in Dollar",
  },
  en: {
    threshold: "Decision threshold",
    runAa: "Run 1 000 A/A tests",
    actualFpr: "Actual FPR",
    hypotheses: "Number of hypotheses tested",
    mde: "Minimum detectable effect (MDE)",
    registry: "Inspect Model Registry",
    missedCost: "Cost per missed fraud in dollars",
    falseAlertCost: "Cost per false alert in dollars",
  },
} as const;

function courseRoot(locale: (typeof LOCALES)[number]): string {
  return locale === "en" ? `/en${COURSE_ROOT}` : COURSE_ROOT;
}

function captureRuntimeErrors(page: Page) {
  const errors: string[] = [];
  const record = (message: string) => {
    if (errors.length < MAX_RUNTIME_ERRORS_PER_CASE) errors.push(message);
  };
  page.on("pageerror", (error) => record(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") record(message.text());
  });
  return {
    reset() {
      errors.length = 0;
    },
    expectNone(context: string) {
      expect(errors, `${context}: runtime errors`).toEqual([]);
    },
  };
}

async function settleLayout(page: Page) {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await settleFontsAndFrame(page);
}

async function openLessonReference(page: Page) {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  const reference = page.locator("details[data-lesson-reference]");
  await expect(reference).toHaveCount(1);
  await reference.locator("summary").click();
  await expect(reference).toHaveAttribute("open", "");
}

async function expectCourseGeometryContained(page: Page, context: string) {
  const geometry = await page.evaluate(() => {
    const root = document.querySelector(".ds-v8-scope");
    if (!root) throw new Error("Data Science course scope is missing");

    const isVisible = (element: Element) => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden";
    };
    const description = (element: Element) => ({
      tag: element.tagName.toLowerCase(),
      className:
        typeof element.className === "string"
          ? element.className.slice(0, 100)
          : "",
      text: (element.textContent ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 100),
    });

    const descendants = Array.from(root.querySelectorAll("*"));
    const viewportOffenders = descendants
      .filter((element) => {
        if (!isVisible(element)) return false;
        if (element.closest(".sr-only")) return false;
        if (
          element.closest("[data-horizontal-scroll]") &&
          !element.matches("[data-horizontal-scroll]")
        ) {
          return false;
        }
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 1 &&
          (rect.left < -1 || rect.right > window.innerWidth + 1)
        );
      })
      .map(description);

    const clippedContent = descendants
      .filter((element) => {
        if (!(element instanceof HTMLElement) || !isVisible(element)) {
          return false;
        }
        if (element.closest(".sr-only,[data-horizontal-scroll]")) return false;
        const style = getComputedStyle(element);
        return (
          ["hidden", "clip"].includes(style.overflowX) &&
          element.clientWidth > 0 &&
          element.scrollWidth > element.clientWidth + 1
        );
      })
      .map(description);

    const scrollers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-horizontal-scroll]"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        ariaLabel: element.getAttribute("aria-label"),
        role: element.getAttribute("role"),
        tabIndex: element.tabIndex,
        left: rect.left,
        right: rect.right,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    });

    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      viewportOffenders,
      clippedContent,
      scrollers,
    };
  });

  expect(geometry.viewportOffenders, context).toEqual([]);
  expect(geometry.clippedContent, context).toEqual([]);
  expect(geometry.bodyScrollWidth, context).toBeLessThanOrEqual(
    geometry.viewportWidth + 1,
  );
  expect(geometry.documentScrollWidth, context).toBeLessThanOrEqual(
    geometry.viewportWidth + 1,
  );
  for (const scroller of geometry.scrollers) {
    expect(scroller.role, context).toBe("region");
    expect(scroller.ariaLabel, context).toBeTruthy();
    expect(scroller.tabIndex, context).toBe(0);
    expect(scroller.left, context).toBeGreaterThanOrEqual(-1);
    expect(scroller.right, context).toBeLessThanOrEqual(
      geometry.viewportWidth + 1,
    );
    expect(scroller.clientWidth, context).toBeGreaterThan(0);
    expect(scroller.scrollWidth, context).toBeGreaterThanOrEqual(
      scroller.clientWidth,
    );
  }
}

test.describe("Data Science responsive geometry", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit five-width matrix runs once in Chromium.",
    );
  });

  test("all 13 routes in both locales remain contained across five widths", async ({
    page,
  }) => {
    test.setTimeout(600_000);
    const runtimeErrors = captureRuntimeErrors(page);

    for (const locale of LOCALES) {
      for (const width of VIEWPORT_WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        for (const slug of CHAPTER_SLUGS) {
          const root = courseRoot(locale);
          const route = `${root}${slug ? `/${slug}` : ""}`;
          const context = `${locale} ${width}px ${route}`;
          runtimeErrors.reset();
          const response = await page.goto(route, { waitUntil: "load" });
          expect(response?.status(), context).toBe(200);
          await settleLayout(page);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          if (slug) await openLessonReference(page);
          await expectCourseGeometryContained(page, context);
          runtimeErrors.expectNone(context);
        }
      }
    }
  });

  test("dense simulator states remain contained in both locales across five widths", async ({
    page,
  }) => {
    test.setTimeout(600_000);
    const runtimeErrors = captureRuntimeErrors(page);

    for (const locale of LOCALES) {
      const copy = DENSE_COPY[locale];
      const root = courseRoot(locale);
      for (const width of VIEWPORT_WIDTHS) {
        await page.setViewportSize({ width, height: 900 });

        runtimeErrors.reset();
        await page.goto(`${root}/eval`, { waitUntil: "load" });
        await settleLayout(page);
        await openLessonReference(page);
        await page.getByRole("slider", { name: copy.threshold }).fill("0.95");
        const evalContext = `${locale} ${width}px evaluate threshold=0.95`;
        await expectCourseGeometryContained(page, evalContext);
        runtimeErrors.expectNone(evalContext);

        runtimeErrors.reset();
        await page.goto(`${root}/interp`, { waitUntil: "load" });
        await settleLayout(page);
        await openLessonReference(page);
        await page.locator(".gvl-point").nth(18).dispatchEvent("click");
        const interpContext = `${locale} ${width}px interpret selected point`;
        await expectCourseGeometryContained(page, interpContext);
        runtimeErrors.expectNone(interpContext);

        runtimeErrors.reset();
        await page.goto(`${root}/peek`, { waitUntil: "load" });
        await settleLayout(page);
        await openLessonReference(page);
        await page
          .getByRole("button", { name: copy.runAa })
          .dispatchEvent("click");
        await expect(
          page.getByText(copy.actualFpr, { exact: true }),
        ).toBeVisible();
        await page.getByRole("slider", { name: copy.hypotheses }).fill("50");
        await page.getByRole("slider", { name: copy.mde }).fill("0.01");
        const peekContext = `${locale} ${width}px peeking dense results`;
        await expectCourseGeometryContained(page, peekContext);
        runtimeErrors.expectNone(peekContext);

        runtimeErrors.reset();
        await page.goto(`${root}/deploy`, { waitUntil: "load" });
        await settleLayout(page);
        await openLessonReference(page);
        await page
          .getByRole("button", { name: copy.registry })
          .dispatchEvent("click");
        const deployContext = `${locale} ${width}px deploy selected node`;
        await expectCourseGeometryContained(page, deployContext);
        runtimeErrors.expectNone(deployContext);

        runtimeErrors.reset();
        await page.goto(`${root}/cap`, { waitUntil: "load" });
        await settleLayout(page);
        await openLessonReference(page);
        await page.getByRole("slider", { name: copy.threshold }).fill("0.05");
        await page.getByRole("slider", { name: copy.missedCost }).fill("2000");
        await page
          .getByRole("slider", { name: copy.falseAlertCost })
          .fill("200");
        const capContext = `${locale} ${width}px capstone long values`;
        await expectCourseGeometryContained(page, capContext);
        runtimeErrors.expectNone(capContext);
      }
    }
  });
});
