# AVV, DSGVO, Shadow AI: Was du wissen musst

Seit du KI nutzt, ist Datenschutz auch deine Sache. Artikel 4 der EU-KI-Verordnung verlangt seit dem 2. Februar 2025 von Anbietern und Betreibern kontextgerechte Maßnahmen, die die Entwicklung der KI-Kompetenz ihres Personals und weiterer in ihrem Auftrag handelnder Personen unterstützen. Seit dem 27. Juli 2026 muss die Organisation kein bestimmtes Kompetenzniveau einzelner Personen garantieren. Reines Bewusstsein ohne konkrete Maßnahme reicht trotzdem nicht.

## Regel 1: DSGVO (Datenschutz-Grundverordnung)

**Was:** Die EU-Verordnung zum Schutz personenbezogener Daten, seit 2018 in Kraft.

**Dein Job:** Personenbezogene Daten (Name, E-Mail, Adresse, Kontonummer, Mitarbeiter-ID) nicht ohne Rechtsgrundlage an Dritte weitergeben. OpenAI, Anthropic, Google sind Dritte.

**Für KI heißt das:**

- Kundennamen in Free-ChatGPT? Wahrscheinlich DSGVO-Verstoß (fehlender AVV).
- Bewerberdaten in Copilot ohne korrekte Einbindung? Verstoß.
- Mitarbeiter-Mails in externe Tools? Fast immer Verstoß.

**Bußgeld-Rahmen:** bis 20 Mio. Euro oder 4 Prozent des weltweiten Jahresumsatzes, je nachdem was höher ist.

## Regel 2: AVV (Auftragsverarbeitungsvertrag)

**Was:** Ein Vertrag zwischen deinem Unternehmen und einem Datenverarbeiter, Rechtsgrundlage Art. 28 DSGVO. OpenAI nennt das DPA (Data Processing Addendum), Anthropic ebenso.

**Der Deal:**

- Der KI-Anbieter verpflichtet sich, Daten nur nach Weisung zu verarbeiten.
- Er darf sie nicht für eigene Zwecke (z. B. Training) nutzen.
- Dein Unternehmen bleibt rechtlich verantwortlich.

**Für dich heißt das:**

- Unternehmen hat einen AVV mit dem Anbieter? Dann darfst du die Enterprise-Variante im Rahmen der Klassifizierung nutzen.
- Kein AVV? Dann nur Public-Daten, auch wenn der Kollege das anders macht.

Den AVV-Status kennen meist IT-Policy oder Compliance. Frag mit dieser Mail nach, statt zu raten:

> **Prompt-Vorlage:** Betreff: AVV-Status unserer KI-Tools
>
> Hallo [IT / Datenschutz / Compliance],
>
> ich nutze KI-Tools im Arbeitsalltag und möchte sichergehen, dass ich mich an unsere Vorgaben halte. Zwei kurze Fragen:
>
> 1. Haben wir einen Auftragsverarbeitungsvertrag (AVV / DPA) mit OpenAI, Anthropic oder Microsoft?
> 2. Seit wann läuft er, und für welche Produktvariante gilt er (z. B. ChatGPT Business, Copilot, Claude Team)?
>
> Damit weiß ich, welche Daten ich in welchem Tool eingeben darf. Danke dir.

## Regel 3: Shadow AI

**Was:** KI-Tools, die Kolleginnen und Kollegen ohne IT-Freigabe nutzen.

**Typisches Szenario:**

„Ich finde ein cooles Tool, `DataAnalyzerAI.com`. Ich lade meine Kundenliste hoch. Das Tool analysiert die Daten. Drei Monate später stellt die IT beim Audit fest, dass Kundendaten bei einem unbekannten Anbieter in den USA liegen."

Shadow AI ist eines der größten Governance-Risiken. Etwa jeder Zehnte nutzt KI ohne Wissen des Arbeitgebers, und rund vier von zehn Unternehmen vermuten private KI-Nutzung im Team (Bitkom 2025).

**Warum das ein Problem ist:**

- Der Anbieter sieht eure Kundendaten.
- Er speichert sie womöglich langfristig.
- Er nutzt sie eventuell für Modelltraining.
- Niemand im Unternehmen weiß, dass es passiert ist.

**Regel:** Nutze nur KI-Tools, die IT oder Compliance freigegeben hat. Schick der IT bei einem neuen Tool eine kurze Mail mit dem Link.

