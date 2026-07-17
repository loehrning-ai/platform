import { test, expect } from "@playwright/test";

const PDF_PATHS = [
  "/downloads/ki-landschaft-2026.pdf",
  "/downloads/ki-arbeitsalltag-2026.pdf",
  "/downloads/ki-tools-selbststaendige-2026.pdf",
] as const;

const FORBIDDEN_RESOURCE_COPY =
  /(Jetzt kaufen|Jetzt sichern|Premium|Termin buchen|Kostenloses Erstgespräch|Preisliste|Buchungsprozess|PDF herunterladen|PDF-Neufassung in Prüfung|PDF-Bücher)/i;

test.describe("/buecher public book library", () => {
  test("anonymous readers can access the public library", async ({ page }) => {
    await page.goto("/buecher", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/buecher$/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    for (const pdfPath of PDF_PATHS) {
      await expect(page.locator(`a[href="${pdfPath}"]`)).toHaveCount(0);
    }
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(FORBIDDEN_RESOURCE_COPY);
  });

  for (const pdfPath of PDF_PATHS) {
    test(`PDF ${pdfPath} is disabled with 410`, async ({ request }) => {
      const res = await request.head(pdfPath);
      expect(res.status()).toBe(410);
      expect(res.headers()["x-robots-tag"]).toContain("noindex");
    });
  }

  test("public books API exposes open-reader metadata only", async ({ request }) => {
    const res = await request.get("/api/books.json");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("public");
    const body = await res.json();
    expect(body.library_requires_login).toBe(false);
    expect(body.count).toBe(3);
    expect(body.books).toHaveLength(3);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("/downloads/");
    for (const book of body.books) {
      expect(book.reader_requires_login).toBe(false);
      expect(book.reader_url).toContain("/buecher/");
      expect(book.preview_note).toMatch(/open to the public/i);
    }
  });
});
