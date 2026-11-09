Erfundenes Übungsmaterial, für die Übung erfunden. Keine Rechtsberatung.

## Die Regeln in einer Minute

Eine Datei ist erst ein Nachweis, wenn Zitat, Zeitraum, Umfang und Freigabe stimmen. Diese vier Prüfungen gebe ich Claude als Regeln, und ohne wörtliches Zitat zählt nichts.
BELEGT, SCHWACH oder LÜCKE. Datei veraltet oder nicht freigegeben: SCHWACH. Ein Teil ohne Nachweis, oder der Nachweis zeigt „nicht erfüllt“: LÜCKE. Der schwächste Teil zählt.
Ohne Zitat kein BELEGT. Eine Richtlinie zeigt Absicht, nur ein Protokoll zeigt Praxis.

## Was du tust

Du bist das Büro einer erfundenen Firma, die eine Mitteilung über eine Inspektion bekommen hat. In vier Schritten hilft dir Claude, eine Tabelle zu bauen, einen Check laufen zu lassen, einen Plan zu schreiben und ein Register zu bauen. Eine Person entscheidet und unterschreibt.
Stufe 2 heißt: Die Dateien sind erfunden, du darfst sie in Claude laden. Stufe 3 ist deine eigene Firma: Claude schreibt ein Skript, du führst es auf deinem eigenen Rechner aus, und Claude sieht nur Spaltennamen und 3 erfundene Zeilen.

## Einmal einrichten

Öffne Claude, lege ein Projekt an, füge projektanweisungen.md ein, füge listen/ und ordner/ hinzu. Diese Dateien sind erfunden, das ist also Stufe 2 der Datenleiter. Eigene Firma später: Stufe 3, nur Spaltennamen und 3 erfundene Zeilen.

Füge faelle/fall-A-arbeit.md und vorlagen/register.csv ebenfalls zum Projekt hinzu. Die Fristen und die Artikelnummern aus Schritt 3 stehen in der Falldatei, die Spalten aus Schritt 4 in der Vorlage. Die Fälle B und C gehören zu anderen Audits und bleiben draußen.
Freiwillig: der Skill audit-nachweise. Die vier Schritte gehen auch nur mit den Projektanweisungen. Wie du ihn einrichtest, steht im letzten Abschnitt dieser Datei.

## Schritt 1

Sag es voraus, dann prüf es in LOESUNGEN.md.
Im Raum 6 Minuten. Am Schreibtisch etwa 20, unsere Schätzung, nicht gemessen.

    Lies die drei Auszüge der Prüfliste. Mach eine Tabelle mit einer Zeile pro Frage der Prüfliste: Zeilen-Id, Artikel, das Papier, das die Frage beantwortet, wer dafür zuständig ist, wo es liegt (nimm ordner-index.md). Öffne die Dateien im Ordner noch nicht. Fehlt ein Papier in den Dateien, schreib NICHT IN DATEIEN. Nimm Kennungen, keine Namen. Antworte nur mit der Tabelle.

## Schritt 2

Sag es voraus, dann prüf es in LOESUNGEN.md.
Im Raum 9 Minuten. Am Schreibtisch etwa 20, unsere Schätzung, nicht gemessen.

    Schreibe einen Check für die CSV-, txt- und md-Dateien im Ordner und führe ihn aus; überspringe CSV-Zeilen, die mit # beginnen. Gib aus, wie viele Zeilen du in jeder Datei gelesen hast. Gib zu jedem Fund Kennung, Regel und Zahl aus: Anmeldung später als am Tag vor der ersten Schicht; Überstundenwochen über 8 Stunden; Überstundenwochen ohne Meldung; Lohnzeilen ohne Überstundenzeile; Anwesenheitszeilen ohne Beginn und Ende; Lohn später als 15 Tage nach der Periode (ein freier Tag verschiebt es); fehlende Urlaubsbescheide oder unter 20 Tagen (geschuldet nach 6 Monaten); leere Felder in den Akten; Untersuchungen, die am 27. Nov. 2026 älter als 24 Monate sind; Stellenbezeichnungen, die in der Sicherheitserklärung fehlen; Unterweisung später als der Einstellungstag. Liste dann jeden Grenzfall auf, den du ausgeschlossen hast, mit dem Grund. Schließe mit einer Zeile Summen: Zeilen gelesen, Funde, Grenzfälle geprüft. Ändere keine Datei. Antworte in höchstens 16 Zeilen.

Kein Code-Werkzeug im Tarif oder ausgeschaltet? Bitte Claude um check.py und führe es auf deinem eigenen Rechner aus. Führe es so aus: python3 check.py ordner/ (Windows: py check.py ordner). Echte Firma: Nimm das Skript und führe es auf deinem eigenen Rechner aus; schick dem Werkzeug nur Spaltennamen und 3 erfundene Zeilen. Zum Üben nimm vorlagen/sample-rows_attendance.csv.

## Schritt 3

