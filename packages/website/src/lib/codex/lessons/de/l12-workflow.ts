import canonical from "../l12-workflow";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L12 translation expected a prose block.");
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
      "Eine Änderung von der Anfrage bis zur Freigabe, mit ausdrücklichen Entscheidungen, begrenzten Aufgaben, unabhängigem Review und verifiziertem Deployment.",
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
      "Eine Änderung, von der Chatnachricht bis zum deployten Endpunkt. Bestimme in jeder Phase, wer entscheidet, welche Repository-Nachweise nötig sind, wo die Ausführungsgrenze liegt und wo das Review-Gate. Bewerte jede verlockende Abkürzung nach dem Risiko, für das dann niemand zuständig ist.",
    ],
    [canonical.sections[1].title, "Die Ablaufkette"],
    [
      prose(1, 0),
      "Pass die sechs Phasen an die Änderung an; die Verantwortung bleibt von der Anfrage bis zur Prüfung nach dem Deployment ausdrücklich.",
    ],
    [card(1, 1, 0, "eyebrow"), "Phase 01"],
    [card(1, 1, 0, "title"), "Besprechen"],
    [
      card(1, 1, 0, "body"),
      "Problem, betroffene Systeme, Erfolgskriterien, Grenzen, Datensensitivität und offene Entscheidungen festhalten. Produkt- und Sicherheitsentscheidungen zuerst klären.",
    ],
    [card(1, 1, 1, "eyebrow"), "Phase 02"],
    [card(1, 1, 1, "title"), "Planen"],
    [
      card(1, 1, 1, "body"),
      "Abhängigkeiten und gültige Zwischenzustände erfassen. Aufgaben trennen, Akzeptanznachweis und Basisrevision festlegen, Freigabeschritte markieren.",
    ],
    [card(1, 1, 2, "eyebrow"), "Phase 03"],
    [card(1, 1, 2, "title"), "Umsetzen"],
    [
      card(1, 1, 2, "body"),
      "Jede begrenzte Aufgabe läuft in ihrer konfigurierten Umgebung. Abhängiges nacheinander; Befehle und Umgebungsannahmen protokollieren.",
    ],
    [card(1, 1, 3, "eyebrow"), "Phase 04"],
    [
      card(1, 1, 3, "body"),
      "Den vollständigen Diff gegen Auftrag und ausgeschlossenen Umfang lesen, Tests und Protokolle lesen, vertrauenswürdige Checks erneut laufen lassen. Lokale Fehler gezielt korrigieren, bei falscher Prämisse neu starten.",
    ],
    [card(1, 1, 4, "eyebrow"), "Phase 05"],
    [card(1, 1, 4, "title"), "Ausliefern"],
    [
      card(1, 1, 4, "body"),
      "Über den regulären Merge-, Deployment- und Rollback-Prozess ausliefern. Erst das deployte Artefakt in der Zielumgebung belegt die Auslieferung.",
    ],
    [card(1, 1, 5, "eyebrow"), "Phase 06"],
    [card(1, 1, 5, "title"), "Lernen"],
    [
      card(1, 1, 5, "body"),
      "Eine dauerhafte, nicht offensichtliche Repository-Regel nur bei einer echten Lücke festhalten. Aufgabenerkenntnisse gehören ins Issue oder in den Pull Request.",
    ],
    [
      prose(1, 2),
      "Der Aufwand folgt Risiko und Reversibilität. Eine kleine lokale Änderung braucht einen knappen Auftrag und eine Prüfung; Authentifizierung, Daten, Zahlungen oder Migrationen brauchen Sicherheits- und Rollout-Nachweise, auch bei kurzem Code.",
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
      "Erste Aufgabe nach der Zerlegung: *Einen Endpunkt /admin/exports/subscriptions.csv ergänzen, der aktive Abonnements als CSV streamt.* Nächtliche Planung und Zustellung folgen als eigene Aufgaben. Welcher Einstieg in die Spezifikation ist der stärkste?",
    ],
    [canonical.sections[4].title, "Szene 03 · Den Diff prüfen"],
    [
      prose(4, 0),
      "Der Diff ist da, die Prüfungen sind grün. Lies, was sich tatsächlich geändert hat.",
    ],
    [canonical.sections[5].title, "Szene 04 · Die gezielte Korrektur"],
    [
      prose(5, 0),
      "Der Test ersetzt active_subscriptions() und prüft, wie die gelieferten Testdaten serialisiert werden; die Auswahl aktiver Abonnements bleibt ungeprüft. Welcher Kommentar benennt den fehlenden Nachweis präzise?",
    ],
    [canonical.sections[6].title, "Szene 05 · Nach dem Merge"],
    [
      prose(6, 0),
      "Die überarbeiteten Tests decken Auswahl und Serialisierung ab, der vollständige Diff ist gelesen, die vertrauenswürdigen Checks sind grün. Bevor der Scheduler-Auftrag startet, sicherst du jede dauerhafte Entscheidung, an der er hängt.",
    ],
    [canonical.sections[7].title, "Kurs abgeschlossen"],
    [
      prose(7, 0),
      "Drei Arbeitsregeln:\n\n1. **Fakten von Hypothesen trennen.** Dateiverweise, exakte Befehlsergebnisse und belegte Grenzen behalten; unbelegte Erklärungen streichen.\n2. **Bei falscher Prämisse neu beginnen.** Lokale Fehler gezielt korrigieren; ändern sich Ziel, Architektur oder Umfang, schreib einen neuen Auftrag.\n3. **Arbeit an der Review-Kapazität begrenzen.** Nur so viele Aufgaben gleichzeitig, wie das Team auf dem nötigen Risikoniveau prüfen, integrieren und verifizieren kann.\n\nWas ein Coding-Agent liefert, bleibt ein Vorschlag. Annahme, Merge, Deployment und Incident gehören einem verantwortlichen Menschen.",
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
      "Spalten, Zugriff, Menge, Ziel, Aufbewahrung und Termin klären, dann entlang echter Abhängigkeiten trennen.",
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
      "In der Anfrage stecken Datenvertrag, Autorisierung, Export, Planung und Zustellung. Kläre die offenen Produkt- und Sicherheitsentscheidungen und trenne nur dort, wo ein gültiger, prüfbarer Zwischenzustand entsteht.",
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
      "Er nennt Route, Felder, Auswahlregel und Speichergrenze. Autorisierung und CSV-Sicherheit fehlen noch, trotzdem legt er weit mehr prüfbares Verhalten fest als die übrigen Optionen.",
    ],
    [
      widgetString(3, "question"),
      "Was ist beim ersten Blick auf den PR das größte Problem?",
    ],
    [widgetStrings(3, "options")[0], "Der Endpunkt verwendet kein Streaming."],
    [
      widgetStrings(3, "options")[1],
      "Der Test belegt nicht, dass nur aktive Abonnements ausgewählt werden.",
    ],
    [
      widgetStrings(3, "options")[2],
      "Die Imports stehen in der falschen Reihenfolge.",
    ],
    [widgetStrings(3, "options")[3], "Keines, die Tests sind grün."],
    [
      widgetString(3, "explanation"),
      "Der Test liefert die Repository-Ausgabe selbst, prüft also die Serialisierung und nie den Aktivstatus-Filter. Ergänze einen Nachweis über die echte Auswahlgrenze und behalte fokussierte Serialisierungstests, wo sie nützen.",
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
      "\"tests/api/admin/test_exports.py::test_export_subscriptions prüft nur die Serialisierung. Ergänze einen Integrationstest über das echte Repository, der aktive und gekündigte Datensätze anlegt und nur aktive Zeilen erwartet.\"",
    ],
    [widgetStrings(4, "options")[3], '"Mehr Tests ergänzen."'],
    [
      widgetString(4, "explanation"),
      "Er nennt vorhandene Abdeckung, fehlendes Verhalten, Testort und verlangte Grenze; daran lässt sich die Überarbeitung messen. Bei \"schwach\" oder \"mehr\" bleibt die Absicht geraten.",
    ],
    [
      widgetString(5, "question"),
      "Welche Gewohnheit bewahrt vor Aufgabe 02 die Nachweise und Entscheidungen aus Aufgabe 01?",
    ],
    [widgetStrings(5, "options")[0], "Den PR-Tab schließen und weitermachen."],
    [
      widgetStrings(5, "options")[1],
      "\"Tests, die ihr eigenes Prüfobjekt mocken, sind hier ein Fehler\" in die Agentenanweisungen aufnehmen.",
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
      "In AGENTS.md gehört eine Regel nur, wenn sie dauerhaft und repository-spezifisch ist und Tests oder Werkzeuge sie nicht schon erzwingen. Aufgabenspezifische Entscheidungen und Nachweise bleiben mit ihrem Kontext im Issue oder Pull Request.",
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
