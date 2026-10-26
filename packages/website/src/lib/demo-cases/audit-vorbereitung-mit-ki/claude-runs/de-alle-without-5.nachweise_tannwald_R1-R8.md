# Nachweispaket Tannwald-Audit 2026: Stand R1 bis R8
Interner Arbeitsstand, nicht zum Versand. Erstellt am 9. November 2026.
Abgabe an Tannwald: Mittwoch, 25. November 2026. Remote-Audit: Donnerstag, 10. Dezember 2026.
Stichtag für „aktuell“: Dokument datiert am oder nach dem 10. Dezember 2025.

## Übersicht

| # | Dokument aus dem Ordner | Status | Kurzbegründung |
|---|---|---|---|
| R1 | system-list_2026-09.csv | Versandfähig, Inhalt heikel | Aktuell und freigegeben. Claude Team speichert in den USA, eine schriftliche Zustimmung nach Klausel 7 fehlt. Der kostenlose Chatbot fehlt in der Liste. |
| R2 | subprocessors_2026-09.csv | Lücke | Für Anthropic fehlen die letzte Prüfung und die Rechtsgrundlage für die Übermittlung in die USA. |
| R3 | ai-use-rule_v1.md, vendor-page_claude_2026-06-15.md | Kritisch, Entscheidung der Geschäftsführung nötig | Es gibt keine vollständige Liste der KI-Tools. Der kostenlose Chatbot fehlt, keine schriftliche Mitteilung an Tannwald, Claude wurde einen Monat vor der Regel eingeführt. |
| R4 | access-review_2026-08-14.csv | Lücke | Geprüft wurde nur Servicepult. Für 3 der 4 Systeme aus R1 gibt es keine Prüfung. |
| R5 | training-records_2026.csv | Lücke | 25 von 120 Mitarbeitenden (20,8 %), Mindestwert 95 %. Kein Datenschutzkurs nachgewiesen. |
| R6 | incident-log_2026.csv | Versandfähig, mit Vorbehalt | INC-02 wurde in 30 h 30 min gemeldet, das liegt innerhalb der 48 h. Die Chatbot-Nutzung ist noch nicht als Vorfall bewertet. |
| R7 | backup-report_2026-10.txt | Kein Nachweis | Ein Wiederherstellungstest wurde 2026 nicht durchgeführt. |
| R8 | infosec-policy_v3_FINAL.md, infosec-policy_v4_DRAFT.md | Kein gültiger Nachweis | v3 ist vom 12.03.2024 (Prüfung seit März 2025 überfällig). v4 ist nicht freigegeben. |

Versandfähig ist derzeit nur R6 ohne Einschränkung beim Format. R1 ist formal in Ordnung, legt aber den Verstoß gegen Klausel 7 offen. R2, R4, R5, R7 und R8 lassen sich bis zum 25.11. schließen, wenn die unten genannten Aufgaben erledigt werden. R3 ist ein Vertragsthema und muss von der Geschäftsführung entschieden werden.

---

## R1: Systeme mit Tannwald-Daten (DPA 4.1)
**Dokument:** system-list_2026-09.csv. Verantwortlich ist Goran Petrovski, freigegeben am 02.09.2026 von Dragan Ilievski. Das Dokument ist aktuell.

| System | Speicherort |
|---|---|
| Servicepult | Deutschland (Frankfurt) |
| Sprechband | Deutschland (Frankfurt) |
| Nordlager file share | Deutschland (Frankfurt) |
| Claude Team (seit 01.09.2026) | USA |

**Befunde**
- Claude Team speichert in den USA. Nach Klausel 7 ist das nur mit schriftlicher Zustimmung von Tannwald zulässig. Eine solche Zustimmung liegt nicht vor (siehe it-notes: „I found nothing“). Die Aussage eines Vertriebsmitarbeiters, die Daten blieben in Europa, ist nicht schriftlich festgehalten. Sie widerspricht außerdem der Herstellerseite und ist deshalb nicht verwendbar.
- Bis September 2026 haben Agents am Tannwald-Desk einen kostenlosen Chatbot auf ihren Handys genutzt (it-notes). Wenn dabei Tannwald-Daten eingegeben wurden, gehört dieses Tool für die Monate der Nutzung in die Liste.
- Zu prüfen: Über welches E-Mail-System liefen die Daten bei INC-02 (Serviceliste per E-Mail)? Wenn Tannwald-Daten regelmäßig per E-Mail verschickt werden, fehlt dieses System in der Liste.

