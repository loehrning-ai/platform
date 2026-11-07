Erfundenes Übungsmaterial, für die Übung erfunden. Keine Rechtsberatung.

# Lösungen

Sag es voraus, dann prüf es. Die Formulierung eines KI-Laufs weicht von diesem Schlüssel ab. Die Zahlen dürfen es nicht.

## Schritt 1

Erwartet: 13 Zeilen, 5 Spalten, keine Namen. Ein Papier, das die Dateien nicht nennen, ist NICHT IN DATEIEN. Zuständige sind Rollen.

| Zeile | Artikel | Papier | Zuständig | Ablageort |
|---|---|---|---|---|
| L01 | ZRO Art. 15(2),(3) | schriftlicher Vertrag mit Kopiervermerk | Büroleiterin | Vertragsordner im Büro, contracts_register_2026.csv |
| L02 | ZRO Art. 13(3),(7) | Anmeldung M1/M2 | Büroleiterin | Ausdrucke der Arbeitsagentur, registration_M1M2_2026.csv |
| L03 | Gesetz über die Evidenzen Art. 8(1) | Personalakte | Büroleiterin | employee_records_2026.csv |
| L04 | ZRO Art. 116(8) | Anwesenheitsliste | Büroleiterin | attendance_2026-11.csv |
| L05 | ZRO Art. 117(2) | Liste der Überstunden | Büroleiterin | overtime_weekly_2026.csv |
| L06 | ZRO Art. 117(6) (Verstoß aufgeführt in Art. 265(1)) | Überstundenmeldung an den Arbeitsinspektor | Büroleiterin | meldungen_ueberstunden_ordner.txt |
| L07 | ZRO Art. 117(5), 110(2) | Lohnabrechnung mit Überstundenzeile | externe Buchhaltung | payroll_lines_2026-07_to_10.csv |
| L08 | ZRO Art. 109(2),(3) | Zahltage der Lohnläufe | externe Buchhaltung | payroll_runs_2026.csv |
| L09 | ZRO Art. 137(1),(4) | Urlaubsbescheid | Büroleiterin | leave_decisions_2026.csv und absences_2026.csv |
| L10 | ZBZR Art. 11(1) | Sicherheitserklärung | NICHT IN DATEIEN (der Index nennt keine Berufsbezeichnung für die Person mit dem Ordner) | der Ordner, sicherheitserklaerung_2019.md |
| L11 | ZBZR Art. 11(2) | Stellungnahme der Arbeitnehmervertretung | NICHT IN DATEIEN (keine Zuständigkeit im Index) | eine Zeile in sicherheitserklaerung_2019.md; kein eigenes Papier im Index |
| L12 | ZBZR Art. 22(1) | Untersuchungszettel | Büroleiterin | Zettel vom Gesundheitszentrum, medical_exams.csv (nur Daten) |
| L13 | ZBZR (Unterweisung neuer Beschäftigter; die Artikelnummer wird vor dem Druck bestätigt) | Nachweis der Sicherheitsunterweisung | Büroleiterin | training_proofs_2026.csv |

## Schritt 2

Gelesene Zeilen pro Datei:

| Datei | Gelesene Zeilen |
|---|---|
| contracts_register_2026.csv | 24 |
| registration_M1M2_2026.csv | 24 |
| employee_records_2026.csv | 24 |
| attendance_2026-11.csv | 432 |
| overtime_weekly_2026.csv | 34 |
| payroll_runs_2026.csv | 10 |
| payroll_lines_2026-07_to_10.csv | 96 |
| leave_decisions_2026.csv | 21 |
| absences_2026.csv | 1 |
| medical_exams.csv | 24 |
| training_proofs_2026.csv | 3 |
| Summe | 693 |

Funde:

