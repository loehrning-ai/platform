"use client";

import { useRef, useState } from "react";
type Category = "inhalt" | "technik" | "lernweg" | "sonstiges";

const CATEGORIES: readonly { value: Category; label: string }[] = [
  { value: "inhalt", label: "Inhaltsfehler oder Unklarheit" },
  { value: "technik", label: "Technisches Problem" },
  { value: "lernweg", label: "Verbesserungsvorschlag zum Lernweg" },
  { value: "sonstiges", label: "Sonstiges" },
];

type Status = "idle" | "sending" | "success" | "error";

function feedbackContextPath(): string | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }
  try {
    const referrer = new URL(document.referrer);
    if (
      referrer.origin === window.location.origin &&
      referrer.pathname !== "/feedback"
    ) {
      return referrer.pathname;
    }
  } catch {
    // Direct visits and privacy-restricted referrers intentionally have no
    // inferred content context.
  }
  return undefined;
}

export function FeedbackForm() {
  const [category, setCategory] = useState<Category>("inhalt");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const isValid = message.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    if (!isValid) {
      setValidationError("Gib mindestens 10 Zeichen ein.");
      messageRef.current?.focus();
      return;
    }

    setValidationError(null);
    setStatus("sending");

    // The form itself always lives at /feedback. Derive the reported page only
    // from a same-origin referrer and retain its pathname; query strings and
    // fragments can contain search terms, magic-link material, or other data
    // that feedback does not need.
    const contextUrl = feedbackContextPath();

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim(), contextUrl }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 429) {
          setStatus("error");
          return;
        }
        throw new Error(data.error ?? "unknown");
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="alert"
        className="mt-10 rounded-lg border border-border bg-card/40 p-8 text-center"
      >
        <p className="text-xl font-bold text-foreground">
          Danke für deine Rückmeldung.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Jede Nachricht wird gelesen. Was sich daraus ergibt, steht unter Neuigkeiten.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      {/* Category */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Art der Rückmeldung
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              aria-pressed={category === cat.value}
              className={[
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                category === cat.value
                  ? "border-brand-orange bg-brand-orange/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
              ].join(" ")}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Message */}
      <div>
        <label
          htmlFor="feedback-message"
          className="mb-2 block text-sm font-semibold text-foreground"
        >
          Nachricht
          <span
            id="feedback-message-requirement"
            className="ml-1 font-normal text-muted-foreground"
          >
            (mind. 10 Zeichen)
          </span>
        </label>
        <textarea
          ref={messageRef}
          id="feedback-message"
          name="message"
          autoComplete="off"
          value={message}
          onChange={(e) => {
            const nextMessage = e.target.value;
            setMessage(nextMessage);
            if (validationError && nextMessage.trim().length >= 10) {
              setValidationError(null);
            }
          }}
          rows={6}
          maxLength={2000}
          required
          minLength={10}
          aria-invalid={Boolean(validationError)}
          aria-describedby={
            validationError
              ? "feedback-message-requirement feedback-message-error feedback-message-count"
              : "feedback-message-requirement feedback-message-count"
          }
          placeholder="Zum Beispiel: Eine Quellenangabe ist unklar …"
          className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        {validationError && (
          <p
            id="feedback-message-error"
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {validationError}
          </p>
        )}
        <p
          id="feedback-message-count"
          className="mt-1 text-right text-xs text-muted-foreground"
        >
          {message.length} / 2000
        </p>
      </div>

      {/* Error state */}
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          Die Rückmeldung konnte nicht gesendet werden. Bitte versuche es
          später erneut oder schreib an tim@loehrning.ai.
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "sending"}
        className={[
          "inline-flex select-none items-center justify-center rounded-lg",
          "bg-brand-orange px-7 py-3.5",
          "text-[0.9375rem] font-bold uppercase tracking-wide text-white",
          "shadow-card",
          "transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 ease-out",
          "hover:-translate-y-0.5 hover:shadow-card-hover",
          "active:translate-y-0 active:shadow-tile",
          "disabled:pointer-events-none disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ].join(" ")}
      >
        {status === "sending" ? "Wird gesendet…" : "Rückmeldung senden"}
      </button>

      <p className="text-xs text-muted-foreground">
        Keine personenbezogenen oder vertraulichen Daten eingeben. Kein Konto.
        Keine Antwort möglich.
      </p>
    </form>
  );
}
