Erfundenes Übungsmaterial, für die Übung erfunden. Keine Rechtsberatung.

## Die Regeln in einer Minute

Eine Datei ist erst ein Nachweis, wenn Zitat, Zeitraum, Umfang und Freigabe stimmen. Diese vier Prüfungen gebe ich Claude als Regeln, und ohne wörtliches Zitat zählt nichts.
BELEGT, SCHWACH oder LÜCKE. Datei veraltet oder nicht freigegeben: SCHWACH. Ein Teil ohne Nachweis, oder der Nachweis zeigt „nicht erfüllt“: LÜCKE. Der schwächste Teil zählt.
Ohne Zitat kein BELEGT. Eine Richtlinie zeigt Absicht, nur ein Protokoll zeigt Praxis.

## Was du tust

Du lernst, mit Claude zu arbeiten, an einem erfundenen Audit-Fall. Du bist das Büro von Gradba-Pro, einem erfundenen Baustoffhandel in Bitola mit 24 Beschäftigten. Am 23. Nov. 2026 kam eine Mitteilung vom Arbeitsinspektorat: Ein Inspektor kommt am 27. Nov. um 09:00, mit drei Prüflisten voller Fragen (mitteilung_DIT_2026-11-23.md). In vier Schritten hilft dir Claude, eine Tabelle zu bauen, einen Check laufen zu lassen, einen Plan zu schreiben und ein Register zu bauen. Eine Person entscheidet und unterschreibt.

Was du dabei übst, gilt für jede Aufgabe mit Claude. Ein Projekt hält die Anweisungen und die Dateien, also richtest du sie einmal ein. Claude antwortet mit einem Zitat aus den Dateien oder mit NICHT IN DATEIEN. Code zählt, nicht das Modell. Du vergleichst jede Antwort mit LOESUNGEN.md.

## Einmal einrichten

1. Lade gradba-audit-kit-de.zip von der Kit-Seite loehrning.ai/workshops/audit-vorbereitung-mit-ki/kit herunter und entpacke es.
2. Öffne Claude (claude.ai oder die Desktop-App). Wähle „Projects“, dann „New project“. Nenne es Gradba-Audit.
3. Öffne projektanweisungen.md, kopiere den ganzen Text und füge ihn in die Anweisungen des Projekts ein. Speichere.
4. Füge dem Projekt Dateien hinzu: alle Dateien in listen/ (3) und ordner/ (14), dazu faelle/fall-A-arbeit.md und vorlagen/register.csv. Das sind 19 Dateien. Das Projekt zeigt sie in einer flachen Liste, das ist in Ordnung.
5. Schalte unter „Settings“, „Capabilities“ den Schalter „Code execution and file creation“ ein. Schritt 2 startet ein Skript. Ohne den Schalter bitte Claude um check.py und führe es auf deinem eigenen Rechner aus.
6. Starte einen Chat im Projekt. Füge für jeden Schritt seinen Prompt aus dieser Datei ein und sende ihn; vergleiche danach die Antwort mit LOESUNGEN.md.
7. Füge vor Schritt 3 vier weitere Dateien zum Projekt hinzu: mitteilung_DIT_2026-11-23.md, vorlagen/evidence-index.csv, vorlagen/clock.csv und vorlagen/neues-papier.md.
8. Schritt 4 läuft im selben Chat. Stell dann dem Register die Frage zu E-07 (der zweite Prompt von Schritt 4).

Getestet in claude.ai am 13. Nov. 2026 mit zwei vollen Läufen: Alle vier Schritte passten zu LOESUNGEN.md.

Warum diese Dateien: Die Falldatei hält die Fristen, die Schritt 3 braucht, die Registervorlage die Spalten für Schritt 4. Lass alles in extras/ aus diesem Projekt draußen.

Diese Dateien sind erfunden, darum dürfen sie in Claude. Mit echten Dateien deiner eigenen Firma bleiben die Personendaten auf deinem eigenen Rechner: Claude schreibt das Skript, du führst es aus, und Claude sieht nur Spaltennamen und 3 erfundene Zeilen. Eine benannte Person unterschreibt, nicht Claude.

Im Free-Tarif müssen alle Projektdateien in das Kontextfenster von Claude passen. Passen sie nicht, füge die Dateien eines Schritts nach dem anderen hinzu.

## Schritt 1: die Tabelle bauen

