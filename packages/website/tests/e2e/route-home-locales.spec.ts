import { expect, test } from "@playwright/test";

const GERMAN_ONLY_HOME_TOKENS =
  /\b(?:Freie KI-Lernplattform|Kostenfreie Kurse|Grundlagenpfad|Vier Kurse|Empfohlener Einstieg|Lektionen|Technikkurse|Ressourcen|Betriebsprinzipien|Keine Paywall|Den passenden Einstieg finden)\b/i;

for (const width of [320, 390, 1440] as const) {
  test(`homepage DE/EN copy and geometry are complete at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });

    for (const locale of ["de", "en"] as const) {
      const route = locale === "de" ? "/" : "/en";
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.status(), route).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("main h1")).toBeVisible();
      await page.locator("[data-app-hydration-marker='true'][data-hydrated='true']").waitFor({ state: "attached" });

      const state = await page.evaluate(() => {
        const main = document.querySelector("main");
        return {
          bodyWidth: document.body.scrollWidth,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          mainText: main?.textContent ?? "",
          internalHrefs: Array.from(main?.querySelectorAll<HTMLAnchorElement>("a[href^='/']") ?? []).map(
            (link) => link.getAttribute("href") ?? "",
          ),
        };
      });

      expect(state.bodyWidth, `${route} body overflow`).toBeLessThanOrEqual(width + 1);
      expect(state.documentWidth, `${route} document overflow`).toBeLessThanOrEqual(width + 1);

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
