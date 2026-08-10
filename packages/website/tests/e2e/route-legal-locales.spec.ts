import { expect, test } from "@playwright/test";

const PUBLIC_LEGAL_ROUTES = [
  {
    path: "/impressum",
    deHeading: "Impressum",
    enHeading: "Legal notice",
  },
  {
    path: "/datenschutz",
    deHeading: "Datenschutzerklärung",
    enHeading: "Privacy policy",
  },
] as const;

for (const width of [320, 390, 768, 1440] as const) {
  test("legal routes preserve locale and viewport geometry at " + width + "px", async ({
    page,
  }) => {
    await page.setViewportSize({
      width,
      height: width < 768 ? 844 : 1_000,
    });

    for (const route of PUBLIC_LEGAL_ROUTES) {
      for (const locale of ["de", "en"] as const) {
        const localizedPath =
          locale === "de" ? route.path : "/en" + route.path;
        const errors: string[] = [];
        const onPageError = (error: Error) => errors.push(error.message);
        page.on("pageerror", onPageError);

        const response = await page.goto(localizedPath, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status(), localizedPath).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: locale === "de" ? route.deHeading : route.enHeading,
          }),
        ).toBeVisible();
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          "https://loehrning.ai" + localizedPath,
        );
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        const geometry = await page.evaluate(() => ({
          bodyWidth: document.body.scrollWidth,
          documentWidth: document.documentElement.scrollWidth,
          mainText: document.querySelector("main")?.textContent ?? "",
        }));
        expect(geometry.bodyWidth).toBeLessThanOrEqual(width + 1);
        expect(geometry.documentWidth).toBeLessThanOrEqual(width + 1);
        if (locale === "en") {
          expect(geometry.mainText).not.toMatch(
            /Datenschutzerklärung|Ihre Rechte|Haftungsausschluss|Urheberrecht/,
          );
        }
        expect(errors, localizedPath + " page errors").toEqual([]);
        page.off("pageerror", onPageError);
      }
    }

    for (const locale of ["de", "en"] as const) {
      const protectedPath =
        locale === "de"
          ? "/konto/datenschutz"
          : "/en/konto/datenschutz";
      await page.goto(protectedPath, { waitUntil: "domcontentloaded" });
      const finalUrl = new URL(page.url());
      expect(finalUrl.pathname).toBe(
        locale === "de" ? "/login" : "/en/login",
      );
      expect(finalUrl.searchParams.get("next")).toBe(protectedPath);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width + 1);
    }
  });
}
