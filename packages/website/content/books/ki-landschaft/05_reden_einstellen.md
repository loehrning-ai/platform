# Reden und Einstellen

Ein Satz auf der Website kostet nichts. Eine Stellenanzeige kostet Zeit, Geld und ein Gespräch darüber, welche Aufgabe die Firma tatsächlich vergeben will. Deshalb habe ich nachgesehen, wo KI-Stellen ausgeschrieben werden und ob das mit dem Reden auf den Websites zusammenfällt.

## Wer ausschreibt

Gesammelt wurden Stellenanzeigen mit 18 Suchbegriffen aus Daten, Analytics und KI (zum Beispiel data engineer, machine learning, AI), vom 28. Februar bis zum 16. Juni 2026. Als KI-Stelle zählt, wessen Titel auf KI, maschinelles Lernen oder Data Science hinweist. Derselbe Titel desselben Arbeitgebers zählt einmal, auch wenn er in mehreren Städten oder auf mehreren Portalen steht. Übrig bleiben {{c10.postings}} Stellen von {{c10.employers}} Arbeitgebern (weitere {{c10.postings_no_employer}} ohne erkennbaren Arbeitgeber).

Zwei Drittel dieser Arbeitgeber, genau {{c10.single_share.num}} Prozent, schreiben nur einen einzigen Stellentitel aus (nach Anzeigen gezählt {{c10.single_share_ads.num}} Prozent). Auf die zehn Prozent mit den meisten Stellen entfallen {{c10.top10_share.num}} Prozent aller KI-Stellen, mit einem Intervall von {{c10.top10_share.range}}, und auf die obersten fünf Prozent {{c10.top5_share.num}} Prozent.

::figure{id="C10"}

Je stärker die Kurve durchhängt, desto ungleicher sind die Stellen verteilt.

Gezählt werden Anzeigen, keine Einstellungen. Die Auswahl hängt von den 18 Suchbegriffen ab. Große Arbeitgeber sind in Stellenportalen vermutlich überrepräsentiert. Das Zeitfenster umfasst nur dreieinhalb Monate. Eine Zahl für ganz Deutschland ist das deshalb nicht.

## Wo ausgeschrieben wird

Bei den Stellen liegen die Länder viel weiter auseinander als beim Reden. Je Million Einwohner trennt das höchste vom niedrigsten Land etwa das {{c11.spread_postings.num}}-Fache, bei Firmenseiten mit KI-Wort nur etwa das {{c11.spread_website.num}}-Fache. Damit beides auf eine Skala passt, steht der Länderdurchschnitt bei 100: Berlin kommt bei den Stellen auf {{c11.be.a}}, Schleswig-Holstein auf {{c11.sh.a}}. Beide Spannweiten sind Verhältnisse zwischen dem höchsten und dem niedrigsten Land und hängen von einzelnen kleinen Ländern ab; ein Intervall dafür gibt es nicht.

Beides geht in dieselbe Richtung: Länder, in denen viel ausgeschrieben wird, reden tendenziell auch öfter über KI. Die Rangkorrelation beträgt {{c11.rho.num}}. Das Intervall reicht allerdings von {{c11.rho.lo}} bis {{c11.rho.hi}}, und mit so wenigen Ländern bleibt der Zusammenhang eine Tendenz, auf die ich keine Aussage über einzelne Regionen stützen würde. Zwei weitere Länder zeige ich nur mit den Stellen, weil bei ihren Websites weniger als fünf Treffer vorliegen. Stellen tragen außerdem den Ort der Stelle, Websites den Sitz der Firma.

::figure{id="C11"}

Je weiter die beiden Punkte eines Landes auseinanderliegen, desto weniger passen Reden und Ausschreiben dort zusammen.

Länderwerte sagen nichts über einzelne Firmen. Auch eine Ursache lässt sich aus ihnen nicht lesen: Vielleicht reden Firmen dort mehr über KI, weil sie suchen, vielleicht liegt es an der Branche oder an der Größe der Städte, oder an den Portalen, die abgefragt wurden.

## Was das für dich heißt

Gesprochen wird breit, ausgeschrieben wird ungleicher. Erwähnt ein Wettbewerber auf seiner Seite KI, sagt das über seine Pläne wenig. Eine Stelle sagt mehr, weil jemand dafür Geld einplant und eine Aufgabe beschrieben hat, doch auch sie ist noch keine Einführung.

Schau dir deshalb bei einem Anbieter oder Wettbewerber neben der Website auch die offenen Stellen an. Und wenn du selbst suchst, schreib die Anzeige so, dass man erkennt, welche Aufgabe mit KI gemeint ist. Besser als „KI-Experte gesucht“ ist: „Wir suchen jemanden, der unsere Angebote mit einem Sprachmodell vorbereitet und prüft.“
