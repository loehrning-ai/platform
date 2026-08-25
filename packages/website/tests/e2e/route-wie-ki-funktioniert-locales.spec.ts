import { expect, test, type Page } from "@playwright/test";
import { settleWholePage } from "./fixtures/settle";

const WIDTHS = [320, 390, 768, 1440] as const;

const ROUTES = [
  {
    path: "/wie-ki-funktioniert",
    deHeading: "Wie Sprachmodelle arbeiten",
    enHeading: "How Language Models Work",
    jsonLdId: "#wie-ki-funktioniert-course-jsonld",
    schemaType: "Course",
  },
  {
    path: "/wie-ki-funktioniert/lektion-1-vorhersage",
    deHeading: "Tokenvorhersage: wie Sprachmodelle Text erzeugen",
    enHeading: "Token prediction: how language models generate text",
    jsonLdId: "#wie-ki-lesson-jsonld",
    schemaType: "LearningResource",
  },
  {
    path: "/wie-ki-funktioniert/lektion-2-trainingsdaten",
    deHeading: "Trainingsdaten und Vorurteile: warum KI nicht neutral ist",
    enHeading: "Training data and bias: why AI is not neutral",
    jsonLdId: "#wie-ki-lesson-jsonld",
    schemaType: "LearningResource",
  },
  {
    path: "/wie-ki-funktioniert/lektion-3-halluzinationen",
    deHeading: "Halluzinationen: unbelegte und falsche Modellausgaben",
    enHeading: "Hallucinations: unsupported and false model output",
    jsonLdId: "#wie-ki-lesson-jsonld",
    schemaType: "LearningResource",
  },
  {
    path: "/wie-ki-funktioniert/lektion-4-grenzen",
    deHeading: "Betriebsgrenzen: was eine KI-Ausgabe nicht belegt",
    enHeading: "Operational limits: what AI output does not establish",
    jsonLdId: "#wie-ki-lesson-jsonld",
    schemaType: "LearningResource",
  },
] as const;

interface HorizontalEscape {
  readonly kind: "element" | "text";
  readonly selector: string;
  readonly left: number;
  readonly right: number;
  readonly text: string;
}


async function horizontalEscapes(
  page: Page,
): Promise<readonly HorizontalEscape[]> {
  return page.evaluate(() => {
    const escapes: HorizontalEscape[] = [];
    const viewportWidth = window.innerWidth;
    const ignored = (element: Element): boolean =>
      element.matches(".sr-only") ||
      element.closest(".sr-only") !== null ||
      element.closest("[data-course-horizontal-scroll]") !== null;

    for (const element of document.body.querySelectorAll("*")) {
      if (
        !(element instanceof HTMLElement || element instanceof SVGElement) ||
        ignored(element) ||
        element.getAttribute("aria-hidden") === "true"
      ) {
        continue;
      }
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity) === 0 ||
        rect.width <= 0 ||
        rect.height <= 0 ||
        (rect.left >= -0.5 && rect.right <= viewportWidth + 0.5)
      ) {
        continue;
      }
      escapes.push({
        kind: "element",
        selector: element.tagName.toLowerCase(),
        left: Number(rect.left.toFixed(1)),
        right: Number(rect.right.toFixed(1)),
        text: (element.textContent ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 100),
      });
    }

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = (node.textContent ?? "").trim();
      const parent = node.parentElement;
      if (!text || !parent || ignored(parent)) continue;
      const style = getComputedStyle(parent);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity) === 0
      ) {
        continue;
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (
          rect.width <= 0 ||
          (rect.left >= -0.5 && rect.right <= viewportWidth + 0.5)
        ) {
          continue;
        }
        escapes.push({
          kind: "text",
          selector: parent.tagName.toLowerCase(),
          left: Number(rect.left.toFixed(1)),
          right: Number(rect.right.toFixed(1)),
          text: text.replace(/\s+/g, " ").slice(0, 100),
        });
        break;
      }
    }
    return escapes;
  });
}

test.describe("How AI Works DE/EN public sequence", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit viewport matrix runs once in Chromium.",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("all five routes remain localized, indexable, and contained at every target width", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const locale of ["de", "en"] as const) {
        const prefix = locale === "en" ? "/en" : "";
        for (const route of ROUTES) {
          browserErrors.length = 0;
          const visiblePath = `${prefix}${route.path}`;
          const response = await page.goto(visiblePath, {
            waitUntil: "domcontentloaded",
          });

          expect(response?.status(), `${visiblePath} status`).toBe(200);
          expect(
            response?.headers()["x-robots-tag"],
            `${visiblePath} must remain indexable after reviewed parity`,
          ).toBeUndefined();
          await expect(page).not.toHaveURL(/\/login/);
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            locale === "en" ? route.enHeading : route.deHeading,
          );
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            "href",
            `https://loehrning.ai${visiblePath}`,
          );
          await expect(
            page.locator('link[rel="alternate"][hreflang="de"]'),
          ).toHaveAttribute("href", `https://loehrning.ai${route.path}`);
          await expect(
            page.locator('link[rel="alternate"][hreflang="en"]'),
          ).toHaveAttribute("href", `https://loehrning.ai/en${route.path}`);

          const schema = await page
            .locator(route.jsonLdId)
            .evaluate((element, schemaType) => {
              const graph = JSON.parse(element.textContent ?? "{}") as {
                "@graph"?: Array<Record<string, unknown>>;
              };
              return graph["@graph"]?.find(
                (entry) => entry["@type"] === schemaType,
              );
            }, route.schemaType);
          expect(
            schema,
            `${visiblePath} ${route.schemaType} schema`,
          ).toMatchObject({
            inLanguage: locale,
            url: `https://loehrning.ai${visiblePath}`,
            isAccessibleForFree: true,
          });

          await settleWholePage(page, { stepFactor: 0.8 });
          expect(
            await horizontalEscapes(page),
            `${visiblePath} horizontal escapes at ${width}px`,
          ).toEqual([]);
          expect(
            await page
              .locator(
                "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
              )
              .count(),
            `${visiblePath} framework overlay`,
          ).toBe(0);
          expect(
            browserErrors,
            `${visiblePath} browser errors at ${width}px`,
          ).toEqual([]);
        }
      }
    }
  });

  test("English sequence links remain inside the English route tree", async ({
    page,
  }) => {
    await page.goto("/en/wie-ki-funktioniert", {
      waitUntil: "domcontentloaded",
    });
    const lessonLinks = page.getByTestId("lektion-cards").getByRole("link");
    await expect(lessonLinks).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await expect(lessonLinks.nth(index)).toHaveAttribute(
        "href",
        `/en${ROUTES[index + 1]?.path}`,
      );
    }

    await lessonLinks.first().click();
    await expect(page).toHaveURL(
      /\/en\/wie-ki-funktioniert\/lektion-1-vorhersage$/,
    );
    await expect(
      page.getByRole("link", { name: "Next lesson" }),
    ).toHaveAttribute(
      "href",
      "/en/wie-ki-funktioniert/lektion-2-trainingsdaten",
    );
    await expect(
      page.getByRole("button", { name: "Compare with criteria" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Your answer" }),
    ).toBeVisible();
  });
});
