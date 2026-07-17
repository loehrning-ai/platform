---
title: "Risikoklassifizierung EU AI Act"
slug: "risikoklassifizierung"
category: "pflicht"
pflicht: true
articleRefs:
  - "Art. 5 EU AI Act"
  - "Art. 6 EU AI Act"
  - "Annex III EU AI Act"
pages: 7
jobToBeDone: "Ist mein KI-Tool Hochrisiko? Entscheidungsbaum mit konkreten Beispielen für HR-Screening, Marketing-AI und Customer-Service-Bots."
audience:
  - "KI-Verantwortliche"
  - "Interessierte"
estReadMinutes: 12
estCompleteMinutes: 60
relatedSlugs:
  - "ki-nutzungsrichtlinie"
  - "ki-inventarliste"
  - "dsfa-fuer-ki-systeme"
editorNotes:
  - "Steckbrief mit Ihren KI-Systemen ausfüllen, eine Vorlage pro System"
  - "Die Annex-III-Bereiche sind die häufigsten Fallen. Bereich 4 (Beschäftigung) trifft fast jeden Mittelstand"
  - "Ausnahme nach Art. 6(3) ist KEIN Freibrief: Begründung ist dokumentationspflichtig"
  - "Bewertung jährlich oder bei jeder wesentlichen Änderung wiederholen"
sources:
  - title: "Verordnung (EU) 2024/1689. KI-Verordnung Volltext"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
  - title: "EU AI Act Annex III. Hochrisiko-KI-Systeme (EUR-Lex)"
    url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689#annex-III"
  - title: "European Commission. AI Act regulatory framework"
    url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai"
lastReviewed: "2026-05-03"
reviewCadence: "legal"
nextReview: "2026-12-22"
owner: "tim@loehrning.ai"
riskClass: "legal"
triggerEvents:
  - "eu-ai-act-amendment"
---

# Risikoklassifizierung nach EU AI Act (Annex III Entscheidungsbaum)

Diese Vorlage ist der Decision-Tree für die Einordnung eines konkreten KI-Systems in die richtige EU-AI-Act-Risikoklasse, mit schriftlicher Begründung.

> **Zweck:** Bestimmen Sie die Risikoklasse eines KI-Systems nach der EU KI-Verordnung (Verordnung (EU) 2024/1689). Diese Klassifizierung legt fest, welche Pflichten für Sie als Anbieter oder Betreiber gelten.
>
> **Anleitung:** Arbeiten Sie die Fragen von oben nach unten durch. Dokumentieren Sie Ihre Antworten als Teil Ihrer internen Risikodokumentation.

---

## KI-System-Steckbrief

| Feld | Eintrag |
|---|---|
| **Name des KI-Systems** | _[z.B. "SmartRecruit Pro"]_ |
| **Anbieter/Hersteller** | _[z.B. "Softgarden GmbH"]_ |
| **Einsatzbereich** | _[z.B. "Bewerbermanagement, CV-Screening"]_ |
| **Ihre Rolle** | ☐ Anbieter (Provider) ☐ Betreiber (Deployer) |
| **Datum der Bewertung** | _[TT.MM.JJJJ]_ |
| **Bewertet durch** | _[Name, Funktion]_ |

---

## Schritt 1: Handelt es sich um ein KI-System?

> **Definition (Art. 3 Nr. 1):** Ein KI-System ist ein maschinengestütztes System, das mit unterschiedlichem Grad an Autonomie operiert, nach dem Einsatz anpassungsfähig sein kann, und aus den erhaltenen Eingaben für explizite oder implizite Ziele ableitet, wie Vorhersagen, Inhalte, Empfehlungen oder Entscheidungen generiert werden, die physische oder virtuelle Umgebungen beeinflussen können.

### Prüffragen

- [ ] Trifft das System eigenständige oder teilautonome Entscheidungen?
- [ ] Generiert das System Vorhersagen, Empfehlungen oder Inhalte?
- [ ] Kann sich das System an neue Daten anpassen?
- [ ] Beeinflusst das System Handlungen, Entscheidungen oder Informationen für Menschen?

