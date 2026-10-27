# Lieferantenaudit Tannwald 2026: Nachweise R1–R8 (interner Arbeitsstand)

Stand: 9. November 2026. Remote-Audit: 10. Dezember 2026. Abgabe der Unterlagen: 25. November 2026.
Zeitfenster laut Anforderung: Ein Dokument ist aktuell, wenn es am oder nach dem **10. Dezember 2025** datiert ist (bei Richtlinien zählt die letzte Freigabe oder Überprüfung). "Letzte 12 Monate" (R3, R5, R7) = 10.12.2025 bis 10.12.2026.
Schwellen, wörtlich: "Training must reach at least 95% of your staff." / "Incidents with our data must reach us within 48 hours of detection (section 6.2)."

Personen sind mit ihrer Rolle genannt, Beschäftigte und Konten nur mit IDs.

## Schritt 1: Nachweisliste

| Datei | Typ | Datum (Art) | Freigabe / geführt von | Umfang | Andere Fassungen |
|---|---|---|---|---|---|
| system-list_2026-09.csv | REGISTER | 2026-09-02 (Freigabe) | geführt: IT-Leitung; freigegeben: Geschäftsführung | 4 Systeme mit Tannwald-Daten | – |
| subprocessors_2026-09.csv | REGISTER | 2026-09-05 (letzte Aktualisierung) | geführt: IT-Leitung | 4 Unterauftragsverarbeiter | – |
| ai-use-rule_v1.md | RICHTLINIE | 2026-10-01 (Freigabe, gültig ab) | freigegeben: Geschäftsführung; Owner: IT-Leitung | alle Beschäftigten | – |
| vendor-page_claude_2026-06-15.md | AUSSAGE (Herstellerseite) | 2026-06-15 (Seitendatum), gedruckt 2026-10-06 | Herausgeber: Anthropic (Privacy Center) | Speicherort Claude | – |
| access-review_2026-08-14.csv | PROTOKOLL | 2026-08-14 (durchgeführt), 2026-08-17 (Freigabe) | durchgeführt: IT-Leitung; freigegeben: Geschäftsführung | nur Servicepult, 5 Admin-Konten | – |
| training-records_2026.csv | PROTOKOLL (HR-Export) | 2026-11-02 (Export) | HR-Leitung | 1 Kurs, 26 Zeilen | – |
| incident-log_2026.csv | REGISTER/PROTOKOLL | letzter Eintrag 2026-10-12 | geführt: IT-Leitung | 3 Vorfälle 2026 | – |
| backup-report_2026-10.txt | PROTOKOLL | 2026-11-01 (erzeugt) | Owner: IT-Leitung | Servicepult-Export, Fileshare; Oktober 2026 | – |
| infosec-policy_v3_FINAL.md | RICHTLINIE | 2024-03-12 (Freigabe), nächste Prüfung März 2025 | Geschäftsführung | Regeln 1–5 | v4 |
| infosec-policy_v4_DRAFT.md | RICHTLINIE (ENTWURF) | 2026-09-18 (zuletzt bearbeitet) | Freigabe: "(open)" | Regeln 1–6 | v3 |
| it-notes_2026-10-06.md | AUSSAGE | 2026-10-06 (geschrieben) | "Not reviewed by anyone." | private Notizen der IT-Leitung | – |

"FINAL" im Dateinamen von v3 belegt nichts; die Freigabe steht im Dokument selbst und ist von 2024.

## Schritt 2 und 3: Prüfung je Anforderung

