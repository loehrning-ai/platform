import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The optional third provider. GitHub only appears when its own dated
 * confirmation is present, so these tests pin the two directions that matter:
 * absent attestation renders no control at all, and a present one redirects
 * through the same sanitized callback as Google without borrowing Google's
 * pending or failure copy.
 */

const {
  createBrowserClientMock,
  signInWithOAuthMock,
  signInWithOtpMock,
  trackLoginFlowMock,
} = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
  signInWithOAuthMock: vi.fn(),
  signInWithOtpMock: vi.fn(),
  trackLoginFlowMock: vi.fn(),
}));

vi.mock("@/lib/analytics/events", () => ({
  trackLoginFlow: trackLoginFlowMock,
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: createBrowserClientMock,
}));
vi.mock("./turnstile-widget", async () => {
  const React = await import("react");
  return {
    TurnstileWidget: React.forwardRef(function TurnstileWidgetMock(
      { onToken }: { readonly onToken: (token: string | null) => void },
      ref: React.ForwardedRef<{ reset(): void }>,
    ) {
      React.useImperativeHandle(ref, () => ({
        reset: () => onToken(null),
      }));
      return (
        <button type="button" onClick={() => onToken("test-captcha-token")}>
          Sicherheitsprüfung abschließen
        </button>
      );
    }),
  };
});

