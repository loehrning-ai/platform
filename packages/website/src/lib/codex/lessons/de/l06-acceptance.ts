import canonical from "../l06-acceptance";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    [
      "Define observable behavior, executable checks, and review evidence before implementation begins.",
      "Verhalten, Prüfungen und Nachweise stehen fest, bevor Codex die erste Zeile ändert.",
    ],
    [
      "Define the evidence required for acceptance.",
      "Lege fest, welcher Nachweis zur Annahme reicht.",
    ],
    ["Acceptance criteria", "Akzeptanzkriterien"],
    ["Tests-first", "Tests zuerst"],
    ["Test overfitting", "Überanpassung an Tests"],
    ["Negative constraints", "Negative Einschränkungen"],
    ["A stopping condition", "Eine Abbruchbedingung"],
    [
      "Answer \"how will you know it is done?\" before implementation, with observable examples, commands, tests or structural constraints. If you cannot name one relevant check, the behavior is still ambiguous or the verification path is missing.\n\nCodex runs the available checks and revises from their output. A green run still needs someone to confirm that the checks cover the requirement, ran in the intended environment and were not weakened to pass.",
      "Beantworte \"Woran erkenne ich, dass es fertig ist?\" vor der Umsetzung, mit beobachtbaren Beispielen, Befehlen, Tests oder strukturellen Grenzen. Fällt dir keine relevante Prüfung ein, ist das Verhalten noch unklar oder der Verifikationsweg fehlt.\n\nCodex führt die verfügbaren Prüfungen aus und bessert anhand ihrer Ausgabe nach. Auch ein grüner Lauf braucht jemanden, der bestätigt, dass die Prüfungen die Anforderung abdecken, in der richtigen Umgebung liefen und nicht abgeschwächt wurden.",
    ],
    ["Three kinds of criteria", "Drei Arten von Kriterien"],
    ["01 · executable", "01 · ausführbar"],
    ["Tests that must pass", "Tests, die bestehen müssen"],
    [
      "\"pytest tests/api/test_users.py::test_pagination must pass.\" Runs directly and gives a clear pass or fail.",
      "\"pytest tests/api/test_users.py::test_pagination muss bestehen.\" Direkt ausführbar, mit eindeutigem Ergebnis.",
    ],
    ["02 · observable", "02 · beobachtbar"],
    ["Commands with known outputs", "Befehle mit erwarteter Ausgabe"],
    [
      "\"curl /health returns {\"ok\": true} with status 200.\" A signal the agent can verify without a test file.",
      "\"curl /health liefert {\"ok\": true} mit Status 200.\" Ein Signal, das der Agent ohne Testdatei prüfen kann.",
    ],
    ["03 · structural", "03 · strukturell"],
    ["Shape of the patch", "Struktur des Patches"],
    [
      "\"New files live in src/auth/. No changes outside that directory.\" Codex and the reviewer can compare the final diff with this boundary.",
      "\"Neue Dateien liegen unter src/auth/. Außerhalb ändert sich nichts.\" Codex und Reviewerin können den fertigen Diff an dieser Grenze messen.",
    ],
    ["Tests-first workflow", "Arbeitsablauf mit Tests zuerst"],
    [
      "Three patterns:\n\n**Write the tests yourself.** Commit failing tests that describe the required behavior, then ask Codex to make them pass without weakening the assertions.\n\n**Separate test design from implementation.** Task A: \"Given these requirements, write failing tests in tests/api/test_users.py. Do not implement.\" Review whether the tests capture the intent. Task B: \"Make the reviewed tests pass.\"\n\n**Request both in one change.** Codex writes tests for the new behavior, compares them with the goal, then implements. Review the tests on their own, because generated tests can encode the same misunderstanding as the implementation.",
      "Drei Muster:\n\n**Tests selbst schreiben.** Committe fehlschlagende Tests für das verlangte Verhalten. Dann soll Codex sie grün bekommen, ohne die Assertions abzuschwächen.\n\n**Testentwurf und Implementierung trennen.** Auftrag A: \"Schreibe auf Grundlage dieser Anforderungen fehlschlagende Tests in tests/api/test_users.py. Implementiere nichts.\" Prüfe, ob die Tests die Absicht treffen. Auftrag B: \"Bring die geprüften Tests zum Bestehen.\"\n\n**Beides in einer Änderung verlangen.** Codex schreibt Tests für das neue Verhalten, gleicht sie mit dem Ziel ab und implementiert dann. Prüfe die Tests für sich, denn generierte Tests können dasselbe Missverständnis enthalten wie die Implementierung.",
    ],
    ["Accept or reject?", "Annehmen oder ablehnen?"],
    [
      "A green suite can still hide an incomplete requirement, an invalid test double or an untested integration path. Check four failure shapes before merge.",
      "Auch eine grüne Suite kann eine unvollständige Anforderung, ein ungültiges Test-Double oder einen ungeprüften Integrationspfad verbergen. Prüf vor dem Merge vier Fehlerformen.",
    ],
    ["pattern 01", "Muster 01"],
    ["Test overfitting", "Überanpassung an Tests"],
    [
      "The code satisfies the named examples but misses the general rule. Add representative boundaries and look for special cases for fixture values or test-only paths.",
      "Der Code besteht die genannten Beispiele, verfehlt aber die allgemeine Regel. Ergänze repräsentative Grenzfälle und such nach Sonderbehandlung von Fixture-Werten oder reinen Testpfaden.",
    ],
    ["pattern 02", "Muster 02"],
    ["Adjacent problem solving", "Benachbartes Problem gelöst"],
    [
      "The checks run but omit a required interface or constraint. Compare the output with the original user and system behavior as well as the new assertions.",
      "Die Prüfungen laufen, lassen aber eine geforderte Schnittstelle oder Grenze aus. Vergleiche die Ausgabe mit dem ursprünglichen Nutzer- und Systemverhalten und mit den neuen Assertions.",
    ],
    ["pattern 03", "Muster 03"],
    ["Hidden regression", "Verdeckte Regression"],
    [
      "All tests pass, but an uncovered behavior changed. Inspect deletions and call sites, then run integration, end-to-end or manual checks that fit the risk.",
      "Alle Tests sind grün, trotzdem hat sich ein nicht abgedecktes Verhalten geändert. Lies Löschungen und Aufrufer und nutze dann Integrations-, End-to-End- oder manuelle Prüfungen, je nach Risiko.",
    ],
    ["pattern 04", "Muster 04"],
    [
      "Plausible but wrong library usage",
      "Plausible, aber unpassende Bibliotheksnutzung",
    ],
    [
      "A library call that is valid in isolation can clash with the repository's configuration, concurrency, lifecycle or deployment. Check the integration contract and current library docs.",
      "Ein für sich gültiger Bibliotheksaufruf kann mit Konfiguration, Nebenläufigkeit, Lebenszyklus oder Deployment des Repositorys kollidieren. Prüfe Integrationsvertrag und aktuelle Bibliotheksdokumentation.",
    ],
    [
      "Ask which wrong implementation could still pass. If a foreseeable one passes the positive examples, add a *negative constraint*: a real performance, security, compatibility or scope boundary that leaves internal details open. Example:\n\n```\n# incomplete: only names a command\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n\n# explicit evidence and boundaries\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n- pytest tests/api passes; attach the command result\n- Query-count evidence shows pagination does not fetch every row\n- Changes outside api/users.py and its tests require prior explanation\n```",
      "Frag dich, welche falsche Implementierung noch durchkäme. Kommt eine absehbare Fehlimplementierung durch die positiven Beispiele, ergänze eine *negative Einschränkung*: eine echte Leistungs-, Sicherheits-, Kompatibilitäts- oder Umfangsgrenze, die interne Details offenlässt. Beispiel:\n\n```\n# unvollständig: nennt nur einen Befehl\n## Akzeptanz\n- pytest tests/api/test_pagination.py besteht\n\n# ausdrückliche Nachweise und Grenzen\n## Akzeptanz\n- pytest tests/api/test_pagination.py besteht\n- pytest tests/api besteht; Befehlsausgabe beifügen\n- Query-Count-Nachweis zeigt, dass Pagination nicht sämtliche Zeilen lädt\n- Änderungen außerhalb von api/users.py und seinen Tests vorher begründen\n```",
    ],
    ["Build one", "Kriterien zusammenstellen"],
    [
      "In the exercise above, keep only criteria that give real evidence for this rate-limit change.",
      "Behalte in der Übung oben nur Kriterien, die für diese Rate-Limit-Änderung echten Nachweis liefern.",
    ],
    ["Two questions at the end of the lesson.", "Zwei Fragen am Ende der Lektion."],
    [
      "Build acceptance evidence for a rate-limit feature",
      "Akzeptanznachweise für eine Rate-Limit-Funktion zusammenstellen",
    ],
    [
      "Each row is a possible acceptance criterion. Switch on the useful ones.",
      "Jede Zeile ist ein mögliches Akzeptanzkriterium. Schalte die brauchbaren ein.",
    ],
    [
      "Limit /login to 5 attempts per IP per minute.",
      "/login auf fünf Versuche pro IP und Minute begrenzen.",
    ],
    [
      "Executable: test_login_rate_limit.py passes",
      "Ausführbar: test_login_rate_limit.py besteht",
    ],
    [
      "Real test. Covers the limit boundary and reset window.",
      "Echter Test, der Grenzwert und Rücksetzfenster abdeckt.",
    ],
    [
      "Executable: full suite still passes",
      "Ausführbar: vollständige Testsuite besteht",
    ],
    [
      "Regression evidence. Inspect the command result and any skipped tests.",
      "Regressionsnachweis: Befehlsausgabe und übersprungene Tests prüfen.",
    ],
    [
      "make test   # attach the result; review failures and skips",
      "make test   # Ergebnis beifügen; Fehler und übersprungene Tests prüfen",
    ],
    [
      "Observable: manual curl returns 429",
      "Beobachtbar: manueller curl-Aufruf liefert 429",
    ],
    [
      "A direct behavior check when run against an isolated test instance.",
      "Direkte Verhaltensprüfung gegen eine isolierte Testinstanz.",
    ],
    [
      "Structural: new code lives in api/limits/",
      "Strukturell: neuer Code liegt in api/limits/",
    ],
    [
      "Defines the expected file boundary of the patch.",
      "Definiert die erwartete Dateigrenze des Patches.",
    ],
    [
      "Only api/auth.py and new files in api/limits/ change.",
      "Nur api/auth.py und neue Dateien in api/limits/ ändern sich.",
    ],
    ['"It should feel right."', '"Es soll sich richtig anfühlen."'],
    ["Not checkable. Drop it.", "Nicht prüfbar, raus damit."],
    ["Unverifiable acceptance.", "Nicht prüfbare Akzeptanz."],
    [
      "Document the limit in API docs",
      "Begrenzung in der API-Dokumentation beschreiben",
    ],
    [
      "Reasonable, but belongs in a separate task.",
      "Sinnvoll, aber ein eigener Auftrag.",
    ],
    ["docs/api/auth.md updated.", "docs/api/auth.md ist aktualisiert."],
    [
      'Why is "make test passes" more useful than "the code should work" as one acceptance criterion?',
      'Warum ist "make test besteht" als einzelnes Akzeptanzkriterium nützlicher als "der Code soll funktionieren"?',
    ],
    [
      '"Make test" is shorter, so the agent reads it faster.',
      '"make test" ist kürzer und wird deshalb schneller gelesen.',
    ],
    [
      "\"Make test\" is a runnable check with output; \"should work\" names no evidence.",
      "\"make test\" ist eine ausführbare Prüfung mit Ausgabe; \"soll funktionieren\" nennt keinen Nachweis.",
    ],
    [
      "There is no meaningful difference.",
      "Es gibt keinen relevanten Unterschied.",
    ],
    [
      '"Should work" implies higher quality.',
      '"soll funktionieren" verlangt eine höhere Qualität.',
    ],
    [
      "An executable command gives repeatable evidence and guides revision. The reviewer still confirms that it ran successfully and that its tests cover the requested behavior.",
      "Ein ausführbarer Befehl liefert wiederholbare Nachweise und steuert die Überarbeitung. Die Reviewerin bestätigt trotzdem, dass er erfolgreich lief und seine Tests das verlangte Verhalten abdecken.",
    ],
    [
      "You are unsure how to define \"done\" for a difficult new feature. Which step makes the acceptance boundary testable first?",
      "Du weißt bei einer schwierigen neuen Funktion nicht, wie du \"fertig\" definierst. Welcher Schritt macht die Akzeptanzgrenze zuerst testbar?",
    ],
    [
      "Ship the task with vague criteria and iterate.",
      "Den Auftrag mit unklaren Kriterien starten und später nachbessern.",
    ],
    [
      "A first task that only writes failing tests for the requirements; review them, then \"make them pass\".",
      "Ein erster Auftrag, der nur fehlschlagende Tests für die Anforderungen schreibt; prüfen, dann \"bring sie zum Bestehen\".",
    ],
    [
      "Skip acceptance criteria entirely.",
      "Akzeptanzkriterien ganz weglassen.",
    ],
    [
      "Write a long prose description and hope.",
      "Eine lange Prosabeschreibung schreiben und hoffen.",
    ],
    [
      "Separate test design from implementation. Check the proposed tests against the requirement and confirm they fail for the intended reason before implementation starts. Passing them later is only part of the final review.",
      "Trenne Testentwurf und Implementierung. Prüfe die vorgeschlagenen Tests gegen die Anforderung und bestätige, dass sie aus dem richtigen Grund scheitern, bevor die Umsetzung beginnt. Dass sie später grün werden, ist nur ein Teil des Reviews.",
    ],
  ],
  preserve: [
    "tests/api/test_login.py::test_rate_limit_blocks_at_6",
    "tests/api/test_login.py::test_rate_limit_resets_after_60s",
    "$ for i in 1..6; do curl /login; done → last one is 429",
  ],
});
