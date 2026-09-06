# Warum KI überzeugend lügt

Ich habe ChatGPT mal nach einem deutschen Arbeitsrecht-Paragraphen gefragt. Die Antwort zitierte „§ 47b BDSG, Recht auf KI-Erklärung". Klang plausibel, ich war fast überzeugt.

Einziges Problem: Diesen Paragraphen gibt es nicht. Erfunden, und zwar überzeugend.

Hätte ich das in einem Beratungsgespräch zitiert, wäre es peinlich geworden. Hätte ich es in einen Vertrag gepackt, wäre es teuer geworden. Genau das ist passiert, an anderen Stellen, mit anderen Menschen, mit größeren Folgen.

Mata gegen Avianca, New York. Im Juni 2023 verhängt das Gericht die Strafe.

Die Anwälte Schwartz und LoDuca hatten zuvor eine Klageschrift eingereicht. Sechs Gerichtsentscheidungen als Beweise. Aktenzeichen, Richternamen, Zitate, alles sauber formatiert.

Richter Kevin Castel überprüft. Keine der sechs Entscheidungen existiert. Null.

Die Richternamen sind real, aber sie haben diese Fälle nie verhandelt. Die Aktenzeichen klingen plausibel und sind erfunden. Die Zitate lesen sich überzeugend, aus Urteilen, die es nie gab.

ChatGPT hat sie geschrieben. Die Anwälte haben nicht geprüft.

Strafe: 5.000 Dollar. Nicht weil sie KI genutzt haben. Sondern weil sie das Ergebnis nicht verifiziert haben.

## Drei Fälle, die du kennen musst

### Fall 1: Mata v. Avianca - Erfundene Urteile

Was passiert ist, hast du gerade gelesen.

Warum es passiert ist: ChatGPT berechnet das wahrscheinlichste nächste Wort. Für juristische Zitate heißt das, es erzeugt Text, der wie ein echtes Urteil klingt, weil echte Urteile genau so klingen. Es hat kein Konzept von "wahr", nur Wahrscheinlichkeiten.

### Fall 2: Samsung, Daten, die nie zurückkommen

März 2023. Samsung erlaubt seinen Halbleiter-Ingenieuren, ChatGPT zu nutzen. Innerhalb von 20 Tagen: drei separate Datenlecks.

- Proprietärer Quellcode eingegeben
- Meeting-Transkripte eingegeben
- Chip-Test-Sequenzen eingegeben

Alles auf den Servern von OpenAI. Potenziell in zukünftigen Trainingsdaten, nicht rückholbar.

Ergebnis: Samsung verbietet ChatGPT auf allen Firmengeräten. Weltweit.

### Fall 3: Air Canada, Der Chatbot, der zu viel verspricht

2024. Der Chatbot von Air Canada verspricht einem Kunden einen Trauerfall-Rabatt. Diesen Rabatt gibt es in den Richtlinien gar nicht.

Air Canada argumentiert vor Gericht: "Der Chatbot ist eine separate Rechtsperson."

Das Gericht: Nein. Air Canada haftet für die Aussagen des eigenen Tools.

Schadensersatz: rund 812 CAD gesamt (650,88 CAD Schadenersatz, 36,14 CAD Zinsen, 125 CAD Gebühren).

## Die Mechanik dahinter

Halluzination ist kein Bug, der gepatcht wird.

Ein LLM, ob aus der GPT-, Claude- oder Gemini-Reihe, generiert Text Token für Token. Jedes Token ist die statistisch wahrscheinlichste Fortsetzung. Das System weiß nicht, ob das nächste Wort wahr ist. Es weiß nur, ob es wahrscheinlich ist.

Frag „Wer hat die Relativitätstheorie entwickelt?", und „Albert Einstein" ist das wahrscheinlichste Token. Die Antwort stimmt.

Frag „Welche Studie belegt, dass 73 % der deutschen Mittelständler KI nutzen?", und das Modell generiert einen Autorennamen, ein Institut, ein Erscheinungsjahr. Klingt echt, muss aber nicht existieren.

Das ist Halluzination: plausibel klingend, überzeugend formuliert, inhaltlich erfunden.

## Was dich das im Alltag kostet

