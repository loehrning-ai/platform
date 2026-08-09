import canonical from "../l06-acceptance";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    ["Acceptance Criteria", "Akzeptanzkriterien"],
    [
      "Define observable behavior, executable checks, and review evidence before implementation begins.",
      "Definiere beobachtbares Verhalten, ausführbare Prüfungen und Review-Nachweise vor Beginn der Implementierung.",
    ],
    [
      "Define the evidence required for acceptance.",
      "Definiere die für die Annahme erforderlichen Nachweise.",
    ],
    ["Acceptance criteria", "Akzeptanzkriterien"],
    ["Tests-first", "Tests zuerst"],
    ["Test overfitting", "Überanpassung an Tests"],
    ["Negative constraints", "Negative Einschränkungen"],
    ["A stopping condition", "Eine Abbruchbedingung"],
    [
      "Before implementation, state how the result will be evaluated. Use observable examples, commands, tests, and structural constraints. If no relevant check can be named, either the behavior is still ambiguous or the verification path is missing.\n\nAcceptance criteria guide implementation and review. Codex can run available checks and revise from their output, but a green result is not self-validating: the reviewer must confirm that the checks cover the requirement, ran in the intended environment, and were not weakened to obtain a pass.",
      "Lege vor der Implementierung fest, wie das Ergebnis bewertet wird: mit beobachtbaren Beispielen, Befehlen, Tests und strukturellen Grenzen. Lässt sich keine relevante Prüfung benennen, ist entweder das Verhalten unklar oder der Verifikationsweg fehlt.\n\nAkzeptanzkriterien führen Implementierung und Review. Codex kann verfügbare Prüfungen ausführen und anhand ihrer Ausgabe überarbeiten. Ein grünes Ergebnis bestätigt sich jedoch nicht selbst: Das Review muss Abdeckung, Ausführungsumgebung und unveränderte Prüfbedingungen kontrollieren.",
    ],
    [
      "Acceptance criteria define required evidence. They do not transfer the acceptance decision to the tool that produced the change.",
      "Akzeptanzkriterien definieren erforderliche Nachweise. Die Annahmeentscheidung bleibt beim Review.",
    ],
    ["The three flavors", "Drei Arten"],
    ["01 · executable", "01 · ausführbar"],
    ["Tests that must pass", "Tests, die bestehen müssen"],
    [
      '"pytest tests/api/test_users.py::test_pagination must pass." This is directly executable and produces an unambiguous pass/fail result.',
      '"pytest tests/api/test_users.py::test_pagination muss bestehen." Das Kriterium ist direkt ausführbar und liefert ein eindeutiges Bestanden- oder Fehlgeschlagen-Ergebnis.',
    ],
    ["02 · observable", "02 · beobachtbar"],
    ["Commands with known outputs", "Befehle mit erwarteter Ausgabe"],
    [
      '"curl /health returns {"ok": true} with status 200." Not a test file, but a verifiable signal the agent can check.',
      '"curl /health liefert {"ok": true} mit Status 200." Das ist kein Testfall im Repository, aber ein konkret prüfbares Signal.',
    ],
    ["03 · structural", "03 · strukturell"],
    ["Shape of the patch", "Struktur des Patches"],
    [
      '"New files live in src/auth/. No changes outside that directory." The final diff can be compared with this boundary by both Codex and the reviewer.',
      '"Neue Dateien liegen unter src/auth/. Außerhalb dieses Verzeichnisses gibt es keine Änderungen." Diese Eigenschaft lässt sich anhand des Diffs prüfen.',
    ],
    ["Tests-first workflow", "Arbeitsablauf mit Tests zuerst"],
    [
      'Tests can make acceptance criteria executable. Three patterns are useful:\n\n**Write the tests yourself.** Commit failing tests that describe the required behavior, then ask Codex to make that file pass without weakening the assertions.\n\n**Separate test design from implementation.** Task A: "Given these requirements, write failing tests in tests/api/test_users.py. Do not implement." Review whether the tests capture the intent. Task B: "Make the reviewed tests pass."\n\n**Request both in one change.** Ask Codex to write tests for the new behavior, compare them with the goal, and then implement. Review the tests independently from the production code; generated tests can encode the same misunderstanding as the implementation.',
      'Tests können Akzeptanzkriterien ausführbar machen. Drei Muster sind nützlich:\n\n**Tests selbst schreiben.** Versioniere fehlschlagende Tests für das erforderliche Verhalten und beauftrage Codex anschließend, die Datei zum Bestehen zu bringen, ohne die Assertions abzuschwächen.\n\n**Testentwurf und Implementierung trennen.** Auftrag A: "Schreibe auf Grundlage dieser Anforderungen fehlschlagende Tests in tests/api/test_users.py. Nicht implementieren." Prüfe, ob die Tests die Absicht abbilden. Auftrag B: "Bringe die geprüften Tests zum Bestehen."\n\n**Beides in einer Änderung anfordern.** Codex schreibt Tests für das neue Verhalten, vergleicht sie mit dem Ziel und implementiert danach. Prüfe Tests unabhängig vom Produktionscode; generierte Tests können dasselbe Missverständnis wie die Implementierung enthalten.',
    ],
    ["What tests contribute:", "Was Tests beitragen:"],
    [
      "Tests make selected examples executable and repeatable. They clarify inputs, outputs, and edge cases, but they cover only what their assertions and environment exercise. Review test design separately from implementation.",
      "Tests machen ausgewählte Beispiele ausführbar und wiederholbar. Sie klären Eingaben, Ausgaben und Randfälle, decken aber nur ab, was Assertions und Umgebung tatsächlich ausüben. Prüfe Testentwurf und Implementierung getrennt.",
    ],
    ["Accept or reject?", "Annehmen oder ablehnen?"],
    [
      "After the reported checks pass, verify that the criteria represent the intended behavior. A green suite can coexist with an incomplete requirement, an invalid test double, or an untested integration path. Review these four failure shapes before merge:",
      "Prüfe nach bestandenen gemeldeten Checks, ob die Kriterien das beabsichtigte Verhalten abbilden. Eine grüne Testsuite kann mit einer unvollständigen Anforderung, einem ungültigen Test-Dummy oder einem ungeprüften Integrationspfad zusammenfallen. Prüfe vor dem Merge diese vier Fehlerformen:",
    ],
    ["pattern 01", "Muster 01"],
    ["Test overfitting", "Überanpassung an Tests"],
    [
      "The implementation satisfies the named examples but not the general rule. Add representative boundaries and inspect whether production code special-cases fixture values or test-only paths.",
      "Die Implementierung erfüllt die genannten Beispiele, aber nicht die allgemeine Regel. Ergänze repräsentative Grenzfälle und prüfe, ob der Produktionscode Fixture-Werte oder reine Testpfade speziell behandelt.",
    ],
    ["pattern 02", "Muster 02"],
    ["Adjacent problem solving", "Benachbartes Problem gelöst"],
    [
      "The checks are executable but omit a required interface or constraint. Compare passing output with the original user and system behavior, not only with the new assertions.",
      "Die Checks sind ausführbar, lassen aber eine erforderliche Schnittstelle oder Grenze aus. Vergleiche die bestandene Ausgabe mit dem ursprünglichen Nutzer- und Systemverhalten, nicht nur mit den neuen Assertions.",
    ],
    ["pattern 03", "Muster 03"],
    ["Hidden regression", "Verdeckte Regression"],
    [
      "New and existing tests pass, but an uncovered behavior changed. Inspect deletions and call sites, then use integration, end-to-end, or manual checks appropriate to the affected risk.",
      "Neue und bestehende Tests bestehen, aber ein nicht abgedecktes Verhalten hat sich geändert. Prüfe Löschungen und Aufrufer und nutze dem Risiko entsprechende Integrations-, End-to-End- oder manuelle Prüfungen.",
    ],
    ["pattern 04", "Muster 04"],
    [
      "Plausible but wrong library usage",
      "Plausible, aber unpassende Bibliotheksnutzung",
    ],
    [
      "A library call can be valid in isolation but incompatible with repository configuration, concurrency, lifecycle, or deployment assumptions. Verify the integration contract and current library documentation.",
      "Ein Bibliotheksaufruf kann isoliert gültig, aber mit Repository-Konfiguration, Nebenläufigkeit, Lebenszyklus oder Deployment-Annahmen unvereinbar sein. Prüfe Integrationsvertrag und aktuelle Bibliotheksdokumentation.",
    ],
    [
      "When a foreseeable invalid implementation could pass the positive examples, add a *negative constraint*. It should describe a real performance, security, compatibility, or scope boundary rather than dictate an arbitrary internal detail. Example:\n\n```\n# incomplete: only names a command\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n\n# explicit evidence and boundaries\n## Acceptance\n- pytest tests/api/test_pagination.py passes\n- pytest tests/api passes; attach the command result\n- Query-count evidence shows pagination does not fetch every row\n- Changes outside api/users.py and its tests require prior explanation\n```",
      "Wenn eine vorhersehbar falsche Implementierung die positiven Beispiele bestehen könnte, ergänze eine *negative Einschränkung*. Sie muss eine reale Leistungs-, Sicherheits-, Kompatibilitäts- oder Umfangsgrenze beschreiben.\n\n```\n# unvollständig: nennt nur einen Befehl\n## Akzeptanz\n- pytest tests/api/test_pagination.py besteht\n\n# ausdrückliche Nachweise und Grenzen\n## Akzeptanz\n- pytest tests/api/test_pagination.py besteht\n- pytest tests/api besteht; Befehlsausgabe beifügen\n- Query-Count-Nachweis zeigt, dass Pagination nicht sämtliche Zeilen lädt\n- Änderungen außerhalb von api/users.py und seinen Tests vorher begründen\n```",
    ],
    ["The evaluation heuristic:", "Prüfheuristik:"],
    [
      'Ask: "Which incorrect implementations could still pass these checks?" Add the highest-risk missing example or constraint, then retain human review for behavior the automated checks do not cover.',
      'Frage: "Welche falschen Implementierungen könnten diese Prüfungen dennoch bestehen?" Ergänze das risikoreichste fehlende Beispiel oder die entsprechende Grenze und behalte menschliches Review für nicht automatisierte Bereiche bei.',
    ],
    ["Build one", "Kriterien zusammenstellen"],
    [
      "Compare criteria for executability, relevance, and coverage. Select the items that provide useful evidence for this rate-limit change.",
      "Vergleiche Kriterien nach Ausführbarkeit, Relevanz und Abdeckung. Wähle jene Punkte, die brauchbare Nachweise für diese Rate-Limit-Änderung liefern.",
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
      "Jede Zeile ist ein mögliches Akzeptanzkriterium. Aktiviere nur konkrete und relevante Prüfungen.",
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
      "Konkreter Test für Grenzwert und Rücksetzfenster.",
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
    ["Not checkable. Drop it.", "Nicht prüfbar; entfernen."],
    ["Unverifiable acceptance.", "Nicht prüfbare Akzeptanz."],
    [
      "Document the limit in API docs",
      "Begrenzung in der API-Dokumentation beschreiben",
    ],
    [
      "Reasonable, but belongs in a separate task.",
      "Sachlich sinnvoll; je nach Umfang Teil dieses oder eines separaten Auftrags.",
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
      "Ein ausführbarer Befehl erzeugt wiederholbaren Nachweis und kann die Überarbeitung leiten. Das Review muss weiterhin erfolgreiche Ausführung und Abdeckung des verlangten Verhaltens bestätigen.",
    ],
    [
      'For a difficult new feature, you are not sure how to define "done." Which step makes the acceptance boundary testable first?',
      'Bei einer schwierigen neuen Funktion ist unklar, wie "fertig" definiert wird. Welcher Schritt macht die Akzeptanzgrenze zuerst prüfbar?',
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
      "Akzeptanzkriterien vollständig weglassen.",
    ],
    [
      "Write a long prose description and hope.",
      "Eine lange Prosabeschreibung schreiben und auf das richtige Ergebnis hoffen.",
    ],
    [
      "Separate test design from implementation when the behavior needs clarification. Review the proposed tests against the requirement and confirm they fail for the intended reason before authorizing implementation. Passing those tests later remains one part of the final review.",
      "Trenne Testentwurf und Umsetzung, wenn das Verhalten noch geklärt werden muss. Prüfe die vorgeschlagenen Tests gegen die Anforderung und bestätige vor der Umsetzung, dass sie aus dem beabsichtigten Grund fehlschlagen. Späteres Bestehen dieser Tests bleibt ein Teil des abschließenden Reviews.",
    ],
  ],
  preserve: [
    "tests/api/test_login.py::test_rate_limit_blocks_at_6",
    "tests/api/test_login.py::test_rate_limit_resets_after_60s",
    "$ for i in 1..6; do curl /login; done → last one is 429",
  ],
});
