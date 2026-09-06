# Wohin gehen deine Daten wirklich?

Du tippst einen Kundennamen in ChatGPT. Wohin geht dieser Name?

Kurze Antwort: zu OpenAI, nach San Francisco.

Längere Antwort: auf Server eines US-Unternehmens, das deine Daten nach den Regeln seiner Privacy Policy verarbeitet, und nicht nach DSGVO, außer dein Unternehmen hat einen Auftragsverarbeitungsvertrag geschlossen. Welchen du als Mitarbeiter nicht geschlossen hast.

Bei Apple war Datenklassifizierung Pflicht-Kurs am ersten Tag. Jedes Dokument trug ein Label: Public, Internal, Confidential, Restricted. Lange vor jedem KI-Hype, einfach als Hygiene.

Bei Red Bull fehlte das. Ein Konzern mit 13.000 Mitarbeitenden, und niemand konnte sagen, wo unsere Daten liegen. Die ehrliche Antwort lautete: 47 Excel-Tabellen auf Netzlaufwerken.

Erste Grundregel deines KI-Alltags: Bevor du tippst, frag dich, welche Art Daten du da gerade eintippst.

## Das mentale Modell

Du brauchst keine 40-seitige Richtlinie. Du brauchst einen Reflex.

Jede Information, die du in ein KI-Tool tippst, fällt in eine von vier Stufen. Von links (harmlos) nach rechts (gefährlich):

**Public → Internal → Confidential → Restricted.**

Je weiter rechts, desto kleiner der Kreis der Menschen, die das sehen dürfen. Public sieht jeder, Restricted sieht fast niemand. Das ist das ganze Modell. Sitzt die Reihenfolge einmal, erledigt den Rest dein Bauchgefühl.

Die genauen Definitionen, Beispiele und Grenzfälle pro Stufe stehen im nächsten Kapitel. Hier geht es nur um die eine Frage, die du dir vor jedem Prompt stellst: Wie weit rechts liegt das, was ich gerade eintippen will?

## Die Regel für KI

Einfache Entscheidungsmatrix:

| Klassifizierung | Kostenlose KI (ChatGPT Free, Claude Free) | Enterprise-KI mit AVV (Copilot, ChatGPT Business, Claude Team) |
|-----------------|---------|---------|
| **Public** | Ja | Ja |
| **Internal** | Vorsicht, frag dein Unternehmen | Ja |
| **Confidential** | Nein | Mit klarer Freigabe |
| **Restricted** | Nein | Nein |

Vier typische Fälle.

- **Kundennamen** sind Confidential. Nicht in die Free-Version.
- **Preise und Margen** sind Confidential. Nicht in die Free-Version.
- **Verträge** sind Confidential. Nicht in die Free-Version.
- **Passwörter und API-Keys** sind Restricted. Niemals irgendwo hin, auch nicht in Enterprise-Tools.

> **Das Wichtigste:** Microsoft 365 Copilot kann eine kontrollierte Enterprise-Option sein, wenn IT und Datenschutz die konkrete Tenant-Geografie, Berechtigungen, Verträge und Datenklassen freigegeben haben. Ein vorhandenes M365-Konto allein beweist weder EU-Datenresidenz noch die Zulässigkeit vertraulicher Eingaben. Nicht freigegebene Verbraucherangebote bleiben für vertrauliche Firmendaten ungeeignet.

## Beispiele

### Falsch

> Prompt: „Hilf mir, eine E-Mail an Kunde Alpha zu schreiben. Der Jahreswert beträgt 150.000 Euro und der Rabatt 15 Prozent."

Problem: Kundenname, Umsatz, Rabatt, alles Confidential. Die Free-KI sieht es jetzt.

### Richtig

> Prompt: „Entwirf eine Wertschätzungs-E-Mail für einen langjährigen Industriekunden mit Großmengen-Rabatt. Ton: professionell, nicht unterwürfig."

Keine Namen, keine Zahlen, ein generisches Szenario. Die konkreten Daten ergänzt du erst beim Versand, in deinem Mail-Client, nicht im Prompt.

## Das unsichtbare Risiko

Das größte Problem ist nicht die KI, die deine IT kennt. Sondern die, von der sie nichts weiß.

Du findest ein neues KI-Tool online. „Lade deine Daten hoch, wir analysieren sie kostenlos." Du lädst die Kundenliste hoch. Drei Monate später sitzt der Anbieter auf einem Datensatz, den nie jemand freigegeben hat. Dafür gibt es einen Namen, **Shadow AI**, und einen ganzen Abschnitt in Kapitel 5. Merk dir für jetzt nur die Regel:

**Regel:** Frag IT oder Security, bevor du ein neues KI-Tool nutzt. Zwei Minuten Mail spart dir zwei Wochen Eskalation.

## Checkliste vor jedem Prompt

Bevor du Text in die Free-Version von ChatGPT (oder vergleichbar) kippst:

- [ ] Habe ich Kundennamen, Preise oder Wettbewerbsinfos drin?
- [ ] Habe ich interne Strategien erwähnt?
- [ ] Habe ich Passwörter oder Zugangsdaten eingebaut?
- [ ] Würde mein Unternehmen wollen, dass OpenAI diese Daten sieht?

Eine einzige Ja-Antwort? Dann nicht in die Free-Version. Entweder anonymisieren, oder in die Enterprise-Variante mit AVV.

---

> **Navigation:** Im nächsten Kapitel sehen wir uns die vier Stufen im Detail an, mit Abgrenzungsfragen für den Grenzfall.
