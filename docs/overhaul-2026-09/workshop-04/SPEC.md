# Workshop 04 build spec: ESG Reporting with AI

Final build spec. Date: 2026-09-26. Slug `esg-berichte-mit-ki`, number `"04"`.

- EN title: ESG Reporting with AI: From Raw Inputs to Clearer Insights
- DE title: ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen
- Topic: `ESG-Berichte` / `ESG reporting`

Base: concept A ("Same question, two data states"). Both judges picked it. This spec adds the judges' grafts from B and C and fixes every mustFix item (log in §0.3).

## 0. How to use this spec

### 0.1 Single source of truth

Every number in the deck, presenter notes, demo, guide, field card, transfer sheet, kit and registry comes from `data/w04-data.json`, built by `data/build_dataset.py` (Python 3, standard library, `decimal.Decimal`). Run it with `python3 data/build_dataset.py`. The script:

- defines every raw input and every teaching factor once;
- computes Scope 1, Scope 2 location-based and market-based, totals, change against 2024, the drivers of the change, intensity figures, the constructed raw-folder answer, both waterfalls, all 128 trap combinations for the demo, the control total, the ledger and the coverage grid;
- asserts the headline arithmetic, that the rounded waterfall bars sum to the rounded end totals, that the ledger rows sum to the model totals, that the meter readings reproduce every monthly bill, and that no en or em dash appears in any output;
- writes `data/w04-data.json` and the kit files under `data/kit/` (all CSVs plus the 20 text-rendered bills as `.md`).

Notation in this spec: `{key}` means `numbers.key` in `w04-data.json`. Each number has `value` (unrounded), `rounded`, `en` and `de` display strings. Literal numbers next to a key are there for reading only; the build renders the JSON string. Other JSON paths are written in full, for example `waterfall.lb`, `combinations`, `ledger`, `drivers.lb`, `traceTwo`, `documents`. Appendix inputs are in `inputs.variant2023` (A6) and `inputs.steel` (A7). Sign convention: `numbers.gap_*` are absolute gaps; `combinations[mask].delta_vs_right_*` are signed (that state minus the right answer, negative = below).

Display conventions: EN `1,915.2`, DE `1.915,2`. Negative numbers use U+2212 (−) on screen and ASCII `-` inside CSV files. Totals are computed from unrounded values and rounded once (0.1 t, half up): 1,350.496 becomes 1,350.5; 495.504 becomes 495.5. Waterfall bars are rounded to 0.1 t and still sum to the end total. No en or em dashes anywhere; the script and the registry tests check this.

### 0.2 Files produced by this spec

| Path (scratchpad `w04/`) | What |
|---|---|
| `data/build_dataset.py` | The generator |
| `data/w04-data.json` | All numbers, traps, waterfalls, combinations, ledger, grid, documents, trace answers, demo sequence |
| `data/kit/…` | Kit CSVs and bills (see §7.1 for the full kit tree, including the Markdown files whose text is in §7) |
| `SPEC.md` | This file |

### 0.3 Decisions log: mustFix items and grafts

| # | Item | Decision in this spec |
|---|---|---|
| M1 | Relative dates in notes ("since yesterday", "from tomorrow") | Every date is absolute: "since 27 September 2026". |
| M2 | "Two pairs cancel almost exactly" was wrong | New line: "The duplicate and the missing October cancel to 2.0 t `{pair_dup_oct_t}`. The Talbrück bill hides four fifths `{jv_hides_unit_share_pct}` of the unit error." |
| M3 | OCR noise in the invoice number broke the unique key | The invoice number on `Scan_Rechnung_Maerz.md` is clean (`4711-03`). The OCR noise is in the supplier name ("Lindmark Enerqie GmbH"), the label ("Abrechnungs zeitraum") and a stray line break in the address. Rule 2 and prompt 02 still teach normalisation (O→0, l→1) and a fallback key (period + meter + quantity). |
| M4 | Gas bills did not multiply out "exactly" | Page 2 prints the conversion with its result to two decimals and "kaufmännisch gerundet": 169,817 m³ × 0.9600 × 11.348 = 1,849,999.98 kWh → 1,850,000 kWh; 22,077 m³ × 0.9600 × 11.324 = 239,999.95 kWh → 240,000 kWh. The script asserts the rounding. The word "exactly" is gone. |
| M5 | The two waterfalls used different scopes | Both waterfalls are Scope 1 + 2, same fixed order T1 to T7 (`waterfall.lb`, `waterfall.mb`). MB: 1,866.0 → 1,893.2. The demo uses the same convention. |
| M6 | Grid-factor insight rests on teaching values | Every mention says "in this case's teaching values" and "location-based only". The caption on `what-drove-it` states that the residual mix is held at 0.60 in both years on purpose, so the market-based bridge has no factor effect, and that real residual mixes change every year. |
| M7 | The "six errors, 2.5% off" wow depends on all traps firing | The waterfall, anatomy scene and demo present "what these traps do when they fire", computed from the traps. The raw-folder answer carries "Constructed: what the answer looks like when all six traps fire. Not a recorded run." on every surface. Recorded runs are shown separately (appendix A3, demo section 6) with a per-trap catch table. 1,866.5 t is never labelled recorded. |
| M8 | EmpCo wording | Ask-back card 4 is "Write that we are climate-neutral." The refusal rests on evidence: nothing in the ledger supports it. The note says what Directive 2024/825 bans towards consumers from 27 September 2026, leaves the question whether a given text is aimed at consumers to a lawyer, and adds that misleading claims are banned towards business customers too (in Germany § 5 UWG). It gives no legal classification of Kellbrunn's own texts (verification round 2, F1 to F3). Footer on regulatory scenes: "Rules as of 26 Sep 2026. Not legal advice. Check the German transposition. Green Claims Directive stalled (status UNVERIFIED)." |
| M9 | Name risk "Fernholt" vs W.u.H. Fernholz GmbH & Co. KG | Renamed to **Kellbrunn Präzisionsteile GmbH**. Web search on 2026-09-26 for "Kellbrunn" GmbH, "Talbrück" Beschichtung and "Lindmark Energie" found no company. Handelsregister and DPMA checks for all four names (Kellbrunn, Talbrück Beschichtung, Lindmark Energie, Grundstücksverwaltung Lager Ost GbR) and the appendix supplier "Bandstahl Wendelin GmbH" go into `PUBLICATION.md` before publication (open item O2). |
| M10 | B's baseline: never call unrestated −39.4% "correct" | Appendix A6 leads with the restated base year (GHG Protocol requirement for a significant structural change) and the like-for-like −13.5%. The unrestated figure appears only as "what the unrestated comparison would wrongly show". |
| M11 | B's demo line "T3 + T4 barely move the total" was wrong | Demo step 5 uses T1 + T2 (duplicate + October): +2.0 t `{pair_dup_oct_t}`. T3 + T4 together move −95.5 t `{pair_jv_unit_t}`. |
| M12 | C's "13 months" evidence was false | Decision-lab evidence uses A's wording, sharpened: twelve files do not show twelve months (one is doubled, one covers two months, one belongs to another company). |
| M13 | C's "since 2023" card | Card 5 asks about the change against 2024. The 2023 base year exists only in the appendix variant. |
| M14 | Prompts and rounding note | Prompt 01 copies the invoice number exactly and flags OCR-looking characters without fixing them. Prompt 02 checks duplicates on the normalised key and the fallback key. `erwartet/ergebnisse_2025.md` states the rounding convention. |
| M15 | Load for a non-technical room | Act 2 keeps Hs/Hi and AdBlue as two small cards on `anatomy` with no vote. None of C's extra traps (denominator, writer register) enter the main path. |
| M16 | CSRD scope statement | "Kellbrunn has never been in CSRD scope. Since 18 March 2026 the EU line is more than 1,000 employees and more than €450m turnover; member states must bring national law in line by 19 March 2027." Turnover is set to €38m and the balance sheet to €17m so the company also stays below the original large-company test under either threshold version. |
| M17 | Market-based hierarchy | Rule 5 teaches the order certificate → qualifying supplier-specific rate → residual mix. Every kit bill carries the line "Stromkennzeichnung nach § 42 EnWG: im Kit weggelassen (Vereinfachung, siehe README)". The factor scene, the limits scene and `START-HERE.md` state the simplification. The wrong answer's error is described as "grid average used for power without a certificate". |
| M18 | Value-chain cap tense | Written as "Directive (EU) 2026/470 lets suppliers with up to 1,000 employees refuse requests beyond the voluntary standard. Member states must transpose it by 19 March 2027." Never "suppliers can refuse" in the present tense without that line. |
| M19 | Energy total mixed Hs and Hi | Energy is reported on the net (Hi) basis: 5,872.9 MWh `{energy_total_hi_mwh}`; renewable share of energy 21.1% `{renewable_share_energy_pct}`; renewable share of electricity 34.3% `{renewable_share_el_pct}`. |
| M20 | Rematch and ask-back answers | Labelled "Target answer, constructed. Not a recorded run." until runs exist, as prominently as the raw answer. |
| M21 | Plausibility of the constructed failures | Hs basis appears only on page 2 of the gas bills. `F-GAS-HI` is listed first in the factor file with the plain label "Erdgas". AdBlue and Hs/Hi stay background traps. The headline rests on month coverage, the JV addressee and the number format. If captured runs differ, §1.7 says what gets rewritten. |
| M22 | 2024 comparison-year quality | The 2024 summary states the same operational-control boundary (Talbrück excluded in 2024 too), the same factor file and grade B. `grenzen_und_regeln.md` has a restatement policy (structural change, or an error above 5% of the Scope 1 + 2 total, triggers recalculation of 2024). |
| M23 | B-only items (no 2023 MB, "CO₂") | Appendix A6 computes the 2023 market-based figure from 2023 activity data with the 2023 residual mix and labels it "recalculated, restated": 3,868.0 t as reported `{var_2023_mb_reported_t}`, 2,788.0 t restated `{var_2023_mb_restated_t}` (the judge's 2,788.0 → 1,708.0 was double-subtracted; corrected by the script). All sentences say CO₂e. |
| M24 | "71% is the grid" scope | Always "of the location-based decrease". The market-based bridge has no grid effect by construction. |
| M25 | Scope 1 completeness | Limits scene and the good assistant's ask-back name refrigerant top-ups, LPG or diesel forklifts at Lager Ost, an emergency generator and heating oil as sources with no documents in the folder. |
| M26 | JV boundary realism | Talbrück is the contract party with its own customer number `55-0388` (`inputs.customerNoJV`; Kellbrunn's is `55-0192`) and its own meter `DE0005678900TB07`. The bill goes "z. Hd. Einkauf Kellbrunn" because Kellbrunn's purchasing checks the JV's invoices under a service agreement. Ledger row E-TB-01: excluded, reason boundary, Scope 3 Cat. 15 candidate only. |
| M27 | Per-employee figures | Headcount 180 in both years (`company.staff_2024`, `company.staff_2025`) is in the case data and the 2024 summary. |
| M28 | Factor vintage | Rule 4: the ledger's `factor_edition` column records the edition (`Lehrwerte v1.0, 2026-01-15`, pinned together with the rules on 2026-01-15, before the ledger review "Controlling, 2026-01-20"); a later update is recorded as a change and not applied silently. The kit release date (2026-09-26) is a different date from the case's factor edition. |

| Graft | From | Where |
|---|---|---|
| G1 Trace-two pair exercise (worked, half, alone) with "if yours differs" | B | New scene 15 `trace-two`; paid for by merging `same-and-changed` into `the-ledger` |
| G2 One-row completion problem | B | `the-ledger` press 4 to 6 |
| G3 LB→MB bridge and "how far below" vote | C | `two-scope-2` press 4 to 6 |
| G4 Driver ranking depends on method | C | Demo section 5, guide §11, appendix A1 |
| G5 Control total | C | `the-ledger` press 7; kit `erwartet/kontrollsumme_strom_2025.csv` |
| G6 Per-site plausibility and printed prior year | C | `one-unit` press 4; Werk Süd statement prints "Vorjahr: 1.250 MWh" |
| G7 Reader / Clerk / Writer labels | C | `six-rules`, prompts 01 to 03, field card footer |
| G8 Unlisted-sources limit | C | `limits`, ask-back answer, rematch open item |
| G9 Kit prompts 00 (run protocol) and 04 (ask-back) | C | §7 |
| G10 August "error or real?" | B | `month-grid` ask aloud |
| G11 Must-say lines | B | Presenter notes (§2) |
| G12 Number ladder in the close | B | `resolution` |
| G13 Guided demo manipulation and evidence drawer | B | Demo §3 |
| G14 Meter readings in the data-request mail, certificate-supplier variant | B | §7 |
| G15 Base-year appendix (restated, like for like) | B | Appendix A6, routed from `ask-back` and `what-drove-it` |
| G16 "Abschlag" € line on each bill | B | All electricity bills |
| G17 "Green electricity" claim inside the wrong answer | Judge 2 | Raw answer sentence 5 |

---

## 1. The case

### 1.1 The fixed question

On every scene that shows the q-card, verbatim (`question.en`, `question.de`):

- EN: "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?"
- DE: „Wie hoch waren unsere Scope-1- und Scope-2-Emissionen 2025, und sind sie gegenüber 2024 gesunken?"

The question does not say "location-based and market-based". Reporting both is one of the rules the prepared data state adds.

### 1.2 The promise

- EN: "After 90 minutes you can turn a folder of energy bills into a ledger where every number points to a page, work out both Scope 2 figures from it, and say how much of the change against last year came from your own lower use, and how much from the grid factor and certificates."
- DE: „Nach 90 Minuten machst du aus einem Ordner voller Energierechnungen eine Belegtabelle, in der jede Zahl auf eine Seite zeigt, rechnest daraus beide Scope-2-Zahlen aus und sagst, wie viel der Veränderung zum Vorjahr aus deinem eigenen geringeren Verbrauch kommt und wie viel aus Netzfaktor und Herkunftsnachweisen."

### 1.3 The company

**Kellbrunn Präzisionsteile GmbH** (fictional; label "fictional company" on every scene that shows it). Location: "invented site in Hesse". No real town is named.

| Field | Value (JSON) |
|---|---|
| Sector | Metal parts supplier: stamping, CNC machining, assembly, for automotive and machinery customers |
| Staff | 180 in 2024 and 2025 (`company.staff_2024`, `company.staff_2025`): Werk Nord 110, Werk Süd 55, Lager Ost 15 |
| Turnover, balance sheet | €38m, €17m (illustrative; `company.turnover_meur`, `company.balance_sheet_meur`) |
| Fleet | 14 vans and cars, one fuel-card contract |
| Reporting year | 2025; comparison year 2024 |
| Who asks | House bank (loan pricing), an OEM customer's supplier questionnaire, a voluntary report based on the VSME Basic Module |
| CSRD | Never in scope. Since 18 March 2026 the EU line is more than 1,000 employees and more than €450m turnover; member states must bring national law in line by 19 March 2027. |
| Last year | The 2024 figures came from an external energy consultant (summary only, grade B). This year Kellbrunn wants to do it in-house with AI help. |

### 1.4 Boundary (written down before any AI run)

Operational control (GHG Protocol Corporate Standard).

| Site ID | Site | In? | Why |
|---|---|---|---|
| WN | Werk Nord (HQ): stamping, assembly, offices | Yes | Owned, operated. Grey tariff, gas for heating and washing lines. Meter `DE0005678900WN01`. |
| WS | Werk Süd: CNC machining | Yes | Owned, operated. Tariff "Ökostrom Plus" since 1 Jan 2025 with cancelled guarantees of origin for 1,240 MWh `{go_mwh}`, Werk Süd only. |
| LO | Lager Ost: leased warehouse | Yes | Operated by Kellbrunn, own sub-meter `LO-UZ-03`, landlord bills quarterly. |
| FL | Fleet | Yes | Fuel-card export. |
| TB | Talbrück Beschichtung GmbH: powder coating in Halle 3 on the Werk Nord premises | **No** | Kellbrunn holds 40%, the partner operates it. Talbrück is the contract party with its own customer number `55-0388` and its own meter `DE0005678900TB07`; the bill lands in the Werk Nord folder because Kellbrunn's purchasing checks the JV's invoices under a service agreement. Scope 3 Category 15 candidate, out of scope here (if Kellbrunn rents Halle 3 to Talbrück, Category 13 is worth checking too). |

The 2024 summary uses the same boundary (Talbrück excluded in 2024 too) and the same factor file.

### 1.5 The two data states

**Ask 1, raw folder** (`rohdaten_2025/`, 22 files `{files_raw_2025}`, plus `vorjahr/THG_2024_Zusammenfassung.csv` and `faktoren/faktoren_lehrwerte.csv`):

- `Werk_Nord/Strom/`: 12 files `{files_wn_electricity}`: ten genuine bills (January to September, and one bill for November and December), the duplicate March scan, the Talbrück annual bill. October (invoice 4711-10) is missing. Months covered: 11 `{months_wn_covered_raw}`.
- `Werk_Nord/Zaehlerstaende_2025.csv`: month-end readings (no November reading). October = 5,012,300 − 4,812,300 = 200,000 kWh `{oct_kwh}`. The whole year reproduces 2,260,000 kWh `{el_wn_kwh}`.
- `Werk_Nord/Gas/Gas_Jahresrechnung_WN_2025.md`: page 1 "Energiemenge 1.850.000 kWh"; the Hs basis only on page 2.
- `Werk_Sued/`: annual statement "Verbrauch 2025: 1.240 MWh" and "Vorjahr: 1.250 MWh"; HKN confirmation for Werk Süd only; gas bill (240,000 kWh, Hs on page 2).
- `Lager_Ost/`: four quarterly statements (30,000 / 25,000 / 25,000 / 30,000 kWh). Complete; the control that shows the method does not flag everything.
- `Flotte/Tankkarten_2025.csv`: 738 transactions; diesel 38,000 l `{diesel_l}`, AdBlue 1,200 l `{adblue_l}`, car washes, shop items.

August (120,000 kWh `{aug_kwh}`, −31% `{aug_vs_jul_pct}` against July) is a real dip: plant holiday. Flag it, never correct it.

**Ask 2, prepared state:** same model, prompt, factor file, 2024 summary and date. The folder is replaced by `belegtabelle_2025.csv` (the ledger, `ledger` in JSON, 23 rows), `abdeckung_standort_monat.csv` (coverage grid, `coverage.expected`) and `grenzen_und_regeln.md` (six rules, §7).

### 1.6 The answers (all from JSON)

**Correct 2025** (`RIGHT`): electricity 3,610,000 kWh `{el_total_kwh}`. Scope 2 location-based 1,444.0 t `{s2lb_2025}`; market-based 1,422.0 t `{s2mb_2025}` (Werk Süd 0 under I-WS-GO, 2,370,000 kWh `{el_uncovered_kwh}` at the residual mix). Scope 1 471.2 t `{s1_2025}` (gas 376.2 `{s1_gas_2025}`, diesel 95.0 `{s1_diesel_2025}`). Totals 1,915.2 t LB `{total_lb_2025}`, 1,893.2 t MB `{total_mb_2025}`.

**2024:** 2,017.5 t LB `{total_lb_2024}`, 2,674.5 t MB `{total_mb_2024}`, Scope 1 484.5 t `{s1_2024}`.

**Change:** LB −102.3 t `{chg_lb_t}`, −5.1% `{chg_lb_pct}`. MB −781.3 t `{chg_mb_t}`, −29.2% `{chg_mb_pct}`. Scope 1 −2.7% `{chg_s1_pct}`; gas kWh −2.8% `{gas_change_pct}`.

**Drivers** (`drivers.lb`, `drivers.mb`; convention in `drivers.convention_en`): LB grid factor −72.2 t `{drv_lb_grid_t}` (71% `{drv_lb_grid_share_pct}`), less electricity −16.8, less gas −10.8, less diesel −2.5, own use together −30.1 t `{drv_lb_own_t}`. MB guarantees of origin −744.0 t `{drv_mb_cert_t}` (95% `{drv_mb_cert_share_pct}`), own use −37.3 t `{drv_mb_own_t}`.

**Bridge LB → MB 2025 (Scope 2):** 1,444.0 − 496.0 `{bridge_cert_t}` + 474.0 `{bridge_rm_t}` = 1,422.0; net −22.0 t `{bridge_net_t}`.

**Constructed raw-folder answer** (`WRONG`, all traps fire): Scope 1 516.0 t `{wrong_s1}`, Scope 2 LB 1,350.5 t `{wrong_s2lb}`, total 1,866.5 t `{wrong_total_lb}`, −7.5% `{wrong_chg_lb_pct}`; "market-based" 1,350.0 t `{wrong_s2mb}`, total 1,866.0 t `{wrong_total_mb}`. Gap to right LB: 48.7 t `{gap_lb_t}`, 2.5% `{gap_lb_pct}` (of the total). The change against 2024 moves 2.4 percentage points `{chg_lb_pp_shift}`, from −7.5% to −5.1%.

**Traps** (`traps`, fixed order):

| ID | Trap | Effect in isolation LB / MB (`traps[i].isolated`) | Caught by | Role | Kind |
|---|---|---|---|---|---|
| T1 | Duplicate March bill | +82.0 / +123.0 | Unique key (invoice + period + meter), fallback key | Clerk | headline |
| T2 | October missing | −80.0 / −120.0 | Site × month grid | Clerk | headline |
| (T0) | Two-month bill Nov/Dec | 0 t; hides the gap (`trapNotes.twoMonthBill_en`) | months column | Clerk | headline (no number) |
| T3 | Talbrück JV bill included | +400.0 / +600.0 | `entity_on_document` + written boundary | Clerk | headline |
| T4 | "1.240 MWh" read as 1,240 kWh | −495.5 / 0.0 | Value and unit as printed; kWh per employee; prior year on the page | Reader | headline |
| T5 | Hi factor on Hs kWh | +41.8 / +41.8 | Factor ID matches bill basis (page 2) | Reader | background |
| T6 | AdBlue counted as diesel | +3.0 / +3.0 | Product filter | Clerk | background |
| T7 | Grid average instead of residual mix for power without a certificate | 0.0 / −474.0 | Market-based order | Clerk | method |

The build reads the isolated values from JSON; the table values above are for reading.

**Waterfall LB** (`waterfall.lb`): 1,866.5 → −82.0 → 1,784.5 → +80.0 → 1,864.5 → −400.0 → 1,464.5 → +495.5 → 1,960.0 → −41.8 → 1,918.2 → −3.0 → 1,915.2 (T7 = 0.0, not drawn in LB). The running total swings between 1,464.5 `{wf_lb_min_t}` and 1,960.0 `{wf_lb_max_t}` (both computed from the unrounded state totals, 1,464.496 and 1,960.0).

**Waterfall MB** (`waterfall.mb`): 1,866.0 → −82.0 → 1,784.0 → +80.0 → 1,864.0 → −400.0 → 1,464.0 → 0.0 (T4, drawn as a labelled zero tick "no effect in market-based") → 1,464.0 → −41.8 → 1,422.2 → −3.0 → 1,419.2 → +474.0 → 1,893.2.

Order dependence: the MB effects of T1 to T3 are valued at the factor in force at that step (0.40 while T7 is still active). The demo therefore never adds fixed bar effects; it looks up the state in `combinations` (§3).

### 1.7 Capture protocol and what changes if runs differ

Before publication, record both conditions (kit `prompts/00_run_protocol.md`, §7):

- Hold constant: model and version, tool surface, prompt text, factor file, 2024 summary, date.
- Condition A raw folder; condition B ledger + grid + rules; optional C raw folder without the factor file.
- Five runs per condition. Score the items in `runs.scoredItems`.
- Store per-run results in `runs.table` (model, date, prompt hash, run k, Scope 1, S2 LB, S2 MB, change, T1 to T7 caught yes/no, August flagged, other Scope 1 sources asked).

What changes after capture:

1. The anatomy scene, waterfall and demo stay as they are: they show "what these traps do when they fire". Their label stays "computed from the traps".
2. `raw-answer` keeps the constructed answer with its label. A second line appears under it: "Recorded runs: <n> of 5 caught the duplicate; <n> of 5 questioned Talbrück; <n> of 5 read 1.240 MWh correctly" (from `runs.table`), linking to appendix A3.
3. If every recorded run catches T1, T5 and T6, the note on `raw-answer` adds: "Current models often catch these three. The folder still decides what they can know about October, Talbrück and the unit." The headline claim is "the folder decides what even a good model can know", never "AI gets this wrong".
4. `rematch` shows the recorded ledger answer with its date. Its "Known gap" line comes from the runs only.
5. Registry `accessNote` second sentence and `provenance.aiOutputsRecordedAt` switch to the recording date (§8).


---

## 2. Deck: `slides.html` and `lib/presenter-notes.js`

### 2.1 Frame

- Engine: W03 runtime copied into `public/workshops/esg-berichte-mit-ki/lib/` with the patches in `research/map-deck-engine.md` §8 (namespace `esg-berichte-mit-ki-deck` / `esg-berichte-mit-ki-presenter`, configurable route and title, optional-chained `FoldlineDemo`, clock target from the sum of `data-seconds`, no Brainster `::after`).
- `<deck-stage data-deck-title="ESG Reporting with AI" data-route-stations="Wrong answer|Why it failed|The fix|Ask again|Honest limits|Your turn">`.
- Numbers: scene JS reads `window.W04_DATA` (a generated `lib/w04-data.js` that assigns the JSON; no fetch) and fills every `[data-num="<key>"]` element with `numbers[key].en`. A build check fails if a scene contains a literal number that is not in the JSON (allowlist: years, scene counters, the 1,920 × 1,080 canvas).
- Encodings (design-direction §7.7): hatch = raw input; solid ink = ledger row or approved figure; slate = recalculation check; dashed = meter reading, estimate or missing month; Mennige = the one figure under discussion per step. New pictograms in the sprite style: `i-invoice`, `i-meter`, `i-factor`, `i-scope`, `i-certificate`.
- Labels on every scene that shows the case: "Fictional company · teaching factors" (`meta.factorLabel_en`). On every scene that shows the raw answer: `meta.constructedLabel_en`. On the rematch answer and the ask-back answer: `meta.targetLabel_en`.
- Bills on slides are HTML/CSS "paper" cards rendered from `documents[].lines` (no images, no PDFs).
- Every scene carries `data-mode` (listen, vote, do, pair, write) and `data-recovery-seconds` where noted.

### 2.2 Timing

| Act | Station | Scenes | Seconds | Minutes | Learner action |
|---|---|---|---|---|---|
| 0 | (before the route) | cover, host, the-case, the-arc | 240 | 4.0 | none |
| 1 | Wrong answer | raw-folder, raw-answer | 450 | 7.5 | vote |
| 2 | Why it failed | month-grid, one-unit, whose-bill, anatomy | 960 | 16.0 | three votes, one prediction, one ask aloud |
| 3 | The fix | the-ledger, six-rules, two-scope-2 | 990 | 16.5 | call-out completion, three votes |
| 4 | Ask again | rematch, trace-two, what-drove-it | 930 | 15.5 | pair tracing, vote |
| 5 | Honest limits | ask-back, limits | 420 | 7.0 | sort five requests |
| 6 | Your turn | your-bill, resolution | 600 | 10.0 | write five boxes, callback vote |
| | **Main path** | **20 scenes** | **4,590** | **76.5** | |
| | Questions and slack | | | 13.5 | |

Main path 76.5 min = slot minus 15%. Longest stretch without a learner action: 6.5 minutes (cover to the vote on `raw-answer`).

**Cut list** (frees 11.5 min, no outcome lost): `host` into one line on `the-case` (−30 s); `the-arc` to its drawing only (−30 s); `anatomy` without press 4 cards (−60 s); `trace-two` with figures 1 and 2 only (−120 s); `ask-back` with cards 1, 3, 4 (−120 s); `limits` as a read-aloud list (−60 s); `your-bill` pairs without room sharing (−120 s); `what-drove-it` without the market-based bridge (−90 s); `six-rules` without the factor vote (−60 s). Sum 690 s.

Clock windows (start to end) are listed per scene as `clock`.

### 2.3 Scene list (main path)

Format: number · `id` · act · `data-seconds` · `data-mode` · `data-route`. "Press n" = step n. Room votes use the `.room-vote` band (y 776 to 968). Numbers in brackets are JSON keys.

---

**1 · `cover`** · act 0 · 40 · listen · none · clock 00:00 to 00:40
- **Title (on the dark cover):** ESG Reporting with AI
- **On screen:** graphit cover, globe with Germany traced in Mennige. Kicker "Workshop 04 · <session date>". Dark q-card with the fixed question. Meta line "76 minutes · one fictional company · teaching factors".
- **Steps:** 0 only.
- **Notes:**
  - say: ["Presenter cue: the clock starts on your first press.", "Today we ask one question about one fictional company, and we keep asking it until the end.", "It is the question your bank or your biggest customer sends every spring. By the end you will know why the first answer looked right, and which parts of it were wrong."]
  - sayAt: {"0":[0],"1":[0],"2":[0]}
  - ask: []
  - expectedAudience: []
  - revealOrder: ["Title, date, the question card, meta line"]
  - cut: "Read the question once and advance."
  - appendixRoutes: []

**2 · `host`** · act 0 · 30 · listen · hidden · 00:40 to 01:10
- **Title:** Your host
- **On screen:** host card as in W03, plus one line: "Fictional company, invented numbers, teaching factors. No employer data."
- **Notes:**
  - say: ["I build the data pipelines behind reports like this one.", "Nothing today comes from a real company, and none of the emission factors are official values. That is on purpose, so you can check every number with a phone calculator."]
  - sayAt: {"0":[0],"1":[0]} · ask: [] · expectedAudience: []
  - revealOrder: ["Host card and the data line"]
  - cut: "Say the data line only, on the-case."
  - appendixRoutes: []

**3 · `the-case`** · act 0 · 100 · listen · hidden · 01:10 to 02:50
- **Title:** A bank and a customer ask the same question every spring.
- **On screen:** q-card. Left: Kellbrunn fact strip: 180 staff `{staff}`, three sites, metal parts, turnover €38m. A site sketch: Werk Nord, Werk Süd, Lager Ost inside a solid boundary line; Talbrück (40%, partner operates) outside it with a dashed line. Right: three sender cards with icons: "House bank: Scope 1 and 2 for loan pricing", "OEM customer: supplier questionnaire", "Voluntary report based on the VSME Basic Module: energy, Scope 1 and 2". Footer: "Kellbrunn has never been in CSRD scope. It still gets asked. Rules as of 26 Sep 2026."
- **Steps:** press 1 the three senders; press 2 "did they go down" in the q-card underlined in Mennige.
- **Notes:**
  - say: ["Kellbrunn has 180 people and has never been under the EU reporting law. Since 18 March 2026 the EU rule covers companies with more than 1,000 employees and more than 450 million euros turnover. Member states must bring national law in line by 19 March 2027.", "The bank and the car maker still want this number, and they want to know whether it went down.", "On press 2: keep the second half of the question in mind. Most of today's trouble is in that half.", "If asked about customer requests: Directive 2026/470 lets suppliers with up to 1,000 employees refuse requests that go beyond the voluntary standard. Germany has to transpose it by 19 March 2027. The VSME Basic Module, on which that standard is based, includes Scope 1 and 2, so this question stays."]
  - sayAt: {"0":[0],"1":[1],"2":[2],"3":[1]}
  - ask: []
  - expectedAudience: ["Some expect the CSRD to cover them; answer with the two thresholds."]
  - revealOrder: ["Question card, fact strip, boundary sketch", "Three sender cards", "Underline on 'did they go down'"]
  - cut: "Skip the sender cards; say 'bank and customers ask'."
  - appendixRoutes: ["appendix-regulation"]

**4 · `the-arc`** · act 0 · 70 · listen · final · 02:50 to 04:00
- **Title:** One question, asked twice.
- **On screen:** raw folder (hatched) → AI → answer 1; prepared ledger (solid ink) → same AI → answer 2. Line: "Same question, same AI, same factor table. Only the data changes." Route stations fade in on the last step.
- **Steps:** press 1 route (`data-route="final"`).
- **Notes:**
  - say: ["We ask the AI twice. First it gets the folder as Kellbrunn has it today. Then it gets the same information prepared into one table with written rules.", "The model does not change between the two runs, so any difference in the second answer comes from the preparation."]
  - sayAt: {"0":[0],"1":[1]} · ask: [] · expectedAudience: []
  - revealOrder: ["The two-lane drawing and its line", "Route stations"]
  - cut: "Show the drawing; skip the second sentence."
  - appendixRoutes: []

**5 · `raw-folder`** · act 1 · 150 · listen · shown · 04:00 to 06:30
- **Title:** What the AI gets: 22 files from 2025.
- **On screen:** folder tree with file-type icons. Counts: Werk Nord electricity 12 `{files_wn_electricity}`, Werk Nord gas 1, meter readings 1, Werk Süd 3, Lager Ost 4, fleet 1. Line: "Plus last year's figures from the consultant, and the factor table." Two paper cards: the January Werk Nord bill (`documents` path `…/2025-01_Strom_WN.md`) and the Werk Süd statement.
- **Steps:** press 1 folders expand; press 2 plain ink box around "12" (no trap reveal).
- **Notes:**
  - say: ["This is a normal folder: monthly bills from the utility, an annual statement, quarterly statements from the landlord, and a fuel-card export.", "On press 2: twelve bills for Werk Nord, which looks like a full year.", "We give all of it to the AI, with last year's figures and a table of emission factors."]
  - sayAt: {"0":[0],"1":[1],"2":[1]}
  - ask: [{"at":0,"text":"Where does your company's electricity number come from today?","aloud":true}]
  - expectedAudience: ["Many do not know which file their number comes from."]
  - revealOrder: ["Folder tree collapsed and two bill cards", "Folders expanded with counts", "Box around the 12"]
  - cut: "Skip the aloud question."
  - appendixRoutes: []

**6 · `raw-answer`** · act 1 · 300 · vote · shown · 06:30 to 11:30
- **Title:** The AI's answer from the raw folder
- **On screen:** q-card. Answer card (hatched lane), label `meta.constructedLabel_en`. Answer text:
  > "Kellbrunn's 2025 emissions: Scope 1 516.0 t CO₂e `{wrong_s1}`, Scope 2 1,350.5 t CO₂e `{wrong_s2lb}` (location-based), total 1,866.5 t `{wrong_total_lb}`. That is 7.5% `{wrong_chg_lb_pct}` below 2024 (2,017.5 t `{total_lb_2024}`). Scope 2 market-based: 1,350.0 t `{wrong_s2mb}`. Since 2025 Kellbrunn runs on green electricity (Ökostrom Plus). The reduction comes mainly from efficiency measures at Werk Nord. Scope 1 rose by 6.5% `{wrong_chg_s1_pct}`, probably due to higher heating demand."

  Right column, five checks with ink ticks: "7.5% below last year", "10.4 t per employee `{wrong_per_employee_t}` (last year 11.2 `{per_employee_2024_t}`)", "12 files in Werk Nord", "shows its sums", "both Scope 2 numbers given". After capture: one line of recorded catch counts (§1.7).
- **Steps:** press 1 answer; press 2 checks; press 3 room vote.
- **Room vote (press 3):** "Send this to the bank?" Send · Ask back first · Refuse. Caption: "Remember your hand."
- **Notes:**
  - say: ["Must say: This answer is constructed from documented failure modes. It shows what the answer looks like when all six traps fire. It is not a recorded run.", "On press 1: read the total and the 7.5 percent. Do not read the rest aloud.", "On press 2: it is down 7.5 percent, the per-head figure is normal, twelve bills for twelve months, and it shows its sums.", "On press 3: hands up. Who would send this to the bank today? Remember your hand; we come back to it at the end."]
  - sayAt: {"0":[0],"1":[1],"2":[2],"3":[3]}
  - ask: [{"at":3,"text":"Send this to the bank?","options":["Send","Ask back first","Refuse"],"expected":"Most send or ask back; few refuse."}]
  - expectedAudience: ["Most pick Send or Ask back first. People who say Refuse usually cannot name why yet; ask them to hold it."]
  - revealOrder: ["Question card and empty answer lane", "Answer text and constructed label", "Five sanity checks", "Room vote"]
  - cut: "Skip press 2; go straight to the vote."
  - appendixRoutes: ["appendix-run-record"]

**7 · `month-grid`** · act 2 · 300 · vote · shown · 11:30 to 16:30
- **Title:** Twelve files, eleven months
- **On screen:** site × month grid (rows from `coverage.rows`). Step 1: empty grid with only "12 files". Step 3: `coverage.asDelivered`: Werk Nord March "2" in Mennige, October empty and dashed, November and December bracketed as one bill, an extra cell off the grid "Talbrück Beschichtung GmbH · 12 months". August cell shows 120,000 kWh `{aug_kwh}` with a small dip mark.
- **Steps:** press 1 empty grid; press 2 room vote; press 3 filled grid as delivered; press 4 the two March cards side by side, invoice number 4711-03 marked on both, OCR noise visible in the supplier name; press 5 meter rows 30.09 and 31.10 → 200,000 kWh `{oct_kwh}`; press 6 net line "+205,000 − 200,000 = +5,000 kWh `{wn_net_raw_vs_right_kwh}`".
- **Room vote (press 2):** "How many months does the Werk Nord folder cover?" 12 · 11 · Can't tell from the file count.
- **Ask aloud (press 3):** "August is 120,000 kWh, almost a third below July (−31% `{aug_vs_jul_pct}`). Error or real?"
- **Notes:**
  - say: ["Twelve files are not twelve months.", "On press 3: March is in twice. Purchasing forwarded the same invoice and someone scanned it again. October is missing. The November and December bill covers two months in one file, so the count still comes out at twelve.", "On press 3, then ask: August is low. Error or real? It is real: the plant holiday. A good assistant flags it and a person confirms it. It never 'corrects' a true value.", "On press 5: the facility manager's meter file has October: 200,000 kilowatt hours.", "On press 6: the duplicate and the gap almost cancel. The Werk Nord sum is only 5,000 kilowatt hours off, which is why nobody notices."]
  - sayAt: {"0":[0],"1":[3],"2":[3],"3":[5],"4":[6]}
  - ask: [{"at":2,"text":"How many months does the Werk Nord folder cover?","options":["12","11","Can't tell from the file count"],"expected":"Split between 12 and can't tell."},{"at":3,"text":"August is 120,000 kWh. Error or real?","aloud":true}]
  - expectedAudience: ["Many say 12. On August, some say error; answer: plant holiday, flag and confirm."]
  - revealOrder: ["Empty grid with the file count", "Room vote", "Grid as delivered, with the August dip", "The two March bills side by side", "Meter rows and the October subtraction", "Net line +5,000 kWh"]
  - cut: "Skip press 4 and the August question."
  - appendixRoutes: []

**8 · `one-unit`** · act 2 · 225 · vote · shown · 16:30 to 20:15
- **Title:** What does "1.240 MWh" mean?
- **On screen:** the Werk Süd statement card with "Verbrauch 2025: 1.240 MWh" outlined in Mennige; the line "Vorjahr: 1.250 MWh" beneath it in ink. Three option cards.
- **Steps:** press 1 room vote; press 2 reveal C; press 3 effect bar 1,240 kWh vs 1,240,000 kWh, "−495.5 t location-based `{unit_lb_t}`"; press 4 the second net in slate: "1,240 kWh ÷ 55 staff = 23 kWh per person per year `{ws_misread_kwh_per_employee}`. Correct: 22,545 kWh `{ws_kwh_per_employee}`. Last year on the same page: 1.250 MWh."
- **Room vote (press 1):** A) 1.24 MWh · B) 1,240 kWh · C) 1,240 MWh = 1,240,000 kWh.
- **Notes:**
  - say: ["On a German bill the dot separates thousands. This is one thousand two hundred forty megawatt hours.", "On press 3: A and B are the same reading, and both are a thousand times too small. They make Kellbrunn's second-largest electricity user almost disappear: minus 495.5 tonnes `{unit_lb_t}`.", "On press 4: two checks catch it without knowing the number format. Twenty-three kilowatt hours per person would not run one CNC machine for an afternoon, and last year's figure is printed on the same page.", "To fix it, keep the value and unit as printed in the row and let a written rule convert them."]
  - sayAt: {"0":[0],"1":[2],"2":[3],"3":[4]}
  - ask: [{"at":1,"text":"What does '1.240 MWh' mean?","options":["1.24 MWh","1,240 kWh","1,240 MWh = 1,240,000 kWh"],"expected":"Mostly C; a few A from people used to English decimals."}]
  - expectedAudience: ["People who read English-format reports pick A."]
  - revealOrder: ["Statement card and three options", "Room vote", "Answer C", "Effect bar −495.5 t", "Plausibility line and prior year"]
  - cut: "Skip press 4; say the plausibility check in one sentence."
  - appendixRoutes: []

