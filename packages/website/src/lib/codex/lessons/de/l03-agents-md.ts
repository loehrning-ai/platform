import canonical from "../l03-agents-md";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose") {
    throw new Error("Codex L03 translation expected a prose block.");
  }
  return block.markdown;
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
      "`AGENTS.md` ist versionierter Projektkontext, den Codex liest, bevor die Arbeit beginnt. Hinein gehören Regeln, die für jeden Auftrag gelten.\n\nDie Suche ist geschichtet: globale Regeln aus dem Codex-Ausgangsverzeichnis, danach Projektregeln vom Projektstamm bis ins aktuelle Arbeitsverzeichnis. In jedem Verzeichnis hat `AGENTS.override.md` Vorrang vor `AGENTS.md`, und Dateien näher am Arbeitsverzeichnis können allgemeinere überschreiben.\n\nIn die Repository-Datei gehört, was die Arbeit verändert: exakte Setup- und Prüfkommandos mit ihren Voraussetzungen, Architekturgrenzen, Testerwartungen, bekannte Einschränkungen und freigabepflichtige Aktionen. Ziele und Akzeptanzkriterien des einzelnen Auftrags stehen im Auftrag.",
    ],
    ["What to put in it", "Welche Angaben hineingehören"],
    [
      prose(1, 0),
      "AGENTS.md ist einfaches Markdown ohne festes Schema. Anweisungsdateien verbrauchen Kontext, genau wie Auftrag und Code. Lass Marketingtexte, Besprechungsnotizen, Vorlieben ohne prüfbare Wirkung und vage Ziele wie \"sauberen Code schreiben\" weg. Behalte eine Anweisung, wenn sie einen bekannten Fehler verhindert, eine Grenze zieht oder Verifikation ermöglicht.",
    ],
    ["A real example", "Ein konkretes Beispiel"],
    [
      prose(2, 0),
      "Ein Beispiel-`AGENTS.md`. Jede Zeile ist konkret genug, um sie zu prüfen.\n\n```\n# AGENTS.md\n\n## Zweck des Repositorys\nPayments-Service. Python 3.11, Flask, Postgres, Stripe.\nKritischer Pfad: Endpunkt /checkout.\n\n## Lokal ausführen\n$ make setup       # installiert Abhängigkeiten\n$ make test         # pytest; vor dem Review erforderlich\n$ make lint         # ruff + mypy; ebenfalls erforderlich\n\n## Verbindliche Konventionen\n- Keine unqualifizierten except:-Blöcke. Konkrete Ausnahmen abfangen.\n- Jeder Endpunkt erhält einen Integrationstest in tests/api/.\n- Mit structlog protokollieren, niemals print verwenden. Kontext als kwargs, nicht als f-Strings.\n- Migrationen liegen nummeriert in db/migrations/ und werden nach dem Merge nicht geändert.\n- Wir verwenden pydantic v2. Muster aus v1 kennzeichnen; die Migration läuft.\n\n## Bekannte Einschränkungen\n- tests/integration/test_webhooks.py ist instabil. Vor der Fehlersuche einmal wiederholen.\n- user_service.py ist bereits zu groß. Keine weitere Verantwortung hinzufügen.\n- Tests verwenden produktionsferne Fixtures; niemals Live-Zugangsdaten anfordern oder ausgeben.\n\n## Erfordert ausdrückliche Freigabe\n- Änderungen unter legacy/.\n- Neue Top-Level-Abhängigkeiten.\n- Jede Änderung an der veralteten Datei server_v1.py.\n```",
    ],
    ["Before & after", "Ohne und mit Konventionsdatei"],
    [
      prose(3, 0),
      "Beide Patches unten erfüllen den Auftrag \"Ergänze einen /health-Endpunkt, der die Datenbank prüft\" und funktionieren. Nur der zweite hält die Regeln aus `AGENTS.md` ein.",
    ],
    ["One question at the end of the lesson.", "Eine Frage am Ende der Lektion."],
    ["Rollout plan", "Einführungsplan"],
    [
      prose(5, 0),
      "1. **Mit ausführbaren Grundlagen anfangen:** Zweck des Repositorys, Setup-Befehl, Pflichtprüfungen und Grenzen, die nicht im Code stehen.\n2. **Aus Reviews nachziehen.** Scheitert eine Änderung an einer wiederkehrenden Projektregel, kommt die exakte Regel samt sicherem Weg in die Datei.\n3. **Mit dem Code ändern.** Ändern sich Befehle oder Konventionen, ändert sich die Datei in derselben Änderung.",
    ],
    [
      "Assemble a useful AGENTS.md",
      "Ein brauchbares AGENTS.md zusammenstellen",
    ],
    [
      "Switch on each section you'd put in a first draft. Aim for at least four.",
      "Schalte jeden Abschnitt ein, der in einen ersten Entwurf gehört. Ziel: mindestens vier.",
    ],
    [
      "Onboard Codex to a Python payments service in one file.",
      "Codex mit einer einzigen Datei in einen Python-Payments-Service einarbeiten.",
    ],
    ["What this repo is", "Zweck des Repositorys"],
    [
      "One paragraph on the business purpose.",
      "Ein Absatz zum fachlichen Zweck.",
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
      'Specific rules instead of "be clean".',
      'Konkrete Regeln statt "sauber arbeiten".',
    ],
    [
      "No bare except:. Catch specific exceptions.",
      "Keine unqualifizierten except:-Blöcke. Konkrete Ausnahmen abfangen.",
    ],
    [
      "Log with structlog, not print.",
      "Mit structlog statt print protokollieren.",
    ],
    ["Known quirks", "Bekannte Besonderheiten"],
    [
      "Undocumented traps that waste runs.",
      "Undokumentierte Fallen, die Läufe kosten.",
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
      "Hard stops the agent must respect.",
      "Harte Grenzen, die der Agent einhalten muss.",
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
      "Noise. Leave it out.",
      "Rauschen, weglassen.",
    ],
    [
      "Without AGENTS.md: generic code",
      "Ohne AGENTS.md: generischer Code",
    ],
    [
      "With AGENTS.md: repo conventions and a test",
      "Mit AGENTS.md: Repo-Konventionen und ein Test",
    ],
    [
      "# --- tests/api/test_health.py, also added ---",
      "# --- tests/api/test_health.py, ebenfalls ergänzt ---",
    ],
    [
      "OperationalError instead of Exception, structlog with kwargs, 503 instead of 500 and a test in tests/api/ all come from AGENTS.md. The task named none of them.",
      "OperationalError statt Exception, structlog mit kwargs, 503 statt 500 und ein Test unter tests/api/ stammen alle aus AGENTS.md. Der Auftrag nannte nichts davon.",
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
      "\"Catch specific exceptions. Log with structlog. 4xx for client errors, 5xx for server bugs. Let the global handler format errors.\"",
      "\"Fange konkrete Ausnahmen ab. Protokolliere mit structlog. 4xx bei Clientfehlern, 5xx bei Serverfehlern. Der globale Handler formatiert Fehler.\"",
    ],
    ['"Errors should be handled."', '"Fehler sollen behandelt werden."'],
    [
      '"TODO: document error handling."',
      '"TODO: Fehlerbehandlung dokumentieren."',
    ],
    [
      "\"Best practices\" defines no observable behavior. The specific entry names exception type, logging API, status-code boundary and formatting path, so agent and reviewer can check each.",
      "\"Best Practices\" beschreibt kein beobachtbares Verhalten. Der konkrete Eintrag nennt Ausnahmetyp, Logging-API, Statuscode-Grenze und Formatierungsweg, also können Agent und Reviewerin jeden Punkt prüfen.",
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
