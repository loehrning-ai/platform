import canonical from "../l01-mental-model";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    ["What Codex Actually Is", "Was Codex tatsächlich ist"],
    [
      canonical.subtitle,
      "Ein auftragsorientierter Coding-Agent, der ein Repository untersuchen, Dateien ändern, Prüfungen ausführen und Änderungen zur Kontrolle vorlegen kann.",
    ],
    ["Agent, not assistant.", "Agent statt Assistent."],
    ["Autonomous agent", "Autonomer Agent"],
    ["Sandbox", "Sandbox"],
    ["Task contract", "Auftragsrahmen"],
    ["Vague spec", "Unklare Spezifikation"],
    ["AGENTS.md", "AGENTS.md"],
    ["An agent, not an assistant", "Ein Agent, kein Assistent"],
    [
      canonical.sections[0].blocks[0]?.kind === "prose"
        ? canonical.sections[0].blocks[0].markdown
        : "",
      "Codex ist ein **auftragsorientierter Coding-Agent**. Er kann lokal in CLI oder IDE sowie in dedizierten Cloud-Umgebungen arbeiten. Oberfläche und Berechtigungsmodell unterscheiden sich, der Arbeitsablauf ist ähnlich:\n\n1. Codex erhält den Auftrag und den Kontext, der in der aktuellen Sitzung und im Repository verfügbar ist.\n2. Der Agent arbeitet innerhalb konfigurierter Grenzen für Dateisystem, Befehle, Freigaben und Netzwerk.\n3. Er untersucht den relevanten Code und legt eine Folge von Änderungen fest.\n4. Er ändert Dateien, führt verfügbare Prüfungen aus, liest deren Ausgabe und überarbeitet den Stand bei Bedarf.\n5. Er liefert eine Zusammenfassung sowie ein **Diff** oder einen Patch zur Prüfung. Ein Cloud-Auftrag kann bei entsprechender Konfiguration auch einen Pull Request öffnen.\n\nDas ist Delegation mit Prüfpunkten. Lokale Sitzungen können interaktiv sein; Cloud-Aufträge können im Hintergrund weiterlaufen. In beiden Fällen muss das Ergebnis gegen Auftrag und Repository-Nachweise geprüft werden.",
    ],
    [
      canonical.sections[0].blocks[1]?.kind === "pull-quote"
        ? canonical.sections[0].blocks[1].text
        : "",
      "Denke an einen abgegrenzten Entwicklungsauftrag mit Prüfung, nicht an Autovervollständigung am Cursor.",
    ],
    [
      canonical.sections[0].blocks[2]?.kind === "prose"
        ? canonical.sections[0].blocks[2].markdown
        : "",
      "Dieses Modell macht häufige Fehler leichter diagnostizierbar. Ein mehrdeutiger Auftrag erlaubt mehrere plausible Auslegungen. Fehlende Akzeptanzkriterien machen den Abschluss subjektiv. Nicht verfügbare Tests lassen Korrektheit ungeprüft. Die nächsten Lektionen machen diese Lücken zu ausdrücklichen Auftragseingaben.\n\nBehandle den aktiven Kontext als **Arbeitstafel** aus Auftrag, relevantem Code, Anweisungen, Befehlsausgaben und den vorherigen Beiträgen, welche die aktuelle Oberfläche bereitstellt. Gehe nicht davon aus, dass sämtlicher Kontext in eine neue Sitzung übernommen wird. Dauerhafte Repository-Regeln gehören in `AGENTS.md`, Prüfkommandos müssen ausführbar bleiben und auftragsspezifische Grenzen gehören in den aktuellen Auftrag.",
    ],
    [
      "Codex can inspect, edit, and test within configured boundaries; the output is a reviewable change, not proof that the task is correct.",
      "Codex kann innerhalb konfigurierter Grenzen untersuchen, ändern und testen. Das Ergebnis ist eine prüfbare Änderung, kein Beweis für die Korrektheit des Auftrags.",
    ],
    [
      "The three things in the contract",
      "Die drei Bestandteile des Auftragsrahmens",
    ],
    [
      "A Codex run depends on three inputs. Naming them makes failures easier to diagnose.",
      "Ein Codex-Lauf hängt von drei Eingaben ab. Ihre Benennung erleichtert die Fehlerdiagnose.",
    ],
    ["01 · the task", "01 · die Aufgabe"],
    ["What you're asking for", "Was erreicht werden soll"],
    [
      "Goal, constraints, acceptance criteria, out-of-scope. This is the entire situational brief. If a requirement isn't here, it doesn't exist to Codex.",
      "Ziel, Einschränkungen, Akzeptanzkriterien und ausgeschlossener Umfang bilden den Arbeitsauftrag. Eine nicht genannte Anforderung kann Codex nicht zuverlässig berücksichtigen.",
    ],
    ["02 · the repo", "02 · das Repository"],
    ["What the agent can see", "Was der Agent sehen kann"],
    [
      "The files available in the selected repository or working directory, including tests, AGENTS.md instructions, and documented check commands.",
      "Die Dateien im ausgewählten Repository oder Arbeitsverzeichnis, darunter Tests, Anweisungen aus AGENTS.md und dokumentierte Prüfkommandos.",
    ],
    ["03 · the sandbox", "03 · die Sandbox"],
    ["What the agent can do", "Was der Agent ausführen kann"],
    [
      "The configured filesystem, command, approval, and network permissions. Local and cloud environments can expose different capabilities.",
      "Die konfigurierten Berechtigungen für Dateisystem, Befehle, Freigaben und Netzwerk. Lokale und Cloud-Umgebungen können unterschiedliche Fähigkeiten bereitstellen.",
    ],
    ["The contract rule.", "Die Grundregel."],
    [
      "An ambiguous task permits scope drift. Missing repository guidance makes local conventions harder to infer. Unavailable checks leave changes unverified. Each technique in this course makes one of those inputs more explicit.",
      "Ein mehrdeutiger Auftrag erlaubt Umfangsabweichungen. Fehlende Repository-Regeln erschweren das Ableiten lokaler Konventionen. Nicht verfügbare Prüfungen lassen Änderungen unverifiziert. Jede Technik im Kurs macht eine dieser Eingaben genauer.",
    ],
    ["A real session, replayed", "Ein Lauf in gekürzter Wiedergabe"],
    [
      'Words are cheap. Here\'s a condensed replay of what Codex does when you give it the task *"add rate limiting to the /login endpoint"*. This is the real shape of a run: plan, probe, try, test, revise.',
      'Die folgende gekürzte Wiedergabe zeigt einen Lauf für den Auftrag *"Rate Limiting zum Endpunkt /login hinzufügen"*: planen, untersuchen, ändern, testen und überarbeiten.',
    ],
    [
      "A run can include planning, inspection, edits, checks, revision, and a final diff.",
      "Ein Lauf kann Planung, Untersuchung, Änderungen, Prüfungen, Überarbeitung und ein abschließendes Diff umfassen.",
    ],
    [
      "Two questions on what you just read.",
      "Zwei Fragen zum gelesenen Abschnitt.",
    ],
    ["Three failure modes, named", "Drei benannte Fehlermuster"],
    [
      "These three failure modes are common and can be checked directly.",
      "Diese drei Fehlermuster treten häufig auf und lassen sich direkt prüfen.",
    ],
    ["mode 01", "Muster 01"],
    ["Vague spec", "Unklare Spezifikation"],
    [
      "The agent interprets an ambiguous goal, picks the most plausible interpretation, and commits to it. PR arrives solving the wrong problem. Fix: tighten goal and acceptance criteria.",
      "Der Agent legt ein mehrdeutiges Ziel selbst aus und arbeitet nach dieser Auslegung. Der Pull Request löst dann möglicherweise das falsche Problem. Korrektur: Ziel und Akzeptanzkriterien präzisieren.",
    ],
    ["mode 02", "Muster 02"],
    ["No conventions", "Fehlende Konventionen"],
    [
      "Without repository guidance, Codex must infer conventions from code and configuration. Fix: document non-obvious rules and exact check commands in the repository.",
      "Ohne Repository-Regeln muss Codex Konventionen aus Code und Konfiguration ableiten. Korrektur: nicht offensichtliche Regeln und genaue Prüfkommandos im Repository dokumentieren.",
    ],
    ["mode 03", "Muster 03"],
    ["Broken feedback loop", "Defekte Rückkopplung"],
    [
      "Required checks are unavailable or undocumented, so the returned result lacks verification evidence. Fix: make the relevant commands reproducible and inspect their output.",
      "Erforderliche Prüfungen sind nicht verfügbar oder nicht dokumentiert; dem Ergebnis fehlt daher Verifikationsnachweis. Korrektur: relevante Befehle reproduzierbar machen und ihre Ausgabe prüfen.",
    ],
    ["Self-check cards", "Karten zur Selbstprüfung"],
    [
      "Here are three questions about Codex. Your answer doesn't matter, this is a self-check. Read each, say the answer out loud, then flip the card.",
      "Beantworte die folgenden Fragen zunächst selbst und drehe danach die jeweilige Karte um.",
    ],
    [
      'Session replay: "add rate limiting to /login"',
      "Sitzungsablauf: Rate Limiting für /login hinzufügen",
    ],
    [
      "→ environment ready · python 3.11 · pytest configured",
      "→ Umgebung bereit · Python 3.11 · pytest konfiguriert",
    ],
    ["codex> planning…", "codex> plant…"],
    [
      "  plan: 1) read /login handler  2) add limiter  3) test",
      "  Plan: 1) /login-Handler lesen  2) Begrenzung ergänzen  3) testen",
    ],
    [
      "→ uses Flask · no rate limiting in this handler",
      "→ nutzt Flask · kein Rate Limiting in diesem Handler",
    ],
    [
      "→ found: uses flask-limiter for rate limits. tests in tests/api/",
      "→ gefunden: flask-limiter für Begrenzungen · Tests in tests/api/",
    ],
    [
      "→ pattern established: pytest fixtures, fake redis",
      "→ vorhandenes Muster: pytest-Fixtures, simuliertes Redis",
    ],
    ["codex> editing api/auth.py …", "codex> bearbeitet api/auth.py …"],
    [
      "codex> editing tests/api/test_auth.py …",
      "codex> bearbeitet tests/api/test_auth.py …",
    ],
    [
      "codex> revising: off-by-one in limiter window…",
      "codex> überarbeitet: Off-by-one-Fehler im Begrenzungsfenster…",
    ],
    ["→ selected tests passed", "→ ausgewählte Tests bestanden"],
    ["codex> producing patch…", "codex> erzeugt Patch…"],
    [
      '→ review artifact created: "rate-limit /login (5 req/min per IP)"',
      '→ Review-Artefakt erstellt: "rate-limit /login (5 req/min per IP)"',
    ],
    [
      "→ diff and selected-test log ready for review",
      "→ Diff und Protokoll der ausgewählten Tests bereit für das Review",
    ],
    [
      'You open a Codex task: "refactor our auth module." No other detail. The agent returns a PR that rewrites your user model and breaks three downstream services. What went wrong?',
      'Du erstellst den Codex-Auftrag "Refaktorisiere unser Auth-Modul" ohne weitere Angaben. Der Agent verändert das Benutzermodell und beeinträchtigt drei nachgelagerte Dienste. Was war der Fehler?',
    ],
    [
      "Codex has a bug and shouldn't be used for auth.",
      "Codex hat einen Fehler und darf nicht für Authentifizierung eingesetzt werden.",
    ],
    [
      'The task was ambiguous, "refactor auth" spans a huge scope and the agent picked an aggressive interpretation.',
      'Die Aufgabe war mehrdeutig. "Auth refaktorieren" umfasst einen großen Bereich, den der Agent weit ausgelegt hat.',
    ],
    [
      "The sandbox didn't have the downstream services available.",
      "Die nachgelagerten Dienste waren in der Sandbox nicht verfügbar.",
    ],
    [
      "You needed to give it write access to prod.",
      "Dem Agenten fehlte Schreibzugriff auf die Produktionsumgebung.",
    ],
    [
      'The request does not define the intended boundary between the auth module and the user model. Narrow it: "Extract token validation from api/auth.py into a standalone module. Keep the public interface unchanged. Do not modify User or Session."',
      'Der Auftrag definiert die beabsichtigte Grenze zwischen Auth-Modul und Benutzermodell nicht. Präzisierung: "Extrahiere die Token-Validierung aus api/auth.py in ein eigenständiges Modul. Die öffentliche Schnittstelle bleibt unverändert. User und Session nicht ändern."',
    ],
    [
      "What context should you assume will be available in a new Codex session?",
      "Welchen Kontext solltest du in einer neuen Codex-Sitzung als verfügbar voraussetzen?",
    ],
    [
      "The complete history of every earlier session on that repository.",
      "Den vollständigen Verlauf aller früheren Sitzungen zu diesem Repository.",
    ],
    [
      "Only context the current surface loads or you provide; keep durable project rules in versioned instructions and configuration.",
      "Nur den Kontext, den die aktuelle Oberfläche lädt oder den du bereitstellst. Dauerhafte Projektregeln gehören in versionierte Anweisungen und Konfiguration.",
    ],
    [
      "Only the most recent pull-request description.",
      "Nur die Beschreibung des letzten Pull Requests.",
    ],
    [
      "All local terminal output from previous runs.",
      "Sämtliche lokalen Terminalausgaben früherer Läufe.",
    ],
    [
      "Session history and environment behavior vary by Codex surface and configuration. Versioned instructions, tests, and setup files are the reliable place for project rules; task-specific constraints still belong in the current request.",
      "Sitzungsverlauf und Umgebungsverhalten unterscheiden sich je nach Codex-Oberfläche und Konfiguration. Versionierte Anweisungen, Tests und Einrichtungsdateien sind der verlässliche Ort für Projektregeln. Auftragsspezifische Grenzen gehören weiterhin in den aktuellen Auftrag.",
    ],
    ["One exercise before you move on", "Eine Übung vor der nächsten Lektion"],
    ["Mental model", "Mentales Modell"],
    ["What is Codex, in one sentence?", "Was ist Codex in einem Satz?"],
    [
      "A task-oriented coding agent that can inspect and change a repository, run available checks, and return a diff or pull request for review.",
      "Ein auftragsorientierter Coding-Agent, der ein Repository untersuchen und ändern, verfügbare Prüfungen ausführen und ein Diff oder einen Pull Request zur Kontrolle liefern kann.",
    ],
    ["Contract", "Auftragsrahmen"],
    [
      "What are the three inputs to a coding-agent run?",
      "Welche drei Eingaben bestimmen einen Coding-Agenten-Lauf?",
    ],
    [
      "The task, the repository context available to the session, and the environment permissions and tools.",
      "Der Auftrag, der für die Sitzung verfügbare Repository-Kontext sowie die Berechtigungen und Werkzeuge der Umgebung.",
    ],
    ["Failure modes", "Fehlermuster"],
    [
      "Name the three classic ways agentic coding runs fail.",
      "Nenne drei typische Ursachen für gescheiterte agentische Entwicklungsaufträge.",
    ],
    [
      "Vague spec (ambiguous goal), no conventions (no AGENTS.md / CLAUDE.md), and broken feedback loop (tests don't run). Each maps to one part of the contract.",
      "Unklare Spezifikation, fehlende Konventionen und eine defekte Rückkopplung durch nicht ausführbare Tests. Jede Ursache betrifft einen Bestandteil des Auftragsrahmens.",
    ],
    ["Persistence", "Dauerhafter Kontext"],
    [
      'How does an agentic coding tool "remember" things between runs?',
      "Wie bleiben Informationen zwischen getrennten Agentenläufen verfügbar?",
    ],
    [
      "Do not assume prior context transfers. Store durable rules in versioned instructions, tests, documentation, and environment configuration; restate task-specific constraints.",
      "Gehe nicht davon aus, dass vorheriger Kontext übertragen wird. Speichere dauerhafte Regeln in versionierten Anweisungen, Tests, Dokumentation und Umgebungskonfiguration; wiederhole auftragsspezifische Grenzen.",
    ],
    ["The shift", "Der Wechsel"],
    [
      "How is an autonomous coding agent different from autocomplete tools like Copilot?",
      "Wie unterscheidet sich ein autonomer Entwicklungsagent von Autovervollständigung?",
    ],
    [
      "Autocomplete proposes code at the cursor. A coding agent can inspect multiple files, run tools, and carry a bounded task through to a reviewable diff; some agent surfaces are interactive and others run in the background.",
      "Autovervollständigung schlägt Code am Cursor vor. Ein Coding-Agent kann mehrere Dateien untersuchen, Werkzeuge ausführen und einen abgegrenzten Auftrag bis zu einem prüfbaren Diff bearbeiten. Manche Agentenoberflächen sind interaktiv, andere laufen im Hintergrund.",
    ],
    ["The blackboard", "Die Tafel"],
    [
      "What mental model helps explain why context matters so much in agentic coding?",
      "Welches Modell erklärt die Bedeutung des Kontexts bei agentischer Entwicklung?",
    ],
    [
      "Treat active context as a workboard assembled from the current request, repository, instructions, tool results, and available conversation history. Put durable rules in versioned files.",
      "Behandle den aktiven Kontext als Arbeitstafel aus aktuellem Auftrag, Repository, Anweisungen, Werkzeugergebnissen und verfügbarem Gesprächsverlauf. Dauerhafte Regeln gehören in versionierte Dateien.",
    ],
  ],
  preserve: [
    "$ git clone repo && cd repo",
    "$ cat api/auth.py",
    "$ cat AGENTS.md | head",
    "$ cat tests/api/test_auth.py",
    "$ pytest tests/api/test_auth.py -v",
    "→ FAIL: test_login_respects_limit (limit=10, got 11)",
  ],
});
