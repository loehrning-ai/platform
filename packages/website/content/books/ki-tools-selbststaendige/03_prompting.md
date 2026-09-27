# Die KRAFT-Methode: Prompting, das funktioniert

Sagst du einem neuen Mitarbeiter am ersten Tag nur "Mach mal was", bekommst du irgendwas. Bei unklaren KI-Aufträgen wie "Schreib mir einen Text" passiert dasselbe.

Ein besseres Briefing löst nicht jedes Qualitätsproblem. Es macht Ziel, Kontext und Prüfkriterien sichtbar, und das ist der halbe Weg.

## Warum der Prompt alles entscheidet

Im folgenden fiktiven Vergleich bekommt dieselbe Aufgabe zwei Prompts. Die Beispielausgaben zeigen einen möglichen Unterschied, keinen reproduzierbaren Leistungsnachweis.

**Prompt A:**
```
Schreib mir einen LinkedIn-Post.
```

**Output A:**

> *"In der heutigen, zunehmend vernetzten Geschäftswelt ist LinkedIn ein unverzichtbares Werkzeug für professionelles Networking. Für Selbstständige bietet die Plattform vielfältige Möglichkeiten, Kontakte zu knüpfen und das eigene Unternehmen sichtbar zu machen. Im Folgenden möchte ich aufzeigen, warum regelmäßiges Posten auf LinkedIn für den Geschäftserfolg von großer Bedeutung ist..."*

Floskeln wie "in der heutigen Zeit", "zunehmend vernetzt", "vielfältige Möglichkeiten" und "von großer Bedeutung" verraten die KI-Sprache. So schreibt und liest kein Mensch.

**Prompt B:**
```
Kontext: Ich bin selbstständige IT-Beraterin mit Fokus auf KI im
Mittelstand. Ich habe letzte Woche einen Fachvortrag beim
Unternehmerverband gehalten, mit 40 Teilnehmenden,
davon 32 in Geschäftsführungsrollen.
Rolle: Du bist ein erfahrener LinkedIn-Copywriter.
Aufgabe: Schreibe einen Post über meinen Vortrag, der Geschäftsführer
und andere Berater anspricht.
Format: 150-200 Wörter. Hook in der ersten Zeile. 3 Key Takeaways
als Stichpunkte. Call-to-Action am Ende.
Ton: Professionell aber persönlich. Nicht werblich. Keine Buzzwords.
```

**Output B:**

> *"40 Teilnehmende. 90 Minuten. Eine Frage stand im Mittelpunkt.*
>
> *Beim Fachvortrag über KI im Mittelstand löste eine Frage die längste Diskussion aus: 'Wo liegen unsere Daten?'*
>
> *3 Dinge, die ich mitgenommen habe:*
> *→ 32 von 40 Teilnehmenden gaben private, aber keine berufliche Nutzung an*
> *→ Das größte Hindernis ist nicht die Technik, sondern die Datenqualität*
> *→ Jeder wollte wissen: Womit fange ich morgen an?*
>
> *Wenn du vor derselben Frage stehst: Schreib mir eine Nachricht. Ich teile gerne, was funktioniert hat."*

Der zweite Entwurf ist konkreter und lässt sich an den Vorgaben prüfen. Vor dem Veröffentlichen kontrollierst du trotzdem jede Zahl, jede Aussage und den Ton.

Mehr Kontext kann die Ausgabe verbessern. Ob und wie stark, zeigt nur ein Vergleich mit festen Kriterien und mehreren Testläufen. Das System dafür heißt KRAFT.

## Das KRAFT-Framework

KRAFT steht für fünf Bausteine eines guten Prompts. Du brauchst nicht immer alle fünf, aber jeder zusätzliche verbessert meist das Ergebnis.

### K, Kontext

*Wer bist du? Wofür ist das? Welche Hintergrundinformationen braucht die KI?*

Die KI weiß nicht, ob du Fliesenleger bist oder Unternehmensberaterin, und kennt weder deine Kunden noch deine Branche. Ohne Kontext rät sie.

