import canonical from "../l10-parallelism";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L10 translation expected a prose block.");
  return block.markdown;
}

function pullQuote(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "pull-quote")
    throw new Error("Codex L10 translation expected a pull quote.");
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
    throw new Error("Codex L10 translation expected a card grid.");
  const value = block.cards[cardIndex]?.[field];
  if (!value) throw new Error("Codex L10 translation expected a card value.");
  return value;
}

function callout(
  sectionIndex: number,
  blockIndex: number,
  field: "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "callout")
    throw new Error("Codex L10 translation expected a callout.");
  const value = block[field];
  if (!value)
    throw new Error("Codex L10 translation expected a callout value.");
  return value;
}

function widgetProps(index: number): Readonly<Record<string, unknown>> {
  const widget = canonical.widgets?.[index];
  if (!widget) throw new Error("Codex L10 translation expected a widget.");
  return widget.props as Readonly<Record<string, unknown>>;
}

function widgetString(index: number, key: string): string {
  const value = widgetProps(index)[key];
  if (typeof value !== "string")
    throw new Error(`Codex L10 translation expected ${key}.`);
  return value;
}

function widgetStrings(index: number, key: string): readonly string[] {
  const value = widgetProps(index)[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Codex L10 translation expected ${key}.`);
  }
  return value;
}

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [canonical.title, "Parallele Aufgaben in einem Repository"],
    [
      canonical.subtitle,
      "Worktrees, Abhängigkeitsreihenfolge und klare Dateiverantwortung trennen gleichzeitige Änderungen und zeigen Merge-Risiken.",
    ],
    [canonical.hook, "Parallel läuft nur, was unabhängig ist."],
    [canonical.keyConcepts[0], "Git-Worktrees"],
    [canonical.keyConcepts[1], "Aufgabenzerlegung"],
    [canonical.keyConcepts[2], "Unabhängige und abhängige Aufgaben"],
    [canonical.keyConcepts[3], "Review-Warteschlange"],
    [canonical.sections[0].title, "Parallelität verändert das Review-Problem"],
    [
      prose(0, 0),
      "Mehrere Aufträge gleichzeitig laufen zu lassen ist leicht. Unabhängig werden sie davon nicht. Jeder Auftrag frisst Review-Kapazität und kann über gemeinsame Dateien, Schemas, APIs, generierte Artefakte, Abhängigkeiten oder Deployment-Zustand mit den anderen kollidieren.\n\nFinde diese Abhängigkeiten, bevor du parallelisierst. Getrennte Arbeitskopien verhindern, dass zwei Prozesse denselben Checkout bearbeiten. Fachliche Konflikte beim Merge verhindern sie nicht.",
    ],
    [
      pullQuote(0, 1),
      "Parallelität ist ein Strukturproblem, kein Geschwindigkeitsproblem.",
    ],
    [
      prose(1, 0),
      "Zwei lokale Sitzungen im selben Arbeitsverzeichnis teilen sich den Dateizustand. Was die eine schreibt, kann ändern, was die andere liest oder testet.\n\n**Git-Worktrees** geben dir getrennte Arbeitsverzeichnisse auf derselben Git-Objektdatenbank. Jeder Worktree hat normalerweise seinen eigenen Branch.\n\n```\n# Worktrees auf getrennten Branches anlegen\ngit worktree add ../myrepo-feat-auth feat/auth\ngit worktree add ../myrepo-feat-export feat/export\ngit worktree add ../myrepo-feat-api feat/api\n\n# Das konfigurierte Entwicklungswerkzeug in jedem Worktree starten.\n# Vor Änderungen Pfad und Branch prüfen.\n\n# Worktree entfernen, nachdem seine Änderungen integriert oder gesichert sind\ngit worktree remove ../myrepo-feat-auth\n```\n\nWorktrees isolieren nicht committete Dateiänderungen. Git-Metadaten teilen sie sich weiterhin, externen Zustand wie Abhängigkeits-Caches, Datenbanken, Ports und generierte Dateien außerhalb des Worktrees können sie ebenfalls teilen. Und beim Merge können die Branches trotzdem fachlich kollidieren.",
    ],
    [
      prose(2, 0),
      "Diese Zerlegungsmuster können unabhängige Arbeit freilegen, sofern du gemeinsame Verträge und Seiteneffekte vorher prüfst:",
    ],
    [card(2, 1, 0, "eyebrow"), "Muster 01"],
    [card(2, 1, 0, "title"), "Aufteilung nach Entitäten"],
    [
      card(2, 1, 0, "body"),
      "Eine Aufgabe pro Entität, wenn jede Entität eigene Code- und Datenpfade hat. Ein gemeinsames Schema, eine gemeinsame Hilfsfunktion oder ein gemeinsames Audit-Ziel ist eine Abhängigkeit, die ausdrücklich behandelt gehört.",
    ],
    [card(2, 1, 1, "eyebrow"), "Muster 02"],
    [card(2, 1, 1, "title"), "Aufteilung nach Verzeichnissen"],
    [
      card(2, 1, 1, "body"),
      "Jede Aufgabe bekommt einen Teilbaum. Gemeinsame Exporte, generierte Indizes, Konfiguration und modulübergreifende Tests dürfen dabei nicht gleichzeitig angefasst werden.",
    ],
    [card(2, 1, 2, "eyebrow"), "Muster 03"],
    [card(2, 1, 2, "title"), "Aufteilung der Testabdeckung"],
    [
      card(2, 1, 2, "body"),
      "Testerweiterungen nach Verhalten und eigenem Fixture-Satz trennen. Gemeinsame Snapshots, Fixtures, Testkonfiguration und Produktionsschnittstellen können trotzdem kollidieren.",
    ],
    [
      prose(2, 2),
      "Schreib pro Aufgabe auf, welche Dateien, Schnittstellen, generierten Ausgaben, Dienste, Ports und Datenspeicher sie anfasst. Überschneidung verbietet Parallelität nicht immer, verlangt aber Integrationsreihenfolge und eindeutige Konfliktverantwortung.",
    ],
    [canonical.sections[3].title, "Das Gegenmuster"],
    [
      prose(3, 0),
      'Vermeide parallele Aufträge, in denen jeweils "gemeinsame Hilfsfunktionen bei Bedarf refaktorieren" steht. Der Halbsatz lässt die Verantwortung für dieselbe Abhängigkeit in jeder Aufgabe offen. Was beim Merge passiert, weiß dann niemand.',
    ],
    [callout(3, 1, "title"), "Die Korrektur:"],
    [
      callout(3, 1, "body"),
      "Brauchen mehrere Aufgaben dieselbe Infrastrukturänderung, wird dieser Vertrag zuerst definiert und geprüft. Abhängige Aufgaben setzen auf der akzeptierten Revision auf. Parallel laufen danach nur die unabhängigen Anpassungen.",
    ],
    [canonical.sections[4].title, "Unabhängig oder abhängig"],
    [
      prose(4, 0),
      "Bevor etwas gleichzeitig startet, bekommt jede Aufgabe ein Etikett:\n\n- **Unabhängig:** weder gemeinsamer Code oder Vertrag noch generierter Zustand oder externer Seiteneffekt in Sicht. Parallel ist vertretbar, solange das Review mitkommt.\n- **Sequenziell abhängig:** Die Aufgabe braucht das akzeptierte Ergebnis einer anderen. Abhängigkeit zuerst ausführen und prüfen.\n- **Konfliktanfällig:** Die Aufgaben ändern dieselben Dateien, Schnittstellen, Schemas, Fixtures oder Dienste. Umbauen, Verantwortung zuweisen oder nacheinander laufen lassen.\n\nDisjunkte Dateilisten sind ein nützlicher Hinweis, kein Beweis für Unabhängigkeit. Fachliche Überschneidung prüfen weiterhin Integrationstests und Merge-Review.",
    ],
    [callout(4, 1, "title"), "Planungsmuster:"],
    [
      callout(4, 1, "body"),
      "1) Abhängigkeiten und gemeinsamen Zustand erfassen. 2) Gemeinsame Verträge vor ihren Nutzern integrieren. 3) Jede gleichzeitige Aufgabe bekommt Verantwortliche, Basisrevision, Umfang und Prüfungen. 4) In kontrollierter Reihenfolge integrieren, übergreifende Prüfungen noch einmal laufen lassen.",
    ],
    [canonical.sections[5].title, "Arbeitsfluss im Team"],
    [
      prose(5, 0),
      "Gleichzeitige Ausführung braucht Menschen, die ausdrücklich zuständig sind.\n\n- Jeder betroffene Funktionsbereich und jede Vertrauensgrenze bekommt eine Reviewerin, die sich dort auskennt.\n- Für jede Aufgabe stehen Basisrevision, Abhängigkeitsreihenfolge und Integrationsverantwortung fest.\n- Aktive Aufgaben bleiben auf das begrenzt, was das Team an Diffs und Prüfnachweisen bewerten kann, ohne Sicherheits- oder Freigabeprüfungen aufzuschieben.\n- Produkt-, Architektur- und Risikoentscheidungen bleiben bei verantwortlichen Menschen. Umsetzung wird erst delegiert, wenn diese Entscheidungen festgehalten sind.\n\nEine allgemeingültige Parallelitätszahl gibt es nicht. Wartezeit, Review-Komplexität, Überschneidung und Deployment-Risiko sagen dir, ob die nächste Aufgabe starten darf.",
    ],
    [prose(6, 0), "Zwei Fragen zur Parallelisierung von Agentenarbeit."],
    [widgetString(0, "title"), "Dieselbe Arbeit, zwei Strukturen"],
    [widgetString(0, "badLabel"), "Parallelisierung verhindert"],
    [widgetString(0, "goodLabel"), "Parallelisierung ermöglicht"],
    [
      widgetString(0, "bad"),
      'Drei gleichzeitig laufende Aufgaben:\n\n· "Validierung für die Registrierung ergänzen, gemeinsame Validatoren bei Bedarf refaktorieren."\n· "Validierung für den Checkout ergänzen, gemeinsame Validatoren bei Bedarf refaktorieren."\n· "Validierung für Profiländerungen ergänzen, gemeinsame Validatoren bei Bedarf refaktorieren."\n\nAlle drei können validators.py ändern. Verantwortung und Merge-Reihenfolge sind nirgends definiert.',
    ],
    [
      widgetString(0, "good"),
      'Aufgabe A läuft zuerst:\n"Die gemeinsame Validator-Schnittstelle in validators.py definieren und testen."\n\nNach dem Review von Aufgabe A nutzen getrennte Folgeaufgaben die akzeptierte Schnittstelle für Registrierung, Checkout und Profiländerung.\n\nJede Folgeaufgabe besitzt ihren Endpunkt und ihre Tests. Der gemeinsame Validator liegt außerhalb ihres Umfangs.',
    ],
    [
      widgetString(0, "note"),
      "Arbeit an gemeinsamen Grundlagen läuft nacheinander. Parallel werden die Folgeaufgaben erst, wenn ihre Abhängigkeit stabil ist.",
    ],
    [
      widgetString(1, "question"),
      "Fünf Dienste sollen dieselbe neue Logging-Middleware bekommen. Wie parallelisierst du?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Fünf parallele Aufgaben, je eine pro Dienst. Jede schreibt die Middleware selbst.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Zuerst eine Aufgabe für die Middleware in einer gemeinsamen Bibliothek. Danach fünf parallele Aufgaben, je eine für die Einbindung in einen Dienst.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Eine sequenzielle Aufgabe, die alle fünf Dienste ändert.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Jedes Teammitglied ändert seinen Dienst manuell.",
    ],
    [
      widgetString(1, "explanation"),
      "Die Middleware wird einmal gebaut und einmal geprüft. Danach fasst jede Einbindungsaufgabe nur ihren eigenen Dienst an. Eine akzeptierte Implementierung statt mehrerer abweichender Kopien.",
    ],
    [
      widgetString(2, "question"),
      "Zwei lokale Agentensitzungen sollen gleichzeitig am selben Repository arbeiten, ohne sich gegenseitig den Dateizustand zu verändern. Welches Setup passt?",
    ],
    [
      widgetStrings(2, "options")[0],
      "Zwei Terminalfenster im selben Verzeichnis. Sorgfältige Agenten kommen sich nicht in die Quere.",
    ],
    [
      widgetStrings(2, "options")[1],
      "Git-Worktrees verwenden und jeden Branch in ein eigenes Verzeichnis auschecken, damit jede Sitzung eine isolierte Arbeitskopie erhält.",
    ],
    [
      widgetStrings(2, "options")[2],
      "Für jeden Agenten einen vollständigen Klon des Repositorys erstellen.",
    ],
    [
      widgetStrings(2, "options")[3],
      "Eine Sitzung verwenden und die Aufgaben manuell abwechseln.",
    ],
    [
      widgetString(2, "explanation"),
      "Git-Worktrees geben jeder Sitzung ein eigenes Arbeitsverzeichnis auf derselben Objektdatenbank und isolieren nicht committete Änderungen. Getrennte Branches, gemeinsame Dienste, generierter Zustand und spätere Merge-Konflikte bleiben dein Problem.",
    ],
  ],
});
