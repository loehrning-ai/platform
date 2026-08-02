# KI-Grundlagen: nur was du brauchst

Du musst nicht wissen, wie ein Verbrennungsmotor funktioniert, um Auto zu fahren.

Aber es hilft zu wissen, dass man regelmäßig tanken muss, nicht auf Eis beschleunigt und dass komische Geräusche nicht von alleine weggehen.

Genauso ist es mit KI. Du brauchst kein Informatikstudium. Aber wenn du verstehst, warum ChatGPT manchmal überzeugend lügt, wirst du nie wieder blind einer KI-Antwort vertrauen.

Dieses Grundverständnis kann Fehlentscheidungen und unnötige Ausgaben vermeiden.

## ChatGPT, Claude, Gemini: was ist was?

Die kurze Version: Alle drei sind große Sprachmodelle. Sie wurden auf Milliarden von Texten trainiert, Bücher, Websites, Foren, Wikipedia. Und sie tun im Kern nur eins: das nächste Wort vorhersagen.

Das klingt unspektakulär. Ist es auch. Dass dabei etwas Brauchbares rauskommt, ist das eigentliche Wunder. Es erklärt auch, warum KI manchmal Unsinn schreibt, dazu gleich mehr.

Für dich als Selbstständige/r reicht das als technisches Verständnis. Wenn du tiefer einsteigen willst: Mein Buch "KI verstehen" (Löhrning Verlag) erklärt die Mechanik dahinter. Hier geht es um Anwendung.

ChatGPT, Claude und Gemini gehören zu den verbreiteten Angeboten. Funktionsumfang, Modellzugang, Nutzungslimits und Preise ändern sich häufig und unterscheiden sich nach Land, Steuerstatus und Vertrag. Prüfe deshalb vor einer Entscheidung immer die aktuelle Produkt- und Preisseite des Anbieters.

| | ChatGPT (OpenAI) | Claude (Anthropic) | Gemini (Google) |
|---|---|---|---|
| **Typische Stärke** | Breites Werkzeug-Ökosystem | Lange Texte und Dokumentarbeit | Integration mit Google-Produkten |
| **Vor Einsatz prüfen** | Tarif, Datenkontrollen, Modellzugang | Tarif, Datenkontrollen, Modellzugang | Tarif, Datenkontrollen, Modellzugang |
| **Datenschutz** | Hängt von Produkt, Konto, Vertrag und Einstellungen ab | Hängt von Produkt, Konto, Vertrag und Einstellungen ab | Hängt von Produkt, Konto, Vertrag und Einstellungen ab |
| **Für wen** | Allgemeine Aufgaben und Werkzeuge | Text- und Dokumentaufgaben | Bestehende Google-Arbeitsabläufe |

Es gibt kein allgemein bestes Tool. Vergleiche zwei oder drei Angebote mit derselben anonymisierten Aufgabe und bewerte Qualität, Bedienbarkeit, Datenverarbeitung und Gesamtkosten für deinen konkreten Fall.

Zwei weitere, die du kennen solltest:

**Perplexity:** eine KI-gestützte Suchoberfläche mit Quellenlinks. Quellenangaben sind ein Ausgangspunkt, kein Wahrheitsbeweis. Öffne die Primärquelle und prüfe, ob sie die Antwort tatsächlich trägt.

**Mistral:** ein europäischer Anbieter mit gehosteten und teilweise selbst betreibbaren Modellen. Der Sitz eines Anbieters oder ein EU-Rechenzentrum beweist allein keine DSGVO-Konformität. Prüfe Produktvariante, Vertragsrolle, Auftragsverarbeitung, Unterauftragnehmer, Speicherorte, Löschfristen und Datenkontrollen.

**Aleph Alpha:** ein deutscher Anbieter mit Enterprise- und Souveränitätsfokus. Auch hier gilt: Produkt- und Vertragsdetails entscheiden. Marketingbegriffe wie „souverän" ersetzen keine Prüfung der konkreten Datenflüsse.

### Offene Modelle: eine zusätzliche Betriebsoption

Offene oder offen gewichtete Modelle können lokal oder auf eigener Infrastruktur betrieben werden. „Offen" kann sich auf Gewichte, Quellcode oder Lizenz beziehen; diese Begriffe sind nicht austauschbar. Prüfe für jedes Modell die aktuelle Lizenz, Hardwareanforderungen, Sicherheitsupdates und Eignung für den Zweck.