**9 · `whose-bill`** · act 2 · 180 · vote · shown · 20:15 to 23:15
- **Title:** Whose bill is this?
- **On screen:** the Talbrück bill card, addressee block highlighted: "Talbrück Beschichtung GmbH, Halle 3 … z. Hd. Einkauf Kellbrunn". Side note: "Kellbrunn holds 40%. The partner runs it. Own meter DE0005678900TB07."
- **Steps:** press 1 room vote; press 2 reveal; press 3 effect: "+1,000,000 kWh `{jv_kwh}`, +400.0 t location-based `{jv_lb_t}`, +600.0 t at the residual mix `{jv_rm_t}`".
- **Room vote:** Include 100% (it's in our folder) · Include 40% (our share) · Leave it out and note it (operational control).
- **Notes:**
  - say: ["Under the operational control approach Kellbrunn chose, this bill is out: the partner runs the plant, and the contract and the meter are Talbrück's.", "Forty percent would be right only under the equity-share approach, and that choice is written down before anyone opens the folder.", "The row stays in the ledger as excluded, with the reason. It is a candidate for Scope 3 category 15 later.", "The AI can flag a company name that is not on your list. Whether that company is inside the boundary was decided and written down before the run.", "If asked about Scope 3: if Kellbrunn rents Halle 3 to Talbrück, check Category 13 (downstream leased assets) too. Either way it is Scope 3, not Scope 1 or 2."]
  - sayAt: {"0":[2],"1":[2],"2":[3],"3":[3],"4":[3]}
  - ask: [{"at":1,"text":"Whose bill is this?","options":["Include 100%","Include 40%","Leave it out and note it"],"expected":"Split between 40% and leave out."}]
  - expectedAudience: ["Finance people often pick 40% by analogy with consolidation."]
  - revealOrder: ["Bill card with addressee highlighted", "Room vote", "Answer and boundary line", "Effect +400.0 t / +600.0 t"]
  - cut: "Skip the effect line."
  - appendixRoutes: []

**10 · `anatomy`** · act 2 · 255 · vote · shown · 23:15 to 27:30
- **Title:** Six errors, 48.7 tonnes apart
- **On screen:** step 0: prediction band "How far is the AI's total from the right one?" Then the LB waterfall from `waterfall.lb` (six bars; T7 omitted in LB), bars in ink, running-total line in slate, final bar solid ink. Caption: "Computed from the traps: what they do when they fire." Two small cards on the right: "Gas bill says Brennwert (Hs) on page 2; the AI picked the Hi factor: +41.8 t `{gasbasis_t}`" and "AdBlue is not diesel: +3.0 t `{adblue_t}`".
- **Steps:** press 1 room vote (prediction); press 2 duplicate and October bars (−82.0, +80.0); press 3 Talbrück and unit bars (−400.0, +495.5); press 4 gas and AdBlue bars plus the two cards; press 5 the band 1,464.5 `{wf_lb_min_t}` to 1,960.0 `{wf_lb_max_t}` in Mennige, caption "The total was right by accident."
- **Room vote (press 1):** Less than 5% · About 10% · More than 20%.
- **Notes:**
  - say: ["Six errors, and the total is 48.7 tonnes off: 2.5 percent. No check on the total would catch that.", "On press 2: the duplicate and the missing October cancel to 2 tonnes.", "On press 3: the Talbrück bill hides four fifths of the unit error.", "On press 4: the two small ones. The gas bill states its basis on page 2, and AdBlue is not a fuel.", "On press 5: on the way the total swings between 1,464 and 1,960 tonnes. Next year the same errors can add up instead of cancelling."]
  - sayAt: {"0":[1],"1":[2],"2":[3],"3":[4],"4":[5]}
  - ask: [{"at":1,"text":"How far is the AI's total from the right one?","options":["Less than 5%","About 10%","More than 20%"],"expected":"Most say about 10% or more."}]
  - expectedAudience: ["Most expect a large gap; the 2.5% surprises."]
  - revealOrder: ["Prediction band, start and end bars only", "Room vote", "Duplicate and October bars", "Talbrück and unit bars", "Gas and AdBlue bars, two cards", "Swing band and caption"]
  - cut: "Skip press 4; mention gas and AdBlue in one sentence."
  - appendixRoutes: ["appendix-arithmetic"]

**11 · `the-ledger`** · act 3 · 390 · do · shown · 27:30 to 34:00 · `data-recovery-seconds="90"`
- **Title:** One row per quantity, and every row points to a page
- **On screen:**
  - Step 0 (merged from `same-and-changed`): two short columns. "Same: question, AI (model named), prompt, factor table, 2024 figures." "Changed: 22 raw files → one ledger, one coverage grid, one page of rules."
  - Step 1 on: ledger excerpt with 8 visible columns `row_id`, `entity_on_document`, `period`, `qty_source`, `unit_source`, `qty_norm`, `status`, `source (file · quote)`, rows from `ledger`.
- **Steps:**
  1. columns and rows E-WN-01, E-WN-03D (excluded), E-TB-01 (excluded), D-FL-02 (excluded);
  2. evidence: E-WN-01 expanded to its bill card, quoted line highlighted;
  3. call-out question: "Which column would have caught the Talbrück bill?" (answer `entity_on_document`);
  4. completion row 1, worked: E-WN-03 fully filled;
  5. completion row 2, half: E-WS-01 with `qty_norm`, `factor_lb`, `factor_mb` blank; the room calls out 1,240,000 kWh and F-EL-LB-2025 / F-EL-GO; blanks fill;
  6. completion row 3, blank: E-WN-10 October; the room calls out meter reading, 200,000, status `actual_meter`, DQ B; blanks fill;
  7. slate control-total line: "Documents 4,615,000 `{ctl_docs_kwh}` − excluded 1,205,000 `{ctl_excluded_kwh}` + October meter 200,000 `{ctl_meter_kwh}` = 3,610,000 kWh `{ctl_total_kwh}` ✓".
- **Notes:**
  - say: ["Here is what we hold constant: the question, the model, the prompt and the factor table. We change only how the data arrives.", "On press 1: a ledger has one row for each quantity on a document. Excluded rows stay in, with a reason, so anyone can see what was left out.", "On press 3: ask the room which column would have caught the Talbrück bill.", "On press 4: this row is done for you.", "On press 5: fill the middle row with me. What goes into kilowatt hours? Which factor for location-based, which for market-based?", "On press 6: now October, alone. Where does the number come from? Which grade, and why B?", "On press 7: the control total. Every kilowatt hour on paper is either in, out with a reason, or added from the meter, so nothing is lost or counted twice without a row saying so."]
  - sayAt: {"0":[0],"1":[1],"2":[3],"3":[4],"4":[5],"5":[6],"6":[7]}
  - ask: [{"at":3,"text":"Which column would have caught the Talbrück bill?","aloud":true},{"at":5,"text":"Werk Süd row: kWh? location-based factor? market-based factor?","aloud":true},{"at":6,"text":"October row: source, quantity, status, grade?","aloud":true}]
  - expectedAudience: ["Someone says 'multiply by 1,000'; ask them to name the rule and where it is written.", "Grade: someone says A; answer: a meter reading is not a bill, so B."]
  - revealOrder: ["Same and changed columns", "Ledger columns with three excluded rows", "E-WN-01 evidence expanded", "Call-out: which column", "Worked row E-WN-03", "Half-filled row E-WS-01, then filled", "Blank row E-WN-10, then filled", "Control total"]
  - cut: "Skip press 2 and press 7; keep the three completion rows."
  - appendixRoutes: ["appendix-arithmetic"]

**12 · `six-rules`** · act 3 · 270 · vote · shown · 34:00 to 38:30
- **Title:** Six rules, written down before the AI runs
- **On screen:** the six rules (§7, `grenzen_und_regeln.md`) as numbered rows, each with its trap icon and a role tag: 1 Boundary (Clerk), 2 Coverage (Clerk), 3 Units (Reader), 4 Factors (Clerk), 5 Scope 2 (Clerk), 6 Citations (Writer). Line across the bottom: "The AI may propose rules; a spreadsheet applies them, and a person approves the list." Right: excerpt of the pinned factor table with IDs, year, basis and "Teaching values, not official factors." Small note under rule 5: "Kit bills leave out the supplier mix disclosure (Stromkennzeichnung); real bills carry it."
- **Steps:** press 1 rules 1 to 3; press 2 rules 4 to 6 and the approval line; press 3 room vote on factors; press 4 reveal C with the effect "Last year's grid factor (0.42) on 2025 electricity adds 72.2 t `{last_year_factor_effect_t}`: the whole grid effect in this year's change."
- **Room vote (press 3):** "Where should the grid factor come from?" The AI knows it · The AI searches the web · A pinned table; the AI only picks an ID.
- **Notes:**
  - say: ["The rules are plain sentences a controller would sign. Each one catches one of the traps we just saw.", "On press 2: three roles. The reader copies what is printed, with the quote. The clerk applies the rules, in a spreadsheet, never in its head. The writer drafts sentences and cites rows. The AI may propose rules; a spreadsheet applies them, and a person approves the list.", "On press 4: the factor rule matters most for a comparison. The AI picks an ID from our table and records the edition. Last year's factor looks almost the same and would wipe out the whole grid effect we are about to find.", "If asked about real factors: appendix A2."]
  - sayAt: {"0":[0],"1":[2],"2":[4],"3":[4]}
  - ask: [{"at":3,"text":"Where should the grid factor come from?","options":["The AI knows it","The AI searches the web","A pinned table; the AI only picks an ID"],"expected":"Mostly the pinned table; some web search."}]
  - expectedAudience: ["Web search is a common pick; answer: the result has no fixed edition and may not be the reporting year."]
  - revealOrder: ["Rules 1 to 3", "Rules 4 to 6 and the approval line", "Room vote", "Answer C and the +72.2 t effect"]
  - cut: "Skip the vote; read rule 4 aloud."
  - appendixRoutes: ["appendix-factors", "appendix-scope2-order"]

**13 · `two-scope-2`** · act 3 · 330 · vote · shown · 38:30 to 44:00
- **Title:** One certificate, two Scope 2 numbers
- **On screen:** HKN confirmation card ("1.240 MWh … Lieferstelle Werk Süd … Andere Lieferstellen sind nicht erfasst"). Stacked bar of 3,610 MWh `{el_total_mwh}`: Werk Süd 1,240 MWh solid ink with a certificate icon, WN + LO 2,370 MWh `{el_uncovered_mwh}` hatched. Label 34.3% `{renewable_share_el_pct}`.
- **Steps:**
  1. room vote 1 (method);
  2. reveal C: location-based 1,444.0 t `{s2lb_2025}`, market-based 1,422.0 t `{s2mb_2025}`;
  3. wrong options: A = 0 t; B = 948.0 t `{mb_grid_avg_wrong_s2_t}` (474.0 t too low `{mb_grid_avg_too_low_t}`); claim line "'We run on green electricity' is false: certificates cover 34.3% `{renewable_share_el_pct}` of the electricity, all of it at Werk Süd.";
  4. room vote 2 (bridge);
  5. bridge 1,444.0 → certificate −496.0 `{bridge_cert_t}` → residual mix on 2,370 MWh +474.0 `{bridge_rm_t}` → 1,422.0;
  6. line: "Market-based is 22.0 t `{bridge_net_t}` below location-based, even with a green tariff."
- **Room vote 1 (press 1):** A) Market-based = 0 for the whole company · B) 0 for Werk Süd, grid average for the rest · C) 0 for Werk Süd, residual mix for the rest, and location-based as well.
- **Room vote 2 (press 4):** "How far below location-based is market-based?" About 500 t · Zero · About 20 t.
- **Notes:**
  - say: ["Must say: Under the GHG Protocol, a company buying power in a market with certificates and supplier contracts, such as Germany, reports both Scope 2 figures. The VSME asks for location-based; add market-based.", "On press 2: location-based uses the grid average where the power is used. Market-based uses what you bought. The certificate covers Werk Süd and nothing else.", "On press 3: for power without a certificate the order is: a qualifying supplier rate if there is one, otherwise the residual mix. In Germany the residual mix is usually higher than the grid average, because the green attributes sold as certificates are taken out of it.", "On press 5: the certificate takes 496 tonnes out. The residual mix on the other 2,370 megawatt hours puts 474 back.", "On press 6: so market-based is only 22 tonnes lower. Do not let one certificate turn into a sentence about the whole company."]
  - sayAt: {"0":[0],"1":[2],"2":[3],"3":[5],"4":[6]}
  - ask: [{"at":1,"text":"How do you calculate market-based Scope 2?","options":["0 for the whole company","0 for Werk Süd, grid average for the rest","0 for Werk Süd, residual mix for the rest, and location-based too"],"expected":"Split between B and C."},{"at":4,"text":"How far below location-based is market-based?","options":["About 500 t","Zero","About 20 t"],"expected":"Most say about 500 t."}]
  - expectedAudience: ["Most expect the green tariff to show a big drop; the 22 t is the aha."]
  - revealOrder: ["Certificate card and the 34.3% bar", "Vote 1", "Both Scope 2 numbers", "Wrong options and the claim line", "Vote 2", "Bridge bars", "22 t line"]
  - cut: "Skip vote 2; show the bridge directly."
  - appendixRoutes: ["appendix-scope2-order"]

