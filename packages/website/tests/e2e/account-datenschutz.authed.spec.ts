import { test, expect, type Page } from "@playwright/test";

/**
 * Konto / DSGVO data-management E2E (regression coverage, spec 2).
 *
 * Runs under either the provider-free `auth-scaffold` project or the explicit,
 * fail-closed `authenticated-live` project. Both load storageState written by
 * tests/e2e/auth.setup.ts.
 *
 * DUAL-MODE, mirroring authenticated-routes.authed.spec.ts, because Supabase
 * is optional:
 *   - Provider-free scaffold: auth.setup.ts supplies a deterministic mock cookie
 *     and the production build ships without Supabase env
 *     (getSupabasePublicConfig() === null, see src/lib/supabase/config.ts). The
 *     server-validated context is effectively SIGNED OUT, so src/middleware.ts
 *     fails /konto/datenschutz closed to /login. In this window the
 *     "signed-out gate" describe RUNS a real green assertion (the /login?next=
 *     redirect for the DSGVO subpath) and the "authenticated DSGVO round-trips"
 *     describe SKIPS with an annotation.
 *   - Live integration run: setup requires the six-variable isolated-project
 *     contract and the context must be SIGNED IN, so the round-trips execute
 *     (export download, reset-per-course, two-step delete) and the signed-out
 *     gate self-disables (a live session renders the page instead of
 *     redirecting).
 * The live project never converts a failed session into a skip. Account APIs
 * have unit coverage; this file mocks their browser boundary with route.fulfill
 * and proves the client round-trips.
 *
 * Every selector/string below is verified against src/app/konto/datenschutz/
 * page.tsx, src/middleware.ts, src/lib/course/types.ts (COURSE_SLUGS) and
 * src/lib/progress/types.ts (UNIFIED_STORAGE_KEY) - no invented UI.
 */

const ROUTE = "/konto/datenschutz";

// src/lib/progress/types.ts: UNIFIED_STORAGE_KEY. Hardcoded (not imported) so
// this spec also guards the literal against a silent rename; the delete handler
// clears exactly this key (page.tsx line 72).
const UNIFIED_STORAGE_KEY = "loehrning-progress-v2";

// A unique marker seeded into the unified store before a delete, so the
// post-delete assertion is race-immune: store.ts load() re-persists a FRESH
// store on any mount-time read when the key is absent (line 144), so the home
// page we land on may re-create the key with default contents. Proving the
// SEEDED marker is gone still proves the client's removeItem() ran, without
// depending on whether "/" reads the store first.
const SEEDED_MARKER = "playwright-seeded-marker-4242";

// Console-error filter mirrors authenticated-routes.authed.spec.ts /
// buecher-library.spec.ts: drop framework noise, keep genuine page faults.
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

// Scope to one of the three <article> cards via its h2 (page.tsx lines 116-201).
function sectionByHeading(page: Page, heading: string) {
  return page.locator("article").filter({
    has: page.getByRole("heading", { level: 2, name: heading }),
  });
}

// ---------------------------------------------------------------------------
// Signed-out gate: the DSGVO subpath must fail closed to /login. Applicable
// whenever there is no live session (the clean verify server, and any
// configured-but-logged-out environment). Skips if a real session is present,
// because then /login redirects to /konto.
// ---------------------------------------------------------------------------

test.describe("signed-out surface: the /konto/datenschutz gate", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "authenticated-live",
      "signed-out assertions belong to the provider-free auth scaffold",
    );
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    test.skip(
      page.url().includes("/konto"),
      "A live session redirects /login -> /konto; the signed-out gate only applies when logged out.",
    );
  });

  test("protected /konto/datenschutz fails closed to /login?next=/konto/datenschutz", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const url = new URL(page.url());
    expect(
      url.pathname,
      "middleware must send /konto/datenschutz to /login",
    ).toBe("/login");
    // The return target is preserved so the learner lands back on the DSGVO page.
    expect(
      url.searchParams.get("next"),
      "next must round-trip /konto/datenschutz",
    ).toBe("/konto/datenschutz");
    // reason depends on config: auth-not-configured (unconfigured verify server)
    // or progress-save (configured but no user, /konto/ prefix) - both are
    // middleware-set (src/middleware.ts lines 83-88).
    expect(
      ["auth-not-configured", "progress-save"],
      "middleware sets a known reason for the /konto/datenschutz redirect",
    ).toContain(url.searchParams.get("reason"));
  });
});

// ---------------------------------------------------------------------------
// Authenticated DSGVO round-trips. The live project must execute these
// assertions. The provider-free scaffold skips them because its cookie cannot
// pass server-side provider validation.
// ---------------------------------------------------------------------------