| Auswahlfrage | Was du prüfst |
|--------|-------------|
| **Lizenz** | Erlaubte Nutzung, Weitergabe und kommerzielle Bedingungen |
| **Qualität** | Eigene Testfälle statt allgemeiner Bestenlisten |
| **Betrieb** | Hardware, Energie, Wartung, Backups und Monitoring |
| **Datenschutz** | Tatsächliche Datenflüsse, Logs, Plugins und externe APIs |
| **Kosten** | Gesamtbetrieb statt nur Modell- oder Tokenpreis |

Ein lokal betriebenes Modell kann laufende API-Kosten reduzieren. Ob es günstiger ist, hängt von Auslastung, Hardware, Wartungszeit und Stromkosten ab. Rechne mit deinem realen Volumen.

### Ollama: KI auf deinem Laptop, ohne Cloud

Ollama ist eine Möglichkeit, kompatible Modelle lokal auszuführen. Das kann Datenübertragungen an einen Modellanbieter vermeiden, löst Datenschutz und Informationssicherheit aber nicht automatisch.

**Was ist Ollama?** Ein Programm, das Sprachmodelle auf deinem Rechner ausführt. Ob Daten den Rechner verlassen, hängt zusätzlich von Modellquelle, Updates, angebundenen Werkzeugen, Telemetrie, Betriebssystem, Backups und deiner Konfiguration ab. Prüfe Netzwerkzugriffe und Schutzmaßnahmen selbst.

**Installation:**
1. Geh auf ollama.com
2. Lade die Version für dein Betriebssystem herunter (Mac, Windows, Linux)
3. Installieren, Terminal öffnen, fertig

**Dein erstes lokales Modell starten:**
```
ollama pull llama3.2
ollama run llama3.2
```

Das Modell-Tag ist nur ein Beispiel und kann veraltet sein. Wähle ein aktuell angebotenes, für deine Hardware geeignetes Modell aus der offiziellen Bibliothek. Nach dem Download läuft die Inferenz lokal; sichere trotzdem Gerät und Gesamtworkflow.

**Welches Modell für welchen Zweck?**

| Auswahlkriterium | Prüfung |
|--------|---------|
| Modell und Variante | aktueller offizieller Katalog, Lizenz und Prüfsumme |
| Speicherbedarf | konkrete Quantisierung und Kontextlänge gegen freie Ressourcen testen |
| Qualität | repräsentative, nicht vertrauliche Aufgaben mit festen Kriterien |
| Sicherheit | Herkunft, Updates, Modellkarte, bekannte Grenzen und Werkzeugzugriffe |

**Datenschutzvorteil mit Grenzen:** Ein rein lokaler, korrekt konfigurierter Ablauf kann externe Datenübertragungen vermeiden. Rechtsgrundlage, Zweckbindung, Zugriffsschutz, Aufbewahrung, Betroffenenrechte und berufsrechtliche Pflichten bleiben bestehen. Bei besonderen Kategorien personenbezogener Daten oder Berufsgeheimnissen ist eine fachliche Prüfung erforderlich.

Qualität und Hardwarebedarf unterscheiden sich nach Modell und Aufgabe. Teste mit repräsentativen, nicht vertraulichen Fällen. Verwende Cloud-Dienste nur, wenn Daten, Vertrag, Einstellungen und Zweck dafür freigegeben sind.

### Was kostet dich KI wirklich?

Bevor du mehrere Abos kombinierst, rechne mit den aktuellen Preisen und deiner tatsächlichen Nutzung.

**Szenario 1: Test ohne zusätzliches Bezahlabo**
- Aktuell verfügbaren kostenlosen Tarif und/oder lokales Modell prüfen
- Geeignet für einen begrenzten, nicht vertraulichen Vergleich
- Nicht kostenfrei im Vollsinn: Hardware, Strom, Einrichtung, Wartung und Arbeitszeit berücksichtigen

**Szenario 2: Ein bezahlter Dienst plus lokale Tests**
- Ein Bezahl-Abo + ein lokal getestetes Modell
- Geeignet, wenn der zusätzliche Funktionsumfang in deinen Messungen einen Nutzen zeigt
- Kosten und Zeitgewinn mit einer vierwöchigen Testphase messen

**Szenario 3: Mehrere Spezialwerkzeuge**
- Mehrere Dienste nur bei klar getrennten, regelmäßig genutzten Aufgaben
- Für jeden Dienst Nutzung, Qualitätsgewinn und Gesamtkosten einzeln dokumentieren
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

Die kostenlose Version von ChatGPT reicht zum Ausprobieren. Du kannst Texte schreiben lassen, Fragen stellen, einfache Aufgaben erledigen. Aber du stößt schnell an Grenzen: langsamere Antworten, ältere Modelle, weniger Funktionen, strengere Nutzungslimits.

