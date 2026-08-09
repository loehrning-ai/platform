import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import BekanntGrenzenPage, { generateMetadata } from "./page";

async function renderPage(locale: "de" | "en") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await BekanntGrenzenPage());
}

describe("Known limitations locale content", () => {
  beforeEach(() => {
    runtime.account = false;
    runtime.magicLink = false;
    runtime.google = false;
    runtime.feedback = false;
    getRequestLocaleMock.mockReset();
  });

  it("states the current Article 4 boundary without presenting a local record as proof", async () => {
    await renderPage("de");

    expect(screen.getByRole("heading", { name: "Bekannte Grenzen" })).toBeVisible();
    expect(screen.getByText(/Artikel 4 verlangt Maßnahmen zur Förderung/)).toHaveTextContent(
      /keine Garantie eines bestimmten individuellen Kompetenzniveaus/,
    );
    expect(screen.getByRole("link", { name: /EUR-Lex/ })).toHaveAttribute(
      "href",
      expect.stringContaining("32026R1744"),
    );
  });

  it("renders all limitations and the English provider-free boundary", async () => {
    await renderPage("en");

    expect(screen.getByRole("heading", { level: 1, name: "Known limitations" })).toBeVisible();
    expect(screen.getAllByText("What you can do:")).toHaveLength(5);
    expect(screen.getByText(/Server-side synchronization is not currently/)).toBeVisible();
    expect(document.body).not.toHaveTextContent("Was du tun kannst");
  });

  it("preserves the locale for updates and feedback links", async () => {
    runtime.feedback = true;
    await renderPage("en");

    expect(screen.getByRole("link", { name: "/en/neuigkeiten" })).toHaveAttribute(
      "href",
      "/en/neuigkeiten",
    );
    expect(screen.getByRole("link", { name: "feedback form" })).toHaveAttribute(
      "href",
      "/en/feedback",
    );
  });

  it.each([
    ["de", "/bekannte-grenzen", "Bekannte Grenzen", "de_DE"],
    ["en", "/en/bekannte-grenzen", "Known limitations", "en_GB"],
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
