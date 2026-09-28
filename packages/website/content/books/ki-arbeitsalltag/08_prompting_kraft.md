# Prompting: Von der Anfrage zum Ergebnis

Sagst du einem neuen Mitarbeiter am ersten Tag nur "Mach mal was", liefert er irgendetwas, aber nicht das, was du wolltest. So nutzen 90 Prozent der Leute ChatGPT.

## Prompt A vs. Prompt B

**Prompt A:** "Schreib mir einen LinkedIn-Post."

Der Output ist generisch und voller Floskeln und Buzzwords, jeder Satz klingt wie aus dem Lehrbuch.

**Prompt B:**

```
Kontext: Ich bin selbstständiger IT-Berater. Ich habe gestern
bei der IHK Düsseldorf einen Vortrag gehalten. 40 Teilnehmer,
80 Prozent Geschäftsführer. Thema: KI-Readiness im Mittelstand.
Rolle: Erfahrener LinkedIn-Copywriter.
Aufgabe: Schreibe einen Post über den Vortrag. Zielgruppe:
Geschäftsführer und Berater.
Format: 150-200 Wörter. Hook in der ersten Zeile. 3 Key
Takeaways als Aufzählung. CTA am Ende.
Ton: Professionell aber persönlich. Keine Buzzwords. Nicht
verkäuferisch.
```

Output: „40 Geschäftsführer, 90 Minuten, und eine Frage, die keiner beantworten konnte." Konkret, persönlich, ohne Nachbearbeitung postbar.

30 Sekunden mehr Arbeit am Prompt ergeben ein deutlich besseres Ergebnis.

## Die KRAFT-Methode

KRAFT hat fünf Buchstaben, in dieser Reihenfolge.

**K, Kontext:** Wer bist du, wie ist die Situation, und was muss die KI wissen, um die Aufgabe zu verstehen? Je konkreter, desto besser, etwa „ich verantworte B2B-Leadgenerierung für einen Maschinenbauer mit 80 Mitarbeitenden, Zielregion DACH" statt „ich arbeite im Marketing".

**R, Rolle:** Welche Expertise soll die KI einnehmen? „Du bist erfahrener Texter" produziert anderen Output als „Du bist Datenschutz-Berater mit 15 Jahren Erfahrung in der Industrie." Die Rolle stellt Stil, Fachsprache und Perspektive scharf.

**A, Aufgabe:** Was genau soll passieren? Nenne Verb, Objekt und Ziel, etwa „Fasse die drei Kernaussagen des folgenden Papers in einem Blogpost für Nicht-Techniker zusammen" statt „Schreib was über KI".

**F, Format:** Wie soll das Ergebnis aussehen? E-Mail, Aufzählung, Tabelle, Code-Block, 100 Wörter oder 500, mit Überschriften oder ohne. Ohne Format-Angabe bekommst du einen Essay, wo du eine Mail wolltest.

**T, Ton:** Wie soll es klingen? Sachlich, locker, empathisch, knapp, formal. Der Ton entscheidet, ob der Empfänger die Antwort liest oder löscht.

Nicht jeder Prompt braucht alle fünf. „Übersetze diesen Satz" braucht kein KRAFT. „Schreib ein Angebot für einen Neukunden" schon. Sobald die Aufgabe Tragweite hat, gehst du einmal K → R → A → F → T durch.

## Die Restaurant-Analogie

Im Restaurant bestellst du "den Lachs, medium, mit Reis, ohne Soße" statt "Bring mir Essen". Genauso konkret bestellst du bei der KI.

## Die 10 häufigsten Fehler

1. **Zu vage.** "Schreib was über KI" → KRAFT nutzen.
2. **Zu lang.** 3 Seiten Prompt. Sweet Spot: 50-200 Wörter.
3. **Keine Rolle.** Ohne Rolle: generischer Output. Mit Rolle: Spezialisten-Expertise.
4. **Kein Format.** Du bekommst einen Essay statt einer E-Mail.
5. **Erste Antwort akzeptieren.** Die erste Antwort ist der Rohentwurf, 3-5 Runden Feedback verbessern sie deutlich.
6. **Vertrauliche Daten eingeben.** Nutze für Übungen „Kunde Alpha (fiktiv), Maschinenbau, fiktive Umsatzbandbreite" und prüfe auch indirekte Re-Identifizierbarkeit.
7. **Output nicht prüfen.** KI halluziniert Zahlen, Quellen, Gesetze. (Dazu mehr im nächsten Kapitel.)
8. **Falsche Erwartungen.** KI liefert 80 % Entwurf. Deine Expertise liefert die letzten 20 %.
9. **Immer dasselbe Tool.** Nicht jede Aufgabe passt zu ChatGPT.
10. **Prompts nicht speichern.** Bau dir eine Bibliothek getesteter Prompts.

## Ein kompletter KRAFT-Prompt

Situation: Du musst eine Reklamation beantworten. Die Firma Bergmann beschwert sich über eine 8 Tage verspätete Lieferung. Bestellnummer HB-2026-0412.

```
Kontext: Ich bin Sachbearbeiterin im Kundenservice eines
mittelständischen Zulieferers. Kunde ist Firma Bergmann,
langjährige Geschäftsbeziehung.
Rolle: Erfahrener Kundenservice-Texter.
Aufgabe: Antworte professionell auf diese Reklamation.
Format: Maximal 150 Wörter.
Ton: Verständnisvoll aber sachlich. Biete eine Lösung an,
mache keine Zusagen ohne Rücksprache mit dem Vertrieb.
```

