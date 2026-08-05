import type { ReactNode } from "react";
import Link from "next/link";
import { books } from "@/lib/books";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPublicPageMetadata({
  title: "Hilfe & häufige Fragen",
  description:
    "Häufige Fragen zur freien KI-Lernplattform von loehrning.ai: Lernfortschritt, Teilnahmebestätigungen, Lernnachweise, Konto und Praxisbeispiele.",
  path: "/hilfe",
});

function getFaqItems(accountEnabled: boolean, feedbackEnabled: boolean): readonly {
  readonly question: string;
  readonly id: string;
  readonly answer: ReactNode;
}[] {
  return [
  {
    id: "anfang",
    question: "Wo fange ich an?",
    answer: (
      <>
        Am besten mit dem <Link href="/ki-check">KI-Check</Link>: Das dauert
        etwa fünf Minuten und zeigt dir den passenden Einstieg. Danach findest
        du alle {COURSE_CATALOG.length} Kurse auf der{" "}
        <Link href="/kurse">Kursübersicht</Link>.
      </>
    ),
  },
  {
    id: "konto",
    question: "Warum brauche ich ein Konto?",
    answer: accountEnabled
      ? "Für Bücher, Demos, KI-Check und die sechs technischen Kursreader brauchst du kein Konto. Die vier deutschen Kernkurse (KI-Führerschein, KI und Gesellschaft, EU AI Act Kurs, AI-Native Arbeitskurs) erfordern ein kostenloses Lernkonto. Es synchronisiert deinen Fortschritt über mehrere Geräte und verwendet einen Einmal-Link per E-Mail. Teilnahmebestätigung oder Lernnachweis werden trotzdem lokal erstellt, sind selbst ausgestellt und nicht servergeprüft."
      : "Bücher, Demos, KI-Check und die sechs technischen Kursreader sind ohne Konto erreichbar. Die vier deutschen Kernkurse (KI-Führerschein, KI und Gesellschaft, EU AI Act Kurs, AI-Native Arbeitskurs) erfordern ein kostenloses Lernkonto. Diese Kontofunktion ist in dieser Version deaktiviert; die vier Kursreader sind deshalb vorübergehend nicht erreichbar.",
  },
  {
    id: "fortschritt-weg",
    question: "Mein Lernfortschritt ist weg.",
    answer: accountEnabled
      ? "Die Plattform speichert Fortschritt zunächst im Browser-Speicher (localStorage). Browserdaten löschen oder private Tabs können ihn entfernen. Im Lernkonto wird der Fortschritt zusätzlich serverseitig synchronisiert."
      : "Die Plattform speichert Fortschritt im Browser-Speicher (localStorage). Browserdaten löschen, private Tabs oder ein anderes Gerät können ihn entfernen. Serverseitige Synchronisierung ist in dieser Version nicht aktiv.",
  },
  {
    id: "magic-link",
    question: "Der Magic-Link hat nicht funktioniert.",
    answer: accountEnabled
      ? (
          <>
            Magic-Links laufen nach der konfigurierten Frist ab und können nur
            einmal verwendet werden. Fordere auf der{" "}
            <Link href="/login">Login-Seite</Link> einen neuen Link an und
            prüfe den Spam-Ordner. Öffne den Link in dem Browser, in dem du
            lernen willst.
          </>
        )
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
      "Quizze können beliebig oft wiederholt werden. Es gibt keinen Zeitdruck und keine Strafe für falsche Antworten. Nach dem Absenden siehst du, welche Antworten richtig und welche falsch waren, und bekommst eine kurze Erklärung. Je nach Kurs zählen ein bestandenes Abschlussquiz, eine eingereichte Abschlussaufgabe oder alle abgeschlossenen Lektionen als Teilnahme.",
  },
  {
    id: "zertifikat",
    question: "Was bedeuten Teilnahmebestätigung und Lernnachweis?",
    answer: (
      <>
        Diese selbst ausgestellten Abschlussdokumente bestätigen deine
        Teilnahme. Je nach Kurs beruhen sie auf einem bestandenen
        Abschlussquiz, einer eingereichten Abschlussaufgabe oder allen
        abgeschlossenen Lektionen. Sie sind kein offizieller Nachweis im Sinne
        des Artikels 4 der EU-KI-Verordnung. Die Europäische Kommission hat
        klargestellt, dass kein bestimmtes Zertifikatsformat vorgeschrieben
        ist. Teilnahmebestätigung und Lernnachweis werden lokal in deinem
        Browser erstellt und sind nicht servergeprüft. Mehr dazu unter{" "}
        <Link href="/bekannte-grenzen">Bekannte Grenzen</Link>.
      </>
    ),
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
        ? accountEnabled
          ? "Das Buch ist kostenlos im Browser lesbar. Ein PDF-Download steht angemeldeten Nutzern zur Verfügung. Das Buch ist eine adaptierte Lernversion des Originalmanuskripts; es ist Lernmaterial, keine zitierfähige Rechtsquelle."
          : "Das Buch ist kostenlos im Browser lesbar. Der PDF-Download ist in dieser Version deaktiviert. Das Buch ist eine adaptierte Lernversion des Originalmanuskripts; es ist Lernmaterial, keine zitierfähige Rechtsquelle."
        : `Alle ${books.length} Bücher sind kostenlos im Browser lesbar. Die Bücher sind adaptierte Lernversionen der Originalmanuskripte; sie sind Lernmaterial, keine zitierfähigen Rechtsquellen.`,
  },
  {
    id: "konto-loeschen",
    question: "Wie lösche ich mein Konto oder exportiere meine Daten?",
    answer: accountEnabled
      ? (
          <>
            Löschung und Datenexport findest du unter{" "}
            <Link href="/konto/datenschutz" prefetch={false}>
              Datenschutz und Datenverwaltung
            </Link>.
            Datenschutzanfragen sind zusätzlich per E-Mail an{" "}
            <a href="mailto:tim@loehrning.ai">tim@loehrning.ai</a> möglich.
          </>
        )
      : (
          <>
            In dieser Version gibt es kein serverseitiges Lernkonto. Lokalen
            Fortschritt entfernst du durch Löschen der Website-Daten im
            Browser. Datenschutzanfragen gehen an{" "}
            <a href="mailto:tim@loehrning.ai">tim@loehrning.ai</a>.
          </>
        ),
  },
  {
    id: "rueckmeldung",
    question: "Wo melde ich einen Fehler oder gebe Rückmeldung?",
    answer: feedbackEnabled
      ? (
          <>
            Über das <Link href="/feedback">Feedback-Formular</Link>. Kein Konto
            erforderlich. Das Formular fragt keine E-Mail-Adresse ab.
          </>
        )
      : (
          <>
            Das serverseitige Feedback-Formular ist deaktiviert. Fehler und
            Rückmeldungen gehen per E-Mail an{" "}
            <a href="mailto:tim@loehrning.ai">tim@loehrning.ai</a>.
          </>
        ),
  },
  {
    id: "grenzen",
    question: "Was sind bekannte Einschränkungen?",
    answer: (
      <>
        Die Seite <Link href="/bekannte-grenzen">Bekannte Grenzen</Link>{" "}
        dokumentiert die selbst ausgestellten Teilnahmebestätigungen und
        Lernnachweise, simulierte Praxisbeispiele und die lokale Speicherung
        des Fortschritts.
      </>
    ),
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
              <div className="mt-4 text-sm leading-relaxed text-muted-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground">
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
                <>
                  Schreib an{" "}
                  <a
                    href="mailto:tim@loehrning.ai"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    tim@loehrning.ai
                  </a>
                  .
                </>
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
