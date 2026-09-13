import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { runtime, requestLocale } = vi.hoisted(() => ({
  requestLocale: { value: "de" as "de" | "en" },
  runtime: {
    account: false,
    magicLink: false,
    google: false,
    github: false,
    turnstileSiteKey: null,
    feedback: false,
    supabase: false,
    supabaseRegion: null as string | null,
    anthropic: false,
    anthropicRetentionDays: null as number | null,
    gemini: false,
    geminiRetentionDays: null as number | null,
    practiceModels: [] as (
      "anthropic/claude-haiku-4.5" | "google/gemini-2.5-flash-lite"
    )[],
    courseTerminal: false,
    cvEngineHosted: false,
    agentAccess: false,
    adminAnalytics: false,
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
    github: false,
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
    cvEngineHosted: false,
    agentAccess: false,
    adminAnalytics: false,
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
    expect(
      section.getByText(/weder Magic-Link noch Google noch GitHub/),
    ).toBeVisible();
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
      section.getByText(
        /Vor dem Versand eines Magic-Links wird Cloudflare Turnstile/,
      ),
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
    expect(
      section.getByText(/keine zusätzlichen Google-Berechtigungen/),
    ).toBeVisible();
    expect(
      section.getByText(
        /Turnstile wird für diese Google-Anmeldung weder geladen/,
      ),
    ).toBeVisible();
    expect(
      section.queryByText(/sichtbare, technisch erforderliche/),
    ).toBeNull();
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
      section.getByText(
        /Vor dem Versand eines Magic-Links wird Cloudflare Turnstile/,
      ),
    ).toBeVisible();
    expect(section.getByText(/Anmeldung mit Google leitet/)).toBeVisible();
    expect(section.queryByText(/weder Magic-Link noch Google/)).toBeNull();
    expect(section.queryByText(/Anmeldung mit GitHub leitet/)).toBeNull();
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
    expect(
      section.getByText(/Google Gemini API .* ist für das Modell/s),
    ).toBeVisible();
    expect(
      section.getByText(/API-Schlüssel bleiben auf dem Server/),
    ).toBeVisible();
    expect(
      section.getByText(/Aufbewahrungsdauer beträgt 0 Tage/),
    ).toBeVisible();
    expect(
      section.getByText(/Anwendung liest oder beweist.*Abrechnungsstatus/s),
    ).toBeVisible();
    expect(section.queryByText(/Modellanbieter deaktiviert/)).toBeNull();
  });

  it("discloses the enabled synthetic terminal boundary in both languages", async () => {
    runtime.courseTerminal = true;
    const german = render(await DatenschutzPage());
    expect(
      within(
        aiSection(/KI-Lernfeedback und isolierte Kursausführung/),
      ).getByText(
        /Codex, Data Science, Data Engineering und Data Infrastructure/,
      ),
    ).toBeVisible();
    german.unmount();

    render(<EnglishPrivacyContent features={runtime} />);
    expect(
      within(
        aiSection(/AI learning feedback and isolated course execution/),
      ).getByText(
        /Codex, Data Science, Data Engineering, and Data Infrastructure/,
      ),
    ).toBeVisible();
  });
});