**Ergebnis:**
- ☐ **Ja, es ist ein KI-System** → Weiter mit Schritt 2
- ☐ **Nein** → Keine Pflichten aus der KI-Verordnung (aber ggf. DSGVO, Produktsicherheit etc.)

---

## Schritt 2: Ist das System verboten? (Art. 5)

> Bestimmte KI-Praktiken sind seit dem 2. Februar 2025 verboten.

### Prüffragen

- [ ] Manipuliert das System das Verhalten von Personen durch unterschwellige Techniken?
- [ ] Nutzt das System Schwächen bestimmter Personengruppen (Alter, Behinderung) aus?
- [ ] Bewertet oder klassifiziert das System Personen anhand ihres Sozialverhaltens (Social Scoring)?
- [ ] Erstellt das System biometrische Gesichtsdatenbanken durch ungezieltes Scraping?
- [ ] Erkennt das System Emotionen am Arbeitsplatz oder in Bildungseinrichtungen (mit Ausnahmen)?
- [ ] Kategorisiert das System Personen nach sensiblen Merkmalen (Rasse, politische Überzeugung)?

**Ergebnis:**
- ☐ **Ja, mindestens eine Frage mit Ja** → **STOPP. Einsatz ist verboten.** Konsultieren Sie sofort einen Rechtsberater.
- ☐ **Nein** → Weiter mit Schritt 3

---

## Schritt 3: Ist das System hochriskant? (Art. 6 + Annex III)

### 3a: Sicherheitskomponente eines regulierten Produkts? (Art. 6 Abs. 1 + Annex I)

Ist das KI-System eine Sicherheitskomponente eines Produkts, das unter bestehende EU-Produktsicherheitsgesetzgebung fällt?

| EU-Verordnung | Beispielprodukte |
|---|---|
| Maschinenverordnung | Industrieroboter, CNC-Maschinen mit KI-Steuerung |
| Medizinprodukteverordnung (MDR) | KI-Diagnosesoftware, medizinische Bildanalyse |
| Fahrzeugsicherheitsverordnung | ADAS, Notbremsassistent |
| Spielzeugrichtlinie | Interaktives KI-Spielzeug |
| Aufzugsrichtlinie | KI-gesteuerte Aufzüge |

- [ ] Das KI-System ist eine Sicherheitskomponente eines oben gelisteten Produkts
- [ ] Das Produkt erfordert eine Konformitätsbewertung durch Dritte

**Ergebnis:**
- ☐ **Ja** → **Hochrisiko.** Weiter mit Schritt 4 (Pflichten).
- ☐ **Nein** → Weiter mit 3b

### 3b: Fällt das System in einen Annex-III-Bereich? (Art. 6 Abs. 2)

Prüfen Sie jeden der 8 Bereiche:

#### Bereich 1: Biometrische Identifizierung und Kategorisierung

- [ ] Ferngesteuerte biometrische Identifizierung (Gesichtserkennung)
- [ ] Emotionserkennung am Arbeitsplatz oder in Bildungseinrichtungen
- [ ] Biometrische Kategorisierung nach sensiblen Merkmalen

#### Bereich 2: Kritische Infrastruktur

- [ ] KI als Sicherheitskomponente in der Verwaltung digitaler Infrastruktur
- [ ] KI im Straßenverkehrsmanagement
- [ ] KI in der Versorgung mit Wasser, Gas, Heizung oder Strom

#### Bereich 3: Bildung und Berufsausbildung

- [ ] KI für Zulassungsentscheidungen zu Bildungseinrichtungen
- [ ] KI für die Bewertung von Lernenden (Benotung, Prüfungsbewertung)
- [ ] KI zur Bestimmung des Bildungsniveaus einer Person
- [ ] KI zur Überwachung verbotenen Verhaltens bei Prüfungen

#### Bereich 4: Beschäftigung und Personalmanagement (häufigster Fall aus dem Mittelstand)

> **Achtung:** Dieser Bereich trifft fast jedes Unternehmen mit moderner HR-Software.

- [ ] KI für Rekrutierung und Auswahl (CV-Screening, Kandidaten-Ranking, Interview-Bewertung)
- [ ] KI für Entscheidungen über Arbeitsbedingungen, Beförderung oder Kündigung
- [ ] KI für Aufgabenzuweisung basierend auf individuellem Verhalten/Persönlichkeit
- [ ] KI zur Überwachung und Bewertung der Arbeitsleistung

