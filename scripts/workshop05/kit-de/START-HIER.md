# Audit-Vorbereitung mit Claude: der Ordner von Vardar Works

Erfundenes Übungsmaterial. Jede Firma, jede Person und jedes Dokument ist erfunden, bis auf die zwei Zeilen von Anthropics öffentlicher Datenschutzseite.

Im Kurs bedient Tim Claude. Du schätzt und prüfst die Zitate. Diese Einrichtung ist zum Wiederholen zu Hause.

Stichtag der Übung: Montag, 9. November 2026. Lies jedes Datum im Ordner von diesem Tag aus.

Vardar Works DOOEL in Skopje (120 Beschäftigte) betreibt den Kundenservice für die Tannwald Haustechnik GmbH in Hamburg. Damit ist Vardar Auftragsverarbeiter von Tannwald. Am 9. November 2026 hat Tannwald eine Dokumentanforderung für ein Lieferantenaudit am 10. Dezember 2026 geschickt. Du hast den Ordner: 11 Dateien, und zu jeder Anforderung gibt es eine Datei, deren Name passt.

Vertrag, Anforderung und Ordner sind englisch, wie bei einem Dienstleister in Skopje für einen Kunden in Hamburg üblich. Claude antwortet auf Deutsch und zitiert wörtlich englisch.

Was du übst, in einem Satz: "Eine Datei ist erst ein Nachweis, wenn Zitat, Zeitraum, Umfang und Freigabe stimmen. Diese vier Prüfungen gebe ich Claude als Regeln, und ohne wörtliches Zitat zählt nichts." Das Ergebnis ist eine Lückenliste, die du vertreten kannst.

| Prüfung | Hält, wenn |
|---|---|
| ZITAT | Worte, wörtlich aus der Datei kopiert, beantworten die Anforderung. Eine Richtlinie oder eine Notiz sagt, was passieren soll; nur ein Protokoll zeigt, dass es passiert ist. |
| ZEITRAUM | Ein Protokoll ist ab dem 10. Dezember 2025 datiert. Eine Richtlinie wurde ab diesem Tag freigegeben oder überprüft. Die Datei gilt für den ganzen Zeitraum. |
| UMFANG | Sie deckt die Systeme und Personen ab, nach denen die Anforderung fragt. |
| FREIGABE | Eine Richtlinie nennt in der Datei, wer sie mit Datum freigegeben hat. Ein Register, Log oder Export nennt, wer es führt. Eine Anbieterseite nennt Anbieter und Datum der Seite. DRAFT, "(open)" oder "FINAL" im Dateinamen ist keine Freigabe. |

Dieselben vier Prüfungen wie in Workshop 04, jetzt für einen ganzen Ordner. BELEGT, SCHWACH oder LÜCKE. Datei veraltet oder nicht freigegeben: SCHWACH. Ein Teil ohne Nachweis, oder der Nachweis zeigt „nicht erfüllt“: LÜCKE. Der schwächste Teil zählt. Ohne Zitat kein BELEGT. Eine Richtlinie zeigt Absicht, nur ein Protokoll zeigt Praxis.

## Was du brauchst
- Claude (claude.ai oder die Desktop-App), jeder Plan, mit eingeschalteter Codeausführung: „Settings“, „Capabilities“, „Code execution and file creation“ (im neuen Layout „Create and edit files“). Auf Team oder Enterprise muss das eventuell dein Admin erlauben. Codex oder Claude Code kann auch den entpackten Ordner lesen, siehe unten.
- Etwa 60 Minuten. LOESUNGEN.md ist der Schlüssel. Öffne sie nach jedem Schritt, nicht vorher.
- Optional: Die Demo unter loehrning.ai/demos/audit-vorbereitung-mit-ki geht diesen Ordner in drei Minuten durch.

## Einrichten (5 Minuten)
1. Öffne in Claude „Projects“ und leg „Vardar Audit“ an.
2. Öffne „Set project instructions“, füge projektanweisungen.md ganz ein und wähle „Save instructions“.
3. Wähle im Projektwissen „+“ und lade request_tannwald.md und die 11 Dateien aus ordner/ hoch. Lässt sich eine .md- oder .csv-Datei nicht hochladen, benenne sie in .txt um.
4. Keine Projekte? Starte einen Chat, häng die 12 Dateien an und füge projektanweisungen.md über deinem ersten Prompt ein.

Starte jeden Schritt in einem neuen Chat im Projekt. Antworten anderer Chats werden nicht geteilt: Lade nach Schritt 1 die Nachweisliste herunter und hänge sie in Schritt 2 an; speichere nach Schritt 2 die R1-bis-R8-Tabelle und hänge sie in Schritt 3 an. Nutze „+“, dann „Add files or photos“. Ohne Projekt bleibst du für alle drei Schritte im selben Chat.

## Mit Codex oder Claude Code
Öffne den entpackten Ordner vardar-audit-kit-de in Codex oder starte Claude Code in diesem Ordner. Gib diese Anweisung, danach die drei Prompts unten einzeln:

    Lies projektanweisungen.md und halte dich in dieser Übung daran. Nutze nur request_tannwald.md und die elf Dateien in ordner/ als Nachweise. Lies LOESUNGEN.md nicht. Ändere keine Quelldateien. Stichtag ist der 9. November 2026. Rechne die Zahlen im Code aus und zeige die Rechnung.

