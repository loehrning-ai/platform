---
title: "DSFA für KI-Systeme (KI-spezifische Datenschutz-Folgenabschätzung)"
slug: "dsfa-fuer-ki-systeme"
category: "pflicht"
pflicht: true
articleRefs:
  - "Art. 35 DSGVO"
  - "Art. 26 EU AI Act"
  - "Art. 27 EU AI Act (FRIA, nur für den einschlägigen Adressatenkreis)"
  - "DSK Hambacher Erklärung"
pages: 8
jobToBeDone: "Mein DSB fordert eine DSFA für ChatGPT Enterprise, wie? KI-spezifische Risiken nach DSK-Orientierungshilfe, mit Schwellenwert-Test und Maßnahmen-Katalog."
audience:
  - "Datenschutzbeauftragte"
  - "KI-Verantwortliche"
estReadMinutes: 18
estCompleteMinutes: 240
relatedSlugs:
  - "risikoklassifizierung"
  - "ki-inventarliste"
  - "ki-anbieter-due-diligence"
editorNotes:
  - "DSFA ist DSGVO-Pflicht (Art. 35). Sie ersetzt NICHT die FRIA nach Art. 27 EU AI Act; beide können erforderlich sein, wenn der Art.-27-Adressatenkreis betroffen ist."
  - "Schwellenwert-Test in Abschnitt 2 sorgfältig: Auch eine 'kleine' KI kann hochrisikoreich für Datenschutz sein"
  - "Bei US-Anbietern (ChatGPT, Claude, Copilot Consumer): EU-Standardvertragsklauseln + Transfer Impact Assessment ergänzen"
  - "DSFA bei wesentlicher Änderung wiederholen, neuer Modell-Release zählt als wesentlich"
sources:
  - title: "Art. 35 DSGVO. Datenschutz-Folgenabschätzung"
    url: "https://dsgvo-gesetz.de/art-35-dsgvo/"
  - title: "DSK. Orientierungshilfe der Aufsichtsbehörden"
    url: "https://www.datenschutzkonferenz-online.de/media/oh/20240506_DSK_Orientierungshilfe_KI_und_Datenschutz.pdf"
  - title: "Liste DSFA-pflichtiger Verarbeitungen (BfDI)"
    url: "https://www.bfdi.bund.de/DE/Fachthemen/Inhalte/Technik/Datenschutz-Folgenabschaetzungen.html"
lastReviewed: "2026-05-03"
reviewCadence: "legal"
nextReview: "2026-12-22"
owner: "tim@loehrning.ai"
riskClass: "legal"
triggerEvents:
  - "eu-ai-act-amendment"
---

# DSFA für KI-Systeme (Datenschutz-Folgenabschätzung)

Wenn ein KI-System personenbezogene Daten verarbeitet und ein hohes Risiko begründet, schreibt DSGVO Art. 35 eine Datenschutz-Folgenabschätzung vor. Diese Vorlage führt Sie Schritt für Schritt durch den Prozess.

> **Zweck:** Strukturierte Bewertung der datenschutzrechtlichen Risiken eines KI-Systems gemäß Art. 35 DSGVO, ergänzt um KI-spezifische Risiken aus der DSK-Orientierungshilfe „KI und Datenschutz" (2024).
>
> **Anleitung:** Eine DSFA pro KI-System mit hohem Risiko für Rechte und Freiheiten betroffener Personen durchführen. Wenn unsicher: Schwellenwert-Test in Abschnitt 2.

---

## 1. Identifikation des KI-Systems

| Feld | Eintrag |
|---|---|
| **Bezeichnung** | _[z.B. "ChatGPT Enterprise"]_ |
| **Anbieter** | _[z.B. "OpenAI Ireland Ltd."]_ |
| **Verantwortlicher (DSGVO)** | _[Firmenname GmbH]_ |
| **Auftragsverarbeiter?** | ☐ Ja, AV-Vertrag vom _[Datum]_ ☐ Nein |
| **Eingesetzt seit / geplant ab** | _[TT.MM.JJJJ]_ |
| **DSFA-Verantwortlich** | _[DSB / KI-Beauftragter]_ |
| **DSFA-Datum** | _[TT.MM.JJJJ]_ |

