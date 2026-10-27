# Nachweise für Tannwald Haustechnik, R1 bis R8

Grundlage: request_tannwald.md (eingegangen 9. Nov. 2026). Audit: 10. Dez. 2026. Abgabe: 25. Nov. 2026.
Zeitfenster laut Anforderung: Dokumente mit Datum ab 10. Dez. 2025, bei Richtlinien zählt die letzte Freigabe oder Überprüfung. "Letzte 12 Monate" (R3, R5, R7) = 10.12.2025 bis 10.12.2026.
Schwellen laut Anforderung: Schulung "at least 95% of your staff"; Meldung von Vorfällen "within 48 hours of detection".
Rollen statt Namen: GF = Managing Director, IT = IT lead, HR = HR lead.

## 1. Nachweisliste

| Datei | Typ | Datum (Art) | Freigabe / geführt von | Umfang | Andere Fassungen |
|---|---|---|---|---|---|
| system-list_2026-09.csv | REGISTER | 2026-09-02 (Freigabe) | geführt: IT; freigegeben: GF | 4 Systeme mit Tannwald-Daten | – |
| subprocessors_2026-09.csv | REGISTER | 2026-09-05 (letzte Aktualisierung) | geführt: IT; keine Freigabe genannt | 4 Unterauftragsverarbeiter | – |
| ai-use-rule_v1.md | RICHTLINIE | 2026-10-01 (Freigabe, gültig ab) | freigegeben: GF; Owner: IT | alle Beschäftigten, nur Claude Team | – |
| vendor-page_claude_2026-06-15.md | AUSSAGE (Herstellerseite) | 2026-06-15 (Seitendatum), gedruckt 2026-10-06 | Herausgeber: Anthropic Privacy Center | Speicherort Claude | – |
| access-review_2026-08-14.csv | PROTOKOLL | 2026-08-14 (durchgeführt), 2026-08-17 (freigegeben) | durchgeführt: IT; freigegeben: GF | nur Servicepult | – |
| training-records_2026.csv | PROTOKOLL (HR-Export) | 2026-11-02 (Export) | erstellt: HR | 26 Zeilen, 1 Kurs | – |
| incident-log_2026.csv | PROTOKOLL | letzte Zeile 2026-10-12 | geführt: IT | 3 Vorfälle 2026 | – |
| backup-report_2026-10.txt | PROTOKOLL | 2026-11-01 (erzeugt) | Owner: IT | Servicepult-Export, Dateiablage, Okt. 2026 | – |
| infosec-policy_v3_FINAL.md | RICHTLINIE | 2024-03-12 (Freigabe) | freigegeben: GF | Regeln 1–5 | v4 |
| infosec-policy_v4_DRAFT.md | RICHTLINIE (Entwurf) | 2026-09-18 (letzte Bearbeitung) | "Approved by: (open)" | Regeln 1–6 | v3 |
| it-notes_2026-10-06.md | AUSSAGE | 2026-10-06 (geschrieben) | "Not reviewed by anyone" | private Notizen IT | – |

## 2. Prüfung je Anforderung

| Anf. | Datei | Zitat (wörtlich) | ZITAT | ZEITRAUM | UMFANG | FREIGABE | Status | Was schließt die Lücke | Zuständig |
|---|---|---|---|---|---|---|---|---|---|
| R1 | system-list_2026-09.csv | "Systems that hold Tannwald data." / "Claude Team (browser and desktop app; 25 seats since 2026-09-01),drafting replies to service requests,request text pasted by agents,United States" / "Approved 2026-09-02" | ja | ja (2026-09-02) | 4 Systeme mit Land; der kostenlose Chatbot (bis Sept., siehe R3) steht nicht drin | ja (GF) | **BELEGT** | – (Hinweis: Speicherort USA, siehe Risiken) | IT |
| R2 | subprocessors_2026-09.csv | "Anthropic,Claude Team,United States,accepted online 2026-09-01,," | ja | ja (2026-09-05) | Anthropic: Prüfung und Transfergrundlage leer | geführt von IT | **LÜCKE** | Rechtsgrundlage für den Transfer in die USA, dokumentierte Prüfung von Anthropic, Vertragsunterlagen (online akzeptierte Bedingungen, Datum) | GF, IT |
| R3 | ai-use-rule_v1.md, vendor-page, system-list | "The only AI tool for customer data is our Claude Team workspace (25 seats, in use since 2026-09-01). Its data is stored in the US" / "Valid from 2026-10-01" / "Note that data is stored in the US." | ja für Claude Team | Regel erst ab 2026-10-01: 30 Tage Nutzung (1.–30.9.) ohne Regel | Chatbot fehlt | Regel ja (GF) | **LÜCKE** | siehe nächste Zeile | – |
| R3 | it-notes_2026-10-06.md | "Until September some agents on the Tannwald desk used a free chatbot on their phones to word replies." | nur AUSSAGE | – | Tool, Daten, Land unbekannt | "Not reviewed by anyone" | **LÜCKE** | Protokoll zum Chatbot: welches Tool, welche Daten, wie lange, wer; Entscheidung, ob das ein Vorfall ist (R6) | IT, GF |
| R4 | access-review_2026-08-14.csv | "Review of administrator accounts in Servicepult (ticket system). Done 2026-08-14" / "adm-03,left 2026-07-31,team lead,yes,removed 2026-08-14" / "adm-04,employee,reporting,no,MFA switched on 2026-08-14" | ja (Servicepult) | ja (2026-08-14) | nur 1 von 4 Systemen aus R1; Sprechband, Nordlager, Claude Team fehlen | ja (GF, 2026-08-17) | **LÜCKE** | Admin-Reviews für Sprechband, Nordlager, Claude Team (Leaver, MFA), gleiche Form | IT, GF |
| R5 | training-records_2026.csv | "Staff on 2026-11-01: 120." / "Claude Team intro: data rules" | nur KI-Schulung; keine Datenschutzschulung | ja (Sept. 2026) | 25 von 120 = 20,8 % (Schwelle 95 % = 114 Personen) | erstellt von HR | **LÜCKE** | Datenschutzschulung mit Nachweis; KI-Schulung für die übrigen 95 Personen | HR, IT |
| R6 | incident-log_2026.csv | "INC-02,2026-05-07 09:40,Tannwald" / "2026-05-08 16:10,mail auto-complete chose the wrong address" / "auto-complete off for external mail" | ja (erkannt, gemeldet, Ursache, Behebung) | ja (2026) | Meldung nach 30,5 h, innerhalb 48 h; offen: Chatbot-Nutzung fehlt im Log | geführt von IT | **BELEGT** (unter Vorbehalt) | Klären, ob über den Chatbot Tannwald-Daten abgeflossen sind; falls ja: LÜCKE (nicht erfasst, nicht gemeldet) | IT, GF |
| R7 | backup-report_2026-10.txt | "Restore test: not done in 2026. Planned for Q4 2026 (owner: IT lead)." | Datei zeigt: kein Test | – | – | Owner IT | **LÜCKE** | Protokoll eines Restore-Tests (Servicepult-Export, Dateiablage) mit Ergebnis | IT |
| R8 | infosec-policy_v3_FINAL.md | "Approved 2024-03-12" / "Next review: March 2025." | ja | nein: 2024-03-12, vor 10.12.2025; Review seit März 2025 überfällig | Regeln 1–5, KI fehlt | ja (GF) | **SCHWACH** (ZEITRAUM) | v4 durch GF freigeben, mit Datum | GF |
| R8 | infosec-policy_v4_DRAFT.md | "Approved by: (open)" | ja | Bearbeitet 2026-09-18 | Regeln 1–6 | nein: Entwurf | SCHWACH (FREIGABE) | wie oben | GF |

