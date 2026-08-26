"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Locale } from "@/lib/i18n/locale";
import { LOGIN_COPY } from "./login-copy";

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
      readonly language: Locale;
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
  readonly locale?: Locale;
}

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget({ siteKey, onToken, locale = "de" }, forwardedRef) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "expired">(
    "loading",
  );
  const copy = LOGIN_COPY[locale].turnstile;

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
          language: locale,
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
  }, [invalidate, locale, onToken, siteKey]);

  return (
    <div className="mt-4">
      <p
        id="login-security-check-label"
        className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange"
      >
        {copy.label}
      </p>
      <div
        ref={containerRef}
        aria-labelledby="login-security-check-label"
        className="min-h-[65px] w-full min-w-0 max-w-full"
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
          ? copy.ready
          : state === "error"
            ? copy.error
            : state === "expired"
              ? copy.expired
              : copy.loading}
      </p>
    </div>
  );
});
