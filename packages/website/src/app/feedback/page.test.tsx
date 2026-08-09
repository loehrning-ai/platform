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

  it("fails closed to a mailto fallback when storage is not configured", async () => {
    await renderPage("de");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Es werden keine Formulardaten gespeichert.",
    );
    expect(screen.queryByRole("textbox", { name: /Nachricht/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Rückmeldung senden/i }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: /tim@loehrning\.ai/i }),
    ).toHaveAttribute("href", "mailto:tim@loehrning.ai");
  });

  it("mounts the form only when the server feature boundary is ready", async () => {
    runtime.feedback = true;
    await renderPage("de");

    expect(screen.queryByRole("status")).toBeNull();
    expect(
      screen.getByRole("group", { name: /Art der Rückmeldung/i }),
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: /Nachricht/i })).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Rückmeldung senden/i }),
    ).toBeEnabled();
  });

  it("renders the provider-free English state without German UI", async () => {
    await renderPage("en");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Report an error or unclear passage",
      }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "No form data is stored.",
    );
    expect(document.body).not.toHaveTextContent("Formular deaktiviert");
  });

  it.each([
    ["de", "Rückmeldung"],
    ["en", "Feedback"],
  ] as const)(
    "keeps %s metadata noindex without canonical or social identity",
    async (locale, title) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.description).not.toMatch(/anonym|anonymous/i);
      expect(metadata.description).toMatch(
        locale === "de"
          ? /weder Name noch E-Mail-Adresse/
          : /neither a name nor an email address/,
      );
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(metadata.alternates).toEqual({ canonical: null });
      expect(metadata.openGraph).toBeNull();
    },
  );
});
