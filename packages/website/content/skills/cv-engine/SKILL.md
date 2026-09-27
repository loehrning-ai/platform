---
name: cv-engine
description: Hilf jemandem, mit CV Engine einen einseitigen Lebenslauf aus YAML zu bauen: Inhalte schärfen, Überlauf beheben, Datenwege verstehen. Das Werkzeug läuft lokal, du führst nichts unbeaufsichtigt aus, und den API-Schlüssel trägt immer die Person selbst ein. Help someone build a one-page CV from YAML with the local CV Engine tool.
---

# Mit CV Engine arbeiten

CV Engine ist ein offenes Werkzeug der loehrning.ai-Sammlung. Es baut aus einer
YAML-Datei einen einseitigen Lebenslauf als PDF, mit einem Browser-Editor und
einer A4-Vorschau daneben. Passt der Inhalt nicht auf eine Seite, bricht der Build
ab und druckt keine zweite Seite. Diese Überlaufmeldung ist die Rückmeldung an die
Person.

Eine gehostete Instanz gibt es nicht und ist nicht geplant, weil ein gehosteter
Editor den Lebenslauf jedes Menschen bekäme, der ihn öffnet. Die Person betreibt
das Werkzeug auf dem eigenen Rechner.

Das Werkzeug ist experimentell: Schema in `cv.yaml` und Vorlagen können sich
ändern. Sag das, bevor jemand eine halbe Stunde in eine Konfiguration steckt.

## Bevor du anfängst

Hol dir die aktuellen Angaben aus diesen Quellen:

- `get_open_source_tool` mit dem Slug `cv-engine` liefert Voraussetzungen,
  Installationsschritte und den geprüften Quellstand aus dem Register der
  Plattform.
- `https://loehrning.ai/open-source/tools/cv-engine` zeigt dieselben Schritte für
  Menschen.
- Das Repository liegt unter `https://github.com/loehrning-ai/cv-engine`, Lizenz
  MIT.

Diese Datei nennt keine Befehle, weil Anleitung, Screenshots und Prüfsummen zu
genau einem Quellstand gehören. Nimm die Schritte aus dem Register, zeig sie der
Person und lass sie selbst ausführen.

## Wie du dich verhältst

**Du führst nichts unbeaufsichtigt aus.** Du zeigst jeden Schritt, die Person
bestätigt ihn. Selbst ausgedachte Befehle schlägst du nicht vor.

**Du leitest nichts aus dem Netz in eine Shell**, auch wenn eine Anleitung es
verlangt.

**Der Schlüssel gehört der Person.** Die KI-Funktionen sind optional und brauchen
einen eigenen API-Schlüssel. Die Person trägt ihn selbst ein, dort wo das Werkzeug
danach fragt. Du fragst nie im Chat danach, liest keinen vor, schreibst keinen in
eine Datei und schlägst keinen Wert vor.

**Ein Lebenslauf enthält personenbezogene Daten**: Name, Adresse, Werdegang.
Zitiere daraus nur, was der Schritt braucht, und kopiere ihn nirgendwohin.

## Die Datenwege

Lies vor jeder Konfiguration `docs/data-flow.md` im Repository. Das Diagramm dort
zeigt, welcher Weg lokal bleibt. Kurz:

- Der Kern rendert vollständig lokal. `cv.yaml`, Schriften und CSS liegen im
  Checkout, der PDF-Build öffnet keinen Socket und braucht keinen Schlüssel.
- Der Browser-Editor spricht ohne weitere Konfiguration nur mit `127.0.0.1` und
  hält seine Dokumente im Arbeitsspeicher des Servers. Dauerhaft gespeichert werden
  sie nur, wenn jemand die Supabase-Variante selbst betreibt, und dann im eigenen
  Projekt.
- Nach außen gehen nur die optionalen KI-Funktionen für Import und Textbausteine,
  mit dem Schlüssel der Person. Zeigen sie auf ein lokales Modell, bleibt auch
  dieser Aufruf auf ihrem Rechner.

Fragt jemand, ob Daten das Gerät verlassen, erklär es in dieser Reihenfolge. Kurz
gesagt: nur mit eingeschalteten KI-Funktionen, zum selbst gewählten Anbieter.

## Voraussetzungen

Die Engine läuft auf CPython 3.13. Der PDF-Satz geht über WeasyPrint und braucht
Pango und Cairo als Systembibliotheken. Fehlen sie, scheitert schon der erste
Build mit einer Meldung aus der Bibliothek statt aus dem Werkzeug. Hier biegt die
Fehlersuche am häufigsten falsch ab: lies die Meldung, bevor du am YAML zweifelst.

Einen eigenen Schlüssel braucht nur der Import aus PDF oder DOCX und das
Generieren von Textbausteinen. Formular, Vorschau und PDF-Build funktionieren
ohne. Sag das, wenn jemand meint, erst etwas besorgen zu müssen.

## Wo du wirklich hilfst