**14 · `rematch`** · act 4 · 240 · listen · shown · 44:00 to 48:00
- **Title:** The same question on the ledger
- **On screen:** q-card with the stamp "Unchanged". Answer card (solid ink lane), label `meta.targetLabel_en` until capture. Text:
  > "Scope 1 2025: 471.2 t CO₂e (rows G-WN-01, G-WS-01, D-FL-01). Scope 2 location-based: 1,444.0 t (E-WN-01 to E-WN-11, E-WS-01, E-LO-Q1 to Q4; factor F-EL-LB-2025). Scope 2 market-based: 1,422.0 t (Werk Süd at 0 under I-WS-GO; 2,370,000 kWh at F-EL-RM-2025). Scope 1 + 2: 1,915.2 t location-based, 5.1% below 2024 (2,017.5 t); 1,893.2 t market-based, 29.2% below 2024 (2,674.5 t). One row is a meter reading (E-WN-10, grade B). Excluded: E-WN-03D (duplicate), E-TB-01 (boundary), D-FL-02 (not a fuel). Not checked: Scope 1 sources without documents in the folder (refrigerants, forklifts, generator)."

  (Every number via its key: `s1_2025`, `s2lb_2025`, `s2mb_2025`, `el_uncovered_kwh`, `total_lb_2025`, `chg_lb_pct`, `total_lb_2024`, `total_mb_2025`, `chg_mb_pct`, `total_mb_2024`.)
  Slate check column: "Recalculated in the spreadsheet: 1,444.0 ✓ 1,422.0 ✓ 471.2 ✓". Mini table: raw folder 1,866.5 t / −7.5% vs ledger 1,915.2 t / −5.1% (LB) and 1,893.2 t / −29.2% (MB).
- **Steps:** press 1 answer; press 2 check column; press 3 side-by-side table; press 4 "Known gap" line from the captured run (hidden until capture).
- **Notes:**
  - say: ["Same question, same model. This time every figure names its rows, the meter reading is labelled as one, both Scope 2 numbers use the right method, and the answer says what it did not check.", "On press 3: the total moved by 48.7 tonnes. More important, every tonne now has a row and a page behind it.", "If the answer is still the constructed target: say so. 'This is the answer we expect; the recorded runs are in appendix A3.'"]
  - sayAt: {"0":[1],"1":[3],"2":[1]}
  - ask: [{"at":1,"text":"Which number in this answer would you check first?","aloud":true}]
  - expectedAudience: []
  - revealOrder: ["Question card, unchanged stamp", "Answer with row IDs and label", "Recalculation check", "Side-by-side table", "Known gap (after capture)"]
  - cut: "Skip the side-by-side table."
  - appendixRoutes: ["appendix-arithmetic", "appendix-run-record"]

**15 · `trace-two`** · act 4 · 360 · pair · shown · 48:00 to 54:00 · `data-recovery-seconds="120"`
- **Title:** Trace three figures to paper
- **On screen:** the worksheet (`traceTwo`), three figure cards, each with blanks for rows, file, quote, factor and arithmetic:
  1. worked: Werk Süd location-based 496.0 t `{ws_lb_2025}` → E-WS-01 → `Jahresuebersicht_2025_Oekostrom.md`, "Verbrauch 2025: 1.240 MWh" → F-EL-LB-2025 → `traceTwo[0].arithmetic_en`;
  2. half-filled: Scope 1 gas 376.2 t `{s1_gas_2025}`: G-WN-01 given; learners add G-WS-01 and F-GAS-HS (basis Hs, page 2);
  3. alone: grid bar −72.2 t `{drv_lb_grid_t}`: rows, two factor IDs, arithmetic.
- **Steps:** press 0 task; press 1 timer 4 min (pairs, paper, no tools); press 2 expected answers; press 3 "If yours differs": "418.0 t `{wrong_s1_gas}`? You used 0.20 (Hi) on Hs kWh. Page 2 says Brennwert (Hs).", "376.6 t `{gas_hi_route_t}`? You converted to Hi first with 1.11. That is also right; the 0.4 t `{gas_hi_route_diff_t}` is the rounding of the teaching value 0.18." (`traceTwo[1].alt_en`) and "−73.0 t `{trace_slip_grid_t}`? You used 2024 kWh. The factor effect uses 2025 consumption."
- **Notes:**
  - say: ["Work in pairs, on paper, no tools. The first figure is done, the second is half done, the third is yours. Four minutes.", "Presenter cue: walk the room at minute two; point stuck pairs to page 2 of the gas bill.", "On press 2: compare. On press 3: two slips, and one other route that is also right.", "This is what a customer's auditor does with your page: pick a number, ask for the rows, pick a row, ask for the paper."]
  - sayAt: {"0":[0],"1":[1],"2":[2],"3":[3]}
  - ask: []
  - expectedAudience: ["Common slips: 418 for gas (Hi factor); 3,650,000 kWh for the grid bar. Add real shares only after the O3 test runs."]
  - revealOrder: ["Worksheet with three figures", "Timer running", "Expected answers", "If yours differs"]
  - cut: "Do figures 1 and 2 only; show figure 3's answer."
  - appendixRoutes: []

**16 · `what-drove-it`** · act 4 · 330 · vote · shown · 54:00 to 59:30
- **Title:** What made the number go down?
- **On screen:** two bridges, 2024 → 2025. Location-based (`drivers.lb`): 2,017.5 → grid factor −72.2 → less electricity −16.8 → less gas −10.8 → less diesel −2.5 → 1,915.2, with "own use −30.1 t" bracketed. Market-based (`drivers.mb`): 2,674.5 → guarantees of origin −744.0 → less electricity −24.0 → less gas and diesel −13.3 → 1,893.2. The AI's sentence "mainly thanks to efficiency measures" struck through in ink. Caption (`drivers.convention_en`, short form): "Teaching values. Residual mix held at 0.60 in both years on purpose, so the market-based bridge has no factor effect. Real residual mixes change every year." Line: "No production volumes in the folder: 'used less' is supported, 'more efficient' is not."
- **Steps:** press 1 room vote; press 2 location-based bridge; press 3 market-based bridge; press 4 the rewritten sentence.
- **Room vote (press 1):** "What made location-based emissions fall 102.3 t?" Our efficiency measures · A lower grid factor · We produced less.
- **Rewritten sentence (press 4):** "Scope 1 and 2 fell 5.1% location-based (−102.3 t). In this case's teaching values, 72.2 t of that comes from a lower grid factor and 30.1 t from using less electricity, gas and diesel. Market-based fell 29.2%; 744.0 t of that is guarantees of origin covering Werk Süd since January 2025." (Keys: `chg_lb_pct`, `chg_lb_t`, `drv_lb_grid_t`, `drv_lb_own_t`, `chg_mb_pct`, `drv_mb_cert_t`.)
- **Notes:**
  - say: ["On press 2: in this case's teaching values, 71 percent of the location-based decrease is the lower grid factor. It is real, and it is not Kellbrunn's doing.", "On press 3: the market-based decrease is almost all the certificate for Werk Süd: 95 percent.", "Kellbrunn's own lower use is about 30 tonnes, and without production figures nobody can call that efficiency yet.", "On press 4: read the sentence. Every number in it has a driver line behind it.", "If asked 'our emissions fell 40 percent since 2023': appendix A6."]
  - sayAt: {"0":[2],"1":[3],"2":[3],"3":[4],"4":[4]}
  - ask: [{"at":1,"text":"What made location-based emissions fall 102.3 t?","options":["Our efficiency measures","A lower grid factor","We produced less"],"expected":"Most pick efficiency."}]
  - expectedAudience: ["Most pick efficiency, which is the AI's claim."]
  - revealOrder: ["Two empty bridges and the struck AI sentence", "Room vote", "Location-based bridge", "Market-based bridge and caption", "Rewritten sentence"]
  - cut: "Skip the market-based bridge; say the 744 t in one sentence."
  - appendixRoutes: ["appendix-baseline", "appendix-arithmetic"]

**17 · `ask-back`** · act 5 · 270 · do · shown · 59:30 to 64:00
- **Title:** Calculate, ask back or refuse?
- **On screen:** five request cards, sorted into three columns (Calculate from the ledger · Ask back · Refuse or rewrite):
  1. "Sum Scope 2 for 2025." → Calculate: 1,444.0 t and 1,422.0 t, with rows.
  2. "Fill in October." → Ask back: "Use the meter reading, 200,000 kWh, grade B, or an estimate with a stated method?"
  3. "Write that we run on green electricity." → Rewrite: "34.3% of our electricity (Werk Süd, 1,240 MWh) is covered by cancelled guarantees of origin."
  4. "Write that we are climate-neutral." → Refuse: nothing in the ledger supports it.
  5. "Explain why emissions fell compared with 2024." → Calculate the bridge first, then draft citing driver lines; no "efficiency" without production data.
  Below, the target ask-back answer for the raw folder (label `meta.targetLabel_en`), collapsed; shown on press 5:
  > "I can give a provisional figure, but these points need your decision first: 1. October is missing for Werk Nord. The meter file shows 200,000 kWh. Use it? 2. Two files carry invoice 4711-03. I counted March once. 3. One bill is addressed to Talbrück Beschichtung GmbH with its own meter. Inside your boundary? I left it out. 4. Werk Süd reports '1.240 MWh'. I read 1,240,000 kWh; last year's 1.250 MWh on the same page fits. 5. The gas bills state Brennwert (Hs) on page 2. I used F-GAS-HS. 6. August is almost a third below July (−31%). Plant holiday? I did not change it. 7. The folder has no refrigerant service invoices and no forklift fuel. Are there other Scope 1 sources?"
- **Steps:** press 1 cards unsorted; press 2 to 4 each column fills after the room calls out; press 5 the ask-back answer.
- **Notes:**
  - say: ["A useful assistant does three different things: it calculates what the ledger supports, asks back where a person decides, and refuses claims the evidence cannot carry.", "On card 4: refuse it because nothing in the ledger supports it. Since 27 September 2026, Directive 2024/825 bans, towards consumers, generic environmental claims such as 'eco-friendly' unless recognised excellent environmental performance can be shown, and claims that a product is climate-neutral based on offsets (in Germany through an amendment to the UWG, known from secondary sources; check the current text). Whether your own website is aimed at consumers is a question for your lawyer. Misleading claims are banned towards business customers too (in Germany § 5 UWG).", "Must say: Not legal advice. Check the German transposition.", "On press 5: this is the answer we want from the raw folder. It raises seven points for a person before it commits to a number."]
  - sayAt: {"0":[1],"1":[3],"2":[3],"3":[5]}
  - ask: [{"at":1,"text":"Sort the five requests: calculate, ask back, refuse or rewrite.","aloud":true}]
  - expectedAudience: ["Card 3 is often put under Calculate; answer: rewrite with the share and the site.", "Card 5 splits the room."]
  - revealOrder: ["Five unsorted cards", "Calculate column", "Ask back column", "Refuse or rewrite column", "Target ask-back answer"]
  - cut: "Use cards 1, 3 and 4 only."
  - appendixRoutes: ["appendix-claims", "appendix-regulation", "appendix-baseline"]

**18 · `limits`** · act 5 · 150 · listen · shown · 64:00 to 66:30
- **Title:** What this does not prove
- **On screen:** five labelled rows:
  1. "One fictional case. The raw-folder answer is constructed. Recorded runs, when captured, are in appendix A3 with a per-trap catch table."
  2. "Two published studies measured about three in four numbers extracted correctly from ESG reports (ESGReveal, GPT-4, 2023: 76.9%; ESG Insight, DeepSeek, 2026: 78.2%). They tested reports, not bills, and newer models may do better."
  3. "Rules catch what they are written for. No documents for refrigerant top-ups, forklifts at Lager Ost, an emergency generator or heating oil: nothing was checked there."
  4. "The 2024 figures are a consultant summary, grade B, with no bills. Same boundary, same factor file."
  5. "Teaching factors. Kit bills leave out the supplier mix disclosure. Rules as of 26 Sep 2026. Not legal or audit advice."
- **Steps:** 0 to 4, one row per press.
- **Notes:**
  - say: ["Today does not show that any tool gets this right or wrong in general.", "On press 3: the ledger lets you check a number against its bill. If the bill is wrong, the ledger carries the error, and it knows nothing about sources nobody put in the folder. Write what you did not check on the page itself.", "Must say: Not legal or audit advice."]
  - sayAt: {"0":[0],"1":[2],"2":[4]}
  - ask: [] · expectedAudience: []
  - revealOrder: ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"]
  - cut: "Read rows 1, 3 and 5."
  - appendixRoutes: ["appendix-regulation", "appendix-run-record"]

**19 · `your-bill`** · act 6 · 420 · write · shown · 66:30 to 73:30 · `data-recovery-seconds="120"`
- **Title:** Your turn: one bill, five boxes
- **On screen:** the transfer sheet (§6) with the Werk Süd example in grey beside each box. Line: "Use an invented or anonymised bill. No company data goes into any tool."
- **Steps:** press 1 to 5 each box highlighted in turn ("Now: Source", "Now: Period", "Now: Unit", "Now: Boundary", "Now: Factor"); press 6 "Compare with a partner. Two pairs share their hardest box."
- **Timing:** 5 min alone, 2 min pairs.
- **Notes:**
  - say: ["Must say: No company data goes into any tool today.", "Take one bill you know from work, or invent a realistic one. Fill the five boxes: where it comes from, which period, which unit, whether it is inside your boundary, and which factor with which year.", "On press 6: tell your neighbour which box was hardest. Two pairs share with the room."]
  - sayAt: {"0":[0],"1":[1],"2":[6]}
  - ask: [{"at":6,"text":"Which box was hardest?","aloud":true}]
  - expectedAudience: ["Boundary and factor are the usual hardest boxes."]
  - revealOrder: ["Sheet with example", "Box 1 Source", "Box 2 Period", "Box 3 Unit", "Box 4 Boundary", "Box 5 Factor", "Pair share"]
  - cut: "Pairs only, no room sharing."
  - appendixRoutes: []

