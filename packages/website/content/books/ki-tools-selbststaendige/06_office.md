# Büroarbeit automatisieren

Ich habe eine Woche lang mitgezählt, wie viele E-Mails ich als Selbstständiger schreibe.

47.

Davon wichtig: vielleicht 10.

Die anderen 37 sind Bestätigungen, Terminabsprachen, Rückfragen, Status-Updates und die eine Rechnung, die ich zum dritten Mal schicke, weil der Kunde nicht zahlt.

37 E-Mails, die niemand liest und die trotzdem geschrieben werden müssen. Außer sie schreibt jemand anderes. Oder etwas anderes.

## E-Mail-Management

E-Mails sind der Zeitfresser Nummer eins. Nicht weil sie schwierig sind, sondern weil es so viele davon gibt. Und jede einzelne fühlt sich dringend an, auch wenn sie es nicht ist.

Mein System: **Inbox-Triage.**

Jede E-Mail landet in einer von drei Kategorien.

1. **Unter 2 Minuten** → Sofort beantworten. Mit KI-Entwurf.
2. **Über 2 Minuten** → Vormittag-Block. Sammeln, dann am Stück bearbeiten.
3. **Ohne Deadline** → Ignorieren. Wenn es wichtig war, meldet sich der Absender nochmal.

Kategorie 1 ist der Hebel. Die meisten deiner E-Mails sind Routine: Terminbestätigung, Rückfrage beantworten, Status-Update geben, höflich absagen. Für jede davon brauchst du 30 Sekunden mit KI, statt 5 Minuten ohne.

> **KRAFT-Prompt: E-Mail beantworten**
>
> ```
> Kontext: Ich bin [BERUF]. Ich habe folgende E-Mail erhalten:
> [E-MAIL-TEXT]
> Rolle: Du bist mein E-Mail-Assistent.
> Aufgabe: Schreibe eine Antwort. [SPEZIFISCHE ANWEISUNG,
> z.B. "Bestätige den Termin am Donnerstag 14 Uhr",
> "Frage nach Details zum Budget",
> "Sage höflich ab, schlage Alternative vor"].
> Format: E-Mail-Text, max. 100 Wörter. Direkt zum Punkt.
> Ton: [Professionell / freundlich / bestimmt].
> ```

**5 E-Mail-Vorlagen für die häufigsten Situationen:**

| Situation | KRAFT-Kurzanweisung |
|-----------|---------------------|
| Terminbestätigung | "Bestätige [TERMIN]. Frage, ob Vorbereitung nötig ist." |
| Rückfrage | "Beantworte die Frage zu [THEMA]. Kurz und präzise." |
| Follow-Up | "Frage höflich nach dem Stand zu [THEMA]. Biete Hilfe an." |
| Absage | "Sage ab. Begründung: [GRUND]. Schlage Alternative vor." |
| Dankesmail | "Bedanke dich für [WAS]. Erwähne nächsten Schritt." |

Bei 37 Routine-Mails pro Woche, je 4 Minuten gespart: 2,5 Stunden. Pro Woche. Ohne irgendwas Kompliziertes zu tun.

## Dokumente und Verträge

Als Freelancer bekommst du Verträge. Werkverträge, NDAs, AGB, Rahmenverträge. Und meistens hast du 48 Stunden Zeit, sie zu prüfen, neben der Arbeit, für die du bezahlt wirst.

KI liest einen Vertrag in Minuten. Sie ersetzt trotzdem keinen Anwalt.

KI ist kein Jurist. Sie gibt keine Rechtsberatung. Sie kann dir in 5 Minuten eine Zusammenfassung liefern und auf ungewöhnliche Klauseln hinweisen.

> **KRAFT-Prompt: Vertrag prüfen**
>
> ```
> Kontext: Ich bin [BERUF] und habe folgenden Vertragsentwurf erhalten:
> [VERTRAGSTEXT, anonymisiert!]
> Rolle: Du bist ein juristisch geschulter Assistent (KEINE
> Rechtsberatung, das ist ein wichtiger Hinweis).
> Aufgabe: Analysiere den Vertrag auf potenzielle Risiken für mich
> als Auftragnehmer. Markiere ungewöhnliche Klauseln. Erkläre in
> einfacher Sprache, was jede Klausel bedeutet.
> Format: Tabelle: Klausel | Zusammenfassung | Risiko (hoch/mittel/niedrig).
> Ton: Sachlich, verständlich, keine Juristensprache.
> ```

**Wichtig:** Anonymisiere den Vertrag, bevor du ihn in die KI gibst. Keine Firmennamen, keine konkreten Beträge, keine personenbezogenen Daten. "Auftraggeber A beauftragt Auftragnehmer B mit..."

