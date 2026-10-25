# Kennzahlen

Eine Kennzahl je Abschnitt. Weitere fügst du in derselben Form hinzu.
Erwartete Testwerte gehören nicht hierher, sondern in deine Prüfliste außerhalb von Claude.

## ending_mrr 1.0.0: Ending MRR

- Frage: Ending MRR je Monat für das letzte abgeschlossene Quartal, in EUR.
- Stichtag: 2026-07-01, außer die Frage nennt einen anderen.
- Art: Stand (Wert zu einem Zeitpunkt). Über Gruppen addieren: ja. Über Monate addieren: nie. Für ein Quartal: jeder Monat einzeln oder der letzte.
- Quelle: analytics.mrr_summary_monthly, Spalte ending_mrr_eur
- Wer zählt: Abos, die am Monatsende laufen, neue eingeschlossen (Codes A und N). Gekündigte Abos (Code C) zählen nicht.
- Nie zeigen: Namen, E-Mail-Adressen, Telefonnummern und Anschriften.
- Gesperrt durch: Datei nicht im Projekt.
- Version: 1.0.0. Ändern sich Formel, Zählregel, Zeilen oder Zeitraum: 2.0.0.
