---
title: "KI-Inventarliste (AI System Register)"
slug: "ki-inventarliste"
category: "hygiene"
pflicht: false
articleRefs:
  - "Art. 26 EU AI Act"
  - "Art. 30 DSGVO (Verzeichnis von Verarbeitungstätigkeiten)"
pages: 6
jobToBeDone: "Wo führe ich Buch über alle KI-Systeme im Haus? CSV-Vorlage mit allen Pflicht-Spalten plus 4 Beispiel-Einträgen."
audience:
  - "Alle, die KI-Systeme betreiben"
estReadMinutes: 10
estCompleteMinutes: 240
relatedSlugs:
  - "risikoklassifizierung"
  - "ki-anbieter-due-diligence"
  - "ki-nutzungsrichtlinie"
editorNotes:
  - "Discovery vor Eintragung: 80 Prozent der KI-Systeme im Mittelstand sind versteckt in SaaS-Modulen (Personio, HubSpot, Microsoft 365). Erst suchen, dann eintragen."
  - "Spalte 'Risikoklasse' MUSS auf der Risikoklassifizierungs-Vorlage basieren, sonst wird das Register juristisch wertlos"
  - "Re-Inventur mindestens halbjährlich. SaaS-Anbieter führen still neue KI-Funktionen ein"
  - "DSGVO-Art.-30-Verzeichnis ergänzen, nicht ersetzen, beide müssen synchron gehalten werden"
sources:
  - title: "EU AI Act Art. 26. Pflichten der Betreiber (EUR-Lex)"
    url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689#article-26"
  - title: "Art. 30 DSGVO: Verzeichnis von Verarbeitungstätigkeiten"
    url: "https://dsgvo-gesetz.de/art-30-dsgvo/"
lastReviewed: "2026-05-03"
reviewCadence: "legal"
nextReview: "2026-12-22"
owner: "tim@loehrning.ai"
riskClass: "legal"
triggerEvents:
  - "eu-ai-act-amendment"
---

# KI-Inventarliste (AI System Register)

Jede Organisation, die KI-Systeme betreibt, braucht eine Übersicht darüber. Diese Vorlage ist das Grundregister: wer nutzt was, zu welchem Zweck, mit welchem Risikoprofil.

> **Zweck:** Vollständiges Verzeichnis aller eingesetzten KI-Systeme. Grundlage für jede Risikoklassifizierung, jede DSFA, jeden Audit. Ohne Register keine belastbare Compliance.
>
> **Format:** Diese Vorlage liefert die Spaltenstruktur als Markdown-Tabelle. Die parallele CSV-Variante (`ki-inventarliste.csv`) öffnet sich direkt in Excel oder Numbers. Tragen Sie pro Zeile genau ein KI-System ein.

---

## 1. Vor der Inventur: Discovery

**Häufigster Fehler:** Geschäftsführung sagt "Wir haben keine KI", weil sie an ChatGPT denkt. Tatsächlich liegen 5-15 KI-Module versteckt in SaaS-Tools.

### Discovery-Kanäle

| Kanal | Was suchen Sie? |
|---|---|
| **SaaS-Verträge der Buchhaltung** | "AI Assist", "Copilot", "Smart Suggestions", "ML-based" - Marketing-Sprache der Anbieter |
| **HR-Systeme** | Bewerber-Screening, Anwesenheits-Scoring, Persönlichkeitstests |
| **Marketing-Stack** | Lead-Scoring, Audience-Segmentierung, Content-Generation |
| **CRM** | Predictive Sales, Next-Best-Action, Auto-Drafting |
| **Office-Suite** | Microsoft 365 Copilot, Google Workspace Duet AI, Notion AI |
| **Fachsoftware** | DATEV-Empfehlungen, ERP-Forecasts, Konstruktions-CAD-AI |
| **Schatten-IT** | Was nutzen Mitarbeiter ohne Freigabe? (Mitarbeiterumfrage, Browser-Telemetrie) |
| **Kundenkommunikation** | Chatbots auf der Webseite, Voicebots in der Telefonanlage |

### Department-Interviews

Vorlage-Fragen für eine 30-Minuten-Befragung pro Abteilungsleiter:

1. Welche Software nutzt Ihre Abteilung täglich? (Liste vom Einkauf vorlegen)
2. Welche dieser Tools haben automatische Empfehlungen, Vorschläge oder Klassifizierungen?
3. Wer in Ihrer Abteilung nutzt ChatGPT, Claude, Copilot oder ähnliches?
4. Geben Sie Daten an externe APIs weiter? Welche Daten?
5. Werden Entscheidungen über Personen (Kunden, Mitarbeiter) automatisiert vorbereitet?

---

## 2. Inventar-Spalten (Pflicht)

Jeder Eintrag enthält mindestens diese Felder:

