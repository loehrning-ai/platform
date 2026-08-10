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
      "Vergleiche Interaktionsmodell, Ausführungsgrenze, Anbieteranforderungen und Review-Pfad vor der Werkzeugwahl.",
    ],
    [canonical.hook, "Nach Betriebsanforderungen auswählen."],
    [canonical.keyConcepts[0], "Werkzeuglandschaft"],
    [canonical.keyConcepts[2], "Passung zur Aufgabenform"],
    [canonical.keyConcepts[3], "IDE-Integration"],
    [canonical.sections[0].title, "Die Landschaft"],
    [
      prose(0, 0),
      "Coding-Werkzeuge kombinieren mehrere Interaktionsmodelle: Inline-Vervollständigung, Editor-Chat, Terminal-Agenten, IDE-Agenten und Hintergrundaufträge, die ein Diff oder einen Pull Request liefern. Produktfähigkeiten ändern sich; mehrere Werkzeuge decken inzwischen mehr als eine Kategorie ab.\n\nWähle anhand betrieblicher Anforderungen statt einer statischen Anbieterrangliste. Prüfe, welchen Repository-Kontext das Werkzeug lesen kann, wo Befehle ausgeführt werden, welche Schreibzugriffe eine Freigabe verlangen, ob Netzwerkzugriff besteht, wie Modell- und Datenrichtlinien konfiguriert sind und wie das Ergebnis in den Review gelangt.\n\nEntscheidend sind Arbeitsablauf und Kontrollen, nicht allein der Produktname.",
    ],
    [canonical.sections[1].title, "Sechs beispielhafte Werkzeugoberflächen"],
    [card(1, 0, 0, "title"), "Editor- und GitHub-Abläufe"],
    [
      card(1, 0, 0, "body"),
      "Bietet Inline-Vervollständigung, Chat und Agentenabläufe in unterstützten Editoren und GitHub-Oberflächen. Prüfe Repository-Zugriff, Ausführungsort und Review-Kontrollen für den verwendeten Modus.",
    ],
    [card(1, 0, 1, "title"), "KI-orientierter Editor"],
    [
      card(1, 0, 1, "body"),
      "Verbindet Editor-Kontext, Chat und Agentenausführung in einer IDE. Interaktive Repository-Untersuchung und Änderungen über mehrere Dateien hängen vom gewählten Modell und den Berechtigungen ab.",
    ],
    [card(1, 0, 2, "title"), "Terminalorientierter Agent"],
    [
      card(1, 0, 2, "body"),
      "Läuft im Terminal und kann Repository-Dateien sowie Shell-Werkzeuge innerhalb konfigurierter Berechtigungen verwenden. Hooks und Skripte binden ihn in bestehende Entwicklungsabläufe ein.",
    ],
    [card(1, 0, 3, "title"), "Open-Source-CLI-Oberfläche"],
    [
      card(1, 0, 3, "body"),
      "Unterstützt mehrere Modellanbieter in einem Kommandozeilenablauf. Offline- oder isolierter Betrieb hängt vom gewählten Modellendpunkt und der lokalen Infrastruktur ab, nicht allein von der CLI.",
    ],
    [card(1, 0, 4, "title"), "Agent als VSCode-Erweiterung"],
    [card(1, 0, 4, "eyebrow"), "Cline (früher Claude Dev)"],
    [
      card(1, 0, 4, "body"),
      "Ergänzt VS Code um Agentenabläufe mit mehreren Anbietern und MCP-Integrationen. Prüfe Befehlsfreigaben, Anbieter-Konfiguration und Datenpfad, bevor Schreibzugriff erteilt wird.",
    ],
    [card(1, 0, 5, "title"), "Lokale und cloudbasierte Codex-Oberflächen"],
    [
      card(1, 0, 5, "body"),
      "Codex unterstützt interaktive lokale Arbeit in CLI und IDE sowie Hintergrundaufträge in dedizierten Cloud-Umgebungen. Wähle die Oberfläche nach Umgebungs-, Berechtigungs- und Review-Anforderungen.",
    ],
    [canonical.sections[2].title, "Auswahl nach Aufgabenform"],
    [
      prose(2, 0),
      "Ordne Arbeitsablauf, Aufgabe und Kontrollgrenze einander zu:\n\n- **Kleine lokale Änderung mit bekannter Umsetzung** → Direktbearbeitung oder Inline-Vervollständigung, wenn Delegation keinen zusätzlichen Nutzen bringt.\n- **Unbekannte Codebasis** → Zunächst lesend-interaktiv arbeiten und Datei- sowie Aufrufpfade belegen lassen, bevor Schreibzugriff besteht.\n- **Klar spezifizierter Hintergrundauftrag** → Dedizierte Umgebung, ausdrückliche Prüfungen und Diff- oder Pull-Request-Gate verwenden.\n- **Terminalzentrierter Ablauf** → Einen CLI-Agenten einsetzen, der bestehende Repository-Befehle innerhalb der erforderlichen Sandbox- und Freigaberegeln ausführt.\n- **Anbieter-, Residenz- oder Offline-Vorgabe** → Gesamten Pfad aus Modellendpunkt, Telemetrie, Zugangsdaten und Netzwerk prüfen. Ein lokaler Client macht den Ablauf nicht automatisch offline.\n\nBei Sicherheits- oder Beschaffungsentscheidungen aktuelle Produktdokumentation prüfen; Fähigkeiten ändern sich.",
    ],
    [canonical.sections[3].title, "MCP-Server"],
    [
      prose(3, 0),
      "MCP steht für Model Context Protocol. Es standardisiert, wie ein Client Werkzeuge, Ressourcen und Prompts ermittelt und aufruft, die ein MCP-Server bereitstellt.\n\nMCP erteilt selbst keinen Zugriff. Server, Transport, Zugangsdaten, Client-Richtlinie und Benutzerfreigaben bestimmen, was ein Werkzeug lesen oder ändern darf. Eine Datenbank- oder GitHub-Integration sollte nur die engsten brauchbaren Operationen bereitstellen und Lesezugriffe von folgenreichen Schreibzugriffen trennen.\n\nKonzeptionell:\n\n```\n# 1. Einen geprüften MCP-Server im Client konfigurieren.\n# 2. Der Server veröffentlicht benannte Fähigkeiten mit Eingabeschemata.\n# 3. Der Client kann eine erlaubte Fähigkeit aufrufen, wenn der Auftrag sie benötigt.\n# 4. Authentifizierung, Autorisierung, Protokollierung und Freigabe gelten weiterhin.\n```\n\nMCP kann manuelle Kopierabläufe durch strukturierte Aufrufe ersetzen, erweitert aber auch die Vertrauensgrenze des Agenten. Jeder konfigurierte Server braucht Zuständigkeit, minimale Rechte und Prüfbarkeit.",
    ],
    [
      prose(4, 0),
      "Editor- und Terminal-Abläufe können dieselben Repository-Kontrollen verwenden:\n\n- **Diff prüfen:** Geänderte Dateien, Tests, Löschungen und erzeugte Artefakte in der normalen Git-Oberfläche untersuchen.\n- **Repository-Prüfungen ausführen:** Dokumentierte Lint-, Typ-, Test- und Build-Befehle verwenden statt werkzeugspezifischer Erfolgsmeldungen.\n- **Kontext bewusst begrenzen:** Nur die für den Auftrag erforderlichen Dateien und Protokolle bereitstellen; Repository- oder Geheimniszugriff nicht aus Bequemlichkeit erweitern.\n- **Gleichzeitige Arbeit isolieren:** Getrennte Branches oder Worktrees reduzieren Dateikonflikte. Gemeinsame Abhängigkeiten und erzeugter Zustand können dennoch kollidieren.\n\nDie Integration muss Review- und Sicherheitsgates des Projekts erhalten, nicht umgehen.",
    ],
    [prose(5, 0), "Zwei Fragen zur Werkzeugauswahl und zu MCP."],
    [widgetString(0, "title"), "Dieselbe Aufgabe, zwei Werkzeugentscheidungen"],
    [widgetString(0, "badLabel"), "Unnötig aufwendig"],
    [widgetString(0, "goodLabel"), "Passender Umfang"],
    [
      widgetString(0, "bad"),
      "Aufgabe: Einen fehlenden JSDoc-Kommentar an einer Funktion ergänzen.\n\nVorgehen: Eine Hintergrundumgebung und einen eigenen Pull Request für eine Änderung erzeugen, die direkt an Ort und Stelle geprüft werden kann.\n\nAufwand: zusätzlicher Umgebungs- und Review-Zustand ohne entsprechende Risikoreduktion.",
    ],
    [
      widgetString(0, "good"),
      "Aufgabe: Einen fehlenden JSDoc-Kommentar an einer Funktion ergänzen.\n\nVorgehen: Den Kommentar neben der Funktion bearbeiten oder erzeugen, gegen die Implementierung prüfen und in die bestehende Änderung aufnehmen.\n\nAufwand: keine getrennte Ausführungsumgebung und kein zusätzliches Review-Objekt.",
    ],
    [
      widgetString(0, "note"),
      "Delegierte Aufträge verursachen zusätzlichen Umgebungs-, Kontext- und Review-Aufwand. Nutze diese Trennung, wenn sie Isolation, Verifikation oder Parallelität verbessert; sonst bleibt die Änderung im aktuellen Arbeitsablauf.",
    ],
    [
      widgetString(1, "question"),
      "Du musst die Authentifizierung in einer unbekannten Codebasis verstehen, bevor du Änderungen vornimmst. Welcher Ablauf ist der sicherste erste Schritt?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Sofort Schreib- und Netzwerkzugriff erteilen, damit die Untersuchung nicht eingeschränkt ist.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Lesend beginnen, Datei- und Aufrufpfade belegen lassen und erst nach Prüfung der Spur einen getrennten, abgegrenzten Änderungsauftrag definieren.",
    ],
    [
      widgetStrings(1, "options")[2],
      "Das Produkt mit dem kürzesten Einrichtungsablauf auswählen.",
    ],
    [
      widgetStrings(1, "options")[3],
      "Eine Architekturzusammenfassung ohne Repository-Zugriff anfordern.",
    ],
    [
      widgetString(1, "explanation"),
      "Lesende Untersuchung begrenzt versehentliche Änderungen und liefert prüfbare Nachweise. Sobald Authentifizierungspfad und Vertrauensgrenzen bekannt sind, folgt ein eigener Auftrag mit ausdrücklichem Umfang und Prüfungen.",
    ],
    [
      widgetString(2, "question"),
      "Was ergänzt MCP zu einem Coding-Agenten-Ablauf?",
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
      "MCP standardisiert Ermittlung und Aufruf von Fähigkeiten. Es ersetzt weder Authentifizierung noch Autorisierung, Freigabe, Protokollierung oder ein Berechtigungsmodell mit minimalen Rechten.",
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
