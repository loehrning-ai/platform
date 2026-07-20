import { describe, expect, it } from "vitest";
import { generateBookPdf } from "./book-pdf";
import { getBookById } from "@/lib/books";

describe("generateBookPdf", () => {
  it("renders a real, complete PDF from the ki-landschaft chapter content", async () => {
    const book = getBookById("ki-landschaft");
    expect(book).toBeDefined();

    const buffer = await generateBookPdf(book!, "ki-landschaft");

    // %PDF- magic bytes: proves this is a real PDF, not an empty/garbage buffer.
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    // 10 chapters of real prose plus a title page should produce a
    // substantial file — catches a silently-empty or truncated render.
    expect(buffer.length).toBeGreaterThan(20_000);
  }, 30_000);
});