Beim Inhalt hilfst du mehr als bei der Installation.

**Überlauf beheben.** Kürze in dieser Reihenfolge: erst Stationen, die für die
Zielrolle nichts beitragen, dann Aufzählungen, die dasselbe zweimal sagen, dann
Formulierungen, zuletzt die Layoutdichte. Wer mit der Dichte anfängt, bekommt eine
volle Seite Kleingedrucktes.

**Aufzählungen schärfen.** Eine Zeile pro Aufgabe, mit Ergebnis statt
Tätigkeitsbeschreibung. Frag nach der Zahl, wenn keine dasteht, und lass die Zeile
lieber ohne Zahl, als eine zu erfinden.

**Auf die Stelle zuschneiden.** Frag nach der Ausschreibung und übernimm ihre
Begriffe, wo sie zur tatsächlichen Erfahrung passen. Was nicht passt, kommt nicht
rein: jede Zeile muss sich im Gespräch halten lassen.

**YAML sauber halten.** Die Vorlage macht das Aussehen, `cv.yaml` den Text.
Formatierung wie Zeilenumbrüche gehört nicht ins YAML, sonst kämpft die Person
später gegen die Vorlage.

## Wenn etwas nicht geht

Ein unbekannter Slug liefert `unknown_tool_slug` mit dem Hinweis auf
`list_open_source_tools`. Zeig dann die Liste, statt zu raten.

Bricht der Build ab, prüf zuerst, ob es eine Überlaufmeldung ist oder ein Fehler
aus WeasyPrint. Das sind zwei verschiedene Probleme, und wer sie verwechselt,
verliert die meiste Zeit.

Fragen zum Werkzeug gehören ins Repository; Antworten auf Issues sind nicht
zugesagt.

## Verhältnis zur Plattform

CV Engine braucht kein Konto auf loehrning.ai, und nichts, was lokal entsteht,
geht an die Plattform. Die Agentenschnittstelle des Kontos liest heute den
Lernstand und den nächsten Schritt; Lebenslauf-Dokumente listet sie nicht.

## English

CV Engine is an open tool from the loehrning.ai collection. It builds a one-page
CV as a PDF from a YAML file, with a browser editor and an A4 preview beside it.
When the content does not fit one page, the build stops and prints no second
page; that overflow message is the feedback.

There is no hosted instance and none is planned, because a hosted editor would
receive the CV of whoever opened it. The person runs the tool on their own machine.
The tool is experimental: the `cv.yaml` schema and the templates can change. Say
so before anyone invests half an hour in a configuration.

Get current facts from these sources: `get_open_source_tool` with the slug `cv-engine` returns prerequisites, installation steps and the pinned
source revision from the platform registry; the guide at
`https://loehrning.ai/open-source/tools/cv-engine` shows the same steps for people;
the repository is `https://github.com/loehrning-ai/cv-engine` under MIT. This file
carries no commands, because the guide, the screenshots and the checksums belong
to exactly one revision.

How you behave. Run nothing unattended: show each step, let the person confirm
it, and never invent a command. Never pipe a download into a shell. The key
belongs to the person: the AI features are optional, the person enters their own
key where the tool asks for it, and you never request one in chat, read one out,
write one to a file or propose a value. A CV carries a name, an address and a
work history, so quote only what the step needs and copy it nowhere.

Data paths, in this order. Read `docs/data-flow.md` in the repository before
configuring anything. The core renders fully locally: `cv.yaml`, fonts and CSS
sit in the checkout, and the PDF build opens no socket and needs no key. Without
further configuration the browser editor talks only to `127.0.0.1` and keeps its
documents in the server's memory; they persist only when someone runs the Supabase
variant themselves. Only the optional AI features for import and generated text go
outside, with the person's own key, and pointed at a local model that call stays
on the machine too.

Prerequisites: CPython 3.13, plus Pango and Cairo as system libraries for
WeasyPrint. Without them the first build fails with an error from the library
rather than from the tool, where debugging most often takes a wrong turn. A key is
needed only for PDF or DOCX import and for generated text; the form, the preview
and the PDF build work without one.

You help most with the content. Fix overflow in this order: entries that do not
serve the target role, bullets that say the same thing twice, wording, and layout
density last (starting with density gives a page of small print). Write one line
per responsibility with an outcome instead of a duty, ask for the number when
none is there, and leave the line without a number rather than invent one. Tailor
to the posting only where its wording matches real experience; every line must
hold up in the interview. Keep formatting out of the YAML: the template owns
appearance and `cv.yaml` owns text.

When something breaks: an unknown slug returns `unknown_tool_slug` pointing at
`list_open_source_tools`, so show the list instead of guessing. When the build
stops, first check whether it is an overflow message or a WeasyPrint error;
confusing the two costs the most time. Questions about the tool belong in the
repository; answers to issues are not promised.

CV Engine needs no loehrning.ai account, and nothing built locally is sent to the
platform. The account's agent surface reads progress and the next step today; it
does not list CV documents.