**20 · `resolution`** · act 6 · 180 · vote · shown · 73:30 to 76:30
- **Title:** What changed between the two answers?
- **On screen:** both answers side by side (hatched vs solid ink). Number ladder for the change sentence:
  1. "AI said: −7.5% `{wrong_chg_lb_pct}`, 'through efficiency'."
  2. "Right data: −5.1% `{chg_lb_pct}`."
  3. "Of the 102.3 t `{chg_lb_t}`, 72.2 t `{drv_lb_grid_t}` is the grid factor (teaching values)."
  4. "30.1 t `{drv_lb_own_t}` is own lower use. Efficiency is not proven."
  Then four questions to ask any AI tool: "Does each number link to its document? Which factor, which edition? What was excluded, and why? Who approved it?"
- **Steps:** press 1 side by side; press 2 ladder; press 3 callback vote; press 4 four questions.
- **Room vote (press 3):** "Send the raw-folder answer to the bank now?" Send · Ask back first · Refuse. (Callback to scene 6.)
- **Notes:**
  - say: ["At the start many of you would have sent the first number. It was close to right, and its explanation was wrong.", "On press 2: read the ladder. The change moved 2.4 points `{chg_lb_pp_shift}`, from −7.5% to −5.1%. The explanation moved from 'efficiency' to 'mostly the grid factor'.", "On press 3: same vote as at the start.", "On press 4: four questions for any AI tool you are offered. Then point to the materials link and stop talking."]
  - sayAt: {"0":[1],"1":[2],"2":[3],"3":[4]}
  - ask: [{"at":3,"text":"Send the raw-folder answer to the bank now?","options":["Send","Ask back first","Refuse"],"expected":"Almost no one sends."}]
  - expectedAudience: ["Compare with the hands at scene 6."]
  - revealOrder: ["Both answers side by side", "Number ladder", "Callback vote", "Four questions and the materials link"]
  - cut: "Skip the ladder; do the vote."
  - appendixRoutes: []

### 2.4 Appendix scenes (`data-kind="appendix"`, `data-seconds="0"`)

**A1 · `appendix-arithmetic`** · Title: "Every calculation on one page". Two columns (2024 | 2025) with every line of §1.6 from JSON, both waterfalls as tables, the control total, the driver ranking by method (`ranking.lb`: WN electricity 904.0 t 47.2%, WS electricity 496.0 t, WN gas 333.0 t; `ranking.mb`: WN electricity 1,356.0 t 71.6%, WN gas 333.0 t, diesel 95.0 t; Werk Süd electricity drops to 0 t in market-based because of the certificate, not lower use). Show at most the top three shares; if all six are ever listed with a total row, add `ranking.shareNote_en` (the rounded location-based shares add to 100.1%). Rounding convention line. Note: "For questions like 'where does 1,422 come from?'"

**A2 · `appendix-factors`** · Title: "Where real factors come from". Teaching table next to real sources: UBA grid factor published yearly (433 / 386 / 363 g CO₂/kWh for 2022 to 2024, direct CO₂ only; UBA as reported in search summaries read on 26 Sep 2026; UBA revises earlier years in each publication, re-check under O5); AIB residual mix, new each year (2025 results published 26 May 2026); DESNZ (UK set, every June); IEA and ecoinvent are licensed. The licence limits sharing, so check it before you paste values into an external tool or a kit. Line: "Always record source, edition, year, region, basis and licence."

**A3 · `appendix-run-record`** · Title: "How the two answers were produced". Model, tool, date, prompt (hash and link to kit), files per condition, five runs each, per-trap catch table from `runs.table`. Until captured: `meta.constructedLabel_en`, `meta.targetLabel_en`, and "Capture planned before publication. Protocol: kit prompts/00_run_protocol.md."

**A4 · `appendix-regulation`** · Title: "What is true on 26 September 2026". Text in §9.

**A5 · `appendix-claims`** · Title: "Six sentences from the AI's answer, checked". Table: sentence · evidence · verdict.
1. "7.5% below 2024" · right data −5.1% · wrong.
2. "Since 2025 Kellbrunn runs on green electricity" · 34.3% at Werk Süd · false; rewrite with share and site.
3. "The reduction comes mainly from efficiency measures" · 71% grid factor (LB, teaching values), no production data · unsupported.
4. "Scope 1 rose by 6.5%, probably due to higher heating demand" · Scope 1 −2.7%, gas kWh −2.8% · false direction, invented cause.
5. "Scope 2 market-based: 1,350.0 t" · grid average used for power without a certificate · wrong method; 1,422.0 t.
6. "10.4 t per employee" · 10.6 t · wrong, and not a check.

**A6 · `appendix-baseline`** · Title: "When the base year must be restated". Label: "Separate teaching variant. It does not connect to the 2024 comparison in the main case." Variant: Kellbrunn's first inventory was 2023 and it sold a foundry, Werk 3, on 1 July 2024. The GHG Protocol Corporate Standard requires recalculating the base year for a significant structural change such as a divestment.
- Restated 2023 base: 2,215.0 t `{var_2023_lb_restated_t}` (Werk 3 removed: 945.0 t `{var_w3_t}`).
- Like for like 2023 → 2025: −13.5% `{var_chg_vs_restated_pct}` (−299.8 t `{var_chg_vs_restated_t}`): less electricity −94.5 `{var_drv_elec_t}`, grid factor −180.5 `{var_drv_grid_t}`, less gas −19.8 `{var_drv_gas_t}`, less diesel −5.0 `{var_drv_diesel_t}`.
- What the unrestated comparison would wrongly show: −39.4% `{var_chg_vs_reported_pct}` against 3,160.0 t `{var_2023_lb_reported_t}` as first reported.
- Market-based 2023 was never reported. It can be recalculated from 2023 activity data with the 2023 residual mix (teaching value 0.60) and labelled "recalculated, restated": 2,788.0 t `{var_2023_mb_restated_t}` (3,868.0 t `{var_2023_mb_reported_t}` with Werk 3). Like for like −32.1% `{var_chg_mb_vs_restated_pct}`.
- Sentence: "Our Scope 1 and 2 emissions (location-based, CO₂e) fell 13.5% from 2023 to 2025 at the sites we still run. The base year is restated without Werk 3, sold in July 2024."
- Note: "Grid-factor changes that reflect a real change in the grid are not a reason to restate; they appear as a driver. A switch of factor source or method is a methodology change and is checked against the same significance threshold."
- Inputs: `inputs.variant2023` (continuing sites 3,820,000 kWh electricity, 2,200,000 kWh(Hs) gas, 40,000 l diesel; Werk 3 900,000 kWh electricity and 3,000,000 kWh(Hs) gas).

**A7 · `appendix-steel`** · Title: "Which number from the supplier's reply?" Steel strip 2,400 t both years. Supplier product footprint 1,650 kg CO₂e/t → 3,960 t `{steel_supplier_t}`; the supplier's Scope 1 + 2 intensity 0.12 t/t → 288 t `{steel_intensity_wrong_t}` (−93% `{steel_intensity_wrong_pct}`, wrong number); spend-based on nominal 2025 euros 5,184 t `{steel_spend_nominal_t}`, +20% `{steel_spend_yoy_pct}` while tonnage was flat. Line: "Steel alone is larger than Scope 1 and 2 together." Supplier "Bandstahl Wendelin GmbH" (fictional). Inputs: `inputs.steel` (2,400 t in both years; spend €1.8m in 2024 and €2.16m in 2025; spend factor 2.4 kg CO₂e/€; price deflator 1.2). Backup keys if asked: 4,320 t `{steel_spend_2024_t}` for 2024 spend, 4,320 t `{steel_spend_deflated_t}` for 2025 spend in 2024 prices.

**A8 · `appendix-scope2-order`** · Title: "Market-based: which rate for which kWh?" The order from the Scope 2 Guidance (2015): 1 energy attribute certificates for the kWh they cover (guarantees of origin, cancelled); 2 a supplier-specific emission rate that meets the quality criteria (every German bill carries the Stromkennzeichnung under § 42 EnWG; check whether it qualifies); 3 the residual mix for the rest. Line: "The kit's bills leave out the Stromkennzeichnung for simplicity, so here step 2 is empty." Small print: "Simplified: the Guidance also lists direct contracts (PPAs), and allows a grid average only where no residual mix is published. AIB publishes one for Germany." Note: "Hourly matching and deliverability were consultation proposals (Oct 2025 to Jan 2026). The 2015 Guidance still applies."

### 2.5 `presenter-notes.js`

`window.FOLDLINE_PRESENTER_NOTES = Object.freeze({ … })` (global name kept because the console reads it; namespace patched as in §2.1). One entry per main scene with the seven fields exactly as listed in §2.3, plus documentary `clock` (`start`, `end`, `budget_seconds`), `mode` and `purpose`. Appendix scenes get short entries with `revealOrder: ["Whole scene"]` and `cut: "Appendix; show on request."` The generator for this file reads `numbers` from the JSON and substitutes `{key}` placeholders in `say` lines, so spoken numbers cannot drift.


---

## 3. Demo: `demo.html`

**The one question at the top:** "How can a total be almost right when six of its parts are wrong?"

**Contract:** self-contained static HTML on the W03 design system and the shared `wf-strip` frame. Data inline: a generated `<script>` assigns `window.W04_DATA` from `w04-data.json` (no fetch, no storage, no `innerHTML`, no inline handlers, no iframes; listeners via `addEventListener`; DOM built with `createElement`/`textContent`). Works without JS: the final state is server-rendered into the HTML by the generator, and JS only adds the switches.

**Final state visible on load:** both answers, the full LB waterfall from `waterfall.lb`, every trap switch in the "fixed" position, the coverage grid filled, both driver bridges and the rewritten sentence. Nothing waits for a play button.

**Label at the top:** "Fictional company · teaching factors · the raw-folder answer is constructed from documented failure modes" (after capture: "Recorded runs: <date>, <model>, 5 per condition, table in section 6").

### 3.1 Sections and components

1. **Question and two answers.** q-card with `question.en`. Two lanes (`.lane--export` hatched, `.lane--approved` ink), each with Scope 1, Scope 2 LB, Scope 2 MB, total and "vs 2024": raw lane from `combinations["127"]` (all traps), ledger lane from `combinations["0"]`. Mennige only on the figure the learner is looking at.

2. **Trap switches and the waterfall (the core).**
   - Seven rows from `traps` (T1 to T7), plus a non-interactive row for the two-month bill ("0 t; hides the gap", `trapNotes.twoMonthBill_en`). Each row: name, file name, role tag (Reader or Clerk), a `button[aria-pressed]` switch with visible text "Fixed" / "As the AI did it", its effect for the selected method labelled "if only this trap fires" (`traps[i].isolated.lb_en` / `mb_en`), and an "Only this trap" link that sets every other switch to fixed.
   - Method selector (two square tabs): Location-based · Market-based. In market-based, T4 shows "0 t for this number" and T7 becomes active; in location-based, T7 shows "0 t for this number".
   - Chart: a horizontal waterfall. With all switches at their raw state it draws `waterfall.lb` or `waterfall.mb` in the fixed order, captioned "with all traps active, in this order" (in market-based, T1 to T3 show −82.0 / +80.0 / −400.0 here but +123.0 / −120.0 / +600.0 in the rows, because T7 is still active in the bar and not in the row; both are right). For any other state the chart shows the start bar (right answer), one bar per active trap in fixed order with its marginal effect, and the end bar; every total is looked up in `combinations[mask]` (mask from `trapBits`). The chart never adds stored bar values, because effects depend on order in market-based.
   - Two meters beside the chart: "Distance from the right answer" and "Change vs 2024" (`vs2024_lb_pct` / `vs2024_mb_pct`). The distance meter shows the absolute value of `combinations[mask].delta_vs_right_lb_t` and `_pct` (or `delta_vs_right_mb_*`) with "below" or "above" from the sign, so the raw preset reads "48.7 t below", matching every other surface.
   - Preset buttons: "The AI's raw-folder run (constructed)" (mask 127) and "All fixed" (mask 0).
   - Slate check line under the chart: "Sum of the bars = chart total ✓".

3. **Guided sequence** (collapsible list at the top of section 2, from `demoSequence`, about 6 minutes):
   1. Predict: "Which switch moves the total most? Duplicate March, Talbrück bill or '1.240 MWh'." Three radio buttons; the answer appears when the learner toggles T4: −495.5 t `{unit_lb_t}`.
   2. Switch on only the Talbrück bill: 2,315.2 t `{demo_only_jv_lb_t}`, +14.8% vs 2024 `{demo_only_jv_vs2024_pct}`. A rise of 14.8% makes anyone ask what happened, so this state would be caught.
   3. Add the MWh misread: 1,819.7 t `{demo_jv_unit_lb_t}`, −9.8% `{demo_jv_unit_vs2024_pct}`. Plausible again.
   4. Switch the method to market-based: T4 now shows 0 t; the total is 2,493.2 t `{demo_jv_unit_mb_t}`, −6.8% `{demo_jv_unit_vs2024_mb_pct}`.
   5. Switch the method back to location-based, then switch on only the duplicate March and October. Together they move the total by only +2.0 t `{pair_dup_oct_t}`, so a check on the total misses both. (In market-based the same pair moves it by +3.0 t `{pair_dup_oct_mb_t}`.) `demoSequence[i].method` says which method each step expects.
   6. Open the evidence drawer from "72.2 t" in the rewritten sentence (section 5).

4. **Open a document (evidence drawer).** Folder tree (`documents`, 20 bills, plus the meter CSV and the fuel-card CSV shown as tables). Selecting a file opens a drawer (`role="dialog"`, focus trap, Esc closes, focus returns) with: the bill as a paper card from `documents[].lines`, the quoted line highlighted; below it the ledger row(s) it produced (`ledger` rows whose `source_file` matches), status chip (actual, meter, excluded + reason, instrument) and factor ID; and the arithmetic line. Special cases: the duplicate shows both March bills side by side with 4711-03 marked; October opens the two meter rows and the subtraction; Talbrück shows the addressee block and its meter; the gas bill opens on page 2 with the Hs line marked. The drawer also opens from any bar in section 2 and any number in the sentence in section 5.

5. **What drove the change.** Two bridges (LB, MB) from `drivers`, 2024 → 2025, with the caption from `drivers.convention_en`. Under them the rewritten sentence (numbers are buttons that open the drawer with their driver line and rows) and the AI's struck sentence. A small table "Largest sources depend on the method" from `ranking` (top three per method), with the line "Werk Süd drops out of the market-based ranking because of the certificate, not lower use."

6. **Coverage grid and control total.** `coverage.expected` (October dashed, grade B), with a toggle "As the folder arrived" (`coverage.asDelivered`: March 2, October empty, November/December bracket, Talbrück cell outside the grid). Toggling T1 or T2 in section 2 changes this grid too. Under it the control total from `controlTotal`: rows with `group: "document"` above the "Documents" sum, the `group: "meter"` October row only below it.

7. **Run record.** Until capture: `meta.constructedLabel_en`, `meta.targetLabel_en`, and the protocol in three lines. After capture: the per-run table from `runs.table` with model, date, prompt link and the per-trap catch counts.

### 3.2 States

| State | Trigger | What changes |
|---|---|---|
| Final (default) | Load | All fixed; LB chart shows the stored raw-to-right waterfall as a ghost path for reference; meters at 0.0 t and −5.1% |
| Raw preset | "The AI's raw-folder run" | Mask 127; lanes identical to the constructed answer |
| Custom | Any switch | Mask updated; chart, meters, grid and lanes update; `aria-live="polite"` region announces "Total 1,819.7 t, 95.5 t below the right answer" (numbers from `combinations`) |
| Method MB | Tab | Chart swaps to MB; T4 label "0 t for this number" |
| Drawer open | Click on file, bar or number | Dialog with document, row and arithmetic |
| Reduced motion | `prefers-reduced-motion` | Bars change without animation |

### 3.3 Mobile (390 px and 320 px)

- One column: q-card, lanes stacked (raw first), then the switches.
- The waterfall becomes a vertical list: trap name, switch, a signed bar growing left or right from a centre line, running total at the row end. A sticky mini-total ("1,915.2 t · −5.1% vs 2024") stays at the top while the list is in view.
- Switch rows are full width, at least 44 px high, text "Fixed" / "As the AI did it".
- The drawer opens as a full-width sheet with a "Back" button.
- The coverage grid becomes 12 rows (months) × 6 columns, scrolling only inside its own frame with the month column pinned; no page-level horizontal scroll.
- Keyboard: every control reachable; switches are `button[aria-pressed]`; tabs are a `role="tablist"`.

Time budget: 10 minutes. Linked from the `anatomy` and `rematch` notes and from the web page as optional.

---

## 4. Learner guide: `guide.html`

Phone-first, W03 `guide.html` template, `wf-strip` at the top. Top line: "Learner guide · to read after the session · about 25 minutes". Sections mirror the acts. Each section: the question as heading, the short answer (the paragraphs below), a "Reveal the explanation" `details/summary` retrieval prompt, and one key point. All numbers are rendered from JSON keys; the paragraphs below show them in EN format for reading.

**1. Why does a 180-person company get this question?**
Kellbrunn Präzisionsteile GmbH is invented. It makes stamped and machined metal parts at two plants, Werk Nord and Werk Süd, and runs a leased warehouse, Lager Ost. It has 180 staff and has never been in CSRD scope. Its house bank asks for Scope 1 and 2 emissions to price a loan, and a car maker's supplier questionnaire asks the same, plus whether the number went down. The question for the whole workshop is: "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?"
Reveal: "Which two thresholds decide CSRD scope since 18 March 2026?" Answer: more than 1,000 employees and more than €450m turnover, both. That is the EU rule; member states must bring national law in line by 19 March 2027.
Key point: A company outside the reporting law still gets asked, by the people who lend it money and buy its parts.

**2. The first answer, and the checks it passed**
We gave an AI the 2025 folder: 22 files with monthly electricity bills, an annual statement for Werk Süd, a certificate, two gas bills, four landlord statements, meter readings and a fuel-card export, plus last year's figures and a factor table. The answer: 1,866.5 t CO₂e, 7.5% below 2024. It passes the checks people usually do: the change looks like a normal year, 10.4 t per employee is close to last year's 11.2 t, the Werk Nord folder holds twelve bills, the AI shows its sums, and it gives two Scope 2 numbers. This answer is constructed from documented failure modes. It shows what happens when all six traps fire; it is not a recorded run.
Reveal: "Which of the five checks would you have trusted most, and what does it actually test?"
Key point: A total close to last year's does not show that each bill was counted once.

**3. Twelve files, eleven months**
The Werk Nord folder holds twelve electricity files. March is in twice: purchasing forwarded the invoice and someone scanned it again, so a second file with invoice number 4711-03 is next to the first. October is missing. The November and December bill covers two months, which keeps the count at twelve. The facility manager's meter readings show October: 5,012,300 minus 4,812,300 is 200,000 kWh. The duplicate adds 205,000 kWh and the gap removes 200,000, so the Werk Nord sum is only 5,000 kWh off. August is low (120,000 kWh) because of the plant holiday. That is real, and a good assistant flags it for a person without changing it.
Reveal: "Why did the Werk Nord sum end up only 5,000 kWh off?"
Key point: Fill a site-by-month grid before you add anything up. Count months, not files.

**4. A dot that means a thousand**
The Werk Süd statement says "Verbrauch 2025: 1.240 MWh". On a German document the dot separates thousands, so this is 1,240 MWh, or 1,240,000 kWh. Read as 1,240 kWh, Werk Süd almost disappears and location-based Scope 2 drops by 495.5 t. Two checks catch it without knowing the number format: 1,240 kWh would be 23 kWh per Werk Süd employee per year, against 22,545 kWh when read correctly, and the same page prints last year's value, 1.250 MWh.
Reveal: "What does the misread do to the market-based figure?" Answer: nothing. Werk Süd is 0 in market-based either way, because the certificate covers it.
Key point: Keep the value and unit exactly as printed in the row, and convert with a written rule.

**5. Whose bill is it?**
One annual bill in the Werk Nord folder is addressed to Talbrück Beschichtung GmbH, a powder-coating company on the same premises. Kellbrunn holds 40% and the partner runs it; the contract and the meter are Talbrück's. Kellbrunn chose the operational control approach, so the bill is out. Counting it adds 1,000,000 kWh and 400.0 t location-based (600.0 t at the residual mix). The row stays in the ledger as excluded, with the reason, and is a candidate for Scope 3 category 15 later.
Reveal: "When would 40% be right?" Answer: only if the company had chosen and written down the equity-share approach.
Key point: The name on the document decides, checked against a boundary written down before the AI runs.

**6. Why the total looked right**
Six errors are inside the first answer. The duplicate and the missing October cancel to 2.0 t. The Talbrück bill hides four fifths of the unit error. The gas bills state on page 2 that the kWh are based on the gross calorific value (Brennwert, Hs), and the AI used the factor for the net value (Heizwert, Hi): +41.8 t. AdBlue in the fuel-card export is a urea solution for the exhaust, not a fuel: +3.0 t. When you remove the errors one by one, the running total swings between 1,464.5 t and 1,960.0 t and ends at 1,915.2 t, 48.7 t away from where it started.
Reveal: "Which two errors cancel to 2.0 t, and which error hides four fifths of another?"
Key point: A small gap in the total can hide large errors in the parts.

**7. The ledger**
A ledger (Belegtabelle) has one row for each quantity on a document. Each row keeps the file, the page, the quoted line, the value and unit as printed, the normalised value, the legal entity on the document, whether it is inside the boundary, the status and the factor ID. Excluded rows stay in with a reason. The October row is a meter reading, so it gets data-quality grade B. A control total ties it together: all electricity on documents (4,615,000 kWh) minus what was excluded with a reason (1,205,000 kWh) plus October from the meter (200,000 kWh) equals the 3,610,000 kWh in the ledger.
Reveal: "Which column catches the Talbrück bill, and which check catches a missing month?"
Key point: Every number points to a page, including the numbers you left out.

**8. Six rules and a pinned factor table**
The rules are written before the AI runs: boundary, coverage, units, factors, Scope 2 and citations. The work splits into three roles. The reader extracts rows and quotes what is printed. The clerk applies the rules in a spreadsheet, never by mental arithmetic. The writer drafts sentences that cite rows. The AI may propose rules; a spreadsheet applies them, and a person approves the list. Factors come from a pinned table by ID, with the edition recorded. Using last year's grid factor (0.42) on 2025 electricity would add 72.2 t, which is the whole grid effect in this year's change.
Reveal: "Why should the AI never type a factor from memory?"
Key point: The AI picks an ID. The value, year and edition are in a table a person approved.

