# Die Fragekarte

Fünf Kästchen für eine Zahl, bevor sie weitergeht. Jedes fängt einen anderen Fehler.
Papier reicht. Rechts steht das ausgefüllte FOLDLINE-Beispiel aus dem Workshop „Datenbereitschaft für KI“.
FOLDLINE ist erfunden, alle Zahlen sind synthetisch.

| Kästchen | Deine Antwort | FOLDLINE | Fängt |
| --- | --- | --- | --- |
| 1. Frage: Zeitraum, Art, Einheit, Stichtag |  | Ending MRR für jedes Monatsende April bis Juni 2026, in EUR. Stichtag 1. Juli 2026. | „Wie viel MRR haben wir?“ Ohne Zeitraum und Art gibt es keine richtige Antwort, also eine Rückfrage. |
| 2. Freigegebene Sicht |  | `analytics.mrr_summary_monthly`, Spalte `ending_mrr_eur`. Sonst nichts. | Sieben Exporttabellen, in denen eine Veränderung `amount` heißt. |
| 3. Art der Zahl und wer zählt |  | Stand am Monatsende, eine Zeile je Monat, April bis Juni einzeln. Es zählen Abos, die am Monatsende laufen, neue eingeschlossen. Gekündigte nicht. | −19.960 (Veränderung als Stand), 75.890 (aufsummiert ohne Anfangsstand), 1.066.140 (Stände addiert), 120 statt 132 aktive Konten. |
| 4. Grenze |  | Claude sieht keine Kontaktdaten. Gesperrt, weil die Datei nicht im Projekt ist; in der Datenbank darf der Login nur fünf Sichten lesen. | Eine Anweisung „keine E-Mails“ allein. Sie lenkt, sie sperrt nichts. |
| 5. Test |  | April 334.675 €, Mai 344.450 €, Juni 387.015 €. Quelle: Monatsabschluss Finanzen. „Wie viel MRR haben wir?“ löst eine Rückfrage aus. Die Bitte um E-Mails wird abgelehnt. | Eine Zahl, die nur richtig aussieht. |

## Kästchen 3: die Lücken, Zeile für Zeile

| Lücke | Was du festlegst | FOLDLINE |
| --- | --- | --- |
| Art | Stand, Veränderung oder Quote | Stand am Monatsende |
| Zeilen | eine Zeile je Tag, Woche, Monat oder Quartal | je Monat |
| Zeitraum | welche Perioden, und ob sie abgeschlossen sind | April, Mai, Juni 2026, jede einzeln, abgeschlossen |
| Spalte | welche Spalte in welcher Sicht | `ending_mrr_eur` in `analytics.mrr_summary_monthly` |
| Wer zählt | wer drin ist und wer nicht, zuerst in Worten, dann die Codes | laufende Abos am Monatsende, neue eingeschlossen: Codes A und N, am 30. Juni 132 Konten |

## Addieren: wann ja, wann nie

| | über Gruppen | über Monate | eine Zahl fürs Quartal |
| --- | --- | --- | --- |
| Stand | ja | nie | jeder Monat einzeln oder der letzte |
| Veränderung | ja | ja | die Summe |
| Quote | neu rechnen | neu rechnen | Zähler und Nenner neu summieren: 12 von 120 = 10,0 % |

Probe: letzter Stand plus Veränderung ergibt den neuen Stand. 354.635 + 32.380 = 387.015.

## Kästchen 5: so testest du

- Der erwartete Wert kommt von außerhalb der KI: Monatsabschluss, freigegebener Bericht, Nachzählung
  durch eine zweite Person. Nie von der KI, die du testest.
- Teste drei Verhalten: eine Antwort mit Wert, eine Rückfrage, eine Ablehnung. Hast du eine
  Altersregel, dazu eine Antwort mit Warnung.
- Bewertet werden Wert und Verhalten, nicht der Rechenweg.
- Jede Frage drei Mal, jeweils in einem neuen Chat. Ein Lauf ist eine Beobachtung.
- Die Prüfliste liegt außerhalb von Claude. Liegt sie im Projekt, prüft Claude sich selbst.

## Belege im Kit, Kästchen für Kästchen

| Kästchen | Datei im Kit | In der Demo |
| --- | --- | --- |
| Ausgang | `builder/claude-demo/AI-RUN-LOG.md`, `builder/claude-demo/A-export-tables/monthly_revenue.csv` | loehrning.ai/demos/datenbereitschaft-fuer-ki?beat=lesarten |
| 1 und 2 | `builder/semantic/verified-questions.yml` (Fall C01), `builder/claude/project/mrr_summary_monthly.csv` | loehrning.ai/demos/datenbereitschaft-fuer-ki?beat=sicht |
| 3 | `builder/CHEATSHEET.md`, `builder/claude-demo/A-export-tables/customer_master.csv` | loehrning.ai/demos/datenbereitschaft-fuer-ki?beat=wer-zaehlt |
| 4 | `builder/claude/project/PROJECT-INSTRUCTIONS.txt` Regel 3, `builder/warehouse/ACCESS.md` | loehrning.ai/demos/datenbereitschaft-fuer-ki?beat=grenze |
| 5 | `builder/claude-demo/CHECK-YOUR-RESULT.md` | loehrning.ai/demos/datenbereitschaft-fuer-ki?beat=test |

## Leere Karte

| Kästchen | |
| --- | --- |
| 1. Kennzahl · Frage · Stichtag |  |
| 2. Freigegebene Sicht · Spalte |  |
| 3. Art · wer zählt, wer nicht |  |
| 4. Nie sehen · gesperrt durch |  |
| 5. Erwartete Werte · Einheit · Quelle |  |

Unter „Deine Karte“ in der Demo wird aus dieser Karte in deinem Browser ein Skill, eine Projektanweisung
mit `kennzahlen.md` und eine Prüfliste.