Starte einen Chat im Projekt. Füge diesen Prompt ein und sende ihn. Vergleiche dann die Antwort mit LOESUNGEN.md.
Im Raum 6 Minuten. Am Schreibtisch etwa 20, unsere Schätzung, nicht gemessen.

    Lies die drei Auszüge der Prüfliste. Mach eine Tabelle mit einer Zeile pro Frage der Prüfliste: Zeilen-Id, Artikel, das Papier, das die Frage beantwortet, wer dafür zuständig ist, wo es liegt (nimm ordner-index.md). Öffne die Dateien im Ordner noch nicht. Fehlt ein Papier in den Dateien, schreib NICHT IN DATEIEN. Nimm Kennungen, keine Namen. Antworte nur mit der Tabelle.

## Schritt 2: den Check laufen lassen

Füge im selben Chat diesen Prompt ein und sende ihn. Vergleiche dann die Antwort mit LOESUNGEN.md.
Im Raum 9 Minuten. Am Schreibtisch etwa 20, unsere Schätzung, nicht gemessen.

    Schreibe einen Check für die CSV-, txt- und md-Dateien im Ordner und führe ihn aus; überspringe CSV-Zeilen, die mit # beginnen. Gib aus, wie viele Zeilen du in jeder Datei gelesen hast. Gib zu jedem Fund Kennung, Regel und Zahl aus: Anmeldung später als am Tag vor der ersten Schicht; Überstundenwochen über 8 Stunden; Überstundenwochen ohne Meldung; Lohnzeilen ohne Überstundenzeile; Anwesenheitszeilen ohne Beginn und Ende; Lohn später als 15 Tage nach der Periode (ein freier Tag verschiebt es); fehlende Urlaubsbescheide oder unter 20 Tagen (geschuldet nach 6 Monaten); leere Felder in den Akten; Untersuchungen, die am 27. Nov. 2026 älter als 24 Monate sind; Stellenbezeichnungen, die in der Sicherheitserklärung fehlen; Unterweisung später als der Einstellungstag. Liste dann jeden Grenzfall auf, den du ausgeschlossen hast, mit dem Grund. Schließe mit einer Zeile Summen: Zeilen gelesen, Funde, Grenzfälle geprüft. Ändere keine Datei. Antworte in höchstens 16 Zeilen.

Codeausführung ausgeschaltet? Bitte Claude um check.py und führe es auf deinem eigenen Rechner aus. Führe es so aus: python3 check.py ordner/ (Windows: py check.py ordner). Echte Firma: Nimm das Skript und führe es auf deinem eigenen Rechner aus; schick Claude nur Spaltennamen und 3 erfundene Zeilen. Zum Üben nimm extras/vorlagen/sample-rows_attendance.csv.

## Schritt 3: Status, Plan, Briefing

Füge zuerst vier Dateien zum Projekt hinzu: mitteilung_DIT_2026-11-23.md, vorlagen/evidence-index.csv, vorlagen/clock.csv und vorlagen/neues-papier.md. Der Prompt liest sie. Füge im selben Chat diesen Prompt ein und sende ihn. Vergleiche dann die Antwort mit LOESUNGEN.md.
Im Raum 8 Minuten. Am Schreibtisch etwa 30, unsere Schätzung, nicht gemessen.

    Gib jeder Frage BELEGT, SCHWACH oder LÜCKE mit den vier Prüfungen und einem Zitat. LÜCKE: für jemanden fehlt das Papier, oder der Nachweis zeigt die Regel verletzt. SCHWACH: das Papier ist da, nur Datum oder Freigabe stimmt nicht. Nenne für jede SCHWACH und LÜCKE das neue Papier, das sie schließt (nie eine Änderung an einem alten), die zuständige Rolle und den Tag; heute ist der 26. Nov. 2026. Fülle vorlagen/evidence-index.csv. Schreibe vorlagen/clock.csv aus der Mitteilung und lass das Datum der Papiere offen (der Inspektor setzt es am Besuchstag). Schreibe eine Seite für die anwesende Person am 27. Nov.: was passiert, was sie antwortet, was sie nicht unterschreibt. Entwirf Notizen zu neuen Papieren für E-11 und E-19 (Urlaub) und die Überstundenmeldung aus vorlagen/neues-papier.md. Lass jede Unterschriftszeile leer. Antworte mit einer Zeile pro Frage: Zeilen-Id, Status, höchstens 8 Wörter Grund. Alles andere kommt in die Dateien. Höchstens 16 Zeilen.

