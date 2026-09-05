# Die KI-Toolbox: auswählen statt sammeln

Eine Bestenliste für KI-Tools veraltet schneller, als du sie liest. Preise, Modellnamen und Limits ändern sich ständig. Was bleibt, ist die Methode, mit der du auswählst.

> **Prüfregel:** Preise und Funktionen kontrollierst du immer auf der offiziellen Produktseite. Bei Datenschutz und Sicherheit liest du zusätzlich die aktuellen Vertragsunterlagen, DPA/AVV, Unterauftragnehmerliste und technische Konfiguration. Standort, Zertifikat oder Herstellername beweisen für sich allein keine DSGVO-Konformität.

## Starte mit der Aufgabe

Erst die Aufgabe, dann das Tool. Formuliere vor der Suche einen Testsatz:

> Ich will **[konkrete Aufgabe]** mit **[zulässiger Datenklasse]** erledigen. Das Ergebnis ist gut, wenn **[messbares Kriterium]** erfüllt ist. Ein Mensch prüft **[kritische Punkte]** vor der Nutzung.

Beispiele:

- Fünf öffentliche Produkttexte in deutscher Sprache entwerfen; Fakten und Claims werden redaktionell geprüft.
- Ein freigegebenes Meeting transkribieren; Namen, Zahlen und Aufgaben werden mit der Aufnahme abgeglichen.
- Einen internen Workflow auslösen; jeder externe Schreibzugriff braucht eine Freigabe.

## Die sieben Prüffelder

| Prüffeld | Was du dokumentierst |
|----------|----------------------|
| **Aufgabenqualität** | Testmaterial, erwartetes Ergebnis, Fehlertypen und menschliche Review-Zeit |
| **Datenrolle** | Wer ist Verantwortlicher, Auftragsverarbeiter oder eigener Verantwortlicher? |
| **Vertrag** | Produktstufe, DPA/AVV, Standardvertragsklauseln, Unterauftragnehmer und Änderungsregeln |
| **Datenfluss** | Speicher- und Verarbeitungsorte, optionale Websuche, Integrationen, Supportzugriffe und Telemetrie |
| **Kontrollen** | Trainingseinstellungen, Aufbewahrung, Löschung, Export, Rollen, SSO und Protokolle |
| **Sicherheit** | Berechtigungen, Verschlüsselung, Schlüsselverwaltung, Updates, Backups und Incident-Prozess |
| **Kosten** | aktueller Grundpreis, nutzungsabhängige Kosten, Korrekturzeit, Betrieb und Exit-Aufwand |

Die Oberfläche sagt dir nichts.

Zwei Tarife desselben Anbieters können unterschiedliche Verträge und Datenkontrollen haben. Und ein Self-Hosted-Produkt bleibt ein System, das du absichern, aktualisieren und rechtmäßig betreiben musst.

## Allgemeine Assistenten

ChatGPT, Claude, Gemini, Microsoft 365 Copilot und Le Chat sind Beispiele für allgemeine Assistenten. Einen pauschalen Sieger gibt es nicht. Wähle mit demselben Testdatensatz.

Prüfe insbesondere:

- Verbraucherprodukt oder kommerzielles Arbeitskonto;
- aktuelle Trainings- und Feedbackeinstellungen;
- DPA/AVV und internationale Transfers;
- Aufbewahrung und Löschmöglichkeiten;
- Websuche, Connectors und andere optionale Datenflüsse;
- Berechtigungen auf angebundene Dateien und Systeme;
- Qualität bei deiner Sprache, Dokumentart und Fehlerklasse.

Anthropic dokumentiert zum Beispiel für Claude for Work und die API eine Auftragsverarbeiterrolle und standardmäßig keine Nutzung kommerzieller Kundendaten zum Modelltraining; Ausnahmen und Opt-ins stehen in den aktuellen Bedingungen. Das ist eine dokumentierte Produkteigenschaft, keine pauschale Freigabe für beliebige Daten. Für Verbraucherprodukte gelten andere Bedingungen.

Microsoft dokumentiert Microsoft 365 Copilot innerhalb der Microsoft-365-Dienstgrenze. Datenresidenz und optionale Transfers hängen trotzdem unter anderem von Tenant-Geografie, Produktbedingungen, Add-ons, Preferred Data Location und aktivierten Funktionen ab. Ein vorhandener M365-Tenant ist keine automatische Freigabe für vertrauliche Inhalte.

## Text und Recherche

Jasper, Copy.ai, DeepL Write und Neuroflash sind Beispiele für spezialisierte Textwerkzeuge. Perplexity und integrierte Websuche können Fundstellen liefern. Keines dieser Werkzeuge ersetzt die Primärquelle.

