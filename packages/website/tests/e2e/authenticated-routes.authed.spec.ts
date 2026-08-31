import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { COURSE_CATALOG } from "../../src/lib/courses/catalog";

/**
 * Projects where the SERVER resolves a real session, so the signed-in DOM is
 * expected to render: the credentialed live tier, and the mocked-session tier
 * whose Supabase endpoints are served in-process. The provider-free
 * `auth-scaffold` project is deliberately absent - it is always signed out.
 */
const SERVER_SESSION_PROJECTS = new Set([
  "authenticated-live",
  "konto-dom-mocked",
]);


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
 *     src/proxy.ts fails /konto closed to /login. In this window the
 *     "signed-out surface" describe RUNS real green assertions (the /login?next=
 *     gate, every reason-query copy branch, the idle state, and the unconfigured
 *     no-config + error path) and the "authenticated /konto" describe SKIPS with
 *     an annotation.
 *   - Live integration run: setup requires the nine-variable isolated-project
 *     contract, seeds a real test session, and the context must be SIGNED IN;
 *     progress cards, resources, logout wiring, and the login redirect execute.
 * The live project never converts a failed session into a skip: protected-route
 * redirects fail the run. The scaffold name is deliberately not live-auth proof.
 *
 * Every selector/string below is verified against src/app/login/page.tsx,
 * src/app/login/login-form.tsx, src/app/konto/page.tsx, src/proxy.ts and
 * src/lib/courses/catalog.ts - no invented UI.
 */

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
}