| Anf. | Datei | Zitat | ZITAT | ZEITRAUM | UMFANG | FREIGABE | Status | Was schließt die Lücke | Zuständig |
|---|---|---|---|---|---|---|---|---|---|
| R1 | system-list_2026-09.csv | "Claude Team (browser and desktop app; 25 seats since 2026-09-01),drafting replies to service requests,request text pasted by agents,United States" | ja | ja (2026-09-02) | ja für den heutigen Stand: 4 Systeme, je mit Land. Siehe Hinweis zu den privaten Chatbots | ja: "Approved 2026-09-02" (Geschäftsführung) | **BELEGT** | – (Hinweis unten beachten) | IT-Leitung |
| R2 | subprocessors_2026-09.csv | "Anthropic,Claude Team,United States,accepted online 2026-09-01,," | ja | ja (2026-09-05); Prüfungen Servicepult 2026-01-20, Sprechband 2026-05-12, Nordlager 2026-02-03 liegen im Fenster | Anthropic: **letzte Prüfung leer, Rechtsgrundlage für die Übermittlung in die USA leer**. Anbieter der privaten Chatbots fehlen ganz | Register mit Verantwortlichem (IT-Leitung) | **LÜCKE** | Rechtsgrundlage für die Übermittlung in die USA (Vertragsunterlagen mit Anthropic), dokumentierte Prüfung von Anthropic | IT-Leitung + Geschäftsführung |
| R3 | ai-use-rule_v1.md, system-list_2026-09.csv, vendor-page_claude_2026-06-15.md, it-notes_2026-10-06.md | "Valid from 2026-10-01" / "Note that data is stored in the US." / "Until September some agents on the Tannwald desk used a free chatbot on their phones to word replies. Stopped with the AI rule on 1 October." | Claude: Tool, Daten, Land und Regel liegen vor. Private Chatbots: nur eine ungeprüfte Notiz, kein Tool, keine Daten, kein Land | Regel gilt erst ab 01.10.2026. Claude läuft seit 01.09.2026 → **30 Tage ohne freigegebene Regel**; der Chatbot-Zeitraum vor Oktober ist ganz ohne Regel | Chatbot-Nutzung: welche Tools, welche Daten, welches Land: NICHT IN DEN DATEIEN | Regel: Geschäftsführung 2026-10-01. Herstellerseite: Anthropic, 15.06.2026 | **LÜCKE** | Aufstellung der privaten Chatbot-Nutzung (wer per ID, welches Tool, welche Daten, Zeitraum), Entscheidung, ob sie als Vorfall gilt | IT-Leitung + Teamleitung Tannwald-Desk |
| R4 | access-review_2026-08-14.csv | "Review of administrator accounts in Servicepult (ticket system)" / "adm-03,left 2026-07-31,team lead,yes,removed 2026-08-14" / "adm-04,employee,reporting,no,MFA switched on 2026-08-14" | ja für Servicepult | ja (2026-08-14) | **nur 1 von 4 Systemen aus R1.** Sprechband, Nordlager-Fileshare, Claude Team: kein Review | ja (Geschäftsführung 2026-08-17) | **LÜCKE** | Admin-Reviews für Sprechband, Nordlager, Claude Team (Abgänge entfernt, MFA an), mit Freigabe | IT-Leitung; Sprechband: Teamleitung Tannwald-Desk |
| R5 | training-records_2026.csv | "Staff on 2026-11-01: 120." / einziger Kurs: "Claude Team intro: data rules" | nur KI-Schulung; **Datenschutzschulung: NICHT IN DEN DATEIEN** | ja (Sept. 2026) | 26 Zeilen, 1 Dublette (E014) → 25 Personen von 120 = **20,8 %**; nötig wären 114 | Export der HR-Leitung | **LÜCKE** | Datenschutz-Schulungsnachweise der letzten 12 Monate; KI-Schulung für die übrigen Beschäftigten | HR-Leitung |
| R6 | incident-log_2026.csv | "INC-02,2026-05-07 09:40,Tannwald" … "2026-05-08 16:10,mail auto-complete chose the wrong address" | ja: erkannt, gemeldet, Ursache, Behebung | ja (letzter Eintrag 2026-10-12) | INC-02: Meldung nach **30,5 h** (< 48 h). Offen: private Chatbot-Nutzung mit Tannwald-Daten steht nicht im Log | Register mit Verantwortlichem (IT-Leitung) | **BELEGT** für die erfassten Vorfälle (siehe Hinweis) | Entscheidung: Ist die Chatbot-Nutzung ein Vorfall? Wenn ja, wird R6 zur LÜCKE (nicht erfasst, nicht gemeldet) | Geschäftsführung |
| R7 | backup-report_2026-10.txt | "Restore test: not done in 2026. Planned for Q4 2026 (owner: IT lead)." | **Der Nachweis zeigt, dass kein Test stattfand.** Die IT-Notiz "Backups are tested" ist ungeprüft und widerspricht dem Bericht | – | – | Owner: IT-Leitung | **LÜCKE** | Restore-Test durchführen und protokollieren (Datum, Umfang, Ergebnis, wer) | IT-Leitung |
| R8 | infosec-policy_v3_FINAL.md, infosec-policy_v4_DRAFT.md | v3: "Approved 2024-03-12 by […], Managing Director. Next review: March 2025." / v4: "Approved by: (open)" | ja | v3: **außerhalb des Fensters** (Freigabe 1003 Tage vor dem Audit, Prüftermin März 2025 verpasst) | Regeln 1–5 (v4: + KI) | v4: **ENTWURF, keine Freigabe** | **SCHWACH** (ZEITRAUM v3, FREIGABE v4) | v4 durch die Geschäftsführung freigeben, mit Datum | Geschäftsführung |

Gegenprobe: Alle Zitate habe ich am Ende per Code wörtlich in ihren Dateien gesucht und gefunden. Bei v3 ist der Name durch […] ersetzt.

### Zählung (im Code gerechnet)
- BELEGT: 2 (R1, R6)
- SCHWACH: 1 (R8)
- LÜCKE: 5 (R2, R3, R4, R5, R7)
- Schulung: 26 Zeilen, 1 Dublette entfernt (E014, 03.09. und 10.09.), 25 Personen / 120 = 20,8 %. Für 95 % fehlen 89 Personen.
- INC-02: erkannt 2026-05-07 09:40, gemeldet 2026-05-08 16:10 → 30,5 Stunden.
- Abgang adm-03: ausgeschieden 2026-07-31, Konto entfernt 2026-08-14 → 14 Tage.

## Hinweise, die ein Mensch entscheiden muss

