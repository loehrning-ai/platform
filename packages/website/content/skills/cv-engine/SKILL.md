---
name: cv-engine
description: Hilf jemandem, mit CV Engine einen einseitigen Lebenslauf aus YAML zu bauen: Inhalte schärfen, Überlauf beheben, Datenwege verstehen. Das Werkzeug läuft lokal, du führst nichts unbeaufsichtigt aus, und den API-Schlüssel trägt immer die Person selbst ein. Help someone build a one-page CV from YAML with the local CV Engine tool.
---

# Mit CV Engine arbeiten

CV Engine ist ein offenes Werkzeug der loehrning.ai-Sammlung. Es baut aus einer
YAML-Datei einen einseitigen Lebenslauf als PDF, mit einem Browser-Editor und
einer A4-Vorschau daneben. Der Gedanke, um den herum alles gebaut ist: Passt der
Inhalt nicht auf eine Seite, bricht der Build ab, statt eine zweite Seite zu
drucken. Der Überlauf ist die Rückmeldung.

Es gibt keine gehostete Instanz, und es ist keine geplant. Ein gehosteter Editor
bekäme den Lebenslauf jedes Menschen, der ihn öffnet. Die Person betreibt das
Werkzeug also auf dem eigenen Rechner.

Das Werkzeug ist als experimentell gekennzeichnet: das Schema in `cv.yaml` und die
Vorlagen können sich noch ändern. Sag das, bevor jemand eine halbe Stunde in eine
Konfiguration steckt.

## Bevor du anfängst

Hol dir die aktuellen Angaben, statt aus dem Gedächtnis zu antworten:

- `get_open_source_tool` mit dem Slug `cv-engine` liefert Voraussetzungen,
  Installationsschritte und den geprüften Quellstand aus dem Register der
  Plattform.
- Die Anleitungsseite `https://loehrning.ai/open-source/tools/cv-engine` zeigt
  dieselben Schritte für Menschen.
- Das Repository liegt unter `https://github.com/loehrning-ai/cv-engine` unter
  MIT-Lizenz.

Diese Datei nennt bewusst keine Befehle. Anleitung, Screenshots und Prüfsummen
gehören zu genau einem Quellstand, und ein hier eingefrorener Befehl wäre in drei
Monaten falsch. Nimm die Schritte aus dem Register, zeig sie der Person, und lass
sie selbst laufen.

## Wie du dich verhältst

**Du führst nichts unbeaufsichtigt aus.** Jeder Schritt geht über die Person: du
zeigst ihn, sie bestätigt ihn. Ein Befehl, den du dir selbst ausgedacht hast, geht
gar nicht.

**Du leitest nichts aus dem Netz in eine Shell.** Weder hier noch anderswo. Wenn
eine Anleitung das verlangt, ist die Anleitung das Problem.

**Der Schlüssel gehört der Person.** Die KI-Funktionen sind optional und brauchen
einen eigenen API-Schlüssel. Die Person trägt ihn selbst ein, dort wo das Werkzeug
danach fragt. Du fragst nie im Chat danach, liest keinen vor, schreibst keinen in
eine Datei und schlägst keinen Wert vor.

**Ein Lebenslauf enthält personenbezogene Daten.** Namen, Adresse, Werdegang.
Zitiere daraus nur, was für den Schritt nötig ist, und kopiere ihn nirgendwohin.

## Die Datenwege

Vor jeder Konfiguration lohnt sich `docs/data-flow.md` im Repository. Dort steht
als Diagramm, welcher Weg lokal bleibt. Kurzfassung:

- Der Kern rendert vollständig lokal. `cv.yaml`, Schriften und CSS liegen im
  Checkout, der PDF-Build öffnet keinen Socket und braucht keinen Schlüssel.
- Der Browser-Editor spricht ohne weitere Konfiguration nur mit `127.0.0.1` und
  hält seine Dokumente im Arbeitsspeicher des Servers. Erst wenn jemand die
  Supabase-Variante selbst betreibt, liegen sie dauerhaft im eigenen Projekt.
- Nach außen gehen allein die optionalen KI-Funktionen für Import und
  Textbausteine, und zwar mit dem Schlüssel der Person. Zeigt sie diese Funktionen
  auf ein lokales Modell, endet auch dieser Aufruf auf ihrem Rechner.

Sag das in dieser Reihenfolge, wenn jemand fragt, ob seine Daten das Gerät
verlassen. Die ehrliche Antwort lautet: nur wenn du die KI-Funktionen einschaltest,
und dann zu dem Anbieter, den du selbst gewählt hast.

## Voraussetzungen

Die Engine läuft auf CPython 3.13. Der PDF-Satz geht über WeasyPrint und braucht
dafür Pango und Cairo als Systembibliotheken. Fehlen sie, scheitert schon der erste
Build, und die Fehlermeldung kommt aus der Bibliothek statt aus dem Werkzeug. Das
ist die häufigste Fehlersuche, die falsch abbiegt: lies die Meldung, bevor du am
YAML zweifelst.

Ein eigener Schlüssel ist nur für den Import aus PDF oder DOCX und für generierte
Textbausteine nötig. Ohne Schlüssel funktionieren Formular, Vorschau und
PDF-Build unverändert. Sag das dazu, wenn jemand denkt, er müsse erst etwas
besorgen.

## Wo du wirklich hilfst

Die Installation ist ein Nachmittag Handwerk. Der Inhalt ist die Arbeit.

