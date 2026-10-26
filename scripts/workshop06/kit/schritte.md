# Schritte

Drei Angebote, eine Vergleichsbasis. Die Basis steht in der Anfrage: 40.000 Stück im Jahr, Preis je Stück, geliefert
bis ins Werk, mit allen einmaligen Kosten, bezahlt mit Skonto (Brandtwerk zieht es immer, `fall/kosten-intern.md`).

## Schritt 1: vorgerechnet

Angebot A, `fall/angebot-a-nuernberg.md`, auf die Basis gebracht:

| Zeile | Wo es steht | Rechnung | Im Jahr |
|---|---|---|---|
| Ware | Pos. 1 | 0,66 € mal 40.000 | 26.400 € |
| Fracht | "frei Werk (DAP)" | der Lieferant fährt bis ins Werk | 0 € |
| Einmalig | "Stanzform und Klischee: vorhanden" | nichts | 0 € |
| Lager | Abrufe ab 3.000 Stück | 3 Paletten, passt ins eigene Lager | 0 € |
| Skonto | "14 Tagen mit 2 % Skonto" | 2 % von 26.400 € | −528 € |
| **Summe** | | | **25.872 €** |

Pos. 1a mit 0,62 € gilt erst ab 60.000 Stück. Brandtwerk braucht 40.000, also zählt 0,66 €. Die Fracht ab Nürnberg
in `fall/kosten-intern.md` zahlt bei DAP der Lieferant; sie gehört nicht in diese Zeile.

## Schritt 2: halb ausgefüllt

Angebot B, `fall/angebot-b-poznan.md`. Zwei Zeilen stehen schon, die anderen füllst du.

| Zeile | Wo es steht | Rechnung | Im Jahr |
|---|---|---|---|
| Ware | "520,00 EUR / 1000 szt." | 0,52 € mal 40.000 | 20.800 € |
| Fracht | "EXW Poznań" | ______ Fahrten mal ______ € | ______ |
| Einmalig | Fußnote 1 | Stanzform | 1.450 € |
| Lager | "20.000 Stück je Auftrag" | ______ | ______ |
| Skonto | "2 % Skonto" | ______ | ______ |
| **Summe** | | | **______** |

## Schritt 3: allein

Angebot C, `fall/angebot-c-brno.md`. Bring es allein auf die Basis, Zeile für Zeile, mit der Stelle, wo jede Zahl
steht. Dann beantworte die Frage für Brandtwerk in zwei Sätzen: Welches Angebot ist günstiger, und was fragst du den
Lieferanten vor der Unterschrift?

Zum Schluss: C hat einen Papierzuschlag. Ab welchem Anstieg des Papierindex verliert C den ersten Platz?

## Schritt 4: Claude prüfen, allein

Gib Claude `take-home/prompt.md` und den Ordner `fall/`. Leg seine Tabelle neben deine: Steht zu jeder Zahl eine
Stelle? Hat Claude geschätzt statt gefragt? Lass `kosten-intern.md` einmal weg: Fragt Claude nach der Fracht?

## Zusatz: ein zweiter Fall

`fall/zweiter-fall.csv`: Schutzhandschuhe für die Montage, zwei Angebote, schon auf die Basis gebracht. Welches
kostet im Jahr weniger, und welche Zeile entscheidet?
