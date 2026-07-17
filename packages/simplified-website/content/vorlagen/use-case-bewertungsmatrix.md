---
title: "Use-Case-Bewertungsmatrix (KI-Projekt-Priorisierung)"
slug: "use-case-bewertungsmatrix"
category: "werkzeug"
pflicht: false
articleRefs: []
pages: 5
jobToBeDone: "Welche der 12 KI-Pilot-Ideen sollen wir bauen? 8-Kriterien-Score (Risk × Impact × Feasibility) mit gewichteter Bewertung in unter 30 Minuten pro Use-Case."
audience:
  - "Alle mit einer KI-Idee"
estReadMinutes: 8
estCompleteMinutes: 30
relatedSlugs:
  - "pilot-charter"
  - "risikoklassifizierung"
editorNotes:
  - "Workshop-Format empfohlen: 6-10 Stakeholder, ein Use-Case pro 30-Minuten-Slot"
  - "Konsens auf den Score, nicht auf jede Einzelantwort. Diskussion ist der eigentliche Wert"
  - "Top-3 nach Score in Pilot-Charter überführen (verwandte Vorlage)"
  - "Quartalsweise neu priorisieren. Kontext und Daten ändern sich"
sources:
  - title: "Verordnung (EU) 2024/1689. KI-Verordnung"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
  - title: "EU AI Act Art. 6. Klassifizierungsregeln (EUR-Lex)"
    url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689#article-6"
lastReviewed: "2026-05-03"
reviewCadence: "legal"
nextReview: "2026-12-22"
owner: "tim@loehrning.ai"
riskClass: "legal"
triggerEvents:
  - "eu-ai-act-amendment"
---

# Use-Case-Bewertungsmatrix für KI-Projekte

Sie haben eine KI-Idee. Diese Matrix hilft Ihnen, sie strukturiert zu bewerten: Nutzen gegen Risiko, bevor Sie Ressourcen investieren.

> **Zweck:** Strukturierte Priorisierung mehrerer KI-Use-Cases nach Wirkung, Risiko und Umsetzbarkeit. Liefert eine objektive Reihenfolge in unter 30 Minuten pro Use-Case.
>
> **Einsatz:** Workshop mit Entscheidenden, IT, Datenschutz und Projektteam. Idealer Trigger nach einer Ideen-Sammlung mit 5-15 Vorschlägen.

---

## 1. Use-Case-Beschreibung (eine Seite pro Use-Case)

| Feld | Eintrag |
|---|---|
| **Use-Case-Name** | _[z.B. "Auto-Klassifikation eingehender Mails an Service"]_ |
| **Kurzbeschreibung (max. 3 Sätze)** | _[Was passiert? Wer profitiert? Was ändert sich?]_ |
| **Antragsteller / Sponsor** | _[Name, Bereich]_ |
| **Beteiligte Bereiche** | _[Liste]_ |
| **Geplanter Start** | _[Quartal]_ |
| **Geschätzte Dauer Pilot** | _[Wochen]_ |

---

## 2. Bewertungskriterien (8 Dimensionen)

Jedes Kriterium wird auf einer Skala von **1-5** bewertet. Die Skalen sind unten definiert.

### Dimension A: Geschäftsnutzen (Gewicht 30 Prozent)

#### A1. Direkter wirtschaftlicher Effekt (Skala 1-5)
Wie hoch ist die jährliche Einsparung oder der zusätzliche Umsatz?

| Score | Bedeutung |
|---|---|
| 1 | < 10.000 EUR p.a. |
| 2 | 10.000-50.000 EUR p.a. |
| 3 | 50.000-150.000 EUR p.a. |
| 4 | 150.000-500.000 EUR p.a. |
| 5 | > 500.000 EUR p.a. |

#### A2. Strategische Bedeutung (Skala 1-5)
Wie sehr stützt der Use-Case die Unternehmensstrategie der nächsten 3 Jahre?

