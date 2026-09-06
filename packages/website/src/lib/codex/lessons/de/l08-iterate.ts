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
      "Gezielte Korrektur, neue Spezifikation oder sauberer Neustart: Fehler- und Diff-Struktur entscheiden.",
    ],
    [canonical.hook, "Erst die Ursache einordnen, dann antworten."],
    [canonical.keyConcepts[0], "Gezielte Korrektur"],
    [canonical.keyConcepts[1], "Neue Spezifikation"],
    [canonical.keyConcepts[2], "Kontextneustart"],
    [canonical.keyConcepts[3], "Entscheidungsbaum"],
    [
      prose(0, 0),
      "Der Diff kommt zurück und passt nicht. Bevor du antwortest, ordne die Abweichung ein. Ein lokaler Fehler, eine fehlende Anforderung, eine ungültige Aufgabengrenze und veralteter Sitzungskontext verlangen vier verschiedene Reaktionen.\n\nDer Entscheidungsbaum ist Diagnosehilfe, kein Zähler für Wiederholungen:",
    ],
    [card(0, 1, 0, "eyebrow"), "begrenzter lokaler Fehler"],
    [card(0, 1, 0, "title"), "Gezielt korrigieren"],
    [
      card(0, 1, 0, "body"),
      "Ziel und Architektur stimmen, die nötige Änderung ist lokal. Ein gezielter Kommentar reicht: Fehler, Ort, verlangter Nachweis.",
    ],
    [card(0, 1, 1, "eyebrow"), "Lücke in Anforderung oder Rahmen"],
    [card(0, 1, 1, "title"), "Neu spezifizieren"],
    [
      card(0, 1, 1, "body"),
      "Mehrere Kommentare tragen Ziele, Grenzen oder Akzeptanzkriterien nach? Dann schreib den Auftrag neu. Belegte Erkenntnisse behältst du, gestartet wird mit dem korrigierten Vertrag.",
    ],
    [card(0, 1, 2, "eyebrow"), "falsches Problem oder falsche Architektur"],
    [card(0, 1, 2, "title"), "Mit Nachweisen neu starten"],
    [
      card(0, 1, 2, "body"),
      "Rette keinen Diff, der auf einer falschen Annahme steht. Lies Code und Anforderung noch einmal, dann ein neuer Auftrag mit korrigierten Nachweisen und Grenzen.",
    ],
    [card(0, 1, 3, "eyebrow"), "mehrere gekoppelte Anliegen"],
    [card(0, 1, 3, "title"), "Zerlegen und neu starten"],
    [
      card(0, 1, 3, "body"),
      "Trenne, was sich unabhängig implementieren oder prüfen lässt. Abhängigkeitsreihenfolge und gültige Zwischenzustände stehen vor den neuen Aufträgen fest.",
    ],
    [
      pullQuote(0, 2),
      "Neustart, wenn Korrekturen die Prämisse ändern oder der Diff auseinanderläuft, statt zu konvergieren.",
    ],
    [canonical.sections[1].title, "Eine wirksame Korrektur"],
    [
      prose(1, 0),
      "Eine gezielte Korrektur passt nur, solange der Auftrag selbst gültig bleibt. Vergleiche einen vagen Kommentar mit einem, der Fehler, Ort und erwarteten Nachweis nennt.",
    ],
    [
      prose(1, 1),
      "Eine brauchbare Korrektur nennt **was falsch ist**, **wo es liegt** und **welches Ergebnis oder welche Prüfung verlangt wird**. Schreibt diese Erklärung Ziel oder Architektur um, ersetze den Auftrag, statt Kommentare zu stapeln.",
    ],
    [prose(2, 0), "Eine Frage dazu, wann neu spezifiziert wird."],
    [canonical.sections[3].title, "Wann du neu startest"],
    [
      prose(3, 0),
      "Hängt der Diff an einer falschen Anforderung, einer ungültigen Architektur oder einer zu breiten Grenze, starte neu. Wer von dort weiterbaut, schleppt Annahmen mit, um die jede spätere Korrektur herumarbeiten muss.\n\nVor dem Verwerfen sicherst du, was nicht im Repository steht: verworfene Ansätze mit Begründung, neu erkannte Grenzen, relevante Befehlsausgabe, bereits verfolgte Dateien und Aufrufpfade. Das wandert in eine neue, begrenzte Spezifikation.\n\nEine feste Anzahl von Überarbeitungen gibt es nicht. Mehrere kleine, unabhängige Korrekturen können effizient sein. Eine einzige Korrektur, die die Prämisse ändert, kann den sofortigen Neustart rechtfertigen.",
    ],
    [callout(3, 1, "title"), "Nur belegte Erkenntnisse übernehmen:"],
    [
      callout(3, 1, "body"),
      "Ein gescheiterter Versuch zeigt manchmal Unklarheit oder verborgene Kopplung. Manchmal enthält er einfach falsche Annahmen. Übernimm nur, was Repository-Nachweise oder reproduzierbare Befehle stützen.",
    ],
    [canonical.sections[4].title, "Kontext in langen Sitzungen"],
    [
      prose(4, 0),
      "Lange interaktive Sitzungen sammeln Anforderungen, Korrekturen, Protokolle und verworfene Ansätze an. Irgendwann lassen sich die relevanten Anweisungen schwerer konsistent anwenden, besonders wenn spätere Nachrichten früheren widersprechen oder der aktive Kontext verdichtet wurde.\n\nDu siehst es daran, dass ein verworfener Ansatz wieder auftaucht, eine akzeptierte Korrektur zurückgenommen wird oder eine allgemeine Regel eine spätere Ausnahme überschreibt. Dieselben Zeichen passen auch zu einem mehrdeutigen Auftrag oder geändertem Code. Prüfe also die Nachweise, bevor du die Kontextlänge beschuldigst.\n\nBildet der Verlauf keinen eindeutigen Vertrag mehr, beginne eine neue Sitzung mit knapper Spezifikation und nur den belegten Erkenntnissen, die es zum Weitermachen braucht.",
    ],
    [card(4, 1, 0, "eyebrow"), "Signal 01"],
    [card(4, 1, 0, "title"), "Korrigiertes Verhalten wird zurückgenommen"],
    [
      card(4, 1, 0, "body"),
      "Eine akzeptierte Korrektur verschwindet ohne Begründung wieder aus dem Code. Prüfe die aktuelle Anforderung. Ist die Sitzung widersprüchlich geworden, formuliere sie in einem neuen Auftrag.",
    ],
    [card(4, 1, 1, "eyebrow"), "Signal 02"],
    [card(4, 1, 1, "title"), "Verworfene Ansätze werden erneut vorgeschlagen"],
    [
      card(4, 1, 1, "body"),
      "Ein verworfener Ansatz taucht wieder auf, ohne auf die dokumentierte Begründung einzugehen. Grenze und Nachweis wandern ausdrücklich in eine neue Spezifikation.",
    ],
    [card(4, 1, 2, "eyebrow"), "Signal 03"],
    [card(4, 1, 2, "title"), "Generische Ergebnisse trotz konkreter Eingaben"],
    [
      card(4, 1, 2, "body"),
      "Das Ergebnis nennt die Repository-Pfade, Konventionen oder Befehle nicht mehr, die der Auftrag braucht. Stell diese Eingaben wieder her, bevor irgendetwas weiter geändert wird.",
    ],
    [card(4, 1, 3, "eyebrow"), "Signal 04"],
    [card(4, 1, 3, "title"), "Korrekturen werden umfangreicher"],
    [
      card(4, 1, 3, "body"),
      "Korrekturen bauen aufeinander auf oder widersprechen sich, statt die Abweichung zu verkleinern. Frag dich, ob Auftrag, Diff oder Sitzungskontext neu aufgesetzt gehören.",
    ],
    [
      pullQuote(4, 2),
      "Setz den Kontext zurück, sobald das Gespräch keinen widerspruchsfreien Auftragsvertrag mehr ausdrückt.",
    ],
    [canonical.sections[5].title, "Kontextverdichtung: Relevantes übernehmen"],
    [
      prose(5, 0),
      "Eine neue Sitzung erbt nicht das ganze Transkript. Sie erbt belegte Fakten, die weder im Repository noch in der ursprünglichen Spezifikation stehen. Das sind entdeckte Grenzen, verworfene Ansätze mit Begründung, relevante Befehlsergebnisse und offene Fragen.",
    ],
    [
      prose(5, 1),
      "Trenne Nachweis von Erzählung. Rein kommen Dateipfade, exakte Fehlermeldungen, Befehle mit Ergebnis und die Begründung für verworfene Ansätze. Raus bleiben Vermutungen, wiederholte Diskussion und alles, was die nächste Sitzung selbst aus versionierten Dateien lesen kann.",
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
      "Der konkrete Kommentar nennt Fehler, Ort, verlangten Aufbau und Assertion. Die Reviewerin kann den überarbeiteten Test direkt daran messen.",
    ],
    [
      widgetString(1, "question"),
      "Ein überarbeiteter Diff ändert dieselbe Anforderung wieder und wieder auf andere Weise und wächst über den ursprünglichen Umfang hinaus. Was jetzt?",
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
      "Änderungen, die nicht konvergieren, zeigen eine instabile Prämisse, Grenze oder einen instabilen Kontext. Eine neue Spezifikation gibt dem nächsten Versuch einen prüfbaren Vertrag. Entscheidend ist die Abweichung, nicht die Zahl der Wiederholungen.",
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
      "Die Prüffrage: Vermeidet eine neue Sitzung die falschen Wege auch ohne diesen Punkt? Falls ja, weglassen. Falls nein, übernehmen. Caching- und TTL-Dokumentation findet jede Sitzung selbst; die drei konkreten Erkenntnisse nicht.",
    ],
    [
      widgetString(3, "question"),
      "Die Sitzung schlägt einen verworfenen Ansatz wieder vor, ohne auf die dokumentierte Begründung einzugehen. Wie reagierst du?",
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
      "Der wiederholte Vorschlag kann widersprüchlichen Kontext oder eine geänderte Codebasis bedeuten. Prüfe die Nachweise noch einmal. Gilt die Grenze weiter, kommt sie samt Begründung in einen neuen, widerspruchsfreien Auftrag.",
    ],
  ],
});
