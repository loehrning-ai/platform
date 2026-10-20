# Who else is talking

::ticker{ref="h11-field.releases" tail="press releases from police and fire services in {{h11-field.agencies}} agencies, searched for the word AI."}

{{h12-null.register_firms}} firms from the federal lobby register write AI on {{h12-null.ki_observed}} of their homepages, comparable firms only on {{h12-null.ki_expected}}.

So far it was about firms presenting themselves. Two other groups also speak in public. The press releases have no comparison group. For the firms in the lobby register I compare with firms that are equally large and write equally much text on their homepage, as in the second chapter.

The interval for the register firms is {{h12-null.ki_observed.range}}. Comparable means an equally long homepage and an equal number of authorised representatives, the people entered in the register for a firm. In only {{h12-null.draws_at_or_above}} of {{h12-null.draws}} random draws of such comparison firms did these reach the observed value or more.

::stage{id="h12-null"}

The gap is a factor of {{h12-null.ki_ratio}}, an odds ratio of {{h12-null.mh_or}} by Mantel-Haenszel, a method that compares only like with like. The same calculation gives {{h12-null.ratio_cloud}} for cloud, {{h12-null.ratio_digitalisierung}} for digitalisation and {{h12-null.ratio_nachhaltigkeit}} for sustainability, and for cloud ({{h12-null.ratio_cloud.range}}) and digitalisation ({{h12-null.ratio_digitalisierung.range}}) the interval reaches close to 1. Cyber is higher at {{h12-null.ratio_cyber}}. AI therefore sits in the range of the other novelty words.

The grey band shows what chance gives, and with fewer firms it gets wider. With 100 firms it runs from {{h12-null.width_n100_lo}} to {{h12-null.width_n100_hi}}, with 50 from {{h12-null.width_n50_lo}} to {{h12-null.width_n50_hi}}. Registered means lobbying on some topic, and because with so few firms there is no split by industry and the matching of website to firm is unchecked (recalculation follows), I read the result only as an association, without implying a motive. The share of registered firms grows with size, from {{h12-null.share_registered_1}} with one authorised representative to {{h12-null.share_registered_10}} with ten or more.

## Police and fire services

Press releases from police and fire services are public and numerous and advertise no products, even though the press offices choose what they publish. In {{h11-field.releases}} releases my pattern finds AI in at most {{h11-field.ai_hits}}, that is {{h11-field.ai_share}} (interval {{h11-field.ai_share.range}}). In the graphic they fill only {{h11-field.ai_squares}} of a square.

::figure{id="h11-field"}

{{h11-field.fraud_hits}} releases report on fraud, and {{h11-field.ai_in_fraud_hits}} of them name AI ({{h11-field.ai_in_fraud}}). Phone fraud appears in {{h11-field.phone_hits}} releases, internet fraud in {{h11-field.online_hits}}. For AI mentions no rise can be seen over {{h11-field.days}} days, the odds per month are {{h11-field.trend_odds_month}} (interval {{h11-field.trend_odds_month.range}}), and a value below 1 would mean a decline.

The bare abbreviation “AI” finds {{h11-field.naive_ki_hits}} releases, {{h11-field.naive_ki_city_code}} of them are a city abbreviation, and it overcounts by a factor of {{h11-field.naive_factor}} as a result. My more precise pattern finds at most {{h11-field.ai_hits}}, and among them is still the announcement of an action day, so {{h11-field.ai_hits}} is an upper bound for the hits of my pattern.

The releases show what the press offices publish, with more warnings than everyday events, and are no use as crime statistics. Because they name victims and suspects, only counts and no texts leave the database.

> **What you can do:** For every statement of the kind “X names AI on the homepage”, ask compared with whom and measured by which word. Count a second word such as cloud or sustainability as a yardstick before you wonder at a gap, and check how many firms stand behind the band of chance.
