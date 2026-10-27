# Lieferantenaudit Tannwald 2026: Nachweise R1 bis R8 (intern)

Stand: 9. November 2026. Abgabe an Tannwald: **Mi 25.11.2026**. Remote-Audit: Do 10.12.2026.
Grundlage: request_tannwald.md und die elf Dateien im Ordner. Nur intern, nicht an Tannwald senden.

Prüfmaßstab von Tannwald (aus der Anforderung):
- aktuell = datiert am oder nach **10.12.2025** (bei Policies zählt die letzte Freigabe oder Prüfung)
- jedes Dokument nennt, wer es freigegeben hat (bei Register, Log oder Record: Owner)
- ein Nachweis, dass etwas gemacht wurde, keine Beschreibung
- Schulungen müssen ≥ 95 % der Mitarbeitenden erreichen (120 → mindestens 114 Personen)
- Vorfälle müssen innerhalb von 48 h nach Erkennung gemeldet sein

## Übersicht

| # | Dokument | Aktuell | Freigabe/Owner | Inhalt erfüllt | Status |
|---|---|---|---|---|---|
| R1 | system-list_2026-09.csv | ja (02.09.2026) | ja | E-Mail fehlt; Claude in den USA | 🟡 nachbessern |
| R2 | subprocessors_2026-09.csv | ja (05.09.2026) | Owner ja | Anthropic: keine Prüfung, keine Transfergrundlage | 🔴 Lücke |
| R3 | ai-use-rule_v1.md, system-list, vendor-page | ja (01.10.2026) | ja | Gratis-Chatbot (bis Sept.) nirgends dokumentiert | 🔴 Entscheidung GF |
| R4 | access-review_2026-08-14.csv | ja | ja | nur Servicepult, 3 von 4 Systemen fehlen | 🔴 Lücke |
| R5 | training-records_2026.csv | ja | Owner ja | 25 von 120 = 20,8 %; keine Datenschutzschulung | 🔴 Lücke |
| R6 | incident-log_2026.csv | ja | Owner ja | INC-02 in 30,5 h gemeldet | 🟢 bereit (siehe Hinweis) |
| R7 | backup-report_2026-10.txt | ja | Owner ja | Restore-Test 2026 nicht durchgeführt | 🔴 Lücke |
| R8 | infosec-policy_v3_FINAL.md / v4_DRAFT | **nein** (v3: 12.03.2024) | v4 nicht freigegeben | v4 nur Entwurf | 🔴 Lücke |

Nur R6 kann so wie es ist raus. Alles andere braucht entweder eine Nacharbeit vor dem 25.11. oder eine Entscheidung der Geschäftsführung.

---

## Klausel 7 des Servicevertrags (betrifft R1, R2, R3)

> "AI tools are used with Customer Data only after written notice to the Customer. Customer Data is stored in the EU or EEA unless the Customer agrees in writing."

- **Schriftliche Mitteilung zu Claude:** Goran hat keine gefunden (it-notes_2026-10-06.md). Claude Team wird seit 01.09.2026 mit Tannwald-Anfragen genutzt.
- **Speicherort:** Laut eigener Systemliste, eigener KI-Regel und Anbieterseite werden die Daten in den USA gespeichert. Eine schriftliche Zustimmung von Tannwald gibt es im Ordner nicht.
- **Gratis-Chatbot:** Bis September haben Mitarbeitende am Tannwald-Desk einen kostenlosen Chatbot auf dem Handy genutzt (it-notes). Auch dazu gab es keine Mitteilung, und der Speicherort ist unbekannt.
- Die Aussage "data stays in Europe" eines Vertriebsmitarbeiters ist nicht schriftlich belegt. Die Anbieterseite widerspricht ihr ("Note that data is stored in the US."). **Nicht verwenden.**

Sobald R1 und R3 eingereicht sind, sieht Tannwald den Verstoß gegen Klausel 7 in unseren eigenen Dokumenten. Das lässt sich nicht vermeiden, ohne falsche oder unvollständige Angaben zu machen. Empfehlung: Dragan informiert Tannwald **vor** der Einreichung selbst und schriftlich über die Claude-Nutzung (Mitteilung nach Klausel 7) und bittet um schriftliche Zustimmung zur US-Speicherung oder kündigt eine Alternative an. Wenn wir das selbst offenlegen, steht unsere Position besser da, als wenn Tannwald es im Audit findet.

