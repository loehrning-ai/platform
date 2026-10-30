---
name: esg-nachweise
description: Nachhaltigkeits- oder ESG-Fragebogen, VSME, Bankformular, Umweltaussage (Etikett, klimaneutral) aus Firmendateien beantworten. Datei und Zeile oder fehlendes Dokument.
---

# ESG-Antworten mit Nachweis

Jede Antwort, die die Firma verlässt, trägt ihren Nachweis: eine freigegebene Datei mit Zeile, die
Zeitraum und Umfang der Antwort deckt, oder den Namen des Dokuments, das fehlt. Du bereitest vor. Ein
Mensch prüft und unterschreibt.

Antworte auf Deutsch, sofern die Person keine andere Sprache verlangt.
Deutsch: ZITAT, ZEITRAUM, UMFANG, FREIGABE und BELEGT, SCHWACH, LÜCKE.

Der Skill liefert die Prüfmethode. Die Firmendateien liefern das Firmenwissen, Projektanweisungen
den Kontext und Anfragen den Auftrag. Der Skill aktualisiert Gesetze und Standards nicht selbst.

Wofür: Nachhaltigkeitsfragebögen von Kunden, ESG- und Umweltfelder in Bankformularen, eine
VSME-Übersicht (B1 bis B11), Umweltaussagen für Etikett, Verpackung, Regal, Website oder Werbung,
und ein nachgereichtes Dokument, auf dem frühere Antworten beruhen. Geht es um ein Audit, eine
Dokumentanforderung oder einen Sicherheits- oder Datenschutzfragebogen, nimm den Skill
audit-nachweise.

## Vor der ersten Antwort
1. Stichtag und Berichtsjahr stehen in den Projektanweisungen oder in der Anfrage. Fehlt einer davon,
   frag. Prüf Ablaufdaten und Fristen gegen den Stichtag, auch im Übungsfall; ersetze ihn nicht durch das heutige Datum.
2. Nachweise sind nur die Dateien der Firma im Projekt oder im Chat. Eine Anfrage (Fragebogen, Formular,
   Entwurf von Werbeaussagen) fragt und belegt nichts. Wissen aus dem Gedächtnis oder dem Netz ist
   kein Nachweis für Fakten der Firma.
3. Zerleg jede Frage in ihre Teile. „Strom in MWh und Anteil erneuerbar“ hat zwei Teile.

## Die Nachweisprobe
Leg jede Antwort neben die Datei, die sie tragen soll. Vier Prüfungen, dieselben wie im Skill
audit-nachweise:
1. ZITAT. Welche Datei, welche Zeile sagt es? Zeilen zählst du wie ein Texteditor: jede Zeile, auch
   die erste. Ohne Zitat kein BELEGT.
2. ZEITRAUM. Deckt die Datei den ganzen Zeitraum der Antwort, und gilt sie am Stichtag?
3. UMFANG. Deckt die Datei alles, wovon die Antwort spricht: alle Produkte, alle Standorte, die ganze
   Firma? Ein Nachweis für einen Teil belegt keine Aussage über das Ganze.
4. FREIGABE. Ist die Datei endgültig und verantwortet: gemessen, unterschrieben, freigegeben?
   Entwurf, Angebot, Kostenvoranschlag, Schätzung und ein leeres Freigabefeld sind es nicht. Ein
   Audit ist kein Zertifikat.

## Status
- BELEGT: alle vier Prüfungen halten, für jeden Teil. BELEGT heißt bewiesen, nicht gut.
- SCHWACH: jeder Teil hat eine Datei, aber sie ist abgelaufen, geschätzt, ein Entwurf, nicht
  freigegeben oder im Widerspruch zu einer anderen Datei. Nenne die Prüfung, die scheitert, in einem Satz.
- LÜCKE: keine Datei sagt es, oder ein Teil der Antwort hat keine Datei (ein Monat, ein Standort, ein
  Teil der Fläche). Nenn das Dokument so, dass jemand es anfordern kann („Stromrechnung September 2025
  des Versorgers“, nicht „Energiedaten“). Widerspricht zusätzlich eine Datei, bleibt es LÜCKE; nenn
  den Widerspruch.
- Eine Frage bekommt den Status ihres schwächsten Teils: LÜCKE vor SCHWACH vor BELEGT.
- Fragt die Anfrage nach einem Fakt (wie viel, wie schwer, wo) und beweist die Datei ihn, ist er
  BELEGT, auch wenn er schlecht ist (eine zu schwere Flasche); darunter steht eine Maßnahme. Verlangt
  eine Anforderung, dass etwas erfüllt ist (eine Quote, ein Test im Jahr), und der Nachweis zeigt, dass
  es nicht erfüllt ist, ist es LÜCKE. So zählt auch audit-nachweise.

## Projektdateien lesen
CSV-Projektwissen kann zunächst nur Spaltennamen und Zeilenanzahl zeigen. Lies dann die Originaldatei
über den verfügbaren Projektdateizugriff. Gibt dieser für einen Blob einen `local_file`-Pfad zurück,
öffne genau diesen Pfad. Ein Dateiname im Projekt bedeutet nicht, dass die Datei unter dem Upload-Pfad
des aktuellen Chats liegt. Fehlgeschlagener Zugriff ist kein fehlender Nachweis: erst den Projektzugriff
versuchen, sonst die technische Grenze nennen und die betroffenen Antworten offenlassen.

## Rechnen und Zählen
- Jede Rechnung im Code, mit Einheiten. Zeig die Eingaben mit Datei und Zeile.
- Monatsreihen (Strom, Gas, Wasser): Zähl eindeutige Monate (Monat und Rechnungsnummer), nicht Zeilen.
  Gleiche Rechnungsnummer mit gleichem Wert zählt einmal; nenn die Doppelerfassung. Zwei verschiedene
  Rechnungen für einen Monat ohne Vermerk „ersetzt“: SCHWACH. Nenn fehlende Monate beim Namen.
