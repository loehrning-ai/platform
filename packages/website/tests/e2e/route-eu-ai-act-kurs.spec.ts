import { test, expect, type Page } from "@playwright/test";

/**
 * /eu-ai-act-kurs smoke + funnel (regression coverage wave 2). The landing
 * funnels into the hub at /eu-ai-act-kurs/kurs, which now requires login
 * (exception to policy D1 — see src/lib/crawl/contract.ts PROTECTED_PATHS).
 * An anonymous visitor following the funnel or a real block link
 * (EU_AI_ACT_KURS_CONFIG.blockIds = block_1..block_6) is redirected by
 * src/proxy.ts to /login?next=<path>&reason=auth-not-configured in the
 * provider-free suite before reaching the hub/reader. These tests assert that
 * explicit fallback, not the reader content itself (which needs a live session; see
 * tests/e2e/authenticated-routes.authed.spec.ts).
 */

const LANDING = "/eu-ai-act-kurs";
const HUB = "/eu-ai-act-kurs/kurs";
const BLOCK = "/eu-ai-act-kurs/kurs/block_1"; // first real blockId, always prerendered
const LANDING_HEADING = "Rollen, Risiken und Pflichten einordnen.";
const CURRICULUM_HEADING =
  "Sechs Blöcke, eine durchgehende Klassifikationslogik.";
const START_CTA = "Kurs mit Lernkonto starten";

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

test.describe("/eu-ai-act-kurs landing", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${LANDING}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(LANDING_HEADING);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${LANDING}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("shows the curriculum section and a funnel CTA into the hub", async ({
    page,
  }) => {
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    // Curriculum section header: catches a stripped block list.
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: CURRICULUM_HEADING,
        exact: true,
      }),
    ).toBeVisible();

    // Primary funnel CTA (rendered top + bottom); first must resolve to the hub.
    const startCta = page
      .getByRole("link", { name: START_CTA, exact: true })
      .first();
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", HUB);
  });
});

test.describe("/eu-ai-act-kurs funnel (login-gated hub)", () => {
  test("start CTA redirects an anonymous visitor to /login", async ({
    page,
  }) => {
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    await Promise.all([
      page.waitForURL(/\/login/),
      page
        .getByRole("link", { name: START_CTA, exact: true })
        .first()
        .click(),
    ]);
    const url = new URL(page.url());
    expect(url.pathname, "CTA must land on /login for an anonymous visitor").toBe(
      "/login",
    );
    expect(url.searchParams.get("next")).toBe(HUB);
    expect(url.searchParams.get("reason")).toBe("auth-not-configured");
  });

  test("a /kurs/block_1 request gets a 307 to /login for anonymous readers", async ({
    request,
  }) => {
    const response = await request.get(BLOCK, { maxRedirects: 0 });
    expect(response.status(), `status for ${BLOCK}`).toBe(307);

    const location = response.headers()["location"];
    expect(location, `${BLOCK} must set a Location header`).toBeTruthy();
    const redirectUrl = new URL(location ?? "", "http://localhost");
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("next")).toBe(BLOCK);
    expect(redirectUrl.searchParams.get("reason")).toBe("auth-not-configured");
  });
});

test.describe("/eu-ai-act-kurs mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: START_CTA, exact: true }).first(),
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
