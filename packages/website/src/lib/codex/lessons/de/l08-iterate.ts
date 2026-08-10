import canonical from "../l08-iterate";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L08 translation expected a prose block.");
  return block.markdown;
}

function pullQuote(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "pull-quote")
    throw new Error("Codex L08 translation expected a pull quote.");
  return block.text;
}

function card(
  sectionIndex: number,
  blockIndex: number,
  cardIndex: number,
  field: "eyebrow" | "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "card-grid")
    throw new Error("Codex L08 translation expected a card grid.");
  const value = block.cards[cardIndex]?.[field];
  if (!value) throw new Error("Codex L08 translation expected a card value.");
  return value;
}

function callout(
  sectionIndex: number,
  blockIndex: number,
  field: "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "callout")
    throw new Error("Codex L08 translation expected a callout.");
  const value = block[field];
  if (!value)
    throw new Error("Codex L08 translation expected a callout value.");
  return value;
}

function widgetProps(index: number): Readonly<Record<string, unknown>> {
  const widget = canonical.widgets?.[index];
  if (!widget) throw new Error("Codex L08 translation expected a widget.");
  return widget.props as Readonly<Record<string, unknown>>;
}

function widgetString(index: number, key: string): string {
  const value = widgetProps(index)[key];
  if (typeof value !== "string")
    throw new Error(`Codex L08 translation expected ${key}.`);
  return value;
}

