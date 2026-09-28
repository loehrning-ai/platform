# KI-Grundlagen: nur was du brauchst

Für KI brauchst du kein Informatikstudium. Wenn du aber verstehst, warum ChatGPT manchmal überzeugend lügt, vertraust du keiner KI-Antwort mehr blind und sparst dir Fehlentscheidungen und unnötige Ausgaben.

## ChatGPT, Claude, Gemini: was ist was?

Alle drei sind große Sprachmodelle, trainiert auf Milliarden von Texten aus Büchern, Websites, Foren und Wikipedia. Technisch sagen sie das nächste Wort voraus. Das erklärt, warum KI manchmal Unsinn schreibt, dazu gleich mehr.

Funktionsumfang, Modellzugang, Nutzungslimits und Preise ändern sich häufig und unterscheiden sich nach Land, Steuerstatus und Vertrag. Prüfe deshalb vor jeder Entscheidung die aktuelle Produkt- und Preisseite des Anbieters.

ChatGPT hat das breiteste Werkzeug-Ökosystem, Claude ist stark bei langen Texten und Dokumentarbeit, Gemini bei der Integration mit Google-Produkten. Den ausführlichen Vergleich findest du unter „Modellvergleich" weiter unten. Es gibt kein allgemein bestes Tool. Gib zwei oder drei Angeboten dieselbe anonymisierte Aufgabe und bewerte Qualität, Bedienbarkeit, Datenverarbeitung und Gesamtkosten für deinen konkreten Fall.

**Perplexity:** eine KI-gestützte Suchoberfläche mit Quellenlinks. Quellenangaben sind ein Ausgangspunkt, kein Wahrheitsbeweis. Öffne die Primärquelle und prüfe, ob sie die Antwort tatsächlich trägt.

**Mistral:** ein europäischer Anbieter mit gehosteten und teilweise selbst betreibbaren Modellen. Ein Firmensitz in Europa beweist für sich keine DSGVO-Konformität, ein EU-Rechenzentrum auch nicht. Prüfe Produktvariante, Vertragsrolle, Auftragsverarbeitung, Unterauftragnehmer, Speicherorte, Löschfristen und Datenkontrollen.

**Aleph Alpha:** ein deutscher Anbieter mit Enterprise- und Souveränitätsfokus. Auch hier entscheiden Produkt- und Vertragsdetails. Marketingbegriffe wie „souverän" ersetzen keine Prüfung der konkreten Datenflüsse.

### Offene Modelle: eine zusätzliche Betriebsoption

Offene oder offen gewichtete Modelle laufen lokal oder auf eigener Infrastruktur. „Offen" kann sich auf Gewichte, Quellcode oder Lizenz beziehen, und diese drei sind nicht austauschbar. Prüfe für jedes Modell die aktuelle Lizenz, Hardwareanforderungen, Sicherheitsupdates und Eignung für den Zweck.

| Auswahlfrage | Was du prüfst |
|--------|-------------|
| **Lizenz** | Erlaubte Nutzung, Weitergabe und kommerzielle Bedingungen |
| **Qualität** | Eigene Testfälle statt allgemeiner Bestenlisten |
| **Betrieb** | Hardware, Energie, Wartung, Backups und Monitoring |
| **Datenschutz** | Tatsächliche Datenflüsse, Logs, Plugins und externe APIs |
| **Kosten** | Gesamtbetrieb statt nur Modell- oder Tokenpreis |

Ein lokal betriebenes Modell kann laufende API-Kosten reduzieren. Ob es günstiger ist, hängt von Auslastung, Hardware, Wartungszeit und Stromkosten bei deinem realen Volumen ab.

### Ollama: KI auf deinem Laptop, ohne Cloud

Ollama ist ein Programm, das kompatible Sprachmodelle auf deinem Rechner ausführt. Das kann Datenübertragungen an einen Modellanbieter vermeiden, löst Datenschutz und Informationssicherheit aber nicht automatisch. Ob Daten den Rechner verlassen, hängt zusätzlich von Modellquelle, Updates, angebundenen Werkzeugen, Telemetrie, Betriebssystem, Backups und deiner Konfiguration ab. Prüfe Netzwerkzugriffe und Schutzmaßnahmen selbst.

