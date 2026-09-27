# Automatisierung: Abläufe kontrolliert ausführen

In den ersten 9 Kapiteln hast du jeden Prompt von Hand eingegeben. Jeder Schritt, den du wöchentlich von Hand wiederholst, ist ein Automatisierungskandidat. Was bei dir technisch, wirtschaftlich und rechtlich automatisierbar ist, sagt kein allgemeiner Studienwert. Miss deinen eigenen Prozess und beginne mit einem begrenzten Pilot.

Low-Code- und No-Code-Plattformen wie Zapier, Make und n8n verbinden solche Abläufe. Auch ohne klassische Programmierung brauchst du Kenntnisse zu Datenflüssen, Berechtigungen, Fehlerbehandlung, Tests und Betrieb.

**Fiktives Referenzmuster:** Eine Kontaktanfrage wird nach dokumentierten Regeln kategorisiert, ein Antwortentwurf vorbereitet und ein Review-Eintrag angelegt. Kein Kontakt wird automatisch angeschrieben oder ohne Rechtsgrundlage in ein CRM übernommen. Fehler, Ausfälle und falsche Klassifikationen musst du überwachen.

## Was sich automatisieren lässt (und was nicht)

Das Grundprinzip jeder Automation ist simpel:

**Trigger** → **Aktion** → **Ergebnis**

Trigger: Eine Mail kommt rein, ein Formular wird ausgefüllt, ein Termin steht an oder eine Rechnung wird fällig.

Aktion: Das System kategorisiert, fasst zusammen oder erstellt einen internen Entwurf. Schreibende oder externe Aktionen brauchen eine gesonderte Freigabe und technische Grenze.

Ergebnis: Du hast weniger zu tun, bessere Ergebnisse oder beides.

Eine Automation läuft zeitgesteuert oder ereignisbasiert. Sie kann trotzdem ausfallen, Daten doppelt verarbeiten, falsche Ergebnisse erzeugen oder Zugriffsrechte verlieren. Monitoring, Wiederholbarkeit, Idempotenz, Alarmierung und ein manueller Rückfallweg gehören ins Design.

**Was sich als begrenzter Pilot eignen kann:**
- E-Mail-Triage und Entwürfe für Standardantworten
- Social-Media-Entwürfe nach einem Redaktionsplan
- Kontaktanfragen → regelgebundene interne Kategorisierung → Antwortentwurf
- Fälligkeitsdaten → interner Erinnerungsvorschlag
- Meeting-Zusammenfassungen (Transkript → strukturiertes Protokoll)
- Wöchentliche Reports (Daten sammeln → KI-Zusammenfassung → E-Mail an dich)

**Was nicht autonom entschieden oder veröffentlicht werden sollte:**
- Kreative Entscheidungen
- Vertrauensaufbau mit Kunden
- Preisverhandlungen
- Qualitätskontrolle (jemand muss prüfen)
- Strategische Weichenstellungen

> **KRAFT-Prompt: Automatisierungspotenzial analysieren**
>
> ```
> Kontext: Ich bin [BERUF] und mache folgende Aufgaben regelmäßig:
> [AUFGABENLISTE MIT HÄUFIGKEIT].
> Rolle: Du bist ein Automatisierungsberater für Freelancer.
> Aufgabe: Identifiziere die 5 Aufgaben, die sich am besten
> automatisieren lassen. Bewerte nach: Häufigkeit, Zeitaufwand,
> Komplexität, Fehleranfälligkeit.
> Format: Tabelle + Empfehlung pro Aufgabe.
> Ton: Pragmatisch, realistisch.
> ```

## Zapier, Make und die No-Code-Revolution

Diese Tools verbinden Trigger und Aktionen per Drag-and-Drop.

**Zapier** bietet viele vorgefertigte Integrationen. Prüfe den aktuellen Tarif, unterstützte Aktionen, Datenregionen, Limits und Kosten für dein reales Volumen.

