# The same firm, measured twice

As I remember it, a team at Apple was dead certain its data pipeline was clean. For three weeks we did nothing but count: how often a job fails, how many fields stay empty, how old the last update is. The result came in clearly below the team's own estimate. It was not sloppiness, nobody had simply looked before. This chapter does the same with the own number.

The question sounds simple: on how many company websites does the word AI appear? The answer depends on how you count.

## Several calculations, several values

Counted raw, AI appears on {{c4.raw_share.num}} percent of {{c4.raw.n}} pages. On {{c4.shared_hosts_share.num}} percent of these pages, several firms share the same address. The attribution there is doubtful: in a check, only about one in three of these addresses belonged to the firm ({{c4.audit_shared.num}} percent).

Without those pages, {{c4.own.n}} websites with their own address remain, with a value of {{c4.own_share.num}} percent. It falls by almost half, so the word must appear far more often on the shared pages than on the rest.

Then comes weighting. Bavaria makes up {{c4.bayern_sample_share.num}} percent of the sample but only {{c4.bayern_units_share.num}} percent of the legal units in the statistical business register ({{c4.bayern_pool_share.num}} percent in my pool of limited companies). So that no single state decides the overall picture, every state counts with its share in the statistical register: an overrepresented state counts for less, an underrepresented one for more. That brings the value down to {{c4.weighted_share.num}} percent. With the pool shares, the result would be {{c4.weighted_pool.num}} percent.

::figure{id="C4"}

The second route is harder. For {{c4.scan1.n}} websites the scan was repeated after about {{c4.rescan_days}} days, with the same firms and the same question. In the first pass AI appeared on {{c4.rescan_first.num}} percent of the pages, in the second on {{c4.rescan_second.num}} percent. That is a factor of about {{c4.rescan_ratio.num}} (interval {{c4.rescan_ratio.range}}).

The two passes read the pages by different routes, and the {{c4.scan1.n}} pages were not a random selection: in the first pass AI already stood on {{c4.rescan_first.num}} percent of them, against {{c4.own_share.num}} for all pages with their own address. So the factor must not be carried over to the overall number.

A second pass over all pages with their own address, with a single procedure, is planned for the end of 2026. Until then the numbers in this edition (scan March to May 2026, as of 18 October 2026) carry a reservation that applies to every number in this book, the weighted one included.

## Whoever writes more says AI more often

Another effect concerns the pages themselves. Split the {{c5.n}} pages with readable text into five equal groups by amount of text, and AI appears on {{c5.q1.num}} percent of the pages in the shortest fifth and on {{c5.q5.num}} percent in the longest. That is a factor of {{c5.ratio}} (interval {{c5.ratio.range}}), and the shortest fifth holds only {{c5.q1_hits}} hits. The interval shows how much such a value can swing from the choice of pages alone.

::figure{id="C5"}

Two explanations are possible, and they cannot be separated: a long page has more room for the word, and the text pattern may be wrong more often on long pages. It does not follow that firms with more text do more with AI. Pages without readable text are missing from this calculation, although AI stands on more of them ({{c5.no_text_rate.num}} percent). This calculation also comes from the old scan and will be redone after the second pass.

Depending on the calculation, the same data give {{c4.weighted_share.num}}, {{c4.own_share.num}} or {{c4.raw_share.num}} percent, and in the repeat {{c4.rescan_first.num}} or {{c4.rescan_second.num}}. Each of these numbers answers a slightly different question, and which one fits yours depends on what you need it for. Ask for the base and the method behind every AI share, and treat the number as an anecdote if you get no answer. And measure what you tell people inside your own house before you pass it on.
