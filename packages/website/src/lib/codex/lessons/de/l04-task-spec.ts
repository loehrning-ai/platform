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
      '`AGENTS.md` beschreibt dauerhafte Projektregeln. Die **Aufgabenspezifikation** beschreibt die aktuelle Änderung. Ein Einzeiler wie "Pagination zum Benutzer-Endpunkt hinzufügen" lässt Entscheidungen zu Verhalten, Grenzen, Verifikation und angrenzendem Code offen. Codex muss jedes ausgelassene Feld auslegen.\n\n### Endzustand vor Implementierungsweg beschreiben\n\nBenenne beobachtbares Verhalten, stabil zu haltende Schnittstellen, erforderliche Prüfungen und nicht zu ändernde Bereiche. Schrittfolgen sind sinnvoll, wenn eine vorgeschriebene Reihenfolge selbst Teil der Einschränkung ist, etwa bei einer geordneten Migration. Sonst sind Ergebnis und Grenze meist wichtiger als eine vermutete Bearbeitungsfolge.\n\n"GET /users unterstützt ?page=N mit 20 Einträgen pro Seite und behält das bestehende Antwortschema" definiert ein prüfbares Ergebnis. Die folgenden vier Felder trennen die Entscheidungen:',
    ],
    ["The four parts", "Die vier Bestandteile"],
    ["01 · goal", "01 · Ziel"],
    ["What outcome are we after?", "Welches Verhalten soll entstehen?"],
    [
      'One sentence. The user-facing, behavioral change you want, not the implementation steps. "Users should be able to paginate through /users, 20 per page." Not "write a pagination function." Describe the shape, not the steps.',
      'Ein Satz zum beobachtbaren Verhalten, nicht zu Implementierungsschritten: "GET /users liefert seitenweise 20 Einträge." Nicht: "Schreibe eine Pagination-Funktion."',
    ],
    ["02 · constraints", "02 · Einschränkungen"],
    [
      "What shape must the solution take?",
      "Welche Grenzen gelten für die Lösung?",
    ],
    [
      'The non-negotiables. "Don\'t change the response schema." "Must work with existing query params." "No new dependencies." These close off whole branches of bad design.',
      'Nicht verhandelbare Bedingungen wie "Antwortschema nicht ändern", "bestehende Query-Parameter unterstützen" oder "keine neue Abhängigkeit" schließen ungeeignete Lösungswege aus.',
    ],
    ["03 · acceptance", "03 · Akzeptanz"],
    ["How will we know it's done?", "Wodurch ist die Fertigstellung belegt?"],
    [
      'The evidence required before acceptance. "A new test covers page 1, page 2, and out-of-range. make test passes. No new deprecation warnings." Name commands and observable results, then inspect their output.',
      "Vor der Annahme erforderliche Nachweise: Ein neuer Test deckt Seite 1, Seite 2 und Werte außerhalb des Bereichs ab; `make test` besteht; es gibt keine neuen Deprecation-Warnungen. Benenne Befehle und beobachtbare Ergebnisse und prüfe anschließend ihre Ausgabe.",
    ],
    ["04 · out of scope", "04 · Nicht Bestandteil"],
    [
      "What are we explicitly not doing?",
      "Was wird ausdrücklich nicht geändert?",
    ],
    [
      'The negative space. "Do not modify auth." "Do not refactor the query builder." These exclusions give the implementer and reviewer a shared scope boundary.',
      'Explizite Grenzen wie "Authentifizierung nicht ändern" oder "Query Builder nicht refaktorisieren" verhindern sachfremde Erweiterungen des Diffs.',
    ],
    ["Build one", "Eine Spezifikation zusammenstellen"],
    [
      'Select the fields that make "add pagination to /users" reviewable. The assembled version shows which decisions are explicit and which remain open.',
      'Wähle die Felder, die den Auftrag "Pagination zu /users hinzufügen" prüfbar machen. Die zusammengesetzte Fassung zeigt, welche Entscheidungen feststehen und welche offen bleiben.',
    ],
    ["Three quality tiers", "Drei Qualitätsstufen"],
    [
      "These specifications describe the same feature with different levels of precision. Compare the decisions a reviewer can verify in each version.",
      "Diese Spezifikationen beschreiben dieselbe Funktion mit unterschiedlicher Präzision. Vergleiche, welche Entscheidungen sich in jeder Fassung prüfen lassen.",
    ],
    [
      '### Anatomy of the precise version\n\nEach field closes a distinct implementation or review question:\n\n- **"20 per page"** defines the default page size.\n- **"?page=N query parameter"** selects page-based offset pagination instead of a cursor contract.\n- **"Keep the existing response schema; add a pagination field"** defines the compatibility boundary.\n- **"make test must pass"** names an executable check; its log still needs inspection.\n- **"Do not change the filtering logic"** excludes an adjacent refactor.\n\nThe specification does not prescribe a guessed edit sequence. It defines observable behavior, interface constraints, evidence, and excluded scope. Add ordered implementation steps only when sequence is itself a requirement, such as a migration or rollout dependency.',
      '### Aufbau der präzisen Fassung\n\nJedes Feld klärt eine eigene Umsetzungs- oder Review-Frage:\n\n- **"20 pro Seite"** legt die Standardgröße fest.\n- **"Query-Parameter ?page=N"** wählt seitenbasierte Offset-Pagination statt eines Cursor-Vertrags.\n- **"Bestehendes Antwortschema behalten; Feld pagination ergänzen"** definiert die Kompatibilitätsgrenze.\n- **"make test muss bestehen"** benennt eine ausführbare Prüfung; ihr Protokoll muss weiterhin gelesen werden.\n- **"Filterlogik nicht ändern"** schließt ein angrenzendes Refactoring aus.\n\nDie Spezifikation schreibt keine vermutete Bearbeitungsfolge vor. Sie definiert beobachtbares Verhalten, Schnittstellengrenzen, Nachweise und ausgeschlossenen Umfang. Geordnete Umsetzungsschritte gehören nur dann hinein, wenn die Reihenfolge selbst eine Anforderung ist, etwa bei einer Migration oder Rollout-Abhängigkeit.',
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
      "Wähle jedes Feld, das eine ausdrückliche Implementierungs- oder Review-Entscheidung enthält.",
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
      "Liste der ausgeschlossenen Änderungen.",
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
      "Ein Feld mit der Gesamtzahl nur dann ergänzen, wenn es ausdrücklich in den Umfang aufgenommen wurde.",
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
      "Die mittlere Fassung enthält Ziel und Akzeptanz, aber keine Einschränkungen oder Umfangsgrenze. Die Pagination kann funktionieren, während der Filter Builder unnötig geändert wird. Der Review muss dann zwei getrennte Anliegen entwirren.",
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
      "Der Agent kann angrenzenden Code ohne Auftrag refaktorisieren und dadurch den Review erschweren.",
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
      'Ohne ausdrückliche Grenze kann angrenzende Bereinigung als notwendige Arbeit ausgelegt werden. Ein Abschnitt "Nicht Bestandteil" erlaubt Codex und Review den Vergleich des Diffs mit einer genannten Grenze.',
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
      "Das konkrete Kriterium definiert Eingaben, Ausgaben und einen ausführbaren Befehl. Ein erfolgreiches Protokoll belegt diese Fälle, aber nicht jedes relevante Verhalten. Die nächste Lektion ergänzt geprüfte Tests als weiteren Nachweis.",
    ],
  ],
});