**Make** bietet visuell modellierte Workflows. Ob es günstiger oder geeigneter ist, hängt von Operationen, Datenvolumen, Fehlerpfaden, benötigten Integrationen und Vertrag ab.

**n8n:** Open Source, selbst gehostet oder als Cloud-Dienst verfügbar. Beim Self-Hosting kontrollierst du die n8n-Instanz und ihre Datenbank, aber angebundene Dienste, Telemetrie, Backups, Logs und Modell-APIs können Daten weiterhin an andere Regionen oder Anbieter übertragen. Eine EU-Hostingregion macht einen Workflow nicht automatisch DSGVO-konform. Dokumentiere jeden Datenfluss, schließe erforderliche Verträge und prüfe Aufbewahrung, Zugriffe und Unterauftragnehmer.

**Die Lernkurve hängt vom Risiko ab:** Ein ungefährlicher Testworkflow ist schneller gebaut als ein Prozess mit Kunden-, Finanz- oder Gesundheitsdaten. Plane Zeit für Rechtekonzept, Tests, Monitoring, Dokumentation und Wiederherstellung ein.

**Preisprüfung:** Tarife und Zählweisen ändern sich. Rechne vor einem Jahresvertrag drei Volumenszenarien durch und berücksichtige Operationen, Wiederholungen, Speicher, Netzwerk, Modell-API, Hosting, Backups, Wartung und Arbeitszeit. Self-Hosting ist nicht automatisch günstiger.

Das Prinzip ist bei allen gleich: Du wählst einen Trigger (z.B. "Neue E-Mail in Gmail"), definierst eine Aktion (z.B. "Sende den Inhalt an ChatGPT API"), und bestimmst, was mit dem Ergebnis passiert (z.B. "Speichere die Antwort in Google Sheets und sende mir eine Slack-Nachricht").

| Tool-Kategorie | Vor Auswahl prüfen | Typischer Betriebsaufwand |
|------|----------|---------|
| Gehostete Integrationsplattform | Konnektoren, Zählweise, Datenregion, Vertrag | Konfiguration, Monitoring, Fehlerbehandlung |
| Self-Hosted Workflow-Engine | Lizenz, Updates, Infrastruktur, Backups, Sicherheit | Betrieb, Patches, Kapazität, Notfallplan |
| Plattformgebundene Automation | Bestehende Lizenzen, Mandant, Rechte, Lock-in | Governance innerhalb der Plattform |

## KI-Agenten: Die nächste Stufe

Klassische Workflows folgen vorab festgelegten Schritten. Agentische Systeme wählen innerhalb gesetzter Grenzen Werkzeuge aus und planen mehrere Schritte. Diese Grenze muss durch Berechtigungen, Budgets, erlaubte Aktionen und Abbruchregeln technisch erzwungen werden.

Ein mögliches Testszenario lautet: „Lies einen fiktiven Rechnungsdatensatz, markiere nach einer vorgegebenen Regel mögliche Fälle und erstelle ausschließlich interne Entwürfe." Reale Mahnungen erfordern geprüfte Daten, Vertragsregeln, Fristen, Zuständigkeit und Freigabe.

Ein menschlicher Prüfschritt ist wichtig, reicht aber nicht allein. Eingaben, Berechtigungen, erlaubte Werkzeuge, Tests, Protokollierung und technische Stopps müssen verhindern, dass ein fehlerhaftes System schon vor deiner Prüfung Schaden anrichtet. Miss den Umfang der Nacharbeit.

**Konkrete Agenten-Szenarien:**

**Rechnungs-Follow-Up-Agent:**
1. Agent prüft wöchentlich deine offenen Rechnungen (Lexware Office/sevDesk)
2. Identifiziert überfällige Rechnungen (> 14 Tage, > 30 Tage, > 60 Tage)
3. Erstellt abgestufte Erinnerungen (freundlich → bestimmt → letzte Mahnung)
4. Sendet Entwürfe an dein Postfach zur Prüfung
5. Du prüfst, klickst "Senden", fertig