| Id | Zeile | Regel | Zahl |
|---|---|---|---|
| F1 | L02 | Anmeldung später als am Tag vor der ersten Schicht eingereicht (Art. 13(7)) | E-05 angemeldet am 2026-03-05, fällig am 2026-03-01: 4 Tage nach dem Fälligkeitstag, 3 Tage nach der ersten Schicht (2026-03-02) |
| F2 | L06 | Überstundenwochen ohne Meldung an den Inspektor (Art. 117(6)) | E-07 und E-08: je 17 Wochen, 0 Meldungen für 2026 |
| F3 | L05 | Überstunden über 8 Stunden pro Woche (Art. 117(2)) | E-07: 9 Stunden in 17 von 17 Wochen, 153 Stunden insgesamt |
| F4 | L07 | Überstunden ohne Überstundenzeile in der Lohnabrechnung (Art. 117(5)) | E-07 und E-08: 8 Lohnzeilen (je 4 Monate) |
| F5 | L04 | Anwesenheitszeilen mit Häkchen und ohne Beginn und Ende (Art. 116(8)) | E-12 und E-13: 20 Personentage (2026-11-02 bis 2026-11-13, je 10) |
| F6 | L08 | Lohn später als 15 Tage nach Ende der Periode gezahlt (Art. 109(2)) | Periode bis 2026-09-30: gezahlt am 2026-10-19, Grenze 2026-10-15, 4 Tage zu spät |
| F7 | L09 | Urlaubsbescheid fehlt oder unter 20 Tagen, fällig nach 6 Monaten (Art. 137) | 23 berechtigt, 21 Bescheide: E-11 und E-19 fehlen, E-14 hat 18 Tage |
| F8 | L03 | Leere Felder in der Personalakte (Gesetz über die Evidenzen Art. 8) | 3 unvollständige Akten, 7 leere Zellen (E-04 zwei, E-15 drei, E-21 zwei) |
| F9 | L12 | Untersuchung am 2026-11-27 älter als 24 Monate (ZBZR Art. 22(1)) | E-02, E-06, E-10, E-16: letzte Untersuchung 2024-09-12, 76 Tage über 24 Monate |
| F10 | L10 | Stelle des Registers fehlt in der Sicherheitserklärung (ZBZR Art. 11(1)) | 10 Stellen im Register, 8 in der Erklärung: 2 fehlen (order picker, forklift operator) |

Was du sagst:

- F1: sag, dass es gegen Art. 13(7) verstößt und dass der Inspektor über die Maßnahme entscheidet. E-05 hatte einen Vertrag, der Fall von Art. 265(1) ohne Vertrag und ohne Anmeldung passt also nicht.
- F6: sag, dass ein später Zahltag in der Praxis der DIT wohl unter Art. 265 fällt und dass der Inspektor entscheidet. Das ist ein Punkt für die Fachperson.
- F8: sag, dass die Strafe dem Nichtführen der Akte gilt, nicht dem unvollständigen Inhalt. Erwarte ein Protokoll, eine Verwarnung und eine Frist zum Ergänzen.

Geprüft, ohne Befund (Grenzfälle, jeder mit Grund):

| Id | Zeile | Wer | Warum es geklärt ist |
|---|---|---|---|
| D1 | L02 | E-22 | Angemeldet am 2026-05-29 für einen Beginn am 2026-06-01: vor dem Tag vor Beginn. |
| D2 | L05 | E-08 | 7 Stunden pro Woche liegen unter der Grenze von 8 Stunden. |
| D3 | L09 | E-09 | Genau 20 Tage erfüllen das Minimum von 20. |
| D4 | L08 | ganze Firma | Die Oktoberperiode wurde am 2026-11-16 gezahlt. Der 15. ist ein Wochenendtag, die Grenze rückt also auf Mo 16. Nov. |
| D5 | L12 | E-03 | Letzte Untersuchung 2024-12-03, gültig bis 2026-12-03: am 2026-11-27 innerhalb von 24 Monaten. |
| D6 | L09 | E-22 | Noch kein Urlaubsbescheid: Das volle Recht auf 20 Tage entsteht nach 6 Monaten, am 2026-12-01 (Art. 139). Ein anteiliges Recht davor gibt es, es liegt außerhalb des Kits: frag die Fachperson. |
| D7 | L13 | E-05, E-19, E-22 | Jedes Unterweisungsdatum liegt am Einstellungstag oder davor. |
| D8 | L04 | E-07 | Sechs Zeilen ohne Zeiten tragen den Code ABS und passen zu absences_2026.csv. |

Zwei falsche Antworten nebeneinander:

| | Zu viel gemeldet | Zu wenig gemeldet |
|---|---|---|
| Funde | 12 | 9 |
| Was schiefging | Fügt D2 (E-08 mit 7 Stunden) und D3 (E-09 mit genau 20 Tagen) hinzu, die in Ordnung sind | Übersieht F6, den zu spät gezahlten Septemberlohn |

Zählung: 10 Funde, 8 geprüft ohne Befund.

## Schritt 3

Status pro Zeile, mit einem Zitat aus der Datei. Der schwächste Teil zählt.

