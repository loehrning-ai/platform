import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { books } from "@/lib/books";

const FORBIDDEN_RESOURCE_COPY =
  /(Jetzt kaufen|Jetzt sichern|Premium|Termin buchen|Beratungsgespräch|Kostenloses Erstgespräch|Preisliste|Buchungsprozess|PDF herunterladen|PDF-Neufassung in Prüfung|PDF-Bücher)/i;

describe("GET /api/books.json", () => {
  it("returns the simplified learning-resource catalog", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toMatch(/public/);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");

    const body = await response.json();
    expect(body.schema).toBe("https://loehrning.ai/schema/books/v1");
    expect(body.count).toBe(books.length);
    expect(body.page_url).toBe("https://loehrning.ai/api/books.json");
    // field was renamed gated_library_url → library_url; login no longer required
    expect(body.library_url).toBe("https://loehrning.ai/buecher");
    expect(body.library_requires_login).toBe(false);

    for (const book of body.books) {
      // Endpoint presence and runtime availability are independent: a
      // provider-free build exposes the stable URL but honestly reports that
      // account-gated downloads are unavailable.
      if (book.pdf) {
        expect(book.pdf).toMatch(/^\/api\/buecher\/.+\/download\.pdf$/);
        expect(book.pdf_requires_account).toBe(true);
      } else {
        expect(book.pdf_requires_account).toBe(false);
      }
      if (book.pdf_available) expect(book.pdf).not.toBeNull();
      expect(book.preview_pages).toEqual([]);
      expect(book.preview_note).toMatch(/no login required/i);
      expect(JSON.stringify(book)).not.toMatch(/\/book-covers\//);
      expect(book.overview_url).toBe("https://loehrning.ai/api/books.json");
      expect(book.preview_url).toMatch(/^https:\/\/loehrning\.ai\/api\/books\.json#/);
      expect(book.resource_url).toBe(book.preview_url);
      expect(book.reader_url).toMatch(/^https:\/\/loehrning\.ai\/buecher\//);
      expect(book.reader_requires_login).toBe(false);
      expect(book.access_policy).toBe("open-reader");
      expect(book.page_count).toBeGreaterThan(0);
      expect(book.reading_time_minutes).toBeGreaterThan(0);
      expect(book.last_reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(book.next_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // License policy no longer mentions Lernkonto
      expect(book.license_policy).not.toMatch(/Lernkonto/);
      expect(book.related_resource.href).toMatch(/^https:\/\/loehrning\.ai\//);
      expect(JSON.stringify(book)).not.toMatch(/\/downloads\/.*\.pdf/);
      expect(JSON.stringify(book)).not.toMatch(FORBIDDEN_RESOURCE_COPY);
    }
  });
});
