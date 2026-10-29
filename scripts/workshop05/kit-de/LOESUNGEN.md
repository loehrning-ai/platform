# Lösungen
Erfundenes Übungsmaterial. Vergleiche Fakten und Status, nicht die Formulierung. Wo du und Claude auseinanderliegen, entscheidet die Datei.

## Schritt 1: die Nachweisliste
7 von 11 Dateien bestehen ZEITRAUM und FREIGABE.

| Datei | Typ | Datum (Art) | Freigegeben oder geführt von | ZEITRAUM | FREIGABE |
|---|---|---|---|---|---|
| system-list_2026-09.csv | REGISTER | 2026-09-02 freigegeben | Geschäftsführung; geführt von IT-Leitung | hält | hält |
| subprocessors_2026-09.csv | REGISTER | 2026-09-05 aktualisiert | IT-Leitung | hält | hält |
| ai-use-rule_v1.md | RICHTLINIE | 2026-10-01 freigegeben | Geschäftsführung | SCHEITERT | hält |
| vendor-page_claude_2026-06-15.md | AUSSAGE | Seite 2026-06-15, gedruckt 2026-10-06 | Anthropic (Herausgeber) | hält | hält |
| access-review_2026-08-14.csv | PROTOKOLL | 2026-08-14 erledigt, 2026-08-17 freigegeben | IT-Leitung; freigegeben von Geschäftsführung | hält | hält |
| training-records_2026.csv | PROTOKOLL | 2026-11-02 exportiert | HR-Leitung | hält | hält |
| incident-log_2026.csv | PROTOKOLL | letzter Eintrag 2026-10-12 | IT-Leitung | hält | hält |
| backup-report_2026-10.txt | PROTOKOLL | 2026-11-01 erzeugt | Backup-System; geführt von IT-Leitung | hält | hält |
| it-notes_2026-10-06.md | AUSSAGE | 2026-10-06 geschrieben | "Not reviewed by anyone" | hält | SCHEITERT |
| infosec-policy_v3_FINAL.md | RICHTLINIE | 2024-03-12 freigegeben, Überprüfung fällig März 2025 | Geschäftsführung | SCHEITERT | hält |
| infosec-policy_v4_DRAFT.md | RICHTLINIE | 2026-09-18 bearbeitet | "Approved by: (open)" | SCHEITERT | SCHEITERT |

Ein junges Datum allein besteht ZEITRAUM nicht. Die KI-Regel gilt erst ab 1. Oktober 2026, davor fehlen 295 Tage. Version 4 hat ein Bearbeitungsdatum, aber keinen Freigabe- oder Prüftermin.

Achte auf: eine Freigabe, die Claude v4 zuschreibt; "FINAL" als aktuell gelesen; ein Datum aus dem Dateinamen; die Anbieterseite als nicht freigegeben markiert (Anbieter und Datum der Seite zählen); ein Personenname, wo Regel 13 eine Rolle verlangt.

## Schritt 2: die acht Anforderungen
| Anforderung | Datei | Zitat | Prüfung, die scheitert | Status |
|---|---|---|---|---|
| R1 | system-list | "United States (see vendor-page_claude_2026-06-15.md)" | keine | BELEGT |
| R2 | subprocessors | "Anthropic,Claude Team,United States,accepted online 2026-09-01,," | ZITAT für zwei Teile: letzte Prüfung und Übermittlungsgrundlage leer | LÜCKE |
| R3 | ai-use-rule | "Valid from 2026-10-01." | ZEITRAUM: 10.12.2025 bis 30.09.2026 (295 Tage) ohne Regel; it-notes nennen einen kostenlosen Chatbot bis September | LÜCKE |
| R4 | access-review | "Review of administrator accounts in Servicepult" | UMFANG: 1 von 4 Systemen, drei ohne Prüfung | LÜCKE |
| R5 | training-records | "Staff on 2026-11-01: 120." | nicht erfüllt: 26 Zeilen, E014 doppelt, 25 von 120 = 20,8 %; 95 % brauchen 114 | LÜCKE |
| R6 | incident-log | "INC-02,2026-05-07 09:40,Tannwald" und "2026-05-08 16:10" | keine: nach 30,5 Stunden informiert | BELEGT |
| R7 | backup-report | "Restore test: not done in 2026." | nicht erfüllt | LÜCKE |
| R8 | infosec-policy_v3_FINAL | "Approved 2024-03-12"; v4: "Approved by: (open)" | ZEITRAUM (v3 alt; v4 ohne Freigabe- oder Prüftermin), FREIGABE (v4) | SCHWACH |

Zählung: 2 BELEGT, 1 SCHWACH, 5 LÜCKE.

SCHWACH heißt: Eine Datei antwortet für jeden Teil, ist aber veraltet, ein Entwurf oder nicht freigegeben (R8). Ein Teil ganz ohne Nachweis ist LÜCKE: zwei leere Felder im Register (R2), 295 Tage ohne Regel (R3), drei Systeme ohne Prüfung (R4). Die Anforderung bekommt den Status ihres schwächsten Teils, wie in Workshop 04.

R1 fragt, welche Systeme die Daten jetzt speichern oder verarbeiten. Der kostenlose Chatbot, den it-notes bis September nennen, gehört zu R3, nicht zu R1.