**9. Two Scope 2 numbers**
Location-based Scope 2 uses the average grid factor where the power is used: 3,610,000 kWh × 0.40 = 1,444.0 t. Market-based Scope 2 uses what the company bought. The guarantees of origin cover 1,240 MWh at Werk Süd and nothing else, so Werk Süd is 0. The other 2,370,000 kWh get, in order, a qualifying supplier-specific rate if one exists, otherwise the residual mix: 0.60 in the teaching values, giving 1,422.0 t. Under the GHG Protocol a company buying power in a market with certificates and supplier contracts, such as Germany, reports both figures. The kit's bills leave out the supplier mix disclosure that real German bills carry, so here the residual mix applies. The certificate removes 496.0 t and the residual mix adds 474.0 t back, so market-based is only 22.0 t below location-based. "We run on green electricity" is false; 34.3% of the electricity is covered.
Reveal: "Why is 948.0 t wrong for market-based?" Answer: it uses the grid average for power without a certificate, 474.0 t too low.
Key point: Report both numbers, and a certificate only for the kWh it covers.

**10. The same question on the ledger**
With the ledger, the coverage grid and the rules, the same AI gets the same question. The target answer names row IDs for every figure: Scope 1 471.2 t, Scope 2 1,444.0 t location-based and 1,422.0 t market-based, totals 1,915.2 t (−5.1% against 2024) and 1,893.2 t (−29.2%). It labels the October meter reading, lists the three excluded rows, and says which Scope 1 sources it could not check. Until recorded runs exist, this answer is labelled as constructed.
Reveal: "Pick one number in the answer. Which rows and which page would you ask for?"
Key point: The total moved by 48.7 t. Every tonne now has a row behind it.

**11. What drove the change**
Location-based emissions fell 102.3 t. In this case's teaching values, 72.2 t of that (71%) comes from the lower grid factor and 30.1 t from using less electricity, gas and diesel. Market-based fell 781.3 t, and 744.0 t of that (95%) is the guarantees of origin for Werk Süd. The residual mix is held at 0.60 in both years on purpose; real residual mixes change every year. The folder has no production volumes, so "used less" is supported and "more efficient" is not. The largest sources also depend on the method: location-based, Werk Nord electricity leads with 904.0 t, then Werk Süd electricity with 496.0 t; market-based, Werk Nord electricity is 1,356.0 t and Werk Süd electricity is 0.
Reveal: "Why can't Kellbrunn write 'thanks to efficiency measures'?"
Key point: Say which part of a change you caused, and which part came from the grid or from certificates.

**12. Calculate, ask back, refuse**
Five requests show the three jobs of a useful assistant. "Sum Scope 2" is a calculation from the ledger. "Fill in October" needs a decision: the meter reading (grade B) or a labelled estimate. "Write that we run on green electricity" gets rewritten with the share and the site. "Write that we are climate-neutral" gets refused, because nothing in the ledger supports it. For context: since 27 September 2026, Directive 2024/825 bans, towards consumers, generic environmental claims such as "eco-friendly" unless recognised excellent environmental performance can be shown, and claims that a product is climate-neutral based on offsets (in Germany through an amendment to the UWG, known from secondary sources; check the current text). Whether a text such as your website is aimed at consumers is a question for your lawyer. Misleading claims are banned towards business customers too (in Germany § 5 UWG). Not legal advice. "Explain why emissions fell" gets the bridge first, then a draft that cites driver lines.
Reveal: "Which request needs a person to decide, and what is the decision?"
Key point: A good assistant asks back when a person has to decide, and names the decision.

**13. What this does not prove**
This is one fictional case. The raw-folder answer is constructed; recorded runs, with date and model, are listed separately. Two published studies measured about three in four numbers extracted correctly from ESG reports (ESGReveal, GPT-4, 2023: 76.9%; ESG Insight, DeepSeek, 2026: 78.2%). They tested reports, not bills, and newer models may do better. Rules catch only what they are written for: the folder has no refrigerant service invoices, no forklift fuel, no generator and no heating oil, so none of those Scope 1 sources was checked. The 2024 figures are a consultant summary without bills. Factors are teaching values. Rules are as of 26 September 2026 (appendix: what is true, with sources). This is not legal or audit advice.
Reveal: "Name two Scope 1 sources a folder of energy bills never shows."
Key point: Write what you did not check on the page, next to the number.

**14. Your bill**
Take one bill you know, or invent one, and fill the five boxes of the transfer sheet: source, period, unit, boundary, factor. The Werk Süd example is next to each box. Use no company data in any tool. The field card holds the seven checks on one page.
Key point: Fill five boxes for one bill and end with one sentence that says where the number comes from.

**15. Try it with an AI (optional, 20 minutes, needs an AI account)**
Open the kit. Run prompt 01 on the raw folder and compare your rows with `erwartet/belegtabelle_2025.csv`. Run prompt 02 on the rows and check whether it flags the duplicate, October, Talbrück and the unit. Use only the kit's invented files, never company data in a tool your company has not approved.

**16. One week later** (follow-up, 5 minutes plus an optional 30-minute stretch)
Four recall questions behind reveals: "Name the unique key for a bill, and the fallback key." "What rate does market-based use for power without a certificate?" "Which part of a year-on-year change is usually not your doing?" "What does a good assistant do when a month is missing?" Stretch task: build the ledger from `rohdaten_2025/` yourself and compare it with `erwartet/belegtabelle_2025.csv`. You are done when your location-based total is 1,915.2 t and your control total is 3,610,000 kWh.

**17. Glossary** (definitions, one line each): Scope 1; Scope 2; Scope 3; location-based; market-based; residual mix; guarantee of origin (Herkunftsnachweis), cancelled (entwertet); supplier mix disclosure (Stromkennzeichnung); operational control; equity share; activity data; emission factor; factor ID and edition; gross and net calorific value (Brennwert Hs, Heizwert Hi); ledger (Belegtabelle); coverage grid; control total; data-quality grade A/B/C; base year, restatement, like for like; VSME; CSRD; Directive 2024/825 (EmpCo).

**18. Where to go deeper** (links only): GHG Protocol Corporate Standard and Scope 2 Guidance; UBA grid factor page; AIB residual mix; EFRAG VSME; Directive 2024/825 and the Commission FAQ.

---

## 5. Field card: `field-card.html` (+ `vorlagen/merkkarte.md`)

One A4 page, print CSS, body at least 9 pt. Title: **Before you trust an ESG number**. Subtitle: "Seven checks. Each one comes from Workshop 04."

| # | Check | Do | Don't | From the case | Scene |
|---|---|---|---|---|---|
| 1 | Months, not files | Fill a site × month grid before you add anything up. | Count files and call the year complete. | 12 files, 11 months | month-grid |
| 2 | One bill once | Key = invoice no. + period + meter. Normalise look-alike characters first; fall back to period + meter + quantity. | Trust that a rescanned bill looks different. | Duplicate March +205,000 kWh | month-grid |
| 3 | Unit as printed | Keep value and unit as printed next to the kWh. Check kWh per employee and last year's value. | Convert in your head or in the prompt. | "1.240 MWh" misread: −495.5 t | one-unit |
| 4 | Whose name is on it | Check the entity on the document against your written boundary. Keep excluded rows with a reason. | Include whatever is in your folder. | Talbrück bill: +400.0 t | whose-bill |
| 5 | Factor with ID, year, basis, edition | Pick from a pinned table. Match the gas basis (Hs or Hi) to the bill. | Let the AI supply a value. | Last year's grid factor: +72.2 t | six-rules |
| 6 | Two Scope 2 numbers | Report location-based and market-based. Certificate only for the kWh it covers; then supplier rate; then residual mix. | Turn one certificate into "green power". | 1,444.0 t and 1,422.0 t; 34.3% covered | two-scope-2 |
| 7 | Split the change | Name grid factor, certificates and own use; say which part is yours. | Write "efficiency" without production data. | −102.3 t: 72.2 grid, 30.1 own use | what-drove-it |

Line under the table: "Roles: the reader quotes, the clerk applies rules in a spreadsheet, the writer cites rows. The AI may propose rules; a spreadsheet applies them, and a person approves the list."
Line: "Before you send: control total ✓ · what you did not check, written next to the number ✓."
Footer: "Fictional case, teaching factors. Rules as of 26 Sep 2026. Not legal or audit advice. loehrning.ai/workshops/esg-berichte-mit-ki"

All numbers from JSON keys: `files_wn_electricity`, `months_wn_covered_raw`, `dup_kwh`, `unit_lb_t`, `jv_lb_t`, `last_year_factor_effect_t`, `s2lb_2025`, `s2mb_2025`, `renewable_share_el_pct`, `chg_lb_t`, `drv_lb_grid_t`, `drv_lb_own_t`.

---

## 6. Transfer sheet: `transfer.html` (+ `vorlagen/transfer.md`)

One A4 page, print CSS. Header: **One bill, five boxes**. Line: "Use an invented or anonymised bill. No company data goes into any tool."

| Box | What to write | Worked example (Kellbrunn, Werk Süd) |
|---|---|---|
| 1 Source | File, page and the exact line you read | `Jahresuebersicht_2025_Oekostrom.md`, page 1, "Verbrauch 2025: 1.240 MWh" |
| 2 Period | From, to, months covered; gaps or overlaps with other bills | 01.01.2025 to 31.12.2025, 12 months, no overlap. Last year on the same page: 1.250 MWh |
| 3 Unit | Value and unit as printed → normalised value, and the rule | 1.240 MWh → 1,240,000 kWh (MWh × 1,000; the dot separates thousands). Check: 22,545 kWh per employee, close to last year |
| 4 Boundary | Legal entity on the document; in or out; which rule | Kellbrunn Präzisionsteile GmbH, Werk Süd; in; operational control |
| 5 Factor | Factor ID, year, basis, edition; method; any certificate | Location-based: F-EL-LB-2025 (0.40, teaching value) → 496.0 t. Market-based: F-EL-GO under I-WS-GO (1,240 MWh guarantees of origin, cancelled, Werk Süd only) → 0 t |

Closing sentence template:
- EN: "This number comes from [document, line], covers [period], was converted by [rule], belongs to [entity] under [boundary rule], and uses [factor ID, year, edition]. Still open: [one thing]."
- DE: „Diese Zahl stammt aus [Beleg, Zeile], deckt [Zeitraum] ab, wurde mit [Regel] umgerechnet, gehört zu [Gesellschaft] nach [Regel zur Bilanzgrenze] und nutzt [Faktor-ID, Jahr, Stand]. Noch offen: [eine Sache]."

Worked sentence: "This number comes from the Werk Süd annual statement 2025, line 'Verbrauch 2025: 1.240 MWh', covers January to December 2025, was converted with MWh × 1,000, belongs to Kellbrunn Präzisionsteile GmbH, Werk Süd, under operational control, and uses F-EL-LB-2025 (teaching values v1.0). Still open: the monthly split, if the customer asks for quarters."

Numbers from JSON: `el_ws_kwh`, `ws_kwh_per_employee`, `ws_lb_2025`, `go_mwh`.


---

## 7. Kit: `esg-kit.zip`

Text only (CSV, MD, TXT). No PDF, XLSX, DOCX or PPTX anywhere, no HTML with active content, no nested archives, ASCII file names, no forbidden basenames. Root folder in the zip: `esg-kit/`. Uncompressed size of the generated files today: 212 KB (738 fuel-card rows are most of it); the zip is expected well under 100 KB. The registry's `sizeLabel` is set from the measured zip at build.

### 7.1 File list

Generated by `build_dataset.py` (never edit by hand) are marked **gen**. Markdown files marked **text** have their full content below.

| Path in `esg-kit/` | Source | Purpose | Scene |
|---|---|---|---|
| `START-HERE.md` | text §7.2 | What to open first, what is where, simplifications | all |
| `ASSET-RIGHTS.md` | text §7.3 | Rights line (same wording as W03) | |
| `CHANGELOG.md` | text §7.4 | Dated versions; date of the last AI capture | |
| `rohdaten_2025/Werk_Nord/Strom/*.md` (12) | gen | Ten genuine bills, the duplicate scan, the Talbrück bill | raw-folder, month-grid, whose-bill |
| `rohdaten_2025/Werk_Nord/Gas/Gas_Jahresrechnung_WN_2025.md` | gen | Gas bill, Hs basis on page 2 | anatomy, trace-two |
| `rohdaten_2025/Werk_Nord/Zaehlerstaende_2025.csv` | gen | Month-end meter readings (October source) | month-grid |
| `rohdaten_2025/Werk_Sued/Jahresuebersicht_2025_Oekostrom.md` | gen | "1.240 MWh", "Vorjahr: 1.250 MWh" | one-unit |
| `rohdaten_2025/Werk_Sued/HKN_Bestaetigung_2025.md` | gen | Guarantees of origin, Werk Süd only | two-scope-2 |
| `rohdaten_2025/Werk_Sued/Gas_Jahresrechnung_WS_2025.md` | gen | Gas bill, Hs on page 2 | trace-two |
| `rohdaten_2025/Lager_Ost/Nebenkosten_Strom_Q1..Q4_2025.md` (4) | gen | Landlord sub-meter statements | control |
| `rohdaten_2025/Flotte/Tankkarten_2025.csv` | gen | 738 transactions: Diesel, AdBlue, Waesche, Shop | anatomy |
| `vorjahr/THG_2024_Zusammenfassung.csv` | gen | Consultant's 2024 figures, grade B, boundary stated, 180 staff | what-drove-it |
| `faktoren/faktoren_lehrwerte.csv` | gen | Pinned teaching factors, F-GAS-HI first | six-rules |
| `belegtabelle/belegtabelle_2025_leer.csv` | gen | Ledger headers + worked row E-WN-03, half row E-WS-01, blank row E-WN-10 | the-ledger |
| `belegtabelle/abdeckung_standort_monat_leer.csv` | gen | Empty coverage grid | month-grid |
| `belegtabelle/grenzen_und_regeln.md` | text §7.5 | Boundary, six rules, restatement policy | six-rules |
| `prompts/00_run_protocol.md` | text §7.6 | How to run the two-condition comparison fairly | appendix A3 |
| `prompts/01_auslesen.md` | text §7.6 | Reader: extraction prompt | six-rules |
| `prompts/02_pruefen.md` | text §7.6 | Clerk: checking prompt | six-rules |
| `prompts/03_textentwurf.md` | text §7.6 | Writer: drafting prompt | what-drove-it |
| `prompts/04_ask-back.md` | text §7.6 | Target ask-back answer for the raw folder | ask-back |
| `vorlagen/datenanfrage_email.md` | text §7.7 | Three German data-request e-mails | limits |
| `vorlagen/transfer.md` | text §6 | Five-box transfer sheet | your-bill |
| `vorlagen/merkkarte.md` | text §5 | Field card | |
| `vorlagen/uebung_drei_zahlen.md` | text §7.8 | Trace-two worksheet | trace-two |
| `erwartet/belegtabelle_2025.csv` | gen | Expected ledger, 23 rows incl. excluded and instrument rows | the-ledger |
| `erwartet/abdeckung_standort_monat.csv` | gen | Expected grid | month-grid |
| `erwartet/abdeckung_wie_angeliefert.csv` | gen | Grid as the folder arrived | month-grid |
| `erwartet/kontrollsumme_strom_2025.csv` | gen | Control total | the-ledger |
| `erwartet/wasserfall.csv` | gen | Both waterfalls, Scope 1 + 2, fixed order | anatomy |
| `erwartet/zerlegung_2024_2025.csv` | gen | Drivers LB and MB | what-drove-it |
| `erwartet/ergebnisse_2025.md` | text §7.9 (numbers rendered from JSON) | Every answer with arithmetic and the rounding convention | appendix A1 |
| `erwartet/uebung_drei_zahlen_antworten.md` | text §7.8 | Trace-two answers and slips | trace-two |
| `aufzeichnungen/lauf_rohordner.md`, `aufzeichnungen/lauf_belegtabelle.md` | text §7.10 | Captured runs, or the constructed label and protocol | raw-answer, rematch |

CSV convention: semicolon-separated, UTF-8, decimal comma, ASCII minus. Normalised quantities have no thousands separator (`1240000`); `qty_source` keeps the printed text (`1.240`).

### 7.2 `START-HERE.md`

```markdown
# ESG kit · Workshop 04 · ESG Reporting with AI

1. Only want the take-home sheets? Open `vorlagen/transfer.md` and `vorlagen/merkkarte.md`.
2. Practice: open `rohdaten_2025/` and `belegtabelle/belegtabelle_2025_leer.csv`, fill the ledger, then compare with `erwartet/`.
3. The question: "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?"
4. Everything is invented. The factors in `faktoren/` are teaching values; never use them in a real report.
5. Do not put company data into any AI tool with this kit.

## What is where

| Folder | Contents |
|---|---|
| `rohdaten_2025/` | The raw folder the AI gets in the first run: 20 bills as text files and 2 CSV exports. German documents with German number format, as in real life. |
| `vorjahr/` | The consultant's 2024 summary (grade B, no bills). |
| `faktoren/` | The pinned factor table. Teaching values. |
| `belegtabelle/` | Empty ledger with one worked, one half-filled and one blank row; empty coverage grid; the six rules. |
| `prompts/` | 00 run protocol, 01 reader, 02 clerk, 03 writer, 04 the answer a good assistant gives on the raw folder. |
| `vorlagen/` | Transfer sheet, field card, the three-figure exercise, data-request e-mails. |
| `erwartet/` | Expected ledger, grids, control total, waterfalls, drivers, all answers with arithmetic. |
| `aufzeichnungen/` | Recorded AI runs with model and date, once captured. |

## How the files are written

- CSV files use semicolons and a decimal comma. Excel and LibreOffice in German open them directly.
- Bills are Markdown text laid out like a bill. A line `--- Seite 2 ---` marks the second page.
- `qty_source` in the ledger keeps the number exactly as printed ("1.240"). `qty_norm` is the converted value without separators ("1240000").

## Simplifications you should know about

- Real German electricity bills carry the supplier's mix disclosure (Stromkennzeichnung, § 42 EnWG). The kit's bills leave it out. In real life, check whether it qualifies as a supplier-specific rate before you use the residual mix.
- The residual mix is 0.60 in 2024 and 2025 on purpose. Real residual mixes change every year.
- The gas bills round the energy quantity to whole kWh, as real bills do. Page 2 shows the unrounded result.
- The raw-folder answer shown in the workshop is constructed from documented failure modes. See `aufzeichnungen/`.
- The data-request e-mails in `vorlagen/` use the formal Sie, as German business mail to utilities and suppliers does.
- The factor edition in the ledger (`Lehrwerte v1.0, 2026-01-15`) is the date in the case, when Kellbrunn pinned its factors. The kit itself was released on 2026-09-26.

## Which file answers which part of the workshop

| Workshop scene | Open |
|---|---|
| Twelve files, eleven months | `rohdaten_2025/Werk_Nord/Strom/`, `Zaehlerstaende_2025.csv`, `erwartet/abdeckung_wie_angeliefert.csv` |
| What does "1.240 MWh" mean? | `rohdaten_2025/Werk_Sued/Jahresuebersicht_2025_Oekostrom.md` |
| Whose bill is this? | `rohdaten_2025/Werk_Nord/Strom/Jahresrechnung_TB_2025.md` |
| Six errors, 48.7 tonnes apart | `erwartet/wasserfall.csv` |
| The ledger | `belegtabelle/belegtabelle_2025_leer.csv`, `erwartet/belegtabelle_2025.csv`, `erwartet/kontrollsumme_strom_2025.csv` |
| Trace three figures | `vorlagen/uebung_drei_zahlen.md`, answers in `erwartet/uebung_drei_zahlen_antworten.md` |
| What made the number go down? | `erwartet/zerlegung_2024_2025.csv` |

## Help

- The zip unpacked into a folder inside a folder: open the inner `esg-kit/`.
- Umlauts look broken in Excel: import the CSV as UTF-8 (Data > From Text/CSV).
```

### 7.3 `ASSET-RIGHTS.md`

```markdown
# Kit rights

Original course material by Tim Löhr, published by the owner on loehrning.ai. All rights reserved. All companies, bills, meter readings and quantities are invented. The emission factors are teaching values, not official factors. No third-party documents or databases are included. Public access is not a reuse license.
```

### 7.4 `CHANGELOG.md`

```markdown
# Changelog

## 1.0.0 · 2026-09-26
- First edition. Data version 1.0.0, teaching factors v1.0.
- Raw-folder answer: constructed from documented failure modes. No AI run recorded yet.

## (next) · <date of capture>
- Recorded runs: <model and version>, <tool>, 5 runs per condition. Table in `aufzeichnungen/`.
```

### 7.5 `belegtabelle/grenzen_und_regeln.md`

```markdown
# Boundary and rules · Kellbrunn Präzisionsteile GmbH · reporting year 2025

Written on 2026-01-15, before any AI run. Approved by: Head of Controlling.

## Boundary

- Approach: operational control (GHG Protocol Corporate Standard).
- In: Werk Nord (WN), Werk Süd (WS), Lager Ost (LO, leased, operated by Kellbrunn, own sub-meter), fleet (FL).
- Out: Talbrück Beschichtung GmbH (Kellbrunn holds 40 %, the partner operates it; contract and meter DE0005678900TB07 are Talbrück's). Keep its row with status `excluded`, reason `boundary`. Candidate for Scope 3 Category 15 later.
- 2024 used the same boundary (Talbrück excluded) and the same factor file.

## Six rules

The AI may propose rules; a spreadsheet applies them, and a person approves the list.

1. Boundary (clerk). Check `entity_on_document` against the list above. A name not on the list stops the sum until a person decides.
2. Coverage (clerk). Fill the site × month grid before summing. Unique key: invoice number + period + meter. Before comparing, normalise characters that OCR confuses (letter O to zero, letter l to one) and compare again with the fallback key period + meter + quantity. If a month is missing or doubled, stop and say which. A change of more than 25 % against the previous month is flagged for a person; never change the value.
3. Units (reader, then clerk). Keep value and unit exactly as printed, with the quoted line. Convert with this table only: MWh × 1,000 = kWh; gas stays in kWh with its basis (Hs or Hi); diesel stays in litres. Check kWh per employee per site against last year.
4. Factors (clerk). Use factor IDs from `faktoren/faktoren_lehrwerte.csv` for the reporting year. The gas factor basis must match the basis on the bill. Record the edition in `factor_edition`. A later update of a factor is recorded as a change, never applied silently. Never write a factor value from memory.
5. Scope 2 (clerk). Always report location-based and market-based. Market-based order: (1) certificates for the kWh they cover, (2) a supplier-specific rate that meets the Scope 2 quality criteria, (3) the residual mix for the rest. The kit's bills carry no supplier rate, so step 2 is empty here.
6. Citations (writer). Every number in a text names its row IDs. Rows with status `actual_meter` or `estimate` are named in the text. No claim words (climate-neutral, green, sustainable, efficiency) without a number, a scope and a row.

## Restatement policy

Recalculate 2024 when (a) the boundary changes (a site is bought or sold, a joint venture moves in or out), (b) an error above 5 % of the Scope 1 + 2 total is found in 2024, or (c) the factor source or calculation method changes by more than the same 5 %. The 5 % is our significance threshold (company choice); the GHG Protocol leaves the threshold to the company. Record the reason and the date. A grid factor that changes because the grid changed is not a reason to restate; it appears as a driver.

## Data-quality grades

A = bill or statement for the full period. B = meter reading or summary without bills. C = estimate with a stated method.
```