Bezahlversionen können höhere Limits oder zusätzliche Funktionen bieten. Der konkrete Umfang hängt vom aktuellen Tarif ab.

Lohnt sich das?

Rechne mit Messwerten: Erfasse über vier Wochen Bearbeitungszeit, Nacharbeit und Fehler für dieselben Aufgabentypen. Ein fiktives Rechenbeispiel: 2 tatsächlich frei werdende Stunden × 75 EUR interner Bewertungsansatz = 150 EUR potenzieller Gegenwert. Das ist weder Umsatz noch Ersparnis, solange die Zeit nicht sinnvoll genutzt oder ein realer Aufwand vermieden wird. Ziehe Tarif, Einrichtung, Prüfung und Korrekturen ab.

Starte mit einem kostenlosen oder zeitlich begrenzten Test und vorher definierten Aufgaben. Wechsle erst dann in einen Bezahlvertrag, wenn eigene Messwerte den zusätzlichen Nutzen zeigen.

Nicht beide gleichzeitig. Starte mit einem. Ich würde mit ChatGPT anfangen, weil das Ökosystem am größten ist. Wenn du vor allem Texte schreibst: Claude. Entscheide nach einer Woche, ob du das zweite Tool dazunimmst.

Die API-Nutzung, KI direkt in deine eigenen Tools einbauen, ist erst ab Kapitel 10 relevant. Für jetzt: Browser öffnen, einloggen, loslegen.

## Account einrichten und absichern

Plane genug Zeit ein, um Konto, Datenkontrollen und Arbeitsregeln sorgfältig einzurichten. Menüs und Optionen können sich ändern.

**Schritt 1: Account erstellen**

Geh auf chat.openai.com (ChatGPT) oder claude.ai (Claude). E-Mail-Adresse, Passwort, fertig. Nutze deine geschäftliche E-Mail-Adresse, nicht die private. Warum, kommt gleich.

**Schritt 2: Datenschutz einstellen**

Bei ChatGPT: Einstellungen → Data Controls → "Improve the model for everyone" ausschalten. Damit verhinderst du, dass deine Chats zum Training verwendet werden.

Bei Claude: Die Standardeinstellung ist bereits datenschutzfreundlicher, Chats werden nicht für Training verwendet, solange du nicht explizit zustimmst.

Bei beiden: Überlege, ob du die Chat-Historie brauchst. Für die Arbeit kann sie praktisch sein. Speicher- und Verarbeitungsorte hängen jedoch vom konkreten Produkt, Konto, Vertrag und den aktuellen Anbieterbedingungen ab. Gib keine vertraulichen oder fremden personenbezogenen Daten ein, bevor diese Punkte geprüft sind. Mehr dazu in Kapitel 8.

**Schritt 3: Custom Instructions einrichten**

Das ist der Schritt, den die wenigsten machen, den die wenigsten nutzen. Custom Instructions sind ein permanentes Briefing, das bei jeder Konversation gilt. Dein Betriebssystem für die KI. Einmal einrichten, immer wirksam.

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
> Erstelle getrennte Accounts für Arbeit und Privat. Klingt übertrieben? Ist es nicht. Irgendwann gibst du Kundendaten ein, ohne darüber nachzudenken, eine E-Mail hier, ein Vertragsentwurf dort. Wenn das in deinem privaten Account passiert, hast du ein DSGVO-Problem. Getrennte Accounts, getrennte Risiken. Mehr dazu in Kapitel 8.

## Was KI nicht kann, und wo du aufpassen musst

Jetzt wird es ernst. Dieser Abschnitt ist kein Pflichtprogramm, das du überspringen solltest. Er ist der Abschnitt, der dich vor teuren Fehlern bewahrt.

**Halluzinationen: Wenn KI überzeugend lügt**

ChatGPT erfindet Dinge. Zahlen, Zitate, Quellen, Studien, Gesetze, Paragrafen. Nicht aus Bosheit, das Modell hat kein Konzept von Wahrheit. Es berechnet die statistisch wahrscheinlichste Antwort. Und manchmal ist die wahrscheinlichste Antwort falsch.

Ein Beispiel: Du fragst "Wie hoch ist der Freibetrag für Kleinunternehmer in Deutschland?" und bekommst eine Zahl. Die Zahl klingt plausibel. Sie könnte stimmen. Sie könnte aber auch von 2019 sein. Oder komplett erfunden.

Regel Nummer eins: Zahlen, Zitate und Fakten immer prüfen.

Immer.

Das ist nicht optional. Das ist die Bedienungsanleitung.

**Aktualität: Die KI lebt in der Vergangenheit**