**Aufgabe:** Die Liste ergänzen oder bestätigen und von Dragan Ilievski neu freigeben lassen.

## R2: Unterauftragsverarbeiter (DPA 4.3)
**Dokument:** subprocessors_2026-09.csv. Verantwortlich ist Goran Petrovski, Stand 05.09.2026. Für ein Register genügt die Angabe der verantwortlichen Person.

| Anbieter | Vertrag | Letzte Prüfung | Übermittlungsgrundlage |
|---|---|---|---|
| Servicepult GmbH | 01.02.2024 | 20.01.2026 | nicht nötig (EU) |
| Sprechband GmbH | 12.05.2025 | 12.05.2026 | nicht nötig (EU) |
| Nordlager GmbH | 15.11.2023 | 03.02.2026 | nicht nötig (EU) |
| Anthropic (Claude Team) | online akzeptiert am 01.09.2026 | **leer** | **leer** (USA) |

**Befunde**
- Für Anthropic fehlen die Prüfung und die Rechtsgrundlage für die Übermittlung in ein Drittland. Ein Drittlandtransfer ohne dokumentierte Grundlage ist der schwerste Befund in R2.
- Die akzeptierten Bedingungen sind nicht abgelegt: Auftragsverarbeitungsvertrag, Standardvertragsklauseln bzw. EU-US Data Privacy Framework.
- Zu klären: Wurde Tannwald 2025 über Sprechband als neuen Unterauftragsverarbeiter informiert, wie es DPA 4.3 verlangt? Im Ordner gibt es dazu keinen Nachweis.

**Aufgabe (IT-Lead und Datenschutz/Recht):** Die Anthropic-Vertragsunterlagen (DPA, Transfermechanismus) herunterladen und ablegen. Die Prüfung dokumentieren und die beiden leeren Felder ausfüllen.

## R3: KI-Tools der letzten 12 Monate (DPA 4.4)
**Vorhandene Dokumente:** ai-use-rule_v1.md (freigegeben am 01.10.2026 von Dragan Ilievski, aktuell) und der Ausdruck der Herstellerseite vom 06.10.2026.

| Tool | Zeitraum | Daten | Speicherort | Freigegebene Regel |
|---|---|---|---|---|
| Claude Team (25 Plätze) | seit 01.09.2026 | Anfragetexte, laut Regel pseudonymisiert | USA | AI use rule v1, **erst ab 01.10.2026** |
| Kostenloser Chatbot (Name unbekannt) | bis September 2026, Beginn unbekannt | Tannwald-Anfragen, Umfang unbekannt | unbekannt | **keine** |

**Befunde. Diese Punkte entscheide ich nicht selbst:**
1. **Klausel 7 („nur nach schriftlicher Mitteilung“):** Es gibt keine Mitteilung an Tannwald, weder für Claude noch für den Chatbot. Die KI-Nutzung mit Tannwald-Daten verstößt damit seit mindestens 01.09.2026 gegen den Vertrag.
2. **Claude ohne Regel:** Claude wurde vom 01.09. bis 30.09.2026 ohne freigegebene Regel genutzt.
3. **Kostenloser Chatbot:** Tannwald-Daten wurden möglicherweise in private Konten bei einem unbekannten Anbieter mit unbekanntem Speicherort eingegeben. Das ist voraussichtlich als Datenschutzvorfall zu bewerten (siehe R6). Die einzige Quelle dafür sind private Notizen von Goran, die niemand geprüft hat. Die Fakten müssen erst ermittelt werden: Wer hat welches Tool seit wann mit welchen Daten genutzt?
4. Eine R3-Antwort, die nur Claude nennt, wäre nach unserem Kenntnisstand unvollständig und damit irreführend. Das empfehle ich ausdrücklich nicht.

