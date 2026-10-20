# The country is not a league table

::ticker{ref="h06-slope.firms" tail="firms in {{h06-slope.kreise}} districts, each district split at random into two halves."}

If a ranking of districts measures something stable, both halves must give the same order. That is hardly the case.

The rank correlation measures whether two orders fit together, and 0 would mean: no association. For the two halves it is {{h06-slope.split_r}} (interval {{h06-slope.split_r.range}}), and estimated for the full data {{h06-slope.spearman_brown}}. The ten top districts of the first half sit there on average at {{h06-slope.top_a}} times the overall rate, in the second half only at {{h06-slope.top_b}} times (interval {{h06-slope.top_b.range}}).

::stage{id="h06-slope"}

The order is somewhat more stable only where many firms stand. In the {{h06-slope.big_kreise}} largest districts the correlation is {{h06-slope.big_r}}, and the top falls only from {{h06-slope.big_top_a}} to {{h06-slope.big_top_b}}. For most districts my sample has too few firms to rank them. I derived the district from the postcode.

The public regional data I used improve a model with industry, size and legal form together by only {{h06-region.gain_all}} AUC points (interval {{h06-region.gain_all.range}}), the state alone adds {{h06-region.gain_land}} (interval {{h06-region.gain_land.range}}). AUC measures how well a model separates pages with and without the AI word, and 0.5 would be a coin toss. The measure is coarse for small groups and does not contradict the gradient in the east that follows right away.

::figure{id="h06-region"}

## What the map shows all the same

At first sight Bavaria sits above the rest, the odds ratio of Bavaria against the rest is {{h10-tiles.bayern_or_all}} (interval {{h10-tiles.bayern_or_all.range}}). In the like-for-like core, the {{h10-tiles.core_firms}} firms found by search that have a register purpose, it is {{h10-tiles.bayern_or_core}} (interval {{h10-tiles.bayern_or_core.range}}), so no visible lead. The lead sits in {{h10-tiles.lead_firms}} firms found by a single route, of which {{h10-tiles.lead_bayern_share}} come from Bavaria. Bavaria makes up {{h10-tiles.bayern_sample_share}} of the sample and {{h10-tiles.bayern_pool_share}} of the starting list.

::figure{id="h10-tiles"}

In the east a gradient shows that narrowly holds even with economic strength and density. For all five eastern states without Berlin the odds ratio with industry, size and legal form as comparison is {{h10-or.east_or_adjusted}} (interval {{h10-or.east_or_adjusted.range}}), with economic strength and density {{h10-or.east_or_wealth}} (interval {{h10-or.east_or_wealth.range}}). Only after looking at the data did I single out four states without Brandenburg. There it is {{h10-or.or_east4_text}} at equal text volume (interval {{h10-or.or_east4_text.range}}), {{h10-or.or_east4_ind}} at equal industry, and Brandenburg stands at {{h10-or.or_bb_text}}.

::figure{id="h10-or"}

In my ads the east has per inhabitant {{h10-or.jobs_per_head}} of the jobs of the west, for AI titles {{h10-or.ai_jobs_per_head}}, and the AI share of all jobs is {{h10-or.ai_share_east}} against {{h10-or.ai_share_west}}, a ratio of {{h10-or.ai_share_ratio}} (interval {{h10-or.ai_share_ratio.range}}) that includes 1. Measured against all data jobs, AI jobs are thus not demonstrably rarer in the east.

I calculated the firm values in this chapter only with websites the rescan read, without the {{h05-waterfall.rescan_no_match}} whose legal notice names another firm, for the states that is {{h10-tiles.firms_land}} firms. On the strict base, only the {{h05-waterfall.rescan_match}} websites whose legal notice names the firm explicitly, Bavaria's interval includes 1, and the gap in the east no longer stands out among all groups of five states. I stay with the broader base, because an open legal notice is not a wrong match and the strict selection keeps only a little over a third of the websites. Behind the east stand {{h10-or.east_hits}} hits, carried by small states, and states with fewer than five hits are pooled.

> **What you can do:** Compare yourself with your industry and with a range for your region, never with a league table. With every map, read how many firms stand behind a value, and distrust the top, because in my data it fell back in the second half.
