# Reifegrad im Überblick: eine evidenzbasierte Selbstprüfung

Vergiss den Rang. Reifegrad sagt, welche Voraussetzungen für einen konkreten Use Case belegt sind und welche fehlen.

## Zwölf Prüffragen

Beantworte jede Frage mit **unbekannt**, **teilweise belegt** oder **belegt**. Verlinke den Nachweis und benenne eine verantwortliche Person.

### Zweck und Erfolg

1. Ist der Prozess mit Eingang, Ausgang und Folgehandlung dokumentiert?
2. Gibt es eine Ausgangsmessung und ein prüfbares Erfolgskriterium?
3. Stehen Fehlerarten, Fehlerkosten und Abbruchkriterien fest?

### Daten und Rechte

4. Sind Datenherkunft, Datenklasse, Rechtsgrundlage und erlaubte Nutzung geklärt?
5. Sind Zugriff, Aufbewahrung, Löschung und mögliche Transfers dokumentiert?
6. Ist geprüft, ob die Daten für den Zweck reichen und repräsentativ sind?

### Technik und Betrieb

7. Sind Systemversion, Anbieter, Integrationen und vollständiger Datenfluss bekannt?
8. Sind Identität, Rechte, Secrets, Updates, Logging, Backups und Wiederherstellung getestet?
9. Gibt es einen Exit- und Fallback-Pfad?

### Menschen und Governance

10. Sind fachliche Prüfung, menschliche Aufsicht und Eskalation mit echter Befugnis besetzt?
11. Sind Nutzer für Aufgabe, Systemgrenzen und Risiken qualifiziert?
12. Sind Rolle, Risikoklassifizierung und einschlägige rechtliche Pflichten begründet dokumentiert?

## Aus Antworten werden Maßnahmen

Aus diesen Antworten lässt sich keine objektive 0-bis-100-Wahrheit multiplizieren. Priorisiere stattdessen:

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

Die Zustände gelten pro Use Case, nicht pro Firma. Beim internen Schreibassistenten kann dein Betrieb betriebsfähig sein, bei automatisierter Bewerberauswahl nicht einmal inventarisiert.

## Was nicht als Nachweis reicht

- ein Anbieterlogo
- ein abgeschlossenes allgemeines KI-Training
- ein gelungener Prompt in der Vorführung
- ein DPA/AVV ohne Rollen- und Datenflussprüfung
- eine ISO-Zertifizierung ohne Zuordnung zum konkreten System
- eine Liste technischer Website-Signale

Reife zeigt sich in aktuellen, testbaren Kontrollen am realen Prozess.
