import { test, expect, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * /login smoke + interaction (regression coverage, wave 2). A configured
 * magic-link runtime renders a single-field form; a provider-free runtime
 * renders a compact non-interactive status region instead of a fake form.
 * Form submission is guarded by native HTML5 constraint validation (required
 * + type=email), so these tests never trigger a real send.
 *
 * Assertions target ROLES, label association, and validity state rather than
 * exact copy, so a wording refresh stays green while a real regression
 * (dropped email field, dead CTA, validation removed, mobile overflow) fails.
 *
 * The page has two layouts and they are asserted structurally through
 * data-login-layout: "split" (argument beside the form) when a provider is
 * approved, "single" (status, methods, public rail, argument stacked in one
 * column) when none is. CI runs provider-free, so the single-column branch and
 * its "disabled" reason are the ones exercised end to end; the other three
 * reasons are covered in src/app/login/page.test.tsx.
 */

const ROUTE = "/login";

async function magicLinkFieldCount(page: Page): Promise<number> {
  return page.getByLabel(/E-Mail-Adresse/i).count();
}

/**
 * A runtime is "available" when any approved method renders: the magic-link
 * field, Google, or the optional GitHub provider. Checking only one of them
 * would read a GitHub-only deployment as a dead end.
 */
async function signInAvailable(page: Page): Promise<boolean> {
  if ((await magicLinkFieldCount(page)) > 0) return true;
  if (
    (await page.getByRole("button", { name: /Mit Google anmelden/i }).count()) >
    0
  ) {
    return true;
  }
  return (await page.locator('[data-login-provider="github"]').count()) > 0;
}

test.describe("/login magic-link", () => {
  test("loads, stays on /login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    // Anonymous visitor is not bounced away: the login surface renders in place.
    await expect(page).toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    const configured = await signInAvailable(page);
    await expect(h1).toContainText(
      configured ? /Lernstand synchronisieren/i : /Weiter ohne Konto/i,
    );

    const noise = meaningfulBrowserErrors(errors);
    expect(
      noise,
      `console errors on ${ROUTE}\n${formatBrowserErrors(noise)}`,
    ).toEqual([]);
  });

  test("renders only sign-in methods approved for the runtime", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    const cta = page.getByRole("button", { name: /Login-Link/i });
    if ((await email.count()) === 0) {
      await expect(cta).toHaveCount(0);
      await expect(
        page.getByRole("note").filter({
          hasText: /Anmeldung ist in dieser Umgebung nicht konfiguriert/i,
        }),
      ).toBeVisible();
      return;
    }

    await expect(email).toBeVisible();
    // Structural guarantees that drive native validation - a regression that
    // drops either attribute would silently disable the client-side gate.
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveJSProperty("required", true);

    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("type", "submit");
  });

  test("empty submit is blocked by native validation and sends nothing", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    const cta = page.getByRole("button", { name: /Login-Link/i });
    if ((await email.count()) === 0) {
      await expect(cta).toHaveCount(0);
      await expect(
        page.getByRole("note").filter({
          hasText: /Anmeldung ist in dieser Umgebung nicht konfiguriert/i,
        }),
      ).toBeVisible();
      await expect(page.getByText(/verschickt/i)).toHaveCount(0);
      return;
    }

    await cta.click();

    const validity = await email.evaluate((el) => {
      const input = el as HTMLInputElement;
      return {
        valid: input.validity.valid,
        valueMissing: input.validity.valueMissing,
      };
    });
    expect(validity.valid, "empty required email must be invalid").toBe(false);
    expect(validity.valueMissing, "empty email must report valueMissing").toBe(
      true,
    );

    // No magic-link outcome message => the submit handler never ran, so nothing
    // was dispatched to Supabase.
    await expect(page.getByText(/verschickt/i)).toHaveCount(0);
  });

  test("malformed email is blocked by native validation and sends nothing", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    const cta = page.getByRole("button", { name: /Login-Link/i });
    if ((await email.count()) === 0) {
      await expect(cta).toHaveCount(0);
      await expect(
        page.getByRole("note").filter({
          hasText: /Anmeldung ist in dieser Umgebung nicht konfiguriert/i,
        }),
      ).toBeVisible();
      await expect(page.getByText(/verschickt/i)).toHaveCount(0);
      return;
    }

    await email.fill("keine-echte-email");
    await cta.click();

    const validity = await email.evaluate((el) => {
      const input = el as HTMLInputElement;
      return {
        valid: input.validity.valid,
        typeMismatch: input.validity.typeMismatch,
      };
    });
    expect(validity.valid, "malformed email must be invalid").toBe(false);
    expect(
      validity.typeMismatch,
      "malformed email must report typeMismatch",
    ).toBe(true);

    await expect(page.getByText(/verschickt/i)).toHaveCount(0);
  });
});