R1 ist BELEGT und trotzdem eine schlechte Nachricht: Die Systemliste belegt, dass Claude Team Anfragetexte von Tannwald in den USA speichert, und Klausel 7 verlangt eine schriftliche Mitteilung und Speicherung in der EU oder im EWR, außer Tannwald stimmt schriftlich zu. BELEGT heißt belegt, nicht gut. R1 fragt nach einem Fakt, wo die Daten liegen, also ist der Beweis einer schlechten Nachricht BELEGT. R5 und R7 verlangen, dass etwas erfüllt ist; ihre Protokolle zeigen, dass es nicht erfüllt ist, also LÜCKE.

R6 ist BELEGT für die Vorfälle im Log. it-notes nennen einen kostenlosen Chatbot, den Beschäftigte bis September für Antworten nutzten. Ob dabei Tannwald-Daten eingegeben wurden und ob das ein Vorfall ist, den Tannwald nach Abschnitt 6.2 erfahren muss, entscheidet die Geschäftsführung, nicht Claude. Wenn ja, wird R6 zur LÜCKE.

Die Frage zu R7: nein. Eine Richtlinie sagt, was passieren soll. Nur ein Protokoll zeigt, dass es passiert ist, und dieses Protokoll sagt, dass es nicht passiert ist. Dasselbe gilt für R4 und "Administrator access is reviewed every quarter".

Wo Claude bei diesem Ordner danebenliegt, und die Regel, die es stoppt:
- R7 oder R4 BELEGT aus der Richtlinie: Regel 4.
- R8 BELEGT aus v4, weil sie die neueste ist: Regel 7.
- R5 "26 Beschäftigte" oder ein Anteil ohne Code: Regel 11.
- R1 als SCHWACH markiert, weil die Antwort unerwünscht ist: Regel 9.
- "ISO 27001 A.x.x" oder ein DSGVO-Artikel, der in keiner Datei steht: Regel 12.
- Ein Zitat, das nicht in der Datei steht: Regel 10.

Wo dein Status abweicht, such in projektanweisungen.md die Regel, die ihn entscheidet.

## Schritt 3: Lücken und Antwort
Lückenliste: R8 (SCHWACH); R2, R3, R4, R5, R7 (LÜCKE). Zuständig: IT-Leitung für R2, R3, R4, R7; HR-Leitung für R5; Geschäftsführung für R8. Bis 2. Dezember 2026.
Bis 25.11. geht die Antwort mit R1, R6 und der Lückenliste samt Terminen raus; die fehlenden Dokumente folgen bis 2.12., acht Tage vor dem Audit.

Beispiel-Mail (R7), gefüllt aus vorlagen/luecken-anfrage.md:

```
Betreff: Audit Tannwald am 10. Dezember 2026, R7: Protokoll eines Wiederherstellungstests bis 2. Dezember 2026

Hallo Goran,

für das Audit von Tannwald am 10. Dezember 2026 verlangt Anforderung R7:
"A restore test of your backups from the last 12 months, with its result"

Was wir haben: backup-report_2026-10.txt, datiert 1. November 2026.
Es scheitert an ZITAT: Das Protokoll sagt "Restore test: not done in 2026." und keine andere Datei zeigt einen Test.

Was die Lücke schließt: ein Protokoll eines Wiederherstellungstests (Datum, wiederhergestellte Daten, Ergebnis, wer), datiert ab 10. Dezember 2025, erstellt von der IT-Leitung, für den Servicepult-Export und die Dateiablage.

Bitte schick es bis 2. Dezember 2026. Gibt es das nicht, schreib "gibt es nicht". Auch diese Antwort hilft: Dann melden wir die Anforderung als offen, planen sie und nennen Tannwald einen Termin.

Danke
[Name]
```

Prüfung des Antwortentwurfs:
| # | Satz | Urteil | Nachweis |
|---|---|---|---|
| 1 | All staff trained in data protection and AI | STREICHEN | training-records: 25 von 120 |
| 2 | Admin access reviewed every quarter | STREICHEN | eine Prüfung, 2026-08-14, nur Servicepult |
| 3 | Backups tested regularly | STREICHEN | "Restore test: not done in 2026." |
| 4 | Your data stays in the EU | STREICHEN | system-list: Claude Team, United States |

Beispielantwort an den Kunden, auf Englisch (deine Formulierung wird anders sein):
```
Dear Ms Keller,
We submit R1, the system list approved on 2 September 2026, and R6, the incident log. It records notice of INC-02 after 30.5 hours.
R2 lacks Anthropic's last review and transfer basis. R3 lacks an approved rule before 1 October 2026. R4 lacks administrator reviews for three systems. R5: 25 of 120 staff are trained. R7: we have not run a restore test in 2026. R8 lacks a current approved policy.
By 2 December we will provide missing evidence or, where it does not exist, an owner and completion date. These are commitments, not completed controls.
Claude Team stores data in the USA. Clause 7 requires prior written notice and written consent to storage outside the EU/EEA. Our folder contains neither. We request your instructions before further use.
Dragan Ilievski
```
Die Antwort darf nicht "all staff", "every quarter", "tested regularly", "stays in the EU" oder "compliant" sagen. Alles, was einen Vertragspunkt einräumt (Klausel 7), entscheidet die Geschäftsführung, wenn möglich mit rechtlichem Rat.
