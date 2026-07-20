# DSGVO, Verträge, Steuern: KI im rechtlichen Rahmen

Artikel 4 der EU-KI-Verordnung gilt seit 2. Februar 2025. Nicht seit gestern. Seit über einem Jahr.

Er betrifft auch dich. Ja, dich, die Freelancerin mit dem Einzelunternehmen. Auch wenn du nur ChatGPT für E-Mails nutzt.

Das Risiko für die meisten Selbstständigen ist überschaubar. "Überschaubar" heißt aber nicht "null". Und Unwissenheit schützt bekanntlich vor Strafe nicht, auch nicht vor KI-Strafen.

Dieses Kapitel zeigt die Prüffelder. Es ersetzt weder den aktuellen Gesetzestext noch eine Einzelfallprüfung.

> **Rechtlicher Hinweis:** Dieses Kapitel gibt allgemeine Orientierung, keine Rechtsberatung im Sinne des Rechtsdienstleistungsgesetzes (RDG). Für deine individuelle Situation konsultiere einen Fachanwalt oder Datenschutzbeauftragten. Rechtsstand der überprüften AI-Act-Angaben: 14. Juli 2026.

> **Wissens-Vertiefung: KI-Führerschein**
>
> Du willst tiefer einsteigen? Der **KI-Führerschein** ist ein kostenloser 5-Block-Kurs bei loehrning.ai, der alle regulatorischen Anforderungen detailliert behandelt:
> 
> - **Block 1:** Entdeckung, wo du KI bereits nutzt
> - **Block 2:** Datenschutz, DSGVO und deine Daten (★ wichtig für dieses Kapitel)
> - **Block 3:** Anwendung, praktische KI-Tools
> - **Block 4:** Verifikation, wie du KI-Fehler erkennst
> - **Block 5:** Richtlinie, wie du KI im Unternehmen verantwortungsvoll einsetzt
>
> **Kursdauer:** 5 × 30 Minuten + Praxisübungen
> **Abschluss:** Der Kurs dokumentiert deinen Lernfortschritt. Ein plattformeigener Nachweis ist kein behördliches Zertifikat und belegt allein keine organisationsbezogene Erfüllung von Art. 4.
> **URL:** /ki-fuehrerschein
>
> Für Selbstständige ist Block 2 die Grundlage für die Datenschutzprüfung dieser Anleitung.

## DSGVO und KI: was darfst du?

Bei Apple habe ich Privacy by Design gelernt. Nicht als Konzept. Als Praxis.

Bei Apple war Datenklassifizierung Pflicht, Public, Internal, Confidential, Restricted, ab Tag 1. In meinem ersten Projekt dort wollte ich Nutzerdaten für ein ML-Modell verwenden, aggregiert, anonymisiert, harmlos, dachte ich. Mein Lead hat den Antrag zurückgeschickt. Dreimal. Nicht weil die Daten problematisch waren, sondern weil die Dokumentation nicht lückenlos nachweisen konnte, dass sie es nicht sind. Ich war frustriert. Und dann habe ich verstanden: Datenschutz ist kein Hindernis. Gute Hygiene, egal ob mit KI oder ohne.

Als Freelancer denkst du vielleicht: Apple hat eine ganze Datenschutzabteilung. Ich habe mich. Stimmt. Aber die gute Nachricht: Dein Risiko ist kleiner, und die Regeln sind einfacher. Das Prinzip bleibt dasselbe.

**Was du nicht ohne dokumentierte Freigabe in KI-Tools eingeben solltest:**

Das haben wir in Kapitel 2 angerissen. Hier die vollständige Liste:

1. **Personenbezogene Daten deiner Kunden:** Namen, Adressen, Telefonnummern, E-Mail-Adressen
2. **Gesundheitsdaten:** besonders relevant für Therapeuten, Coaches, Heilpraktiker (DSGVO Art. 9)
3. **Finanzdaten:** Kontonummern, Steuerbescheide, Gehaltsabrechnungen
4. **Vertrauliche Geschäftsinformationen:** Verträge mit echten Firmennamen und Beträgen
5. **Inhalte unter NDA:** Alles, was du unter Geheimhaltung erhalten hast