**Aufgabe (Geschäftsführung, vor dem 25.11.):** Den Sachverhalt zum Chatbot klären und rechtlich bewerten lassen (DPA 6.2, Meldefrist). Dann proaktiv auf Tannwald zugehen und die Claude-Nutzung offenlegen. Für die Zukunft eine schriftliche Zustimmung nach Klausel 7 einholen oder bis dahin die Nutzung von Claude mit Tannwald-Daten aussetzen.

**Hinweis Herstellerseite:** Der Ausdruck gibt den Stand vom 15.06.2026 wieder („data is stored in the US“). Ich konnte die Seite nicht neu abrufen, weil der Netzwerkzugriff in meiner Umgebung gesperrt war. Bitte die Seite vor dem Versand neu prüfen und neu ausdrucken.

## R4: Prüfung der Administratorkonten (DPA 5.2)
**Dokument:** access-review_2026-08-14.csv. Durchgeführt von Goran Petrovski, freigegeben am 17.08.2026 von Dragan Ilievski. Das Dokument ist aktuell, gilt aber **nur für Servicepult**.

- Servicepult: Der ausgeschiedene Mitarbeiter (adm-03, ausgetreten am 31.07.) wurde erst am 14.08. entfernt, also 14 Tage später. Bei adm-04 war MFA bis zur Prüfung ausgeschaltet. Beides ist jetzt behoben und dokumentiert.
- **Keine Prüfung für Sprechband, Nordlager und Claude Team.** Claude Team gab es zum Zeitpunkt der Prüfung noch nicht.
- Die Policy verlangt eine Prüfung pro Quartal. Die it-notes behaupten, das geschehe, aber ein Nachweis liegt nur für einen Termin vor.

**Aufgabe (IT-Lead, bis ca. 20.11.):** Für alle 4 Systeme eine Prüfung im selben Format durchführen (Konto, Personenstatus, Rolle, MFA, Entscheidung) und von Dragan Ilievski freigeben lassen.

## R5: Schulungen Datenschutz und KI (DPA 5.4)
**Dokument:** training-records_2026.csv. HR-Export vom 02.11.2026 durch Marija Trajkovska. Stand: 120 Mitarbeitende.

- 26 Einträge mit 25 verschiedenen Personen (E014 steht doppelt drin, am 03.09. und am 10.09.).
- Quote: **25 / 120 = 20,8 %**. Gefordert sind 95 %, also mindestens 114 Personen.
- Der einzige Kurs ist „Claude Team intro: data rules“. Er deckt nur die 25 Claude-Nutzer ab. Eine **Datenschutzschulung ist nicht nachgewiesen**, obwohl Policy v3 Regel 4 eine jährliche Schulung vorschreibt.

**Aufgabe:**
1. HR soll prüfen, ob es Datenschutzschulungen ab dem 10.11.2025 gibt, die im Export fehlen. Der Export heißt „2026“, Einträge aus Nov./Dez. 2025 könnten fehlen.
2. Falls nicht: Eine Datenschutz- und KI-Schulung für alle Mitarbeitenden vor dem Audit durchführen und neu exportieren. Bis zum 25.11. sind 95 % kaum erreichbar. Wir sollten realistisch den Stand plus Termin für den Abschluss vor dem 10.12. angeben.

## R6: Vorfälle mit Tannwald-Daten 2026 (DPA 6.2)
**Dokument:** incident-log_2026.csv. Verantwortlich ist Goran Petrovski, letzter Eintrag am 12.10.2026. Das Dokument ist aktuell.

| ID | Erkannt | Tannwald informiert | Dauer | Ursache | Maßnahme | Geschlossen |
|---|---|---|---|---|---|---|
| INC-02 | 07.05.2026 09:40 | 08.05.2026 16:10 | 30 h 30 min (unter 48 h) | Autovervollständigung hat die falsche externe Adresse gewählt (14 Tannwald-Kunden) | Autovervollständigung für externe Mails abgeschaltet, Empfänger hat die Löschung am 07.05. bestätigt | 11.05.2026 |

INC-01 und INC-03 betreffen keine Tannwald-Daten. Zum Versand empfehle ich einen Auszug mit nur INC-02 und dem Hinweis „keine weiteren Vorfälle mit Tannwald-Daten im Log“. Wenn der Auszug verwendet wird, sollte er vom Verantwortlichen bestätigt werden.

