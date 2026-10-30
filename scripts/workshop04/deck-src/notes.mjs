/**
 * Speaker notes of the Workshop 04 deck, one per slide in deck order (appendix included). The
 * slides carry pictures and motion; the talking lives here. Format per note: a title line, then
 * Time, Say, Students, Cue and Remember lines (lib/presenter.js reads them; Time sums to 60 min).
 * Tim drives Claude Desktop on the projector; Students lines say what the room does, never that it
 * runs a prompt. Cues of the Claude slides have three parts: the deck, the switch to Claude Desktop
 * with each click of the strip, and back to the deck.
 */
const note = (title, lines) => [title, ...Object.entries(lines).map(([key, value]) => `${key}: ${value}`)].join("\n");

const SOURCE_NOTES = {
  de: [
    note("ESG-Berichte mit KI", {
      Time: "30 s",
      Say: "Ein Weingut bekommt drei Anfragen: vom Importeur, vom Marketing und von der Bank. Alle wollen Antworten aus demselben Ordner. Wir entscheiden, was die Firma davon belegen kann. Ich arbeite in meinem Claude, ihr schätzt und prüft die Quellen.",
      Students: "Ankommen. Ich bediene Claude; ihr prüft die Quellen. Kein Laptop nötig.",
      Cue: "Vorher: Claude Desktop offen, Kit entpackt, START-HIER.md im Texteditor. Vorher den deutschen Skill esg-nachweise hochladen und einschalten, Run code in the cloud prüfen, Haiku wählen. Fertiges Projekt als Reserve. Pfeil rechts startet den Fall.",
      Remember: "Kein Wort über Werkzeuge. Erst der Fall.",
    }),
    note("Gastgeber", {
      Time: "1 min",
      Say: "Ich bin Tim Loehr, früher Data Scientist bei Apple und Red Bull, heute AI Engineer. Ich betreibe loehrning.ai. Workshop und Kit kommen von loehrning.ai. Der Fall ist erfunden, ohne Arbeitgeberdaten.",
      Students: "Zuhören.",
      Cue: "Die Linie läuft von allein: Apple, Red Bull, Meta, loehrning.ai.",
      Remember: "Unter einer Minute bleiben.",
    }),
    note("Warum jetzt", {
      Time: "2 min",
      Say: "ESG heißt Umwelt, Soziales und Unternehmensführung. Dazu gehören Strom, Wasser, Beschäftigte, Unfälle und Korruption. Drei echte Meldungen erklären den Druck auf unser Weingut. Seit dem 01.01.2026 verlangt Vinmonopolet von Lieferanten: Stillwein unter 250 NOK in Flaschen bis 420 g je 0,75 l. Seit dem 27.09.2026 ist eine produktbezogene Aussage wie „klimaneutral“ auf Basis von Ausgleich in Deutschland verboten. Die EBRD gab der Sparkasse Bank Skopje im Dezember 2025 einen Kredit über bis zu 8 Mio. € für grüne KMU-Kredite, für erneuerbare Energie und Energieeffizienz.",
      Students: "Die drei Auslöser zuordnen: Verpackung, Werbung und Finanzierung.",
      Cue: "Ankunft: E, S und G erklären. Pfeile 1 bis 3: Waage, Etikett, Kredit. Pfeil 4: Was haben alle drei gemeinsam? Jede Aussage braucht einen Beleg.",
      Remember: "Flaschenregel, Gesetz und Kreditlinie sind echt, Quellen im Anhang 1. Der BGH hat schon 2024 verlangt, dass die Werbung selbst sagt, was „klimaneutral“ meint (I ZR 98/23). Weingut, Importeur und Bank sind erfunden.",
    }),
    note("Das Weingut", {
      Time: "1 min 30 s",
      Say: "Vinarija Crvena Zemja, ein Familienweingut in Kavadarci, im Weinbaugebiet Tikveš. 42 Beschäftigte, 40 Hektar Weinberge, rund 550.000 Flaschen Stillwein im Jahr. 74 % des Umsatzes kommen aus dem Export: 31 % aus Deutschland, 22 % von einem Importeur in Schweden.",
      Students: "Zuhören.",
      Cue: "Weingut vorstellen. Pfeil 1: Beschäftigte, Hektar, Flaschen. Pfeil 2: Umsatz nach Ländern.",
      Remember: "Unter dem Balken steht firmenprofil.md, Z. 12. Selbst die Fakten des Falls haben Datei und Zeile. Das ist die Methode dieser Stunde.",
    }),
    note("Drei Anfragen", {
      Time: "1 min",
      Say: "Der Fallstichtag ist der 16.10.2026. Das ist nicht das heutige Workshop-Datum. Wir sitzen im Büro des Weinguts, sieben Tage vor der Rückgabe an Nordvik. Auf dem Tisch liegen drei Anfragen. Der Importeur in Göteborg schickt 8 Fragen, Rückgabe am 23.10.; Antworten ohne Nachweis zählt er nicht. Nordvik bietet die Weine bei Vinmonopolet in Norwegen an; dort gilt die 420-g-Regel. Was die Regel nicht erfüllt, kann Nordvik dort nicht anbieten. Das Marketing des Weinguts will 7 Aussagen auf neue Etiketten für Deutschland drucken, nach dem 27.09. Die Bank in Skopje braucht 6 Felder für den Solarkredit über 8.550.000 Denar, jede Schätzung gekennzeichnet.",
      Students: "Per Zuruf: Welche Anfrage beantwortet ihr zuerst?",
      Cue: "Stichtag zeigen: 16.10. Pfeile 1 bis 3: Importeur, Marketing, Bank. Pfeil 4: 21 Prüfpunkte: 8 Kundenfragen, 7 Werbeentwürfe, 6 Kreditfelder. Nachweise für Kundenanforderungen, Umweltaussagen und den Solarkredit. Die 53 % sind die betroffenen Umsatzanteile, kein nachgewiesener Umsatzverlust.",
      Remember: "Antwort: Nordvik zuerst, Frist 23.10. Aber alle drei fragen nach denselben Fakten, Strom steht in allen drei. Deshalb ein Ordner, und in Schritt 4 ein Register.",
    }),
    note("Heute", {
      Time: "2 min",
      Say: "Die Frage dieser Stunde: Welche Antwort ist belegt, und welches Dokument fehlt? Darunter das Lernziel. Vier Stationen: erst die Regel an einem Satz, dann sucht ihr auf Papier, dann zeige ich Claude live an den drei Anfragen, zum Schluss Register und Nachreichung. Ihr seid heute das Büro des Weinguts. Claude bediene ich, in Claude Desktop am Beamer. Die Leiste oben auf jeder Claude-Folie zeigt, wo ich in Claude gerade bin; ich lese sie vor, bevor ich wechsle. Ihr schätzt vor jedem Lauf das Ergebnis und prüft danach die zitierte Zeile. Zu Hause macht ihr dasselbe mit dem Kit.",
      Students: "Mitlesen. Stift und Papier reichen.",
      Cue: "Frage vorlesen. Pfeil 1: Lernziel. Pfeil 2: vier Stationen. Pfeil 3: meine Claude-Schritte, vor jedem Wechsel laut lesen. Pfeil 4: schätzen, prüfen, Kit für zu Hause.",
      Remember: "Klar sagen: Heute braucht ihr keinen Laptop. Wer mittippt, verpasst die Prüfung der Zeile.",
    }),
    note("Die Regel: ein Satz gegen seine Datei", {
      Time: "4 min",
      Say: "Unser Marketing bittet uns, einen Werbeentwurf vor Veröffentlichung zu prüfen. Die geplante Regalkarte für alle Weine sagt: „Zertifizierte Bio-Weinberge“. Wir halten eine Kopie des Zertifikats der Kontrollstelle. Es ist keine eigene Werbeaussage der Kontrollstelle. 12 von 40 bedeutet Hektar Weinbergsfläche, nicht Flaschen. Trägt das Zertifikat unseren Werbeentwurf? Belegt ist eine Antwort erst, wenn vier Prüfungen halten: Zitat, Zeitraum, Umfang, Freigabe. Der Stichtag ist der 16.10.2026, der Tag im Fall.",
      Students: "Das Zertifikat mit der Aussage vergleichen: Zitat, Zeitraum, Umfang und Freigabe.",
      Cue: "Ankunft: Flasche und Prüffrage. Die vier Prüfungen nennen. Pfeil 1: der Draht vom Satz zur Datei. Pfeil 2: Zitat hält. Pfeil 3: Zeitraum hält nicht, 46 Tage abgelaufen. Pfeil 4: Umfang hält nicht, 12 von 40 ha. Pfeil 5: Freigabe hält, LÜCKE, darf so nicht raus. Pfeil 6: die drei Status.",
      Remember: "Das Zertifikat liegt vor, deckt aber nur 12 ha und ist abgelaufen. Verlängern behebt das Datum, erweitert aber nicht den Umfang. Für die übrigen 28 ha fehlt ein Zertifikat. Der schwächste Teil zählt. Entscheidend ist die zitierte Zeile.",
    }),
    note("Das Kit", {
      Time: "2 min",
      Say: "Das ist der Ordner des Weinguts: 13 Dateien, so unordentlich wie eine echte Ablage, die drei Anfragen und START-HIER.md mit den fünf Prompts. Heute arbeite ich damit in Claude. Ihr nehmt das Kit mit und macht zu Hause dieselben fünf Schritte.",
      Students: "Wer will, scannt den QR-Code für später. Heute nichts installieren.",
      Cue: "Ankunft: das Zip. Pfeil 1: es öffnet sich, 13 Dateien fliegen in ordner/. Pfeil 2: die Anfragen und die Startdateien. Pfeil 3: QR-Code, Zähler und die Zeile „Heute arbeite ich damit“.",
      Remember: "nachreichung/ und loesungen/ erst nach dem jeweiligen Schritt öffnen. Zu Hause die .csv-Dateien im Texteditor öffnen, nicht in Excel.",
    }),
    note("Durchsicht auf Papier", {
      Time: "10 min",
      Say: "Zehn Minuten, zu zweit, auf Papier, ohne Claude. Wir prüfen die vorhandenen Belege für unsere drei Aufträge: Datenfehler, Beleglücken und Geschäftsprobleme. Es gibt acht Prüfpunkte; nicht acht falsche Dateien. Die 560-g-Angabe ist korrekt, die Flasche verfehlt die Kundenvorgabe. Wasser ist vollständig. Danach bekommt Claude dieselben unveränderten Dateien.",
      Students: "Zu zweit mit dem Ausdruck der 13 Dateien. Für jeden Prüfpunkt aufschreiben: Datei, Zeile, welche Antwort betroffen ist und warum.",
      Cue: "Ankunft: Die Überschrift fragt nur: Was stimmt nicht? Erst aufdecken, wenn die Paare verglichen haben. Pfeil 1: acht Fähnchen, der Zähler läuft bis 8. Pfeil 2: die vollständige Datei bekommt einen Ring.",
      Remember: "Je Paar einen Ausdruck der 13 Dateien aus ordner/ mitbringen. Ohne Ausdruck: Die Demo loehrning.ai/demos/esg-berichte-mit-ki zeigt dieselben 13 Dateien im Browser; vorher prüfen, dass die Dateiansicht keine Lösung zeigt. Die vollständige Datei ist wasser_2025.csv: 12 von 12 Monaten, der hohe September ist die Lese. Doppelerfassung laut nennen: 12 Zeilen sind 11 Monate.",
    }),
    note("Projekt anlegen", {
      Time: "4 min",
      Say: "Jetzt geht der Ordner zu Claude. Ich lege das Projekt live an: Anweisungen, 13 Dateien, Codeausführung. Die Anfragen kommen nicht ins Projekt.",
      Students: "Per Zuruf: Warum kommen die Anfragen nicht ins Projekt?",
      Cue: "Vor dem Wechsel: Leiste 1 bis 4 laut vorlesen. Cmd+Tab zu Claude Desktop: 1 Projects, „New Project“, Name „Crvena Zemja Nachweise“. 2 „Instructions“, „Edit“: den ganzen Text aus projektanweisungen.md einfügen, „Save instructions“. 3 Bei Project knowledge auf „+“, die 13 Dateien aus ordner/ wählen. 4 Settings, Capabilities: „Run code in the cloud“ ist an. Zurück am Deck: Pfeil 1 Anweisungen, Pfeil 2 Dateien und die Ihr-erklärt-Zeile, Pfeil 3 Schalter.",
      Remember: "Dateien sind Firmenwissen, der Skill ist die Prüfmethode. Projektanweisungen setzen Stichtag und Kontext. Die Anfragen fragen, sie belegen nichts; sie kommen in jedem Schritt an die Nachricht. Ein fertiges Projekt als Reserve anlegen, falls der Upload hängt. Lädt eine .md-Datei nicht, in .txt umbenennen. Vor echten Firmendaten: Datenschutz in den Einstellungen prüfen. Bei Zugangssperre, Limit oder Ausfall: /demos/esg-berichte-mit-ki öffnen, passenden Schritt wählen, als Aufzeichnung benennen. Danach zurück zum Deck, Quellen prüfen.",
    }),
    note("Schritt 1: Fragebogen des Importeurs", {
      Time: "7 min",
      Say: "Erst die Stromdaten auf das ganze Jahr prüfen, dann starte ich Claude. Ein neuer Chat im Projekt, der Fragebogen kommt dazu, dann der Prompt aus START-HIER.md, Schritt 1.",
      Students: "Sobald der Code 12 Zeilen und 11 Monate zeigt, vor Claudes Antwort prüfen: Decken Z. 3 bis 14 der Stromdatei alle 12 Monate?",
      Cue: "Vor dem Wechsel: Leiste 1 bis 4 laut vorlesen. Auf dem Deck: Prüffrage zum ganzen Jahr. Cmd+Tab zu Claude Desktop: 1 im Projekt „New chat“. 2 „+“, „Upload or add files“, „Upload from computer“: anfragen/1-fragebogen-nordvik.md. 3 Prompt 1 aus START-HIER.md senden (oder „Kopieren“ am Deck). Während Claude rechnet, den Code-Kasten aufklappen: 12 Zeilen, 11 Monate; jetzt fragen, ob Z. 3 bis 14 alle 12 Monate decken. 4 strom_2025.csv im Projektwissen öffnen. Zurück am Deck: Pfeil 1 Fragebogen angehängt. Pfeil 2 Prompt und Code, die Ihr-prüft-Zeile erscheint. Pfeil 3 Antwort und Tabelle. Pfeil 4 Ergebnis 5, 1, 2.",
      Remember: "Q6 ist BELEGT und trotzdem schlecht: Die Reserve-Flasche wiegt 560 g. Belegt heißt bewiesen, nicht gut. Q1 als SCHWACH mit September genannt ist auch vertretbar. Weicht der Live-Lauf von der Folie ab, ist genau das der Gesprächsstoff. Läuft Claude länger als 3 Minuten: auf der Folie weiter.",
    }),
    note("Schritt 2: Werbeaussagen", {
      Time: "6 min",
      Say: "Erst die Verbotsliste, dann die Nachweisprobe. Was auf der Verbotsliste steht, darf nicht raus, mit oder ohne Nachweis.",
      Students: "Nach dem Lauf, per Zuruf: Welches Wort in C6 muss weg?",
      Cue: "Vor dem Wechsel: Leiste 1 bis 4 laut vorlesen. Auf dem Deck: sieben Aussagen und die Reihenfolge der Prüfung. Cmd+Tab zu Claude Desktop: 1 neuer Chat im Projekt. 2 anfragen/2-werbeaussagen.md anhängen. 3 Prompt 2 aus START-HIER.md senden. 4 Während Claude prüft: ordner/regeln_werbeaussagen.md im Finder markieren, Leertaste (Übersicht), Verbotsliste 4a, 4b, 4c zeigen, dann zurück in den Chat. Zurück am Deck: Pfeil 1 Datei und Prompt. Pfeil 2 drei Aussagen an der Verbotsliste gestrichen. Pfeil 3 zwei ohne Beleg, zwei halten, die Ihr-prüft-Zeile erscheint. Pfeil 4 zwei dürfen raus.",
      Remember: "C6 nur ohne das Wort „nur“: Das ist ein Vergleich ohne Nachweis.",
    }),
    note("Schritt 3: Formular der Bank", {
      Time: "5 min",
      Say: "F4 rechnet ihr selbst: Die Formel steht im Formular, die drei Zahlen stehen auf der Folie. Dann rechnet Claude im Code.",
      Students: "Mit dem Handy: erst 180.000 mal 9,50, dann 8.550.000 durch das Ergebnis. Nach dem Lauf, per Zuruf: Wer hat das Angebot unterschrieben?",
      Cue: "Vor dem Wechsel: Leiste 1 bis 4 laut vorlesen. Auf dem Deck: Formular und die drei Zahlen, der Raum rechnet. Cmd+Tab zu Claude Desktop: 1 neuer Chat im Projekt. 2 anfragen/3-bankformular.md anhängen. 3 Prompt 3 aus START-HIER.md senden. Den Code-Kasten mit 8550000 / (180000 * 9.50) aufklappen. 4 pv_angebot_2026.txt im Projektwissen öffnen: Z. 8 Schätzung, Z. 11 von keiner Seite unterschrieben. Zurück am Deck: Pfeil 1 Datei und Prompt, Pfeil 2 die Felder, F2 zeigt dieselbe Lücke wie Q1, Pfeil 3 die Zahlen wandern in die Formel, 5,0 Jahre, die Ihr-prüft-Zeile erscheint. Gleich danach Prompt 4 mit den drei Anfragen in einem neuen Chat senden; er läuft 4 bis 5 Min., während wir F4 besprechen.",
      Remember: "Die Rechnung stimmt. Belegt ist sie nicht: Schätzung des Installateurs, Angebot nicht unterschrieben.",
    }),
    note("Schritt 4: Nachweisregister", {
      Time: "4 min",
      Say: "Die drei Anfragen fragen nach denselben Fakten. Ein Register hält alle 21 Antworten an einer Stelle, als Excel-Datei mit drei Blättern.",
      Students: "Vor Claudes Liste, per Zuruf: Welches fehlende Dokument blockiert die meisten Antworten?",
      Cue: "Vor dem Wechsel: Leiste 1 bis 4 laut vorlesen; 1 bis 3 liefen schon am Ende von Schritt 3 (neuer Chat, die drei Dateien aus anfragen/, Prompt 4). Auf dem Deck: Datei, Zeile und Status für jede Antwort. Cmd+Tab zu Claude Desktop: den Chat von Prompt 4 öffnen. 4 Wenn nachweisregister.xlsx erscheint, die Datei öffnen und die Blätter Register, VSME und Anfordern zeigen. Zurück am Deck: Pfeil 1 Prompt gesendet. Pfeil 2 21 Kacheln, 9 BELEGT. Pfeil 3 VSME B1 bis B11, die Ihr-prüft-Zeile erscheint. Pfeil 4 was zuerst anzufordern ist.",
      Remember: "VSME ist der freiwillige EU-Standard, B1 bis B11 sein Basismodul; B1 ist LÜCKE, weil keine Datei Modul und Berichtsform festhält. Die Septemberrechnung steht oben: Sechs Antworten warten auf sie. Prüft, ob C6 im Register noch „nur“ trägt. Liegt die Datei nach 5 Minuten nicht vor: auf der Folie weiter, Schritt 5 in diesem Chat senden, sobald sie da ist. Öffnet die Vorschau nicht: Datei herunterladen.",
    }),
    note("Schritt 5: Die nachgereichte Rechnung", {
      Time: "5 min",
      Say: "Die Buchhaltung findet die Stromrechnung für September, als Foto. Der Stichtag bleibt. Claude liest das Foto, prüft die kWh an den beiden Zählerständen und prüft jede Zeile neu, die die Stromdatei zitiert.",
      Students: "Sobald das Foto im Chat ist, nachrechnen: 1.325.550 minus 1.284.350.",
      Cue: "Vor dem Wechsel: Leiste 1 bis 4 laut vorlesen. Auf dem Deck: die fehlende Septemberrechnung. Pfeil 1: der Umschlag öffnet sich. Cmd+Tab zu Claude Desktop: 1 im Chat von Schritt 4 bleiben. 2 nachreichung/rechnung-EL-25-09.png anhängen. 3 Prompt 5 aus START-HIER.md senden; die Zählerstände in der Antwort zeigen. 4 die neue nachweisregister.xlsx öffnen. Zurück am Deck: Pfeil 2 das Foto geht in den Chat, die Ihr-rechnet-Zeile erscheint. Pfeil 3 der Septemberbalken wächst, 320,9 MWh. Pfeil 4 F2 wird BELEGT, F3 SCHWACH, 10 BELEGT.",
      Remember: "Den PV-Anteil gibt es erst mit dem ganzen Jahr: 180 von 320,9 MWh. Hochgerechnet wären es 305,1 MWh: Ein Durchschnitt füllt die Lücke mit dem falschen Monat. Fortschritt ist noch kein Nachweis.",
    }),
    note("Was wir gemessen haben", {
      Time: "1 min",
      Say: "Gemessen haben wir nur Claude: Schritte 1 bis 5 in 8 Minuten 32 Sekunden, Median aus drei Läufen, im Terminal mit denselben Prompts. Den Live-Lauf heute habe ich nicht gestoppt; er enthält Zeigen und Warten. Von Hand hat niemand gestoppt, deshalb steht dort keine Zeit.",
      Students: "Zuhören.",
      Cue: "Ankunft: die Uhr zählt bis 8:32. Pfeil 1: der leere Ring, von Hand nicht gemessen. Pfeil 2: zwei Chips. In 3 von 3 Läufen standen alle 21 Status wie in der Lösung, vor und nach der Rechnung. Die September-Lücke war im Median nach 67 s benannt.",
      Remember: "Gemessen am 26.10.2026 mit Claude Code 2.1.310 und Claude Sonnet 5.5 im Terminal, nicht in Claude Desktop. Nicht gezählt: den Ordner anlegen und jede Antwort prüfen. Das bleibt Arbeit für einen Menschen.",
    }),
    note("Mitnehmen", {
      Time: "3 min",
      Say: "Im Übungsfall ist die Antwort an Nordvik am 23.10.2026 fällig: jede Antwort mit Datei und Zeile, jede Lücke mit dem Dokument, das fehlt. Kit, Skill und Demo gehen mit nach Hause. Zu Hause macht ihr die fünf Schritte selbst, mit eurem Claude und denselben Prompts. Den Skill über claude.ai/customize/skills hochladen: „Add skill“, „Upload skill“. Nie echte Dateien mit den Übungsdateien mischen.",
      Students: "QR-Code scannen. Zu Hause: Kit entpacken, Projekt anlegen, Prompts 1 bis 5.",
      Cue: "Ankunft: der Satz zu Nordvik, dann Kit, Skill und Demo, der QR-Code, die Zeile „Zu Hause“. Pfeil 1: Ein Mensch prüft und unterschreibt jede Antwort.",
      Remember: "Übungsdatum bleibt 16.10.2026. Für eigene Fälle den Stichtag ändern. Die Demo läuft im Browser, ohne KI.",
    }),
    note("Anhang: Quellen", { Say: "Nur auf Nachfrage. Escape führt zurück zur Folie, von der du kamst." }),
    note("Anhang: Begrenzung in der Wertschöpfungskette", { Say: "Nur auf Nachfrage: Was ein Kunde ab 2027 verlangen darf, und was davon unberührt bleibt." }),
    note("Anhang: Der Fall", { Say: "Nur auf Nachfrage: die Fakten des Falls mit Zeile." }),
  ],
  en: [
    note("ESG reports with AI", {
      Time: "30 s",
      Say: "One winery gets three requests: from its importer, its marketing team and its bank. All need answers from the same folder. We decide which answers the company can prove. I work in my Claude; you predict and check the sources.",
      Students: "Settle in. I operate Claude; you check the sources. No laptop needed.",
      Cue: "Before: Claude Desktop open, English skill esg-evidence uploaded and enabled under Customize, Skills; Haiku selected and Run code in the cloud enabled; the kit unzipped on the desktop, START-HERE.md open in a text editor. On arrival the globe turns to North Macedonia and an arc runs to Germany. Then arrow right.",
      Remember: "No word about tools yet. The case first.",
    }),
    note("Host", {
      Time: "1 min",
      Say: "I am Tim Loehr. I was a data scientist at Apple and Red Bull. Today I am an AI Engineer, running loehrning.ai, where this workshop and the kit come from. Today's case is invented: no employer data or systems.",
      Students: "Listen.",
      Cue: "The line runs by itself: Apple, Red Bull, Meta, loehrning.ai.",
      Remember: "Stay under a minute.",
    }),
    note("Why now", {
      Time: "2 min",
      Say: "ESG means environment, social and governance. Customers and banks ask companies about it: electricity, water, employees, accidents, corruption. Three real headlines show why the answers now need evidence. Since 01.01.2026 Vinmonopolet in Norway requires suppliers to put still wine under NOK 250 in bottles of at most 420 g per 0.75 l. Since 27.09.2026 no product in Germany may be called “climate neutral” if that rests on offsetting. On 18.12.2025 the EBRD gave Sparkasse Bank Skopje a loan of up to EUR 8 million, which it lends on to SMEs for renewable energy and energy efficiency. All three land on the desk of one small winery next.",
      Students: "Match the three triggers: packaging, marketing and finance.",
      Cue: "On arrival: E, S and G with examples. Arrow 1: the scale at 420 g. Arrow 2: the label, “Climate neutral” is struck. Arrow 3: arc London to Skopje, up to EUR 8 m. Arrow 4: the cards fly off, the headline asks what the three share, the sentence stays.",
      Remember: "The bottle rule, the law and the credit line are real, sources in appendix 1. The BGH already ruled in 2024 that the ad itself must say what “climate neutral” means (I ZR 98/23). Winery, importer and bank are invented.",
    }),
    note("The winery", {
      Time: "1 min 30 s",
      Say: "Vinarija Crvena Zemja, a family winery in Kavadarci, in the Tikveš wine region. 42 employees, 40 hectares of vineyards, about 550,000 bottles of still wine a year. 74 % of revenue comes from exports: 31 % from Germany, 22 % from one importer in Sweden.",
      Students: "Listen.",
      Cue: "On arrival: the winery, the vine rows draw. Arrow 1: three numbers count up. Arrow 2: the revenue bar, Germany and Sweden first.",
      Remember: "Under the bar it says company_profile.md, l. 12. Even the facts of the case carry file and line. That is the method of this hour.",
    }),
    note("Three requests", {
      Time: "1 min",
      Say: "The case reference date is 16.10.2026. This is not today’s workshop date. We sit in the winery's office, seven days before the return to Nordvik. Three requests are on the desk. The importer in Gothenburg sends 8 questions, due on 23.10.; it does not count answers without evidence. Nordvik offers the wines to Vinmonopolet in Norway; the 420 g rule applies there. What fails the rule, Nordvik cannot offer there. The winery's in-house marketing wants to print 7 claims on new labels for Germany, after 27.09. The bank in Skopje needs 6 fields for the solar loan of 8,550,000 denar, every estimate marked.",
      Students: "Call it out: which request do you answer first?",
      Cue: "On arrival: the October timeline, 16.10. is marked. Arrow 1: envelope from Sweden with the 420 g rule. Arrow 2: envelope from marketing with the UWG. Arrow 3: envelope from the bank with the EBRD. Arrow 4: 8, 7 and 6 become 21 items to check: 8 customer questions, 7 draft marketing claims, 6 loan fields. evidence for customer requirements, environmental claims and the solar loan. The 53 % is the combined sales share concerned, not a measured loss.",
      Remember: "Answer: Nordvik first, due 23.10. But all three ask for the same facts; electricity is in all three. Hence one folder, and one register in step 4.",
    }),
    note("Today", {
      Time: "2 min",
      Say: "The question of this hour: which answer is covered, and which document is missing? Below it the learning objective. Four stops: first the rule on one sentence, then you search on paper, then I show Claude live on the three requests, last the register and the late document. Today you are the winery's office. I drive Claude, in Claude Desktop on the projector. The strip at the top of every Claude slide shows where I am in Claude; I read it out before I switch. Before every run you predict the result, after it you check the cited line. At home you do the same with the kit.",
      Students: "Read along. Pen and paper are enough.",
      Cue: "On arrival: the question and your role, the winery's office. Arrow 1: the objective, five parts are underlined. Arrow 2: the objective leaves, four stops. Arrow 3: how we work, my four clicks. Arrow 4: your loop, the kit.",
      Remember: "Say it plainly: no laptop today. Whoever types along misses the line check.",
    }),
    note("The rule: one sentence against its file", {
      Time: "4 min",
      Say: "Our marketing team asks us to check its draft for a shelf card used with all wines: “Certified organic vineyards”. We hold a copy of the control body's certificate. Twelve of forty means hectares of vineyard land, not bottles. Does that certificate support our marketing draft? An answer is covered only when four checks hold: quote, period, scope, approval. The reference date is 16.10.2026, the day in the case.",
      Students: "Compare the certificate with the claim: quote, period, scope and approval.",
      Cue: "On arrival: our marketing draft and the source-check question. Name the four checks. Arrow 1: the wire from the sentence to the file. Arrow 2: quote holds. Arrow 3: period fails, 46 days expired. Arrow 4: scope fails, 12 of 40 ha. Arrow 5: approval holds, GAP, must not go out. Arrow 6: the three statuses.",
      Remember: "The certificate was issued by the control body; the proposed claim comes from our marketing team. It has expired and covers 12 hectares, not 12 bottles. Renewal does not extend it to the other 28 hectares or to winemaking. GAP means evidence is missing for part of the claim.",
    }),
    note("The kit", {
      Time: "2 min",
      Say: "This is the winery's folder: 13 files, as messy as a real filing system, the three requests and START-HERE.md with the five prompts. Today I work with it in Claude. You take the kit home and do the same five steps.",
      Students: "Scan the QR code for later if you like. Nothing to install today.",
      Cue: "On arrival: the zip. Arrow 1: it opens, 13 files fly into files/. Arrow 2: the requests and the start files. Arrow 3: QR code, counters and the line “Today I work with it”.",
      Remember: "Open late-document/ and answers/ only after their step. At home open the .csv files in a text editor, not in Excel.",
    }),
    note("Review on paper", {
      Time: "10 min",
      Say: "Ten minutes, in pairs, on paper, without Claude. Check the evidence for our three requests: data errors, evidence gaps and business problems. There are eight issues to check, not eight incorrect files. The 560 g record is correct; the bottle fails the customer requirement. Water is complete. Claude will then use the same unchanged files.",
      Students: "In pairs with the printout of the 13 files. For each issue write: file, line, which requested answer is affected and why.",
      Cue: "On arrival the headline only asks: what is wrong? Reveal only after the pairs have compared. Arrow 1: eight flags, the counter runs to 8. Arrow 2: the complete file gets a ring.",
      Remember: "Bring one printout of the 13 files from files/ per pair. No printout: the demo loehrning.ai/en/demos/esg-berichte-mit-ki shows the same 13 files in the browser; check beforehand that its file view shows no solution. The complete file is water_2025.csv: 12 of 12 months, the high September is the harvest. Name the duplicate explicitly: 12 rows are 11 months.",
    }),
    note("Create the project", {
      Time: "4 min",
      Say: "Now the folder goes to Claude. I create the project live: instructions, 13 files, code execution. The requests do not go into the project.",
      Students: "Call it out: why do the requests stay out of the project?",
      Cue: "Before switching: read strip items 1 to 4 out loud. Cmd+Tab to Claude Desktop: 1 Projects, “New Project”, name “Crvena Zemja Evidence”. 2 “Instructions”, “Edit”: paste the whole of project-instructions.md, “Save instructions”. 3 Project knowledge “+”: pick the 13 files from files/. 4 Settings, Capabilities: “Run code in the cloud” is on. Back on the deck: Arrow 1 instructions, arrow 2 files and the you-explain line, arrow 3 switch.",
      Remember: "Files supply company knowledge; the skill supplies the checking method; project instructions set context and date. Requests ask, they prove nothing; they go into the message in every step. Keep a finished project as a backup in case the upload stalls. If a .md file does not upload, rename it to .txt. Before real company data: check the privacy settings. If access, usage limits or an outage block Claude: open /en/demos/esg-berichte-mit-ki, select the matching step and identify it as a recording. Return to the deck to check sources.",
    }),
    note("Step 1: The importer's questionnaire", {
      Time: "7 min",
      Say: "First check whether the electricity records cover the full year. Then I run Claude. A new chat in the project, the questionnaire attached, then the prompt from START-HERE.md, Step 1.",
      Students: "As soon as the code shows 12 rows and 11 months, before Claude answers, check: do lines 3 to 14 of the electricity file cover all 12 months?",
      Cue: "Before switching: read strip items 1 to 4 out loud. On the deck: the full-year source check. Cmd+Tab to Claude Desktop: 1 in the project “New chat”. 2 “+”, “Upload or add files”, “Upload from computer”: requests/1-nordvik-questionnaire.md. 3 send prompt 1 from START-HERE.md (or “Copy” on the deck). While Claude works, open the code box: 12 rows, 11 months; now ask whether lines 3 to 14 cover all 12 months. 4 open electricity_2025.csv in project knowledge. Back on the deck: Arrow 1 questionnaire attached. Arrow 2 prompt and code, the you-check line appears. Arrow 3 answer and table. Arrow 4 result 5, 1, 2.",
      Remember: "Q6 is COVERED and still bad news: the reserve bottle weighs 560 g. Covered means proven, not good. Q1 as WEAK with September named is also acceptable. If the live run differs from the slide, that difference is the discussion. If Claude runs longer than 3 minutes, continue on the slide.",
    }),
    note("Step 2: Marketing claims", {
      Time: "6 min",
      Say: "Ban list first, then the evidence check. What is on the ban list must not go out, with or without evidence.",
      Students: "After the run, call it out: which word in C6 must go?",
      Cue: "Before switching: read strip items 1 to 4 out loud. On the deck: seven claims and the order of checks. Cmd+Tab to Claude Desktop: 1 new chat in the project. 2 attach requests/2-marketing-claims.md. 3 send prompt 2 from START-HERE.md. 4 While Claude checks, select files/green_claims_rules.md in Finder, press Space (Quick Look), show ban list items 4a, 4b, 4c, then back to the chat. Back on the deck: Arrow 1 file and prompt. Arrow 2 three claims struck at the ban list. Arrow 3 two without evidence, two hold, the you-check line appears. Arrow 4 two may go out.",
      Remember: "C6 only without the word “only”: that is a comparison without evidence.",
    }),
    note("Step 3: The bank's form", {
      Time: "5 min",
      Say: "You work out F4 yourselves: the formula is in the form, the three numbers are on the slide. Then Claude calculates in code.",
      Students: "On your phone: first 180,000 times 9.50, then 8,550,000 divided by the result. After the run, call it out: who signed the offer?",
      Cue: "Before switching: read strip items 1 to 4 out loud. On the deck: the form and the three numbers, the room calculates. Cmd+Tab to Claude Desktop: 1 new chat in the project. 2 attach requests/3-bank-form.md. 3 send prompt 3 from START-HERE.md. Open the code box with 8550000 / (180000 * 9.50). 4 open solar_offer_2026.txt in project knowledge: line 8 estimate, line 11 signed by neither side. Back on the deck: Arrow 1 file and prompt, arrow 2 the fields, F2 shows the same gap as Q1, arrow 3 the numbers move into the formula, 5.0 years, the you-check line appears. Right after that, send prompt 4 with the three requests in a new chat; it runs 4 to 5 min while we discuss F4.",
      Remember: "The arithmetic is right. Covered it is not: the installer's estimate, an offer nobody signed.",
    }),
    note("Step 4: Evidence register", {
      Time: "4 min",
      Say: "The three requests ask for the same facts. A register keeps all 21 answers in one place, as an Excel file with three sheets.",
      Students: "Before Claude's list, call it out: which missing document blocks the most answers?",
      Cue: "Before switching: read strip items 1 to 4 out loud; 1 to 3 already ran at the end of step 3 (new chat, the three files from requests/, prompt 4). On the deck: file, line and status for every answer. Cmd+Tab to Claude Desktop: open the chat of prompt 4. 4 When evidence_register.xlsx appears, open it and show the sheets Register, VSME and Request. Back on the deck: Arrow 1 prompt sent. Arrow 2 21 tiles, 9 COVERED. Arrow 3 VSME B1 to B11, the you-check line appears. Arrow 4 what to request first.",
      Remember: "VSME is the EU's voluntary standard, B1 to B11 its basic module; B1 is a GAP because no file records the module and report type. The September invoice is on top: six answers wait for it. Check whether C6 still says “only” in the register. If the file is not there after 5 minutes, continue on the slide and send step 5 in this chat once it is. If the preview does not open, download the file.",
    }),
    note("Step 5: The late invoice", {
      Time: "5 min",
      Say: "Accounting finds the September electricity invoice, as a photo. The reference date stays. Claude reads the photo, checks the kWh against the two meter readings and checks again every row that cites the electricity file.",
      Students: "As soon as the photo is in the chat, calculate: 1,325,550 minus 1,284,350.",
      Cue: "Before switching: read strip items 1 to 4 out loud. On the deck: the missing September invoice. Arrow 1: the envelope opens. Cmd+Tab to Claude Desktop: 1 stay in the chat of step 4. 2 attach late-document/invoice-EL-25-09.png. 3 send prompt 5 from START-HERE.md; show the meter readings in the answer. 4 open the updated evidence_register.xlsx. Back on the deck: Arrow 2 the photo goes into the chat, the you-calculate line appears. Arrow 3 the September bar grows, 320.9 MWh. Arrow 4 F2 turns COVERED, F3 WEAK, 10 COVERED.",
      Remember: "The PV share exists only with the full year: 180 of 320.9 MWh. Scaled up it would be 305.1 MWh: an average fills the gap with the wrong month. Progress is not yet evidence.",
    }),
    note("What we measured", {
      Time: "1 min",
      Say: "We measured only Claude: steps 1 to 5 in 7 minutes 50 seconds, median of three runs, in the terminal with the same prompts. I did not time today's live run; it includes showing and waiting. Nobody timed it by hand, so there is no time for that.",
      Students: "Listen.",
      Cue: "On arrival the clock counts to 7:50. Arrow 1: the empty ring, by hand not measured. Arrow 2: two chips. In 2 of 3 runs all 21 statuses matched the answers, before and after the invoice. The September gap was named after 52 s, the median.",
      Remember: "Measured on 26.10.2026 with Claude Code 2.1.310 and Claude Sonnet 5.5 in the terminal, not in Claude Desktop. EN timing comes from separate EN runs. One run had Q6 as GAP before the invoice. Not counted: building the folder and checking every answer. That stays a person's job.",
    }),
    note("Take home", {
      Time: "3 min",
      Say: "In the fictional case, Nordvik is due a response on 23.10.2026: every answer with file and line, every gap with the missing document named. Kit, skill and demo go home with you. At home you do the five steps yourselves, with your own Claude and the same prompts. Upload esg-evidence (English) at claude.ai/customize/skills: “Add skill”, “Upload skill”. Never mix real files with the training files.",
      Students: "Scan the QR code. At home: unzip the kit, create the project, prompts 1 to 5.",
      Cue: "On arrival: the Nordvik sentence, then kit, skill and demo, the QR code, the “At home” line. Arrow 1: a person checks and signs every answer.",
      Remember: "The exercise date stays 16.10.2026. Change it for your own cases. The demo runs in the browser, without AI.",
    }),
    note("Appendix: Sources", { Say: "Only on a question. Escape returns to the slide you came from." }),
    note("Appendix: Value-chain cap", { Say: "Only on a question: what a customer may ask for from 2027, and what stays untouched." }),
    note("Appendix: The case", { Say: "Only on a question: the facts of the case with their lines." }),
  ],
};

