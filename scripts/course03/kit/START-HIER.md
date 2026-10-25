# Start hier

Dieses Kit gehört zum Workshop „Datenbereitschaft für KI“. Es arbeitet mit FOLDLINE, einer erfundenen
Firma, die Software im Abo verkauft. Alle Zahlen sind synthetisch.

Das Ziel in einem Satz:

> Bevor ich eine Zahl aus der KI weitergebe, fülle ich fünf Kästchen aus: Frage, freigegebene Sicht,
> Art der Zahl und wer zählt, Grenze, Test.

## Drei Schritte

| Schritt | Öffnen | Zeit | Ergebnis |
| --- | --- | --- | --- |
| 1 | Demo „Die Fragekarte“: loehrning.ai/demos/datenbereitschaft-fuer-ki | 4 Minuten | Vier falsche Tabellen aus derselben richtigen Datei, und welches Kästchen jede fängt. |
| 2 | `UEBUNG.md` | 10 Minuten | Dieselbe Frage zweimal in deinem Claude: mit zwei Exportdateien und mit den freigegebenen Dateien. Prüfen mit `builder/claude-demo/CHECK-YOUR-RESULT.md`. |
| 3 | `FRAGEKARTE.md` | 15 Minuten | Deine Karte für eine Zahl, die du regelmäßig weitergibst. Unter „Deine Karte“ in der Demo werden daraus die Dateien aus `claude/`. |

## Was du danach hast

- `claude/kennzahl-fragekarte/`: ein Skill. Claude legt vor jeder Kennzahl Art und Quelle fest,
  fragt bei Lücken nach und nennt am Ende die Herkunft.
- `claude/PROJEKT-ANWEISUNG-VORLAGE.txt`: Anweisungen für ein Claude-Projekt mit deinen freigegebenen Dateien.
- `claude/PRUEFLISTE-VORLAGE.md`: deine Tests mit erwarteten Werten. Diese Datei kommt nie in Claude.

Alle drei sind mit dem FOLDLINE-Beispiel ausgefüllt. Wie du sie installierst, steht in `claude/README.md`.

## Was dieses Kit nicht ist

Kein Reifegradmodell und keine Zertifizierung. Es prüft eine Frage auf einer Quelle. Den Aufbau für ein
Datenteam mit PostgreSQL findest du in `builder/` (Englisch).

Trag keine Daten deines Arbeitgebers, deiner Kunden oder von Personen ein.
