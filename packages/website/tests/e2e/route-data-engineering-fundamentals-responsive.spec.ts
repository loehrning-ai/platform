import { expect, test, type Page } from "@playwright/test";

const COURSE = "/kurse/open-source/data-engineering-fundamentals";
const CHAPTERS = [
  "home",
  "fund",
  "ingest",
  "stream",
  "store",
  "comp",
  "orch",
  "qual",
  "disc",
  "serve",
  "gov",
  "cap",
] as const;
const WIDTHS = [320, 390, 768, 1024, 1440] as const;
const LOCALES = ["de", "en"] as const;

const MUST_NOT_CLIP: Partial<
  Record<(typeof CHAPTERS)[number], readonly string[]>
> = {
  fund: [".hero", ".lc-wrap", ".sc-stats", ".sd-top", ".sd-bot", ".cs-wrap"],
  ingest: [".code-head", ".readout-grid", ".ctl-row"],
  stream: [".cv-stage", ".cv-readouts", ".cv-ctls"],
  store: [".cm2-flow", ".cm2-panel-sub", ".cm2-panel-alert", ".cm2-summary"],
  qual: [".tm-layout", ".tm-timeline", ".tm-impact"],
  gov: [".pg-layout", ".pg-ide", ".pg-console"],
  cap: [".lp-console", ".lp-break-grid", ".lp-downstream"],
};

const SCROLL_REGION_NAMES = {
  fund: {
    de: "Zeitleiste des Byte-Ablaufs",
    en: "Byte journey timeline",
  },
  ingest: {
    de: "Zeitleiste für Ereigniszeit und Watermark",
    en: "Event-time and watermark timeline",
  },
  cap: {
    de: "Pipeline von der Rohdatenquelle durch sechs Vertragsschranken bis zur Analyse",
    en: "Pipeline from raw source through six contract gates to the analyst",
  },
} as const;

interface Escape {
  readonly selector: string;
  readonly left: number;
  readonly right: number;
  readonly text: string;
}

async function findUncontainedHorizontalEscapes(
  page: Page,
): Promise<readonly Escape[]> {
  return page.locator(".de-course").evaluate((root) => {
    const escapes: Escape[] = [];
    for (const element of root.querySelectorAll("*")) {
      if (!(element instanceof HTMLElement || element instanceof SVGElement))
        continue;
      if (element.closest("[data-course-horizontal-scroll]")) continue;

      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        rect.width <= 0 ||
        rect.height <= 0
      )
        continue;
      if (rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5) continue;

      const className =
        typeof element.className === "string"
          ? element.className
          : element.tagName.toLowerCase();
      escapes.push({
        selector: `${element.tagName.toLowerCase()}.${className.trim().replace(/\s+/g, ".")}`,
        left: Number(rect.left.toFixed(1)),
        right: Number(rect.right.toFixed(1)),
        text: (element.textContent ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 80),
      });
    }
    return escapes;
  });
}