**Schlecht:** "Schreib ein Angebot."
**Besser:** "Ich bin freiberuflicher Webentwickler und erstelle ein Angebot für einen Zahnarzt, der eine neue Website braucht. Budget: ca. 5.000 EUR."

Relevanter Kontext erhöht häufig die Chance auf eine brauchbare Antwort. Zu viel Kontext, widersprüchlicher oder sensibler, kann Qualität und Sicherheit verschlechtern.

### R, Rolle

*Welche Expertise soll die KI einnehmen?*

"Du bist ein erfahrener Texter." "Du bist ein Steuerberater für Freiberufler." "Du bist ein LinkedIn-Copywriter, der für B2B-Berater schreibt."

Das Modell hat unterschiedliche "Stimmen" gelernt. Ein Text, den die KI als "erfahrener Texter" schreibt, klingt anders als einer als "Kundenservice-Mitarbeiter".

Ein gutes Briefing an einen Menschen enthält Kontext, Aufgabe, Format und Abnahmekriterien. Für KI-Aufträge gilt dieselbe Disziplin.

### A, Aufgabe

*Was genau soll die KI tun?*

Die Aufgabe ist spezifisch und, wenn es geht, messbar: "Formuliere ein Angebot mit Einleitung, Leistungsbeschreibung, Zeitrahmen, Preis und nächsten Schritten." Oder: "Schreibe einen Blogartikel mit 800 Wörtern, der 3 Vorteile von X für Y erklärt."

### F, Format

*Wie soll das Ergebnis aussehen?*

Tabelle, E-Mail, Stichpunkte, Fließtext, 200 Wörter, Markdown, nummerierte Liste, eine Seite, drei Absätze.

Gibst du kein Format an, entscheidet die KI, und ihre Standardwahl ist selten deine.

### T, Ton

*Wie soll es klingen?*

Professionell, locker, sachlich, freundlich-bestimmt, umgangssprachlich oder akademisch: Den Ton vergessen die meisten, dabei entscheidet er, ob der Text nach dir klingt.

**Profi-Tipp:** Gib der KI ein Beispiel deines eigenen Schreibstils mit. "Hier ist eine E-Mail, die ich geschrieben habe. Übernimm meinen Ton." Das funktioniert besser als jede Beschreibung.

---

Zusammen sieht ein KRAFT-Prompt so aus:

```
Kontext: Ich bin [BERUF] und erstelle ein Angebot für [KUNDENNAME],
ein [BRANCHE]-Unternehmen mit [GRÖSSE] Mitarbeitern.
Der Kunde braucht [LEISTUNG]. Budget: ca. [BETRAG] EUR.
Rolle: Du bist ein erfahrener Angebotsschreiber für Freiberufler.
Aufgabe: Formuliere ein Angebot mit Einleitung, Leistungsbeschreibung,
Zeitrahmen, Preis und nächsten Schritten.
Format: Professioneller Angebotstext, max. 1 Seite. Nummerierte
Leistungspositionen.
Ton: Professionell, verbindlich, wertschätzend. Kein Verkäuferdeutsch.
```

> **Infobox: Musst du KRAFT bei jedem Prompt nutzen?**
>
> Nein. Bei "Übersetze diesen Satz" reichen 3 Wörter. Bei "Was ist die Hauptstadt von Frankreich?" brauchst du kein Framework.
>
> Bei allem, was länger als 2 Minuten dauert, also Angebote, E-Mails, Blogartikel, Strategien und Recherchen, lohnt es sich. Manchmal brauchst du alle 5 Buchstaben, manchmal nur 3.

> **KRAFT-Spickzettel (zum Ausdrucken)**
>
> | Buchstabe | Frage | Beispiel |
> |-----------|-------|----------|
> | **K**ontext | Wer bin ich? Wofür ist das? | "Ich bin Coach für Führungskräfte..." |
> | **R**olle | Welche Expertise brauche ich? | "Du bist ein erfahrener Texter..." |
> | **A**ufgabe | Was genau soll passieren? | "Schreibe eine E-Mail an..." |
> | **F**ormat | Wie soll das Ergebnis aussehen? | "Max. 200 Wörter, 3 Absätze..." |
> | **T**on | Wie soll es klingen? | "Professionell aber locker..." |

