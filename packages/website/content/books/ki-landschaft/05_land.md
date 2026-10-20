# Das Land ist keine Rangliste

::ticker{ref="h06-slope.firms" tail="Firmen in {{h06-slope.kreise}} Kreisen, jeder Kreis zufällig in zwei Hälften geteilt."}

Wenn eine Rangliste der Kreise etwas Stabiles misst, müssen beide Hälften dieselbe Reihenfolge ergeben. Das ist kaum der Fall.

Die Rangkorrelation misst, ob zwei Reihenfolgen zusammenpassen, und 0 hieße: kein Zusammenhang. Bei den beiden Hälften beträgt sie {{h06-slope.split_r}} (Intervall {{h06-slope.split_r.range}}), für die vollständigen Daten geschätzt {{h06-slope.spearman_brown}}. Die zehn Spitzenkreise der ersten Hälfte liegen dort im Durchschnitt beim {{h06-slope.top_a}}-Fachen der Gesamtrate, in der zweiten Hälfte nur noch beim {{h06-slope.top_b}}-Fachen (Intervall {{h06-slope.top_b.range}}).

::stage{id="h06-slope"}

Etwas stabiler ist die Reihenfolge nur dort, wo viele Firmen stehen. In den {{h06-slope.big_kreise}} größten Kreisen liegt die Korrelation bei {{h06-slope.big_r}}, und die Spitze fällt nur noch von {{h06-slope.big_top_a}} auf {{h06-slope.big_top_b}}. Für die meisten Kreise hat meine Stichprobe zu wenig Firmen, um sie zu ordnen. Den Kreis habe ich aus der Postleitzahl abgeleitet.

Die öffentlichen Regionsdaten, die ich verwendet habe, verbessern ein Modell mit Branche, Größe und Rechtsform zusammen nur um {{h06-region.gain_all}} AUC-Punkte (Intervall {{h06-region.gain_all.range}}), das Bundesland allein bringt {{h06-region.gain_land}} (Intervall {{h06-region.gain_land.range}}). AUC misst, wie gut ein Modell Seiten mit und ohne KI-Wort trennt, und 0,5 wäre ein Münzwurf. Das Maß ist für kleine Gruppen grob und widerspricht dem Gefälle im Osten, das gleich folgt, nicht.

::figure{id="h06-region"}

## Was die Karte trotzdem zeigt

Auf den ersten Blick liegt Bayern über dem Rest, das Chancenverhältnis von Bayern gegen den Rest beträgt {{h10-tiles.bayern_or_all}} (Intervall {{h10-tiles.bayern_or_all.range}}). Im gleichartigen Kern, den {{h10-tiles.core_firms}} Firmen, die per Suche gefunden wurden und einen Registerzweck haben, liegt es bei {{h10-tiles.bayern_or_core}} (Intervall {{h10-tiles.bayern_or_core.range}}), also ohne erkennbaren Vorsprung. Der Vorsprung sitzt in {{h10-tiles.lead_firms}} Firmen, die auf einem einzigen Weg gefunden wurden und zu {{h10-tiles.lead_bayern_share}} aus Bayern stammen. Bayern stellt {{h10-tiles.bayern_sample_share}} der Stichprobe und {{h10-tiles.bayern_pool_share}} der Ausgangsliste.

::figure{id="h10-tiles"}

Im Osten zeigt sich ein Gefälle, das auch mit Wirtschaftskraft und Dichte knapp bestehen bleibt. Für alle fünf ostdeutschen Länder ohne Berlin beträgt das Chancenverhältnis mit Branche, Größe und Rechtsform im Vergleich {{h10-or.east_or_adjusted}} (Intervall {{h10-or.east_or_adjusted.range}}), mit Wirtschaftskraft und Dichte {{h10-or.east_or_wealth}} (Intervall {{h10-or.east_or_wealth.range}}). Erst nach einem Blick auf die Daten habe ich vier Länder ohne Brandenburg herausgegriffen. Dort liegt es bei gleicher Textmenge bei {{h10-or.or_east4_text}} (Intervall {{h10-or.or_east4_text.range}}), bei gleicher Branche bei {{h10-or.or_east4_ind}}, und Brandenburg liegt bei {{h10-or.or_bb_text}}.

::figure{id="h10-or"}

In meinen Anzeigen gibt es im Osten je Einwohner {{h10-or.jobs_per_head}} der Stellen des Westens, bei KI-Titeln {{h10-or.ai_jobs_per_head}}, und der KI-Anteil an allen Stellen liegt bei {{h10-or.ai_share_east}} gegen {{h10-or.ai_share_west}}, ein Verhältnis von {{h10-or.ai_share_ratio}} (Intervall {{h10-or.ai_share_ratio.range}}), das die 1 einschließt. Gemessen an allen Datenstellen sind KI-Stellen im Osten also nicht nachweisbar seltener.

Die Firmenwerte dieses Kapitels habe ich nur mit Websites gerechnet, die der Rescan gelesen hat, ohne die {{h05-waterfall.rescan_no_match}}, deren Impressum eine andere Firma nennt, bei den Ländern sind das {{h10-tiles.firms_land}} Firmen. Auf der strengen Grundlage, nur den {{h05-waterfall.rescan_match}} Websites, deren Impressum die Firma ausdrücklich nennt, schließt Bayerns Intervall die 1 ein, und die Ostlücke fällt unter allen Gruppen von fünf Ländern nicht mehr auf. Ich bleibe bei der breiteren Grundlage, weil ein offenes Impressum keine falsche Zuordnung ist und die strenge Auswahl nur gut ein Drittel der Websites behält. Hinter dem Osten stehen {{h10-or.east_hits}} Treffer, getragen von kleinen Ländern, und Länder mit weniger als fünf Treffern sind zusammengefasst.

> **Was du tun kannst:** Vergleiche dich mit deiner Branche und mit einer Spanne für deine Region, nie mit einer Rangliste. Lies bei jeder Karte, wie viele Firmen hinter einem Wert stehen, und misstraue der Spitze, denn in meinen Daten fiel sie in der zweiten Hälfte zurück.
