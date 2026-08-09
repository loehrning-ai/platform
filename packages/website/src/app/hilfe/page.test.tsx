import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { books } from "@/lib/books";

const runtime = vi.hoisted(() => ({
  account: false,
  magicLink: false,
  google: false,
  turnstileSiteKey: null,
  feedback: false,
  supabase: false,
  supabaseRegion: null,
  sentry: false,
  sentryRetentionDays: null,
  anthropic: false,
  anthropicRetentionDays: null,
  vercelHosting: false,
  vercelTelemetry: false,
}));
const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: () => runtime,
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import HilfePage, { generateMetadata } from "./page";

async function renderPage(locale: "de" | "en" = "de") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await HilfePage());
}

describe("HilfePage locale and provider boundaries", () => {
  beforeEach(() => {
    Object.assign(runtime, {
      account: false,
      magicLink: false,
      google: false,
      feedback: false,
    });
    getRequestLocaleMock.mockReset();
  });

  it("matches the current book catalog and provider-free PDF policy", async () => {
    await renderPage("de");

    const expected =
      books.length === 1
        ? "Das Buch ist kostenlos im Browser lesbar"
        : `Alle ${books.length} Bücher sind kostenlos im Browser lesbar`;
    expect(screen.getByText(new RegExp(expected))).toHaveTextContent(
      books.length === 1
        ? /PDF-Download ist aktuell nicht verfügbar/
        : /keine zitierfähigen Rechtsquellen/,
    );
  });

  it("states the fail-closed course and sign-in boundary", async () => {
    await renderPage("de");

    expect(screen.getByText(/Bücher, Demos, KI-Check und 6 technische/)).toHaveTextContent(
      /4 Reader vorübergehend nicht erreichbar/,
    );
    expect(screen.getByText(/Aktuell ist keine Anmeldemethode/)).toBeInTheDocument();
  });

  it("describes only the sign-in methods that are ready", async () => {
    runtime.account = true;
    runtime.google = true;
    await renderPage("de");

    expect(screen.getByText(/bietet aktuell Google-Anmeldung/)).toHaveTextContent(
      /Einmal-Link per E-Mail ist .* nicht freigeschaltet/,
    );
    expect(screen.getByText(/Das Konto synchronisiert Fortschritt/)).toBeInTheDocument();
  });

  it("renders English UI and locale-preserving internal links", async () => {
    await renderPage("en");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Help and frequently asked questions",
      }),
    ).toBeVisible();
    expect(screen.getByText("Where should I start?")).toBeVisible();
    const internalHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href?.startsWith("/")));
    expect(internalHrefs.length).toBeGreaterThan(5);
    expect(internalHrefs.every((href) => href.startsWith("/en/"))).toBe(true);
  });

  it.each([
    ["de", "/hilfe", "Hilfe und häufige Fragen", "de_DE"],
    ["en", "/en/hilfe", "Help and frequently asked questions", "en_GB"],
  ] as const)(
    "uses localized %s metadata",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        title,
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );
});
