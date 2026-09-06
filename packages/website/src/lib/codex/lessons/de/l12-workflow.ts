import canonical from "../l12-workflow";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L12 translation expected a prose block.");
  return block.markdown;
}

function pullQuote(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "pull-quote")
    throw new Error("Codex L12 translation expected a pull quote.");
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
    throw new Error("Codex L12 translation expected a card grid.");
  const value = block.cards[cardIndex]?.[field];
  if (!value) throw new Error("Codex L12 translation expected a card value.");
  return value;
}

function callout(
  sectionIndex: number,
  blockIndex: number,
  field: "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "callout")
    throw new Error("Codex L12 translation expected a callout.");
  const value = block[field];
  if (!value)
    throw new Error("Codex L12 translation expected a callout value.");
  return value;
}

function widgetProps(index: number): Readonly<Record<string, unknown>> {
  const widget = canonical.widgets?.[index];
  if (!widget) throw new Error("Codex L12 translation expected a widget.");
  return widget.props as Readonly<Record<string, unknown>>;
}

function widgetString(index: number, key: string): string {
  const value = widgetProps(index)[key];
  if (typeof value !== "string")
    throw new Error(`Codex L12 translation expected ${key}.`);
  return value;
}

function widgetStrings(index: number, key: string): readonly string[] {
  const value = widgetProps(index)[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Codex L12 translation expected ${key}.`);
  }
  return value;
}

function diffLineText(index: number): readonly string[] {
  const lines = widgetProps(index).lines;
  if (!Array.isArray(lines))
    throw new Error("Codex L12 translation expected diff lines.");
  return lines.map((line) => {
    if (
      line === null ||
      typeof line !== "object" ||
      !("text" in line) ||
      typeof line.text !== "string"
    ) {
      throw new Error("Codex L12 translation expected diff line text.");
    }
    return line.text;
  });
}

const translated = localizeCodexLessonToGerman(canonical, {
  translations: [
    [canonical.title, "Ein prüfbarer Entwicklungsablauf"],
    [
      canonical.subtitle,
      "Von der Anfrage bis zur Freigabe: ausdrückliche Entscheidungen, begrenzte Umsetzung, unabhängiges Review und verifiziertes Deployment.",
    ],
    [canonical.hook, "Absicht, Nachweis und Verantwortung bleiben verbunden."],
    [
      canonical.keyConcepts[0],
      "Besprechen, planen, umsetzen, prüfen, ausliefern, lernen",
    ],
    [canonical.keyConcepts[1], "Arbeitsablauf"],
    [canonical.keyConcepts[2], "Abschlussaufgabe"],
    [canonical.keyConcepts[3], "Zirkuläre Tests"],
    [canonical.sections[0].title, "Die Abschlussaufgabe"],
    [
      prose(0, 0),
      "Eine Anfrage kommt rein, bis Freitag soll etwas laufen. Die Abschlussaufgabe verfolgt diese Änderung bis zum Deployment. In jeder Phase ermittelst du, wer entscheidet, welche Repository-Nachweise nötig sind, wo die Ausführungsgrenze liegt und wo das Review-Gate.\n\nDie Alternativen sind plausible Abkürzungen. Bewerte sie nach den Risiken, für die niemand zuständig ist, statt eine Werkzeugfolge auswendig zu lernen.",
    ],
    [
      pullQuote(0, 1),
      "Ein belastbarer Ablauf macht Entscheidungen, Annahmen, Diffs und Prüfergebnisse für die verantwortliche Reviewerin nachvollziehbar.",
    ],
    [canonical.sections[1].title, "Die Ablaufkette"],
    [
      prose(1, 0),
      "Ein wiederholbarer Ablauf lässt weniger Annahmen im Verborgenen. Pass die Phasen an die Änderung an, aber die Verantwortung bleibt von der Anfrage bis zur Prüfung nach dem Deployment ausdrücklich:",
    ],
    [card(1, 1, 0, "eyebrow"), "Phase 01"],
    [card(1, 1, 0, "title"), "Besprechen"],
    [
      card(1, 1, 0, "body"),
      "Nutzerproblem, betroffene Systeme, Erfolgskriterien, Grenzen, Datensensitivität und offene Entscheidungen festhalten. Solange eine wesentliche Produkt- oder Sicherheitsentscheidung unausgesprochen ist, wird nicht implementiert.",
    ],
    [card(1, 1, 1, "eyebrow"), "Phase 02"],
    [card(1, 1, 1, "title"), "Planen"],
    [
      card(1, 1, 1, "body"),
      "Abhängigkeiten und gültige Zwischenzustände erfassen. Zusammenhängende Aufgaben trennen, jeder ihren Akzeptanznachweis, ihre Basisrevision und ihre genehmigungspflichtigen Schritte geben. Je nach Ablauf endet eine Aufgabe in einem lokalen Diff oder Pull Request.",
    ],
    [card(1, 1, 2, "eyebrow"), "Phase 03"],
    [card(1, 1, 2, "title"), "Umsetzen"],
    [
      card(1, 1, 2, "body"),
      "Jede begrenzte Aufgabe läuft in der konfigurierten lokalen oder Cloud-Umgebung. Abhängiges nacheinander, wirklich Unabhängiges getrennt, und die verwendeten Befehle und Umgebungsannahmen stehen im Protokoll.",
    ],
    [card(1, 1, 3, "eyebrow"), "Phase 04"],
    [
      card(1, 1, 3, "body"),
      "Den vollständigen Diff gegen Auftrag und ausgeschlossenen Umfang lesen. Tests und Protokolle lesen, Sicherheits- und Betriebsfolgen prüfen, vertrauenswürdige Checks noch einmal laufen lassen. Falsche Prämisse oder auseinanderlaufende Überarbeitungen heißen Neustart. Lokale Fehler bekommen eine gezielte Korrektur.",
    ],
    [card(1, 1, 4, "eyebrow"), "Phase 05"],
    [card(1, 1, 4, "title"), "Ausliefern"],
    [
      card(1, 1, 4, "body"),
      "Der reguläre Merge-, Deployment-, Rollback- und Freigabeprozess des Repositorys gilt. Artefakt und relevantes Verhalten in der Zielumgebung prüfen. Grün lokal oder in der Aufgabenumgebung belegt kein Deployment.",
    ],
    [card(1, 1, 5, "eyebrow"), "Phase 06"],
    [card(1, 1, 5, "title"), "Lernen"],
    [
      card(1, 1, 5, "body"),
      "Eine dauerhafte, nicht offensichtliche Repository-Regel dokumentierst du nur, wenn der Auftrag eine echte Lücke gezeigt hat. Aufgabenspezifische Erkenntnisse bleiben im Issue oder Pull Request, Incident- und Deployment-Nachweise im zuständigen System.",
    ],
    [
      prose(1, 2),
      "Wie viel Zeremonie? So viel, wie Risiko und Reversibilität verlangen. Eine kleine lokale Änderung kann mit knappem Auftrag und einer Prüfung auskommen. Authentifizierung, Daten, Zahlungen oder Migrationen brauchen ausdrückliche Sicherheits- und Rollout-Nachweise. Ein Gate fällt nicht weg, nur weil die Umsetzung kurz war.",
    ],
    [canonical.sections[2].title, "Szene 01 · Die Anfrage"],
    [prose(2, 0), "Eingehende Anfrage:"],
    [
      callout(2, 1, "body"),
      '"Hi, Finance braucht einen CSV-Export aller aktiven Abonnements, jede Nacht aktualisiert. Bis Freitag wäre super. Übernimmst du das? Was würdest du zuerst tun?"',
    ],
    [canonical.sections[3].title, "Szene 02 · Die Spezifikation"],
    [
      prose(3, 0),
      "Du hast zerlegt. Erste Aufgabe: *Einen Endpunkt /admin/exports/subscriptions.csv ergänzen, der aktive Abonnements als CSV streamt.* Nächtliche Planung und Zustellung sind eigene Folgeaufgaben.\n\nJetzt die Spezifikation. Welcher Einstieg ist der stärkste?",
    ],
    [canonical.sections[4].title, "Szene 03 · Den Diff prüfen"],
    [
      prose(4, 0),
      "Der Diff ist da, Prüfungen laut Bericht grün. Lies die tatsächlichen Änderungen:",
    ],
    [canonical.sections[5].title, "Szene 04 · Die gezielte Korrektur"],
    [
      prose(5, 0),
      "Der Test ersetzt active_subscriptions() und prüft dann die Serialisierung der gelieferten Testdaten. Das deckt die Formatierung des Endpunkts ab, nicht die Auswahl aktiver Abonnements. Welcher Review-Kommentar benennt den fehlenden Nachweis präzise?",
    ],
    [canonical.sections[6].title, "Szene 05 · Nach dem Merge"],
    [
      prose(6, 0),
      "Die überarbeiteten Tests decken Auswahl und Serialisierung ab, der vollständige Diff ist gelesen, die vertrauenswürdigen Checks sind grün. Bevor der Scheduler-Auftrag startet, sicherst du jede dauerhafte Entscheidung, an der die nächste Aufgabe hängt.",
    ],
    [canonical.sections[7].title, "Kurs abgeschlossen"],
    [
      prose(7, 0),
      "Drei Arbeitsregeln für die Zeit nach dem Kurs:\n\n1. **Fakten von Hypothesen trennen.** Dateiverweise, exakte Befehlsergebnisse und belegte Grenzen bleiben. Unbelegte Erklärungen fliegen raus.\n2. **Bei falscher Prämisse neu beginnen.** Lokale Fehler gezielt korrigieren. Ändern sich Ziel, Architektur oder Umfang, schreib einen neuen Auftrag.\n3. **Arbeit an der Review-Kapazität begrenzen.** Nicht mehr Aufgaben gleichzeitig, als das Team auf dem nötigen Risikoniveau prüfen, integrieren und verifizieren kann.\n\nWas ein Coding-Agent liefert, bleibt ein Vorschlag. Annahme, Merge, Deployment und Incident gehören einem verantwortlichen Menschen.",
    ],
    [
      widgetString(0, "question"),
      'Der Auftrag lautet: "CSV-Export, jede Nacht, bis Freitag verfügbar." Was tust du zuerst?',
    ],
    [
      widgetStrings(0, "options")[0],
      "Agenten öffnen, Priyas Nachricht reinkopieren, Lauf starten.",
    ],
    [
      widgetStrings(0, "options")[1],
      "Spalten, Autorisierung, Datenmenge, Zustellungsziel, Aufbewahrung und Termin klären. Danach Endpunkt, Planung und Zustellung entlang realer Abhängigkeiten trennen.",
    ],
    [
      widgetStrings(0, "options")[2],
      "Priya nach den CSV-Spalten fragen und alles als einen großen Auftrag bauen.",
    ],
    [
      widgetStrings(0, "options")[3],
      "Priya sagen, dass das diese Woche nichts wird.",
    ],
    [
      widgetString(0, "explanation"),
      "In der Anfrage stecken Datenvertrag, Autorisierung, Exporterzeugung, Planung und Zustellung. Kläre die fehlenden Produkt- und Sicherheitsentscheidungen. Getrennt wird nur dort, wo ein gültiger, unabhängig prüfbarer Zwischenzustand entsteht.",
    ],
    [
      widgetString(1, "question"),
      "Welcher Einstieg beschreibt Aufgabe (a), den Export-Endpunkt, am besten?",
    ],
    [widgetStrings(1, "options")[0], '"CSV-Export der Abonnements ergänzen."'],
    [
      widgetStrings(1, "options")[1],
      '"Ziel: GET /admin/exports/subscriptions.csv gibt alle aktiven Abonnements als gestreamte CSV zurück und lädt sie nicht vollständig in den Speicher. Spalten: id, customer_email, plan, status, current_period_end."',
    ],
    [widgetStrings(1, "options")[2], '"Die CSV-Sache für Finance umsetzen."'],
    [widgetStrings(1, "options")[3], '"Ein Berichtssystem bauen."'],
    [
      widgetString(1, "explanation"),
      "Route, Felder, Auswahlregel, Speichergrenze: alles benannt. Autorisierung und CSV-Sicherheit fehlen noch, aber das Verhalten ist prüfbar, anders als bei den übrigen Optionen.",
    ],
    [
      widgetString(3, "question"),
      "Was ist beim ersten Blick auf den PR das größte Problem?",
    ],
    [widgetStrings(3, "options")[0], "Der Endpunkt verwendet kein Streaming."],
    [
      widgetStrings(3, "options")[1],
      "Der Test prüft die CSV-Serialisierung eines gelieferten Datensatzes, belegt aber nicht, dass nur aktive Abonnements ausgewählt werden.",
    ],
    [
      widgetStrings(3, "options")[2],
      "Die Imports stehen in der falschen Reihenfolge.",
    ],
    [widgetStrings(3, "options")[3], "Keines, die Tests sind grün."],
    [
      widgetString(3, "explanation"),
      "Der Test liefert die Repository-Ausgabe selbst. Er prüft die Serialisierung des Endpunkts, nicht den Aktivstatus-Filter im Repository. Ergänze einen Nachweis über die echte Auswahlgrenze. Getrennte Serialisierungstests bleiben, wo sie eigenes Verhalten abdecken.",
    ],
    [
      widgetString(4, "question"),
      "Welcher Kommentar benennt den fehlenden Testnachweis präzise?",
    ],
    [
      widgetStrings(4, "options")[0],
      '"Der Test ist schwach, bitte verbessern."',
    ],
    [widgetStrings(4, "options")[1], '"Prüfe das tatsächliche Verhalten."'],
    [
      widgetStrings(4, "options")[2],
      '"tests/api/admin/test_exports.py::test_export_subscriptions prüft die Serialisierung, aber nicht die Auswahl nach Aktivstatus. Ergänze einen Integrationstest, der aktive und gekündigte Datensätze anlegt, den Endpunkt über das echte Repository aufruft und nur aktive Zeilen erwartet. Behalte einen fokussierten Serialisierungstest, wenn er getrenntes Verhalten abdeckt."',
    ],
    [widgetStrings(4, "options")[3], '"Mehr Tests ergänzen."'],
    [
      widgetString(4, "explanation"),
      'Der präzise Kommentar nennt vorhandene Abdeckung, fehlendes Verhalten, Testort und verlangte Grenze. Die Überarbeitung lässt sich daran messen. Aus "schwach" oder "mehr" muss niemand eine Absicht herauslesen.',
    ],
    [
      widgetString(5, "question"),
      "Welche Gewohnheit bewahrt vor Aufgabe 02 die Nachweise und Entscheidungen aus Aufgabe 01?",
    ],
    [widgetStrings(5, "options")[0], "Den PR-Tab schließen und weitermachen."],
    [
      widgetStrings(5, "options")[1],
      'Die Erkenntnis "Tests, die ihr eigenes Prüfobjekt mocken, sind hier ein Fehlermuster" in die Agentenanweisungen aufnehmen, damit der nächste Lauf sie berücksichtigt.',
    ],
    [
      widgetStrings(5, "options")[2],
      "Die PR-Beschreibung selbst neu schreiben.",
    ],
    [
      widgetStrings(5, "options")[3],
      "Den PR in einem privaten Dokument archivieren.",
    ],
    [
      widgetString(5, "explanation"),
      "In AGENTS.md gehört eine Regel nur, wenn sie dauerhaft und repository-spezifisch ist und Tests oder Werkzeuge sie nicht schon erzwingen. Aufgabenspezifische Entscheidungen und Nachweise bleiben im Issue oder Pull Request, wo ihr Kontext steht.",
    ],
  ],
  preserve: [
    "#payments-team · priya",
    "PR · api/admin/exports.py",
    ...diffLineText(2),
  ],
});

const workflowCards = translated.sections[1]?.blocks[1];
if (workflowCards?.kind !== "card-grid") {
  throw new Error("Codex L12 translation expected the workflow card grid.");
}

// The shared widget label translates "Review" as "Wiederholung". In this
// workflow card the word is an action, so its reviewed German term is
// "Prüfen". All structural fields remain inherited from the canonical lesson.
const sections = translated.sections.map((section, sectionIndex) => {
  if (sectionIndex !== 1) return section;
  return Object.freeze({
    ...section,
    blocks: section.blocks.map((block, blockIndex) => {
      if (blockIndex !== 1 || block.kind !== "card-grid") return block;
      return Object.freeze({
        ...block,
        cards: block.cards.map((entry, cardIndex) =>
          cardIndex === 3
            ? Object.freeze({ ...entry, title: "Prüfen" })
            : entry,
        ),
      });
    }),
  });
});

export default Object.freeze({ ...translated, sections });