// reason query value -> a unique substring of loginReasonMessage() in
// src/app/login/page.tsx. "zzz-unbekannt" is any unknown reason and must hit
// the default fallback branch.
const REASON_COPY: ReadonlyArray<readonly [string, RegExp]> = [
  ["progress-save", /Eine Anmeldung ist in dieser Umgebung nicht freigegeben/],
  ["auth-not-configured", /Eine Anmeldung ist in dieser Umgebung nicht freigegeben/],
  ["abgelaufen", /Dieser Link ist abgelaufen/],
  ["ungueltig", /Dieser Link ist ungültig/],
  ["zzz-unbekannt", /Die Anmeldung konnte nicht abgeschlossen werden/],
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
      SERVER_SESSION_PROJECTS.has(testInfo.project.name),
      "signed-out assertions belong to the provider-free auth scaffold",
    );
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(
      new URL(page.url()).pathname,
      "the provider-free scaffold must remain signed out even with its fabricated cookie",
    ).toBe("/login");
  });

  test("protected /konto fails closed to /login?next=/konto for a signed-out visitor", async ({
    page,
  }) => {
    await page.goto("/konto", { waitUntil: "domcontentloaded" });

    const url = new URL(page.url());
    expect(url.pathname, "middleware must send /konto to /login").toBe("/login");
    // The return target is preserved so the learner lands back on /konto.
    expect(url.searchParams.get("next"), "next must round-trip /konto").toBe("/konto");
    expect(url.searchParams.get("reason")).toBe("auth-not-configured");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Weiter ohne Konto/i,
    );
  });

  for (const [reason, copy] of REASON_COPY) {
    test(`/login?reason=${reason} renders its alert copy`, async ({ page }) => {
      await page.goto(`/login?reason=${reason}`, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("alert").filter({ hasText: copy }).first(),
      ).toBeVisible();
    });
  }

  test("/login?reason=progress-save links back to the course hub", async ({ page }) => {
    await page.goto("/login?reason=progress-save", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", {
        name: /Zum Kursangebot/i,
      }),
    ).toHaveAttribute("href", "/kurse");
  });

  test("idle /login shows the correct provider state and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Weiter ohne Konto/i,
    );
    const alerts = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alerts).toHaveCount(0);
    await expect(
      page.getByRole("note").filter({ hasText: /Anmeldung ist in dieser Umgebung nicht konfiguriert/ }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on /login\n${noise.join("\n")}`).toEqual([]);
  });

  test("unconfigured build fails closed without rendering provider controls", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const email = page.getByLabel(/E-Mail-Adresse/i);
    await expect(email).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Login-Link/i })).toHaveCount(0);
    await expect(
      page.getByRole("note").filter({ hasText: /Anmeldung ist in dieser Umgebung nicht konfiguriert/ }),
    ).toBeVisible();
    await expect(page.getByText(/verschickt/i)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Authenticated /konto: progress cards, resources, logout wiring. The live
// project must execute these assertions. The provider-free scaffold skips them
// because its cookie cannot pass server-side provider validation.
//
// THREE TIERS RUN THIS FILE, AND THEY PROVE DIFFERENT THINGS.
//
//   auth-scaffold      provider-free build, always signed out. Skips this
//                      block; runs the signed-out block above.
//   konto-dom-mocked   runs in ordinary CI. The build carries only public
//                      Supabase config, and the endpoints the server calls
//                      during SSR are served by an in-process preload
//                      (tests/e2e/fixtures/mock-auth-backend.cjs). The mock
//                      derives its user from the presented token's own claims,
//                      so these assertions do prove that the session cookie
//                      reaches the server and that the bearer token and apikey
//                      survive @supabase/ssr into the outbound call, and that
//                      the signed-in DOM renders from it.
//   authenticated-live opt-in, credentialed, needs a separate seeded Supabase
//                      project via the nine variables in
//                      scripts/validate-e2e-auth-env.mjs.
//
// WHAT THE MOCKED TIER DOES NOT PROVE: it never verifies a JWT signature, so it
// says nothing about real authentication, token refresh, expiry, RLS on
// user_course_progress, logout revocation, magic-link/OTP, or Turnstile. Green
// here means the DOM and the token plumbing are intact, not that auth works.
// Only authenticated-live can make the stronger claim.
// ---------------------------------------------------------------------------

test.describe("authenticated /konto (requires a live session)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/konto", { waitUntil: "domcontentloaded" });
    if (SERVER_SESSION_PROJECTS.has(testInfo.project.name)) {
      expect(
        page.url().includes("/login"),
        "live authenticated project must reach /konto with a server-validated session",
      ).toBe(false);
      return;
    }
    expect(
      new URL(page.url()).pathname,
      "the provider-free scaffold cookie must never pass server authentication",
    ).toBe("/login");
    test.skip(
      true,
      "Provider-free auth scaffold cannot prove protected server round-trips.",
    );
  });

  test("renders the current account header and signed-in identity", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Dein Lernstand",
    );
    await expect(page.getByText(/Angemeldet als/i)).toBeVisible();
  });

  test("renders every catalog course progress card", async ({ page }) => {
    for (const { title } of COURSE_CATALOG) {
      // <Card> (src/components/ui/card.tsx) renders a plain <div> here (no
      // href passed for a course tile), not an <article> - it never has and
      // never will render <article> for any variant. The <h3> course title
      // sits two levels below the Card root (h3 -> the "flex items-start"
      // header row -> the Card div itself; src/app/konto/page.tsx:257-267),
      // so walk up from the heading rather than assume a semantic container.
      const heading = page.getByRole("heading", { level: 3, name: title });
      const card = heading.locator("xpath=../..");
      await expect(card, `course card "${title}" is present`).toBeVisible();
      await expect(
        card.getByText(/\d+\/\d+ Lektionen · \d+%/),
        `course card "${title}" shows a progress line`,
      ).toBeVisible();
    }
    await expect(page.getByRole("progressbar")).toHaveCount(
      COURSE_CATALOG.length,
    );
    // Two mutually exclusive "next step" Cards (page.tsx:204-248): one kicker
    // reads copy.continueLabel ("Weiter lernen") when a next course exists,
    // the other copy.statusLabel ("Kursstatus") when every course is
    // complete. "Gut gemacht" is not present in account-copy.ts today.
    await expect(page.getByText(/Weiter lernen|Kursstatus/)).toBeVisible();
  });

  test("has no WCAG-tagged accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("exposes the resources grid and the Datenschutz management link", async ({
    page,
  }) => {
    // Scoped to main: the global footer links to /buecher and /demos with the
    // same labels, so an unscoped role query matches two elements and fails
    // strict mode. This assertion is about the account page's own resources
    // grid, not the site chrome.
    const main = page.getByRole("main");
    await expect(
      main.getByRole("link", { name: /Lernbücher/i }),
    ).toHaveAttribute("href", "/buecher");
    await expect(
      main.getByRole("link", { name: /Praxisbeispiele/i }),
    ).toHaveAttribute("href", "/demos");
    await expect(
      main.getByRole("link", { name: /Datenschutz und Datenverwaltung/i }),
    ).toHaveAttribute("href", "/konto/datenschutz");
  });

  test("renders the logout control wired to POST /auth/logout", async ({ page }) => {
    // Assert the wiring WITHOUT submitting: a real signOut() would revoke the
    // shared test session server-side and break sibling tests' isolation. The
    // endpoint's own behaviour (405 on GET, redirect to /login on POST) is an
    // API-level concern (src/app/auth/logout/route.ts; regression coverage).
    const logoutForm = page.locator('form[action="/auth/logout"]');
    await expect(logoutForm).toHaveAttribute("method", "post");
    await expect(
      logoutForm.getByRole("button", { name: /Abmelden/i }),
    ).toBeVisible();
  });

  // Needs a FULLY configured account runtime, which neither auth tier builds.
  // /login only redirects when accountReady is true, and isAccountRuntimeReady()
  // additionally requires the service-role config, SUPABASE_REGION and a
  // past-dated DPA confirmation. Both the mocked and the live tier build with
  // the three public variables only, so accountReady is false and /login
  // correctly renders its unavailable branch instead of redirecting. Enable
  // when a tier builds with the complete server-side account configuration.
  test.fixme(
    "a live session redirects /login back to /konto",
    async ({ page }) => {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/konto(\?|$)/);
    },
  );
});

// ---------------------------------------------------------------------------
// Deferred: the "sent" success state + 30s resend throttle need a CONFIGURED
// browser Supabase client (NEXT_PUBLIC_SUPABASE_* at build) plus a page.route
// mock of the OTP send - unreachable on the unconfigured verify server, where
// createBrowserSupabaseClient() is null and the request never fires. Selectors
// are the real login-form outputs (src/app/login/login-form.tsx): a first send
// sets role=status "Login-Link verschickt"; a second submit inside 30s stays
// role=status but switches to the "wurde gerade verschickt" throttle copy.
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
      /Login-Link wurde gerade verschickt/,
    );
  },
);