| # | Spalte | Beispielwert | Pflicht-Quelle |
|---|---|---|---|
| 1 | System-ID | KI-001 | Intern |
| 2 | Bezeichnung | Personio AI Recruiting Module | - |
| 3 | Anbieter | Personio SE & Co. KG | - |
| 4 | Eingesetzt seit | 2024-09 | - |
| 5 | Verantwortlicher Fachbereich | HR | Art. 26 |
| 6 | Verantwortliche Rolle | Rolle Alpha (fiktiv), HR-Leitung | Art. 26 |
| 7 | Zweck (1 Satz) | Vorsortierung eingehender Bewerbungen nach Match-Score | - |
| 8 | Datenkategorien (Eingabe) | Bewerber-PII (Name, Lebenslauf, Anschreiben) | DSGVO Art. 30 |
| 9 | Datenkategorien (Ausgabe) | Match-Score 0-100, Empfehlung Ja/Nein | DSGVO Art. 30 |
| 10 | Risikoklasse (EU AI Act) | Hochrisiko (Annex III, Bereich 4) | Art. 6 |
| 11 | Annex-III-Bereich | 4: Beschäftigung | Art. 6 |
| 12 | FRIA erforderlich/durchgeführt? | Nur prüfen, wenn Art. 27 greift | Art. 27 |
| 13 | DSFA durchgeführt? | Ja, 2024-12-01 | DSGVO Art. 35 |
| 14 | Betriebsrat informiert? | Ja, BV vom 2024-11-20 | BetrVG § 87 |
| 15 | AV-Vertrag vorhanden? | Ja | DSGVO Art. 28 |
| 16 | Datenstandort | EU (Personio Hosting Frankfurt) | DSGVO |
| 17 | Trainingsdaten transparent? | Teilweise (Personio Aggregat-Modell) | Art. 13 |
| 18 | Menschliche Aufsicht | HR-Recruiter prüft Top-20 jeder Auswertung | Art. 14 |
| 19 | Letzte Bewertung | 2026-04-30 | - |
| 20 | Nächste Re-Bewertung | 2026-10-30 | - |
| 21 | Bemerkung | Personio plant Q3-Update. Re-Klassifizierung erforderlich | - |

---

## 3. Vier Beispiel-Einträge (mittelstandstypisch)

### Eintrag 1: KI-001 Personio AI Recruiting

```
System-ID:                KI-001
Bezeichnung:              Personio AI Recruiting Module
Anbieter:                 Personio SE & Co. KG
Eingesetzt seit:          2024-09
Fachbereich:              HR
Verantwortlich:           Rolle Alpha (fiktiv, HR-Leitung)
Zweck:                    CV-Vorsortierung nach Match-Score
Eingabedaten:             Bewerber-PII (Name, CV, Anschreiben)
Ausgabedaten:             Match-Score 0-100, Empfehlung
Risikoklasse:             Hochrisiko (Annex III, Bereich 4)
FRIA:                     Nur prüfen, wenn Art. 27 greift
DSFA:                     Ja, 2024-12-01
Betriebsrat:              Ja, BV vom 2024-11-20
AV-Vertrag:               Ja
Datenstandort:            EU
Aufsicht:                 HR-Recruiter prüft Top-20
Letzte Bewertung:         2026-04-30
Re-Bewertung:             2026-10-30
```

### Eintrag 2: KI-002 Microsoft 365 Copilot

```
System-ID:                KI-002
Bezeichnung:              Microsoft 365 Copilot (E3 Add-on)
Anbieter:                 Microsoft Ireland Operations Ltd.
Eingesetzt seit:          2025-02
Fachbereich:              Unternehmensweit
Verantwortlich:           Rolle Beta (fiktiv, IT-Leitung)
Zweck:                    Texterstellung, Zusammenfassungen, E-Mail-Drafts
Eingabedaten:             Office-Dokumente, E-Mails (intern)
Ausgabedaten:             Generierte Texte, Zusammenfassungen
Risikoklasse:             Minimales Risiko (kein Annex III)
FRIA:                     Nein (Art. 27 nicht einschlägig)
DSFA:                     Ja, 2025-01-30 (wegen E-Mail-Verarbeitung)
Betriebsrat:              Information am 2025-01-15
AV-Vertrag:               Ja (Microsoft DPA)
Datenstandort:            EU Data Boundary (seit 2024)
Aufsicht:                 Nutzer-Eigenverantwortung + Schulung
Letzte Bewertung:         2026-03-15
Re-Bewertung:             2026-09-15
```

### Eintrag 3: KI-003 Intercom Fin AI Chatbot

