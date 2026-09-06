import canonical from "../l09-tools";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose")
    throw new Error("Codex L09 translation expected a prose block.");
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
    throw new Error("Codex L09 translation expected a card grid.");
  const value = block.cards[cardIndex]?.[field];
  if (!value) throw new Error("Codex L09 translation expected a card value.");
  return value;
}

function widgetProps(index: number): Readonly<Record<string, unknown>> {
  const widget = canonical.widgets?.[index];
  if (!widget) throw new Error("Codex L09 translation expected a widget.");
  return widget.props as Readonly<Record<string, unknown>>;
}

function widgetString(index: number, key: string): string {
  const value = widgetProps(index)[key];
  if (typeof value !== "string")
    throw new Error(`Codex L09 translation expected ${key}.`);
  return value;
}

function widgetStrings(index: number, key: string): readonly string[] {
  const value = widgetProps(index)[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Codex L09 translation expected ${key}.`);
  }
  return value;
}

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [canonical.title, "Einen Coding-Agenten-Ablauf auswählen"],
    [
      canonical.subtitle,
      "Erst Interaktionsmodell, Ausführungsgrenze, Anbieteranforderungen und Review-Pfad vergleichen, dann wählen.",
    ],
    [canonical.hook, "Wähle nach Betriebsanforderungen, nicht nach Logo."],
    [canonical.keyConcepts[0], "Werkzeuglandschaft"],
    [canonical.keyConcepts[2], "Passung zur Aufgabenform"],
    [canonical.keyConcepts[3], "IDE-Integration"],
    [canonical.sections[0].title, "Die Landschaft"],
    [
      prose(0, 0),
      "Vergiss die Anbieterrangliste. Coding-Werkzeuge mischen mehrere Interaktionsmodelle: Inline-Vervollständigung, Editor-Chat, Terminal-Agenten, IDE-Agenten und Hintergrundaufträge, die ein Diff oder einen Pull Request liefern. Die Fähigkeiten ändern sich, und mehrere Werkzeuge decken inzwischen mehr als eine Kategorie ab.\n\nWähle nach betrieblichen Anforderungen. Prüfe, welchen Repository-Kontext das Werkzeug lesen kann, wo Befehle laufen, welche Schreibzugriffe eine Freigabe brauchen, ob Netzwerkzugriff besteht, wie Modell- und Datenrichtlinien konfiguriert sind und wie das Ergebnis in den Review kommt.\n\nBewertet wird der Arbeitsablauf mit seinen Kontrollen, nicht das Logo.",
    ],
    [canonical.sections[1].title, "Sechs beispielhafte Werkzeugoberflächen"],
    [card(1, 0, 0, "title"), "Editor- und GitHub-Abläufe"],
    [
      card(1, 0, 0, "body"),
      "Inline-Vervollständigung, Chat und Agentenabläufe in unterstützten Editoren und auf GitHub. Prüfe pro Modus Repository-Zugriff, Ausführungsort und Review-Kontrollen.",
    ],
    [card(1, 0, 1, "title"), "KI-orientierter Editor"],
    [
      card(1, 0, 1, "body"),
      "Eine IDE, die Editor-Kontext, Chat und Agentenausführung verbindet. Wie gut interaktive Repository-Untersuchung und Änderungen über mehrere Dateien laufen, hängt an Modell und Berechtigungen.",
    ],
    [card(1, 0, 2, "title"), "Terminalorientierter Agent"],
    [
      card(1, 0, 2, "body"),
      "Läuft im Terminal und kann Repository-Dateien und Shell-Werkzeuge innerhalb der konfigurierten Berechtigungen nutzen. Hooks und Skripte binden ihn in bestehende Entwicklungsabläufe ein.",
    ],
    [card(1, 0, 3, "title"), "Open-Source-CLI-Oberfläche"],
    [
      card(1, 0, 3, "body"),
      "Mehrere Modellanbieter in einem Kommandozeilenablauf. Ob das offline oder isoliert läuft, entscheiden Modellendpunkt und lokale Infrastruktur, nicht die CLI allein.",
    ],
    [card(1, 0, 4, "title"), "Agent als VSCode-Erweiterung"],
    [card(1, 0, 4, "eyebrow"), "Cline (früher Claude Dev)"],
    [
      card(1, 0, 4, "body"),
      "Agentenabläufe mit mehreren Anbietern und MCP-Integrationen in VS Code. Bevor du Schreibzugriff erteilst, prüfe Befehlsfreigaben, Anbieter-Konfiguration und Datenpfad.",
    ],
    [card(1, 0, 5, "title"), "Lokale und cloudbasierte Codex-Oberflächen"],
    [
      card(1, 0, 5, "body"),
      "Interaktive lokale Arbeit in CLI und IDE, dazu Hintergrundaufträge in dedizierten Cloud-Umgebungen. Die Oberfläche wählst du nach Umgebungs-, Berechtigungs- und Review-Anforderungen.",
    ],
    [canonical.sections[2].title, "Auswahl nach Aufgabenform"],
    [
      prose(2, 0),
      "Arbeitsablauf, Aufgabe und Kontrollgrenze gehören zusammen:\n\n- **Kleine lokale Änderung, Umsetzung bekannt** → Direkt bearbeiten oder Inline-Vervollständigung, wenn Delegation nichts bringt.\n- **Unbekannte Codebasis** → Erst lesend und interaktiv, Datei- und Aufrufpfade belegen lassen, dann Schreibzugriff.\n- **Sauber spezifizierter Hintergrundauftrag** → Dedizierte Umgebung, ausdrückliche Prüfungen, Diff- oder Pull-Request-Gate.\n- **Terminalzentrierter Ablauf** → Ein CLI-Agent, der die vorhandenen Repository-Befehle innerhalb der Sandbox- und Freigaberegeln ausführt.\n- **Anbieter-, Residenz- oder Offline-Vorgabe** → Modellendpunkt, Telemetrie, Zugangsdaten und Netzwerk als ganzen Pfad prüfen. Ein lokaler Client macht den Ablauf nicht offline.\n\nGeht es um Sicherheit oder Beschaffung, lies die aktuelle Produktdokumentation. Fähigkeiten ändern sich.",
    ],
    [canonical.sections[3].title, "MCP-Server"],
    [
      prose(3, 0),
      "MCP heißt Model Context Protocol. Es standardisiert, wie ein Client die Werkzeuge, Ressourcen und Prompts eines MCP-Servers findet und aufruft.\n\nZugriff erteilt MCP nicht. Was ein Werkzeug lesen oder ändern darf, bestimmen Server, Transport, Zugangsdaten, Client-Richtlinie und deine Freigaben. Eine Datenbank- oder GitHub-Integration sollte nur die engsten brauchbaren Operationen bereitstellen und Lesen von folgenreichem Schreiben trennen.\n\nKonzeptionell:\n\n```\n# 1. Einen geprüften MCP-Server im Client konfigurieren.\n# 2. Der Server veröffentlicht benannte Fähigkeiten mit Eingabeschemata.\n# 3. Der Client kann eine erlaubte Fähigkeit aufrufen, wenn der Auftrag sie benötigt.\n# 4. Authentifizierung, Autorisierung, Protokollierung und Freigabe gelten weiterhin.\n```\n\nMCP kann Copy-and-paste durch strukturierte Aufrufe ersetzen. Es erweitert damit auch die Vertrauensgrenze des Agenten. Jeder konfigurierte Server ist eine Integration mit Zuständigkeit, minimalen Rechten und Prüfbarkeit.",
    ],
    [
      prose(4, 0),
      "Editor- und Terminal-Abläufe können dieselben Repository-Kontrollen nutzen.\n\n- **Diff prüfen:** geänderte Dateien, Tests, Löschungen und erzeugte Artefakte in der normalen Git-Oberfläche.\n- **Repository-Prüfungen ausführen:** die dokumentierten Lint-, Typ-, Test- und Build-Befehle, keine werkzeugeigenen Erfolgsmeldungen.\n- **Kontext bewusst begrenzen:** nur die Dateien und Protokolle, die der Auftrag braucht. Repository- oder Geheimniszugriff wird nicht aus Bequemlichkeit breiter.\n- **Gleichzeitige Arbeit isolieren:** getrennte Branches oder Worktrees gegen Dateikonflikte. Gemeinsame Abhängigkeiten und erzeugter Zustand können trotzdem kollidieren.\n\nDie Integration erhält die Review- und Sicherheitsgates des Projekts. Umgehen ist keine Option.",
    ],
    [prose(5, 0), "Zwei Fragen zur Werkzeugauswahl und zu MCP."],
    [widgetString(0, "title"), "Dieselbe Aufgabe, zwei Werkzeugentscheidungen"],
    [widgetString(0, "badLabel"), "Unnötig aufwendig"],
    [widgetString(0, "goodLabel"), "Passender Umfang"],
    [
      widgetString(0, "bad"),
      "Aufgabe: Einen fehlenden JSDoc-Kommentar an einer Funktion ergänzen.\n\nVorgehen: für eine Änderung, die man an Ort und Stelle prüfen kann, eine Hintergrundumgebung hochfahren und einen eigenen Pull Request öffnen.\n\nAufwand: zusätzlicher Umgebungs- und Review-Zustand, kein Risiko weniger.",
    ],
    [
      widgetString(0, "good"),
      "Aufgabe: Einen fehlenden JSDoc-Kommentar an einer Funktion ergänzen.\n\nVorgehen: Kommentar direkt neben der Funktion schreiben oder erzeugen lassen, gegen die Implementierung prüfen, in die bestehende Änderung aufnehmen.\n\nAufwand: keine getrennte Umgebung, kein zusätzliches Review-Objekt.",
    ],
    [
      widgetString(0, "note"),
      "Jeder delegierte Auftrag kostet Umgebung, Kontext und Review. Zahl den Preis, wenn Isolation, Verifikation oder Parallelität davon profitieren. Sonst bleibt die Änderung im aktuellen Arbeitsablauf.",
    ],
    [
      widgetString(1, "question"),
      "Unbekannte Codebasis, und du musst die Authentifizierung verstehen, bevor du etwas änderst. Welcher Ablauf ist der sicherste erste Schritt?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Sofort Schreib- und Netzwerkzugriff erteilen, damit nichts die Untersuchung bremst.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Lesend beginnen, Datei- und Aufrufpfade belegen lassen und erst nach Prüfung der Spur einen getrennten, abgegrenzten Änderungsauftrag definieren.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Das Produkt mit dem kürzesten Setup nehmen.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Eine Architekturzusammenfassung ohne Repository-Zugriff anfordern.",
    ],
    [
      widgetString(1, "explanation"),
      "Lesende Untersuchung begrenzt versehentliche Änderungen und liefert prüfbare Nachweise. Sind Authentifizierungspfad und Vertrauensgrenzen bekannt, folgt ein eigener Auftrag mit ausdrücklichem Umfang und Prüfungen.",
    ],
    [
      widgetString(2, "question"),
      "Was bringt MCP in einen Coding-Agenten-Ablauf?",
    ],
    [widgetStrings(2, "options")[0], "Code schneller schreiben."],
    [
      widgetStrings(2, "options")[1],
      "Eine Standardschnittstelle zur Ermittlung und zum Aufruf von Fähigkeiten konfigurierter Server unter Beachtung von Authentifizierung und Richtlinien.",
    ],
    [widgetStrings(2, "options")[2], "In einer Sandbox ausgeführt werden."],
    [widgetStrings(2, "options")[3], "Mehr Programmiersprachen verstehen."],
    [
      widgetString(2, "explanation"),
      "MCP standardisiert, wie Fähigkeiten gefunden und aufgerufen werden. Authentifizierung, Autorisierung, Freigabe, Protokollierung und minimale Rechte ersetzt es nicht.",
    ],
  ],
  preserve: [
    "MCP",
    "GitHub Copilot",
    "Cursor",
    "Claude Code",
    "Aider",
    "Codex (OpenAI)",
  ],
});