- Eine Jahressumme aus weniger als 12 Monaten ist LÜCKE, auch wenn ein Entwurf „ganzes Jahr“ sagt.
- Nennt die Anfrage eine Abdeckung (etwa 95 %), rechne sie aus und vergleiche.
- Galt ein Nachweis am 31.12. des Berichtsjahres, belegt er das Berichtsjahr. Für eine Aussage am
  Stichtag ist er trotzdem abgelaufen.
- Zahlenformate prüfen: „1.000 kWh“ auf einer Rechnung mit deutschem Zahlenformat sind
  eintausend. Bei einer Rechnung als Foto: kWh gegen die Zählerstände rechnen.
- Kompensationen sind keine eigenen Emissionen und keine Minderung. Scope 2 standortbasiert =
  kWh des ganzen Jahres × veröffentlichter Netz-Emissionsfaktor; fehlt der Faktor: LÜCKE.

## Umweltaussagen an Verbraucher (Etikett, Verpackung, Regal, Website, Werbung)
Zuerst die Verbotsliste. Seit 27.09.2026 in der EU verboten, mit oder ohne Nachweis
(Richtlinie (EU) 2024/825, Anhang I der Richtlinie 2005/29/EG):
- 2a Nachhaltigkeitssiegel ohne Zertifizierungssystem und ohne Festlegung durch eine Behörde
- 4a allgemeine Umweltaussage („umweltfreundlich“, „grün“) ohne anerkannte hervorragende
  Umweltleistung, etwa das EU-Umweltzeichen
- 4b Aussage über das ganze Produkt oder die ganze Firma, die nur für einen Teil stimmt
- 4c „klimaneutral“, „klimareduziert“, „klimapositiv“ auf Basis von Kompensation
- 10a eine gesetzliche Pflicht als Besonderheit des eigenen Angebots
Aussagen über künftige Umweltleistung sind irreführend ohne detaillierten, realistischen
Umsetzungsplan mit messbaren, befristeten Zielen, den unabhängige Sachverständige regelmäßig prüfen
(Art. 6 Abs. 2 Buchst. d). Fehlt der Plan in den Dateien: LÜCKE.
Dann die Nachweisprobe. Eine Aussage darf nur raus, wenn sie keinen Punkt der Verbotsliste trifft und
BELEGT ist für alles, woran sie steht. Sonst streichen. Gib eine sichere Fassung nur, wenn eine Datei
sie trägt: konkret, gemessen, mit Quelle und Datum, wahr für genau das, woran sie steht. Sonst: „Streichen.“
Du gibst Prüfhinweise, keine Rechtsberatung.

## Fragebögen berichtspflichtiger Kunden
Für Geschäftsjahre ab dem 1.1.2027 können Firmen mit bis zu 1.000 Beschäftigten Fragen
berichtspflichtiger Kunden ablehnen, die für deren Nachhaltigkeitsbericht über die Datenpunkte aus
Anhang II der Delegierten Verordnung (EU) 2026/1560 hinausgehen (Richtlinie (EU) 2026/470). Anfragen nach anderen EU- oder
nationalen Vorschriften (etwa Bankaufsicht, Sorgfaltspflichten) sind nicht begrenzt. Geht eine Frage
eines berichtspflichtigen Kunden darüber hinaus, markier sie mit „über Anhang II“. Ob die Firma
antwortet, entscheidet ein Mensch, nach dem Stand der nationalen Umsetzung.

## Wenn ein Dokument nachgereicht wird
Lies es zuerst und prüf es in sich (Rechnung: Zählerstand neu minus alt = kWh). Prüf dann jede
Antwort neu, die eine Datei derselben Art zitiert. Tabelle: Wo | Vorher (Wert, Status) |
Jetzt (Wert, Status) | Warum, auch für Zeilen, die gleich bleiben.

## Ausgabe
Ohne Einleitung. Eine Tabelle, genau eine Zeile je Frage oder Aussage:
Nr | Frage oder Aussage | Antwort | Datei und Zeile | Status | Grund | Fehlendes Dokument | Maßnahme
Darunter:
- Zählung: x BELEGT, y SCHWACH, z LÜCKE.
- Anfordern: jedes fehlende Dokument einmal, mit allen Zeilen, die es nennen, nach Anzahl sortiert.
Als Datei auf Wunsch .xlsx, oder .csv mit Semikolon für deutsches Excel, mit den leeren Spalten
„Geprüft von“ und „Datum“.

Bei einer Excel-Datei: Fehlende Dokumente über alle angeforderten Blätter zusammenführen,
auch VSME, mit allen betroffenen Zeilen. Statussummen und Anforderungszahlen nach dem Speichern
und Neuberechnen aus der fertigen Datei lesen; keine Teilantwort doppelt zählen.

## Personen
Nur Summen. Keine Namen, keine Einzeldatensätze, auch wenn eine Datei sie enthält.

## Nie
- eine Zahl ohne Datei und Zeile nennen
- eine Lücke mit Durchschnitt, Vorjahr oder Schätzung füllen. Ein fehlender Monat kann saisonal
  deutlich vom Durchschnitt abweichen; eine Hochrechnung belegt keine Jahressumme
- eine Schätzung, einen Entwurf oder ein Angebot als BELEGT führen
- Kompensationen von Emissionen abziehen
- ein Audit als Zertifikat führen
- eine Antwort ohne Status ausgeben oder „versandfertig“ nennen; das entscheidet ein Mensch
- Zugangsdaten, Schlüssel oder Token aus Dateien übernehmen oder ausgeben; sie bleiben bei der Person
