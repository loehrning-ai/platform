import canonical from "../l11-patterns";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L11 translation expected a prose block.");
  return block.markdown;
}

function pullQuote(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "pull-quote")
    throw new Error("Codex L11 translation expected a pull quote.");
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
    [canonical.hook, "Eine Aufgabenform wählen, die Nachweise sichtbar macht."],
    [canonical.keyConcepts[0], "TDD mit KI"],
    [canonical.keyConcepts[1], "Einstieg in bestehende Codebasen"],
    [canonical.keyConcepts[2], "Begrenztes Refactoring"],
    [canonical.keyConcepts[3], "Reproduzierbares Debugging"],
    [canonical.keyConcepts[4], "Neustartkriterien"],
    [canonical.sections[0].title, "Die Musterbibliothek"],
    [
      prose(0, 0),
      "Die Struktur eines Auftrags beeinflusst, was geprüft und korrigiert werden kann. Die Muster dieser Lektion machen Anforderungen, Repository-Nachweise und Prüfgrenzen ausdrücklich. Sie garantieren keinen Erfolg; jedes Muster braucht eine geeignete Umgebung und menschliches Review.\n\nNutze den Katalog, um festzulegen, welche Nachweise vor Änderungen vorliegen sollen, welche Transformationen sich mechanisch begrenzen lassen und wann ein Versuch mit korrigierter Spezifikation neu beginnen muss.",
    ],
    [
      pullQuote(0, 1),
      "Anfrage, Repository-Kontext, Umgebung, Diff und Prüfungen getrennt diagnostizieren; jeder Teil kann das Ergebnis ungültig machen.",
    ],
    [canonical.sections[1].title, "Muster 01: TDD mit KI"],
    [
      prose(1, 0),
      "**Muster:** Definiere Verhalten vor der Umsetzung in Tests, wenn sich die Anforderung so ausdrücken lässt.\n\n**Wert:** Ein geprüfter fehlschlagender Test liefert ein ausführbares Beispiel und bestätigt, dass der Test das fehlende Verhalten erkennt. Späteres Bestehen ist ein nützlicher Nachweis, belegt aber keine ungetesteten Sicherheits-, Leistungs- oder Integrationsanforderungen.\n\n**Form in zwei Phasen:**\n\n1. *Testentwurf:* Tests ohne Produktionsänderung anfordern. Assertions, Fixtures, Grenzen und Fehlergrund prüfen.\n2. *Umsetzung:* Die begrenzte Änderung anfordern und die geprüften Tests sowie relevante Regressionstests verlangen.\n\nTests und Umsetzung können bei klarem Umfang auch in einem Auftrag entstehen, müssen aber unabhängig geprüft werden. Das Risiko sind zirkuläre Nachweise: Erzeugte Tests können dasselbe Missverständnis wie der erzeugte Code enthalten.",
    ],
    [callout(1, 1, "title"), "Die Testgrenze benennen:"],
    [
      callout(1, 1, "body"),
      "Ein Test mit gemocktem Kollaborateur kann Abbildung oder Fehlerbehandlung gültig prüfen, aber nicht das Verhalten des Kollaborateurs. Ergänze einen Test über die echte Grenze, wenn dieses Verhalten Teil der Anforderung ist.",
    ],
    [
      canonical.sections[2].title,
      "Muster 02: Einstieg in bestehende Codebasen",
    ],
    [
      prose(2, 0),
      "**Muster:** Beginne einen Auftrag in einem unbekannten Repository mit einer schreibgeschützten Untersuchung. Verlange Dateipfade, Aufrufpfade, vorhandene Hilfsfunktionen, Konfiguration und relevante Tests als Nachweise.\n\n**Vor Änderungen zu klären:**\n\n- Von welchem Code und welchen externen Systemen hängt das Verhalten ab?\n- Welche vorhandene Hilfsfunktion oder Abstraktion deckt bereits einen Teil ab?\n- Welche Repository-Anweisungen und Konventionen gelten?\n- Welche Tests führen das aktuelle Verhalten aus?\n- Welche Sicherheits- und Betriebsgrenzen kann die Änderung berühren?\n\nPrüfe die Untersuchung, bevor du eine breitere Schreib- oder Netzwerkgrenze freigibst. Verlange direkte Repository-Nachweise, wenn wichtige Aussagen unbelegt sind.\n\n**Risiko:** Änderungen auf Grundlage eines unvollständigen Modells können Infrastruktur duplizieren, Konventionen umgehen oder Aufrufer beschädigen. Die Untersuchung verringert dieses Risiko; den finalen Diff musst du trotzdem prüfen.",
    ],
    [canonical.sections[3].title, "Muster 03: Refactoring mit KI"],
    [
      prose(3, 0),
      '**Muster:** Definiere eine verhaltenserhaltende Transformation mit altem Beispiel, akzeptiertem Zielbeispiel, ausdrücklicher Dateimenge und Regressionstests.\n\n**Felder der Spezifikation:**\n\n- Altes und neues Muster mit Codebeispielen benennen.\n- Auf ein vorhandenes Repository-Beispiel verweisen, wenn es maßgeblich ist.\n- Eingeschlossene Dateien und ausdrückliche Ausschlüsse festlegen.\n- Unveränderte öffentliche Schnittstellen und Verhalten benennen.\n- Je nach Fall Prüfungen für Aufrufer, generierte Ausgabe, Typen und Migrationen angeben.\n\n**Risiko:** Ein offener Auftrag wie "Räume die Codebasis auf" delegiert nicht festgelegte Architektur- und Benennungsentscheidungen. Eine begrenzte mechanische Transformation ist leichter zu prüfen; breite Wiederholung kann ein fehlerhaftes Zielmuster trotzdem vervielfältigen.',
    ],
    [canonical.sections[4].title, "Muster 04: Debugging mit KI"],
    [
      prose(4, 0),
      "**Muster:** Liefere beobachtetes Symptom, Umgebung, exakte Fehlerausgabe, Reproduktionsschritte und bekannte Ausschlüsse. Verlange vor einer Korrektur eine Hypothese mit Datei- und Aufrufpfad.\n\n**Nützliche Eingaben:**\n\n- exakter Fehlertext und Stacktrace ohne Geheimnisse;\n- minimale Reproduktion oder fehlschlagender Test;\n- relevante Versionen, Konfiguration und Laufzeitbedingungen;\n- bereits verworfene Hypothesen und die jeweiligen Nachweise.\n\nErgänze, wo sinnvoll, vor der Produktionsänderung einen Regressionstest, der für den gemeldeten Fehler fehlschlägt. Bestätige den Fehlergrund und prüfe danach Korrektur und breitere Checks.\n\n**Risiko:** Ohne reproduzierbares Symptom kann ein plausibler Diff benachbartes Verhalten ändern, ohne die Ursache zu belegen.",
    ],
    [canonical.sections[5].title, "Muster 05: Neustartkriterien"],
    [
      prose(5, 0),
      "**Muster:** Beginne mit korrigierter Spezifikation neu, wenn Überarbeitungen eine falsche Prämisse erhalten oder den Diff erweitern.\n\n**Signale:**\n\n- dieselbe Anforderung wird unterschiedlich umgesetzt, ohne die Review-Nachweise zu behandeln;\n- Kommentare definieren Ziel oder Architektur neu, statt einen lokalen Fehler zu korrigieren;\n- der Diff wächst über unabhängige Dateien oder Anliegen;\n- akzeptiertes Verhalten wird wiederholt entfernt; oder\n- die aktuelle Sitzung enthält widersprüchliche Anweisungen.\n\nSichere vor dem Neustart belegte Repository-Erkenntnisse, verworfene Ansätze mit Begründung und relevante Befehlsausgabe. Übernimm keine spekulativen Erklärungen und nicht den gesamten Verlauf. Eine feste Anzahl von Überarbeitungen ist keine belastbare Grenze; entscheide anhand von Konvergenz und Gültigkeit des Auftrags.",
    ],
    [canonical.sections[6].title, "Drei riskante Aufgabenformen"],
    [card(6, 0, 0, "eyebrow"), "Fehler 01"],
    [card(6, 0, 0, "title"), "Die Wunschlisten-Aufgabe"],
    [
      card(6, 0, 0, "body"),
      '"Verbessere die Codebasis" und "mache sie schneller" definieren weder Zielverhalten noch Nachweise. Ersetze sie durch ein gemessenes Problem, begrenzten Umfang und Akzeptanzprüfungen.',
    ],
    [card(6, 0, 1, "eyebrow"), "Fehler 02"],
    [card(6, 0, 1, "title"), "Die Aufgabe ohne Tests"],
    [
      card(6, 0, 1, "body"),
      "Eine Verhaltensänderung ohne ausführbare Prüfung ist schwer zu verifizieren. Wenn automatisierte Tests nicht möglich sind, definiere einen anderen reproduzierbaren Prüfpfad und dokumentiere das verbleibende Risiko.",
    ],
    [card(6, 0, 2, "eyebrow"), "Fehler 03"],
    [card(6, 0, 2, "title"), "Das umfassende Refactoring"],
    [
      card(6, 0, 2, "body"),
      '"Refaktoriere die gesamte Architektur" verbindet Entwurf, Migration, Umsetzung und Rollout. Trenne akzeptierte Zielarchitektur, Kompatibilitätsschritte und begrenzte Transformationen.',
    ],
    [prose(7, 0), "Zwei Fragen zu geeigneten und riskanten Aufgabenmustern."],
    [
      widgetString(0, "title"),
      "Bestehende Codebasis: mit und ohne Untersuchung",
    ],
    [widgetString(0, "badLabel"), "Untersuchung überspringen"],
    [widgetString(0, "goodLabel"), "Zuerst untersuchen"],
    [
      widgetString(0, "bad"),
      'Auftrag: "Rate Limiting zur API ergänzen."\n\nDer Auftrag nennt vorhandene Middleware, Fehlervertrag, Konfigurationsverantwortung, Schlüsselregeln und Prüfung nicht. Ein daraus entstehender Diff ergänzt einen zweiten Limiter und einen getrennten Konfigurationspfad.\n\nReview-Ergebnis: Umfang und Architektur sind nicht belegt.',
    ],
    [
      widgetString(0, "good"),
      'Auftrag: "Nenne vor Änderungen die Dateien, die vorhandenes Rate Limiting, API-Fehlerantworten, Konfiguration und Tests definieren. Verfolge den relevanten Aufrufpfad und schlage eine begrenzte Änderung vor. Schreibe erst nach Review der Nachweise."\n\nDie Untersuchung identifiziert den vorhandenen throttle-Dekorator, Fehlerformatierer, die Konfigurationsverantwortung und aktuelle Tests. Der Umsetzungsauftrag kann diese Artefakte nun ausdrücklich referenzieren.',
    ],
    [
      widgetString(0, "note"),
      "Schreibgeschützte Untersuchung macht Annahmen sichtbar, bevor sie in einen Diff gelangen. Prüfe jede genannte Datei und jeden Aufrufpfad; auch eine Untersuchungszusammenfassung kann unvollständig sein.",
    ],
    [
      widgetString(1, "question"),
      "Tests und Umsetzung wurden in einem Auftrag erzeugt und die Tests bestehen. Welches Review-Risiko muss geprüft werden?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Die Umsetzung muss falsch sein, weil beides gemeinsam erzeugt wurde.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Die Tests können dasselbe Missverständnis wie die Umsetzung enthalten. Prüfe ihre Assertions und bestätige, dass sie ohne das erforderliche Verhalten fehlschlagen.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Keines. Erfolgreiche Tests belegen die Korrektheit der Funktion.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Die Tests sind wahrscheinlich zu langsam.",
    ],
    [
      widgetString(1, "explanation"),
      "Erzeugte Tests sind nicht automatisch unabhängige Nachweise. Prüfe die Zuordnung von Anforderung zu Assertion, Fixtures, Mocks und Fehlerverhalten. Eine getrennte Testphase kann das erleichtern, ist aber nicht für jeden Auftrag vorgeschrieben.",
    ],
    [
      widgetString(2, "question"),
      "Ein überarbeiteter Diff wächst weiter und Review-Kommentare definieren inzwischen das ursprüngliche Ziel neu. Was ist der passende Schritt?",
    ],
    [
      widgetStrings(2, "options")[0],
      "Weitere Kommentare ergänzen, ohne den Auftragsvertrag zu ändern.",
    ],
    [
      widgetStrings(2, "options")[1],
      "Die aktuelle Iteration stoppen, belegte Erkenntnisse sichern und mit korrigierter Spezifikation und Grenze neu beginnen.",
    ],
    [
      widgetStrings(2, "options")[2],
      "Den PR unverändert akzeptieren, weil bereits genug Zeit investiert wurde.",
    ],
    [widgetStrings(2, "options")[3], "Zu einem anderen KI-Werkzeug wechseln."],
    [
      widgetString(2, "explanation"),
      "Wenn Kommentare die Prämisse verändern und der Diff auseinanderläuft, ist eine lokale Korrektur nicht mehr passend. Beginne mit einem widerspruchsfreien Vertrag neu. Entscheide anhand von Konvergenz, nicht anhand einer festen Anzahl von Versuchen.",
    ],
  ],
});