**Typische Tools:** Personio AI, Softgarden, SAP SuccessFactors, ATOSS, Shyftplan, retorio, HireVue

#### Bereich 5: Zugang zu wesentlichen Dienstleistungen

- [ ] KI für die Bewertung der Berechtigung zu öffentlichen Leistungen
- [ ] KI für Kreditwürdigkeitsprüfung / Kreditscoring
- [ ] KI für Risikobewertung und Preisgestaltung in Lebens- und Krankenversicherungen
- [ ] KI für die Bewertung und Klassifizierung von Notrufen (Triage)

#### Bereich 6: Strafverfolgung

- [ ] KI für individuelle Risikobewertung (Vorhersage von Straftaten)
- [ ] KI als Lügendetektor
- [ ] KI zur Bewertung der Zuverlässigkeit von Beweismitteln

#### Bereich 7: Migration und Grenzkontrolle

- [ ] KI für Risikobewertung bei Einreise
- [ ] KI für die Prüfung von Asylanträgen oder Visa

#### Bereich 8: Rechtspflege und demokratische Prozesse

- [ ] KI zur Unterstützung richterlicher Entscheidungen
- [ ] KI zur Beeinflussung von Wahlergebnissen

**Ergebnis:**
- ☐ **Ja, mindestens ein Feld angekreuzt** → Prüfen Sie die Ausnahme in 3c
- ☐ **Nein** → Weiter mit Schritt 3d

### 3c: Ausnahme: Keine erhebliche Gefahr? (Art. 6 Abs. 3)

> Ein Annex-III-System ist NICHT hochriskant, wenn es kein erhebliches Risiko für Gesundheit, Sicherheit oder Grundrechte darstellt, z.B. wenn es lediglich eine enge Verfahrensaufgabe ausführt, ein Ergebnis einer zuvor abgeschlossenen menschlichen Bewertung verbessert, oder rein vorbereitende Aufgaben erledigt.

- [ ] Das System führt eine enge, rein prozedurale Aufgabe aus
- [ ] Das System verbessert lediglich das Ergebnis einer menschlichen Entscheidung
- [ ] Das System erledigt rein vorbereitende Aufgaben ohne eigene Entscheidungswirkung

**Ergebnis:**
- ☐ **Ausnahme greift** → **Nicht hochriskant**, aber Sie müssen die Begründung dokumentieren. Weiter mit Schritt 3d.
- ☐ **Ausnahme greift nicht** → **Hochrisiko.** Weiter mit Schritt 4.

### 3d: Keine Hochrisiko-Einstufung

Das System ist voraussichtlich **nicht hochriskant**. Es können dennoch Pflichten bestehen:

- **Artikel 4:** KI-Kompetenz sicherstellen (gilt für ALLE KI-Systeme)
- **Artikel 50:** Transparenzpflichten für bestimmte KI-Systeme (Chatbots, Deepfakes, Emotionserkennung)
- **GPAI-Ebene:** GPAI-Anbieterpflichten treffen Modellanbieter seit 2. August 2025; Nutzer prüfen Vendor-Nachweise und eigene Use-Case-Pflichten separat.

→ Weiter mit Schritt 5 für die Zusammenfassung.

---

## Schritt 4: Pflichten für Hochrisiko-KI-Systeme

### Als Betreiber (Deployer) müssen Sie:

- [ ] **Grundrechte-Folgenabschätzung** nach Art. 27 nur durchführen, wenn der einschlägige Adressatenkreis betroffen ist
- [ ] **Menschliche Aufsicht** sicherstellen (Art. 14), qualifiziertes Personal benennen
- [ ] **Betroffene informieren** (Art. 26 Abs. 7). Beschäftigte, Bewerber, Kunden
- [ ] **Betriebsrat einbinden** (Art. 26 Abs. 7), in Deutschland gesetzlich vorgeschrieben
- [ ] **Eingabedaten überwachen** (Art. 26 Abs. 5). Datenqualität sicherstellen
- [ ] **Protokolle aufbewahren** (Art. 26 Abs. 6), mindestens 6 Monate
- [ ] **Vorfälle melden** (Art. 26 Abs. 5), schwerwiegende Vorfälle an den Anbieter und die Behörde

