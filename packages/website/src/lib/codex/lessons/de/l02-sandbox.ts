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
      "Lokal folgt Codex der konfigurierten Workspace-Sandbox und der Freigaberichtlinie. Cloud-Aufträge laufen in dedizierten Umgebungen mit eigener Netzwerkkontrolle.",
    ],
    [
      "Know where commands run and what they can reach.",
      "Wisse, wo Befehle laufen und was sie erreichen.",
    ],
    ["Local sandbox", "Lokale Sandbox"],
    ["Cloud environment", "Cloud-Umgebung"],
    ["Approval policy", "Freigaberichtlinie"],
    ["Network configuration", "Netzwerkkonfiguration"],
    ["Local and cloud are different", "Lokal ist nicht Cloud"],
    [
      "Codex has two execution models that must not be conflated.\n\n- **Local CLI and IDE sessions** run commands on your machine inside the configured OS-enforced sandbox. The common workspace-write configuration limits writes to the active workspace and keeps network access off unless enabled. The approval policy is a separate control that determines when Codex must ask before an action crosses the configured boundary.\n- **Cloud tasks** run in a dedicated OpenAI-managed container. Codex checks out the selected repository and commit, runs the environment setup, performs the task, and returns a summary and diff. Setup can use network access and setup-only secrets; those secrets are removed before the agent phase. Agent-phase network access is disabled by default and can be enabled per environment.\n\nFilesystem access, network access, and approvals are configuration choices. Inspect the active settings instead of inferring them from the Codex product name.",
      "Codex hat zwei Ausführungsmodelle. Wirf sie nicht in einen Topf.\n\n- **Lokale CLI- und IDE-Sitzungen** führen Befehle auf deinem Rechner aus, in der konfigurierten Sandbox, die das Betriebssystem durchsetzt. Die übliche Workspace-Write-Konfiguration erlaubt Schreibzugriffe nur im aktiven Workspace und hält das Netzwerk zu, bis du es freigibst. Die Freigaberichtlinie ist eine eigene Stellschraube: Sie legt fest, wann Codex fragen muss, bevor eine Aktion die Grenze überschreitet.\n- **Cloud-Aufträge** laufen in einem dedizierten Container, den OpenAI verwaltet. Codex checkt Repository und Commit aus, fährt das Setup, bearbeitet den Auftrag und liefert Zusammenfassung und Diff. Das Setup darf ins Netz und Setup-Secrets nutzen; die sind vor der Agentenphase wieder weg. Netzwerkzugriff in der Agentenphase ist standardmäßig aus und wird pro Umgebung eingeschaltet.\n\nDateisystem, Netzwerk und Freigaben sind Konfiguration. Lies die aktiven Einstellungen nach, statt sie aus dem Produktnamen zu raten.",
    ],
    [
      "A task is executable only when its required files, commands, dependencies, credentials, and network destinations fit the active environment policy.",
      "Ausführbar ist ein Auftrag erst, wenn Dateien, Befehle, Abhängigkeiten, Zugangsdaten und Netzwerkziele in die aktive Umgebungsrichtlinie passen.",
    ],
    ["Plan for the active boundary", "Für die aktive Grenze planen"],
    [
      "Three checks prevent most environment-related ambiguity.\n\n**Make dependencies reproducible.** A cloud setup script can install project runtimes, packages, and fixtures before the agent phase. A local session uses the tools available on the machine and permitted by its sandbox. Document the exact setup and verification commands in the repository.\n\n**Declare network requirements.** A cloud agent phase cannot reach an external API unless network access is enabled for that environment and the destination is allowed. Local network access also depends on sandbox configuration. Prefer a versioned fixture when live data is not required.\n\n**Separate code changes from external-state verification.** Access to staging or production is a security decision, not a convenience. Use scoped credentials and explicit authorization when external validation is required; otherwise keep the coding task isolated and perform the external check through the normal release process.",
      "Drei Prüfungen räumen die meisten Umgebungsfragen weg.\n\n**Abhängigkeiten reproduzierbar machen.** In der Cloud installiert ein Setup-Skript vor der Agentenphase Laufzeiten, Pakete und Fixtures. Lokal hat Codex nur, was auf dem Rechner liegt und die Sandbox erlaubt. Die exakten Setup- und Prüfkommandos gehören ins Repository.\n\n**Netzwerkbedarf benennen.** Eine externe API erreicht die Cloud-Agentenphase nur mit aktivem Netzwerkzugriff und freigegebenem Ziel. Lokal entscheidet die Sandbox-Konfiguration. Ohne Bedarf an Live-Daten nimm ein versioniertes Fixture.\n\n**Codeänderung und Prüfung externen Zustands trennen.** Zugriff auf Staging oder Produktion ist eine Sicherheitsentscheidung, keine Bequemlichkeit. Externe Prüfung nur mit begrenzten Zugangsdaten und ausdrücklicher Freigabe. Sonst bleibt die Codeaufgabe isoliert, und der externe Check läuft über den normalen Release-Prozess.",
    ],
    ["Cloud environment inputs", "Eingaben einer Cloud-Umgebung"],
    [
      "A cloud environment combines a base image with repository-specific setup and policy. Review these inputs before assigning a task:",
      "Eine Cloud-Umgebung ist Basis-Image plus dein Setup plus deine Richtlinien. Vor dem Auftrag gehst du sie durch:",
    ],
    ["provided by you", "von dir bereitgestellt"],
    ["Setup script", "Setup-Skript"],
    [
      "A reproducible command sequence that runs after checkout during setup. Use it to install project dependencies and prepare test fixtures required by the task.",
      "Eine reproduzierbare Befehlsfolge nach dem Checkout. Hier installierst du Projektabhängigkeiten und legst die Test-Fixtures bereit, die der Auftrag braucht.",
    ],
    ["Environment variables", "Umgebungsvariablen"],
    [
      "Non-secret configuration can remain available for the task. Setup-only secrets are available during setup and removed before the agent phase; do not design the task around reading them later.",
      "Nicht geheime Konfiguration kann während des Auftrags verfügbar bleiben. Setup-Secrets sind vor der Agentenphase wieder weg; baue keinen Auftrag, der sie später lesen will.",
    ],
    ["Network allow-list", "Netzwerk-Freigabeliste"],
    [
      "Agent-phase internet access is configured per environment. When enabled, restrict destinations and HTTP methods to what the task requires.",
      "Internetzugriff in der Agentenphase ist pro Umgebung konfiguriert. Schaltest du ihn ein, begrenze Ziele und HTTP-Methoden auf den Bedarf des Auftrags.",
    ],
    ["provided by Codex", "von der Laufzeit bereitgestellt"],
    ["The runtime", "Die Laufzeit"],
    [
      "A dedicated container with a checked-out repository and the tools supplied by the base image. The setup script adds project-specific requirements.",
      "Ein dedizierter Container mit ausgechecktem Repository und den Werkzeugen des Basis-Images. Alles Projektspezifische kommt aus dem Setup-Skript.",
    ],
    ["Illustrative network failure", "Beispiel: Netzwerkziel nicht verfügbar"],
    [
      "The task asks for a call to a Stripe test endpoint, but the configured environment cannot resolve the destination. The useful response is to report that boundary and use a reviewed fixture when it represents the required behavior.",
      "Der Auftrag will einen Stripe-Testendpunkt aufrufen. Die Umgebung kann den Host nicht auflösen. Die brauchbare Reaktion: die Grenze melden und auf ein geprüftes Fixture ausweichen, sofern es das verlangte Verhalten abbildet.",
    ],
    ["Keep changes reviewable", "Änderungen prüfbar halten"],
    [
      "A cloud task returns changes from its dedicated checkout. A local session changes the selected working tree or worktree. In either case, Git structure determines how easily the result can be inspected and integrated.\n\n- **Give concurrent tasks separate working trees or cloud environments.** Separate branches prevent shared file state, but overlapping diffs can still conflict when merged.\n- **Keep each change coherent.** Scope by one reviewable behavior and its tests, not by an arbitrary line or file limit.\n- **Start from an intentional base commit.** Record which revision the task uses and refresh it when upstream changes affect the same area.\n- **Re-run trusted checks outside the task when risk warrants it.** Agent-produced logs show what ran in that environment; CI and reviewer-run checks provide independent evidence.",
      "Ein Cloud-Auftrag liefert Änderungen aus seinem eigenen Checkout, eine lokale Sitzung schreibt in den gewählten Working Tree oder Worktree. Wie gut sich das Ergebnis prüfen und integrieren lässt, entscheidet in beiden Fällen die Git-Struktur.\n\n- **Gleichzeitige Aufträge bekommen getrennte Worktrees oder Cloud-Umgebungen.** Getrennte Branches verhindern geteilten Dateizustand; überlappende Diffs kollidieren beim Merge trotzdem.\n- **Eine Änderung, ein Verhalten.** Grenze nach einem prüfbaren Verhalten samt Tests ab, nicht nach Zeilen- oder Dateizahl.\n- **Starte von einem bewussten Basis-Commit.** Halte die Revision fest und zieh sie nach, wenn vorgelagerte Änderungen denselben Bereich treffen.\n- **Wiederhole vertrauenswürdige Prüfungen außerhalb des Auftrags, wenn das Risiko es rechtfertigt.** Agentenprotokolle zeigen, was in dieser Umgebung lief. Unabhängige Nachweise liefern CI und die Reviewerin, die selbst nachtestet.",
    ],
    [
      "Treat output as evidence, not approval.",
      "Ausgabe ist Nachweis, keine Freigabe.",
    ],
    [
      "Read the diff against the requested behavior and excluded scope. Inspect additions, deletions, dependencies, generated files, and test changes. Review command logs for what actually ran, then repeat security- or release-critical checks in the repository's trusted pipeline.",
      "Lies den Diff gegen verlangtes Verhalten und ausgeschlossenen Umfang. Schau auf Ergänzungen, Löschungen, Abhängigkeiten, generierte Dateien und Teständerungen. Die Befehlsprotokolle sagen dir, was wirklich lief. Sicherheits- und releasekritische Prüfungen wiederholst du in der vertrauenswürdigen Pipeline.",
    ],
    ["Pre-flight checklist", "Prüfliste vor dem Start"],
    [
      "Before starting a task, record the environment assumptions that affect execution and review.",
      "Schreib vor dem Start auf, welche Umgebungsannahmen Ausführung und Review beeinflussen.",
    ],
    ["sandbox readiness", "Sandbox bereit"],
    ["Sandbox readiness", "Sandbox-Bereitschaft"],
    [
      "Does the documented check command run from the selected revision? Are dependencies reproducible? Which checks require services, network, environment variables, or setup-only secrets?",
      "Läuft der dokumentierte Prüfbefehl auf der gewählten Revision? Sind die Abhängigkeiten reproduzierbar? Welche Prüfungen brauchen Dienste, Netzwerk, Umgebungsvariablen oder Setup-Secrets?",
    ],
    ["task readiness", "Aufgabe bereit"],
    ["Task readiness", "Auftragsbereitschaft"],
    [
      "Is the observable goal explicit? Are acceptance checks runnable in this environment? Are excluded files and systems named? Who reviews the diff and verification logs before merge?",
      "Steht das beobachtbare Ziel ausdrücklich da? Laufen die Akzeptanzprüfungen in dieser Umgebung? Sind ausgeschlossene Dateien und Systeme genannt? Wer liest Diff und Prüfprotokolle vor dem Merge?",
    ],
    ["Two questions on the sandbox contract.", "Zwei Fragen zur Sandbox."],
    ["Adjust the task for the sandbox", "Auftrag an die Sandbox anpassen"],
    [
      "Fetch our OpenAPI spec from https://docs.acme.com/v3/openapi.json and generate TypeScript types.",
      "Lade unsere OpenAPI-Spezifikation von https://docs.acme.com/v3/openapi.json und erzeuge TypeScript-Typen.",
    ],
    [
      "Using the spec at ./schemas/openapi.json (committed to the repo), generate TypeScript types in src/types/api.ts. Regenerate on CI.",
      "Erzeuge aus ./schemas/openapi.json (liegt im Repo) TypeScript-Typen in src/types/api.ts. Regenerieren auf der CI.",
    ],
    [
      "The repository fixture removes a network dependency and makes the input version-reviewable. If freshness is required, define a separate controlled update step.",
      "Die Datei im Repository nimmt die Netzwerkabhängigkeit heraus und macht die Eingabe versioniert prüfbar. Braucht es Aktualität, gibt es dafür einen eigenen, kontrollierten Update-Schritt.",
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
      "Nichts, wer die Staging-API im Auftrag nennt, hat den Zugriff.",
    ],
    [
      "The environment permits agent-phase network access to the destination, scoped credentials are available through an approved path, and the external test is authorized.",
      "Die Umgebung erlaubt in der Agentenphase Netzwerkzugriff auf das Ziel, begrenzte Zugangsdaten kommen über einen freigegebenen Pfad, und die externe Prüfung ist autorisiert.",
    ],
    [
      "The cloud task automatically uses the developer's local network.",
      "Der Cloud-Auftrag nutzt automatisch das lokale Netzwerk der Entwicklerin.",
    ],
    [
      "A passing local unit test proves the staging check ran.",
      "Ein grüner lokaler Unit-Test belegt, dass die Staging-Prüfung lief.",
    ],
    [
      "Cloud agent-phase network access is disabled by default and configured per environment. External verification also requires explicit authorization and appropriately scoped credentials. When those controls are unavailable, use fixtures for the coding task and keep staging verification separate.",
      "Netzwerkzugriff in der Cloud-Agentenphase ist standardmäßig aus und pro Umgebung konfiguriert. Die externe Prüfung braucht zusätzlich Freigabe und begrenzte Zugangsdaten. Fehlt das, arbeitet der Codeauftrag mit Fixtures, und die Staging-Prüfung bleibt ein eigener Schritt.",
    ],
    [
      "Which statement correctly distinguishes local and cloud Codex execution?",
      "Welche Aussage unterscheidet lokale und Cloud-Ausführung von Codex korrekt?",
    ],
    [
      "Both surfaces always run in a newly created cloud container.",
      "Beide Oberflächen laufen immer in einem frisch erstellten Cloud-Container.",
    ],
    [
      "Local commands follow the configured workspace sandbox and approvals; a cloud task uses a dedicated checked-out environment with its own setup and network policy.",
      "Lokale Befehle folgen der konfigurierten Workspace-Sandbox und den Freigaben; ein Cloud-Auftrag nutzt eine dedizierte ausgecheckte Umgebung mit eigenem Setup und eigener Netzwerkrichtlinie.",
    ],
    [
      "Local sessions always have unrestricted network access.",
      "Lokale Sitzungen haben immer uneingeschränkten Netzwerkzugriff.",
    ],
    [
      "Cloud tasks automatically deploy an accepted diff.",
      "Cloud-Aufträge deployen einen angenommenen Diff automatisch.",
    ],
    [
      "The execution surface determines the boundary. Local work happens in the selected working tree under its sandbox and approval configuration. Cloud work happens in a dedicated container created from a selected repository revision; its final answer and diff still require human review.",
      "Die Oberfläche bestimmt die Grenze. Lokal läuft die Arbeit im gewählten Working Tree unter dessen Sandbox- und Freigabekonfiguration, in der Cloud in einem dedizierten Container aus einer gewählten Repository-Revision. Antwort und Diff brauchen trotzdem menschliches Review.",
    ],
  ],
  preserve: [
    "$ curl -s https://api.stripe.com/v1/subscriptions",
    "→ curl: (6) Could not resolve host: api.stripe.com",
    "$ ls tests/fixtures/",
  ],
});
