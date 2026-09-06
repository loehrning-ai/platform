import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getRequestLocale: vi.fn(),
  getRuntimeFeatures: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: mocks.getRequestLocale,
}));
vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: mocks.getRuntimeFeatures,
}));
vi.mock("./login-form", () => ({
  LoginForm: ({
    next,
    locale,
    accountReady,
    magicLinkReady,
    googleReady,
    githubReady,
    unavailableReason,
  }: {
    readonly next: string;
    readonly locale: string;
    readonly accountReady: boolean;
    readonly magicLinkReady: boolean;
    readonly googleReady: boolean;
    readonly githubReady: boolean;
    readonly unavailableReason: string;
  }) => (
    <div
      data-testid="login-form-props"
      data-next={next}
      data-locale={locale}
      data-account-ready={String(accountReady)}
      data-magic-link-ready={String(magicLinkReady)}
      data-google-ready={String(googleReady)}
      data-github-ready={String(githubReady)}
      data-unavailable-reason={unavailableReason}
    />
  ),
}));

import LoginPage, { generateMetadata } from "./page";

const REDIRECT = new Error("NEXT_REDIRECT");

const NO_RUNTIME = {
  account: false,
  magicLink: false,
  google: false,
  github: false,
  turnstileSiteKey: null,
} as const;

beforeEach(() => {
  mocks.getRequestLocale.mockReset();
  mocks.getRequestLocale.mockResolvedValue("de");
  mocks.getAuthenticatedUser.mockReset();
  mocks.getAuthenticatedUser.mockResolvedValue({
    configured: false,
    user: null,
    error: null,
  });
  mocks.getRuntimeFeatures.mockReset();
  mocks.getRuntimeFeatures.mockReturnValue(NO_RUNTIME);
  mocks.redirect.mockReset();
  mocks.redirect.mockImplementation(() => {
    throw REDIRECT;
  });
});

afterEach(() => {
  cleanup();
});