## Fortgeschrittene Techniken

### Chain-of-Thought: "Denk nach, bevor du antwortest"

Füge einen Satz zu deinem Prompt hinzu: "Denke Schritt für Schritt nach, bevor du antwortest."

Das Modell strukturiert seine Antwort dann, bevor es losschreibt. Nutze das bei Strategien, Analysen und Entscheidungen, bei "Übersetze diesen Satz" brauchst du es nicht.

### Few-Shot Learning: Beispiele geben

Du willst eine E-Mail im Stil deiner bisherigen E-Mails? Gib der KI 2-3 Beispiele.

```
Kontext: Ich bin [BERUF]. Hier sind 3 E-Mails, die ich an Kunden
geschrieben habe:
[E-MAIL 1]
[E-MAIL 2]
[E-MAIL 3]
Rolle: Du bist ein Kommunikationsexperte.
Aufgabe: Analysiere meinen Schreibstil und schreibe eine vierte E-Mail
an [EMPFÄNGER] zum Thema [THEMA] in exakt meinem Stil.
Format: E-Mail mit Betreffzeile. Gleiche Länge wie meine Beispiele.
Ton: Wie in meinen Beispielen, analysiere den Ton und übernimm ihn.
```

Das funktioniert auch für Angebote, Social-Media-Posts und Blogartikel. Je mehr Beispiele du gibst, desto genauer trifft die KI deinen Stil.

### Iteration: Die beste Antwort ist nie die erste

Die erste Antwort ist der Rohentwurf. Nachbessern ist der Schritt, den die meisten überspringen:
1. KRAFT-Prompt → Erster Entwurf
2. "Mach die Einleitung kürzer und direkter."
3. "Ersetze die Buzzwords durch konkrete Zahlen."
4. "Der dritte Absatz klingt generisch. Mach ihn spezifischer für [BRANCHE]."

Iteriere, bis die definierten Prüfkriterien erfüllt sind. Anzahl der Runden und Zeitbedarf hängen von Aufgabe, Modell und Ausgangsmaterial ab.

### Mega-Prompts: Für die großen Aufgaben

Für eine Content-Strategie, einen Businessplan oder ein Pitch-Deck gibt es Mega-Prompts, also lange Anweisungen mit genug Kontext für eine komplexe Aufgabe. Gliedere sie mit klaren Überschriften in Abschnitte, denn Struktur versteht die KI besser als Fließtext.

### Tree-of-Thoughts: Wenn eine Antwort nicht reicht

Chain-of-Thought sagt der KI: "Denk Schritt für Schritt." Tree-of-Thoughts sagt: "Denk in mehrere Richtungen gleichzeitig."

Chain-of-Thought folgt einem Pfad. Tree-of-Thoughts erkundet mehrere, bewertet jeden, verwirft die schlechten und wählt den besten. Nutze das bei Entscheidungen mit mehreren Optionen wie Pricing-Strategie, Standortwahl oder Geschäftsmodell-Vergleich.

**Beispiel: Pricing-Strategie mit Tree-of-Thoughts**

```
Kontext: Ich bin IT-Beraterin mit 8 Jahren Erfahrung. Aktueller
Tagessatz: 900 EUR. Auslastung: 70%. Zielgruppe: Mittelständler
mit 50-200 Mitarbeitern. Ich überlege, mein Pricing umzustellen.
Rolle: Du bist ein Pricing-Stratege für IT-Freelancer.
Aufgabe: Entwickle DREI verschiedene Pricing-Strategien für mich:
(1) Tagessatz erhöhen, (2) Pauschalpreise pro Projekt,
(3) Retainer-Modell (monatliche Pauschale).
Bewerte JEDE Strategie auf: erwarteter Jahresumsatz, Risiko,
Auslastungs-Effekt, Kundenakzeptanz im deutschen Mittelstand.
Vergleiche alle drei in einer Tabelle.
Wähle die beste Strategie für meine Situation und begründe warum.
Format: Tabelle + Empfehlung in max. 300 Wörtern.
Ton: Direkt, analytisch, keine Beschönigung.
```

