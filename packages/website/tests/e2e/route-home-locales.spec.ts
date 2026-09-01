import { expect, test } from "@playwright/test";

const GERMAN_ONLY_HOME_TOKENS =
  /\b(?:Freie KI-Lernplattform|Kostenfreie Kurse|Grundlagenpfad|Vier Kurse|Empfohlener Einstieg|Lektionen|Technikkurse|Ressourcen|Betriebsprinzipien|Keine Paywall|Den passenden Einstieg finden)\b/i;

for (const width of [320, 390, 768, 1440] as const) {
  test(`homepage DE/EN copy and geometry are complete at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit width matrix runs once in Chromium.",
    );
    test.setTimeout(90_000);
    const height = width < 768 ? 844 : width === 768 ? 1024 : 900;
    await page.setViewportSize({ width, height });

    for (const locale of ["de", "en"] as const) {
      const route = locale === "de" ? "/" : "/en";
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.status(), route).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("main h1")).toBeVisible();
      await page.locator("[data-app-hydration-marker='true'][data-hydrated='true']").waitFor({ state: "attached" });
      const primaryAction = page
        .locator('[data-section="hero"] a[href$="/kurse"]')
        .first();
      await expect(primaryAction).toBeVisible();
      const actionBox = await primaryAction.boundingBox();
      expect(actionBox, `${route} primary action geometry`).not.toBeNull();
      expect(actionBox!.y, `${route} primary action starts in viewport`).toBeGreaterThanOrEqual(0);
      expect(
        actionBox!.y + actionBox!.height,
        `${route} primary action ends in viewport`,
      ).toBeLessThanOrEqual(height);

      const state = await page.evaluate(() => {
        const main = document.querySelector("main");
        const hero = document.querySelector<HTMLElement>('[data-section="hero"]');
        const cardRects = Array.from(
          document.querySelectorAll<HTMLElement>(
            "[data-home-course-card], [data-home-resource-card]",
          ),
        ).map((card) => {
          const rect = card.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        });
        const undersizedTargets = Array.from(
          document.querySelectorAll<HTMLElement>("main a, footer a"),
        ).flatMap((target) => {
          const style = window.getComputedStyle(target);
          const rect = target.getBoundingClientRect();
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            rect.width === 0 ||
            rect.height === 0
          ) {
            return [];
          }
          return rect.width < 44 || rect.height < 44
            ? [
                {
                  href: target.getAttribute("href"),
                  width: rect.width,
                  height: rect.height,
                },
              ]
            : [];
        });
        return {
          bodyWidth: document.body.scrollWidth,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          heroBottom: hero?.getBoundingClientRect().bottom ?? null,
          cardRects,
          undersizedTargets,
          mainText: main?.textContent ?? "",
          internalHrefs: Array.from(main?.querySelectorAll<HTMLAnchorElement>("a[href^='/']") ?? []).map(
            (link) => link.getAttribute("href") ?? "",
          ),
        };
      });

      expect(state.bodyWidth, `${route} body overflow`).toBeLessThanOrEqual(width + 1);
      expect(state.documentWidth, `${route} document overflow`).toBeLessThanOrEqual(width + 1);
      expect(state.undersizedTargets, `${route} undersized links`).toEqual([]);
      for (const rect of state.cardRects) {
        expect(rect.left, `${route} card left edge`).toBeGreaterThanOrEqual(0);
        expect(rect.right, `${route} card right edge`).toBeLessThanOrEqual(
          width + 1,
        );
      }

      if (width < 1024) {
        await expect(page.locator("[data-hero-globe-motion]")).toHaveCount(0);
      }
      if (width === 390 || width === 768) {
        expect(state.heroBottom, `${route} complete hero in viewport`).not.toBeNull();
        expect(state.heroBottom!, `${route} complete hero in viewport`).toBeLessThanOrEqual(
          height,
        );
      }

      if (locale === "en") {
        expect(state.mainText).toContain("Understand");
        expect(state.mainText).toContain("Four courses.");
        expect(state.mainText).toContain("Operating principles");
        expect(state.mainText).not.toMatch(GERMAN_ONLY_HOME_TOKENS);
        expect(state.internalHrefs.length).toBeGreaterThan(0);
        expect(state.internalHrefs.every((href) => href === "/en" || href.startsWith("/en/"))).toBe(true);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          "https://loehrning.ai/en",
        );
        await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
          "href",
          "https://loehrning.ai",
        );
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
          "href",
          "https://loehrning.ai/en",
        );
      } else {
        expect(state.mainText).toContain("KI");
        expect(state.mainText).toContain("Vier Kurse.");
        expect(state.mainText).toContain("Betriebsprinzipien");
      }
    }
  });
}
