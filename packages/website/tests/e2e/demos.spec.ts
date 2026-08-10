import { expect, test } from "@playwright/test";

const DEMO_SLUGS = [
  "excel",
  "word",
  "outbound-workflow",
  "agent-pipeline",
  "n8n-supply-chain",
  "rag-vertragsassistent",
  "rechnung-zu-sap",
  "prompt-scanner",
  "cost-drift-observability",
  "fine-tune-playground",
  "roi-rechner",
] as const;

test.describe("/demos gallery", () => {
  test("anonymous learners can access the public gallery", async ({ page }) => {
    await page.goto("/demos", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/demos$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Arbeitsabläufe prüfen. Annahmen sichtbar machen.",
    );
    await expect(page.locator("[data-demo-tile]").first()).toBeVisible();
  });

  test("query-state URL remains public", async ({ page }) => {
    await page.goto("/demos?cat=RAG&level=einstieg");
    await expect(page).toHaveURL(/\/demos\?cat=RAG&level=einstieg/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Arbeitsabläufe prüfen. Annahmen sichtbar machen.",
    );
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("/demos/[slug] detail routes", () => {
  for (const slug of DEMO_SLUGS) {
    test(`${slug} renders publicly`, async ({ page }) => {
      const res = await page.goto(`/demos/${slug}`, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBe(200);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("legacy demo briefing PDF endpoint remains protected or gone", async ({ request }) => {
    const res = await request.get("/api/demos/excel/briefing.pdf");
    expect([401, 410, 503]).toContain(res.status());
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("unknown slug renders not-found", async ({ page }) => {
    const res = await page.goto("/demos/does-not-exist", { waitUntil: "domcontentloaded" });
    expect([200, 404]).toContain(res?.status());
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("legacy /leistungen/bauen/[slug] product routes", () => {
  for (const slug of ["datenpilot", "prozessautomat", "ki-assistent", "compliance-guard"] as const) {
    test(`${slug} redirects to the platform trust page`, async ({ request }) => {
      const res = await request.get(`/leistungen/bauen/${slug}`, { maxRedirects: 0 });
      expect([301, 308]).toContain(res.status());
      expect(res.headers()["location"]).toContain("/ueber-die-plattform");
    });
  }
});
