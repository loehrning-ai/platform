---
name: kennzahl-fragekarte
description: Eine Kennzahl selbst aus Rohdaten, CSV oder Datenbank rechnen: Stand, Veränderung oder Quote und Quelle festlegen. Computing a metric from raw data, a CSV or a database.
---

# Kennzahl-Fragekarte

Richtige Zeilen ergeben nicht von selbst eine richtige Zahl. Die meisten Fehler entstehen, weil
nicht aufgeschrieben ist, was eine Spalte bedeutet. Dieser Skill legt die Bedeutung fest, bevor
gerechnet wird: fünf Kästchen, in dieser Reihenfolge.

Er lenkt. Er sperrt nichts. Was nicht gelesen werden darf, darf gar nicht erst im Zugriff liegen.

Die Definitionen stehen in `references/kennzahlen.md`, eine Kennzahl je Abschnitt. Gibt es die
Datei nicht, arbeitest du ohne festgelegte Quelle: frag vor der ersten Rechnung nach Quelle, Art
und Zählregel.

Geht es um eine Zahl aus einem fertigen Bericht oder Dashboard, nicht um eine eigene Rechnung:
dafür ist der Skill `kennzahlen-steckbrief` da.

English: answer in the language of the question. Stand = level, Veränderung = change,
Quote = rate, Rückfrage = ask back, Ablehnung = refusal, Herkunft = trace.

## Vor jeder Rechnung

1. **Frage.** Fehlt Zeitraum, Art der Zahl oder Einheit: stell genau eine kurze Rückfrage und
   rechne nicht.
2. **Quelle.** Steht die Kennzahl in `references/kennzahlen.md`, nimm nur die dort genannte Datei
   oder Sicht und Spalte. Steht sie dort nicht: sag das und nenne die Quelle, die du nehmen
   würdest, bevor du rechnest. Andere Dateien im Chat nutzt du nur, wenn der Mensch es ausdrücklich
   sagt.
3. **Art und wer zählt.**
   - Stand (Wert zu einem Zeitpunkt): nie über die Zeit addieren. Für ein Quartal: jedes
     Periodenende einzeln oder das letzte, und sag, welches.
   - Veränderung (Fluss in einem Zeitraum): addieren nur über abgeschlossene Perioden. Einen Stand
     daraus nur mit einem Anfangsstand aus einer genannten Quelle. Fehlt er: sag es und rechne nicht.
   - Quote: aus Zähler und Nenner neu rechnen, nie Quoten mitteln. Nenner 0 heißt „keine Quote“,
     nicht 0 %. Schreib immer „z von n“ dazu.
   - Wer zählt: nimm die Regel aus `references/kennzahlen.md`. Speichert eine Spalte Codes (zum
     Beispiel A, C, N), such nie nach einem Wort wie „active“. Ist ein Code nicht erklärt: frag nach.
   - Heißt eine Spalte `amount`, `value`, `wert`, `betrag` oder `status` und ist nicht definiert:
     frag, ob sie Stand oder Veränderung ist.
4. **Grenze.** Namen, E-Mail-Adressen, Telefonnummern, Anschriften und andere direkte Kennungen:
   lehne ab, bevor du rechnest. Pseudonyme Schlüssel sind nicht anonym; nenn sie nicht so. Für eine
   Kennzahl ohne Definition nimm keinen Ersatzwert: lehne ab und sag, was fehlt.
5. **Herkunft.** Jede Antwort mit Zahl endet mit diesem Block:

   ```text
   Herkunft
   - Kennzahl: <slug> <version>
   - Art: Stand, Veränderung oder Quote
   - Zeitraum: <von> bis <bis>, Einheit <Einheit>
   - Quelle: <Datei oder Sicht>, Spalte <Spalte>
   - Wer zählt: <Regel in einem Satz>
   - Datenstand: <Ladezeit>, <n> h alt am Stichtag <Stichtag>
   - Nicht enthalten: <eine Zeile>
   ```

   Ohne Kennzahl und Version ist die Antwort unvollständig, auch wenn die Zahl stimmt.

## Datenstand

Rechne mit dem Stichtag aus der Frage. Fehlt er und ist in `references/kennzahlen.md` keiner
festgelegt: frag nach. Nimm nie stillschweigend das heutige Datum. Gibt `references/kennzahlen.md`
eine Warnschwelle an und sind die Daten älter: antworte und schreib zuerst eine Warnung mit
Ladezeit und Alter. Erfinde keine Sperre nach Alter.

## Nie

- Stände über die Zeit addieren.
- Erwartete Testwerte selbst ausrechnen oder bestätigen. Sie kommen von außerhalb.
- Eine Exportdatei „zum Abgleich“ heranziehen, wenn eine freigegebene Quelle genannt ist.
- Zugangsdaten, Verbindungszeichenfolgen oder Passwörter in eine Antwort oder Datei schreiben.

## English

Correct rows do not make a correct number by themselves. Most errors come from a column whose
meaning nobody wrote down. This skill fixes the meaning before any calculation: five boxes, in
this order. It guides; it locks nothing. Data that must not be read must not be in reach.

Definitions live in `references/kennzahlen.md`, one metric per section. Without that file, ask for
source, kind and counting rule before the first calculation. For a number from a finished report
or dashboard, use the skill `kennzahlen-steckbrief` instead.

1. **Question.** Period, kind of number or unit missing: ask one short question back, no
   calculation.
2. **Source.** Use only the file or view and column named in `references/kennzahlen.md`. Not
   listed: say so and name the source you would use before calculating.
3. **Kind and who counts.** A level is never added over time. A change is added only over closed
   periods; a level from changes needs an opening level from a named source. A rate is recomputed
   from numerator and denominator, never averaged; denominator 0 means "no rate". Codes such as A,
   C, N are never searched for as words like "active". An undefined `amount`, `value` or `status`:
   ask whether it is a level or a change.
4. **Boundary.** Names, e-mail addresses, phone numbers, postal addresses and other direct
   identifiers: refuse before calculating. Pseudonymous keys are not anonymous.
5. **Trace.** Every answer with a number ends with the trace block above: metric and version,
   kind, period and unit, file and column, who counts, data as of and age, one line "not included".

Use the clock date from the question; never assume today. Never compute or confirm expected test
values yourself: they come from outside.
