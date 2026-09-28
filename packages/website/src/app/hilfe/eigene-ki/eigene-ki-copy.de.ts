import type { AgentHelpCopy } from "./eigene-ki-copy";

/** Deutsche Fassung von /hilfe/eigene-ki. Du-Form, echte Umlaute. */
export const AGENT_HELP_COPY_DE: AgentHelpCopy = {
  metadata: {
    title: "Deine eigene KI anschließen | Freie Lernplattform",
    description:
      "Claude Desktop, Claude Code und Codex mit der Lernplattform verbinden, Zugriffsschlüssel anlegen und im Konto mit dem eigenen Anthropic-Schlüssel chatten.",
  },
  eyebrow: "Freie Lernplattform · Hilfe",
  title: "Deine eigene KI anschließen.",
  intro:
    "Über einen MCP-Server liest dein KI-Programm Kurse, Lektionen, Workshops, Buchkapitel und Open-Source-Werkzeuge im selben Wortlaut wie du im Browser.",
  indexLabel: "Auf dieser Seite",
  endpointLabel: "Adresse für dein Programm",
  statusReady: {
    title: "Der Zugang ist aktiv.",
    body: "Für die öffentlichen Inhalte brauchst du weder Konto noch Schlüssel.",
  },
  statusOff: {
    title: "Der Zugang ist in dieser Umgebung nicht aktiv.",
    body: "Bis der Betreiber ihn einschaltet, liefert die Adresse einen Fehler.",
  },
  sectionTitles: {
    overview: "Was das ist",
    desktop: "Claude Desktop",
    code: "Claude Code",
    codex: "Codex",
    tokens: "Zugriffsschlüssel",
    chat: "Chat im Konto",
    addresses: "Feste Adressen",
    limits: "Grenzen",
    privacy: "Was gespeichert wird",
  },
  overview: {
    intro:
      "MCP ist ein offenes Protokoll, über das dein KI-Programm eine Lektion selbst holt. Du musst nichts in den Chat kopieren.",
    facts: (toolCount) => [
      "Im Browser zeigt die Adresse eine kurze Erklärseite.",
      `${toolCount} öffentliche Werkzeuge: Kurse auflisten, Kurs oder Lektion holen, Workshops mit Materialien, Buchkapitel, Open-Source-Werkzeuge, Suche und Lernpfad als Graph.`,
      "Jedes Werkzeug nimmt die Sprache de oder en an. Ohne Angabe kommt der deutsche Text.",
    ],
    readOnlyTitle: "Nur lesend.",
    readOnlyBody:
      "Kein Werkzeug speichert Fortschritt, setzt Haken, meldet dich an oder stellt eine Teilnahmebestätigung aus.",
  },
  desktop: {
    title: "Claude Desktop",
    intro: "Claude Desktop nennt das einen eigenen Connector. Du brauchst kein Terminal.",
    steps: [
      "Öffne in den Einstellungen den Bereich Connectors.",
      "Wähle Eigenen Connector hinzufügen.",
      "Gib einen Namen ein, zum Beispiel loehrning, und die Adresse von oben.",
      "Speichere und starte einen neuen Chat. Die Werkzeuge stehen dann in der Werkzeugliste.",
    ],
    snippetLabel: "Oder direkt in die Konfigurationsdatei",
    snippet: (serverUrl) => `{
  "mcpServers": {
    "loehrning": {
      "type": "http",
      "url": "${serverUrl}"
    }
  }
}`,
    note: "Zum Prüfen frag: Welche Kurse gibt es auf loehrning.ai? Kommt eine Kursliste zurück, steht die Verbindung.",
  },
  code: {
    title: "Claude Code",
    intro: "Du trägst den Server einmal im Terminal ein, danach kennt ihn jede Sitzung.",
    steps: [
      "Führe den Befehl unten in einem Terminal aus.",
      "Prüfe mit claude mcp list, ob loehrning aufgeführt ist.",
      "Frag in Claude Code nach einer Lektion. Das Programm holt sie selbst.",
    ],
    snippetLabel: "Befehl",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl}`,
    note: "Der Server läuft über HTTP, deshalb braucht der Befehl --transport http statt eines lokalen Programmpfads.",
  },
  codex: {
    title: "Codex",
    intro: "Auch hier ein einmaliger Befehl im Terminal.",
    steps: [
      "Führe den Befehl unten aus.",
      "Prüfe mit codex mcp list, ob der Server eingetragen ist.",
      "Frag in einer Sitzung nach einem Workshop. Codex liest Ablauf und Materialliste.",
    ],
    snippetLabel: "Befehl",
    snippet: (serverUrl) => `codex mcp add loehrning --url ${serverUrl}`,
    note: "Ältere Versionen kennen nur lokale Server. Nimmt der Befehl die Adresse nicht an, aktualisiere Codex.",
  },
  tokens: {
    intro:
      "Öffentliche Inhalte brauchen keinen Schlüssel. Für deinen eigenen Lernstand legst du im Konto einen Zugriffsschlüssel an und hinterlegst ihn in deinem Programm.",
    steps: [
      "Melde dich an und öffne Konto, Deine KI.",
      "Lege einen Schlüssel an und benenne ihn nach dem Gerät, das ihn nutzt.",
      "Kopiere ihn sofort. Er wird nur einmal ganz angezeigt, danach nur als Kürzel.",
      "Hinterlege ihn im Programm als Kopfzeile Authorization mit dem Wort Bearer davor.",
    ],
    snippetLabel: "Claude Code mit Schlüssel",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl} \\
  --header "Authorization: Bearer lat_..."`,
    format:
      "Ein Schlüssel beginnt mit lat_. Gespeichert wird nur ein Prüfwert, deshalb kann auch der Betreiber ihn nicht erneut anzeigen. Verlierst du ihn, widerrufst du ihn und legst einen neuen an.",
    bearerActive:
      "Mit Schlüssel kommen zwei lesende Werkzeuge dazu: dein Lernstand und dein nächster Schritt. Ab der nächsten Anfrage weist der Server einen widerrufenen Schlüssel ab, auch für die öffentlichen Werkzeuge.",
    bearerPending: "",
    oauthPending:
      "Eine Freigabe über eine Anmeldeseite ist noch nicht eingerichtet. Bis dahin nutzt du den Zugriffsschlüssel.",
    accountLink: "Zu Konto, Deine KI",
  },
  chat: {
    intro:
      "Ohne eigenes Programm nutzt du den Chat im Konto. Er läuft auf deinem Anthropic-Schlüssel und liest dieselben Inhalte.",
    steps: [
      "Melde dich an und öffne Konto, Deine KI.",
      "Speichere deinen Anthropic-Schlüssel. Danach siehst du nur noch sein Ende.",
      "Wähle ein Modell und schreib los.",
    ],
    cost: "Deine Nachrichten gehen mit deinem Schlüssel an Anthropic, zu deinen Vertragsbedingungen und auf deine Kosten.",
    transcript:
      "Der Verlauf liegt nur in deinem Browser. Löschst du die Seitendaten, ist er weg.",
    limits: (messagesPerHour, toolCalls) =>
      `Pro Stunde ${messagesPerHour} Nachrichten, pro Nachricht bis zu ${toolCalls} Werkzeugaufrufe. Danach hält der Chat an.`,
    offTitle: "Der Chat ist in dieser Umgebung nicht eingerichtet.",
    offBody:
      "Bis der Betreiber ihn freischaltet, wird kein Schlüssel gespeichert und keine Anfrage gestellt.",
    accountLink: "Zum Chat im Konto",
  },
  addresses: {
    intro:
      "Lektionen, Workshops und Buchkapitel haben feste Adressen, die dein Programm speichern und später wieder aufrufen kann.",
    examples: [
      {
        uri: "lesson://ki-fuehrerschein/block_1_lesson_1",
        label: "Eine Lektion",
      },
      { uri: "workshop://ki-prognosen-einschaetzen", label: "Ein Workshop" },
      { uri: "book://ki-landschaft/01_eisberg", label: "Ein Buchkapitel" },
    ],
    localeNote: "Mit ?locale=en kommt der englische Text, sonst der deutsche.",
    islandNote:
      "Auf Lektions-, Kapitel- und Workshopseiten kopiert der Knopf „Mit deiner KI öffnen“ einen fertigen Auftrag mit der Serveradresse und den Adressen der Seite.",
  },
  limits: {
    intro: "Diese Grenzen gelten für alle gleich.",
    requests: (maxPerHour) =>
      `${maxPerHour} Anfragen pro Stunde und IP-Adresse. Danach lehnt der Server bis zum Ende der Stunde ab.`,
    output: (maxKilobytes) =>
      `Jede Antwort ist auf ${maxKilobytes} KB begrenzt. Längere Texte werden gekürzt und nennen die Adresse der Originalseite.`,
    search: (maxResults, maxQueryChars) =>
      `Die Suche liefert höchstens ${maxResults} Treffer, Suchbegriffe dürfen bis zu ${maxQueryChars} Zeichen lang sein.`,
    chat: (messagesPerHour, messageKibibytes) =>
      `Chat im Konto: ${messagesPerHour} Nachrichten pro Stunde, ${messageKibibytes} KiB pro Nachricht.`,
    tokens: (maxActive, nameChars) =>
      `${maxActive} aktive Zugriffsschlüssel pro Konto, Namen bis ${nameChars} Zeichen.`,
    unavailable:
      "Kann der Server Anfragen gerade nicht zählen, lehnt er sie ab.",
  },
  privacy: {
    intro:
      "Öffentliche Anfragen laufen ohne Konto und Kennung. Arbeitet ein Programm für dich, protokolliert dein Konto seine Aufrufe.",
    logged: [
      "Protokolliert werden Programm, Werkzeug, Erfolg und Dauer jedes Aufrufs.",
      "Die letzten 50 Einträge stehen in deinem Konto und werden nach 30 Tagen gelöscht.",
    ],
    notLogged: [
      "Nicht protokolliert werden Suchanfragen, Antworttexte, Chatnachrichten und Schlüssel.",
      "Auch in Fehlermeldungen steht weder ein Zugriffs- noch ein Anthropic-Schlüssel im Klartext.",
    ],
    revoke:
      "Jeden Schlüssel und jede Freigabe kannst du im Konto sofort widerrufen. Löschst du das Konto, verschwinden sie samt Protokoll.",
    accountLink: "Protokoll ansehen",
  },
  backToHelp: "Zurück zur Hilfe",
};
