# Tannwald-Audit 2026: Stand der Nachweise R1–R8 (INTERN, nicht an Tannwald senden)
Stand: 9. November 2026. Abgabe bei Tannwald: Mi 25.11.2026. Remote-Audit: Do 10.12.2026.
Maßstab aus der Anforderung: aktuell = datiert ab 10.12.2025; jedes Dokument nennt Freigebenden bzw. Owner; Beschreibung ≠ Nachweis; Schulung ≥ 95 %; Vorfälle ≤ 48 h.

## Übersicht

| # | Status | Nachweis im Ordner | Kernproblem |
|---|---|---|---|
| R1 | teilweise | system-list_2026-09.csv (freigegeben 02.09.2026), Vendor-Seite | Kostenloser Chatbot (bis Sept.) fehlt; Claude speichert in den USA → Vertragsklausel 7 |
| R2 | Lücke | subprocessors_2026-09.csv (Owner, Stand 05.09.2026) | Anthropic: keine Review, keine Rechtsgrundlage für US-Transfer |
| R3 | Lücke, Entscheidung nötig | ai-use-rule_v1.md (freigegeben 01.10.2026), Vendor-Seite | Free-Chatbot nicht dokumentiert; keine schriftliche Mitteilung an Tannwald (Klausel 7) |
| R4 | Lücke | access-review_2026-08-14.csv (nur Servicepult) | 3 von 4 Systemen ohne Review |
| R5 | Lücke | training-records_2026.csv | 25 von 120 = 20,8 % (Soll 95 %); kein Datenschutzkurs |
| R6 | erfüllt (mit Vorbehalt) | incident-log_2026_extract_tannwald.csv | INC-02 in 30 h 30 min gemeldet; Chatbot-Nutzung evtl. ungemeldeter Vorfall |
| R7 | fehlt | – | Kein Restore-Test 2026 |
| R8 | fehlt | – | v3 seit März 2025 überfällig, v4 nicht freigegeben |

Nicht beilegen: `it-notes_2026-10-06.md` (private, nicht geprüfte Notizen; reine Beschreibung). `infosec-policy_v3_FINAL.md` / `v4_DRAFT.md` erfüllen R8 nicht. `backup-report_2026-10.txt` belegt nur, dass Sicherungen laufen, nicht, dass ein Restore funktioniert.

## Einzelheiten