Für eigene Dokumente, Datenschutzerklärungen, AGB oder Projektverträge nutzt du KI als Entwurfswerkzeug. Ein Entwurf ist weder Rechtsberatung noch ein Nachweis, dass die Klauseln zu deinem Geschäftsmodell passen. Was rechtlich zählt, lässt du fachkundig prüfen.

**Präsentationen** strukturierst du mit demselben Handgriff: "Erstelle eine Gliederung für eine 20-minütige Präsentation zum Thema [THEMA] für [ZIELGRUPPE]. 10 Folien. Pro Folie: Headline und 3 Stichpunkte." Werkzeuge wie Gamma oder Microsoft 365 Copilot erzeugen Layoutentwürfe. Inhalt, Quellen, Barrierefreiheit und visuelle Hierarchie prüfst du selbst, und wie viel das bringt, hängt von Thema und Ausgangsmaterial ab.

## Meeting-Vorbereitung und -Nachbereitung

Meetings fressen Zeit. Vor allem, wenn du unvorbereitet reingehst und nachher vergisst, was besprochen wurde.

**Vorbereitung in 5 Minuten:**

```
Kontext: Ich habe morgen ein Meeting mit [WER] von [FIRMA] zum
Thema [THEMA]. Ziel: [ZIEL DES MEETINGS].
Hintergrund: [RELEVANTE INFOS].
Rolle: Du bist ein Business-Coach.
Aufgabe: Bereite mich auf das Meeting vor.
1. Agenda (5-7 Punkte)
2. 3 Fragen, die ich stellen sollte
3. Mögliche Einwände und Reaktionsvorschläge
Format: Strukturiert, max. 300 Wörter.
Ton: Pragmatisch, auf den Punkt.
```

**Nachbereitung in 3 Minuten:**

Schreibe nach dem Meeting Stichworte auf, 5-10 Punkte, aus dem Gedächtnis. Oder noch besser: Lass das Meeting automatisch transkribieren (siehe nächster Abschnitt). Dann:

"Hier sind meine Notizen von einem Meeting mit [WER] am [DATUM]: [NOTIZEN]. Erstelle daraus ein strukturiertes Protokoll mit: Besprochene Themen, Entscheidungen, Action Items mit Verantwortlichkeiten und Fristen."

KI strukturiert Rohnotizen konsistent. Ob das Protokoll auch stimmt, zeigt erst der Abgleich mit Aufnahme, Notizen und den Leuten, die dabei waren. Verantwortlichkeiten, Fristen und Entscheidungen bestätigst du, bevor du das Protokoll verschickst.

In einem Kundenprojekt sagte ein Klient nach drei Meetings: "Deine Protokolle sind die besten, die ich je bekommen habe." Ich habe ihm nicht gesagt, dass ich 3 Minuten gebraucht habe statt 20.

Was er bemerkt hat: Alles war da. Jede Entscheidung. Jeder Action Item. Jede Frist. KI macht dich nicht faul. Sie macht dich gründlich.

### Meetings transkribieren mit KI

Du sitzt in einem Kundengespräch, eine Stunde lang. Danach: Was hat er nochmal zu den Deadlines gesagt? Und wie hieß der Ansprechpartner für die IT? Du weißt es nicht mehr, weil du zugehört hast statt mitzuschreiben. Und das ist richtig so, wer mitschreibt, hört nicht zu.

Die Lösung: Lass KI mitschreiben. Automatisch, im Hintergrund.

**Whisper (OpenAI): lokal ausführbare Transkription**

Whispers Code und Modellgewichte stehen unter MIT-Lizenz, du kannst sie lokal ausführen. Bei einer lokalen Kommandozeilen-Installation bleibt die Audiodatei auf deinem Rechner; Netzverkehr brauchen nur Installation und Modelldownload. Drittanbieter-Oberflächen, Erweiterungen, Synchronisation und Backups haben eigene Datenflüsse. Die prüfst du separat.

Wie gut und wie schnell das läuft, entscheiden Aufnahme, Sprache, Dialekt, Modellgröße und Hardware. Teste das gewählte Modell an deinem eigenen Audiomaterial. Namen, Zahlen und Fachbegriffe kontrollierst du danach von Hand.

**Vor jeder Aufnahme:** Informiere alle Teilnehmenden und hole eine nachweisbare Einwilligung ein. § 201 StGB stellt die unbefugte Aufnahme des nichtöffentlich gesprochenen Wortes unter Strafe. Eine lokale Verarbeitung löst diese vorgelagerte Pflicht nicht.

