import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock, signInWithOtpMock, signInWithOAuthMock } =
  vi.hoisted(() => ({
    createBrowserClientMock: vi.fn(),
    signInWithOtpMock: vi.fn(),
    signInWithOAuthMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: createBrowserClientMock,
}));
vi.mock("./turnstile-widget", async () => {
  const React = await import("react");
  return {
    TurnstileWidget: React.forwardRef(function TurnstileWidgetMock(
      {
        onToken,
        locale = "de",
      }: {
        readonly onToken: (token: string | null) => void;
        readonly locale?: "de" | "en";
      },
      ref: React.ForwardedRef<{ reset(): void }>,
    ) {
      React.useImperativeHandle(ref, () => ({
        reset: () => onToken(null),
      }));
      return (
        <button type="button" onClick={() => onToken("test-captcha-token")}>
          {locale === "en"
            ? "Complete security check"
            : "Sicherheitsprüfung abschließen"}
        </button>
      );
    }),
  };
});

import { LoginForm } from "./login-form";

const MAGIC_LINK_PROPS = {
  accountReady: true,
  magicLinkReady: true,
  googleReady: false,
  turnstileSiteKey: "1x00000000000000000000AA",
} as const;

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("<LoginForm>", () => {
  it("protects email entry from spelling and capitalization changes", () => {
    createBrowserClientMock.mockReturnValue(null);
    render(<LoginForm next="/" {...MAGIC_LINK_PROPS} />);

    const email = screen.getByRole("textbox", { name: "E-Mail-Adresse" });
    expect(email).toHaveAttribute("name", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("autocapitalize", "none");
    expect(email).toHaveAttribute("spellcheck", "false");
  });

  it("exposes a disabled, busy progress treatment while the login link is sent", async () => {
    let finishRequest!: (value: { error: null }) => void;
    const pendingRequest = new Promise<{ error: null }>((resolve) => {
      finishRequest = resolve;
    });
    signInWithOtpMock.mockReturnValue(pendingRequest);
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOtp: signInWithOtpMock },
    });

    render(<LoginForm next="/kurse" {...MAGIC_LINK_PROPS} />);
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail-Adresse" }), {
      target: { value: "learner@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Sicherheitsprüfung abschließen",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Login-Link senden" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Link wird gesendet…",
    });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute("aria-busy", "true");
    expect(pendingButton.querySelector("svg")).toHaveClass("animate-spin");

    await act(async () => {
      finishRequest({ error: null });
      await pendingRequest;
    });
    expect(
      await screen.findByText(
        "Login-Link verschickt. Öffne die E-Mail in diesem Browser.",
      ),
    ).toBeVisible();
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "learner@example.com",
      options: {
        captchaToken: "test-captcha-token",
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fkurse`,
        shouldCreateUser: true,
      },
    });
    expect(
      screen.getByRole("button", { name: "Login-Link senden" }),
    ).toBeDisabled();
  });

  it("blocks a resend inside 30 seconds without issuing another provider request", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    signInWithOtpMock.mockResolvedValue({ error: null });
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOtp: signInWithOtpMock },
    });

    render(<LoginForm next="/konto" {...MAGIC_LINK_PROPS} />);
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail-Adresse" }), {
      target: { value: "learner@example.com" },
    });
    const captchaButton = screen.getByRole("button", {
      name: "Sicherheitsprüfung abschließen",
    });
    fireEvent.click(captchaButton);
    fireEvent.click(screen.getByRole("button", { name: "Login-Link senden" }));

    expect(
      await screen.findByText(
        "Login-Link verschickt. Öffne die E-Mail in diesem Browser.",
      ),
    ).toBeVisible();
    fireEvent.click(captchaButton);
    fireEvent.click(screen.getByRole("button", { name: "Login-Link senden" }));

    expect(
      await screen.findByText(
        "Ein Login-Link wurde gerade verschickt. Warte, bevor du einen weiteren anforderst.",
      ),
    ).toBeVisible();
    expect(signInWithOtpMock).toHaveBeenCalledTimes(1);
  });

  it("recovers from a thrown auth request with a generic error and no raw console output", async () => {
    signInWithOtpMock.mockRejectedValue(
      new Error("learner@example.com provider-secret"),
    );
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOtp: signInWithOtpMock },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<LoginForm next="/kurse" {...MAGIC_LINK_PROPS} />);
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail-Adresse" }), {
      target: { value: "learner@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Sicherheitsprüfung abschließen",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Login-Link senden" }));

    expect(
      await screen.findByText(
        "Der Login-Link konnte nicht verschickt werden. Versuche es später erneut.",
      ),
    ).toBeVisible();
    const retryButton = screen.getByRole("button", {
      name: "Login-Link senden",
    });
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute("aria-busy", "false");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("fails closed with generic unavailable UI when client creation throws", () => {
    createBrowserClientMock.mockImplementation(() => {
      throw new Error("provider-url learner@example.com service-secret");
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <LoginForm
        next="/kurse"
        {...MAGIC_LINK_PROPS}
        unavailableReason="outage"
      />,
    );

    expect(
      screen.getByText("Der Anmeldedienst ist vorübergehend nicht erreichbar."),
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "E-Mail-Adresse" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Login-Link senden" }),
    ).toBeDisabled();
    expect(screen.queryByText(/provider-url|service-secret/i)).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("fails closed until a fresh abuse-protection token exists", () => {
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOtp: signInWithOtpMock },
    });

    render(<LoginForm next="/konto" {...MAGIC_LINK_PROPS} />);

    const loginButton = screen.getByRole("button", {
      name: "Login-Link senden",
    });
    expect(loginButton).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Sicherheitsprüfung abschließen",
      }),
    );
    expect(loginButton).toBeEnabled();
  });

  it("does not initialize auth when no sign-in method is attested", () => {
    render(
      <LoginForm
        next="/konto"
        accountReady
        magicLinkReady={false}
        googleReady={false}
        turnstileSiteKey={null}
        unavailableReason="methods"
      />,
    );

    expect(createBrowserClientMock).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "E-Mail-Adresse" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Login-Link senden" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Mit Google anmelden" }),
    ).toBeNull();
    expect(
      screen.getByText(/Keine Anmeldemethode ist .* vollständig konfiguriert/),
    ).toBeVisible();
  });

  it("starts Google OAuth with a sanitized callback and no added scopes or CAPTCHA", async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.test" },
      error: null,
    });
    createBrowserClientMock.mockReturnValue({
      auth: {
        signInWithOtp: signInWithOtpMock,
        signInWithOAuth: signInWithOAuthMock,
      },
    });

    render(
      <LoginForm
        next="//evil.example"
        accountReady
        magicLinkReady
        googleReady
        turnstileSiteKey="1x00000000000000000000AA"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Sicherheitsprüfung abschließen" }),
    ).toBeVisible();
    const googleButton = screen.getByRole("button", {
      name: "Mit Google anmelden",
    });
    expect(googleButton).toBeEnabled();
    expect(googleButton).toHaveAttribute("data-google-brand-button", "light");
    expect(googleButton).toHaveClass(
      "min-h-11",
      "border-[#747775]",
      "bg-white",
      "text-[14px]",
      "leading-5",
      "text-[#1f1f1f]",
    );
    expect(
      googleButton.querySelector(
        '[data-google-brand-icon="standard-gradient-g"]',
      ),
    ).toBeInTheDocument();
    expect(googleButton.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("google-signin-icon-light.svg"),
    );
    expect(googleButton.className).not.toMatch(/uppercase|tracking-/);
    fireEvent.click(googleButton);

    const pendingButton = await screen.findByRole("button", {
      name: "Google wird geöffnet…",
    });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute("aria-busy", "true");
    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=%2Fkonto`,
      },
    });
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it("renders Google-only login without loading the OTP Turnstile flow", () => {
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
      screen.getByRole("button", { name: "Mit Google anmelden" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("textbox", { name: "E-Mail-Adresse" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Sicherheitsprüfung abschließen" }),
    ).toBeNull();
  });

  it("recovers from a thrown Google OAuth request without exposing raw details", async () => {
    signInWithOAuthMock.mockRejectedValue(
      new Error("provider-url learner@example.com oauth-secret"),
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
        turnstileSiteKey={null}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Mit Google anmelden" }),
    );

    expect(
      await screen.findByText(
        "Die Google-Anmeldung konnte nicht gestartet werden. Versuche es später erneut.",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/provider-url|oauth-secret/i)).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("renders English form, aria, and callback state without German UI copy", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    signInWithOAuthMock.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.test" },
      error: null,
    });
    createBrowserClientMock.mockReturnValue({
      auth: {
        signInWithOtp: signInWithOtpMock,
        signInWithOAuth: signInWithOAuthMock,
      },
    });

    render(
      <LoginForm
        next="/en/konto"
        accountReady
        magicLinkReady
        googleReady
        turnstileSiteKey="1x00000000000000000000AA"
        locale="en"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Sign-in method" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeEnabled();
    const email = screen.getByRole("textbox", { name: "Email address" });
    expect(email).toHaveAccessibleDescription(
      "You will receive a single-use link for this browser.",
    );
    expect(
      screen.queryByText(/Anmeld|Sicherheitsprüfung|Lernkonto/),
    ).toBeNull();

    fireEvent.change(email, { target: { value: "learner@example.com" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Complete security check" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in link" }));

    expect(
      await screen.findByText(
        "Sign-in link sent. Open the email in this browser.",
      ),
    ).toHaveAttribute("role", "status");
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "learner@example.com",
      options: {
        captchaToken: "test-captcha-token",
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fen%2Fkonto`,
        shouldCreateUser: true,
      },
    });
  });
});
