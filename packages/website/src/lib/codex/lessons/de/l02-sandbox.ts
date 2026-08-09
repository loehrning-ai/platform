import canonical from "../l02-sandbox";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [
      "Execution Environments and Permissions",
      "Ausführungsumgebungen und Berechtigungen",
    ],
    [
      "Local Codex follows the configured workspace sandbox and approval policy. Cloud tasks run in dedicated environments with separate network controls.",
      "Lokales Codex folgt der konfigurierten Workspace-Sandbox und Freigaberichtlinie. Cloud-Aufträge laufen in dedizierten Umgebungen mit eigenen Netzwerkkontrollen.",
    ],
    [
      "Know where commands run and what they can reach.",
      "Kläre Ausführungsort und erreichbare Ressourcen.",
    ],
    ["Local sandbox", "Lokale Sandbox"],
    ["Cloud environment", "Cloud-Umgebung"],
    ["Approval policy", "Freigaberichtlinie"],
    ["Network configuration", "Netzwerkkonfiguration"],
    [
      "Local and cloud are different",
      "Lokale und Cloud-Ausführung unterscheiden",
    ],
    [
      "Codex has two execution models that must not be conflated.\n\n- **Local CLI and IDE sessions** run commands on your machine inside the configured OS-enforced sandbox. The common workspace-write configuration limits writes to the active workspace and keeps network access off unless enabled. The approval policy is a separate control that determines when Codex must ask before an action crosses the configured boundary.\n- **Cloud tasks** run in a dedicated OpenAI-managed container. Codex checks out the selected repository and commit, runs the environment setup, performs the task, and returns a summary and diff. Setup can use network access and setup-only secrets; those secrets are removed before the agent phase. Agent-phase network access is disabled by default and can be enabled per environment.\n\nFilesystem access, network access, and approvals are configuration choices. Inspect the active settings instead of inferring them from the Codex product name.",
      "Codex besitzt zwei Ausführungsmodelle, die getrennt betrachtet werden müssen.\n\n- **Lokale CLI- und IDE-Sitzungen** führen Befehle auf dem eigenen Rechner innerhalb der konfigurierten, betriebssystemgestützten Sandbox aus. Die übliche Workspace-Write-Konfiguration begrenzt Schreibzugriffe auf den aktiven Workspace und lässt Netzwerkzugriff nur bei entsprechender Freigabe zu. Die Freigaberichtlinie legt getrennt davon fest, wann Codex vor einer Grenzüberschreitung fragen muss.\n- **Cloud-Aufträge** laufen in einem dedizierten, von OpenAI verwalteten Container. Codex checkt das gewählte Repository und den gewählten Commit aus, führt das Umgebungs-Setup aus, bearbeitet den Auftrag und liefert Zusammenfassung und Diff. Das Setup kann Netzwerk und ausschließlich dort verfügbare Secrets nutzen; diese Secrets werden vor der Agentenphase entfernt. Netzwerkzugriff in der Agentenphase ist standardmäßig deaktiviert und pro Umgebung konfigurierbar.\n\nDateisystemzugriff, Netzwerkzugriff und Freigaben sind Konfigurationsentscheidungen. Prüfe die aktiven Einstellungen, statt sie aus dem Produktnamen abzuleiten.",
    ],
    [
      "A task is executable only when its required files, commands, dependencies, credentials, and network destinations fit the active environment policy.",
      "Ein Auftrag ist nur ausführbar, wenn benötigte Dateien, Befehle, Abhängigkeiten, Zugangsdaten und Netzwerkziele zur aktiven Umgebungsrichtlinie passen.",
    ],
    ["Plan for the active boundary", "Für die aktive Grenze planen"],
    [
      "Three checks prevent most environment-related ambiguity.\n\n**Make dependencies reproducible.** A cloud setup script can install project runtimes, packages, and fixtures before the agent phase. A local session uses the tools available on the machine and permitted by its sandbox. Document the exact setup and verification commands in the repository.\n\n**Declare network requirements.** A cloud agent phase cannot reach an external API unless network access is enabled for that environment and the destination is allowed. Local network access also depends on sandbox configuration. Prefer a versioned fixture when live data is not required.\n\n**Separate code changes from external-state verification.** Access to staging or production is a security decision, not a convenience. Use scoped credentials and explicit authorization when external validation is required; otherwise keep the coding task isolated and perform the external check through the normal release process.",
      "Drei Prüfungen vermeiden Unklarheit über die Umgebung.\n\n**Abhängigkeiten reproduzierbar bereitstellen.** Ein Cloud-Setup-Skript kann vor der Agentenphase Projektlaufzeiten, Pakete und Fixtures installieren. Eine lokale Sitzung nutzt die auf dem Rechner vorhandenen und von der Sandbox erlaubten Werkzeuge. Dokumentiere genaue Setup- und Prüfkommandos im Repository.\n\n**Netzwerkanforderungen benennen.** Eine Cloud-Agentenphase erreicht eine externe API nur, wenn Netzwerkzugriff für die Umgebung aktiviert und das Ziel freigegeben ist. Lokaler Netzwerkzugriff hängt ebenfalls von der Sandbox-Konfiguration ab. Verwende ein versioniertes Fixture, wenn keine Live-Daten erforderlich sind.\n\n**Codeänderung und Prüfung externen Zustands trennen.** Zugriff auf Staging oder Produktion ist eine Sicherheitsentscheidung. Bei erforderlicher externer Prüfung gelten begrenzte Zugangsdaten und ausdrückliche Freigabe; andernfalls bleibt die Codeaufgabe isoliert und die externe Prüfung erfolgt im regulären Release-Prozess.",
    ],
    ["Cloud environment inputs", "Eingaben einer Cloud-Umgebung"],
    [
      "A cloud environment combines a base image with repository-specific setup and policy. Review these inputs before assigning a task:",
      "Eine Cloud-Umgebung verbindet ein Basis-Image mit Repository-spezifischem Setup und Richtlinien. Prüfe vor dem Auftrag diese Eingaben:",
    ],
    ["provided by you", "von dir bereitgestellt"],
    ["Setup script", "Setup-Skript"],
    [
      "A reproducible command sequence that runs after checkout during setup. Use it to install project dependencies and prepare test fixtures required by the task.",
      "Eine reproduzierbare Befehlsfolge, die nach dem Checkout während des Setups läuft. Sie installiert Projektabhängigkeiten und bereitet erforderliche Test-Fixtures vor.",
    ],
    ["Environment variables", "Umgebungsvariablen"],
    [
      "Non-secret configuration can remain available for the task. Setup-only secrets are available during setup and removed before the agent phase; do not design the task around reading them later.",
      "Nicht geheime Konfiguration kann während des Auftrags verfügbar bleiben. Ausschließlich für das Setup bereitgestellte Secrets werden vor der Agentenphase entfernt; der Auftrag darf späteren Zugriff darauf nicht voraussetzen.",
    ],
    ["Network allow-list", "Netzwerk-Freigabeliste"],
    [
      "Agent-phase internet access is configured per environment. When enabled, restrict destinations and HTTP methods to what the task requires.",
      "Internetzugriff der Agentenphase wird pro Umgebung konfiguriert. Begrenze bei Aktivierung Ziele und HTTP-Methoden auf den tatsächlichen Bedarf.",
    ],
    ["provided by Codex", "von der Laufzeit bereitgestellt"],
    ["The runtime", "Die Laufzeit"],
    [
      "A dedicated container with a checked-out repository and the tools supplied by the base image. The setup script adds project-specific requirements.",
      "Ein dedizierter Container mit ausgechecktem Repository und den Werkzeugen des Basis-Images. Das Setup-Skript ergänzt projektspezifische Anforderungen.",
    ],
    ["Illustrative network failure", "Beispiel: Netzwerkziel nicht verfügbar"],
    [
      "The task asks for a call to a Stripe test endpoint, but the configured environment cannot resolve the destination. The useful response is to report that boundary and use a reviewed fixture when it represents the required behavior.",
      "Der Auftrag verlangt einen Aufruf des Stripe-Testendpunkts, doch die konfigurierte Umgebung kann das Ziel nicht auflösen. Der Lauf muss diese Grenze melden und darf nur dann auf ein geprüftes Fixture ausweichen, wenn es das benötigte Verhalten abbildet.",
    ],
    ["Keep changes reviewable", "Änderungen prüfbar halten"],
    [
      "A cloud task returns changes from its dedicated checkout. A local session changes the selected working tree or worktree. In either case, Git structure determines how easily the result can be inspected and integrated.\n\n- **Give concurrent tasks separate working trees or cloud environments.** Separate branches prevent shared file state, but overlapping diffs can still conflict when merged.\n- **Keep each change coherent.** Scope by one reviewable behavior and its tests, not by an arbitrary line or file limit.\n- **Start from an intentional base commit.** Record which revision the task uses and refresh it when upstream changes affect the same area.\n- **Re-run trusted checks outside the task when risk warrants it.** Agent-produced logs show what ran in that environment; CI and reviewer-run checks provide independent evidence.",
      "Ein Cloud-Auftrag liefert Änderungen aus seinem dedizierten Checkout. Eine lokale Sitzung ändert den gewählten Working Tree oder Worktree. In beiden Fällen bestimmt die Git-Struktur, wie gut sich das Ergebnis prüfen und integrieren lässt.\n\n- **Gleichzeitige Aufträge erhalten getrennte Worktrees oder Cloud-Umgebungen.** Getrennte Branches verhindern gemeinsamen Dateizustand; überlappende Diffs können beim Merge dennoch kollidieren.\n- **Jede Änderung bleibt kohärent.** Grenze nach einem prüfbaren Verhalten und seinen Tests ab, nicht nach pauschaler Zeilen- oder Dateizahl.\n- **Nutze einen beabsichtigten Basis-Commit.** Dokumentiere die Revision und aktualisiere sie, wenn vorgelagerte Änderungen denselben Bereich betreffen.\n- **Wiederhole vertrauenswürdige Prüfungen außerhalb des Auftrags, wenn das Risiko es verlangt.** Agentenprotokolle zeigen, was in dieser Umgebung lief; CI und vom Reviewer ausgeführte Prüfungen liefern unabhängige Nachweise.",
    ],
    [
      "Treat output as evidence, not approval.",
      "Ausgabe als Nachweis, nicht als Freigabe behandeln.",
    ],
    [
      "Read the diff against the requested behavior and excluded scope. Inspect additions, deletions, dependencies, generated files, and test changes. Review command logs for what actually ran, then repeat security- or release-critical checks in the repository's trusted pipeline.",
      "Prüfe den Diff gegen das verlangte Verhalten und den ausgeschlossenen Umfang. Untersuche Ergänzungen, Löschungen, Abhängigkeiten, generierte Dateien und Teständerungen. Kontrolliere in den Befehlsprotokollen, was tatsächlich lief, und wiederhole sicherheits- oder releasekritische Prüfungen in der vertrauenswürdigen Pipeline des Repositorys.",
    ],
    ["Pre-flight checklist", "Prüfliste vor dem Start"],
    [
      "Before starting a task, record the environment assumptions that affect execution and review.",
      "Dokumentiere vor dem Start die Umgebungsannahmen, die Ausführung und Review beeinflussen.",
    ],
    ["sandbox readiness", "Sandbox bereit"],
    ["Sandbox readiness", "Sandbox-Bereitschaft"],
    [
      "Does the documented check command run from the selected revision? Are dependencies reproducible? Which checks require services, network, environment variables, or setup-only secrets?",
      "Läuft der dokumentierte Prüfbefehl auf der gewählten Revision? Sind Abhängigkeiten reproduzierbar? Welche Prüfungen benötigen Dienste, Netzwerk, Umgebungsvariablen oder ausschließlich im Setup verfügbare Secrets?",
    ],
    ["task readiness", "Aufgabe bereit"],
    ["Task readiness", "Auftragsbereitschaft"],
    [
      "Is the observable goal explicit? Are acceptance checks runnable in this environment? Are excluded files and systems named? Who reviews the diff and verification logs before merge?",
      "Ist das beobachtbare Ziel ausdrücklich benannt? Sind Akzeptanzprüfungen in dieser Umgebung ausführbar? Sind ausgeschlossene Dateien und Systeme genannt? Wer prüft Diff und Prüfprotokolle vor dem Merge?",
    ],
    [
      "Two questions on the sandbox contract.",
      "Zwei Fragen zum Sandbox-Rahmen.",
    ],
    ["Adjust the task for the sandbox", "Auftrag an die Sandbox anpassen"],
    [
      "Fetch our OpenAPI spec from https://docs.acme.com/v3/openapi.json and generate TypeScript types.",
      "Lade unsere OpenAPI-Spezifikation von https://docs.acme.com/v3/openapi.json und erzeuge TypeScript-Typen.",
    ],
    [
      "Using the spec at ./schemas/openapi.json (committed to the repo), generate TypeScript types in src/types/api.ts. Regenerate on CI.",
      "Erzeuge anhand der versionierten Spezifikation in ./schemas/openapi.json TypeScript-Typen in src/types/api.ts. Die CI regeneriert und prüft sie.",
    ],
    [
      "The repository fixture removes a network dependency and makes the input version-reviewable. If freshness is required, define a separate controlled update step.",
      "Das Repository-Fixture entfernt eine Netzwerkabhängigkeit und macht die Eingabe versioniert prüfbar. Wenn Aktualität erforderlich ist, definiere dafür einen getrennten kontrollierten Aktualisierungsschritt.",
    ],
    [
      "Illustrative session: unavailable network",
      "Beispielsitzung: Netzwerk nicht verfügbar",
    ],
    ["codex> planning…", "codex> plant…"],
    [
      "  plan: 1) hit stripe test api  2) parse response  3) update doc",
      "  Plan: 1) Stripe-Test-API aufrufen  2) Antwort auswerten  3) Dokument aktualisieren",
    ],
    [
      "codex> network appears blocked. checking AGENTS.md for fixtures…",
      "codex> Netzwerk scheint blockiert · prüft AGENTS.md auf Fixtures…",
    ],
    [
      "→ stripe_subscription_active.json · stripe_subscription_canceled.json",
      "→ stripe_subscription_active.json · stripe_subscription_canceled.json",
    ],
    [
      "codex> using fixtures instead. proceeding…",
      "codex> verwendet stattdessen Fixtures · fährt fort…",
    ],
    [
      "→ plan adapted: sandbox-compatible",
      "→ Plan angepasst: mit Sandbox vereinbar",
    ],
    [
      "A cloud task must run end-to-end tests against a staging API. What must be established before the run?",
      "Ein Cloud-Auftrag soll End-to-End-Tests gegen eine Staging-API ausführen. Was muss vor dem Lauf feststehen?",
    ],
    [
      "Nothing; naming the staging API in the task grants access.",
      "Nichts; die Nennung der Staging-API im Auftrag erteilt den Zugriff.",
    ],
    [
      "The environment permits agent-phase network access to the destination, scoped credentials are available through an approved path, and the external test is authorized.",
      "Die Umgebung erlaubt in der Agentenphase Netzwerkzugriff auf das Ziel, begrenzte Zugangsdaten stehen über einen freigegebenen Pfad bereit und die externe Prüfung ist autorisiert.",
    ],
    [
      "The cloud task automatically uses the developer's local network.",
      "Der Cloud-Auftrag nutzt automatisch das lokale Netzwerk des Entwicklers.",
    ],
    [
      "A passing local unit test proves the staging check ran.",
      "Ein bestandener lokaler Unit-Test belegt die Ausführung der Staging-Prüfung.",
    ],
    [
      "Cloud agent-phase network access is disabled by default and configured per environment. External verification also requires explicit authorization and appropriately scoped credentials. When those controls are unavailable, use fixtures for the coding task and keep staging verification separate.",
      "Ohne zugesicherten Netzwerkzugriff ist die Staging-API kein verfügbarer Testgegenstand. Verwende Fixtures, erteile eine eng begrenzte Freigabe für die Staging-Domäne oder trenne Codeänderung und externe E2E-Verifikation in zwei kontrollierte Schritte.",
    ],
    [
      "Which statement correctly distinguishes local and cloud Codex execution?",
      "Welche Aussage unterscheidet lokale und Cloud-Ausführung von Codex korrekt?",
    ],
    [
      "Both surfaces always run in a newly created cloud container.",
      "Beide Oberflächen laufen in jedem Fall in einem neu erstellten Cloud-Container.",
    ],
    [
      "Local commands follow the configured workspace sandbox and approvals; a cloud task uses a dedicated checked-out environment with its own setup and network policy.",
      "Lokale Befehle folgen der konfigurierten Workspace-Sandbox und den Freigaben; ein Cloud-Auftrag nutzt eine dedizierte ausgecheckte Umgebung mit eigenem Setup und eigener Netzwerkrichtlinie.",
    ],
    [
      "Local sessions always have unrestricted network access.",
      "Lokale Sitzungen besitzen uneingeschränkten Netzwerkzugriff.",
    ],
    [
      "Cloud tasks automatically deploy an accepted diff.",
      "Cloud-Aufträge deployen einen angenommenen Diff automatisch.",
    ],
    [
      "The execution surface determines the boundary. Local work happens in the selected working tree under its sandbox and approval configuration. Cloud work happens in a dedicated container created from a selected repository revision; its final answer and diff still require human review.",
      "Die Ausführungsoberfläche bestimmt die Grenze. Lokale Arbeit erfolgt im gewählten Working Tree unter dessen Sandbox- und Freigabekonfiguration. Cloud-Arbeit erfolgt in einem dedizierten Container aus einer gewählten Repository-Revision; Abschlussantwort und Diff benötigen weiterhin menschliches Review.",
    ],
  ],
  preserve: [
    "$ curl -s https://api.stripe.com/v1/subscriptions",
    "→ curl: (6) Could not resolve host: api.stripe.com",
    "$ ls tests/fixtures/",
  ],
});