Eine risikomindernde Maßnahme ist Pseudonymisierung: "Kunde A, mittelständisches Unternehmen im Maschinenbau" statt eines echten Namens. Pseudonymisierte Daten bleiben nach DSGVO personenbezogen. Kombinationen aus Branche, Ort, Umsatz oder Alter können Personen oder Unternehmen weiterhin identifizierbar machen. Datenminimierung, Zweck, Rechtsgrundlage, Vertrag und Zugriffsschutz bleiben zu prüfen.

> **Rechtlicher Hinweis:** Art. 28 DSGVO verlangt einen Auftragsverarbeitungsvertrag (AVV), wenn ein Anbieter personenbezogene Daten in deinem Auftrag verarbeitet. Ob ein KI-Anbieter Auftragsverarbeiter, eigener Verantwortlicher oder in verschiedenen Funktionen tätig ist, hängt von Produkt, Zweck und Vertrag ab.

**Brauchst du einen Auftragsverarbeitungsvertrag (AVV)?**

Kurze Antwort: Zuerst die Rollen bestimmen. Verarbeitet der Anbieter personenbezogene Daten in deinem Auftrag, brauchst du grundsätzlich die Anforderungen aus Art. 28 DSGVO. Daneben bleiben Rechtsgrundlage, Transparenz, Drittlandtransfer, Sicherheit und gegebenenfalls eine Folgenabschätzung eigenständige Prüfungen.

OpenAI und Anthropic veröffentlichen Vertragsunterlagen für bestimmte kommerzielle Produkte. Anthropic bindet nach eigener Dokumentation ein DPA mit Standardvertragsklauseln in seine Commercial Terms ein. Prüfe immer die tatsächlich verwendete Produktstufe, das Datum der Bedingungen, Rollen, Unterauftragnehmer, Transfers und mögliche Opt-ins. Das Ablegen eines DPA allein macht den Prozess nicht zulässig.

**Kommerziell vs. Consumer:** Vertrags- und Datenkontrollen unterscheiden sich nach Anbieter und Produktstufe. Anthropic dokumentiert für Claude for Work und die API standardmäßig keine Nutzung kommerzieller Kundendaten zum Modelltraining, außer bei bestimmten Opt-ins oder übermitteltem Feedback; Verbraucherprodukte folgen anderen Regeln. Prüfe diese Regeln am Entscheidungstag. Kein Tarif ersetzt die Freigabe einer konkreten Datenklasse.

**Datenschutzerklärung prüfen:** Verarbeitet eine Website-Funktion personenbezogene Daten, müssen die Informationen nach Art. 13 beziehungsweise 14 DSGVO den tatsächlichen Prozess abbilden: Zwecke, Daten, Empfänger, Rechtsgrundlage, Speicherdauer und gegebenenfalls Transfers. Server- und Verarbeitungsorte werden aus der aktuellen Konfiguration und den Anbieterunterlagen ermittelt, nicht pauschal angenommen.

> **KRAFT-Prompt: DSGVO-Check**
>
> Wichtig: Verwende für diesen Check keine echten Kundendaten, das wäre genau das Problem, das du prüfen willst. Nutze fiktive Beispiele oder beschreibe deine Prozesse allgemein.
>
> ```
> Kontext: Ich bin [BERUF] mit einem Einzelunternehmen in Deutschland.
> Ich nutze [TOOL] für [AUFGABEN]. Auf meiner Website nutze ich
> [KI-FEATURES, z.B. keinen Chatbot / einen Chatbot].
> Rolle: Du bist ein Datenschutz-Berater (KEINE Rechtsberatung).
> Aufgabe: Prüfe meine KI-Nutzung auf DSGVO-Risiken.
> Was muss ich in meiner Datenschutzerklärung ergänzen?
> Brauche ich einen AVV?
> Format: Checkliste mit Ja/Nein/Prüfen pro Punkt.
> Ton: Sachlich, verständlich, pragmatisch.
> ```

> **DSGVO-Checkliste für Selbstständige, die KI nutzen**
>
> - [ ] Training Opt-Out bei ChatGPT aktiviert
> - [ ] Getrennte Accounts für Business und Privat
> - [ ] Keine personenbezogenen Kundendaten in KI-Tools
> - [ ] Anonymisierungs-Workflow etabliert
> - [ ] AVV mit KI-Anbieter abgeschlossen (wenn Kundendaten verarbeitet werden)
> - [ ] Datenschutzerklärung aktualisiert (wenn KI auf Website)
> - [ ] Verarbeitungsverzeichnis ergänzt
> - [ ] Team/Mitarbeiter informiert (wenn vorhanden)
> - [ ] Regelmäßige Prüfung: Welche Daten gehen in welche Tools?
> - [ ] Dokumentation: Welche KI-Tools nutze ich wofür?

