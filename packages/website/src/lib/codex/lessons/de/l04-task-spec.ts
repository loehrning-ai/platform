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
    ["Anatomy of a Task Spec", "Aufbau einer Auftragsbeschreibung"],
    [
      canonical.subtitle,
      "Ziel, Einschränkungen, Akzeptanzkriterien und ausgeschlossener Umfang machen die angeforderte Änderung prüfbar.",
    ],
    ["Define the result and its boundary.", "Definiere Ergebnis und Grenze."],
    ["Task spec", "Auftragsbeschreibung"],
    ["Goal", "Ziel"],
    ["Constraints", "Einschränkungen"],
    ["Acceptance criteria", "Akzeptanzkriterien"],
    ["Out of scope", "Nicht Bestandteil"],
    ["Describe the result", "Das Ergebnis beschreiben"],
    [
      prose(0, 0),
      "\"Pagination zum Benutzer-Endpunkt hinzufügen\" lässt Verhalten, Grenzen, Verifikation und angrenzenden Code offen, und was du weglässt, ergänzt Codex selbst. `AGENTS.md` regelt das Dauerhafte, die **Auftragsbeschreibung** die aktuelle Änderung.\n\nNenne das beobachtbare Verhalten, die Schnittstellen, die stabil bleiben, die Prüfungen, die bestehen müssen, und die Bereiche, die unverändert bleiben. Schrittfolgen gehören nur hinein, wenn die Reihenfolge selbst eine Einschränkung ist, etwa bei einer geordneten Migration.\n\n\"GET /users unterstützt ?page=N mit 20 Einträgen pro Seite und behält das bestehende Antwortschema\" ist ein prüfbares Ergebnis.",
    ],
    ["The four parts", "Die vier Bestandteile"],
    ["01 · goal", "01 · Ziel"],
    ["What outcome are we after?", "Welches Ergebnis wollen wir?"],
    [
      "The observable behavior you want, in one sentence and without implementation steps.",
      "Das beobachtbare Verhalten, das du willst, in einem Satz und ohne Umsetzungsschritte.",
    ],
    ["02 · constraints", "02 · Einschränkungen"],
    [
      "What shape must the solution take?",
      "Welche Grenzen gelten für die Lösung?",
    ],
    [
      "The non-negotiables, such as a stable response schema, working query params or no new dependencies.",
      "Das Nichtverhandelbare, etwa ein stabiles Antwortschema, funktionierende Query-Parameter oder keine neue Abhängigkeit.",
    ],
    ["03 · acceptance", "03 · Akzeptanz"],
    ["How will we know it's done?", "Woran erkennen wir fertig?"],
    [
      "The tests, commands and observable results required before acceptance, such as a passing make test and no new deprecation warnings. Read the output.",
      "Die Tests, Befehle und beobachtbaren Ergebnisse, die vor der Annahme vorliegen müssen, etwa ein grünes make test ohne neue Deprecation-Warnungen. Lies die Ausgabe.",
    ],
    ["04 · out of scope", "04 · Nicht Bestandteil"],
    [
      "What are we explicitly not doing?",
      "Was wird ausdrücklich nicht geändert?",
    ],
    [
      "Adjacent work that stays out, such as auth or the query builder, so implementer and reviewer share one boundary.",
      "Angrenzende Arbeit, die draußen bleibt, etwa Auth oder der Query Builder. So teilen Implementierung und Review dieselbe Grenze.",
    ],
    ["Build one", "Eine Auftragsbeschreibung zusammenstellen"],
    [
      "Use the exercise above: select the fields that make \"add pagination to /users\" reviewable.",
      "Nutze die Übung oben: Wähle die Felder, die \"Pagination zu /users hinzufügen\" prüfbar machen.",
    ],
    ["Three quality tiers", "Drei Qualitätsstufen"],
    [
      "The comparison at the end shows the same feature with more and less precision. Count the decisions a reviewer can verify in each.",
      "Der Vergleich am Ende zeigt dieselbe Funktion unterschiedlich präzise. Zähl, welche Entscheidungen eine Reviewerin in jeder Fassung prüfen kann.",
    ],
    [
      "### Anatomy of the precise version\n\n- **\"20 per page\"** sets the default page size.\n- **\"?page=N query parameter\"** selects offset pagination over a cursor contract.\n- **\"Keep the existing response schema; add a pagination field\"** sets the compatibility boundary.\n- **\"make test must pass\"** names an executable check whose log you still read.\n- **\"Do not change the filtering logic\"** excludes an adjacent refactor.",
      "### Aufbau der präzisen Fassung\n\n- **\"20 pro Seite\"** legt die Standardgröße fest.\n- **\"Query-Parameter ?page=N\"** wählt Offset-Pagination statt eines Cursor-Vertrags.\n- **\"Bestehendes Antwortschema behalten; Feld pagination ergänzen\"** zieht die Kompatibilitätsgrenze.\n- **\"make test muss bestehen\"** nennt eine ausführbare Prüfung, deren Protokoll du trotzdem liest.\n- **\"Filterlogik nicht ändern\"** sperrt ein angrenzendes Refactoring.",
    ],
    ["Two questions at the end of the lesson.", "Zwei Fragen am Ende der Lektion."],
    [
      'Assemble a task spec for "/users pagination"',
      "Auftragsbeschreibung für die Pagination von /users",
    ],
    [
      "Select each field that fixes an implementation or review decision.",
      "Wähle jedes Feld, das eine Implementierungs- oder Review-Entscheidung festlegt.",
    ],
    [
      "Users can page through /users, 20 per page, via ?page=N.",
      "GET /users liefert über ?page=N jeweils 20 Einträge pro Seite.",
    ],
    [
      "The observable behavior in one sentence.",
      "Beobachtbares Verhalten in einem Satz.",
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
    ["make test passes.", "make test besteht."],
    ["make lint passes.", "make lint besteht."],
    [
      "Adjacent work explicitly excluded from this change.",
      "Angrenzende Arbeit, die ausdrücklich draußen bleibt.",
    ],
    ["Don't change filtering logic.", "Filterlogik nicht ändern."],
    ["Don't touch /users/:id.", "/users/:id nicht ändern."],
    ["Don't add caching.", "Kein Caching ergänzen."],
    ["Nice-to-haves", "Optionale Ergänzungen"],
    [
      "Optional work needs a scope decision too.",
      "Auch Optionales braucht eine Entscheidung über den Umfang.",
    ],
    [
      "A total-count field, only if explicitly accepted into scope.",
      "Ein Feld mit der Gesamtzahl, nur wenn es ausdrücklich in den Umfang kommt.",
    ],
    ["Unverifiable preference", "Nicht prüfbare Präferenz"],
    [
      "Defines neither behavior nor evidence.",
      "Definiert weder Verhalten noch Nachweis.",
    ],
    [
      "Make the endpoint feel polished.",
      "Der Endpunkt soll hochwertig wirken.",
    ],
    ["Three shapes of the same task", "Drei Fassungen desselben Auftrags"],
    ["Weak, one line", "Schwach: ein Einzeiler"],
    ["Strong, four parts", "Stark: vier Bestandteile"],
    [
      "task:\nadd pagination to /users",
      "Auftrag:\nPagination zu /users hinzufügen",
    ],
    [
      "Goal\nUsers can page through GET /users results via ?page=N, 20 items per page.\n\nConstraints\n- Keep existing response schema; add a top-level \"pagination\" object.\n- Offset-based (?page=N), not cursor.\n- No new dependencies.\n\nAcceptance\n- Tests cover page 1, page 2, out-of-range (page=999 → empty).\n- make test && make lint pass.\n- Existing filters (?role, ?status) still work.\n\nOut of scope\n- Don't touch the single-user detail endpoint.\n- Don't refactor the filter builder.",
      'Ziel\nGET /users unterstützt ?page=N mit 20 Einträgen pro Seite.\n\nEinschränkungen\n- Bestehendes Antwortschema behalten; Objekt "pagination" auf oberster Ebene ergänzen.\n- Offset-basiert über ?page=N, nicht cursor-basiert.\n- Keine neuen Abhängigkeiten.\n\nAkzeptanz\n- Tests decken Seite 1, Seite 2 und Werte außerhalb des Bereichs ab (page=999 → leer).\n- make test && make lint bestehen.\n- Bestehende Filter ?role und ?status funktionieren unverändert.\n\nNicht Bestandteil\n- Detailendpunkt für einzelne Benutzer nicht ändern.\n- Filter Builder nicht refaktorisieren.',
    ],
    [
      "Without constraints, a goal and tests still allow a schema change or an unrelated filter refactor. The four parts give review an explicit contract.",
      "Ohne Einschränkungen lassen Ziel und Tests eine Schemaänderung oder ein fremdes Filter-Refactoring durch. Die vier Bestandteile geben dem Review einen expliziten Vertrag.",
    ],
    [
      "A task has a clear goal and acceptance criteria but no excluded scope. What review risk remains?",
      "Ein Auftrag enthält ein klares Ziel und Akzeptanzkriterien, aber keinen ausgeschlossenen Umfang. Welches Review-Risiko bleibt?",
    ],
    [
      "The diff must be small regardless of the feature.",
      "Der Diff muss unabhängig von der Funktion klein sein.",
    ],
    [
      "Adjacent cleanup slips in, and the reviewer has no stated boundary to reject it.",
      "Angrenzendes Aufräumen rutscht mit hinein, und der Reviewerin fehlt eine Grenze, um es abzulehnen.",
    ],
    [
      "Codex will refuse to work without explicit scope.",
      "Codex verweigert die Arbeit ohne explizite Umfangsangabe.",
    ],
    [
      "Nothing; out-of-scope sections are decorative.",
      "Nichts; ausgeschlossener Umfang ist nur dekorativ.",
    ],
    [
      "Without a boundary, adjacent cleanup can pass as necessary work. An out-of-scope section lets Codex and the reviewer compare the diff with a stated limit.",
      "Ohne Grenze gilt angrenzendes Aufräumen schnell als notwendige Arbeit. Ein Abschnitt \"Nicht Bestandteil\" gibt Codex und Reviewerin dieselbe Linie für den Diff.",
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
      "\"make test passes, with new cases: page 1 returns 20 items, page 2 the next 20, page=999 an empty array.\"",
      "\"make test besteht, mit neuen Fällen: Seite 1 liefert 20 Einträge, Seite 2 die nächsten 20, page=999 ein leeres Array.\"",
    ],
    ['"It should be production-ready."', '"Es soll produktionsreif sein."'],
    ['"Don\'t break anything."', '"Nichts darf kaputtgehen."'],
    [
      "It names inputs, outputs and a command both sides can run. A passing log is evidence for those cases only; the next lesson strengthens it with reviewed tests.",
      "Es nennt Eingaben, Ausgaben und einen Befehl, den beide Seiten ausführen können. Ein grünes Protokoll belegt nur diese Fälle; die nächste Lektion stärkt den Nachweis mit geprüften Tests.",
    ],
  ],
});