### R1 – Systeme und Speicherort (DPA 4.1)
- Systemliste ist aktuell und freigegeben (Dragan Ilievski, 02.09.2026). Servicepult, Sprechband, Nordlager: Deutschland (Frankfurt). Claude Team: USA.
- Fehlt: der kostenlose Chatbot, den Agents am Tannwald-Desk bis September auf ihren Handys genutzt haben (Quelle: IT-Notizen). R1 fragt nach Systemen, die unsere Daten verarbeiten; mindestens unter R3 muss er auftauchen.
- Speicherort Claude: Laut Vendor-Seite (Stand 15.06.2026) „data is stored in the US". Die mündliche Aussage eines Vertriebsmitarbeiters („data stays in Europe") ist nicht schriftlich und widerspricht der Vendor-Seite – **nicht verwenden**.
- Vendor-Seite vor Versand erneut prüfen (https://privacy.claude.com/en/articles/7996890); ich konnte sie aus der Sandbox nicht abrufen. Neuen Ausdruck mit aktuellem Datum ablegen.

### R2 – Unterauftragsverarbeiter (DPA 4.3)
- Servicepult (Review 20.01.2026), Sprechband (12.05.2026), Nordlager (03.02.2026): Review aktuell, EU, kein Transfer – ok.
- Anthropic: Vertrag „accepted online 2026-09-01", **last_review leer, transfer_basis leer**. Für einen US-Transfer muss eine Rechtsgrundlage dokumentiert sein (z. B. Standardvertragsklauseln im DPA des Anbieters oder EU-US Data Privacy Framework). To do: Anthropic-DPA/Commercial Terms in der zum 01.09.2026 gültigen Fassung herunterladen und ablegen, Transfermechanismus daraus eintragen, Review durchführen und datieren.
- Der Anbieter des kostenlosen Chatbots war faktisch ebenfalls Empfänger von Tannwald-Daten, ohne Vertrag.

### R3 – KI-Tools der letzten 12 Monate (DPA 4.4)
- Claude Team: seit 01.09.2026, Daten = von Agents eingefügter Anfragetext, Speicherort USA, Regel = ai-use-rule_v1 (freigegeben 01.10.2026). Achtung: Claude lief vom 01.09. bis 30.09.2026 **ohne** freigegebene Regel.
- Kostenloser Chatbot auf Handys: Tool, Daten, Speicherort und Zeitraum unbekannt; keine Regel. Muss bei den betroffenen Agents erfragt und dokumentiert werden (welches Tool, seit wann, welche Daten, wie viele Personen).
- **Klausel 7 des Servicevertrags**: KI nur nach schriftlicher Mitteilung an Tannwald; Speicherung außerhalb EU/EWR nur mit schriftlicher Zustimmung. Laut IT-Notizen gibt es keine Mitteilung. Damit verstoßen beide Tools (Free-Chatbot, Claude/USA) derzeit gegen den Vertrag – und die Nutzung von Claude mit Tannwald-Daten läuft weiter.
- Empfehlung: Die Chatbot-Nutzung **nicht weglassen**. R3 fragt explizit nach den letzten 12 Monaten; ein Weglassen wäre eine falsche Angabe gegenüber dem Auftraggeber und fällt spätestens im Audit-Gespräch mit dem Desk auf. Vorschlag: Mitteilung an Tannwald **jetzt und gesondert** (nicht erst mit dem Paket), mit Bitte um schriftliche Zustimmung zur US-Speicherung oder Pausieren von Claude für Tannwald-Daten bis dahin.

### R4 – Admin-Review (DPA 5.2)
- Vorhanden nur für Servicepult (14.08.2026, freigegeben 17.08.2026): Leaver adm-03 entfernt, MFA für adm-04 eingeschaltet – formal gut.
- Hinweis: adm-03 war nach dem Austritt (31.07.) noch 14 Tage aktiv. Vor dem Audit in den Logs prüfen, ob das Konto in dieser Zeit genutzt wurde; Tannwald wird fragen.
- Fehlt: Sprechband, Nordlager, Claude Team (Admin-Konsole). Die nächste Quartalsprüfung ist laut Policy ohnehin ~14.11.2026 fällig → **eine Review über alle vier Systeme vor dem 25.11.** durchführen, im gleichen Format (Konto, Status, Rolle, MFA, Entscheidung), freigeben lassen.

### R5 – Schulungen (DPA 5.4)
- 26 Einträge, davon E014 doppelt → **25 von 120 Mitarbeitenden = 20,8 %** (Soll ≥ 95 % = mind. 114).
- Einziger Kurs: „Claude Team intro: data rules" (03.09./10.09.2026) – also vor der freigegebenen KI-Regel vom 01.10.2026. Ein **Datenschutzkurs fehlt komplett**, obwohl Policy v3 ihn jährlich für alle vorschreibt.
- To do: Datenschutz- und KI-Regel-Schulung für alle (bis 25.11. mind. 114 Personen), neuer HR-Export. Ist das bis zur Frist nicht erreichbar, den tatsächlichen Stand plus Plan mit Termin angeben.

### R6 – Vorfälle 2026 (DPA 6.2)
- INC-02: entdeckt 07.05.2026 09:40, Tannwald informiert 08.05.2026 16:10 = **30 h 30 min** (< 48 h), Ursache und Maßnahme dokumentiert. Auszug nur mit INC-02 liegt bei (INC-01/03 ohne Tannwald-Daten).
- **Vorbehalt**: Die Eingabe von Tannwald-Daten in einen privaten Gratis-Chatbot ist sehr wahrscheinlich eine Verletzung des Schutzes personenbezogener Daten. Bekannt spätestens 06.10.2026 → 48-h-Frist wäre am 08.10.2026 abgelaufen. Steht nicht im Incident-Log. Mit Datenschutzverantwortlichen bewerten, ins Log aufnehmen und Tannwald unverzüglich informieren – das ist eine Entscheidung der Geschäftsführung, sollte aber nicht bis zum Paket warten.

### R7 – Restore-Test (DPA 5.6)
- Backup-Report Oktober: 31/31 Jobs ok, aber „Restore test: not done in 2026". Policy v3 verlangt zwei pro Jahr.
- To do: Restore-Test (Servicepult-Export und File-Share aus Nordlager) **vor dem 25.11.** durchführen und protokollieren: Datum, was wiederhergestellt, Dauer, Ergebnis/Abweichungen, durchgeführt von, freigegeben von.

### R8 – Informationssicherheitsrichtlinie (DPA 5.1)
- v3: freigegeben 12.03.2024, Review fällig März 2025 → nicht aktuell. v4: Entwurf, nicht freigegeben.
- To do: v4 vor dem 25.11. von Dragan Ilievski freigeben lassen. Empfehlung: v4 als eigenständiges Dokument (Regeln 1–5 ausschreiben statt „wie in Version 3") und mit Datum der nächsten Review. Hinweis: Tannwald wird die Praxis an diesen Regeln messen (Quartalsreview aller Systeme, zwei Restore-Tests, Schulung aller).

## Entscheidungen für die Geschäftsführung (Dragan Ilievski)
1. Tannwald jetzt schriftlich über KI-Nutzung informieren (Klausel 7) – Claude und den Gratis-Chatbot.
2. Schriftliche Zustimmung zur US-Speicherung einholen; bis dahin Claude für Tannwald-Daten weiter nutzen oder pausieren?
3. Chatbot-Nutzung als Vorfall nach DPA 6.2 bewerten und melden.
4. Policy v4 freigeben.

## Aufgaben bis 25.11.2026
| Aufgabe | für R | Verantwortlich (Vorschlag) |
|---|---|---|
| Vendor-Seite neu abrufen und ablegen | R1, R3 | IT-Lead |
| Anthropic-DPA ablegen, Transferbasis + Review eintragen | R2 | IT-Lead |
| Chatbot-Nutzung bei Agents erheben und dokumentieren | R1, R3, R6 | Teamlead Tannwald-Desk |
| Admin-Review aller 4 Systeme, freigegeben; adm-03-Logs prüfen | R4 | IT-Lead / GF |
| Datenschutz- + KI-Schulung für ≥ 114 Personen, neuer HR-Export | R5 | HR-Lead |
| Restore-Test durchführen und protokollieren | R7 | IT-Lead |
| Policy v4 freigeben | R8 | GF |

Erst danach Anschreiben an Lena Keller (Englisch) aufsetzen; gesendet wird nur nach Freigabe durch die GF.
