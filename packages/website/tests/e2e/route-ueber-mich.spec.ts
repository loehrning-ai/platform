import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [320, 390, 768, 1024, 1440] as const;
const LOCALES = [
  {
    locale: "de",
    route: "/ueber-mich",
    htmlLang: "de",
    title: "Über Tim Löhr",
    h1: "Ich baue loehrning.ai als öffentliches Lernarchiv.",
    timeline: "Berufliche Stationen",
    academic: "Akademischer Hintergrund",
    feedback: "/feedback",
    otherLocale: "/en/ueber-mich",
  },
  {
    locale: "en",
    route: "/en/ueber-mich",
    htmlLang: "en",
    title: "About Tim Löhr",
    h1: "I build loehrning.ai as a public learning archive.",
    timeline: "Professional timeline",
    academic: "Academic background",
    feedback: "/en/feedback",
    otherLocale: "/ueber-mich",
  },
] as const;

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

function visibleLanguageSwitchLink(page: Page, href: string) {
  return page
    .locator("[data-language-switch]:visible")
    .locator(`a[href="${href}"]`)
    .first();
}

async function settle(page: Page) {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await page.evaluate(async () => {
    // Bounded: document.fonts.ready stays pending on a font that never
    // resolves, and requestAnimationFrame does not fire on a backgrounded or
    // occluded page, so either can park this evaluate until the test budget
    // runs out. See tests/e2e/fixtures/settle.ts.
    const nextFrame = () =>
      new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        requestAnimationFrame(() => requestAnimationFrame(done));
        setTimeout(done, 250);
      });

    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ]);
    // Bring pending images into view before awaiting them. The profile's
    // partner logos are loading="lazy" and sit below the fold, and WebKit at
    // this viewport does not fetch them until they approach it, so their load
    // event never fires and awaiting them below hangs until the test times
    // out. Chromium's lazy-loading distance threshold is generous enough to
    // hide this.
    //
    // Promoting them to eager starts the fetch immediately, with no scrolling
    // and no layout work. Scrolling the page instead costs two animation
    // frames per viewport-height step on every call: invisible for a single
    // settle, but it times out the caller that settles ten times across five
    // widths and two locales.
    for (const image of document.images) {
      if (!image.complete && image.loading === "lazy") image.loading = "eager";
    }
    // Eager promotion makes the load event fire, but an image that 404s at the
    // network layer can still leave both events unfired, so cap the wait.
    await Promise.race([
      Promise.all(
        Array.from(document.images, (image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve(), { once: true });
                image.addEventListener("error", () => resolve(), {
                  once: true,
                });
              }),
        ),
      ),
      new Promise((resolve) => setTimeout(resolve, 15_000)),
    ]);
    await nextFrame();
  });
}

async function expectContainedLayout(page: Page, label: string) {
  const geometry = await page.evaluate(() => {
    const tolerance = 1;
    const viewportRight = window.innerWidth + tolerance;
    const escaped = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.right <= 0 ||
          rect.left >= window.innerWidth ||
          (rect.left >= -tolerance && rect.right <= viewportRight)
        ) {
          return false;
        }
        return true;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      });

    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      escaped,
    };
  });

  expect(
    geometry.bodyScrollWidth,
    `${label}: body width ${geometry.bodyScrollWidth}px exceeds ${geometry.innerWidth}px`,
  ).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(
    geometry.documentScrollWidth,
    `${label}: document width ${geometry.documentScrollWidth}px exceeds ${geometry.innerWidth}px`,
  ).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(
    geometry.escaped,
    `${label}: visible elements escape the viewport`,
  ).toEqual([]);
}

