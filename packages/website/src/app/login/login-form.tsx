"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Mail, Send } from "lucide-react";
import { Github } from "@/components/icons/brand";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { trackLoginFlow } from "@/lib/analytics/events";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "./turnstile-widget";
import { LOGIN_COPY, type LoginUnavailableReason } from "./login-copy";

export function LoginForm({
  next,
  accountReady,
  magicLinkReady,
  googleReady,
  githubReady = false,
  turnstileSiteKey,
  locale = "de",
  unavailableReason = "disabled",
}: {
  readonly next: string;
  readonly accountReady: boolean;
  readonly magicLinkReady: boolean;
  readonly googleReady: boolean;
  /** Optional third provider; absent unless its own confirmation is dated. */
  readonly githubReady?: boolean;
  readonly turnstileSiteKey: string | null;
  readonly locale?: Locale;
  readonly unavailableReason?: LoginUnavailableReason;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    | "idle"
    | "sending-otp"
    | "redirecting-google"
    | "redirecting-github"
    | "sent"
    | "error"
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
  const githubAvailable = accountReady && githubReady;
  const oauthAvailable = googleAvailable || githubAvailable;
  const oauthNoticeVariant =
    googleAvailable && githubAvailable
      ? "both"
      : googleAvailable
        ? "google"
        : "github";
  const supabase = useMemo(() => {
    if (!accountReady || (!magicLinkAvailable && !oauthAvailable)) {
      return null;
    }
    try {
      return createBrowserSupabaseClient();
    } catch {
      // Client construction can fail before submission when browser
      // configuration is invalid. Keep provider details out of render errors.
      return null;
    }
  }, [accountReady, magicLinkAvailable, oauthAvailable]);
  const cleanNext = sanitizeNextPath(next);
  const busy =
    state === "sending-otp" ||
    state === "redirecting-google" ||
    state === "redirecting-github";
  const copy = LOGIN_COPY[locale].form;

  if (!magicLinkAvailable && !oauthAvailable) {
    // No provider passed verification, so no control is rendered at all: a
    // disabled form would still read as an offer. The page above carries the
    // machine state and the next step; this card only names the method surface
    // so the sign-in boundary stays visible where a learner looks for it.
    return (
      <section
        aria-labelledby="login-form-title"
        data-login-method-state="unavailable"
        data-login-unavailable-reason={unavailableReason}
        className="min-w-0"
      >
        <h2
          id="login-form-title"
          className="text-[13px] font-medium text-muted-foreground"
        >
          {copy.title}
        </h2>
        <p
          role="note"
          className="mt-2 break-words rounded-lg border border-hairline bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-foreground"
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
      // The event names the method only. The address never enters a payload.
      trackLoginFlow("magic_link", "started");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackRedirectTo(),
          shouldCreateUser: true,
          captchaToken,
        },
      });

      if (error) {
        trackLoginFlow("magic_link", "link_failed");
        setState("error");
        setMessage(copy.otpProviderError);
        return;
      }

      trackLoginFlow("magic_link", "link_sent");
      setLastSentAt(Date.now());
      setState("sent");
      setMessage(copy.sent);
    } catch {
      // Auth transport errors can contain provider or request details. Recover
      // locally without forwarding the thrown value to the console or global
      // error handlers. The event carries the outcome label, never the error.
      trackLoginFlow("magic_link", "link_failed");
      setState("error");
      setMessage(copy.otpTransportError);
    } finally {
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    }
  }

  /**
   * One redirect path for every OAuth provider. Each provider keeps its own
   * pending state and its own generic failure message, so a broken GitHub
   * console never reports itself as a Google problem.
   */
  async function startOAuthSignIn(provider: "google" | "github") {
    const enabled = provider === "google" ? googleAvailable : githubAvailable;
    if (busy || !supabase || !enabled) return;
    const failure = provider === "google" ? copy.googleError : copy.githubError;
    setState(
      provider === "google" ? "redirecting-google" : "redirecting-github",
    );
    setMessage("");
    try {
      trackLoginFlow(provider, "started");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackRedirectTo(),
        },
      });
      if (error) {
        setState("error");
        setMessage(failure);
      }
    } catch {
      setState("error");
      setMessage(failure);
    }
  }

  return (
    <form
      onSubmit={submit}
      aria-labelledby="login-form-title"
      data-login-method-state="available"
      className="min-w-0"
    >
      {/* The card's quiet row label, as in the reference: the page heading
          above names the task, this names the surface. */}
      <h2
        id="login-form-title"
        className="mb-2.5 text-[13px] font-medium text-muted-foreground"
      >
        {copy.title}
      </h2>
      {googleAvailable ? (
        <button
          type="button"
          onClick={() => startOAuthSignIn("google")}
          disabled={!supabase || busy}
          aria-busy={state === "redirecting-google"}
          data-google-brand-button="light"
          className="relative inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-[#747775] bg-white px-12 text-[14px] font-medium leading-5 text-[#1f1f1f] hover:bg-[#f7f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-70"
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
      {githubAvailable ? (
        <button
          type="button"
          onClick={() => startOAuthSignIn("github")}
          disabled={!supabase || busy}
          aria-busy={state === "redirecting-github"}
          data-login-provider="github"
          className={`${googleAvailable ? "mt-3 " : ""}login-btn relative inline-flex min-h-11 w-full items-center justify-center gap-2 px-12 text-[14px] font-medium leading-5 disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <Github size={18} aria-hidden="true" className="absolute left-3" />
          {state === "redirecting-github" ? copy.githubPending : copy.github}
          {state === "redirecting-github" ? (
            <Loader2
              size={14}
              className="absolute right-3 animate-spin"
              aria-hidden="true"
            />
          ) : null}
        </button>
      ) : null}
      {oauthAvailable ? (
        // Layered Art. 13 notice: a disclosure right at the control names what
        // the sign-in identity stores, with the full notice one link away. Deliberately not a
        // checkbox, which would read as consent.
        <details
          data-login-oauth-notice={oauthNoticeVariant}
          className="mt-3 break-words text-xs leading-relaxed text-muted-foreground"
        >
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            {copy.oauthNotice.summary}
          </summary>
          <p className="mt-1">
            {copy.oauthNotice[oauthNoticeVariant]}{" "}
            {copy.oauthNotice.detailsBefore}
            <Link
              href={localizeHref("/datenschutz", locale)}
              className="font-medium text-foreground underline underline-offset-4 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {copy.oauthNotice.detailsLink}
            </Link>
            {copy.oauthNotice.detailsAfter}
          </p>
        </details>
      ) : null}
      {oauthAvailable && magicLinkAvailable ? (
        <div
          className="login-divider my-4 text-[13px] text-muted-foreground"
          aria-hidden="true"
        >
          {copy.emailSeparator}
        </div>
      ) : null}
      {magicLinkAvailable ? (
        <>
          <label
            htmlFor="email"
            className="block text-[13px] font-medium text-foreground"
          >
            {copy.emailLabel}
          </label>
          <p
            id="login-email-hint"
            className="mt-1 break-words text-[13px] leading-relaxed text-muted-foreground"
          >
            {copy.emailHint}
          </p>
          <div className="mt-3 flex min-w-0 flex-col gap-3">
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
                className="login-input h-12 w-full min-w-0 pl-10 pr-3 text-base"
                placeholder="name@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={!supabase || !captchaToken || busy}
              aria-busy={state === "sending-otp"}
              className="login-btn inline-flex h-12 w-full items-center justify-center gap-2 px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
      <p className="mt-5 break-words border-t border-hairline pt-3.5 text-center text-xs leading-relaxed text-muted-foreground">
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
          className="mt-4 break-words rounded-lg border border-hairline bg-white/[0.04] p-3 text-[13px] leading-relaxed text-muted-foreground"
        >
          {copy.unavailable[unavailableReason]}
        </p>
      ) : null}
    </form>
  );
}