| Score | Bedeutung |
|---|---|
| 1 | Nice-to-have, kein Strategiebezug |
| 2 | Sekundär, unterstützend |
| 3 | Wichtig für ein Strategieziel |
| 4 | Zentrale Voraussetzung für ein Strategieziel |
| 5 | Strategischer Hebel für mehrere Ziele |

### Dimension B: Umsetzbarkeit (Gewicht 30 Prozent)

#### B1. Datenverfügbarkeit (Skala 1-5)
Wie gut sind die benötigten Daten verfügbar und nutzbar?

| Score | Bedeutung |
|---|---|
| 1 | Daten existieren nicht oder müssen neu erhoben werden |
| 2 | Daten verstreut, manuell konsolidierbar |
| 3 | Daten vorhanden, Bereinigung erforderlich |
| 4 | Daten sauber, in einem System |
| 5 | Daten in Prod-Qualität, API verfügbar |

#### B2. Technische Komplexität (Skala 1-5, INVERS)
Wie aufwändig ist die technische Umsetzung? (Niedriger Aufwand = hoher Score)

| Score | Bedeutung |
|---|---|
| 1 | Sehr komplex (eigenes Modell, Custom Pipeline, > 6 Monate) |
| 2 | Komplex (Foundation Model + Fine-Tuning + Integration) |
| 3 | Mittel (Foundation Model + Prompt Engineering + Integration) |
| 4 | Einfach (Standard-SaaS mit Konfiguration) |
| 5 | Trivial (vorhandenes Tool, nur Aktivierung) |

### Dimension C: Risiko (Gewicht 25 Prozent)

#### C1. EU-AI-Act-Risiko (Skala 1-5, INVERS)
Welche Risikoklasse hat der Use-Case? (Niedriges Risiko = hoher Score)

| Score | Bedeutung |
|---|---|
| 1 | Verboten oder unklar (Art. 5) |
| 2 | Hochrisiko (Annex III) |
| 3 | Begrenztes Risiko mit Transparenzpflicht (Art. 50) |
| 4 | Minimales Risiko, GPAI-Nutzung |
| 5 | Minimales Risiko, kein PII, kein GPAI |

#### C2. Datenschutz-Risiko (Skala 1-5, INVERS)
Welche personenbezogenen Daten sind betroffen?

| Score | Bedeutung |
|---|---|
| 1 | Besondere Kategorien (Art. 9) im großen Umfang |
| 2 | Standardmäßige PII (Kunden, Mitarbeiter) im großen Umfang |
| 3 | PII begrenzt, AV-Vertrag erforderlich |
| 4 | Pseudonymisierte Daten, keine direkte PII |
| 5 | Keine PII, nur Geschäftsdaten |

### Dimension D: Reversibilität und Lerneffekt (Gewicht 15 Prozent)

#### D1. Reversibilität (Skala 1-5)
Wie einfach lässt sich der Use-Case zurückrollen?

| Score | Bedeutung |
|---|---|
| 1 | Irreversibel (Vertragsbindung > 36 Mo., Datenmigration kostspielig) |
| 2 | Schwer reversibel (Vertrag 12-36 Mo., Daten-Lock-in) |
| 3 | Mit Aufwand reversibel (Migration in 1-3 Monaten) |
| 4 | Leicht reversibel (Pilot-Modus, kurze Verträge) |
| 5 | Trivial reversibel (Kündigung monatlich) |

#### D2. Lerneffekt für die Organisation (Skala 1-5)
Wie viel Wissen entsteht im Unternehmen durch diesen Use-Case?

| Score | Bedeutung |
|---|---|
| 1 | Black-Box-Tool, kein Lerneffekt |
| 2 | Anwendungswissen, kein technisches Verständnis |
| 3 | Anwendungs- und Integrations-Wissen |
| 4 | Architektur-Wissen, Daten-Pipelines |
| 5 | Vollständiges KI-Stack-Verständnis (Daten + Modell + Betrieb) |

---

## 3. Score-Berechnung

