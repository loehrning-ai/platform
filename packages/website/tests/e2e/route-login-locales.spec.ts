import { expect, test } from "@playwright/test";

const GERMAN_LOGIN_TOKENS =
  /(?:Weiter ohne Konto|Freie Lernplattform · Konto|Eine Anmeldung ist|Zum Kursangebot|Anmeldemethode|Anmeldedienst|Lernkonto)/;

for (const width of [320, 390, 768, 1440] as const) {
  test(`login DE/EN copy, callback-error geometry, and return links hold at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1_000 });

    for (const locale of ["de", "en"] as const) {
      const path = locale === "de" ? "/login" : "/en/login";
      const response = await page.goto(`${path}?reason=progress-save`, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), path).toBe(200);
      expect(response?.headers()["x-robots-tag"]).toBe(
        "noindex, nofollow, noarchive",
      );
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name:
            locale === "de"
              ? "Weiter ohne Konto."
              : "Continue without an account.",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: locale === "de" ? "Anmeldemethode" : "Sign-in method",
        }),
      ).toBeVisible();
      const reasonLink = page.getByRole("link", {
        name: locale === "de" ? "Zum Kursangebot" : "View all courses",
      });
      await expect(reasonLink).toHaveAttribute(
        "href",
        locale === "de" ? "/kurse" : "/en/kurse",
      );
      await expect(page.getByRole("button", { name: /Google/i })).toHaveCount(
        0,
      );
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await page
        .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
        .waitFor({ state: "attached" });

      const geometry = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        const main = document.querySelector("main");
        const alert = main?.querySelector<HTMLElement>('[role="alert"]');
        const methodSurface = main?.querySelector<HTMLElement>(
          '[aria-labelledby="login-form-title"]',
        );
        const outside = Array.from(
          main?.querySelectorAll<HTMLElement>("*") ?? [],
        )
          .filter((element) => {
            const style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden") {
              return false;
            }
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              (rect.left < -1 || rect.right > viewportWidth + 1)
            );
          })
          .map((element) => ({
            tag: element.tagName,
            text: (element.textContent ?? "").trim().slice(0, 80),
            rect: element.getBoundingClientRect().toJSON(),
          }));
        return {
          bodyWidth: document.body.scrollWidth,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth,
          alertRect: alert?.getBoundingClientRect().toJSON() ?? null,
          methodSurfaceRect:
            methodSurface?.getBoundingClientRect().toJSON() ?? null,
          mainText: main?.textContent ?? "",
          outside,
        };
      });

      expect(geometry.bodyWidth, `${path} body overflow`).toBeLessThanOrEqual(
        width + 1,
      );
      expect(
        geometry.documentWidth,
        `${path} document overflow`,
      ).toBeLessThanOrEqual(width + 1);
      expect(geometry.outside, `${path} visible descendant overflow`).toEqual(
        [],
      );
      expect(geometry.alertRect?.width).toBeGreaterThan(0);
      expect(geometry.methodSurfaceRect?.width).toBeGreaterThan(0);
      if (locale === "en") {
        expect(geometry.mainText).not.toMatch(GERMAN_LOGIN_TOKENS);
      }

      await reasonLink.focus();
      await expect(reasonLink).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(
        locale === "de" ? /\/kurse$/ : /\/en\/kurse$/,
      );

      await page.goto(`${path}?reason=untrusted-origin`, {
        waitUntil: "domcontentloaded",
      });
      const alert = page.getByRole("main").getByRole("alert");
      await expect(alert).toContainText(
        locale === "de"
          ? "Die Herkunft der Anmeldeanfrage konnte nicht bestätigt werden."
          : "The origin of the authentication request could not be verified.",
      );
      const errorGeometry = await alert.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          viewport: window.innerWidth,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        };
      });
      expect(errorGeometry.left).toBeGreaterThanOrEqual(-1);
      expect(errorGeometry.right).toBeLessThanOrEqual(width + 1);
      expect(errorGeometry.scrollWidth).toBeLessThanOrEqual(
        errorGeometry.clientWidth + 1,
      );
    }
  });
}