Belastbar ist nicht der Satz "DSGVO-konform", sondern eine nachprüfbare Beschreibung: freigegebene Zwecke und Datenklassen, Rollen und Rechtsgrundlagen, Verträge, Transfers, Zugriffskontrollen, Löschfristen und ein dokumentierter Review. Ein AVV und Pseudonymisierung sind Teile dieser Prüfung, keine Pauschalgarantie.

## EU AI Act: betrifft dich das?

Die Verordnung (EU) 2024/1689, der AI Act, ist seit 1. August 2024 in Kraft. Artikel 4 (KI-Kompetenz) und Artikel 5 (verbotene Praktiken) gelten seit 2. Februar 2025. Was bedeutet das für dich?

Kurze Antwort: Mehr als du denkst. Weniger als du befürchtest.

> **Rechtlicher Hinweis:** Art. 4 AI Act verlangt von Anbietern und Betreibern angemessene Maßnahmen für ausreichende KI-Kompetenz ihres Personals und anderer Personen, die in ihrem Auftrag mit den Systemen arbeiten. Maßstab sind Wissen, Erfahrung, Einsatzkontext und betroffene Personen. Die EU-Kommission stellt klar: Es gibt weder ein vorgeschriebenes Einheitsformat noch ein erforderliches Zertifikat. Solo-Selbstständige sollten ihre eigene Nutzung und angemessene Lern- und Kontrollmaßnahmen dokumentieren, statt einen Kursnachweis als automatische Erfüllung auszugeben.

### Wo steht Deutschland? Die Aufsichtsbehörden

Der Bundestag beschloss das KI-Marktüberwachungs- und Innovationsförderungsgesetz am 11. Juni 2026. Nach dem Bundesratsdurchgang am 10. Juli kann es ausgefertigt und verkündet werden. Am 14. Juli 2026 war die Verkündung noch abzuwarten. Das beschlossene Gesetz weist der Bundesnetzagentur eine zentrale Rolle zu, soweit keine Fachbehörde zuständig ist. Für einen konkreten Fall muss deshalb die Zuständigkeit nach dem verkündeten Gesetz und dem jeweiligen Fachrecht geprüft werden.

| Behörde | Zuständigkeit |
|---------|---------------|
| **Bundesnetzagentur (BNetzA)** | nach dem beschlossenen KI-MIG zentrale Anlaufstelle und Marktüberwachung, soweit keine Fachbehörde zuständig ist; Verkündung und Wirksamkeit prüfen |
| **Sektorale Marktüberwachung** | Zuständigkeit kann insbesondere aus Finanz-, Medizinprodukt-, Datenschutz- oder anderem Fachrecht folgen; die konkrete Behörde fallbezogen prüfen |

Für dich heißt das: Einzelne AI-Act-Pflichten gelten bereits, weitere greifen nach dem gesetzlichen Zeitplan. Prüfe für Beschwerden und Meldungen die aktuell veröffentlichte Zuständigkeit; die BNetzA ist nicht automatisch für jeden Sektor und jeden Vorgang die alleinige Stelle.

### August 2026: Die nächste Deadline

Am **2. August 2026** greifen weitere allgemeine Anwendungspunkte des AI Act, darunter Art. 50. Die Transparenzpflichten unterscheiden zwischen Anbieterpflichten zur maschinenlesbaren Markierung und Betreiberpflichten, etwa bei direkter Interaktion, Deepfakes oder bestimmten Texten zu Angelegenheiten von öffentlichem Interesse. Sie sind keine pauschale Kennzeichnungspflicht für jedes KI-unterstützte Werk. Parlament und Rat beschlossen mit dem AI Omnibus den **2. Dezember 2027** für eigenständige Anhang-III-Systeme und den **2. August 2028** für produktintegrierte Anhang-I-Systeme. Am 14. Juli 2026 war die Änderungsverordnung noch nicht im Amtsblatt veröffentlicht; bis zu ihrem Inkrafttreten muss der ursprüngliche Verordnungstext von dem beschlossenen neuen Zeitplan getrennt betrachtet werden.

