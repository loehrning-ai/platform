---
title: "Pilot-Charter (1-Seiter für KI-Projekte)"
slug: "pilot-charter"
category: "werkzeug"
pflicht: false
articleRefs: []
pages: 4
jobToBeDone: "Wie strukturiere ich einen KI-Pilot, der nicht im Sande verläuft? Hypothese, Erfolgskriterien, Datenquellen, Stakeholder, Exit-Bedingungen, auf einer Seite."
audience:
  - "Projektteams"
estReadMinutes: 7
estCompleteMinutes: 60
relatedSlugs:
  - "use-case-bewertungsmatrix"
  - "risikoklassifizierung"
editorNotes:
  - "Pflichtfeld 'Exit-Bedingungen' ist der wichtigste Abschnitt, ohne Exit-Definition wird kein Pilot je beendet"
  - "Sponsor MUSS unterschreiben, sonst kein Pilot. Verhindert verwaiste Initiativen"
  - "Erfolgs-/Misserfolgs-Kriterien VOR Pilot-Start fixieren, nicht nachträglich justieren"
  - "Bei Zwischenstand alle 2 Wochen 15-Minuten-Review mit Sponsor"
sources:
  - title: "Verordnung (EU) 2024/1689. KI-Verordnung"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
  - title: "EU AI Act Art. 26. Pflichten der Betreiber (EUR-Lex)"
    url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689#article-26"
lastReviewed: "2026-05-03"
reviewCadence: "legal"
nextReview: "2026-12-22"
owner: "tim@loehrning.ai"
riskClass: "legal"
triggerEvents:
  - "eu-ai-act-amendment"
---

# Pilot-Charter: KI-Projekt in einer Seite

Bevor ein KI-Projekt startet, braucht es einen klaren Rahmen. Diese Ein-Seiter-Vorlage fasst Ziel, Scope, Erfolgsmetrik und Review-Termin zusammen. Klein genug, dass alle unterschreiben.

> **Zweck:** Verbindliche Kurzbeschreibung eines KI-Pilot-Projekts. Verhindert die häufigsten Pilot-Pathologien: vage Hypothesen, fehlende Erfolgskriterien, kein Sponsor, kein Exit, keine Daten.
>
> **Anwendung:** Eine Charter pro Pilot. Vor dem Start unterschrieben von Sponsor, Pilot-Lead und betroffenem Datenschutz.

---

## 1. Stammdaten

