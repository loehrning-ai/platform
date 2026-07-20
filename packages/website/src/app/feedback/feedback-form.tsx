"use client";

import { useState } from "react";
type Category = "inhalt" | "technik" | "lernweg" | "sonstiges";

const CATEGORIES: readonly { value: Category; label: string }[] = [
  { value: "inhalt", label: "Inhaltsfehler oder Unklarheit" },
  { value: "technik", label: "Technisches Problem" },
  { value: "lernweg", label: "Verbesserungsvorschlag zum Lernweg" },
  { value: "sonstiges", label: "Sonstiges" },
];

type Status = "idle" | "sending" | "success" | "error";

export function FeedbackForm() {
  const [category, setCategory] = useState<Category>("inhalt");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const isValid = message.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || status === "sending") return;

    setStatus("sending");

    // Submit only the path. Query strings and fragments can contain search
    // terms, magic-link material, or other data that feedback does not need.
    const contextUrl =
      typeof window !== "undefined" ? window.location.pathname : undefined;

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
          <span className="ml-1 font-normal text-muted-foreground">
            (mind. 10 Zeichen)
          </span>
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={2000}
          required
          minLength={10}
          placeholder="Was hast du bemerkt? Was könnte besser sein?"
          className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {message.length} / 2000
        </p>
      </div>

      {/* Error state */}
      {status === "error" && (
        <p role="alert" className="text-sm text-red-500">
          Die Rückmeldung konnte nicht gesendet werden. Bitte versuche es
          später erneut oder schreib an tim@loehrning.ai.
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || status === "sending"}
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
