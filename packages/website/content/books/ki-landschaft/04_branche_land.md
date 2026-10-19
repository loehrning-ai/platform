# Branche schlägt Land

Ich wollte wissen, wer auf der Website KI sagt und wo, und habe die Seiten dazu nach Branche und Bundesland aufgeteilt, zuletzt auch nach Landkreis, und geprüft, was einen Unterschied macht. Der deutlichste Befund kommt zuerst. Die Branche unterscheidet mehr als die Region.

## Die Branche

Unter den Branchen mit genug Seiten steht KI am häufigsten bei IT-Dienstleistern, nämlich auf {{c6.it_services.num}} Prozent der Seiten. Bei nur {{c6.it_services.n}} Seiten reicht das Intervall allerdings von {{c6.it_services.lo}} bis {{c6.it_services.hi}}. Es folgen Unternehmensberatung und PR mit {{c6.consulting.num}} Prozent sowie das Verlagswesen mit {{c6.publishing.num}} Prozent. Unter den großen Branchen nennen der Hochbau mit {{c6.building.num}} Prozent und die Bauinstallation mit {{c6.installation.num}} Prozent am wenigsten KI, beide mit mehr als tausend Seiten und deshalb mit engem Intervall. Einige kleinere Branchen liegen noch tiefer, werden aber nicht gezeigt.

::figure{id="C6"}

Der Punkt zeigt den Anteil, der Strich das Intervall, und je weniger Seiten dahinterstehen, desto länger ist der Strich, bei den IT-Dienstleistern also besonders.

Das passt zu der Vermutung, dass Firmen, die KI anbieten, auch darüber schreiben. Belegen kann ich das nicht. Die Branche ist aus Stichwörtern abgeleitet und nicht amtlich, sodass die Aussage zum Teil im Kreis laufen könnte.

Bei {{c6.n_suppressed}} von {{c6.n_industries}} Branchen lagen ein bis vier Treffer vor, etwa im Maschinenbau. Diese Werte zeige ich nicht, weil sich aus so kleinen Zahlen einzelne Firmen erahnen ließen. Für ein Drittel der Firmen kenne ich die Branche nicht; sie sagen doppelt so oft KI ({{c6.no_industry_rate.num}} gegen {{c6.with_industry_rate.num}} Prozent). Die Reihenfolge im Mittelfeld ist weitgehend Zufall. Die Abstände dort liegen innerhalb der Intervalle.

## Das Land

Nach Bundesland sieht es anders aus. Im Osten ohne Berlin steht KI auf {{c7.east_share.num}} Prozent der Seiten, im Westen ohne Berlin auf {{c7.west_share.num}} Prozent. Rechnet man Branche, Größe und Rechtsform heraus, so bleibt ein Chancenverhältnis von {{c7.or_adjusted.num}} mit einem Intervall von {{c7.or_adjusted.range}}. Bei gleichen Merkmalen ist die Chance auf das Wort KI im Osten also gut ein Drittel niedriger. Der Abstand kommt vor allem aus Sachsen und Mecklenburg-Vorpommern; Brandenburg liegt auf dem Niveau des Westens.

Der Unterschied zwischen den Ländern ist statistisch nachweisbar, aber kleiner als der zwischen den Branchen. Er ist knapp. Das Intervall reicht fast bis 1, wo es gar keinen Unterschied gäbe, und im Osten stehen nur wenige Treffer dahinter. Die Stichprobe je Land ist außerdem keine Zufallsauswahl, und die Zuordnung von Adresse zu Firma stimmte nur bei {{c4.audit_own.num}} Prozent der entscheidbaren Fälle (Kapitel 8). Zwischen den Ländern unterschied sich diese Genauigkeit nicht erkennbar, mit 5 bis 35 Fällen je Land hätte ein Unterschied aber groß sein müssen.

Die Karte zeigt jedes Land als Kachel gleicher Größe, damit kleine Länder nicht verschwinden und große nicht übertrieben wirken. Zwischen einzelnen Ländern überlappen sich die Intervalle fast überall. Für Sachsen-Anhalt und das Saarland gibt es keinen Wert, weil dort weniger als fünf Treffer vorliegen.

::figure{id="C7"}

## Der Landkreis

Auf Kreisebene wird es unruhig. Von {{c8.kreise_total}} Landkreisen und Städten mit mindestens 30 Firmen liegen {{c8.kreise_outside}} nach Abzug dieser drei Merkmale außerhalb eines 95-Prozent-Zufallsbands ({{c8.kreise_above}} darüber, {{c8.kreise_below}} darunter); bei reinem Zufall wären etwa {{c8.kreise_expected}} zu erwarten. {{c8.kreise_inside}} liegen darin. Der Überschuss ist gering, eine Karte, die jeden Kreis einfärbt, würde überwiegend Rauschen zeigen. Deshalb gibt es hier weder eine Karte noch eine Rangliste.

::figure{id="C8"}

## Was KI-Gerede vorhersagt

Zuletzt habe ich gefragt, welche Eigenschaft einer Firma am besten vorhersagt, dass auf ihrer Seite KI steht. Dafür gibt es einen Wert zwischen 0,5 und 1,0. Bei 0,5 rät man wie bei einem Münzwurf, bei 1,0 liegt man immer richtig. Die Textmenge der Seite kommt auf {{c9.text}}, die Technik der Seite auf {{c9.tech}}, die Branche auf {{c9.industry}}, die Größe auf {{c9.size}}, das Bundesland auf {{c9.state}} und die Rechtsform auf {{c9.legal}}.

Das Bundesland allein trennt Firmen mit KI-Wort von denen ohne kaum besser als ein Münzwurf, und alle Eigenschaften zusammen erreichen {{c9.all}}, wobei Größe und Rechtsform über das Wort auf der Seite wenig vorhersagen und die Branche schon deutlich mehr.

::figure{id="C9"}

Vorhersage ist keine Ursache. Die Textmenge bildet vor allem ab, wie viel Platz das Wort hat, und ihr Wert stammt wie in Kapitel 3 aus dem alten Scan, den ich noch einmal nachmessen will. Die Technik der Seite steht für IT-nahe Betriebe. Als Technik zählen Merkmale des Quelltexts. Einen KI-Chatbot habe ich dabei ausgeschlossen, weil die Rechnung sonst im Kreis liefe.

> **Tipp:** Vergleich dich mit Betrieben deiner Branche und Größe und nicht mit dem Durchschnitt deines Bundeslandes. Fehlt für deine Branche ein Wert, nimm eine verwandte und sag dazu, dass sie nur ähnlich ist.
