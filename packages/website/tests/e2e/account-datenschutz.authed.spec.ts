import { test, expect, type Page } from "@playwright/test";

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
 *     server-validated context is effectively SIGNED OUT, so src/proxy.ts
 *     fails /konto/datenschutz closed to /login. In this window the
 *     "signed-out gate" describe RUNS a real green assertion (the /login?next=
 *     redirect for the DSGVO subpath) and the "authenticated DSGVO round-trips"
 *     describe SKIPS with an annotation.
 *   - Live integration run: setup requires the nine-variable isolated-project
 *     contract and the context must be SIGNED IN, so the round-trips execute
 *     (export download, reset-per-course, two-step delete) and the signed-out
 *     gate self-disables (a live session renders the page instead of
 *     redirecting).
 * The live project never converts a failed session into a skip. Account APIs
 * have unit coverage; this file mocks their browser boundary with route.fulfill
 * and proves the client round-trips.
 *
 * Every selector/string below is verified against src/app/konto/datenschutz/
 * page.tsx, src/proxy.ts, src/lib/course/types.ts (COURSE_SLUGS) and
 * src/lib/progress/types.ts (UNIFIED_STORAGE_KEY) - no invented UI.
 */

const ROUTE = "/konto/datenschutz";

// src/lib/progress/types.ts: UNIFIED_STORAGE_KEY. Hardcoded (not imported) so
// this spec also guards the base-key literal against a silent rename. The live
// test resolves the verified account prefix before seeding private data.
const UNIFIED_STORAGE_KEY = "loehrning-progress-v2";