---

## 2. Schwellenwert-Test: Brauche ich überhaupt eine DSFA?

Eine DSFA ist nach Art. 35 Abs. 1 DSGVO Pflicht, wenn die Verarbeitung „voraussichtlich ein hohes Risiko für die Rechte und Freiheiten natürlicher Personen zur Folge hat". Bei KI-Systemen ist das fast immer der Fall, wenn mindestens eines der folgenden Kriterien zutrifft:

| Kriterium | Trifft zu? | Hinweis |
|---|---|---|
| Systematische und umfangreiche Bewertung persönlicher Aspekte (Profiling) | ☐ Ja ☐ Nein | z.B. Lead-Scoring, Bewerber-Ranking, Risiko-Scores |
| Verarbeitung besonderer Kategorien (Art. 9 DSGVO) im großen Umfang | ☐ Ja ☐ Nein | Gesundheits-, Biometrie-, Religions-, Gewerkschaftsdaten |
| Systematische Überwachung öffentlich zugänglicher Bereiche | ☐ Ja ☐ Nein | Videoanalyse, Emotionserkennung |
| Innovative Technologie mit unbekannten Folgen | ☐ Ja ☐ Nein | Generative KI, neuronale Netze |
| Verhinderung von Vertragsabschlüssen oder Leistungserbringung | ☐ Ja ☐ Nein | Kreditscoring, Kündigungsempfehlungen |
| Datenverarbeitung im großen Umfang | ☐ Ja ☐ Nein | mehr als 10.000 Betroffene oder dauerhafte Erfassung |
| Daten besonders schutzbedürftiger Personen | ☐ Ja ☐ Nein | Kinder, Patienten, Asylsuchende |

**Ergebnis:**
- ☐ **Mindestens 2 Kriterien zutreffend** → DSFA ist Pflicht. Weiter mit Abschnitt 3.
- ☐ **1 Kriterium zutreffend** → DSFA empfohlen. Begründen Sie die Entscheidung dokumentiert.
- ☐ **Kein Kriterium** → DSFA nicht zwingend, aber prüfen Sie die Liste DSFA-pflichtiger Verarbeitungen Ihrer Aufsichtsbehörde.

---

## 3. Beschreibung der Verarbeitung

### 3.1 Zweck

Welcher konkrete Geschäftszweck wird durch das KI-System unterstützt?

_[Freitext, 2-4 Sätze]_

### 3.2 Datenfluss-Diagramm (textuell)

```
[Quell-System z.B. CRM]
    |
    v
[KI-System: Eingabe, Verarbeitung, Ausgabe]
    |
    v
[Ergebnis-System z.B. Dashboard, E-Mail-Workflow]
```

### 3.3 Verarbeitungstätigkeiten

| Phase | Tätigkeit | Datenkategorien |
|---|---|---|
| Erhebung | _[Wie kommen die Daten ins System?]_ | _[Liste]_ |
| Speicherung | _[Wo, wie lange?]_ | - |
| Verarbeitung | _[Was tut die KI?]_ | - |
| Ausgabe | _[Was kommt heraus?]_ | - |
| Weitergabe | _[An wen, wozu?]_ | - |
| Löschung | _[Wann, wodurch?]_ | - |

### 3.4 Betroffene Personenkategorien

- ☐ Beschäftigte
- ☐ Bewerber
- ☐ Kunden / Interessenten
- ☐ Lieferanten
- ☐ Besucher / Webseiten-Nutzer
- ☐ Sonstige: _[Bezeichnung]_

### 3.5 Datenkategorien

| Kategorie | Beispiele | Im System? |
|---|---|---|
| Stammdaten | Name, Adresse, Geburtsdatum | ☐ |
| Kontaktdaten | E-Mail, Telefon | ☐ |
| Vertragsdaten | Bestellungen, Verträge | ☐ |
| Verhaltensdaten | Klick-Verhalten, Nutzungsverhalten | ☐ |
| Kommunikationsinhalte | E-Mails, Chat-Nachrichten | ☐ |
| Bewertungsdaten | Scores, Profile, Klassifizierungen | ☐ |
| Besondere Kategorien (Art. 9) | Gesundheit, Biometrie, Herkunft | ☐ |
| Strafrechtliche Daten (Art. 10) | Vorstrafen, Verfahren | ☐ |