function sectionByHeading(name: string | RegExp): HTMLElement {
  const heading = screen.getByRole("heading", { name });
  const section = heading.closest("div");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

function withoutNegatedAnonymity(text: string): string {
  return text
    .replace("nicht als anonym anzusehen", "")
    .replace("cannot be regarded as anonymous", "");
}

const FULL_ACCOUNT = {
  account: true,
  google: true,
  adminAnalytics: true,
  supabase: true,
  supabaseRegion: "eu-central-1",
} as const;

describe("Datenschutz telemetry event disclosure", () => {
  beforeEach(() => {
    Object.assign(runtime, { vercelHosting: true, vercelTelemetry: true });
  });

  it("discloses usage events and their retention in German", async () => {
    render(await DatenschutzPage());

    const cookies = sectionByHeading(/^5\. Cookies/);
    expect(cookies).toHaveTextContent(
      "Zusätzlich übermittelt die Plattform eigene Nutzungsereignisse an Vercel Web Analytics.",
    );
    expect(cookies).toHaveTextContent(
      "Nicht übertragen werden Kennungen, E-Mail-Adressen, ein Kontobezug",
    );
    expect(cookies).toHaveTextContent(
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.",
    );
    expect(cookies).toHaveTextContent(
      "Vercel Inc. ist unter dem EU-U.S. Data Privacy Framework zertifiziert (Durchführungsbeschluss (EU) 2023/1795).",
    );
    expect(cookies.textContent).not.toMatch(/anonym/i);

    const retention = within(sectionByHeading("10. Aufbewahrungsfristen"));
    const item = retention.getByText(
      /^Vercel Web Analytics und Speed Insights:/,
    );
    expect(item).toHaveTextContent(
      "Die Plattform selbst speichert für diesen Zweck nichts.",
    );
    expect(item).toHaveTextContent("derzeit zwölf Monate");
    expect(item).toHaveTextContent(
      "Eine feste Löschfrist wird hier nicht zugesagt",
    );
  });

  it("discloses usage events and their retention in English", () => {
    render(<EnglishPrivacyContent features={runtime} />);

    const cookies = sectionByHeading(/^5\. Cookies/);
    expect(cookies).toHaveTextContent(
      "The platform additionally sends its own usage events to Vercel Web Analytics.",
    );
    expect(cookies).toHaveTextContent(
      "Identifiers, email addresses, any account reference, free text, quiz or exam answers and scores are not transmitted.",
    );
    expect(cookies).toHaveTextContent(
      "The legal basis is Article 6(1)(f) GDPR.",
    );
    expect(cookies).toHaveTextContent(
      "Vercel Inc. is certified under the EU-U.S. Data Privacy Framework (Implementing Decision (EU) 2023/1795).",
    );
    expect(cookies).toHaveTextContent("such as 'passed' or 'timed out'");
    expect(cookies.textContent).not.toMatch(/anonym/i);

    const retention = within(sectionByHeading("10. Retention periods"));
    const item = retention.getByText(
      /^Vercel Web Analytics and Speed Insights:/,
    );
    expect(item).toHaveTextContent(
      "the platform itself stores nothing for this purpose.",
    );
    expect(item).toHaveTextContent("currently twelve months");
    expect(item).toHaveTextContent("No fixed deletion date is promised here");
  });

  it("says nothing about events or telemetry retention while telemetry is off", async () => {
    Object.assign(runtime, { vercelTelemetry: false });
    const german = render(await DatenschutzPage());
    expect(sectionByHeading(/^5\. Cookies/).textContent).not.toMatch(
      /Ereignis/,
    );
    expect(
      sectionByHeading("10. Aufbewahrungsfristen").textContent,
    ).not.toMatch(/Vercel|Ereignis/);
    german.unmount();

    render(<EnglishPrivacyContent features={runtime} />);
    expect(sectionByHeading(/^5\. Cookies/).textContent).not.toMatch(/event/i);
    expect(sectionByHeading("10. Retention periods").textContent).not.toMatch(
      /Vercel|event/i,
    );
  });
});

describe("Datenschutz sign-in identity, statistics and cookie disclosure", () => {
  it("renders the Google Art. 13 disclosure with its legal anchors in German", async () => {
    Object.assign(runtime, FULL_ACCOUNT);
    render(await DatenschutzPage());

    const section = accountSection();
    for (const phrase of [
      "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland",
      "Art. 26 DSGVO",
      "Art. 6 Abs. 1 lit. b DSGVO",
      "Art. 6 Abs. 1 lit. f DSGVO",
      "Widerspruchsrecht nach Art. 21 DSGVO",
      "Art. 22 DSGVO",
      "(EU) 2023/1795",
      "(picture, avatar_url)",
    ]) {
      expect(section).toHaveTextContent(phrase);
    }
    expect(section.querySelectorAll("p.mt-2").length).toBeGreaterThanOrEqual(7);

    const retention = within(sectionByHeading("10. Aufbewahrungsfristen"));
    expect(
      retention.getByText(
        /^Google-Anmeldeidentität einschließlich der von Google/,
      ),
    ).toHaveTextContent(
      "bis zur Kontolöschung oder einer berechtigten Löschanfrage",
    );
  });

  it("renders the Google Art. 13 disclosure with its legal anchors in English", () => {
    Object.assign(runtime, FULL_ACCOUNT);
    render(<EnglishPrivacyContent features={runtime} />);

    const section = sectionByHeading(
      "8. Learning account and data storage (Supabase)",
    );
    for (const phrase of [
      "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland",
      "Article 26 GDPR",
      "Article 6(1)(b) GDPR",
      "Article 6(1)(f) GDPR",
      "right to object under Article 21 GDPR",
      "Article 22 GDPR",
      "(EU) 2023/1795",
      "(picture, avatar_url)",
      'fixed to the "email" and "profile" permission scope',
    ]) {
      expect(section).toHaveTextContent(phrase);
    }

    const retention = within(sectionByHeading("10. Retention periods"));
    expect(
      retention.getByText(
        /^Google sign-in identity, including the profile details/,
      ),
    ).toHaveTextContent("until account deletion or a valid erasure request");
  });

  it("keeps the Google disclosure and identity retention behind the Google flag", async () => {
    Object.assign(runtime, { ...FULL_ACCOUNT, google: false, magicLink: true });
    const german = render(await DatenschutzPage());
    expect(german.container.textContent).not.toMatch(
      /Google Ireland Limited|Google-Anmeldeidentität/,
    );
    german.unmount();

    render(<EnglishPrivacyContent features={runtime} />);
    expect(document.body.textContent).not.toMatch(
      /Google Ireland Limited|Google sign-in identity/,
    );
  });

  it("renders the GitHub Art. 13 disclosure and retention in German when GitHub is ready", async () => {
    Object.assign(runtime, { ...FULL_ACCOUNT, google: false, github: true });
    render(await DatenschutzPage());

    const section = accountSection();
    for (const phrase of [
      "Anmeldung mit GitHub leitet",
      "GitHub B.V., Prins Bernhardplein 200, 1097 JB Amsterdam, Niederlande",
      "Art. 26 DSGVO",
      "(user_name, preferred_username)",
      "(avatar_url)",
      "Art. 6 Abs. 1 lit. b DSGVO",
      "Widerspruchsrecht nach Art. 21 DSGVO",
      "EU-U.S. Data Privacy Framework",
      "Art. 22 DSGVO",
    ]) {
      expect(section).toHaveTextContent(phrase);
    }
    expect(section).not.toHaveTextContent("weder Magic-Link noch Google");
    expect(section).not.toHaveTextContent("Google Ireland Limited");

    const retention = within(sectionByHeading("10. Aufbewahrungsfristen"));
    expect(
      retention.getByText(/^GitHub-Anmeldeidentität einschließlich/),
    ).toHaveTextContent(
      "bis zur Kontolöschung oder einer berechtigten Löschanfrage",
    );
  });

  it("renders the GitHub Art. 13 disclosure and retention in English when GitHub is ready", () => {
    Object.assign(runtime, { ...FULL_ACCOUNT, google: false, github: true });
    render(<EnglishPrivacyContent features={runtime} />);

    const section = sectionByHeading(
      "8. Learning account and data storage (Supabase)",
    );
    for (const phrase of [
      "For sign-in with GitHub, Supabase redirects",
      "GitHub B.V., Prins Bernhardplein 200, 1097 JB Amsterdam, the Netherlands",
      "Article 26 GDPR",
      "(user_name, preferred_username)",
      "right to object under Article 21 GDPR",
      "EU-U.S. Data Privacy Framework",
      "Article 22 GDPR",
    ]) {
      expect(section).toHaveTextContent(phrase);
    }
    expect(section).not.toHaveTextContent("neither magic link");
    expect(section).not.toHaveTextContent("none of magic link");

    const retention = within(sectionByHeading("10. Retention periods"));
    expect(
      retention.getByText(/^GitHub sign-in identity, including/),
    ).toHaveTextContent("until account deletion or a valid erasure request");
  });

  it("keeps the GitHub disclosure and identity retention behind the GitHub flag", async () => {
    Object.assign(runtime, FULL_ACCOUNT);
    const german = render(await DatenschutzPage());
    expect(german.container.textContent).not.toMatch(
      /GitHub B\.V\.|GitHub-Anmeldeidentität/,
    );
    german.unmount();

    render(<EnglishPrivacyContent features={runtime} />);
    expect(document.body.textContent).not.toMatch(
      /GitHub B\.V\.|GitHub sign-in identity/,
    );
  });

  it("discloses the operating statistics, including the Vercel figures, only when ready", async () => {
    Object.assign(runtime, FULL_ACCOUNT);
    const german = render(await DatenschutzPage());
    const deSection = accountSection();
    expect(deSection).toHaveTextContent("interne Betriebsstatistik");
    expect(deSection).toHaveTextContent(
      "Nutzungsereigniszahlen aus Vercel Web Analytics (Abschnitt 5)",
    );
    german.unmount();

    const english = render(<EnglishPrivacyContent features={runtime} />);
    const enSection = sectionByHeading(
      "8. Learning account and data storage (Supabase)",
    );
    expect(enSection).toHaveTextContent("internal operating statistics");
    expect(enSection).toHaveTextContent(
      "usage-event figures from Vercel Web Analytics (section 5)",
    );
    english.unmount();

    Object.assign(runtime, { adminAnalytics: false });
    const germanOff = render(await DatenschutzPage());
    expect(germanOff.container.textContent).not.toMatch(/Betriebsstatistik/);
    germanOff.unmount();
    const englishOff = render(<EnglishPrivacyContent features={runtime} />);
    expect(englishOff.container.textContent).not.toMatch(
      /operating statistics/,
    );
  });

  it("never claims anonymity, non-personal data or a pending court case", async () => {
    Object.assign(runtime, {
      ...FULL_ACCOUNT,
      vercelHosting: true,
      vercelTelemetry: true,
    });
    const german = render(await DatenschutzPage());
    const deText = german.container.textContent ?? "";
    expect(deText).toContain("nicht als anonym anzusehen");
    expect(withoutNegatedAnonymity(deText)).not.toMatch(/anonym/i);
    expect(deText).not.toMatch(/nicht personenbezogen/i);
    expect(deText).not.toMatch(/\b[CT]-\d+\/\d+/);
    german.unmount();

    const english = render(<EnglishPrivacyContent features={runtime} />);
    const enText = english.container.textContent ?? "";
    expect(enText).toContain("cannot be regarded as anonymous");
    expect(withoutNegatedAnonymity(enText)).not.toMatch(/anonym/i);
    expect(enText).not.toMatch(/non-personal/i);
    expect(enText).not.toMatch(/\b[CT]-\d+\/\d+/);
  });

  it("describes the sign-in cookie as a 30-day cookie, never a session cookie", async () => {
    const german = render(await DatenschutzPage());
    const deCookies = sectionByHeading(/^5\. Cookies/);
    expect(deCookies.textContent).not.toMatch(/Session-Cookie/);
    expect(deCookies).toHaveTextContent(
      "bleibt bis zur Abmeldung, längstens 30 Tage, auf dem Endgerät gespeichert",
    );
    german.unmount();

    render(<EnglishPrivacyContent features={runtime} />);
    const enCookies = sectionByHeading(/^5\. Cookies/);
    expect(enCookies.textContent).not.toMatch(/session cookie/i);
    expect(enCookies).toHaveTextContent(
      "until you sign out and for no longer than 30 days",
    );
  });

  it("states the data protection officer position in section 1 of both languages", async () => {
    const german = render(await DatenschutzPage());
    expect(sectionByHeading("1. Verantwortlicher")).toHaveTextContent(
      "Ein Datenschutzbeauftragter ist nicht bestellt; die Voraussetzungen des § 38 BDSG liegen nicht vor.",
    );
    german.unmount();

    render(<EnglishPrivacyContent features={runtime} />);
    expect(sectionByHeading("1. Controller")).toHaveTextContent(
      "No data protection officer has been appointed; the conditions of Section 38 BDSG are not met.",
    );
  });

  it("keeps section counts and revision dates in lockstep across languages", async () => {
    Object.assign(runtime, {
      ...FULL_ACCOUNT,
      vercelHosting: true,
      vercelTelemetry: true,
    });
    const german = render(await DatenschutzPage());
    const deHeadings = german.container.querySelectorAll("h2").length;
    expect(german.container).toHaveTextContent("Stand: 13. September 2026");
    german.unmount();

    const english = render(<EnglishPrivacyContent features={runtime} />);
    expect(english.container.querySelectorAll("h2").length).toBe(deHeadings);
    expect(english.container).toHaveTextContent(
      "Last updated: 13 September 2026",
    );
  });
});