### Als Anbieter (Provider) müssen Sie zusätzlich:

- [ ] **Risikomanagementsystem** einrichten (Art. 9)
- [ ] **Daten-Governance** sicherstellen (Art. 10)
- [ ] **Technische Dokumentation** erstellen (Art. 11)
- [ ] **Protokollierung** implementieren (Art. 12)
- [ ] **Transparenz** gewährleisten (Art. 13)
- [ ] **Genauigkeit, Robustheit, Cybersicherheit** sicherstellen (Art. 15)
- [ ] **Konformitätsbewertung** durchführen (Art. 43)
- [ ] **EU-Konformitätserklärung** ausstellen (Art. 47)
- [ ] **CE-Kennzeichnung** anbringen (Art. 48)
- [ ] **System in der EU-Datenbank registrieren** (Art. 49)

---

## Schritt 5: Zusammenfassung der Bewertung

| Feld | Ergebnis |
|---|---|
| **KI-System** | _[Name]_ |
| **Ist es ein KI-System?** | ☐ Ja ☐ Nein |
| **Verbotene Praktik?** | ☐ Ja ☐ Nein |
| **Risikoklasse** | ☐ Verboten ☐ Hochrisiko ☐ Begrenztes Risiko ☐ Minimales Risiko |
| **Ihre Rolle** | ☐ Anbieter ☐ Betreiber |
| **Annex-III-Bereich** | _[Bereich Nr. und Beschreibung]_ |
| **Ausnahme nach Art. 6(3)?** | ☐ Ja (dokumentierte Begründung) ☐ Nein |
| **Nächste Schritte** | _[Pflichten aus Schritt 4 oder allgemeine Pflichten]_ |

**Unterschrift / Freigabe:**

| | Name | Datum | Unterschrift |
|---|---|---|---|
| Erstellt von | | | |
| Geprüft von | | | |
| Freigegeben von | | | |

---

## Drei durchgerechnete Beispiele aus dem Mittelstand

### Beispiel A: HR-Screening-Tool (Personio AI)
- **Schritt 1:** KI-System → Ja
- **Schritt 2:** Verboten → Nein
- **Schritt 3b, Bereich 4:** Rekrutierung → Ja
- **Schritt 3c:** Ausnahme? Tool sortiert Kandidatenliste automatisch → erhebliche Wirkung → Ausnahme greift NICHT
- **Ergebnis:** Hochrisiko-Verdacht. Pflicht: Art. 26, DSGVO/DSFA, Betriebsrat und Information der Bewerber prüfen; FRIA nur, wenn Art. 27 greift.

### Beispiel B: Marketing-Texter (ChatGPT Business für Blogposts)
- **Schritt 1:** KI-System → Ja
- **Schritt 2:** Verboten → Nein
- **Schritt 3b:** Kein Annex-III-Bereich
- **Ergebnis:** Begrenztes/minimales Risiko. Pflicht: Art. 4 (Schulung), bei Veröffentlichung Transparenz nach Art. 50.

### Beispiel C: Customer-Service-Chatbot (Intercom Fin AI)
- **Schritt 1:** KI-System → Ja
- **Schritt 2:** Verboten → Nein
- **Schritt 3b:** Kein Annex-III-Bereich
- **Ergebnis:** Begrenztes Risiko. Pflicht: Art. 50. Nutzer muss erkennen, dass er mit KI spricht.

---

## Weiterführende Ressourcen

- [EU AI Act Annex III. Hochrisiko-KI-Systeme (EUR-Lex)](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689#annex-III)
- [EU AI Act Art. 6. Klassifizierungsregeln (EUR-Lex)](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689#article-6)
- [European Commission. AI Act regulatory framework](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)

---

> **Hinweis:** Diese Vorlage ersetzt keine Rechtsberatung. Bei konkreten Rechtsfragen konsultieren Sie einen spezialisierten Anwalt oder eine zuständige Compliance-Fachstelle.
