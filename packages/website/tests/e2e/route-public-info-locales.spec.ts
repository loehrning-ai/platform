import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  {
    de: "/einstieg",
    en: "/en/einstieg",
    deHeading: "Was ist Künstliche Intelligenz?",
    enHeading: "What is artificial intelligence?",
  },
  {
    de: "/hilfe",
    en: "/en/hilfe",
    deHeading: "Hilfe und häufige Fragen",
    enHeading: "Help and frequently asked questions",
  },
  {
    de: "/bekannte-grenzen",
    en: "/en/bekannte-grenzen",
    deHeading: "Bekannte Grenzen",
    enHeading: "Known limitations",
  },
  {
    de: "/neuigkeiten",
    en: "/en/neuigkeiten",
    deHeading: "Was ist neu",
    enHeading: "What is new",
  },
  {
    de: "/feedback",
    en: "/en/feedback",
    deHeading: "Rückmeldung zu Fehlern oder Unklarheiten",
    enHeading: "Report an error or unclear passage",
  },
  {
    de: "/ueber-die-plattform",
    en: "/en/ueber-die-plattform",
    deHeading:
      "Öffentliche Inhalte. Kontogebundene Zustände. Belegte Grenzen.",
    enHeading: "Public content. Account-bound state. Documented limits.",
  },
] as const;

const VIEWPORTS = [320, 390, 768, 1440] as const;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

for (const width of VIEWPORTS) {
  test(`public information routes have DE/EN parity without overflow at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit width matrix runs once in Chromium.",
    );
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    const errors = collectErrors(page);

    for (const route of ROUTES) {
      for (const locale of ["de", "en"] as const) {
        const pathname = route[locale];
        const heading = locale === "de" ? route.deHeading : route.enHeading;
        const response = await page.goto(pathname, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status(), pathname).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(
          page.getByRole("heading", { level: 1, name: heading }),
        ).toBeVisible();
        await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);

        const geometry = await page.evaluate(() => {
          const viewportWidth = window.innerWidth;
          const overflow =
            (document.scrollingElement ?? document.documentElement).scrollWidth -
            viewportWidth;
          const escaped = Array.from(
            document.querySelectorAll<HTMLElement>("main *"),
          )
            .filter((element) => {
              const style = getComputedStyle(element);
              if (style.display === "none" || style.visibility === "hidden") {
                return false;
              }
              const rect = element.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) return false;
              return rect.left < -1 || rect.right > viewportWidth + 1;
            })
            .slice(0, 5)
            .map((element) => ({
              tag: element.tagName,
              text: element.textContent?.trim().slice(0, 80),
              rect: element.getBoundingClientRect().toJSON(),
            }));
          return { overflow, escaped };
        });

        expect(geometry.overflow, `${pathname} body overflow`).toBeLessThanOrEqual(1);
        expect(geometry.escaped, `${pathname} escaped elements`).toEqual([]);

        const internalHrefs = await page
          .locator("main a[href^='/']")
          .evaluateAll((links) =>
            links.map((link) => link.getAttribute("href") ?? ""),
          );
        if (locale === "en") {
          expect(
            internalHrefs.every(
              (href) => href === "/en" || href.startsWith("/en/"),
            ),
            `${pathname} must preserve English links`,
          ).toBe(true);
        } else {
          expect(
            internalHrefs.every((href) => !href.startsWith("/en")),
            `${pathname} must preserve German links`,
          ).toBe(true);
        }

        if (pathname.endsWith("/feedback")) {
          await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
            "content",
            /noindex/,
          );
          await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
        } else {
          const canonical = await page
            .locator('link[rel="canonical"]')
            .getAttribute("href");
          expect(new URL(canonical ?? "", page.url()).pathname).toBe(pathname);
        }
      }
    }

    expect(errors, errors.join("\n")).toEqual([]);
  });
}
