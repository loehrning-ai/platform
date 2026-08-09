"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  localizeHref,
  parseLocalePathname,
  type Locale,
} from "@/lib/i18n/locale";
import { FEEDBACK_COPY } from "@/lib/i18n/public-info-copy";

type Category = "inhalt" | "technik" | "lernweg" | "sonstiges";
type Status = "idle" | "sending" | "success" | "error" | "rate-limit";

function feedbackContextPath(): string | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }

  try {
    const referrer = new URL(document.referrer);
    const parsedPath = parseLocalePathname(referrer.pathname);
    if (
      referrer.origin === window.location.origin &&
      parsedPath.valid &&
      parsedPath.pathname !== "/feedback"
    ) {
      return referrer.pathname;
    }
  } catch {
    // Direct visits and privacy-restricted referrers intentionally have no
    // inferred content context.
  }

  return undefined;
}

function renderErrorWithMailto(text: string) {
  const [before, after = ""] = text.split("tim@loehrning.ai");
  return (
    <>
      {before}
      <a
        href="mailto:tim@loehrning.ai"
        className="font-semibold text-foreground underline decoration-current/40 underline-offset-4 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      >
        tim@loehrning.ai
      </a>
      {after}
    </>
  );
}

export function FeedbackForm({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = FEEDBACK_COPY[locale].form;
  const [category, setCategory] = useState<Category>("inhalt");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const isValid = message.trim().length >= 10;
  const numberFormatter = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;

    if (!isValid) {
      setValidationError(copy.validationError);
      messageRef.current?.focus();
      return;
    }

    setValidationError(null);
    setStatus("sending");

    // The API remains an unprefixed machine endpoint. Only a same-origin
    // pathname is retained; query strings and fragments can carry private data.
    const contextUrl = feedbackContextPath();

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          contextUrl,
        }),
      });

      if (response.status === 429) {
        setStatus("rate-limit");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-10 border border-border bg-card/50 p-7 sm:p-9"
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
          200 / OK
        </p>
        <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-foreground">
          {copy.successTitle}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {copy.successBody}
        </p>
        <Link
          href={localizeHref("/neuigkeiten", locale)}
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          {locale === "de" ? "Neuigkeiten öffnen" : "Open updates"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  const requestError =
    status === "rate-limit"
      ? copy.rateLimitError
      : status === "error"
        ? copy.genericError
        : null;

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-8" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          {copy.categoryLegend}
        </legend>
        <div className="mt-4 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
          {copy.categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              className={[
                "min-h-12 min-w-0 break-words bg-background px-4 py-3 text-left text-sm transition-colors",
                "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange",
                category === item.value
                  ? "bg-brand-orange/[0.08] font-semibold text-foreground shadow-[inset_3px_0_0_var(--color-brand-orange)]"
                  : "text-muted-foreground hover:bg-card hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label
            htmlFor="feedback-message"
            className="text-sm font-semibold text-foreground"
          >
            {copy.messageLabel}
          </label>
          <span
            id="feedback-message-requirement"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
          >
            {copy.requirement}
          </span>
        </div>
        <textarea
          ref={messageRef}
          id="feedback-message"
          name="message"
          autoComplete="off"
          value={message}
          onChange={(event) => {
            const nextMessage = event.target.value;
            setMessage(nextMessage);
            if (validationError && nextMessage.trim().length >= 10) {
              setValidationError(null);
            }
            if (status === "error" || status === "rate-limit") {
              setStatus("idle");
            }
          }}
          rows={7}
          maxLength={2000}
          required
          minLength={10}
          aria-invalid={Boolean(validationError)}
          aria-describedby={
            validationError
              ? "feedback-message-requirement feedback-message-error feedback-message-count"
              : "feedback-message-requirement feedback-message-count"
          }
          placeholder={copy.placeholder}
          className="mt-3 w-full resize-y border border-border bg-background px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        {validationError ? (
          <p
            id="feedback-message-error"
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {validationError}
          </p>
        ) : null}
        <p
          id="feedback-message-count"
          className="mt-2 text-right font-mono text-[11px] tabular-nums text-muted-foreground"
        >
          {numberFormatter.format(message.length)} / {numberFormatter.format(2000)}
        </p>
      </div>

      {requestError ? (
        <p
          role="alert"
          aria-live="polite"
          className="border-l-2 border-destructive pl-4 text-sm leading-relaxed text-destructive"
        >
          {renderErrorWithMailto(requestError)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-12 w-full select-none items-center justify-between gap-4 bg-brand-orange px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white transition-[background-color,opacity,transform] duration-200 hover:-translate-y-0.5 hover:bg-kupfer-dark active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:min-w-56"
      >
        <span>{status === "sending" ? copy.sending : copy.submit}</span>
        <span aria-hidden="true">{status === "sending" ? "···" : "→"}</span>
      </button>

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {copy.privacyNote}
      </p>
    </form>
  );
}
