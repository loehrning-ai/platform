# Excel und Datenanalyse: Zahlen, die stimmen

Dein Chef will bis 15 Uhr die Quartalszahlen für vier Produktlinien, mit Wachstum, Einbrüchen, Ausreißern und einer Empfehlung.

Als Data Scientist bei Apple bekam ich von Partnerteams Excel-Dateien mit Copy-Paste-Fehlern in Formeln, vertauschten Spalten und veralteten Referenzen, weil monotone Excel-Arbeit Fehler produziert. Schlechte Daten repariert KI nicht, aber sie fängt Fehler, die du nach der dritten Stunde nicht mehr siehst.

## Welches Tool für welche Tabelle

Bevor du eine Zelle markierst, klärst du, welche Daten drinstecken.

**Microsoft Copilot in Excel** kann eine geeignete Option sein, wenn dein Unternehmen Produkt, Vertrag, Tenant-Geografie, Berechtigungen und zulässige Datenklassen geprüft hat. Copilot arbeitet innerhalb der Microsoft-365-Dienstgrenze; daraus folgt aber nicht automatisch eine bestimmte EU-Datenresidenz für jede Tenant-Konfiguration. Prüfe aktuelle Funktionen, Limits und Datenstandorte in der Microsoft-Dokumentation und im Admin-Center. Für interne Daten gilt ausschließlich die betriebliche Freigabe.

**ChatGPT Plus mit Data Analysis** kann Excel-Dateien hochladen und verarbeitet sie serverseitig bei OpenAI. Das passt für Public oder sauber anonymisierte Datensätze, ist bei Internal-Daten heikel und bei Confidential oder Restricted ausgeschlossen.

**Claude Projects (Team-Tier)** erlaubt Excel-Upload mit DPA und Vertraulichkeits-Kontrolle. Eine Option, wenn dein Unternehmen Claude Team oder Enterprise lizenziert hat.

> **Achtung:** Listen mit personenbezogenen Daten wie Namen, E-Mails, Telefonnummern oder Kunden-IDs gehören nie in ein Tool ohne AVV. Damit scheiden alle kostenlosen KI-Versionen aus.

## Was Copilot in Excel kann

Zum Mitrechnen hier die Tabelle, alle Werte in TEUR:

| Produkt | Q1 | Q2 | Q3 | Q4 | Summe |
|---------|----|----|----|----|-------|
| KM-800 | 520 | 545 | 580 | 620 | 2.265 |
| LA-500 | 377 | 395 | 340 | 290 | 1.402 |
| HZ-300 | 280 | 290 | 305 | 320 | 1.195 |
| PV-100 | 175 | 182 | 190 | 200 | 747 |

Du markierst die Tabelle und fragst:

> **Prompt-Vorlage:** Analysiere diese Quartalsdaten. Identifiziere das stärkste Produkt, den größten Rückgang und auffällige Trends. Zeige die Berechnung.

Copilot liefert: KM-800 ist am stärksten (2.265 TEUR Jahresumsatz). LA-500 zeigt einen Rückgang von 395 auf 290 TEUR zwischen Q2 und Q4, ein Ausreißer. HZ-300 und PV-100 wachsen um 14% über vier Quartale.

## Die Spot-Check-Regel

Copilot nennt für LA-500 einen Rückgang von 23%. Du rechnest ab dem Höhepunkt in Q2 nach: 395 minus 290 ist 105, geteilt durch 395 sind 26,6%.

Copilot hat Q1 (377) als Referenzpunkt gewählt: 377 minus 290 ist 87, geteilt durch 377 sind 23%. Du meinst den Absturz vom Hoch, Copilot rechnet vom Jahresanfang. KI-Analyse klingt präzise, aber die Annahmen dahinter bleiben unsichtbar.

Drei Regeln für KI-Datenanalyse:

**Regel 1: Zwei bis drei Werte manuell gegenprüfen.** Das reicht, um zu sehen, ob die Logik stimmt, und dauert mit dem Taschenrechner zehn Sekunden.

**Regel 2: Kontext ergänzen, den die KI nicht hat.** Ob LA-500 wegen eines Produktrückrufs, eines Lieferengpasses oder der Saison eingebrochen ist, weißt nur du.

**Regel 3: Prognosen sind Extrapolation.** „LA-500 wird in Q1 2027 bei 250 TEUR liegen" ist eine verlängerte Linie auf einem Graphen, ohne Marktwissen, Wettbewerbsanalyse oder abwandernde Kunden.

Bei Red Bull mit 13.000 Mitarbeitenden lagen die Zahlen in 47 Excel-Tabellen auf Netzlaufwerken. Die gefährlichste Zahl in solchen Tabellen sieht plausibel aus, und deshalb hinterfragt sie niemand. Genau die prüfst du.

## Formeln, Bereinigung, Visualisierung

Die meisten probieren zuerst Formeln aus: „Schreib mir eine SVERWEIS-Formel für ..." spart 5 Minuten pro Formel.

Nützlicher ist Datenbereinigung: doppelte Einträge finden, Formate vereinheitlichen, fehlende Werte markieren. In Unternehmen mit 20 Mitarbeitern frisst das oft drei bis vier Stunden pro Monat, mit KI dauert es Minuten.

Für Pivot-Tabellen beschreibst du in einem Satz, was du sehen willst, statt fünf Minuten zu klicken: „Gruppiere Umsatz nach Region und Quartal, sortiert absteigend."

## Wo KI aufhört

KI hilft bei sauberen, strukturierten Excel-Daten. Stecken deine Daten in drei Systemen, die nicht miteinander reden, in PDF-Rechnungen und im Kopf deiner Kollegin, löst du zuerst dieses Datenproblem, bevor du analysierst.

## Die Rechnung

| Aufgabe | Ohne KI | Mit KI | Ersparnis |
|---------|---------|--------|-----------|
| Quartalsanalyse | 45 Min. | 10 Min. | 35 Min. |
| Formeln schreiben (5 Stk.) | 25 Min. | 5 Min. | 20 Min. |
| Datenbereinigung | 60 Min. | 15 Min. | 45 Min. |

Bei wöchentlicher Analyse und monatlicher Bereinigung sparst du rund **40 Minuten pro Woche**, über ein Jahr **30 Stunden**.

---

> **Jetzt bist du dran:** Lass Copilot deine letzte Excel-Datei zusammenfassen und prüfe zwei Zahlen manuell. Stimmt eine nicht, weißt du, worauf du achten musst.
