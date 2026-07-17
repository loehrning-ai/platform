# Excel und Datenanalyse: Zahlen, die stimmen

Dein Chef will die Quartalszahlen. Bis 15 Uhr.

Vier Produktlinien, vier Quartale, sechzehn Zellen. Klingt harmlos. Dann die Fragen: Welches Produkt wächst? Wo bricht etwas ein? Gibt es Ausreißer? Und bitte mit Empfehlung.

Bei Apple war ich Data Scientist. Die Menge an Excel-Dateien, die ich von Partnerteams bekam, mit Copy-Paste-Fehlern in Formeln, vertauschten Spalten, veralteten Referenzen, war erschreckend. Nicht weil die Leute schlecht waren. Weil Excel-Arbeit monoton ist und Monotonie Fehler produziert.

KI löst nicht das Problem schlechter Daten. Aber sie fängt Fehler, die du nach der dritten Stunde nicht mehr siehst.

## Welches Tool für welche Tabelle

Bevor du eine Zelle markierst: Welche Daten stecken drin?

**Microsoft Copilot in Excel** kann eine geeignete Option sein, wenn dein Unternehmen Produkt, Vertrag, Tenant-Geografie, Berechtigungen und zulässige Datenklassen geprüft hat. Copilot arbeitet innerhalb der Microsoft-365-Dienstgrenze; daraus folgt aber nicht automatisch eine bestimmte EU-Datenresidenz für jede Tenant-Konfiguration. Prüfe aktuelle Funktionen, Limits und Datenstandorte in der Microsoft-Dokumentation und im Admin-Center. Für interne Daten gilt ausschließlich die betriebliche Freigabe.

**ChatGPT Plus mit Data Analysis** kann Excel-Dateien hochladen und verarbeitet sie serverseitig bei OpenAI. Das heißt: gut für Public oder sauber anonymisierte Datensätze. Bei Internal-Daten heikel. Bei Confidential oder Restricted: nein.

**Claude Projects (Team-Tier)** erlaubt Excel-Upload mit DPA und Vertraulichkeits-Kontrolle. Eine Option, wenn dein Unternehmen Claude Team oder Enterprise lizenziert hat.

> **Achtung:** Niemals eine Liste mit personenbezogenen Daten, Namen, E-Mails, Telefonnummern, Kunden-IDs, in ein Tool kippen, das keinen AVV hat. Kostenlose KI-Versionen scheiden damit aus. Jede. Immer.

## Was Copilot in Excel kann

Damit du mitrechnen kannst, hier die Tabelle, um die es geht. Vier Produktlinien, vier Quartale, alles in TEUR:

| Produkt | Q1 | Q2 | Q3 | Q4 | Summe |
|---------|----|----|----|----|-------|
| KM-800 | 520 | 545 | 580 | 620 | 2.265 |
| LA-500 | 377 | 395 | 340 | 290 | 1.402 |
| HZ-300 | 280 | 290 | 305 | 320 | 1.195 |
| PV-100 | 175 | 182 | 190 | 200 | 747 |

Du markierst diese Tabelle. Du fragst:

> **Prompt-Vorlage:** Analysiere diese Quartalsdaten. Identifiziere das stärkste Produkt, den größten Rückgang und auffällige Trends. Zeige die Berechnung.

Copilot liefert: KM-800 ist am stärksten (2.265 TEUR Jahresumsatz). LA-500 zeigt einen Rückgang von 395 auf 290 TEUR zwischen Q2 und Q4, ein Ausreißer. HZ-300 und PV-100 wachsen um 14% über vier Quartale.

Soweit, so nützlich. Aber jetzt wird es wichtig.

## Die Spot-Check-Regel

Copilot sagt: LA-500 Rückgang 23%. Du rechnest nach, am Höhepunkt in Q2. 395 minus 290 ist 105. 105 geteilt durch 395 ist 26,6%. Nicht 23%.

Was ist passiert? Copilot hat einen anderen Referenzpunkt gewählt, Q1 (377) statt Q2 (395). 377 minus 290 ist 87, geteilt durch 377 sind 23%. Nicht falsch, aber anders als du es meinst, du denkst an den Absturz vom Hoch, Copilot rechnet vom Jahresanfang. Und genau das ist das Problem: KI-Analyse klingt präzise. Die Annahmen dahinter sind unsichtbar.

Drei Regeln für KI-Datenanalyse:

**Regel 1: Zwei bis drei Werte manuell gegenprüfen.** Nicht alle. Aber genug, um zu wissen, ob die Logik stimmt. Taschenrechner, zehn Sekunden.

**Regel 2: Kontext ergänzen, den die KI nicht hat.** Warum ist LA-500 eingebrochen? Produktrückruf? Lieferengpass? Saisoneffekt? Die Zahl allein erzählt keine Geschichte. Du kennst die Geschichte.

**Regel 3: Prognosen sind Extrapolation, keine Marktanalyse.** Wenn Copilot sagt „LA-500 wird in Q1 2027 bei 250 TEUR liegen", das ist eine Linie auf einem Graphen. Kein Marktwissen. Keine Wettbewerbsanalyse. Keine Kundenabwanderung.

Bei Red Bull, 13.000 Mitarbeitende, war die größte Hürde nie die Analyse, sondern die Daten. Antwort auf „wo liegen unsere Zahlen": 47 Excel-Tabellen auf Netzlaufwerken. Die gefährlichste Zahl in jeder dieser Tabellen ist die, die plausibel aussieht. Die hinterfragt niemand. Genau die musst du prüfen.

## Formeln, Bereinigung, Visualisierung

Excel-Formeln schreiben ist das, was die meisten zuerst ausprobieren. „Schreib mir eine SVERWEIS-Formel für..." Funktioniert. Spart 5 Minuten pro Formel.

Nützlicher ist Datenbereinigung. Doppelte Einträge finden, Formate vereinheitlichen, fehlende Werte markieren. Das ist Arbeit, die in Unternehmen mit 20 Mitarbeitern oft drei bis vier Stunden pro Monat frisst. KI macht es in Minuten.

Und Pivot-Tabellen: Statt fünf Minuten Klicken beschreibst du in einem Satz, was du sehen willst. „Gruppiere Umsatz nach Region und Quartal, sortiert absteigend." Fertig.

## Wo KI aufhört

Wenn du einen Datensatz hast, der sauber, strukturiert und in Excel liegt, perfekt. Wenn deine Daten in drei verschiedenen Systemen stecken, die nicht miteinander reden, halb in PDF-Rechnungen und halb im Kopf deiner Kollegin, dann hilft kein Prompt.

Das ist kein KI-Problem. Das ist ein Datenproblem. Und es zu lösen ist der erste Schritt, bevor du irgendetwas analysierst.

## Die Rechnung

| Aufgabe | Ohne KI | Mit KI | Ersparnis |
|---------|---------|--------|-----------|
| Quartalsanalyse | 45 Min. | 10 Min. | 35 Min. |
| Formeln schreiben (5 Stk.) | 25 Min. | 5 Min. | 20 Min. |
| Datenbereinigung | 60 Min. | 15 Min. | 45 Min. |

Bei wöchentlicher Analyse und monatlicher Bereinigung: rund **40 Minuten pro Woche**. Über ein Jahr: **30 Stunden**, in denen du statt Formeln zu tippen tatsächlich Entscheidungen triffst.

---

> **Jetzt bist du dran:** Öffne deine letzte Excel-Datei. Frag Copilot nach einer Zusammenfassung. Prüfe zwei Zahlen manuell. Wenn beide stimmen, gut. Wenn nicht, noch besser. Dann weißt du, worauf du achten musst.