test.describe("Data Engineering Fundamentals mobile geometry", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit phone widths run once in Chromium.",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`${locale} ${width}px: every chapter stays inside the viewport without runtime errors`, async ({
        page,
      }) => {
        test.setTimeout(300_000);
        await page.setViewportSize({ width, height: 900 });

        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));

        const prefix = locale === "en" ? "/en" : "";
        const landingResponse = await page.goto(`${prefix}${COURSE}`, {
          waitUntil: "networkidle",
        });
        expect(landingResponse?.status(), `${locale} landing HTTP status`).toBe(
          200,
        );
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
          `${locale} landing overflows at ${width}px`,
        ).toBeLessThanOrEqual(width + 1);
        expect(consoleErrors, `${locale} landing console errors`).toEqual([]);
        expect(pageErrors, `${locale} landing page errors`).toEqual([]);

        for (const chapter of CHAPTERS) {
          consoleErrors.length = 0;
          pageErrors.length = 0;
          const response = await page.goto(`${prefix}${COURSE}/${chapter}`, {
            waitUntil: "networkidle",
          });
          expect(response?.status(), `${locale}/${chapter} HTTP status`).toBe(
            200,
          );
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await expect(page.locator("h1")).toHaveCount(1);
          await expect(
            page.locator(
              "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
            ),
          ).toHaveCount(0);

          const escapes = await findUncontainedHorizontalEscapes(page);
          expect(
            escapes,
            `${locale}/${chapter} contains viewport escapes at ${width}px`,
          ).toEqual([]);

          for (const selector of MUST_NOT_CLIP[chapter] ?? []) {
            const elements = page.locator(selector);
            const count = await elements.count();
            expect(
              count,
              `${locale}/${chapter} is missing ${selector}`,
            ).toBeGreaterThan(0);
            for (let index = 0; index < count; index += 1) {
              const geometry = await elements
                .nth(index)
                .evaluate((element) => ({
                  clientWidth: element.clientWidth,
                  scrollWidth: element.scrollWidth,
                }));
              expect(
                geometry.scrollWidth,
                `${locale}/${chapter} ${selector}[${index}] clips at ${width}px`,
              ).toBeLessThanOrEqual(geometry.clientWidth + 1);
            }
          }

          if (width <= 390 && chapter in SCROLL_REGION_NAMES) {
            const names =
              SCROLL_REGION_NAMES[chapter as keyof typeof SCROLL_REGION_NAMES];
            const name = names[locale];
            const region = page.getByRole("region", { name });
            await expect(region).toHaveAttribute("tabindex", "0");
            const geometry = await region.evaluate((element) => ({
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
            }));
            expect(
              geometry.scrollWidth,
              `${locale}/${chapter} timeline must expose a bounded internal scroller`,
            ).toBeGreaterThan(geometry.clientWidth);
          }

          expect(consoleErrors, `${locale}/${chapter} console errors`).toEqual(
            [],
          );
          expect(pageErrors, `${locale}/${chapter} page errors`).toEqual([]);
        }
      });
    }
  }
});

test.describe("Data Engineering Fundamentals locale and metadata contract", () => {
  for (const locale of LOCALES) {
    test(`${locale}: canonical, hreflang, noindex readers, and locale-preserving links`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium",
        "Metadata runs once in Chromium.",
      );
      await page.setViewportSize({ width: 1024, height: 900 });
      const prefix = locale === "en" ? "/en" : "";
      const canonical = `${COURSE}`;

      await page.goto(`${prefix}${COURSE}`, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /index,\s*follow|follow,\s*index/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://loehrning.ai${prefix}${canonical}`,
      );
      await expect(
        page.locator('link[rel="alternate"][hreflang="de"]'),
      ).toHaveAttribute("href", `https://loehrning.ai${canonical}`);
      await expect(
        page.locator('link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", `https://loehrning.ai/en${canonical}`);
      await expect(
        page.locator(`a[href^="${prefix}${COURSE}/"]`).first(),
      ).toBeVisible();

      await page.goto(`${prefix}${COURSE}/fund`, {
        waitUntil: "networkidle",
      });
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex,\s*follow|follow,\s*noindex/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://loehrning.ai${prefix}${COURSE}/fund`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
        0,
      );
      const sidebarLinks = page.locator(`.sb-nav a[href*="${COURSE}/"]`);
      expect(await sidebarLinks.count()).toBeGreaterThanOrEqual(12);
      for (const href of await sidebarLinks.evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      )) {
        expect(href).toMatch(
          locale === "en"
            ? /^\/en\/kurse\/open-source\/data-engineering-fundamentals\//
            : /^\/kurse\/open-source\/data-engineering-fundamentals\//,
        );
      }
    });
  }

  for (const locale of LOCALES) {
    test(`${locale}: landing and chapter retain meaningful server-rendered content without JavaScript`, async ({
      browser,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium",
        "No-JS runs once in Chromium.",
      );
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      const prefix = locale === "en" ? "/en" : "";

      const landing = await page.goto(`${prefix}${COURSE}`, {
        waitUntil: "domcontentloaded",
      });
      expect(landing?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.locator(`a[href^="${prefix}${COURSE}/"]`).count(),
      ).toBeGreaterThanOrEqual(12);

      const chapter = await page.goto(`${prefix}${COURSE}/fund`, {
        waitUntil: "domcontentloaded",
      });
      expect(chapter?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".de-course")).not.toHaveText("");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(391);
      await context.close();
    });
  }
});
