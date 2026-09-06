import type { AgentAccountCopy } from "./ki-copy";

/** German copy for /konto/ki. Du form, real umlauts, no em or en dashes. */
export const AGENT_ACCOUNT_COPY_DE: AgentAccountCopy = {
  metadata: {
    title: "Konto · Deine KI | Freie Lernplattform",
    description:
      "Zugriff eigener KI-Programme auf dein Lernkonto verwalten: Zugriffsschlüssel, erteilte Freigaben, Aktivität und der Chat mit deinem eigenen Anthropic-Schlüssel.",
  },
  eyebrow: "Freie Lernplattform · Konto",
  title: "Deine KI.",
  intro:
    "Hier verbindest du dein eigenes KI-Programm mit der Lernplattform, siehst was es getan hat und chattest mit deinem eigenen Anthropic-Schlüssel über die Kursinhalte.",
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
    "Du wurdest nicht abgemeldet. Die Seite zeigt deshalb bewusst keine leeren Listen für Aktivität, Freigaben und Zugriffsschlüssel. Lade sie in einigen Minuten neu.",

  endpointHeading: "Verbindung",
  endpointBody:
    "Trage diese Adresse in deinem Programm als HTTP-Verbindung ein. Öffentliche Inhalte gehen ohne Anmeldung, dein Lernstand erst nach einer Freigabe oder mit einem Zugriffsschlüssel.",
  endpointLabel: "Adresse",
  endpointHelpLink: "Anleitung für dein Programm",
  endpointOffTitle: "Der Zugang für Programme ist gerade nicht eingerichtet.",
  endpointOffBody:
    "Sobald er in dieser Umgebung aktiv ist, erscheint hier die Adresse für dein Programm. Zugriffsschlüssel und Freigaben bleiben so lange ohne Wirkung.",

  chatHeading: "Chat mit deiner KI",
  chatIntro:
    "Der Chat läuft auf deinem eigenen Anthropic-Schlüssel und liest dieselben Kursinhalte wie dein Programm.",
  chatOffTitle: "Der Chat ist in dieser Umgebung nicht eingerichtet.",
  chatOffBody:
    "Es wird kein Schlüssel gespeichert und keine Anfrage gestellt, solange der Betreiber den Chat nicht freischaltet.",

  keyHeading: "Dein Anthropic-Schlüssel",
  keyDisclosure:
    "Deine Nachrichten gehen mit deinem Schlüssel an Anthropic und damit unter deinen eigenen Vertragsbedingungen und auf deine Kosten.",
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
    "Der gespeicherte Schlüssel ist gerade nicht abrufbar. Lade die Seite später neu, bevor du ihn ersetzt.",

  modelLabel: "Modell",
  modelHint: "Freigegebene Modelle dieser Installation.",

  chatLabel: "Deine Nachricht",
  chatPlaceholder: "Frag etwas zu den Kursen, Werkstattblättern oder Büchern.",
  chatSend: "Senden",
  chatSending: "Antwort läuft",
  chatStop: "Abbrechen",
  chatClear: "Verlauf löschen",
  chatEmpty:
    "Noch keine Nachrichten. Der Verlauf bleibt nur in diesem Browser und wird nicht auf dem Server gespeichert.",
  chatNeedsKey: "Speichere zuerst deinen Anthropic-Schlüssel.",
  chatRoleUser: "Du",
  chatRoleAssistant: "KI",
  chatToolUsed: (tool) => `Werkzeug benutzt: ${tool}`,
  chatLessonChip: (lesson) => `Kontext: ${lesson}`,
  chatLessonRemove: "Kontext entfernen",
  chatTranscriptNote:
    "Der Verlauf liegt nur in diesem Browser, im Namensraum deines Kontos.",
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
    "Kopiere ihn jetzt. Er wird nicht gespeichert und kann später nicht erneut angezeigt werden.",
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
    "Deine Zugriffsschlüssel sind gerade nicht abrufbar. Die Liste bleibt deshalb leer statt falsch.",

  grantsHeading: "Erteilte Freigaben",
  grantsIntro:
    "Programme, denen du im Browser Zugriff auf dein Konto erteilt hast.",
  grantsEmpty: "Noch kein Programm hat Zugriff auf dein Konto.",
  grantScopesLabel: "Bereiche",
  grantNoScopes: "keine Bereiche angegeben",
  grantGranted: (moment) => `Erteilt: ${moment}`,
  grantRevoke: "Freigabe zurückziehen",
  grantRevoking: "Wird zurückgezogen",
  grantRevokedNotice: "Freigabe zurückgezogen.",
  grantUnknownError: "Die Freigabe konnte nicht zurückgezogen werden.",
  grantsSetupTitle: "Freigaben sind noch nicht eingerichtet.",
  grantsSetupBody:
    "Solange der Anmeldedienst keine Freigaben ausstellt, verbindest du dein Programm über einen Zugriffsschlüssel weiter unten.",
  grantsUnavailable:
    "Deine Freigaben sind gerade nicht abrufbar. Die Liste bleibt deshalb leer statt falsch.",
  grantsListLabel: "Erteilte Freigaben",

  activityHeading: "Aktivität",
  activityIntro:
    "Die letzten 50 Zugriffe von Programmen auf dein Konto. Aufgezeichnet werden Programm, Werkzeug, Ergebnis und Dauer, nie Eingaben oder Ergebnisse.",
  activityEmpty: "Noch kein Programm hat auf dein Konto zugegriffen.",
  activityRetention: "Einträge werden nach 30 Tagen automatisch gelöscht.",
  activityUnavailable:
    "Die Aktivität ist gerade nicht abrufbar. Die Liste bleibt deshalb leer statt falsch.",
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
