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

import UeberDiePlattformPage, { generateMetadata } from "./page";

async function renderPage(locale: "de" | "en") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await UeberDiePlattformPage());
}

describe("platform operating-model locale content", () => {
  beforeEach(() => {
    runtime.account = false;
    runtime.magicLink = false;
    runtime.google = false;
    runtime.feedback = false;
    getRequestLocaleMock.mockReset();
  });

  it("states the provider-free German boundary without credential claims", async () => {
    await renderPage("de");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Öffentliche Inhalte. Kontogebundene Zustände. Belegte Grenzen.",
      }),
    ).toBeVisible();
    expect(screen.queryByText("Nicht verfügbar")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Kontofunktion ist in dieser Laufzeit/),
    ).toBeVisible();
    expect(
      screen.getByText(/Feedback-Formular ist in dieser Laufzeit/),
    ).toBeVisible();
    expect(screen.getByText(/nicht amtlich, nicht akkreditiert/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Bekannte Grenzen" }),
    ).toHaveAttribute("href", "/bekannte-grenzen");
  });

  it("renders complete English copy and locale-preserving links", async () => {
    await renderPage("en");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Public content. Account-bound state. Documented limits.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/account system is not fully configured/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Known limitations" }),
    ).toHaveAttribute("href", "/en/bekannte-grenzen");
    expect(
      screen.getByRole("link", { name: "Open-source hub" }),
    ).toHaveAttribute("href", "/en/open-source");
    expect(document.body).not.toHaveTextContent(
      "Warum der Zugang kostenlos ist",
    );
  });

  it("reports configured account and feedback state from the runtime", async () => {
    runtime.account = true;
    runtime.google = true;
    runtime.feedback = true;
    await renderPage("en");

    expect(screen.queryByText("Configured")).not.toBeInTheDocument();
    expect(
      screen.getByText(/synchronizes progress, quiz status/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Report a correction" }),
    ).toHaveAttribute("href", "/en/feedback");
  });

  it.each([
    ["de", "/ueber-die-plattform", "Über die Plattform", "de_DE"],
    ["en", "/en/ueber-die-plattform", "About the platform", "en_GB"],
  ] as const)(
    "uses reviewed %s metadata and reciprocal alternates",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({
        canonical,
        languages: {
          de: "/ueber-die-plattform",
          en: "/en/ueber-die-plattform",
          "x-default": "/ueber-die-plattform",
        },
      });
      expect(metadata.openGraph).toMatchObject({
        title,
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );
});
