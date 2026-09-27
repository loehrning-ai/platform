import canonical from "../l10-parallelism";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L10 translation expected a prose block.");
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
      "Worktrees, Abhängigkeitsreihenfolge und klare Dateiverantwortung trennen gleichzeitige Änderungen.",
    ],
    [canonical.hook, "Nur unabhängige Änderungen parallel laufen lassen."],
    [canonical.keyConcepts[0], "Git-Worktrees"],
    [canonical.keyConcepts[1], "Aufgabenzerlegung"],
    [canonical.keyConcepts[2], "Unabhängige und abhängige Aufgaben"],
    [canonical.keyConcepts[3], "Review-Warteschlange"],
    [canonical.sections[0].title, "Parallelität verändert das Review-Problem"],
    [
      prose(0, 0),
      "Parallele Aufträge sind schnell gestartet. Jeder braucht trotzdem Review und kann über gemeinsame Dateien, Schemas, APIs, generierte Artefakte, Abhängigkeiten oder Deployment-Zustand mit den anderen kollidieren.\n\nFinde diese Abhängigkeiten, bevor du parallelisierst. Getrennte Arbeitskopien verhindern, dass zwei Prozesse denselben Checkout bearbeiten; fachliche Konflikte zeigen sich trotzdem beim Merge.",
    ],
    [
      prose(1, 0),
      "Zwei lokale Sitzungen im selben Arbeitsverzeichnis teilen sich den Dateizustand. Was die eine schreibt, ändert, was die andere liest und testet.\n\n**Git-Worktrees** geben dir getrennte Arbeitsverzeichnisse auf derselben Git-Objektdatenbank, normalerweise mit je einem eigenen Branch.\n\n```\n# Worktrees auf getrennten Branches anlegen\ngit worktree add ../myrepo-feat-auth feat/auth\ngit worktree add ../myrepo-feat-export feat/export\ngit worktree add ../myrepo-feat-api feat/api\n\n# Das konfigurierte Entwicklungswerkzeug in jedem Worktree starten.\n# Vor Änderungen Pfad und Branch prüfen.\n\n# Worktree entfernen, nachdem seine Änderungen integriert oder gesichert sind\ngit worktree remove ../myrepo-feat-auth\n```\n\nWorktrees isolieren nicht committete Dateiänderungen. Sie teilen sich Git-Metadaten und können Abhängigkeits-Caches, Datenbanken, Ports und generierte Dateien außerhalb des Worktrees teilen.",
    ],
    [
      prose(2, 0),
      "Drei Arten, Arbeit aufzuteilen, nachdem du gemeinsame Verträge und Seiteneffekte geprüft hast:",
    ],
    [card(2, 1, 0, "eyebrow"), "Muster 01"],
    [card(2, 1, 0, "title"), "Aufteilung nach Entitäten"],
    [
      card(2, 1, 0, "body"),
      "Eine Aufgabe pro Entität mit eigenen Code- und Datenpfaden. Ein gemeinsames Schema, eine Hilfsfunktion oder ein Audit-Ziel ist eine ausdrückliche Abhängigkeit.",
    ],
    [card(2, 1, 1, "eyebrow"), "Muster 02"],
    [card(2, 1, 1, "title"), "Aufteilung nach Verzeichnissen"],
    [
      card(2, 1, 1, "body"),
      "Ein Teilbaum pro Aufgabe. Gemeinsame Exporte, generierte Indizes, Konfiguration und modulübergreifende Tests dürfen sich nicht gleichzeitig ändern.",
    ],
    [card(2, 1, 2, "eyebrow"), "Muster 03"],
    [card(2, 1, 2, "title"), "Aufteilung der Testabdeckung"],
    [
      card(2, 1, 2, "body"),
      "Testerweiterungen nach Verhalten und eigenen Fixtures trennen. Gemeinsame Snapshots, Fixtures, Testkonfiguration und Produktionsschnittstellen können trotzdem kollidieren.",
    ],
    [
      prose(2, 2),
      "Schreib pro Aufgabe Dateien, Schnittstellen, generierte Ausgaben, Dienste, Ports und Datenspeicher auf. Überschneidende Aufgaben brauchen eine Integrationsreihenfolge und eine benannte Konfliktverantwortung.",
    ],
    [canonical.sections[3].title, "Das Gegenmuster"],
    [
      prose(3, 0),
      "Aufgaben, in denen jeweils \"gemeinsame Hilfsfunktionen bei Bedarf refaktorieren\" steht, wie im Validator-Beispiel oben, besitzen alle dieselbe Abhängigkeit. Was beim Merge passiert, weiß dann niemand.",
    ],
    [callout(3, 1, "title"), "Die Korrektur."],
    [
      callout(3, 1, "body"),
      "Definiere und prüfe den gemeinsamen Vertrag zuerst, setz abhängige Aufgaben darauf auf und lass dann nur die unabhängigen Anpassungen parallel laufen.",
    ],
    [canonical.sections[4].title, "Unabhängig oder abhängig"],
    [
      prose(4, 0),
      "Ordne jede Aufgabe vor dem Start ein:\n\n- **Unabhängig:** kein gemeinsamer Code, Vertrag, generierter Zustand oder externer Seiteneffekt zu erwarten. Parallel laufen lassen, solange das Review mitkommt.\n- **Sequenziell abhängig:** braucht das akzeptierte Ergebnis einer anderen Aufgabe. Die Abhängigkeit zuerst ausführen und prüfen.\n- **Konfliktanfällig:** ändert gemeinsame Dateien, Schnittstellen, Schemas, Fixtures oder Dienste. Umbauen, Verantwortung zuweisen oder nacheinander laufen lassen.\n\nDisjunkte Dateilisten deuten auf Unabhängigkeit hin, beweisen sie aber nicht; fachliche Überschneidung prüfen Integrationstests und Merge-Review.",
    ],
    [callout(4, 1, "title"), "Reihenfolge planen."],
    [
      callout(4, 1, "body"),
      "1) Abhängigkeiten und gemeinsamen Zustand erfassen. 2) Gemeinsame Verträge vor ihren Nutzern integrieren. 3) Jeder gleichzeitigen Aufgabe Verantwortliche, Basisrevision, Umfang und Prüfungen geben. 4) In kontrollierter Reihenfolge integrieren und übergreifende Prüfungen erneut laufen lassen.",
    ],
    [canonical.sections[5].title, "Arbeitsfluss im Team"],
    [
      prose(5, 0),
      "Parallele Arbeit braucht benannte Zuständige: eine kundige Reviewerin für jeden betroffenen Bereich und jede Vertrauensgrenze, und für jede Aufgabe festgehaltene Basisrevision, Abhängigkeitsreihenfolge und Integrationsverantwortung. Starte nicht mehr Aufgaben, als das Team prüfen kann, ohne Sicherheits- oder Freigabeprüfungen aufzuschieben. Produkt-, Architektur- und Risikoentscheidungen bleiben bei verantwortlichen Menschen; Umsetzung wird delegiert, sobald sie festgehalten sind.\n\nEine allgemeingültige Parallelitätszahl gibt es nicht. Wartezeit, Review-Komplexität, Überschneidung und Deployment-Risiko entscheiden, wann die nächste Aufgabe startet.",
    ],
    [prose(6, 0), "Fragen am Ende der Lektion."],
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
      "Gemeinsame Grundlagen nacheinander, danach die Folgeaufgaben parallel.",
    ],
    [
      widgetString(1, "question"),
      "Fünf Dienste sollen dieselbe neue Logging-Middleware bekommen. Wie parallelisierst du?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Fünf parallele Aufgaben, jede schreibt ihre eigene Middleware.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Middleware in eine gemeinsame Bibliothek, dann fünf parallele Einbindungen.",
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
      "Wird die Middleware einmal gebaut und geprüft, gibt es eine einzige gültige Fassung. Jede Einbindungsaufgabe fasst dann nur ihren eigenen Dienst an, also kollidiert nichts.",
    ],
    [
      widgetString(2, "question"),
      "Zwei lokale Agentensitzungen sollen gleichzeitig am selben Repository arbeiten, ohne einander die Dateien zu verändern. Welches Setup passt?",
    ],
    [
      widgetStrings(2, "options")[0],
      "Zwei Terminalfenster im selben Verzeichnis; sorgfältige Agenten kollidieren nicht.",
    ],
    [
      widgetStrings(2, "options")[1],
      "Git-Worktrees nutzen, ein Branch pro Verzeichnis.",
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
      "Worktrees geben jeder Sitzung ein eigenes Arbeitsverzeichnis auf derselben Objektdatenbank und isolieren nicht committete Änderungen. Getrennte Branches, gemeinsame Dienste, generierter Zustand und Merge-Konflikte bleiben deine Aufgabe.",
    ],
  ],
});
