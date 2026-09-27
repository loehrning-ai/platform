# Die vier Stufen der Datenklassifizierung im Detail

Dieses Kapitel ist die Langfassung der vier Stufen aus Kapitel 3. Pro Stufe findest du Definition, Beispiele, KI-Regel und Beispiel-Prompts zum Nachschlagen im Grenzfall.

## Stufe 1: Public

**Definition:** Alles, was öffentlich zugänglich ist oder sein darf.

**Beispiele:**

- Unternehmens-Website
- Pressemitteilungen
- Öffentliche Preislisten
- Dein Name und Jobtitel (steht ohnehin auf LinkedIn)

**Regel für KI:** Überall einsetzbar, auch in der Free-Version von ChatGPT.

**Beispiel-Prompt:**

> „Schreibe einen Blogpost über Machine Learning für einen produzierenden Mittelständler."

Das ist in Ordnung, weil keine firmeninternen Infos drinstehen.

## Stufe 2: Internal

**Definition:** Infos, die jeder im Haus kennen darf und sollte, die extern aber nichts zu suchen haben.

**Beispiele:**

- Unternehmens-Richtlinien
- Organigramm
- Interne Schulungsmaterialien
- Interne Newsletter
- HR-Leitlinien (allgemeine Version)

**Regel für KI:** In Enterprise-Tools mit AVV (Copilot, ChatGPT Business, Claude Team) erlaubt. In der Free-Version nur mit ausdrücklicher Zustimmung deines Unternehmens, und selbst dann besser nicht.

**Beispiel-Prompt:**

> „Unsere IT-Policy sagt, dass Mitarbeitende ihre Notebooks verschlüsseln müssen. Schreib eine Erinnerungs-Mail für mein Team."

Im Grenzfall fragst du, ob OpenAI die Policy sehen und daraus womöglich Trainingsdaten machen darf. Ohne AVV eher nicht.

## Stufe 3: Confidential

**Definition:** Sensible Infos, die nur sehen sollte, wer sie wirklich braucht.

**Beispiele:**

- Kundennamen und -kontakte
- Verträge (auch die „normalen")
- Preislisten
- Strategische Pläne
- Finanzdaten (Umsatz, Kosten, Margen)
- Mitarbeiterlisten inklusive Rollen
- Interne Probleme und Schwachstellen

**Regel für KI:** Nicht in die Free-Version externer Tools. In Enterprise-Varianten mit AVV nur mit klarer Freigabe und passender Klassifizierung im Tool selbst.

**Beispiel (falsch):**

> „Unser Kunde Alpha macht 30 Prozent unseres Umsatzes. Welche Fragen müssen wir prüfen, bevor wir Unterstützungsmaßnahmen ableiten?"

Kundenname und Umsatzabhängigkeit sind beide Confidential.

**Beispiel (richtig):**

> „Ein Kunde macht rund 30 Prozent unseres Umsatzes. Wir möchten ihn besser unterstützen. Welche Ideen hast du?"

Das Szenario ist generisch, und die KI hilft trotzdem.

> **Achtung:** Auch „nur der eine Kundenname", mit dem die Antwort besser klingt, ist ein Verstoß. Free-ChatGPT kann Daten für Training nutzen, solange du Opt-out nicht aktiv gesetzt hast.

## Stufe 4: Restricted

**Definition:** Die höchste Stufe, nur für Menschen mit ausdrücklicher, oft schriftlicher und namentlicher Freigabe.

**Beispiele:**

- Passwörter und API-Keys
- Verschlüsselungsschlüssel
- Besondere Kategorien personenbezogener Daten (Gesundheit, Religion, sexuelle Orientierung, ethnische Herkunft, Art. 9 DSGVO)
- Kontonummern und Finanz-Credentials
- Geheime Verträge oder Patente
- M&A-Pläne, interne Due-Diligence-Dokumente

**Regel für KI:** Niemals, auch nicht in Enterprise-Varianten, außer mit eigenem Freigabeprozess.

**Beispiel (niemals):**

> „Mein AWS-Passwort ist Xy7!@zQ$. Wie generiere ich daraus einen sicheren Token?"

Allein das Eingeben des Passworts ist ein Security-Incident, unabhängig von der KI.

## Konsequenzen im Überblick

| Stufe | Typische Beispiele | Wo darf KI rennen? | Was passiert bei Verstoß? |
|-------|-------------------|---------------------|---------------------------|
| Public | Website, PR, Katalog | Überall | Nichts |
| Internal | Policies, Organigramm | Enterprise mit AVV | Imageschaden, interne Rüge |
| Confidential | Kundennamen, Preise, Verträge | Enterprise mit AVV + Freigabe | DSGVO-Verstoß, Wettbewerbsschaden, Abmahnung |
| Restricted | Passwörter, M&A, Art. 9 DSGVO | Niemals | Datenschutzvorfall, Bußgeld, Kündigung |

## Vier Abgrenzungsfragen

Bist du unsicher, fragst du der Reihe nach:

1. **Darf diese Info auf unserer Website stehen?** Nein → nicht Public.
2. **Würde es der Konkurrenz helfen, wenn sie es wüsste?** Ja → mindestens Confidential.
3. **Würde ein Datenleak als „Diebstahl" oder „Skandal" wirken?** Ja → Confidential oder Restricted.
4. **Müsste ich normalerweise vorher fragen, bevor ich das weitergebe?** Ja → mindestens Confidential.

## Dein Unternehmen kann abweichen

Die vier Stufen sind Standard nach ISO 27001 und in den meisten großen Unternehmen üblich. Dein Arbeitgeber kann trotzdem:

- Confidential in „Confidential" und „Highly Confidential" aufteilen
- Die Stufen anders nennen (Level 1 bis 4, oder Rot/Gelb/Grün)
- Zusätzliche Regeln haben („Kundennamen sind bei uns immer Confidential, egal was")

> **Tipp:** Frag deine IT- oder Compliance-Abteilung nach der aktuellen Klassifizierungs-Tabelle. Die existiert in 95 Prozent der Unternehmen ab 50 Mitarbeitenden.

## Checkliste

Bevor du Daten irgendwo reinkippst:

- [ ] Ich kenne die Klassifizierung meines Unternehmens
- [ ] Ich weiß, in welche der vier Stufen diese konkreten Daten fallen
- [ ] Ich weiß, wo die Daten landen (Free-KI, Enterprise-KI, lokales Tool)
- [ ] Die Kombination aus Stufe und Ziel ist erlaubt

---

> **Navigation:** Im nächsten Kapitel geht es um die juristische Grundlage: DSGVO, AVV, Art. 4 EU AI Act, und was Shadow AI damit zu tun hat.
