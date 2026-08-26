"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Mail, Send } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { sanitizeNextPath } from "@/lib/auth/routes";
import type { Locale } from "@/lib/i18n/locale";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "./turnstile-widget";
import { LOGIN_COPY } from "./login-copy";

export function LoginForm({
  next,
  accountReady,
  magicLinkReady,
  googleReady,
  turnstileSiteKey,
  locale = "de",
  unavailableReason = "disabled",
}: {
  readonly next: string;
  readonly accountReady: boolean;
  readonly magicLinkReady: boolean;
  readonly googleReady: boolean;
  readonly turnstileSiteKey: string | null;
  readonly locale?: Locale;
  readonly unavailableReason?:
    "disabled" | "outage" | "configuration" | "methods";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    "idle" | "sending-otp" | "redirecting-google" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const handleCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);
  const magicLinkAvailable = Boolean(
    accountReady && magicLinkReady && turnstileSiteKey,
  );
  const googleAvailable = accountReady && googleReady;
  const supabase = useMemo(() => {
    if (!accountReady || (!magicLinkAvailable && !googleAvailable)) {
      return null;
    }
    try {
      return createBrowserSupabaseClient();
    } catch {
      // Client construction can fail before submission when browser
      // configuration is invalid. Keep provider details out of render errors.
      return null;
    }
  }, [accountReady, googleAvailable, magicLinkAvailable]);
  const cleanNext = sanitizeNextPath(next);
  const busy = state === "sending-otp" || state === "redirecting-google";
  const copy = LOGIN_COPY[locale].form;

  if (!magicLinkAvailable && !googleAvailable) {
    return (
      <section
        aria-labelledby="login-form-title"
        className="min-w-0 border border-border border-t-[3px] border-t-brand-orange bg-card p-4 sm:p-5"
      >
        <h2
          id="login-form-title"
          className="text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl"
        >
          {copy.title}
        </h2>
        <p
          role="note"
          className="mt-3 break-words font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-muted-foreground"
        >
          {copy.unavailable[unavailableReason]}
        </p>
      </section>
    );
  }

  function callbackRedirectTo(): string {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(cleanNext)}`;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (lastSentAt && Date.now() - lastSentAt < 30_000) {
      setState("sent");
      setMessage(copy.resendBlocked);
      turnstileRef.current?.reset();
      return;
    }
    if (!supabase || !magicLinkAvailable || !captchaToken) {
      setState("error");
      setMessage(copy.captchaRequired);
      return;
    }
    setState("sending-otp");
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackRedirectTo(),
          shouldCreateUser: true,
          captchaToken,
        },
      });

      if (error) {
        setState("error");
        setMessage(copy.otpProviderError);
        return;
      }

      setLastSentAt(Date.now());
      setState("sent");
      setMessage(copy.sent);
    } catch {
      // Auth transport errors can contain provider or request details. Recover
      // locally without forwarding the thrown value to the console or global
      // error handlers.
      setState("error");
      setMessage(copy.otpTransportError);
    } finally {
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    }
  }

  async function startGoogleSignIn() {
    if (busy || !supabase || !googleAvailable) return;
    setState("redirecting-google");
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackRedirectTo(),
        },
      });
      if (error) {
        setState("error");
        setMessage(copy.googleError);
      }
    } catch {
      setState("error");
      setMessage(copy.googleError);
    }
  }

  return (
    <form
      onSubmit={submit}
      aria-labelledby="login-form-title"
      className="min-w-0 border border-border border-t-[3px] border-t-brand-orange bg-card p-4 sm:p-5"
    >
      <div className="mb-4 border-b border-border pb-4">
        <h2
          id="login-form-title"
          className="text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl"
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {magicLinkAvailable || googleAvailable
            ? copy.availableInstruction
            : copy.unavailableInstruction}
        </p>
      </div>
      {googleAvailable ? (
        <button
          type="button"
          onClick={startGoogleSignIn}
          disabled={!supabase || busy}
          aria-busy={state === "redirecting-google"}
          data-google-brand-button="light"
          className="relative inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-[#747775] bg-white px-12 text-[14px] font-medium leading-5 text-[#1f1f1f] hover:bg-[#f7f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
          }}
        >
          <span
            aria-hidden="true"
            data-google-brand-icon="standard-gradient-g"
            className="absolute left-3 size-5 overflow-hidden bg-white"
          >
            <Image
              src="/google-signin-icon-light.svg"
              alt=""
              width={40}
              height={40}
              unoptimized
              className="absolute -left-2.5 -top-2.5 size-10 max-w-none"
            />
          </span>
          {state === "redirecting-google" ? copy.googlePending : copy.google}
          {state === "redirecting-google" ? (
            <Loader2
              size={14}
              className="absolute right-3 animate-spin"
              aria-hidden="true"
            />
          ) : null}
        </button>
      ) : null}
      {googleAvailable && magicLinkAvailable ? (
        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {copy.emailSeparator}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : null}
      {magicLinkAvailable ? (
        <>
          <label
            htmlFor="email"
            className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange"
          >
            {copy.emailLabel}
          </label>
          <p
            id="login-email-hint"
            className="mt-2 text-sm leading-relaxed text-muted-foreground"
          >
            {copy.emailHint}
          </p>
          <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Mail
                size={16}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={!supabase || busy}
                aria-describedby="login-email-hint"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 min-w-0 w-full border border-border bg-background pl-10 pr-3 text-base text-foreground outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-background"
                placeholder="name@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={!supabase || !captchaToken || busy}
              aria-busy={state === "sending-otp"}
              className="inline-flex h-12 items-center justify-center gap-2 border border-brand-orange bg-brand-orange px-5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white hover:border-foreground hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {state === "sending-otp" ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Send size={14} aria-hidden="true" />
              )}
              {state === "sending-otp" ? copy.sendPending : copy.sendLink}
            </button>
          </div>
          {supabase && turnstileSiteKey ? (
            <TurnstileWidget
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onToken={handleCaptchaToken}
              locale={locale}
            />
          ) : null}
        </>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {accountReady ? copy.accountReadyNote : copy.accountUnavailableNote}
      </p>
      {message ? (
        <p
          role={state === "error" ? "alert" : "status"}
          id="login-form-message"
          aria-live={state === "error" ? "assertive" : "polite"}
          className={
            state === "error"
              ? "mt-4 break-words border-l-[3px] border-destructive pl-3 text-sm leading-relaxed text-destructive"
              : "mt-4 break-words border-l-[3px] border-brand-orange pl-3 text-sm leading-relaxed text-foreground"
          }
        >
          {message}
        </p>
      ) : null}
      {!supabase ? (
        <p
          role="note"
          className="mt-4 border border-border bg-background p-3 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-muted-foreground"
        >
          {copy.unavailable[unavailableReason]}
        </p>
      ) : null}
    </form>
  );
}
