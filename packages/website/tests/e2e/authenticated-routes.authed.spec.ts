import { test, expect, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";
import AxeBuilder from "@axe-core/playwright";
import { COURSE_CATALOG } from "../../src/lib/courses/catalog";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
} from "../../src/lib/courses/completion";
import { OPEN_SOURCE_TOOL_ARTIFACTS } from "../../src/lib/open-source/artifacts";
import {
  UNIFIED_SCHEMA_VERSION,
  UNIFIED_STORAGE_KEY,
} from "../../src/lib/progress/types";

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
 * The one tier whose account state is known by construction: its progress
 * table is an in-process mock that always answers an empty row set. Specs
 * that need "the account holds nothing" as a precondition run here only.
 */
const MOCKED_SESSION_PROJECT = "konto-dom-mocked";


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
 * src/app/login/login-form.tsx, src/app/konto/page.tsx, the region components
 * in src/app/konto/sections/, src/app/konto/import-progress-island.tsx,
 * src/proxy.ts and src/lib/courses/catalog.ts - no invented UI.
 */

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
    const errors = collectBrowserErrors(page);
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

    const noise = meaningfulBrowserErrors(errors);
    expect(
      noise,
      `console errors on /login\n${formatBrowserErrors(noise)}`,
    ).toEqual([]);
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
      // header row -> the Card div itself; src/app/konto/sections/course-card.tsx),
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
    // Two mutually exclusive "next step" Cards in
    // src/app/konto/sections/weiterlernen.tsx: one kicker reads
    // copy.continueLabel ("Weiter lernen") when a next course exists, the
    // other copy.statusLabel ("Kursstatus") when every course is complete.
    // "Gut gemacht" is not present in account-copy.ts today.
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

  test("offers the cv-engine as source and self-host only while the hosted tool is off", async ({
    page,
  }) => {
    // Neither auth tier's server carries CV_ENGINE_HOSTED_URL (the test server
    // blanks it on purpose, see TEST_SERVER_DENIED_PROVIDER_KEYS in
    // playwright.config.ts), so isCvEngineHostedReady() is false and the card
    // must claim nothing beyond what /open-source already publishes: the
    // repository and the self-host guide, both taken from the same registry.
    const cvEngine = OPEN_SOURCE_TOOL_ARTIFACTS.find(
      (artifact) => artifact.slug === "cv-engine",
    );
    expect(cvEngine, "cv-engine is a published tool artifact").toBeDefined();
    if (!cvEngine) return;

    const region = page.locator("#konto-werkzeuge");
    await expect(region).toHaveAttribute("data-konto-werkzeuge", "source-only");
    await expect(
      region.getByRole("heading", { level: 2, name: "Werkzeuge" }),
    ).toBeVisible();
    await expect(
      region.getByRole("heading", { level: 3, name: "CV Engine" }),
    ).toBeVisible();
    await expect(region.getByRole("link", { name: /Quellcode/ })).toHaveAttribute(
      "href",
      cvEngine.source.href,
    );
    await expect(
      region.getByRole("link", { name: "Selbst betreiben" }),
    ).toHaveAttribute("href", cvEngine.href);
    // No open control and no document numbers: the handoff form only exists
    // for a deployment that actually hosts the tool.
    await expect(region.getByRole("button", { name: /Öffnen/ })).toHaveCount(0);
    await expect(region.locator("form")).toHaveCount(0);
    await expect(region.getByText(/Dokument/)).toHaveCount(0);
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
// Local progress import: the one client island on /konto.
//
// The island (src/app/konto/import-progress-island.tsx) reads this browser's
// ANONYMOUS learning namespace, asks GET /api/progress what the account holds,
// and offers the difference once. The storageState the auth setup writes
// carries cookies only, so by default there is no namespace and the island
// must render nothing and ask nothing.
//
// WHAT EACH TIER PROVES HERE.
//   Both server-session tiers: no namespace, no offer, no request.
//   konto-dom-mocked only: the seeded-namespace journey. Its progress table is
//   an in-process mock that always answers an empty row set, so "the account
//   holds nothing" is true by construction and the preview numbers are exact.
//   The account read is the REAL round trip (browser -> /api/progress ->
//   server -> mocked backend), which is what proves the cookie-bound API path
//   and the server-derived owner id. The confirm step is answered at the
//   browser boundary with page.route: the tier has no rate-limit secret and
//   no service client, so the real route can only refuse, and its behaviour
//   is pinned by its own unit tests. Answering it here keeps every state the
//   island renders (done, refused) under test without mutating any account,
//   and proves the request it sends carries the raw namespace and the owner
//   the server named.
//   authenticated-live: skipped. A live account's state is unknown, so the
//   preview cannot be asserted, and a confirmed import there is one-shot.
// ---------------------------------------------------------------------------

/**
 * A current-schema anonymous snapshot: one course, two completed lessons, the
 * gamification ledger the island never posts as a projection. Lesson and
 * section ids come from the canonical registry so the payload is one the
 * server would accept, even though these tests never let it reach the server.
 */
function anonymousSnapshot(): Record<string, unknown> {
  const [firstLesson, secondLesson] = CANONICAL_LESSON_IDS["ki-fuehrerschein"];
  const sections = CANONICAL_SECTION_IDS["ki-fuehrerschein"];
  const lesson = (lessonId: string) => ({
    sectionsRead: [...(sections[lessonId] ?? [])],
    quizScore: 1,
    quizTotal: 1,
    completed: true,
    exercisesCompleted: {},
  });
  const lastActivity = "2026-08-02T10:00:00.000Z";
  return {
    schemaVersion: UNIFIED_SCHEMA_VERSION,
    courses: {
      "ki-fuehrerschein": {
        lessons: {
          [firstLesson]: lesson(firstLesson),
          [secondLesson]: lesson(secondLesson),
        },
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: "2026-08-01T10:00:00.000Z",
        lastActivity,
      },
    },
    xp: 50,
    checkpoints: {},
    badges: {},
    streak: { days: 2, last: "2026-08-02" },
    lastActivity,
  };
}

const SNAPSHOT = anonymousSnapshot();
const SNAPSHOT_JSON = JSON.stringify(SNAPSHOT);
const CONFIRM_LABEL = "Lokalen Fortschritt übernehmen";

function isAccountRead(url: string, method: string): boolean {
  return new URL(url).pathname === "/api/progress" && method === "GET";
}

async function readAnonymousNamespace(page: Page): Promise<string | null> {
  return page.evaluate(
    (key) => window.localStorage.getItem(key),
    UNIFIED_STORAGE_KEY,
  );
}

test.describe("local progress import (anonymous namespace offered once)", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      !SERVER_SESSION_PROJECTS.has(testInfo.project.name),
      "the island only mounts on the signed-in page, which needs a server-resolved session",
    );
  });

  test("offers nothing and writes nothing without a local namespace", async ({
    page,
  }) => {
    // Import requests only. GET /api/progress is NOT asserted here, because
    // the island is not its only caller: app/layout.tsx mounts
    // UserProgressSync on every page, and its runtime reads the same route
    // once a browser session verifies. Requiring zero of those would be a bet
    // on another component's behaviour on this tier. "No namespace means the
    // island asks nothing at all" is pinned where it is attributable, in
    // src/app/konto/import-progress-island.test.tsx, against a stubbed fetch
    // that records every call.
    const imports: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/progress/import") {
        imports.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.goto("/konto", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Dein Lernstand",
    );
    await expect(page.locator("[data-progress-import]")).toHaveCount(0);
    expect(imports).toEqual([]);
    // The signed-in page must not conjure an anonymous namespace either: the
    // account's own record lives under a per-account prefix, and this bare key
    // stays the property of a signed-out browser.
    expect(await readAnonymousNamespace(page)).toBeNull();
  });

  test.describe("with a seeded anonymous namespace", () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== MOCKED_SESSION_PROJECT,
        "needs an account known to hold nothing; the live account's state is unknown and an import there is one-shot",
      );
      // Written before any page script runs, on every navigation, exactly
      // where the anonymous store keeps it: the bare key, plain JSON.
      await page.addInitScript(
        ([key, value]) => {
          window.localStorage.setItem(key, value);
        },
        [UNIFIED_STORAGE_KEY, SNAPSHOT_JSON] as const,
      );
    });

    test("previews the courses and lessons the account lacks, from a real account read", async ({
      page,
    }) => {
      const accountRead = page.waitForResponse((response) =>
        isAccountRead(response.url(), response.request().method()),
      );
      await page.goto("/konto", { waitUntil: "domcontentloaded" });

      const response = await accountRead;
      expect(response.status(), "the cookie-bound API route answers").toBe(200);
      const body = (await response.json()) as { ownerId?: unknown };
      expect(typeof body.ownerId, "the server names the owner").toBe("string");

      const offer = page.locator('[data-progress-import="offer"]');
      await expect(offer).toBeVisible();
      await expect(offer).toContainText("Lokaler Lernstand");
      await expect(offer).toContainText("1 Kurs, 2 Lektionen");
      await expect(
        offer.getByRole("button", { name: CONFIRM_LABEL }),
      ).toBeEnabled();
      // Byte-for-byte, so this covers the whole signed-in page and not only
      // the island: an account's record lives under a per-account prefix
      // (ownedLearningStorageKey), so nothing on /konto may rewrite the bare
      // signed-out key, background sync included.
      expect(await readAnonymousNamespace(page)).toBe(SNAPSHOT_JSON);
    });

    test("posts the raw namespace with the server-named owner and shows the result", async ({
      page,
    }) => {
      let posted: unknown = null;
      await page.route("**/api/progress/import", async (route) => {
        posted = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            importedAt: "2026-09-05T09:00:00.000Z",
            merged: { courses: 1, lessons: 2 },
            progress: null,
            updatedAt: "2026-09-05T09:00:00.000Z",
          }),
        });
      });
      const accountRead = page.waitForResponse((response) =>
        isAccountRead(response.url(), response.request().method()),
      );
      await page.goto("/konto", { waitUntil: "domcontentloaded" });
      const { ownerId } = (await (await accountRead).json()) as {
        ownerId: string;
      };

      await page.getByRole("button", { name: CONFIRM_LABEL }).click();

      const done = page.locator('[data-progress-import="done"]');
      await expect(done).toBeVisible();
      await expect(done).toContainText(
        "1 Kurs und 2 Lektionen sind jetzt in deinem Konto",
      );
      await expect(
        done.getByRole("button", { name: "Lernstand neu laden" }),
      ).toBeVisible();
      await expect(page.locator('[data-progress-import="offer"]')).toHaveCount(0);
      // The request carries the namespace exactly as stored (checkpoints,
      // badges and streak included) and the owner the server named, never a
      // client-side projection or a client-chosen id.
      expect(posted).toEqual({ expectedOwnerId: ownerId, progress: SNAPSHOT });
      expect(await readAnonymousNamespace(page)).toBe(SNAPSHOT_JSON);
    });

    test("keeps the offer and the namespace when the server refuses", async ({
      page,
    }) => {
      await page.route("**/api/progress/import", (route) =>
        route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            error: "progress_already_imported",
            importedAt: "2026-08-20T09:00:00.000Z",
          }),
        }),
      );
      await page.goto("/konto", { waitUntil: "domcontentloaded" });

      await page.getByRole("button", { name: CONFIRM_LABEL }).click();

      const alert = page.getByRole("alert").filter({ hasText: /20\.8\.2026/ });
      await expect(alert).toBeVisible();
      await expect(alert).toContainText("Übernahme nicht möglich");
      await expect(alert).toContainText("Dein lokaler Lernstand ist unverändert");
      // Retryable: the action stays, and the local data stays with it.
      await expect(page.getByRole("button", { name: CONFIRM_LABEL })).toBeEnabled();
      expect(await readAnonymousNamespace(page)).toBe(SNAPSHOT_JSON);
    });

    test("offers nothing when the account already holds the namespace", async ({
      page,
    }) => {
      // The state after a successful import: the account contains the
      // snapshot, so the difference is zero and no second offer appears.
      await page.route("**/api/progress", (route) =>
        isAccountRead(route.request().url(), route.request().method())
          ? route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                ownerId: "00000000-0000-4000-8000-000000000000",
                progress: SNAPSHOT,
                updatedAt: "2026-09-05T09:00:00.000Z",
              }),
            })
          : route.continue(),
      );
      const accountRead = page.waitForResponse((response) =>
        isAccountRead(response.url(), response.request().method()),
      );
      await page.goto("/konto", { waitUntil: "domcontentloaded" });
      await accountRead;

      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Dein Lernstand",
      );
      await expect(page.locator("[data-progress-import]")).toHaveCount(0);
      expect(await readAnonymousNamespace(page)).toBe(SNAPSHOT_JSON);
    });
  });
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
