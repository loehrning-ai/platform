import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "./turnstile-widget";

const SITE_KEY = "1x00000000000000000000AA";

describe("<TurnstileWidget>", () => {
  beforeEach(() => {
    delete window.turnstile;
    document.getElementById("cloudflare-turnstile-script")?.remove();
  });

  afterEach(() => {
    delete window.turnstile;
    document.getElementById("cloudflare-turnstile-script")?.remove();
    vi.restoreAllMocks();
  });

  it("loads only the pinned provider origin and waits for a verified token", () => {
    const onToken = vi.fn();
    render(<TurnstileWidget siteKey={SITE_KEY} onToken={onToken} />);

    const script = document.getElementById(
      "cloudflare-turnstile-script",
    ) as HTMLScriptElement;
    expect(script).toBeInstanceOf(HTMLScriptElement);
    expect(script.src).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    );
    expect(onToken).not.toHaveBeenCalled();
    expect(
      screen.getByText("Sicherheitsprüfung wird geladen."),
    ).toHaveAttribute("role", "status");
  });

  it("replaces a failed provider script when the form remounts", () => {
    const first = render(
      <TurnstileWidget siteKey={SITE_KEY} onToken={vi.fn()} />,
    );
    const failedScript = document.getElementById(
      "cloudflare-turnstile-script",
    ) as HTMLScriptElement;

    act(() => failedScript.dispatchEvent(new Event("error")));
    expect(failedScript.dataset.failed).toBe("true");
    expect(
      screen.getByText(/Sicherheitsprüfung nicht verfügbar/),
    ).toHaveAttribute("role", "alert");
    first.unmount();

    render(<TurnstileWidget siteKey={SITE_KEY} onToken={vi.fn()} />);
    const retriedScript = document.getElementById(
      "cloudflare-turnstile-script",
    ) as HTMLScriptElement;
    expect(retriedScript).not.toBe(failedScript);
    expect(retriedScript.dataset.failed).toBeUndefined();
    expect(
      screen.getByText("Sicherheitsprüfung wird geladen."),
    ).toHaveAttribute("role", "status");
  });

  it("passes a solved token, handles expiry, and suppresses raw provider errors", () => {
    const onToken = vi.fn();
    let options:
      | {
          callback(token: string): void;
          "expired-callback"(): void;
          "error-callback"(): boolean;
        }
      | undefined;
    window.turnstile = {
      render: vi.fn((_container, nextOptions) => {
        options = nextOptions;
        return "widget-1";
      }),
      remove: vi.fn(),
      reset: vi.fn(),
    };

    render(<TurnstileWidget siteKey={SITE_KEY} onToken={onToken} />);
    act(() => options?.callback("verified-token"));
    expect(onToken).toHaveBeenLastCalledWith("verified-token");
    expect(
      screen.getByText("Sicherheitsprüfung abgeschlossen."),
    ).toHaveAttribute("role", "status");

    act(() => options?.["expired-callback"]());
    expect(onToken).toHaveBeenLastCalledWith(null);
    expect(
      screen.getByText(
        "Sicherheitsprüfung abgelaufen. Schließe die erneuerte Prüfung ab.",
      ),
    ).toHaveAttribute("role", "status");

    act(() => {
      expect(options?.["error-callback"]()).toBe(true);
    });
    expect(
      screen.getByText(/Sicherheitsprüfung nicht verfügbar/),
    ).toHaveAttribute("role", "alert");
  });

  it("resets a consumed single-use token before another submission", () => {
    const onToken = vi.fn();
    const reset = vi.fn();
    window.turnstile = {
      render: vi.fn(() => "widget-2"),
      remove: vi.fn(),
      reset,
    };
    const ref = createRef<TurnstileWidgetHandle>();

    render(
      <TurnstileWidget ref={ref} siteKey={SITE_KEY} onToken={onToken} />,
    );
    act(() => ref.current?.reset());

    expect(reset).toHaveBeenCalledWith("widget-2");
    expect(onToken).toHaveBeenCalledWith(null);
  });

  it("sets the provider widget and local status copy to English", () => {
    let language: string | undefined;
    window.turnstile = {
      render: vi.fn((_container, options) => {
        language = options.language;
        return "widget-en";
      }),
      remove: vi.fn(),
      reset: vi.fn(),
    };

    render(
      <TurnstileWidget
        siteKey={SITE_KEY}
        onToken={vi.fn()}
        locale="en"
      />,
    );

    expect(language).toBe("en");
    expect(screen.getByText("Security check")).toBeVisible();
    expect(screen.getByText("Security check loading.")).toHaveAttribute(
      "role",
      "status",
    );
  });
});
