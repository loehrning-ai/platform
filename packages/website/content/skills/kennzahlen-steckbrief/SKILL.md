---
name: kennzahlen-steckbrief
description: Kennzahlen aus Berichten oder Dashboards vergleichen oder bewerten. Legt Zähler, Nenner und Zeitraum fest und prüft eine Zahl bis zur Datenzeile. Use when comparing or judging report metrics.
---

# Kennzahlen-Steckbrief

Eine Kennzahl bedeutet nur, was ihr Steckbrief sagt. Derselbe Name steht in
verschiedenen Berichten für verschiedene Rechnungen: Defektrate als Meldungen
oder als Stück, Wachstum als Monatssumme oder je Woche, Ergebnis berichtet oder
bereinigt. Die Wahl entscheidet oft über den Schluss. Dieser Skill legt sie
fest, bevor eine Zahl verwendet wird.

Antworte in der Sprache der Person. English words for the card: metric card =
Steckbrief, numerator = Zähler, denominator = Nenner, period = Zeitraum,
source = Quelle, limit = Grenze, trigger = Auslöser.

Geht es darum, eine Kennzahl selbst aus Rohdaten, einer CSV oder einer
Datenbank zu rechnen, ist der Skill kennzahl-fragekarte gemeint.

## Zuerst
Liegt neben dieser Datei `references/steckbriefe.md`, lies sie, bevor du
rechnest. Dort stehen die Steckbriefe des Teams. Ihr Text gilt wörtlich und
geht dem Bericht vor. Weicht der Bericht ab, zeig beide Fassungen.

## Ablauf
1. Zitieren, dann rechnen. Liste jede Kennzahl, auf der deine Antwort beruhen
   wird, und zitiere ihre Stelle: Abschnitt, Seite oder Tabellenzeile. Steht
   eine Zahl nirgends, schätze sie nicht, sondern schreib „nicht im Material“.
2. Steckbrief je Kennzahl, fünf Zeilen:
   - Zähler: was gezählt wird, Vorgänge oder Menge, mit Einheit
   - Nenner: je was, oder „keiner“
   - Zeitraum: welche Tage, Wochen oder Monate, und womit verglichen wird
   - Quelle: Datei und Spalte, bei Berichten Abschnitt und Tabelle
   - Grenze: was die Zahl nicht aussagt
   Gibt es für die Kennzahl einen Steckbrief des Teams, übernimm ihn wörtlich.
   Fehlt eine Zeile dort und im Material, schreib „nicht festgelegt“ und frag
   nach, bevor du einen Schluss ziehst.
3. Gegenprobe. Ändert eine naheliegende andere Definition die Richtung, rechne
   beide und stell sie nebeneinander. Die häufigsten Gabeln:
   - Vorgänge oder Menge: Meldungen, Tickets, Datensätze gegen Stück, Euro,
     Stunden.
   - Absolut oder je Basis: Ohne Nenner wächst jede Zahl mit dem Volumen.
   - Monatssumme oder je Woche oder je Arbeitstag, wenn die Perioden ungleich
     lang sind. Zähl Wochen und Tage aus den Daten, nicht aus dem Gedächtnis.
   - Berichtet oder bereinigt: Ein Posten, der früher schon auftrat, ist
     wiederkehrend, auch wenn er unregelmäßig auftritt. Nenn die berichtete
     Zahl zuerst.
4. Eine Zahl zurückverfolgen. Rechne mindestens eine tragende Zahl aus den
   Rohdaten nach und schreib eine Zeile: Wert = Datei, Spalten, Filter, Anzahl
   Zeilen, Summe. Weicht sie ab, nenn die Differenz und stütz dich nicht auf sie.
5. Ist eine Empfehlung gefragt, in sechs Feldern: Entscheidung; Weil, mit der
   Steckbrief-Zeile, auf der es beruht; Zahl; Risiko in beide Richtungen;
   Gegenposition, also was die andere Definition ergibt, mit Wert; Auslöser, die
   Bedingung, die die Entscheidung umkehrt. Lässt sich der Auslöser erreichen,
   ohne dass sich in der Sache etwas ändert (Vorgänge zusammenfassen, umbuchen,
   Zeitraum verschieben), formulier ihn in Mengen.
6. Die Grenze steht im selben Satz wie die Zahl.

## Nicht tun
- Keine Zahl ohne Quelle, keine Schätzung als Tatsache.
- Keine bereinigte Zahl ohne die berichtete daneben.
- Kein „gut“ oder „schlecht“ ohne die Vergleichsbasis.
- Keine Definition stillschweigend wählen. Fehlt sie, zeig die Möglichkeiten
  und frag.
- Keine Zugangsdaten, Schlüssel oder Token erfragen oder in einen Steckbrief
  schreiben. Quelle heißt Datei oder System, nicht Zugang.

## Format eines Steckbriefs
So stehen die Steckbriefe in `references/steckbriefe.md`, ein Block je
Kennzahl. Fehlt die Datei, frag nach den Zeilen und schreib den Block so auf:

### <Name der Kennzahl>
- Entscheidung: <welche Entscheidung sie stützt>
- Zähler: <was gezählt wird, mit Einheit>
- Nenner: <je was, oder keiner>
- Zeitraum: <Periode und Vergleich>
- Quelle: <Datei oder System, Spalte>
- Grenze: <was sie nicht aussagt>
- Auslöser: <Bedingung, die die Entscheidung umkehrt>

## English
A metric means only what its card says. Before you use a number from a report
or dashboard, read `references/steckbriefe.md` if it exists; its cards apply
word for word. Cite where each number stands, then write one card per metric:
numerator, denominator, period, source, limit. When an obvious other definition
flips the direction (events or quantity, absolute or per base, month total or
per week, reported or adjusted), compute both side by side. Trace one figure to
file, columns, filter, rows and sum. A recommendation takes the six fields
above, with a trigger in quantities. Never pick a definition silently, never
ask for credentials, keys or tokens. To compute a metric from raw data, use the
skill kennzahl-fragekarte.