Sag es voraus, dann prüf es in LOESUNGEN.md.
Im Raum 9 Minuten. Am Schreibtisch etwa 30, unsere Schätzung, nicht gemessen. Mach es in zwei Anläufen: erst die Status und die neuen Papiere, dann das Briefing, die Notizen und die Dateien.

    Gib jeder Frage BELEGT, SCHWACH oder LÜCKE mit den vier Prüfungen und einem Zitat. LÜCKE: für jemanden fehlt das Papier, oder der Nachweis zeigt die Regel verletzt. SCHWACH: das Papier ist da, nur Datum oder Freigabe stimmt nicht. Nenne für jede SCHWACH und LÜCKE das neue Papier, das sie schließt (nie eine Änderung an einem alten), die zuständige Rolle und den Tag; heute ist der 26. Nov. 2026. Fülle vorlagen/evidence-index.csv. Schreibe vorlagen/clock.csv aus der Mitteilung und lass das Datum der Papiere offen (der Inspektor setzt es am Besuchstag). Schreibe eine Seite für die anwesende Person am 27. Nov.: was passiert, was sie antwortet, was sie nicht unterschreibt. Entwirf Notizen zu neuen Papieren für E-11 und E-19 (Urlaub) und die Überstundenmeldung aus vorlagen/neues-papier.md. Lass jede Unterschriftszeile leer. Antworte mit einer Zeile pro Frage: Zeilen-Id, Status, höchstens 8 Wörter Grund. Alles andere kommt in die Dateien. Höchstens 16 Zeilen.

Prüfe nach dem Lauf selbst zwei Dinge. Jede Unterschriftszeile in den Dateien, die Claude geschrieben hat (die Notizen zu neuen Papieren, das Briefing und evidence-index.csv), muss leer sein, und vorlagen/clock.csv muss das Datum der Papiere offen lassen, weil der Inspektor es am Besuchstag setzt. Lösche alles, was Claude ausgefüllt hat. Eine benannte Person unterschreibt, nicht Claude.

## Schritt 4

Sag es voraus, dann prüf es in LOESUNGEN.md.
Im Raum 12 Minuten. Am Schreibtisch etwa 20, unsere Schätzung, nicht gemessen.

    Baue das Register. Lies ordner-index.md und die CSV-Dateien im Ordner. Überspringe die Zeilen, die mit # beginnen. Mach register.csv mit den Spalten aus vorlagen/register.csv und einer Zeile pro Person und Papier. Papiere: contract, registration, medical-exam (gültig 24 Monate), leave-decision (nur für Personen mit 6 Monaten Betriebszugehörigkeit am 26. Nov. 2026), overtime-notice (für jede Person mit Überstundenwochen) und safety-statement (eine Zeile für die Firma, person_id FIRM). Nimm die Zuständigkeit aus ordner-index.md. Fehlt ein Papier, schreib MISSING in die Spalte date. Nennt keine Datei eine freigebende Person, schreib NICHT IN DATEIEN. Nimm Kennungen, keine Namen, und keine Gesundheitsinhalte, nur Daten. Schreibe dann check.py. Es liest register.csv und gibt für heute drei Listen aus: abgelaufen, läuft in den nächsten 60 Tagen ab, fehlt. Führe es mit dem heutigen Datum aus, 26. Nov. 2026. Antworte in höchstens 16 Zeilen: die drei Zahlen, dann die ersten fünf Zeilen von register.csv.

Dann frag das Register:

    Sieh dir register.csv an. Welche Papiere liegen für E-07 vor, welches fehlt, und wer ist jeweils zuständig? Antworte nur aus register.csv, in höchstens 8 Zeilen. Fehlt eine Zeile, sag NICHT IN DATEIEN.

Kein Code-Werkzeug im Tarif oder ausgeschaltet? Bitte Claude um check.py und führe es auf deinem eigenen Rechner aus.

Die englischen Wörter in der Spalte paper (contract, registration, medical-exam, leave-decision, overtime-notice, safety-statement) und das Wort MISSING sind feste Kennwörter der Tabelle. Sie bleiben englisch, damit check.py sie wiederfindet. Die Spalte where nennt die Dateien so, wie sie im Ordner heißen.

Jeden Monat: siehe vorlagen/monatscheck.md.

## Bereit bleiben

Nach der Prüfung bleibt das Register. Der Ordner bereit-bleiben/ hält es aktuell:

- bereit-bleiben/wochencheck_geplante-aufgabe.md: der Check als wöchentliche geplante Aufgabe, nur in bezahlten Tarifen.
- bereit-bleiben/monatscheck_von-hand.md: derselbe Check einmal im Monat von Hand, für den Free-Tarif.
- bereit-bleiben/register-projektanweisungen.md: die Anweisungen für ein zweites Projekt mit dem Register.
- bereit-bleiben/sicherheitskarte.md: was hinein darf, was nie, wer unterschreibt.
- bereit-bleiben/beobachtungsliste.md: wo neue Regeln und Kontrollen erscheinen.

## Nach dem Besuch (optional)

Die zwei Dateien in inspektor/ bleiben zu, bis ihr Tag da ist: das Verlangen am Tag des Besuchs, das Protokoll nach Schritt 3. Öffne inspektor/protokoll_beispiel_2026-11-27.md und nimm vorlagen/stellungnahme-protokoll.md. Schreibe zu jedem Punkt, der nicht zu dem passt, was geschah, höchstens vier Sätze. Das ist nur ein Entwurf: Eine benannte Person unterschreibt oder schreibt ihren Grund neben die Unterschrift.

## Freiwillig: den Skill einrichten

Der Skill ist der Unterordner claude/audit-nachweise/ in diesem Kit, und zusätzlich als ZIP zum Herunterladen unter loehrning.ai/skills/audit-nachweise.zip. Das Kit enthält keine ZIP-Datei. Richte ihn einmal ein, dort wo du Claude nutzt:

<!-- claude-ui:de -->
