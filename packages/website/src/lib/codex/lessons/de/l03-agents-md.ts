import canonical from "../l03-agents-md";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose") {
    throw new Error("Codex L03 translation expected a prose block.");
  }
  return block.markdown;
}

function pullQuote(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "pull-quote") {
    throw new Error("Codex L03 translation expected a pull quote.");
  }
  return block.text;
}

function callout(
  sectionIndex: number,
  blockIndex: number,
  field: "title" | "body",
): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "callout") {
    throw new Error("Codex L03 translation expected a callout.");
  }
  const value = block[field];
  if (!value) {
    throw new Error(`Codex L03 translation expected callout ${field}.`);
  }
  return value;
}

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [canonical.title, "AGENTS.md als Repository-Anweisung"],
    [
      canonical.subtitle,
      "Versionierte Anweisungen geben Codex ausdrückliche Projektregeln, Befehle und Grenzen.",
    ],
    [canonical.hook, "Mache Repository-Regeln ausdrücklich."],
    ["AGENTS.md", "AGENTS.md"],
    ["Convention file", "Konventionsdatei"],
    ["Context management", "Kontextverwaltung"],
    ["CLAUDE.md", "CLAUDE.md"],
    ["Onboarding the agent", "Den Agenten einarbeiten"],
    [
      prose(0, 0),
      "Codex liest `AGENTS.md`-Anweisungen, bevor die Arbeit beginnt. Die Datei ist kein Gedächtnis, sondern versionierter Projektkontext. Sie enthält Regeln, die über mehrere Aufträge hinweg gelten sollen.\n\nDie Anweisungen werden geschichtet ermittelt. Codex kann globale Regeln aus dem Codex-Ausgangsverzeichnis laden und anschließend Projektregeln vom Projektstamm bis zum aktuellen Arbeitsverzeichnis. In jedem Verzeichnis hat `AGENTS.override.md` Vorrang vor `AGENTS.md`. Näher am Arbeitsverzeichnis liegende Anweisungen stehen später und können allgemeinere Regeln überschreiben.\n\nEine Repository-Datei sollte Informationen enthalten, die die Arbeit verändern: genaue Einrichtungs- und Prüfkommandos, Architekturgrenzen, Testerwartungen, bekannte Einschränkungen und freigabepflichtige Aktionen. Auftragsspezifische Ziele und Akzeptanzkriterien gehören weiterhin in den Auftrag.",
    ],
    [
      pullQuote(0, 1),
      "Verwende AGENTS.md für dauerhafte Projektregeln und den Auftrag für die aktuelle Änderung.",
    ],
    ["What to put in it", "Welche Angaben hineingehören"],
    [
      prose(1, 0),
      "AGENTS.md ist Markdown ohne vorgeschriebenes Inhaltsschema. Gliedere die Datei nach Regeln, die der Agent anwenden, und Prüfungen, die er ausführen kann.",
    ],
    ["A real example", "Ein konkretes Beispiel"],
    [
      prose(2, 0),
      "Dies ist ein beispielhaftes `AGENTS.md`, keine allgemeingültige Vorlage. Entscheidend ist seine Konkretheit.\n\n```\n# AGENTS.md\n\n## Zweck des Repositorys\nPayments-Service. Python 3.11, Flask, Postgres, Stripe.\nKritischer Pfad: Endpunkt /checkout.\n\n## Lokal ausführen\n$ make setup       # installiert Abhängigkeiten\n$ make test         # pytest; vor dem Review erforderlich\n$ make lint         # ruff + mypy; ebenfalls erforderlich\n\n## Verbindliche Konventionen\n- Keine unqualifizierten except:-Blöcke. Konkrete Ausnahmen abfangen.\n- Jeder Endpunkt erhält einen Integrationstest in tests/api/.\n- Mit structlog protokollieren, niemals print verwenden. Kontext als kwargs, nicht als f-Strings.\n- Migrationen liegen nummeriert in db/migrations/ und werden nach dem Merge nicht geändert.\n- Wir verwenden pydantic v2. Muster aus v1 kennzeichnen; die Migration läuft.\n\n## Bekannte Einschränkungen\n- tests/integration/test_webhooks.py ist instabil. Vor der Fehlersuche einmal wiederholen.\n- user_service.py ist bereits zu groß. Keine weitere Verantwortung hinzufügen.\n- Tests verwenden produktionsferne Fixtures; niemals Live-Zugangsdaten anfordern oder ausgeben.\n\n## Erfordert ausdrückliche Freigabe\n- Änderungen unter legacy/.\n- Neue Top-Level-Abhängigkeiten.\n- Jede Änderung an der veralteten Datei server_v1.py.\n```",
    ],
    ["Before & after", "Ohne und mit Konventionsdatei"],
    [
      prose(3, 0),
      'Der folgende Vergleich ist illustrativ. Beide Patches beantworten den Auftrag "Ergänze einen /health-Endpunkt, der die Datenbank prüft". Der zweite hält zusätzlich die in `AGENTS.md` genannten Repository-Regeln ein.',
    ],
    ["Both versions work.", "Beide Fassungen können funktionieren."],
    [
      callout(3, 1, "body"),
      "Die zweite Fassung hält zusätzlich die genannten Projektregeln ein: structlog, ein eigener OperationalError-Zweig und ein Integrationstest unter tests/api/. Das Review kann diese Entscheidungen gegen ausdrückliche Anweisungen statt gegen vermutete Vorlieben prüfen.",
    ],
    [
      "One question on writing a good AGENTS.md entry.",
      "Eine Frage zu einem brauchbaren Eintrag in AGENTS.md.",
    ],
    ["Rollout plan", "Einführungsplan"],
    [
      prose(5, 0),
      'Baue die Datei aus beobachteten Projektanforderungen auf:\n\n1. **Mit ausführbaren Grundlagen beginnen.** Nenne Repository-Zweck, Einrichtungsbefehl, erforderliche Prüfungen und Grenzen, die nicht aus dem Code hervorgehen.\n2. **Aus Reviews aktualisieren.** Führt eine wiederkehrende Projektregel zur Ablehnung einer Änderung, ergänze die genaue Regel und den sicheren Weg.\n3. **Mit dem Code prüfen.** Ändern sich Befehle oder Konventionen, aktualisiere die Anweisungsdatei in derselben Änderung.\n\n### Kontextverwaltung: aufnehmen und weglassen\n\nAnweisungsdateien verbrauchen Kontext neben Auftrag und Code. Halte sie konkret:\n\n- **Aufnehmen:** Regeln mit Auswirkungen auf Implementierung, Review oder Sicherheit.\n- **Weglassen:** Marketingtexte, Besprechungsnotizen und Vorlieben ohne prüfbare Wirkung.\n- **Aufnehmen:** genaue Befehle wie `make test`, bei Bedarf mit Voraussetzungen.\n- **Weglassen:** vage Ziele wie "sauberen Code schreiben". Ersetze sie durch beobachtbare Regeln.\n\nLänge ist kein Qualitätsmaß. Behalte Anweisungen, die einen bekannten Fehler verhindern, eine Grenze definieren oder Verifikation ermöglichen.',
    ],
    ["Directory-specific rules.", "Verzeichnisspezifische Regeln."],
    [
      callout(5, 1, "body"),
      "Codex ermittelt je ein Anweisungsdokument pro Verzeichnis vom Projektstamm bis zum aktuellen Arbeitsverzeichnis. Repository-weite Regeln gehören an die Wurzel, engere Regeln nahe an den betroffenen Code. Innerhalb eines Verzeichnisses hat AGENTS.override.md Vorrang.",
    ],
    [
      "Assemble a useful AGENTS.md",
      "Ein brauchbares AGENTS.md zusammenstellen",
    ],
    [
      "Toggle each section on if you'd include it in your team's first draft. Aim for at least four.",
      "Aktiviere die Abschnitte, die in eine erste Teamfassung gehören. Mindestens vier sind sachlich relevant.",
    ],
    [
      "Onboard Codex to a Python payments service in one file.",
      "Codex in einer Datei mit einem Python-Payments-Service vertraut machen.",
    ],
    ["What this repo is", "Zweck des Repositorys"],
    [
      "One paragraph. Business purpose, not architecture.",
      "Ein Absatz zum fachlichen Zweck, nicht zur vollständigen Architektur.",
    ],
    [
      "Payments service. Python 3.11, Flask, Postgres.",
      "Payments-Service. Python 3.11, Flask, Postgres.",
    ],
    [
      "Critical path: /checkout endpoint.",
      "Kritischer Pfad: Endpunkt /checkout.",
    ],
    ["How to run tests & lint", "Tests und Linting ausführen"],
    [
      "Exact commands Codex can run when the environment supports them.",
      "Genaue Befehle, die Codex bei passender Umgebung ausführen kann.",
    ],
    ["Conventions we enforce", "Verbindliche Konventionen"],
    [
      'Not "be clean." Specific rules.',
      'Konkrete Regeln statt "sauber arbeiten".',
    ],
    [
      "No bare except:. Catch specific exceptions.",
      "Keine unqualifizierten except:-Blöcke. Konkrete Ausnahmen abfangen.",
    ],
    [
      "Log with structlog, not print.",
      "Mit structlog protokollieren, nicht mit print.",
    ],
    ["Known quirks", "Bekannte Besonderheiten"],
    [
      "The undocumented minefields. Saves wasted runs.",
      "Nicht offensichtliche Besonderheiten, die unnötige Fehlersuche verhindern.",
    ],
    [
      "test_webhooks.py has a documented intermittent failure; preserve the first log before retrying.",
      "test_webhooks.py ist instabil; einmal wiederholen.",
    ],
    [
      "Do not add responsibilities to user_service.py; a separate extraction is planned.",
      "user_service.py keine weitere Verantwortung hinzufügen; eine getrennte Extraktion ist geplant.",
    ],
    ["Definitely don't", "Nicht ändern"],
    [
      "Hard stops. More useful than style preferences.",
      "Verbindliche Grenzen statt Stilvorlieben.",
    ],
    [
      "Never edit legacy/. Runs in prod, unowned.",
      "legacy/ niemals ohne Freigabe ändern; der Bereich läuft produktiv und ist ohne Zuständigkeit.",
    ],
    [
      "No new top-level deps without asking.",
      "Keine neue Top-Level-Abhängigkeit ohne Freigabe.",
    ],
    ["Our favorite color", "Unsere Lieblingsfarbe"],
    [
      "Not useful. Not even a joke, don't add noise.",
      "Nicht arbeitsrelevant; weglassen.",
    ],
    [
      "Without AGENTS.md, generic, doesn't match repo",
      "Ohne AGENTS.md: generisch und nicht projektspezifisch",
    ],
    [
      "With AGENTS.md, fits the codebase, tests included",
      "Mit AGENTS.md: passend zur Codebasis und mit Test",
    ],
    [
      "# --- tests/api/test_health.py, also added ---",
      "# --- tests/api/test_health.py, ebenfalls ergänzt ---",
    ],
    [
      "Notice the specifics: OperationalError (not generic Exception), structlog with kwargs (not f-strings), 503 not 500, and a test file in tests/api/. None of this was in the task. All of it was in AGENTS.md.",
      "Beachte die konkreten Unterschiede: OperationalError statt Exception, structlog mit kwargs statt f-String, Status 503 statt 500 und ein Test unter tests/api/. Diese Regeln stammen aus AGENTS.md, nicht aus dem einzelnen Auftrag.",
    ],
    [
      'Which is the better AGENTS.md entry for "how we handle errors"?',
      "Welcher AGENTS.md-Eintrag beschreibt die Fehlerbehandlung besser?",
    ],
    [
      '"Handle errors thoughtfully and follow best practices."',
      '"Behandle Fehler umsichtig und beachte Best Practices."',
    ],
    [
      '"Catch specific exceptions, never bare except. Log with structlog. Return 4xx for client errors, 5xx only for server bugs. Don\'t swallow exceptions in endpoints, let the global handler format them."',
      '"Fange konkrete Ausnahmen ab, niemals mit einem unqualifizierten except. Protokolliere mit structlog. Antworte bei Clientfehlern mit 4xx und nur bei Serverfehlern mit 5xx. Endpunkte verschlucken keine Ausnahmen; der globale Handler formatiert sie."',
    ],
    ['"Errors should be handled."', '"Fehler sollen behandelt werden."'],
    [
      '"TODO: document error handling."',
      '"TODO: Fehlerbehandlung dokumentieren."',
    ],
    [
      '"Best practices" does not define observable behavior. Concrete rules name the required exception type, logging API, status-code boundary, and error-formatting path, so both the agent and reviewer can check them.',
      '"Best Practices" definiert kein beobachtbares Verhalten. Konkrete Regeln nennen Ausnahmetyp, Logging-API, Statuscode-Grenze und Fehlerformatierung, sodass Agent und Review sie prüfen können.',
    ],
  ],
  preserve: [
    "make test   # pytest, must pass",
    "make lint   # ruff + mypy",
    "#3B82F6",
    "from flask import Blueprint, jsonify",
    "import logging",
    'health_bp = Blueprint("health", __name__)',
    "log = logging.getLogger(__name__)",
    '@health_bp.route("/health")',
    "def health():",
    "    try:",
    '        db.session.execute("SELECT 1")',
    '        return jsonify({"ok": True})',
    "    except Exception as e:",
    '        log.error(f"health check failed: {e}")',
    '        return jsonify({"ok": False}), 500',
    "from sqlalchemy.exc import OperationalError",
    "import structlog",
    "log = structlog.get_logger()",
    "    except OperationalError as e:",
    '        log.error("health_check_failed", error=str(e))',
    '        return jsonify({"ok": False}), 503',
  ],
});
