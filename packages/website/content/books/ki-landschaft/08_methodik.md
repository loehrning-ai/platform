# Methode und Grenzen

Hier steht, woher die Zahlen stammen und was sie nicht tragen. Datenstand ist der 18. Oktober 2026, die Scans stammen aus März bis Mai 2026.

## Woher die Zahlen kommen

| Baustein | Stand |
|---|---|
| Grundgesamtheit | Firmen, denen ich per Suche eine Website zugeordnet habe, gezogen aus einem Pool aktiver Kapitalgesellschaften mit Ort |
| Stichprobe | Quotenstichprobe, keine Zufallsauswahl; Bayern stellt 41 Prozent der Stichprobe und 14 Prozent des Pools |
| Basis | {{c4.raw.n}} erreichbare Websites, davon {{c4.own.n}} mit eigener Adresse und {{c4.weighted_total.n}} mit bekanntem Bundesland |
| Messung | Textmuster im Quelltext der Website; Scan vom 16. März bis zum 4. Mai 2026 |
| Wiederholung | {{c4.scan1.n}} Websites, zweiter Abruf nach etwa {{c4.rescan_days}} Tagen auf einem anderen Weg |
| Branche | aus Stichwörtern abgeleitet, für rund zwei Drittel der Basis bekannt |
| Größe | Zahl der eingetragenen Vertretungsberechtigten, nicht der Beschäftigten |
| Gewichte | Unternehmensregister 2024 des Statistischen Bundesamts, alle rechtlichen Einheiten je Bundesland, nicht nur Kapitalgesellschaften |
| Stellen | drei Portale, 18 Suchbegriffe, 28. Februar bis 16. Juni 2026, eine Stelle je Arbeitgeber und Titel |
| Intervalle | 95 Prozent; Wilson bei Anteilen, Bootstrap bei Modellwerten |
| Mindestzelle | Zahlen unter 5 erscheinen nicht, auch nicht als Rate mal Basis |

Ein Intervall zeigt, wie weit ein Wert allein durch die Auswahl der Seiten schwanken kann, und je weniger Treffer dahinterstehen, desto länger ist es. Die Fehler der Zuordnung und des Textmusters erfasst es nicht, die stehen weiter unten. Ein Unterschied zwischen zwei Werten ist nur dann ernst zu nehmen, wenn sich ihre Intervalle nicht überlappen.

Alle Zusammenhänge in diesem Buch sind explorativ, sie beschreiben, was in dieser Stichprobe zusammen vorkommt, und sagen nichts über Ursachen.

## Begriffe

| Begriff | Bedeutung |
|---|---|
| Intervall | Spielraum eines Werts durch die Auswahl der Seiten; 95 Prozent sind üblich |
| Gewichtung | Ausgleich, damit jedes Land so zählt wie im Register |
| Chancenverhältnis | Vergleich der Chancen zweier Gruppen; 1 heißt kein Unterschied |
| Rangkorrelation | Maß dafür, ob zwei Reihenfolgen zusammenpassen; 0 heißt kein Zusammenhang |
| Vorhersagewert | Wert zwischen 0,5 und 1,0; 0,5 entspricht einem Münzwurf |
| Quotenstichprobe | Auswahl nach festen Anteilen, nicht nach Zufall |
| Quelltext | der Text hinter einer Seite, den ein Browser liest |
| Aggregat | Zahl über viele Firmen, aus der sich keine einzelne ablesen lässt |

## Was sich nicht sagen lässt

Gemessen wird, was auf Websites steht. Wie viele Firmen KI tatsächlich einsetzen, wird nicht gemessen, und deshalb steht der Wert nie neben den Umfragen aus Kapitel 1. Kleinstbetriebe ohne auffindbare Website kommen in den Daten nicht vor. Jede Aussage in diesem Buch gilt deshalb für Firmen, denen ich per Suche eine Website zugeordnet habe, und für nichts anderes.

{{c4.audit_pairs}} Zuordnungen hat ein KI-Assistent geprüft, keine Person. Bei {{c4.audit_own.num}} Prozent der entscheidbaren Fälle (Intervall {{c4.audit_own.range}}) gehört die Adresse zur Firma, bei {{c4.audit_undecided.num}} Prozent ließ sich das nicht entscheiden. Das Muster, mit dem das Wort KI gezählt wurde, traf in einer Stichprobe von {{c4.label_sample.num}} Startseiten in {{c4.regex_precision.num}} Prozent der Fälle ({{c4.regex_precision.range}}) tatsächlich eine KI-Erwähnung und fand {{c4.regex_recall.num}} Prozent ({{c4.regex_recall.range}}) der vorhandenen. Beide Fehler heben sich beim Gesamtwert zufällig fast auf: Auf den gelesenen Startseiten erwähnten {{c4.label_rate.num}} Prozent KI (Intervall {{c4.label_rate.range}}). Für die Auswertung nach Branche, Land oder Kreis gilt das nicht.

Auch die Textmuster hat ein KI-Assistent beurteilt, meine Gegenprüfung von 30 Fällen steht aus.

Die Branche ist aus Stichwörtern abgeleitet, und die Stichprobe ist je Land verschieden dicht. Muster im Quelltext sagen nichts darüber, was eine Firma tut.

Frühere Fassungen dieses Buches enthielten einen Reifegrad-Score von 0 bis 100 und die Aussage, die meisten Betriebe seien analog, und beides ist gestrichen, weil der Score zu einem großen Teil abbildete, wie viele Prüfungen für eine Firma überhaupt gelaufen waren, und weil „analog“ nie gemessen wurde.

## Stand und Änderungen

Dieses Buch trägt ein Datum. Ändern sich Zahlen, weil nachgemessen wird, steht das hier mit dem neuen Datenstand. Die Texte folgen den Zahlen und nicht umgekehrt.

## Datenschutz

Die Auswertung verwendet nur Zähler und Markierungen je Website. Weder Namen noch E-Mail-Adressen noch Telefonnummern aus den Rohdaten gehen ein. Im Buch erscheinen weder Firmen noch Adressen noch Ranglisten, weil sich aus einer einzelnen Zahl nie eine einzelne Firma ablesen lassen soll. Wie der Scanner vorgeht, steht auf der Seite [loehrning.ai/bot](/bot).