### 7.6 Prompt pack

`prompts/00_run_protocol.md`
```markdown
# Run protocol: the same question on two data states

Goal: show what the data state changes, with everything else held constant.

Hold constant, and write down:
- model name and version, tool (app with file upload and analysis, or an agent in a terminal), date
- the prompt text below, copied exactly
- `faktoren/faktoren_lehrwerte.csv` and `vorjahr/THG_2024_Zusammenfassung.csv`

Prompt for both conditions:
"What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024? Use the attached files."

Condition A: attach everything in `rohdaten_2025/` plus the two files above.
Condition B: attach `erwartet/belegtabelle_2025.csv`, `erwartet/abdeckung_standort_monat.csv`, `belegtabelle/grenzen_und_regeln.md` plus the two files above.
Optional condition C: condition A without the factor file (shows factors from memory).

Run each condition 5 times in fresh conversations. For each run record in `aufzeichnungen/`:
Scope 1 · Scope 2 location-based · Scope 2 market-based · change vs 2024 · caught: duplicate March, missing October, Talbrück, 1.240 MWh, Hs basis, AdBlue (yes/no each) · market-based method used · August flagged without changing it · asked about other Scope 1 sources.

Report what happened, run by run. Say "caught the duplicate in 3 of 5 runs"; never "AI fails".
Use only the invented kit files. No company data.
```

`prompts/01_auslesen.md` (reader)
```markdown
# Reader: extract rows, change nothing

You read energy documents and return rows. You do not add, estimate, convert or correct.

For each quantity on each document return one row as CSV (semicolon) with these columns:
source_file; source_page; source_quote; entity_on_document; invoice_no; meter_id; period_start; period_end; qty_as_printed; unit_as_printed; basis_as_printed; carrier

Rules:
- source_quote is the exact line you read, copied character for character.
- qty_as_printed keeps the number as printed, including German format ("1.240").
- invoice_no is copied exactly as printed. If a character looks like an OCR error (a letter O among digits, for example), copy it as printed and add a note "possible OCR character". Do not fix it.
- basis_as_printed: if the document states Brennwert (Hs) or Heizwert (Hi) anywhere, including later pages, write it and the page.
- A euro amount is never a quantity. "Abschlag" lines are advance payments.
- If a field is not on the document, write NOT_ON_DOCUMENT. Never guess.
- One document can give several rows. A document with no quantity gives one row with a note.

After the table, list every document you could not read and why.
```

`prompts/02_pruefen.md` (clerk)
```markdown
# Clerk: check the rows against the rules, fix nothing

You check an extracted table against `grenzen_und_regeln.md`. You do not change any row and you do not add anything up.

Return a list of flags. Each flag names the row IDs and the rule it breaks.
1. Coverage: build the site × month grid. Name every month that is missing, doubled or part of a multi-month bill.
2. Duplicates: normalise invoice numbers first (letter O to zero, letter l to one, remove spaces). Flag rows with the same normalised invoice number, period and meter. Then flag rows with the same period, meter and quantity, even if the invoice numbers differ.
3. Units: every unit other than kWh or l, and every number in German format. State the reading you propose and the rule.
4. Boundary: every entity_on_document that is not on the boundary list.
5. Basis: every gas row with its basis (Hs or Hi) and the matching factor ID. A gas row without a basis is a flag.
6. Plausibility: kWh per employee per site against last year; month-to-month changes above 25 %. Suggest a question for a person. Never change the value.
7. Products: every fuel-card product that is not a fuel (AdBlue, washes, shop).

End with "Ready to sum: yes" or "Ready to sum: no", and if no, the decisions a person has to make.
```

`prompts/03_textentwurf.md` (writer)
```markdown
# Writer: draft sentences from the approved ledger only

You draft sentences for a report or a customer questionnaire. You may use only the approved ledger and `erwartet/zerlegung_2024_2025.csv`.

- Every sentence with a number ends with the row IDs or driver line it uses, in square brackets.
- Report Scope 2 location-based and market-based together.
- When you explain a change, use only the driver lines, and name the part that is not the company's own action (grid factor, certificates).
- Name every row with status actual_meter or estimate in the text.
- Do not use: climate-neutral, CO2-neutral, green, eco-friendly, sustainable, "100 %", efficiency (unless production data are in the ledger).
- If a sentence needs a fact that is not in the ledger, write it as a question for a person.
- End with a list "Not checked" of sources the ledger does not cover.
```

`prompts/04_ask-back.md` (target answer, constructed)
```markdown
# What a good assistant says on the raw folder

Target answer, constructed. Not a recorded run. Use it to judge a real run.

"I can give a provisional figure, but these points need your decision first:
1. October is missing for Werk Nord. The meter file shows 200,000 kWh for 30.09. to 31.10.2025. Should I use it (grade B)?
2. Two files carry invoice 4711-03 for March. I counted March once.
3. One bill is addressed to Talbrück Beschichtung GmbH, with its own meter. Is it inside your boundary? I left it out.
4. Werk Süd reports '1.240 MWh'. I read this as 1,240,000 kWh; the prior-year value on the same page, 1.250 MWh, fits.
5. Both gas bills state Brennwert (Hs) on page 2. I used F-GAS-HS.
6. August is almost a third below July (−31 %). Plant holiday? I did not change it.
7. The folder has no refrigerant service invoices, no forklift fuel and no generator. Are there other Scope 1 sources?
With these assumptions: Scope 1 = 471.2 t; Scope 2 location-based = 1,444.0 t; market-based = 1,422.0 t; Scope 1 + 2 = 1,915.2 t location-based (−5.1 % against 2024) and 1,893.2 t market-based (−29.2 %). Each figure traces to rows in the attached list."
```
(All numbers in 04 are rendered from `s1_2025`, `s2lb_2025`, `s2mb_2025`, `total_lb_2025`, `chg_lb_pct`, `total_mb_2025`, `chg_mb_pct`, `oct_kwh`, `aug_vs_jul_pct`.)

### 7.7 `vorlagen/datenanfrage_email.md`

```markdown
# Data-request e-mails (German, three variants)

Placeholders in square brackets. Example addresses only @example.com. The e-mails use Sie on purpose: they go to external utilities and suppliers, not to the learner. If the kit is ever brought into content-lint scope, add this file to the placeholder allowlist (`[Name]`, `[Datum]`).

## 1 · To the utility: missing invoice

Betreff: Rechnung Oktober 2025, Zählpunkt [DE0005678900WN01], Kundennummer [55-0192]

Guten Tag,

für unsere Energie- und Emissionsbilanz 2025 fehlt uns die Stromrechnung für den Zeitraum 01.10.2025 bis 31.10.2025 (Rechnungsnummer vermutlich [4711-10]).
Unsere eigenen Zählerstände: 30.09.2025: 4.812.300 kWh; 31.10.2025: 5.012.300 kWh. Wir verwenden sie, bis die Rechnung da ist.
Bitte schicken Sie uns die Rechnung oder eine Verbrauchsübersicht mit Zeitraum, Menge in kWh und Zählpunkt bis zum [Datum]. Eine Text- oder CSV-Datei genügt.
Falls die Abrechnung mit einem anderen Zeitraum zusammengefasst wurde, nennen Sie uns bitte die genauen Daten.

Vielen Dank und freundliche Grüße
[Name], [Funktion], Kellbrunn Präzisionsteile GmbH, [name]@example.com

## 2 · To a landlord or joint-venture partner: sub-meter and contract party

Betreff: Stromverbrauch 2025, Unterzähler [LO-UZ-03]

Guten Tag,

für unsere Bilanz 2025 brauchen wir je Quartal die Menge in kWh für den Unterzähler [LO-UZ-03], den Zeitraum und den Namen der Gesellschaft, auf die der Liefervertrag läuft.
Bitte teilen Sie uns außerdem die Stromkennzeichnung Ihres Lieferanten mit und ob für diese Menge Herkunftsnachweise entwertet wurden (Menge, Erzeugungsjahr).

Vielen Dank und freundliche Grüße
[Name], [name]@example.com

## 3 · To the certificate supplier: which delivery points

Betreff: Herkunftsnachweise 2025, Bestätigung für [Kellbrunn Präzisionsteile GmbH]

Guten Tag,

Ihre Bestätigung nennt Herkunftsnachweise über [1.240] MWh, Erzeugungsjahr [2025]. Für unsere Bilanz brauchen wir:
1. die Lieferstellen und Zählpunkte, für die die Nachweise entwertet wurden,
2. das Entwertungsdatum und das Register,
3. ob weitere Lieferstellen von Kellbrunn abgedeckt sind.

Vielen Dank und freundliche Grüße
[Name], [name]@example.com
```

### 7.8 Trace-two worksheet and answers

`vorlagen/uebung_drei_zahlen.md`
```markdown
# Trace three figures to paper

Work in pairs, on paper, no tools. 4 minutes. For each figure write: rows, file, quoted line, factor ID, arithmetic.

## 1 · Worked: Werk Süd, location-based, 496.0 t
Rows: E-WS-01 · File: rohdaten_2025/Werk_Sued/Jahresuebersicht_2025_Oekostrom.md · Line: "Verbrauch 2025: 1.240 MWh" · Factor: F-EL-LB-2025 (0.40)
Arithmetic: 1,240 MWh × 1,000 = 1,240,000 kWh; × 0.40 kg/kWh = 496,000 kg = 496.0 t

## 2 · Half done: Scope 1 gas, 376.2 t
Rows: G-WN-01 and ______ · Files: Gas_Jahresrechnung_WN_2025.md and ______ · Line: "Energiemenge 1.850.000 kWh" and ______ · Factor: ______ (basis: ______, page ___)
Arithmetic: ______

## 3 · Alone: grid factor bar, −72.2 t
Rows: ______ · Factors: ______ and ______
Arithmetic: ______
```

`erwartet/uebung_drei_zahlen_antworten.md`
```markdown
# Answers: trace three figures

2 · G-WN-01 and G-WS-01; Gas_Jahresrechnung_WN_2025.md and Gas_Jahresrechnung_WS_2025.md; "Energiemenge 1.850.000 kWh" and "Energiemenge 240.000 kWh"; F-GAS-HS, basis Hs, page 2.
(1,850,000 + 240,000) kWh(Hs) × 0.18 = 376.2 t.
If you got 418.0 t: you used 0.20, the Hi factor, on Hs kWh. Page 2 of both bills says Brennwert (Hs).
If you got 376.6 t: you converted to Hi first (2,090,000 / 1.11 = 1,882,883 kWh(Hi) × 0.20). That route is also right; the 0.4 t difference is the rounding of the teaching value 0.18.

3 · E-WN-01 to E-WN-11, E-WS-01, E-LO-Q1 to E-LO-Q4 (all electricity rows in the boundary); F-EL-LB-2025 and F-EL-LB-2024.
3,610,000 kWh × (0.40 − 0.42) = −72,200 kg = −72.2 t.
If you got −73.0 t: you used 2024 consumption (3,650,000 kWh). The factor effect uses 2025 consumption; the consumption effect uses the 2024 factor.
```
(Numbers from `traceTwo`, `ws_lb_2025`, `s1_gas_2025`, `wrong_s1_gas`, `gas_hi_route_t`, `gas_hi_route_diff_t`, `drv_lb_grid_t`, `trace_slip_grid_t`.)

### 7.9 `erwartet/ergebnisse_2025.md`

Generated from JSON with this structure and wording (EN, numbers rendered):

```markdown
# Expected results 2025 · Kellbrunn Präzisionsteile GmbH (fictional)

Teaching values, not official factors. Rounding: totals are computed from unrounded values and rounded once to 0.1 t (half up); 1,350.496 t is shown as 1,350.5 t and 495.504 t as 495.5 t. Waterfall bars are rounded to 0.1 t and still sum to the end total.

## Electricity in the boundary
Werk Nord 2,260,000 kWh (10 bills 2,060,000 + October from meter readings 200,000) · Werk Süd 1,240,000 kWh · Lager Ost 110,000 kWh · total 3,610,000 kWh (2024: 3,650,000; −1.1 %).
Control total: documents 4,615,000 − excluded 1,205,000 (duplicate 205,000, Talbrück 1,000,000) + October 200,000 = 3,610,000 kWh.

## Scope 2
Location-based: 3,610,000 × 0.40 = 1,444.0 t.
Market-based: Werk Süd 1,240,000 × 0.00 (guarantees of origin I-WS-GO) + 2,370,000 × 0.60 (residual mix) = 1,422.0 t.
Bridge: 1,444.0 − 496.0 (certificate) + 474.0 (residual mix instead of grid average on 2,370,000 kWh) = 1,422.0 t.

## Scope 1
Gas (1,850,000 + 240,000) kWh(Hs) × 0.18 = 376.2 t (WN 333.0, WS 43.2) · Diesel 38,000 l × 2.50 = 95.0 t · Scope 1 = 471.2 t.
Converting to Hi first gives 376.6 t (2,090,000 / 1.11 × 0.20); the 0.4 t difference is the rounding of the teaching value 0.18 (0.20 / 1.11 = 0.1802).

## Totals and change
2025: 1,915.2 t location-based · 1,893.2 t market-based.
2024: 2,017.5 t · 2,674.5 t (180 staff in both years).
Change: −102.3 t (−5.1 %) location-based · −781.3 t (−29.2 %) market-based · Scope 1 −2.7 %.

## Drivers
Location-based: grid factor −72.2 (71 %) · less electricity −16.8 · less gas −10.8 · less diesel −2.5 · own use −30.1 t.
Market-based: guarantees of origin −744.0 (95 %) · less electricity −24.0 · less gas and diesel −13.3 · own use −37.3 t.
Convention: consumption effects at the 2024 factor, factor effect on 2025 consumption. Residual mix held at 0.60 in both years on purpose.

## Secondary
Renewable share of electricity 34.3 % · energy on the net (Hi) basis 5,872.9 MWh (electricity 3,610, gas 1,882.9, diesel 380) · renewable share of energy 21.1 % · 10.6 t per employee (2024: 11.2 t).

## The constructed raw-folder answer
1,866.5 t location-based (−7.5 %), 1,866.0 t "market-based". Gap to the right answer 48.7 t (2.5 % of the total); the change against 2024 is 2.4 percentage points off (−7.5 % against −5.1 %). Waterfall in `wasserfall.csv`.
```

### 7.10 `aufzeichnungen/`

`lauf_rohordner.md` and `lauf_belegtabelle.md`, until capture:
```markdown
# Run record · condition A (raw folder)

Status: not recorded yet.
The answer shown in the workshop is constructed from documented failure modes: it shows what the answer looks like when all six traps fire.
Protocol: prompts/00_run_protocol.md. Results will be listed here with model, version, tool, date and one line per run.
```

---

## 8. Web registry copy (`src/lib/workshops-esg-reporting.ts`)

Follows the `Workshop` interface in `packages/website/src/lib/workshops.ts` and the W03 entry in `workshops-data-readiness.ts`. Registry needs: add `"04"` fixtures where tests list numbers (`workshops.test.ts` numbers array and the index-based `formats` array get a 4th entry), append after W03, add the slug to `ANALYTICS_WORKSHOP_SLUGS` and `/workshops/esg-berichte-mit-ki` to content parity. All materials are `language: "en"`; the German bills inside the kit are stated in `accessNote`.

Counted after verification round 2: DE summary 148 characters, EN summary 153 characters (both ≤ 160). Agenda minutes are the deck's act minutes (4.0 / 7.5 / 16.0 / 16.5 / 15.5 / 7.0 / 10.0) rounded half to even (4 / 8 / 16 / 16 / 16 / 7 / 10 = 77), plus 13 minutes of questions = 90.

### 8.1 German (`de`)