Die Bußgelder sind kein Spaß:

| Verstoß | Maximalstrafe |
|---------|---------------|
| Verbotene KI-Praktiken (Art. 5) | 35 Mio. EUR oder 7% Weltumsatz |
| Hochrisiko-Pflichten verletzen | 15 Mio. EUR oder 3% Weltumsatz |
| Falsche/unvollständige Angaben | 7,5 Mio. EUR oder 1% Weltumsatz |

Gewöhnliche Unterstützung beim Formulieren von E-Mails oder Angeboten ist regelmäßig kein Anhang-III-Hochrisiko-Fall. Art. 4, Datenschutz, Geheimhaltung, Urheber- und Wettbewerbsrecht können trotzdem relevant bleiben. Eine Risikoklasse wird nach System, Zweck und Einsatzkontext bestimmt, nicht nach dem Produktnamen.

**Rollenprüfung:** Betreiber ist, wer ein KI-System unter eigener Verantwortung verwendet, außer bei rein persönlicher, nicht beruflicher Tätigkeit. Welche Pflichten greifen, hängt zusätzlich von Risikoklasse und Use Case ab. Ein FAQ-Chatbot, Bewerberauswahl und ein eigenes Bewertungssystem sind deshalb getrennt zu klassifizieren.

### Die Bewusstseinslücke (und deine Chance)

Typisch bei neuer Regulierung: Die Bekanntheit hinkt den Pflichten hinterher. Die DSGVO hat 2018 gezeigt, was passiert, wenn Regulierung auf Unwissenheit trifft: Panik, überteuerte Berater, Schnellschüsse. Beim AI Act passiert gerade dasselbe, in Zeitlupe.

Für dich als Freelancer bedeutet das zwei Dinge:

**Erstens:** Du liest gerade dieses Buch. Damit bist du weiter als die meisten Selbstständigen. Das ist kein Marketingspruch, das ist Empirie.

**Zweitens:** Bei Kunden in regulierten Branchen können dokumentierte, rollen- und risikogerechte Lernmaßnahmen relevant sein. Du kannst solche Maßnahmen unterstützen. Du selbst, ein einzelner Kurs oder ein Zertifikat bist jedoch nicht automatisch der gesetzliche Nachweis für die Organisation.

### Compliance als echtes Geschäftsargument

Der Markt für KI-Compliance-Beratung wächst. Viele Unternehmen brauchen externe Hilfe beim AI Act. Das ist kein Hindernis. Das ist ein Geschäftsmodell.

Positioniere dich mit überprüfbaren Aussagen: "Meine KI-Nutzung ist nach Zweck und Datenklasse dokumentiert; Verträge, Datenflüsse und Kontrollen werden regelmäßig geprüft." Vermeide die pauschale Behauptung, ein Tool oder der gesamte Prozess sei "datenschutzkonform", solange Umfang und Nachweise nicht benannt sind.

### Kennzeichnung von KI-Content

Ab 2. August 2026 verlangt Art. 50 in bestimmten Fällen technische Markierung oder sichtbare Offenlegung. Welche Pflicht greift, hängt von Rolle, System und Inhalt ab.

| Use Case | Art.-50-Prüfung | Konsequenz |
|----------|-----------------|------------|
| Chatbot mit direkter Interaktion | Art. 50 Abs. 1; Ausnahme, wenn KI-Natur für eine informierte Person offensichtlich ist | spätestens bei erster Interaktion klar informieren, sofern keine Ausnahme greift |
| Deepfake von Personen, Orten, Objekten oder Ereignissen | Art. 50 Abs. 4 | künstlichen Ursprung klar offenlegen; Sonderregel für erkennbar künstlerische oder satirische Werke beachten |
| KI-generierter Text zu einer Angelegenheit von öffentlichem Interesse | Art. 50 Abs. 4 | offenlegen, außer bei menschlicher Prüfung oder redaktioneller Kontrolle und benannter redaktioneller Verantwortung |
| Sonstiger KI-unterstützter Blogpost oder Kundenangebot | keine pauschale Art.-50-Kennzeichnung allein wegen KI-Unterstützung | konkrete Darstellung, andere Transparenzpflichten und Irreführungsrisiken prüfen |
| Synthetische Audio-, Bild-, Video- oder Textausgabe | Anbieterpflicht nach Art. 50 Abs. 2 zur maschinenlesbaren Markierung | nicht mit der gesonderten Offenlegungspflicht des veröffentlichenden Betreibers verwechseln |