describe("login locale surface", () => {
  it.each([
    [
      "de",
      "Login | Freie Lernplattform",
      // Copy lock updated: German UI copy names completion documents "Teilnahmebestätigung".
      "Optionales Lernkonto für Kursfortschritt und Teilnahmebestätigungen auf loehrning.ai.",
    ],
    [
      "en",
      "Login | Open learning platform",
      // Copy lock updated: English UI copy names completion documents "certificate of participation".
      "Optional learning account for course progress and certificates of participation on loehrning.ai.",
    ],
  ] as const)("uses precise %s noindex metadata", async (locale, title, description) => {
    mocks.getRequestLocale.mockResolvedValue(locale);

    const metadata = await generateMetadata();

    expect(metadata.title).toBe(title);
    expect(metadata.description).toBe(description);
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toEqual({ canonical: null });
  });

  it("renders the English unavailable state and preserves English return paths", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");

    render(
      await LoginPage({
        searchParams: Promise.resolve({ reason: "progress-save" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Continue without an account.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign-in is not enabled in this environment.",
    );
    expect(
      screen.getByRole("link", { name: "View all courses" }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(screen.queryByText(/Lernkonto|Anmeldung|Kursangebot/)).toBeNull();

    const form = screen.getByTestId("login-form-props");
    expect(form).toHaveAttribute("data-next", "/en/konto");
    expect(form).toHaveAttribute("data-locale", "en");
  });

  it("keeps a single callback alert so the reason is never split in two", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({ reason: "untrusted-origin" }),
      }),
    );

    // Every recovery path routes through one alert region. A second live
    // region on this page would make the announced reason order undefined.
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("states what an account adds, and that local progress is not carried over", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    // Copy lock updated: the panel now names the three things an account adds
    // (thread, tools, AI) instead of a flat feature list, so the region name
    // moved from "What a learning account does" to "What an account adds".
    const section = screen.getByRole("region", {
      name: "What an account adds",
    });
    expect(
      within(section).getByText("One learning thread across devices"),
    ).toBeVisible();
    expect(
      within(section).getByText("Your tools with your documents"),
    ).toBeVisible();
    expect(
      within(section).getByText("Your own AI connected"),
    ).toBeVisible();
    expect(
      within(section).getByText(/certificate of participation/),
    ).toBeVisible();
    expect(
      within(section).getByText(/Export, reset, delete/),
    ).toBeVisible();
    // Two of the three regions are gated behind readiness predicates on
    // /konto, so the panel says they appear only once configured rather than
    // promising a region that renders nothing.
    expect(
      within(section).getByText(/once this server has them configured/),
    ).toBeVisible();
    // Anonymous progress is never merged into an account by design
    // (lib/progress/store.ts), so the page has to say so BEFORE sign-in
    // rather than leave a learner to discover an empty dashboard after.
    expect(
      within(section).getByText(/is not carried over when you sign in/),
    ).toBeVisible();
  });

  it("shows a specific English callback failure even when providers are unavailable", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");

    render(
      await LoginPage({
        searchParams: Promise.resolve({ reason: "missing-code" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The authentication response is incomplete. Start sign-in again on this page.",
    );
  });

  it("passes independently attested Google readiness without enabling magic link", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: null,
    });
    mocks.getRuntimeFeatures.mockReturnValue({
      account: true,
      magicLink: false,
      google: true,
      github: false,
      turnstileSiteKey: null,
    });

    render(
      await LoginPage({
        searchParams: Promise.resolve({ next: "/en/kurse" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sync learning progress.",
      }),
    ).toBeVisible();
    const form = screen.getByTestId("login-form-props");
    expect(form).toHaveAttribute("data-account-ready", "true");
    expect(form).toHaveAttribute("data-magic-link-ready", "false");
    expect(form).toHaveAttribute("data-google-ready", "true");
  });

  it("localizes a rejected external next value to the English account fallback", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");

    render(
      await LoginPage({
        searchParams: Promise.resolve({ next: "https://evil.example" }),
      }),
    );

    expect(screen.getByTestId("login-form-props")).toHaveAttribute(
      "data-next",
      "/en/konto",
    );
  });

  it("redirects an authenticated English visitor to the localized safe next path", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: { id: "user-en" },
      error: null,
    });
    mocks.getRuntimeFeatures.mockReturnValue({
      account: true,
      magicLink: false,
      google: true,
      github: false,
      turnstileSiteKey: null,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: "/kurse" }) }),
    ).rejects.toBe(REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith("/en/kurse");
  });
});

