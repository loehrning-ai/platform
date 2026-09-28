import canonical from "../l11-patterns";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L11 translation expected a prose block.");
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
    throw new Error("Codex L11 translation expected a card grid.");
  const value = block.cards[cardIndex]?.[field];
  if (!value) throw new Error("Codex L11 translation expected a card value.");
  return value;
}

function callout(
  sectionIndex: number,
  blockIndex: number,
  field: "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "callout")
    throw new Error("Codex L11 translation expected a callout.");
  const value = block[field];
  if (!value)
    throw new Error("Codex L11 translation expected a callout value.");
  return value;
}

function widgetProps(index: number): Readonly<Record<string, unknown>> {
  const widget = canonical.widgets?.[index];
  if (!widget) throw new Error("Codex L11 translation expected a widget.");
  return widget.props as Readonly<Record<string, unknown>>;
}

function widgetString(index: number, key: string): string {
  const value = widgetProps(index)[key];
  if (typeof value !== "string")
    throw new Error(`Codex L11 translation expected ${key}.`);
  return value;
}

function widgetStrings(index: number, key: string): readonly string[] {
  const value = widgetProps(index)[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Codex L11 translation expected ${key}.`);
  }
  return value;
}

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [canonical.title, "Wiederverwendbare Aufgabenmuster"],
    [
      canonical.subtitle,
      "Geprüfte Tests, Repository-Untersuchung, begrenzte Transformationen und reproduzierbares Debugging verringern Mehrdeutigkeit.",
    ],
    [canonical.hook, "Wähle die Aufgabenform, die Nachweise sichtbar macht."],
    [canonical.keyConcepts[0], "TDD mit KI"],
    [canonical.keyConcepts[1], "Einstieg in bestehende Codebasen"],
    [canonical.keyConcepts[2], "Begrenztes Refactoring"],
    [canonical.keyConcepts[3], "Reproduzierbares Debugging"],
    [canonical.keyConcepts[4], "Neustartkriterien"],
    [canonical.sections[0].title, "Die Musterbibliothek"],
    [
      prose(0, 0),
      "Die Form eines Auftrags entscheidet, was sich später prüfen lässt. Die Muster hier machen Anforderungen, Repository-Nachweise und Prüfgrenzen ausdrücklich; jedes braucht trotzdem eine passende Umgebung und ein menschliches Review. Ist ein Ergebnis falsch, prüfe Anfrage, Repository-Kontext, Umgebung, Diff und Prüfungen einzeln.",
    ],
    [canonical.sections[1].title, "Muster 01: TDD mit KI"],
    [
      prose(1, 0),
      "Lässt sich die Anforderung in Tests ausdrücken, schreib sie vor der Umsetzung. Ein geprüfter fehlschlagender Test ist ein ausführbares Beispiel und zeigt, dass der Test das fehlende Verhalten bemerkt; wird er später grün, belegt das nur dieses Verhalten, nicht ungeprüfte Sicherheits-, Performance- oder Integrationsanforderungen.\n\n1. *Testentwurf:* Tests ohne Produktionsänderung. Assertions, Fixtures, Grenzen und Fehlergrund prüfen.\n2. *Umsetzung:* die begrenzte Änderung, dazu die geprüften Tests und relevante Regressionstests.\n\nBei klarem Umfang dürfen beide aus einem Auftrag kommen. Prüf sie trotzdem getrennt, denn erzeugte Tests können das Missverständnis des Codes teilen.",
    ],
    [callout(1, 1, "title"), "Die Testgrenze benennen."],
    [
      callout(1, 1, "body"),
      "Ein Test mit gemocktem Kollaborateur kann Abbildung oder Fehlerbehandlung prüfen; der Kollaborateur selbst bleibt ungeprüft. Gehört sein Verhalten zur Anforderung, ergänze einen Test über die echte Grenze.",
    ],
    [
      canonical.sections[2].title,
      "Muster 02: Einstieg in bestehende Codebasen",
    ],
    [
      prose(2, 0),
      "In einem unbekannten Repository beginnt die Arbeit lesend, mit Dateipfaden, Aufrufpfaden, vorhandenen Hilfsfunktionen, Konfiguration und Tests als Nachweis. Kläre vor der ersten Änderung:\n\n- Von welchem Code und welchen externen Systemen hängt das Verhalten ab?\n- Welche vorhandene Hilfsfunktion deckt schon einen Teil ab?\n- Welche Repository-Anweisungen und Konventionen gelten?\n- Welche Tests führen das aktuelle Verhalten aus?\n- Welche Sicherheits- und Betriebsgrenzen kann die Änderung berühren?\n\nLies die Untersuchung, bevor du breiteren Schreib- oder Netzwerkzugriff freigibst. Wer auf Basis eines unvollständigen Bilds ändert, dupliziert Infrastruktur, umgeht Konventionen und bricht Aufrufer. Fehlen Belege, verlange Repository-Nachweise statt einer Architekturzusammenfassung. Den finalen Diff liest du trotzdem.",
    ],
    [canonical.sections[3].title, "Muster 03: Refactoring mit KI"],
    [
      prose(3, 0),
      "Leg eine verhaltenserhaltende Transformation fest, mit:\n\n- altem und neuem Muster samt Codebeispielen;\n- einem maßgeblichen Repository-Beispiel, falls vorhanden;\n- eingeschlossenen Dateien und ausdrücklichen Ausschlüssen;\n- öffentlichen Schnittstellen und Verhalten, die unverändert bleiben;\n- Regressionstests für Aufrufer, generierte Ausgabe, Typen und Migrationen, wo relevant.\n\n**Risiko:** \"Räume die Codebasis auf\" delegiert Architektur- und Benennungsentscheidungen, die niemand festgelegt hat. Eine begrenzte Transformation ist leichter zu prüfen. Über die ganze Codebasis wiederholt, vervielfältigt sie aber auch jeden Fehler im Zielmuster.",
    ],
    [canonical.sections[4].title, "Muster 04: Debugging mit KI"],
    [
      prose(4, 0),
      "Symptom, Umgebung, exakte Fehlerausgabe, Reproduktionsschritte und bekannte Ausschlüsse liefern und vor jeder Korrektur eine Hypothese verlangen, die an Datei und Aufrufpfad hängt. Nützliche Eingaben:\n\n- exakter Fehlertext und Stacktrace, Geheimnisse entfernt;\n- minimale Reproduktion oder ein fehlschlagender Test;\n- relevante Versionen, Konfiguration und Laufzeitbedingungen;\n- schon verworfene Hypothesen samt Nachweis.\n\nWo es geht, zuerst einen Regressionstest ergänzen, der am gemeldeten Fehler scheitert, und den Grund bestätigen. Ohne reproduzierbares Symptom ändert ein plausibler Diff benachbartes Verhalten und belegt die Ursache nie.",
    ],
    [canonical.sections[5].title, "Muster 05: Neustartkriterien"],
    [
      prose(5, 0),
      "Mit korrigierter Spezifikation neu beginnen, sobald Überarbeitungen eine falsche Prämisse beibehalten oder den Diff aufblähen. Signale: Dieselbe Anforderung wird anders umgesetzt, ohne auf Review-Nachweise einzugehen, Kommentare definieren Ziel oder Architektur neu, der Diff wächst in fremde Dateien, akzeptiertes Verhalten verschwindet wiederholt, oder die Sitzung enthält widersprüchliche Anweisungen.\n\nÜbernimm belegte Erkenntnisse, verworfene Ansätze mit Begründung und relevante Befehlsausgabe.",
    ],
    [canonical.sections[6].title, "Drei riskante Aufgabenformen"],
    [card(6, 0, 0, "eyebrow"), "Fehler 01"],
    [card(6, 0, 0, "title"), "Die Wunschlisten-Aufgabe"],
    [
      card(6, 0, 0, "body"),
      "\"Verbessere die Codebasis\" nennt weder Ziel noch Nachweis. Ersetze das durch ein gemessenes Problem, begrenzten Umfang und Akzeptanzprüfungen.",
    ],
    [card(6, 0, 1, "eyebrow"), "Fehler 02"],
    [card(6, 0, 1, "title"), "Die Aufgabe ohne Tests"],
    [
      card(6, 0, 1, "body"),
      "Eine Verhaltensänderung ohne ausführbare Prüfung lässt sich kaum verifizieren. Ohne automatisierte Tests definierst du eine andere reproduzierbare Prüfung und notierst das Restrisiko.",
    ],
    [card(6, 0, 2, "eyebrow"), "Fehler 03"],
    [card(6, 0, 2, "title"), "Das große Refactoring"],
    [
      card(6, 0, 2, "body"),
      "\"Refaktoriere die gesamte Architektur\" mischt Entwurf, Migration, Umsetzung und Rollout. Trenne Zielarchitektur, Kompatibilitätsschritte und begrenzte Transformationen.",
    ],
    [prose(7, 0), "Fragen am Ende der Lektion."],
    [
      widgetString(0, "title"),
      "Bestehende Codebasis: mit und ohne Untersuchung",
    ],
    [widgetString(0, "badLabel"), "Untersuchung überspringen"],
    [widgetString(0, "goodLabel"), "Zuerst untersuchen"],
    [
      widgetString(0, "bad"),
      "Auftrag: \"Rate Limiting zur API ergänzen.\"\n\nKein Wort zu vorhandener Middleware, Fehlervertrag, Konfigurationsverantwortung, Schlüsselregeln oder Prüfung. Der Diff baut einen zweiten Limiter und einen eigenen Konfigurationspfad.\n\nReview-Ergebnis: Umfang und Architektur sind nicht belegt.",
    ],
    [
      widgetString(0, "good"),
      "Auftrag: \"Nenne vor Änderungen die Dateien, die vorhandenes Rate Limiting, API-Fehlerantworten, Konfiguration und Tests definieren. Verfolge den relevanten Aufrufpfad und schlage eine begrenzte Änderung vor. Schreibe erst nach Review der Nachweise.\"\n\nDie Untersuchung findet den vorhandenen throttle-Dekorator, den Fehlerformatierer, die Konfigurationsverantwortung und die aktuellen Tests, die der Umsetzungsauftrag jetzt beim Namen nennen kann.",
    ],
    [
      widgetString(0, "note"),
      "Schreibgeschützte Untersuchung zeigt Annahmen, bevor sie im Diff landen. Prüfe trotzdem jede genannte Datei und jeden Aufrufpfad; die Zusammenfassung kann Lücken haben.",
    ],
    [
      widgetString(1, "question"),
      "Tests und Umsetzung kamen aus einem Auftrag, und die Tests sind grün. Welches Review-Risiko prüfst du?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Die Umsetzung muss falsch sein, weil beides gemeinsam erzeugt wurde.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Die Tests können das Missverständnis der Umsetzung teilen.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Keines. Erfolgreiche Tests belegen die Korrektheit der Funktion.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Der Test-Runner hat wohl die falsche Sprache genutzt.",
    ],
    [
      widgetString(1, "explanation"),
      "Erzeugte Tests sind nicht automatisch unabhängiger Nachweis. Prüfe, wie Assertions, Fixtures und Mocks zur Anforderung passen und ob die Tests ohne das Verhalten fehlschlagen. Eine getrennte Testphase hilft, ist aber freiwillig.",
    ],
    [
      widgetString(2, "question"),
      "Der überarbeitete Diff wächst weiter, und die Review-Kommentare definieren inzwischen das Ziel neu. Welcher Schritt passt?",
    ],
    [
      widgetStrings(2, "options")[0],
      "Weitere Kommentare ergänzen, ohne den Auftragsvertrag zu ändern.",
    ],
    [
      widgetStrings(2, "options")[1],
      "Stoppen, Belegtes sichern, mit korrigierter Spezifikation neu starten.",
    ],
    [
      widgetStrings(2, "options")[2],
      "Den PR so akzeptieren, es steckt schon genug Zeit drin.",
    ],
    [widgetStrings(2, "options")[3], "Zu einem anderen KI-Werkzeug wechseln."],
    [
      widgetString(2, "explanation"),
      "Ändern Kommentare die Prämisse und läuft der Diff auseinander, passt keine lokale Korrektur mehr. Beginne mit einem widerspruchsfreien Vertrag neu; Konvergenz entscheidet, egal nach wie vielen Versuchen.",
    ],
  ],
});
