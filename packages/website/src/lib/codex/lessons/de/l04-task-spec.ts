import canonical from "../l04-task-spec";
import { localizeCodexLessonToGerman } from "../../translate-lesson";

function prose(sectionIndex: number, blockIndex: number): string {
  const block = canonical.sections[sectionIndex]?.blocks[blockIndex];
  if (block?.kind !== "prose") {
    throw new Error("Codex L04 translation expected a prose block.");
  }
  return block.markdown;
}

export default localizeCodexLessonToGerman(canonical, {
  translations: [
    ["Anatomy of a Task Spec", "Aufbau einer Aufgabenbeschreibung"],
    [
      canonical.subtitle,
      "Ziel, Einschränkungen, Akzeptanzkriterien und ausgeschlossener Umfang machen die angeforderte Änderung prüfbar.",
    ],
    ["Define the result and its boundary.", "Definiere Ergebnis und Grenze."],
    ["Task spec", "Aufgabenbeschreibung"],
    ["Goal", "Ziel"],
    ["Constraints", "Einschränkungen"],
    ["Acceptance criteria", "Akzeptanzkriterien"],
    ["Out of scope", "Nicht Bestandteil"],
    ["Shape, not steps", "Ergebnis statt Einzelschritte"],
    [
      prose(0, 0),
      '`AGENTS.md` regelt das Dauerhafte. Die **Aufgabenspezifikation** regelt die aktuelle Änderung. "Pagination zum Benutzer-Endpunkt hinzufügen" als Einzeiler lässt Verhalten, Grenzen, Verifikation und angrenzenden Code offen. Jedes Feld, das du weglässt, füllt Codex selbst.\n\n### Erst der Endzustand, dann der Weg\n\nNenne das beobachtbare Verhalten, die Schnittstellen, die stabil bleiben, die Prüfungen, die bestehen müssen, und die Bereiche, die niemand anfasst. Schrittfolgen lohnen sich, wenn die Reihenfolge selbst eine Einschränkung ist, etwa bei einer geordneten Migration. Sonst zählen Ergebnis und Grenze meist mehr als eine geratene Bearbeitungsfolge.\n\n"GET /users unterstützt ?page=N mit 20 Einträgen pro Seite und behält das bestehende Antwortschema" ist ein prüfbares Ergebnis. Vier Felder trennen die Entscheidungen:',
    ],
    ["The four parts", "Die vier Bestandteile"],
    ["01 · goal", "01 · Ziel"],
    ["What outcome are we after?", "Welches Ergebnis wollen wir?"],
    [
      'One sentence. The user-facing, behavioral change you want, not the implementation steps. "Users should be able to paginate through /users, 20 per page." Not "write a pagination function." Describe the shape, not the steps.',
      'Ein Satz. Das sichtbare Verhalten, nicht die Implementierungsschritte. "GET /users liefert seitenweise 20 Einträge." Nicht: "Schreibe eine Pagination-Funktion."',
    ],
    ["02 · constraints", "02 · Einschränkungen"],
    [
      "What shape must the solution take?",
      "Welche Grenzen gelten für die Lösung?",
    ],
    [
      'The non-negotiables. "Don\'t change the response schema." "Must work with existing query params." "No new dependencies." These close off whole branches of bad design.',
      'Das Nichtverhandelbare. "Antwortschema nicht ändern." "Bestehende Query-Parameter müssen weiter funktionieren." "Keine neue Abhängigkeit." Jede davon sperrt ganze Zweige schlechten Designs.',
    ],
    ["03 · acceptance", "03 · Akzeptanz"],
    ["How will we know it's done?", "Woran erkennen wir fertig?"],
    [
      'The evidence required before acceptance. "A new test covers page 1, page 2, and out-of-range. make test passes. No new deprecation warnings." Name commands and observable results, then inspect their output.',
      "Der Nachweis, den die Annahme braucht. Ein neuer Test deckt Seite 1, Seite 2 und Werte außerhalb des Bereichs ab; `make test` besteht; keine neuen Deprecation-Warnungen. Nenne Befehle und beobachtbare Ergebnisse, dann lies ihre Ausgabe.",
    ],
    ["04 · out of scope", "04 · Nicht Bestandteil"],
    [
      "What are we explicitly not doing?",
      "Was wird ausdrücklich nicht geändert?",
    ],
    [
      'The negative space. "Do not modify auth." "Do not refactor the query builder." These exclusions give the implementer and reviewer a shared scope boundary.',
      'Der Negativraum der Aufgabe. "Auth nicht ändern." "Query Builder nicht refaktorisieren." Diese Ausschlüsse geben Implementierung und Review dieselbe Umfangsgrenze.',
    ],
    ["Build one", "Eine Spezifikation zusammenstellen"],
    [
      'Select the fields that make "add pagination to /users" reviewable. The assembled version shows which decisions are explicit and which remain open.',
      'Wähle die Felder, die "Pagination zu /users hinzufügen" prüfbar machen. Die zusammengesetzte Fassung zeigt, was entschieden ist und was offen bleibt.',
    ],
    ["Three quality tiers", "Drei Qualitätsstufen"],
    [
      "These specifications describe the same feature with different levels of precision. Compare the decisions a reviewer can verify in each version.",
      "Dieselbe Funktion, drei Präzisionsstufen. Vergleiche, welche Entscheidungen eine Reviewerin in jeder Fassung prüfen kann.",
    ],
    [
      '### Anatomy of the precise version\n\nEach field closes a distinct implementation or review question:\n\n- **"20 per page"** defines the default page size.\n- **"?page=N query parameter"** selects page-based offset pagination instead of a cursor contract.\n- **"Keep the existing response schema; add a pagination field"** defines the compatibility boundary.\n- **"make test must pass"** names an executable check; its log still needs inspection.\n- **"Do not change the filtering logic"** excludes an adjacent refactor.\n\nThe specification does not prescribe a guessed edit sequence. It defines observable behavior, interface constraints, evidence, and excluded scope. Add ordered implementation steps only when sequence is itself a requirement, such as a migration or rollout dependency.',
      '### Aufbau der präzisen Fassung\n\nJedes Feld schließt eine eigene Umsetzungs- oder Review-Frage:\n\n- **"20 pro Seite"** legt die Standardgröße fest.\n- **"Query-Parameter ?page=N"** wählt seitenbasierte Offset-Pagination statt eines Cursor-Vertrags.\n- **"Bestehendes Antwortschema behalten; Feld pagination ergänzen"** zieht die Kompatibilitätsgrenze.\n- **"make test muss bestehen"** nennt eine ausführbare Prüfung; das Protokoll liest trotzdem jemand.\n- **"Filterlogik nicht ändern"** sperrt ein angrenzendes Refactoring.\n\nKeine geratene Bearbeitungsfolge. Die Spezifikation definiert beobachtbares Verhalten, Schnittstellengrenzen, Nachweise und ausgeschlossenen Umfang. Geordnete Umsetzungsschritte gehören nur hinein, wenn die Reihenfolge selbst eine Anforderung ist, etwa bei einer Migration oder Rollout-Abhängigkeit.',
    ],
    [
      "Two questions on writing task specs.",
      "Zwei Fragen zu Aufgabenbeschreibungen.",
    ],
    [
      'Assemble a task spec for "/users pagination"',
      "Aufgabenbeschreibung für die Pagination von /users",
    ],
    [
      "Select each field that contributes an explicit implementation or review decision.",
      "Wähle jedes Feld, das eine Implementierungs- oder Review-Entscheidung festlegt.",
    ],
    [
      "Users can page through /users, 20 per page, via ?page=N.",
      "GET /users liefert über ?page=N jeweils 20 Einträge pro Seite.",
    ],
    [
      "The behavior. One sentence. Not the code.",
      "Beobachtbares Verhalten in einem Satz, nicht die Implementierung.",
    ],
    [
      "Users can page through /users results.",
      "Ergebnisse von /users lassen sich seitenweise abrufen.",
    ],
    ["20 items per page, via ?page=N.", "20 Einträge pro Seite über ?page=N."],
    [
      "Non-negotiable interface and implementation boundaries.",
      "Verbindliche Grenzen für die Lösung.",
    ],
    [
      "Keep the existing response schema.",
      "Bestehendes Antwortschema beibehalten.",
    ],
    ["No new dependencies.", "Keine neuen Abhängigkeiten."],
    ["Offset-based, not cursor.", "Offset-basiert, nicht cursor-basiert."],
    [
      "Commands and observable results required for review.",
      "Für das Review erforderliche Befehle und beobachtbare Ergebnisse.",
    ],
    [
      "New test: page 1, page 2, out-of-range.",
      "Neue Tests: Seite 1, Seite 2 und außerhalb des Bereichs.",
    ],
    ["make test passes.", "`make test` besteht."],
    ["make lint passes.", "`make lint` besteht."],
    [
      "Adjacent work explicitly excluded from this change.",
      "Angrenzende Arbeit, die ausdrücklich draußen bleibt.",
    ],
    ["Don't change filtering logic.", "Filterlogik nicht ändern."],
    ["Don't touch /users/:id.", "/users/:id nicht ändern."],
    ["Don't add caching.", "Kein Caching ergänzen."],
    ["Nice-to-haves", "Optionale Ergänzungen"],
    [
      "Optional work still needs a clear decision and review boundary.",
      "Optional und klar vom erforderlichen Umfang getrennt.",
    ],
    [
      "A total-count field, only if explicitly accepted into scope.",
      "Ein Feld mit der Gesamtzahl, nur wenn es ausdrücklich in den Umfang kommt.",
    ],
    ["Unverifiable preference", "Nicht prüfbare Präferenz"],
    [
      "This does not define behavior or evidence.",
      "Diese Aussage definiert weder Verhalten noch Nachweis.",
    ],
    [
      "Make the endpoint feel polished.",
      "Der Endpunkt soll hochwertig wirken.",
    ],
    ["Three shapes of the same task", "Drei Fassungen derselben Aufgabe"],
    ["Weak, one line", "Schwach: ein Einzeiler"],
    ["Strong, four parts", "Stark: vier Bestandteile"],
    [
      "task:\nadd pagination to /users",
      "Aufgabe:\nPagination zu /users hinzufügen",
    ],
    [
      "Goal\nUsers can page through GET /users results via ?page=N, 20 items per page.\n\nConstraints\n- Keep existing response schema; add a top-level \"pagination\" object.\n- Offset-based (?page=N), not cursor.\n- No new dependencies.\n\nAcceptance\n- Tests cover page 1, page 2, out-of-range (page=999 → empty).\n- make test && make lint pass.\n- Existing filters (?role, ?status) still work.\n\nOut of scope\n- Don't touch the single-user detail endpoint.\n- Don't refactor the filter builder.",
      'Ziel\nGET /users unterstützt ?page=N mit 20 Einträgen pro Seite.\n\nEinschränkungen\n- Bestehendes Antwortschema behalten; Objekt "pagination" auf oberster Ebene ergänzen.\n- Offset-basiert über ?page=N, nicht cursor-basiert.\n- Keine neuen Abhängigkeiten.\n\nAkzeptanz\n- Tests decken Seite 1, Seite 2 und Werte außerhalb des Bereichs ab (page=999 → leer).\n- make test && make lint bestehen.\n- Bestehende Filter ?role und ?status funktionieren unverändert.\n\nNicht Bestandteil\n- Detailendpunkt für einzelne Benutzer nicht ändern.\n- Filter Builder nicht refaktorisieren.',
    ],
    [
      "A goal and tests without constraints can still permit a response-schema change or an unrelated filter refactor. The four-part version gives review an explicit contract.",
      "Ziel und Tests ohne Einschränkungen lassen eine Schemaänderung oder ein fremdes Filter-Refactoring durch. Die Reviewerin muss dann zwei Anliegen entwirren. Die Fassung mit vier Feldern gibt ihr einen expliziten Vertrag.",
    ],
    [
      "A task has a clear goal and acceptance criteria but no excluded scope. What review risk remains?",
      "Eine Aufgabe enthält ein klares Ziel und Akzeptanzkriterien, aber keinen ausgeschlossenen Umfang. Welches Review-Risiko bleibt?",
    ],
    [
      "The diff must be small regardless of the feature.",
      "Der Diff muss unabhängig von der Funktion klein sein.",
    ],
    [
      "Adjacent cleanup can be treated as part of the task, leaving the reviewer without a stated boundary for rejecting it.",
      "Angrenzendes Aufräumen gilt als Teil der Aufgabe, und der Reviewerin fehlt eine genannte Grenze, um es abzulehnen.",
    ],
    [
      "Codex will refuse to work without explicit scope.",
      "Codex verweigert die Arbeit ohne explizite Umfangsangabe.",
    ],
    [
      "Nothing, out-of-scope sections are decorative.",
      "Nichts; ausgeschlossener Umfang ist nur dekorativ.",
    ],
    [
      "Without an explicit boundary, adjacent cleanup can be interpreted as necessary work. An out-of-scope section lets both Codex and the reviewer compare the diff with a stated limit.",
      'Ohne ausdrückliche Grenze gilt angrenzendes Aufräumen schnell als notwendige Arbeit. Ein Abschnitt "Nicht Bestandteil" gibt Codex und Reviewerin dieselbe Linie, an der sie den Diff messen.',
    ],
    [
      "Which is the better acceptance criterion?",
      "Welches Akzeptanzkriterium ist besser?",
    ],
    [
      '"Make sure it works well."',
      '"Stelle sicher, dass es gut funktioniert."',
    ],
    [
      '"make test passes, including three new integration cases: page 1 returns 20 items, page 2 returns the next 20, and page=999 returns an empty array."',
      '"`make test` besteht einschließlich drei neuer Integrationsfälle: Seite 1 liefert 20 Einträge, Seite 2 die nächsten 20 und page=999 ein leeres Array."',
    ],
    ['"It should be production-ready."', '"Es soll produktionsreif sein."'],
    ['"Don\'t break anything."', '"Nichts darf kaputtgehen."'],
    [
      "The concrete criterion defines inputs, outputs, and a command the implementer and reviewer can run. A passing log is evidence for those cases, not proof of every relevant behavior. The next lesson shows how to strengthen that evidence with reviewed tests.",
      "Das konkrete Kriterium nennt Eingaben, Ausgaben und einen Befehl, den Implementierung und Review ausführen können. Ein grünes Protokoll belegt diese Fälle, nicht jedes relevante Verhalten. Die nächste Lektion stärkt den Nachweis mit geprüften Tests.",
    ],
  ],
});
