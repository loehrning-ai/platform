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
 * The page is one centred column on a dark scene (the owner-requested /login
 * background) and has two branches, asserted structurally through
 * data-login-layout: "form" (the card with the methods, the account note
 * under it) when a provider is approved, "status" (the card with the machine
 * state and the method note, the public rail under it) when none is. CI runs
 * provider-free, so the "status" branch and its "disabled" reason are the ones
 * exercised end to end; the other three reasons are covered in
 * src/app/login/page.test.tsx.
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
          hasText: /Keine Anmeldemethode verfügbar/i,
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
          hasText: /Keine Anmeldemethode verfügbar/i,
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
          hasText: /Keine Anmeldemethode verfügbar/i,
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
      await expect(layout).toHaveAttribute("data-login-layout", "form");
      // The public rail is the dead-end branch's replacement for a form; it
      // must not compete with a working form.
      await expect(page.locator("[data-login-public-access]")).toHaveCount(0);
      await expect(page.locator("[data-login-status]")).toHaveCount(0);
      return;
    }

    await expect(layout).toHaveAttribute("data-login-layout", "status");
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
      page.getByText(/^Hier ist nichts zu tun\.$/),
    ).toBeVisible();
  });

  test("says what an account adds only where one can be opened", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const panel = page.locator("[data-login-account-value]");
    if (!(await signInAvailable(page))) {
      // A closed sign-in keeps the page short: status, form note, public rail.
      await expect(panel).toHaveCount(0);
      return;
    }
    await expect(panel).toHaveCount(1);
    for (const claim of [
      "Fortschritt auf allen Geräten",
      "Deine Werkzeuge mit deinen Dokumenten",
      "Eigene KI anbinden",
    ]) {
      await expect(panel.getByText(claim, { exact: true })).toBeVisible();
    }
    // Anonymous progress is only imported once on request (/konto), and the
    // page has to say so before the sign-in rather than after an empty dashboard.
    await expect(
      panel.getByText(/einmal ins Konto übernehmen/),
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
        "form",
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
          hasText: /Keine Anmeldemethode verfügbar/i,
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

test.describe("/login scene", () => {
  test("covers the viewport behind the card, stays decorative, and leaves the nav and footer paper", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ROUTE, { waitUntil: "load" });

    const backdrop = page.locator("[data-login-scene-backdrop]");
    await expect(backdrop).toHaveCount(1);
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");

    const geometry = await page.evaluate(() => {
      const layer = document.querySelector<HTMLElement>(
        "[data-login-scene-backdrop]",
      );
      const scene = document.querySelector<HTMLElement>("[data-login-scene]");
      const card = document.querySelector<HTMLElement>(".login-card");
      const header = document.querySelector<HTMLElement>(
        "[data-nav-header-row]",
      );
      const footer = document.querySelector<HTMLElement>("footer");
      const rect = layer?.getBoundingClientRect();
      const cardRect = card?.getBoundingClientRect();
      return {
        position: layer ? getComputedStyle(layer).position : "",
        layer: rect?.toJSON() ?? null,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: window.innerHeight,
        sceneHeight: scene?.getBoundingClientRect().height ?? 0,
        sceneGround: scene ? getComputedStyle(scene).backgroundColor : "",
        cardCentre: cardRect ? cardRect.left + cardRect.width / 2 : 0,
        cardWidth: cardRect?.width ?? 0,
        navGround: header ? getComputedStyle(header).backgroundColor : "",
        footerGround: footer ? getComputedStyle(footer).backgroundColor : "",
      };
    });

    expect(geometry.position).toBe("fixed");
    expect(geometry.layer?.left).toBeGreaterThanOrEqual(-1);
    expect(geometry.layer?.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.layer?.height).toBeGreaterThanOrEqual(
      geometry.viewportHeight - 1,
    );
    // The scene fills at least the first screen, and the card is centred.
    expect(geometry.sceneHeight).toBeGreaterThanOrEqual(
      geometry.viewportHeight - 1,
    );
    expect(geometry.sceneGround).toBe("rgb(5, 5, 5)");
    expect(
      Math.abs(geometry.cardCentre - geometry.viewportWidth / 2),
    ).toBeLessThanOrEqual(2);
    expect(geometry.cardWidth).toBeGreaterThanOrEqual(340);
    expect(geometry.cardWidth).toBeLessThanOrEqual(440);
    // Kalkweiß nav, opaque on this route; the footer keeps its own wash.
    expect(geometry.navGround).toBe("rgb(247, 241, 231)");
    expect(geometry.footerGround).not.toBe("rgb(5, 5, 5)");
  });

  test("moving shapes come with a 44px pause toggle that reports its state", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(ROUTE, { waitUntil: "load" });

    const toggle = page.locator("[data-login-scene-toggle]");
    await expect(toggle).toBeVisible();
    await expect(page.locator("[data-login-dot-field]")).toHaveCount(1);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toHaveAccessibleName("Hintergrundbewegung anhalten");
    const box = await toggle.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("reduced motion keeps the static grid only: no canvas, no toggle", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROUTE, { waitUntil: "load" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });

    await expect(page.locator("[data-login-scene-backdrop]")).toHaveCount(1);
    await expect(page.locator("[data-login-dot-field]")).toHaveCount(0);
    await expect(page.locator("[data-login-scene-toggle]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