**So nutzt du Whisper (technisch, für IT-affine Freelancer):**
1. Python installieren (python.org)
2. `pip install openai-whisper` im Terminal
3. Meeting mit Handy oder Laptop aufnehmen (Voice Memos, Audacity, etc.)
4. `whisper meeting.mp3 --language German --model medium` im Terminal
5. Transkript als Textdatei, fertig

Für Nicht-Techniker: Es gibt grafische Oberflächen wie "Whisper Transcription" (Mac App Store) oder "Buzz" (kostenlos, Open Source), die Whisper mit einem Klick nutzbar machen. Keine Kommandozeile nötig.

**Cloud-Alternativen (wenn du es bequemer willst):**

| Tool | Was es kann | Vor dem Einsatz prüfen |
|------|-----------|------------------------|
| **Otter.ai** | Live-Transkription, Zusammenfassungen, Sprecher-Erkennung | aktueller Vertrag, DPA/AVV, Speicher- und Verarbeitungsorte, Trainings- und Löschregeln |
| **Fathom** | Meeting-Zusammenfassungen, Action Items, CRM-Integration | aktueller Vertrag, DPA/AVV, Bot-Einwilligung, Aufbewahrung und Integrationen |
| **Amberscript** | Transkription und Untertitel | aktueller Vertrag, DPA/AVV, konkrete Hosting-Option, Unterauftragnehmer und Löschfristen |

**Entscheidungsregel:** Kein Markenname und kein EU-Server-Versprechen macht einen Workflow automatisch DSGVO-konform. Prüfe Rechtsgrundlage, Rollen, Vertrag, Datenflüsse, Zugriffe, Aufbewahrung und Löschung für deine konkrete Konfiguration. Lokale Transkription kann den Datenfluss reduzieren, ersetzt aber weder Einwilligung noch Geräte- und Zugriffsschutz.

**Eigener Vergleich statt pauschaler Kostenrechnung:** Nimm drei repräsentative Aufnahmen und miss Bearbeitungszeit, Korrekturzeit, Fehlerrate bei Namen und Zahlen, Infrastruktur- und Lizenzkosten. Stell die Werte neben deinen bisherigen Prozess. Vorher entscheidest du nicht, vorher rätst du.

**Der komplette Workflow: Vom Meeting zum geprüften Protokoll**

1. **Einwilligung dokumentieren:** Zweck, Tool, Empfänger und Löschfrist erklären
2. **Aufnehmen:** nur den vereinbarten Umfang erfassen
3. **Transkribieren:** lokal oder mit einem freigegebenen Dienst
4. **KRAFT-Prompt:** nur in der für diese Datenklasse freigegebenen Umgebung verwenden
5. **Prüfen und löschen:** Entscheidungen bestätigen und Rohdaten nach der festgelegten Frist löschen

```
Kontext: Hier ist die Transkription eines Kundengesprächs mit
[ANONYMISIERT] vom [DATUM]. Dauer: ca. [MINUTEN] Minuten.
[TRANSKRIPT EINFÜGEN]
Rolle: Du bist mein Projektassistent.
Aufgabe: Erstelle aus der Transkription:
1. Zusammenfassung in 5 Sätzen
2. Alle vereinbarten To-dos mit Verantwortlichen und Fristen
3. Offene Fragen, die noch geklärt werden müssen
4. Stimmungs-Einschätzung des Kunden (zufrieden/neutral/unzufrieden)
Format: Strukturiertes Protokoll mit vier Abschnitten.
To-dos als Checkliste.
Ton: Sachlich, präzise, keine Interpretation.
```

**Wichtig:** Anonymisiere das Transkript, bevor du es in ein Cloud-Tool gibst. Oder nutze Whisper lokal + Ollama lokal (Kapitel 2), dann verlässt gar nichts deinen Rechner.

## Recherche und Analyse

Jeder Freelancer recherchiert. Neue Märkte, neue Tools, Wettbewerber, Trends, Regulierungen. Die meisten machen es mit Google, Tab auf, nächster Tab, noch einer, 20 Tabs offen, 90 Minuten später weißt du alles über ein Thema, das du nicht brauchst.

KI liefert dir stattdessen eine strukturierte Zusammenfassung. In 5 Minuten. Nicht perfekt, du musst die Fakten prüfen. Als Startpunkt für deine eigene Recherche ein gewaltiger Zeitgewinn.

```
Kontext: Ich bin [BERUF] und recherchiere [THEMA] für [ZWECK].
Rolle: Du bist ein Research-Analyst.
Aufgabe: Erstelle einen Research-Brief zu [THEMA]. Berücksichtige:
aktuelle Entwicklungen, Schlüsselfakten, relevante Zahlen für
den deutschen Markt.
Format: Max. 500 Wörter. Überschriften. Quellen, wo möglich.
Ton: Sachlich, faktenbasiert.
```

