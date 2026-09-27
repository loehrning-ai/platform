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
      "- **Local CLI and IDE sessions** run commands on your machine in the configured OS-enforced sandbox. The common workspace-write setting allows writes only in the active workspace and keeps the network off until you enable it. A separate approval policy decides when Codex must ask first.\n- **Cloud tasks** run in a dedicated OpenAI-managed container. Codex checks out the chosen repository and commit, runs the setup, does the task and returns a summary and diff. Setup may use the network and setup-only secrets. The secrets are removed before the agent phase, whose network access is off by default and enabled per environment.\n\nRead the active settings before you rely on them.",
      "- **Lokale CLI- und IDE-Sitzungen** führen Befehle auf deinem Rechner aus, in der konfigurierten Sandbox des Betriebssystems. Die übliche Workspace-Write-Einstellung erlaubt Schreibzugriffe nur im aktiven Workspace und hält das Netzwerk zu, bis du es einschaltest. Eine eigene Freigaberichtlinie legt fest, wann Codex vorher fragen muss.\n- **Cloud-Aufträge** laufen in einem dedizierten Container, den OpenAI verwaltet. Codex checkt Repository und Commit aus, fährt das Setup, bearbeitet den Auftrag und liefert Zusammenfassung und Diff. Das Setup darf ins Netz und Setup-Secrets nutzen. Die Secrets werden vor der Agentenphase entfernt, deren Netzwerkzugriff standardmäßig aus ist und pro Umgebung eingeschaltet wird.\n\nLies die aktiven Einstellungen nach, bevor du dich darauf verlässt.",
    ],
    ["Plan for the active boundary", "Für die aktive Grenze planen"],
    [
      "**Make dependencies reproducible.** Locally, Codex has only what the machine has and the sandbox permits; in the cloud, the setup script provides it. Put the exact setup and check commands in the repository.\n\n**Declare network needs.** If the task needs no live data, use a versioned fixture and leave the network off.\n\n**Keep external checks separate.** Staging or production access is a security decision and needs scoped credentials and explicit authorization. Otherwise the check runs through the normal release process.",
      "**Abhängigkeiten reproduzierbar machen.** Lokal hat Codex nur, was auf dem Rechner liegt und die Sandbox erlaubt, in der Cloud stellt das Setup-Skript es bereit. Die exakten Setup- und Prüfkommandos gehören ins Repository.\n\n**Netzwerkbedarf benennen.** Braucht der Auftrag keine Live-Daten, nimm ein versioniertes Fixture und lass das Netzwerk aus.\n\n**Externe Prüfungen trennen.** Zugriff auf Staging oder Produktion ist eine Sicherheitsentscheidung und braucht begrenzte Zugangsdaten und ausdrückliche Freigabe. Sonst läuft die Prüfung über den normalen Release-Prozess.",
    ],
    ["Cloud environment inputs", "Eingaben einer Cloud-Umgebung"],
    [
      "A cloud environment is a base image plus the inputs below.",
      "Eine Cloud-Umgebung ist ein Basis-Image plus die folgenden Eingaben.",
    ],
    ["provided by you", "von dir bereitgestellt"],
    ["Setup script", "Setup-Skript"],
    [
      "Installs project dependencies and the task's test fixtures after checkout.",
      "Installiert nach dem Checkout Projektabhängigkeiten und die Test-Fixtures des Auftrags.",
    ],
    ["Environment variables", "Umgebungsvariablen"],
    [
      "Non-secret values stay available. Setup-only secrets are gone in the agent phase, so the task must not depend on them.",
      "Nicht geheime Werte bleiben verfügbar. Setup-Secrets sind in der Agentenphase weg, der Auftrag darf also nicht von ihnen abhängen.",
    ],
    ["Network allow-list", "Netzwerk-Freigabeliste"],
    [
      "Set per environment. If enabled, allow only the destinations and HTTP methods the task needs.",
      "Internetzugriff wird pro Umgebung eingestellt. Ist er an, erlaube nur die Ziele und HTTP-Methoden, die der Auftrag braucht.",
    ],
    ["provided by Codex", "von der Laufzeit bereitgestellt"],
    ["The runtime", "Die Laufzeit"],
    [
      "A dedicated container with the checked-out repository and the base image's tools.",
      "Ein dedizierter Container mit ausgechecktem Repository und den Werkzeugen des Basis-Images.",
    ],
    ["Illustrative network failure", "Beispiel: Netzwerkziel nicht verfügbar"],
    [
      "The task calls a Stripe test endpoint, and the environment cannot resolve the host. Codex reports the boundary and uses a reviewed fixture if one represents the required behavior.",
      "Der Auftrag ruft einen Stripe-Testendpunkt auf, und die Umgebung kann den Host nicht auflösen. Codex meldet die Grenze und nimmt ein geprüftes Fixture, sofern es das verlangte Verhalten abbildet.",
    ],
    ["Keep changes reviewable", "Änderungen prüfbar halten"],
    [
      "Git structure decides how easily a cloud checkout or your local working tree can be reviewed and merged.\n\n- **Separate working trees or cloud environments for concurrent tasks.** Separate branches avoid shared file state, but overlapping diffs can still conflict.\n- **One reviewable behavior and its tests per change**, whatever the line count.\n- **A deliberate base commit.** Record it and refresh it when upstream changes touch the same area.\n- **Trusted checks re-run outside the task when the risk warrants it.** Agent logs show what ran there; CI and the reviewer's own runs are independent evidence.",
      "Wie leicht sich ein Cloud-Checkout oder dein lokaler Working Tree prüfen und mergen lässt, entscheidet die Git-Struktur.\n\n- **Getrennte Worktrees oder Cloud-Umgebungen für gleichzeitige Aufträge.** Getrennte Branches verhindern geteilten Dateizustand, überlappende Diffs können trotzdem kollidieren.\n- **Ein prüfbares Verhalten samt Tests pro Änderung**, egal wie viele Zeilen.\n- **Ein bewusst gewählter Basis-Commit.** Halte ihn fest und zieh ihn nach, wenn vorgelagerte Änderungen denselben Bereich treffen.\n- **Vertrauenswürdige Prüfungen außerhalb des Auftrags wiederholen, wenn das Risiko es rechtfertigt.** Agentenprotokolle zeigen, was dort lief. Unabhängige Nachweise liefern CI und eigene Läufe der Reviewerin.",
    ],
    [
      "Output is evidence for your review.",
      "Die Ausgabe ist Nachweis für dein Review.",
    ],
    [
      "Read the diff against requested behavior and excluded scope, including additions, deletions, dependencies, generated files and test changes. The logs show what actually ran.",
      "Lies den Diff gegen verlangtes Verhalten und ausgeschlossenen Umfang, samt Ergänzungen, Löschungen, Abhängigkeiten, generierten Dateien und Teständerungen. Die Protokolle zeigen, was wirklich lief.",
    ],
    ["Pre-flight checklist", "Prüfliste vor dem Start"],
    [
      "Write down the environment assumptions before the task starts.",
      "Schreib die Annahmen zur Umgebung auf, bevor der Auftrag startet.",
    ],
    ["environment", "Umgebung"],
    ["Sandbox readiness", "Sandbox-Bereitschaft"],
    [
      "Does the documented check command run on this revision with reproducible dependencies? Which checks need services, network, environment variables or setup-only secrets?",
      "Läuft der dokumentierte Prüfbefehl auf dieser Revision mit reproduzierbaren Abhängigkeiten? Welche Prüfungen brauchen Dienste, Netzwerk, Umgebungsvariablen oder Setup-Secrets?",
    ],
    ["task", "Auftrag"],
    ["Task readiness", "Auftragsbereitschaft"],
    [
      "Is the observable goal stated, and do the acceptance checks run here? Are excluded files and systems named? Who reviews diff and logs before merge?",
      "Steht das beobachtbare Ziel da, und laufen die Akzeptanzprüfungen hier? Sind ausgeschlossene Dateien und Systeme genannt? Wer liest Diff und Protokolle vor dem Merge?",
    ],
    ["Two questions follow.", "Es folgen zwei Fragen."],
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
      "The committed file removes the network dependency and puts the input under version control. If freshness matters, add a separate controlled update step.",
      "Die Datei im Repository nimmt die Netzwerkabhängigkeit heraus und stellt die Eingabe unter Versionskontrolle. Zählt Aktualität, kommt ein eigener, kontrollierter Update-Schritt dazu.",
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
      "A cloud task must run end-to-end tests against a staging API. What must be in place first?",
      "Ein Cloud-Auftrag soll End-to-End-Tests gegen eine Staging-API ausführen. Was muss vorher stehen?",
    ],
    [
      "Nothing; naming the staging API in the task grants access.",
      "Nichts, wer die Staging-API im Auftrag nennt, hat den Zugriff.",
    ],
    [
      "Agent-phase network access to the host, scoped credentials and authorization for the test.",
      "Netzwerkzugriff der Agentenphase auf den Host, begrenzte Zugangsdaten und eine Freigabe für den Test.",
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
      "Agent-phase network access is off by default and set per environment, and external checks need authorization and scoped credentials. Without them, the coding task uses fixtures and staging verification stays separate.",
      "Netzwerkzugriff in der Agentenphase ist standardmäßig aus und wird pro Umgebung eingestellt, externe Prüfungen brauchen Freigabe und begrenzte Zugangsdaten. Fehlt das, nutzt der Codeauftrag Fixtures, und die Staging-Prüfung bleibt ein eigener Schritt.",
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
      "Local runs under sandbox and approvals; cloud in a dedicated container with its own setup and network policy.",
      "Lokal gelten Sandbox und Freigaben, in der Cloud ein eigener Container mit eigenem Setup und Netzwerkrichtlinie.",
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
      "Local work runs in the selected working tree under its sandbox and approval settings; cloud work runs in a dedicated container built from a chosen revision. Both results still need human review.",
      "Lokal läuft die Arbeit im gewählten Working Tree unter dessen Sandbox- und Freigabeeinstellungen, in der Cloud in einem dedizierten Container aus einer gewählten Revision. Beide Ergebnisse brauchen menschliches Review.",
    ],
  ],
  preserve: [
    "$ curl -s https://api.stripe.com/v1/subscriptions",
    "→ curl: (6) Could not resolve host: api.stripe.com",
    "$ ls tests/fixtures/",
  ],
});