> **Rechtlicher Hinweis:** Ob Werbung mit Begriffen wie "handgefertigt" oder "persönlich geschrieben" bei KI-Unterstützung irreführend ist, hängt vom Verständnis der angesprochenen Verbraucher und vom tatsächlichen Herstellungsprozess ab. Keine pauschale Rechtssicherheit aus einer freiwilligen Kennzeichnung ableiten.

Eine freiwillige Formulierung wie "Dieser Text wurde mit KI-Unterstützung erstellt und redaktionell geprüft" kann Transparenz schaffen, wenn sie stimmt. Sie ersetzt keine Prüfung der konkret anwendbaren Pflichten und schützt nicht pauschal vor künftigen Regeländerungen.

### Reglementierte Berufe: Warum §203 StGB und KI nicht zusammenpassen

Wenn du Rechtsanwalt, Steuerberater, Arzt, Psychotherapeut oder Heilpraktiker bist, hast du ein Problem, das andere Freelancer nicht haben: §203 StGB. Verletzung von Privatgeheimnissen. Straftat. Nicht Ordnungswidrigkeit, Straftat.

> **Rechtlicher Hinweis:** §203 StGB stellt die Offenbarung fremder Geheimnisse unter Strafe. Die Übertragung mandanten- oder patientenbezogener Daten in Cloud-KI-Systeme ohne ausreichende vertragliche und technische Absicherung kann diesen Tatbestand erfüllen.

Die Eingabe mandanten- oder patientenbezogener Daten in einen Cloud-Dienst kann Verschwiegenheits-, Datenschutz- und Berufsrecht verletzen, wenn Befugnis, Vertrag und technische Schutzmaßnahmen fehlen. Prüfe das konkrete Produkt, Speicher- und Verarbeitungsorte, Zugriffe, Transfers und berufsrechtliche Vorgaben; pauschale Länderannahmen reichen nicht.

Spezialisierte Legal-AI-Angebote können andere Betriebs- und Vertragsmodelle bieten. Auch dort müssen Kanzlei, Berufsgeheimnisträger und Datenschutzverantwortliche die konkrete Konfiguration prüfen. Ein europäischer Anbieter oder Hostingort erteilt keine automatische Freigabe für Mandantendaten.

Was für Kanzleien gilt, gilt auch für dich als Freiberufler mit Schweigepflicht. Deine Optionen:

1. **Anonymisieren:** konsequent und auf Re-Identifizierbarkeit prüfen. Nutze für Übungen vollständig fiktive Angaben wie „Fall Alpha, erwachsene Person, allgemeine zivilrechtliche Fragestellung" statt realistisch kombinierter Namen, Orte und Verfahrensdetails.
2. **Lokale KI prüfen:** Eine vollständig lokale, abgesicherte Konfiguration kann externe Datenflüsse reduzieren. Updates, Telemetrie, Erweiterungen, Backups, Zugriffe und das Endgerät bleiben Teil der Prüfung.
3. **Spezialisierte Tools prüfen:** Branchenlösung, Vertrag, Hosting, Unterauftragnehmer, Zugriffsmodell und berufsrechtliche Freigabe zusammen bewerten. Weder "EU" noch "AVV" allein genügt.

Lass deine KI-Nutzung von deiner Kammer oder einem Fachanwalt prüfen. 500 EUR Beratungshonorar sind billiger als ein Strafverfahren.

## Urheberrecht: Was ist am KI-Output geschützt?

Kurze Antwort: Das hängt vom menschlichen Schöpfungsanteil, dem konkreten Ergebnis, den Nutzungsbedingungen und möglichen Rechten Dritter ab.

> **Rechtlicher Hinweis:** § 2 Abs. 2 UrhG verlangt für ein geschütztes Werk eine persönliche geistige Schöpfung. Bei rein maschinell erzeugten Bestandteilen kann dieser menschliche Beitrag fehlen. Daraus folgt aber weder automatisch freie Nutzbarkeit noch die Abwesenheit fremder Rechte oder vertraglicher Beschränkungen.