| Zeile | Status | Was scheitert | Zitat | Lesart |
|---|---|---|---|---|
| L01 | BELEGT | nichts | „E-05,sales adviser,shop,2026-03-02,40,yes“ | Alle 24 Zeilen sagen yes. Nichts zu finden (erfunden, kein Problem eingebaut). |
| L02 | LÜCKE | ZEITRAUM, das Protokoll zeigt den Regelverstoß | „E-05,sales adviser,shop,2026-03-02,40,yes“ und „E-05,2026-03-05“ | E-05 wurde 4 Tage nach dem Fälligkeitstag angemeldet. Das Protokoll zeigt den Regelverstoß. Zwilling: E-22 rechtzeitig angemeldet (D1). |
| L03 | LÜCKE | UMFANG | „Mogila,,,T03“ | Drei Akten haben leere Felder: UMFANG scheitert, die Zellen fehlen. Die Strafe gilt dem Nichtführen der Akte, nicht dem unvollständigen Inhalt. |
| L04 | LÜCKE | ZITAT | „E-12,2026-11-02,,,x,“ | E-12 hat ein Häkchen und kein Beginn und Ende. E-12 und E-13 zusammen: 20 Personentage. Die sechs Zeilen von E-07 tragen den Code ABS und sind geklärt (D8). |
| L05 | LÜCKE | ZEITRAUM, das Protokoll zeigt den Regelverstoß | „E-07,2026-07-06,9“ | E-07 arbeitet jede Woche 9 Stunden Überstunden. Das Protokoll zeigt den Regelverstoß. E-08 mit 7 Stunden ist in Ordnung (D2). |
| L06 | LÜCKE | ZITAT, ZEITRAUM, FREIGABE | „Signed by:“ und „2026: (leer)“ | Eine Meldung im Ordner, von 2019, mit leerem Unterschriftsfeld. Keine Meldung für 2026. ZITAT, ZEITRAUM und FREIGABE scheitern. |
| L07 | LÜCKE | UMFANG | „E-07,2026-07,166,“ | Die Spalte für Überstunden ist leer: Die Lohnzeile von E-07 hat keine Überstundenzeile, bei E-08 ebenso. Insgesamt 8 Zeilen. |
| L08 | LÜCKE | das Protokoll zeigt den Regelverstoß | „2026-09-30,2026-10-19“ | Die Septemberperiode wurde am 2026-10-19 gezahlt, die Grenze war der 2026-10-15. Die Oktoberperiode ist rechtzeitig (D4). |
| L09 | LÜCKE | UMFANG, das Protokoll zeigt den Regelverstoß | „E-14,18,2026-01-06“ | E-11 und E-19 haben keinen Bescheid, E-14 hat 18 Tage. UMFANG scheitert und das Protokoll zeigt den Regelverstoß. E-09 mit genau 20 und E-22, noch nicht berechtigt, sind geklärt (D3, D6). |
| L10 | LÜCKE | UMFANG | „Datum: 2019-03-14“ | Die Erklärung nennt 8 Stellen, das Register hat 10. Es fehlen order picker und forklift operator. |
| L11 | SCHWACH | ZEITRAUM | „Stellungnahme der Arbeitnehmervertretung: liegt zu diesem Text vor, datiert 2019-03-20“ und „Letzte Änderung am Arbeitsplatz: Regalanbau in der Halle und Staplerarbeit kamen 2023 dazu.“ | Die Stellungnahme ist von 2019, der Arbeitsplatz änderte sich 2023. ZEITRAUM scheitert. Niemand fehlt und die Regel ist nicht als verletzt gezeigt, also SCHWACH. Eine neue datierte Stellungnahme schließt es. |
| L12 | LÜCKE | das Protokoll zeigt den Regelverstoß | „E-02,2024-09-12“ | Vier Personen haben 2024-09-12, am 2026-11-27 sind es 76 Tage über 24 Monate. E-03 gilt bis 2026-12-03 (D5). |
| L13 | BELEGT | nichts | „E-19,2025-12-01,2025-11-28“ | Drei Neueinstellungen, drei Nachweise, jeder am Einstellungstag oder davor (D7). |

Neue Papiere, die die Zeilen SCHWACH und LÜCKE schließen (nie eine Änderung eines alten Papiers). Heute ist Do 26. Nov 2026.

