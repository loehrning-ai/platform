import { test, expect, type Page } from "@playwright/test";

/**
 * Auth + Konto flow E2E (regression coverage, spec 1).
 *
 * Runs under either the provider-free `auth-scaffold` project or the explicit,
 * fail-closed `authenticated-live` project. Both load storageState written by
 * tests/e2e/auth.setup.ts.
 *
 * DUAL-MODE by design because Supabase is optional:
 *   - Provider-free scaffold: auth.setup.ts supplies a deterministic mock
 *     cookie and the production build ships without Supabase env
 *     (getSupabasePublicConfig() === null, see src/lib/supabase/config.ts). The
 *     server-validated context is therefore effectively SIGNED OUT and
 *     src/middleware.ts fails /konto closed to /login. In this window the
 *     "signed-out surface" describe RUNS real green assertions (the /login?next=
 *     gate, every reason-query copy branch, the idle state, and the unconfigured
 *     no-config + error path) and the "authenticated /konto" describe SKIPS with
 *     an annotation.
 *   - Live integration run: setup requires the six-variable isolated-project
 *     contract, seeds a real test session, and the context must be SIGNED IN;
 *     progress cards, resources, logout wiring, and the login redirect execute.
 * The live project never converts a failed session into a skip: protected-route
 * redirects fail the run. The scaffold name is deliberately not live-auth proof.
 *
 * Every selector/string below is verified against src/app/login/page.tsx,
 * src/app/login/login-form.tsx, src/app/konto/page.tsx, src/middleware.ts and
 * src/lib/courses/catalog.ts - no invented UI.
 */

// Console-error filter mirrors route-login.spec.ts / buecher-library.spec.ts:
// drop framework noise (hydration, prefetch, chunk 404s, Vercel Analytics) and
// keep only errors that signal a genuine page fault.
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

// reason query value -> a unique substring of loginReasonMessage() in
// src/app/login/page.tsx. "zzz-unbekannt" is any unknown reason and must hit
// the default fallback branch.
const REASON_COPY: ReadonlyArray<readonly [string, RegExp]> = [
  ["progress-save", /Melde dich an, um deinen Lernfortschritt/],
  ["auth-not-configured", /Login ist in dieser Umgebung noch nicht konfiguriert/],
  ["abgelaufen", /Dieser Link ist abgelaufen/],
  ["ungueltig", /Dieser Link ist ungültig/],
  ["zzz-unbekannt", /Der Login konnte nicht abgeschlossen werden/],
];

// ---------------------------------------------------------------------------
// Signed-out surface: the /login gate + reason copy + idle/error form states.
// Applicable whenever there is no live session (the clean verify server, and
// any configured-but-logged-out environment). Skips if a real session is
// present, because then /login redirects to /konto.
// ---------------------------------------------------------------------------

