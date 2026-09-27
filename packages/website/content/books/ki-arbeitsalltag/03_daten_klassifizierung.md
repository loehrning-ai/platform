# Wohin gehen deine Daten wirklich?

Tippst du einen Kundennamen in ChatGPT, landet er auf Servern von OpenAI, einem US-Unternehmen in San Francisco. Es verarbeitet die Daten nach seiner Privacy Policy und nur dann nach DSGVO-Vertrag, wenn dein Unternehmen einen Auftragsverarbeitungsvertrag geschlossen hat.

Bei Apple war Datenklassifizierung Pflicht-Kurs am ersten Tag, lange vor jedem KI-Hype. Jedes Dokument trug ein Label: Public, Internal, Confidential, Restricted. Bei Red Bull fehlte das. In einem Konzern mit 13.000 Mitarbeitenden konnte niemand sagen, wo die Daten liegen, und die ehrliche Antwort lautete: 47 Excel-Tabellen auf Netzlaufwerken.

Deshalb fragst du dich vor jedem Prompt, welche Art Daten du eintippst.

## Das mentale Modell

Statt einer 40-seitigen Richtlinie brauchst du einen Reflex. Jede Information fällt in eine von vier Stufen, von links (harmlos) nach rechts (gefährlich):

**Public → Internal → Confidential → Restricted.**

Je weiter rechts, desto kleiner der Kreis der Menschen, die das sehen dürfen: Public sieht jeder, Restricted fast niemand. Vor jedem Prompt fragst du, wie weit rechts dein Text liegt. Definitionen und Grenzfälle stehen im nächsten Kapitel.

## Die Regel für KI

| Klassifizierung | Kostenlose KI (ChatGPT Free, Claude Free) | Enterprise-KI mit AVV (Copilot, ChatGPT Business, Claude Team) |
|-----------------|---------|---------|
| **Public** | Ja | Ja |
| **Internal** | Vorsicht, frag dein Unternehmen | Ja |
| **Confidential** | Nein | Mit klarer Freigabe |
| **Restricted** | Nein | Nein |

Kundennamen, Preise, Margen und Verträge sind Confidential und gehören nicht in die Free-Version. Passwörter und API-Keys sind Restricted und gehören in kein KI-Tool, auch in kein Enterprise-Tool.

> **Achtung:** Microsoft 365 Copilot kann eine kontrollierte Enterprise-Option sein, wenn IT und Datenschutz die konkrete Tenant-Geografie, Berechtigungen, Verträge und Datenklassen freigegeben haben. Ein vorhandenes M365-Konto allein beweist weder EU-Datenresidenz noch die Zulässigkeit vertraulicher Eingaben. Nicht freigegebene Verbraucherangebote bleiben für vertrauliche Firmendaten ungeeignet.

## Beispiele

### Falsch

> Prompt: „Hilf mir, eine E-Mail an Kunde Alpha zu schreiben. Der Jahreswert beträgt 150.000 Euro und der Rabatt 15 Prozent."

Kundenname, Umsatz und Rabatt sind Confidential, und die Free-KI sieht sie jetzt.

### Richtig

> Prompt: „Entwirf eine Wertschätzungs-E-Mail für einen langjährigen Industriekunden mit Großmengen-Rabatt. Ton: professionell, nicht unterwürfig."

Das Szenario ist generisch, ohne Namen und Zahlen. Die konkreten Daten ergänzt du erst beim Versand in deinem Mail-Client.

## Das unsichtbare Risiko

Gefährlicher als die KI, die deine IT kennt, ist die, von der sie nichts weiß. Ein Online-Tool verspricht „Lade deine Daten hoch, wir analysieren sie kostenlos", du lädst die Kundenliste hoch, und drei Monate später sitzt der Anbieter auf einem Datensatz, den nie jemand freigegeben hat. Das heißt **Shadow AI** (mehr in Kapitel 5).

**Regel:** Frag IT oder Security, bevor du ein neues KI-Tool nutzt. Zwei Minuten Mail sparen dir zwei Wochen Eskalation.

## Checkliste vor jedem Prompt

Bevor du Text in die Free-Version von ChatGPT (oder vergleichbar) kippst:

- [ ] Habe ich Kundennamen, Preise oder Wettbewerbsinfos drin?
- [ ] Habe ich interne Strategien erwähnt?
- [ ] Habe ich Passwörter oder Zugangsdaten eingebaut?
- [ ] Würde mein Unternehmen wollen, dass OpenAI diese Daten sieht?

Bei einer einzigen Ja-Antwort gehört der Text nicht in die Free-Version. Anonymisiere ihn oder nutze die Enterprise-Variante mit AVV.

---

> **Navigation:** Im nächsten Kapitel sehen wir uns die vier Stufen im Detail an, mit Abgrenzungsfragen für den Grenzfall.