Nicht 5.000 Dollar Strafe. Vielleicht Schlimmeres:

- Du schickst eine Kundenreklamation mit einem Lieferdatum, das Copilot erfunden hat. Der Kunde vertraut dir nicht mehr.
- Dein Quartalsbericht zitiert eine Studie, die nicht existiert. Dein Chef findet es heraus.
- Du erstellst ein Angebot mit einer Rechtsgrundlage, die ChatGPT halluziniert hat. Der Vertrag platzt.

In allen drei Fällen hat die KI genau so funktioniert, wie sie entworfen wurde. Der Schaden entstand, weil ein Mensch das Ergebnis ungeprüft übernommen hat.

## Drei Arten, wie KI lügt

Halluzinationen sind nicht alle gleich. Drei Muster, die dir im Alltag begegnen:

**1. Erfundene Rechtsquellen.** Paragraphen, Urteile, Gerichtsentscheidungen, plausibel formatiert und trotzdem nicht existent. Kommt bei allen großen Modellen vor. Besonders häufig bei Nischen-Themen (deutsches Arbeitsrecht, spezifische BGB-Stellen, regulatorische Details).

**2. Erfundene Zitate mit korrekt klingenden Seitenzahlen.** „Peter Drucker schrieb 1973 in *Management: Tasks, Responsibilities, Practices* auf Seite 287: ‚Effizienz ist, die Dinge richtig zu tun; Effektivität ist, die richtigen Dinge zu tun.'" Drucker hat das sinngemäß geschrieben, aber die Seitenzahl, der Wortlaut, das Kapitel sind Raten. Du bekommst ein Zitat, das klingt wie aus dem Buch. Und oft nicht drinsteht.

**3. Fakten leicht daneben.** Datum um ein Jahr verschoben, Ort verwechselt, Name leicht verändert. Die Art Fehler, die niemandem auffällt, weil alles andere stimmt.

Typische Raten in öffentlichen Benchmarks (Vectara Hallucination Leaderboard, Stand 2026): Die führenden Modelle der GPT-, Claude- und Gemini-Reihen liegen bei Zusammenfassungen deutlich unter 5 Prozent Halluzinations-Quote. Bei offenen Fakten-Abfragen ohne Quellenkontext sind die Raten deutlich höher, zweistellige Prozent-Werte sind nicht ungewöhnlich. Je offener die Frage, desto mehr prüfst du.

## Bias, die andere Seite der Halluzination

Halluzination ist ein Problem. Bias ist das andere.

LLMs spiegeln ihre Trainingsdaten. Und Trainingsdaten sind, bei aller Milliarden-Skala, voller stereotyper Muster. Frag Claude oder ChatGPT, dir einen Chefarzt zu beschreiben, und du bekommst oft „Er". Frag nach einer Ingenieurin, und du bekommst eine Studie, die schon anders lautet.

Das ist keine böse Absicht, das ist Statistik. Wenn in Millionen Texten mehr Chefärzte männlich beschrieben wurden, bleibt das die wahrscheinlichere Fortsetzung. Deine Aufgabe: Bias erkennen und gegensteuern. Entweder im Prompt („neutrale Formulierung, keine Pronomen-Annahme") oder in der Nachbearbeitung.

## Jedes zukünftige Modell wird halluzinieren

Die GPT-, Claude-, Gemini-Reihen werden weiter halluzinieren. Jedes zukünftige Modell wird halluzinieren. Seltener, aber nie null.

Das ist keine Schwäche, die man repariert. Es ist der Preis für ein System, das alles schreiben kann, einschließlich der Dinge, die nicht stimmen.

Bei Meta vertraue ich KI-Output nicht blind, und dort arbeiten Leute, die die Modelle selbst gebaut haben. Wenn die jede Antwort gegenlesen, solltest du es auch tun.

> **Das Wichtigste:** Je überzeugender der KI-Output klingt, desto sorgfältiger musst du prüfen. Offensichtliche Fehler fallen auf. Subtile, plausible Fehler kosten dich.

---

Im nächsten Kapitel: Die 3-Schritt-Prüfung, 60 Sekunden, die dich vor dem Schlimmsten schützen.
