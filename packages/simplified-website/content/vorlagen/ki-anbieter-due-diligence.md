---
title: "KI-Anbieter Due-Diligence Checkliste"
slug: "ki-anbieter-due-diligence"
category: "hygiene"
pflicht: false
articleRefs:
  - "Art. 25 EU AI Act"
  - "Art. 28 DSGVO (AV-Vertrag)"
  - "Art. 44-49 DSGVO (Drittlandtransfer)"
pages: 6
jobToBeDone: "Salesforce sagt, sie haben jetzt KI. Was muss ich vom Vendor wissen, bevor ich unterschreibe? 30-Punkt-Assessment in 5 Domänen."
audience:
  - "Alle, die KI-Tools einsetzen"
estReadMinutes: 12
estCompleteMinutes: 90
relatedSlugs:
  - "ki-inventarliste"
  - "risikoklassifizierung"
  - "dsfa-fuer-ki-systeme"
editorNotes:
  - "Vor der Vertragsunterzeichnung verwenden, nicht danach. Nachträgliche Forderungen scheitern fast immer"
  - "Bei jedem 'Nein' oder 'Unklar' im rot markierten Block (Datenschutz, Drittland, Compliance) Vertragsverhandlung neu öffnen"
  - "Anbieter-Selbstauskunft anfordern, viele große Vendor (Microsoft, Google, AWS) haben Standard-DPAs; Mittelstand-SaaS oft nicht"
  - "Re-Audit jährlich oder bei Vertragsverlängerung"
sources:
  - title: "EU AI Act Art. 25. Pflichten der Bereitsteller (EUR-Lex)"
    url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689#article-25"
  - title: "Art. 28 DSGVO: Auftragsverarbeitung"
    url: "https://dsgvo-gesetz.de/art-28-dsgvo/"
  - title: "EDSA: Schrems II Empfehlungen"
    url: "https://www.edpb.europa.eu/our-work-tools/our-documents/recommendations/recommendations-012020-measures-supplement-transfer_en"
  - title: "EU-US Data Privacy Framework. Angemessenheitsbeschluss C(2023) 4745"
    url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32023D1795"
lastReviewed: "2026-06-22"
reviewCadence: "legal"
nextReview: "2026-12-22"
owner: "tim@loehrning.ai"
riskClass: "legal"
triggerEvents:
  - "eu-ai-act-amendment"
---

# KI-Anbieter Due-Diligence Checkliste

Sie setzen KI-Tools ein, die von Drittanbietern bereitgestellt werden. Diese Checkliste hilft Ihnen, die wichtigsten Datenschutz- und Compliance-Fragen zu stellen, bevor Sie unterschreiben.

> **Zweck:** Strukturierte Bewertung eines KI-Anbieters vor Vertragsabschluss oder bei Vertragsverlängerung. 30 Prüfpunkte in 5 Domänen. Ergebnis ist eine fundierte Go/No-Go-Empfehlung mit dokumentierten Risiken.
>
> **Anwendung:** Eine Checkliste pro Anbieter, ggf. eine pro Produkt, wenn der Anbieter mehrere KI-Funktionen anbietet.

---

## Anbieter-Steckbrief

| Feld | Eintrag |
|---|---|
| **Anbieter-Name** | _[z.B. "OpenAI Ireland Ltd."]_ |
| **Produkt** | _[z.B. "ChatGPT Enterprise"]_ |
| **Geprüft am** | _[TT.MM.JJJJ]_ |
| **Geprüft durch** | _[Name, Rolle]_ |
| **Vertragslaufzeit (geplant)** | _[12 Monate / 36 Monate]_ |
| **Geschätztes Vertragsvolumen** | _[EUR pro Jahr]_ |
| **Geplante Datenkategorien** | _[Liste]_ |
| **Geplante Anzahl Nutzer** | _[N]_ |

---

## Domäne 1: Anbieter-Reife (5 Punkte)

| # | Kriterium | Antwort | Risiko bei "Nein" |
|---|---|---|---|
| 1 | Anbieter besteht > 3 Jahre? | ☐ Ja ☐ Nein | Geschäftsausfall, Modell-Diskontinuität |
| 2 | Eigenes Datenschutzteam / DPO benannt? | ☐ Ja ☐ Nein | Lange Reaktionszeiten bei DSGVO-Anfragen |
| 3 | Zertifizierungen (ISO 27001, SOC 2 Type II, BSI C5)? | ☐ Ja ☐ Nein | Unklare Sicherheitsreife |
| 4 | Audit-Bericht (SOC 2, BSI C5) verfügbar? | ☐ Ja ☐ Nein | Keine externe Validierung |
| 5 | Referenzkunden im EU-Raum mit ähnlicher Branche? | ☐ Ja ☐ Nein | Unklare Eignung für Ihren Kontext |

---

## Domäne 2: Datenschutz und Compliance (8 Punkte): kritisch

