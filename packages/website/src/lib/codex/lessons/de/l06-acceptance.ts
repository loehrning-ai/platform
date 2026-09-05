import canonical from "../l06-acceptance";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    ["Acceptance Criteria", "Akzeptanzkriterien"],
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
      "How will you know it is done? Answer before implementation, with observable examples, commands, tests, structural constraints. Cannot name a single relevant check? Then the behavior is still ambiguous or the verification path is missing.\n\nAcceptance criteria steer implementation and review. Codex runs the available checks and revises from their output. Green is not self-validating. Someone still has to confirm that the checks cover the requirement, ran in the intended environment, and were not weakened to earn the pass.",
      "Bevor Codex die erste Zeile ändert, steht fest, wie das Ergebnis bewertet wird: beobachtbare Beispiele, Befehle, Tests, strukturelle Grenzen. Fällt dir keine relevante Prüfung ein, ist das Verhalten noch unklar oder der Verifikationsweg fehlt.\n\nAkzeptanzkriterien führen Implementierung und Review. Codex kann verfügbare Prüfungen ausführen und anhand ihrer Ausgabe nachbessern. Ein grünes Ergebnis bestätigt sich trotzdem nicht selbst. Die Reviewerin prüft, ob die Checks die Anforderung abdecken, in der gemeinten Umgebung liefen und nicht abgeschwächt wurden, um grün zu werden.",
    ],
    [
      "Acceptance criteria define required evidence. They do not transfer the acceptance decision to the tool that produced the change.",
      "Akzeptanzkriterien definieren den Nachweis. Die Annahme bleibt beim Review.",
    ],
    ["The three flavors", "Drei Arten"],
    ["01 · executable", "01 · ausführbar"],
    ["Tests that must pass", "Tests, die bestehen müssen"],
    [
      '"pytest tests/api/test_users.py::test_pagination must pass." This is directly executable and produces an unambiguous pass/fail result.',
      '"pytest tests/api/test_users.py::test_pagination muss bestehen." Direkt ausführbar, mit eindeutigem Ergebnis: grün oder rot.',
    ],
    ["02 · observable", "02 · beobachtbar"],
    ["Commands with known outputs", "Befehle mit erwarteter Ausgabe"],
    [
      '"curl /health returns {"ok": true} with status 200." Not a test file, but a verifiable signal the agent can check.',
      '"curl /health liefert {"ok": true} mit Status 200." Kein Testfall, aber ein Signal, das der Agent prüfen kann.',
    ],
    ["03 · structural", "03 · strukturell"],
    ["Shape of the patch", "Struktur des Patches"],
    [
      '"New files live in src/auth/. No changes outside that directory." The final diff can be compared with this boundary by both Codex and the reviewer.',
      '"Neue Dateien liegen unter src/auth/. Außerhalb ändert sich nichts." Codex und Reviewerin können den fertigen Diff an dieser Grenze messen.',
    ],
    ["Tests-first workflow", "Arbeitsablauf mit Tests zuerst"],
    [
      'Tests make acceptance criteria executable. Three patterns worth knowing.\n\n**Write the tests yourself.** Commit failing tests that describe the required behavior, then ask Codex to make that file pass without weakening the assertions.\n\n**Separate test design from implementation.** Task A: "Given these requirements, write failing tests in tests/api/test_users.py. Do not implement." Review whether the tests capture the intent. Task B: "Make the reviewed tests pass."\n\n**Request both in one change.** Ask Codex to write tests for the new behavior, compare them with the goal, then implement. Review the tests apart from the production code. Generated tests can encode the same misunderstanding as the implementation.',
      'Tests machen Akzeptanzkriterien ausführbar. Drei Muster taugen dafür:\n\n**Tests selbst schreiben.** Committe fehlschlagende Tests für das verlangte Verhalten. Dann soll Codex die Datei grün bekommen, ohne die Assertions abzuschwächen.\n\n**Testentwurf und Implementierung trennen.** Auftrag A: "Schreibe auf Grundlage dieser Anforderungen fehlschlagende Tests in tests/api/test_users.py. Nicht implementieren." Prüfe, ob die Tests die Absicht treffen. Auftrag B: "Bringe die geprüften Tests zum Bestehen."\n\n**Beides in einer Änderung.** Codex schreibt Tests für das neue Verhalten, vergleicht sie mit dem Ziel und implementiert dann. Lies die Tests getrennt vom Produktionscode. Generierte Tests können dasselbe Missverständnis enthalten wie die Implementierung.',
    ],
    ["What tests contribute:", "Was Tests beitragen:"],
    [
      "Tests make selected examples executable and repeatable. They pin inputs, outputs and edge cases. They cover nothing their assertions and environment do not exercise. Review test design separately from implementation.",
      "Tests machen ausgewählte Beispiele ausführbar und wiederholbar. Sie klären Eingaben, Ausgaben und Randfälle. Abgedeckt ist nur, was Assertions und Umgebung ausüben. Testentwurf und Implementierung prüfst du getrennt.",
    ],
    ["Accept or reject?", "Annehmen oder ablehnen?"],
    [
      "The checks pass. Now verify that the criteria represent the intended behavior. A green suite lives happily alongside an incomplete requirement, an invalid test double or an untested integration path. Four failure shapes to review before merge.",
      "Die gemeldeten Checks sind grün. Jetzt prüfst du, ob die Kriterien das gemeinte Verhalten abbilden. Eine grüne Suite verträgt sich mit unvollständiger Anforderung, ungültigem Test-Double oder ungeprüftem Integrationspfad. Vier Fehlerformen vor dem Merge:",
    ],
    ["pattern 01", "Muster 01"],
    ["Test overfitting", "Überanpassung an Tests"],
    [
      "The implementation satisfies the named examples but not the general rule. Add representative boundaries and inspect whether production code special-cases fixture values or test-only paths.",
      "Die Implementierung besteht die genannten Beispiele, nicht die allgemeine Regel. Ergänze repräsentative Grenzfälle und such im Produktionscode nach Sonderbehandlung von Fixture-Werten oder reinen Testpfaden.",
    ],
    ["pattern 02", "Muster 02"],
    ["Adjacent problem solving", "Benachbartes Problem gelöst"],
    [
      "The checks are executable but omit a required interface or constraint. Compare passing output with the original user and system behavior, not only with the new assertions.",
      "Die Checks laufen, lassen aber eine geforderte Schnittstelle oder Grenze aus. Vergleiche die grüne Ausgabe mit dem ursprünglichen Nutzer- und Systemverhalten, nicht nur mit den neuen Assertions.",
    ],
    ["pattern 03", "Muster 03"],
    ["Hidden regression", "Verdeckte Regression"],
    [
      "New and existing tests pass, but an uncovered behavior changed. Inspect deletions and call sites, then use integration, end-to-end, or manual checks appropriate to the affected risk.",
      "Neue und alte Tests sind grün, ein nicht abgedecktes Verhalten hat sich trotzdem geändert. Lies Löschungen und Aufrufer, dann Integrations-, End-to-End- oder manuelle Prüfungen, je nach Risiko.",
    ],
    ["pattern 04", "Muster 04"],
    [
      "Plausible but wrong library usage",
      "Plausible, aber unpassende Bibliotheksnutzung",
    ],
    [
      "A library call can be valid in isolation but incompatible with repository configuration, concurrency, lifecycle, or deployment assumptions. Verify the integration contract and current library documentation.",
      "Ein Bibliotheksaufruf kann für sich gültig sein und trotzdem mit Repository-Konfiguration, Nebenläufigkeit, Lebenszyklus oder Deployment-Annahmen kollidieren. Prüfe Integrationsvertrag und aktuelle Bibliotheksdokumentation.",
    ],
    [
      "When a foreseeable wrong implementation could still pass the positive examples, add a *negative constraint*. It names a real performance, security, compatibility or scope boundary. It does not dictate an arbitrary internal detail. Example:\n\n```\n# incomplete: only names a command\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n\n# explicit evidence and boundaries\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n- pytest tests/api passes; attach the command result\n- Query-count evidence shows pagination does not fetch every row\n- Changes outside api/users.py and its tests require prior explanation\n```",
      "Könnte eine absehbar falsche Implementierung die positiven Beispiele bestehen, ergänze eine *negative Einschränkung*. Sie beschreibt eine echte Leistungs-, Sicherheits-, Kompatibilitäts- oder Umfangsgrenze, kein internes Detail.\n\n```\n# unvollständig: nennt nur einen Befehl\n## Akzeptanz\n- pytest tests/api/test_pagination.py besteht\n\n# ausdrückliche Nachweise und Grenzen\n## Akzeptanz\n- pytest tests/api/test_pagination.py besteht\n- pytest tests/api besteht; Befehlsausgabe beifügen\n- Query-Count-Nachweis zeigt, dass Pagination nicht sämtliche Zeilen lädt\n- Änderungen außerhalb von api/users.py und seinen Tests vorher begründen\n```",
    ],
    ["The evaluation heuristic:", "Prüfheuristik:"],
    [
      "Ask which incorrect implementations could still pass these checks. Add the highest-risk missing example or constraint. Keep human review for the behavior the automated checks do not cover.",
      'Frag dich: "Welche falsche Implementierung käme durch diese Prüfungen?" Ergänze das riskanteste fehlende Beispiel oder die fehlende Grenze. Was die Automatik nicht abdeckt, liest ein Mensch.',
    ],
    ["Build one", "Kriterien zusammenstellen"],
    [
      "Judge each criterion on executability, relevance and coverage. Keep the ones that give real evidence for this rate-limit change.",
      "Vergleiche die Kriterien nach Ausführbarkeit, Relevanz und Abdeckung. Wähle, was für diese Rate-Limit-Änderung brauchbaren Nachweis liefert.",
    ],
    [
      "Two questions on acceptance criteria.",
      "Zwei Fragen zu Akzeptanzkriterien.",
    ],
    [
      "Build acceptance evidence for a rate-limit feature",
      "Akzeptanznachweise für eine Rate-Limit-Funktion zusammenstellen",
    ],
    [
      "Each row is a potential acceptance criterion. Toggle on the ones that are actually useful.",
      "Jede Zeile ist ein mögliches Akzeptanzkriterium. Schalte nur ein, was wirklich Nachweis liefert.",
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
      '"Make test" ist kürzer und wird deshalb schneller gelesen.',
    ],
    [
      '"Make test" names an executable check with inspectable output. "Should work" defines neither behavior nor evidence.',
      '`make test` benennt eine ausführbare Prüfung mit kontrollierbarer Ausgabe. "Soll funktionieren" definiert weder Verhalten noch Nachweis.',
    ],
    [
      "There is no meaningful difference.",
      "Es gibt keinen relevanten Unterschied.",
    ],
    [
      '"Should work" implies higher quality.',
      '"Soll funktionieren" verlangt eine höhere Qualität.',
    ],
    [
      "An executable command produces repeatable evidence and can guide revision. The reviewer must still confirm that the command ran successfully and that its tests cover the requested behavior.",
      "Ein ausführbarer Befehl liefert wiederholbaren Nachweis und lenkt die Nachbesserung. Ob er wirklich durchlief und ob seine Tests das verlangte Verhalten abdecken, bestätigt trotzdem die Reviewerin.",
    ],
    [
      'For a difficult new feature, you are not sure how to define "done." Which step makes the acceptance boundary testable first?',
      'Schwierige neue Funktion, und du weißt nicht, was "fertig" heißt. Welcher Schritt macht die Akzeptanzgrenze zuerst prüfbar?',
    ],
    [
      "Ship the task with vague criteria and iterate.",
      "Den Auftrag mit unklaren Kriterien starten und später nachbessern.",
    ],
    [
      'Spec a preliminary task: "write failing tests that capture the requirements, don\'t implement." Review the tests. Then spec the real task: "make those tests pass."',
      'Einen Vorauftrag formulieren: "Schreibe fehlschlagende Tests, die die Anforderungen abbilden; noch nicht implementieren." Nach dem Testreview folgt: "Bringe diese Tests zum Bestehen."',
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
      "Separate test design from implementation when the behavior needs clarification. Review the proposed tests against the requirement and confirm they fail for the intended reason before authorizing implementation. Passing those tests later remains one part of the final review.",
      "Trenne Testentwurf und Umsetzung, wenn das Verhalten noch unklar ist. Lies die vorgeschlagenen Tests gegen die Anforderung und stell sicher, dass sie aus dem richtigen Grund fehlschlagen, bevor jemand implementiert. Dass sie später grün werden, ist nur ein Teil des Reviews.",
    ],
  ],
  preserve: [
    "tests/api/test_login.py::test_rate_limit_blocks_at_6",
    "tests/api/test_login.py::test_rate_limit_resets_after_60s",
    "$ for i in 1..6; do curl /login; done → last one is 429",
  ],
});
