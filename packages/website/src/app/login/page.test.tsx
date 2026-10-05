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

vi.mock("./login-gate-signal", () => ({
  LoginGateSignal: ({
    reason,
    loginAvailability,
  }: {
    readonly reason: string;
    readonly loginAvailability: string;
  }) => (
    <span
      data-testid="login-gate-signal"
      data-reason={reason}
      data-login-availability={loginAvailability}
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
      // Copy lock updated: the German platform issues two completion documents
      // (Teilnahmebestätigung, and a Lernnachweis for ki-und-gesellschaft), so the
      // login description names both instead of only the first.
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
      "Sign-in is not enabled here, so the four foundation courses are unavailable for now.",
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

  it("states what an account adds, and that local progress is imported only once on request", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    // The panel argues for an account only where one can be opened.
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

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    // Copy lock updated: the panel now names the three things an account adds
    // (thread, tools, AI) instead of a flat feature list, so the region name
    // moved from "What a learning account does" to "What an account adds".
    const section = screen.getByRole("region", {
      name: "What an account adds",
    });
    expect(
      within(section).getByText("Progress on every device"),
    ).toBeVisible();
    expect(
      within(section).getByText("Your tools with your documents"),
    ).toBeVisible();
    expect(
      within(section).getByText("Connect your own AI"),
    ).toBeVisible();
    // Titles only: the bodies and the fine print were cut to keep the page short.
    expect(section).not.toHaveTextContent(/certificate of participation|once they are set up here/);
    // Anonymous progress is not merged automatically; /konto offers a one-time
    // import (import-progress-island.tsx), so the page has to say so BEFORE
    // sign-in rather than leave a learner to discover an empty dashboard after.
    expect(
      within(section).getByText(/you can import it into your account once/),
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

  // Open redirect: a signed-in learner opening
  // /login?next=/en//evil.example was answered with Location //evil.example.
  it.each(
    (["de", "en"] as const).flatMap((locale) =>
      [
        "/en//evil.example/fake-login",
        "/de//evil.example",
        "/en/%2e//evil.example",
        "/en/.//evil.example",
        "/en/x/..//evil.example",
      ].map((next) => [locale, next] as const),
    ),
  )(
    "keeps a signed-in %s visitor on this origin for next=%s",
    async (locale, next) => {
      mocks.getRequestLocale.mockResolvedValue(locale);
      mocks.getAuthenticatedUser.mockResolvedValue({
        configured: true,
        user: { id: "user-redirect" },
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
        LoginPage({ searchParams: Promise.resolve({ next }) }),
      ).rejects.toBe(REDIRECT);
      expect(mocks.redirect).toHaveBeenCalledTimes(1);
      const target = mocks.redirect.mock.calls[0]?.[0] as string;
      expect(target).toBe(locale === "de" ? "/konto" : "/en/konto");
      expect(target.startsWith("//")).toBe(false);
      expect(new URL(target, "https://loehrning.invalid").origin).toBe(
        "https://loehrning.invalid",
      );
    },
  );
});

describe("login layout branches", () => {
  it("centres one column on the scene: the card with the form, then the account note", async () => {
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

    // The dark scene wraps the column; its backdrop is decorative only.
    const scene = container.querySelector("[data-login-scene]");
    expect(scene).not.toBe(null);
    expect(scene?.className).toContain("login-scene");
    expect(
      scene?.querySelector("[data-login-scene-backdrop]"),
    ).toHaveAttribute("aria-hidden", "true");

    const layout = container.querySelector("[data-login-layout]");
    expect(layout).toHaveAttribute("data-login-layout", "form");
    // One column, no split grid and no visual reordering: the card holding
    // the form comes first in DOM and on screen, the account note follows, so
    // a phone gets the task before the argument.
    expect(layout?.className).not.toMatch(/grid-cols|order-/);
    const rows = Array.from(layout?.children ?? []);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.className).toContain("login-card");
    expect(
      rows[0]?.querySelector("[data-testid='login-form-props']"),
    ).not.toBe(null);
    expect(rows[0]?.querySelector("h1")).not.toBe(null);
    expect(rows[1]).toHaveAttribute("data-login-account-value");
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
      /Sobald das geprüft ist/,
    ],
    [
      "methods",
      { configured: true, user: null, error: null },
      { ...NO_RUNTIME, account: true },
      "Weiter ohne Konto.",
      "Keine Methode freigegeben",
      "Die Anmeldung ist hier noch nicht eingerichtet.",
      /Die offenen Inhalte unten/,
    ],
    [
      "disabled",
      { configured: false, user: null, error: null },
      NO_RUNTIME,
      "Weiter ohne Konto.",
      "Hier nicht eingerichtet",
      "Diese Umgebung läuft ohne Konto.",
      /^Hier ist nichts zu tun\.$/,
    ],
  ] as const)(
    "gives the %s branch one column and its own status, headline and next step",
    async (reason, auth, runtime, h1, statusChip, headline, nextStep) => {
      mocks.getAuthenticatedUser.mockResolvedValue(auth);
      mocks.getRuntimeFeatures.mockReturnValue(runtime);

      const { container } = render(
        await LoginPage({ searchParams: Promise.resolve({}) }),
      );

      const layout = container.querySelector("[data-login-layout]");
      expect(layout).toHaveAttribute("data-login-layout", "status");
      // Status and method note sit inside the card, the open surfaces under it.
      const rows = Array.from(layout?.children ?? []);
      expect(rows).toHaveLength(2);
      expect(rows[0]?.querySelector("[data-login-status]")).not.toBe(null);
      expect(rows[1]).toHaveAttribute("data-login-public-access");
      expect(screen.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
      // No sales pitch for an account that cannot be opened here.
      expect(container.querySelector("[data-login-account-value]")).toBeNull();

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
      "form",
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

describe("login gate signal", () => {
  it("renders no signal when no reason is present", async () => {
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

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByTestId("login-gate-signal")).toBeNull();
  });

  it("renders the signal inside the single reason alert", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({ reason: "abgelaufen" }),
      }),
    );

    const signal = screen.getByTestId("login-gate-signal");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toContainElement(signal);
    expect(signal).toHaveAttribute("data-login-availability", "none");
  });

  it.each([
    [{ magicLink: true, google: true, github: false }, "all"],
    [{ magicLink: true, google: false, github: true }, "all"],
    [{ magicLink: true, google: true, github: true }, "all"],
    [{ magicLink: false, google: true, github: false }, "oauth_only"],
    [{ magicLink: false, google: false, github: true }, "oauth_only"],
    [{ magicLink: true, google: false, github: false }, "magic_only"],
    [{ magicLink: false, google: false, github: false }, "none"],
  ] as const)(
    "reports %j as %s availability",
    async (methods, expected) => {
      mocks.getAuthenticatedUser.mockResolvedValue({
        configured: true,
        user: null,
        error: null,
      });
      mocks.getRuntimeFeatures.mockReturnValue({
        ...NO_RUNTIME,
        account: true,
        turnstileSiteKey: "1x00000000000000000000AA",
        ...methods,
      });

      render(
        await LoginPage({
          searchParams: Promise.resolve({ reason: "kurs-login" }),
        }),
      );

      expect(screen.getByTestId("login-gate-signal")).toHaveAttribute(
        "data-login-availability",
        expected,
      );
    },
  );

  it("reports none during an auth outage even when methods are configured", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: { message: "upstream refused" },
    });
    mocks.getRuntimeFeatures.mockReturnValue({
      account: true,
      magicLink: true,
      google: true,
      github: true,
      turnstileSiteKey: "1x00000000000000000000AA",
    });

    render(
      await LoginPage({
        searchParams: Promise.resolve({ reason: "auth-unavailable" }),
      }),
    );

    expect(screen.getByTestId("login-gate-signal")).toHaveAttribute(
      "data-login-availability",
      "none",
    );
  });
});