**Lead-Qualifizierungs-Agent:**
1. Neue Kontaktanfrage kommt über deine Website
2. Agent analysiert: Passt der Kunde? Hat er Budget-Signale gegeben?
3. Recherchiert das Unternehmen (Branche, Größe, Website)
4. Erstellt eine Bewertung + personalisierte Antwort-E-Mail
5. Legt den Kontakt im CRM an mit Tags und Priorität

**Content-Kalender-Agent:**
1. Agent analysiert deine letzten 10 LinkedIn-Posts (Themen, Engagement)
2. Identifiziert Themen-Lücken und Trends in deiner Branche
3. Erstellt einen Content-Plan für den nächsten Monat
4. Schreibt Post-Entwürfe für jede Woche
5. Sendet dir montags den Entwurf der Woche

**Wichtig:** Agentische Systeme sind nicht „set and forget". Sie bereiten Routinearbeit vor und wiederholen Fehler genauso zuverlässig. Nutze minimale Rechte, Entwurfsmodus, Freigaben, Limits, Monitoring und einen manuellen Rückfallweg.

## MCP: Das neue Automatisierungsprotokoll

MCP (**Model Context Protocol**) ist ein offener Standard, der festlegt, wie kompatible KI-Anwendungen Werkzeuge und Datenquellen ansprechen, vergleichbar mit USB-C als einheitlichem Stecker. OpenAI, Google, Microsoft und Anthropic unterstützen ihn. Ob ein konkreter CRM-, Rechnungs- oder Kalenderzugriff möglich ist, hängt von Client, Server, Autorisierung und verfügbarer Integration ab.

Ein MCP-Server ist selbst eine sicherheitskritische Integrationsschicht. Prüfe Herkunft, Authentisierung, Berechtigungsumfang, Datenweitergabe, Logs und jede schreibende Aktion. Ein Protokoll ersetzt keine vorhandene API oder Freigabe des Zielsystems.

Für technische Pilotprojekte ist MCP nutzbar. Ob und wann es in einem bestimmten Produkt Standard wird, ist offen. Beurteile eine angebotene „MCP-Integration" nach konkretem Nutzen und Sicherheitsmodell statt nach dem Begriff.

| Prüffrage | Belastbare Antwort |
|-----|-------------|
| **Wer kann zugreifen?** | Nur ausdrücklich autorisierte Identitäten und Clients |
| **Welche Aktionen?** | Minimaler, dokumentierter Werkzeugumfang |
| **Wo fließen Daten?** | Client, Server, Zielsystem, Modellanbieter, Logs und Backups einzeln erfassen |
| **Welche Kosten?** | Integration, Betrieb, Prüfung, Monitoring und Drittanbieter zusammenrechnen |

## API-Zugang, wenn du mehr willst

Eine API ist eine Schnittstelle, über die Software ein Modell anspricht. Abrechnung und Einheit unterscheiden sich nach Anbieter und Modell; Tokens sind nicht einfach mit Wörtern gleichzusetzen.

**Wann lohnt sich die API?**
- Du hast mehr als 5 automatisierte Workflows
- Du willst KI in eigene Tools einbauen (z.B. deine Website)
- Du brauchst Massenverarbeitung (100 E-Mails analysieren)

**Wann lohnt sie sich nicht?**
- Du nutzt KI manuell über die Chat-Oberfläche
- Du hast weniger als 3 Workflows
- Du willst nicht technisch werden

Für die meisten Freelancer reichen Zapier oder Make mit den eingebauten KI-Integrationen.

Berechne Kosten mit der aktuellen offiziellen Preisseite und gemessenen Ein- und Ausgabetokens. Ergänze Wiederholungen, Fehlversuche, Werkzeuge, Speicherung, Entwicklung, Prüfung und Monitoring. Ein Preis pro „Anfrage" ohne Längen- und Modellannahmen ist nicht belastbar.

