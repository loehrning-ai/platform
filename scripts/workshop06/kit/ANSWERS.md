# Lösungen

Alle Beträge in Euro, netto, für ein Jahr mit 40.000 Kartons. Diese Datei schreibt `tools/fall.py` aus den
Bedingungen der Angebote; wer eine Zahl im Fall ändert, rechnet sie neu.

## Schritt 1

Angebot A (Rednitz Kartonagen, Nürnberg), geliefert und bezahlt: **25.872 €**.

Ware 26.400 € (0,66 € mal 40.000), Fracht 0 € (DAP, frei Werk), Einmalig 0 € (Stanzform
und Klischee vorhanden), Lager 0 € (Abrufe zu 3.000 Stück), Skonto −528 €
(2 % in 14 Tagen).

Wenn es nicht passt: Der Staffelpreis von 0,62 € gilt erst ab 60.000 Stück. Brandtwerk braucht 40.000.

## Schritt 2

Angebot B (Wartapak, Poznań): Fracht **2.800 €** (2 Fahrten zu 1.400 €),
Lager **1.920 €** (20 Paletten je Lieferung, 10 passen ins eigene Lager, also
10 externe Plätze mal 16 € mal 12 Monate), Skonto **−416 €**.
Summe geliefert und bezahlt: **26.554 €**.

Wenn es nicht passt: EXW heißt, Brandtwerk zahlt Fracht und Verladung ab Poznań. Die Stanzform steht in Fußnote 1,
einmal 1.450 €, ohne Skonto. Skonto gibt es nur auf die Ware.

## Schritt 3

Angebot C (Kartovka, Brno): Ware 23.000 € (57,50 € je 100 Stück, also
0,575 € je Stück), Fracht 2.600 € (4 Fahrten zu 650 €, FCA), Lager 0 €
(10 Paletten je Lieferung passen ins eigene Lager), Einmalig 0 € (Stanzform und
Klischee übernimmt Kartovka), Skonto −690 € (3 %).
Summe: **24.910 €**.

Reihenfolge nach Stückpreis: B (0,520 €), C (0,575 €), A (0,660 €).
Reihenfolge geliefert und bezahlt: C (24.910 €), A (25.872 €), B (26.554 €).

Ab welchem Anstieg des Papierindex verliert C den ersten Platz? Bei **6,97 %**, also bei etwa 7 %:
Der Zuschlag ist 60 % der Ware mal den Anstieg, 23.000 € mal 0,6 mal 6,97 % gleich
962 €, genau der Vorsprung vor A. Der Zuschlag ist nicht skontofähig, er verändert das Skonto nicht.

Wenn es nicht passt: Prüfe die Einheit. 57,50 € gelten für eine VE zu 100 Stück, nicht für ein Stück und nicht für
1.000. Und FCA heißt wie EXW: Die Fahrt ins Werk zahlt Brandtwerk.

## Zusatz: der zweite Fall

Schutzhandschuhe, zwei Angebote, `fall/zweiter-fall.csv`. X Kassel kostet im Jahr 9.408 €, Y Leipzig 9.740 €.
Y hat den niedrigeren Warenpreis, X ist geliefert und bezahlt um 332 € günstiger. Die Fracht entscheidet.

Wenn es nicht passt: Y gibt kein Skonto. Das ist eine Zeile mit 0 €, keine fehlende Zeile.

## Schritt 4: Claude prüfen

Mit `take-home/prompt.md` und dem ganzen Ordner `fall/` sollte Claude auf dieselbe Tabelle kommen: C 24.910 €,
A 25.872 €, B 26.554 €, zu jeder Zahl eine Stelle. Wenn eine Zahl ohne Stelle dasteht, frag Claude, wo sie
steht. Den Papierzuschlag soll Claude als offene Frage nennen, nicht als Zahl.

Ohne `kosten-intern.md` kennt Claude die Sätze für Fracht und Lager nicht. Richtig ist dann: kein Urteil, die Zeilen
Fracht und Lager als offen, und eine Frage nach den Sätzen. Rechnet Claude trotzdem mit einer geschätzten Fracht,
ist das genau der Fehler aus der Session.

Wenn es nicht passt: Leg Claude die Zeile aus deiner Tabelle hin und frag, wo seine Zahl steht. Liegt
`kosten-intern.md` nicht im Ordner, kommt der Unterschied meist von dort.

## Lösung

Angebot C aus Brno kostet Brandtwerk im Jahr am wenigsten, geliefert und bezahlt: 24.910 €, 962 € weniger
als A. Das Angebot mit dem niedrigsten Stückpreis, B aus Poznań, ist das teuerste: 26.554 €, 682 € mehr
als A. Die Antwort "B spart 5.600 € im Jahr" vergleicht nur die Ware.
Die aufgezeichnete Antwort rechnet für B 21.834 € und schätzt die
Fracht; mit Fracht aus `kosten-intern.md` und dem Lager kostet B 26.554 €.

Was C den Vorsprung kosten kann: der Papierzuschlag. Ab etwa 7 % Anstieg des Papierindex liegt A vorn. Vor der
Unterschrift fragst du Kartovka, welcher Index gilt, und ob ein Deckel für den Zuschlag möglich ist.