---

## 4. Rechtsgrundlage

| Rechtsgrundlage | Anwendbar? | Begründung |
|---|---|---|
| Einwilligung (Art. 6 Abs. 1 lit. a) | ☐ | _[Wie wurde sie eingeholt? Widerrufbar?]_ |
| Vertragserfüllung (Art. 6 Abs. 1 lit. b) | ☐ | _[Welcher Vertrag?]_ |
| Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c) | ☐ | _[Welches Gesetz?]_ |
| Berechtigtes Interesse (Art. 6 Abs. 1 lit. f) | ☐ | _[Interessenabwägung dokumentiert?]_ |

Bei Art. 9 (besondere Kategorien) zusätzlich: Welche Ausnahme nach Art. 9 Abs. 2?

---

## 5. KI-spezifische Risikoanalyse

Die DSK fordert in der Orientierungshilfe „KI und Datenschutz" eine spezifische Risikobewertung für KI. Prüfen Sie die folgenden 7 Risikokategorien:

### 5.1 Trainingsdaten-Risiko
- [ ] Wurde das Modell mit personenbezogenen Daten trainiert? (Wenn ja: Rechtsgrundlage des Trainings?)
- [ ] Sind die Trainingsdaten transparent dokumentiert?
- [ ] Können Betroffene in den Trainingsdaten ihre Rechte (Auskunft, Löschung) ausüben?

### 5.2 Halluzinations- und Fehlerrisiko
- [ ] Wie hoch ist die Fehlerrate des Modells (laut Anbieter)?
- [ ] Welche Folgen hätte ein falsches Ergebnis für die betroffene Person?
- [ ] Gibt es eine Validierungsstufe vor Verwendung?

### 5.3 Diskriminierungs- und Bias-Risiko
- [ ] Wurden Bias-Tests durchgeführt? (Anbieter / intern)
- [ ] Sind sensible Attribute (Geschlecht, Alter, Herkunft) im Eingabeschema?
- [ ] Können Auswirkungen auf bestimmte Gruppen ausgeschlossen werden?

### 5.4 Re-Identifikations-Risiko (Aggregat- und Modell-Inversion)
- [ ] Können aus dem Modell Trainingsdaten rekonstruiert werden?
- [ ] Können aggregierte Outputs zur Re-Identifikation einzelner Personen führen?

### 5.5 Drittland-Übermittlungs-Risiko
- [ ] Werden Daten in Länder ohne Angemessenheitsbeschluss übermittelt?
- [ ] Wurden EU-Standardvertragsklauseln + Transfer Impact Assessment (TIA) abgeschlossen?
- [ ] Gibt es zusätzliche technische Schutzmaßnahmen (Verschlüsselung, Pseudonymisierung)?

### 5.6 Profiling- und Automatisierungs-Risiko (Art. 22 DSGVO)
- [ ] Trifft das System Entscheidungen mit rechtlicher Wirkung oder erheblicher Beeinträchtigung?
- [ ] Wenn ja: Liegt eine der Ausnahmen nach Art. 22 Abs. 2 vor?
- [ ] Wie wird die menschliche Aufsicht praktisch sichergestellt?

### 5.7 Transparenz- und Auskunftsrisiko
- [ ] Können Betroffene erkennen, dass eine KI-Verarbeitung stattfindet?
- [ ] Können Betroffene ihre Rechte (Auskunft, Berichtigung, Löschung) gegenüber dem KI-System ausüben?
- [ ] Können Betroffene das KI-Ergebnis nachvollziehen ("Recht auf Erklärung")?

---

## 6. Schadensszenarien: Was kann passieren?

Beschreiben Sie für jedes erkannte Risiko ein konkretes Schadensszenario:

| Risiko | Schadensszenario | Eintrittswahrscheinlichkeit (1-5) | Schwere (1-5) | Risiko-Score (Wahrsch. × Schwere) |
|---|---|---|---|---|
| Trainingsdaten | _[z.B. Kunden-PII war in Trainingsset und wird aus Modell extrahiert]_ | _[1-5]_ | _[1-5]_ | _[Produkt]_ |
| Halluzination | _[z.B. KI generiert falschen Mahnungstext mit erfundenen Beträgen]_ | _[1-5]_ | _[1-5]_ | _[Produkt]_ |
| Bias | _[z.B. Bewerber-Score systematisch niedriger für ältere Bewerber]_ | _[1-5]_ | _[1-5]_ | _[Produkt]_ |
| Drittland | _[z.B. US-Behördenzugriff auf europäische Kundendaten]_ | _[1-5]_ | _[1-5]_ | _[Produkt]_ |
| Profiling | _[z.B. Auto-Kündigung wegen niedrigem Engagement-Score]_ | _[1-5]_ | _[1-5]_ | _[Produkt]_ |

**Risiko-Bewertung:**
- 1-8: Niedriges Risiko
- 9-15: Mittleres Risiko (Maßnahmen empfohlen)
- 16-25: Hohes Risiko (Maßnahmen verpflichtend, ggf. Konsultation der Aufsichtsbehörde)

---

## 7. Maßnahmen-Katalog

Für jedes Risiko mit Score >= 9 müssen Schutzmaßnahmen definiert werden:

### Technisch
- [ ] Pseudonymisierung der Eingabedaten
- [ ] Aggregations-Schwelle (mindestens N Personen pro Auswertung)
- [ ] Verschlüsselung in Transit und at Rest
- [ ] Zugriffsbeschränkung auf Need-to-know-Basis
- [ ] Logging und Audit-Trail
- [ ] Modell-Updates kontrolliert ausrollen

### Organisatorisch
- [ ] Schulung der Nutzer (KI-Kompetenz nach Art. 4)
- [ ] Vier-Augen-Prinzip bei Hochrisiko-Outputs
- [ ] Eskalations-Workflow für Auffälligkeiten
- [ ] Regelmäßige interne Audits
- [ ] DSFA-Re-Evaluation halbjährlich

### Vertraglich
- [ ] AV-Vertrag mit konkretisierten KI-Pflichten
- [ ] Audit-Recht
- [ ] Sub-Auftragsverarbeiter genehmigt
- [ ] EU-Standardvertragsklauseln (bei Drittland)
- [ ] Transfer Impact Assessment (TIA)

### Betroffenen-Rechte
- [ ] Information bei Erhebung (Art. 13)
- [ ] Auskunftsprozess definiert (Art. 15)
- [ ] Löschprozess definiert (Art. 17)
- [ ] Widerspruchsmöglichkeit gegen Profiling (Art. 22)

---

## 8. Restrisiko und Konsultation

| Risiko-Klasse nach Maßnahmen | Aktion |
|---|---|
| Niedrig (1-8) | Dokumentieren, jährliche Re-Evaluation |
| Mittel (9-15) | Dokumentieren, halbjährliche Re-Evaluation, Geschäftsführung informieren |
| Hoch (16-25) | **Vorabkonsultation der Aufsichtsbehörde nach Art. 36 DSGVO** |

---

## 9. Freigabe und Versionierung

| Rolle | Name | Datum | Unterschrift |
|---|---|---|---|
| Datenschutzbeauftragter | | | |
| KI-Beauftragter | | | |
| Geschäftsführung | | | |
| Betriebsrat (zur Kenntnis) | | | |

| Version | Datum | Änderung | Re-Evaluation |
|---|---|---|---|
| 1.0 | _[Datum]_ | Erstausgabe | _[+6 Monate]_ |
| | | | |

---

> **Hinweis:** Diese Vorlage strukturiert die Pflicht-DSFA. Sie ersetzt nicht die juristische Würdigung im Einzelfall. Für komplexe KI-Systeme, etwa Hochrisiko-Systeme oder Systeme mit Drittlandbezug, sollten Datenschutzbeauftragte und spezialisierte Rechtsberatung einbezogen werden.
