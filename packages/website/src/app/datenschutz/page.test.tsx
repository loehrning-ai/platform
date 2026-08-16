import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { runtime, requestLocale } = vi.hoisted(() => ({
  requestLocale: { value: "de" as "de" | "en" },
  runtime: {
    account: false,
    magicLink: false,
    google: false,
    turnstileSiteKey: null,
    feedback: false,
    supabase: false,
    supabaseRegion: null as string | null,
    anthropic: false,
    anthropicRetentionDays: null as number | null,
    gemini: false,
    geminiRetentionDays: null as number | null,
    practiceModels: [] as (
      | "anthropic/claude-haiku-4.5"
      | "google/gemini-2.5-flash-lite"
    )[],
    courseTerminal: false,
    vercelHosting: false,
    vercelTelemetry: false,
    sentry: false,
    sentryRetentionDays: null as number | null,
  },
}));

vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: () => runtime,
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: () => Promise.resolve(requestLocale.value),
}));

import DatenschutzPage from "./page";
import { EnglishPrivacyContent } from "./privacy-content-en";

function accountSection(): HTMLElement {
  const heading = screen.getByRole("heading", {
    name: "8. Lernkonto und Datenspeicherung (Supabase)",
  });
  const section = heading.closest("div");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

function aiSection(name: RegExp): HTMLElement {
  const heading = screen.getByRole("heading", { name });
  const section = heading.closest("div");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

beforeEach(() => {
  requestLocale.value = "de";
  Object.assign(runtime, {
    account: false,
    magicLink: false,
    google: false,
    turnstileSiteKey: null,
    feedback: false,
    supabase: false,
    supabaseRegion: null,
    anthropic: false,
    anthropicRetentionDays: null,
    gemini: false,
    geminiRetentionDays: null,
    practiceModels: [],
    courseTerminal: false,
    vercelHosting: false,
    vercelTelemetry: false,
    sentry: false,
    sentryRetentionDays: null,
  });
});

describe("Datenschutz account-provider readiness copy", () => {
  it("describes every account and sign-in capability as disabled by default", async () => {
    render(await DatenschutzPage());

    expect(accountSection()).toHaveTextContent(
      "Supabase-Lernkonto, Magic-Link- und Google-Anmeldung",
    );
  });

  it("does not claim a sign-in method for a core-only account runtime", async () => {
    Object.assign(runtime, {
      account: true,
      supabaseRegion: "eu-central-1",
    });
    render(await DatenschutzPage());

    const section = within(accountSection());
    expect(section.getByText(/weder Magic-Link noch Google/)).toBeVisible();
    expect(section.queryByText(/Cloudflare Turnstile/)).toBeNull();
    expect(section.queryByText(/Anmeldung mit Google leitet/)).toBeNull();
  });

  it("discloses Turnstile only when Magic-link readiness is active", async () => {
    Object.assign(runtime, {
      account: true,
      magicLink: true,
      supabaseRegion: "eu-central-1",
    });
    render(await DatenschutzPage());

    const section = within(accountSection());
    expect(
      section.getByText(/Vor dem Versand eines Magic-Links wird Cloudflare Turnstile/),
    ).toBeVisible();
    expect(section.getByText(/mit der OTP-Anfrage an Supabase/)).toBeVisible();
    expect(section.queryByText(/Anmeldung mit Google leitet/)).toBeNull();
  });

  it("discloses Google without claiming Turnstile or added Google permissions", async () => {
    Object.assign(runtime, {
      account: true,
      google: true,
      supabaseRegion: "eu-central-1",
    });
    render(await DatenschutzPage());

    const section = within(accountSection());
    expect(section.getByText(/Anmeldung mit Google leitet/)).toBeVisible();
    expect(section.getByText(/keine zusätzlichen Google-Berechtigungen/)).toBeVisible();
    expect(section.getByText(/Turnstile wird für diese Google-Anmeldung weder geladen/)).toBeVisible();
    expect(section.queryByText(/sichtbare, technisch erforderliche/)).toBeNull();
  });

  it("renders both independent disclosures when both methods are ready", async () => {
    Object.assign(runtime, {
      account: true,
      magicLink: true,
      google: true,
      supabaseRegion: "eu-central-1",
    });
    render(await DatenschutzPage());

    const section = within(accountSection());
    expect(
      section.getByText(/Vor dem Versand eines Magic-Links wird Cloudflare Turnstile/),
    ).toBeVisible();
    expect(section.getByText(/Anmeldung mit Google leitet/)).toBeVisible();
    expect(section.queryByText(/weder Magic-Link noch Google/)).toBeNull();
  });

  it("renders the complete English legal surface without German interface copy", () => {
    Object.assign(runtime, {
      account: true,
      google: true,
      supabase: true,
      supabaseRegion: "eu-central-1",
    });

    const { container } = render(<EnglishPrivacyContent features={runtime} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy policy" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "8. Learning account and data storage (Supabase)",
      }),
    ).toBeVisible();
    expect(container).toHaveTextContent("Article 6(1)(b) GDPR");
    expect(container).toHaveTextContent("no access to Google Drive, Calendar");
    expect(container).toHaveTextContent("Article 77 GDPR");
    expect(container.textContent).not.toMatch(
      /Datenschutzerklärung|Ihre Rechte|Aufbewahrungsfristen|Beschwerderecht/,
    );
  });

  it("discloses a Gemini-only model path instead of claiming provider feedback is disabled", async () => {
    Object.assign(runtime, {
      gemini: true,
      geminiRetentionDays: 0,
      practiceModels: ["google/gemini-2.5-flash-lite"],
    });
    render(await DatenschutzPage());

    const section = within(
      aiSection(/KI-Lernfeedback und isolierte Kursausführung/),
    );
    expect(section.getByText(/Google Gemini API .* ist für das Modell/s)).toBeVisible();
    expect(section.getByText(/API-Schlüssel bleiben auf dem Server/)).toBeVisible();
    expect(section.getByText(/Aufbewahrungsdauer beträgt 0 Tage/)).toBeVisible();
    expect(section.getByText(/Anwendung liest oder beweist.*Abrechnungsstatus/s)).toBeVisible();
    expect(section.queryByText(/Modellanbieter deaktiviert/)).toBeNull();
  });

  it("discloses the enabled synthetic terminal boundary in both languages", async () => {
    runtime.courseTerminal = true;
    const german = render(await DatenschutzPage());
    expect(
      within(aiSection(/KI-Lernfeedback und isolierte Kursausführung/)).getByText(
        /Codex, Data Science, Data Engineering und Data Infrastructure/,
      ),
    ).toBeVisible();
    german.unmount();

    render(<EnglishPrivacyContent features={runtime} />);
    expect(
      within(
        aiSection(/AI learning feedback and isolated course execution/),
      ).getByText(/Codex, Data Science, Data Engineering, and Data Infrastructure/),
    ).toBeVisible();
  });
});