1. **Vertragsklausel 7.** Der Kunde zitiert: "AI tools are used with Customer Data only after written notice to the Customer. Customer Data is stored in the EU or EEA unless the Customer agrees in writing." In den Dateien:
   - Claude Team speichert in den USA ("Note that data is stored in the US.", Herstellerseite; ebenso Systemliste und KI-Regel).
   - Eine schriftliche Mitteilung an Tannwald oder eine Zustimmung von Tannwald: NICHT IN DEN DATEIEN. Die IT-Notiz sagt: "Did we ever tell Tannwald in writing that we use Claude (clause 7)? I found nothing."
   - Private Chatbots auf Handys wurden bis September mit Tannwald-Anfragen genutzt (nur IT-Notiz, ungeprüft).
   Mit R1, R3 und den Unterlagen zu R2 sieht Tannwald das selbst. Das gehört vor der Abgabe auf den Tisch der Geschäftsführung, eventuell mit rechtlicher Beratung.
2. **"Data stays in Europe"**: Laut IT-Notiz sagte das ein Vertreter des Anbieters mündlich, "Nothing in writing.". Die Herstellerseite sagt das Gegenteil. Diese Aussage darf nicht in die Antwort.
3. **Die eigene Richtlinie v3 wird nicht eingehalten:** "Administrator access is reviewed every quarter" (es gibt ein Review, nur Servicepult); "Backups are restore-tested twice a year" (2026 keiner); "All staff complete data protection training every year" (kein Datenschutznachweis). Wer v3 oder v4 einreicht, legt das offen.
4. **Herstellerseite**: Die Datei selbst sagt "Vendor pages change. Read the page again before you rely on this." Vor der Abgabe neu abrufen und mit Datum ausdrucken.

## Schritt 4: Anfragen zum Schließen der Lücken
Interner Termin für alle: **Freitag, 20. November 2026** (fünf Tage Puffer vor der Abgabe am 25.11.).

**An die IT-Leitung: R2, R4, R7**
> Tannwald verlangt (R2) "contract date, last review, and the legal basis for any transfer outside the EU/EEA", (R4) die letzte Admin-Prüfung "on every system in R1: leavers removed, multi-factor login on", (R7) "A restore test of your backups from the last 12 months, with its result".
> Vorhanden: Im Register der Unterauftragsverarbeiter sind bei Anthropic "last_review" und "transfer_basis" leer. Das Admin-Review vom 14.08. deckt nur Servicepult ab. Laut Backup-Bericht gab es 2026 keinen Restore-Test.
> Gebraucht: die Rechtsgrundlage für die Übermittlung in die USA und eine dokumentierte Prüfung von Anthropic; Admin-Reviews für Sprechband, Nordlager und Claude Team; ein Restore-Test-Protokoll mit Ergebnis.
> Wenn es etwas davon nicht gibt, ist "gibt es nicht" eine gute Antwort. Dann tragen wir es so ein.

**An die IT-Leitung und die Teamleitung Tannwald-Desk: R3**
> Tannwald verlangt "The AI tools your staff used with our data in the last 12 months: tool, data, storage country, and your approved rule".
> Vorhanden ist nur eine ungeprüfte Notiz: Bis September nutzten einige Beschäftigte private Chatbots auf dem Handy. Tool, Daten, Personen und Zeitraum stehen nirgends.
> Gebraucht: eine Aufstellung (Beschäftigte per ID, Tool, Art der Daten, von/bis). "Wissen wir nicht" ist eine gute Antwort.

**An die HR-Leitung: R5**
> Tannwald verlangt "Training records for data protection and AI use, last 12 months, with the share of staff trained" und mindestens 95 %.
> Vorhanden: Export vom 02.11. mit einem Kurs ("Claude Team intro: data rules"), 25 von 120 Personen = 20,8 %. Eine Datenschutzschulung kommt im Export nicht vor.
> Gebraucht: Datenschutz-Schulungsnachweise seit dem 10.12.2025, falls es sie gibt. "Gibt es nicht" ist eine gute Antwort.

**An die Geschäftsführung: R8, R6, Klausel 7**
> Tannwald verlangt "Your information security policy, approved or reviewed in the last 12 months".
> Vorhanden: v3 freigegeben am 12.03.2024 (Prüftermin März 2025 verpasst), v4 ist ein Entwurf mit "Approved by: (open)".
> Gebraucht: die Freigabe von v4 mit Datum. Dazu zwei Entscheidungen: Gilt die private Chatbot-Nutzung als Vorfall, der Tannwald zu melden ist (R6)? Und wie gehen wir mit Klausel 7 um (US-Speicherung, keine schriftliche Mitteilung gefunden)?

## Abgabepaket (Stand heute)
Können eingereicht werden: system-list_2026-09.csv (R1), incident-log_2026.csv (R6), access-review_2026-08-14.csv (R4, Teilnachweis), subprocessors_2026-09.csv (R2, mit offenen Feldern), ai-use-rule_v1.md und die neu abgerufene Herstellerseite (R3, Teilnachweis), training-records_2026.csv (R5, zeigt 20,8 %).
Nicht einreichen: it-notes_2026-10-06.md (private, ungeprüfte Notiz). Den Inhalt aber klären, siehe oben.