```ts
slug: "esg-berichte-mit-ki",
number: "04",
topic: "ESG-Berichte",
title: "ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen",
eyebrow: "Workshop 04 · ESG-Berichte",
summary: "Dieselbe Scope-1-und-2-Frage geht an einen Rechnungsordner und an eine Belegtabelle. Du findest sechs Fehler in einer Summe, die plausibel aussieht.",
description: "Die erfundene Kellbrunn Präzisionsteile GmbH (180 Beschäftigte, drei Standorte) will wissen, wie hoch ihre Scope-1- und Scope-2-Emissionen 2025 waren und ob sie gegenüber 2024 gesunken sind. Auf einen Ordner mit 22 Rechnungen und Exporten antwortet die KI mit 1.866,5 t CO₂e, 7,5 % weniger als im Vorjahr. Diese Antwort ist aus dokumentierten Fehlerarten konstruiert. Die Summe liegt nur 2,5 % neben der richtigen Zahl, obwohl sechs Fehler darin stecken: eine doppelte Märzrechnung, ein fehlender Oktober, die Rechnung eines Gemeinschaftsunternehmens, „1.240 MWh“ als 1.240 kWh gelesen, ein Gasfaktor auf der falschen Basis und AdBlue als Diesel gezählt. Mit einer Belegtabelle, sechs Regeln und festen Faktoren lautet die Antwort auf dieselbe Frage 1.915,2 t standortbasiert (−5,1 %) und 1.893,2 t marktbasiert (−29,2 %). Vom standortbasierten Rückgang kommen 72,2 t vom niedrigeren Netzfaktor und 30,1 t aus geringerem eigenem Verbrauch; vom marktbasierten kommen 744,0 t aus Herkunftsnachweisen für einen Standort. Alle Zahlen sind erfunden, die Faktoren sind Lehrwerte.",
format: "Live-Workshop mit Deck",
duration: "~90 Minuten",
accessNote: "Für Deck, Lernbegleiter und Demo brauchst du nur einen Browser; das Material ist auf Englisch, die Rechnungen im Kit sind deutsche Belege. Die gezeigte KI-Antwort auf den Rohordner ist aus dokumentierten Fehlerarten konstruiert und keine Live-Abfrage.",
outcome: "Fünf-Felder-Blatt für eine eigene Rechnung",
audience: [
  "Nachhaltigkeits-, Finanz- und Controlling-Teams im Mittelstand, die Scope 1 und 2 an Bank oder Kunden liefern",
  "Betriebs- und Energieverantwortliche, bei denen die Rechnungen liegen",
  "Moderatorinnen und Moderatoren, die den Fall mit einer Gruppe durchgehen wollen",
],
notForYou: "Eher nicht für dich, wenn du eine vollständige Treibhausgasbilanz mit Scope 3 oder eine Einführung in CSRD und ESRS suchst.",
question: "Wie hoch waren unsere Scope-1- und Scope-2-Emissionen 2025, und sind sie gegenüber 2024 gesunken?",
outcomes: [
  "Du baust für einen Standort eine Monatstabelle und findest doppelte, fehlende und zweimonatige Rechnungen, bevor jemand summiert.",
  "Du schreibst eine Zeile einer Belegtabelle mit zitierter Quelle, Zeitraum, Wert und Einheit wie gedruckt, Gesellschaft, Bilanzgrenze und Faktor mit Jahr.",
  "Du rechnest Scope 2 standortbasiert und marktbasiert aus und nennst, für welche Kilowattstunden ein Herkunftsnachweis gilt.",
  "Du zerlegst die Veränderung zum Vorjahr in Netzfaktor, Herkunftsnachweise und eigenen Verbrauch und schreibst einen Satz, der jede Zahl belegt.",
],
agenda: [
  { label: "Die Frage und der Fall", minutes: 4, activity: "listen", description: "Du lernst Kellbrunn und die eine Frage kennen, die bis zum Schluss gleich bleibt." },
  { label: "Die falsche Antwort", minutes: 8, activity: "vote", description: "Die KI meldet aus 22 Belegen 1.866,5 t, 7,5 % weniger als 2024, und du stimmst ab, ob du das an die Bank schickst." },
  { label: "Warum sie falsch ist", minutes: 16, activity: "vote", description: "Du prüfst Monate, Einheit und Bilanzgrenze in drei Abstimmungen und siehst, wie sich sechs Fehler bis auf 48,7 t aufheben." },
  { label: "Die Reparatur", minutes: 16, activity: "do", description: "Du füllst mit der Gruppe Zeilen einer Belegtabelle, entscheidest, woher der Netzfaktor kommt, und rechnest beide Scope-2-Zahlen." },
  { label: "Noch einmal fragen und nachrechnen", minutes: 16, activity: "do", description: "Du verfolgst zu zweit drei Zahlen bis zum Beleg und zerlegst den Rückgang in Netzfaktor, Nachweise und eigenen Verbrauch." },
  { label: "Grenzen", minutes: 7, activity: "do", description: "Du sortierst fünf Aufträge an die KI in „rechnen“, „nachfragen“ und „ablehnen oder umschreiben“, darunter „Schreib, dass wir klimaneutral sind“." },
  { label: "Dein Fall", minutes: 10, activity: "write", description: "Du füllst fünf Felder für eine erfundene oder anonymisierte eigene Rechnung und stimmst noch einmal über die Antwort vom Anfang ab." },
  { label: "Fragen", minutes: 13, mode: "live", activity: "listen", description: "Fragen aus der Gruppe; der Anhang des Decks hat Folien dafür." },
],
agendaSource: "deck",
minutesLive: 90,
minutesSelfStudy: 60,
needs: [
  "Ein Browser, für das Deck am besten ein großer Bildschirm im Querformat",
  "Papier und Stift für die fünf Felder und die Übung mit drei Zahlen",
  "Ein Taschenrechner oder das Handy",
  "Optional ein KI-Konto für den 20-Minuten-Versuch im Lernbegleiter",
],
notNeeded: [
  "Programmierkenntnisse",
  "Vorwissen zur Treibhausgasbilanz über die Begriffe Scope 1 und Scope 2 hinaus",
  "Ein KI-Konto für Deck, Demo und Übungen",
  "Eigene Firmendaten, denn Kellbrunn ist erfunden",
],
notCovered: [
  "Rechtsberatung und eine Prüfung durch Wirtschaftsprüfer",
  "Eine Einführung in CSRD, ESRS oder VSME",
  "Eine vollständige Scope-3-Bilanz; ein Stahl-Beispiel steht im Anhang des Decks",
  "Amtliche Emissionsfaktoren; der Workshop rechnet mit Lehrwerten",
],
provenance: {
  author: "Tim Löhr",
  reviewedAt: "2026-09-26",
  data: "synthetic",
  note: "Kellbrunn, alle Belege und alle Mengen sind erfunden, die Faktoren sind Lehrwerte. Die KI-Antwort auf den Rohordner ist konstruiert; aufgezeichnete Läufe werden mit Datum und Modell nachgetragen.",
},
decisionLab: {
  kicker: "Entscheidung 01 · Rohdaten",
  title: "1.866,5 Tonnen, 7,5 % weniger als 2024. Weiterschicken?",
  prompt: "Die KI hat alle Rechnungen im Ordner gelesen und meldet für 2025 Scope 1 und 2 von 1.866,5 t CO₂e, 7,5 % unter dem Vorjahr. Die Bank wartet auf die Zahl. Was tust du?",
  facts: ["KI-Antwort 2025: 1.866,5 t CO₂e", "Vorjahr 2024: 2.017,5 t CO₂e", "Ordner Werk Nord: 12 Stromrechnungen"],
  decisionLegend: "Deine erste Entscheidung",
  evidenceLegend: "Der stärkste Beleg",
  choices: [
    { id: "check-coverage", label: "Erst je Standort eine Monatstabelle bauen und jede Rechnung einmal zählen, dann rechnen." },
    { id: "send-total", label: "Die Zahl schicken, weil sie nah am Vorjahr liegt und die KI ihre Summen zeigt." },
    { id: "ask-again", label: "Die KI bitten, noch einmal genauer zu rechnen, und die zweite Zahl schicken." },
  ],
  evidence: [
    { id: "files-not-months", label: "Zwölf Dateien zeigen nicht, dass zwölf Monate abgedeckt sind. Eine Rechnung kann doppelt sein, eine zwei Monate umfassen, eine einer anderen Firma gehören." },
    { id: "close-to-last-year", label: "Die Zahl liegt nur 7,5 % unter dem Vorjahr, das ist ein normales Jahr." },
    { id: "shown-sums", label: "Die KI hat jede Summe Schritt für Schritt gezeigt." },
  ],
  recommendedChoiceId: "check-coverage",
  strongestEvidenceId: "files-not-months",
  submitLabel: "Entscheidung prüfen",
  resetLabel: "Neu entscheiden",
  privacyNote: "Läuft nur auf dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.",
  resultLabel: "Auswertung der Entscheidung",
  feedback: {
    aligned: { title: "Zwölf Rechnungen, elf Monate.", body: "Im Ordner steckt der März doppelt, der Oktober fehlt, und eine Rechnung gehört einem Gemeinschaftsunternehmen. Die Monatstabelle zeigt das, bevor jemand summiert. Richtig sind 1.915,2 t standortbasiert." },
    decisionOnly: { title: "Richtiger Schritt, schwacher Grund.", body: "Eine Zahl nah am Vorjahr und gezeigte Summen belegen nicht, dass jede Rechnung einmal zählt. Der Beleg ist die Monatstabelle: 12 Dateien decken hier 11 Monate ab." },
    evidenceOnly: { title: "Dein Beleg spricht gegen deine Entscheidung.", body: "Wenn zwölf Dateien keine zwölf Monate belegen, darf die Summe so nicht raus. Erst die Monatstabelle, dann die Zahl." },
    unsupported: { title: "Plausibel ist noch nicht geprüft.", body: "Sechs Fehler heben sich hier fast auf: Die Summe liegt nur 48,7 t neben der richtigen. Der Vorjahresvergleich findet die doppelte Märzrechnung nicht." },
    byChoice: {
      "send-total": {
        evidenceOnly: { title: "Dein Beleg spricht gegen das Abschicken.", body: "Zwölf Dateien decken elf Monate ab, und eine Rechnung gehört einer anderen Firma. Die Summe stimmt nur zufällig fast. Richtig sind 1.915,2 t standortbasiert, und die Begründung der KI ist falsch." },
        unsupported: { title: "Nah am Vorjahr heißt nicht richtig.", body: "Die Summe liegt 48,7 t neben der richtigen, weil sich Fehler aufheben. Im nächsten Jahr können sich dieselben Fehler addieren statt aufheben." },
      },
      "ask-again": {
        evidenceOnly: { title: "Eine zweite Rechnung ändert den Ordner nicht.", body: "Die KI rechnet mit denselben Dateien noch einmal. Den fehlenden Oktober und die fremde Rechnung findest du mit der Monatstabelle." },
        unsupported: { title: "Genauer rechnen hilft hier nicht.", body: "Die Fehler stecken in den Belegen: doppelter März, fehlender Oktober, fremde Rechnung. Eine zweite Summe über denselben Ordner zählt sie wieder mit." },
      },
    },
  },
},
steps: [
  { n: "01", title: "Eine Frage stellen", description: "Kellbrunn will wissen, wie hoch Scope 1 und 2 im Jahr 2025 waren und ob sie gegenüber 2024 gesunken sind. Diese Frage bleibt im ganzen Workshop dieselbe.", tool: "Deck · Die Frage" },
  { n: "02", title: "Die plausible falsche Antwort prüfen", description: "Auf 22 Belege antwortet die KI mit 1.866,5 t, 7,5 % unter dem Vorjahr. Die Antwort ist konstruiert und zeigt, was passiert, wenn sechs Fehler zusammentreffen. Die Summe liegt trotzdem nur 48,7 t neben der richtigen Zahl.", tool: "Deck · Der Fehler" },
  { n: "03", title: "Belegtabelle und Regeln aufschreiben", description: "Du legst eine Zeile je Menge mit zitierter Quelle an, füllst eine Tabelle Standort mal Monat und hältst sechs Regeln und feste Faktoren schriftlich fest. Du rechnest beide Scope-2-Zahlen: 1.444,0 t standortbasiert und 1.422,0 t marktbasiert.", tool: "Deck · Die Reparatur" },
  { n: "04", title: "Drei Zahlen bis zum Beleg verfolgen", description: "Zu zweit verfolgst du drei Zahlen auf Papier bis zur Rechnung und zerlegst den Rückgang: 72,2 t kommen vom Netzfaktor, 30,1 t vom eigenen Verbrauch.", tool: "Übung · Noch einmal fragen" },
  { n: "05", title: "Rechnen, nachfragen, ablehnen", description: "Du sortierst fünf Aufträge an die KI und siehst, was die Zahlen nicht belegen, etwa Kältemittel ohne Wartungsrechnung. Keine Rechtsberatung.", tool: "Deck · Grenzen" },
  { n: "06", title: "Deine fünf Felder ausfüllen", description: "Du überträgst das Vorgehen auf eine erfundene oder anonymisierte eigene Rechnung: Quelle, Zeitraum, Einheit, Bilanzgrenze, Faktor. Neben jedem Feld steht das Beispiel aus Werk Süd.", tool: "Transferblatt" },
  { n: "07", title: "Optional: die Fallen selbst schalten", description: "In der interaktiven Demo schaltest du jede Falle einzeln ein, öffnest jede Rechnung und siehst die Zeile, die daraus in der Belegtabelle wird.", tool: "Interaktive Demo · etwa 10 Minuten" },
],
caseStudy: {
  companyName: "Kellbrunn Präzisionsteile GmbH",
  isFictional: true,
  location: "Erfundener Standort in Hessen",
  sector: "Metallteile für Autoindustrie und Maschinenbau (Stanzen, CNC-Fertigung)",
  period: "Geschäftsjahr 2025, Vergleich mit 2024",
  narrative: "Kellbrunn hat 180 Beschäftigte, zwei Werke und ein gemietetes Lager. Die Bank und ein Autohersteller fragen nach Scope 1 und 2 für 2025 und nach der Veränderung zum Vorjahr. Dieselbe Frage geht an einen Ordner mit 22 Belegen und an eine Belegtabelle mit sechs Regeln. Die Faktoren sind Lehrwerte.",
  metrics: [
    { label: "Beschäftigte", value: "180" },
    { label: "Belege 2025", value: "22" },
    { label: "Abstand der KI-Summe zur richtigen", value: "48,7 t" },
    { label: "Anteil des Netzfaktors am standortbasierten Rückgang", value: "71 %" },
  ],
  decisionQuestion: "Welche Prüfungen brauchst du, bevor du eine Emissionszahl aus einem Rechnungsordner an Bank oder Kunden schickst?",
  dataLimitations: [
    "Firma, Rechnungen und Mengen sind erfunden; die Emissionsfaktoren sind Lehrwerte und keine amtlichen Werte.",
    "Die Antwort der KI auf den Rohordner ist aus dokumentierten Fehlerarten konstruiert, bis aufgezeichnete Läufe mit Datum vorliegen.",
    "Die Zahlen für 2024 stammen aus einer Zusammenfassung ohne Einzelrechnungen, mit derselben Grenze und denselben Faktoren.",
    "Ohne Produktionsmengen lässt sich nicht sagen, ob der geringere Verbrauch aus Effizienz oder aus weniger Produktion kommt.",
  ],
},
materials: [
  { label: "Deck · 28 Szenen", href: `${base}/slides.html`, kind: "html", language: "en", role: "deck", phase: "during", minutes: 77, primary: true, description: "Etwa 77 Minuten Programm und 13 Minuten Fragen; die Demo ist optional (10 Min.). Pfeiltasten führen weiter, P öffnet die Moderationsansicht. Am besten auf einem großen Bildschirm im Querformat." },
  { label: "Moderationsansicht", href: `${base}/presenter.html`, kind: "html", language: "en", role: "presenter", phase: "during", optional: true, description: "Für die Person, die moderiert: Notizen, Abstimmungsfragen, Pflichtsätze und eine Uhr für die 77 Minuten. Die Ansicht verbindet sich mit dem Deck, sobald du dort P drückst." },
  { label: "Interaktive Demo · 10 Min.", href: `${base}/demo.html`, kind: "html", language: "en", role: "demo", phase: "during", minutes: 10, optional: true, description: "Schalte jede Falle einzeln ein, öffne jede Rechnung und sieh die Zeile, die daraus in der Belegtabelle wird." },
  { label: "ESG-Kit · .zip", href: `${base}/esg-kit.zip`, kind: "zip", language: "en", role: "kit", phase: "during", sizeLabel: "<gemessen, z. B. 60 KB>", description: "Alle Rechnungen als Text, Faktoren, leere und erwartete Belegtabelle, fünf Prompts und Vorlagen für Datenanfragen. Nur CSV- und Markdown-Dateien; START-HERE.md sagt, womit du anfängst." },
  { label: "Transferblatt", href: `${base}/transfer.html`, kind: "html", language: "en", role: "exercise", phase: "during", description: "Fünf Felder für eine eigene Rechnung, mit dem Beispiel aus Werk Süd daneben. Zum Ausdrucken." },
  { label: "Lernbegleiter", href: `${base}/guide.html`, kind: "html", language: "en", role: "guide", phase: "after", description: "Der Workshop zum Nachlesen, mit Fragen, deren Antwort du aufklappst, einer Wiederholung nach einer Woche und einem Glossar. Funktioniert auch auf dem Smartphone." },
  { label: "Merkkarte", href: `${base}/field-card.html`, kind: "html", language: "en", role: "card", phase: "after", description: "Sieben Prüfungen auf einer A4-Seite, bevor du einer ESG-Zahl traust." },
],
```

Note: `sizeLabel` must match `/^\d+(?:[.,]\d)? (?:KB|MB)$/`; fill with the measured zip size (DE "60 KB", decimal comma if needed) at build.

### 8.2 English (`en`)

```ts
slug: "esg-berichte-mit-ki",
number: "04",
topic: "ESG reporting",
title: "ESG Reporting with AI: From Raw Inputs to Clearer Insights",
eyebrow: "Workshop 04 · ESG reporting",
summary: "You ask an AI the same Scope 1 and 2 question twice, once with a folder of bills and once with a ledger, and find six errors in a total that looks right.",
description: "The invented company Kellbrunn Präzisionsteile GmbH (180 staff, three sites) wants to know its Scope 1 and 2 emissions for 2025 and whether they went down compared with 2024. From a folder of 22 bills and exports, the AI answers 1,866.5 t CO₂e, 7.5% below last year. This answer is constructed from documented failure modes. The total is only 2.5% from the right figure, although six errors are inside it: a duplicate March bill, a missing October, a joint venture's bill, \"1.240 MWh\" read as 1,240 kWh, a gas factor on the wrong basis and AdBlue counted as diesel. With a ledger, six rules and pinned factors, the answer to the same question is 1,915.2 t location-based (−5.1%) and 1,893.2 t market-based (−29.2%). Of the location-based decrease, 72.2 t comes from a lower grid factor and 30.1 t from lower own use; of the market-based decrease, 744.0 t comes from guarantees of origin for one site. All numbers are invented; the factors are teaching values.",
format: "Live workshop with deck",
duration: "~90 minutes",
accessNote: "The deck, learner guide and demo need only a browser; materials are in English and the bills in the kit are German documents. The AI answer on the raw folder is constructed from documented failure modes; it is not a live request.",
outcome: "Five-box sheet for one of your own bills",
audience: [
  "Sustainability, finance and controlling teams in mid-sized companies who send Scope 1 and 2 to a bank or customers",
  "Operations and energy managers who hold the bills",
  "Facilitators who want to take a group through the case",
],
notForYou: "Probably not for you if you are looking for a full greenhouse gas inventory including Scope 3, or a walk-through of CSRD and ESRS.",
question: "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?",
outcomes: [
  "Build a month grid for one site and spot duplicate, missing and two-month bills before anyone adds them up.",
  "Write one ledger row with the quoted source, period, value and unit as printed, legal entity, boundary and factor with its year.",
  "Work out Scope 2 location-based and market-based, and name the kilowatt hours a guarantee of origin covers.",
  "Split the change against last year into grid factor, certificates and own use, and write one sentence that cites every number.",
],
agenda: [
  { label: "The question and the case", minutes: 4, activity: "listen", description: "You meet Kellbrunn and the one question that stays the same to the end." },
  { label: "The wrong answer", minutes: 8, activity: "vote", description: "The AI reports 1,866.5 t from 22 documents, 7.5% below 2024, and you vote on whether it goes to the bank." },
  { label: "Why it is wrong", minutes: 16, activity: "vote", description: "You check months, unit and boundary in three votes and see how six errors cancel down to 48.7 t." },
  { label: "The fix", minutes: 16, activity: "do", description: "You fill ledger rows with the group, decide where the grid factor comes from and work out both Scope 2 numbers." },
  { label: "Ask again and trace it", minutes: 16, activity: "do", description: "In pairs you trace three figures to their bills and split the decrease into grid factor, certificates and own use." },
  { label: "Limits", minutes: 7, activity: "do", description: "You sort five requests to the AI into calculate, ask back, and refuse or rewrite, including \"Write that we are climate-neutral\"." },
  { label: "Your case", minutes: 10, activity: "write", description: "You fill five boxes for an invented or anonymised bill of your own and vote again on the opening answer." },
  { label: "Questions", minutes: 13, mode: "live", activity: "listen", description: "Questions from the group; the deck's appendix has slides for them." },
],
agendaSource: "deck",
minutesLive: 90,
minutesSelfStudy: 60,
needs: [
  "A browser, ideally a large landscape screen for the deck",
  "Paper and a pen for the five boxes and the three-figure exercise",
  "A calculator or a phone",
  "Optionally an AI account for the 20-minute try in the learner guide",
],
notNeeded: [
  "Programming skills",
  "Greenhouse gas accounting knowledge beyond the terms Scope 1 and Scope 2",
  "An AI account for the deck, demo and exercises",
  "Your own company data, because Kellbrunn is invented",
],
notCovered: [
  "Legal advice or an audit",
  "A walk-through of CSRD, ESRS or VSME",
  "A full Scope 3 inventory; one steel example is in the deck's appendix",
  "Official emission factors; the workshop uses teaching values",
],
provenance: {
  author: "Tim Löhr",
  reviewedAt: "2026-09-26",
  data: "synthetic",
  note: "Kellbrunn and all its documents and quantities are invented; the factors are teaching values. The AI answer on the raw folder is constructed; recorded runs will be added with date and model.",
},
decisionLab: {
  kicker: "Decision 01 · Raw data",
  title: "1,866.5 tonnes, 7.5% below 2024. Send it?",
  prompt: "The AI read every bill in the folder and reports Scope 1 and 2 of 1,866.5 t CO₂e for 2025, 7.5% below last year. The bank is waiting for the number. What do you do?",
  facts: ["AI answer 2025: 1,866.5 t CO₂e", "Last year 2024: 2,017.5 t CO₂e", "Werk Nord folder: 12 electricity bills"],
  decisionLegend: "Your first decision",
  evidenceLegend: "The strongest evidence",
  choices: [
    { id: "check-coverage", label: "Build a month grid per site and count each bill once, then calculate." },
    { id: "send-total", label: "Send it, because it is close to last year and the AI shows its sums." },
    { id: "ask-again", label: "Ask the AI to calculate more carefully and send the second number." },
  ],
  evidence: [
    { id: "files-not-months", label: "Twelve files do not show that twelve months are covered. A bill can be in twice, cover two months or belong to another company." },
    { id: "close-to-last-year", label: "The number is only 7.5% below last year, which is a normal year." },
    { id: "shown-sums", label: "The AI showed every sum step by step." },
  ],
  recommendedChoiceId: "check-coverage",
  strongestEvidenceId: "files-not-months",
  submitLabel: "Check decision",
  resetLabel: "Decide again",
  privacyNote: "Runs only on this page. Your selection and result are neither stored nor sent.",
  resultLabel: "Decision feedback",
  feedback: {
    aligned: { title: "Twelve bills, eleven months.", body: "March is in the folder twice, October is missing, and one bill belongs to a joint venture. A month grid shows this before anyone adds up. The right total is 1,915.2 t location-based." },
    decisionOnly: { title: "Right step, weak reason.", body: "A number close to last year and neatly shown sums do not prove each bill counts once. The evidence is the month grid: here 12 files cover 11 months." },
    evidenceOnly: { title: "Your evidence argues against your decision.", body: "If twelve files do not prove twelve months, the total cannot go out yet. Month grid first, then the number." },
    unsupported: { title: "Plausible is not the same as checked.", body: "Six errors almost cancel here: the total is only 48.7 t from the right one. Comparing with last year does not find the duplicate March bill." },
    byChoice: {
      "send-total": {
        evidenceOnly: { title: "Your evidence argues against sending.", body: "Twelve files cover eleven months, and one bill belongs to another company. The total is nearly right by accident. The right total is 1,915.2 t location-based, and the AI's explanation is wrong." },
        unsupported: { title: "Close to last year does not mean correct.", body: "The total is 48.7 t from the right one because errors cancel. Next year the same errors can add up instead of cancelling." },
      },
      "ask-again": {
        evidenceOnly: { title: "A second calculation does not change the folder.", body: "The AI calculates again from the same files. The month grid finds the missing October and the other company's bill." },
        unsupported: { title: "Calculating more carefully does not help here.", body: "The errors are in the documents: a doubled March, a missing October, another company's bill. A second sum over the same folder counts them again." },
      },
    },
  },
},
steps: [
  { n: "01", title: "Ask one question", description: "Kellbrunn wants its Scope 1 and 2 emissions for 2025 and whether they went down compared with 2024. The question stays the same for the whole workshop.", tool: "Deck · The question" },
  { n: "02", title: "Check the plausible wrong answer", description: "From 22 documents the AI answers 1,866.5 t, 7.5% below last year. The answer is constructed and shows what happens when six errors meet. The total is still only 48.7 t from the right figure.", tool: "Deck · The mistake" },
  { n: "03", title: "Write down a ledger and rules", description: "You write one row per quantity with a quoted source, fill a site-by-month grid, and write down six rules and a pinned factor table. You work out both Scope 2 numbers: 1,444.0 t location-based and 1,422.0 t market-based.", tool: "Deck · The fix" },
  { n: "04", title: "Trace three figures to the bill", description: "In pairs you trace three figures on paper to their bills and split the decrease: 72.2 t comes from the grid factor, 30.1 t from own use.", tool: "Exercise · Ask again" },
  { n: "05", title: "Calculate, ask back, refuse", description: "You sort five requests to the AI and see what the numbers do not support, such as refrigerants with no service invoice. Not legal advice.", tool: "Deck · Limits" },
  { n: "06", title: "Fill your five boxes", description: "You apply the method to an invented or anonymised bill of your own: source, period, unit, boundary, factor. The Werk Süd example is next to each box.", tool: "Transfer sheet" },
  { n: "07", title: "Optional: switch the traps yourself", description: "In the interactive demo you switch each trap on alone, open every bill and see the ledger row it becomes.", tool: "Interactive demo · about 10 minutes" },
],
caseStudy: {
  companyName: "Kellbrunn Präzisionsteile GmbH",
  isFictional: true,
  location: "Invented site in Hesse, Germany",
  sector: "Metal parts for automotive and machinery (stamping, CNC machining)",
  period: "Financial year 2025, compared with 2024",
  narrative: "Kellbrunn has 180 staff, two plants and a leased warehouse. The bank and a car maker ask for Scope 1 and 2 for 2025 and the change against last year. The same question goes to a folder of 22 documents and to a ledger with six rules. The factors are teaching values.",
  metrics: [
    { label: "Staff", value: "180" },
    { label: "Documents 2025", value: "22" },
    { label: "Gap between the AI total and the right total", value: "48.7 t" },
    { label: "Share of the location-based decrease from the grid factor", value: "71%" },
  ],
  decisionQuestion: "Which checks do you need before you send an emissions figure from a folder of bills to a bank or customer?",
  dataLimitations: [
    "Company, bills and quantities are invented; the emission factors are teaching values, not official ones.",
    "The AI answer on the raw folder is constructed from documented failure modes until recorded runs with a date exist.",
    "The 2024 figures come from a summary without individual bills, with the same boundary and the same factors.",
    "Without production volumes nobody can say whether lower use came from efficiency or from lower output.",
  ],
},
materials: [
  { label: "Deck · 28 scenes", …same href/kind/language/role/phase/minutes/primary…, description: "About 77 minutes of content and 13 minutes of questions; the demo is optional (10 min). Use the arrow keys; P opens the presenter view. Best on a large screen in landscape." },
  { label: "Presenter view", …, description: "For whoever presents: notes, room votes, must-say lines and a clock for the 77 minutes. The view pairs with the deck as soon as you press P there." },
  { label: "Interactive demo · 10 min", …, description: "Switch each trap on alone, open every bill and see the ledger row it becomes." },
  { label: "ESG kit · .zip", …, sizeLabel: "<measured, e.g. 60 KB>", description: "Every bill as text, factors, empty and expected ledgers, five prompts and data-request templates. CSV and Markdown only; START-HERE.md tells you where to begin." },
  { label: "Transfer sheet", …, description: "Five boxes for one of your own bills, with the Werk Süd example beside each. For printing." },
  { label: "Learner guide", …, description: "The workshop to read at your own pace, with reveal questions, a one-week recall and a glossary. Works on a phone too." },
  { label: "Field card", …, description: "Seven checks on one A4 page before you trust an ESG number." },
],
```

