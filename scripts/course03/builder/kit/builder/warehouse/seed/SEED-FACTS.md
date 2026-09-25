# Seed facts: every number, and where it comes from

## In plain words

FOLDLINE is made up. Its numbers are not. They must stay the same across the deck, the guide, the lab, the kit, the web page and this warehouse. This page lists every number the builder uses and labels its origin:

- **DECK**: a fixed fact shown in the workshop. Never change it.
- **RECORDED AI ANSWER**: what an AI answered in the recording. One run each: an observation, not a benchmark.
- **DECK EXPORT-LANE CHECK**: the deck's own database checks on the export lane (fixedSql). This seed reproduces them exactly.
- **DEMO-ONLY FILL**: needed for the demo and the bathtub. Not in the deck. Keep it consistent.
- **REPLAY**: rows from the deck's replay data (G04, G05).
- **DRY RUN**: what Claude answered in Chat A rehearsals. One run each: observations.
- **GENERATED**: produced by `generate_seed.py`. May change if the seed changes. Never quote these as facts from the workshop.

`generate_seed.py` asserts every row marked DECK, RECORDED, DECK EXPORT-LANE CHECK, DEMO-ONLY FILL and REPLAY before it writes anything. The generated SQL asserts them again when it loads. `sql/80_export_lane_replay.sql` asserts the wrong answers once more.

## Company

| Fact | Value | Origin |
| --- | --- | --- |
| Accounts | 144 business accounts, 48 each in Enterprise, Mid-Market, SMB | DECK |
| Countries | AT, CH, DE, FR, GB, NL, PL, SE; 18 accounts each | GENERATED (the 8 codes follow the replay) |
| Currency, time zone | EUR, UTC | DECK |
| Period | January 2025 to June 2026; 2,592 account-months | DECK (appendix) |
| Question | "Show ending MRR by month for the last complete quarter." | DECK |
| Last complete quarter | Q2 2026 (April to June) | DECK |

## Ending MRR and net new MRR

| Month | Ending MRR (level) | Net new MRR (change) | Origin |
| --- | ---: | ---: | --- |
| Dec 2025 | 258,785 | | DEMO-ONLY FILL |
| Jan 2026 | 272,995 | +14,210 | DEMO-ONLY FILL |
| Feb 2026 | 294,475 | +21,480 | DEMO-ONLY FILL |
| Mar 2026 | 354,635 | +60,160 | DECK |
| Apr 2026 | **334,675** | −19,960 | DECK |
| May 2026 | **344,450** | +9,775 | DECK |
| Jun 2026 | **387,015** | +42,565 | DECK |
| Q2 2026 net new | | **32,380** = 387,015 − 354,635 | DECK |

Identities: 258,785 + 14,210 + 21,480 + 60,160 − 19,960 = 334,675. The sum of the three Q2 levels, 1,066,140, describes nothing; it is only a teaching counter-example.

## Accounts and churn

| Fact | Value | Origin |
| --- | --- | --- |
| Active at the end of March 2026 | 120 (40 per segment) | DECK (40 per segment) |
| Churned in Q2 | 4 per segment (1 in April, 2 in May, 1 in June) | DECK (4 of 40); month split GENERATED |
| Joined in Q2 | 8 per segment (2 in April, 2 in May, 4 in June) | DECK (48 total per segment) |
| Active at the end of June | 44 per segment = 40 − 4 + 8 | DECK arithmetic |
| Logo churn rate Q2 | 4 of 40 = **10.0 %** per segment | DECK |
| Active accounts at month end | Apr 123, May 123, Jun 132 | GENERATED (follows from the above) |
| Distinct accounts active at any Q2 month end | 141 | GENERATED (follows from the above) |
| Export status codes | A active, C churned, N new: 108 A, 12 C, 24 N | DECK (codes); counts follow from the above |

## Expansion by country (G04) and top accounts (G05)

| Country | Q2 expansion MRR (true) | Deck export-lane check (with retry copies) | Origin |
| --- | ---: | ---: | --- |
| CH | 1,990 | 1,990 | REPLAY |
| DE | 1,780 | 1,895 (+115) | REPLAY |
| FR | 1,780 | 1,780 | REPLAY |
| SE | 1,780 | 1,780 | REPLAY |
| NL | 1,655 | 1,885 (+230) | REPLAY |
| PL | 1,640 | 1,825 (+185) | REPLAY |
| AT | 1,565 | 1,955 (+390) | REPLAY |
| GB | 705 | 705 | REPLAY |

Top ten accounts by ending MRR in June 2026 (all Enterprise, plan Enterprise), REPLAY: fl_0006 PL 7,705 · fl_0132 NL 7,695 · fl_0060 NL 7,595 · fl_0114 AT 7,435 · fl_0078 PL 7,385 · fl_0042 AT 7,335 · fl_0069 FR 7,280 · fl_0033 DE 7,265 · fl_0123 CH 7,250 · fl_0087 SE 7,235. Every other account is below 7,235 in June. fl_0123 and fl_0132 joined in June 2026.

