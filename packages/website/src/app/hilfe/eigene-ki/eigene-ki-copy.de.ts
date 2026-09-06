import type { AgentHelpCopy } from "./eigene-ki-copy";

/** Deutsche Fassung von /hilfe/eigene-ki. Du-Form, echte Umlaute. */
export const AGENT_HELP_COPY_DE: AgentHelpCopy = {
  metadata: {
    title: "Deine eigene KI anschließen | Freie Lernplattform",
    description:
      "Anleitung: Claude Desktop, Claude Code und Codex mit der Lernplattform verbinden, Zugriffsschlüssel anlegen und im Konto mit dem eigenen Anthropic-Schlüssel chatten.",
  },
  eyebrow: "Freie Lernplattform · Hilfe",
  title: "Deine eigene KI anschließen.",
  intro:
    "Die Plattform hat eine zweite Tür: einen MCP-Server. Dein eigenes KI-Programm liest darüber die Kurse, Lektionen, Workshops, Buchkapitel und Open-Source-Werkzeuge, im gleichen Wortlaut wie du im Browser. Diese Seite zeigt Schritt für Schritt, wie du es einrichtest.",
  indexLabel: "Auf dieser Seite",
  endpointLabel: "Adresse für dein Programm",
  statusReady: {
    title: "Der Zugang ist aktiv.",
    body: "Die Adresse antwortet. Für die öffentlichen Inhalte brauchst du kein Konto und keinen Schlüssel.",
  },
  statusOff: {
    title: "Der Zugang ist in dieser Umgebung nicht aktiv.",
    body: "Die Adresse unten antwortet gerade mit einem Fehler statt mit Inhalten. Die Anleitung stimmt trotzdem und gilt, sobald der Betreiber den Zugang einschaltet.",
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
      "MCP ist ein offenes Protokoll, mit dem ein KI-Programm fremde Inhalte lesen kann. Statt dir eine Lektion in den Chat zu kopieren, holt dein Programm sie selbst und arbeitet mit dem echten Text.",
    facts: (toolCount) => [
      "Die Adresse spricht kein HTML. Trägst du sie in den Browser ein, bekommst du eine kurze Erklärseite statt einer Fehlermeldung.",
      `Öffentlich stehen ${toolCount} Werkzeuge bereit: Kurse auflisten, einen Kurs oder eine Lektion holen, Workshops mit ihren Materialien, Buchkapitel, die Open-Source-Werkzeuge, eine Suche über die Inhalte und der Lernpfad als Graph.`,
      "Jedes Werkzeug nimmt eine Sprache an: de oder en. Ohne Angabe bekommt dein Programm den deutschen Text.",
    ],
    readOnlyTitle: "Nur lesend.",
    readOnlyBody:
      "Kein Werkzeug schreibt deinen Fortschritt, setzt einen Haken, meldet dich zu etwas an oder stellt eine Teilnahmebestätigung aus. Was du gelernt hast, entscheidest weiterhin du im Browser.",
  },
  desktop: {
    title: "Claude Desktop",
    intro:
      "In Claude Desktop heißt eine solche Verbindung eigener Connector. Du brauchst dafür kein Terminal.",
    steps: [
      "Öffne die Einstellungen und dort den Bereich Connectors.",
      "Wähle Eigenen Connector hinzufügen.",
      "Gib der Verbindung einen Namen, zum Beispiel loehrning, und trage die Adresse von oben ein.",
      "Speichere und starte einen neuen Chat. Die Werkzeuge der Plattform stehen dann in der Werkzeugliste.",
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
    note: "Frag danach zum Prüfen: Welche Kurse gibt es auf loehrning.ai? Kommt eine Liste mit den Kursen zurück, steht die Verbindung.",
  },
  code: {
    title: "Claude Code",
    intro: "Im Terminal, einmalig. Danach kennt jede Sitzung den Server.",
    steps: [
      "Führe den Befehl unten in einem Terminal aus.",
      "Prüfe mit claude mcp list, ob loehrning aufgeführt ist.",
      "Starte Claude Code und frag nach einer Lektion. Das Programm holt sie selbst.",
    ],
    snippetLabel: "Befehl",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl}`,
    note: "Der Server läuft über HTTP, nicht als lokaler Prozess. Deshalb braucht der Befehl --transport http und keinen Pfad zu einem Programm auf deinem Rechner.",
  },
  codex: {
    title: "Codex",
    intro: "Auch hier ein einmaliger Befehl im Terminal.",
    steps: [
      "Führe den Befehl unten aus.",
      "Prüfe mit codex mcp list, ob der Server steht.",
      "Frag in einer Sitzung nach einem Workshop. Codex liest den Ablauf und die Materialliste.",
    ],
    snippetLabel: "Befehl",
    snippet: (serverUrl) => `codex mcp add loehrning --url ${serverUrl}`,
    note: "Ältere Versionen kennen nur lokale Server. Wenn der Befehl die Adresse nicht annimmt, aktualisiere Codex zuerst.",
  },
  tokens: {
    intro:
      "Die öffentlichen Inhalte gehen ohne alles. Für deinen eigenen Lernstand muss dein Programm belegen, für wen es arbeitet. Dafür gibt es Zugriffsschlüssel: eine Zeichenfolge, die du in deinem Konto anlegst und in deinem Programm hinterlegst.",
    steps: [
      "Melde dich an und öffne Konto, Deine KI.",
      "Lege einen Zugriffsschlüssel an und gib ihm einen Namen, der dir sagt, welches Gerät ihn benutzt.",
      "Kopiere den Schlüssel sofort. Er wird genau einmal angezeigt und danach nur noch als Kürzel.",
      "Hinterlege ihn in deinem Programm als Kopfzeile Authorization mit dem Wort Bearer davor.",
    ],
    snippetLabel: "Claude Code mit Schlüssel",
    snippet: (serverUrl) =>
      `claude mcp add --transport http loehrning ${serverUrl} \\
  --header "Authorization: Bearer lat_..."`,
    format:
      "Ein Schlüssel beginnt immer mit lat_ und ist danach zufällig. Gespeichert wird nur ein Prüfwert, nicht der Schlüssel selbst: Auch der Betreiber kann ihn dir nicht noch einmal zeigen. Verlierst du ihn, widerrufst du ihn und legst einen neuen an.",
    limit: (maxActive) =>
      `Du kannst bis zu ${maxActive} Schlüssel gleichzeitig aktiv haben und jeden einzeln widerrufen. Ein widerrufener Schlüssel gilt ab der nächsten Anfrage nicht mehr.`,
    bearerActive:
      "Schickst du deinen Schlüssel mit, kommen zwei Werkzeuge dazu: dein Lernstand und dein nächster Schritt. Beide lesen nur, geschrieben wird nichts. Ohne Schlüssel bleibt dein Konto unerreichbar, und ein widerrufener Schlüssel wird abgewiesen statt still auf die öffentlichen Werkzeuge zurückzufallen.",
    bearerPending: "",
    oauthPending:
      "Die zweite Möglichkeit, eine Freigabe für ein Programm über eine Anmeldeseite, ist noch nicht eingerichtet. Bis dahin ist der Zugriffsschlüssel der dokumentierte Weg.",
    accountLink: "Zu Konto, Deine KI",
  },
  chat: {
    intro:
      "Wenn du kein eigenes Programm einrichten willst, gibt es den Chat im Konto. Er läuft auf deinem eigenen Anthropic-Schlüssel und liest dieselben Inhalte wie ein Programm von außen.",
    steps: [
      "Melde dich an und öffne Konto, Deine KI.",
      "Speichere dort deinen Anthropic-Schlüssel. Sichtbar bleibt danach nur seine letzte Stelle.",
      "Wähle ein Modell aus der freigegebenen Liste und schreibe los.",
    ],
    cost: "Deine Nachrichten gehen mit deinem Schlüssel an Anthropic, also unter deinen eigenen Vertragsbedingungen und auf deine Kosten. Der Betreiber verwendet dafür keinen eigenen Schlüssel.",
    transcript:
      "Der Gesprächsverlauf bleibt in deinem Browser und wird nicht auf dem Server gespeichert. Löschst du die Daten der Seite, ist er weg.",
    limits: (messagesPerHour, toolCalls) =>
      `Pro Stunde sind ${messagesPerHour} Nachrichten möglich, pro Nachricht bis zu ${toolCalls} Werkzeugaufrufe. Danach wartet der Chat, statt weiter zu fragen.`,
    offTitle: "Der Chat ist in dieser Umgebung nicht eingerichtet.",
    offBody:
      "Es wird kein Schlüssel gespeichert und keine Anfrage gestellt, solange der Betreiber ihn nicht freischaltet.",
    accountLink: "Zum Chat im Konto",
  },
  addresses: {
    intro:
      "Lektionen, Workshops und Buchkapitel haben feste Adressen. Dein Programm kann sie speichern und Wochen später wieder aufrufen, ohne die Plattform noch einmal zu durchsuchen.",
    examples: [
      {
        uri: "lesson://ki-fuehrerschein/block_1_lesson_1",
        label: "Eine Lektion",
      },
      { uri: "workshop://ki-prognosen-einschaetzen", label: "Ein Workshop" },
      { uri: "book://ki-landschaft/01_eisberg", label: "Ein Buchkapitel" },
    ],
    localeNote:
      "Hängst du ?locale=en an, kommt der englische Text. Ohne Angabe bekommst du den deutschen.",
    islandNote:
      "Auf Lektions-, Kapitel- und Workshopseiten steht dafür ein Knopf: Mit deiner KI öffnen. Er kopiert einen fertigen Auftrag mit der Serveradresse und den Adressen der Seite, auf der du gerade bist.",
  },
  limits: {
    intro:
      "Der Zugang ist offen, aber nicht unbegrenzt. Die Grenzen stehen fest und gelten für alle gleich.",
    requests: (maxPerHour) =>
      `${maxPerHour} Anfragen pro Stunde und Adresse. Danach antwortet der Server mit einer Absage, bis die Stunde vorbei ist.`,
    output: (maxKilobytes) =>
      `Jede Antwort ist auf ${maxKilobytes} KB begrenzt. Ein längerer Text wird gekürzt und trägt die Adresse der Originalseite, damit dein Programm den Rest dort liest.`,
    search: (maxResults, maxQueryChars) =>
      `Die Suche gibt höchstens ${maxResults} Treffer zurück, die Suchanfrage darf bis zu ${maxQueryChars} Zeichen lang sein.`,
    chat: (messagesPerHour, messageKibibytes) =>
      `Der Chat im Konto: ${messagesPerHour} Nachrichten pro Stunde, ${messageKibibytes} KiB pro Nachricht.`,
    tokens: (maxActive, nameChars) =>
      `${maxActive} aktive Zugriffsschlüssel pro Konto, der Name bis zu ${nameChars} Zeichen.`,
    unavailable:
      "Kann der Server seine Zähler nicht erreichen, lehnt er die Anfrage ab, statt sie ungezählt durchzulassen.",
  },
  privacy: {
    intro:
      "Öffentliche Anfragen laufen ohne Konto und ohne Kennung. Sobald ein Programm für dich arbeitet, führt dein Konto darüber ein Protokoll, damit du siehst, was passiert ist.",
    logged: [
      "Welches Programm es war, welches Werkzeug es benutzt hat, ob der Aufruf geklappt hat und wie lange er gedauert hat.",
      "Die letzten 50 Einträge stehen in deinem Konto. Nach 30 Tagen werden sie automatisch gelöscht.",
    ],
    notLogged: [
      "Keine Suchanfrage, kein Text aus einer Antwort, keine Nachricht aus dem Chat und kein Schlüssel.",
      "Kein Zugriffsschlüssel und kein Anthropic-Schlüssel steht im Klartext in einem Protokoll oder in einer Fehlermeldung.",
    ],
    revoke:
      "Du kannst jeden Zugriffsschlüssel und jede Freigabe in deinem Konto sofort widerrufen. Löschst du dein Konto, verschwinden Schlüssel, Freigaben und Protokoll mit.",
    accountLink: "Protokoll im Konto ansehen",
  },
  backToHelp: "Zurück zur Hilfe",
};