Teste:

1. drei typische Texte mit demselben Briefing;
2. Fehler bei Namen, Zahlen, Zitaten und Ton;
3. Zeit für Korrektur und Freigabe;
4. Export und Weiterverwendung;
5. aktuelle Verträge und Datenflüsse.

Für Gesetze, Fristen, Preise und Produktbedingungen führt der letzte Prüfschritt immer zur offiziellen Quelle.

## Bild, Audio und Video

Midjourney, Adobe Firefly, Canva und Bildfunktionen allgemeiner Assistenten unterscheiden sich bei Lizenzbedingungen, Trainingsdaten, Inhaltsnachweisen und Nutzungsrechten. Prüfe diese Punkte pro Produkt und Ausgabe. Ein Abonnement garantiert dir keine exklusiven Rechte.

Für Audio und Meetings kommen lokale Modelle wie OpenAI Whisper sowie Cloud-Dienste wie Otter, Fathom oder Amberscript infrage. Vor einer nichtöffentlichen Aufnahme müssen alle Teilnehmenden informiert werden und die Aufnahme muss befugt sein. § 201 StGB erfasst die unbefugte Aufnahme des nichtöffentlich gesprochenen Wortes.

Whispers Code und Modellgewichte stehen unter MIT-Lizenz und können lokal laufen. Lokal bedeutet hier: Die gewählte Kommandozeilen-Inferenz verarbeitet die Datei auf dem Gerät. Drittanbieter-Apps, Backups, Erweiterungen und Synchronisation prüfst du gesondert.

Bei Cloud-Transkription kontrollierst du zusätzlich Bot-Einwilligung, DPA/AVV, Speicher- und Verarbeitungsorte, Aufbewahrung, Trainingsnutzung, Unterauftragnehmer und Löschung. Begriffe wie „EU-Hosting“ oder „DSGVO-freundlich“ reichen nicht.

## Automation

Zapier, Make, n8n und Power Automate unterscheiden sich bei Integrationen, Betriebsmodell und Abrechnung. Vergleiche einen echten Workflow statt Marketingzahlen.

| Betriebsmodell | Vorteil | Verantwortung |
|----------------|---------|----------------|
| Managed Cloud | weniger eigener Betrieb | Anbieter prüfen, Vertrag und Datenflüsse kontrollieren |
| Self-hosted | mehr technische Kontrolle | Patches, HTTPS, Secrets, Backups, Logs und Zugriffe selbst betreiben |
| Lokale Automation | begrenzter externer Datenfluss | Gerät, Benutzerrechte, lokale Backups und Verfügbarkeit absichern |

Self-hosting macht einen Prozess nicht automatisch DSGVO-konform. Es verschiebt technische und organisatorische Verantwortung zu dir. Und der Hostinganbieter kann Auftragsverarbeiter sein.

## Buchhaltung und regulierte Daten

Bei Lexware Office, sevDesk, FastBill oder anderen Fachprodukten zählt nicht nur eine KI-Funktion. Prüfe E-Rechnungsformat, Aufbewahrung, Export, Rollen, Steuerberaterzugang und die aktuelle Herstellerdokumentation. Bei Gesundheits-, Mandats-, Personal- oder Finanzdaten gelten zusätzliche fach- und berufsrechtliche Grenzen. Keine Toolliste erteilt dir dafür eine Freigabe.

## Dein Auswahltest

1. Wähle genau eine wiederkehrende Aufgabe.
2. Erstelle drei repräsentative, zulässige Testfälle.
3. Definiere Qualitäts-, Datenschutz-, Sicherheits- und Kostenkriterien.
4. Teste höchstens zwei Produkte unter derselben Bedingung.
5. Dokumentiere Fehler und menschliche Korrekturzeit.
6. Prüfe offizielle Preise, Vertrag und Datenkontrollen am Entscheidungstag.
7. Lege Zweck, erlaubte Datenklassen, Verantwortliche und Review-Termin im KI-Inventar fest.

## Quartalsweiser Review

- Hat sich der Tarif oder Funktionsumfang geändert?
- Wurden DPA/AVV, Unterauftragnehmer oder Speicherorte geändert?
- Sind neue Integrationen oder Datenflüsse aktiviert?
- Funktionieren Export und Löschung noch?
- Erfüllt das Produkt den gemessenen Zweck weiterhin?
- Gibt es einen einfacheren Exit?

Die beste Toolbox ist nicht die längste. Sie besteht aus wenigen freigegebenen Werkzeugen, deren Zweck, Datenfluss, Vertrag, Kosten und Ausstieg du erklären kannst.
