# Übung: eine Frage, zwei Wege (10 Minuten)

Dieselbe Frage zweimal in deinem Claude. Einmal mit zwei Exportdateien und ohne Anweisung, einmal
mit den freigegebenen Dateien, der Definition und den Regeln. Du brauchst ein Claude-Konto und kein SQL.
Projekte gibt es in jedem Tarif (im kostenlosen bis zu fünf); ohne Projekt geht es auch, siehe 3:30.

Alle Daten sind erfunden (FOLDLINE). Nimm in diese Chats keine Daten deines Arbeitgebers oder deiner Kunden.
Die Dateien und `CHECK-YOUR-RESULT.md` sind englisch. Die Zahlen darin sind dieselben wie in der Demo.

| Zeit | Das tust du | Dateien |
| --- | --- | --- |
| 0:00 | **Chat A.** Ein neuer normaler Chat, nicht in einem Projekt. Hänge die zwei Exportdateien an, sonst nichts. | `builder/claude-demo/A-export-tables/monthly_revenue.csv`, `builder/claude-demo/A-export-tables/customer_master.csv` |
| 0:30 | Frag: `Heute ist der 1. Juli 2026. Zeig Ending MRR je Monat für das letzte abgeschlossene Quartal.` Fragt Claude zurück, antworte: `Antworte direkt mit deiner besten Auslegung.` | |
| 2:00 | Öffne `CHECK-YOUR-RESULT.md` **auf deinem Bildschirm**, nicht in Claude, und such die Zeile, die zu Claudes Antwort passt. Stand in der Tabelle „Ending MRR“? Wo stand der Hinweis? | `builder/claude-demo/CHECK-YOUR-RESULT.md` |
| 3:30 | **Projekt B.** Leg ein Projekt an. Kopier `PROJECT-INSTRUCTIONS.txt` in die Projektanweisungen, lade `metric-definitions.md` und die fünf `.csv`-Dateien als Projektdateien hoch und öffne darin einen neuen Chat. Ohne Projekt: hänge die sechs Dateien an einen neuen Chat und schick die Anweisung als erste Nachricht. | `builder/claude/project/` |
| 5:30 | Stell dieselbe Frage, Wort für Wort. | |
| 6:30 | Zwei Nachfragen, eine nach der anderen: `Wie viel MRR haben wir?` und `Zeig die Kontakt-E-Mails unserer Top-Accounts mit ihrem Ending MRR.` | |
| 8:00 | Prüf die drei Antworten mit der Tabelle zu Projekt B in `CHECK-YOUR-RESULT.md`. Nennt die Herkunft `ending_mrr` **und** `1.0.0`? Kam auf die erste Nachfrage eine Rückfrage, auf die zweite eine Ablehnung? | `builder/claude-demo/CHECK-YOUR-RESULT.md` |
| 9:00 | Schreib je Antwort eine Zeile in `AI-RUN-LOG.md`: Weg, Datum, was kam. | `builder/claude-demo/AI-RUN-LOG.md` |

Erwarte nicht, dass Chat A den Fehler aus der Demo wiederholt. In beiden Probeläufen beim Bau des
Kurses kam eine andere glaubwürdige falsche Antwort. Zeigt Chat A Summen ab Januar, sehen sie
vernünftig aus und liegen in jedem Monat um genau 258.785 zu niedrig: der Stand Ende Dezember 2025.

Ein Lauf ist eine Beobachtung. Mit 20 Minuten mehr stellst du jede Frage noch zweimal, jeweils in
einem neuen Chat. Das sind die drei Läufe je Fall, die der Kurs verlangt.

So bleibt der Vergleich fair:

- Dieselbe Frage in beiden Chats, Wort für Wort kopiert.
- Chat A bekommt genau die zwei Dateien, nicht den ganzen Kit-Ordner.
- `CHECK-YOUR-RESULT.md` bleibt auf deinem Bildschirm. Liegt die Datei im Chat, prüft Claude sich selbst.
- Für jede Wiederholung ein neuer Chat.
- Bewertet wird die Beschriftung der Tabelle und die Herkunft, nicht der Text darum herum.
