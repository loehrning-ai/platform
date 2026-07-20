import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { books } from "@/lib/books";
import HilfePage from "./page";

describe("HilfePage book access copy", () => {
  it("matches the current book catalog and PDF-for-logged-in-users policy", () => {
    render(<HilfePage />);
    const expectedIntro =
      books.length === 1
        ? "Das Buch ist kostenlos im Browser lesbar"
        : `Alle ${books.length} Bücher sind kostenlos im Browser lesbar`;
    expect(
      screen.getByText(new RegExp(expectedIntro)),
    ).toHaveTextContent(/PDF-Download steht angemeldeten Nutzern zur Verfügung/);
  });
});
