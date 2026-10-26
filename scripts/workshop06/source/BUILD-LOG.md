# Bauprotokoll: Welches Angebot ist günstiger?

Beispiel-Workshop, 90 Minuten, gebaut mit rotfaden wie von einer Person, die den Skill benutzt: `SKILL.md` Phase für Phase,
vom Thema und einer Marke bis zur letzten Prüfung. Hier steht, was dabei außerhalb des Skill-Ablaufs von Hand
geschah, damit niemand das Beispiel für glatter hält, als es war.

## Der Ablauf

| Phase | Was geschah | Ergebnis |
|---|---|---|
| 0 Marke | `rotfaden new … --brand press`, Swatch angesehen | press-Vorlage unverändert |
| 1 Recherche | 9 Fakten mit Zitat und Datum in `research/facts.md`; die falsche Antwort als echter Lauf in `research/wrong-answer-run.md` | |
| 2 Roter Faden | `redline.json`: eine Frage, ein Lernziel, 7 Akte, 6 Stationen, 3 Abstimmungen | |
| 3 Rückfrage "Richtige Geschichte?" | nicht live gestellt, siehe unten | |
| 4 Deck | `rotfaden init`, alle Starterfolien auf Deutsch neu geschrieben, 20 Szenen und 4 Anhangseiten | 75 von 76,5 Minuten |
| 5 Kit | `kit init`, dann 17 Dateien | |
| 6 Demo | `demo init`, sechs Beats | |
| 7 Blinder Lauf | zwei Läufe, `research/blind-run.md` | Lauf 1 fand eine Lücke, Lauf 2 ohne Abweichung |
| 8 Faktencheck | `research/fact-check.md` | 9 von 9 bestätigt; nach der Durchsicht vom 26.10. ist einer entfernt, 8 bleiben |

## Handarbeit außerhalb des Ablaufs: 9 Stellen

1. **`tools/fall.py`** ist ein eigenes Skript, das der Skill nicht vorsieht. Es rechnet den Fall, schreibt
   `kit/kostenzeilen.csv`, `kit/fall/zweiter-fall.csv` und `kit/ANSWERS.md` und vergleicht jede Zahl in `redline.json`
   mit der Rechnung. Grund: ANSWERS.md sollte aus einem Skript kommen, nicht von Hand.
2. **Kit-Gerüst umgebaut.** `kit init` legt auch im deutschen Gerüst englische Ordner an; umbenannt wurden `case/` in
   `fall/`, `sheets/` in `karten/`, `templates/` in `vorlagen/` und `practice.md` in `schritte.md`, die Pfade in
   `redline.json` nachgezogen.
3. **Reihenfolge Phase 5 vor Phase 4.** Der Kit entstand vor dem Deck, weil die Zahlen des Decks an Kit-Dateien
   gebunden sind.
4. **Phase 3 nicht live gefragt.** Die Geschichte stand vor dem Bau fest; das steht in
   `research/decisions.md`.
5. **Werkzeugfehler 1, behoben im Skill:** Die Routen-Szene legte die Stationsnamen übereinander, wenn ein Name am
   Rand lang ist ("Falsche Antwort" über "Warum falsch"). `assets/assemble.py` misst jetzt die echten Kanten der
   Beschriftungen; neuer Test in `tests/test_assemble.py`.
6. **Werkzeugfehler 2, behoben im Skill:** Eine gebundene Zahl brach zwischen Zahl und Einheit um ("36" und "%" auf
   zwei Zeilen). `assets/deck.css` hält jetzt jedes `data-bind` in einer Zeile; die beiden anderen Beispieldecks wurden
   dafür neu gebaut (nur diese CSS-Zeile ändert sich).
7. **`demo init` riet die Dateien vertauscht:** `data` zeigte auf den zweiten Fall, `own.fixture` auf den Hauptfall.
   Von Hand getauscht.
8. **Prüfprotokoll von Hand übertragen.** Die Anhangseite `pruefprotokoll` enthält die Ergebniszeilen der Prüfungen,
   kopiert aus der Ausgabe; danach wurde neu gebaut und erneut geprüft, mit denselben Ergebnissen.
9. **Einbindung ins Repo:** CI baut und prüft dieses Beispiel, der Sprachtest läuft darüber.

Nicht gezählt, weil sie zum Ablauf gehören: Folieninhalte, Notizen und folienweite `<style>`-Blöcke, die Korrektur am
Kit nach dem blinden Lauf (Angebot C nennt jetzt die Stanzform), das Kürzen von Texten, bis die Prüfungen ohne Fehler
liefen.

## Abweichungen von der Vorgabe

- **Kit mit 17 statt 8 Dateien.** Die 8 Kerndateien der Vorgabe sind alle da (START-HERE zuerst). Der Skill
  verlangt zusätzlich Rollen, die eine Demo mit Mitnahme braucht: Feldkarte, zwei Vorlagen, Projektanweisungen,
  Prompt, Skill, Changelog, ANSWERS und zweiter Fall.
- **Polnisches Register nicht geprüft.** Die KRS-Abfrage verlangt einen Schlüssel; für "Wartapak" gibt es nur die
  Websuche ohne Treffer.

## Gefunden, nicht behoben

- `rotfaden check DIR --strict` meldete 0 Fehler, während `rotfaden lint DIR` den 38 Wörter langen
  `case.summary` als Fehler meldete (höchstens 25 Wörter je Block). Die beiden Prüfungen wenden die Regel
  unterschiedlich an. Der Text ist gekürzt; die Prüfungen selbst sind unverändert.

## Nachtrag 2026-10-26: Durchsicht und Nacharbeit

Drei Durchsichten (Didaktik, Bedienung mit dem Skill, Veröffentlichung) fanden Lücken; behoben ist, was am Beispiel
lag:

- Die falsche Antwort der Folien 5 und 19 ist jetzt mit zwei weiteren aufgezeichneten Läufen belegt:
  `research/run-mit-basis.md` (Prompt aus dem Kit mit allen Unterlagen) und `research/run-ohne-saetze.md` (ohne die
  internen Sätze). Je ein Lauf, kein Benchmark.
- Der Fakt zum Zahlungsziel nach BGB ist entfernt; an seiner Stelle steht die Preisbindung aus den Angeboten.
- Kit: Schritt 4 "Claude prüfen, allein", die Vergleichsbasis mit den Blöcken der Demo, eine Verhandlungsmail an
  das Angebot vorn, eine Spalte "Stelle" in `kostenzeilen.csv`.
- Demo: fehlende Zeilen zählen nie als 0, eine Quellenspalte, der Papierindex als Regler mit Kipppunkt.
- Die Prüfungen danach: `rotfaden check . --demo --strict`, `kit check`, `lint` und das Deck im Browser, alle mit
  0 Fehlern; die Ergebniszeilen stehen auf der Anhangseite `pruefprotokoll`.
