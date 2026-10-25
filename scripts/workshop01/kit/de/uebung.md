# Übung: Die Linsensuppe prüfen

Daten: daten/linsensuppe-woechentlich.csv. Geprüft wird 30.12.2024 bis 22.12.2025.
Geplant wird die Woche ab 29.12.2025. Die Prognose entsteht sonntags, wenn die
Vorwoche abgeschlossen ist. Rechnen: Demo, Claude-Skill oder pruefen.py.

## 1. Messlatte (10 Minuten)

Ohne Tool plant Feldmark „wie letzte Woche“.

a) Welche Wochen im Prüfzeitraum dürfen nicht in den Vergleich, und warum?
   Welche Zeile steht doppelt?
b) Mittlerer absoluter Fehler und Bias von Prognose und „wie letzte Woche“, auf
   genau denselben Wochen. (Excel: Spalte Fehler = Ist − Prognose, dann
   MITTELWERT(ABS(...)).)
c) tool-export.txt nennt 94,2 % Genauigkeit. Rechne dieselbe Formel für „wie letzte
   Woche“. Um wie viel Prozent sind die Fehler des Tools kleiner?
d) Was steht am 12.05.2025 im Hinweis, und was weiß das Tool dort, was die Regel
   nicht weiß?

## 2. Spanne (10 Minuten)

Für jede Woche nimmst du die Fehler (Ist − Prognose) der 26 gültigen Wochen davor.
Ihr 10-%- und 90-%-Wert, zur Prognose addiert, ergeben die 80-%-Spanne der Woche.

a) Erst schätzen: In wie vielen der 50 Wochen lag das Ist in der Spanne?
b) Eine Woche von Hand, die Woche ab 07.04.2025. Nimm die Fehler der 26 gültigen
   Wochen davor (16.09.2024 bis 31.03.2025, ohne 04.11., 03.02. und 10.03.).
   =QUANTIL.INKL(Fehler;0,1) und =QUANTIL.INKL(Fehler;0,9), beide zur Prognose 607
   addieren. Lag das Ist 484 in der Spanne?
c) Alle 50 Wochen zählen (Demo, Skill oder pruefen.py). Dann getrennt vor und ab
   dem 07.04.2025.
d) Was steht am 07.04.2025 im Hinweis, und wie erklärt es c)?

## 3. Planzahl (5 Minuten)

a) Lies kosten.md. Welchen Anteil der Wochen willst du abdecken?
   Fehlmenge ÷ (Fehlmenge + Rest).
b) Prognose für den 29.12.2025: 729. Welche Menge planst du? (Excel: QUANTIL.INKL
   über die letzten 26 Fehler, zum Anteil aus a.)
c) Die Kantine kündigt. Was ändert sich?

## 4. Regel (5 Minuten)

Lies pruefregel.md und prüfe sie gegen 2025.

a) Eine Lampe von Hand: Bias für die Woche ab 21.04.2025, über die 13 gültigen
   Wochen davor (06.01. bis 14.04.2025, ohne 03.02. und 10.03.).
   =(SUMME(Prognose) − SUMME(Ist)) ÷ SUMME(Ist). Grün oder rot?
b) In welchen Wochen hätte die Regel gesperrt, und welche Lampe war rot?
c) Wie viele Wochen nach der Auslistung schlägt sie an?
d) Wer hätte in diesen Wochen entschieden, und mit welcher Zahl und welchem Grund?

## Danach: deine Reihe

Mindestens 33 Wochen Ist und die Prognose, die damals im System stand, in
vorlage/meine-daten.csv. Durch Demo, Skill oder pruefen.py. pruefregel.md für deine
Reihe ausfüllen. Gewinnt dein Tool nicht gegen die Messlatte, ist das das Ergebnis,
kein Rechenfehler.
