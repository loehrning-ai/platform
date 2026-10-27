# Nachweisübersicht R1–R8 für Tannwald Haustechnik (Audit 10.12.2026)
Stand: 9. November 2026. Abgabe an Tannwald: bis 25. November 2026. Intern, nicht zum Versand.

Prüfmaßstab aus der Anfrage: Dokument datiert am oder nach 10.12.2025; Freigabe bzw. Eigentümer genannt;
Nachweis der Durchführung statt Beschreibung; Schulungsquote ≥ 95 %; Vorfallmeldung ≤ 48 h.

## Ergebnis auf einen Blick

| # | Nachweis im Ordner | Aktuell / Freigabe | Status |
|---|---|---|---|
| R1 | R1/system-list_2026-09.csv, R1/vendor-page_claude_2026-06-15.md | 02.09.2026, freigegeben D. Ilievski | Teilweise: kostenloser Chatbot fehlt; Claude speichert in den USA ohne schriftliche Zustimmung (Klausel 7) |
| R2 | R2/subprocessors_2026-09.csv | 05.09.2026, Eigentümer G. Petrovski | Lücke: Anthropic ohne Prüfdatum und ohne Rechtsgrundlage für die Übermittlung in die USA |
| R3 | R3/ai-use-rule_v1.md, R3/vendor-page_claude_2026-06-15.md | Regel freigegeben 01.10.2026 | Kritisch: Chatbot-Nutzung undokumentiert; keine schriftliche Mitteilung an Tannwald; September ohne Regel |
| R4 | R4/access-review_2026-08-14.csv | 14.08.2026, freigegeben 17.08.2026 | Lücke: nur Servicepult geprüft, 3 von 4 Systemen fehlen |
| R5 | R5/training-records_2026.csv | Export 02.11.2026, HR (M. Trajkovska) | Nicht erfüllt: 25 von 120 = 20,8 % (Ziel 95 % = 114); keine Datenschutzschulung |
| R6 | R6/incident-log_2026.csv | Eigentümer G. Petrovski, letzter Eintrag 12.10.2026 | INC-02 in Ordnung (30 h 30 min); Chatbot-Vorgang nicht erfasst |
| R7 | – | – | Fehlt: kein Wiederherstellungstest 2026 |
| R8 | – | v3 freigegeben 12.03.2024 (Prüfung fällig 03/2025); v4 nur Entwurf | Fehlt: keine gültige Richtlinie |

Nicht zum Versand: `it-notes_2026-10-06.md` (private, ungeprüfte Notizen), `infosec-policy_v4_DRAFT.md`
(nicht freigegeben), `infosec-policy_v3_FINAL.md` (Prüfung seit März 2025 überfällig),
`backup-report_2026-10.txt` (belegt Sicherungen, nicht Wiederherstellung; höchstens als Anlage zu R7 nach dem Test).
Die Fakten aus den IT-Notizen müssen trotzdem offengelegt werden (siehe R3/R6).

## Zuerst: zwei Punkte, die nicht bis zum Audit warten sollten

1. **Kostenloser Chatbot auf Privathandys (bis September 2026).** Laut IT-Notizen haben Agenten am
   Tannwald-Desk Tannwald-Servicetexte in einen kostenlosen Chatbot kopiert. Das ist eine Weitergabe
   von Tannwald-Daten an einen Dritten ohne Vertrag. Es steht nicht im Vorfallregister. Abschnitt 6.2
   verlangt Meldung innerhalb von 48 h ab Erkennung; bekannt ist der Vorgang spätestens seit 01.10.2026
   (Notiz vom 06.10.2026). Die Frist ist damit wahrscheinlich bereits überschritten.
   → Entscheidung der Geschäftsführung (D. Ilievski), möglichst mit Datenschutzberatung: als Vorfall
   erfassen (INC-04), Umfang klären (welche Agenten, welcher Dienst, welche Daten, Zeitraum), Tannwald
   unverzüglich und gesondert informieren, nicht erst mit dem Auditpaket.
2. **Claude Team ohne schriftliche Mitteilung an Tannwald (Klausel 7).** In Nutzung seit 01.09.2026,
   Speicherung in den USA. Klausel 7 verlangt eine schriftliche Mitteilung vor der Nutzung und eine
   schriftliche Zustimmung für die Speicherung außerhalb von EU/EWR. Laut G. Petrovski gibt es keine.
   → Tannwald schriftlich informieren und um Zustimmung bitten, oder Nutzung mit Tannwald-Daten bis
   zur Zustimmung aussetzen. Die mündliche Aussage eines Anbieter-Vertreters („Daten bleiben in Europa“)
   ist nicht belegt und widerspricht der Herstellerseite. Sie darf nicht verwendet werden.

## Einzelbewertung

### R1 Systeme und Speicherland (DPA 4.1)
- Systemliste ist aktuell und freigegeben: Servicepult, Sprechband, Nordlager (alle Deutschland),
  Claude Team (USA).
- Lücke: Der kostenlose Chatbot hat bis September 2026 Tannwald-Daten verarbeitet und fehlt.
  Offenlegung im Anschreiben bzw. im Vorfall (siehe oben).
- Herstellerseite datiert 15.06.2026: Speicherung in den USA, Verarbeitung des Datenverkehrs ggf. auch
  in Europa, Asien und Australien. Die Seite muss vor dem Versand erneut geprüft werden (konnte hier
  nicht abgerufen werden, Netzzugriff gesperrt). → G. Petrovski, neuer Ausdruck mit Datum.

### R2 Unterauftragsverarbeiter (DPA 4.3)
- Servicepult, Sprechband, Nordlager: Vertrag, Prüfung (20.01.2026 / 12.05.2026 / 03.02.2026, alle
  aktuell) und Rechtsgrundlage vorhanden.