Die kritische Leitplanke ist "keine Zusagen ohne Rücksprache", denn KI bietet ungefragt Rabatte, Express-Versand und Erstattungen an.

## Drei weitere KRAFT-Prompts

Die folgenden Vorlagen passt du an deine Situation an.

**Meeting-Zusammenfassung aus Transkript:**

> **Prompt-Vorlage:**
> Kontext: Teams-Meeting mit Vertrieb und Produktmanagement, 60 Minuten, Thema Q1-Roadmap. Transkript liegt unten.
> Rolle: Erfahrene Referentin, die präzise Protokolle schreibt.
> Aufgabe: Fasse das Meeting zusammen mit Entscheidungen, offenen Punkten und To-dos mit Verantwortlichen.
> Format: Kurze Einleitung (max. 3 Sätze), danach drei Abschnitte „Entscheidungen" / „Offene Punkte" / „To-dos (Name, Deadline)" als Aufzählungen.
> Ton: Sachlich, knapp, protokollarisch.

**Excel-Analyse als Interpretation:**

> **Prompt-Vorlage:**
> Kontext: Du bekommst unten eine Tabelle mit Quartalsumsätzen von vier Produkten über vier Quartale. Alle Zahlen in TEUR.
> Rolle: Senior Business Analyst mit Fokus auf Vertriebsdaten.
> Aufgabe: Identifiziere das stärkste Produkt, den größten Rückgang und zwei Handlungsempfehlungen. Nenne die Rechenbasis für jeden Prozentwert.
> Format: Drei kurze Absätze (Highlight, Risiko, Empfehlung) plus eine Tabelle mit Veränderung in Prozent je Produkt.
> Ton: Nüchtern, keine Werbesprache.

**Angebot für Bestandskunde:**

> **Prompt-Vorlage:**
> Kontext: Du schreibst für einen IT-Dienstleister mit 12 Mitarbeitenden. Kunde ist ein Bestandskunde aus dem Maschinenbau, Rahmenvertrag seit 2021. Anfrage: Ausbau der Fileserver-Umgebung.
> Rolle: Erfahrener Vertriebstexter im B2B.
> Aufgabe: Schreibe den Begleittext zum Angebot, keinen Preis, nur Rahmen, Nutzen, Nächste Schritte.
> Format: 180-220 Wörter. Anrede, drei kurze Absätze, Schlussformel. Keine Aufzählungen.
> Ton: Vertrauensvoll, verbindlich, ohne Floskeln wie „innovative Lösungen".

KRAFT funktioniert genauso für Kampagnen, Web-Texte und Konzepte. Ohne diese Struktur liefert die KI Floskeln statt eines Konzepts, das du dem Kunden zeigen kannst.

**Kampagnenkonzept aus einem Briefing:**

> **Prompt-Vorlage:**
> Kontext: Du arbeitest im Marketing eines regionalen Bio-Getränkeherstellers, 60 Mitarbeitende, Vertrieb in Süddeutschland. Neues Produkt: eine zuckerfreie Limonade für die Generation 25 bis 40. Budget klein, Kanäle vor allem Instagram und Plakat.
> Rolle: Erfahrene Kreativdirektorin mit Fokus auf Food- und Getränkemarken.
> Aufgabe: Entwickle drei Kampagnenkonzepte. Pro Konzept eine Leitidee, ein Claim, der Bildtenor und der konkrete erste Instagram-Post.
> Format: Drei nummerierte Blöcke. Je Block: Leitidee in einem Satz, Claim, zwei Sätze Bildtenor, ein fertiger Post-Text mit maximal 280 Zeichen.
> Ton: Frisch, jung, regional verwurzelt. Kein Marketing-Sprech, keine austauschbaren Buzzwords wie „Lifestyle" oder „Genussmoment".

Lies die drei Vorschläge laut vor und nimm den Claim, der hängen bleibt. Deshalb lässt du dir drei geben.

Für Web-Copy gibst du der KI deinen alten Text mit, sagst, was dich stört, und lässt drei Varianten liefern. Du wählst aus und schärfst nach.

> **Achtung:** Lass dir bei Bildern und Claims nie etwas „erfinden", das es nicht gibt. KI behauptet gern Auszeichnungen, Testsiege oder Bio-Siegel. Prüf jede Aussage, bevor sie auf ein Plakat kommt.

## Fortgeschrittene Techniken

**Chain-of-Thought:** Füge "Denke Schritt für Schritt nach, bevor du antwortest" hinzu. Das verbessert Antworten bei Strategien, Analysen und Entscheidungen.

**Few-Shot Learning:** Gib der KI 2-3 Beispiele deines Schreibstils. "Hier sind drei E-Mails, die ich geschrieben habe. Schreibe die nächste im gleichen Stil." Funktioniert für E-Mails, Angebote, Posts.

**Iteration:** Den Rohentwurf verbesserst du in 3-5 Runden mit Anweisungen wie "Mach den Ton sachlicher", "Kürze auf 100 Wörter" oder "Ersetze den letzten Absatz durch einen CTA".

> **Tipp:** Speichere deine besten Prompts in einer Datei. Nach 50 Prompts hast du eine Sammlung, die dein ganzes Team nutzen kann.

---

Das nächste Kapitel erklärt, warum KI lügt und warum sich das nicht einfach patchen lässt.
