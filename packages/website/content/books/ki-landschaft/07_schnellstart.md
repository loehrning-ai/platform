# Schnellstart: einen sicheren Lernpilot vorbereiten

Der erste Schritt ist kein Rollout für alle. Es ist ein begrenzter Pilot mit freigegebenen Daten, einer prüfenden Fachperson und einer Messung von vorher.

## 1. Einen Prozess auswählen

Nimm eine wiederkehrende Informationsaufgabe, deren Ergebnis ein Mensch vor der Verwendung prüft. Entwürfe, Klassifizierung, strukturierte Extraktion. Für den Einstieg ungeeignet sind Entscheidungen mit hoher Wirkung auf Menschen, Sicherheitsfunktionen und alles ohne verlässliche Prüfmöglichkeit.

Dokumentiere.

- Eingang und erwartetes Ergebnis
- verantwortliche Fachperson
- heutige Bearbeitungszeit und Fehlerarten
- Datenklasse und erlaubte Testdaten
- Folgehandlung nach dem Output

## 2. Umgebung und Daten freigeben

Prüfe die konkrete Produktvariante, nicht nur die Marke:

- Vertrag, Rollen und gegebenenfalls DPA/AVV
- Trainingsnutzung und Aufbewahrung
- Datenresidenz, Transfers und Unterauftragsverarbeiter
- Identitäten, Zugriffe, Logs und Löschung
- Integrationen, Erweiterungen und Exporte

Beginne mit synthetischen Daten. Reale Daten folgen erst, wenn Zweck, Rechtsgrundlage, Geheimhaltung und technische Freigabe geklärt sind.

## 3. Eine Rubrik vor dem Test festlegen

Beispiel für einen Zusammenfassungsentwurf.

- alle Pflichtpunkte enthalten
- keine erfundenen Aussagen
- Zahlen und Namen stimmen mit der Quelle überein
- Unsicherheiten sind markiert
- Format ist nutzbar
- fachliche Korrekturzeit ist messbar

Leg die Stopkriterien fest, bevor du das Ergebnis kennst.

## 4. Repräsentative Testfälle verwenden

Teste normale, schwierige und absichtlich kaputte Eingaben. Halte Modell- oder Systemversion, Einstellungen und Prompt fest. Ein gelungener Einzelfall ist keine Wirksamkeitsprüfung.

## 5. Output nur als Entwurf behandeln

Die Fachperson prüft Quelle gegen Output. Korrigieren, verwerfen und eskalieren muss sie dürfen. „Mensch in der Schleife“ wirkt nur mit Zeit, Kompetenz, Informationen und Befugnis.

## 6. Mit eigenen Werten rechnen

Miss mindestens:

- Bearbeitungs- und Prüfzeit vorher und nachher
- Fehlerquote je definierter Fehlerart
- Anteil verworfener Outputs
- tatsächliche variable und fixe Kosten
- Vorfälle und Beschwerden

Wirtschaftlicher Nutzen ergibt sich aus deinen Messungen, nicht aus statischen Lizenzpreisen, erfundenen Stundenersparnissen oder einer allgemeinen ROI-Quote.

## 7. Entscheiden

- **Stoppen:** Schutz- oder Qualitätsgate nicht bestanden.
- **Überarbeiten:** kontrollierbare Lücke mit neuem Test.
- **Begrenzt fortsetzen:** Gates bestanden, Umfang bleibt definiert.
- **Erweitern:** erst nach erneutem Risiko-, Kapazitäts- und Kontrollcheck.

## Fünf robuste Promptmuster

### Quellengebundener Entwurf

> Nutze ausschließlich den freigegebenen Quelltext. Markiere fehlende Angaben als `UNKLAR`. Erfinde nichts. Gib nach jedem Punkt die relevante Quellstelle an.

### Strukturierte Extraktion

> Extrahiere nur die definierten Felder als valides JSON. Verwende `null`, wenn ein Wert nicht eindeutig belegt ist. Füge keine weiteren Schlüssel hinzu.

### Gegenprüfung

> Vergleiche Entwurf und Quelle. Liste Widersprüche, unbelegte Aussagen, ausgelassene Pflichtpunkte und unsichere Zahlen. Entscheide nicht selbst über die Freigabe.

### Prozessdokumentation

> Forme die freigegebenen Notizen in eine Schrittfolge um. Trenne Voraussetzung, Handlung, Ergebnis, Ausnahme und Eskalation. Markiere Annahmen.

### Testfälle

> Erzeuge ausschließlich synthetische Testfälle für die genannten Fehlerklassen. Verwende keine realen Personen, Unternehmen, Adressen oder Zugangsdaten.

Am Ende des Schnellstarts steht ein belegter Pilotentscheid, kein Toolkauf.
