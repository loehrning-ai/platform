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
      "Keep each change to one reviewable purpose.",
      "Halte jede Änderung bei einem prüfbaren Zweck.",
    ],
    ["Task sizing", "Aufgabengröße"],
    ["Slicing moves", "Zerlegungsmuster"],
    ["Bounded changes", "Abgegrenzte Änderungen"],
    ["Scope creep", "Unkontrollierte Ausweitung"],
    ["A reviewable unit of work", "Eine prüfbare Arbeitseinheit"],
    [
      "Scope by **cohesion and evidence**, whatever the file count, line count or time. A useful task usually:\n\n- changes one observable behavior or one enabling structure;\n- has dependencies you can name before implementation;\n- has a diff a reviewer can understand as one decision;\n- includes checks that exercise the changed behavior;\n- can be reverted without removing unrelated work.\n\nSplit a task when its parts can be implemented, verified, deployed or rolled back independently. Keep coupled changes together when splitting them would create an invalid intermediate state.",
      "Grenze nach **Zusammenhang und Nachweisen** ab, egal wie viele Dateien, Zeilen oder Stunden es sind. Ein brauchbarer Auftrag:\n\n- ändert ein beobachtbares Verhalten oder eine Struktur, die es ermöglicht;\n- hat Abhängigkeiten, die sich vor der Umsetzung benennen lassen;\n- hat einen Diff, den die Reviewerin als eine Entscheidung lesen kann;\n- bringt Prüfungen mit, die das geänderte Verhalten treffen;\n- lässt sich zurücknehmen, ohne fremde Arbeit mitzureißen.\n\nTrenne, was sich unabhängig umsetzen, prüfen, ausliefern oder zurücknehmen lässt. Lass zusammen, was getrennt einen ungültigen Zwischenzustand ergäbe.",
    ],
    ["Three slicing moves", "Drei Zerlegungsmuster"],
    [
      "Pick the pattern that keeps intermediate states valid and ownership clear.",
      "Nimm das Muster, das gültige Zwischenzustände und klare Verantwortung erhält.",
    ],
    ["move 01 · horizontal", "Muster 01 · horizontal"],
    ["Split by layer", "Nach Schicht trennen"],
    [
      "Separate schema, API and interface changes when each layer can land compatibly. State the order and the temporary contract between layers.",
      "Schema, API und Oberfläche getrennt, wenn jede Schicht kompatibel landen kann. Reihenfolge und vorübergehenden Vertrag zwischen den Schichten nennst du im Auftrag.",
    ],
    ["move 02 · vertical", "Muster 02 · vertikal"],
    ["Split by entity", "Nach Entität trennen"],
    [
      "Apply the same behavior to Users, Projects and Teams as separate tasks when their code and rollout are independent. Shared infrastructure lands first.",
      "Dasselbe Verhalten für Users, Projects und Teams als eigene Aufträge, wenn Code und Rollout unabhängig sind. Gemeinsame Infrastruktur landet zuerst.",
    ],
    ["move 03 · prep/do", "Muster 03 · Vorbereitung und Änderung"],
    ["Do the plumbing first", "Erst die Leitungen legen"],
    [
      "First a behavior-preserving structural change with its own checks, then the feature on top. Keep both in one task if the first has no standalone value or safe state.",
      "Zuerst eine Strukturänderung, die das Verhalten erhält und eigene Prüfungen mitbringt, dann die Funktion darauf. Bleib bei einem Auftrag, wenn der erste Schritt allein weder Nutzen noch sicheren Zustand hat.",
    ],
    [
      "**Change only what the current task requires.** Record independent defects and cleanup ideas for a separate diff.\n\nWith unclear boundaries, the requested behavior gets mixed with unrelated refactoring, dependency changes and test rewrites. The reviewer then has to reason about their interactions, and a revert removes all of them together. Narrow scope reduces that coupling, though it alone does not make a rollback safe.\n\nThat is *scope creep*. Catch it by comparing changed files and behaviors with the task's goal, constraints and exclusions, however useful the extra code looks.",
      "**Ändere nur, was der aktuelle Auftrag verlangt.** Fremde Fehler und Aufräumideen notierst du für einen eigenen Diff.\n\nBei unscharfen Grenzen mischt sich das verlangte Verhalten mit fremdem Refactoring, Abhängigkeitsänderungen und Testumbauten. Die Reviewerin muss dann ihre Wechselwirkungen durchdenken, und ein Revert nimmt alles zusammen zurück. Enger Umfang senkt diese Kopplung, macht einen Rollback allein aber nicht sicher.\n\nDas ist *Scope Creep*. Du erkennst ihn, indem du geänderte Dateien und Verhalten mit Ziel, Einschränkungen und Ausschlüssen des Auftrags vergleichst, egal wie nützlich der zusätzliche Code aussieht.",
    ],
    [
      "Name the boundary in the task: *\"Change only files required for this task. Record unrelated issues in the pull-request description without fixing them.\"* Extra work then shows up in review. Compare:\n\n```\n# Too open\n## Goal\nAdd pagination to the users list endpoint. The current implementation\nreturns all users; we need page-based results.\n\n# Explicit behavior and scope\n## Goal\nAdd page and page_size query params to GET /users in api/users.py.\nDefault: page=1, page_size=20. Max page_size=100 (return 400 if exceeded).\nReturn {\"items\": [...], \"total\": N, \"page\": N, \"pages\": N}.\n\n## Scope\nChange api/users.py and tests/api/test_users.py. If another file is required,\nexplain why before changing it.\n```",
      "Nenne die Grenze im Auftrag: *\"Ändere nur Dateien, die dieser Auftrag braucht. Notiere fremde Auffälligkeiten im Pull-Request-Text, ohne sie zu beheben.\"* Zusatzarbeit wird dann im Review sichtbar. Vergleiche:\n\n```\n# Zu offen\n## Ziel\nPagination zum Endpunkt für die Benutzerliste hinzufügen. Die aktuelle\nImplementierung liefert alle Benutzer; benötigt werden seitenweise Ergebnisse.\n\n# Ausdrückliches Verhalten und Umfang\n## Ziel\nDie Query-Parameter page und page_size für GET /users in api/users.py ergänzen.\nStandard: page=1, page_size=20. Maximum: page_size=100; darüber Status 400.\nAntwort: {\"items\": [...], \"total\": N, \"page\": N, \"pages\": N}.\n\n## Umfang\napi/users.py und tests/api/test_users.py ändern. Ist eine weitere Datei erforderlich,\nvor der Änderung begründen.\n```",
    ],
    ["Scope warning signs", "Warnsignale erkennen"],
    [
      "The words \"also\", \"while there\" and \"as needed\" hide a second decision. Name it and decide whether it belongs in this change.",
      "Wörter wie \"auch\", \"bei der Gelegenheit\" und \"bei Bedarf\" verbergen eine zweite Entscheidung. Sprich sie aus und entscheide, ob sie in diese Änderung gehört.",
    ],
    ["Illustrative broad task", "Ablaufbeispiel: gekoppelter Großauftrag"],
    [
      "The replay at the end puts schema, query, endpoint, audit and migration work into one task. Failures become hard to attribute.",
      "Der Ablauf am Ende packt Schema, Query, Endpunkt, Audit und Migration in einen Auftrag. Fehler lassen sich kaum noch zuordnen.",
    ],
    [
      "One question follows.",
      "Es folgt eine Frage.",
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
      "The broad version couples schema, API, audit and data migration. The sliced version states dependencies and gives each concern its own review and rollback boundary.",
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
      "You write: \"Add feature X, and while we're in there, fix the pagination bug and refactor the error handler.\" What should you do?",
      "Du schreibst: \"Funktion X ergänzen, und wenn wir schon dabei sind, den Pagination-Fehler beheben und den Error Handler refaktorisieren.\" Was tust du?",
    ],
    [
      "Keep it as one task because the changes share a ticket.",
      "Als einen Auftrag lassen, die Änderungen teilen sich ein Ticket.",
    ],
    [
      "Split it into three tasks, ordered by dependency, each reviewable alone.",
      "In drei Aufträge trennen, nach Abhängigkeit ordnen, jeden einzeln prüfbar.",
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
      "The sentence holds a feature, an independent bug fix and a refactor. Each needs its own behavior, evidence and review boundary, ordered only where a real dependency exists.",
      "Der Satz enthält eine Funktion, eine unabhängige Fehlerbehebung und ein Refactoring. Jedes braucht eigenes Verhalten, eigene Nachweise und eine eigene Review-Grenze, geordnet nur nach echten Abhängigkeiten.",
    ],
  ],
  preserve: ["$ pytest"],
});