- Anthropic: online akzeptiert 01.09.2026, **keine Prüfung, keine Rechtsgrundlage für die
  Übermittlung in die USA**. → G. Petrovski: akzeptierte Bedingungen/DPA von Anthropic sichern,
  dort vorgesehene Rechtsgrundlage (z. B. Standardvertragsklauseln oder EU-US Data Privacy Framework)
  prüfen und mit Quelle eintragen, Prüfung datieren. Nichts eintragen, was nicht belegt ist.

### R3 KI-Werkzeuge der letzten 12 Monate (DPA 4.4)
Vollständige Antwort muss zwei Werkzeuge nennen:

| Werkzeug | Zeitraum | Daten | Speicherland | Freigegebene Regel |
|---|---|---|---|---|
| Claude Team (25 Plätze) | seit 01.09.2026 | von Agenten eingefügter Anfragetext (ab 01.10. pseudonymisiert nach Regel 3) | USA | KI-Regel v1, freigegeben 01.10.2026; für 01.–30.09.2026 keine Regel |
| Kostenloser Chatbot (Name unbekannt) | bis September 2026, Beginn unbekannt | Anfragetexte zur Formulierung von Antworten, Umfang unbekannt | unbekannt | keine; durch KI-Regel v1 seit 01.10.2026 untersagt |

→ Fehlende Angaben (Dienst, Zeitraum, Personen, Daten) bei den betroffenen Agenten und der
Teamleitung Tannwald-Desk erheben und schriftlich festhalten.

### R4 Prüfung der Administratorkonten (DPA 5.2)
- Servicepult (14.08.2026): Ausgeschiedener adm-03 entfernt (14 Tage nach Austritt), MFA bei adm-04
  eingeschaltet. Gut belegt.
- Fehlt: Sprechband, Nordlager, Claude Team. Laut Richtlinie quartalsweise; die nächste Servicepult-
  Prüfung ist ohnehin bis ca. 14.11.2026 fällig.
→ G. Petrovski: Prüfung aller vier Systeme vor dem 25.11.2026 im selben Format, Freigabe durch
D. Ilievski.

### R5 Schulungen (DPA 5.4)
- 26 Einträge, 25 Personen (E014 doppelt), nur Kurs „Claude Team intro: data rules“.
- Quote 25/120 = 20,8 %. Für 95 % fehlen mindestens 89 Personen. Keine Datenschutzschulung im Nachweis.
→ M. Trajkovska / G. Petrovski: Datenschutz- und KI-Schulung für alle Mitarbeitenden bis 25.11.2026,
neuer HR-Export danach. Sollte das nicht erreichbar sein: Stand und Termin offen angeben.

### R6 Vorfälle mit Tannwald-Daten 2026 (DPA 6.2)
- INC-02: erkannt 07.05.2026 09:40, gemeldet 08.05.2026 16:10 = 30 h 30 min (Frist eingehalten),
  Ursache und Maßnahme dokumentiert. Empfehlung: die versandte Meldung an Tannwald (E-Mail) als Beleg
  beilegen.
- INC-01 und INC-03 ohne Tannwald-Daten, nicht verlangt (Register kann trotzdem vollständig gehen).
- Fehlt: Chatbot-Vorgang (siehe oben).

### R7 Wiederherstellungstest (DPA 5.6)
- Backup-Bericht Oktober: 31/31 Sicherungen erfolgreich, aber „Restore test: not done in 2026“.
  Richtlinie v3 verlangt zwei Tests pro Jahr.
→ G. Petrovski: Wiederherstellungstest (Servicepult-Export und Dateiablage) vor dem 25.11.2026
durchführen und protokollieren: Datum, Umfang, Dauer, Ergebnis, Prüfer, Freigabe.

### R8 Informationssicherheitsrichtlinie (DPA 5.1)
- v3 freigegeben 12.03.2024, Überprüfung seit März 2025 überfällig → nicht aktuell.
- v4 ist ein Entwurf ohne Freigabe → kein Nachweis.
→ D. Ilievski: v4 prüfen und mit tatsächlichem Datum freigeben. Achtung: Die Richtlinie verlangt
quartalsweise Zugriffsprüfungen, halbjährliche Wiederherstellungstests und jährliche Schulung für alle.
Die Nachweise R4, R5, R7 zeigen, dass das 2026 nicht eingehalten wurde; das Audit wird das vergleichen.

## Aufgabenliste bis 25.11.2026

| Aufgabe | Wer | Bis |
|---|---|---|
| Chatbot-Vorgang als Vorfall erfassen, Umfang klären, Tannwald informieren | D. Ilievski, G. Petrovski | sofort |
| Klausel 7: schriftliche Mitteilung zu Claude + Zustimmung zur US-Speicherung anfragen | D. Ilievski | sofort |
| Anthropic: DPA sichern, Rechtsgrundlage und Prüfung eintragen | G. Petrovski | 16.11. |
| Herstellerseite neu prüfen und ausdrucken | G. Petrovski | 16.11. |
| Admin-Prüfung aller vier Systeme, freigegeben | G. Petrovski, D. Ilievski | 20.11. |
| Wiederherstellungstest durchführen und protokollieren | G. Petrovski | 20.11. |
| Schulung Datenschutz + KI für alle, neuer HR-Export | M. Trajkovska | 24.11. |
| Richtlinie v4 freigeben | D. Ilievski | 20.11. |
| Paket final prüfen und versenden | D. Ilievski | 25.11. |

Keine Dokumente rückdatieren oder nachträglich ändern; neue Nachweise bekommen ihr echtes Datum.
