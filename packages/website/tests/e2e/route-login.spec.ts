import { test, expect, type Page } from "@playwright/test";

/**
 * /login smoke + interaction (regression coverage, wave 2). Magic-link login:
 * the page renders the value proposition h1 plus a single-field form (email
 * input + "Login-Link" submit CTA). Submission is guarded by native HTML5
 * constraint validation (required + type=email), so an empty or malformed
 * address is blocked in the browser before the submit handler ever calls
 * Supabase - which is exactly why these tests never trigger a real send.
 *
 * Assertions target ROLES, label association, and validity state rather than
 * exact copy, so a wording refresh stays green while a real regression
 * (dropped email field, dead CTA, validation removed, mobile overflow) fails.
 */

const ROUTE = "/login";

// Console-error filter mirrors route-einstieg.spec.ts / qa-sweep.spec.ts: drop
// framework noise (hydration, prefetch, chunk 404s, Vercel Analytics) and keep
// only errors that signal a genuine page fault.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

test.describe("/login magic-link", () => {
  test("loads, stays on /login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    // Anonymous visitor is not bounced away: the login surface renders in place.
    await expect(page).toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    const configured = await page.getByLabel(/E-Mail-Adresse/i).isEnabled();
    await expect(h1).toContainText(
      configured ? /Fortschritt/i : /Ohne Anmeldung lernen/i,
    );

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders the email field and the magic-link CTA", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    await expect(email).toBeVisible();
    // Structural guarantees that drive native validation - a regression that
    // drops either attribute would silently disable the client-side gate.
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveJSProperty("required", true);

    const cta = page.getByRole("button", { name: /Login-Link/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("type", "submit");
  });

  test("empty submit is blocked by native validation and sends nothing", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    const cta = page.getByRole("button", { name: /Login-Link/i });
    if (!(await email.isEnabled())) {
      await expect(email).toBeDisabled();
      await expect(cta).toBeDisabled();
      await expect(
        page.getByRole("note").filter({ hasText: /Supabase Auth ist nicht konfiguriert/ }),
      ).toBeVisible();
      await expect(page.getByText(/verschickt/i)).toHaveCount(0);
      return;
    }

    await cta.click();

    const validity = await email.evaluate((el) => {
      const input = el as HTMLInputElement;
      return { valid: input.validity.valid, valueMissing: input.validity.valueMissing };
    });
    expect(validity.valid, "empty required email must be invalid").toBe(false);
    expect(validity.valueMissing, "empty email must report valueMissing").toBe(true);

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
    if (!(await email.isEnabled())) {
      await expect(email).toBeDisabled();
      await expect(cta).toBeDisabled();
      await expect(page.getByText(/verschickt/i)).toHaveCount(0);
      return;
    }

    await email.fill("keine-echte-email");
    await cta.click();

    const validity = await email.evaluate((el) => {
      const input = el as HTMLInputElement;
      return { valid: input.validity.valid, typeMismatch: input.validity.typeMismatch };
    });
    expect(validity.valid, "malformed email must be invalid").toBe(false);
    expect(validity.typeMismatch, "malformed email must report typeMismatch").toBe(true);

    await expect(page.getByText(/verschickt/i)).toHaveCount(0);
  });
});

test.describe("/login mobile", () => {
  test("has no horizontal overflow at 390px and keeps the form visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/E-Mail-Adresse/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Login-Link/i }),
    ).toBeVisible();

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
