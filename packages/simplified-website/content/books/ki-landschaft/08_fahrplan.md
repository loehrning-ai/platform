# Fahrplan: von der Inventur zum kontrollierten Betrieb

Ein Fahrplan beschreibt Gates und Verantwortlichkeiten. Er verspricht weder drei produktive Systeme nach einem Jahr noch feste Kosten oder Renditen.

## Horizont 1: Inventur und Auswahl

**Ergebnis:** ein priorisierter Use Case mit belegter Ausgangslage.

- Systeme, Funktionen und Schattennutzung erfassen
- Prozess, Nutzer, Betroffene und Folgehandlungen dokumentieren
- Datenfluss, Rollen und Parallelrecht prüfen
- Ausgangsqualität, Volumen und Kosten messen
- einen kleinen, reversiblen Use Case auswählen
- Schutz-, Qualitäts- und Abbruchkriterien definieren

Kein fester 30-Tage-Zeitraum passt zu jeder Organisation. Der Horizont endet, wenn die Nachweise vorliegen.

## Horizont 2: Lernpilot

**Ergebnis:** reproduzierbare Testdaten und ein dokumentierter Entscheid.

- synthetische und angemessen freigegebene Testfälle verwenden
- Systemversion, Einstellungen und Prompts versionieren
- Output gegen eine vorab definierte Rubrik prüfen
- menschliche Aufsicht und Eskalation testen
- Sicherheit, Logs, Löschung, Backup und Fallback prüfen
- mit eigener Ausgangslage vergleichen

Ein Pilot ist nicht produktiv, nur weil echte Software läuft. Produktionsdaten und reale Folgehandlungen brauchen eine separate Freigabe.

## Horizont 3: Begrenzter Betrieb

**Ergebnis:** ein kontrollierter Use Case mit Eigentümer und Monitoring.

- Nutzer und Datenumfang begrenzen
- Rollen und Rechte nach dem Minimalprinzip vergeben
- Qualität und Vorfälle laufend messen
- Modell-, Anbieter-, Zweck- und Datenänderungen als Review-Auslöser behandeln
- Support, Vertretung, Wiederherstellung und Exit testen
- Art.-4-Maßnahmen an Rollen und Risiken anpassen

## Build, Buy oder bestehende Plattform

Keine feste Prozentregel entscheidet diese Frage.

| Kriterium | Bestehender Dienst | Konfigurierbare Plattform | Eigenentwicklung |
|---|---|---|---|
| Differenzierung | gering bis mittel | mittel | potenziell hoch |
| Betriebslast | teilweise beim Anbieter | geteilt | weitgehend intern |
| Kontrolle | vertrags- und konfigurationsabhängig | höher, aber komplexer | hoch, mit voller Verantwortung |
| Wechselkosten | Export und Lock-in prüfen | Architekturabhängig | interner Wartungs- und Wissensbedarf |

Bewerte Gesamtbetrieb, Sicherheit, Datenfluss, Integrationen, Exit, Kompetenzbedarf und langfristige Wartung. Listenpreis und Demo-Geschwindigkeit reichen nicht.

## Beschaffungsgate

Vor Vertrag oder Verlängerung:

1. vorgesehener Zweck und Leistungsgrenzen
2. Rollen, Vertragsbedingungen und Datenverarbeitung
3. Sicherheitsnachweise, Identität und Zugriff
4. System- und Modellupdates
5. Logs, Monitoring und Vorfallkooperation
6. Export, Löschung und Exit
7. Kostenmodell unter realistischem Volumen
8. fachliche Abnahme und Support

## Kennzahlen aus dem Use Case ableiten

Mögliche Kennzahlen:

- Faktentreue und Vollständigkeit
- Korrektur- und Verwerfungsquote
- Durchlauf- und Prüfzeit
- Kosten pro geprüftem Ergebnis
- Anzahl und Schwere von Vorfällen
- Verfügbarkeit und Wiederherstellungszeit
- Anteil geschulter und tatsächlich befähigter Nutzer

Keine universellen Zielwerte wie „80 Prozent Nutzung“ oder „150 Prozent ROI“. Ziele folgen Risiko, Ausgangslage und Prozesswert.

## Förderung nur aus aktuellem Bescheid planen

Programme, Fördersätze und Bedingungen ändern sich. Nutze die [Förderdatenbank des Bundes](https://www.foerderdatenbank.de/), zuständige Landesförderbanken und die offiziellen Programmseiten. Prüfe insbesondere, ob ein Antrag vor Maßnahmenbeginn erforderlich ist. Plane keinen Business Case mit einem Zuschuss, bevor Anspruch und Bewilligung belastbar geklärt sind.

## Skalierungsgate

Erweitere erst, wenn:

- Qualitäts- und Schutzkriterien über repräsentative Fälle bestanden sind
- Fachverantwortung und Betriebskapazität vorhanden sind
- neue Nutzer, Daten und Integrationen erneut bewertet wurden
- Monitoring, Vorfallweg, Fallback und Exit funktionieren
- wirtschaftlicher Nutzen mit realen Daten belegt ist

Skalierung vervielfacht auch Fehler. Das Gate verhindert, dass ein guter Demo-Output zur unkontrollierten Infrastruktur wird.
