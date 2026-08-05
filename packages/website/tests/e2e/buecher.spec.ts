import { test, expect } from "@playwright/test";

const FORBIDDEN_RESOURCE_COPY =
  /(Jetzt kaufen|Jetzt sichern|Premium|Termin buchen|Kostenloses Erstgespräch|Preisliste|Buchungsprozess|PDF-Neufassung in Prüfung|PDF-Bücher)/i;

test.describe("/buecher public book library", () => {
  test("provider-free readers can access the library without an impossible login CTA", async ({
    page,
  }) => {
    await page.goto("/buecher", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/buecher$/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);

    await expect(
      page.getByText(/PDF-Download nicht verfügbar/i),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /PDF nach Login/i })).toHaveCount(0);
    await expect(page.locator('a[download][href*="download.pdf"]')).toHaveCount(0);

    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(FORBIDDEN_RESOURCE_COPY);
  });

  test("PDF download route reports unavailable without the account backend", async ({
    request,
  }) => {
    const res = await request.get("/api/buecher/ki-landschaft/download.pdf");
    expect(res.status()).toBe(503);
  });

  test("PDF download route 404s for a hidden/unpublished book", async ({
    request,
  }) => {
    const res = await request.get("/api/buecher/ki-arbeitsalltag/download.pdf");
    expect(res.status()).toBe(404);
  });

  test("public books API exposes open-reader metadata for the published book only", async ({
    request,
  }) => {
    const res = await request.get("/api/books.json");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("public");
    const body = await res.json();
    expect(body.library_requires_login).toBe(false);
    expect(body.count).toBe(1);
    expect(body.books).toHaveLength(1);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("/downloads/");
    for (const book of body.books) {
      expect(book.reader_requires_login).toBe(false);
      expect(book.reader_url).toContain("/buecher/");
      expect(book.preview_note).toMatch(/open to the public/i);
    }
    // The auth-gated download route URL is fine to expose publicly here —
    // the route itself enforces the login check, not the URL's secrecy.
    expect(body.books[0].pdf).toBe("/api/buecher/ki-landschaft/download.pdf");
    expect(body.books[0].pdf_available).toBe(false);
    expect(body.books[0].pdf_requires_account).toBe(true);
  });
});