## Drei Automatisierungen für den Sofort-Start

Diese drei Automationen kannst du heute einrichten.

### Automation 1: Lead-Qualifizierung

- **Trigger:** Neues Kontaktformular auf deiner Website
- **Aktion:** Zapier oder Make sendet den Inhalt mit diesem KRAFT-Prompt an die ChatGPT API

```
Kontext: Ich bin [BRANCHE]-Freelancer mit Spezialisierung auf [BEREICH].
Meine idealen Kunden sind [BESCHREIBUNG]. Ich bekomme Kontaktanfragen
über mein Website-Formular.

Rolle: Du bist mein virtueller Vertriebsassistent mit Erfahrung in der
Qualifizierung von B2B-Leads.

Aufgabe: Analysiere diese Kontaktanfrage und bewerte sie nach drei
Kriterien: (1) Passt der Kunde zu meinem Profil? (2) Hat er
Budget-Signale gegeben? (3) Ist das Projekt realistisch umsetzbar?
Gib eine Empfehlung: Sofort antworten / Standard-Antwort / Absage.

Format: Kurze Bewertung (3-5 Sätze) plus vorformulierte Antwort-E-Mail.

Ton: Professionell, freundlich, verbindlich.
```

**Ergebnis:** Du bekommst intern Kategorie, Zusammenfassung und Antwortentwurf. Prüfe Klassifikation, Datenminimierung und Text. Miss die vollständige Bearbeitungszeit. Es erfolgt kein automatischer Versand.

### Automation 2: Wöchentlicher Content-Entwurf

- **Trigger:** Jeden Montag um 8:00 Uhr
- **Aktion:** Die ChatGPT API bekommt diesen KRAFT-Prompt

```
Kontext: Ich poste wöchentlich auf LinkedIn. Meine Zielgruppe sind
[BESCHREIBUNG]. Meine letzten 3 Posts handelten von [THEMEN]. Mein
Redaktionsplan für diesen Monat: [THEMEN].

Rolle: Du bist ein erfahrener LinkedIn-Ghostwriter für deutsche
B2B-Freelancer.

Aufgabe: Erstelle einen LinkedIn-Post-Entwurf zum Thema [THEMA].
Der Post soll eine persönliche Erfahrung oder Meinung enthalten,
die ich selbst ergänzen muss. Markiere die Stellen, die ich
personalisieren muss, mit [HIER ERGÄNZEN].

Format: LinkedIn-Post, 150-200 Wörter, mit Hook in der ersten Zeile.
Keine Hashtags im Text, 3-5 Hashtags am Ende.

Ton: Authentisch, meinungsstark, keine Buzzwords.
```

**Ergebnis:** Montags morgens liegen Post-Entwürfe in deinem Posteingang, die du überarbeitest und einplanst.

### Automation 3: Meeting-Zusammenfassung

- **Trigger:** Neues Transkript in einem Ordner, etwa von Otter.ai, Fathom oder Whisper
- **Aktion:** Die KI bekommt diesen KRAFT-Prompt

```
Kontext: Ich hatte gerade ein [MEETING-TYP]-Gespräch mit
[KUNDE/PARTNER]. Hier ist die Transkription/Zusammenfassung:
[TRANSKRIPTION EINFÜGEN]

Rolle: Du bist mein Projektassistent mit Erfahrung in der
Dokumentation von Kundengesprächen.

Aufgabe: Erstelle aus dieser Transkription: (1) Eine Zusammenfassung
in 5 Sätzen, (2) Alle vereinbarten To-dos mit Verantwortlichen und
Deadlines, (3) Offene Fragen, die noch geklärt werden müssen.

Format: Strukturiertes Protokoll mit drei Abschnitten.
To-dos als Checkliste.

Ton: Sachlich, präzise, keine Interpretation.
```

**Ergebnis:** Nach jedem Meeting liegt ein strukturiertes Protokoll in deiner Ablage.