---

## R1: Systeme mit Tannwald-Daten und Speicherland (DPA 4.1)

**Einreichen:** system-list_2026-09.csv (Owner Goran Petrovski, freigegeben 02.09.2026 von Dragan Ilievski).

**Inhalt:** Servicepult, Sprechband und Nordlager liegen in Deutschland (Frankfurt), Claude Team in den USA.

**Lücken:**
1. **E-Mail fehlt.** INC-02 zeigt, dass Tannwald-Kundendaten (Serviceliste mit 14 Kunden) per E-Mail verschickt werden. Das Mailsystem verarbeitet also Tannwald-Daten und gehört mit Speicherland in die Liste. Fehlt es, findet Tannwald den Widerspruch zum eigenen Vorfallslog.
2. Prüfen, ob weitere Systeme fehlen, z. B. die Telefonanlage oder Diensthandys mit Kundendaten.
3. Die Angabe zu Claude stützt sich auf eine Anbieterseite vom 15.06.2026. Goran soll die Seite neu aufrufen und mit aktuellem Datum ausdrucken, wie es im Ausdruck selbst steht ("Vendor pages change").

**Maßnahme:** Goran ergänzt die Liste, Dragan gibt die neue Version frei (neues Datum). **Bis 18.11.**

## R2: Unterauftragsverarbeiter (DPA 4.3)

**Einreichen:** subprocessors_2026-09.csv (Owner Goran, Stand 05.09.2026).

**In Ordnung:** Servicepult, Sprechband und Nordlager haben ein Vertragsdatum, eine Prüfung im Jahr 2026 und brauchen keinen Transfer (EU).

**Lücken:**
1. **Anthropic:** Die Felder `last_review` und `transfer_basis` sind leer. Die Datenübermittlung in die USA braucht eine dokumentierte Rechtsgrundlage (z. B. Standardvertragsklauseln im Auftragsverarbeitungsvertrag des Anbieters). Im Ordner gibt es dazu kein Dokument. Goran muss den akzeptierten Vertrag mit dem Auftragsverarbeitungsvertrag von Anthropic heraussuchen und ablegen, die tatsächliche Grundlage eintragen und eine Prüfung mit Datum dokumentieren. **Nicht ungeprüft eintragen.**
2. Der E-Mail-Anbieter fehlt, falls die E-Mail extern gehostet wird (siehe R1).
3. Neue Unterauftragsverarbeiter brauchen nach DPA 4.3 meist eine vorherige Information oder Zustimmung von Tannwald. Das ist beim DPA nachzulesen. Für Anthropic gibt es keine solche Information (siehe Klausel 7).

**Maßnahme:** Goran, **bis 18.11.**, danach neu datierte Version.

## R3: KI-Tools der letzten 12 Monate (DPA 4.4)

**Vorhandene Nachweise:**
- ai-use-rule_v1.md: freigegeben 01.10.2026 von Dragan, Owner Goran. Das ist die genehmigte Regel.
- system-list_2026-09.csv: Claude Team, "request text pasted by agents", USA
- vendor-page_claude_2026-06-15.md: Speicherland USA (neu ausdrucken, siehe R1)

**Lücken:**
1. **Gratis-Chatbot auf Privathandys (bis September 2026).** Das steht nur in Gorans eigenen, ungeprüften Notizen. Welches Tool es war, welche Daten eingegeben wurden, wo sie gespeichert sind und wie viele Mitarbeitende es betraf, ist nicht dokumentiert. Tannwald fragt ausdrücklich nach allen KI-Tools, die in den letzten 12 Monaten mit ihren Daten genutzt wurden. **Wenn wir nur Claude angeben, ist die Antwort unvollständig, obwohl wir es besser wissen.** Davon rate ich klar ab.
2. Claude wurde ab 01.09.2026 genutzt, die Regel gilt aber erst seit 01.10.2026. Einen Monat lang gab es keine genehmigte Regel.
3. Es gibt keine schriftliche Mitteilung an Tannwald (Klausel 7).

