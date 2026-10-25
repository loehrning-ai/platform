# Prognose prüfen: Kit zu Workshop 1

Du prüfst eine Wochenprognose an ihren eigenen alten Fehlern, bevor danach geplant
wird. Eine Spalte, Ist minus Prognose, beantwortet vier Fragen:

1. Messlatte: Sind die Fehler kleiner als die von „wie letzte Woche“?
2. Spanne: Lag das Ist so oft in der 80-%-Spanne, wie sie verspricht?
3. Planzahl: Welche Menge folgt aus den Kosten für ein fehlendes und ein übriges Stück?
4. Regel: Welche Woche läuft die Prognose allein, welche entscheidet eine Person?

Die Firma ist erfunden: Suppenwerk Feldmark kocht montags Linsensuppe (500 ml, frisch)
für Bio-Läden. Die Zahlen sind erfunden. Die Fehler in der Datei sind die, die echte
Exporte haben: eine Zeile doppelt, eine Woche ohne gespeicherte Prognose, zwei Wochen
ausverkauft.

## Reihenfolge (40 Minuten)

1. daten/ ansehen (5 Minuten).
2. uebung.md, Aufgaben 1 bis 4 (30 Minuten).
3. Mit loesungen.md vergleichen (5 Minuten).
4. Danach: deine eigene Reihe in vorlage/meine-daten.csv, pruefregel.md ausfüllen.

## Drei Wege, dieselben Zahlen

- Browser: loehrning.ai/demos/ki-prognosen-einschaetzen. Im Schritt „Meine Daten“ mit
  deiner Datei. Nichts verlässt das Gerät.
- Claude: loehrning.ai/skills/prognose-pruefen.zip als Skill hochladen (Schritte unten;
  derselbe Skill liegt entpackt in claude/prognose-pruefen/). Dann die
  CSV in den Chat legen und schreiben: „Prüf diese Prognose. Fehlendes Glas 1,50 €,
  übriges Glas 0,40 €.“ Ohne Skill: claude/projekt-anweisung.md in die Anweisungen
  eines Projekts.
- Ohne Claude, mit Python 3 und ohne weitere Pakete:
  `python3 pruefen.py daten/linsensuppe-woechentlich.csv --fehlmenge 1,50 --rest 0,40`

Alle drei Wege rechnen mit demselben Code und kommen auf dieselben Zahlen wie
loesungen.md.

## Die Spalten

    woche;ist;prognose;hinweis

- woche: Montag der Woche, 2025-04-07 oder 07.04.2025.
- ist: verkaufte Menge. Leer in der Woche, die du planst.
- prognose: die Zahl, die damals im System stand. Nie nachträglich neu rechnen.
- hinweis: frei. Steht dort „ausverkauft“, zählt die Woche nicht. Eine Spalte
  bestand_ende mit 0 wirkt genauso.

## Was das Kit nicht kann

- Es baut keine Prognose. Es prüft eine, die es schon gibt.
- Ohne gespeicherte alte Prognosen gibt es keine Prüfung 1. Ab heute ablegen.
- Ein neues Produkt hat keine Fehlerliste. Dort entscheidet eine Person.
- Die Planzahl gilt für Ware, die nach der Woche an Wert verliert.

## So kommt der Skill in deinen Claude

{{CLAUDE_UI}}