test.describe("signed-out surface (login gate + reason copy)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "authenticated-live",
      "signed-out assertions belong to the provider-free auth scaffold",
    );
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    test.skip(
      page.url().includes("/konto"),
      "A live session redirects /login -> /konto; the signed-out surface only applies when logged out.",
    );
  });

  test("protected /konto fails closed to /login?next=/konto for a signed-out visitor", async ({
    page,
  }) => {
    await page.goto("/konto", { waitUntil: "domcontentloaded" });

    const url = new URL(page.url());
    expect(url.pathname, "middleware must send /konto to /login").toBe("/login");
    // The return target is preserved so the learner lands back on /konto.
    expect(url.searchParams.get("next"), "next must round-trip /konto").toBe("/konto");
    // reason depends on config: auth-not-configured (unconfigured verify server)
    // or progress-save (configured but no user) - both are middleware-set.
    expect(
      ["auth-not-configured", "progress-save"],
      "middleware sets a known reason for the /konto redirect",
    ).toContain(url.searchParams.get("reason"));
    const configured = await page.getByLabel(/E-Mail-Adresse/i).isEnabled();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      configured ? /Fortschritt/i : /Ohne Anmeldung lernen/i,
    );
  });

  for (const [reason, copy] of REASON_COPY) {
    test(`/login?reason=${reason} renders its alert copy`, async ({ page }) => {
      await page.goto(`/login?reason=${reason}`, { waitUntil: "domcontentloaded" });
      const configured = await page.getByLabel(/E-Mail-Adresse/i).isEnabled();
      const expectedCopy = configured
        ? copy
        : /Das Lernkonto ist in dieser Version deaktiviert/;
      await expect(page.getByRole("alert").filter({ hasText: expectedCopy }).first()).toBeVisible();
    });
  }

  test("/login?reason=progress-save links back to the course hub", async ({ page }) => {
    await page.goto("/login?reason=progress-save", { waitUntil: "domcontentloaded" });
    const configured = await page.getByLabel(/E-Mail-Adresse/i).isEnabled();
    await expect(
      page.getByRole("link", {
        name: configured ? /Zurück zum Kursangebot/i : /Zum Kursangebot/i,
      }),
    ).toHaveAttribute("href", "/kurse");
  });

  test("idle /login shows the correct provider state and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const configured = await page.getByLabel(/E-Mail-Adresse/i).isEnabled();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      configured ? /Fortschritt/i : /Ohne Anmeldung lernen/i,
    );
    const alerts = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alerts).toHaveCount(0);
    if (!configured) {
      await expect(
        page.getByRole("note").filter({ hasText: /Supabase Auth ist nicht konfiguriert/ }),
      ).toBeVisible();
    }
    await expect(page.getByRole("status")).toHaveCount(0);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on /login\n${noise.join("\n")}`).toEqual([]);
  });

  test("unconfigured build fails closed with disabled login controls", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    test.skip(
      await email.isEnabled(),
      "Supabase browser client is configured here; the fail-closed provider-free state does not apply.",
    );
    await expect(email).toBeDisabled();
    await expect(page.getByRole("button", { name: /Login-Link/i })).toBeDisabled();
    await expect(
      page.getByRole("note").filter({ hasText: /Supabase Auth ist nicht konfiguriert/ }),
    ).toBeVisible();
    await expect(page.getByText(/verschickt/i)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Authenticated /konto: progress cards, resources, logout wiring. The live
// project must execute these assertions. The provider-free scaffold skips them
// because its cookie cannot pass server-side provider validation.
// ---------------------------------------------------------------------------

test.describe("authenticated /konto (requires a live session)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/konto", { waitUntil: "domcontentloaded" });
    if (testInfo.project.name === "authenticated-live") {
      expect(
        page.url().includes("/login"),
        "live authenticated project must reach /konto with a server-validated session",
      ).toBe(false);
      return;
    }
    test.skip(
      page.url().includes("/login"),
      "Provider-free auth scaffold cannot prove protected server round-trips.",
    );
  });

  test("renders the account header, the KI-Kompetenzweg strip, and the signed-in line", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Lernstand und Ressourcen",
    );

    const stageStrip = page.getByRole("navigation", {
      name: /KI-Kompetenzweg: dein Fortschritt/i,
    });
    await expect(stageStrip).toBeVisible();
    // First + last stage labels from PATHWAY_STAGE_DISPLAY (src/lib/learning-graph).
    await expect(stageStrip).toContainText("Prüfen");
    await expect(stageStrip).toContainText("Vertiefen");

    await expect(page.getByText(/Angemeldet als/i)).toBeVisible();
  });

  test("renders the three native course progress cards", async ({ page }) => {
    // COURSE_CATALOG (src/lib/courses/catalog.ts) is exactly these three native
    // courses; the konto page maps them to <article> progress cards.
    for (const title of ["KI-Führerschein", "EU AI Act Kurs", "AI-Native Arbeitskurs"]) {
      const card = page.locator("article").filter({
        has: page.getByRole("heading", { level: 2, name: title }),
      });
      await expect(card, `course card "${title}" is present`).toBeVisible();
      await expect(
        card.getByText(/\d+\/\d+ Lektionen · \d+%/),
        `course card "${title}" shows a progress line`,
      ).toBeVisible();
    }
    // The next-step nudge, or the all-complete state if every course is done.
    await expect(page.getByText(/Nächster Schritt|Gut gemacht/)).toBeVisible();
  });

  test("exposes the resources grid and the Datenschutz management link", async ({
    page,
  }) => {
    await expect(page.getByRole("link", { name: /Lernbücher/i })).toHaveAttribute(
      "href",
      "/buecher",
    );
    await expect(page.getByRole("link", { name: /Praxisbeispiele/i })).toHaveAttribute(
      "href",
      "/demos",
    );
    await expect(
      page.getByRole("link", { name: /Datenschutz & Datenverwaltung/i }),
    ).toHaveAttribute("href", "/konto/datenschutz");
  });

  test("renders the logout control wired to POST /auth/logout", async ({ page }) => {
    // Assert the wiring WITHOUT submitting: a real signOut() would revoke the
    // shared test session server-side and break sibling tests' isolation. The
    // endpoint's own behaviour (405 on GET, redirect to /login on POST) is an
    // API-level concern (src/app/auth/logout/route.ts; regression coverage).
    const logoutForm = page.locator('form[action="/auth/logout"]');
    await expect(logoutForm).toHaveAttribute("method", "post");
    await expect(logoutForm.getByRole("button", { name: /Logout/i })).toBeVisible();
  });

  test("a live session redirects /login back to /konto", async ({ page }) => {
    // getAuthenticatedUser() -> configured && user -> redirect(next="/konto").
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/konto(\?|$)/);
  });
});

// ---------------------------------------------------------------------------
// Deferred: the "sent" success state + 30s resend throttle need a CONFIGURED
// browser Supabase client (NEXT_PUBLIC_SUPABASE_* at build) plus a page.route
// mock of the OTP send - unreachable on the unconfigured verify server, where
// createBrowserSupabaseClient() is null and the request never fires. Selectors
// are the real login-form outputs (src/app/login/login-form.tsx): a first send
// sets role=status "Login-Link verschickt"; a second submit inside 30s stays
// role=status but switches to the "wurde bereits verschickt" throttle copy.
// Enable when CI provides a configured isolated Supabase client and OTP mock.
// ---------------------------------------------------------------------------

test.fixme(
  "login sent-state + 30s resend throttle (needs configured client + OTP mock)",
  async ({ page }) => {
    await page.route("**/auth/v1/otp**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    const submit = page.getByRole("button", { name: /Login-Link/i });

    await email.fill("lernende@example.com");
    await submit.click();
    // First successful send -> "sent" status copy.
    await expect(page.getByRole("status")).toContainText(/Login-Link verschickt/);

    // Second submit inside the 30s window -> throttled, still "sent".
    await submit.click();
    await expect(page.getByRole("status")).toContainText(
      /Login-Link wurde bereits verschickt/,
    );
  },
);
