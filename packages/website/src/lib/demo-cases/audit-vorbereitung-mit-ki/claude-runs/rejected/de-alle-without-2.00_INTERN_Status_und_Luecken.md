# Tannwald Lieferantenaudit 2026: Status der Nachweise R1 bis R8
INTERN, nicht an Tannwald senden. Stand: 9. November 2026.
Abgabe bis Mi 25.11.2026, Remote-Audit Do 10.12.2026.
Maßstab von Tannwald: Dokument ab 10.12.2025 datiert, mit Freigabe bzw. Owner, Nachweis statt Beschreibung,
Schulungsquote mindestens 95 %, Meldung von Vorfällen innerhalb von 48 h.

Nicht als Nachweis verwendbar: `it-notes_2026-10-06.md` (persönliche Notiz, von niemandem geprüft) und
`infosec-policy_v3_FINAL.md` (Review seit März 2025 überfällig). Beide liegen nicht im Paket.

## Übersicht

| # | Nachweis im Ordner | Status |
|---|---|---|
| R1 | system-list_2026-09.csv (freigegeben 02.09.2026) | Vorhanden, aber Claude Team speichert in den USA ohne schriftliche Zustimmung (Klausel 7). Free-Chatbot fehlt |
| R2 | subprocessors_2026-09.csv (Owner IT-Leitung, 05.09.2026) | Lücke: Anthropic ohne letzten Review und ohne Transfergrundlage |
| R3 | ai-use-rule_v1.md, vendor-page_claude_2026-06-15.md | Kritisch: Mitteilung nach Klausel 7 fehlt, Free-Chatbot nicht dokumentiert |
| R4 | access-review_2026-08-14.csv | Lücke: nur Servicepult, 3 von 4 Systemen fehlen |
| R5 | training-records_2026.csv | Kritisch: 25 von 120 = 20,8 %, kein Datenschutzkurs |
| R6 | incident-log_2026_extract-Tannwald.csv | INC-02 in Ordnung. Offen: Free-Chatbot als Vorfall? |
| R7 | backup-report_2026-10.txt | Kein Nachweis: 2026 kein Restore-Test |
| R8 | infosec-policy_v4_DRAFT.md | Kein Nachweis: Entwurf ist nicht freigegeben, v3 veraltet |

## Details

### R1 Systeme (DPA 4.1)
- Die Liste ist aktuell und freigegeben (Dragan Ilievski, 02.09.2026). Sie nennt 4 Systeme. 3 davon speichern in Deutschland, Claude Team speichert in den USA.
- Klausel 7: Für die Speicherung außerhalb von EU/EWR braucht es eine schriftliche Zustimmung von Tannwald. Wir haben keine gefunden.
  Die Aussage „data stays in Europe“ vom Vendor-Vertreter liegt nicht schriftlich vor und gilt deshalb nicht. Laut Vendor-Seite werden die Daten in den USA gespeichert.
- Der Free-Chatbot, den Agents am Tannwald-Desk bis September auf ihren Handys benutzt haben, hat Tannwald-Daten verarbeitet und steht nicht in der Liste.
  Unbekannt sind: welches Tool, seit wann, welcher Anbieter und welches Land.
  → Bitte entscheiden, ob er als „bis 09/2026, eingestellt“ aufgenommen wird. Ich empfehle das, weil R3 ohnehin nach den letzten 12 Monaten fragt.

### R2 Unterauftragsverarbeiter (DPA 4.3)
- Servicepult, Sprechband und Nordlager: Vertrag und Review innerhalb von 12 Monaten liegen vor, sie sitzen in der EU. In Ordnung.
- Bei Anthropic fehlen `last_review` und `transfer_basis`. Als Vertrag steht nur „accepted online 2026-09-01“ da.
  → To-do IT-Leitung: Die akzeptierten Bedingungen (DPA bzw. Commercial Terms) als PDF ablegen, die Transfergrundlage eintragen (z. B. Standardvertragsklauseln, sofern im Vendor-DPA enthalten; bitte prüfen, nicht annehmen) und den Review dokumentieren.
- Weil Tannwald nicht vorab informiert wurde (vgl. R3), gibt es vermutlich auch keine Zustimmung zum Unterauftragsverarbeiter nach DPA 4.3. Das muss die Geschäftsführung bzw. der Datenschutz bewerten.

### R3 KI-Tools (DPA 4.4), wichtigster Punkt
Diese Tools wurden in den letzten 12 Monaten mit Tannwald-Daten genutzt:
1. Claude Team, seit 01.09.2026, mit Anfragetexten (laut Regel pseudonymisiert), Speicherung in den USA.
   Die Regel ai-use-rule_v1 ist aktuell und freigegeben, gilt aber erst ab 01.10.2026. Im September lief die Nutzung ohne freigegebene Regel.
2. Free-Chatbot auf privaten Handys, bis September 2026. Tool, Daten, Land und Zeitraum sind undokumentiert, eine Regel gab es nicht.

