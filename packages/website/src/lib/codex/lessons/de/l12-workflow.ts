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
    [canonical.hook, "Absicht, Nachweise und Verantwortung verbunden halten."],
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
      "Diese Abschlussaufgabe verfolgt eine Änderung von der Anfrage bis zum Deployment. Ermittle in jeder Phase die verantwortliche Person, erforderliche Repository-Nachweise, die Ausführungsgrenze und das Review-Gate.\n\nDie Alternativen sind plausible Abkürzungen. Bewerte sie anhand der Risiken, für die keine Verantwortung festgelegt ist, statt eine Werkzeugfolge auswendig zu lernen.",
    ],
    [
      pullQuote(0, 1),
      "Ein belastbarer Ablauf macht jede Entscheidung, Annahme, Änderung und jedes Prüfergebnis für die verantwortliche prüfende Person nachvollziehbar.",
    ],
    [canonical.sections[1].title, "Die Ablaufkette"],
    [
      prose(1, 0),
      "Ein wiederholbarer Ablauf verringert verborgene Annahmen. Passe die Phasen an die Änderung an, behalte aber von der Anfrage bis zur Prüfung nach dem Deployment eindeutige Verantwortung bei:",
    ],
    [card(1, 1, 0, "eyebrow"), "Phase 01"],
    [card(1, 1, 0, "title"), "Besprechen"],
    [
      card(1, 1, 0, "body"),
      "Nutzerproblem, betroffene Systeme, Erfolgskriterien, Grenzen, Datensensitivität und offene Entscheidungen erfassen. Nicht mit der Umsetzung beginnen, solange eine wesentliche Produkt- oder Sicherheitsentscheidung unausgesprochen bleibt.",
    ],
    [card(1, 1, 1, "eyebrow"), "Phase 02"],
    [card(1, 1, 1, "title"), "Planen"],
    [
      card(1, 1, 1, "body"),
      "Abhängigkeiten und gültige Zwischenzustände erfassen. Zusammenhängende Aufgaben trennen, Akzeptanznachweise zuordnen, Basisrevision dokumentieren und genehmigungspflichtige Schritte benennen. Je nach Ablauf erzeugt eine Aufgabe einen lokalen Diff oder Pull Request.",
    ],
    [card(1, 1, 2, "eyebrow"), "Phase 03"],
    [card(1, 1, 2, "title"), "Umsetzen"],
    [
      card(1, 1, 2, "body"),
      "Für jede begrenzte Aufgabe die konfigurierte lokale oder Cloud-Umgebung verwenden. Abhängigkeiten nacheinander ausführen, wirklich unabhängige Arbeit trennen und verwendete Befehle sowie Umgebungsannahmen dokumentieren.",
    ],
    [card(1, 1, 3, "eyebrow"), "Phase 04"],
    [
      card(1, 1, 3, "body"),
      "Den vollständigen Diff mit Auftrag und ausgeschlossenem Umfang vergleichen. Tests und Protokolle lesen, Sicherheits- und Betriebsfolgen prüfen und vertrauenswürdige Checks erneut ausführen. Bei falscher Prämisse oder auseinanderlaufenden Überarbeitungen neu beginnen; lokale Fehler gezielt korrigieren.",
    ],
    [card(1, 1, 4, "eyebrow"), "Phase 05"],
    [card(1, 1, 4, "title"), "Ausliefern"],
    [
      card(1, 1, 4, "body"),
      "Den regulären Merge-, Deployment-, Rollback- und Freigabeprozess des Repositorys verwenden. Ausgeliefertes Artefakt und relevantes Verhalten in der Zielumgebung prüfen; Erfolg lokal oder in der Aufgabenumgebung ist kein Deployment-Nachweis.",
    ],
    [card(1, 1, 5, "eyebrow"), "Phase 06"],
    [card(1, 1, 5, "title"), "Lernen"],
    [
      card(1, 1, 5, "body"),
      "Dauerhafte, nicht offensichtliche Repository-Regeln nur dokumentieren, wenn der Auftrag eine echte Lücke gezeigt hat. Aufgabenspezifische Erkenntnisse im Issue oder Pull Request und Incident- oder Deployment-Nachweise im jeweils zuständigen System aufbewahren.",
    ],
    [
      prose(1, 2),
      "Der Umfang des Verfahrens richtet sich nach Risiko und Reversibilität. Eine kleine lokale Änderung kann einen knappen Auftrag und eine Prüfung benötigen. Authentifizierungs-, Daten-, Zahlungs- oder Migrationsänderungen brauchen ausdrückliche Sicherheits- und Rollout-Nachweise. Ein Gate entfällt nicht allein wegen kurzer Umsetzung.",
    ],
    [canonical.sections[2].title, "Szene 01 · Die Anfrage"],
    [prose(2, 0), "Eingehende Anfrage:"],
    [
      callout(2, 1, "body"),
      '"Hallo, Finance benötigt einen CSV-Export aller aktiven Abonnements, der jede Nacht aktualisiert wird. Er soll bis Freitag verfügbar sein. Kannst du das übernehmen? Was würdest du zuerst tun?"',
    ],
    [canonical.sections[3].title, "Szene 02 · Die Spezifikation"],
    [
      prose(3, 0),
      "Du hast den Auftrag zerlegt. Die erste Aufgabe lautet: *Einen Endpunkt /admin/exports/subscriptions.csv ergänzen, der aktive Abonnements als CSV streamt.* Nächtliche Planung und Zustellung sind getrennte Folgeaufgaben.\n\nDu schreibst jetzt die Spezifikation. Welche Einleitung ist am präzisesten?",
    ],
    [canonical.sections[4].title, "Szene 03 · Den Diff prüfen"],
    [
      prose(4, 0),
      "Die Umsetzung liefert einen Diff und meldet bestandene Prüfungen. Prüfe die tatsächlichen Änderungen:",
    ],
    [canonical.sections[5].title, "Szene 04 · Die gezielte Korrektur"],
    [
      prose(5, 0),
      "Der Test ersetzt active_subscriptions() und prüft danach die Serialisierung der gelieferten Testdaten. Damit prüft er die Formatierung des Endpunkts, aber nicht die Auswahl aktiver Abonnements. Welcher Review-Kommentar benennt den fehlenden Nachweis präzise?",
    ],
    [canonical.sections[6].title, "Szene 05 · Nach dem Merge"],
    [
      prose(6, 0),
      "Die überarbeiteten Tests decken Auswahl und Serialisierung ab, der vollständige Diff wurde geprüft und vertrauenswürdige Checks bestehen. Sichere vor dem Scheduler-Auftrag jede dauerhafte Entscheidung, von der die nächste Aufgabe abhängt.",
    ],
    [canonical.sections[7].title, "Kurs abgeschlossen"],
    [
      prose(7, 0),
      "Nutze nach dem Kurs drei Arbeitsregeln:\n\n1. **Fakten von Hypothesen trennen.** Dateiverweise, exakte Befehlsergebnisse und belegte Grenzen behalten; unbelegte Erklärungen verwerfen.\n2. **Bei falscher Prämisse neu beginnen.** Lokale Fehler gezielt korrigieren; einen neuen Auftrag schreiben, wenn Ziel, Architektur oder Umfang geändert werden müssen.\n3. **Arbeit an Review-Kapazität begrenzen.** Nicht mehr gleichzeitige Aufgaben starten, als das Team auf dem erforderlichen Risikoniveau prüfen, integrieren und verifizieren kann.\n\nDie Ausgabe eines Coding-Agenten bleibt ein Änderungsvorschlag. Verantwortliche Menschen entscheiden über Annahme, Merge, Deployment und Incident-Behandlung.",
    ],
    [
      widgetString(0, "question"),
      'Der Auftrag lautet: "CSV-Export, jede Nacht, bis Freitag verfügbar." Was tust du zuerst?',
    ],
    [
      widgetStrings(0, "options")[0],
      "Den Agenten öffnen, Priyas Nachricht unverändert einfügen und den Lauf starten.",
    ],
    [
      widgetStrings(0, "options")[1],
      "Spalten, Autorisierung, Datenmenge, Zustellungsziel, Aufbewahrung und Termin klären. Danach Endpunkt, Planung und Zustellung entlang realer Abhängigkeiten trennen.",
    ],
    [
      widgetStrings(0, "options")[2],
      "Priya nach den genauen CSV-Spalten fragen und alles als einen großen Auftrag umsetzen.",
    ],
    [
      widgetStrings(0, "options")[3],
      "Priya mitteilen, dass die Umsetzung in dieser Woche nicht möglich ist.",
    ],
    [
      widgetString(0, "explanation"),
      "Die Anfrage verbindet Datenvertrag, Autorisierung, Exporterzeugung, Planung und Zustellung. Kläre fehlende Produkt- und Sicherheitsentscheidungen und trenne nur dort, wo ein gültiger und unabhängig prüfbarer Zwischenzustand entsteht.",
    ],
    [
      widgetString(1, "question"),
      "Welche Einleitung beschreibt Aufgabe (a), den Export-Endpunkt, am besten?",
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
      "Die Spezifikation benennt Route, Felder, Auswahlregel und Speichergrenze. Autorisierungs- und CSV-Sicherheitskriterien fehlen noch, aber das Verhalten ist deutlich prüfbarer als bei den anderen Optionen.",
    ],
    [
      widgetString(3, "question"),
      "Was ist beim ersten Prüfen des PR das größte Problem?",
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
    [widgetStrings(3, "options")[3], "Keines, weil die Tests bestehen."],
    [
      widgetString(3, "explanation"),
      "Der Test liefert die Repository-Ausgabe selbst. Damit kann er die Serialisierung des Endpunkts, aber nicht den Aktivstatus-Filter im Repository prüfen. Ergänze Nachweise über die echte Auswahlgrenze und behalte getrennte Serialisierungstests, wo sie eigenes Verhalten abdecken.",
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
      'Der präzise Kommentar nennt bestehende Abdeckung, fehlendes Verhalten, Testort und erforderliche Grenze. Die Überarbeitung lässt sich gegen diese Aussagen prüfen, ohne Absicht aus Wörtern wie "schwach" oder "mehr" abzuleiten.',
    ],
    [
      widgetString(5, "question"),
      "Welche Gewohnheit bewahrt vor Aufgabe 02 die Nachweise und Entscheidungen aus Aufgabe 01?",
    ],
    [
      widgetStrings(5, "options")[0],
      "Den PR-Tab schließen und direkt fortfahren.",
    ],
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
      "Eine Regel gehört nur dann in AGENTS.md, wenn sie dauerhaft, repository-spezifisch und nicht bereits durch Tests oder Werkzeuge erzwungen ist. Aufgabenspezifische Entscheidungen und Nachweise bleiben im Issue oder Pull Request, damit ihr Kontext nachvollziehbar bleibt.",
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
