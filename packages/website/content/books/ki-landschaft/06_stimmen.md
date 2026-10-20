# Wer sonst redet

::ticker{ref="h11-field.releases" tail="Pressemeldungen von Polizei und Feuerwehr aus {{h11-field.agencies}} Dienststellen, durchsucht nach dem Wort KI."}

{{h12-null.register_firms}} Firmen aus dem Lobbyregister des Bundes schreiben auf {{h12-null.ki_observed}} ihrer Startseiten KI, vergleichbare Firmen nur auf {{h12-null.ki_expected}}.

Bisher ging es um Firmen, die sich selbst darstellen. Auch zwei andere Gruppen äußern sich öffentlich. Die Pressemeldungen haben keine Vergleichsgruppe. Bei den Firmen im Lobbyregister vergleiche ich mit Firmen, die gleich groß sind und gleich viel Text auf ihrer Startseite schreiben, so wie im zweiten Kapitel.

Das Intervall der Register-Firmen ist {{h12-null.ki_observed.range}}. Vergleichbar heißt: gleich lange Startseite und gleich viele Vertretungsberechtigte, die im Register eingetragenen Vertreter einer Firma. In nur {{h12-null.draws_at_or_above}} von {{h12-null.draws}} Zufallsziehungen solcher Vergleichsfirmen erreichten diese den beobachteten Wert oder mehr.

::stage{id="h12-null"}

Der Abstand beträgt das {{h12-null.ki_ratio}}-Fache, nach Mantel-Haenszel, einem Verfahren, das nur gleiche Gruppen vergleicht, ein Chancenverhältnis von {{h12-null.mh_or}}. Dieselbe Rechnung liefert für Cloud {{h12-null.ratio_cloud}}, für Digitalisierung {{h12-null.ratio_digitalisierung}} und für Nachhaltigkeit {{h12-null.ratio_nachhaltigkeit}}, bei Cloud ({{h12-null.ratio_cloud.range}}) und Digitalisierung ({{h12-null.ratio_digitalisierung.range}}) reicht das Intervall bis an 1. Cyber liegt mit {{h12-null.ratio_cyber}} höher. KI liegt damit im Bereich der anderen Neuheitswörter.

Das graue Band zeigt, was Zufall hergibt, und mit weniger Firmen wird es breiter. Bei 100 Firmen reicht es von {{h12-null.width_n100_lo}} bis {{h12-null.width_n100_hi}}, bei 50 von {{h12-null.width_n50_lo}} bis {{h12-null.width_n50_hi}}. Eingetragen heißt, Interessen zu irgendeinem Thema zu vertreten, und weil es bei so wenigen Firmen keine Aufteilung nach Branche gibt und die Zuordnung von Website zu Firma nicht geprüft ist (Neuberechnung folgt), lese ich das Ergebnis nur als Zusammenhang, ohne ein Motiv zu unterstellen. Der Anteil der Registrierten wächst mit der Größe, von {{h12-null.share_registered_1}} bei einem Vertretungsberechtigten auf {{h12-null.share_registered_10}} bei zehn und mehr.

## Polizei und Feuerwehr

Pressemeldungen von Polizei und Feuerwehr sind öffentlich und zahlreich und bewerben keine Produkte, auch wenn die Pressestellen auswählen, was sie veröffentlichen. In {{h11-field.releases}} Meldungen findet mein Muster KI in höchstens {{h11-field.ai_hits}}, das sind {{h11-field.ai_share}} (Intervall {{h11-field.ai_share.range}}). In der Grafik füllen sie nur {{h11-field.ai_squares}} eines Quadrats.

::figure{id="h11-field"}

Über Betrug berichten {{h11-field.fraud_hits}} Meldungen, und {{h11-field.ai_in_fraud_hits}} davon nennen KI ({{h11-field.ai_in_fraud}}). Telefonbetrug kommt in {{h11-field.phone_hits}} Meldungen vor, Internetbetrug in {{h11-field.online_hits}}. Bei den KI-Nennungen ist über {{h11-field.days}} Tage kein Anstieg zu erkennen, die Chance je Monat liegt bei {{h11-field.trend_odds_month}} (Intervall {{h11-field.trend_odds_month.range}}), und ein Wert unter 1 hieße Rückgang.

Das bloße Kürzel „KI“ findet {{h11-field.naive_ki_hits}} Meldungen, {{h11-field.naive_ki_city_code}} davon sind ein Stadtkürzel, und es überzählt damit um das {{h11-field.naive_factor}}-Fache. Mein genaueres Muster findet höchstens {{h11-field.ai_hits}}, und darunter steht noch die Ankündigung eines Aktionstags, deshalb ist {{h11-field.ai_hits}} eine Obergrenze für die Treffer meines Musters.

Die Meldungen bilden ab, was die Pressestellen veröffentlichen, mit mehr Warnungen als Alltag, und taugen nicht als Kriminalstatistik. Weil sie Opfer und Verdächtige nennen, verlassen die Datenbank nur Zähler und keine Texte.

> **Was du tun kannst:** Stell bei jeder Aussage der Art „X nennt KI auf der Startseite“ die Frage, im Vergleich zu wem und gemessen an welchem Wort. Zähle neben KI ein zweites Wort wie Cloud oder Nachhaltigkeit als Vergleichswert, bevor du dich über einen Abstand wunderst, und prüfe, wie viele Firmen hinter dem Band des Zufalls stehen.
