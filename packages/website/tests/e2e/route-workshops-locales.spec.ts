import { expect, test } from "@playwright/test";
import { isWebKitRscPrefetchCancellation } from "./fixtures/console";

/**
 * materialCount: distinct files the page links to (the two action cards of the
 * stage and any material list together; the kit page of a workshop with one
 * counts once more, next to its zip).
 * listedMaterials: rows of the material list. A workshop lists its files only
 * when the two cards cannot reach one; all six reach everything from the stage.
 */
const WORKSHOP_ROUTES = [
  {
    path: "/workshops",
    deHeading: "Workshops mit Fall und Vorlage",
    enHeading: "Workshops with a case and a template",
    materialCount: 0,
    listedMaterials: 0,
  },
  {
    path: "/workshops/ki-prognosen-einschaetzen",
    deHeading: "KI-Prognosen prüfen, bevor danach geplant wird",
    enHeading: "Checking AI forecasts before you plan with them",
    materialCount: 3,
    listedMaterials: 0,
  },
  {
    path: "/workshops/geschaeftsberichte-mit-ki-lesen",
    deHeading: "Geschäftsberichte mit KI lesen",
    enHeading: "Read business reports with AI",
    materialCount: 2,
    listedMaterials: 0,
  },
  {
    path: "/workshops/datenbereitschaft-fuer-ki",
    deHeading: "Sind deine Daten bereit für KI?",
    enHeading: "Are your data ready for AI?",
    materialCount: 2,
    listedMaterials: 0,
  },
  {
    path: "/workshops/esg-berichte-mit-ki",
    deHeading: "ESG-Berichte mit KI",
    enHeading: "ESG reports with AI",
    materialCount: 3,
    listedMaterials: 0,
  },
  {
    path: "/workshops/audit-vorbereitung-mit-ki",
    deHeading: "Audit-Vorbereitung mit KI",
    enHeading: "Audit preparation with AI",
    materialCount: 3,
    listedMaterials: 0,
  },
  {
    path: "/workshops/angebote-mit-ki-vergleichen",
    deHeading: "Welches Angebot ist günstiger?",
    enHeading: "Which offer costs less?",
    materialCount: 3,
    listedMaterials: 0,
  },
] as const;

const GERMAN_INTERFACE_TOKENS =
  /(?:Für wen|Alle Workshops|Die offene Entscheidung|Einordnung|Kostenlos und ohne Anmeldung|Das brauchst du|Nicht Teil dieses Workshops|Verfügbare Workshops)/;

