import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock, signInWithOtpMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
  signInWithOtpMock: vi.fn(),
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
      }: {
        readonly onToken: (token: string | null) => void;
      },
      ref: React.ForwardedRef<{ reset(): void }>,
    ) {
      React.useImperativeHandle(ref, () => ({
        reset: () => onToken(null),
      }));
      return (
        <button
          type="button"
          onClick={() => onToken("test-captcha-token")}
        >
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

describe("<LoginForm>", () => {
  it("protects email entry from spelling and capitalization changes", () => {
    createBrowserClientMock.mockReturnValue(null);
    render(
      <LoginForm next="/" configured={false} turnstileSiteKey={null} />,
    );

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

    render(
      <LoginForm
        next="/kurse"
        configured
        turnstileSiteKey="1x00000000000000000000AA"
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail-Adresse" }), {
      target: { value: "learner@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Sicherheitsprüfung abschließen",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Login-Link" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Wird gesendet…",
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
    expect(screen.getByRole("button", { name: "Login-Link" })).toBeDisabled();
  });

  it("blocks a resend inside 30 seconds without issuing another provider request", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    signInWithOtpMock.mockResolvedValue({ error: null });
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOtp: signInWithOtpMock },
    });

    render(
      <LoginForm
        next="/konto"
        configured
        turnstileSiteKey="1x00000000000000000000AA"
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail-Adresse" }), {
      target: { value: "learner@example.com" },
    });
    const captchaButton = screen.getByRole("button", {
      name: "Sicherheitsprüfung abschließen",
    });
    fireEvent.click(captchaButton);
    fireEvent.click(screen.getByRole("button", { name: "Login-Link" }));

    expect(
      await screen.findByText(
        "Login-Link verschickt. Öffne die E-Mail in diesem Browser.",
      ),
    ).toBeVisible();
    fireEvent.click(captchaButton);
    fireEvent.click(screen.getByRole("button", { name: "Login-Link" }));

    expect(
      await screen.findByText(
        "Login-Link wurde bereits verschickt. Warte kurz, bevor du erneut sendest.",
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
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <LoginForm
        next="/kurse"
        configured
        turnstileSiteKey="1x00000000000000000000AA"
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail-Adresse" }), {
      target: { value: "learner@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Sicherheitsprüfung abschließen",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Login-Link" }));

    expect(
      await screen.findByText(
        "Login-Link konnte nicht verschickt werden. Versuche es später erneut.",
      ),
    ).toBeVisible();
    const retryButton = screen.getByRole("button", { name: "Login-Link" });
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute("aria-busy", "false");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("fails closed with generic unavailable UI when client creation throws", () => {
    createBrowserClientMock.mockImplementation(() => {
      throw new Error("provider-url learner@example.com service-secret");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <LoginForm
        next="/kurse"
        configured
        turnstileSiteKey="1x00000000000000000000AA"
      />,
    );

    expect(
      screen.getByText(
        "Der Authentifizierungsdienst ist vorübergehend nicht erreichbar.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "E-Mail-Adresse" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Login-Link" })).toBeDisabled();
    expect(screen.queryByText(/provider-url|service-secret/i)).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("fails closed until a fresh abuse-protection token exists", () => {
    createBrowserClientMock.mockReturnValue({
      auth: { signInWithOtp: signInWithOtpMock },
    });

    render(
      <LoginForm
        next="/konto"
        configured
        turnstileSiteKey="1x00000000000000000000AA"
      />,
    );

    const loginButton = screen.getByRole("button", { name: "Login-Link" });
    expect(loginButton).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Sicherheitsprüfung abschließen",
      }),
    );
    expect(loginButton).toBeEnabled();
  });

  it("does not initialize auth when abuse protection is absent", () => {
    render(
      <LoginForm
        next="/konto"
        configured={false}
        turnstileSiteKey={null}
        unavailableReason="protection"
      />,
    );

    expect(createBrowserClientMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("textbox", { name: "E-Mail-Adresse" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Login-Link" })).toBeDisabled();
    expect(
      screen.getByText(/serverseitiger Schutz vollständig konfiguriert/),
    ).toBeVisible();
  });
});