Copy checks the build agent must run: no U+2013/U+2014; `summary.length ≤ 160`; `accessNote.split(/(?<=\.)\s+/).length ≤ 2`; outcomes ≤ 25 words and free of the banned verbs; decision-lab JSON free of `localStorage|sessionStorage|cookie|upload`; material labels free of `(`, `)`, "English", "Englisch", "öffnen", "Open"; `content-lint` clean. "Demo" is used as a label exactly as W03 does ("Interaktive Demo").

---

## 9. Appendix scene A4: what is true on 26 September 2026

Scene `appendix-regulation`. Title: "What is true on 26 September 2026". Footer on the scene: "Rules as of 26 Sep 2026. Not legal advice. Check before you present: German CSRD transposition, German UWG amendment for Directive 2024/825, Green Claims Directive status, GHG Protocol timeline." Items marked **[UNVERIFIED]** or **[secondary]** can be removed without breaking the scene.

1. **Fewer companies must report.** Since Directive (EU) 2026/470 (Omnibus I) entered into force on 18 March 2026, the CSRD at EU level covers companies with more than 1,000 employees and more than €450m net turnover. Both conditions must be met. Member states must bring national law in line by 19 March 2027 (Germany has not finished transposing the CSRD at all, item 9). Kellbrunn (180 staff, €38m) has never been in scope. Source: Council press release, 24 Feb 2026; EUR-Lex 2026/470.
2. **The standards got shorter.** Revised ESRS were published on 21 September 2026 (Delegated Regulation (EU) 2026/1563); mandatory for financial years from 1 January 2027, optional for 2026. Source: Commission, 3 Jul 2026; OJ 21 Sep 2026.
3. **Customers can ask, within a cap.** Directive 2026/470 lets suppliers with up to 1,000 employees refuse requests from reporting customers that go beyond the voluntary standard based on the VSME (Delegated Regulation (EU) 2026/1560, published 21 September 2026). Member states must transpose the directive by 19 March 2027. The VSME Basic Module, on which the standard is based, includes Scope 1 and 2; whether DR 2026/1560 keeps the same GHG datapoints: check its text before the session (O8). Sources: EP press release, Dec 2025; EUR-Lex 2026/1560. Voluntary use from 24 September 2026 and Article 3 applying from FY2027: **[secondary]**.
4. **The EFRAG VSME (December 2024) Basic Module asks for Scope 1 and 2.** 11 disclosures, including energy and Scope 1 and 2 emissions; no double materiality assessment, no assurance required. Which Scope 2 methods B3 requires (location-based; market-based optional per some sources): check the EFRAG B3 text (O8). Source: EFRAG. EFRAG now calls the delegated standard "VS"; its content may differ from the December 2024 VSME.
5. **Scope 2 is reported twice.** The 2015 GHG Protocol Scope 2 Guidance requires a location-based and a market-based figure, and it still applies. GHG Protocol and ISO plan one joint corporate standard: consultation Q2 2027, publication Q4 2028. Hourly matching and deliverability were consultation proposals (20 Oct 2025 to 31 Jan 2026). Sources: Scope 2 Guidance; GHG Protocol update, 29 Jul 2026. Whether a stand-alone Scope 2 standard still appears in 2027: **[UNVERIFIED]**.
6. **Green-claim rules apply from 27 September 2026.** Directive (EU) 2024/825 bans, in commercial practices towards consumers, generic environmental claims such as "eco-friendly" unless recognised excellent environmental performance can be shown, and claims that a product has a neutral, reduced or positive climate impact based on offsetting. Whether a given text is aimed at consumers is a legal question for the company's lawyer, not for this workshop. Misleading claims are also banned towards business customers (in Germany § 5 UWG). Sources: EUR-Lex 2024/825; Commission FAQ. Germany implements it through an amendment to the UWG: **[secondary]** (Ebner Stolz, KPMG Law, Fieldfisher). Details of the German text, and the outcome of the transitional rule § 15b UWG-E (Bundestag vote scheduled for 24 Sep 2026): **[UNVERIFIED]**.
7. **The separate Green Claims Directive is stalled.** The Commission announced its intent to withdraw on 20 June 2025; the file is formally pending. Status in September 2026: **[UNVERIFIED]**.
8. **Assurance stays limited.** For companies that must report, the route to reasonable assurance was removed; the Commission must adopt a limited-assurance standard by 1 July 2027. Source: Accountancy Europe factsheet, 29 Jan 2026. Whether it has been consulted on: **[UNVERIFIED]**.
9. **Germany's CSRD law.** The CSRD-Umsetzungsgesetz had a Bundestag committee hearing on 13 April 2026. Final passage and promulgation: **[UNVERIFIED]**. Say "check the current status".

**Three things the workshop must not claim**
1. That Germany has, or has not, finished transposing the CSRD, or how the German UWG amendment reads in detail.
2. That AI output, or this ledger, is audit-ready or produces a compliant report.
3. That the teaching factors or any factor quoted from memory are official values, or that new Scope 2 rules already apply.

Also avoid on every slide: "CSRD was scrapped", "SMEs must use the VSME", "the threshold is 1,000 employees or €450m", "suppliers can refuse" without the transposition line, and any climate-neutral example built on offsets.

---

## 10. Sources

Regulation (read 2026-09-26 via `research/esg-regulation.md`):
- Directive (EU) 2026/470: https://eur-lex.europa.eu/eli/dir/2026/470/oj/eng
- Council press release, 24 Feb 2026: https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/
- European Parliament press release, Dec 2025 (value-chain cap): https://www.europarl.europa.eu/news/en/press-room/20251211IPR32164/simplified-sustainability-reporting-and-due-diligence-rules-for-businesses
- Delegated Regulation (EU) 2026/1560 (voluntary standard): https://eur-lex.europa.eu/eli/reg_del/2026/1560/oj/eng
- Revised ESRS, Commission, 3 Jul 2026: https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-reduce-administrative-burdens-eu-2026-07-03_en
- EFRAG VSME: https://www.efrag.org/en/news-and-calendar/news/efrag-releases-the-voluntary-sustainability-reporting-standard-for-nonlisted-smes
- Accountancy Europe, Omnibus explained (assurance), 29 Jan 2026: https://accountancyeurope.eu/wp-content/uploads/2026/01/260129-Omnibus-explained-CSRD-factsheet.pdf
- Directive (EU) 2024/825: https://eur-lex.europa.eu/eli/dir/2024/825/oj/eng
- Commission FAQ on 2024/825: https://commission.europa.eu/document/download/3c257883-bb2a-4dd9-a6dc-501d587bb34f_en?filename=faq-empowerting-consumers-gtd.pdf
- German UWG transposition (secondary): https://www.ebnerstolz.de/de/unser-angebot/leistungen/rechtsberatung/wirtschaftsrecht-commercial/umsetzung-empco-richtlinie-99600.html ; https://kpmg-law.de/die-empco-tritt-in-kraft-antworten-auf-die-wichtigsten-praxisfragen/
- Green Claims Directive status: https://www.europarl.europa.eu/legislative-train/theme-a-european-green-deal/file-substantiating-green-claims
- CSRD-Umsetzungsgesetz status (secondary): https://blogs.pwc.de/de/accounting-and-reporting/article/254119/aktuelle-entwicklungen-zur-umsetzung-der-csrd-in-deutsches-recht/

Carbon accounting:
- GHG Protocol Corporate Standard: https://ghgprotocol.org/corporate-standard
- Scope 2 Guidance (2015): https://ghgprotocol.org/sites/default/files/2023-03/Scope%202%20Guidance.pdf
- GHG Protocol standard development update, 29 Jul 2026: https://ghgprotocol.org/blog/ghg-protocol-announces-key-standard-development-updates
- Scope 2 consultation: https://ghgprotocol.org/blog/release-ghg-protocol-opens-public-consultations-scope-2-and-electricity-sector-consequential

Factors (real-world anchors only; no real value is used in any calculation):
- UBA grid factor 2024: https://www.umweltbundesamt.de/themen/co2-emissionen-pro-kilowattstunde-strom-2024
- AIB European residual mix 2024: https://www.aib-net.org/facts/european-residual-mix/2024 ; 2025 results (26 May 2026): https://www.aib-net.org/sites/default/files/assets/eecs/Residual%20Mix/AIB_2025_Residual_Mix_Final%20Results_%2026052026.pdf
- ecoinvent licences: https://ecoinvent.org/licenses/ ; IEA emissions factors (licensed): https://www.iea.org/data-and-statistics/data-product/emissions-factors-2025
- Gas Hs/Hi and m³ to kWh: https://www.entega.de/ratgeber/gas/gasverbrauch/heizwert-gas/

AI extraction accuracy:
- ESGReveal (GPT-4 76.9% extraction): https://arxiv.org/abs/2312.17264
- ESG Insight (DeepSeek 78.2%): https://link.springer.com/article/10.1007/s13042-026-03146-w
- MMESGBench: https://arxiv.org/html/2507.18932v2

Background knowledge, to verify before quoting on a slide (not used on any slide as written): § 42 EnWG requires the Stromkennzeichnung on bills; DVGW G 685 governs gas billing by Brennwert; the original CSRD large-company test (two of three criteria including more than 250 employees).

Name checks (web search, 2026-09-26, no company found): "Kellbrunn" GmbH; "Talbrück" Beschichtung; "Lindmark Energie". Handelsregister and DPMA checks still open (O2).

Repository inputs: `research/esg-ai-practice.md`, `research/esg-regulation.md`, `research/workshop-standard.md`, `research/map-deck-engine.md`, `research/design-direction.md`, `research/map-workshop-touchpoints.md`, `research/slop-language.md` §3, `w04/concept-A-controlled.md`, `concept-B-waterfall.md`, `concept-C-insight.md`, `packages/website/src/lib/workshops.ts`, `workshops-data-readiness.ts`, `workshops.test.ts`.

---

## 11. Open items before publication

| # | Item | Owner |
|---|---|---|
| O1 | Capture both conditions (kit `prompts/00_run_protocol.md`), fill `runs.table`, apply §1.7 | author |
| O2 | Handelsregister and DPMA checks for Kellbrunn Präzisionsteile GmbH, Talbrück Beschichtung GmbH, Lindmark Energie GmbH, Grundstücksverwaltung Lager Ost GbR, Bandstahl Wendelin GmbH; record date and result in `PUBLICATION.md` | author |
| O3 | Test run with three people who are not the author; replace planned minutes with the measured median and set `minutesSelfStudy` | author |
| O4 | Measure the zip and set `sizeLabel` in both locales | build |
| O5 | Re-check every [UNVERIFIED] and [secondary] item in §9 on the day before the first live session, including § 15b UWG-E (transitional rule, vote scheduled 24 Sep 2026), the German CSRD law, and the UBA grid factors quoted in A2 (UBA revises earlier years) | presenter |
| O8 | Read EFRAG VSME B3 (Scope 2 methods required) and DR 2026/1560 (GHG datapoints) in the original text before the scene-13 note and §9 items 3 and 4 go live | author |
| O6 | Registry plumbing: `formats` fixture 4th entry, numbers fixture `"04"`, analytics slug, content parity, `ASSET_MANIFEST.json` rows for `card-preview.webp` and `esg-kit.zip`, e2e shard budget | build |
| O7 | `PUBLICATION.md` for the folder: synthetic data, constructed answer, capture status, name checks, fonts | build |

---

## 12. Verification log

Round 2, 2026-09-26. `data/build_dataset.py` was changed first and re-run; `verify/recompute.py` (independent recomputation from the kit files) reports 0 problems, `verify/spec_refs.py` finds every `{key}` in the JSON with a matching literal, and the SPEC has no U+2013 or U+2014. The SPEC edits were applied by `verify/apply_round2.py` (every replacement matched exactly once). All 63 issues (13 numbers, 15 facts, 35 voice) were checked; none was rejected outright. Two were applied in a different form (V34, F6), explained in the row.

### Numbers

| # | Issue | Resolution |
|---|---|---|
| N1 | Demo step 5 quoted the LB pair value while step 4 left the demo in MB | Fixed. Checked: mask 3 in MB is +123.0 − 120.0 = +3.0 t. Step 5 now starts "Switch the method back to location-based" (`demoSequence[4]`, EN and DE), quotes both values, new key `pair_dup_oct_mb_t` = +3.0 t; steps 4 and 5 carry `method`. |
| N2 | "two and a half points" on `resolution` | Fixed. Checked: −5.071 − (−7.485) = 2.41 points. New key `chg_lb_pp_shift` = 2.4; note reads "The change moved 2.4 points, from −7.5% to −5.1%". §1.6 and `ergebnisse_2025.md` separate 2.5% of the total from 2.4 points of change. |
| N3 | Talbrück bill carried Kellbrunn's customer number | Fixed. `CUSTOMER_NO_JV = "55-0388"` (not 55-0417, which would echo gas invoice G-2025-0417); `Jahresrechnung_TB_2025.md` regenerated; `inputs.customerNoJV`; M26 and §1.4 updated. The "z. Hd. Einkauf Kellbrunn" line stays. |
| N4 | Gas factors inconsistent (0.20 / 1.11 = 0.1802) | Fixed by explanation, factors unchanged (changing them would move every headline number). New keys `gas_hi_route_t` = 376.6 t and `gas_hi_route_diff_t` = 0.4 t; `traceTwo[1].alt_en/alt_de`; lines added to trace-two press 3, `uebung_drei_zahlen_antworten.md` and `ergebnisse_2025.md`. |
| N5 | `combinations[*].gap_*` signed, `numbers.gap_*` absolute | Fixed. Renamed to `delta_vs_right_lb_t/_pct`, `delta_vs_right_mb_t/_pct` (signed, state minus right). The demo meter shows the absolute value with "below"/"above". Sign convention stated in §0.1. |
| N6 | `wf_lb_min_t.value` was the rounded 1464.5 | Fixed. Min and max now come from the unrounded state totals: `value` 1464.496, `rounded` 1464.5. `recompute.py` mismatch cleared. |
| N7 | LB shares add to 100.1% | Fixed without changing values. Checked: 47.2 + 25.9 + 17.4 + 5.0 + 2.3 + 2.3 = 100.1. `ranking.shareNote_en/de` added; A1 and the demo show at most the top three. Largest-remainder rounding was not used because it would make one displayed share differ from its own rounded value. |
| N8 | Isolated MB trap effects next to MB raw waterfall bars | Fixed as labels. Row value "if only this trap fires"; raw-state chart caption "with all traps active, in this order", with the T1 to T3 contrast spelled out in §3.1. |
| N9 | Review date 2026-01-20 before factor edition 2026-09-26 | Fixed by backdating the case's factor edition to `Lehrwerte v1.0, 2026-01-15` (the date the rules were written). Ledger and kit regenerated. M28 and START-HERE explain that the kit release date differs. |
| N10 | October row above "Summe Belege Strom" in the control-total CSV | Fixed. Documents, then their sum, then excluded, then "plus Oktober Werk Nord aus Zählerständen". The column sums from the top to 4,615,000; asserted in the script. `controlTotal[*].group` added for the demo. |
| N11 | Registry: 30.1 t read as market-based | Fixed with V7: the description now says which decrease each figure belongs to. |
| N12 | Variant 2023 and steel inputs missing from JSON | Fixed. `inputs.variant2023` and `inputs.steel` added (steel deflator now a named input instead of a literal 1.2). `steel_avg_t` and the unused `F_AVG` removed; checked: no surface used it. A6 and A7 name their inputs. |
| N13 | "a third below July" | Fixed. New key `aug_vs_jul_pct` = −31%; wording "almost a third below July (−31%)" in scene 7, the ask-back target answer and prompt 04. |

### Facts

| # | Issue | Resolution |
|---|---|---|
| F1 | Website classified as consumer-facing | Fixed. Card 4 is now "Write that we are climate-neutral" (refusal on evidence). Note, guide §12, §9 item 6 and M8 use the suggested wording: consumer ban, the lawyer decides who a text is aimed at, § 5 UWG covers business customers too, not legal advice. Registry agenda updated in both locales. |
| F2 | "without recognised proof" misstates Annex I 4a | Fixed. Wording from research fact 11: "unless recognised excellent environmental performance can be shown", offset ban stated for products; no Annex item assigned to a company-level claim. |
| F3 | German UWG route stated without label | Fixed. Note and guide say "through an amendment to the UWG, known from secondary sources; check the current text". § 15b UWG-E added to §9 item 6 and to O5. |
| F4 | ESG extraction accuracy generalised | Fixed in limits row 2 and guide §13 with the suggested wording (two studies, model, year, reports not bills). Merged with V31. |
| F5 | Invented audience shares on trace-two | Fixed. "Common slips: ...; add real shares only after the O3 test runs." |
| F6 | "Scope 2 is always reported twice" | Fixed in the scene-13 must-say line and guide §9 body with the GHG Protocol market condition and the VSME note. Field card check 6 and the guide §9 key point were checked and do not say "always"; left as they are. The VSME B3 detail goes to new open item O8 before it can reach a slide. Rule 5 in `grenzen_und_regeln.md` keeps "Always report": it is Kellbrunn's own rule, not a claim about the standard. |
| F7 | Residual mix above grid average stated as universal; hierarchy simplified | Fixed. "In Germany the residual mix is usually higher"; A8 small print on PPAs and on the grid average where no residual mix is published. |
| F8 | "Since 18 March 2026 that law covers ..." reads as binding in Germany | Fixed. "At EU level; member states must bring national law in line by 19 March 2027" in scene 3, §1.3, M16, guide §1 and §9 item 1. |
| F9 | Scope 1 and 2 "inside the voluntary standard" is inferred | Fixed. Scene 3 and §9 item 3 say "The VSME Basic Module, on which the standard is based, includes Scope 1 and 2"; §9 item 4 names the EFRAG VSME (December 2024) and says "no assurance required"; O8 added. |
| F10 | Licence reading too flat | Fixed in A2 with the suggested wording. |
| F11 | UBA values tied to one edition | Fixed. A2 names the source and read date and says UBA revises earlier years; added to O5. |
| F12 | 5% threshold presented as a rule; methodology changes | Fixed in the restatement policy (company choice, method or source switch checked against the same threshold) and in the A6 note. |
| F13 | Promise "caused itself" overclaims | Fixed in EN and DE §1.2. |
| F14 | Category 13 possible for Halle 3 | Fixed as a backup line: scene 9 note ("If asked about Scope 3 ...", `sayAt` "4") and §1.4. |
| F15 | §9 items 2, 5, 7, 8, 9 checked, no change | No change needed, as the verifier said. They stay on the O5 re-check list. |

### Voice

| # | Issue | Resolution |
|---|---|---|
| V1 | `resolution` say[1] | Fixed with N2 ("The explanation moved from 'efficiency' to 'mostly the grid factor'"). |
| V2 | "Sie" after colon in `send-total` label | Fixed in DE; EN given the same shape ("Send it, because ..."). |
| V3 | steps[1] DE colon + "Sie" | Fixed in DE as suggested; EN aligned. |
| V4 | Moderationsansicht "Sie verbindet sich" | Fixed ("Die Ansicht verbindet sich"); EN "The view pairs". |
| V5 | description "Sie liegt nur 2,5 %" | Fixed ("Die Summe liegt"); EN "The total is". |
| V6 | Summaries verbless; §8 count wrong | Fixed. New summaries, measured: DE 148, EN 153 characters; §8 count line corrected. |
| V7 | "question comes out at"; mixed driver triad | Fixed in DE and EN as suggested. |
| V8 | "Next year they will not cancel" | Fixed in DE, EN and the anatomy note. |
| V9 | List-colon opener in `send-total.evidenceOnly` | Fixed in DE and EN. |
| V10 | 1,915.2 t without method | Fixed in `aligned` and `send-total.evidenceOnly`, both locales. |
| V11 | "Close to last year is not correct." | Fixed. |
| V12 | steps[2] verbless list | Fixed in DE and EN. |
| V13 | "Grenze", "Durchgang" | Fixed. "Bilanzgrenze" in outcomes[1], agenda, steps[5] and the DE closing template; "Einführung in CSRD ..." in notForYou and notCovered. EN "walk-through" left: it is idiomatic English. |
| V14 | Agenda "Grenzen" lower-case verbs, missing third column | Fixed in DE (quoted category names) and EN, together with F1's new card 4 text. |
| V15 | `one-unit` say[1] | Fixed; the spoken number is now 495.5 with its key. |
| V16 | `one-unit` "The fix:" | Fixed. |
| V17 | `the-arc` fragments and "earned it" | Fixed. |
| V18 | `rematch` "The bigger change:" | Fixed. |
| V19 | `limits` signposting and aphorism | Fixed. |
| V20 | `ask-back` "Seven questions before any number." | Fixed. |
| V21 | `the-ledger` unsourced auditor line | Fixed. |
| V22 | `two-scope-2` claim line | Fixed; the share is rendered from its key. |
| V23 | "actually" in `what-drove-it` title | Fixed. |
| V24 | `whose-bill` punchline | Fixed. |
| V25 | Staccato rules refrain | Fixed with one wording on all five surfaces (scene 12 line and note, guide §8, `grenzen_und_regeln.md`, field card). |
| V26 | Demo steps 2 and 5 | Fixed; step 2 quotes 14.8% (the rendered key) instead of "15%". |
| V27 | Guide §2 key point | Fixed. |
| V28 | Guide §6 dangling modifier and reveal | Fixed. |
| V29 | Guide §12 key point | Fixed. |
| V30 | Guide §14 key point | Fixed. |
| V31 | Limits row 2 generalisation | Fixed with F4. |
| V32 | "sits" x9 | Fixed in all learner-facing copy (scene 3, guide §3, §8, §14, field card, registry EN steps and ask-again feedback) and in M3. M16's "sits below" rephrased. |
| V33 | "mit Fragen zum Aufdecken" | Fixed. |
| V34 | Data-request e-mails | Sie kept (correct). "Vielen Dank und freundliche Grüße" in all three. Allowlist note added in §7.7. The START-HERE line is added in English, because START-HERE.md is English: "The data-request e-mails in `vorlagen/` use the formal Sie, as German business mail to utilities and suppliers does." |
| V35 | Registry hard rules | Confirmed no violation after the rewrites: summaries 148 / 153, no U+2013/U+2014, facts still 3, labels unchanged. |

### New JSON keys and fields in this round

`pair_dup_oct_mb_t`, `chg_lb_pp_shift`, `jul_kwh`, `aug_vs_jul_pct`, `gas_hi_route_t`, `gas_hi_route_diff_t`; `inputs.customerNoJV`, `inputs.variant2023`, `inputs.steel`; `combinations[*].delta_vs_right_*` (renamed from `gap_*`); `controlTotal[*].group`; `ranking.shareNote_en/de`; `traceTwo[1].alt_en/alt_de/alt_key`; `demoSequence[3..4].method`. Removed: `steel_avg_t`. Changed value: `factorEdition` = `Lehrwerte v1.0, 2026-01-15`; `wf_lb_min_t.value` = 1464.496.
