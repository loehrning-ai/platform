# Method and limits

This is where the numbers come from and what they cannot bear. The data cut-off is 18 October 2026, and the scans date from March to May 2026.

## Where the numbers come from

| Building block | Status |
|---|---|
| Population | Firms to which I assigned a website by search, drawn from a pool of active limited companies with a location |
| Sample | Quota sample, not a random draw; Bavaria makes up 41 percent of the sample and 14 percent of the pool |
| Base | {{c4.raw.n}} reachable websites, of which {{c4.own.n}} with their own address and {{c4.weighted_total.n}} with a known state |
| Measurement | Text patterns in the source code of the website; scan from 16 March to 4 May 2026 |
| Repeat | {{c4.scan1.n}} websites, second retrieval after about {{c4.rescan_days}} days by a different route |
| Industry | derived from keywords, known for about two thirds of the base |
| Size | number of registered officers, not of employees |
| Weights | Business register 2024 of the Federal Statistical Office, all legal units per state, not only limited companies |
| Jobs | three portals, 18 search terms, 28 February to 16 June 2026, one job per employer and title |
| Intervals | 95 percent; Wilson for shares, bootstrap for model values |
| Minimum cell | Numbers below 5 do not appear, not even as rate times base |

An interval shows how far a value can swing from the choice of pages alone, and the fewer hits stand behind it, the longer it is. It does not capture the errors of the assignment and of the text pattern, which are described below. A difference between two values deserves to be taken seriously only if their intervals do not overlap.

All relationships in this book are exploratory, they describe what occurs together in this sample and say nothing about causes.

## Terms

| Term | Meaning |
|---|---|
| Interval | Range of a value from the choice of pages; 95 percent is usual |
| Weighting | Adjustment so that each state counts as it does in the register |
| Odds ratio | Comparison of the odds of two groups; 1 means no difference |
| Rank correlation | Measure of whether two rankings fit together; 0 means no link |
| Prediction score | Value between 0.5 and 1.0; 0.5 equals a coin toss |
| Quota sample | Selection by fixed shares, not by chance |
| Source code | The text behind a page that a browser reads |
| Aggregate | A number over many firms from which no single one can be read |

## What cannot be said

What stands on websites is measured. How many firms actually use AI is not, and so the value never stands next to the surveys from chapter 1. Micro businesses without a findable website do not appear in the data. Every statement in this book therefore applies to firms to which I assigned a website by search, and to nothing else.

An AI assistant checked {{c4.audit_pairs}} assignments, not a person. In {{c4.audit_own.num}} percent of the decidable cases (interval {{c4.audit_own.range}}) the address belongs to the firm, and in {{c4.audit_undecided.num}} percent this could not be decided. In a sample of {{c4.label_sample.num}} homepages, the pattern used to count the word AI hit a real mention of AI in {{c4.regex_precision.num}} percent of the cases ({{c4.regex_precision.range}}) and found {{c4.regex_recall.num}} percent ({{c4.regex_recall.range}}) of those that exist. Both errors almost cancel out in the overall value by chance: on the homepages that were read, {{c4.label_rate.num}} percent mention AI (interval {{c4.label_rate.range}}). For the analysis by industry, state or district that does not hold.

An AI assistant also judged the text patterns, and my cross-check of 30 cases is still open.

The industry is derived from keywords, and the sample is of different density per state. Patterns in the source code say nothing about what a firm does.

Earlier versions of this book contained a maturity score from 0 to 100 and the statement that most businesses are analogue, and both are deleted, because the score largely reflected how many checks had been run for a firm at all, and because "analogue" was never measured.

## Status and changes

This book carries a date. If numbers change because of new measurements, it says so here with the new data cut-off. The texts follow the numbers and not the other way round.

## Data protection

The analysis uses only counters and flags per website. Neither names nor email addresses nor phone numbers from the raw data enter it. The book shows no firms, no addresses and no rankings, because a single number should never let you read off a single firm. How the scanner works is explained on the page [loehrning.ai/bot](/bot).
