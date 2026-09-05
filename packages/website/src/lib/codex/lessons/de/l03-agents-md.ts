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
    [canonical.hook, "Schreib die Repository-Regeln auf."],
    ["AGENTS.md", "AGENTS.md"],
    ["Convention file", "Konventionsdatei"],
    ["Context management", "Kontextverwaltung"],
    ["CLAUDE.md", "CLAUDE.md"],
    ["Onboarding the agent", "Den Agenten einarbeiten"],
    [
      prose(0, 0),
      "Codex liest `AGENTS.md`, bevor die Arbeit beginnt. Die Datei ist kein Gedächtnis. Sie ist versionierter Projektkontext für Regeln, die über viele Aufträge hinweg gelten sollen.\n\nDie Anweisungen werden geschichtet gesucht. Codex kann globale Regeln aus dem Codex-Ausgangsverzeichnis laden, danach Projektregeln vom Projektstamm bis ins aktuelle Arbeitsverzeichnis. In jedem Verzeichnis schlägt `AGENTS.override.md` die `AGENTS.md`. Was näher am Arbeitsverzeichnis liegt, kommt später und kann allgemeinere Regeln überschreiben.\n\nIn die Repository-Datei gehört, was die Arbeit verändert, also exakte Setup- und Prüfkommandos, Architekturgrenzen, Testerwartungen, bekannte Einschränkungen und freigabepflichtige Aktionen. Ziele und Akzeptanzkriterien des einzelnen Auftrags gehören weiterhin in den Auftrag.",
    ],
    [
      pullQuote(0, 1),
      "AGENTS.md für dauerhafte Projektregeln. Der Auftrag für die aktuelle Änderung.",
    ],
    ["What to put in it", "Welche Angaben hineingehören"],
    [
      prose(1, 0),
      "AGENTS.md ist Markdown, ohne Schema. Zwei Fragen ordnen die Datei: Welche Regeln kann der Agent anwenden? Welche Prüfungen kann er ausführen?",
    ],
    ["A real example", "Ein konkretes Beispiel"],
    [
      prose(2, 0),
      "Ein Beispiel-`AGENTS.md`, keine Vorlage. Was es brauchbar macht, ist seine Konkretheit.\n\n```\n# AGENTS.md\n\n## Zweck des Repositorys\nPayments-Service. Python 3.11, Flask, Postgres, Stripe.\nKritischer Pfad: Endpunkt /checkout.\n\n## Lokal ausführen\n$ make setup       # installiert Abhängigkeiten\n$ make test         # pytest; vor dem Review erforderlich\n$ make lint         # ruff + mypy; ebenfalls erforderlich\n\n## Verbindliche Konventionen\n- Keine unqualifizierten except:-Blöcke. Konkrete Ausnahmen abfangen.\n- Jeder Endpunkt erhält einen Integrationstest in tests/api/.\n- Mit structlog protokollieren, niemals print verwenden. Kontext als kwargs, nicht als f-Strings.\n- Migrationen liegen nummeriert in db/migrations/ und werden nach dem Merge nicht geändert.\n- Wir verwenden pydantic v2. Muster aus v1 kennzeichnen; die Migration läuft.\n\n## Bekannte Einschränkungen\n- tests/integration/test_webhooks.py ist instabil. Vor der Fehlersuche einmal wiederholen.\n- user_service.py ist bereits zu groß. Keine weitere Verantwortung hinzufügen.\n- Tests verwenden produktionsferne Fixtures; niemals Live-Zugangsdaten anfordern oder ausgeben.\n\n## Erfordert ausdrückliche Freigabe\n- Änderungen unter legacy/.\n- Neue Top-Level-Abhängigkeiten.\n- Jede Änderung an der veralteten Datei server_v1.py.\n```",
    ],
    ["Before & after", "Ohne und mit Konventionsdatei"],
    [
      prose(3, 0),
      'Ein illustrativer Vergleich. Zwei Patches, ein Auftrag: "Ergänze einen /health-Endpunkt, der die Datenbank prüft". Nur der zweite hält die Repository-Regeln aus `AGENTS.md` ein.',
    ],
    ["Both versions work.", "Beide Fassungen funktionieren."],
    [
      callout(3, 1, "body"),
      "Die zweite hält zusätzlich die Projektregeln ein und ergänzt structlog, einen eigenen OperationalError-Zweig und einen Integrationstest unter tests/api/. Die Reviewerin prüft diese Entscheidungen gegen geschriebene Anweisungen statt gegen vermutete Vorlieben.",
    ],
    [
      "One question on writing a good AGENTS.md entry.",
      "Eine Frage dazu, was einen brauchbaren AGENTS.md-Eintrag ausmacht.",
    ],
    ["Rollout plan", "Einführungsplan"],
    [
      prose(5, 0),
      'Baue die Datei aus dem auf, was das Projekt tatsächlich verlangt.\n\n1. **Mit ausführbaren Grundlagen anfangen.** Zweck des Repositorys, Setup-Befehl, Pflichtprüfungen und Grenzen, die nicht im Code stehen.\n2. **Aus Reviews nachziehen.** Kippt eine Änderung wegen einer wiederkehrenden Projektregel, kommt die exakte Regel samt sicherem Weg in die Datei.\n3. **Mit dem Code prüfen.** Ändern sich Befehle oder Konventionen, ändert sich die Anweisungsdatei in derselben Änderung.\n\n### Kontextverwaltung: aufnehmen und weglassen\n\nAnweisungsdateien kosten Kontext, genau wie Auftrag und Code. Halte sie konkret.\n\n- **Aufnehmen:** Regeln mit Wirkung auf Implementierung, Review oder Sicherheit.\n- **Weglassen:** Marketingtexte, Besprechungsnotizen, Vorlieben ohne prüfbare Wirkung.\n- **Aufnehmen:** exakte Befehle wie `make test`, bei Bedarf mit Voraussetzungen.\n- **Weglassen:** vage Ziele wie "sauberen Code schreiben". Ersetze sie durch beobachtbare Regeln.\n\nLänge sagt nichts über Qualität. Behalte, was einen bekannten Fehler verhindert, eine Grenze zieht oder Verifikation ermöglicht.',
    ],
    ["Directory-specific rules.", "Verzeichnisspezifische Regeln."],
    [
      callout(5, 1, "body"),
      "Codex sammelt pro Verzeichnis ein Anweisungsdokument, vom Projektstamm bis zum Arbeitsverzeichnis. Repository-weite Regeln gehören an die Wurzel, engere Regeln neben den betroffenen Code. Innerhalb eines Verzeichnisses gewinnt AGENTS.override.md.",
    ],
    [
      "Assemble a useful AGENTS.md",
      "Ein brauchbares AGENTS.md zusammenstellen",
    ],
    [
      "Toggle each section on if you'd include it in your team's first draft. Aim for at least four.",
      "Schalte jeden Abschnitt ein, der in den ersten Entwurf deines Teams gehört. Ziel: mindestens vier.",
    ],
    [
      "Onboard Codex to a Python payments service in one file.",
      "Codex mit einer einzigen Datei in einen Python-Payments-Service einarbeiten.",
    ],
    ["What this repo is", "Zweck des Repositorys"],
    [
      "One paragraph. Business purpose, not architecture.",
      "Ein Absatz. Fachlicher Zweck, nicht Architektur.",
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
      "Exakte Befehle, die Codex ausführen kann, wenn die Umgebung mitspielt.",
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
      "Die undokumentierten Minenfelder. Spart verschwendete Läufe.",
    ],
    [
      "test_webhooks.py has a documented intermittent failure; preserve the first log before retrying.",
      "test_webhooks.py ist instabil; erstes Protokoll sichern, dann einmal wiederholen.",
    ],
    [
      "Do not add responsibilities to user_service.py; a separate extraction is planned.",
      "user_service.py bekommt keine weitere Verantwortung; eine getrennte Extraktion ist geplant.",
    ],
    ["Definitely don't", "Nicht ändern"],
    [
      "Hard stops. More useful than style preferences.",
      "Harte Grenzen, nützlicher als Stilvorlieben.",
    ],
    [
      "Never edit legacy/. Runs in prod, unowned.",
      "legacy/ nie ohne Freigabe anfassen. Läuft in Prod, niemand ist zuständig.",
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
      "Ohne AGENTS.md: generisch, passt nicht zum Repo",
    ],
    [
      "With AGENTS.md, fits the codebase, tests included",
      "Mit AGENTS.md: passt zur Codebasis, Test inklusive",
    ],
    [
      "# --- tests/api/test_health.py, also added ---",
      "# --- tests/api/test_health.py, ebenfalls ergänzt ---",
    ],
    [
      "Notice the specifics: OperationalError (not generic Exception), structlog with kwargs (not f-strings), 503 not 500, and a test file in tests/api/. None of this was in the task. All of it was in AGENTS.md.",
      "Schau auf die Details: OperationalError statt Exception, structlog mit kwargs statt f-String, 503 statt 500, ein Test unter tests/api/. Nichts davon stand im Auftrag. Alles stand in AGENTS.md.",
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
      '"Best Practices" beschreibt kein beobachtbares Verhalten. Die konkrete Regel nennt Ausnahmetyp, Logging-API, Statuscode-Grenze und Fehlerformatierung, und Agent wie Reviewerin können jede davon prüfen.',
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
