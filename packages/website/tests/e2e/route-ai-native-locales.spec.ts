import { expect, test, type Page } from "@playwright/test";
import { settleWholePage } from "./fixtures/settle";

const WIDTHS = [320, 390, 768, 1440] as const;

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
          .slice(0, 80),
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
          text: text.replace(/\s+/g, " ").slice(0, 80),
        });
        break;
      }
    }
    return escapes;
  });
}

function certificateHash(): string {
  return Buffer.from(
    JSON.stringify({
      n: "W".repeat(120),
      s: 100,
      m: "quiz",
      d: "2026-08-08T10:00:00.000Z",
      c: "ai-native",
      v: 1,
    }),
    "utf8",
  ).toString("base64url");
}

test.describe("AI-Native course DE/EN integration", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit viewport matrix runs once in Chromium.",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("public landing and verification stay localized and contained at every target width", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const locale of ["de", "en"] as const) {
        const prefix = locale === "en" ? "/en" : "";
        const landing = `${prefix}/ai-native`;
        const landingResponse = await page.goto(landing, {
          waitUntil: "domcontentloaded",
        });
        expect(landingResponse?.status(), `${landing} status`).toBe(200);
        expect(
          landingResponse?.headers()["x-robots-tag"],
          `${landing} must remain indexable after reviewed parity`,
        ).toBeUndefined();
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
          locale === "en" ? "Define the task" : "Kontext geben",
        );
        await expect(
          page
            .getByRole("link", {
              name:
                locale === "en"
                  ? /Start with a free learning account/
                  : /Kostenlos mit Lernkonto starten/,
            })
            .first(),
        ).toHaveAttribute("href", `${prefix}/ai-native/kurs/modul_1`);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `https://loehrning.ai${landing}`,
        );
        await expect(
          page.locator('link[rel="alternate"][hreflang="de"]'),
        ).toHaveAttribute("href", "https://loehrning.ai/ai-native");
        await expect(
          page.locator('link[rel="alternate"][hreflang="en"]'),
        ).toHaveAttribute("href", "https://loehrning.ai/en/ai-native");

        const courseGraph = await page
          .locator("#ai-native-landing-jsonld")
          .evaluate((element) => {
            const graph = JSON.parse(element.textContent ?? "{}") as {
              "@graph"?: Array<Record<string, unknown>>;
            };
            return graph["@graph"]?.find(
              (entry) => entry["@type"] === "Course",
            );
          });
        expect(courseGraph).toMatchObject({
          inLanguage: locale,
          url: `https://loehrning.ai${landing}`,
          isAccessibleForFree: true,
        });

        await settleWholePage(page);
        expect(
          await horizontalEscapes(page),
          `${landing} horizontal escapes at ${width}px`,
        ).toEqual([]);
        expect(
          await page
            .locator(
              "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
            )
            .count(),
          `${landing} framework overlay`,
        ).toBe(0);

        const verification = `${prefix}/ai-native/verifizierung#${certificateHash()}`;
        const verificationResponse = await page.goto(verification, {
          waitUntil: "domcontentloaded",
        });
        expect(
          verificationResponse?.status(),
          `${verification} status`,
        ).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.getByText("W".repeat(120))).toBeVisible();
        await expect(
          page.getByText(locale === "en" ? "QR data read" : "QR-Daten gelesen"),
        ).toBeVisible();
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
        await settleWholePage(page);
        expect(
          await horizontalEscapes(page),
          `${verification} horizontal escapes at ${width}px`,
        ).toEqual([]);
      }
    }

    expect(consoleErrors).toEqual([]);
  });

  test("public companion views stay localized and contained at every target width", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    const views = [
      {
        path: "/ai-native/glossar",
        heading: { de: "Glossar", en: "Glossary" },
      },
      {
        path: "/ai-native/demos",
        heading: { de: "Ablauf prüfen", en: "Inspect the process" },
      },
      {
        path: "/ai-native/fluency-test",
        heading: { de: "Wie arbeitest du heute", en: "How do you work today" },
      },
      {
        path: "/ai-native/capstone-gallery",
        heading: { de: "Noch keine", en: "No published" },
      },
    ] as const;

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const locale of ["de", "en"] as const) {
        const prefix = locale === "en" ? "/en" : "";
        for (const view of views) {
          const path = `${prefix}${view.path}`;
          const response = await page.goto(path, {
            waitUntil: "domcontentloaded",
          });
          expect(response?.status(), `${path} status`).toBe(200);
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await expect(page.getByRole("heading", { level: 1 })).toContainText(
            view.heading[locale],
          );
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            "href",
            `https://loehrning.ai${path}`,
          );
          await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
            "content",
            /noindex/,
          );
          await settleWholePage(page);
          if (
            width === 320 &&
            locale === "de" &&
            view.path === "/ai-native/demos"
          ) {
            const chat = page.getByRole("region", {
              name: "Praxisbeispiel: RAG-Vertragsassistent",
            });
            const composer = chat.locator("[data-chat-composer]");
            const composerGeometry = await composer.evaluate((element) => {
              const input = element.querySelector("input");
              const button = element.querySelector("button");
              if (
                !(input instanceof HTMLInputElement) ||
                !(button instanceof HTMLButtonElement)
              ) {
                throw new Error("Chat composer controls are missing");
              }
              const composerRect = element.getBoundingClientRect();
              const inputRect = input.getBoundingClientRect();
              const buttonRect = button.getBoundingClientRect();
              return {
                composerLeft: composerRect.left,
                composerRight: composerRect.right,
                viewportWidth: window.innerWidth,
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                inputLeft: inputRect.left,
                inputRight: inputRect.right,
                buttonLeft: buttonRect.left,
                buttonRight: buttonRect.right,
              };
            });
            expect(composerGeometry.composerLeft).toBeGreaterThanOrEqual(-0.5);
            expect(composerGeometry.composerRight).toBeLessThanOrEqual(
              composerGeometry.viewportWidth + 0.5,
            );
            expect(composerGeometry.scrollWidth).toBeLessThanOrEqual(
              composerGeometry.clientWidth,
            );
            expect(composerGeometry.inputLeft).toBeGreaterThanOrEqual(
              composerGeometry.composerLeft - 0.5,
            );
            expect(composerGeometry.inputRight).toBeLessThanOrEqual(
              composerGeometry.buttonLeft,
            );
            expect(composerGeometry.buttonRight).toBeLessThanOrEqual(
              composerGeometry.composerRight + 0.5,
            );
          }
          if (width === 320 && locale === "en" && view.path === "/ai-native/demos") {
            const worksheetScroll = page.locator(
              '[data-demo-id="excel"] [data-course-horizontal-scroll]',
            );
            await expect(worksheetScroll).toHaveAttribute(
              "aria-label",
              "Sample worksheet data",
            );
            const geometry = await worksheetScroll.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              return {
                left: rect.left,
                right: rect.right,
                viewportWidth: window.innerWidth,
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                overflowX: getComputedStyle(element).overflowX,
              };
            });
            expect(geometry.left).toBeGreaterThanOrEqual(-0.5);
            expect(geometry.right).toBeLessThanOrEqual(
              geometry.viewportWidth + 0.5,
            );
            expect(geometry.scrollWidth).toBeGreaterThan(
              geometry.clientWidth,
            );
            expect(geometry.overflowX).toBe("auto");
          }
          expect(
            await horizontalEscapes(page),
            `${path} horizontal escapes at ${width}px`,
          ).toEqual([]);
        }
      }
    }

    expect(consoleErrors).toEqual([]);
  });

  test("anonymous English reader routes preserve /en in login redirects", async ({
    request,
  }) => {
    for (const path of [
      "/en/ai-native/kurs",
      "/en/ai-native/kurs/modul_1?step=2",
      "/en/ai-native/kurs/modul_1/modul_1_lesson_1",
      "/en/ai-native/kurs/quiz",
      "/en/ai-native/kurs/zertifikat",
    ] as const) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(307);
      const location = new URL(response.headers().location, "http://localhost");
      expect(location.pathname, path).toBe("/en/login");
      expect(location.searchParams.get("next"), path).toBe(path);
    }
  });
});