// Establish company and decision before the host biography and the ESG primer.
const ORDER = [0, 3, 4, 1, 2, ...Array.from({ length: 15 }, (_, i) => i + 5)];
const QUESTION_EXAMPLES = {
  de: note("Was sollen wir beantworten?", { Time: "1 min", Say: "Das sind Auszüge aus den drei Anfragedateien. Der Importeur fragt nach Strom, Beschäftigten und Korruptionsfällen: Umwelt, Soziales und Unternehmensführung. Unser Marketing schlägt Aussagen vor und bittet uns um Prüfung vor Veröffentlichung. Die Bank will Stromdaten und eine ausdrücklich als Schätzung gekennzeichnete Amortisation. Noch keine Antworten zeigen. Derselbe Strombeleg wird später für Kunde und Bank gebraucht.", Students: "Die drei Aufträge unterscheiden: Fakten beantworten, Werbeentwurf prüfen, Kreditformular ausfüllen.", Cue: "Die sieben Beispiele vorlesen. Sie kommen direkt aus den Kit-Dateien, mit denselben Kennungen Q1, Q3, Q5, C1, C3, F2 und F4. Jetzt ist klar, wofür wir unsere Dateien prüfen.", Remember: "Sieben Beispiele von 21 Prüfpunkten; die Marketingaussagen sind ungeprüfte Entwürfe." }),
  en: note("What are we being asked?", { Time: "1 min", Say: "These are excerpts from the three request files. The importer asks about electricity, employees and corruption: environmental, social and governance topics. Our marketing team proposes claims and asks us to check them before publication. The bank needs electricity data and an explicitly estimated payback. Show no answers yet. The same electricity evidence will later support both customer and bank responses.", Students: "Distinguish the three tasks: answer factual questions, check draft claims, complete a loan form.", Cue: "Read the seven examples. They are taken directly from the kit files, with the same identifiers Q1, Q3, Q5, C1, C3, F2 and F4. The room now knows why we need to check our files.", Remember: "Seven examples of 21 items; the marketing statements are unapproved drafts." }),
};
export const NOTES = Object.fromEntries(Object.entries(SOURCE_NOTES).map(([lang, notes]) => {
  const ordered = ORDER.map((i) => notes[i]);
  ordered.splice(3, 0, QUESTION_EXAMPLES[lang]);
  return [lang, ordered];
}));