| Kriterium | Score (1-5) | Gewicht | Gewichtet |
|---|---|---|---|
| A1. Wirtschaftlicher Effekt | _[ ]_ | 0,15 | _[ ]_ |
| A2. Strategische Bedeutung | _[ ]_ | 0,15 | _[ ]_ |
| B1. Datenverfügbarkeit | _[ ]_ | 0,15 | _[ ]_ |
| B2. Technische Komplexität | _[ ]_ | 0,15 | _[ ]_ |
| C1. EU-AI-Act-Risiko | _[ ]_ | 0,15 | _[ ]_ |
| C2. Datenschutz-Risiko | _[ ]_ | 0,10 | _[ ]_ |
| D1. Reversibilität | _[ ]_ | 0,10 | _[ ]_ |
| D2. Lerneffekt | _[ ]_ | 0,05 | _[ ]_ |
| **Gesamt-Score** | | | **_[Σ]_** |

### Score-Interpretation

| Score | Empfehlung |
|---|---|
| 4,0-5,0 | **Top-Pilot.** Sofort in Pilot-Charter überführen. |
| 3,0-3,9 | **Pilot prüfen.** Nach Top-Piloten ansetzen. |
| 2,0-2,9 | **Reserve.** Periodisch neu bewerten. |
| < 2,0 | **Verwerfen oder grundsätzlich neu denken.** |

### Veto-Kriterien (unabhängig vom Score)

| Veto | Wirkung |
|---|---|
| C1 = 1 (verboten / unklar) | **No-Go.** Rechtsberatung erforderlich. |
| C2 = 1 (besondere Kategorien) und keine DSFA möglich | **No-Go** bis Rechtsgrundlage geklärt. |
| Keine Datengrundlage und keine Beschaffungs-Roadmap | **Pause** bis Daten-Strategie steht. |

---

## 4. Workshop-Anleitung

### Vorbereitung (1 Stunde)
- Use-Case-Briefings (3-5 Sätze pro Use-Case) an alle Teilnehmer
- Skalen-Definitionen ausgedruckt (Abschnitt 2)
- Whiteboard / digitales Board mit Score-Tabelle vorbereiten

### Durchführung (30 Minuten pro Use-Case)
1. Use-Case-Sponsor präsentiert Use-Case (5 Min)
2. Klärungsfragen (5 Min)
3. Stille Bewertung pro Kriterium (5 Min), jeder schreibt eigene Scores
4. Diskussion bei Abweichungen > 2 Punkten (10 Min)
5. Konsens-Score eintragen (5 Min)

### Nachbereitung
- Top-3 nach Score in Pilot-Charter überführen
- Top 4-6 zur Re-Bewertung in 3 Monaten parken
- Schlechte Scores dokumentieren mit Begründung (für künftige Re-Evaluation)

---

## 5. Beispiel: fiktiver Use-Case-Vergleich (typische Mittelstandsszenarien)

| Use-Case | A1 | A2 | B1 | B2 | C1 | C2 | D1 | D2 | Score |
|---|---|---|---|---|---|---|---|---|---|
| Mail-Triage Service-Postfach | 3 | 3 | 4 | 4 | 4 | 3 | 5 | 3 | **3,55** |
| Bewerber-Vorsortierung | 4 | 3 | 4 | 4 | 2 | 2 | 3 | 3 | **3,15** |
| Predictive Maintenance Maschine X | 4 | 4 | 2 | 2 | 5 | 5 | 3 | 5 | **3,60** |
| ChatGPT-basierte Marketing-Texte | 2 | 2 | 5 | 5 | 4 | 4 | 5 | 2 | **3,55** |
| KI-Chatbot Kunden-Support | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | **3,10** |

**Empfehlung:** Predictive Maintenance + Mail-Triage als Top-Piloten. Bewerber-Vorsortierung trotz Score 3,15 nur mit Art.-26-Prüfung, DSGVO/DSFA, Betriebsrat-Konsultation und FRIA-Prüfung, falls Art. 27 greift.

---

> **Hinweis:** Diese Matrix ist ein öffentliches Arbeitsblatt. Nutzen Sie sie als Ausgangspunkt für interne Priorisierung, Scoring-Validierung und Pilot-Charter der Top-Use-Cases.