Für dich heißt das drei Dinge:

1. **Kommerzielle Nutzung prüfen:** Nutzungsbedingungen, Rechte Dritter, Marken, Persönlichkeitsrechte, Open-Source-Lizenzen und den konkreten Output kontrollieren.
2. **Menschlichen Beitrag dokumentieren:** Auswahl, Gestaltung und Bearbeitung können relevant sein; bloßer Aufwand oder viele Prompt-Schritte garantieren keinen Schutz.
3. **Sag es deinen Kunden ehrlich**, wenn du reinen KI-Output lieferst und der Kunde Exklusivität braucht, kläre das vorab. Sonst ist es ein Konflikt, der später aufkommt.

## Impressum und Website-Pflichten

Seit Mai 2024 steht die allgemeine Anbieterkennzeichnung in § 5 Digitale-Dienste-Gesetz (DDG), nicht mehr im TMG. Ob und welche Angaben eine Website oder ein geschäftliches Social-Media-Profil benötigt, hängt vom konkreten Dienst und weiteren Fachregeln ab. Prüfe Erreichbarkeit, Vollständigkeit und Aktualität der Anbieterinformationen.

Wenn du KI-Chatbots oder KI-Formularauswertung auf deiner Website hast, gehört das in die Datenschutzerklärung. Wer die Daten verarbeitet (z.B. OpenAI), wo die Server stehen, auf welcher Rechtsgrundlage.

## Werbung mit KI, was du sagen darfst

> **Rechtlicher Hinweis:** Das UWG verbietet irreführende geschäftliche Handlungen. Ob eine Aussage wie "handgemacht" oder "persönlich geschrieben" bei KI-Unterstützung irreführt, wird nach konkreter Aussage, Herstellungsprozess und Verkehrsverständnis beurteilt.

Was du sagen darfst:

- "Mit KI-Unterstützung erstellt und von mir geprüft", ehrlich und korrekt
- "Individuell für dich formuliert", wenn du substantiell editierst, ja
- "Kuratiert und freigegeben von Tim Löhr", wenn das stimmt

Was du nicht sagen solltest:

- "Handgeschrieben, jeder Text ein Unikat", bei KI-Output zweifelhaft
- "100 Prozent menschlich", wenn KI den Entwurf gemacht hat, falsch

Der paradoxe Punkt: Ehrliche KI-Kommunikation ist ein Verkaufsargument. "Ich nutze KI für Recherche und Struktur, die Schöpfung bleibt bei mir" wirkt professioneller als verschleierte KI-Nutzung, die irgendwann auffliegt.

## Verträge und AGB mit KI-Unterstützung

KI kann Verträge analysieren und Entwürfe erstellen. Aber sie kann keine Rechtsberatung leisten. Diesen Unterschied musst du kennen, und respektieren.

**Was KI kann:**
- Vertragsentwürfe als Ausgangspunkt erstellen
- Bestehende Verträge zusammenfassen und erklären
- Ungewöhnliche Klauseln identifizieren
- AGB-Entwürfe generieren

**Was KI nicht kann:**
- Verbindliche Rechtsberatung geben
- Garantieren, dass ein Vertrag rechtssicher ist
- Aktuelle Rechtsprechung zuverlässig kennen
- Dein spezifisches Risikoprofil einschätzen

Die goldene Regel: KI für den Entwurf. Anwalt für die Prüfung.

Plane für rechtlich relevante Vertragswerke eine fachkundige Prüfung ein. Kosten und Umfang hängen von Geschäftsmodell, Klauseln und Beratungsbedarf ab; pauschale Beträge sind keine belastbare Entscheidungsgrundlage.

```
Kontext: Ich bin [BERUF] mit einem Einzelunternehmen. Ich brauche
AGB für meine Dienstleistungen. Kunden: [ZIELGRUPPE]. Typischer
Projektumfang: [BESCHREIBUNG]. Zahlungsziel: [TAGE] Tage.
Rolle: Du bist ein juristisch geschulter Assistent
(KEINE Rechtsberatung).
Aufgabe: Erstelle einen AGB-Entwurf für meine Dienstleistungen.
Berücksichtige: Leistungsumfang, Vergütung, Zahlungsbedingungen,
Haftung, Kündigung, Gewährleistung, Gerichtsstand.
Format: Nummerierte Paragraphen. Verständliche Sprache.
Ton: Juristisch korrekt, aber nicht unlesbar.
```