Jedes Sprachmodell hat einen Wissens-Cutoff, einen Zeitpunkt, nach dem es keine neuen Informationen hat. ChatGPT weiß nicht, was letzte Woche im Bundesanzeiger stand. Claude kennt die neuesten Steueränderungen nicht. Wenn du aktuelle Informationen brauchst, Gesetze, Preise, Fristen, prüfe immer gegen die originale Quelle.

Für zeitlose Aufgaben, Texte schreiben, Strukturen erstellen, Ideen brainstormen, ist das kein Problem. Für alles mit Datum: Vorsicht.

**Vertraulichkeit: Was rein geht, bleibt nicht bei dir**

Eingaben in einen Cloud-Dienst werden auf Systemen des Anbieters verarbeitet. Region, Speicherfristen, Trainingsnutzung und Unterauftragnehmer hängen vom konkreten Produkt, Konto, Vertrag und den aktuellen Einstellungen ab. Prüfe diese Punkte vor der Nutzung statt von einem pauschalen Serverstandort auszugehen.

> **Checkliste: 5 Dinge, die du NIEMALS in ChatGPT eingeben solltest**
>
> 1. **Kundennamen und Kontaktdaten:** anonymisiere oder verwende Platzhalter
> 2. **Finanzamt-Bescheide und Steuerdaten:** dein Steuerberater würde schreien
> 3. **Vertrags- und Geschäftsgeheimnisse:** NDAs gelten auch für KI-Chats
> 4. **Gesundheitsdaten:** besonders relevant für Therapeuten, Coaches, Heilpraktiker
> 5. **Passwörter, API-Keys, Zugangsdaten:** klingt offensichtlich. Passiert trotzdem.

> **Achtung reglementierte Berufe:** Wenn du Rechtsanwalt, Steuerberater, Arzt oder Psychotherapeut bist, gelten zusätzlich §203 StGB (Verletzung von Privatgeheimnissen) und berufsrechtliche Verschwiegenheitspflichten. Die Eingabe mandantenbezogener oder patientenbezogener Daten in KI-Tools kann eine Straftat darstellen. Lass deine KI-Nutzung von deiner Kammer oder einem Fachanwalt prüfen.

Warum das ernst ist: Es gibt spezialisierte Legal-AI-Unternehmen wie Noxtua, die existieren, weil Anwaltskanzleien keine Mandantendaten in US-Clouds schicken dürfen. Was für deren Kunden gilt, gilt auch für dich als Freiberufler mit Schweigepflicht.

"Aber Tim, dann kann ich ja gar nichts Vertrauliches mit KI machen?"

Für manche Aufgaben reicht eine wirksame Anonymisierung oder ein vollständig fiktiver Datensatz. „Kunde A, mittelständisches Unternehmen im Maschinenbau" ist ein besserer Ausgangspunkt als ein echter Firmenname. Prüfe, ob Kombinationen von Details trotzdem eine Person oder Organisation erkennbar machen. In Kapitel 8 gehen wir tiefer in die DSGVO-Thematik.

Für produktive Nutzung braucht jede KI-Ausgabe eine dem Risiko angemessene Prüfung. Verantwortliche, Prüfkriterien und Freigabeschritte müssen vorab feststehen.

Prüfung ist Teil der Bearbeitungszeit. Wie lange Gegenlesen und Quellenprüfung dauern, hängt von Umfang und Risiko ab. Miss den Gesamtprozess; bei kritischen Aufgaben kann die Prüfung länger dauern als der Entwurf.

Jetzt hast du die Grundlagen. Du weißt, welche Tools es gibt, was sie kosten, wie du sie einrichtest und wo die Grenzen liegen.

> **Praxisprojekt 2: KI-Angebote vergleichen und absichern**
>
> **Was du brauchst:** ChatGPT (kostenlos) + Claude (kostenlos) + Ollama (kostenlos)
> **Zeitaufwand:** selbst messen
> **Was du danach hast:** einen dokumentierten Vergleich von Cloud- und Lokalbetrieb, noch keine pauschale Freigabe für vertrauliche Daten
>
> **Schritt 1:** Erstelle einen ChatGPT-Account auf chat.openai.com. Geh in die Einstellungen und fülle die Custom Instructions aus: Dein Beruf, deine Branche, dein bevorzugter Ton. Das dauert 5 Minuten und macht jede Antwort sofort relevanter.
>
> **Schritt 2:** Erstelle einen Claude-Account auf claude.ai. Claude ist der Spezialist für lange Texte und gründliche Analysen. Ideal für Angebote, Blogartikel und komplexe Recherchen.
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

Zeit für das System, das alles zusammenhält. Kapitel 3: Die KRAFT-Methode.