## Recorded AI answers (export lane)

| Case | Answer | What went wrong | Origin |
| --- | --- | --- | --- |
| G01 ending MRR | −19,960 / 9,775 / 42,565 | `monthly_revenue.amount` (a change) summed per month and labelled ending MRR | RECORDED AI ANSWER |
| G02 net new MRR | −17,595 | June change minus March change: 42,565 − 60,160 | RECORDED AI ANSWER |
| G03 logo churn | 0 of 0, no rate | Searched `'active'`; the table stores `'A'` | RECORDED AI ANSWER |

## Deck export-lane database checks (fixedSql), reproduced by this seed

| Case | Deck rows | How the seed produces them |
| --- | --- | --- |
| G01 | 314,715 / 354,225 / 429,580 | `acct_history.balance` is the month-END level; `balance + change` counts the month twice (334,675 − 19,960, and so on). |
| G02 | 27,055 | `billing_events` posted Q2 sum. Retry copies add −225 (event ids 228 +115, 247 −1,145, 266 +230, 285 +390, 304 +185). Four June SMB sign-ups are `pending` (5,100) and drop out. 32,380 − 225 − 5,100 = 27,055. |
| G03 | 4 of 48 = 8.33 % per segment | `customer_master` counts all 48 accounts, including the 8 Q2 joiners. |
| G04 | see the table above | Retry copies of one expansion each in AT, DE, NL, PL. |
| G05 | Same values, keys `6`, `132` ... | Raw `id`s instead of `account_key`: right numbers, wrong identifiers. |

Because the seed matches, `80_export_lane_replay.sql` labels these rows "recorded fixture". If a future seed stops matching, the replay fails loudly; relabel them "builder re-creation, not the recorded fixture" rather than printing the deck numbers as the builder's own.

## Dry runs (Chat A, export CSVs, no instructions)

| Observation | Value | Origin |
| --- | --- | --- |
| Recognised `amount` as a monthly change | yes, in the Chat A rehearsal runs | DRY RUN |
| Running totals from January, labelled "Ending MRR", with a caveat about the missing opening balance | 75,890 / 85,665 / 128,230 | DRY RUN |
| The gap to the truth | 258,785 in every month: the December 2025 level the export does not contain | arithmetic |

The rehearsal CSVs were regenerated from this seed, so their per-segment splits changed. Company totals did not. April is negative in every segment in the new file too (−13,285 / −3,080 / −3,595), a hint the rehearsal runs relied on. **Re-run the three Chat A dry runs before the next live session**; do not assume the old transcripts carry over.

## Freshness

| Fact | Value | Origin |
| --- | --- | --- |
| Loaded | 2026-07-01 06:00 UTC | DECK |
| Evaluation clock | 2026-07-01 09:00 UTC, age 3 h, fresh | DECK |
| Warn after | 36 h | DECK |
| Hard expiry | none written | DECK |
| What-if | 2026-07-03 18:00 UTC, age 60 h, answer with a warning | DECK |
| Complete through | 2026-06 | DECK |
| Definition version | 1.0.0 | kit |

## Generated (may change with the seed)

| Month | New | Expansion | Contraction | Churned | Net new |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mar 2026 | 48,060 | 12,880 | 780 | 0 | 60,160 |
| Apr 2026 | 9,255 | 2,750 | 21,845 | 10,120 | −19,960 |
| May 2026 | 21,900 | 3,850 | 2,645 | 13,330 | 9,775 |
| Jun 2026 | 44,780 | 6,295 | 830 | 7,680 | 42,565 |

The net new column is DECK; the four components are GENERATED. April's story: 28 accounts downgraded in a plan migration, and the largest ordinary account of each segment left.

Other generated values: 318 billing movements (334 rows with 16 retry copies), 1,388 `acct_history` rows, 378 `usage_log` rows, 60 `tickets`, account start and churn dates, the segment split of `monthly_revenue`.

## Identifiers

`account_name` is `Account 0001` to `Account 0144`. `contact_email` is NULL for every account. There are no people, addresses, phone numbers or credentials anywhere in the seed.

## Never say

| Never say | Say instead |
| --- | --- |
| "the same model" | "the same AI route" |
| "benchmark", "the AI scores 3 of 3" | "one recorded run per case: an observation" |
| "the AI scored 9 of 9" / "22 of 22" | "the database checks pass; they test the setup and course rules, not the AI" |
| "the definition was used" | "it was loaded; the runs cited it 0 of 3" |
| "read-only, so it is safe" | "two locks: refuse early, enforce anyway" |
| "production-ready" | "limited pilot, not signed off" |
| a GENERATED number as a workshop fact | the DECK number, or "in this seed" |
