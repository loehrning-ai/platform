import { test, expect } from "@playwright/test";

/**
 * Legal pages smoke. The Datenschutz page must distinguish active processors
 * from optional providers that are disabled in the credential-free build.
 */

test.describe("/impressum", () => {
  test("renders h1 + provider, contact and liability sections", async ({
    page,
  }) => {
    const res = await page.goto("/impressum", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Impressum",
    );
    await expect(
      page.getByRole("heading", { name: "Anbieter" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kontakt" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Haftungsausschluss" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Urheberrecht" }),
    ).toBeVisible();
    await expect(page.getByText("tim@loehrning.ai").first()).toBeVisible();
  });
});

test.describe("/datenschutz", () => {
  test("renders h1 and the processor sections 5-9", async ({ page }) => {
    const res = await page.goto("/datenschutz", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Datenschutzerklärung",
    );

    // Processor disclosure sections. The Cookies and Sentry headings are
    // matched number-agnostic (public-content contract) so that renumbering when
    // privacy copy review edits the Datenschutz page does not break the smoke suite.
    await expect(
      page.getByRole("heading", {
        name: /Cookies, lokale Speicherung und Reichweitenmessung/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Technische Fehlerdiagnose \(Sentry\)/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /KI-Lernfeedback und isolierte Kursausführung/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Lernkonto und Datenspeicherung \(Supabase\)/,
      }),
    ).toBeVisible();
    // Optional processors are named and truthfully marked inactive.
    await expect(page.getByText(/Vercel Web Analytics/)).toBeVisible();
    await expect(page.locator("#ki")).toContainText(/deaktiviert/);
    await expect(page.getByText(/Sentry ist .*deaktiviert/)).toBeVisible();
    await expect(
      page.getByText(/Supabase-Lernkonto, Magic-Link- und Google-Anmeldung/),
    ).toBeVisible();
    await expect(page.getByText(/Resend/)).toHaveCount(0);
  });

  test("the Anthropic section carries the #ki deep-link anchor", async ({
    page,
  }) => {
    await page.goto("/datenschutz#ki", { waitUntil: "domcontentloaded" });
    const anchor = page.locator("#ki");
    await expect(anchor).toBeVisible();
    await expect(anchor).toContainText("Anthropic Claude");
  });

  test("never claims to run no analytics", async ({
    page,
  }) => {
    await page.goto("/datenschutz", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/keine Analysetools/)).toHaveCount(0);
  });

  test("Datenschutz: no forbidden commercial phrases (runtime-monitoring policy)", async ({
    page,
  }) => {
    await page.goto("/datenschutz", { waitUntil: "domcontentloaded" });
    // Commercial-era artifacts that must not appear after public-content transition strip
    await expect(page.getByText(/scan_insight_cache/)).toHaveCount(0);
    await expect(page.getByText(/Plausible/)).toHaveCount(0);
    await expect(page.getByText(/PostHog/)).toHaveCount(0);
    await expect(page.getByText(/DigifyDE/)).toHaveCount(0);
    await expect(page.getByText(/DIGIFYDE_API_URL/)).toHaveCount(0);
    await expect(page.getByText(/öffentlich erreichbare Seiten dieser Website automatisiert abgerufen/)).toHaveCount(0);
  });

  test("Datenschutz: processor disclosures are accurate (runtime-monitoring policy)", async ({
    page,
  }) => {
    await page.goto("/datenschutz", { waitUntil: "domcontentloaded" });
    // Anthropic section: must describe learning feedback, not website scanning.
    await expect(page.locator("#ki")).toContainText(/Lernfeedback|automatisiertes Lernfeedback/i);
    // Supabase section: must disclose an EU region (the concrete region is
    // confirmed before production; do not assert a specific city as current fact)
    await expect(page.getByText(/EU-Region/)).toBeVisible();
    // Provider-free build must not claim that errors are transmitted.
    await expect(page.getByText(/keine Fehlerereignisse an Sentry/)).toBeVisible();
  });
});
