import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { books } from "@/lib/books";

const runtime = vi.hoisted(() => ({ account: false, feedback: false }));

vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: () => runtime,
}));

import HilfePage from "./page";

describe("HilfePage book access copy", () => {
  beforeEach(() => {
    runtime.account = false;
    runtime.feedback = false;
  });

  it("matches the current book catalog and provider-free PDF policy", () => {
    render(<HilfePage />);
    const expectedIntro =
      books.length === 1
        ? "Das Buch ist kostenlos im Browser lesbar"
        : `Alle ${books.length} Bücher sind kostenlos im Browser lesbar`;
    expect(
      screen.getByText(new RegExp(expectedIntro)),
    ).toHaveTextContent(/PDF-Download ist in dieser Version deaktiviert/);
  });

  it("names self-issued German records without presenting them as certificates", () => {
    render(<HilfePage />);

    expect(
      screen.getByText("Was bedeuten Teilnahmebestätigung und Lernnachweis?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Diese selbst ausgestellten Abschlussdokumente/),
    ).toHaveTextContent(/nicht servergeprüft/);
    expect(screen.queryByText("Was bedeutet das Teilnahme-Zertifikat?")).toBeNull();
  });

  it("states the provider-free access boundary exactly", () => {
    render(<HilfePage />);

    expect(
      screen.getByText(/Bücher, Demos, KI-Check und die sechs technischen Kursreader/),
    ).toHaveTextContent(/ohne Konto erreichbar/);
    expect(
      screen.getByText(/Bücher, Demos, KI-Check und die sechs technischen Kursreader/),
    ).toHaveTextContent(/vier Kursreader sind deshalb vorübergehend nicht erreichbar/);
  });
});
