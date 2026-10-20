# Wer viel schreibt, schreibt KI

::ticker{ref="h01-bars.pages" tail="Startseiten, sortiert nach der Länge ihres Textes und in fünf gleich große Gruppen geteilt."}

Das längste Fünftel der Startseiten sagt {{h01-bars.ratio}}-mal so oft KI wie das kürzeste.

Im kürzesten Fünftel liegt der Median der Textlänge, also die mittlere Zeichenzahl, bei {{h01-bars.median_q1}} Zeichen, im längsten bei {{h01-bars.median_q5}}. Dort steht das Wort KI auf {{h01-bars.q1:2}} der Seiten, hier auf {{h01-bars.q5}}. Das Intervall des Faktors ist {{h01-bars.ratio.range}}, Seiten ganz ohne gelesenen Text fehlen darin. Eine mögliche Erklärung ist schlicht der Platz, denn auf einer langen Startseite passt mehr.

::figure{id="h01-field"}

Bei vielen Zahlen zu Startseiten muss man deshalb klären, ob sie an KI hängen oder nur an der Textmenge. Ich habe {{h01-net.nodes}} Merkmale von Startseiten gesammelt, vom Cookie-Hinweis bis zum Wort Nachhaltigkeit, und jedes Merkmal ist ein Punkt im Netz. Zwei Punkte verbindet eine Linie, wenn sie nach einer Korrektur gegen Zufallstreffer mindestens doppelt so oft zusammen auftreten, wie der Zufall erwarten lässt. Ohne Rücksicht auf die Textmenge ergibt das {{h01-net.edges_raw}} Verbindungen. Teile ich die Seiten nach Textlänge in zehn Stufen und vergleiche nur Seiten derselben Stufe, bleiben {{h01-net.edges_equal}} übrig, bei 50 Stufen {{h01-net.edges_s50}} und bei 100 Stufen {{h01-net.edges_s100}}.

::stage{id="h01-net"}

Rund die Hälfte der Verbindungen verschwindet also, sobald die Textmenge gleich ist. Dasselbe zeigt die Zahl der Merkmale, die eine Seite trägt. Je mehr der {{h01-dose.signals}} übrigen Merkmale auf einer Seite stehen, desto öfter steht dort auch KI, von {{h01-dose.zero_rate}} bei keinem Merkmal bis {{h01-dose.top_rate}} bei elf oder mehr. Hält man die Textmenge fest, ist je zusätzlichem Merkmal kein Unterschied erkennbar, das Chancenverhältnis liegt bei {{h01-dose.or_signal_s10}} (Intervall {{h01-dose.or_signal_s10.range}}). Die Chance einer Gruppe ist ihr Anteil mit KI-Wort geteilt durch ihren Anteil ohne, ein Chancenverhältnis vergleicht die Chancen zweier Gruppen, und 1 heißt: kein Unterschied.

::figure{id="h01-dose"}

## Was bleibt

Von {{h01-friends.features_tested}} Merkmalen, die ich einzeln auf KI getestet habe, fallen {{h01-friends.features_crude_sig}} zunächst auf. Bei gleicher Textmenge behalten sie im Median {{h01-friends.features_effect_kept}} ihres Effekts, und {{h01-friends.features_lost}} verlieren ihn ganz. Einige Merkmale bleiben mit KI verbunden. Das Wort Digitalisierung hat mit dem KI-Wort ein Chancenverhältnis von {{h01-net.or_digitalisierung}}, die Wörter Cyber und Phishing kommen auf {{h01-net.or_cyber_phishing}}, NIS2 und ESG, die EU-Regeln zu Cybersicherheit und Nachhaltigkeitsberichten, auf {{h01-net.or_nis2_esg_lksg}}, wobei das Muster auch Zusammensetzungen wie Digitalisierungsstrategie mitzählt. Ein Link zu Facebook geht mit einem Chancenverhältnis von {{h01-friends.or_nfacebook}} seltener mit KI einher, eine Google-Karte mit {{h01-friends.or_tgooglemaps}}.

::figure{id="h01-friends"}

Gleiche Textmenge festzuhalten kann zu viel wegrechnen, weil die Textmenge vielleicht selbst ein Teil der Erklärung ist. Das Netz zeigt nur Zusammenhänge, und gelesen wurde der Hauptinhalt der Startseite ohne Fußzeile. Wo es geht, vergleiche ich deshalb in diesem Buch Seiten mit gleich viel Text. Bei {{rand-kap2.once_share}} der Seiten mit KI-Wort steht es nur ein einziges Mal, und nur {{rand-kap2.topic_share}} aller Seiten machen KI zum Thema, mit mindestens fünf Nennungen oder einer Überschrift.

> **Was du tun kannst:** Zähle die Zeichen deiner Startseite und leg sie neben die Mediane der fünf Gruppen: {{h01-bars.median_q1}}, {{h01-bars.median_q2}}, {{h01-bars.median_q3}}, {{h01-bars.median_q4}} und {{h01-bars.median_q5}}. Lies erst danach etwas in ein einzelnes Wort hinein, bei dir und bei anderen. Vergleiche Startseiten nur mit Seiten ähnlicher Länge.
