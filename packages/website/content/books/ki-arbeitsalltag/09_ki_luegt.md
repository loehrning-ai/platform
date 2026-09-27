# Warum KI überzeugend lügt

Ich habe ChatGPT einmal nach einem deutschen Arbeitsrecht-Paragraphen gefragt. Die Antwort zitierte plausibel „§ 47b BDSG, Recht auf KI-Erklärung", und diesen Paragraphen gibt es nicht. In einem Beratungsgespräch wäre das peinlich geworden, in einem Vertrag teuer. Anderen ist genau das mit größeren Folgen passiert.

Im Fall Mata gegen Avianca in New York reichten die Anwälte Schwartz und LoDuca eine Klageschrift mit sechs Gerichtsentscheidungen als Beweisen ein, mit Aktenzeichen, Richternamen und Zitaten. Richter Kevin Castel prüfte nach: Keine der sechs Entscheidungen existierte. Die Richternamen waren real, aber diese Fälle hatten sie nie verhandelt, Aktenzeichen und Zitate waren erfunden.

ChatGPT hatte die Urteile geschrieben, und die Anwälte hatten sie nicht geprüft. Im Juni 2023 verhängte das Gericht 5.000 Dollar Strafe, weil sie das Ergebnis nicht verifiziert hatten.

## Drei Fälle, die du kennen musst

### Fall 1: Mata v. Avianca - Erfundene Urteile

ChatGPT berechnet das wahrscheinlichste nächste Wort. Bei juristischen Zitaten erzeugt es deshalb Text, der wie ein echtes Urteil klingt, ohne ein Konzept von "wahr".

### Fall 2: Samsung, Daten, die nie zurückkommen

Im März 2023 erlaubte Samsung seinen Halbleiter-Ingenieuren, ChatGPT zu nutzen. Innerhalb von 20 Tagen gab es drei separate Datenlecks:

- Proprietärer Quellcode eingegeben
- Meeting-Transkripte eingegeben
- Chip-Test-Sequenzen eingegeben

Alles lag auf den Servern von OpenAI, potenziell in zukünftigen Trainingsdaten und nicht rückholbar. Samsung verbot ChatGPT daraufhin weltweit auf allen Firmengeräten.

### Fall 3: Air Canada, Der Chatbot, der zu viel verspricht

2024 versprach der Chatbot von Air Canada einem Kunden einen Trauerfall-Rabatt, den es in den Richtlinien nicht gab. Air Canada argumentierte vor Gericht, der Chatbot sei eine separate Rechtsperson. Das Gericht entschied, dass Air Canada für die Aussagen des eigenen Tools haftet.

Schadensersatz: rund 812 CAD gesamt (650,88 CAD Schadenersatz, 36,14 CAD Zinsen, 125 CAD Gebühren).

## Die Mechanik dahinter

Ein LLM, ob aus der GPT-, Claude- oder Gemini-Reihe, generiert Text Token für Token als statistisch wahrscheinlichste Fortsetzung. Ob das nächste Wort wahr ist, weiß das System nicht.

Frag „Wer hat die Relativitätstheorie entwickelt?", und „Albert Einstein" ist das wahrscheinlichste Token. Die Antwort stimmt.

Frag „Welche Studie belegt, dass 73 % der deutschen Mittelständler KI nutzen?", und das Modell generiert einen Autorennamen, ein Institut, ein Erscheinungsjahr. Klingt echt, muss aber nicht existieren.

Eine Halluzination klingt plausibel und ist inhaltlich erfunden.

## Was dich das im Alltag kostet

Im Alltag drohen andere Schäden als eine Strafe:

- Du schickst eine Kundenreklamation mit einem Lieferdatum, das Copilot erfunden hat. Der Kunde vertraut dir nicht mehr.
- Dein Quartalsbericht zitiert eine Studie, die nicht existiert. Dein Chef findet es heraus.
- Du erstellst ein Angebot mit einer Rechtsgrundlage, die ChatGPT halluziniert hat. Der Vertrag platzt.

In allen drei Fällen funktioniert die KI wie entworfen, und der Schaden entsteht, weil ein Mensch das Ergebnis ungeprüft übernimmt.

## Drei Arten, wie KI lügt

Im Alltag begegnen dir drei Muster:

**1. Erfundene Rechtsquellen.** Plausibel formatierte Paragraphen und Urteile, die nicht existieren, kommen bei allen großen Modellen vor, besonders bei Nischen-Themen wie deutschem Arbeitsrecht, spezifischen BGB-Stellen und regulatorischen Details.

**2. Erfundene Zitate mit korrekt klingenden Seitenzahlen.** „Peter Drucker schrieb 1973 in *Management: Tasks, Responsibilities, Practices* auf Seite 287 ‚Effizienz ist, die Dinge richtig zu tun; Effektivität ist, die richtigen Dinge zu tun.'" Drucker hat das sinngemäß geschrieben, aber Seitenzahl, Wortlaut und Kapitel sind geraten. Solche Zitate klingen wie aus dem Buch und stehen oft nicht drin.

**3. Fakten leicht daneben.** Ein um ein Jahr verschobenes Datum, ein verwechselter Ort oder ein leicht veränderter Name fällt niemandem auf, weil alles andere stimmt.

Typische Raten in öffentlichen Benchmarks (Vectara Hallucination Leaderboard, Stand 2026): Die führenden Modelle der GPT-, Claude- und Gemini-Reihen liegen bei Zusammenfassungen deutlich unter 5 Prozent Halluzinations-Quote. Bei offenen Fakten-Abfragen ohne Quellenkontext sind die Raten deutlich höher, zweistellige Prozent-Werte sind nicht ungewöhnlich. Je offener die Frage, desto mehr prüfst du.

## Bias, die andere Seite der Halluzination

LLMs spiegeln ihre Trainingsdaten, und die sind voller stereotyper Muster. Frag Claude oder ChatGPT, dir einen Chefarzt zu beschreiben, und du bekommst oft „Er". Frag nach einer Ingenieurin, und du bekommst eine Studie, die schon anders lautet.

Wurden in Millionen Texten mehr Chefärzte männlich beschrieben, bleibt das die wahrscheinlichere Fortsetzung. Du steuerst gegen, im Prompt („neutrale Formulierung, keine Pronomen-Annahme") oder in der Nachbearbeitung.

## Jedes zukünftige Modell wird halluzinieren

Auch zukünftige Modelle der GPT-, Claude- und Gemini-Reihen werden halluzinieren, seltener, aber nie null. Ein System, das alles schreiben kann, schreibt auch Dinge, die nicht stimmen.

Bei Meta lese ich KI-Output gegen, obwohl dort die Leute arbeiten, die die Modelle bauen. Mach das auch.

> **Je überzeugender der KI-Output klingt, desto sorgfältiger prüfst du.** Subtile, plausible Fehler fallen sonst nicht auf.

---

Das nächste Kapitel zeigt die 3-Schritt-Prüfung in 60 Sekunden.
