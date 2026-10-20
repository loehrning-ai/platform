# Two measurements, two pictures

I read {{h05-dots.pairs}} company websites twice. On {{h05-dots.rescan_lost}} of the AI hits the word was gone the second time.

A median of {{h05-dots.rescan_days}} days lay between the passes, the pages were read by two different routes that I call cameras, and both times the question was whether the word AI appears on the homepage. On the first pass it appeared on {{h05-dots.first_hits}} homepages, on the second it was missing from {{h05-dots.lost_hits}} of them, while only {{h05-dots.new_hits}} were new. With the second camera the rate was {{h05-dots.rescan_second}} instead of {{h05-dots.rescan_first}}. The factor is {{h05-dots.rescan_ratio}}. The interval ({{h05-dots.rescan_ratio.range}}) shows how far it can move through the choice of pages alone.

::stage{id="h05-dots"}

I do not know which camera is closer to the truth. On the first pass no page text was stored for {{h05-dots.text_missing_first}} of the pages (interval {{h05-dots.text_missing_first.range}}), and the AI word was detected while fetching. On the second pass all pages had text. And because the pages are not a random sample I do not carry the factor over to all firms.

## One question, several numbers

The same question gives four values: raw {{h05-waterfall.raw_share}}, without shared addresses {{h05-waterfall.own_share}}, weighted by state {{h05-waterfall.weighted_share}} and weighted by the shares of my own starting list {{h05-waterfall.weighted_pool}}. The raw value rests on {{h05-waterfall.reachable_sites}} reachable websites, and on {{h05-waterfall.shared_hosts_share}} of them several firms share one address. An AI assistant checked {{h05-waterfall.audit_pairs}} matches of firm to website, not a person, and by its judgement the address belonged to the firm in only {{h05-waterfall.audit_own}} of the cases (interval {{h05-waterfall.audit_own.range}}). That holds for every number that depends on company websites.

Without the shared addresses, {{h05-waterfall.base_sites}} homepages with their own domain remain. Bavaria makes up {{h05-waterfall.bayern_sample_share}} of my sample but only {{h05-waterfall.bayern_pool_share}} of the starting list I drew it from. So that Bavaria does not dominate the picture, each state counts with its share in the business register of the Federal Statistical Office, and then {{h05-waterfall.weighted_share}} remain (interval {{h05-waterfall.weighted_share.range}}). The weighting evens out the shares of the states, not the unknown selection of firms within a state. I carry on with this weighted value, even though its interval does not cover the uncertain matching.

::figure{id="h05-waterfall"}

Surveys report {{h05-waterfall.published_low}} to {{h05-waterfall.published_high}}, for example at [KfW](https://www.kfw.de/PDF/Download-Center/Konzernthemen/Research/PDF-Dokumente-Fokus-Volkswirtschaft/Fokus-2026/Fokus-Nr.-554-Juli-2026-KI_Mittelstand.pdf) and at [Bitkom](https://www.bitkom.org/Presse/Presseinformation/Erstmals-nutzt-die-Mehrheit-der-Unternehmen-KI). They ask about use inside firms. My number describes what you can read from outside on a homepage, for firms with a findable website, and it cannot be compared with these surveys.

## The second camera

The technology behind the pages also looks different depending on the camera. On {{h05-ladder.pairs}} websites that both cameras read, the second found WordPress again in {{h05-ladder.wordpress_refound}} of the cases, the cookie notice from Borlabs in {{h05-ladder.borlabs_refound}}, Google Maps in {{h05-ladder.maps_refound}} and the tag manager in only {{h05-ladder.gtm_refound}}.

My earlier score for firms showed the same. I dropped it. It went closely with how often someone had looked: where checks ran it stood at {{h05-ladder.score_measured.num}}, where none ran at {{h05-ladder.score_not_measured.num}}.

::figure{id="h05-ladder"}

Since then a rescan has run, a fresh pass over {{h05-waterfall.rescan_sites}} websites that checks every website against its legal notice. Of these, {{h05-waterfall.rescan_read}} were reachable, and on {{h05-waterfall.rescan_match}} of them the legal notice names the firm, that is {{h05-waterfall.rescan_match_share}}. On {{h05-waterfall.rescan_no_match}} it does not match, on {{h05-waterfall.rescan_unclear}} it stays open. With the websites the rescan could read, without those whose legal notice names another firm, I recalculated the districts, the states and the estimator in chapter 8. All other numbers of this edition, including those at the start of this chapter, still stand as of October 2026.

> **What you can do:** Of every AI number, ask three things: what it was measured with, on how many cases and when. That goes for mine too. Write the three details next to the number before you pass it on, and take the number only as an example if one is missing. In your own organisation too, measure twice before you believe a number.