Die Anweisung erzeugt mehrere Optionen, eine Vergleichstabelle und eine begründete Empfehlung. Das macht Annahmen sichtbar, garantiert aber keine bessere Entscheidung. Prüfe Zahlen und Bewertungslogik unabhängig nach.

### ReAct: Denken + Handeln in einem Kreislauf

ReAct steht für "Reasoning and Acting", Denken und Handeln. Die KI denkt, handelt, beobachtet das Ergebnis, denkt weiter, handelt wieder.

Wenn du Perplexity oder ChatGPT mit Browsing nutzt, arbeitet im Hintergrund genau dieses Muster:

1. **Thought:** "Ich muss die aktuellen IHK-Beiträge recherchieren"
2. **Action:** Sucht im Internet
3. **Observation:** "IHK-Beiträge variieren regional; aktuelle Werte sind bei der zuständigen Kammer zu prüfen"
4. **Thought:** "Ich brauche den spezifischen Beitrag für die IHK Düsseldorf"
5. **Action:** Sucht gezielter
6. **Observation:** "Aktueller Wert laut offizieller Seite der zuständigen Kammer: [QUELLE, DATUM, BETRAG PRÜFEN]"
7. **Final Answer:** Strukturierte Zusammenfassung mit Quellen

Du kannst das Muster selbst nachbauen, auch ohne Browsing-Funktion:

```
Kontext: Ich bin [BERUF] und recherchiere [THEMA] für ein
Kundenangebot.
Rolle: Du bist ein Research-Analyst mit ReAct-Methodik.
Aufgabe: Recherchiere Schritt für Schritt. Gehe so vor:
Schritt 1: Was weißt du sicher über [THEMA]? Liste Fakten auf.
Schritt 2: Was ist unsicher oder könnte veraltet sein? Markiere es.
Schritt 3: Formuliere 3 Fragen, die ich selbst recherchieren sollte.
Schritt 4: Fasse zusammen, was gesichert ist.
Format: Nummerierte Schritte. Unsichere Fakten mit [PRÜFEN] markiert.
Ton: Sachlich, selbstkritisch. Lieber "ich bin nicht sicher" als
eine erfundene Zahl.
```

Die KI muss so trennen, was sie weiß und was sie rät. Das reduziert Halluzinationen bei Recherche-Aufgaben erheblich.

### Prompt Chaining: Die Aufgabe in Schritte zerlegen

Statt eines riesigen Prompts zerlegst du die Aufgabe in eine Kette, in der jeder Output den nächsten Input füttert. Für komplexe Aufgaben ist das die zuverlässigste Methode, weil du nach jedem Schritt prüfen und korrigieren kannst.

**Beispiel: Vom Kundengespräch zum fertigen Angebot in 3 Prompts**

**Prompt 1, Recherche:**
```
Kontext: Mein potenzieller Kunde ist ein Maschinenbauer mit
120 Mitarbeitern. Er braucht eine KI-Strategie.
Rolle: Du bist ein Research-Analyst für den deutschen Mittelstand.
Aufgabe: Recherchiere 3 mögliche KI-Anwendungsfelder im
deutschen Maschinenbau. Pro Feld: öffentlich belegte Evidenz,
offene Annahmen, möglicher Zeithorizont und benötigte Datengrundlage.
Format: 3 Absätze, je max. 100 Wörter. Fakten mit Quellen.
Ton: Sachlich, datengetrieben.
```

**Prompt 2, Analyse (Output von Prompt 1 einfügen):**
```
Kontext: Hier sind die Recherche-Ergebnisse: [OUTPUT AUS PROMPT 1].
Mein Tagessatz: 1.200 EUR. Geschätzter Aufwand: 5-8 Tage.
Rolle: Du bist ein Strategieberater für KI im Mittelstand.
Aufgabe: Vergleiche die 3 Felder für den fiktiven Maschinenbauer.
Erfinde keinen ROI. Formuliere stattdessen messbare Hypothesen,
benötigte Basiswerte und Abbruchkriterien. Begründe die Priorisierung.
Skizziere einen Projektplan in 3 Phasen.
Format: Empfehlung (1 Absatz) + Phasenplan (Tabelle).
Ton: Strategisch, entscheidungsorientiert.
```

