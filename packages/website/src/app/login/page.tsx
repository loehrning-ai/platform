import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login | Freie Lernplattform",
  description:
    "Optionales Lernkonto der kostenlosen KI-Lernplattform von loehrning.ai.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly next?: string; readonly reason?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next ?? "/konto");
  const { configured, user } = await getAuthenticatedUser();

  if (configured && user) redirect(next);

  return (
    <section className="min-h-[calc(100svh-4rem)] py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="h-[3px] w-28 bg-brand-orange" />
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Freie Lernplattform · Login
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl">
          {configured ? "Fortschritt sichern." : "Ohne Anmeldung lernen."}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Die meisten Kurse, Bücher und Demos sind ohne Anmeldung zugänglich.
          {configured
            ? " Das aktivierte Lernkonto kann Fortschritt zwischen Geräten synchronisieren."
            : " Das optionale Lernkonto ist in dieser Version deaktiviert; Fortschritt bleibt lokal in deinem Browser."}
          {" "}Teilnahmebestätigungen werden lokal erstellt.
        </p>
        {params.reason && (
          <div
            role="alert"
            className="mt-6 max-w-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground"
          >
            {loginReasonMessage(params.reason, configured)}
          </div>
        )}
        <LoginForm next={next} configured={configured} />
      </div>
    </section>
  );
}

function loginReasonMessage(
  reason: string,
  configured: boolean,
): React.ReactNode {
  if (!configured) {
    return (
      <>
        Das Lernkonto ist in dieser Version deaktiviert. Alle Kurse,
        Bücher und Demos bleiben ohne Anmeldung verfügbar.{" "}
        <Link href="/kurse" className="underline underline-offset-2 hover:text-foreground">
          Zum Kursangebot
        </Link>
      </>
    );
  }

  switch (reason) {
    case "progress-save":
      return (
        <>
          Melde dich an, um deinen Lernfortschritt auf allen Geräten zu sichern.
          Du kannst alle Kurse und Bücher auch ohne Anmeldung nutzen.{" "}
          <Link href="/kurse" className="underline underline-offset-2 hover:text-foreground">
            Zurück zum Kursangebot
          </Link>
        </>
      );
    case "kurs-login":
      return (
        <>
          Dieser Kurs gehört zu unseren zertifizierten Lernpfaden und
          erfordert ein Lernkonto. Alle anderen Kurse, Bücher und Demos
          bleiben ohne Anmeldung nutzbar.{" "}
          <Link href="/kurse" className="underline underline-offset-2 hover:text-foreground">
            Zurück zum Kursangebot
          </Link>
        </>
      );
    case "anderes-geraet":
      return (
        <>
          Du hast den Link auf einem anderen Gerät geöffnet. Bitte fordere einen
          neuen Link direkt auf diesem Gerät an.
        </>
      );
    case "abgelaufen":
      return (
        <>
          Dieser Link ist abgelaufen (gültig 60 Minuten). Bitte fordere einen
          neuen an.
        </>
      );
    case "ungueltig":
      return (
        <>
          Dieser Link ist ungültig oder wurde bereits verwendet. Bitte fordere
          einen neuen an.
        </>
      );
    case "auth-not-configured":
      return "Login ist in dieser Umgebung noch nicht konfiguriert.";
    case "missing-code":
      return "Der Login-Link ist unvollständig.";
    case "invalid-link":
      return "Der Login-Link ist abgelaufen oder wurde bereits verwendet.";
    default:
      return "Der Login konnte nicht abgeschlossen werden.";
  }
}