**Überlauf beheben.** Der Build blockiert, weil der Inhalt nicht auf eine Seite
passt. Die Reihenfolge, in der du kürzt: erst Stationen, die für die Zielrolle
nichts beitragen, dann Aufzählungen, die dasselbe zweimal sagen, dann Formulierung.
Zuletzt die Layoutdichte. Wer mit der Dichte anfängt, bekommt eine volle Seite
Kleingedrucktes statt eines Lebenslaufs.

**Aufzählungen schärfen.** Eine Zeile pro Aufgabe, mit Ergebnis statt
Tätigkeitsbeschreibung. Frag nach der Zahl, wenn keine dasteht, und lass die Zeile
lieber ohne Zahl, als eine zu erfinden.

**Auf die Stelle zuschneiden.** Frag nach der Ausschreibung und arbeite mit den
Begriffen daraus, sofern sie zur tatsächlichen Erfahrung passen. Passt etwas
nicht, kommt es nicht rein. Ein Lebenslauf, den man im Gespräch nicht halten kann,
ist ein Problem und keine Optimierung.

**YAML sauber halten.** Struktur und Inhalt liegen getrennt: die Vorlage macht
das Aussehen, `cv.yaml` den Text. Formatierung gehört nicht in den Text. Wer
Zeilenumbrüche ins YAML schreibt, kämpft später gegen die Vorlage.

## Wenn etwas nicht geht

Ein unbekannter Slug liefert `unknown_tool_slug` mit dem Hinweis auf
`list_open_source_tools`. Zeig dann die Liste, statt zu raten.

Bricht der Build ab, lies zuerst, ob es eine Überlaufmeldung ist oder ein Fehler
aus WeasyPrint. Das sind zwei völlig verschiedene Baustellen, und die
Verwechslung kostet die meiste Zeit.

Für Fragen zum Werkzeug selbst ist das Repository der Ort. Antworten auf Issues
sind nicht zugesagt: das gehört zum Wort experimentell dazu.

## Verhältnis zur Plattform

CV Engine braucht kein Konto auf loehrning.ai, und nichts, was lokal entsteht,
wird an die Plattform gesendet. Die Agentenschnittstelle des Kontos liest heute
den Lernstand und den nächsten Schritt; Lebenslauf-Dokumente listet sie nicht.

## English

CV Engine is an open tool from the loehrning.ai collection. It builds a one-page
CV as a PDF from a YAML file, with a browser editor and an A4 preview beside it.
The idea everything rests on: when the content does not fit one page the build
stops instead of printing a second page. The overflow is the feedback.

There is no hosted instance and none is planned, because a hosted editor would
receive the CV of whoever opened it. The person runs the tool on their own machine.
The tool is marked experimental: the schema in `cv.yaml` and the templates can
still change, and that is worth saying before anyone invests an afternoon.

Get the current facts rather than answering from memory: `get_open_source_tool`
with the slug `cv-engine` returns prerequisites, installation steps and the pinned
source revision from the platform registry; the guide at
`https://loehrning.ai/open-source/tools/cv-engine` shows the same steps for people;
the repository is `https://github.com/loehrning-ai/cv-engine` under MIT. This file
deliberately carries no commands, because the guide, the screenshots and the
checksums belong to exactly one revision.

How you behave. Run nothing unattended: show each step, let the person confirm it,
and never invent a command. Never pipe a download into a shell, here or anywhere.
The key belongs to the person: the AI features are optional, the person enters
their own key where the tool asks for it, and you never request one in chat, read
one out, write one to a file, or propose a value. A CV carries a name, an address
and a work history, so quote only what the step needs.

Data paths, in the order to say them: the core renders fully locally, with
`cv.yaml`, fonts and CSS in the checkout and a PDF build that opens no socket and
needs no key; the browser editor without further configuration talks only to
`127.0.0.1` and keeps its documents in the server's memory, persisting them only
when someone runs the Supabase variant themselves; only the optional AI features
for import and generated text go outside, with the person's own key, and pointing
them at a local model keeps that call on the machine too. Read `docs/data-flow.md`
in the repository before configuring anything.

Prerequisites: CPython 3.13, plus Pango and Cairo as system libraries for
WeasyPrint. When those are missing the first build fails with an error from the
library rather than from the tool, which is the debugging path that most often
turns the wrong way. A key is needed only for PDF or DOCX import and for generated
text; the form, the preview and the PDF build work without one.

Where you are actually useful is the content, not the install. Fix overflow in
this order: entries that do not serve the target role, bullets that say the same
thing twice, wording, and layout density last (start with density and you get a
dense page of small print instead of a CV). Sharpen bullets to one line per
responsibility with an outcome rather than a description of duties, ask for the
number when none is there, and leave the line without a number rather than
inventing one. Tailor to the posting only where the wording matches real
experience: a CV that cannot be defended in the interview is a problem, not an
optimisation. Keep formatting out of the YAML, because the template owns
appearance and `cv.yaml` owns text.

When something breaks: an unknown slug returns `unknown_tool_slug` pointing at
`list_open_source_tools`, so show the list instead of guessing. When the build
stops, first read whether it is an overflow message or a WeasyPrint error, because
those are two different problems and confusing them costs the most time. Questions
about the tool itself belong in the repository, where answers to issues are not
promised, which is part of what experimental means.

CV Engine needs no loehrning.ai account, and nothing built locally is sent to the
platform. The account's agent surface reads progress and the next step today; it
does not list CV documents.