Für aktuelle Gesetze, Preise und Fristen ist kein Chatbot die Primärquelle. Nutze KI höchstens zum Finden von Ansatzpunkten und verifiziere jede Aussage auf der offiziellen Behörden-, Gesetzes- oder Anbieterseite. Quellenangaben eines Recherchetools sind Links zum Prüfen, kein Gütesiegel.

## Projektmanagement mit KI-Unterstützung

Du jonglierst 3-5 Projekte gleichzeitig. Jedes mit anderen Deadlines, anderen Ansprechpartnern, anderen Anforderungen. Und das Projektmanagement-Tool? "Mein Kopf und eine Excel-Tabelle."

KI schafft dir Struktur. Nicht als Projektmanagement-Tool, dafür gibt es Notion, Asana, Trello. Sondern als Assistent, der Projekte plant, Meilensteine setzt und den Überblick hält.

```
Kontext: Ich starte ein neues Projekt für [KUNDE]. Leistung:
[BESCHREIBUNG]. Deadline: [DATUM]. Budget: [BETRAG] EUR.
Rolle: Du bist ein Projektmanagement-Experte für Freelancer.
Aufgabe: Erstelle einen Projektplan mit Meilensteinen,
Arbeitspaketen und geschätztem Zeitaufwand.
Format: Tabelle mit: Meilenstein, Arbeitspakete, Stunden,
Deadline. Gantt-Chart-Beschreibung optional.
Ton: Strukturiert, realistisch. Keine Überschätzung.
```

Ich nutze diesen Workflow für jedes neue Beratungsprojekt. 5 Minuten für den Projektplan. Dann justiere ich, weil die KI manchmal den Aufwand unterschätzt (bei Kundenkommunikation) oder überschätzt (bei Standardaufgaben). Aber der Ausgangspunkt ist solide.

> **Praxisprojekt 6: 5 E-Mail-Vorlagen mit eigener Zeitmessung**
>
> **Was du brauchst:** ChatGPT oder Claude + Whisper (kostenlos)
> **Zeitaufwand:** 40 Minuten
> **Was du danach hast:** 5 wiederverwendbare KRAFT-Prompt-E-Mail-Vorlagen + 1 Test-Meeting-Transkription
>
> **Schritt 1:** Öffne dein Postfach. Welche 5 E-Mail-Typen schreibst du am häufigsten? Typisch: Terminbestätigung, Projektupdate, Absage, Follow-Up, Dankeschön. Schreib sie auf. (5 Min.)
>
> **Schritt 2:** Schreibe für jede einen KRAFT-Prompt. Nutze das Muster unten als Vorlage. Ersetze die Platzhalter, aber halte die Struktur. (15 Min.)
>
> **Schritt 3:** Teste jeden Prompt mit einem echten Beispiel aus deinem Postfach. Passe an, was nicht klingt wie du. Speichere die finalen Prompts in einer Notiz-App oder einem Ordner. (10 Min.)
>
> **Schritt 4:** Bonus, lade Whisper herunter (openai.com/whisper) und transkribiere ein 5-Minuten-Meeting oder eine Sprachnachricht. Dann: "Erstelle aus diesem Transkript ein Protokoll mit Action Items." (10 Min.)
>
> **KRAFT-Prompt** (E-Mail-Vorlage):
> ```
> Kontext: Ich bin [BERUF]. Ein Kunde hat [SITUATION BESCHREIBEN].
> Rolle: Du bist mein professioneller Kommunikationsassistent.
> Aufgabe: Schreibe eine [E-MAIL-TYP]-E-Mail. Kernbotschaft:
> [WAS SOLL RÜBERKOMMEN]. Max. 8 Sätze.
> Format: Betreff + E-Mail-Text. Anrede: [VORNAME/SIE/DU].
> Ton: Freundlich, professionell, nicht unterwürfig.
> ```
>
> **In der Hand:** 5 wiederverwendbare E-Mail-Vorlagen und eine eigene Vorher-Nachher-Messung. Dokumentiere Entwurfszeit, Korrekturzeit und Fehler; rechne nur mit deinem gemessenen Ergebnis.

> **Zeitgewinn-Tracker**
>
> | Dieses Kapitel | Kumuliert |
> |---|---|
> | +2,5 Std./Woche | 8,5 Std./Woche |
> | +187 EUR/Woche | 637 EUR/Woche |
> | Toolkosten: +0 EUR (Whisper ist kostenlos) | Gesamt: 40 EUR/Mo |

Das Büro läuft. Jetzt die Finanzen.