| # | Kriterium | Antwort | Risiko bei "Nein" |
|---|---|---|---|
| 6 | AV-Vertrag nach Art. 28 DSGVO verfügbar? | ☐ Ja ☐ Nein | Verstoß gegen DSGVO bei Inbetriebnahme |
| 7 | DPA enthält konkrete TOMs (technisch-organisatorische Maßnahmen)? | ☐ Ja ☐ Nein | Unprüfbare Schutzversprechen |
| 8 | Audit-Recht des Verantwortlichen vertraglich zugesichert? | ☐ Ja ☐ Nein | Keine Kontrollmöglichkeit |
| 9 | Sub-Auftragsverarbeiter offengelegt + Genehmigungspflicht? | ☐ Ja ☐ Nein | Verdeckte Datenflüsse möglich |
| 10 | Datenstandort vertraglich zugesichert (EU/EWR)? | ☐ Ja ☐ Nein | Drittlandtransfer ohne Schutz |
| 11a | Ist der Anbieter im EU-US Data Privacy Framework (DPF) zertifiziert? (dataprivacyframework.gov/s/participant-search) | ☐ Ja ☐ Nein ☐ Unklar | Wenn Ja weiter zu 12. DPF = Angemessenheitsbeschluss C(2023) 4745, gültig ab 10. Juli 2023. |
| 11b | Wenn Nein/Unklar: EU-Standardvertragsklauseln (SCC) + Transfer Impact Assessment (TIA) vorhanden? | ☐ Ja ☐ Nein | Schrems-II-Konformität prüfen |
| 12 | Löschkonzept dokumentiert (Was wann wodurch)? | ☐ Ja ☐ Nein | Verstoß gegen Speicherbegrenzung (Art. 5 DSGVO) |
| 13 | Daten werden NICHT zum Training fremder Modelle verwendet? | ☐ Ja ☐ Nein | Unkontrollierter Datenabfluss in Trainingsmodell |

> **DPF-Hinweis:** Prüfen Sie die DPF-Teilnahme unter dataprivacyframework.gov/s/participant-search. Bekannte Teilnehmer (Stand: 2026-06-22): Microsoft Azure, Amazon AWS, Google Cloud (ausgewählte Dienste), OpenAI. Immer individuell prüfen. DPF-Zertifizierung ist freiwillig und zeitlich begrenzt.

---

## Domäne 3: KI-Spezifika und EU AI Act (6 Punkte)

| # | Kriterium | Antwort | Risiko bei "Nein" |
|---|---|---|---|
| 14 | Anbieter klassifiziert sein System nach EU AI Act selbst (Anbieter-Pflicht)? | ☐ Ja ☐ Nein | Risikoklasse unklar, Pflichten verteilt |
| 15 | Bei GPAI: Anbieter erfüllt Art. 53-55 (Dokumentation, Copyright-Policy)? | ☐ Ja ☐ Nein | Compliance-Verstoß als Betreiber |
| 16 | Modell-Karte (Model Card) verfügbar? | ☐ Ja ☐ Nein | Unklare Leistungsgrenzen, Bias-Risiko |
| 17 | Trainingsdaten-Beschreibung verfügbar (mind. Aggregat-Quellen)? | ☐ Ja ☐ Nein | Re-Identifikations- und Copyright-Risiko |
| 18 | Bias-/Fairness-Berichte verfügbar? | ☐ Ja ☐ Nein | Diskriminierungsrisiko unbekannt |
| 19 | Versions- und Änderungsprotokoll für Modelle? | ☐ Ja ☐ Nein | Unangekündigte Verhaltens-Änderungen |

---

## Domäne 4: Sicherheit und Betrieb (6 Punkte)

| # | Kriterium | Antwort | Risiko bei "Nein" |
|---|---|---|---|
| 20 | Verschlüsselung in Transit (TLS 1.2+) und at Rest (AES-256)? | ☐ Ja ☐ Nein | Datenabfluss bei Kompromittierung |
| 21 | SSO und MFA unterstützt? | ☐ Ja ☐ Nein | Schwache Zugangssicherheit |
| 22 | Granulare Rollen / Berechtigungen? | ☐ Ja ☐ Nein | Need-to-know nicht umsetzbar |
| 23 | Audit-Logs der Nutzeraktivitäten exportierbar? | ☐ Ja ☐ Nein | Forensik nicht möglich |
| 24 | Incident-Response-Prozess dokumentiert (mit SLA für Meldung)? | ☐ Ja ☐ Nein | Späte Datenschutz-Verletzungs-Meldung (Art. 33 DSGVO Frist 72h!) |
| 25 | Betriebs-SLA mit Verfügbarkeits-Garantie (z.B. 99,5 Prozent)? | ☐ Ja ☐ Nein | Geschäftsunterbrechung ohne Kompensation |

---

## Domäne 5: Vertragliche Konditionen (5 Punkte)

