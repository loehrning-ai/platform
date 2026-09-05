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
      "Wie viele Dateien darf ein Codex-Auftrag anfassen? Falsche Frage. Keine Datei-, Zeilen- oder Zeitgrenze taugt als Maß. Grenze nach **Zusammenhang und Nachweisen** ab. Meist sieht ein brauchbarer Auftrag so aus:\n\n- Er ändert ein beobachtbares Verhalten oder eine Struktur, die es ermöglicht.\n- Seine Abhängigkeiten lassen sich vor der Umsetzung benennen.\n- Die Reviewerin kann den Diff als eine Entscheidung lesen.\n- Seine Prüfungen treffen das geänderte Verhalten.\n- Er lässt sich zurücknehmen, ohne fremde Arbeit mitzureißen.\n\nTrenne, was sich unabhängig umsetzen, prüfen, ausliefern oder zurücknehmen lässt. Lass zusammen, was getrennt einen ungültigen Zwischenzustand ergäbe.",
    ],
    [
      "A planning ticket may describe an initiative. An implementation task should describe one coherent, reviewable change.",
      "Ein Planungsticket darf ein Vorhaben beschreiben. Ein Implementierungsauftrag beschreibt eine zusammenhängende, prüfbare Änderung.",
    ],
    ["Three slicing moves", "Drei Zerlegungsmuster"],
    [
      "Three decomposition patterns cover many broad changes. Choose the one that preserves valid intermediate states and clear ownership:",
      "Drei Muster decken viele breite Änderungen ab. Nimm das Muster, das gültige Zwischenzustände und klare Verantwortung erhält:",
    ],
    ["move 01 · horizontal", "Muster 01 · horizontal"],
    ["Split by layer", "Nach Schicht trennen"],
    [
      "Separate schema, API, and interface changes when each layer can be introduced compatibly. State the dependency order and the temporary contract between layers.",
      "Schema, API und Oberfläche getrennt, sofern jede Schicht kompatibel einführbar ist. Reihenfolge und vorübergehender Vertrag zwischen den Schichten stehen im Auftrag.",
    ],
    ["move 02 · vertical", "Muster 02 · vertikal"],
    ["Split by entity", "Nach Entität trennen"],
    [
      "Apply the same behavior to Users, Projects, and Teams as separate tasks when their code and rollout paths are independent. Shared infrastructure should land first.",
      "Dasselbe Verhalten für Users, Projects und Teams als drei Aufträge, wenn Code- und Rollout-Pfade unabhängig sind. Gemeinsame Infrastruktur landet zuerst.",
    ],
    ["move 03 · prep/do", "Muster 03 · Vorbereitung und Änderung"],
    ["Do the plumbing first", "Erst die Leitungen legen"],
    [
      "First introduce a behavior-preserving structural change with its own checks. Then implement the feature against that reviewed structure. Do not separate them if the first change has no standalone value or safe state.",
      "Zuerst eine Strukturänderung, die das Verhalten erhält und eigene Prüfungen mitbringt. Dann die Funktion gegen diese geprüfte Struktur. Trenne nicht, wenn der erste Schritt allein weder Nutzen noch sicheren Zustand hat.",
    ],
    [
      "A central rule is: **change only what the current task requires.** Record independent defects or cleanup opportunities without implementing them in the same diff.\n\nAmbiguous boundaries can mix a requested behavior with unrelated refactoring, dependency changes, or test rewrites. The resulting diff represents several decisions, so reviewers cannot accept, reject, or revert them independently.\n\nThis is *scope creep*. Detect it by comparing the changed files and behaviors with the task's goal, constraints, and exclusions. Do not infer scope from whether the additional code appears useful.",
      "Die zentrale Regel: **Ändere nur, was der aktuelle Auftrag verlangt.** Fremde Fehler und Aufräumgelegenheiten notierst du, statt sie im selben Diff zu erledigen.\n\nUnscharfe Grenzen mischen das verlangte Verhalten mit fremdem Refactoring, Abhängigkeitsänderungen oder Testumbauten. Der Diff steht dann für mehrere Entscheidungen, und niemand kann sie einzeln annehmen, ablehnen oder zurücknehmen.\n\nDas ist *Scope Creep*. Du erkennst ihn, indem du geänderte Dateien und Verhalten gegen Ziel, Einschränkungen und Ausschlüsse des Auftrags hältst. Ob der zusätzliche Code nützlich aussieht, spielt keine Rolle.",
    ],
    ["cost 01", "Kosten 01"],
    ["Review concerns become coupled", "Review-Anliegen werden gekoppelt"],
    [
      "Interleaved feature work and refactoring require the reviewer to reason about their interactions. Line count alone does not measure that burden; independent decisions do.",
      "Verzahnte Funktion und Refactoring zwingen die Reviewerin, über deren Wechselwirkungen nachzudenken. Die Zeilenzahl misst diese Last nicht. Die Zahl unabhängiger Entscheidungen schon.",
    ],
    ["cost 02", "Kosten 02"],
    ["Rollback becomes entangled", "Rücknahme wird gekoppelt"],
    [
      "A revert removes every change in the pull request, including unrelated refactoring and test updates. Narrow scope reduces that coupling but does not by itself make a rollback safe.",
      "Ein Revert nimmt den ganzen Pull Request zurück, samt fremdem Refactoring und Testumbau. Enger Umfang senkt diese Kopplung. Sicher wird ein Rollback dadurch allein noch nicht.",
    ],
    [
      'State the boundary directly: *"Change only files required for this task. Record unrelated issues in the pull-request description without fixing them."* This instruction makes extra work visible during review, but it does not replace a concrete scope. Compare:\n\n```\n# Too open\n## Goal\nAdd pagination to the users list endpoint. The current implementation\nreturns all users; we need page-based results.\n\n# Explicit behavior and scope\n## Goal\nAdd page and page_size query params to GET /users in api/users.py.\nDefault: page=1, page_size=20. Max page_size=100 (return 400 if exceeded).\nReturn {"items": [...], "total": N, "page": N, "pages": N}.\n\n## Scope\nChange api/users.py and tests/api/test_users.py. If another file is required,\nexplain why before changing it.\n```',
      'Sag die Grenze direkt: *"Ändere nur Dateien, die dieser Auftrag braucht. Notiere fremde Auffälligkeiten im Pull-Request-Text, behebe sie nicht."* Der Satz macht Zusatzarbeit im Review sichtbar. Einen konkreten Umfang ersetzt er nicht. Vergleiche:\n\n```\n# Zu offen\n## Ziel\nPagination zum Endpunkt für die Benutzerliste hinzufügen. Die aktuelle\nImplementierung liefert alle Benutzer; benötigt werden seitenweise Ergebnisse.\n\n# Ausdrückliches Verhalten und Umfang\n## Ziel\nDie Query-Parameter page und page_size für GET /users in api/users.py ergänzen.\nStandard: page=1, page_size=20. Maximum: page_size=100; darüber Status 400.\nAntwort: {"items": [...], "total": N, "page": N, "pages": N}.\n\n## Umfang\napi/users.py und tests/api/test_users.py ändern. Ist eine weitere Datei erforderlich,\nvor der Änderung begründen.\n```',
    ],
    ["Scope warning signs", "Warnsignale erkennen"],
    [
      'Words such as "also," "while there," and "as needed" often hide a second decision. Name that decision and decide whether it belongs in the same change.',
      '"Auch", "bei der Gelegenheit", "bei Bedarf": Hinter solchen Wörtern steckt oft eine zweite Entscheidung. Sprich sie aus und entscheide, ob sie in dieselbe Änderung gehört.',
    ],
    ["Illustrative broad task", "Ablaufbeispiel: gekoppelter Großauftrag"],
    [
      "This example combines schema, query, endpoint, audit, and migration work. The replay shows how failures become difficult to attribute when those concerns share one task.",
      "Schema, Query, Endpunkt, Audit und Migration in einem Auftrag. Der Ablauf zeigt, was passiert: Fehler lassen sich kaum noch zuordnen.",
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
      "Die breite Fassung koppelt Schema, API, Audit und Datenmigration. Die zerlegte nennt die Abhängigkeiten und gibt jedem Anliegen eine eigene Review- und Rollback-Grenze.",
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
      'Du schreibst: "Funktion X ergänzen, und wenn wir schon dabei sind, den Pagination-Fehler beheben und den Error Handler refaktorisieren." Was tust du?',
    ],
    [
      "Keep it as one task because the changes share a ticket.",
      "Als einen Auftrag lassen, die Änderungen teilen sich ein Ticket.",
    ],
    [
      "Split into three tasks. Sequence them so each builds on the last, and each can be reviewed in isolation.",
      "In drei Aufträge trennen, aufeinander aufbauend anordnen, jeden einzeln prüfbar.",
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
      "Eine Funktion, eine unabhängige Fehlerbehebung, ein Refactoring: drei Anliegen in einem Satz. Jedes bekommt eigenes Verhalten, eigenen Nachweis und eigene Review-Grenze. Reihenfolge nur, wo eine echte Abhängigkeit besteht.",
    ],
  ],
  preserve: ["$ pytest"],
});