**Entscheidungen für Dragan (mit Datenschutz-/Rechtsberatung):**
- Den Chatbot-Vorfall aufklären und dokumentieren: welches Tool, welche Agents, welcher Zeitraum, welche Daten (mit Namen, Adressen, Telefonnummern?). Dann als Vorfall bewerten. Wenn personenbezogene Tannwald-Daten an einen Drittanbieter ohne Vertrag gingen, ist das wahrscheinlich ein meldepflichtiger Vorfall nach DPA 6.2. Die 48-Stunden-Frist läuft ab Erkennung. Spätestens seit der Notiz vom 06.10.2026 ist der Vorfall bekannt, die Frist wäre also bereits überschritten. Das spricht für eine sofortige Meldung und nicht für Abwarten bis zum Audit.
- Danach ein R3-Register erstellen (Tool, Zeitraum, Daten, Speicherland, Regel). Owner ist Goran, Dragan gibt frei. Es enthält beide Tools.

## R4: Prüfung der Admin-Konten (DPA 5.2)

**Einreichen:** access-review_2026-08-14.csv (durchgeführt von Goran, freigegeben 17.08.2026 von Dragan). Das ist ein guter Nachweis: Ausgeschiedene Person (adm-03) wurde entfernt, fehlendes MFA (adm-04) wurde aktiviert.

**Lücke:** Die Prüfung deckt nur Servicepult ab. Für **Sprechband, Nordlager und Claude Team** (und die E-Mail, siehe R1) gibt es keinen Nachweis. Gorans Notiz "Admin access is checked every quarter" ist eine Beschreibung und kein Nachweis. Ältere Quartalsprüfungen liegen nicht im Ordner.

**Maßnahme:** Die nächste Quartalsprüfung ist ohnehin um den 14.11. fällig. Goran prüft dann **alle** Systeme aus R1 im selben Format (Konto, Status, Rolle, MFA, Entscheidung), Dragan gibt frei. **Bis 20.11.** Bei Claude Team auch prüfen, ob alle 25 Seats noch aktiven Mitarbeitenden gehören.

## R5: Schulungsnachweise Datenschutz und KI (DPA 5.4)

**Vorhanden:** training-records_2026.csv (HR-Export vom 02.11.2026, Marija Trajkovska).

**Auswertung:**
- 26 Zeilen, aber nur **25 Personen**, weil E014 doppelt vorkommt (03.09. und 10.09.)
- 25 von 120 = **20,8 %** (Ziel: 95 % = 114 Personen, es fehlen 89)
- Es gibt **nur einen Kurs** ("Claude Team intro: data rules"). **Keine Datenschutzschulung** in den letzten 12 Monaten, obwohl Policy-Regel 4 sie jährlich für alle verlangt.
- Die Schulungen (03.09./10.09.) fanden vor der KI-Regel (01.10.) statt, deshalb hat niemand nachweislich die genehmigte Regel geschult bekommen. Die Regel gilt für alle Mitarbeitenden (Verbot von Gratis-Chatbots), nicht nur für die 25 Claude-Nutzer.

**Maßnahme:** Datenschutz- und KI-Regel-Schulung für alle 120 Mitarbeitenden, idealerweise als kurzes E-Learning mit Bestätigung. Danach neuer HR-Export. Verantwortlich Marija mit Goran, **bis 23.11.** Wenn 95 % bis dahin nicht erreicht sind, die tatsächliche Quote angeben und einen Termin für den Rest nennen. Keine geschönte Zahl angeben.

## R6: Vorfälle mit Tannwald-Daten 2026 (DPA 6.2)

**Einreichen:** incident-log_2026.csv (Owner Goran, letzter Eintrag 12.10.2026).

**INC-02:** Erkannt am 07.05.2026 um 09:40, Tannwald informiert am 08.05.2026 um 16:10. Das sind **30 h 30 min**, also innerhalb von 48 h. ✔ Ursache und Maßnahme sind dokumentiert. INC-01 und INC-03 betreffen keine Kundendaten. Das komplette Log zeigt, dass nichts weggelassen wurde.

**Hinweis:** Wenn der Gratis-Chatbot als Vorfall bewertet wird (siehe R3), muss er vor der Einreichung ins Log, mit dem tatsächlichen Meldedatum. Ein Log ohne diesen Eintrag würde nicht zu einer ehrlichen R3-Antwort passen.

