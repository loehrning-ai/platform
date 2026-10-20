# Sources, status, limits

Data as of October 2026, scanned from February to August. In {{h05-waterfall.audit_own}} of the firm-to-website matches the firm is right, so findings with firm attributes are being recalculated; no finding holds for Germany as a whole.

| Finding | Size and period | Base | Verification |
|---|---|---|---|
| Two measurements, two pictures (chapter 1) | {{h05-dots.pairs}} · March to April 2026 | websites with their own domain, scanned twice |  |
| Raw value and weighting (chapter 1) | {{h05-waterfall.reachable_sites}} · March to May 2026 | reachable company websites | websites are being rechecked |
| Text volume (chapter 2) | {{h01-bars.pages}} · March to May 2026 | homepages with their own domain and text |  |
| Saying and showing (chapter 3) | {{c3.read_sample}} · March to May 2026 | homepages read |  |
| Consultants and firms, sovereignty (chapter 3) | {{h04-dumbbell.firm_pages}} · March to May 2026 | firm homepages, plus {{h04-dumbbell.consult_pages}} consultant pages | websites are being rechecked |
| Date of the homepage (chapter 3) | {{h07-curve.pages_dated}} · April 2026 | homepages with an explicit date |  |
| Job ads (chapter 4) | {{h02-blocks.raw_ads}} · February to June 2026 | ads with an AI word or data scientist in the title |  |
| Names in the shop window (chapter 4) | {{h03-strip.firm_pages}} · March to June 2026 | firm pages, plus consultant pages, jobs and releases |  |
| Districts (chapter 5) | {{h06-slope.firms}} · March to May 2026 | firms in districts with enough firms | websites are being rechecked |
| States (chapter 5) | {{h10-tiles.firms_land}} · March to May 2026 | firms with a known state | websites are being rechecked |
| Lobby register (chapter 6) | {{h12-null.register_firms}} · March to May 2026 | registered firms with a homepage |  |
| Police and fire services (chapter 6) | {{h11-field.releases}} · February to August 2026 | press releases |  |
| Certificates and services (chapter 7) | {{h09-field.cert_n}} · March to June 2026 | certificates, plus smaller subsets |  |
| Server and headers (chapter 7) | {{h08-field.firms_headers}} · March to May 2026 | websites with stored headers |  |

## What cannot be said

An AI assistant checked {{h05-waterfall.audit_pairs}} matches of firm to website, not a person, and in {{h05-waterfall.audit_own}} of the cases (interval {{h05-waterfall.audit_own.range}}) the address belonged to the firm by its judgement. An AI assistant also judged whether the text patterns hit correctly, with no human check. The rescan, a fresh pass over all pages, is currently checking every website against its legal notice, and afterwards all findings with firm features such as state or size will be recalculated. It does not touch the job ads and press releases, which would need a second pull in January 2027.

Job ads and press releases are samples of their own with their own selection. What is measured is what stands on websites, micro-businesses without one are missing. What firms use is not captured by it. All associations are exploratory. They describe what occurs together in this sample and say nothing about causes. An interval of 95 percent shows only how far a value can move through the choice of pages alone, and neither the errors of the matching nor the errors of the text patterns are in it. The interval in the estimator of chapter 8 comes from many recalculated model runs and is wider than a plain count, because industry, state, size and text length are estimated together; “Basis” is the number of firms in the smallest of your four choices. Hit counts below 5 never appear, not even when they could be calculated back from rate and base. The weights of the states follow the business register 2024 of the Federal Statistical Office.

The analysis uses only counts and flags per website, no names, addresses or phone numbers. The book shows neither firms nor rankings of individual firms. How the scanner works is explained on the page [loehrning.ai/bot](/bot).

Legal basis: Regulation (EU) 2024/1689, amended by (EU) 2026/1744 (CELEX 32026R1744). See chapter 8.