**Prompt 3, Angebot (Output von Prompt 2 einfügen):**
```
Kontext: Hier ist meine Analyse: [OUTPUT AUS PROMPT 2].
Mein Tagessatz: 1.200 EUR. Gesamtbudget: ca. 8.000-10.000 EUR.
Rolle: Du bist ein Angebotsschreiber für Freelancer-Beratung.
Aufgabe: Formuliere ein professionelles Angebot basierend auf der
Analyse. Einleitung, Leistungsbeschreibung, Phasen, Preis,
nächste Schritte.
Format: Max. 1 Seite. Nummerierte Leistungspositionen.
Ton: Professionell, verbindlich, wertschätzend.
```

Die dreistufige Kette trennt Recherche, Analyse und Angebot. So prüfst du Quellen, Annahmen und Zahlen an jeder Station. Ob sie schneller oder besser ist als ein einzelner Prompt, misst du an deinen eigenen Aufgaben.

### System Prompts: Dein permanentes Betriebssystem

Die Custom Instructions aus Kapitel 2 sind dein System Prompt, ein permanentes Briefing für jede Konversation. Er legt die Grundregeln fest, der normale Prompt die spezifische Aufgabe.

**So richtest du System Prompts ein:**

Bei **ChatGPT:** Einstellungen > Personalization > Custom Instructions. Du bekommst zwei Felder: "What would you like ChatGPT to know about you?" (dein Kontext) und "How would you like ChatGPT to respond?" (deine Regeln).

Bei **Claude:** Profil > User preferences. Oder du legst pro Kunde oder Aufgabe ein "Project" mit eigenen permanenten Anweisungen an.

**Vorlage für einen Freelancer-System-Prompt:**
```
Du bist mein Arbeitsassistent. Ich bin [BERUF] in Deutschland.
Meine Kunden sind [ZIELGRUPPE]. Ich schreibe auf Deutsch.

Regeln:
- Antworte immer auf Deutsch, es sei denn, ich frage explizit
  nach einer anderen Sprache
- Sei konkret. Keine Buzzwords. Keine Floskeln
- Wenn dir Informationen fehlen, frage nach, rate nicht
- Zahlen, Gesetze und Fakten: Markiere sie als [PRÜFEN],
  wenn du dir nicht sicher bist
- Verwende "Du" statt "Sie" in allen Texten
- Maximal [N] Wörter, sofern nicht anders gesagt
- Kein "In der heutigen Zeit", kein "ganzheitlich",
  kein "umfassend", kein "vielfältig"
```

### Negativ-Prompting: Sag, was du NICHT willst

Sag der KI, was sie nicht tun soll. Wie bei Mitarbeitern wirkt "mach es nicht zu lang" oft besser als "mach es kurz":
- "Verwende NICHT: Buzzwords, Superlative, Passiv."
- "Keine Einleitung. Starte direkt mit dem Inhalt."
- "Kein 'In der heutigen Zeit'. Kein 'ganzheitlich'. Kein 'umfassend'."
- "Nicht mehr als 200 Wörter."
- "Keine Aufzählung mit mehr als 5 Punkten."

Bei Texten wirkt das am stärksten, weil KI in generische Muster fällt.

**Profi-Tipp:** Was die KI nie tun soll, hinterlegst du dauerhaft im System Prompt. Was sie in der konkreten Aufgabe tun soll, gehört in den KRAFT-Prompt.

## Prompt-Templates nach Aufgabe

Hier sind 10 Kategorien mit fertigen Templates im KRAFT-Format und mit [PLATZHALTERN].