```
System-ID:                KI-003
Bezeichnung:              Intercom Fin (Customer Service Chatbot)
Anbieter:                 Intercom Inc., USA
Eingesetzt seit:          2025-04
Fachbereich:              Customer Service
Verantwortlich:           Rolle Gamma (fiktiv, CS-Leitung)
Zweck:                    First-Level-Support 24/7 auf Webseite
Eingabedaten:             Kundenfragen (Freitext), ggf. PII
Ausgabedaten:             Antworten, Eskalation an Mitarbeiter
Risikoklasse:             Begrenzt (Art. 50 Transparenzpflicht)
FRIA:                     Nein
DSFA:                     Ja, 2025-03-10
Betriebsrat:              Ja, BV vom 2025-03-20
AV-Vertrag:               Ja, EU-Standardvertragsklauseln
Datenstandort:            USA (US-Hosting bei Intercom)
Aufsicht:                 Eskalation auf Mitarbeiter ab Score < 0,7
Letzte Bewertung:         2026-04-01
Re-Bewertung:             2026-10-01
```

### Eintrag 4: KI-004 Schatten-IT (ChatGPT Plus, privat)

```
System-ID:                KI-004
Bezeichnung:              ChatGPT Plus (private Accounts, Schatten-IT)
Anbieter:                 OpenAI L.L.C., USA
Eingesetzt seit:          unbekannt (geschätzt 2024)
Fachbereich:              Marketing, Vertrieb (informell)
Verantwortlich:           Geschäftsführung (Maßnahmen erforderlich)
Zweck:                    Texterstellung, Recherche
Eingabedaten:             Unbekannt, vermutlich auch interne Daten
Ausgabedaten:             Generierte Texte
Risikoklasse:             Minimales Risiko (Tool); aber Compliance-Verstoß bei PII-Eingabe
FRIA:                     Nein
DSFA:                     Nein (kein AV-Vertrag möglich)
Betriebsrat:              Nicht eingebunden
AV-Vertrag:               Nicht möglich (Consumer-Account)
Datenstandort:            USA
Aufsicht:                 Keine
Letzte Bewertung:         2026-05-03 (Erstaufnahme)
Re-Bewertung:             SOFORT. Migration auf ChatGPT Business oder Sperrung
Bemerkung:                Maßnahmen-Plan: 1) Sperren via Browser-Filter,
                          2) Enterprise-Account einführen,
                          3) Schulung Stufe 1 für Marketing/Vertrieb
```

---

## 4. Spalten-Erweiterungen für Hochrisiko-Systeme

Für Hochrisiko-KI (Annex III) ergänzen Sie zusätzlich:

| Spalte | Beispielwert |
|---|---|
| Konformitätsbewertung des Anbieters? | Ja / Nein / N/A |
| CE-Kennzeichnung vorhanden? | Ja / Nein |
| EU-Konformitätserklärung erhalten? | Ja / Nein |
| Eintrag in EU-Datenbank? | Ja / Nein (gilt nur für Anbieter) |
| Trainingsdaten-Beschreibung erhalten? | Ja / Nein / Teilweise |
| Bias-Audit durchgeführt? | Datum |
| Monitoring-System aktiv? | Ja / Nein |
| Incident-Log existiert? | Ja / Nein |
| Aufbewahrungsfrist Logs | mind. 6 Monate |

---

## 5. Pflege-Rhythmus

| Aktivität | Frequenz | Verantwortlich |
|---|---|---|
| Neue KI-Tools eintragen | Bei jeder Beschaffung | KI-Beauftragter + Einkauf |
| Bestehende Einträge prüfen | Halbjährlich (Q1, Q3) | KI-Beauftragter |
| Risikoklassifizierungen aktualisieren | Bei wesentlichen Änderungen / jährlich | KI-Beauftragter |
| Discovery-Sweep (Schatten-IT) | Jährlich | IT + KI-Beauftragter |
| Synchronisation mit DSGVO-Verzeichnis (Art. 30) | Quartalsweise | DSB + KI-Beauftragter |

---

## 6. Audit-Vorbereitung

Wenn die Aufsichtsbehörde anklopft (z.B. BNetzA, Datenschutzbehörde), reicht das Inventar als Erstdokument. Halten Sie zusätzlich bereit:

- Diese Inventarliste in aktuellster Version
- Risikoklassifizierungs-Bögen (eine pro Hochrisiko-System)
- DSFA-Dokumente (eine pro relevantem System)
- Schulungsnachweise (Art. 4)
- KI-Nutzungsrichtlinie (aktuelle Version mit Freigabe-Daten)

---

## 7. Begleitende CSV-Datei

Die maschinenlesbare Version (`ki-inventarliste.csv`) enthält alle Spalten als Header und vier vollständige Beispielzeilen. Sie ist UTF-8 ohne BOM, getrennt durch Semikolon (`;`), kompatibel mit deutschem Excel ohne Konvertierung.

---

> **Hinweis:** Ein verlässliches KI-Inventar entsteht nur mit aktueller Tool-Erhebung, Rollenklärung und regelmäßiger Pflege. Diese Vorlage liefert die Struktur, ersetzt aber keine interne Bestandsaufnahme.
