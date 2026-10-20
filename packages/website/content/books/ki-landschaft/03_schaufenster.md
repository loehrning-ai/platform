# Im Schaufenster

::ticker{ref="c3.read_sample" tail="Startseiten hat ein KI-Assistent gelesen, um zu sehen, was hinter dem Wort KI steht."}

Die Startseite ist das Schaufenster einer Firma. Das Textmuster fand das Wort KI auf {{c3.regex_hits}} der {{h05-waterfall.base_sites}} Startseiten mit eigener Domain.

Ein Textmuster ist nur eine Suchregel im Text der Seite. Gelesen und beurteilt hat die Seiten ein KI-Assistent, ohne menschliche Gegenprüfung. Nach seinem Urteil zeigen von den gelesenen Seiten, die KI erwähnen, in enger Lesart (Chatbot, maschinelles Lernen, KI-Stelle, KI-Regeln) {{c3.read_narrow}} einen konkreten Beleg (Intervall {{c3.read_narrow.range}}), in weiter Lesart (jede benannte KI-Funktion und jedes KI-Angebot) {{c3.read_broad}} (Intervall {{c3.read_broad.range}}).

::figure{id="c3"}

Nimm als Beispiel zwei Sätze, die ich mir ausgedacht habe: „Unsere Kunden profitieren von modernster KI.“ und „Unser KI-Assistent beantwortet Terminfragen, und eine Mitarbeiterin prüft jeden Vorschlag.“ Im ersten steht nur das Wort, im zweiten eine Funktion, die ein Besucher ausprobieren und die eine Firma erklären kann. Am häufigsten fand das Muster ein Chat-Widget oder KI-Werkzeug ({{c3-evidence.tool}} der Seiten mit Treffer), danach einen Hinweis auf maschinelles Lernen oder eine Fallstudie ({{c3-evidence.ml}}).

::figure{id="c3-evidence"}

Bei den Seiten, auf denen das Muster das Wort fand, zeigten nach dem Urteil des Assistenten {{c3.trace_precision}} einen konkreten Beleg (Intervall {{c3.trace_precision.range}}). Umgekehrt findet das Muster nur {{c3.trace_recall}} der Seiten, die in weiter Lesart einen konkreten Beleg zeigen. In dieser Stichprobe sagt das Wort KI allein wenig darüber, was auf einer Seite steht.

## Beraterseiten nennen den EU AI Act oft, Firmenseiten selten

Auf den {{h04-dumbbell.consult_pages}} Startseiten von KI-Beratern steht der EU AI Act in {{h04-dumbbell.ai_act_consult}} der Fälle, auf den {{h04-dumbbell.firm_pages}} Firmenseiten in {{h04-dumbbell.ai_act_firms}}. Der Vergleich ist schief, denn {{h04-dumbbell.consult_ki_share}} der Beraterseiten führen das Wort KI selbst, bei den Firmen mit gelesenem Text sind es {{h03-strip.ki_share_firms}}. Rechnet man nur Seiten mit KI-Wort, bleibt beim EU AI Act das {{h04-dumbbell.ai_act_ratio_ki}}-Fache und bei Agenten das {{h04-dumbbell.agent_ratio_ki}}-Fache.

::figure{id="h04-dumbbell"}

Digitale Souveränität steht auffallend oft zusammen mit dem KI-Wort, auch wenn die meisten der {{h04-forest.sov_pages}} Firmenseiten, die Souveränität oder Datenhoheit schreiben, IT- und Cloud-Anbietern gehören. {{h04-forest.sov_ki_pages}} davon sagen auch KI ({{h04-forest.sov_ki_share}}, Intervall {{h04-forest.sov_ki_share.range}}), auf allen anderen Firmenseiten sind es {{h04-forest.ki_share_without}}. Bei der DSGVO ist kein Zusammenhang erkennbar, das Chancenverhältnis liegt bei {{h04-forest.dsgvo_or}} (Intervall {{h04-forest.dsgvo_or.range}}).

::stage{id="h04-field"}

## Die Uhr der Startseite

Nur {{h07-curve.dated_share}} der Startseiten zeigen ein Datum. Startseiten, deren jüngstes Datum aus 2026 stammt, also aus Januar bis Anfang April, nennen bei gleicher Textmenge {{h07-curve.rate_ratio}}-mal so oft KI wie Startseiten mit 2022 oder älter (Intervall {{h07-curve.rate_ratio.range}}). Bei {{h07-curve.stale_share}} der datierten Seiten ist das jüngste Datum 2023 oder älter.

::figure{id="h07-curve"}

Das Datum misst Frische. Ob eine Seite vernachlässigt ist, lässt sich daraus nicht ablesen, denn bei manchen steht das jüngste Datum neben Gründungsjahr, Stand oder Copyright. Die Jahresangaben der Firmen sind meist gerundet: In meinen {{rand-kap3.rounded_n_plain}} Angaben ohne Zusatz („N Jahre Erfahrung“) sind {{rand-kap3.rounded_plain}} Vielfache von fünf, mit „über“ oder „rund“ sind es {{rand-kap3.rounded_ueber}}.

> **Was du tun kannst:** Lies deine Startseite wie ein Besucher und markiere jeden Satz mit KI. Such neben jedem einen Beleg, den man prüfen kann, etwa eine Funktion, ein Beispiel oder eine Regel, und setz ein Datum darunter. Findest du keinen Beleg, streich den Satz oder ergänze einen.
