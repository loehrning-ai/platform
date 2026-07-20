# Reifegrad im Überblick: eine evidenzbasierte Selbstprüfung

Reifegrad ist kein Rang unter Unternehmen. Er beschreibt, welche Voraussetzungen für einen konkreten Use Case belegt sind und welche fehlen.

## Zwölf Prüffragen

Beantworte jede Frage mit **unbekannt**, **teilweise belegt** oder **belegt**. Verlinke den Nachweis und benenne eine verantwortliche Person.

### Zweck und Erfolg

1. Ist der konkrete Prozess mit Eingang, Ausgang und Folgehandlung dokumentiert?
2. Gibt es eine Ausgangsmessung und ein prüfbares Erfolgskriterium?
3. Sind Fehlerarten, Fehlerkosten und Abbruchkriterien festgelegt?

### Daten und Rechte

4. Sind Datenherkunft, Datenklasse, Rechtsgrundlage und erlaubte Nutzung geklärt?
5. Sind Zugriff, Aufbewahrung, Löschung und mögliche Transfers dokumentiert?
6. Ist geprüft, ob die Daten für den Zweck ausreichend und repräsentativ sind?

### Technik und Betrieb

7. Sind Systemversion, Anbieter, Integrationen und vollständiger Datenfluss bekannt?
8. Sind Identität, Rechte, Secrets, Updates, Logging, Backups und Wiederherstellung getestet?
9. Gibt es einen Exit- und Fallback-Pfad?

### Menschen und Governance

10. Sind fachliche Prüfung, menschliche Aufsicht und Eskalation mit echter Befugnis besetzt?
11. Sind Nutzer für Aufgabe, Systemgrenzen und Risiken angemessen qualifiziert?
12. Sind Rolle, Risikoklassifizierung und einschlägige rechtliche Pflichten begründet dokumentiert?

## Aus Antworten werden Maßnahmen

Keine Multiplikation erzeugt aus diesen Antworten eine objektive 0-bis-100-Wahrheit. Priorisiere stattdessen:

1. **Stopper:** ungeklärte Rechtsgrundlage, verbotene Daten, fehlende Freigabe, nicht beherrschbare Fehlerfolge
2. **Kontrolllücken:** fehlende Rechte, Aufsicht, Logs, Löschung, Wiederherstellung oder Eskalation
3. **Wirksamkeitslücken:** keine Ausgangsmessung, ungeeignete Testfälle, unklare Qualitätskriterien
4. **Optimierung:** Komfort, Geschwindigkeit oder Kosten nach bestandenen Schutz- und Wirksamkeitsgates

## Vier Arbeitszustände

| Zustand | Bedeutung | Nächster Schritt |
|---|---|---|
| Nicht inventarisiert | Systeme und Datenflüsse sind unvollständig | Inventur und Eigentümer festlegen |
| Inventarisiert | Zweck, Rolle und Datenfluss sind bekannt | Risiko- und Kontrollprüfung |
| Pilotfähig | Testdaten, Rubrik, Aufsicht und Stopkriterien stehen | begrenzten Pilot durchführen |
| Betriebsfähig | Kontrollen, Monitoring, Vorfälle, Fallback und Review sind getestet | überwachen und ereignisbasiert neu bewerten |

Diese Zustände gelten pro Use Case. Eine Organisation kann bei einem internen Schreibassistenten betriebsfähig und bei automatisierter Bewerberauswahl noch nicht inventarisiert sein.

## Was nicht als Nachweis reicht

- ein Anbieterlogo
- ein abgeschlossenes allgemeines KI-Training
- ein erfolgreicher Demo-Prompt
- ein DPA/AVV ohne Rollen- und Datenflussprüfung
- eine ISO-Zertifizierung ohne Zuordnung zum konkreten System
- eine Liste technischer Website-Signale

Reife zeigt sich in aktuellen, testbaren Kontrollen am realen Prozess.
