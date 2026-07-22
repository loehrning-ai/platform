import type { Metadata } from "next";
import Link from "next/link";
import { books } from "@/lib/books";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { getRuntimeFeatures } from "@/lib/runtime-features";

export const metadata: Metadata = {
  title: "Hilfe & häufige Fragen",
  description:
    "Häufige Fragen zur freien KI-Lernplattform von loehrning.ai: Lernfortschritt, Zertifikate, Konto, Praxisbeispiele und mehr.",
  alternates: { canonical: "/hilfe" },
  robots: { index: true, follow: true },
};

function getFaqItems(accountEnabled: boolean, feedbackEnabled: boolean): readonly {
  readonly question: string;
  readonly id: string;
  readonly answer: string;
}[] {
  return [
  {
    id: "anfang",
    question: "Wo fange ich an?",
    answer:
      `Am besten mit dem KI-Check (/ki-check): Das dauert ca. 5 Minuten und zeigt dir, welcher Kurs als nächstes zu dir passt. Oder wähle direkt auf der Kursübersicht (/kurse) einen der ${COURSE_CATALOG.length} Kurse auf dem KI-Kompetenzweg.`,
  },
  {
    id: "konto",
    question: "Warum brauche ich ein Konto?",
    answer: accountEnabled
      ? "Für die meisten Kurse, Bücher und Demos brauchst du kein Konto. Die vier zertifizierten Kurse (KI-Führerschein, EU AI Act Kurs, AI-Native Arbeitskurs, KI und Gesellschaft) erfordern ein kostenloses Lernkonto, damit dein Fortschritt zur Zertifikatsausstellung nachvollziehbar bleibt. Das Lernkonto synchronisiert Fortschritt über mehrere Geräte und verwendet einen Einmal-Link per E-Mail. Die Daten liegen auf Servern in der EU."
      : "Für die meisten Kurse, Bücher, Demos und Downloads brauchst du kein Konto. Das optionale Lernkonto und die geräteübergreifende Synchronisierung sind in dieser Version deaktiviert; Fortschritt bleibt lokal in diesem Browser. Die vier zertifizierten Kurse (KI-Führerschein, EU AI Act Kurs, AI-Native Arbeitskurs, KI und Gesellschaft) erfordern normalerweise ein Lernkonto und sind in dieser Version vorübergehend nicht erreichbar.",
  },
  {
    id: "fortschritt-weg",
    question: "Mein Lernfortschritt ist weg.",
    answer: accountEnabled
      ? "Ohne Konto speichert die Plattform deinen Fortschritt im Browser-Speicher (localStorage). Browserdaten löschen, private Tabs oder ein anderes Gerät können ihn entfernen. Bei einem aktiven Lernkonto ist serverseitige Synchronisierung verfügbar."
      : "Die Plattform speichert Fortschritt im Browser-Speicher (localStorage). Browserdaten löschen, private Tabs oder ein anderes Gerät können ihn entfernen. Serverseitige Synchronisierung ist in dieser Version nicht aktiv.",
  },
  {
    id: "magic-link",
    question: "Der Magic-Link hat nicht funktioniert.",
    answer: accountEnabled
      ? "Magic-Links sind 60 Minuten gültig und können nur einmal verwendet werden. Fordere auf /login einen neuen Link an und prüfe den Spam-Ordner. Öffne den Link in dem Browser, in dem du lernen willst."
      : "Magic-Link-Anmeldung ist in dieser Version deaktiviert. Alle öffentlichen Lerninhalte bleiben ohne Anmeldung verfügbar.",
  },
  {
    id: "mehrere-geraete",
    question: "Kann ich auf mehreren Geräten lernen?",
    answer: accountEnabled
      ? "Ja, bei aktivem Lernkonto wird der Fortschritt synchronisiert. Ohne Konto speichert jedes Gerät einen eigenen lokalen Stand."
      : "Die Inhalte funktionieren auf mehreren Geräten, aber jedes Gerät speichert seinen Fortschritt lokal. Eine Synchronisierung ist in dieser Version deaktiviert.",
  },
  {
    id: "quiz",
    question: "Wie funktionieren Quiz und Neuversuche?",
    answer:
      "Jedes Quiz kann beliebig oft wiederholt werden. Es gibt keinen Zeitdruck und keine Strafe für falsche Antworten. Nach dem Absenden siehst du, welche Antworten richtig und welche falsch waren, und bekommst eine kurze Erklärung. Bestandene Quizze werden in deinem Profil markiert.",
  },
  {
    id: "zertifikat",
    question: "Was bedeutet das Teilnahme-Zertifikat?",
    answer:
      "Das Zertifikat bestätigt deine Teilnahme und das bestandene Quiz. Es ist kein offizieller Nachweis im Sinne des Artikels 4 der EU-KI-Verordnung. Die Europäische Kommission hat klargestellt, dass kein bestimmtes Zertifikat gesetzlich vorgeschrieben ist. Interne Aufzeichnungen können ausreichen. Bitte prüfe das mit deinem Arbeitgeber oder Rechtsbeistand. Das Zertifikat wird lokal in deinem Browser erstellt und ist nicht servergeprüft. Mehr dazu: /bekannte-grenzen.",
  },
  {
    id: "praxisbeispiel",
    question: "Was ist ein Praxisbeispiel oder eine Sandbox?",
    answer:
      "Alle interaktiven Praxisbeispiele verwenden synthetische Daten und simulierte Abläufe. Es werden keine echten E-Mails verschickt, keine echten APIs angefragt und keine echten Nutzerdaten verarbeitet. Das Label \"Simuliert\" bleibt während der gesamten Interaktion sichtbar. Das dient dem Lernen des Konzepts, nicht dem produktiven Einsatz.",
  },
  {
    id: "buecher",
    question: "Bücher: Was kann ich lesen, was kann ich herunterladen?",
    answer:
      books.length === 1
        ? "Das Buch ist kostenlos im Browser lesbar. Ein PDF-Download steht angemeldeten Nutzern zur Verfügung. Das Buch ist eine adaptierte Lernversion des Originalmanuskripts; es ist Lernmaterial, keine zitierfähige Rechtsquelle."
        : `Alle ${books.length} Bücher sind kostenlos im Browser lesbar. Die Bücher sind adaptierte Lernversionen der Originalmanuskripte; sie sind Lernmaterial, keine zitierfähigen Rechtsquellen.`,
  },
  {
    id: "konto-loeschen",
    question: "Wie lösche ich mein Konto oder exportiere meine Daten?",
    answer: accountEnabled
      ? "Für ein aktives Lernkonto kannst du Löschung oder Datenexport unter /konto/datenschutz anfordern. Datenschutzanfragen sind zusätzlich per E-Mail an tim@loehrning.ai möglich."
      : "In dieser Version gibt es kein serverseitiges Lernkonto. Lokalen Fortschritt entfernst du durch Löschen der Website-Daten im Browser. Datenschutzanfragen gehen an tim@loehrning.ai.",
  },
  {
    id: "rueckmeldung",
    question: "Wo melde ich einen Fehler oder gebe Rückmeldung?",
    answer: feedbackEnabled
      ? "Über das Feedback-Formular (/feedback). Kein Konto erforderlich. Das Formular fragt keine E-Mail-Adresse ab; gespeichert werden Nachricht, Kategorie und optional nur der Seitenpfad ohne Query-String oder Fragment."
      : "Das serverseitige Feedback-Formular ist in dieser Version deaktiviert. Fehler und Rückmeldungen können per E-Mail an tim@loehrning.ai gesendet werden.",
  },
  {
    id: "grenzen",
    question: "Was sind bekannte Einschränkungen?",
    answer:
      "Wir dokumentieren bekannte Einschränkungen offen auf der Seite /bekannte-grenzen. Dazu gehören u.a. das selbst-bestätigende Zertifikat, die simulierten Praxisbeispiele und die lokale Speicherung des Fortschritts ohne Konto.",
  },
  ];
}

export default function HilfePage() {
  const features = getRuntimeFeatures();
  const faqItems = getFaqItems(features.account, features.feedback);
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="h-[3px] w-28 bg-brand-orange" />
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Support
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
          Hilfe und häufige Fragen
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Hier findest du Antworten auf die häufigsten Fragen zur Plattform.
        </p>

        <div className="mt-12 space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.id}
              id={item.id}
              className="group rounded-lg border border-border bg-card/40 px-5 py-4 open:pb-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <p className="text-sm font-semibold text-foreground">
              Noch eine Frage?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {features.feedback ? (
                <>
                  Nutze das{" "}
                  <Link
                    href="/feedback"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Feedback-Formular
                  </Link>
                  .
                </>
              ) : (
                <>Schreib an tim@loehrning.ai.</>
              )}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <p className="text-sm font-semibold text-foreground">
              Inhaltsaktualisierungen
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Alle Aktualisierungen findest du auf{" "}
              <Link
                href="/neuigkeiten"
                className="underline underline-offset-2 hover:text-foreground"
              >
                /neuigkeiten
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