for (const localeCase of LOCALES) {
  test(`${localeCase.locale} profile owns metadata, structured data, links, and images`, async ({
    page,
  }) => {
    const browserErrors = collectBrowserErrors(page);
    const response = await page.goto(localeCase.route, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    await settle(page);

    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      localeCase.htmlLang,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      localeCase.h1,
    );
    await expect(page).toHaveTitle(new RegExp(localeCase.title));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://loehrning.ai${localeCase.route}`,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", "https://loehrning.ai/ueber-mich");
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", "https://loehrning.ai/en/ueber-mich");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "profile",
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      localeCase.locale === "de" ? "de_DE" : "en_GB",
    );

    const graph = JSON.parse(
      (await page.locator("#ueber-mich-jsonld").textContent()) ?? "",
    ) as { "@graph": Record<string, unknown>[] };
    expect(
      graph["@graph"].find((node) => node["@type"] === "ProfilePage"),
    ).toMatchObject({
      url: `https://loehrning.ai${localeCase.route}`,
      inLanguage: localeCase.locale === "de" ? "de-DE" : "en-GB",
    });

    await expect(
      page.getByRole("link", {
        name:
          localeCase.locale === "de"
            ? "das Feedback-Formular"
            : "the feedback form",
      }),
    ).toHaveAttribute("href", localeCase.feedback);
    await expect(
      visibleLanguageSwitchLink(page, localeCase.otherLocale),
    ).toBeVisible();

    const imageState = await page.locator("img").evaluateAll((images) =>
      images.map((image) => ({
        src: (image as HTMLImageElement).currentSrc,
        complete: (image as HTMLImageElement).complete,
        width: (image as HTMLImageElement).naturalWidth,
      })),
    );
    expect(imageState.length).toBeGreaterThanOrEqual(3);
    expect(
      imageState.every((image) => image.complete && image.width > 0),
      JSON.stringify(imageState),
    ).toBe(true);
    expect(browserErrors).toEqual([]);
  });
}

test.describe("profile content without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const localeCase of LOCALES) {
    test(`${localeCase.locale} keeps its complete profile visible`, async ({
      page,
    }) => {
      const response = await page.goto(localeCase.route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        localeCase.h1,
      );
      await expect(
        page.getByRole("heading", { name: localeCase.timeline }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: localeCase.academic }),
      ).toBeVisible();
      await expect(page.locator("#ueber-mich-jsonld")).toBeAttached();
      await expectContainedLayout(page, `${localeCase.locale}/no-js`);
    });
  }
});

test("both locales reflow without escaped elements at five widths", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "The explicit five-width matrix runs once in Chromium.",
  );
  test.setTimeout(120_000);
  const browserErrors = collectBrowserErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 900 });
    for (const localeCase of LOCALES) {
      browserErrors.length = 0;
      const response = await page.goto(localeCase.route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), `${localeCase.locale}/${width}`).toBe(200);
      await settle(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        localeCase.h1,
      );
      await expect(
        page.getByRole("heading", { name: localeCase.timeline }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: localeCase.academic }),
      ).toBeVisible();
      await expectContainedLayout(page, `${localeCase.locale}/${width}`);
      expect(browserErrors, `${localeCase.locale}/${width}`).toEqual([]);
    }
  }
});

test("locale switch and internal links support keyboard activation", async ({
  page,
}) => {
  await page.goto("/ueber-mich", { waitUntil: "domcontentloaded" });
  await settle(page);

  const switchToEnglish = visibleLanguageSwitchLink(page, "/en/ueber-mich");
  await switchToEnglish.focus();
  await expect(switchToEnglish).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/ueber-mich$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    LOCALES[1].h1,
  );

  const feedback = page.getByRole("link", { name: "the feedback form" });
  await feedback.focus();
  await expect(feedback).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/feedback$/);
});

test("both locales remain contained at 200 percent zoom", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "The explicit zoom audit runs once in Chromium.",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const localeCase of LOCALES) {
    await page.goto(localeCase.route, { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expectContainedLayout(page, `${localeCase.locale}/zoom-200`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("reduced-motion preference leaves every profile section visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/ueber-mich", { waitUntil: "domcontentloaded" });
  await settle(page);

  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  for (const heading of [
    LOCALES[1].h1,
    LOCALES[1].timeline,
    LOCALES[1].academic,
    "How I review content",
    "Contact me directly",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
