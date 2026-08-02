"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      readonly sitekey: string;
      readonly action: string;
      readonly appearance: "always";
      readonly "feedback-enabled": false;
      readonly "response-field": false;
      readonly size: "flexible";
      readonly theme: "auto";
      readonly callback: (token: string) => void;
      readonly "error-callback": () => boolean;
      readonly "expired-callback": () => void;
      readonly "timeout-callback": () => void;
      readonly "unsupported-callback": () => void;
    },
  ): string;
  remove(widgetId: string): void;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileWidgetHandle {
  reset(): void;
}

interface TurnstileWidgetProps {
  readonly siteKey: string;
  readonly onToken: (token: string | null) => void;
}

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget({ siteKey, onToken }, forwardedRef) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [state, setState] = useState<
    "loading" | "ready" | "error" | "expired"
  >("loading");

  const invalidate = useCallback(
    (nextState: "error" | "expired") => {
      onToken(null);
      setState(nextState);
    },
    [onToken],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      reset() {
        onToken(null);
        const widgetId = widgetIdRef.current;
        if (!widgetId || !window.turnstile) return;
        try {
          window.turnstile.reset(widgetId);
          setState("loading");
        } catch {
          invalidate("error");
        }
      },
    }),
    [invalidate, onToken],
  );

  useEffect(() => {
    let disposed = false;
    let script: HTMLScriptElement | null = null;

    const renderWidget = () => {
      if (
        disposed ||
        widgetIdRef.current ||
        !containerRef.current ||
        !window.turnstile
      ) {
        return;
      }
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: "magic_link_login",
          appearance: "always",
          "feedback-enabled": false,
          "response-field": false,
          size: "flexible",
          theme: "auto",
          callback: (token) => {
            if (disposed) return;
            onToken(token);
            setState("ready");
          },
          "error-callback": () => {
            if (!disposed) invalidate("error");
            // Suppress provider error-code logging; the UI exposes a generic
            // recovery message without leaking browser/provider details.
            return true;
          },
          "expired-callback": () => {
            if (!disposed) invalidate("expired");
          },
          "timeout-callback": () => {
            if (!disposed) invalidate("expired");
          },
          "unsupported-callback": () => {
            if (!disposed) invalidate("error");
          },
        });
      } catch {
        invalidate("error");
      }
    };

    const handleLoad = () => {
      script?.setAttribute("data-loaded", "true");
      renderWidget();
    };
    const handleError = () => {
      script?.setAttribute("data-failed", "true");
      if (!disposed) invalidate("error");
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      script = document.getElementById(
        TURNSTILE_SCRIPT_ID,
      ) as HTMLScriptElement | null;
      if (script?.dataset.failed === "true") {
        script.remove();
        script = null;
      }
      if (!script) {
        script = document.createElement("script");
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.addEventListener("load", handleLoad);
        script.addEventListener("error", handleError);
        document.head.appendChild(script);
      } else {
        script.addEventListener("load", handleLoad);
        script.addEventListener("error", handleError);
      }
      if (script.dataset.loaded === "true" && window.turnstile) {
        renderWidget();
      }
    }

    return () => {
      disposed = true;
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // The provider may already have removed a failed widget.
        }
      }
    };
  }, [invalidate, onToken, siteKey]);

  return (
    <div className="mt-4">
      <p
        id="login-security-check-label"
        className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange"
      >
        Sicherheitsprüfung
      </p>
      <div
        ref={containerRef}
        aria-labelledby="login-security-check-label"
        className="min-h-[65px] max-w-full"
      />
      <p
        role={state === "error" ? "alert" : "status"}
        className={
          state === "error"
            ? "mt-2 text-sm text-destructive"
            : "mt-2 text-sm text-muted-foreground"
        }
      >
        {state === "ready"
          ? "Sicherheitsprüfung abgeschlossen."
          : state === "error"
            ? "Sicherheitsprüfung nicht verfügbar. Lade die Seite neu oder prüfe, ob ein Inhaltsblocker sie verhindert."
            : state === "expired"
              ? "Sicherheitsprüfung abgelaufen. Schließe die erneuerte Prüfung ab."
              : "Sicherheitsprüfung wird geladen."}
      </p>
    </div>
  );
});