| Zeile | Neues Papier | Zuständig | Tag |
|---|---|---|---|
| L02 | Notiz mit den Fakten zur Anmeldung von E-05 (eingereicht 2026-03-05) und eine Prüfung, dass jede Neueinstellung ab jetzt vor der ersten Schicht angemeldet wird | Büroleiterin | Do 26. Nov |
| L03 | Neue datierte Einträge mit den fehlenden Angaben für E-04, E-15 und E-21. Die alten Einträge bleiben, wie sie sind | Büroleiterin | Do 26. Nov, Einträge sobald die Angaben vorliegen |
| L04 | Notiz, dass E-12 und E-13 für 2. bis 13. Nov nur Häkchen haben, und ab jetzt eine Liste mit Beginn und Ende an jedem Tag. Zeiten werden nie nachträglich ausgefüllt | Büroleiterin | Do 26. Nov |
| L05 | Schriftliche Entscheidung, dass Überstunden über 8 Stunden enden oder in Schichten wandern, ab der nächsten Woche | Geschäftsführung | Do 26. Nov |
| L06 | Überstundenmeldung an den Arbeitsinspektor für E-07 und E-08, datiert auf den Tag der Unterschrift. Die 17 vergangenen Wochen bleiben ohne Meldung | Geschäftsführung | Do 26. Nov |
| L07 | Notiz an die externe Buchhaltung: Ab dem nächsten Lohnlauf stehen Überstunden in einer eigenen Zeile. Die 8 alten Zeilen bleiben, wie sie sind | externe Buchhaltung | Do 26. Nov |
| L08 | Notiz zum Septemberlohn (4 Tage zu spät) und ein Zahlkalender, der Art. 109 folgt | Geschäftsführung mit der externen Buchhaltung | Do 26. Nov |
| L09 | Neue Urlaubsbescheide für E-11 und E-19 und ein neuer Bescheid von mindestens 20 Tagen für E-14, jeder datiert auf den Tag der Unterschrift | Geschäftsführung | Do 26. Nov |
| L10 | Neuer Text der Sicherheitserklärung, der order picker und forklift operator nennt | Geschäftsführung mit dem externen Sicherheitsdienst | Do 26. Nov, Beginn |
| L11 | Neue datierte Stellungnahme der Arbeitnehmervertretung zum neuen Text | Geschäftsführung | nachdem der neue Text geschrieben ist |
| L12 | Überweisung mit dem heutigen Datum für E-02, E-06, E-10 und E-16 und die neuen Untersuchungszettel, wenn es sie gibt | Büroleiterin | Do 26. Nov |

L01 und L13 brauchen kein neues Papier. Jede Unterschriftszeile bleibt leer, bis eine benannte Person unterschreibt.

Muster für die Person, die anwesend ist (höchstens 150 Wörter):

> Beantworte nur, was gefragt wird. Nenne das Papier. Gibt es keins, sag: dieses Papier gibt es nicht, wir schreiben es heute. Rate keine Zeiten oder Daten. Unterschreibe kein Protokoll, das nicht stimmt; schreibe deinen Grund neben die Unterschrift (ZIN Art. 54, 65).

Zählung: 2 BELEGT, 1 SCHWACH, 10 LÜCKE.

## Die Fristen

Die Mitteilung kam am 2026-11-23 (Mo). Der Besuch ist am 2026-11-27 um 09:00 Uhr: 4 Kalendertage nach der Mitteilung, mit 3 Arbeitstagen dazwischen (Di, Mi, Do). Heute ist in der Übung Do 26. Nov.

| Ereignis | Regel | Datum |
|---|---|---|
| Mitteilung | der Brief des Arbeitsinspektorats | 2026-11-23 |
| Besuch | in der Mitteilung genannt | 2026-11-27, 09:00 Uhr |
| Verlangte Papiere | 3 Kalendertage nach dem schriftlichen Verlangen (ZIN Art. 53(1)) | am Do 26. Nov nicht bekannt; das erfundene Verlangen vom Besuchstag nennt Mo 2026-11-30 |
| Bescheid | spätestens 8 Tage nach dem Tag, an dem das Protokoll aufgesetzt wird (ZIN Art. 68) | nicht bekannt, bis das Protokoll existiert |
| Widerspruch | binnen 15 Tagen nach Erhalt, er hemmt den Bescheid nicht (ZIN Art. 70) | nicht bekannt, bis der Bescheid kommt |

Die reguläre Mitteilung kommt mindestens 3 Arbeitstage vor dem Beginn (ZIN Art. 57), mit Ausnahmen, und das eigene Gesetz des Inspektorats kann abweichen. Ob der Tag der Mitteilung und der Besuchstag mitzählen, ist in unseren Quellen nicht geklärt: Frag die Fachperson. Die Frist für die Papiere zählt Kalendertage. Die clock.csv aus Schritt 3 enthält nur das Datum der Mitteilung, das Datum des Besuchs und die Regel „papers: 3 calendar days after the written request“.

## Wie dieser Schlüssel entstand

Aus den Dateien des Kits von einem Skript gerechnet, dann von einem zweiten Skript geprüft. Ein KI-Lauf weicht in der Formulierung ab. Die Zahlen dürfen es nicht.
