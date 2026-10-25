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

import FeedbackPage, { generateMetadata } from "./page";

async function renderPage(locale: "de" | "en" = "de") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await FeedbackPage());
}

describe("FeedbackPage locale and provider boundary", () => {
  beforeEach(() => {
    runtime.feedback = false;
    getRequestLocaleMock.mockReset();
  });

  it("renders a plain contact page when storage is not configured", async () => {
    await renderPage("de");

    expect(
      screen.getByRole("heading", { level: 1, name: "Kontakt" }),
    ).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByRole("textbox", { name: /Nachricht/i })).toBeNull();
    expect(document.body).not.toHaveTextContent(/Beta|deaktiviert/i);
    expect(
      screen.getByRole("link", { name: /tim@loehrning\.ai/i }),
    ).toHaveAttribute("href", "mailto:tim@loehrning.ai");
    const linkedIn = screen.getByRole("link", { name: /LinkedIn/ });
    expect(linkedIn).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/www\.linkedin\.com\/in\//),
    );
    expect(linkedIn).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("mounts the form only when the server feature boundary is ready", async () => {
    runtime.feedback = true;
    await renderPage("de");

    expect(
      screen.getByRole("group", { name: /Art der Rückmeldung/i }),
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: /Nachricht/i })).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Rückmeldung senden/i }),
    ).toBeEnabled();
  });

  it("renders the English contact page without German UI", async () => {
    await renderPage("en");

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Tim Löhr on LinkedIn/ }),
    ).toBeVisible();
    expect(document.body).not.toHaveTextContent(/Kontakt|Formular/);
  });

  it.each([
    ["de", false, "Kontakt"],
    ["en", false, "Contact"],
    ["de", true, "Rückmeldung"],
    ["en", true, "Feedback"],
  ] as const)(
    "keeps %s metadata noindex without canonical or social identity (form %s)",
    async (locale, feedback, title) => {
      runtime.feedback = feedback;
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(metadata.alternates).toEqual({ canonical: null });
      expect(metadata.openGraph).toBeNull();
    },
  );
});
