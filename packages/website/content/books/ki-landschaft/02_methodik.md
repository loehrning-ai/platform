# Methodik: KI-Bereitschaft ohne Scheingenauigkeit prüfen

Eine Zahl wirkt objektiv, auch wenn sie auf unvollständigen Annahmen beruht. Öffentlich sichtbare Merkmale einer Website zeigen nicht zuverlässig, wie gut interne Daten, Prozesse, Kompetenzen oder Kontrollen funktionieren. Dieses Kapitel verwendet deshalb keinen proprietären Firmenscore.

## Untersuchungsfrage zuerst

Formuliere vor jeder Erhebung eine konkrete Frage:

- Welche Systeme werden eingesetzt?
- Welcher Prozess soll verbessert werden?
- Welche Daten werden dafür benötigt?
- Welche Fehler wären tolerierbar?
- Welche rechtlichen und organisatorischen Kontrollen greifen?

Ohne Untersuchungsfrage wird ein Inventar schnell zur Sammlung irrelevanter Technikmerkmale.

## Fünf Evidenzbereiche

### 1. Prozess und Zweck

Dokumentiere Prozessinhaber, Nutzer, Betroffene, Eingangsdaten, Ergebnis, Folgehandlung, Volumen und bekannte Fehler. Trenne den vorgesehenen Zweck eines Produkts vom tatsächlichen internen Einsatz.

### 2. Daten

Prüfe Herkunft, Rechtsgrundlage, Qualität, Aktualität, Zugriff, Aufbewahrung, Löschung und repräsentative Lücken. „Wir haben viele Daten“ ist keine Aussage über Eignung.

### 3. Technik und Sicherheit

Erfasse Systemversion, Integrationen, Datenflüsse, Identitäts- und Rechtekonzept, Verschlüsselung, Secrets, Logging, Monitoring, Updates, Backups, Wiederherstellung und Exit.

### 4. Menschen und Governance

Klar sein müssen Freigabe, Fachprüfung, menschliche Aufsicht, Eskalation, Schulung, Vertretung und Verantwortung. Ein Tool ersetzt keine Zuständigkeit.

### 5. Recht und Wirkung

Prüfe Rollen und Pflichten nach AI Act, DSGVO, Geheimnisschutz, Urheberrecht, Arbeitsrecht, Gleichbehandlung und sektorspezifischem Recht. Nicht jede Pflicht gilt für jeden Use Case.

## Eine nachvollziehbare Bewertungslogik

Verwende je Prüffeld drei Zustände:

- **unbekannt:** keine belastbare Information
- **teilweise belegt:** Information vorhanden, aber unvollständig oder nicht getestet
- **belegt:** aktuelle Quelle, verantwortliche Person und Prüfnachweis vorhanden

Das Ergebnis ist eine Gap-Liste, kein Wettbewerbsscore. Eine unbekannte Antwort ist kein Nullpunkt, sondern ein konkreter Rechercheauftrag.

## Quellenhierarchie

Bevorzuge:

1. geltendes Recht und amtliche Leitlinien
2. technische Primärdokumentation und Verträge des konkreten Dienstes
3. interne Prozess-, System- und Testnachweise
4. reproduzierbare Forschung mit klarer Population und Methode
5. Sekundärberichte nur als Einstieg

Führe für volatile Angaben ein Prüfdatum und einen Auslöser zur erneuten Prüfung.

## Grenzen offenlegen

Jede Bewertung nennt mindestens:

- Population und Auswahlverfahren
- Beobachtungszeitraum
- Definitionen und Ausschlüsse
- fehlende Daten
- mögliche Fehlklassifikationen
- Unterschied zwischen beobachtetem Merkmal und Schlussfolgerung

Aus einer erreichbaren Website folgt keine interne Datenreife. Aus einer Cloud-Domain folgt keine AI-Act-Konformität. Aus einer Umfrage folgt keine technische Wirksamkeit. Methodische Ehrlichkeit beginnt mit diesen Grenzen.