test.describe("authenticated /konto/datenschutz round-trips (requires a live session)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    if (testInfo.project.name === "authenticated-live") {
      expect(
        page.url().includes("/login"),
        "live authenticated project must reach the DSGVO page with a server-validated session",
      ).toBe(false);
      return;
    }
    test.skip(
      page.url().includes("/login"),
      "Provider-free auth scaffold cannot prove protected server round-trips.",
    );
  });

  test("renders the DSGVO management page: h1, three sections, no console fault", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    // Re-navigate with the listener attached so a clean load is measured.
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Datenschutz & Datenverwaltung",
    );
    // The three data-rights cards (Art. 20 export, per-course reset, Art. 17 delete).
    await expect(
      page.getByRole("heading", { level: 2, name: "Meine Daten exportieren (Art. 20 DSGVO)" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Kursfortschritt zurücksetzen" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Konto löschen (Art. 17 DSGVO)" }),
    ).toBeVisible();
    // Back-to-konto link.
    await expect(
      page.getByRole("link", { name: /Zurück zum Konto/i }),
    ).toHaveAttribute("href", "/konto");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("export (Art. 20) triggers a date-stamped JSON blob download", async ({
    page,
  }) => {
    // Real backend mocked at the browser boundary: any 200 JSON is enough for the
    // client to build the blob and click the download anchor (page.tsx 20-39).
    await page.route("**/api/account/export", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          {
            email: "lernende@example.com",
            exported_at: new Date().toISOString(),
            progress: null,
            progress_updated_at: null,
            certificates: [],
          },
          null,
          2,
        ),
      }),
    );

    const exportButton = page.getByRole("button", { name: "Daten herunterladen" });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportButton.click(),
    ]);
    // Client names the file loehrning-export-YYYY-MM-DD.json (page.tsx line 31).
    expect(download.suggestedFilename()).toMatch(
      /^loehrning-export-\d{4}-\d{2}-\d{2}\.json$/,
    );
  });

  test("reset-per-course posts the course slug and marks only that course reset", async ({
    page,
  }) => {
    let postedBody: unknown = null;
    await page.route("**/api/account/reset-progress", async (route) => {
      postedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, resetCourse: "ki-fuehrerschein" }),
      });
    });

    const resetSection = sectionByHeading(page, "Kursfortschritt zurücksetzen");
    // One <li> per COURSE_SLUGS entry (src/lib/course/types.ts). Row label comes
    // from COURSE_LABELS in page.tsx; target KI-Führerschein (ki-fuehrerschein).
    const kiFRow = resetSection.locator("li").filter({ hasText: "KI-Führerschein" });
    const kiFButton = kiFRow.getByRole("button");
    const euRow = resetSection.locator("li").filter({ hasText: "EU AI Act Kurs" });
    const euButton = euRow.getByRole("button");

    await expect(kiFButton).toHaveText("Zurücksetzen");
    await kiFButton.click();

    // On success the row button flips to the done label and disables (page.tsx 152-156).
    await expect(kiFButton).toHaveText("Zurückgesetzt");
    await expect(kiFButton).toBeDisabled();
    // Per-course: the sibling course row is untouched.
    await expect(euButton).toHaveText("Zurücksetzen");
    await expect(euButton).toBeEnabled();

    // The client posted exactly the targeted course slug (page.tsx 45-49).
    expect(postedBody).toEqual({ courseSlug: "ki-fuehrerschein" });
  });

  test("delete (Art. 17) is a two-step confirm; cancel aborts without calling the API", async ({
    page,
  }) => {
    let deleteCalled = false;
    await page.route("**/api/account/delete", async (route) => {
      deleteCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ deleted: true }),
      });
    });

    const deleteSection = sectionByHeading(page, "Konto löschen (Art. 17 DSGVO)");
    const trigger = deleteSection.getByRole("button", { name: "Konto löschen" });

    // First click arms the confirm state: warning copy + relabelled button +
    // an Abbrechen escape hatch. No request fires yet (page.tsx 58-62).
    await trigger.click();
    await expect(deleteSection.getByText(/Bist du sicher\?/)).toBeVisible();
    await expect(
      deleteSection.getByRole("button", { name: "Ja, Konto endgültig löschen" }),
    ).toBeVisible();
    const cancel = deleteSection.getByRole("button", { name: "Abbrechen" });
    await expect(cancel).toBeVisible();

    // Cancel returns to idle without deleting.
    await cancel.click();
    await expect(deleteSection.getByText(/Bist du sicher\?/)).toHaveCount(0);
    await expect(
      deleteSection.getByRole("button", { name: "Konto löschen" }),
    ).toBeVisible();
    expect(deleteCalled, "cancel must not call DELETE /api/account/delete").toBe(false);
  });

  test("delete confirm clears the unified store and redirects home", async ({
    page,
  }) => {
    await page.route("**/api/account/delete", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ deleted: true }),
      }),
    );

    // Seed the unified gamification store with a unique marker so we can prove
    // the client wipes it (page.tsx 72: localStorage.removeItem).
    await page.evaluate(
      ([key, marker]) =>
        localStorage.setItem(
          key,
          JSON.stringify({ schemaVersion: 2, courses: {}, note: marker }),
        ),
      [UNIFIED_STORAGE_KEY, SEEDED_MARKER],
    );

    const deleteSection = sectionByHeading(page, "Konto löschen (Art. 17 DSGVO)");
    await deleteSection.getByRole("button", { name: "Konto löschen" }).click();
    await deleteSection
      .getByRole("button", { name: "Ja, Konto endgültig löschen" })
      .click();

    // On { deleted: true } the client redirects to "/" via window.location.href.
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);

    // The seeded store is gone (marker absent). A fresh default store may have
    // been re-persisted by the home page, but it never carries the marker.
    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      UNIFIED_STORAGE_KEY,
    );
    expect(stored ?? "").not.toContain(SEEDED_MARKER);
  });
});