import { LoginForm } from "./login-form";

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("<LoginForm> optional GitHub provider", () => {
  it("renders nothing for GitHub until the provider is attested", () => {
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOAuth: signInWithOAuthMock },
    });

    render(
      <LoginForm
        next="/konto"
        accountReady
        magicLinkReady={false}
        googleReady
        turnstileSiteKey={null}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Mit GitHub anmelden" }),
    ).toBeNull();
  });

  it("does not initialize auth when GitHub is the only unattested method", () => {
    render(
      <LoginForm
        next="/konto"
        accountReady
        magicLinkReady={false}
        googleReady={false}
        githubReady={false}
        turnstileSiteKey={null}
        unavailableReason="methods"
      />,
    );

    expect(createBrowserClientMock).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Mit GitHub anmelden" }),
    ).toBeNull();
  });

  it("starts GitHub OAuth with a sanitized callback and its own pending copy", async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: { provider: "github", url: "https://github.test/login" },
      error: null,
    });
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOAuth: signInWithOAuthMock },
    });

    render(
      <LoginForm
        next="//evil.example"
        accountReady
        magicLinkReady={false}
        googleReady={false}
        githubReady
        turnstileSiteKey={null}
      />,
    );

    // A GitHub-only runtime carries no OTP surface, so no CAPTCHA is loaded.
    expect(
      screen.queryByRole("textbox", { name: "E-Mail-Adresse" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Sicherheitsprüfung abschließen" }),
    ).toBeNull();

    const githubButton = screen.getByRole("button", {
      name: "Mit GitHub anmelden",
    });
    expect(githubButton).toBeEnabled();
    expect(githubButton).toHaveClass("min-h-11");
    expect(githubButton.querySelector("svg.lucide-github")).toBeInTheDocument();
    fireEvent.click(githubButton);

    const pendingButton = await screen.findByRole("button", {
      name: "GitHub wird geöffnet…",
    });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute("aria-busy", "true");
    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=%2Fkonto`,
      },
    });
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it("stacks both OAuth providers above one email separator", () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        signInWithOAuth: signInWithOAuthMock,
        signInWithOtp: signInWithOtpMock,
      },
    });

    const { container } = render(
      <LoginForm
        next="/konto"
        accountReady
        magicLinkReady
        googleReady
        githubReady
        turnstileSiteKey="1x00000000000000000000AA"
      />,
    );

    const google = screen.getByRole("button", { name: "Mit Google anmelden" });
    const github = screen.getByRole("button", { name: "Mit GitHub anmelden" });
    // Google keeps its mandated brand treatment; GitHub sits directly under it
    // in the platform's own idiom, and only then does email follow.
    expect(
      google.compareDocumentPosition(github) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelectorAll("[data-login-provider]")).toHaveLength(1);
    expect(screen.getAllByText("oder per E-Mail")).toHaveLength(1);
    expect(
      screen.getByRole("textbox", { name: "E-Mail-Adresse" }),
    ).toBeVisible();
  });

  it("keeps Google and GitHub failures apart and leaks no provider detail", async () => {
    signInWithOAuthMock.mockRejectedValue(
      new Error("github-app-id learner@example.com oauth-secret"),
    );
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOAuth: signInWithOAuthMock },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <LoginForm
        next="/kurse"
        accountReady
        magicLinkReady={false}
        googleReady
        githubReady
        turnstileSiteKey={null}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in with GitHub" }));

    expect(
      await screen.findByText(
        "GitHub sign-in could not be started. Try again later.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText("Google sign-in could not be started. Try again later."),
    ).toBeNull();
    expect(screen.queryByText(/github-app-id|oauth-secret/i)).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("reports github started before the OAuth redirect, with no address in the payload", async () => {
    signInWithOAuthMock.mockResolvedValue({ data: {}, error: null });
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOAuth: signInWithOAuthMock },
    });

    render(
      <LoginForm
        next="/konto"
        accountReady
        magicLinkReady={false}
        googleReady={false}
        githubReady
        turnstileSiteKey={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mit GitHub anmelden" }));

    await screen.findByRole("button", { name: "GitHub wird geöffnet…" });
    expect(trackLoginFlowMock.mock.calls).toEqual([["github", "started"]]);
    expect(trackLoginFlowMock.mock.invocationCallOrder[0]).toBeLessThan(
      signInWithOAuthMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(
      trackLoginFlowMock.mock.calls.flat().some((value) =>
        String(value).includes("@"),
      ),
    ).toBe(false);
  });

  it("names GitHub, not Google, in the notice of a GitHub-only runtime", () => {
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOAuth: signInWithOAuthMock },
    });

    const { container } = render(
      <LoginForm
        next="/konto"
        accountReady
        magicLinkReady={false}
        googleReady={false}
        githubReady
        turnstileSiteKey={null}
      />,
    );

    const notice = container.querySelector("[data-login-oauth-notice]");
    expect(notice).toHaveAttribute("data-login-oauth-notice", "github");
    expect(notice).toHaveTextContent(/GitHub-Kontokennung, deinen GitHub-Benutzernamen/);
    expect(notice).not.toHaveTextContent(/Google/);
    expect(
      screen.getByRole("button", { name: "Mit GitHub anmelden" })
        .nextElementSibling,
    ).toBe(notice);
    expect(
      within(notice as HTMLElement).getByRole("link", {
        name: "Datenschutzerklärung",
      }),
    ).toHaveAttribute("href", "/datenschutz");
  });

  it("covers both providers in one notice beneath both buttons", () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        signInWithOAuth: signInWithOAuthMock,
        signInWithOtp: signInWithOtpMock,
      },
    });

    const { container } = render(
      <LoginForm
        next="/konto"
        accountReady
        magicLinkReady
        googleReady
        githubReady
        turnstileSiteKey="1x00000000000000000000AA"
        locale="en"
      />,
    );

    const notices = container.querySelectorAll("[data-login-oauth-notice]");
    expect(notices).toHaveLength(1);
    const notice = notices[0] as HTMLElement;
    expect(notice).toHaveAttribute("data-login-oauth-notice", "both");
    expect(notice).toHaveTextContent(/sign in with Google or GitHub/);
    expect(notice).toHaveTextContent(/with GitHub, your username is stored/);
    expect(
      screen.getByRole("button", { name: "Sign in with GitHub" })
        .nextElementSibling,
    ).toBe(notice);
    expect(
      within(notice).getByRole("link", { name: "privacy notice" }),
    ).toHaveAttribute("href", "/en/datenschutz");
  });
});
