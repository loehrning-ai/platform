import type { Metadata } from "next";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Rückmeldung",
  description:
    "Rückmeldung und Kontakt zur freien KI-Lernplattform von loehrning.ai.",
  alternates: { canonical: "/feedback" },
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  const { feedback } = getRuntimeFeatures();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="h-[3px] w-28 bg-brand-orange" />
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Beta
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
          Rückmeldung
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          {feedback
            ? "Kein Konto erforderlich. Das Formular fragt weder E-Mail-Adresse noch Namen als eigene Felder ab; eine Antwort ist deshalb nicht möglich. Gib im Freitext keine personenbezogenen oder vertraulichen Daten ein."
            : "Das serverseitige Feedback-Formular ist in dieser Version deaktiviert."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Schreib direkt an{" "}
          <a
            href="mailto:tim@loehrning.ai"
            className="underline underline-offset-2 hover:text-foreground"
          >
            tim@loehrning.ai
          </a>
          .
        </p>

        {feedback ? (
          <FeedbackForm />
        ) : (
          <div
            role="status"
            className="mt-10 rounded-lg border border-border bg-card/40 p-6 text-sm text-muted-foreground"
          >
            Es werden keine Formulardaten gespeichert. Nutze für Rückmeldungen
            die oben angegebene E-Mail-Adresse.
          </div>
        )}
      </div>
    </section>
  );
}
