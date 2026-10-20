# In the shop window

::ticker{ref="c3.read_sample" tail="homepages were read by an AI assistant to see what stands behind the word AI."}

The homepage is a firm's shop window. The text pattern found the word AI on {{c3.regex_hits}} of the {{h05-waterfall.base_sites}} homepages with their own domain.

A text pattern is only a search rule in the text of the page. An AI assistant read and judged the pages, with no human check. By its judgement, of the pages read that mention AI, {{c3.read_narrow}} show concrete proof in the narrow reading (chatbot, machine learning, AI job, AI rules; interval {{c3.read_narrow.range}}) and {{c3.read_broad}} in the broad reading (every named AI function and every AI offer; interval {{c3.read_broad.range}}).

::figure{id="c3"}

Take as an example two sentences I made up: “Our customers benefit from state-of-the-art AI.” and “Our AI assistant answers appointment questions, and an employee checks every suggestion.” The first holds only the word, the second a function that a visitor can try and a firm can explain. Most often the pattern found a chat widget or AI tool ({{c3-evidence.tool}} of the pages with a hit), then a hint of machine learning or a case study ({{c3-evidence.ml}}).

::figure{id="c3-evidence"}

Of the pages on which the pattern found the word, {{c3.trace_precision}} showed concrete proof by the assistant's judgement (interval {{c3.trace_precision.range}}). Conversely, the pattern finds only {{c3.trace_recall}} of the pages that show concrete proof in the broad reading. In this sample the word AI alone says little about what stands on a page.

## Consultant pages name the EU AI Act often, firm pages rarely

On the {{h04-dumbbell.consult_pages}} homepages of AI consultants the EU AI Act appears in {{h04-dumbbell.ai_act_consult}} of cases, on the {{h04-dumbbell.firm_pages}} firm pages in {{h04-dumbbell.ai_act_firms}}. The comparison is skewed, because {{h04-dumbbell.consult_ki_share}} of the consultant pages carry the word AI themselves, among firms with text read it is {{h03-strip.ki_share_firms}}. Count only pages with the AI word and the EU AI Act remains {{h04-dumbbell.ai_act_ratio_ki}} times as frequent, agents {{h04-dumbbell.agent_ratio_ki}} times.

::figure{id="h04-dumbbell"}

Digital sovereignty stands strikingly often together with the AI word, even though most of the {{h04-forest.sov_pages}} firm pages that write sovereignty or data sovereignty belong to IT and cloud vendors. {{h04-forest.sov_ki_pages}} of them also say AI ({{h04-forest.sov_ki_share}}, interval {{h04-forest.sov_ki_share.range}}), on all other firm pages it is {{h04-forest.ki_share_without}}. For GDPR no association is visible, the odds ratio is {{h04-forest.dsgvo_or}} (interval {{h04-forest.dsgvo_or.range}}).

::stage{id="h04-field"}

## The clock of the homepage

Only {{h07-curve.dated_share}} of the homepages show a date. Homepages whose newest date is from 2026, that is from January to early April, name AI {{h07-curve.rate_ratio}} times as often at equal text volume as homepages from 2022 or older (interval {{h07-curve.rate_ratio.range}}). For {{h07-curve.stale_share}} of the dated pages the newest date is 2023 or older.

::figure{id="h07-curve"}

The date measures freshness. Whether a page is neglected cannot be read from it, because for some the newest date stands next to a founding year, a status date or a copyright line. The years firms quote are mostly rounded: among my {{rand-kap3.rounded_n_plain}} figures without a qualifier (“N years of experience”), {{rand-kap3.rounded_plain}} are multiples of five, with “over” or “around” it is {{rand-kap3.rounded_ueber}}.

> **What you can do:** Read your homepage like a visitor and mark every sentence with AI. Find beside each one a proof that can be checked, such as a function, an example or a rule, and put a date under it. If you find no proof, delete the sentence or add one.