Zählung (im Code): BELEGT 2 (R1, R6), SCHWACH 1 (R8), LÜCKE 5 (R2, R3, R4, R5, R7).
Training: 26 Zeilen, 1 Doppelung (E014 zweimal), 25 Personen. INC-02: 2026-05-07 09:40 bis 2026-05-08 16:10 = 30,5 h.

## 3. Risiken, die über R1–R8 hinausgehen

- Klausel 7 des Servicevertrags verlangt schriftliche Benachrichtigung vor KI-Nutzung und EU/EWR-Speicherung ohne schriftliche Zustimmung. Die Dateien zeigen Claude Team mit Speicherung in den USA seit 2026-09-01 und dazu: "Did we ever tell Tannwald in writing that we use Claude (clause 7)? I found nothing." (it-notes). Die Aussage "data stays in Europe" eines Vertriebsmitarbeiters ist nicht schriftlich und widerspricht der Herstellerseite ("Note that data is stored in the US.").
- Die eigene Richtlinie v3 verlangt Admin-Reviews pro Quartal und Restore-Tests zweimal im Jahr. Das nächste Quartals-Review (ab 2026-08-14) wäre etwa am 2026-11-14 fällig.
- adm-03: ausgetreten 2026-07-31, entfernt 2026-08-14 = 14 Tage aktiv nach Austritt.
- Herstellerseite: Seitendatum 15. Juni 2026. Vor Versand neu abrufen (so steht es in der Datei).

## 4. Anfragen zum Schließen der Lücken (Termin: 20. Nov. 2026, 5 Tage vor Abgabe; Vorschlag)

**An die Geschäftsführung (R2, R3, R8, Klausel 7)**
Tannwald verlangt für R2 "contract date, last review, and the legal basis for any transfer outside the EU/EEA". Im Register steht bei Anthropic (USA) nur "accepted online 2026-09-01", Prüfung und Transfergrundlage sind leer. Für R8 liegt nur v3 (freigegeben 2024-03-12, Review seit März 2025 offen) und der Entwurf v4 ("Approved by: (open)") vor. Bitte: Rechtsgrundlage für den Transfer und Datum der Vertragsannahme belegen, v4 mit Datum freigeben, und klären, ob Tannwald nach Klausel 7 schriftlich über Claude informiert wurde. "Gibt es nicht" ist eine gute Antwort, dann melden wir es als Lücke.

**An die IT-Leitung (R3, R4, R6, R7)**
R4 verlangt das letzte Admin-Review "on every system in R1". Vorhanden ist nur Servicepult (2026-08-14). Es fehlen Sprechband, Nordlager und Claude Team. R7 verlangt einen Restore-Test der letzten 12 Monate; der Bericht sagt "Restore test: not done in 2026." R3/R6: Deine Notiz nennt einen kostenlosen Chatbot auf Handys bis September. Bitte: Reviews der drei Systeme, ein Protokoll des Restore-Tests mit Ergebnis und eine kurze Erfassung des Chatbot-Falls (Tool, Zeitraum, betroffene Daten, Vorfall ja/nein). "Gibt es nicht" ist eine gute Antwort.

**An die HR-Leitung (R5)**
R5 verlangt Schulungsnachweise "for data protection and AI use" für mindestens 95 % der Beschäftigten. Der Export zeigt nur "Claude Team intro: data rules" für 25 von 120 (20,8 %), keine Datenschutzschulung. Bitte: alle Datenschutzschulungen seit 10.12.2025 exportieren, falls vorhanden, und einen Plan für die übrigen 95 Personen. "Gibt es nicht" ist eine gute Antwort.

Der Ordner zeigt diesen Stand heute. Was an Tannwald geht und ob die Lücken offen gemeldet werden, entscheidet die Geschäftsführung.
