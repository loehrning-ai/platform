import canonical from "../l08-iterate";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L08 translation expected a prose block.");
  return block.markdown;
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
      "Korrigieren, neu spezifizieren oder neu starten, je nach Abweichung.",
    ],
    [canonical.hook, "Erst die Ursache einordnen, dann antworten."],
    [canonical.keyConcepts[0], "Gezielte Korrektur"],
    [canonical.keyConcepts[1], "Neue Spezifikation"],
    [canonical.keyConcepts[2], "Kontextneustart"],
    [canonical.keyConcepts[3], "Entscheidungsbaum"],
    [
      prose(0, 0),
      "Bevor du auf einen falschen Diff antwortest, ordne die Abweichung ein.",
    ],
    [card(0, 1, 0, "eyebrow"), "begrenzter lokaler Fehler"],
    [card(0, 1, 0, "title"), "Gezielt korrigieren"],
    [
      card(0, 1, 0, "body"),
      "Ziel und Architektur stimmen, die Korrektur ist lokal. Nenne Fehler, Ort und verlangten Nachweis.",
    ],
    [card(0, 1, 1, "eyebrow"), "Lücke in Anforderung oder Rahmen"],
    [card(0, 1, 1, "title"), "Neu spezifizieren"],
    [
      card(0, 1, 1, "body"),
      "Kommentare tragen Ziele, Grenzen oder Kriterien nach. Schreib den Auftrag neu und behalte Belegtes.",
    ],
    [card(0, 1, 2, "eyebrow"), "falsches Problem oder falsche Architektur"],
    [card(0, 1, 2, "title"), "Mit Nachweisen neu starten"],
    [
      card(0, 1, 2, "body"),
      "Die Prämisse ist falsch. Lies Code und Anforderung neu und starte einen neuen Auftrag mit korrigierten Nachweisen.",
    ],
    [card(0, 1, 3, "eyebrow"), "mehrere gekoppelte Anliegen"],
    [card(0, 1, 3, "title"), "Zerlegen und neu starten"],
    [
      card(0, 1, 3, "body"),
      "Trenne, was sich getrennt umsetzen lässt. Leg Reihenfolge und gültige Zwischenzustände fest, bevor die neuen Aufträge laufen.",
    ],
    [canonical.sections[1].title, "Eine wirksame Korrektur"],
    [
      prose(1, 0),
      "Eine gezielte Korrektur passt, solange der Auftrag selbst gültig ist. Wie der konkrete Kommentar oben nennt sie **was falsch ist**, **wo** und **welches Ergebnis oder welche Prüfung verlangt wird**. Müsste sie Ziel oder Architektur umschreiben, ersetze den Auftrag.",
    ],
    [prose(2, 0), "Eine Frage dazu, wann neu spezifiziert wird."],
    [canonical.sections[3].title, "Wann du neu startest"],
    [
      prose(3, 0),
      "Starte neu, wenn der Diff auf einer falschen Anforderung, ungültigen Architektur oder zu breiten Grenze steht, oder wenn Korrekturen die Prämisse ändern und der Diff auseinanderläuft. Die Zahl der Überarbeitungen entscheidet nicht: Viele kleine Korrekturen können passen, eine geänderte Prämisse rechtfertigt den sofortigen Neustart.\n\nVor dem Verwerfen sicherst du, was nicht im Repository steht: verworfene Ansätze mit Begründung, neue Grenzen, relevante Befehlsausgabe, bereits verfolgte Dateien und Aufrufpfade.",
    ],
    [callout(3, 1, "title"), "Nur belegte Erkenntnisse übernehmen"],
    [
      callout(3, 1, "body"),
      "Gescheiterte Versuche enthalten auch falsche Annahmen. Übernimm nur, was Repository-Nachweise oder reproduzierbare Befehle stützen.",
    ],
    [canonical.sections[4].title, "Kontext in langen Sitzungen"],
    [
      prose(4, 0),
      "Lange Sitzungen sammeln Anforderungen, Korrekturen, Protokolle und verworfene Ansätze an. Anweisungen lassen sich dann schwerer konsistent anwenden, besonders nach Widersprüchen oder Verdichtung.\n\nDie Signale unten können auch einen mehrdeutigen Auftrag oder geänderten Code bedeuten. Prüfe also zuerst die Nachweise. Bildet der Verlauf keinen eindeutigen Vertrag mehr, beginne eine neue Sitzung mit knapper Spezifikation und den belegten Erkenntnissen.",
    ],
    [card(4, 1, 0, "eyebrow"), "Signal 01"],
    [card(4, 1, 0, "title"), "Korrigiertes Verhalten wird zurückgenommen"],
    [
      card(4, 1, 0, "body"),
      "Eine akzeptierte Korrektur verschwindet ohne Grund im Code. Formuliere die Anforderung in einem neuen Auftrag.",
    ],
    [card(4, 1, 1, "eyebrow"), "Signal 02"],
    [card(4, 1, 1, "title"), "Verworfene Ansätze werden erneut vorgeschlagen"],
    [
      card(4, 1, 1, "body"),
      "Ein verworfener Ansatz kehrt zurück und übergeht die dokumentierte Begründung. Grenze und Nachweis kommen in eine neue Spezifikation.",
    ],
    [card(4, 1, 2, "eyebrow"), "Signal 03"],
    [card(4, 1, 2, "title"), "Generische Ergebnisse trotz konkreter Eingaben"],
    [
      card(4, 1, 2, "body"),
      "Das Ergebnis nennt die nötigen Repository-Pfade, Konventionen oder Befehle nicht mehr. Stell diese Eingaben zuerst wieder her.",
    ],
    [card(4, 1, 3, "eyebrow"), "Signal 04"],
    [card(4, 1, 3, "title"), "Korrekturen werden umfangreicher"],
    [
      card(4, 1, 3, "body"),
      "Korrekturen wachsen oder widersprechen sich, und die Abweichung bleibt. Setz Auftrag, Diff oder Sitzung neu auf.",
    ],
    [canonical.sections[5].title, "Kontextverdichtung: Relevantes übernehmen"],
    [
      prose(5, 0),
      "In eine neue Sitzung kommen nur belegte Fakten, die weder Repository noch Spezifikation enthalten: Dateipfade, exakte Fehler, Befehle mit Ergebnis, Grenzen, verworfene Ansätze mit Begründung, offene Fragen. Vermutungen und wiederholte Diskussion bleiben weg.",
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
      '"tests/api/test_login.py::test_rate_limit_blocks_at_6 mockt is_allowed(). Der Test prüft damit den Mock, nicht den Rate Limiter.\n\nSchreib ihn um: /login sechsmal gegen den echten Rate Limiter aufrufen, beim sechsten Aufruf Status 429 erwarten.\n\nTeststil beibehalten: pytest, keine unittest.mock-Wrapper."',
    ],
    [
      widgetString(0, "note"),
      "Er nennt Fehler, Ort, Aufbau und Assertion. Daran misst du den überarbeiteten Test.",
    ],
    [
      widgetString(1, "question"),
      "Ein überarbeiteter Diff baut dieselbe Anforderung immer wieder um und wächst über den ursprünglichen Umfang hinaus. Was jetzt?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Weitere Kommentare ergänzen, ohne den Auftragsvertrag zu ändern.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Stoppen, Belegtes sichern, mit korrigierter Spezifikation neu starten.",
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
      "Änderungen, die nicht konvergieren, zeigen eine instabile Prämisse, Grenze oder einen instabilen Kontext. Eine neue Spezifikation gibt dem nächsten Versuch einen Vertrag. Auslöser ist das Auseinanderlaufen, egal nach wie vielen Runden.",
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
      "Behalte einen Punkt nur, wenn eine neue Sitzung ohne ihn einen falschen Weg wiederholen würde. Caching und TTL stehen in der Doku, diese drei Erkenntnisse nicht.",
    ],
    [
      widgetString(3, "question"),
      "Die Sitzung schlägt einen verworfenen Ansatz wieder vor und übergeht die dokumentierte Begründung. Was tust du?",
    ],
    [
      widgetStrings(3, "options")[0],
      "Deine Position nachdrücklicher begründen.",
    ],
    [
      widgetStrings(3, "options")[1],
      "Die Ablehnung prüfen und mit Nachweis in einen neuen Auftrag schreiben.",
    ],
    [
      widgetStrings(3, "options")[2],
      "Die Ablehnung ohne Begründung wiederholen.",
    ],
    [
      widgetStrings(3, "options")[3],
      "Annehmen; das Modell hat vielleicht einen besseren Grund gefunden.",
    ],
    [
      widgetString(3, "explanation"),
      "Die Wiederholung kann widersprüchlichen Kontext oder geänderten Code bedeuten. Gilt die Grenze weiter, schreib \"Verwende [Ansatz] wegen [Nachweis] nicht\" in einen neuen Auftrag.",
    ],
  ],
});