## R7: Restore-Test der Backups (DPA 5.6)

**Vorhanden:** backup-report_2026-10.txt. Er zeigt 31 von 31 Jobs im Oktober erfolgreich, aber: **"Restore test: not done in 2026."** Policy-Regel 3 verlangt zwei Tests pro Jahr. Gorans Notiz "Backups are tested" ist durch den Report widerlegt.

**Lücke:** Für die letzten 12 Monate gibt es keinen Restore-Test. Bei Goran nachfragen, ob es einen dokumentierten Test zwischen 10.11. und 31.12.2025 gibt. Laut Tannwalds Maßstab würde ohnehin nur einer ab 10.12.2025 zählen.

**Maßnahme:** Den für Q4 geplanten Test **jetzt** durchführen und protokollieren: Datum, wiederhergestellte Daten (z. B. Servicepult-Export und Teil der Dateiablage), Dauer, Ergebnis, Abweichungen, Durchführende Person, Freigabe durch Dragan. **Bis 20.11.** Den Backup-Report trotzdem mitschicken, weil er den laufenden Backupbetrieb belegt.

## R8: Informationssicherheitsrichtlinie (DPA 5.1)

**Status:** v3 FINAL wurde am 12.03.2024 freigegeben, die Prüfung war für März 2025 fällig und ist **seit 20 Monaten überfällig**. Nach Tannwalds Maßstab ist sie nicht aktuell. v4 ist ein Entwurf vom 18.09.2026 ohne Freigabe.

**Maßnahme:** Dragan prüft und genehmigt v4. **Bis 18.11.** Vorher:
- v4 als vollständigen Text schreiben, nicht als Verweis "Rules 1 to 5 as in version 3"
- Kopfzeile mit Freigabe (Name, Funktion, Datum), Version und nächster Prüfung (z. B. 11/2027)
- Hinweis: Tannwald wird die Regeln mit R4 (quartalsweise Prüfung), R5 (jährliche Schulung) und R7 (zwei Restore-Tests pro Jahr) abgleichen. Diese Regeln sind derzeit nicht eingehalten. Die Nachweise aus den Maßnahmen oben schließen diese Lücken.

---

## Maßnahmenplan bis zur Abgabe

| Bis | Wer | Was | für |
|---|---|---|---|
| sofort | Dragan + Datenschutz/Recht | Gratis-Chatbot aufklären, als Vorfall bewerten, ggf. an Tannwald melden | R3, R6 |
| sofort | Dragan | Schriftliche Mitteilung zu Claude nach Klausel 7; Zustimmung zur US-Speicherung anfragen oder Alternative klären | R1–R3 |
| 18.11. | Goran / Dragan | Systemliste ergänzen (E-Mail u. a.), neu freigeben; Anbieterseite neu ausdrucken | R1 |
| 18.11. | Goran | Anthropic-Vertrag/AVV ablegen, Transfergrundlage und Prüfung eintragen | R2 |
| 18.11. | Goran / Dragan | KI-Tool-Register (Claude + Gratis-Chatbot) erstellen, freigeben | R3 |
| 18.11. | Dragan | Policy v4 fertigstellen und freigeben | R8 |
| 20.11. | Goran / Dragan | Admin-Prüfung für alle Systeme, freigeben | R4 |
| 20.11. | Goran / Dragan | Restore-Test durchführen und protokollieren | R7 |
| 23.11. | Marija / Goran | Datenschutz- und KI-Schulung für alle, neuer HR-Export | R5 |
| 24.11. | Goran | Paket final prüfen (Daten, Freigaben, Widersprüche) | alle |
| 25.11. | Dragan | Einreichung an Lena Keller | alle |

## Was nicht ins Paket gehört

- **it-notes_2026-10-06.md:** private, ungeprüfte Notizen und kein Nachweis. Die Inhalte (Chatbot, fehlende Mitteilung) sind trotzdem zu klären, siehe oben.
- **infosec-policy_v3_FINAL.md** als R8-Nachweis, weil sie nicht aktuell ist. Höchstens zusammen mit der freigegebenen v4 als Vorgängerversion.
- Die mündliche Aussage "data stays in Europe".