function widgetStrings(index: number, key: string): readonly string[] {
  const value = widgetProps(index)[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Codex L08 translation expected ${key}.`);
  }
  return value;
}

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [canonical.title, "Iterationsschleifen"],
    [
      canonical.subtitle,
      "Wähle zwischen gezielter Korrektur, überarbeiteter Spezifikation und sauberem Neustart anhand von Fehler- und Diff-Struktur.",
    ],
    [canonical.hook, "Auf die Ursache der Abweichung reagieren."],
    [canonical.keyConcepts[0], "Gezielte Korrektur"],
    [canonical.keyConcepts[1], "Neue Spezifikation"],
    [canonical.keyConcepts[2], "Kontextneustart"],
    [canonical.keyConcepts[3], "Entscheidungsbaum"],
    [
      prose(0, 0),
      "Wenn ein Diff nicht annehmbar ist, klassifiziere die Abweichung vor der Fortsetzung. Ein lokaler Fehler, eine fehlende Anforderung, eine ungültige Aufgabengrenze und widersprüchlicher Sitzungskontext verlangen unterschiedliche Reaktionen.\n\nNutze den Entscheidungsbaum als Diagnosehilfe, nicht als feste Anzahl von Wiederholungen:",
    ],
    [card(0, 1, 0, "eyebrow"), "begrenzter lokaler Fehler"],
    [card(0, 1, 0, "title"), "Gezielt korrigieren"],
    [
      card(0, 1, 0, "body"),
      "Nutze einen gezielten Kommentar, wenn Ziel und Architektur stimmen und die nötige Änderung lokal ist. Benenne Fehler, Ort und erforderlichen Nachweis.",
    ],
    [card(0, 1, 1, "eyebrow"), "Lücke in Anforderung oder Rahmen"],
    [card(0, 1, 1, "title"), "Neu spezifizieren"],
    [
      card(0, 1, 1, "body"),
      "Formuliere den Auftrag neu, wenn mehrere Kommentare fehlende Ziele, Grenzen oder Akzeptanzkriterien nachtragen. Bewahre belegte Erkenntnisse und starte mit dem korrigierten Vertrag.",
    ],
    [card(0, 1, 2, "eyebrow"), "falsches Problem oder falsche Architektur"],
    [card(0, 1, 2, "title"), "Mit Nachweisen neu starten"],
    [
      card(0, 1, 2, "body"),
      "Rette keinen Diff, der auf einer falschen Annahme beruht. Prüfe relevanten Code und Anforderung erneut und erstelle einen neuen Auftrag mit korrigierten Nachweisen und Grenzen.",
    ],
    [card(0, 1, 3, "eyebrow"), "mehrere gekoppelte Anliegen"],
    [card(0, 1, 3, "title"), "Zerlegen und neu starten"],
    [
      card(0, 1, 3, "body"),
      "Trenne unabhängig implementier- oder prüfbare Anliegen. Definiere Abhängigkeitsreihenfolge und gültige Zwischenzustände vor den neuen Aufträgen.",
    ],
    [
      pullQuote(0, 2),
      "Starte neu, wenn Korrekturen die Prämisse ändern oder der Diff auseinanderläuft statt sich dem Ziel anzunähern.",
    ],
    [canonical.sections[1].title, "Eine wirksame Korrektur"],
    [
      prose(1, 0),
      "Eine gezielte Korrektur passt nur, wenn der bestehende Auftrag gültig bleibt. Vergleiche einen unbestimmten Kommentar mit einer Fassung, die Fehler, Ort und erwarteten Nachweis benennt.",
    ],
    [
      prose(1, 1),
      "Eine brauchbare Korrektur nennt **was falsch ist**, **wo es liegt** und **welches Ergebnis oder welche Prüfung verlangt wird**. Schreibt diese Erklärung Ziel oder Architektur neu, ersetze den Auftrag statt weitere Kommentare anzuhängen.",
    ],
    [
      prose(2, 0),
      "Eine Frage dazu, wann eine neue Spezifikation sinnvoll ist.",
    ],
    [canonical.sections[3].title, "Wann ein Neustart erforderlich ist"],
    [
      prose(3, 0),
      "Starte neu, wenn der aktuelle Diff an einer falschen Anforderung, ungültigen Architektur oder zu breiten Grenze hängt. Weitere Änderungen können Annahmen erhalten, die jede Korrektur umgehen muss.\n\nDokumentiere vor dem Verwerfen Nachweise, die nicht direkt aus dem Repository hervorgehen: verworfene Ansätze mit Begründung, neu erkannte Grenzen, relevante Befehlsausgabe sowie bereits verfolgte Dateien und Aufrufpfade. Nutze diese Nachweise in einer neuen begrenzten Spezifikation.\n\nVerwende keine feste Anzahl von Überarbeitungen. Mehrere kleine unabhängige Korrekturen können sinnvoll sein; eine einzelne Änderung der Prämisse kann sofortigen Neustart verlangen.",
    ],
    [callout(3, 1, "title"), "Nur belegte Erkenntnisse übernehmen:"],
    [
      callout(3, 1, "body"),
      "Ein erfolgloser Versuch kann Unklarheit oder verborgene Kopplung zeigen, aber auch falsche Annahmen enthalten. Übernimm nur Erkenntnisse, die durch Repository-Nachweise oder reproduzierbare Befehle gestützt sind.",
    ],
    [canonical.sections[4].title, "Kontext in langen Sitzungen"],
    [
      prose(4, 0),
      "Lange interaktive Sitzungen sammeln Anforderungen, Korrekturen, Protokolle und verworfene Ansätze. Relevante Anweisungen lassen sich schwerer konsistent anwenden, besonders wenn spätere Nachrichten früheren widersprechen oder der aktive Kontext verdichtet wurde.\n\nBeobachtbare Anzeichen sind ein erneut vorgeschlagener verworfener Ansatz, eine zurückgenommene akzeptierte Korrektur oder eine allgemeine Regel, die eine spätere Ausnahme überschreibt. Dieselben Anzeichen können auch auf einen mehrdeutigen Auftrag oder geänderten Code hindeuten. Prüfe deshalb die Nachweise, bevor du die Ursache der Kontextlänge zuschreibst.\n\nWenn der aktive Verlauf keinen eindeutigen Vertrag mehr bildet, beginne eine neue Sitzung mit einer knappen Spezifikation und nur den belegten Erkenntnissen, die für die Fortsetzung nötig sind.",
    ],
    [card(4, 1, 0, "eyebrow"), "Signal 01"],
    [card(4, 1, 0, "title"), "Korrigiertes Verhalten wird zurückgenommen"],
    [
      card(4, 1, 0, "body"),
      "Eine zuvor akzeptierte Korrektur wird ohne Begründung aus dem Code entfernt. Prüfe die aktuelle Anforderung und formuliere sie in einem neuen Auftrag, wenn die Sitzung widersprüchlich geworden ist.",
    ],
    [card(4, 1, 1, "eyebrow"), "Signal 02"],
    [card(4, 1, 1, "title"), "Verworfene Ansätze werden erneut vorgeschlagen"],
    [
      card(4, 1, 1, "body"),
      "Ein verworfener Ansatz erscheint erneut, ohne die dokumentierte Begründung zu behandeln. Übernimm Grenze und Nachweis ausdrücklich in eine neue Spezifikation.",
    ],
    [card(4, 1, 2, "eyebrow"), "Signal 03"],
    [card(4, 1, 2, "title"), "Generische Ergebnisse trotz konkreter Eingaben"],
    [
      card(4, 1, 2, "body"),
      "Das Ergebnis nennt die für den Auftrag erforderlichen Repository-Pfade, Konventionen oder Befehle nicht mehr. Stelle diese Eingaben erneut her, bevor weitere Änderungen erfolgen.",
    ],
    [card(4, 1, 3, "eyebrow"), "Signal 04"],
    [card(4, 1, 3, "title"), "Korrekturen werden umfangreicher"],
    [
      card(4, 1, 3, "body"),
      "Korrekturen erweitern oder widersprechen einander, statt die Abweichung zu verkleinern. Prüfe, ob Auftrag, Diff oder Sitzungskontext neu aufgesetzt werden müssen.",
    ],
    [
      pullQuote(4, 2),
      "Setze den Kontext neu auf, wenn das aktive Gespräch keinen widerspruchsfreien Auftragsvertrag mehr ausdrückt.",
    ],
    [canonical.sections[5].title, "Kontextverdichtung: Relevantes übernehmen"],
    [
      prose(5, 0),
      "Eine neue Sitzung soll nicht den gesamten Verlauf übernehmen. Übernimm belegte Fakten, die aus Repository oder ursprünglicher Spezifikation nicht hervorgehen: entdeckte Grenzen, verworfene Ansätze mit Begründung, relevante Befehlsergebnisse und offene Fragen.",
    ],
    [
      prose(5, 1),
      "Trenne Nachweise von Erzählung. Nenne Dateipfade, exakte Fehlermeldungen, Befehle mit Ergebnissen und die Begründung für verworfene Ansätze. Lasse Vermutungen, wiederholte Diskussion und Fakten weg, die die nächste Sitzung direkt aus versionierten Dateien lesen kann.",
    ],
    [prose(6, 0), "Eine Frage zum Erkennen von Kontextverschleiß."],
    [widgetString(0, "title"), "Zwei Review-Kommentare zum selben Problem"],
    [widgetString(0, "badLabel"), "Unklare Korrektur"],
    [widgetString(0, "goodLabel"), "Konkrete Korrektur"],
    [
      widgetString(0, "bad"),
      '"Der Test ist nicht besonders gut. Kannst du ihn verbessern?"',
    ],
    [
      widgetString(0, "good"),
      '"tests/api/test_login.py::test_rate_limit_blocks_at_6 mockt derzeit is_allowed(). Damit prüft der Test den Mock statt des Rate Limiters.\n\nSchreibe ihn so um, dass /login sechsmal gegen den echten Rate Limiter aufgerufen und beim sechsten Aufruf Status 429 erwartet wird.\n\nBehalte den vorhandenen Teststil bei: pytest, keine unittest.mock-Wrapper."',
    ],
    [
      widgetString(0, "note"),
      "Der konkrete Kommentar nennt Fehler, Ort, erforderlichen Aufbau und Assertion. Die prüfende Person kann den überarbeiteten Test direkt mit diesem Auftrag vergleichen.",
    ],
    [
      widgetString(1, "question"),
      "Ein überarbeiteter Diff verändert dieselbe Anforderung wiederholt auf unterschiedliche Weise und wächst über den ursprünglichen Umfang hinaus. Was ist der passende nächste Schritt?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Weitere Kommentare ergänzen, ohne den Auftragsvertrag zu ändern.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Die Iteration stoppen, belegte Erkenntnisse sichern und mit korrigierter Spezifikation und Grenze neu starten.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Den Diff mergen, weil einige Tests bestehen.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Die fehlschlagenden Prüfungen entfernen und eine weitere Überarbeitung verlangen.",
    ],
    [
      widgetString(1, "explanation"),
      "Wiederholte, nicht konvergierende Änderungen zeigen, dass Prämisse, Grenze oder Kontext instabil sind. Eine neue Spezifikation gibt dem nächsten Versuch einen prüfbaren Vertrag. Die Entscheidung beruht auf der Abweichung, nicht auf einer festen Anzahl von Wiederholungen.",
    ],
    [widgetString(2, "title"), "Kontextverdichtung: übernehmen oder weglassen"],
    [widgetString(2, "badLabel"), "Unnötigen Verlauf übernehmen"],
    [widgetString(2, "goodLabel"), "Relevante Erkenntnisse übernehmen"],
    [
      widgetString(2, "bad"),
      "KONTEXT AUS DER LETZTEN SITZUNG:\n- Wir haben am Rate Limiter gearbeitet\n- Es gab ein Gespräch über Caching\n- Ich fragte nach Redis und In-Memory\n- Du hast etwas über TTLs gesagt\n- Wir haben länger über die Teststruktur gesprochen\n- Der zweite Ansatz wirkte besser\n- Es gab etwas zum Format des Limiter-Schlüssels",
    ],
    [
      widgetString(2, "good"),
      "KONTEXT AUS DER LETZTEN SITZUNG (3 Punkte):\n1. Entdeckte Nebenbedingung: Der Limiter-Schlüssel muss (ip, user_id) statt nur ip enthalten. Sonst würden gemeinsam genutzte IP-Adressen in Büros oder Proxys unbeteiligte Nutzende blockieren.\n2. Verworfener Ansatz: lru_cache gilt nur pro Prozess. Bei mehreren Workern werden Zähler nicht zusammengeführt. Redis verwenden.\n3. Verdeckte Kopplung: rate_limit_middleware läuft vor der Authentifizierung. user_id ist dort nicht verfügbar, daher muss die Limiter-Logik in der View-Schicht liegen.",
    ],
    [
      widgetString(2, "note"),
      "Prüffrage: Kann eine neue Sitzung die falschen Wege auch ohne diesen Punkt vermeiden? Falls ja, weglassen. Falls nein, übernehmen. Die allgemeine Caching- und TTL-Dokumentation ist auffindbar; die drei konkreten Erkenntnisse sind es nicht.",
    ],
    [
      widgetString(3, "question"),
      "Eine Sitzung schlägt einen zuvor verworfenen Ansatz erneut vor, ohne die dokumentierte Begründung zu behandeln. Wie reagierst du?",
    ],
    [
      widgetStrings(3, "options")[0],
      "Das Modell widerspricht dir. Begründe deine Position nachdrücklicher.",
    ],
    [
      widgetStrings(3, "options")[1],
      'Prüfe, ob die Ablehnung weiterhin gilt. Starte dann einen neuen Auftrag mit dem ausdrücklichen Hinweis: "Verwende [Ansatz] wegen [Nachweis] nicht."',
    ],
    [
      widgetStrings(3, "options")[2],
      "Wiederhole die Ablehnung ohne ihre Begründung.",
    ],
    [
      widgetStrings(3, "options")[3],
      "Akzeptiere den Vorschlag; das Modell könnte einen besseren Grund gefunden haben.",
    ],
    [
      widgetString(3, "explanation"),
      "Der wiederholte Vorschlag kann auf widersprüchlichen Kontext oder eine geänderte Codebasis hindeuten. Prüfe die Nachweise erneut und übernimm die weiterhin gültige Grenze mit Begründung in einen neuen, widerspruchsfreien Auftrag.",
    ],
  ],
});
