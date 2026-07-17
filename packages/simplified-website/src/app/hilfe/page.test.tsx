import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { books } from "@/lib/books";
import HilfePage from "./page";

describe("HilfePage book access copy", () => {
  it("matches the browser-only book catalog instead of promising account PDFs", () => {
    render(<HilfePage />);
    expect(
      screen.getByText(new RegExp(`Alle ${books.length} Bücher sind kostenlos im Browser`)),
    ).toHaveTextContent(/PDF-Downloads werden in dieser Version nicht angeboten/);
    expect(document.body.textContent).not.toMatch(/PDF.*kostenlosen Konto/i);
  });
});