Klausel 7 verlangt eine schriftliche Mitteilung vor jeder KI-Nutzung und eine schriftliche Zustimmung zur Speicherung außerhalb der EU/EWR. Nach der IT-Notiz gibt es keines von beidem.
→ Das ist eine Entscheidung der Geschäftsführung, die vor dem Versand fallen muss. Ich empfehle, Tannwald aktiv und schriftlich zu informieren, bevor oder während das Paket rausgeht. Mit R1 und R3 wird es Tannwald ohnehin auffallen.
→ Die Vendor-Seite ist vom 15.06.2026 und wurde am 06.10.2026 ausgedruckt. Ich konnte sie nicht neu abrufen (Netzwerkzugriff verweigert). Vor dem Versand bitte https://privacy.claude.com/en/articles/7996890 erneut lesen und einen neuen, datierten Ausdruck ablegen.

### R4 Admin-Review (DPA 5.2)
- Servicepult ist sauber dokumentiert: Review am 14.08.2026, freigegeben am 17.08.2026. Der Leaver adm-03 wurde entfernt, MFA für adm-04 aktiviert.
  Hinweis: adm-03 ist am 31.07. ausgeschieden und wurde erst am 14.08. entfernt, also 14 Tage später. Tannwald könnte danach fragen.
- Für Sprechband, Nordlager und Claude Team fehlen Reviews.
  → To-do IT-Leitung: Bis spätestens 20.11. einen Review aller 4 Systeme durchführen (Leaver, MFA) und von Dragan freigeben lassen. Das passt auch zum Quartalsrhythmus der Policy, der nächste Termin wäre etwa Mitte November.

### R5 Schulungen (DPA 5.4)
- Der Export liegt vor (HR, 02.11.2026). Er hat 26 Zeilen, E014 steht doppelt drin. Das sind 25 Personen von 120 Mitarbeitenden, also 20,8 %. Gefordert sind mindestens 95 %, das wären 114 Personen.
- Es gibt nur den Kurs „Claude Team intro“ und keinen Datenschutzkurs. Die Policy verlangt einen jährlichen Datenschutzkurs für alle.
- Die Schulungen fanden am 03. und 10.09. statt, also vor der Freigabe der KI-Regel am 01.10.
- → To-do HR und IT: Bis 25.11. Datenschutz- und KI-Schulung für alle ausrollen und einen neuen HR-Export ziehen. Ob 95 % realistisch erreichbar sind, bitte ehrlich einschätzen und sonst den Plan mitschicken.

### R6 Vorfälle (DPA 6.2)
- INC-02: erkannt am 07.05.2026 um 09:40, Tannwald informiert am 08.05.2026 um 16:10. Das sind 30,5 h, also innerhalb der 48 h. Ursache und Maßnahme sind dokumentiert, der Vorfall ist geschlossen. In Ordnung.
- INC-01 und INC-03 betreffen keine Tannwald-Daten und sind deshalb nicht im Auszug.
- Offen: Die Nutzung des Free-Chatbots mit Tannwald-Daten (und eventuell auch Claude ohne Mitteilung) könnte als Datenschutzvorfall gelten. Sie steht nicht im Log und wurde nicht gemeldet.
  → Das müssen Geschäftsführung und Datenschutz bewerten. Wenn es als Vorfall eingestuft wird, ist die 48-h-Frist längst überschritten. Dann sollte es ins Log und sofort an Tannwald gemeldet werden.

### R7 Restore-Test (DPA 5.6)
- Der Backup-Report zeigt nur, dass die Jobs gelaufen sind. Er sagt selbst: „Restore test: not done in 2026“. Die Policy verlangt zwei Tests pro Jahr.
- → To-do IT-Leitung: Den Restore-Test (Servicepult-Export und File-Share) vor dem 25.11. durchführen und ein Protokoll erstellen mit Datum, Umfang, Dauer, Ergebnis und Freigabe.
  Wenn das nicht klappt, muss gegenüber Tannwald klar stehen „kein Test in den letzten 12 Monaten, geplant am …“. Der Backup-Report darf nicht als Restore-Nachweis ausgegeben werden.

### R8 Sicherheitsrichtlinie (DPA 5.1)
- v3 wurde am 12.03.2024 freigegeben, der Review war für März 2025 fällig. Damit ist sie nicht aktuell.
- v4 ist ein Entwurf vom 18.09.2026 ohne Freigabe.
- → To-do: Dragan Ilievski gibt v4 vor dem 25.11. frei (Datum und Name ins Dokument). Erst dann ist sie ein Nachweis.
  Hinweis: v4 übernimmt die Regeln 1 bis 5 aus v3. Diese Regeln (Quartalsreview, 2 Restore-Tests pro Jahr, Schulung für alle) werden aktuell nicht eingehalten, siehe R4, R5 und R7.

## Entscheidungen und Aufgaben vor dem Versand (Vorschlag)
| Was | Wer | Bis |
|---|---|---|
| Umgang mit Klausel 7 (Claude, US-Speicherung, Free-Chatbot), Mitteilung an Tannwald | Dragan Ilievski | sofort |
| Free-Chatbot als Vorfall bewerten, ggf. ins Log und melden | Dragan Ilievski / Datenschutz | sofort |
| v4-Policy freigeben | Dragan Ilievski | 18.11. |
| Admin-Review aller 4 Systeme inkl. Freigabe | Goran Petrovski | 20.11. |
| Restore-Test mit Protokoll | Goran Petrovski | 20.11. |
| Anthropic-Eintrag in R2 vervollständigen, Vendor-Seite neu abrufen | Goran Petrovski | 20.11. |
| Schulung ausrollen, neuer HR-Export | Marija Trajkovska | 24.11. |
| Paket final prüfen und versenden | Dragan Ilievski | 25.11. |