## Fehler vermeiden: Die Automatisierungs-Falle

Die häufigste Falle ist, alles automatisieren zu wollen. Ein vereinfachtes Rechenbeispiel: 3 Stunden Einrichtung und 10 Minuten gemessene Nettoersparnis pro Woche ergeben rechnerisch 18 Wochen bis zum Zeit-Break-even. Wartung, Fehler und Kapitalkosten verlängern ihn.

**Die Automatisierungs-Formel:**

Einrichtungszeit ÷ (Zeitersparnis pro Durchlauf × Häufigkeit) = Break-Even

Fiktives Beispiel: 2 Stunden Einrichtung ÷ (10 Minuten Nettoersparnis × 4 Durchläufe pro Woche) = rechnerischer Zeit-Break-even nach 3 Wochen, vor Wartung und Fehlerkosten.

Fiktives Beispiel: 5 Stunden Einrichtung ÷ (5 Minuten Nettoersparnis × 1 Durchlauf pro Monat) = rechnerischer Zeit-Break-even nach 60 Monaten, vor Wartung und Fehlerkosten.

**Zweite Falle:** Automationen ohne Qualitätskontrolle. Jede Automation, die E-Mails, Angebote oder Posts an Kunden schickt, braucht deinen Prüfschritt.

**Dritte Falle:** Zu komplex starten. Lass eine Automation 2 Wochen laufen, bevor du die nächste baust, und passe sie an oder verwirf sie, wenn sie nicht funktioniert. Beginne mit einem risikoarmen Pilot. Definiere vorab Erfolg, Abbruch, Testdauer und Rückfallweg. Erweitere erst nach dokumentierter Auswertung.

> **Praxisprojekt 7: Einen kontrollierten Automationstest bauen**
>
> **Was du brauchst:** eine aktuell geprüfte Workflow-Plattform oder eine isolierte lokale Testinstallation
> **Zeitaufwand:** selbst messen; Sicherheits- und Funktionstests gehören dazu
> **Was du danach hast:** einen Test mit fiktiver Anfrage --> regelgebundener Entwurf --> interne Testablage
>
> **Schritt 1:** Erstelle einen kostenlosen Account bei make.com oder installiere n8n lokal mit `npx n8n`. (5 Min.)
>
> **Schritt 2:** Erstelle ein Szenario mit 3 Modulen: manueller Testtrigger --> KI-Modul mit fiktiver Anfrage --> interne Testablage ohne echte Kontakt- oder Kundendaten. Begrenze Berechtigungen auf diesen Test.
>
> **Schritt 3:** Teste ausschließlich mit klar markierten fiktiven Daten. Prüfe Normalfall, fehlende Felder, manipulierte Eingaben, Duplikate, Ausfall des Modellanbieters und Wiederholung.
>
> **Schritt 4:** Lass den Workflow im Entwurfs- und Testmodus. Keine automatische Nachricht, kein produktiver CRM-Schreibzugriff, bis Datenfluss, Rechtsgrundlage, Fehlerpfade und Freigabe geklärt sind.
>
> **Schritt 5:** Lass ihn eine Woche laufen und bewerte dann, wie viele Leads korrekt eingestuft wurden, wie gut die Entwürfe waren und wo du nachjustierst. (5 Min.)
>
> **Du hast jetzt:** einen begrenzten, reversiblen Testworkflow mit fiktiven Daten und dokumentierten Prüfpunkten.

> **Messblatt statt Zeitversprechen**
>
> | Messgröße | Dein Wert |
> |---|---|
> | Einrichtung inklusive Tests | ___ |
> | Nettozeit pro Durchlauf vorher / nachher | ___ / ___ |
> | Fehler- und Wartungszeit | ___ |
> | Aktuelle Gesamtbetriebskosten | ___ |

Kapitel 11 zeigt, wie du damit vom Freelancer zum Unternehmer skalierst.