test.describe("/login layout", () => {
  test("picks the layout that matches the runtime and never renders both", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const layout = page.locator("[data-login-layout]");
    await expect(layout).toHaveCount(1);

    const available = await signInAvailable(page);

    if (available) {
      await expect(layout).toHaveAttribute("data-login-layout", "split");
      // The public rail is the dead-end branch's replacement for a form; it
      // must not compete with a working form.
      await expect(page.locator("[data-login-public-access]")).toHaveCount(0);
      await expect(page.locator("[data-login-status]")).toHaveCount(0);
      return;
    }

    await expect(layout).toHaveAttribute("data-login-layout", "single");
    // Provider-free CI reaches exactly one of the four machine states.
    await expect(page.locator("[data-login-status]")).toHaveAttribute(
      "data-login-status",
      "disabled",
    );
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Diese Umgebung läuft ohne Konto.",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        /Bücher, Demos, KI-Check und die technischen Kurse bleiben vollständig offen/,
      ),
    ).toBeVisible();
  });

  test("says what an account adds in both layouts", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const panel = page.locator("[data-login-account-value]");
    await expect(panel).toHaveCount(1);
    for (const claim of [
      "Ein Lernfaden über alle Geräte",
      "Deine Werkzeuge mit deinen Dokumenten",
      "Deine eigene KI verbunden",
    ]) {
      await expect(panel.getByText(claim, { exact: true })).toBeVisible();
    }
    // Anonymous progress is not merged on sign-in, and the page has to say so
    // before the sign-in rather than after an empty dashboard.
    await expect(
      panel.getByText(/wird beim Anmelden nicht übernommen/),
    ).toBeVisible();
  });

  test("closed sign-in still routes to the surfaces that never need an account", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const rail = page.locator("[data-login-public-access]");
    if ((await rail.count()) === 0) {
      // A working form is the shortest path; the rail is intentionally absent.
      await expect(page.locator("[data-login-layout]")).toHaveAttribute(
        "data-login-layout",
        "split",
      );
      return;
    }

    const links = rail.getByRole("link");
    await expect(links).toHaveCount(4);
    for (const [index, href] of [
      "/kurse",
      "/buecher",
      "/demos",
      "/ki-check",
    ].entries()) {
      const link = links.nth(index);
      await expect(link).toHaveAttribute("href", href);
      const box = await link.boundingBox();
      expect(box?.height ?? 0, `target height for ${href}`).toBeGreaterThanOrEqual(
        44,
      );
      expect(box?.width ?? 0, `target width for ${href}`).toBeGreaterThanOrEqual(
        44,
      );
    }
  });
});

test.describe("/login mobile", () => {
  test("has no horizontal overflow at 390px and keeps the sign-in boundary visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.locator('[aria-labelledby="login-form-title"]'),
    ).toBeVisible();
    const email = page.getByLabel(/E-Mail-Adresse/i);
    if ((await email.count()) > 0) {
      await expect(email).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Login-Link/i }),
      ).toBeVisible();
      // On a phone the task comes before the argument: the method surface has
      // to sit above the "what an account adds" panel in visual order.
      const order = await page.evaluate(() => {
        const form = document.querySelector<HTMLElement>(
          '[aria-labelledby="login-form-title"]',
        );
        const value = document.querySelector<HTMLElement>(
          "[data-login-account-value]",
        );
        return {
          formTop: form?.getBoundingClientRect().top ?? 0,
          valueTop: value?.getBoundingClientRect().top ?? 0,
        };
      });
      expect(order.formTop).toBeLessThan(order.valueTop);
    } else {
      await expect(
        page.getByRole("note").filter({
          hasText: /Anmeldung ist in dieser Umgebung nicht konfiguriert/i,
        }),
      ).toBeVisible();
    }

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