**Installation:**
1. Geh auf ollama.com
2. Lade die Version für dein Betriebssystem herunter (Mac, Windows, Linux)
3. Installieren, Terminal öffnen, fertig

**Dein erstes lokales Modell starten:**
```
ollama pull llama3.2
ollama run llama3.2
```

Das Modell-Tag ist nur ein Beispiel und kann veraltet sein. Wähle ein aktuell angebotenes, für deine Hardware geeignetes Modell aus der offiziellen Bibliothek. Nach dem Download läuft die Inferenz lokal. Sichere trotzdem Gerät und Gesamtworkflow.

**Welches Modell für welchen Zweck?**

| Auswahlkriterium | Prüfung |
|--------|---------|
| Modell und Variante | aktueller offizieller Katalog, Lizenz und Prüfsumme |
| Speicherbedarf | konkrete Quantisierung und Kontextlänge gegen freie Ressourcen testen |
| Qualität | repräsentative, nicht vertrauliche Aufgaben mit festen Kriterien |
| Sicherheit | Herkunft, Updates, Modellkarte, bekannte Grenzen und Werkzeugzugriffe |

**Datenschutzvorteil mit Grenzen:** Ein rein lokaler, korrekt konfigurierter Ablauf kann externe Datenübertragungen vermeiden. Rechtsgrundlage, Zweckbindung, Zugriffsschutz, Aufbewahrung, Betroffenenrechte und berufsrechtliche Pflichten bleiben bestehen. Bei besonderen Kategorien personenbezogener Daten oder Berufsgeheimnissen ist eine fachliche Prüfung erforderlich.

Qualität und Hardwarebedarf hängen von Modell und Aufgabe ab; teste mit repräsentativen, nicht vertraulichen Fällen. Verwende Cloud-Dienste nur, wenn Daten, Vertrag, Einstellungen und Zweck dafür freigegeben sind.

### Was kostet dich KI wirklich?

Bevor du Abos stapelst, rechne mit den aktuellen Preisen und deiner tatsächlichen Nutzung.

**Szenario 1: Test ohne zusätzliches Bezahlabo**
- Aktuell verfügbaren kostenlosen Tarif und/oder lokales Modell prüfen, geeignet für einen begrenzten, nicht vertraulichen Vergleich
- Nicht kostenfrei im Vollsinn, denn Hardware, Strom, Einrichtung, Wartung und Arbeitszeit zählen mit

**Szenario 2: Ein bezahlter Dienst plus lokale Tests**
- Ein Bezahl-Abo und ein lokal getestetes Modell, wenn der zusätzliche Funktionsumfang in deinen Messungen einen Nutzen zeigt
- Kosten und Zeitgewinn in einer vierwöchigen Testphase messen

**Szenario 3: Mehrere Spezialwerkzeuge**
- Mehrere Dienste nur bei klar getrennten, regelmäßig genutzten Aufgaben
- Nutzung, Qualitätsgewinn und Gesamtkosten je Dienst dokumentieren
- Ungenutzte oder doppelte Abos kündigen

**Szenario 4: API statt Oberfläche**
- Direkte API-Nutzung über einen ausgewählten Anbieter
- Kosten anhand aktueller Tokenpreise, Ein-/Ausgabelänge, Wiederholungen und Fehlerrate berechnen
- Für: IT-Freelancer, Entwickler, Automatisierungs-Enthusiasten

Eine API kann bei planbarem Volumen günstiger oder teurer als ein Abo sein. Verwende den aktuellen Preisrechner des Anbieters und ergänze Entwicklungs-, Prüf-, Monitoring- und Betriebskosten.

### Modellvergleich: so bleibt er belastbar

> **Redaktionell geprüft: 28. Juli 2026.** Modelle und Tarife ändern sich schnell. Die Tabelle vermeidet deshalb Versions- und Preisversprechen. Prüfe aktuelle Funktionen, Preise und Vertragsbedingungen direkt beim Anbieter.

