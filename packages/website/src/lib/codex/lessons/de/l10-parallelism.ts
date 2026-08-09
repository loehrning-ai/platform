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
      "Worktrees, Abhängigkeitsreihenfolge und eindeutige Dateiverantwortung trennen gleichzeitige Änderungen und machen Merge-Risiken sichtbar.",
    ],
    [canonical.hook, "Nur unabhängige Änderungssätze parallelisieren."],
    [canonical.keyConcepts[0], "Git-Worktrees"],
    [canonical.keyConcepts[1], "Aufgabenzerlegung"],
    [canonical.keyConcepts[2], "Unabhängige und abhängige Aufgaben"],
    [canonical.keyConcepts[3], "Review-Warteschlange"],
    [canonical.sections[0].title, "Parallelität verändert das Review-Problem"],
    [
      prose(0, 0),
      "Mehrere Entwicklungsaufträge können gleichzeitig laufen. Ausführungskapazität macht sie jedoch nicht unabhängig. Jeder Auftrag verbraucht Review-Kapazität und kann über gemeinsame Dateien, Schemas, APIs, generierte Artefakte, Abhängigkeiten oder Deployment-Zustand mit anderen interagieren.\n\nErmittle diese Abhängigkeiten vor der Parallelisierung. Getrennte Arbeitskopien verhindern gleichzeitige Änderungen im selben Checkout. Sie verhindern keine fachlichen Konflikte beim Zusammenführen der Branches.",
    ],
    [
      pullQuote(0, 1),
      "Parallelisierung ist in erster Linie ein Strukturproblem, kein Geschwindigkeitsproblem.",
    ],
    [
      prose(1, 0),
      "Zwei lokale Sitzungen in einem Arbeitsverzeichnis teilen denselben Dateizustand. Eine Änderung aus einer Sitzung kann beeinflussen, was die andere liest oder testet.\n\n**Git-Worktrees** stellen getrennte Arbeitsverzeichnisse bereit, die dieselbe Git-Objektdatenbank verwenden. Jeder Worktree nutzt normalerweise einen eigenen Branch.\n\n```\n# Worktrees auf getrennten Branches anlegen\ngit worktree add ../myrepo-feat-auth feat/auth\ngit worktree add ../myrepo-feat-export feat/export\ngit worktree add ../myrepo-feat-api feat/api\n\n# Das konfigurierte Entwicklungswerkzeug in jedem Worktree starten.\n# Vor Änderungen Pfad und Branch prüfen.\n\n# Worktree entfernen, nachdem seine Änderungen integriert oder gesichert sind\ngit worktree remove ../myrepo-feat-auth\n```\n\nWorktrees trennen nicht versionierte Dateiänderungen. Git-Metadaten sowie externe Zustände wie Abhängigkeits-Caches, Datenbanken, Ports und generierte Dateien außerhalb des Worktrees können weiterhin gemeinsam genutzt werden. Branches können beim Merge auch fachlich kollidieren.",
    ],
    [
      prose(2, 0),
      "Diese Zerlegungsmuster können unabhängige Arbeit sichtbar machen, sofern gemeinsame Verträge und Seiteneffekte zuerst geprüft werden:",
    ],
    [card(2, 1, 0, "eyebrow"), "Muster 01"],
    [card(2, 1, 0, "title"), "Aufteilung nach Entitäten"],
    [
      card(2, 1, 0, "body"),
      "Nutze eine Aufgabe pro Entität, wenn jede Entität eigene Code- und Datenpfade besitzt. Ein gemeinsames Schema, eine Hilfsfunktion oder ein gemeinsames Audit-Ziel erzeugt eine Abhängigkeit, die ausdrücklich behandelt werden muss.",
    ],
    [card(2, 1, 1, "eyebrow"), "Muster 02"],
    [card(2, 1, 1, "title"), "Aufteilung nach Verzeichnissen"],
    [
      card(2, 1, 1, "body"),
      "Ordne jeder Aufgabe einen Teilbaum zu. Prüfe, dass gemeinsame Exporte, generierte Indizes, Konfiguration und modulübergreifende Tests nicht gleichzeitig geändert werden.",
    ],
    [card(2, 1, 2, "eyebrow"), "Muster 03"],
    [card(2, 1, 2, "title"), "Aufteilung der Testabdeckung"],
    [
      card(2, 1, 2, "body"),
      "Trenne Testerweiterungen nach Verhalten und eigenem Fixture-Satz. Gemeinsame Snapshots, Fixtures, Testkonfiguration und Produktionsschnittstellen können dennoch Konflikte erzeugen.",
    ],
    [
      prose(2, 2),
      "Liste für jede Aufgabe erwartete Dateien, Schnittstellen, generierte Ausgaben, Dienste, Ports und Datenspeicher auf. Eine Überschneidung verbietet Parallelität nicht immer, verlangt aber eine Integrationsreihenfolge und eine eindeutige Konfliktverantwortung.",
    ],
    [canonical.sections[3].title, "Das Gegenmuster"],
    [
      prose(3, 0),
      'Vermeide parallele Aufträge, die jeweils "gemeinsame Hilfsfunktionen bei Bedarf refaktorieren" enthalten. Damit bleibt die Verantwortung für dieselbe Abhängigkeit in allen Aufgaben offen und das Merge-Verhalten wird unvorhersehbar.',
    ],
    [callout(3, 1, "title"), "Die Korrektur:"],
    [
      callout(3, 1, "body"),
      "Wenn Aufgaben dieselbe Infrastrukturänderung benötigen, definiere und prüfe diesen Vertrag zuerst. Setze abhängige Aufgaben auf die akzeptierte Revision auf und führe danach nur die unabhängigen Anpassungen gleichzeitig aus.",
    ],
    [canonical.sections[4].title, "Unabhängig oder abhängig"],
    [
      prose(4, 0),
      "Klassifiziere jede Aufgabe vor dem gleichzeitigen Start:\n\n- **Unabhängig:** Es werden weder gemeinsamer Code oder Verträge noch generierter Zustand oder externe Seiteneffekte erwartet. Gleichzeitige Ausführung ist bei ausreichender Review-Kapazität vertretbar.\n- **Sequenziell abhängig:** Eine Aufgabe benötigt das akzeptierte Ergebnis einer anderen. Führe und prüfe die Abhängigkeit zuerst.\n- **Konfliktanfällig:** Aufgaben ändern gemeinsame Dateien, Schnittstellen, Schemas, Fixtures oder Dienste. Strukturiere sie neu, ordne Verantwortung zu oder führe sie nacheinander aus.\n\nGetrennte erwartete Dateilisten sind ein nützlicher Hinweis, kein Beleg für Unabhängigkeit. Integrationstests und Merge-Review müssen fachliche Überschneidungen weiterhin prüfen.",
    ],
    [callout(4, 1, "title"), "Planungsmuster:"],
    [
      callout(4, 1, "body"),
      "1) Abhängigkeiten und gemeinsamen Zustand erfassen. 2) Gemeinsame Verträge vor ihren Nutzern integrieren. 3) Jede gleichzeitige Aufgabe mit verantwortlicher Person, Basisrevision, Umfang und Prüfungen versehen. 4) In kontrollierter Reihenfolge integrieren und übergreifende Prüfungen erneut ausführen.",
    ],
    [canonical.sections[5].title, "Arbeitsfluss im Team"],
    [
      prose(5, 0),
      "Gleichzeitige Ausführung braucht eindeutige menschliche Verantwortung:\n\n- Weise jedem betroffenen Funktionsbereich und jeder Vertrauensgrenze eine fachkundige prüfende Person zu.\n- Dokumentiere für jede Aufgabe Basisrevision, Abhängigkeitsreihenfolge und Integrationsverantwortung.\n- Begrenze aktive Aufgaben auf die Kapazität des Teams, Diffs und Prüfnachweise ohne Verzögerung von Sicherheits- oder Freigabeprüfungen zu bewerten.\n- Produkt-, Architektur- und Risikoentscheidungen bleiben bei verantwortlichen Menschen. Delegiere Umsetzung erst, wenn diese Entscheidungen festgehalten sind.\n\nEs gibt keine allgemeingültige Parallelitätszahl. Entscheide anhand von Wartezeit, Review-Komplexität, Überschneidungen und Deployment-Risiko, ob eine weitere Aufgabe beginnen kann.",
    ],
    [prose(6, 0), "Zwei Fragen zur Parallelisierung von Agentenarbeit."],
    [widgetString(0, "title"), "Dieselbe Arbeit, zwei Strukturen"],
    [widgetString(0, "badLabel"), "Parallelisierung verhindert"],
    [widgetString(0, "goodLabel"), "Parallelisierung ermöglicht"],
    [
      widgetString(0, "bad"),
      'Drei gleichzeitig laufende Aufgaben:\n\n· "Validierung für die Registrierung ergänzen, gemeinsame Validatoren bei Bedarf refaktorieren."\n· "Validierung für den Checkout ergänzen, gemeinsame Validatoren bei Bedarf refaktorieren."\n· "Validierung für Profiländerungen ergänzen, gemeinsame Validatoren bei Bedarf refaktorieren."\n\nAlle drei können validators.py ändern. Verantwortung und Merge-Reihenfolge sind nicht definiert.',
    ],
    [
      widgetString(0, "good"),
      'Aufgabe A läuft zuerst:\n"Die gemeinsame Validator-Schnittstelle in validators.py definieren und testen."\n\nNach dem Review von Aufgabe A nutzen getrennte Folgeaufgaben die akzeptierte Schnittstelle für Registrierung, Checkout und Profiländerung.\n\nJede Folgeaufgabe besitzt ihren Endpunkt und ihre Tests; der gemeinsame Validator bleibt außerhalb ihres Umfangs.',
    ],
    [
      widgetString(0, "note"),
      "Aufgaben an gemeinsamen Grundlagen nacheinander ausführen. Unabhängige Folgeaufgaben erst parallelisieren, wenn ihre Abhängigkeiten stabil sind.",
    ],
    [
      widgetString(1, "question"),
      "Fünf Dienste sollen dieselbe neue Logging-Middleware verwenden. Welche Parallelisierungsstrategie ist richtig?",
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
      "Die Middleware wird einmal implementiert und geprüft. Danach ändert jede Einbindungsaufgabe nur den eigenen Dienst. So gibt es eine akzeptierte Implementierung statt mehrerer voneinander abweichender Kopien.",
    ],
    [
      widgetString(2, "question"),
      "Zwei lokale KI-Agentensitzungen sollen gleichzeitig am selben Repository arbeiten, ohne den Dateizustand der jeweils anderen zu verändern. Welche Einrichtung passt?",
    ],
    [
      widgetStrings(2, "options")[0],
      "Zwei Terminalfenster im selben Verzeichnis öffnen. Sorgfältige Agenten erzeugen keine Konflikte.",
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
      "Git-Worktrees stellen getrennte Arbeitsverzeichnisse auf derselben Git-Objektdatenbank bereit. Sie trennen nicht versionierte Dateiänderungen. Getrennte Branches sowie gemeinsame Dienste, generierter Zustand und spätere Merge-Konflikte müssen weiterhin verwaltet werden.",
    ],
  ],
});