**Vorbehalt:** Die Nutzung des kostenlosen Chatbots (siehe R3) steht nicht im Log. Wenn die Bewertung ergibt, dass Tannwald-Daten betroffen sind, handelt es sich um einen Vorfall, der erfasst und gemeldet werden muss. Die Kenntnis besteht spätestens seit dem 06.10.2026 (it-notes), die 48-h-Frist wäre damit bereits überschritten. Das ist ein weiterer Grund, die Sache unverzüglich mit der Geschäftsführung zu klären.

## R7: Wiederherstellungstest (DPA 5.6)
**Dokument:** backup-report_2026-10.txt. Systembericht vom 01.11.2026, verantwortlich ist Goran Petrovski.
- Der Bericht belegt, dass die Backups laufen: 31 von 31 Jobs im Oktober.
- Er belegt **keinen Wiederherstellungstest**: „Restore test: not done in 2026“. Auch für Nov./Dez. 2025 liegt kein Nachweis vor. Die Policy verlangt zwei Tests pro Jahr. Die Aussage in den it-notes („Backups are tested“) ist durch den Bericht widerlegt.

**Aufgabe (IT-Lead, bis ca. 20.11.):** Einen Wiederherstellungstest durchführen, zum Beispiel für den Servicepult-Export und eine Stichprobe aus dem File-Share. Das Protokoll muss Datum, Umfang, Dauer, Ergebnis, Prüfer und Freigabe enthalten. Der Test ist ohnehin für Q4 geplant.

## R8: Informationssicherheitsrichtlinie (DPA 5.1)
- v3 FINAL: freigegeben am 12.03.2024, Prüfung fällig im März 2025. Sie ist **nicht aktuell** und lag schon vor dem Stichtag 10.12.2025 außerhalb der Prüffrist.
- v4 DRAFT: zuletzt bearbeitet am 18.09.2026, **nicht freigegeben**. Ein Entwurf ist kein Nachweis.

**Aufgabe (IT-Lead und Geschäftsführung):** v4 als eigenständiges Dokument ausformulieren. „Rules 1 to 5 as in version 3“ reicht nicht, die Regeln müssen im Text stehen. Danach von Dragan Ilievski mit Datum freigeben lassen. Achtung: Die Auditoren werden die Richtlinie mit R4, R5 und R7 vergleichen. Sie schreibt quartalsweise Prüfungen, zwei Wiederherstellungstests pro Jahr und jährliche Schulungen für alle vor. Entweder setzen wir das bis zum Audit um, oder die Regeln müssen realistisch angepasst werden.

---

## Nicht versenden
- **it-notes_2026-10-06.md**: private, ungeprüfte Notizen und kein Nachweis. Die darin genannten Fakten (Chatbot, fehlende Mitteilung nach Klausel 7) müssen aber geklärt und ehrlich behandelt werden. Sie dürfen nicht unter den Tisch fallen.
- **infosec-policy_v4_DRAFT.md**: nicht versenden, solange es nicht freigegeben ist.

## Aufgabenliste bis 25.11.2026
| Aufgabe | Wer | Für |
|---|---|---|
| Chatbot-Sachverhalt klären, Vorfallbewertung, Vorgehen gegenüber Tannwald (Klausel 7) festlegen | Dragan Ilievski, Datenschutz/Recht | R3, R6, R1 |
| Anthropic-DPA und Transfergrundlage ablegen, Register vervollständigen | Goran Petrovski | R2 |
| Herstellerseite neu abrufen und neu ausdrucken | Goran Petrovski | R1, R3 |
| Admin-Prüfung für alle 4 Systeme, Freigabe | Goran Petrovski, Dragan Ilievski | R4 |
| Schulungen nachprüfen bzw. durchführen, neuer HR-Export | Marija Trajkovska | R5 |
| Wiederherstellungstest durchführen und protokollieren | Goran Petrovski | R7 |
| Policy v4 fertigstellen und freigeben | Goran Petrovski, Dragan Ilievski | R8 |
| Systemliste ergänzen (Chatbot, ggf. E-Mail) und neu freigeben | Goran Petrovski, Dragan Ilievski | R1 |