| Feld | Eintrag |
|---|---|
| **Pilot-Titel** | _[Kurz und konkret, z. B. „Mail-Triage im Service-Postfach"]_ |
| **Pilot-ID** | _[z.B. PILOT-2026-Q3-007]_ |
| **Sponsor (Geschäftsführung oder Bereichsleitung)** | _[Name, Rolle]_ |
| **Pilot-Lead** | _[Name, Rolle]_ |
| **Pilot-Team (Kernrollen)** | _[Name + Rolle, max. 5]_ |
| **Start-Datum** | _[TT.MM.JJJJ]_ |
| **Enddatum (verbindlich)** | _[TT.MM.JJJJ, max. 12 Wochen]_ |
| **Budget** | _[EUR: Personenstunden + externe Kosten]_ |

---

## 2. Hypothese

> Eine einzige, prüfbare Aussage. Nicht: "Wir wollen KI testen". Sondern: "Wir glauben, dass [Zielgruppe] durch [Maßnahme] [Effekt] erreicht, messbar an [Metrik]."

| Feld | Eintrag |
|---|---|
| **Wir glauben, dass …** | _[Zielgruppe]_ |
| **… durch …** | _[Maßnahme: KI-Tool / Prozess]_ |
| **… erreichen wird:** | _[Effekt]_ |
| **Messbar an:** | _[Metrik mit Zielwert]_ |
| **In Zeitraum:** | _[Wochen]_ |

**Beispiel:**
> Wir glauben, dass das **Customer-Service-Team** durch **automatische Mail-Vorklassifizierung mit Microsoft Copilot** **die Bearbeitungszeit eingehender Anfragen um 30 Prozent reduziert**, messbar an der **durchschnittlichen Time-to-First-Response in HubSpot**, in **8 Wochen Pilot**.

---

## 3. Erfolgs- und Misserfolgs-Kriterien

| Kriterium | Erfolgs-Schwelle | Mess-Methode |
|---|---|---|
| **Primär (KO-Kriterium)** | _[z.B. Time-to-First-Response < 4 Std. (vorher 6 Std.)]_ | _[HubSpot-Report]_ |
| **Sekundär 1** | _[z.B. NPS bleibt stabil oder steigt]_ | _[Kundenumfrage Woche 4 und 8]_ |
| **Sekundär 2** | _[z.B. Kein DSGVO-Vorfall]_ | _[Audit-Log]_ |
| **Lerneffekt** | _[z.B. Pilot-Team kann Copilot eigenständig konfigurieren]_ | _[Self-Assessment Woche 8]_ |

**Misserfolgs-Definition (klar formulieren):**
- ☐ Primär-KPI verfehlt (< _[Schwelle]_) am Pilot-Ende
- ☐ Mehr als _[N]_ vermeidbare KI-Fehler in Pilot-Phase
- ☐ Nutzer-Akzeptanz < _[Prozent]_ in Wochen-4-Befragung
- ☐ Compliance-Vorfall (Datenschutz / EU AI Act)

---

## 4. Datenquellen und Tools

| Datenquelle | Eigentümer | Format | Anliefer-Datum |
|---|---|---|---|
| _[z.B. HubSpot Tickets letzte 12 Monate]_ | _[Marketing]_ | _[CSV-Export]_ | _[T-7]_ |
| _[z.B. Wissensdatenbank Confluence]_ | _[CS-Team]_ | _[API]_ | _[T-3]_ |

| Tool / KI-System | Anbieter | Lizenz vorhanden? | DSFA / DD abgeschlossen? |
|---|---|---|---|
| _[z.B. Microsoft Copilot]_ | _[Microsoft]_ | _[Ja, Enterprise]_ | _[Ja, am DD.MM.JJJJ]_ |

---

## 5. Stakeholder und Verantwortlichkeiten

| Rolle | Person | Verantwortung | Approval erforderlich? |
|---|---|---|---|
| Sponsor | _[Name]_ | Budget, Eskalation, Go/No-Go | Ja, vor Start und Ende |
| Pilot-Lead | _[Name]_ | Tagesführung, Reporting | - |
| Datenschutz | _[Name DSB]_ | DSFA, Rechtsgrundlage | Ja, vor Start |
| IT-Leitung | _[Name]_ | Tool-Bereitstellung, Sicherheit | Ja, vor Start |
| KI-Beauftragter | _[Name]_ | Risikoklassifizierung, Compliance | Ja, vor Start |
| Betriebsrat | _[Name]_ | Information / Mitbestimmung | Ja, falls Mitarbeiter betroffen |
| Fachbereich | _[Name]_ | Test-Nutzung, Feedback | - |

---

## 6. Zeitplan (8-12 Wochen)

| Woche | Meilenstein | Verantwortlich |
|---|---|---|
| -2 | Daten-Bereitstellung, Tool-Provisioning | IT, Datenowner |
| -1 | Schulung Pilot-Team, Baseline-Metriken erheben | Pilot-Lead |
| 0 | **Pilot-Start.** Kick-off mit Sponsor | Sponsor + Lead |
| 2 | Erstes Review: Daten fließen? Tool stabil? | Pilot-Lead |
| 4 | Zwischenstand: Erste KPI-Messung, Nutzer-Befragung | Lead + Sponsor |
| 6 | Risiko-Check: Sind Misserfolgs-Kriterien getriggert? | Lead + DSB |
| 8 | **Pilot-Ende.** Final-Review, Empfehlung | Lead + Sponsor |
| 9 | Dokumentation und Entscheidung: Skalierung / Iteration / Stopp | Sponsor |

---

## 7. Exit-Bedingungen (PFLICHT)

> **Der wichtigste Abschnitt.** Ohne Exit-Definition wird kein Pilot je beendet.

### Vorzeitiger Stopp wenn …
- ☐ Compliance-Vorfall (Datenschutz, EU AI Act, Betriebsrat-Beschwerde)
- ☐ Sicherheitsvorfall (Datenleck, unautorisierter Zugriff)
- ☐ Anbieter ändert wesentliche Vertragskonditionen
- ☐ Misserfolgs-Kriterien nach Woche 4 deutlich verfehlt (< 50 Prozent Zielwert)
- ☐ Nutzer-Akzeptanz unter _[Schwelle]_ und nicht steigend

### Übergang in Produktivbetrieb wenn …
- ☐ Primär-KPI erreicht oder übertroffen
- ☐ Mindestens 80 Prozent der Sekundär-KPIs erfüllt
- ☐ Compliance-Dokumentation vollständig (Risikoklassifizierung, DSFA, ggf. FRIA, wenn Art. 27 greift)
- ☐ Operationelles Modell definiert (Wer betreibt? Wer monitort? Wer eskaliert?)
- ☐ Sponsor-Freigabe und Budget für Skalierung

### Iteration wenn …
- ☐ Hypothese teilweise bestätigt, Anpassungen sinnvoll
- ☐ Klare Lerneffekte für nächste Iteration definierbar
- ☐ Sponsor und Pilot-Team stimmen zu, max. 1 Iteration

---

## 8. Risiken und Annahmen

### Top-3-Risiken

| Risiko | Eintrittswahrscheinlichkeit | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| _[z.B. Datenqualität niedriger als erwartet]_ | _[hoch / mittel / niedrig]_ | _[hoch / mittel / niedrig]_ | _[z.B. Daten-Bereinigung in Woche -1]_ |
| _[z.B. Nutzer-Akzeptanz niedrig]_ | | | _[z.B. Schulung + 1:1-Begleitung erste 2 Wochen]_ |
| _[z.B. Modell halluziniert in Edge-Cases]_ | | | _[z.B. Eskalations-Workflow für Niedrig-Score-Outputs]_ |

### Annahmen, die geprüft werden müssen
- _[z.B. Anbieter-Verfügbarkeit > 99 Prozent]_
- _[z.B. Wissensdatenbank ist aktuell]_
- _[z.B. Pilot-Team hat 8 Stunden / Woche frei]_

---

## 9. Freigabe

| Rolle | Name | Datum | Unterschrift |
|---|---|---|---|
| Sponsor | | | |
| Pilot-Lead | | | |
| Datenschutzbeauftragter | | | |
| KI-Beauftragter | | | |
| Betriebsrat (zur Kenntnis) | | | |

---

## 10. Pilot-Abschluss-Notiz (am Ende ausfüllen)

| Feld | Eintrag |
|---|---|
| Pilot-Endedatum | _[Datum]_ |
| Tatsächlicher Aufwand | _[Personenstunden + externe Kosten]_ |
| Primär-KPI erreicht? | ☐ Ja ☐ Teilweise ☐ Nein |
| Empfehlung | ☐ Skalieren ☐ Iterieren ☐ Stoppen |
| Begründung (max. 5 Zeilen) | _[ ]_ |
| Wesentliche Lerneffekte | _[ ]_ |
| Folge-Pilot vorgeschlagen? | _[Titel + Hypothese]_ |

---

> **Hinweis:** Diese Vorlage ist ein Ausgangspunkt für interne Pilot-Charter. Ergänzen Sie Daten-Set-up, Verantwortlichkeiten, Abbruchkriterien und Skalierungslogik passend zu Ihrer Organisation.