| | ChatGPT (OpenAI) | Claude (Anthropic) | Gemini (Google) | DeepSeek |
|---|---|---|---|---|
| **Vergleichsdimension** | Werkzeug-Ökosystem | Dokumentarbeit | Produktintegration | Eigenbetrieb |
| **Testaufgabe** | Allgemeine Arbeitsabläufe | Lange Texte und Dateien | Multimodale und Google-nahe Abläufe | Wiederholbare interne Aufgaben |
| **Kosten prüfen** | Tarif und API separat | Tarif und API separat | Tarif und API separat | Hardware, Betrieb und Wartung |
| **Datenschutz prüfen** | Produkt, Vertrag, Einstellung, Datenfluss | Produkt, Vertrag, Einstellung, Datenfluss | Produkt, Vertrag, Einstellung, Datenfluss | Gesamtsystem einschließlich Logs und Backups |
| **Entscheidung** | Eigene Qualitäts- und Risikotests | Eigene Qualitäts- und Risikotests | Eigene Qualitäts- und Risikotests | Eigene Qualitäts- und Risikotests |

> **Dein Tool-Auswahl-Prompt**
>
> ```
> Kontext: Ich bin [BERUF] und suche das richtige KI-Tool für
> [HAUPTAUFGABE]. Mein Budget ist [BETRAG] EUR/Monat.
> DSGVO-Konformität ist [WICHTIG/NICHT PRIORITÄR].
> Rolle: Du bist ein unabhängiger KI-Tool-Berater.
> Aufgabe: Empfehle mir das beste KI-Tool für meine Situation.
> Vergleiche die Top 3 Optionen mit Vor- und Nachteilen.
> Format: Kurzer Vergleich (max. 200 Wörter), dann eine klare
> Empfehlung.
> Ton: Neutral, pragmatisch, keine Werbung.
> ```

## Kostenlos vs. bezahlt: wann sich ein Tarif lohnt

Die kostenlose Version von ChatGPT reicht zum Ausprobieren, für Texte, Fragen und einfache Aufgaben. Ihre Grenzen sind langsamere Antworten, ältere Modelle, weniger Funktionen und strengere Nutzungslimits. Bezahlversionen können höhere Limits oder zusätzliche Funktionen bieten, je nach aktuellem Tarif.

Ob sich das lohnt, zeigen Messwerte. Erfasse über vier Wochen Bearbeitungszeit, Nacharbeit und Fehler für dieselben Aufgabentypen. Ein fiktives Rechenbeispiel: 2 tatsächlich frei werdende Stunden × 75 EUR interner Bewertungsansatz = 150 EUR potenzieller Gegenwert. Das ist weder Umsatz noch Ersparnis, solange die Zeit nicht sinnvoll genutzt oder ein realer Aufwand vermieden wird. Ziehe Tarif, Einrichtung, Prüfung und Korrekturen ab.

Fang mit einem kostenlosen oder zeitlich begrenzten Test an, mit vorher definierten Aufgaben. In einen Bezahlvertrag wechselst du erst, wenn eigene Messwerte den zusätzlichen Nutzen zeigen.

Starte mit einem Tool. Ich würde mit ChatGPT anfangen, weil das Ökosystem am größten ist; wenn du vor allem Texte schreibst, mit Claude. Nach einer Woche entscheidest du, ob du das zweite dazunimmst.

Die API-Nutzung, also KI direkt in deine eigenen Tools einbauen, wird erst ab Kapitel 10 relevant.

## Account einrichten und absichern

Nimm dir genug Zeit für Konto, Datenkontrollen und Arbeitsregeln. Menüs und Optionen ändern sich, also verlass dich nicht auf Screenshots aus dem Internet.

**Schritt 1: Account erstellen**

Geh auf chat.openai.com (ChatGPT) oder claude.ai (Claude) und registriere dich mit deiner geschäftlichen E-Mail-Adresse. Warum, steht in der Infobox unten.

**Schritt 2: Datenschutz einstellen**

Bei ChatGPT: Einstellungen → Data Controls → "Improve the model for everyone" ausschalten. Damit verhinderst du, dass deine Chats zum Training verwendet werden.