| # | Kategorie | Wann nutzen |
|---|-----------|-------------|
| 1 | Kaltakquise-Mail | Neuen Kunden ansprechen |
| 2 | Bestandskunden-Mail | Updates, Follow-Ups |
| 3 | Angebot/Proposal | Leistung und Preis formulieren |
| 4 | Social Media | LinkedIn, Instagram, X |
| 5 | Blog/SEO | Artikel und Suchmaschinen-Optimierung |
| 6 | Recherche | Marktanalyse, Wettbewerber |
| 7 | Strategie | SWOT, Positionierung, Pricing |
| 8 | Meeting | Vorbereitung und Nachbereitung |
| 9 | Texte überarbeiten | Kürzen, Umschreiben, Tonänderung |
| 10 | Kreativ | Brainstorming, Naming, Slogan |

Ausführliche Templates stehen in den Kapiteln 4 bis 7. Kaltakquise-Mail, Meeting-Vorbereitung, Marktanalyse und SWOT-Analyse findest du als Prompts 1, 19, 23 und 24 in der Prompt-Bibliothek (Kapitel 13). Hier noch eine Vorlage zum Sofort-Starten:

### Texte überarbeiten

```
Kontext: Ich habe folgenden Text geschrieben: [TEXT EINFÜGEN].
Zielgruppe: [WER SOLL DEN TEXT LESEN]. Zweck: [WOFÜR, Website,
Angebot, E-Mail, Social Media].
Rolle: Du bist ein erfahrener Lektor für deutsche Geschäftstexte.
Aufgabe: Überarbeite den Text. Mach ihn [KÜRZER/KLARER/ÜBERZEUGENDER].
Behalte meinen Stil bei, aber verbessere Struktur und Lesbarkeit.
Format: Überarbeiteter Text + 3 Stichpunkte, was du geändert hast
und warum.
Ton: Wie im Original, nur besser.
```

## Die 10 häufigsten Prompting-Fehler

Die folgenden Muster sind eine redaktionelle Checkliste, keine statistische Auswertung von Workshops oder Kundensitzungen.

**Fehler 1: Zu vage.** "Schreib was über Marketing." → Welches Marketing, für wen, in welcher Branche, in welchem Format?

**Fehler 2: Zu lang.** Drei Seiten Prompt mit jeder Nuance, die dir einfällt. Die KI verliert den Faden und priorisiert die falschen Teile. Sweet Spot: 50-200 Wörter.

**Fehler 3: Keine Rolle.** Ohne Rolle schreibt die KI wie ein Generalist. "Du bist ein Steuerberater für Freelancer" ergibt eine völlig andere Antwort als "Du bist ein Marketingexperte."

**Fehler 4: Kein Format.** Du willst eine E-Mail oder Stichpunkte und bekommst einen Essay. Sag der KI, wie das Ergebnis aussehen soll.

**Fehler 5: Die erste Antwort akzeptieren.** Behandle sie als Rohentwurf. Iteriere anhand konkreter Kriterien und schreib auf, wie viel Nacharbeit nötig war.

**Fehler 6: Vertrauliche Daten im Prompt.** Kundennamen, Finanzdaten, Vertragsdetails. Verwende vollständig fiktive Daten oder eine belastbar anonymisierte Beschreibung wie „Kunde A, mittelständisches Unternehmen im Maschinenbau". Mehr dazu in Kapitel 8.

**Fehler 7: Output nicht prüfen.** Die KI erfindet Zahlen, Quellen und Gesetze. Prüfe jede Zahl, jedes Zitat und jede Gesetzesreferenz.

**Fehler 8: Falsche Erwartungen.** KI liefert einen Entwurf, dessen Qualität und Nacharbeit schwanken. Ob er verwendbar ist, entscheidet deine fachliche Prüfung.

**Fehler 9: Immer das gleiche Tool.** Claude ist besser für lange Texte, Perplexity für Recherche mit Quellen, Gemini für Google-Daten. Wähle das richtige Werkzeug (Kapitel 2).

**Fehler 10: Prompts nicht speichern.** Speichere getestete Prompts mit Modell, Datum, Eingabe, Bewertung und bekannten Grenzen. Die Prompt-Bibliothek in Kapitel 13 ist ein Startpunkt.

---