for (const width of [320, 390, 768, 1440] as const) {
  test(`workshop DE/EN pages are complete and contain their layout at ${width}px`, async ({
    browserName,
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1_000 });

    // The brand font loads with `display: optional`, so a page's very first
    // paint either gets it from cache within a ~100ms budget or commits to
    // the fallback face for good — waiting afterwards never forces a swap.
    // A fresh browser context (as every test gets) starts with an empty font
    // cache, so warm it with a throwaway navigation before measuring the
    // real one; a slow runner can otherwise land the fallback's slightly
    // wider metrics permanently and report an overflow that isn't real.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Bound the wait. document.fonts.ready is not guaranteed to settle, and an
    // unraced await here parks the whole test inside one evaluate until the
    // project timeout kills it — the cache warm-up is an optimisation, so
    // giving up on it is strictly better than hanging on it.
    await page.evaluate(() =>
      Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 10_000)),
      ]),
    );

    for (const route of WORKSHOP_ROUTES) {
      for (const locale of ["de", "en"] as const) {
        const pageErrors: string[] = [];
        const onPageError = (error: Error) => {
          if (
            browserName === "webkit" &&
            isWebKitRscPrefetchCancellation(error.message)
          ) {
            return;
          }
          pageErrors.push(error.message);
        };
        page.on("pageerror", onPageError);

        const localizedPath = locale === "de" ? route.path : `/en${route.path}`;
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
        await page
          .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
          .waitFor({ state: "attached" });
        // Font metrics affect layout width. Without waiting for the real
        // webfont, a slower runner can still be rendering a wider fallback
        // face when geometry is measured, producing a transient overflow
        // that has nothing to do with the actual, settled layout.
        await page.evaluate(async () => {
          // Both signals can fail to arrive: a font that never resolves keeps
          // fonts.ready pending, and requestAnimationFrame does not fire at
          // all on a backgrounded or occluded page. Race each against a timer
          // so a settle that cannot complete costs a moment rather than the
          // entire test budget.
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 10_000)),
          ]);
          await new Promise<void>((resolve) => {
            let settled = false;
            const done = () => {
              if (settled) return;
              settled = true;
              resolve();
            };
            requestAnimationFrame(() => requestAnimationFrame(done));
            setTimeout(done, 250);
          });
        });
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );

        const state = await page.evaluate(() => {
          const main = document.querySelector("main");
          const internalHrefs = Array.from(
            main?.querySelectorAll<HTMLAnchorElement>('a[href^="/"]') ?? [],
          ).map((link) => link.getAttribute("href") ?? "");
          // A material may point at a section of a file (guide.html#section).
          const isMaterial = (href: string) =>
            /\.(?:html|zip|csv)$/.test(href.split("#")[0]);
          // A workshop with a kit block lists its kit card as the kit page, not the zip.
          const isKitPage = (href: string) =>
            /^(?:\/en)?\/workshops\/[^/]+\/kit$/.test(href);
          const materialHrefs = internalHrefs.filter(isMaterial);
          const kitPageHrefs = internalHrefs.filter(isKitPage);
          const pageHrefs = internalHrefs.filter((href) => !isMaterial(href));
          return {
            kitPageHrefs,
            bodyWidth: document.body.scrollWidth,
            documentWidth: document.documentElement.scrollWidth,
            mainText: main?.textContent ?? "",
            materialHrefs,
            pageHrefs,
          };
        });

        expect(
          state.bodyWidth,
          `${localizedPath} body overflow`,
        ).toBeLessThanOrEqual(width + 1);
        expect(
          state.documentWidth,
          `${localizedPath} document overflow`,
        ).toBeLessThanOrEqual(width + 1);
        // The stage's cards point at materials that a list in the accordion
        // (where there is one) also carries, so count distinct files: each one
        // once. A kit page counts next to its zip.
        expect(
          new Set([...state.materialHrefs, ...state.kitPageHrefs]).size,
        ).toBe(route.materialCount);
        expect(
          state.materialHrefs.every(
            (href) =>
              href.startsWith("/workshops/") && !href.startsWith("/en/"),
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
          await expect(page.getByText("Language: English")).toHaveCount(
            route.listedMaterials,
          );
        } else {
          expect(state.pageHrefs.every((href) => !href.startsWith("/en"))).toBe(
            true,
          );
          // The German page keeps German interface copy, and every published
          // material is honestly labelled as English.
          if (route.materialCount > 0) {
            expect(state.mainText).toMatch(GERMAN_INTERFACE_TOKENS);
            await expect(page.getByText("Sprache: Englisch")).toHaveCount(
              route.listedMaterials,
            );
          }
        }

        expect(pageErrors, `${localizedPath} page errors`).toEqual([]);
        page.off("pageerror", onPageError);
      }
    }
  });
}

// Workshop 05 moved to audit-vorbereitung-mit-ki: the previous page, kit page, kit zip and demo
// reach the new ones, in German and in English.
test("the previous Workshop 05 slug redirects to the audit preparation pages", async ({ request }) => {
  for (const [from, to] of [
    ["/workshops/ki-im-unternehmen-sicher-nutzen", "/workshops/audit-vorbereitung-mit-ki"],
    ["/workshops/ki-im-unternehmen-sicher-nutzen/kit", "/workshops/audit-vorbereitung-mit-ki/kit"],
    ["/workshops/ki-im-unternehmen-sicher-nutzen/ai-at-work-kit.zip", "/workshops/audit-vorbereitung-mit-ki/vardar-audit-kit.zip"],
    ["/workshops/ki-im-unternehmen-sicher-nutzen/slides.html", "/workshops/audit-vorbereitung-mit-ki/slides.html"],
    ["/workshops/ki-im-unternehmen-sicher-nutzen/presenter.html", "/workshops/audit-vorbereitung-mit-ki/presenter.html"],
    ["/en/workshops/ki-im-unternehmen-sicher-nutzen", "/en/workshops/audit-vorbereitung-mit-ki"],
    ["/demos/ki-im-unternehmen-sicher-nutzen", "/demos/audit-vorbereitung-mit-ki"],
    ["/en/demos/ki-im-unternehmen-sicher-nutzen", "/en/demos/audit-vorbereitung-mit-ki"],
  ] as const) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(301);
    expect(new URL(response.headers().location, "http://localhost").pathname, from).toBe(to);
  }
});
