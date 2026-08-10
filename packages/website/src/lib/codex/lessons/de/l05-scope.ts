import canonical from "../l05-scope";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    ["Scoping Coherent Changes", "Zusammenhängende Änderungen abgrenzen"],
    [
      "Separate work by behavior, dependency, and review boundary instead of relying on arbitrary time, file, or line limits.",
      "Trenne Arbeit nach Verhalten, Abhängigkeiten und Review-Grenzen statt nach pauschalen Zeit-, Datei- oder Zeilenlimits.",
    ],
    [
      "One change, one reviewable purpose.",
      "Eine Änderung, ein prüfbarer Zweck.",
    ],
    ["Task sizing", "Aufgabengröße"],
    ["Slicing moves", "Zerlegungsmuster"],
    ["Bounded changes", "Abgegrenzte Änderungen"],
    ["Scope creep", "Unkontrollierte Ausweitung"],
    ["A reviewable unit of work", "Eine prüfbare Arbeitseinheit"],
    [
      "No universal file count, line count, or duration defines a suitable Codex task. Scope by **cohesion and evidence** instead. A useful task usually:\n\n- changes one observable behavior or one enabling structure;\n- has dependencies that can be named before implementation;\n- has a diff that a reviewer can understand as one decision;\n- includes checks that exercise the changed behavior; and\n- can be reverted without also removing unrelated work.\n\nSplit the task when parts can be implemented, verified, deployed, or rolled back independently. Keep coupled changes together when separating them would create an invalid intermediate state.",
      "Keine allgemeingültige Datei-, Zeilen- oder Zeitgrenze definiert einen geeigneten Codex-Auftrag. Grenze stattdessen nach **Zusammenhang und Nachweisen** ab. Ein brauchbarer Auftrag:\n\n- ändert ein beobachtbares Verhalten oder eine dafür notwendige Struktur;\n- besitzt vor der Umsetzung benennbare Abhängigkeiten;\n- erzeugt einen Diff, den das Review als eine Entscheidung verstehen kann;\n- enthält Prüfungen für das geänderte Verhalten; und\n- lässt sich zurücknehmen, ohne unabhängige Arbeit ebenfalls zu entfernen.\n\nTrenne Teile, wenn sie unabhängig umgesetzt, geprüft, ausgeliefert oder zurückgenommen werden können. Halte gekoppelte Änderungen zusammen, wenn die Trennung einen ungültigen Zwischenzustand erzeugt.",
    ],
    [
      "A planning ticket may describe an initiative. An implementation task should describe one coherent, reviewable change.",
      "Grenze den Auftrag für Implementierung und Review ab, nicht nach der Größe eines Planungstickets.",
    ],
    ["Three slicing moves", "Drei Zerlegungsmuster"],
    [
      "Three decomposition patterns cover many broad changes. Choose the one that preserves valid intermediate states and clear ownership:",
      "Drei Zerlegungsmuster decken viele breite Änderungen ab. Wähle das Muster, das gültige Zwischenzustände und eindeutige Verantwortung erhält:",
    ],
    ["move 01 · horizontal", "Muster 01 · horizontal"],
    ["Split by layer", "Nach Schicht trennen"],
    [
      "Separate schema, API, and interface changes when each layer can be introduced compatibly. State the dependency order and the temporary contract between layers.",
      "Trenne Schema-, API- und Oberflächenänderungen, wenn jede Schicht kompatibel eingeführt werden kann. Benenne Abhängigkeitsreihenfolge und vorübergehenden Vertrag zwischen den Schichten.",
    ],
    ["move 02 · vertical", "Muster 02 · vertikal"],
    ["Split by entity", "Nach Entität trennen"],
    [
      "Apply the same behavior to Users, Projects, and Teams as separate tasks when their code and rollout paths are independent. Shared infrastructure should land first.",
      "Setze dasselbe Verhalten für Users, Projects und Teams als getrennte Aufträge um, wenn ihre Code- und Rollout-Pfade unabhängig sind. Gemeinsame Infrastruktur wird zuerst integriert.",
    ],
    ["move 03 · prep/do", "Muster 03 · Vorbereitung und Änderung"],
    ["Do the plumbing first", "Voraussetzung zuerst schaffen"],
    [
      "First introduce a behavior-preserving structural change with its own checks. Then implement the feature against that reviewed structure. Do not separate them if the first change has no standalone value or safe state.",
      "Führe zuerst eine verhaltenserhaltende Strukturänderung mit eigenen Prüfungen ein. Implementiere danach die Funktion gegen diese geprüfte Struktur. Trenne beides nicht, wenn die erste Änderung allein keinen Nutzen oder sicheren Zustand besitzt.",
    ],
    [
      "A central rule is: **change only what the current task requires.** Record independent defects or cleanup opportunities without implementing them in the same diff.\n\nAmbiguous boundaries can mix a requested behavior with unrelated refactoring, dependency changes, or test rewrites. The resulting diff represents several decisions, so reviewers cannot accept, reject, or revert them independently.\n\nThis is *scope creep*. Detect it by comparing the changed files and behaviors with the task's goal, constraints, and exclusions. Do not infer scope from whether the additional code appears useful.",
      "Eine zentrale Regel lautet: **Ändere nur, was der aktuelle Auftrag erfordert.** Dokumentiere unabhängige Fehler oder Bereinigungsmöglichkeiten, ohne sie im selben Diff umzusetzen.\n\nMehrdeutige Grenzen können das verlangte Verhalten mit unabhängigem Refactoring, Abhängigkeitsänderungen oder Testumbauten vermischen. Der Diff steht dann für mehrere Entscheidungen, die sich nicht unabhängig annehmen, ablehnen oder zurücknehmen lassen.\n\nDas ist *Scope Creep*. Erkenne ihn, indem du geänderte Dateien und Verhalten mit Ziel, Einschränkungen und Ausschlüssen des Auftrags vergleichst. Zusätzlicher Code gehört nicht allein deshalb zum Umfang, weil er nützlich erscheint.",
    ],
    ["cost 01", "Kosten 01"],
    ["Review concerns become coupled", "Review-Anliegen werden gekoppelt"],
    [
      "Interleaved feature work and refactoring require the reviewer to reason about their interactions. Line count alone does not measure that burden; independent decisions do.",
      "Vermischte Änderungen sind schwerer zu prüfen als getrennte. Die reine Zeilenzahl bestimmt keine feste Review-Dauer, aber zusätzliche, nicht beauftragte Refaktorierungen erhöhen die Zahl der zu verstehenden Wechselwirkungen.",
    ],
    ["cost 02", "Kosten 02"],
    ["Rollback becomes entangled", "Rücknahme wird gekoppelt"],
    [
      "A revert removes every change in the pull request, including unrelated refactoring and test updates. Narrow scope reduces that coupling but does not by itself make a rollback safe.",
      "Ein Revert nimmt alle Bestandteile eines Pull Requests gemeinsam zurück: Funktion, Refaktorierung und Testumbau. Eng abgegrenzte Änderungen reduzieren diese Kopplung, ersetzen aber keine Risikoprüfung.",
    ],
    [
      'State the boundary directly: *"Change only files required for this task. Record unrelated issues in the pull-request description without fixing them."* This instruction makes extra work visible during review, but it does not replace a concrete scope. Compare:\n\n```\n# Too open\n## Goal\nAdd pagination to the users list endpoint. The current implementation\nreturns all users; we need page-based results.\n\n# Explicit behavior and scope\n## Goal\nAdd page and page_size query params to GET /users in api/users.py.\nDefault: page=1, page_size=20. Max page_size=100 (return 400 if exceeded).\nReturn {"items": [...], "total": N, "page": N, "pages": N}.\n\n## Scope\nChange api/users.py and tests/api/test_users.py. If another file is required,\nexplain why before changing it.\n```',
      'Formuliere die Grenze direkt: *"Ändere nur Dateien, die für diesen Auftrag erforderlich sind. Dokumentiere unabhängige Auffälligkeiten im Pull-Request-Text, behebe sie aber nicht."* Diese Anweisung macht Zusatzarbeit im Review sichtbar, ersetzt aber keinen konkreten Umfang. Vergleiche:\n\n```\n# Zu offen\n## Ziel\nPagination zum Endpunkt für die Benutzerliste hinzufügen. Die aktuelle\nImplementierung liefert alle Benutzer; benötigt werden seitenweise Ergebnisse.\n\n# Ausdrückliches Verhalten und Umfang\n## Ziel\nDie Query-Parameter page und page_size für GET /users in api/users.py ergänzen.\nStandard: page=1, page_size=20. Maximum: page_size=100; darüber Status 400.\nAntwort: {"items": [...], "total": N, "page": N, "pages": N}.\n\n## Umfang\napi/users.py und tests/api/test_users.py ändern. Ist eine weitere Datei erforderlich,\nvor der Änderung begründen.\n```',
    ],
    ["Scope warning signs", "Warnsignale erkennen"],
    [
      'Words such as "also," "while there," and "as needed" often hide a second decision. Name that decision and decide whether it belongs in the same change.',
      'Wörter wie "auch", "bei der Gelegenheit" und "bei Bedarf" verbergen oft eine zweite Entscheidung. Benenne sie und entscheide, ob sie in dieselbe Änderung gehört.',
    ],
    ["Illustrative broad task", "Ablaufbeispiel: gekoppelter Großauftrag"],
    [
      "This example combines schema, query, endpoint, audit, and migration work. The replay shows how failures become difficult to attribute when those concerns share one task.",
      "Dieses Beispiel verbindet Schema-, Query-, Endpunkt-, Audit- und Migrationsarbeit. Der Ablauf zeigt, wie sich Fehler bei mehreren Anliegen in einem Auftrag schwer zuordnen lassen.",
    ],
    [
      "One question on scoping and scope creep.",
      "Eine Frage zu Umfang und Scope Creep.",
    ],
    [
      "Same goal, before and after slicing",
      "Dasselbe Ziel vor und nach der Zerlegung",
    ],
    ["Too big, one task", "Zu breit: ein Auftrag"],
    ["Sliced, three tasks", "Zerlegt: drei Aufträge"],
    [
      'Goal\nAdd soft-delete to Users, Projects, and Teams.\nInclude a "restore" endpoint for each.\nAlso add an audit log of who deleted what.\nMigrate existing hard-deletes we\'ve been stashing in cold storage.',
      "Ziel\nSoft Delete für Users, Projects und Teams ergänzen.\nFür jede Entität einen Restore-Endpunkt anbieten.\nZusätzlich protokollieren, wer welche Entität gelöscht hat.\nBestehende Hard Deletes aus dem Archiv migrieren.",
    ],
    [
      "Task A: schema\nAdd deleted_at and deleted_by to users, projects, teams.\nAdd migration. Don't touch queries yet.\n\nTask B: API\nUpdate list/get endpoints to filter deleted_at IS NULL.\nAdd DELETE → sets deleted_at. Add POST /restore.\n\nTask C: audit\nLog soft-deletes to the audit_events table.\nMigrate cold-storage rows in a separate PR.",
      "Auftrag A: Schema\ndeleted_at und deleted_by zu users, projects und teams hinzufügen.\nMigration ergänzen. Queries noch nicht ändern.\n\nAuftrag B: API\nList- und Get-Endpunkte filtern mit deleted_at IS NULL.\nDELETE setzt deleted_at. POST /restore ergänzen.\n\nAuftrag C: Audit\nSoft Deletes in audit_events protokollieren.\nArchivierte Zeilen in einem separaten Pull Request migrieren.",
    ],
    [
      "The broad version couples schema, API, audit, and data migration. The decomposed version states dependencies and gives each concern a separate review and rollback boundary.",
      "Die breite Fassung beschreibt ein legitimes Vorhaben, koppelt aber Schema, API, Audit und Datenmigration. Die zerlegte Fassung macht Abhängigkeiten und Review-Grenzen sichtbar.",
    ],
    [
      "Session replay: when a task is too big",
      "Sitzungsablauf: zu breiter Auftrag",
    ],
    [
      "codex> planning the four-part task…",
      "codex> plant den vierteiligen Auftrag…",
    ],
    [
      "  plan: schema → queries → endpoints → audit log → migration",
      "  Plan: Schema → Queries → Endpunkte → Audit-Log → Migration",
    ],
    [
      "codex> editing models and schema tests",
      "codex> bearbeitet Modelle und Schema-Tests",
    ],
    ["codex> editing query functions", "codex> bearbeitet Query-Funktionen"],
    [
      "→ failures span schema, query, and existing hard-delete behavior",
      "→ Fehler betreffen Schema, Queries und bestehendes Hard-Delete-Verhalten",
    ],
    [
      "codex> investigating unrelated failures…",
      "codex> untersucht sachfremde Fehler…",
    ],
    [
      "  found: two existing tests depend on hard-delete behavior",
      "  gefunden: zwei bestehende Tests erwarten Hard-Delete-Verhalten",
    ],
    [
      "codex> revising test expectations (risky)",
      "codex> ändert Testerwartungen (riskant)",
    ],
    [
      "→ remaining failure: audit-log ordering is nondeterministic",
      "→ verbleibender Fehler: Reihenfolge des Audit-Logs ist nicht deterministisch",
    ],
    [
      "codex> diff spans several independently reviewable concerns",
      "codex> Diff umfasst mehrere unabhängig prüfbare Anliegen",
    ],
    ["codex> producing patch…", "codex> erzeugt Patch…"],
    [
      '→ result contains schema, API, audit, and migration changes · "needs review"',
      '→ Ergebnis enthält Schema-, API-, Audit- und Migrationsänderungen · "Review erforderlich"',
    ],
    [
      '→ reviewer (you): "can we split this"',
      '→ Review: "Können wir das trennen?"',
    ],
    [
      'You catch yourself writing: "Add feature X, and while we\'re in there, fix the existing pagination bug, and refactor the error handler." What should you do?',
      'Du schreibst: "Funktion X ergänzen, dabei den bestehenden Pagination-Fehler beheben und den Error Handler refaktorisieren." Was ist zu tun?',
    ],
    [
      "Keep it as one task because the changes share a ticket.",
      "Als einen Auftrag starten; Codex kann den gesamten Umfang bearbeiten.",
    ],
    [
      "Split into three tasks. Sequence them so each builds on the last, and each can be reviewed in isolation.",
      "In drei Aufträge trennen, sinnvoll anordnen und jeden unabhängig prüfbar halten.",
    ],
    [
      'Add "please be careful" to the spec.',
      '"Bitte vorsichtig arbeiten" zur Spezifikation hinzufügen.',
    ],
    [
      "Remove the acceptance criteria to shorten the task.",
      "Akzeptanzkriterien entfernen, um den Auftrag zu verkürzen.",
    ],
    [
      "The sentence contains a feature, an independent defect fix, and a refactor. Give each concern its own behavior, evidence, and review boundary, then order them only where a real dependency exists.",
      '"Wenn wir schon dabei sind" kennzeichnet meist ein zusätzliches Anliegen. Funktion, Fehlerbehebung und Refaktorierung benötigen getrennte Akzeptanzkriterien und sollten daher als getrennte Aufträge geplant werden.',
    ],
  ],
  preserve: ["$ pytest"],
});
