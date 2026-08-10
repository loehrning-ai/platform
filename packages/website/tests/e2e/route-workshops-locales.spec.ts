import { expect, test } from "@playwright/test";

const WORKSHOP_ROUTES = [
  {
    path: "/workshops",
    deHeading: "Selbstlern-Workshops für konkrete Entscheidungen.",
    enHeading: "Self-study workshops for concrete decisions.",
    materialCount: 0,
  },
  {
    path: "/workshops/ki-prognosen-einschaetzen",
    deHeading: "Kann KI die Zukunft vorhersagen?",
    enHeading: "Can AI predict the future?",
    materialCount: 5,
  },
  {
    path: "/workshops/geschaeftsberichte-mit-ki-lesen",
    deHeading: "Geschäftsberichte mit KI lesen",
    enHeading: "Read business reports with AI",
    materialCount: 2,
  },
] as const;

const GERMAN_INTERFACE_TOKENS =
  /(?:Für wen|Alle Workshops|Die offene Entscheidung|Einordnung|Kostenlos und ohne Anmeldung|Material zum Mitnehmen|Verfügbare Workshops)/;

for (const width of [320, 390, 768, 1440] as const) {
  test(`workshop DE/EN pages are complete and contain their layout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1_000 });

    for (const route of WORKSHOP_ROUTES) {
      for (const locale of ["de", "en"] as const) {
        const pageErrors: string[] = [];
        const onPageError = (error: Error) => pageErrors.push(error.message);
        page.on("pageerror", onPageError);

        const localizedPath = locale === "de" ? route.path : `/en${route.path}`;
        const response = await page.goto(localizedPath, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status(), localizedPath).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.getByRole("heading", {
          level: 1,
          name: locale === "de" ? route.deHeading : route.enHeading,
        })).toBeVisible();
        await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        const state = await page.evaluate(() => {
          const main = document.querySelector("main");
          const internalHrefs = Array.from(
            main?.querySelectorAll<HTMLAnchorElement>('a[href^="/"]') ?? [],
          ).map((link) => link.getAttribute("href") ?? "");
          const materialHrefs = internalHrefs.filter((href) =>
            /\.(?:html|zip)$/.test(href),
          );
          const pageHrefs = internalHrefs.filter((href) =>
            !/\.(?:html|zip)$/.test(href),
          );
          return {
            bodyWidth: document.body.scrollWidth,
            documentWidth: document.documentElement.scrollWidth,
            mainText: main?.textContent ?? "",
            materialHrefs,
            pageHrefs,
          };
        });

        expect(state.bodyWidth, `${localizedPath} body overflow`).toBeLessThanOrEqual(width + 1);
        expect(
          state.documentWidth,
          `${localizedPath} document overflow`,
        ).toBeLessThanOrEqual(width + 1);
        expect(state.materialHrefs).toHaveLength(route.materialCount * 2);
        expect(
          state.materialHrefs.every(
            (href) => href.startsWith("/workshops/") && !href.startsWith("/en/"),
          ),
          `${localizedPath} source-language asset paths`,
        ).toBe(true);

        if (locale === "en") {
          expect(state.mainText).not.toMatch(GERMAN_INTERFACE_TOKENS);
          expect(
            state.pageHrefs.every(
              (href) => href === "/en" || href.startsWith("/en/"),
            ),
            `${localizedPath} locale-preserving page links`,
          ).toBe(true);
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            "href",
            `https://loehrning.ai${localizedPath}`,
          );
          if (route.materialCount > 0) {
            await expect(page.getByText("Language: English")).toHaveCount(
              route.materialCount,
            );
          }
        } else {
          expect(state.pageHrefs.every((href) => !href.startsWith("/en"))).toBe(true);
        }

        expect(pageErrors, `${localizedPath} page errors`).toEqual([]);
        page.off("pageerror", onPageError);
      }
    }
  });
}