// A unique marker seeded into the account-owned store before a delete, so the
// post-delete assertion is race-immune: store.ts load() re-persists a FRESH
// store on any mount-time read when the key is absent (line 144), so the home
// page we land on may re-create the key with default contents. Proving the
// SEEDED marker is gone still proves the client's removeItem() ran, without
// depending on whether "/" reads the store first.
const SEEDED_MARKER = "playwright-seeded-marker-4242";

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
      SERVER_SESSION_PROJECTS.has(testInfo.project.name),
      "signed-out assertions belong to the provider-free auth scaffold",
    );
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(
      new URL(page.url()).pathname,
      "the provider-free scaffold must remain signed out even with its fabricated cookie",
    ).toBe("/login");
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
    expect(url.searchParams.get("reason")).toBe("auth-not-configured");
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
    if (SERVER_SESSION_PROJECTS.has(testInfo.project.name)) {
      expect(
        page.url().includes("/login"),
        "live authenticated project must reach the DSGVO page with a server-validated session",
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

  test("export (Art. 20) streams a date-stamped native download", async ({
    page,
  }) => {
    let preflightOwner: string | null = null;
    await page.route("**/api/account/export", (route) => {
      const request = route.request();
      expect(request.method()).toBe("POST");
      const contentType = request.headers()["content-type"] ?? "";
      if (contentType.startsWith("application/json")) {
        const body = request.postDataJSON() as {
          expectedOwnerId?: unknown;
          preflight?: unknown;
        };
        expect(body.preflight).toBe(true);
        expect(typeof body.expectedOwnerId).toBe("string");
        preflightOwner = body.expectedOwnerId as string;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ready: true,
            ownerId: body.expectedOwnerId,
          }),
        });
      }
      expect(contentType).toContain("application/x-www-form-urlencoded");
      const ownerId = new URLSearchParams(request.postData() ?? "").get(
        "expectedOwnerId",
      );
      expect(ownerId).toBe(preflightOwner);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Content-Disposition":
            'attachment; filename="loehrning-export-2026-07-29.json"',
        },
        body: JSON.stringify(
          {
            owner_id: ownerId,
            email: "lernende@example.com",
            exported_at: new Date().toISOString(),
            progress: null,
            progress_updated_at: null,
            certificates: [],
            export_complete: true,
          },
          null,
          2,
        ),
      });
    });

    const exportButton = page.getByRole("button", { name: "Daten herunterladen" });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportButton.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^loehrning-export-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const stream = await download.createReadStream();
    let downloaded = "";
    for await (const chunk of stream) {
      downloaded += chunk.toString("utf8");
    }
    const payload = JSON.parse(downloaded) as {
      readonly owner_id?: unknown;
      readonly export_complete?: unknown;
    };
    expect(payload.owner_id).toBe(preflightOwner);
    expect(payload.export_complete).toBe(true);
    await expect(page.getByRole("status")).toContainText(
      "Download wurde angefordert",
    );
  });

  test("export surfaces an early native form failure without buffering a file", async ({
    page,
  }) => {
    await page.route("**/api/account/export", (route) => {
      const request = route.request();
      const contentType = request.headers()["content-type"] ?? "";
      if (contentType.startsWith("application/json")) {
        const body = request.postDataJSON() as {
          expectedOwnerId?: unknown;
        };
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ready: true,
            ownerId: body.expectedOwnerId,
          }),
        });
      }
      return route.fulfill({
        status: 503,
        contentType: "text/html; charset=utf-8",
        body: [
          "<!doctype html>",
          '<html lang="de"><head><title>Datenexport fehlgeschlagen</title></head>',
          "<body><main><h1>Datenexport fehlgeschlagen</h1>",
          "<p>Der geschützte Export-Datenspeicher ist vorübergehend nicht verfügbar.</p>",
          "<p>Fehlercode: <code>export_store_unavailable</code></p>",
          '<a href="/konto/datenschutz">Zurück zu Datenschutz und Datenverwaltung</a>',
          "</main></body></html>",
        ].join(""),
      });
    });

    await Promise.all([
      page.waitForURL("**/api/account/export"),
      page.getByRole("button", { name: "Daten herunterladen" }).click(),
    ]);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Datenexport fehlgeschlagen",
      }),
    ).toBeVisible();
    await expect(page.getByText("export_store_unavailable")).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Zurück zu Datenschutz und Datenverwaltung",
      }),
    ).toHaveAttribute("href", "/konto/datenschutz");
  });

  test("reset-per-course posts the course slug and marks only that course reset", async ({
    page,
  }) => {
    let postedBody: unknown = null;
    await page.route("**/api/account/reset-progress", async (route) => {
      postedBody = route.request().postDataJSON();
      const ownerId = (postedBody as { expectedOwnerId?: unknown })
        .expectedOwnerId;
      expect(typeof ownerId).toBe("string");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          ownerId,
          resetCourse: "ki-fuehrerschein",
          resetAt: "2026-07-28T00:00:00.000Z",
        }),
      });
    });

    const resetSection = sectionByHeading(page, "Kursfortschritt zurücksetzen");
    // One <li> per COURSE_SLUGS entry (src/lib/course/types.ts). Row label comes
    // from COURSE_LABELS in page.tsx; target KI-Führerschein (ki-fuehrerschein).
    const kiFRow = resetSection.locator("li").filter({ hasText: "KI-Führerschein" });
    const euRow = resetSection.locator("li").filter({ hasText: "EU AI Act Kurs" });
    const euButton = euRow.getByRole("button", {
      name: "Zurücksetzen",
      exact: true,
    });

    const reset = kiFRow.getByRole("button", {
      name: "Zurücksetzen",
      exact: true,
    });
    await reset.click();
    expect(postedBody, "first click must not reset progress").toBeNull();
    await expect(kiFRow.getByRole("alert")).toContainText(
      "Fortschritt für KI-Führerschein wirklich zurücksetzen?",
    );

    const confirm = kiFRow.getByRole("button", {
      name: "Ja, endgültig zurücksetzen",
    });
    await expect(confirm).toHaveAttribute("aria-expanded", "true");
    await confirm.click();

    // On success the row button flips to the done label and disables.
    const done = kiFRow.getByRole("button", { name: "Zurückgesetzt" });
    await expect(done).toBeDisabled();
    // Per-course: the sibling course row is untouched.
    await expect(euButton).toHaveText("Zurücksetzen");
    await expect(euButton).toBeEnabled();

    // The client binds the target course to its verified browser owner.
    expect(postedBody).toEqual({
      courseSlug: "ki-fuehrerschein",
      expectedOwnerId: expect.any(String),
    });
  });

  test("delete (Art. 17) is a two-step confirm; cancel aborts without calling the API", async ({
    page,
  }) => {
    let deleteCalled = false;
    await page.route("**/api/account/delete", async (route) => {
      deleteCalled = true;
      const body = route.request().postDataJSON() as {
        expectedOwnerId?: unknown;
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          deleted: true,
          ownerId: body.expectedOwnerId,
        }),
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

  test("delete confirm clears unified, legacy, reader, draft, and session data", async ({
    page,
  }) => {
    await page.route("**/api/account/delete", (route) => {
      const body = route.request().postDataJSON() as {
        expectedOwnerId?: unknown;
      };
      expect(typeof body.expectedOwnerId).toBe("string");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          deleted: true,
          ownerId: body.expectedOwnerId,
        }),
      });
    });

    const localKeys = [
      UNIFIED_STORAGE_KEY,
      "course-progress::ki-fuehrerschein",
      "ki-fuehrerschein-progress",
      "ai-native-progress-v1",
      "reader:progress:ki-landschaft:01_eisberg",
      "reflect::mindset/1::reflection",
      "slots::engineering/3::slots",
      "selfrate::mindset/2::rating",
      "matrix::mindset/3::matrix",
      "plays::operations/1::moves",
    ];
    const sessionKeys = [
      "ai-native-exercise-draft-l1-e1",
      "ai-native-challenge-draft-1",
      "ai-native-continue-dismissed",
    ];
    const accountPrefix = await page.evaluate(async (storageKey) => {
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        const key = Object.keys(localStorage).find(
          (candidate) =>
            candidate.startsWith("loehrning-learning-account-v1:") &&
            candidate.endsWith(`:${storageKey}`),
        );
        if (key) return key.slice(0, -storageKey.length);
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }
      return null;
    }, UNIFIED_STORAGE_KEY);
    expect(accountPrefix).not.toBeNull();

    await page.evaluate(
      ({ localKeys, sessionKeys, marker, accountPrefix }) => {
        for (const key of localKeys) {
          localStorage.setItem(
            `${accountPrefix}${key}`,
            JSON.stringify({ schemaVersion: 2, courses: {}, note: marker }),
          );
        }
        for (const key of sessionKeys) {
          sessionStorage.setItem(`${accountPrefix}${key}`, marker);
        }
      },
      {
        localKeys,
        sessionKeys,
        marker: SEEDED_MARKER,
        accountPrefix: accountPrefix!,
      },
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
      ({ localKeys, sessionKeys, accountPrefix }) => ({
        local: Object.fromEntries(
          localKeys.map((key) => [
            key,
            localStorage.getItem(`${accountPrefix}${key}`),
          ]),
        ),
        session: Object.fromEntries(
          sessionKeys.map((key) => [
            key,
            sessionStorage.getItem(`${accountPrefix}${key}`),
          ]),
        ),
      }),
      { localKeys, sessionKeys, accountPrefix: accountPrefix! },
    );
    expect(stored.local[UNIFIED_STORAGE_KEY] ?? "").not.toContain(
      SEEDED_MARKER,
    );
    for (const key of localKeys.slice(1)) {
      expect(stored.local[key], key).toBeNull();
    }
    for (const key of sessionKeys) {
      expect(stored.session[key], key).toBeNull();
    }
  });
});