| # | Kriterium | Antwort | Risiko bei "Nein" |
|---|---|---|---|
| 26 | Klare Preisstruktur ohne versteckte „AI Credits" oder Token-Kosten? | ☐ Ja ☐ Nein | Kostenexplosion bei Mehrnutzung |
| 27 | Kündigungsrecht innerhalb angemessener Frist? | ☐ Ja ☐ Nein | Lock-in-Effekt |
| 28 | Datenexport in Standardformaten bei Vertragsende garantiert? | ☐ Ja ☐ Nein | Vendor Lock-in / Datenverlust |
| 29 | Haftungsregelung mit angemessener Höhe (mind. Vertragsvolumen p.a.)? | ☐ Ja ☐ Nein | Schaden trägt der Kunde |
| 30 | Recht auf Anwendung deutschen Rechts und Gerichtsstand DE? | ☐ Ja ☐ Nein | Internationale Rechtsstreitigkeiten |

---

## Bewertung

### Score-Berechnung

| Domäne | Maximum | Erreicht | Hinweis |
|---|---|---|---|
| Anbieter-Reife | 5 | _[ ]_ | Bei < 3: "junger" Anbieter, höheres Geschäftsrisiko |
| Datenschutz/Compliance | 8 | _[ ]_ | Bei < 7: **STOPP, Vertrag nicht unterzeichnen** |
| KI-Spezifika | 6 | _[ ]_ | Bei < 4: Compliance-Lasten verschieben sich auf Sie |
| Sicherheit/Betrieb | 6 | _[ ]_ | Bei < 5: hohe technische Risiken |
| Vertrag | 5 | _[ ]_ | Bei < 4: ungünstige kommerzielle Bedingungen |
| **Summe** | **30** | _[ ]_ | |

### Empfehlung

| Score | Empfehlung |
|---|---|
| 27-30 | **Go.** Anbieter erfüllt Standards. |
| 22-26 | **Go mit Auflagen.** Dokumentieren Sie Risiken, fordern Sie Vertrags-Nachbesserungen. |
| 17-21 | **Nachverhandeln.** Substantielle Lücken; Vertrag nur nach Schließung der Top-3-Lücken. |
| < 17 | **No-Go.** Risiken überwiegen. Alternative Anbieter prüfen. |

**Sondervetos** (unabhängig vom Gesamtscore):
- Punkt 6 (AV-Vertrag) "Nein" → No-Go
- Punkte 11a+11b (Drittland-Schutz) "Nein" bei US-Anbieter ohne DPF und ohne SCCs+TIA → No-Go bis behoben
- Punkt 13 (kein Modell-Training mit Ihren Daten) "Nein" bei vertraulichen Daten → No-Go

---

## Anbieter-spezifische Quick-Reads (Stand 2026)

_Beispiel-Einschätzungen (Stand 2026), vor Verwendung selbst prüfen._

### Microsoft 365 Copilot (Enterprise)
- Score-Erwartung: 26-28 (gute DPA, EU Data Boundary, klare AI-Klassifizierung)
- Schwachpunkt: Modell-Trainingsdaten teilweise opak

### OpenAI ChatGPT Enterprise
- Score-Erwartung: 24-26 (DPA vorhanden, US-Sitz, DPF-zertifiziert seit 2023, EU-SCCs als Rückfall)
- Schwachpunkt: Drittlandtransfer TIA empfohlen trotz DPF, Modell-Karte begrenzt

### Anthropic Claude (über AWS Bedrock EU)
- Score-Erwartung: 24-27 (über AWS-Hosting EU möglich, gute Sicherheit)
- Schwachpunkt: junger Anbieter, weniger Audit-Berichte

### Google Workspace mit Gemini (Enterprise)
- Score-Erwartung: 25-27 (gute DPA, EU-Hosting möglich)
- Schwachpunkt: Modell-Updates ändern Verhalten, Versionierung lückenhaft

### Mittelstand-SaaS (Personio, sevDesk, Lexware mit AI-Modulen)
- Score-Erwartung: stark variabel (15-28)
- Schwachpunkt: oft kein dediziertes AI-DPA, GPAI-Pflichten unklar

---

## Weitere Schritte

Nach abgeschlossener Due Diligence:

1. Ergebnisse dokumentieren (dieses Formular ausgefüllt + Anlagen)
2. Bei kritischen Lücken: Nachverhandlung mit Anbieter
3. Bei Go: Eintrag in **KI-Inventarliste** (verwandte Vorlage)
4. Bei Hochrisiko-Anwendung: **DSFA** und ggf. **FRIA** anschließen, wenn Art. 27 greift
5. Re-Audit jährlich oder bei wesentlichen Änderungen (neuer Modell-Release, neue Sub-Verarbeiter, neue Standorte)

---

> **Hinweis:** Diese Checkliste fokussiert die Top-30-Risiken. Für strategische Anbieter mit großem Vertragsvolumen (> 50.000 EUR p.a.) sollte die interne Prüfung um Tiefen-Due-Diligence, technische Tests und juristische Vertrags-Review ergänzt werden.