> **Achtung:** Hinter Shadow AI steckt fast nie böser Wille, die Leute wollen produktiv sein. Dagegen hilft eine klare Liste freigegebener Tools mit einem kurzen Weg, neue vorzuschlagen.

## Regel 4: EU AI Act, Artikel 4

Seit 2. Februar 2025 greift Artikel 4 der Verordnung (EU) 2024/1689. Anbieter und Betreiber von KI-Systemen müssen Maßnahmen ergreifen, die die Entwicklung der KI-Kompetenz ihres Personals und anderer in ihrem Auftrag handelnder Personen unterstützen. Die seit 27. Juli 2026 geltende Fassung verlangt nicht, dass ein bestimmtes individuelles Kompetenzniveau garantiert wird.

- **Wer ist betroffen?** Jeder, der KI im beruflichen Kontext nutzt, nicht nur KI-Entwickler.
- **Was ist zu berücksichtigen?** Vorwissen, Erfahrung, Ausbildung, Einsatzkontext sowie betroffene Personen oder Gruppen.
- **Wie dokumentieren?** Bedarf, gewählte Maßnahmen und deren Einbettung in den tatsächlichen Einsatz. Ein Kurs kann ein Baustein sein, ist aber kein automatischer Erfüllungsnachweis.

Ein eigener Bußgeldtatbestand nur für Art. 4 ist im EU-Sanktionskatalog nicht ausdrücklich ausgewiesen (Stand: 28. Juli 2026). Die Kommissions-FAQ nennt Anfang August 2026 für den Beginn der nationalen Aufsicht und Durchsetzung. Welche Maßnahme oder nationale Sanktion bei einem konkreten Art.-4-Verstoß greift, muss anhand des geltenden deutschen Rechts geprüft werden. Für andere, in Art. 99 ausdrücklich genannte Pflichtverletzungen gelten eigene Höchstbeträge.

> **Rechtlicher Hinweis:** Wenn dein Unternehmen einen Betriebsrat hat, ist ein KI-Tool-Rollout oft zustimmungspflichtig, Grundlage ist §87 BetrVG (Verhalten im Betrieb, Kontrolleinrichtungen). Klärt das früh, denn ein nachträgliches Einspruchsverfahren kostet Monate.

## Was heißt das praktisch?

- Personenbezogene Daten und Firmen-Confidential gehören nicht in Free-ChatGPT.
- Du nutzt nur freigegebene Tools und klärst neue vor der ersten Nutzung mit der IT.
- Du liest und befolgst die KI-Richtlinie des Unternehmens.
- Passwörter und API-Keys tippst du nirgendwo ein.
- „Ist ja klein" und „Andere tun das auch" sind keine Ausnahmen.

## Wer ist verantwortlich?

Du bist ein Glied der Kette:

- **Dein Unternehmen** ist primär verantwortlich für DSGVO und AVV, als verantwortliche Stelle nach Art. 4 DSGVO.
- **Geschäftsführung, Datenschutzbeauftragte, CISO** setzen Richtlinien und AVV-Prozesse auf.
- **Du** bist verantwortlich, diese Richtlinien einzuhalten, und bei Unsicherheit zu fragen, statt zu raten.

Fehlen diese Prozesse, sprich mit Compliance oder dem Datenschutzbeauftragten.

## Konsequenz-Beispiel

Was passiert konkret, wenn du einen Kundennamen in Free-ChatGPT tippst?

1. **DSGVO-Verstoß** durch fehlende Rechtsgrundlage (kein AVV).
2. **Mögliche Integration in Trainingsdaten**, falls Opt-out nicht aktiv gesetzt ist.
3. **Haftungsfrage bei einem späteren Datenleak**, dein Unternehmen muss beweisen, wer wann was eingegeben hat.

## Checkliste

- [ ] Ich kenne die DSGVO-Grundregel für personenbezogene Daten
- [ ] Ich weiß, was ein AVV (DPA) ist
- [ ] Ich kenne den AVV-Status meines Unternehmens für die wichtigsten KI-Tools
- [ ] Ich verstehe Shadow AI und meide es
- [ ] Ich kenne die KI-Richtlinie meines Unternehmens, oder habe aktiv nachgefragt

---

> **Navigation:** Im nächsten Kapitel geht es in die Praxis: E-Mails, Meetings, Berichte mit KI, und wo die Fallen lauern.
