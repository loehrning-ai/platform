import canonical from "../l01-mental-model";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    ["What Codex Actually Is", "Was Codex tatsächlich ist"],
    [
      canonical.subtitle,
      "Ein auftragsorientierter Coding-Agent. Untersucht ein Repository, ändert Dateien, führt Prüfungen aus und legt dir die Änderung zum Review vor.",
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
      "Codex ist ein **auftragsorientierter Coding-Agent**. Er läuft lokal in CLI oder IDE oder in einer dedizierten Cloud-Umgebung. Bedienung und Berechtigungsmodell unterscheiden sich, der Ablauf dahinter ist überall derselbe:\n\n1. Codex bekommt den Auftrag plus den Kontext, den Sitzung und Repository gerade hergeben.\n2. Er arbeitet innerhalb der konfigurierten Grenzen für Dateisystem, Befehle, Freigaben und Netzwerk.\n3. Er liest den relevanten Code und legt eine Folge von Änderungen fest.\n4. Er ändert Dateien, führt die verfügbaren Prüfungen aus, liest deren Ausgabe und bessert nach.\n5. Er liefert eine Zusammenfassung und ein **Diff** oder einen Patch zur Prüfung. Ein Cloud-Auftrag kann, passend konfiguriert, auch einen Pull Request öffnen.\n\nDas ist Delegation mit Prüfpunkten. Lokal kannst du eingreifen, in der Cloud läuft der Auftrag im Hintergrund weiter. Gelesen wird das Ergebnis in beiden Fällen gegen Auftrag und Repository-Nachweise.",
    ],
    [
      canonical.sections[0].blocks[1]?.kind === "pull-quote"
        ? canonical.sections[0].blocks[1].text
        : "",
      "Ein abgegrenzter Entwicklungsauftrag mit Review, keine Autovervollständigung am Cursor.",
    ],
    [
      canonical.sections[0].blocks[2]?.kind === "prose"
        ? canonical.sections[0].blocks[2].markdown
        : "",
      "Warum dieses Modell? Weil es Fehler adressierbar macht. Ein mehrdeutiger Auftrag lässt Codex eine Auslegung wählen. Ohne Akzeptanzkriterien wird fertig zur Geschmacksfrage, ohne laufende Tests bleibt Korrektheit eine Behauptung. Die nächsten Lektionen machen aus diesen Lücken ausdrückliche Auftragseingaben.\n\nDer aktive Kontext ist eine **Arbeitstafel** aus Auftrag, relevantem Code, Anweisungen, Befehlsausgaben und den bisherigen Beiträgen, soweit die aktuelle Oberfläche sie mitgibt. Rechne nicht damit, dass eine neue Sitzung diese Tafel übernimmt. Dauerhafte Repository-Regeln gehören deshalb in `AGENTS.md`, und Prüfkommandos müssen ausführbar bleiben. Auftragsspezifische Grenzen stehen im Auftrag selbst, jedes Mal.",
    ],
    [
      "Codex inspects, edits, and tests inside configured boundaries. The output is a reviewable change, not proof the task is correct.",
      "Codex untersucht, ändert und testet innerhalb konfigurierter Grenzen. Heraus kommt eine prüfbare Änderung, kein Beweis für die Korrektheit.",
    ],
    [
      "The three things in the contract",
      "Die drei Bestandteile des Auftragsrahmens",
    ],
    [
      "Three inputs decide a Codex run. Name them and the failures stop being mysterious.",
      "Drei Eingaben bestimmen einen Codex-Lauf. Wer sie benennt, findet Fehler schneller.",
    ],
    ["01 · the task", "01 · die Aufgabe"],
    ["What you're asking for", "Was du verlangst"],
    [
      "Goal, constraints, acceptance criteria, out-of-scope. The whole brief. A requirement that is not written here does not exist to Codex.",
      "Ziel, Einschränkungen, Akzeptanzkriterien, ausgeschlossener Umfang. Das ist die ganze Lagebeschreibung. Was hier nicht steht, existiert für Codex nicht.",
    ],
    ["02 · the repo", "02 · das Repository"],
    ["What the agent can see", "Was der Agent sehen kann"],
    [
      "The files available in the selected repository or working directory, including tests, AGENTS.md instructions, and documented check commands.",
      "Die Dateien im gewählten Repository oder Arbeitsverzeichnis, samt Tests, AGENTS.md und dokumentierten Prüfkommandos.",
    ],
    ["03 · the sandbox", "03 · die Sandbox"],
    ["What the agent can do", "Was der Agent tun darf"],
    [
      "The configured filesystem, command, approval, and network permissions. Local and cloud environments can expose different capabilities.",
      "Die konfigurierten Berechtigungen für Dateisystem, Befehle, Freigaben und Netzwerk. Lokal und Cloud können hier unterschiedlich ausgestattet sein.",
    ],
    ["The contract rule.", "Die Grundregel."],
    [
      "An ambiguous task permits scope drift. Missing repository guidance leaves local conventions to guesswork. Unavailable checks leave changes unverified. Every technique in this course sharpens one of those three inputs.",
      "Ein vager Auftrag lädt zum Ausufern ein, fehlende Repository-Regeln zwingen Codex zum Ableiten aus dem Code, und ohne laufende Prüfungen bleibt jede Änderung unverifiziert. Jede Technik im Kurs schärft eine dieser Eingaben.",
    ],
    ["A real session, replayed", "Ein Lauf, gekürzt"],
    [
      'Words are cheap. Here is a condensed replay of one task, *"add rate limiting to the /login endpoint"*. Plan, probe, try, test, revise. That is the shape of a run.',
      'Genug Theorie. So sieht ein gekürzter Lauf für den Auftrag *"Rate Limiting zum Endpunkt /login hinzufügen"* aus. Planen, untersuchen, ändern, testen, überarbeiten.',
    ],
    [
      "A run can include planning, inspection, edits, checks, revision, and a final diff.",
      "Planen, Untersuchen, Ändern, Prüfen, Nachbessern und ein abschließendes Diff können in einem einzigen Lauf stecken.",
    ],
    ["Two questions on what you just read.", "Zwei Fragen zum Gelesenen."],
    ["Three failure modes, named", "Drei Fehlermuster mit Namen"],
    [
      "Three patterns keep coming back. Each one is checkable.",
      "Drei Muster, die immer wiederkommen. Alle direkt prüfbar.",
    ],
    ["mode 01", "Muster 01"],
    ["Vague spec", "Unklare Spezifikation"],
    [
      "The agent interprets an ambiguous goal, picks the most plausible interpretation, and commits to it. PR arrives solving the wrong problem. Fix: tighten goal and acceptance criteria.",
      "Der Agent wählt die plausibelste Auslegung des mehrdeutigen Ziels und zieht sie durch. Der Pull Request löst das falsche Problem. Korrektur: Ziel und Akzeptanzkriterien nachschärfen.",
    ],
    ["mode 02", "Muster 02"],
    ["No conventions", "Fehlende Konventionen"],
    [
      "Without repository guidance, Codex must infer conventions from code and configuration. Fix: document non-obvious rules and exact check commands in the repository.",
      "Ohne Repository-Regeln leitet Codex Konventionen aus Code und Konfiguration ab. Korrektur: nicht offensichtliche Regeln und exakte Prüfkommandos ins Repository schreiben.",
    ],
    ["mode 03", "Muster 03"],
    ["Broken feedback loop", "Defekte Rückkopplung"],
    [
      "Required checks are unavailable or undocumented, so the returned result lacks verification evidence. Fix: make the relevant commands reproducible and inspect their output.",
      "Die nötigen Prüfungen fehlen oder sind nirgends dokumentiert, das Ergebnis kommt ohne Nachweis zurück. Korrektur: relevante Befehle reproduzierbar machen, Ausgabe lesen.",
    ],
    ["Self-check cards", "Karten zur Selbstprüfung"],
    [
      "Read the question, say your answer out loud, then flip the card. Self-check, not a grade.",
      "Lies die Frage, antworte laut, dreh die Karte um. Selbstprüfung, keine Note.",
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
      'Codex-Auftrag: "Refaktorisiere unser Auth-Modul." Sonst nichts. Zurück kommt ein Pull Request, der das Benutzermodell umschreibt und drei nachgelagerte Dienste lahmlegt. Was ist schiefgelaufen?',
    ],
    [
      "Codex has a bug and shouldn't be used for auth.",
      "Codex hat einen Bug und gehört nicht an Auth-Code.",
    ],
    [
      'The task was ambiguous, "refactor auth" spans a huge scope and the agent picked an aggressive interpretation.',
      'Der Auftrag war mehrdeutig. "Auth refaktorieren" deckt einen riesigen Bereich ab, und der Agent hat die aggressive Auslegung gewählt.',
    ],
    [
      "The sandbox didn't have the downstream services available.",
      "Die nachgelagerten Dienste waren in der Sandbox nicht verfügbar.",
    ],
    [
      "You needed to give it write access to prod.",
      "Du hättest ihm Schreibzugriff auf Prod geben müssen.",
    ],
    [
      'The request does not define the intended boundary between the auth module and the user model. Narrow it: "Extract token validation from api/auth.py into a standalone module. Keep the public interface unchanged. Do not modify User or Session."',
      'Der Auftrag sagt nicht, wo Auth-Modul aufhört und Benutzermodell anfängt. Enger: "Extrahiere die Token-Validierung aus api/auth.py in ein eigenständiges Modul. Die öffentliche Schnittstelle bleibt unverändert. User und Session nicht ändern."',
    ],
    [
      "What context should you assume will be available in a new Codex session?",
      "Mit welchem Kontext darfst du in einer neuen Codex-Sitzung rechnen?",
    ],
    [
      "The complete history of every earlier session on that repository.",
      "Mit dem vollständigen Verlauf aller früheren Sitzungen zu diesem Repository.",
    ],
    [
      "Only context the current surface loads or you provide; keep durable project rules in versioned instructions and configuration.",
      "Nur mit dem, was die aktuelle Oberfläche lädt oder du selbst mitgibst. Dauerhafte Projektregeln gehören in versionierte Anweisungen und Konfiguration.",
    ],
    [
      "Only the most recent pull-request description.",
      "Nur mit der Beschreibung des letzten Pull Requests.",
    ],
    [
      "All local terminal output from previous runs.",
      "Mit sämtlichen lokalen Terminalausgaben früherer Läufe.",
    ],
    [
      "Session history and environment behavior vary by Codex surface and configuration. Versioned instructions, tests, and setup files are the reliable place for project rules; task-specific constraints still belong in the current request.",
      "Was eine Sitzung an Verlauf mitbekommt, hängt von Oberfläche und Konfiguration ab. Verlässlich sind versionierte Anweisungen, Tests und Setup-Dateien. Auftragsspezifische Grenzen schreibst du jedes Mal in den Auftrag.",
    ],
    ["One exercise before you move on", "Eine Übung vor der nächsten Lektion"],
    ["Mental model", "Mentales Modell"],
    ["What is Codex, in one sentence?", "Was ist Codex in einem Satz?"],
    [
      "A task-oriented coding agent that can inspect and change a repository, run available checks, and return a diff or pull request for review.",
      "Ein auftragsorientierter Coding-Agent, der ein Repository untersucht und ändert, die verfügbaren Prüfungen ausführt und ein Diff oder einen Pull Request zum Review liefert.",
    ],
    ["Contract", "Auftragsrahmen"],
    [
      "What are the three inputs to a coding-agent run?",
      "Welche drei Eingaben bestimmen einen Coding-Agenten-Lauf?",
    ],
    [
      "The task, the repository context available to the session, and the environment permissions and tools.",
      "Der Auftrag, der Repository-Kontext, den die Sitzung sieht, und die Berechtigungen und Werkzeuge der Umgebung.",
    ],
    ["Failure modes", "Fehlermuster"],
    [
      "Name the three classic ways agentic coding runs fail.",
      "Nenne die drei klassischen Arten, auf die agentische Coding-Läufe scheitern.",
    ],
    [
      "Vague spec (ambiguous goal), no conventions (no AGENTS.md / CLAUDE.md), and broken feedback loop (tests don't run). Each maps to one part of the contract.",
      "Unklare Spezifikation, fehlende Konventionen, defekte Rückkopplung durch Tests, die nicht laufen. Jedes Muster trifft einen Bestandteil des Auftragsrahmens.",
    ],
    ["Persistence", "Dauerhafter Kontext"],
    [
      'How does an agentic coding tool "remember" things between runs?',
      'Wie "erinnert" sich ein Coding-Agent zwischen zwei Läufen an etwas?',
    ],
    [
      "Do not assume prior context transfers. Store durable rules in versioned instructions, tests, documentation, and environment configuration; restate task-specific constraints.",
      "Verlass dich nicht darauf. Dauerhafte Regeln gehören in versionierte Anweisungen, Tests, Dokumentation und Umgebungskonfiguration; auftragsspezifische Grenzen wiederholst du im Auftrag.",
    ],
    ["The shift", "Der Wechsel"],
    [
      "How is an autonomous coding agent different from autocomplete tools like Copilot?",
      "Was unterscheidet einen autonomen Coding-Agenten von Autovervollständigung wie Copilot?",
    ],
    [
      "Autocomplete proposes code at the cursor. A coding agent can inspect multiple files, run tools, and carry a bounded task through to a reviewable diff; some agent surfaces are interactive and others run in the background.",
      "Autovervollständigung schlägt Code am Cursor vor. Ein Coding-Agent liest mehrere Dateien, führt Werkzeuge aus und trägt einen abgegrenzten Auftrag bis zum prüfbaren Diff. Manche Oberflächen sind interaktiv, andere laufen im Hintergrund.",
    ],
    ["The blackboard", "Die Tafel"],
    [
      "What mental model helps explain why context matters so much in agentic coding?",
      "Welches Bild erklärt, warum Kontext bei agentischer Entwicklung so viel zählt?",
    ],
    [
      "Treat active context as a workboard assembled from the current request, repository, instructions, tool results, and available conversation history. Put durable rules in versioned files.",
      "Die Arbeitstafel, auf der nur steht, was aktueller Auftrag, Repository, Anweisungen, Werkzeugergebnisse und verfügbarer Gesprächsverlauf hergeben. Dauerhafte Regeln gehören in versionierte Dateien.",
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
