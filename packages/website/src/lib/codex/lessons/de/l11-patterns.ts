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
    [canonical.hook, "Wähle die Aufgabenform, die Nachweise sichtbar macht."],
    [canonical.keyConcepts[0], "TDD mit KI"],
    [canonical.keyConcepts[1], "Einstieg in bestehende Codebasen"],
    [canonical.keyConcepts[2], "Begrenztes Refactoring"],
    [canonical.keyConcepts[3], "Reproduzierbares Debugging"],
    [canonical.keyConcepts[4], "Neustartkriterien"],
    [canonical.sections[0].title, "Die Musterbibliothek"],
    [
      prose(0, 0),
      "Die Form eines Auftrags entscheidet, was sich später prüfen und korrigieren lässt. Die Muster hier machen Anforderungen, Repository-Nachweise und Prüfgrenzen ausdrücklich. Erfolg garantieren sie nicht. Jedes braucht eine passende Umgebung und ein menschliches Review.\n\nDer Katalog hilft bei drei Entscheidungen: welche Nachweise vor der ersten Änderung vorliegen, welche Transformationen sich mechanisch begrenzen lassen und wann ein Versuch mit korrigierter Spezifikation neu startet.",
    ],
    [
      pullQuote(0, 1),
      "Anfrage, Repository-Kontext, Umgebung, Diff und Prüfungen diagnostizierst du getrennt. Jeder Teil kann das Ergebnis kippen.",
    ],
    [canonical.sections[1].title, "Muster 01: TDD mit KI"],
    [
      prose(1, 0),
      "**Muster:** Verhalten in Tests festlegen, bevor implementiert wird, sofern sich die Anforderung so ausdrücken lässt.\n\n**Wert:** Ein geprüfter fehlschlagender Test ist ein ausführbares Beispiel und beweist, dass der Test das fehlende Verhalten bemerkt. Wird er später grün, ist das ein brauchbarer Nachweis, aber keiner für ungetestete Sicherheits-, Leistungs- oder Integrationsanforderungen.\n\n**Form in zwei Phasen:**\n\n1. *Testentwurf:* Tests ohne Produktionsänderung anfordern. Assertions, Fixtures, Grenzen und Fehlergrund prüfen.\n2. *Umsetzung:* Die begrenzte Änderung anfordern, die geprüften Tests und relevante Regressionstests verlangen.\n\nBei klarem Umfang dürfen Tests und Umsetzung auch aus einem Auftrag kommen. Geprüft werden sie trotzdem getrennt. Das Risiko heißt zirkulärer Nachweis: Erzeugte Tests können dasselbe Missverständnis enthalten wie der erzeugte Code.",
    ],
    [callout(1, 1, "title"), "Die Testgrenze benennen:"],
    [
      callout(1, 1, "body"),
      "Ein Test mit gemocktem Kollaborateur prüft Abbildung oder Fehlerbehandlung, nicht das Verhalten des Kollaborateurs. Gehört das Verhalten zur Anforderung, kommt ein Test über die echte Grenze dazu.",
    ],
    [
      canonical.sections[2].title,
      "Muster 02: Einstieg in bestehende Codebasen",
    ],
    [
      prose(2, 0),
      "**Muster:** In einem unbekannten Repository beginnt der Auftrag schreibgeschützt. Verlange Dateipfade, Aufrufpfade, vorhandene Hilfsfunktionen, Konfiguration und relevante Tests als Nachweise.\n\n**Vor der ersten Änderung geklärt:**\n\n- Von welchem Code und welchen externen Systemen hängt das Verhalten ab?\n- Welche vorhandene Hilfsfunktion oder Abstraktion deckt schon einen Teil ab?\n- Welche Repository-Anweisungen und Konventionen gelten?\n- Welche Tests führen das aktuelle Verhalten aus?\n- Welche Sicherheits- und Betriebsgrenzen kann die Änderung berühren?\n\nLies die Untersuchung, bevor du eine breitere Schreib- oder Netzwerkgrenze freigibst. Sind wichtige Aussagen unbelegt, verlange direkte Repository-Nachweise statt einer Architekturzusammenfassung.\n\n**Risiko:** Wer auf einem unvollständigen Modell ändert, kann Infrastruktur duplizieren, Konventionen umgehen oder Aufrufer brechen. Die Untersuchung senkt das Risiko. Den finalen Diff liest du trotzdem.",
    ],
    [canonical.sections[3].title, "Muster 03: Refactoring mit KI"],
    [
      prose(3, 0),
      '**Muster:** Eine Transformation, die das Verhalten erhält: altes Beispiel, akzeptiertes Zielbeispiel, ausdrückliche Dateimenge, Regressionstests.\n\n**Felder der Spezifikation:**\n\n- Altes und neues Muster mit Codebeispielen benennen.\n- Auf ein vorhandenes Repository-Beispiel verweisen, wenn es maßgeblich ist.\n- Eingeschlossene Dateien und ausdrückliche Ausschlüsse festlegen.\n- Öffentliche Schnittstellen und Verhalten benennen, die unverändert bleiben.\n- Wo relevant, Prüfungen für Aufrufer, generierte Ausgabe, Typen und Migrationen angeben.\n\n**Risiko:** "Räume die Codebasis auf" delegiert Architektur- und Benennungsentscheidungen, die niemand festgelegt hat. Eine begrenzte mechanische Transformation ist leicht zu prüfen. Breite Wiederholung kann ein fehlerhaftes Zielmuster trotzdem vervielfältigen.',
    ],
    [canonical.sections[4].title, "Muster 04: Debugging mit KI"],
    [
      prose(4, 0),
      "**Muster:** Symptom, Umgebung, exakte Fehlerausgabe, Reproduktionsschritte und bekannte Ausschlüsse liefern. Vor jeder Korrektur eine Hypothese verlangen, die an Datei und Aufrufpfad hängt.\n\n**Nützliche Eingaben:**\n\n- exakter Fehlertext und Stacktrace, Geheimnisse entfernt;\n- minimale Reproduktion oder ein fehlschlagender Test;\n- relevante Versionen, Konfiguration und Laufzeitbedingungen;\n- schon verworfene Hypothesen samt Nachweis.\n\nWo es passt, kommt vor der Produktionsänderung ein Regressionstest, der am gemeldeten Fehler scheitert. Fehlergrund bestätigen, dann Korrektur und breitere Checks prüfen.\n\n**Risiko:** Ohne reproduzierbares Symptom kann ein plausibler Diff benachbartes Verhalten ändern, ohne die Ursache zu belegen.",
    ],
    [canonical.sections[5].title, "Muster 05: Neustartkriterien"],
    [
      prose(5, 0),
      "**Muster:** Mit korrigierter Spezifikation neu beginnen, sobald Überarbeitungen eine falsche Prämisse konservieren oder den Diff aufblähen.\n\n**Signale:**\n\n- dieselbe Anforderung wird anders umgesetzt, ohne auf die Review-Nachweise einzugehen;\n- Kommentare definieren Ziel oder Architektur neu, statt einen lokalen Fehler zu korrigieren;\n- der Diff wächst über fremde Dateien oder Anliegen;\n- akzeptiertes Verhalten fliegt wiederholt raus; oder\n- die Sitzung enthält widersprüchliche Anweisungen.\n\nVor dem Neustart sicherst du belegte Repository-Erkenntnisse, verworfene Ansätze mit Begründung und relevante Befehlsausgabe. Spekulative Erklärungen und das ganze Transkript bleiben zurück. Eine feste Zahl von Überarbeitungen taugt nicht als Grenze. Konvergenz und Gültigkeit des Auftrags entscheiden.",
    ],
    [canonical.sections[6].title, "Drei riskante Aufgabenformen"],
    [card(6, 0, 0, "eyebrow"), "Fehler 01"],
    [card(6, 0, 0, "title"), "Die Wunschlisten-Aufgabe"],
    [
      card(6, 0, 0, "body"),
      '"Verbessere die Codebasis" und "mach sie schneller" nennen weder Zielverhalten noch Nachweis. Ersetze sie durch ein gemessenes Problem, begrenzten Umfang und Akzeptanzprüfungen.',
    ],
    [card(6, 0, 1, "eyebrow"), "Fehler 02"],
    [card(6, 0, 1, "title"), "Die Aufgabe ohne Tests"],
    [
      card(6, 0, 1, "body"),
      "Eine Verhaltensänderung ohne ausführbare Prüfung lässt sich kaum verifizieren. Geht kein automatisierter Test, definiere einen anderen reproduzierbaren Prüfpfad und schreib das Restrisiko auf.",
    ],
    [card(6, 0, 2, "eyebrow"), "Fehler 03"],
    [card(6, 0, 2, "title"), "Das große Refactoring"],
    [
      card(6, 0, 2, "body"),
      '"Refaktoriere die gesamte Architektur" mischt Entwurf, Migration, Umsetzung und Rollout. Trenne akzeptierte Zielarchitektur, Kompatibilitätsschritte und begrenzte Transformationen.',
    ],
    [prose(7, 0), "Zwei Fragen zu brauchbaren und riskanten Aufgabenmustern."],
    [
      widgetString(0, "title"),
      "Bestehende Codebasis: mit und ohne Untersuchung",
    ],
    [widgetString(0, "badLabel"), "Untersuchung überspringen"],
    [widgetString(0, "goodLabel"), "Zuerst untersuchen"],
    [
      widgetString(0, "bad"),
      'Auftrag: "Rate Limiting zur API ergänzen."\n\nKein Wort zu vorhandener Middleware, Fehlervertrag, Konfigurationsverantwortung, Schlüsselregeln oder Prüfung. Der Diff, der daraus entsteht, baut einen zweiten Limiter und einen eigenen Konfigurationspfad.\n\nReview-Ergebnis: Umfang und Architektur sind nicht belegt.',
    ],
    [
      widgetString(0, "good"),
      'Auftrag: "Nenne vor Änderungen die Dateien, die vorhandenes Rate Limiting, API-Fehlerantworten, Konfiguration und Tests definieren. Verfolge den relevanten Aufrufpfad und schlage eine begrenzte Änderung vor. Schreibe erst nach Review der Nachweise."\n\nDie Untersuchung findet den vorhandenen throttle-Dekorator, den Fehlerformatierer, die Konfigurationsverantwortung und die aktuellen Tests. Der Umsetzungsauftrag kann sie jetzt beim Namen nennen.',
    ],
    [
      widgetString(0, "note"),
      "Schreibgeschützte Untersuchung holt Annahmen ans Licht, bevor sie im Diff landen. Prüfe jede genannte Datei und jeden Aufrufpfad. Auch eine Untersuchungszusammenfassung kann Lücken haben.",
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
      "Erzeugte Tests sind nicht automatisch unabhängiger Nachweis. Prüfe, ob Anforderung und Assertion zusammenpassen, dazu Fixtures, Mocks und Fehlerverhalten. Eine getrennte Testphase macht das leichter, Pflicht ist sie nicht für jeden Auftrag.",
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
      "Die aktuelle Iteration stoppen, belegte Erkenntnisse sichern und mit korrigierter Spezifikation und Grenze neu beginnen.",
    ],
    [
      widgetStrings(2, "options")[2],
      "Den PR so akzeptieren, es steckt schon genug Zeit drin.",
    ],
    [widgetStrings(2, "options")[3], "Zu einem anderen KI-Werkzeug wechseln."],
    [
      widgetString(2, "explanation"),
      "Ändern Kommentare die Prämisse und läuft der Diff auseinander, passt keine lokale Korrektur mehr. Beginne mit einem widerspruchsfreien Vertrag neu. Konvergenz entscheidet, nicht eine feste Zahl von Versuchen.",
    ],
  ],
});
