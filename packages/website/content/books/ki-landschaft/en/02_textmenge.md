# Who writes a lot writes AI

::ticker{ref="h01-bars.pages" tail="homepages, sorted by the length of their text and split into five equal groups."}

The longest fifth of homepages says AI {{h01-bars.ratio}} times as often as the shortest.

In the shortest fifth the median text length, that is the middle character count, is {{h01-bars.median_q1}} characters, in the longest {{h01-bars.median_q5}}. There the word AI appears on {{h01-bars.q1:2}} of the pages, here on {{h01-bars.q5}}. The interval of the factor is {{h01-bars.ratio.range}}, and pages with no text read at all are missing from it. One possible explanation is simply room, because more fits on a long homepage.

::figure{id="h01-field"}

For many numbers about homepages you therefore have to settle whether they hang on AI or only on text volume. I collected {{h01-net.nodes}} features of homepages, from the cookie notice to the word sustainability, and each feature is a point in the network. Two points are joined by a line if, after a correction against chance hits, they appear together at least twice as often as chance would lead you to expect. Without regard to text volume that gives {{h01-net.edges_raw}} connections. If I split the pages into ten levels by text length and compare only pages of the same level, {{h01-net.edges_equal}} remain, with 50 levels {{h01-net.edges_s50}} and with 100 levels {{h01-net.edges_s100}}.

::stage{id="h01-net"}

Around half of the connections vanish, then, as soon as the text volume is equal. The number of features a page carries shows the same. The more of the {{h01-dose.signals}} other features stand on a page, the more often AI stands there too, from {{h01-dose.zero_rate}} with no feature to {{h01-dose.top_rate}} with eleven or more. Hold the text volume fixed and no difference is visible for each additional feature, the odds ratio is {{h01-dose.or_signal_s10}} (interval {{h01-dose.or_signal_s10.range}}). The odds of a group are its share with the AI word divided by its share without, an odds ratio compares the odds of two groups, and 1 means: no difference.

::figure{id="h01-dose"}

## What remains

Of {{h01-friends.features_tested}} features that I tested one by one against AI, {{h01-friends.features_crude_sig}} stand out at first. At equal text volume they keep a median of {{h01-friends.features_effect_kept}} of their effect, and {{h01-friends.features_lost}} lose it entirely. A few features stay linked to AI. The word digitalisation has an odds ratio of {{h01-net.or_digitalisierung}} with the AI word, the words cyber and phishing reach {{h01-net.or_cyber_phishing}}, NIS2 and ESG, the EU rules on cybersecurity and sustainability reports, reach {{h01-net.or_nis2_esg_lksg}}, and the pattern also counts compounds such as digitalisation strategy. Pages with a Facebook link mention AI less often (odds ratio {{h01-friends.or_nfacebook}}), pages with a Google map even less ({{h01-friends.or_tgooglemaps}}).

::figure{id="h01-friends"}

Holding text volume equal may take away too much, because text volume is perhaps itself part of the explanation. The network shows only associations, and what was read is the main content of the homepage without the footer. Where I can, I therefore compare pages with equal text volume in this book. For {{rand-kap2.once_share}} of the pages with the AI word it appears only once, and only {{rand-kap2.topic_share}} of all pages make AI a topic, with at least five mentions or a heading.

> **What you can do:** Count the characters of your homepage and set them beside the medians of the five groups: {{h01-bars.median_q1}}, {{h01-bars.median_q2}}, {{h01-bars.median_q3}}, {{h01-bars.median_q4}} and {{h01-bars.median_q5}}. Only then read anything into a single word, for yourself and for others. Compare homepages only with pages of similar length.