Bei Claude ist die Standardeinstellung datenschutzfreundlicher: Chats werden nicht für Training verwendet, solange du nicht explizit zustimmst.

Bei beiden: Überlege, ob du die Chat-Historie brauchst. Speicher- und Verarbeitungsorte hängen aber vom konkreten Produkt, Konto, Vertrag und den aktuellen Anbieterbedingungen ab. Gib keine vertraulichen oder fremden personenbezogenen Daten ein, bevor du diese Punkte geprüft hast. Mehr dazu in Kapitel 8.

**Schritt 3: Custom Instructions einrichten**

Custom Instructions sind ein permanentes Briefing, das bei jeder Konversation gilt. Du richtest sie einmal ein.

> **Deine Custom-Instructions-Vorlage (zum Kopieren)**
>
> ```
> Kontext: Ich bin [BERUF] in [BRANCHE]. Meine Kunden sind
> [ZIELGRUPPE]. Ich schreibe auf Deutsch. Ich bevorzuge
> [FORMELLE/INFORMELLE] Sprache.
> Rolle: Du bist mein persönlicher Arbeitsassistent.
> Aufgabe: Beantworte meine Fragen immer mit Bezug auf meine
> Branche. Gib konkrete, umsetzbare Antworten. Frage nach,
> wenn dir Infos fehlen.
> Format: Stichpunkte bei kurzen Antworten. Fließtext bei langen.
> Maximal [N] Wörter, sofern nicht anders gesagt.
> Ton: [TON, z.B. professionell aber locker, wie ein Kollege].
> ```
>
> Ersetze die [PLATZHALTER] und füge den Text in deine Custom Instructions ein. Bei ChatGPT: Einstellungen → Personalization → Custom Instructions. Bei Claude: Profil → User preferences.

> **Infobox: Business und Privat trennen**
>
> Erstelle getrennte Accounts für Arbeit und Privat. Irgendwann gibst du Kundendaten ein, ohne darüber nachzudenken, etwa eine E-Mail oder einen Vertragsentwurf. Passiert das in deinem privaten Account, hast du ein DSGVO-Problem. Mehr dazu in Kapitel 8.

## Was KI nicht kann, und wo du aufpassen musst

**Halluzinationen: Wenn KI überzeugend lügt**

ChatGPT erfindet Zahlen, Zitate, Quellen, Studien, Gesetze und Paragrafen. Das Modell hat kein Konzept von Wahrheit, es berechnet die statistisch wahrscheinlichste Antwort, und die ist manchmal falsch.

Fragst du "Wie hoch ist der Freibetrag für Kleinunternehmer in Deutschland?", bekommst du eine plausible Zahl. Sie kann stimmen, von 2019 sein oder komplett erfunden.

Deshalb prüfst du Zahlen, Zitate und Fakten immer.

**Aktualität: Die KI lebt in der Vergangenheit**

Jedes Sprachmodell hat einen Wissens-Cutoff, nach dem es nichts Neues mehr gelernt hat. ChatGPT weiß nicht, was letzte Woche im Bundesanzeiger stand, und Claude kennt die neuesten Steueränderungen nicht. Gesetze, Preise und Fristen prüfst du deshalb gegen die originale Quelle. Für Texte, Strukturen und Brainstorming spielt der Cutoff keine Rolle.

**Vertraulichkeit: Was rein geht, bleibt nicht bei dir**

Was du in einen Cloud-Dienst tippst, wird auf Systemen des Anbieters verarbeitet. Region, Speicherfristen, Trainingsnutzung und Unterauftragnehmer hängen vom konkreten Produkt, Konto, Vertrag und den aktuellen Einstellungen ab. Prüfe das vor der Nutzung, statt von einem pauschalen Serverstandort auszugehen.

> **Checkliste: 5 Dinge, die du NIEMALS in ChatGPT eingeben solltest**
>
> 1. **Kundennamen und Kontaktdaten:** anonymisiere oder verwende Platzhalter
> 2. **Finanzamt-Bescheide und Steuerdaten**
> 3. **Vertrags- und Geschäftsgeheimnisse:** NDAs gelten auch für KI-Chats
> 4. **Gesundheitsdaten:** besonders relevant für Therapeuten, Coaches, Heilpraktiker
> 5. **Passwörter, API-Keys, Zugangsdaten**

