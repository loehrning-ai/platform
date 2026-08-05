---
Title: Vom Prompt zur Antwort: was ein Sprachmodell tatsächlich macht
Status: draft
License: ALL-RIGHTS-RESERVED
Author: Tim Löhr
Created: 2026-07-26
Modified: 2026-07-26
Source review: 2026-07-26
Canonical URL: null
Target channel: blog
---

# Vom Prompt zur Antwort: was ein Sprachmodell tatsächlich macht

Ein Sprachmodell schlägt nicht in einem unsichtbaren Lexikon nach.

Es berechnet, welches Textelement als Nächstes wahrscheinlich passt.

Das klingt kleiner als "Intelligenz". Es erklärt aber erstaunlich viel:

- warum ein Modell flüssig formuliert;
- warum es verschiedene Stile nachahmt;
- warum mehr Kontext die Antwort verändert;
- warum eine überzeugende Antwort falsch sein kann.

## Vier Schritte

### 1. Dein Text wird in Tokens zerlegt

Ein Token ist kein Wort. Es kann ein Wortteil, ein Satzzeichen oder eine kurze
Zeichenfolge sein.

Das Modell verarbeitet diese Einheiten als Zahlen. Die genaue Zerlegung hängt
vom Modell ab.

### 2. Der Kontext wird gewichtet

Das Modell betrachtet deinen Prompt, vorherige Nachrichten und weitere
bereitgestellte Informationen innerhalb seines Kontextfensters.

Es erkennt Muster: Rolle, Aufgabe, Format, Beispiele, Begriffe und Beziehungen.

Es versteht diese Dinge nicht so wie ein Mensch. Es hat gelernt, welche Muster
in ähnlichen Texten miteinander auftreten.

### 3. Das nächste Token wird gewählt

Für viele mögliche Fortsetzungen berechnet das Modell Wahrscheinlichkeiten.

Dann wählt es ein Token. Danach wiederholt sich der Prozess mit dem erweiterten
Text.

So entsteht Satz für Satz eine Antwort.

### 4. Werkzeuge können den Prozess erweitern

Ein modernes System kann zusätzlich suchen, rechnen, Code ausführen oder eine
Datenbank abfragen.

Das Sprachmodell bleibt dabei der Teil, der entscheidet, wie es die Aufgabe
zerlegt und wie es Ergebnisse in Text überführt. Das Werkzeug liefert
zusätzliche Beobachtungen.

Ein Suchwerkzeug macht die Antwort nicht automatisch wahr. Es kann eine
schlechte Quelle auswählen oder ihren Inhalt falsch zusammenfassen.

## Warum der Kontext so viel verändert

Teste diese zwei Prompts:

> Erkläre Photosynthese.

Und:

> Erkläre Photosynthese einer zwölfjährigen Person in sechs Sätzen. Verwende
> eine Analogie, nenne danach die Grenze der Analogie und schließe mit einer
> Prüffrage.

Das zweite Ergebnis ist meist nützlicher. Nicht weil das Modell plötzlich mehr
Biologie kennt. Die Aufgabe ist enger.

Zielgruppe, Länge, Struktur und Prüfschritt verändern die
Wahrscheinlichkeitsverteilung der Fortsetzung.

## Warum plausible Fehler entstehen

Das Modell optimiert nicht automatisch auf Wahrheit.

Es optimiert zunächst auf eine passende Fortsetzung. Wenn eine erfundene
Quelle sprachlich gut in das Muster passt, kann sie erscheinen wie eine echte.

Werkzeuge, Quellen und systematische Prüfungen können das Risiko senken. Sie
entfernen es nicht.

Das ist die wichtigste Trennung:

**Flüssigkeit ist eine Eigenschaft des Textes. Richtigkeit ist eine Eigenschaft
der überprüften Behauptung.**

## Praktische Übung: Kontext kontrollieren

Wähle eine Frage, deren Antwort du fachlich prüfen kannst.

Führe drei Varianten aus:

1. Frage ohne Zusatz.
2. Frage mit Zielgruppe und Ausgabeformat.
3. Frage mit einer bereitgestellten Primärquelle und der Anweisung, jede
   Behauptung daran zu belegen.

Vergleiche:

- Welche Aussagen bleiben gleich?
- Welche neuen Details entstehen?
- Welche Behauptung ist in Variante 1 plausibel, aber unbelegt?
- Zitiert Variante 3 wirklich die bereitgestellte Quelle?

Prüfe mindestens eine Aussage außerhalb des Modells.

## Was das nicht beweist

Dieses Modell erklärt den Grundmechanismus. Es beschreibt nicht jede interne
Architektur eines aktuellen Systems.

Eine Quellenangabe beweist nicht, dass die Quelle existiert oder die Aussage
trägt.

Ein Werkzeugaufruf beweist nicht, dass das richtige Werkzeug, die richtige
Abfrage oder die richtige Interpretation gewählt wurde.

## Vertiefung

- [Einstieg auf loehrning.ai](https://loehrning.ai/einstieg)
- [Wie KI wirklich funktioniert](https://loehrning.ai/wie-ki-funktioniert)
- [KI-Führerschein](https://loehrning.ai/ki-fuehrerschein)

Vor Veröffentlichung werden die Erklärungen gegen die Dokumentation der im
Beispiel verwendeten Modelle geprüft und die getesteten Versionen ergänzt.

Offenlegung: Für Strukturprüfung und Entwurfsarbeit wurde KI eingesetzt.
