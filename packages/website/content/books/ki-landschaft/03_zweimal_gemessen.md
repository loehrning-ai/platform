# Dieselbe Firma, zweimal gemessen

In meiner Erinnerung war bei Apple ein Team felsenfest überzeugt, seine Datenpipeline sei sauber. Drei Wochen lang wurde nur gezählt: wie oft ein Job abbricht, wie viele Felder leer bleiben, wie alt die letzte Aktualisierung ist. Das Ergebnis lag deutlich unter der Selbsteinschätzung. Schlamperei war es nicht, es hatte vorher nur niemand hingeschaut. Dieses Kapitel macht dasselbe mit der eigenen Zahl.

Die Frage klingt einfach: Auf wie vielen Firmenwebsites steht das Wort KI? Die Antwort hängt davon ab, wie man rechnet.

## Mehrere Rechnungen, mehrere Werte

Roh gerechnet steht KI auf {{c4.raw_share.num}} Prozent von {{c4.raw.n}} Seiten. Auf {{c4.shared_hosts_share.num}} Prozent dieser Seiten teilen sich mehrere Firmen dieselbe Adresse. Dort ist die Zuordnung zweifelhaft: In einer Prüfung gehörte nur etwa jede dritte dieser Adressen zur Firma ({{c4.audit_shared.num}} Prozent).

Ohne diese Seiten bleiben {{c4.own.n}} Websites mit eigener Adresse und ein Wert von {{c4.own_share.num}} Prozent. Er fällt fast um die Hälfte, also muss das Wort auf den geteilten Seiten deutlich öfter stehen als auf den übrigen.

Dann kommt die Gewichtung. Bayern stellt {{c4.bayern_sample_share.num}} Prozent der Stichprobe, im Unternehmensregister der Statistik aber nur {{c4.bayern_units_share.num}} Prozent der rechtlichen Einheiten ({{c4.bayern_pool_share.num}} Prozent in meinem Pool aus Kapitalgesellschaften). Damit nicht ein einzelnes Land das Gesamtbild bestimmt, zählt jedes Land mit seinem Anteil im Register der Statistik: Ein zu stark vertretenes Land zählt weniger, ein zu schwach vertretenes mehr. Damit sinkt der Wert auf {{c4.weighted_share.num}} Prozent. Mit den Poolanteilen kämen {{c4.weighted_pool.num}} Prozent heraus.

::figure{id="C4"}

Der zweite Weg ist härter. Bei {{c4.scan1.n}} Websites wurde der Scan nach etwa {{c4.rescan_days}} Tagen wiederholt, mit denselben Firmen und derselben Frage. Beim ersten Durchgang stand KI auf {{c4.rescan_first.num}} Prozent der Seiten, beim zweiten auf {{c4.rescan_second.num}} Prozent. Das ist ein Faktor von etwa {{c4.rescan_ratio.num}} (Intervall {{c4.rescan_ratio.range}}).

Die beiden Durchgänge lasen die Seiten auf unterschiedlichen Wegen, und die {{c4.scan1.n}} Seiten waren keine Zufallsauswahl: Schon beim ersten Durchgang stand KI dort auf {{c4.rescan_first.num}} Prozent der Seiten, bei allen Seiten mit eigener Adresse auf {{c4.own_share.num}}. Den Faktor darf man deshalb nicht auf die Gesamtzahl übertragen.

Einen zweiten Durchgang über alle Seiten mit eigener Adresse, mit einem einzigen Verfahren, habe ich für Ende 2026 geplant. Bis dahin gelten die Zahlen dieser Ausgabe (Scan März bis Mai 2026, Stand 18. Oktober 2026) unter einem Vorbehalt, der für jede Zahl in diesem Buch gilt, auch für die gewichtete.

## Wer mehr schreibt, sagt öfter KI

Ein weiterer Effekt betrifft die Seiten selbst. Teilt man die {{c5.n}} Seiten mit gelesenem Text nach Textmenge in fünf gleich große Gruppen, steht KI im kürzesten Fünftel auf {{c5.q1.num}} Prozent der Seiten und im längsten auf {{c5.q5.num}} Prozent. Das ist ein Faktor von {{c5.ratio}} (Intervall {{c5.ratio.range}}), und im kürzesten Fünftel stehen dafür nur {{c5.q1_hits}} Treffer. Das Intervall zeigt, wie stark ein solcher Wert allein durch die Auswahl der Seiten schwanken kann.

::figure{id="C5"}

Zwei Erklärungen sind möglich, die sich nicht trennen lassen: Eine lange Seite hat mehr Platz für das Wort, und das Textmuster kann bei langen Seiten häufiger danebenliegen. Dass Firmen mit mehr Text mehr mit KI machen, folgt daraus nicht. Seiten ohne gelesenen Text fehlen in dieser Rechnung, obwohl auf ihnen KI öfter steht ({{c5.no_text_rate.num}} Prozent). Auch diese Rechnung stammt aus dem alten Scan und wird nach dem zweiten Durchgang neu gemacht.

Je nach Rechnung ergeben dieselben Daten also {{c4.weighted_share.num}}, {{c4.own_share.num}} oder {{c4.raw_share.num}} Prozent, bei der Wiederholung {{c4.rescan_first.num}} oder {{c4.rescan_second.num}}. Jede dieser Zahlen beantwortet eine etwas andere Frage, und welche zu deiner passt, hängt davon ab, wofür du sie brauchst. Frag bei jedem KI-Anteil nach Basis und Methode, und behandle die Zahl als Anekdote, wenn du keine Antwort bekommst. Und miss, was du im eigenen Haus erzählst, bevor du es weitergibst.