> **Achtung reglementierte Berufe:** Wenn du Rechtsanwalt, Steuerberater, Arzt oder Psychotherapeut bist, gelten zusätzlich §203 StGB (Verletzung von Privatgeheimnissen) und berufsrechtliche Verschwiegenheitspflichten. Die Eingabe mandantenbezogener oder patientenbezogener Daten in KI-Tools kann eine Straftat darstellen. Lass deine KI-Nutzung von deiner Kammer oder einem Fachanwalt prüfen.

Warum das ernst ist: Spezialisierte Legal-AI-Unternehmen wie Noxtua existieren, weil Anwaltskanzleien keine Mandantendaten in US-Clouds schicken dürfen. Was für deren Kunden gilt, gilt auch für dich als Freiberufler mit Schweigepflicht.

"Aber Tim, dann kann ich ja gar nichts Vertrauliches mit KI machen?"

Für manche Aufgaben reicht eine wirksame Anonymisierung oder ein vollständig fiktiver Datensatz. „Kunde A, mittelständisches Unternehmen im Maschinenbau" ist ein besserer Ausgangspunkt als ein echter Firmenname. Prüfe trotzdem, ob die Kombination der Details eine Person oder Organisation erkennbar macht. In Kapitel 8 gehen wir tiefer in die DSGVO-Thematik.

Produktiv genutzt braucht jede KI-Ausgabe eine dem Risiko angemessene Prüfung. Wer prüft, wonach und wer freigibt, steht vorher fest.

Prüfung ist Teil der Bearbeitungszeit, also misst du den Gesamtprozess. Bei kritischen Aufgaben kann die Prüfung länger dauern als der Entwurf.

> **Praxisprojekt 2: KI-Angebote vergleichen und absichern**
>
> **Was du brauchst:** ChatGPT (kostenlos) + Claude (kostenlos) + Ollama (kostenlos)
> **Zeitaufwand:** selbst messen
> **Was du danach hast:** einen dokumentierten Vergleich von Cloud- und Lokalbetrieb, noch keine pauschale Freigabe für vertrauliche Daten
>
> **Schritt 1:** Erstelle einen ChatGPT-Account auf chat.openai.com und fülle in 5 Minuten die Custom Instructions aus: Beruf, Branche, bevorzugter Ton.
>
> **Schritt 2:** Erstelle einen Claude-Account auf claude.ai, für lange Texte wie Angebote, Blogartikel und Recherchen.
>
> **Schritt 3:** Optional, installiere Ollama von der offiziellen Website und teste ein passendes Modell zunächst nur mit fiktiven Daten. Prüfe anschließend Netzwerk, Updates, Logs, Geräteschutz und angebundene Werkzeuge, bevor du einen vertraulichen Anwendungsfall erwägst.
>
> **Schritt 4:** Teste alle drei mit derselben vollständig fiktiven oder wirksam anonymisierten Anfrage. Kopiere keine echte Kunden-E-Mail ungeprüft in einen Dienst. Vergleiche Qualität, Nacharbeit und Datenkontrollen.
>
> **Du hast jetzt:** einen dokumentierten Vergleich mehrerer Betriebsmodelle. „Lokal" ist kein Datenschutz-Tresor; die Freigabe richtet sich nach dem gesamten technischen und rechtlichen Ablauf.

> **Messblatt statt Zeitversprechen**
>
> | Messgröße | Dein Wert |
> |---|---|
> | Bearbeitungszeit ohne Werkzeug | ___ |
> | Bearbeitungszeit mit Werkzeug inklusive Prüfung | ___ |
> | Fehler oder notwendige Korrekturen | ___ |
> | Aktuelle Gesamtkosten laut Anbieter und Betrieb | ___ |

Was jetzt noch fehlt, ist die Anweisung. Kapitel 3 zeigt die KRAFT-Methode.
