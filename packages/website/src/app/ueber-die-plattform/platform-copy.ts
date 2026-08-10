import type { Locale } from "@/lib/i18n/locale";

type PlatformSection = Readonly<{
  title: string;
  body: string;
}>;

type PlatformCopy = Readonly<{
  metadata: Readonly<{ title: string; description: string }>;
  eyebrow: string;
  title: string;
  intro: string;
  statusEyebrow: string;
  accountLabel: string;
  accountReady: string;
  accountUnavailable: string;
  feedbackLabel: string;
  feedbackReady: string;
  feedbackUnavailable: string;
  sections: readonly PlatformSection[];
  accountSectionTitle: string;
  accountSectionReady: string;
  accountSectionUnavailable: string;
  feedbackSectionTitle: string;
  feedbackSectionReady: string;
  feedbackSectionUnavailable: string;
  linksEyebrow: string;
  limitsLink: string;
  sourceLink: string;
  feedbackLink: string;
  emailLink: string;
}>;

export const PLATFORM_COPY: Readonly<Record<Locale, PlatformCopy>> = {
  de: {
    metadata: {
      title: "Über die Plattform",
      description:
        "Betriebsmodell von loehrning.ai: öffentlicher Zugang, Kontogrenzen, Quellenprüfung, selbst ausgestellte Abschlussdokumente und aktuelle Systemverfügbarkeit.",
    },
    eyebrow: "Plattformmodell",
    title: "Öffentliche Inhalte. Kontogebundene Zustände. Belegte Grenzen.",
    intro:
      "loehrning.ai ist eine frei zugängliche Lernplattform. Diese Seite trennt veröffentlichte Inhalte, persönliche Lernstände und externe Betriebsabhängigkeiten.",
    statusEyebrow: "Aktueller Betriebszustand",
    accountLabel: "Lernkonto",
    accountReady: "Konfiguriert",
    accountUnavailable: "Nicht verfügbar",
    feedbackLabel: "Feedback-Formular",
    feedbackReady: "Konfiguriert",
    feedbackUnavailable: "Nicht verfügbar",
    sections: [
      {
        title: "Warum der Zugang kostenlos ist",
        body: "Kurse, Bücher, Demos, Workshops und veröffentlichte Quellartefakte werden ohne Kauf- oder Buchungsstrecke bereitgestellt. Es gibt keine versteckte Premiumstufe.",
      },
      {
        title: "Was ohne Konto erreichbar ist",
        body: "Öffentlich sind Start- und Kurs-Landingpages, KI-Check, Bücher, Demos, Blog, Workshops, Open-Source-Hub, bekannte Grenzen und technische Kursreader. Quiz-, Nachweis- und Verifizierungsseiten können aus Suchmaschinen ausgeschlossen sein, obwohl sie direkt erreichbar sind.",
      },
      {
        title: "Quellen und Aktualisierung",
        body: "Zeitabhängige und rechtliche Aussagen nennen Prüfdatum und Primärquelle. Inhaltliche Korrekturen werden im Changelog dokumentiert. Eine sichtbare Aktualisierung darf nicht durch ein bloßes neues Veröffentlichungsdatum vorgetäuscht werden.",
      },
      {
        title: "Abschlussdokumente",
        body: "Teilnahmebestätigungen, Lernnachweise und englisch bezeichnete Certificates werden von loehrning.ai selbst ausgestellt. Sie sind nicht amtlich, nicht akkreditiert und kein Rechts- oder Compliance-Nachweis.",
      },
    ],
    accountSectionTitle: "Wo ein Konto erforderlich ist",
    accountSectionReady:
      "Die Reader der vier Grundlagenkurse erfordern ein kostenloses Lernkonto. Das Konto synchronisiert Fortschritt, Quizstatus und Datenschutzaktionen. Öffentliche Kursvorschauen und technische Reader bleiben ohne Anmeldung lesbar.",
    accountSectionUnavailable:
      "Die Reader der vier Grundlagenkurse erfordern ein kostenloses Lernkonto. Die Kontofunktion ist in dieser Laufzeit nicht vollständig konfiguriert; deshalb bleiben diese Reader geschlossen. Öffentliche Kursvorschauen, Bücher, Demos, Workshops und technische Reader bleiben erreichbar.",
    feedbackSectionTitle: "Korrekturen und Rückmeldungen",
    feedbackSectionReady:
      "Das Feedback-Formular fragt Name und E-Mail-Adresse nicht als eigene Felder ab. Eine optionale Seitenadresse dient nur der Zuordnung. Schutz vor Missbrauch und Aufbewahrung bleiben in der Datenschutzerklärung dokumentiert.",
    feedbackSectionUnavailable:
      "Das serverseitige Feedback-Formular ist in dieser Laufzeit nicht verfügbar. Inhaltliche Korrekturen können per E-Mail gemeldet werden.",
    linksEyebrow: "Prüfpfade",
    limitsLink: "Bekannte Grenzen",
    sourceLink: "Open-Source-Hub",
    feedbackLink: "Korrektur melden",
    emailLink: "Korrektur per E-Mail",
  },
  en: {
    metadata: {
      title: "About the platform",
      description:
        "How loehrning.ai operates: public access, account boundaries, source review, self-issued completion records, and current system availability.",
    },
    eyebrow: "Platform model",
    title: "Public content. Account-bound state. Documented limits.",
    intro:
      "loehrning.ai is a freely accessible learning platform. This page separates published content, personal learning state, and external operating dependencies.",
    statusEyebrow: "Current operating state",
    accountLabel: "Learning account",
    accountReady: "Configured",
    accountUnavailable: "Unavailable",
    feedbackLabel: "Feedback form",
    feedbackReady: "Configured",
    feedbackUnavailable: "Unavailable",
    sections: [
      {
        title: "Why access is free",
        body: "Courses, books, demos, workshops, and published source artifacts are provided without a purchase or booking flow. There is no hidden premium tier.",
      },
      {
        title: "What is available without an account",
        body: "Public resources include the home and course landing pages, the AI self-check, books, demos, the blog, workshops, the open-source hub, known limitations, and technical course readers. Quiz, record, and verification pages may be excluded from search even when they are directly accessible.",
      },
      {
        title: "Sources and updates",
        body: "Time-dependent and legal statements include a review date and primary source. Material corrections are recorded in the changelog. A visible update must not be implied by changing a publication date alone.",
      },
      {
        title: "Completion records",
        body: "Participation records, learning records, and documents labelled Certificates are issued by loehrning.ai itself. They are not official, accredited, legal, or compliance evidence.",
      },
    ],
    accountSectionTitle: "Where an account is required",
    accountSectionReady:
      "The readers for the four foundation courses require a free learning account. The account synchronizes progress, quiz status, and privacy actions. Public course previews and technical readers remain readable without signing in.",
    accountSectionUnavailable:
      "The readers for the four foundation courses require a free learning account. The account system is not fully configured in this runtime, so those readers remain closed. Public course previews, books, demos, workshops, and technical readers remain accessible.",
    feedbackSectionTitle: "Corrections and feedback",
    feedbackSectionReady:
      "The feedback form does not request a name or email address as separate fields. An optional page address is used only to identify context. Abuse protection and retention are documented in the privacy notice.",
    feedbackSectionUnavailable:
      "The server-side feedback form is unavailable in this runtime. Content corrections can be reported by email.",
    linksEyebrow: "Audit paths",
    limitsLink: "Known limitations",
    sourceLink: "Open-source hub",
    feedbackLink: "Report a correction",
    emailLink: "Report by email",
  },
} as const;