Ergebnis: Ein Entwurf, den du deinem Anwalt zeigst. Nicht deinem Kunden. Erst nach der juristischen Prüfung.

## Steuern und Betriebsausgaben

Kosten für KI-Tools können Betriebsausgaben sein, soweit sie betrieblich veranlasst sind. Bei gemischter Nutzung ist nur der betriebliche beziehungsweise berufliche Anteil anzusetzen; Zuordnung und Nachweise mit der aktuellen steuerlichen Behandlung abstimmen.

| Ausgabe | Steuerlich prüfen | Mögliche Zuordnung |
|---------|-------------------|--------------------|
| KI-Software-Abonnement | betrieblicher Zweck und privater Anteil | Software/Lizenzen |
| KI-Weiterbildung | beruflicher Zusammenhang | Fortbildung |
| Hardware für lokale KI | Nutzung, Zuordnung und Abschreibungsregeln | Anlagevermögen/AfA oder laufender Aufwand |

Bei gemischter Nutzung dokumentierst du eine nachvollziehbare Aufteilung. Die amtliche Anlage EÜR weist darauf hin, dass bei gemischten Aufwendungen nur der betrieblich oder beruflich veranlasste Anteil anzusetzen ist. Welche Aufzeichnung genügt, klärst du für deinen Fall mit aktueller BMF-Hilfe oder Steuerberatung.

Dein Steuerberater wird sich freuen. Ordentliche Dokumentation ist das, was ihn nachts ruhig schlafen lässt.

> **Checkliste: KI rechtskonform nutzen**
>
> - [ ] DSGVO-Checkliste abgearbeitet (siehe „DSGVO und KI: was darfst du?")
> - [ ] EU AI Act Artikel 4: angemessene, rollen- und risikogerechte Maßnahmen dokumentiert; dieses Buch allein ist kein Nachweis
> - [ ] Kennzeichnung: Strategie für Art. 50 (ab August 2026) festgelegt
> - [ ] Urheberrecht: Geklärt, was du Kunden lieferst (reiner KI-Output vs. bearbeitet)
> - [ ] Impressum und Datenschutzerklärung: KI-Tools erwähnt
> - [ ] Verträge/AGB: Von Anwalt geprüft
> - [ ] Betriebsausgaben: KI-Tools dokumentiert
> - [ ] Anonymisierung: Workflow bei jedem KI-Einsatz mit Kundendaten

> **Jetzt bist du dran:** Dein Compliance-Check in 30 Minuten
>
> 1. Prüfe pro Produktstufe die aktuellen Trainings-, Feedback- und Aufbewahrungseinstellungen.
> 2. Trenne betriebliche und private Konten, Berechtigungen und Daten.
> 3. Gleiche Datenschutzerklärung und Verzeichnis der Verarbeitungstätigkeiten mit dem tatsächlichen Prozess ab.
> 4. Prüfe Rollen, DPA/AVV, Unterauftragnehmer und Transfers für die tatsächlich verwendete Produktstufe.
> 5. Erstelle ein Dokument: "Welche KI-Tools nutze ich für welchen Zweck und welche Datenklasse?"
> 6. Prüfe Anbieterinformationen nach § 5 DDG und weitere branchenspezifische Pflichten.
>
> Das Ergebnis ist eine offene Prüfliste, kein Compliance-Zertifikat. Dokumentiere ungeklärte Punkte und stoppe sensible Verarbeitung bis zur Freigabe.

---

Das ist kein Rechtsrat. Der erforderliche Prüfungsumfang hängt von Tätigkeit, Daten, Rolle und System ab. Wer in einer reglementierten Branche arbeitet, klärt die Nutzung zusätzlich mit Kammer, Datenschutzbeauftragten oder fachkundiger Rechtsberatung.

> **Zeitgewinn-Tracker**
>
> | Dieses Kapitel | Kumuliert |
> |---|---|
> | Kein pauschaler Zeitgewinn | Rechtliche Prüfung ist Qualitäts- und Risikokontrolle |
> | Gegenwert | Im eigenen Prozess messen |
> | Toolkosten | Aktuelle Anbieterpreise und Beratungskosten separat prüfen |

Abgesichert. Mach das. Heute.
