import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WieKiFunktioniertPage from "../wie-ki-funktioniert/page";
import { getLektionById } from "@/lib/wie-ki-funktioniert";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

describe("/wie-ki-funktioniert landing page", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockResolvedValue("de");
  });

  it("renders without throwing", async () => {
    render(await WieKiFunktioniertPage());
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders all four lesson titles", async () => {
    render(await WieKiFunktioniertPage());
    const page = document.body.textContent ?? "";
    expect(page).toContain("Tokenvorhersage");
    expect(page).toContain("Trainingsdaten");
    expect(page).toContain("Halluzination");
    expect(page).toContain("Betriebsgrenzen");
  });

  it("renders a lektion-cards container with four cards", async () => {
    render(await WieKiFunktioniertPage());
    const cards = screen.getByTestId("lektion-cards");
    expect(cards).toBeInTheDocument();
    // Should have 4 links (one per lesson card)
    const links = cards.querySelectorAll("a");
    expect(links.length).toBe(4);
  });

  it("renders without any login prompt or auth gate", async () => {
    render(await WieKiFunktioniertPage());
    const page = document.body.textContent ?? "";
    // Must not have login/auth prompts (but "kein Login" — no login — is fine)
    expect(page).not.toContain("Bitte melde dich an");
    expect(page).not.toContain("E-Mail");
    expect(page).not.toContain("Passwort");
    // "kein Login" is expected — there should NOT be any forms
    const forms = document.querySelectorAll("form");
    expect(forms.length).toBe(0);
  });

  it("contains links to /einstieg and /ki-fuehrerschein", async () => {
    render(await WieKiFunktioniertPage());
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/ki-fuehrerschein");
    expect(hrefs).toContain("/einstieg");
  });

  it("uses descriptive breadcrumb link text for the homepage", async () => {
    render(await WieKiFunktioniertPage());
    expect(screen.getByRole("link", { name: "Startseite" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.queryByRole("link", { name: "Start" }),
    ).not.toBeInTheDocument();
  });

  it("renders the reviewed English bundle with locale-preserving links", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    render(await WieKiFunktioniertPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How Language Models Work",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Token prediction/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/en",
    );
    expect(
      screen.getByRole("link", { name: /Go to Everyday AI Literacy/ }),
    ).toHaveAttribute("href", "/en/ki-fuehrerschein");
    expect(
      screen.getByRole("link", { name: /Back to the introduction/ }),
    ).toHaveAttribute("href", "/en/einstieg");
  });
});

describe("getLektionById helper", () => {
  it("returns the correct lektion for lektion-1-vorhersage", () => {
    const l = getLektionById("lektion-1-vorhersage");
    expect(l).toBeDefined();
    expect(l?.title).toContain("Tokenvorhersage");
  });

  it("returns undefined for nonexistent ID", () => {
    expect(getLektionById("nonexistent")).toBeUndefined();
  });
});