Bleib für alle drei Schritte im selben Gespräch. Lies für Schritt 3 zusätzlich vorlagen/luecken-anfrage.md und draft-reply.md. Öffne LOESUNGEN.md nach jedem Schritt selbst. Ein Skill muss für diesen Fall nicht installiert werden.

## Schritt 1: die Nachweisliste (15 Minuten)
Erst auf Papier: Wie viele der 11 Dateien bestehen ZEITRAUM und FREIGABE?

    Bau die Nachweisliste des Ordners: eine Zeile pro Datei, 11 Zeilen.
    Spalten: Datei | Typ (RICHTLINIE, REGISTER, PROTOKOLL, AUSSAGE) | Datum und Art des Datums (freigegeben, überprüft, erledigt, erzeugt, exportiert, gedruckt, bearbeitet) | Freigegeben oder geführt von | Deckt ab (Systeme, Personen, Zeitraum) | ZEITRAUM | FREIGABE.
    Übernimm Daten und Rollen aus dem Text der Datei. Steht es dort nicht, schreib NICHT IN DER DATEI.

Vergleiche mit LOESUNGEN.md, Schritt 1. Schau dir die zwei Richtlinien an: Wen hat Claude als Freigebende eingetragen?

## Schritt 2: die acht Anforderungen (20 Minuten)
Hänge im neuen Projektchat deine Nachweisliste aus Schritt 1 an.
Erst auf Papier: Gib R1 bis R8 einen Status.

    Ordne R1 bis R8 aus request_tannwald.md unseren Dateien zu.
    Eine Zeile pro Anforderung: Anforderung | Datei | Zitat (wörtlich, in Anführungszeichen) | ZITAT | ZEITRAUM | UMFANG | FREIGABE | Status | Was fehlt.
    Rechne den Schulungsanteil und die Stunden bis zur Meldung des Vorfalls im Code.
    Such dann jedes Zitat noch einmal in seiner Datei. Streich jeden Status, dessen Zitat du nicht wörtlich findest, und sag es.

Dann schick:

    Macht "Backups are restore-tested twice a year" R7 zu BELEGT?

Öffne das Code-Fenster und prüf zwei Zahlen: wie viele Beschäftigte geschult sind, und wie viele Stunden bis Tannwald informiert war. Dann LOESUNGEN.md, Schritt 2.

Optional: Füge Claudes Tabelle in die Zitat-Probe auf der Demo-Seite ein. Sie prüft jedes Zitat gegen die Dateien, in deinem Browser.

## Schritt 3: Lückenliste und Antwort (20 Minuten)
Häng deine R1-bis-R8-Tabelle aus Schritt 2, vorlagen/luecken-anfrage.md und draft-reply.md an und schick:

    1. Lückenliste für jede Anforderung mit SCHWACH oder LÜCKE: Anforderung | Was fehlt | Dokument, das es schließt | Zuständig | Bis 2. Dezember 2026.
    2. Für jede Lücke eine Anfrage-Mail an die zuständige Person nach der angehängten Vorlage.
    3. Prüf jeden Satz des Antwortentwurfs: BEHALTEN (zitiere den Nachweis), UMSCHREIBEN (ein Satz, den unsere Dateien heute belegen) oder STREICHEN (zitiere die Datei, die widerspricht).
    4. Eine Antwort an Lena Keller auf Englisch, höchstens 150 Wörter, nur mit Sätzen, die unsere Dateien belegen. Sag für jede Anforderung, die wir nicht belegen können, was folgt und bis wann. Erwähne Klausel 7.

Ändere einen Satz der Antwort selbst. Du unterschreibst sie, nicht Claude.

Vergleiche mit LOESUNGEN.md, Schritt 3.

Weicht die Antwort ab, öffne die genannte Datei und prüfe das wörtliche Zitat. Claude kann weitere Lücken finden oder eine Aussage vorsichtiger bewerten. Die Lösung ist eine begründete Auslegung dieses Ordners. Erzwinge weder ihre Formulierung noch ihre Zählung. Fehlen Dateien, hänge sie erneut an. Bei Nutzungslimit oder Ausfall geht es mit LOESUNGEN.md und der Demo weiter, ausdrücklich als vorbereitetem Beispiel.

## Dein eigenes Audit
- Installiere den Skill audit-nachweise. Er liegt in diesem Kit unter claude/audit-nachweise/SKILL.md; zum Hochladen in claude.ai lade audit-nachweise.zip von loehrning.ai/skills/audit-nachweise.zip oder von der Demo-Seite. Die Schritte folgen unten.
- Oder kopier projektanweisungen.md in ein neues Projekt und ändere Kunde, Daten und Schwellen.
- Jede LÜCKE ist eine Aufgabe mit einer zuständigen Person. Ein Mensch prüft jedes Zitat und unterschreibt jede Antwort. Claude bereitet vor; es bestätigt nichts.
- Lade Firmendokumente nur in das Firmenkonto, das deine Firma freigegeben hat. Ersetze Namen in Zugriffs- und Schulungslisten vorher durch IDs. Verträge unter NDA und Berichte von Penetrationstests bleiben draußen, außer der Vertrag erlaubt es.

## Skill installieren

<!-- claude-ui:de -->
