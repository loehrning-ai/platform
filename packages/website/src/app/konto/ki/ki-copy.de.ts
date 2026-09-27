import type { AgentAccountCopy } from "./ki-copy";

/** German copy for /konto/ki. Du form, real umlauts, no em or en dashes. */
export const AGENT_ACCOUNT_COPY_DE: AgentAccountCopy = {
  metadata: {
    title: "Konto · Deine KI | Freie Lernplattform",
    description:
      "Eigene KI-Programme mit deinem Lernkonto verbinden: Zugriffsschlüssel, Freigaben, Aktivität und Chat.",
  },
  eyebrow: "Freie Lernplattform · Konto",
  title: "Deine KI.",
  intro:
    "Verbinde dein eigenes KI-Programm mit der Plattform und chatte mit deinem Anthropic-Schlüssel über die Kurse.",
  backToAccount: "Zurück zum Lernstand",
  sectionNavigationLabel: "Bereiche auf dieser Seite",
  sections: {
    chat: "Chat",
    tokens: "Zugriffsschlüssel",
    grants: "Freigaben",
    activity: "Aktivität",
  },

  accountUnavailableTitle: "Dein Anmeldestatus ist gerade nicht abrufbar.",
  accountUnavailableBody:
    "Du wurdest nicht abgemeldet. Lade die Seite in einigen Minuten neu.",

  endpointHeading: "Verbindung",
  endpointBody:
    "Trage diese Adresse in deinem Programm als HTTP-Verbindung ein. Öffentliche Inhalte gehen ohne Anmeldung, dein Lernstand erst nach einer Freigabe oder mit einem Zugriffsschlüssel.",
  endpointLabel: "Adresse",
  endpointHelpLink: "Anleitung für dein Programm",
  endpointOffTitle: "Der Zugang für Programme ist gerade nicht eingerichtet.",
  endpointOffBody:
    "Sobald er aktiv ist, erscheint hier die Adresse. Bis dahin wirken Zugriffsschlüssel und Freigaben nicht.",

  chatHeading: "Chat mit deiner KI",
  chatIntro:
    "Der Chat liest dieselben Kursinhalte wie dein Programm.",
  chatOffTitle: "Der Chat ist in dieser Umgebung nicht eingerichtet.",
  chatOffBody:
    "Bis dahin wird kein Schlüssel gespeichert und keine Anfrage gestellt.",

  keyHeading: "Dein Anthropic-Schlüssel",
  keyDisclosure:
    "Deine Nachrichten gehen mit deinem Schlüssel an Anthropic, zu deinen Vertragsbedingungen und auf deine Kosten.",
  keyStored: (hint) => `Gespeichert. Dein Schlüssel endet auf ${hint}.`,
  keyValidated: (moment) => `Zuletzt geprüft: ${moment}.`,
  keyMissing: "Noch kein Schlüssel gespeichert.",
  keyLabel: "Anthropic API-Schlüssel",
  keyPlaceholder: "sk-ant-...",
  keySave: "Schlüssel speichern",
  keyReplace: "Schlüssel ersetzen",
  keySaving: "Wird geprüft",
  keyDelete: "Schlüssel löschen",
  keyDeleting: "Wird gelöscht",
  keySavedNotice: "Schlüssel geprüft und gespeichert.",
  keyDeletedNotice: "Schlüssel gelöscht.",
  keyShapeError:
    "Das sieht nicht nach einem Anthropic-Schlüssel aus. Er beginnt mit sk-ant-.",
  keyUnknownError: "Der Schlüssel konnte nicht gespeichert werden.",
  keyStateUnavailable:
    "Dein Schlüssel lässt sich gerade nicht laden. Lade die Seite neu, bevor du ihn ersetzt.",

  modelLabel: "Modell",
  modelHint: "Freigegebene Modelle dieser Installation.",

  chatLabel: "Deine Nachricht",
  chatPlaceholder: "Frag etwas zu den Kursen, Werkstattblättern oder Büchern.",
  chatSend: "Senden",
  chatSending: "Antwort läuft",
  chatStop: "Abbrechen",
  chatClear: "Verlauf löschen",
  chatEmpty: "Noch keine Nachrichten.",
  chatNeedsKey: "Speichere zuerst deinen Anthropic-Schlüssel.",
  chatRoleUser: "Du",
  chatRoleAssistant: "KI",
  chatToolUsed: (tool) => `Werkzeug benutzt: ${tool}`,
  chatLessonChip: (lesson) => `Kontext: ${lesson}`,
  chatLessonRemove: "Kontext entfernen",
  chatTranscriptNote:
    "Der Verlauf liegt nur in diesem Browser, getrennt nach Konto, nie auf dem Server.",
  chatUnknownError: "Die Antwort konnte nicht geladen werden.",
  chatLogLabel: "Verlauf",

  tokensHeading: "Zugriffsschlüssel",
  tokensIntro:
    "Für Programme, die keine Freigabe im Browser durchlaufen können. Ein Schlüssel wird genau einmal angezeigt.",
  tokenNameLabel: "Name",
  tokenNamePlaceholder: "Claude Desktop auf dem Laptop",
  tokenCreate: "Schlüssel erzeugen",
  tokenCreating: "Wird erzeugt",
  tokenOnceTitle: "Dein neuer Zugriffsschlüssel",
  tokenOnceBody:
    "Kopiere ihn jetzt. Er wird nicht gespeichert und später nicht mehr angezeigt.",
  tokenCopy: "Kopieren",
  tokenCopied: "Kopiert",
  tokenDismiss: "Ausblenden",
  tokensEmpty: "Noch kein Zugriffsschlüssel erzeugt.",
  tokenCreated: (moment) => `Erzeugt: ${moment}`,
  tokenLastUsed: (moment) => `Zuletzt benutzt: ${moment}`,
  tokenNeverUsed: "Noch nicht benutzt",
  tokenRevokedAt: (moment) => `Zurückgezogen: ${moment}`,
  tokenRevoke: "Zurückziehen",
  tokenRevoking: "Wird zurückgezogen",
  tokenActiveCount: (active, limit) => `${active} von ${limit} aktiv`,
  tokenLimitReached:
    "Du hast die Höchstzahl aktiver Schlüssel erreicht. Ziehe einen zurück, bevor du einen neuen erzeugst.",
  tokenNameRequired: "Gib dem Schlüssel einen Namen.",
  tokenUnknownError: "Der Schlüssel konnte nicht erzeugt werden.",
  tokensUnavailable:
    "Deine Zugriffsschlüssel lassen sich gerade nicht laden. Lade die Seite neu.",

  grantsHeading: "Erteilte Freigaben",
  grantsIntro:
    "Programme, denen du im Browser Zugriff auf dein Konto erteilt hast.",
  grantsEmpty: "Noch kein Programm hat Zugriff auf dein Konto.",
  grantScopesLabel: "Bereiche",
  grantNoScopes: "keine Bereiche angegeben",
  grantGranted: (moment) => `Erteilt: ${moment}`,
  grantRevoke: "Freigabe zurückziehen",
  grantRevoking: "Wird zurückgezogen",
  grantRevokedNotice:
    "Freigabe zurückgezogen. Ein Zugriffstoken, das das Programm schon hat, gilt bis zu seinem Ablauf weiter, auch an der Agenten-Schnittstelle.",
  grantUnknownError: "Die Freigabe konnte nicht zurückgezogen werden.",
  grantsSetupTitle: "Freigaben sind noch nicht eingerichtet.",
  grantsSetupBody:
    "Verbinde dein Programm bis dahin mit einem Zugriffsschlüssel weiter unten.",
  grantsUnavailable:
    "Deine Freigaben lassen sich gerade nicht laden. Lade die Seite neu.",
  grantsListLabel: "Erteilte Freigaben",

  activityHeading: "Aktivität",
  activityIntro:
    "Die letzten 50 Zugriffe von Programmen. Protokolliert werden Programm, Werkzeug, Ergebnis und Dauer, nie Ein- oder Ausgaben.",
  activityEmpty: "Noch kein Programm hat auf dein Konto zugegriffen.",
  activityRetention: "Einträge werden nach 30 Tagen automatisch gelöscht.",
  activityUnavailable:
    "Die Aktivität lässt sich gerade nicht laden. Lade die Seite neu.",
  activityTableLabel: "Letzte Zugriffe von Programmen",
  activityColumnMoment: "Zeitpunkt",
  activityColumnClient: "Programm",
  activityColumnTool: "Werkzeug",
  activityColumnResult: "Ergebnis",
  activityColumnDuration: "Dauer",
  activityOk: "erfolgreich",
  activityFailed: "fehlgeschlagen",
  activityDuration: (milliseconds) => `${milliseconds} ms`,
};