> **Praxisprojekt 3: Ein Prompt, fünf Ergebnisse**
>
> **Was du brauchst:** ChatGPT oder Claude (kostenlos)
> **Zeitaufwand:** 30 Minuten
> **Was du danach hast:** Einen Seite-an-Seite-Vergleich von 5 Prompt-Varianten für dieselbe Geschäftsaufgabe und eigene Messwerte zu Qualität und Nacharbeit
>
> **Schritt 1:** Wähle eine echte Aufgabe aus deinem Alltag, etwa ein Angebot für einen Beratungstag, eine Kunden-Mail oder einen LinkedIn-Post.
>
> **Schritt 2:** Schreibe 5 Versionen desselben Prompts, von miserabel bis KRAFT-komplett:
> (a) Schlecht: "Schreib mir ein Angebot."
> (b) Nur K: Füge Kontext hinzu, wer du bist, was der Kunde braucht.
> (c) K+R: Füge eine Rolle hinzu, "Du bist ein erfahrener Angebotsschreiber."
> (d) K+R+A: Präzisiere die Aufgabe, Umfang, Struktur, Länge.
> (e) Vollständig KRAFT: Alle 5 Buchstaben. Kontext, Rolle, Aufgabe, Format, Ton.
>
> **Schritt 3:** Lass die KI alle 5 Versionen nacheinander beantworten. Kopiere die Ergebnisse in ein Dokument.
>
> **Schritt 4:** Vergleiche: Wie viel besser wird die Ausgabe mit jedem zusätzlichen Buchstaben? Markiere die Stelle, ab der du das Ergebnis tatsächlich verwenden würdest.
>
> **KRAFT-Prompt** (Version e, das Ziel):
> ```
> Kontext: Ich bin [BERUF] und erstelle ein Angebot für [KUNDE],
> ein [BRANCHE]-Unternehmen. Der Kunde braucht [LEISTUNG].
> Budget: ca. [BETRAG] EUR.
> Rolle: Du bist ein erfahrener Angebotsschreiber für Freiberufler.
> Aufgabe: Formuliere ein Angebot mit Einleitung, 3 nummerierten
> Leistungspositionen, Zeitrahmen und nächsten Schritten.
> Format: Max. 1 Seite. Professioneller Geschäftston.
> Ton: Verbindlich, wertschätzend, kein Verkäuferdeutsch.
> ```
>
> **Am Ende steht ein eigener Vergleich:** Bewerte jede Ausgabe mit denselben Kriterien. Dokumentiere Prompt-Zeit, Nacharbeit, Faktenfehler und Verwendbarkeit. Das KRAFT-Template ist ein Startpunkt, kein Qualitätsversprechen.

> **Jetzt bist du dran: Der KRAFT-Vergleich**
>
> Nimm eine Aufgabe, die du letzte Woche manuell erledigt hast, etwa eine E-Mail oder ein Angebot.
>
> 1. Schreibe einen Prompt ohne System, einfach drauflos.
> 2. Schreibe einen KRAFT-Prompt mit allen 5 Buchstaben für dieselbe Aufgabe und vergleiche die Ergebnisse.
> 3. Miss Prompt-Zeit, Nacharbeit und Fehler. Halte das Ergebnis fest, auch wenn KRAFT in deinem Fall keinen Vorteil bringt.
>
> 

### Stirbt Prompting bald?

Oft heißt es, in zwei Jahren verstehe KI dich von alleine. Dieselben Stimmen bauen gleichzeitig immer komplexere Prompt-Registries und Evaluierungspipelines. 2022 hieß Prompting drauflostippen und hoffen, 2026 ist es eine Disziplin mit Versionierung und Metriken.

KRAFT bleibt relevant, weil gute Briefings für Menschen und Maschinen relevant bleiben.

> **Messblatt statt Zeitversprechen**
>
> | Messgröße | Dein Wert |
> |---|---|
> | Prompt- und Bearbeitungszeit vorher | ___ |
> | Prompt- und Bearbeitungszeit nachher | ___ |
> | Faktenfehler und Korrekturen | ___ |
> | Ergebnis nach deinen Kriterien verwendbar? | Ja / Nein / teilweise |

Kapitel 4 zeigt, wie du mit KI Kunden gewinnst.
