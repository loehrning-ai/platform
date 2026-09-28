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
      "Vergleiche Interaktionsmodell, Ausführungsgrenze, Anbietervorgaben und Review-Pfad, bevor du wählst.",
    ],
    [canonical.hook, "Wähle nach Betriebsanforderungen."],
    [canonical.keyConcepts[0], "Werkzeuglandschaft"],
    [canonical.keyConcepts[2], "Passung zur Aufgabenform"],
    [canonical.keyConcepts[3], "IDE-Integration"],
    [canonical.sections[0].title, "Die Landschaft"],
    [
      prose(0, 0),
      "Coding-Werkzeuge mischen Inline-Vervollständigung, Editor-Chat, Terminal- und IDE-Agenten und Hintergrundaufträge, die einen Diff oder Pull Request liefern. Wähle danach, was das Werkzeug liest, wo Befehle laufen, welche Schreibzugriffe eine Freigabe brauchen, wie Netzwerkzugriff, Modell- und Datenrichtlinie geregelt sind und wie Ergebnisse in den Review kommen.",
    ],
    [canonical.sections[1].title, "Sechs beispielhafte Werkzeugoberflächen"],
    [card(1, 0, 0, "title"), "Editor- und GitHub-Abläufe"],
    [
      card(1, 0, 0, "body"),
      "Vervollständigung, Chat und Agenten in Editoren und auf GitHub. Prüfe Zugriff und Review-Kontrollen pro Modus.",
    ],
    [card(1, 0, 1, "title"), "KI-orientierter Editor"],
    [
      card(1, 0, 1, "body"),
      "Eine IDE, die Editor-Kontext, Chat und Agentenläufe für Arbeit über mehrere Dateien verbindet.",
    ],
    [card(1, 0, 2, "title"), "Terminalorientierter Agent"],
    [
      card(1, 0, 2, "body"),
      "Nutzt Repository-Dateien und Shell-Werkzeuge im Terminal, innerhalb der eingestellten Berechtigungen. Hooks binden ihn in bestehende Abläufe ein.",
    ],
    [card(1, 0, 3, "title"), "Open-Source-CLI"],
    [
      card(1, 0, 3, "body"),
      "Eine CLI für viele Modellanbieter. Offline-Betrieb hängt an Modellendpunkt und lokaler Infrastruktur.",
    ],
    [card(1, 0, 4, "title"), "Agent als Editor-Erweiterung"],
    [card(1, 0, 4, "eyebrow"), "Cline (früher Claude Dev)"],
    [
      card(1, 0, 4, "body"),
      "Agenten mit mehreren Anbietern und MCP in VS Code. Prüfe Freigaben, Anbieter-Konfiguration und Datenpfad, bevor du Schreibzugriff erteilst.",
    ],
    [card(1, 0, 5, "title"), "Lokale und cloudbasierte Codex-Oberflächen"],
    [
      card(1, 0, 5, "body"),
      "Lokale Arbeit in CLI und IDE plus Hintergrundaufträge in dedizierten Cloud-Umgebungen.",
    ],
    [canonical.sections[2].title, "Auswahl nach Aufgabenform"],
    [
      prose(2, 0),
      "Wähle den Ablauf nach Aufgabe und Kontrollgrenze:\n\n- **Kleine lokale Änderung, Umsetzung bekannt** → direkt bearbeiten oder Inline-Vervollständigung.\n- **Unbekannte Codebasis** → erst lesend und interaktiv, mit belegten Datei- und Aufrufpfaden, dann Änderungen.\n- **Sauber spezifizierter Hintergrundauftrag** → dedizierte Umgebung, ausdrückliche Prüfungen, Diff- oder Pull-Request-Gate.\n- **Terminalzentrierter Ablauf** → ein CLI-Agent, der die Repository-Befehle innerhalb der Sandbox- und Freigaberegeln ausführt.\n- **Anbieter-, Residenz- oder Offline-Vorgabe** → Modellendpunkt, Telemetrie, Zugangsdaten und Netzwerkpfad prüfen; ein lokaler Client allein macht den Ablauf nicht offline.\n\nFür Sicherheits- oder Beschaffungsentscheidungen lies die aktuelle Produktdokumentation.",
    ],
    [canonical.sections[3].title, "MCP-Server"],
    [
      prose(3, 0),
      "MCP (Model Context Protocol) standardisiert, wie ein Client die Werkzeuge, Ressourcen und Prompts eines MCP-Servers findet und aufruft. Zugriff erteilt es nicht: Was ein Werkzeug lesen oder ändern darf, bestimmen Server, Transport, Zugangsdaten, Client-Richtlinie und deine Freigaben. Stell nur die engsten brauchbaren Operationen bereit und trenne Lesen von folgenreichem Schreiben.\n\n```\n# 1. Einen geprüften MCP-Server im Client konfigurieren.\n# 2. Der Server veröffentlicht benannte Fähigkeiten mit Eingabeschemata.\n# 3. Der Client kann eine erlaubte Fähigkeit aufrufen, wenn der Auftrag sie benötigt.\n# 4. Authentifizierung, Autorisierung, Protokollierung und Freigabe gelten weiterhin.\n```\n\nJeder konfigurierte Server erweitert die Vertrauensgrenze des Agenten und braucht eine Zuständigkeit, minimale Rechte und ein Audit-Protokoll.",
    ],
    [
      prose(4, 0),
      "Editor- und Terminal-Abläufe nutzen dieselben Repository-Kontrollen:\n\n- **Diff prüfen:** geänderte Dateien, Tests, Löschungen und erzeugte Artefakte im normalen Git-Review.\n- **Repository-Prüfungen ausführen:** die dokumentierten Lint-, Typ-, Test- und Build-Befehle, statt der Erfolgsmeldung des Werkzeugs zu trauen.\n- **Kontext begrenzen:** nur die Dateien und Protokolle, die der Auftrag braucht; kein breiterer Repository- oder Geheimniszugriff aus Bequemlichkeit.\n- **Gleichzeitige Arbeit isolieren:** getrennte Branches oder Worktrees verringern Dateikonflikte; gemeinsame Abhängigkeiten und erzeugter Zustand können trotzdem kollidieren.",
    ],
    [prose(5, 0), "Fragen am Ende der Lektion."],
    [widgetString(0, "title"), "Dieselbe Aufgabe, zwei Werkzeugentscheidungen"],
    [widgetString(0, "badLabel"), "Unnötig aufwendig"],
    [widgetString(0, "goodLabel"), "Passender Umfang"],
    [
      widgetString(0, "bad"),
      "Aufgabe: Einen fehlenden JSDoc-Kommentar an einer Funktion ergänzen.\n\nVorgehen: Hintergrundumgebung und eigener Pull Request für eine Änderung, die man an Ort und Stelle prüfen kann.\n\nAufwand: zusätzlicher Umgebungs- und Review-Zustand bei gleichem Risiko.",
    ],
    [
      widgetString(0, "good"),
      "Vorgehen: Kommentar neben der Funktion schreiben, gegen den Code prüfen, in die laufende Änderung aufnehmen.\n\nAufwand: keiner zusätzlich.",
    ],
    [
      widgetString(0, "note"),
      "Delegiere, wenn zusätzliche Umgebung, Kontext und Review dir Isolation, Verifikation oder Parallelität bringen.",
    ],
    [
      widgetString(1, "question"),
      "Bevor du eine unbekannte Codebasis änderst, musst du ihre Authentifizierung verstehen. Was ist der sicherste erste Schritt?",
    ],
    [
      widgetStrings(1, "options")[0],
      "Sofort Schreib- und Netzwerkzugriff erteilen, damit nichts die Untersuchung bremst.",
    ],
    [
      widgetStrings(1, "options")[1],
      "Lesend untersuchen, Dateien belegen lassen, dann eine eigene Änderung abgrenzen.",
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
      "Lesende Untersuchung vermeidet versehentliche Änderungen und liefert prüfbare Nachweise. Sind Authentifizierungspfad und Vertrauensgrenzen bekannt, folgt ein eigener Auftrag mit ausdrücklichen Prüfungen.",
    ],
    [
      widgetString(2, "question"),
      "Was bringt MCP in einen Coding-Agenten-Ablauf?",
    ],
    [widgetStrings(2, "options")[0], "Schnellere Codeerzeugung."],
    [
      widgetStrings(2, "options")[1],
      "Einen Standard, um Fähigkeiten konfigurierter Server zu finden und aufzurufen, im Rahmen von Authentifizierung und Richtlinien.",
    ],
    [widgetStrings(2, "options")[2], "Eine Sandbox-Laufzeitumgebung."],
    [widgetStrings(2, "options")[3], "Unterstützung für mehr Programmiersprachen."],
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
