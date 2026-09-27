import canonical from "../l01-mental-model";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    ["What Codex Actually Is", "Was Codex tatsächlich ist"],
    [
      canonical.subtitle,
      "Ein auftragsorientierter Coding-Agent, der ein Repository untersucht, Dateien ändert, Prüfungen ausführt und dir die Arbeit zum Review vorlegt.",
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
      "Codex ist ein **auftragsorientierter Coding-Agent**. Er läuft lokal in CLI oder IDE oder in einer Cloud-Umgebung, und jede Oberfläche folgt demselben Ablauf:\n\n1. Auftrag plus Kontext aus Sitzung und Repository übernehmen.\n2. Innerhalb der konfigurierten Grenzen für Dateisystem, Befehle, Freigaben und Netzwerk bleiben.\n3. Den relevanten Code lesen und die Änderungen planen.\n4. Dateien ändern, verfügbare Prüfungen ausführen, Ausgabe lesen und nachbessern.\n5. Eine Zusammenfassung und ein **Diff** zum Review liefern oder, falls konfiguriert, einen Pull Request öffnen.\n\nLokal kannst du eingreifen, in der Cloud läuft der Auftrag im Hintergrund. Das Ergebnis prüfst du in beiden Fällen gegen Auftrag und Repository.",
    ],
    [
      canonical.sections[0].blocks[1]?.kind === "prose"
        ? canonical.sections[0].blocks[1].markdown
        : "",
      "Der aktive Kontext ist eine **Arbeitstafel** aus Auftrag, relevantem Code, Anweisungen, Befehlsausgaben und den bisherigen Beiträgen, soweit die Oberfläche sie mitgibt. Eine neue Sitzung übernimmt sie womöglich nicht. Dauerhafte Regeln gehören in `AGENTS.md`, Prüfkommandos bleiben ausführbar, und Auftragsgrenzen schreibst du in jeden Auftrag.",
    ],
    [
      "The three things in the contract",
      "Die drei Bestandteile des Auftragsrahmens",
    ],
    [
      "Three inputs decide a Codex run. Every technique in this course sharpens one of them.",
      "Drei Eingaben bestimmen einen Codex-Lauf. Jede Technik in diesem Kurs schärft eine davon.",
    ],
    ["01 · the task", "01 · die Aufgabe"],
    ["What you're asking for", "Was du verlangst"],
    [
      "Goal, constraints, acceptance criteria and out-of-scope. A requirement that is not written here does not exist for Codex.",
      "Ziel, Einschränkungen, Akzeptanzkriterien und ausgeschlossener Umfang. Was hier nicht steht, existiert für Codex nicht.",
    ],
    ["02 · the repo", "02 · das Repository"],
    ["What the agent can see", "Was der Agent sehen kann"],
    [
      "Files in the selected repository or working directory, including tests, AGENTS.md and documented check commands.",
      "Die Dateien im gewählten Repository oder Arbeitsverzeichnis, samt Tests, AGENTS.md und dokumentierten Prüfkommandos.",
    ],
    ["03 · the sandbox", "03 · die Sandbox"],
    ["What the agent can do", "Was der Agent tun darf"],
    [
      "Configured filesystem, command, approval and network permissions. Local and cloud environments can differ.",
      "Die konfigurierten Rechte für Dateisystem, Befehle, Freigaben und Netzwerk. Lokal und Cloud können sich unterscheiden.",
    ],
    ["A real session, replayed", "Ein Lauf, gekürzt"],
    [
      'The replay above condenses one run of *"add rate limiting to the /login endpoint"*: plan, inspect, edit, test, revise.',
      'Der Ablauf oben zeigt gekürzt einen Lauf für *"Rate Limiting zum Endpunkt /login hinzufügen"*: planen, untersuchen, ändern, testen, überarbeiten.',
    ],
    [
      "Two questions wait at the end of the lesson.",
      "Zwei Fragen folgen am Ende der Lektion.",
    ],
    ["Three failure modes, named", "Drei Fehlermuster mit Namen"],
    ["mode 01", "Muster 01"],
    [
      "Codex picks the most plausible reading of an ambiguous goal and commits to it, so the PR solves the wrong problem. Fix: tighten goal and acceptance criteria.",
      "Codex wählt die plausibelste Auslegung des mehrdeutigen Ziels und zieht sie durch, der Pull Request löst das falsche Problem. Korrektur: Ziel und Akzeptanzkriterien nachschärfen.",
    ],
    ["mode 02", "Muster 02"],
    ["No conventions", "Fehlende Konventionen"],
    [
      "Without repository guidance, Codex infers conventions from code and configuration. Fix: document non-obvious rules and exact check commands.",
      "Ohne Repository-Regeln leitet Codex Konventionen aus Code und Konfiguration ab. Korrektur: nicht offensichtliche Regeln und exakte Prüfkommandos aufschreiben.",
    ],
    ["mode 03", "Muster 03"],
    ["Broken feedback loop", "Defekte Rückkopplung"],
    [
      "Required checks are missing or undocumented, so the result comes back without verification evidence. Fix: make the commands reproducible and read their output.",
      "Die nötigen Prüfungen fehlen oder sind nicht dokumentiert, das Ergebnis kommt ohne Nachweis zurück. Korrektur: Befehle reproduzierbar machen und ihre Ausgabe lesen.",
    ],
    ["Self-check cards", "Karten zur Selbstprüfung"],
    [
      "The cards are at the end of the lesson. Answer out loud, then flip. Nothing is graded.",
      "Die Karten stehen am Ende der Lektion. Antworte laut und dreh dann um. Es gibt keine Note.",
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
      'Your Codex task says only "refactor our auth module." The PR rewrites your user model and breaks three downstream services. What went wrong?',
      'Dein Codex-Auftrag lautet nur "Refaktorisiere unser Auth-Modul." Der Pull Request schreibt das Benutzermodell um und legt drei nachgelagerte Dienste lahm. Was ist schiefgelaufen?',
    ],
    [
      "Codex has a bug and shouldn't be used for auth.",
      "Codex hat einen Bug und gehört nicht an Auth-Code.",
    ],
    [
      'The task was ambiguous, "refactor auth" spans a huge scope.',
      'Der Auftrag war mehrdeutig, "Auth refaktorieren" deckt einen riesigen Bereich ab.',
    ],
    [
      "The sandbox lacked the downstream services.",
      "In der Sandbox fehlten die nachgelagerten Dienste.",
    ],
    [
      "It needed write access to prod.",
      "Er brauchte Schreibzugriff auf Prod.",
    ],
    [
      'The request sets no boundary between auth module and user model. Narrower: "Extract token validation from api/auth.py into its own module. Keep the public interface. Do not modify User or Session."',
      'Der Auftrag zieht keine Grenze zwischen Auth-Modul und Benutzermodell. Enger: "Extrahiere die Token-Validierung aus api/auth.py in ein eigenes Modul. Die öffentliche Schnittstelle bleibt. User und Session nicht ändern."',
    ],
    [
      "What context can you assume in a new Codex session?",
      "Mit welchem Kontext darfst du in einer neuen Codex-Sitzung rechnen?",
    ],
    [
      "The full history of every earlier session on the repository.",
      "Mit dem vollständigen Verlauf aller früheren Sitzungen zum Repository.",
    ],
    [
      "Only what the surface loads or you provide; durable rules live in versioned files.",
      "Nur mit dem, was die Oberfläche lädt oder du mitgibst. Dauerhafte Regeln stehen in versionierten Dateien.",
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
      "Session history depends on surface and configuration. Versioned instructions, tests and setup files carry project rules reliably; task constraints go into each request.",
      "Welchen Verlauf eine Sitzung mitbekommt, hängt von Oberfläche und Konfiguration ab. Verlässlich tragen versionierte Anweisungen, Tests und Setup-Dateien die Projektregeln, Auftragsgrenzen gehören in jeden Auftrag.",
    ],
    ["Review cards", "Lernkarten"],
    ["Mental model", "Mentales Modell"],
    ["What is Codex, in one sentence?", "Was ist Codex in einem Satz?"],
    [
      "A task-oriented coding agent that changes a repository, runs checks and returns a diff or pull request for review.",
      "Ein auftragsorientierter Coding-Agent, der ein Repository ändert, Prüfungen ausführt und ein Diff oder einen Pull Request zum Review liefert.",
    ],
    ["Contract", "Auftragsrahmen"],
    [
      "What are the three inputs to a coding-agent run?",
      "Welche drei Eingaben bestimmen einen Coding-Agenten-Lauf?",
    ],
    [
      "The task, the repository context the session sees, and the environment's permissions and tools.",
      "Der Auftrag, der Repository-Kontext, den die Sitzung sieht, und die Rechte und Werkzeuge der Umgebung.",
    ],
    ["Failure modes", "Fehlermuster"],
    [
      "Name the three classic ways coding-agent runs fail.",
      "Nenne die drei klassischen Gründe, aus denen Coding-Agenten-Läufe scheitern.",
    ],
    [
      "Vague spec, no conventions and a broken feedback loop. Each maps to one contract input.",
      "Unklare Spezifikation, fehlende Konventionen und defekte Rückkopplung. Jedes Muster trifft eine Eingabe des Auftragsrahmens.",
    ],
    ["Persistence", "Dauerhafter Kontext"],
    [
      'How does an agentic coding tool "remember" things between runs?',
      'Wie "erinnert" sich ein Coding-Agent zwischen zwei Läufen an etwas?',
    ],
    [
      "Not reliably. Keep durable rules in versioned files and restate task constraints in each request.",
      "Gar nicht verlässlich. Dauerhafte Regeln gehören in versionierte Dateien, Auftragsgrenzen wiederholst du in jedem Auftrag.",
    ],
    ["The shift", "Der Wechsel"],
    [
      "How does a coding agent differ from autocomplete like Copilot?",
      "Was unterscheidet einen Coding-Agenten von Autovervollständigung wie Copilot?",
    ],
    [
      "Autocomplete suggests code at the cursor. A coding agent reads multiple files, runs tools and carries a bounded task to a reviewable diff.",
      "Autovervollständigung schlägt Code am Cursor vor. Ein Coding-Agent liest mehrere Dateien, führt Werkzeuge aus und trägt einen abgegrenzten Auftrag bis zum prüfbaren Diff.",
    ],
    ["The blackboard", "Die Tafel"],
    [
      "Which mental model explains why context matters so much?",
      "Welches Bild erklärt, warum Kontext so viel zählt?",
    ],
    [
      "A workboard holding only the current request, repository, instructions, tool results and available history.",
      "Eine Arbeitstafel, auf der nur aktueller Auftrag, Repository, Anweisungen, Werkzeugergebnisse und verfügbarer Verlauf stehen.",
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
