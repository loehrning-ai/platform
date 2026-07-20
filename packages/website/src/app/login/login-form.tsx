"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Send } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { sanitizeNextPath } from "@/lib/auth/routes";

export function LoginForm({
  next,
  configured,
}: {
  readonly next: string;
  readonly configured: boolean;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const cleanNext = sanitizeNextPath(next);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lastSentAt && Date.now() - lastSentAt < 30_000) {
      setState("sent");
      setMessage("Login-Link wurde bereits verschickt. Warte kurz, bevor du erneut sendest.");
      return;
    }
    if (!supabase) {
      setState("error");
      setMessage("Supabase Auth ist nicht konfiguriert.");
      return;
    }
    setState("sending");
    setMessage("");

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(cleanNext)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setState("error");
      setMessage("Login-Link konnte nicht verschickt werden. Prüfe die E-Mail-Adresse und die Supabase-Konfiguration.");
      return;
    }

    setLastSentAt(Date.now());
    setState("sent");
    setMessage("Login-Link verschickt. Öffne die E-Mail in diesem Browser.");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--color-foreground)] sm:p-6"
    >
      <label
        htmlFor="email"
        className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange"
      >
        E-Mail-Adresse
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
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
            disabled={!configured}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full border-2 border-foreground bg-background pl-10 pr-3 text-base text-foreground outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-background"
            placeholder="name@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={!configured || state === "sending"}
          className="inline-flex h-12 items-center justify-center gap-2 border-2 border-foreground bg-brand-orange px-5 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] hover:bg-[#A5370F] hover:shadow-[6px_6px_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "sending" ? "Senden" : "Login-Link"}
          <Send size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {configured
          ? "Das Lernkonto speichert Kursfortschritt, XP und Zertifikatsstatus. Sämtliche Lerninhalte und Downloads bleiben ohne Login zugänglich."
          : "Kurse, Bücher, Demos und Downloads bleiben ohne Konto zugänglich."}
      </p>
      {message && (
        <p
          role={state === "error" ? "alert" : "status"}
          className={state === "error" ? "mt-4 text-sm text-red-600" : "mt-4 text-sm text-foreground"}
        >
          {message}
        </p>
      )}
      {!supabase && (
        <p
          role="note"
          className="mt-4 border border-border bg-background p-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-muted-foreground"
        >
          Supabase Auth ist nicht konfiguriert. Das Lernkonto ist in dieser
          Version deaktiviert.
        </p>
      )}
    </form>
  );
}