Prüfe nach dem Lauf selbst zwei Dinge. Jede Unterschriftszeile in den Dateien, die Claude geschrieben hat (die Notizen zu neuen Papieren, das Briefing und evidence-index.csv), muss leer sein, und vorlagen/clock.csv muss das Datum der Papiere offen lassen, weil der Inspektor es am Besuchstag setzt. Lösche alles, was Claude ausgefüllt hat. Eine benannte Person unterschreibt, nicht Claude.

## Schritt 4: das Register bauen

Füge im selben Chat diesen Prompt ein und sende ihn. Vergleiche dann die Antwort mit LOESUNGEN.md.
Im Raum 11 Minuten. Am Schreibtisch etwa 20, unsere Schätzung, nicht gemessen.

    Baue das Register. Lies ordner-index.md und die CSV-Dateien im Ordner. Überspringe die Zeilen, die mit # beginnen. Mach register.csv mit den Spalten aus vorlagen/register.csv und einer Zeile pro Person und Papier. Papiere: contract, registration, medical-exam (gültig 24 Monate), leave-decision (nur für Personen mit 6 Monaten Betriebszugehörigkeit am 26. Nov. 2026), overtime-notice (für jede Person mit Überstundenwochen) und safety-statement (eine Zeile für die Firma, person_id FIRM). Nimm die Zuständigkeit aus ordner-index.md. Fehlt ein Papier, schreib MISSING in die Spalte date. Nennt keine Datei eine freigebende Person, schreib NICHT IN DATEIEN. Nimm Kennungen, keine Namen, und keine Gesundheitsinhalte, nur Daten. Schreibe dann check.py. Es liest register.csv und gibt für heute drei Listen aus: abgelaufen, läuft in den nächsten 60 Tagen ab, fehlt. Führe es mit dem heutigen Datum aus, 26. Nov. 2026. Antworte in höchstens 16 Zeilen: die drei Zahlen, dann die ersten fünf Zeilen von register.csv.

Dann frag das Register:

    Sieh dir register.csv an. Welche Papiere liegen für E-07 vor, welches fehlt, und wer ist jeweils zuständig? Antworte nur aus register.csv, in höchstens 8 Zeilen. Fehlt eine Zeile, sag NICHT IN DATEIEN.

Codeausführung ausgeschaltet? Bitte Claude um check.py und führe es auf deinem eigenen Rechner aus.

Die englischen Wörter in der Spalte paper (contract, registration, medical-exam, leave-decision, overtime-notice, safety-statement) und das Wort MISSING sind feste Kennwörter der Tabelle. Sie bleiben englisch, damit check.py sie wiederfindet. Die Spalte where nennt die Dateien so, wie sie im Ordner heißen.

## extras/ (freiwillig, für nach dem Workshop)

Die vier Schritte brauchen diesen Ordner nicht. Öffne ihn nach dem Workshop.

- extras/bereit-bleiben/: hält das Register nach der Prüfung aktuell, mit einer wöchentlichen geplanten Aufgabe (bezahlte Tarife), demselben Check einmal im Monat von Hand (Free-Tarif), Anweisungen für ein Registerprojekt, einer Sicherheitskarte auf einer Seite und einer Beobachtungsliste amtlicher Quellen.
- extras/inspektor/: ein Beispiel für das Verlangen nach Unterlagen und ein Beispielprotokoll des Besuchs.
- extras/faelle/: Fall B (Steueramt) und Fall C (Zertifizierer), für andere Arten von Audit.
- extras/vorlagen/: eine Stellungnahme zum Protokoll, der Monatscheck, 3 erfundene Beispielzeilen zum Üben und ein Übertragungsblatt für dein eigenes Audit.
- extras/claude/audit-nachweise/: der Skill. Die vier Schritte gehen auch ohne ihn. Wie du ihn einrichtest, steht unten.

## Freiwillig: den Skill einrichten

Der Skill ist der Unterordner extras/claude/audit-nachweise/ in diesem Kit, und zusätzlich als ZIP zum Herunterladen unter loehrning.ai/skills/audit-nachweise.zip. Das Kit enthält keine ZIP-Datei. Richte ihn einmal ein, dort wo du Claude nutzt:

<!-- claude-ui:de -->