describe("login layout branches", () => {
  it("splits the available branch into argument and form, form first on mobile", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: null,
    });
    mocks.getRuntimeFeatures.mockReturnValue({
      account: true,
      magicLink: true,
      google: true,
      github: false,
      turnstileSiteKey: "1x00000000000000000000AA",
    });

    const { container } = render(
      await LoginPage({ searchParams: Promise.resolve({}) }),
    );

    const layout = container.querySelector("[data-login-layout]");
    expect(layout).toHaveAttribute("data-login-layout", "split");
    // The form column is the first child in DOM order and only moves to the
    // right on large screens, so a phone gets the task before the argument.
    const columns = Array.from(layout?.children ?? []);
    expect(columns).toHaveLength(2);
    expect(columns[0]?.querySelector("[data-login-account-value]")).not.toBe(
      null,
    );
    expect(columns[0]?.className).toContain("order-2");
    expect(columns[1]?.querySelector("[data-testid='login-form-props']")).not.toBe(
      null,
    );
    expect(columns[1]?.className).toContain("order-1");
    // The public-access rail belongs to the dead-end branch only; when
    // sign-in works the form is the shortest path.
    expect(container.querySelector("[data-login-public-access]")).toBe(null);
  });

  it.each([
    [
      "outage",
      { configured: true, user: null, error: { message: "upstream refused" } },
      NO_RUNTIME,
      "Anmeldung nicht verfügbar.",
      "Dienst antwortet nicht",
      "Der Anmeldedienst ist gerade nicht erreichbar.",
      /Lade die Seite in ein paar Minuten neu/,
    ],
    [
      "configuration",
      { configured: true, user: null, error: null },
      NO_RUNTIME,
      "Weiter ohne Konto.",
      "Konfiguration offen",
      "Die Anmeldung ist noch nicht freigeschaltet.",
      /Hier ist nichts zu tun/,
    ],
    [
      "methods",
      { configured: true, user: null, error: null },
      { ...NO_RUNTIME, account: true },
      "Weiter ohne Konto.",
      "Keine Methode freigegeben",
      "Weder Google noch der Login-Link sind hier geprüft.",
      /Eine bestehende Sitzung bleibt gültig/,
    ],
    [
      "disabled",
      { configured: false, user: null, error: null },
      NO_RUNTIME,
      "Weiter ohne Konto.",
      "Hier nicht eingerichtet",
      "Diese Umgebung läuft ohne Konto.",
      /Bücher, Demos, KI-Check und die technischen Kurse bleiben vollständig offen/,
    ],
  ] as const)(
    "gives the %s branch one column and its own status, headline and next step",
    async (reason, auth, runtime, h1, statusChip, headline, nextStep) => {
      mocks.getAuthenticatedUser.mockResolvedValue(auth);
      mocks.getRuntimeFeatures.mockReturnValue(runtime);

      const { container } = render(
        await LoginPage({ searchParams: Promise.resolve({}) }),
      );

      expect(container.querySelector("[data-login-layout]")).toHaveAttribute(
        "data-login-layout",
        "single",
      );
      expect(screen.getByRole("heading", { level: 1, name: h1 })).toBeVisible();

      const status = container.querySelector("[data-login-status]");
      expect(status).toHaveAttribute("data-login-status", reason);
      expect(within(status as HTMLElement).getByText(statusChip)).toBeVisible();
      expect(
        within(status as HTMLElement).getByRole("heading", {
          level: 2,
          name: headline,
        }),
      ).toBeVisible();
      expect(within(status as HTMLElement).getByText(nextStep)).toBeVisible();

      // The form component decides what to render; the page must hand it the
      // same machine state it printed above, or the two disagree.
      expect(screen.getByTestId("login-form-props")).toHaveAttribute(
        "data-unavailable-reason",
        reason,
      );
    },
  );

  it("opens the available branch on an independently attested GitHub provider", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: null,
    });
    mocks.getRuntimeFeatures.mockReturnValue({
      ...NO_RUNTIME,
      account: true,
      github: true,
    });

    const { container } = render(
      await LoginPage({ searchParams: Promise.resolve({}) }),
    );

    expect(container.querySelector("[data-login-layout]")).toHaveAttribute(
      "data-login-layout",
      "split",
    );
    const form = screen.getByTestId("login-form-props");
    expect(form).toHaveAttribute("data-github-ready", "true");
    expect(form).toHaveAttribute("data-google-ready", "false");
    expect(form).toHaveAttribute("data-magic-link-ready", "false");
  });

  it("never offers GitHub on a feature snapshot that does not attest it", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: null,
    });
    // An older snapshot has no `github` field at all; the page must read that
    // as "off", never as "truthy enough".
    mocks.getRuntimeFeatures.mockReturnValue({
      account: true,
      magicLink: true,
      google: false,
      turnstileSiteKey: "1x00000000000000000000AA",
    });

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("login-form-props")).toHaveAttribute(
      "data-github-ready",
      "false",
    );
  });

  it("offers the public surfaces that never need an account when sign-in is closed", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    const rail = screen.getByRole("region", { name: "Ohne Konto offen" });
    for (const [label, href] of [
      ["Kurse", "/kurse"],
      ["Bücher", "/buecher"],
      ["Demos", "/demos"],
      ["KI-Check", "/ki-check"],
    ] as const) {
      const link = within(rail).getByRole("link", {
        name: new RegExp(`^${label}`),
      });
      expect(link).toHaveAttribute("href", href);
      // 44px minimum target height for every one of these rows.
      expect(link.className).toContain("min-h-11");
    }
  });

  it("localizes the public surfaces for English readers", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    const rail = screen.getByRole("region", { name: "Open without an account" });
    expect(within(rail).getByRole("link", { name: /^Courses/ })).toHaveAttribute(
      "href",
      "/en/kurse",
    );
    expect(within(rail).getByRole("link", { name: /^AI check/ })).toHaveAttribute(
      "href",
      "/en/ki-check",
    );
  });
});
