import { cleanup, render, screen } from "@testing-library/react";
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
  }: {
    readonly next: string;
    readonly locale: string;
    readonly accountReady: boolean;
    readonly magicLinkReady: boolean;
    readonly googleReady: boolean;
  }) => (
    <div
      data-testid="login-form-props"
      data-next={next}
      data-locale={locale}
      data-account-ready={String(accountReady)}
      data-magic-link-ready={String(magicLinkReady)}
      data-google-ready={String(googleReady)}
    />
  ),
}));

import LoginPage, { generateMetadata } from "./page";

const REDIRECT = new Error("NEXT_REDIRECT");

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
  mocks.getRuntimeFeatures.mockReturnValue({
    account: false,
    magicLink: false,
    google: false,
    turnstileSiteKey: null,
  });
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
      "Optionales Lernkonto für Kursfortschritt, Lernnachweise und Zertifikate auf loehrning.ai.",
    ],
    [
      "en",
      "Login | Open learning platform",
      "Optional learning account for course progress, learning records, and certificates on loehrning.ai.",
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
      turnstileSiteKey: null,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: "/kurse" }) }),
    ).rejects.toBe(REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith("/en/kurse");
  });
});
