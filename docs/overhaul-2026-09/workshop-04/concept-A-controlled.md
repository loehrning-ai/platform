# Workshop 04 concept A: "Same question, two data states"

Working title (EN): ESG Reporting with AI: From Raw Inputs to Clearer Insights
Page title (DE): ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen
Slug `esg-berichte-mit-ki` · number `"04"` · topic DE `ESG-Berichte` / EN `ESG reporting`
Concept date: 2026-09-26. Angle A, closest to Workshop 03.

Sources used: `research/esg-ai-practice.md` (datasets, failure modes, decision moments), `research/esg-regulation.md` (facts as of 26 Sep 2026), `research/workshop-standard.md` (spine, 13 components, quality bars), `research/map-deck-engine.md` (scene contract, notes schema), `research/design-direction.md` (encodings), `research/map-workshop-touchpoints.md` (hard constraints), `research/slop-language.md` §3 (voice). All arithmetic in this file was recomputed with Python `Decimal` (`scratchpad/w04/calc_A.py`).

Conventions in this file: EN numbers use `1,866.5`; DE copy uses `1.866,5`. No en or em dashes anywhere, so copy can be lifted into the registry unchanged. Negative numbers use U+2212 (−), as W03 does.

---

## 0. Decisions in one screen

1. The question is held fixed for 76 minutes and is asked of two data states: a raw folder of 2025 bills and exports, and a prepared ledger (Belegtabelle) with rules.
2. The raw-folder answer is 1,866.5 t CO₂e (location-based), 7.5% below 2024. The correct figure is 1,915.2 t, 5.1% below 2024. The totals are only 48.7 t (2.5%) apart because six errors partly cancel. That is the core of the workshop: a total that passes every sanity check can be built from wrong parts.
3. The insight after the rematch: location-based emissions fell 102.3 t, and 72.2 t of that is the grid getting cleaner. Market-based fell 781.3 t, and 744.0 t of that is guarantees of origin bought for one site. Fernholt's own lower use of electricity, gas and diesel accounts for 30.1 t. The AI's sentence "mainly thanks to efficiency measures" has no support in the data.
4. The traps are the anatomy of the error: duplicate March bill, missing October, a two-month bill that hides the gap, a joint-venture bill inside the folder, "1.240 MWh" read as 1,240 kWh, gas billed in kWh Hs with a Hi factor picked, AdBlue counted as diesel, and a green-tariff certificate for one site treated as a Scope 2 method.
5. Materials follow the hard constraints: no PDF, XLSX, DOCX or PPTX anywhere. Bills are text-rendered `.md` files in the kit and WebP renderings in the deck. The kit is text only (CSV, MD, HTML without active content).
6. The raw-folder answer must be captured from real runs before publication (protocol in §3.9). Until then every slide shows it as "Constructed from documented failure modes, not a recorded run."

---

## 1. The fixed question and the promise

**Fixed question (verbatim, on every relevant scene):**

- EN: "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?"
- DE: „Wie hoch waren unsere Scope-1- und Scope-2-Emissionen 2025, und sind sie gegenüber 2024 gesunken?"

The question deliberately does not say "location-based and market-based". Reporting both is one of the rules the prepared data state adds, and the audience should notice that the raw-folder answer gives two Scope 2 numbers with one method mixed in.

**Promise (one sentence):**

- EN: "After 90 minutes you can turn a folder of energy bills into a ledger where every number points to a page, work out both Scope 2 figures from it, and say how much of the change against last year your company caused itself."
- DE: „Nach 90 Minuten machst du aus einem Ordner voller Energierechnungen eine Belegtabelle, in der jede Zahl auf eine Seite zeigt, rechnest daraus beide Scope-2-Zahlen aus und sagst, wie viel der Veränderung zum Vorjahr dein Unternehmen selbst bewirkt hat."

**Who asks this question at a Mittelstand company (scene `the-case`):** the house bank for loan pricing, an OEM customer's supplier questionnaire, and the voluntary standard based on the VSME (Basic Module: energy and Scope 1 and 2 among 11 disclosures). Fernholt is outside CSRD scope (§8).

---

## 2. The fictional company

**Fernholt Präzisionsteile GmbH** (fictional; label "fiktives Unternehmen" / "fictional company" on every scene that shows it).

Name check (web search, 2026-09-26): searches for "Fernholt" GmbH and "Fernholt Präzisionsteile" returned only people with the surname Fernholt and no company of that name. The nearest real hit is Fernholz GmbH (fernholz-gmbh.de, shopping-cart maintenance), a different spelling and sector. Recommendation: keep "Fernholt", add a one-line Handelsregister check before publishing, and never pair the name with a real town. The research proposal's joint venture "Pulverbeschichtung Mitte GmbH" is replaced, because the pattern "Pulverbeschichtung + region" is common among real firms. The new name **Talbrück Beschichtung GmbH** returned no company in a web search. The energy supplier on the bills is **Lindmark Energie GmbH** (also no hit). No town is named; the location reads "erfundener Standort in Hessen". (Kessenau was considered and dropped: it is a historic place name near Lorsch.)

| Field | Value |
|---|---|
| Sector | Metal parts supplier: stamping, CNC machining, assembly, for automotive and machinery OEMs |
| Staff | 180 (Werk Nord 110, Werk Süd 55, Lager Ost 15) |
| Turnover | €42m (illustrative, used only for an optional intensity figure) |
| Reporting year | 2025; comparison year 2024 |
| Boundary approach | Operational control (GHG Protocol Corporate Standard), written down before any AI run |
| Fleet | 14 company vans and cars, one fuel-card contract |
| Last year | 2024 figures were prepared by an external energy consultant and sent to the bank in spring 2025. This year Fernholt wants to do it in-house, with AI help. |

| Site ID | Site | Activity | In boundary? | Note |
|---|---|---|---|---|
| WN | Werk Nord (HQ) | Stamping, assembly, offices | Yes (owned) | Grey electricity tariff; gas for heating and washing lines |
| WS | Werk Süd | CNC machining | Yes (owned) | Green tariff "Ökostrom Plus" since 1 Jan 2025, backed by cancelled guarantees of origin for 1,240 MWh |
| LO | Lager Ost | Warehouse, leased | Yes (leased, operated by Fernholt, own sub-meter) | Landlord bills quarterly |
| FL | Fleet | Vans and cars | Yes | Fuel-card export |
| TB | Talbrück Beschichtung GmbH | Powder coating in a hall on the Werk Nord premises; Fernholt holds 40%, the partner operates it | **No** (no operational control) | Fernholt's purchasing team handles its electricity contract, so its bill lands in the Werk Nord folder. Candidate for Scope 3 Category 15 disclosure, out of scope here. |

---

## 3. The dataset

### 3.1 Illustrative teaching factors (NOT official values)

Shown on the factor scene, in `faktoren_lehrwerte.csv`, and in the footer of every calculation: "Lehrwerte, keine amtlichen Faktoren" / "Teaching values, not official factors."

| factor_id | Description | Value | Unit | Real-world anchor (order of magnitude only, not used) |
|---|---|---|---|---|
| F-EL-LB-2025 | Grid electricity DE, location-based, 2025 | 0.40 | kg CO₂e/kWh | UBA: 363 g CO₂/kWh for 2024, direct CO₂ only |
| F-EL-LB-2024 | Grid electricity DE, location-based, 2024 | 0.42 | kg CO₂e/kWh | UBA: 386 g for 2023, 363 g for 2024 |
| F-EL-RM-2025 | Residual mix DE, market-based, 2025 | 0.60 | kg CO₂e/kWh | AIB 2024 European residual mix 452 g/kWh; DE usually above its grid average |
| F-EL-RM-2024 | Residual mix DE, market-based, 2024 | 0.60 | kg CO₂e/kWh | Kept equal to 2025 on purpose, so the market-based change has no factor effect. Say so on the slide: real residual mixes change every year. |
| F-EL-GO | Electricity covered by cancelled guarantees of origin, market-based | 0.00 | kg CO₂e/kWh | Scope 2 Guidance quality criteria |
| F-GAS-HS | Natural gas per kWh gross calorific value (Brennwert, Hs) | 0.18 | kg CO₂e/kWh(Hs) | ≈ 0.20 per kWh(Hi) ÷ 1.11 |
| F-GAS-HI | Natural gas per kWh net calorific value (Heizwert, Hi) | 0.20 | kg CO₂e/kWh(Hi) | ≈ 0.201 |
| F-DSL | Diesel, road, pump blend | 2.50 | kg CO₂e/litre | ≈ 2.5 to 2.7 in published sets |
| C-HS-HI | Gross/net ratio natural gas | 1.11 | | ≈ 1.11 |

Both years use the same factor file. The 2024 consultant used F-EL-LB-2024, F-EL-RM-2024, F-GAS-HS and F-DSL.

### 3.2 The raw folder (what the AI gets in Ask 1)

Folder `rohdaten_2025/`, 22 files from 2025, plus `vorjahr/THG_2024_Zusammenfassung.csv` and `faktoren/faktoren_lehrwerte.csv` (24 files in all). Bills are German documents with German number format, as in real life. In the kit they are Markdown text renderings (`.md`); in the deck and demo they appear as WebP renderings of the same text in a bill layout (W02 precedent). Traps are marked here; they are **not** marked in the files.

**`rohdaten_2025/Werk_Nord/Strom/`: 12 files**

| # | File | Addressee | Invoice no. | Period on document | Quantity on document | Trap |
|---|---|---|---|---|---|---|
| 1 | `2025-01_Strom_WN.md` | Fernholt Präzisionsteile GmbH, Werk Nord | 4711-01 | 01.01.2025 bis 31.01.2025 | 210.000 kWh | |
| 2 | `2025-02_Strom_WN.md` | same | 4711-02 | 01.02. bis 28.02.2025 | 195.000 kWh | |
| 3 | `2025-03_Strom_WN.md` | same | 4711-03 | 01.03. bis 31.03.2025 | 205.000 kWh | |
| 4 | `Scan_Rechnung_Maerz.md` | same | 4711-03 | 01.03. bis 31.03.2025 | 205.000 kWh | **Duplicate.** Same invoice, forwarded by purchasing and scanned again. The text has OCR noise ("Rechnungs-Nr. 4711-O3", a stray line break) so it does not look identical. |
| 5 | `2025-04_Strom_WN.md` | same | 4711-04 | April | 190.000 kWh | |
| 6 | `2025-05_Strom_WN.md` | same | 4711-05 | May | 185.000 kWh | |
| 7 | `2025-06_Strom_WN.md` | same | 4711-06 | June | 180.000 kWh | |
| 8 | `2025-07_Strom_WN.md` | same | 4711-07 | July | 175.000 kWh | |
| 9 | `2025-08_Strom_WN.md` | same | 4711-08 | August | 120.000 kWh | Real dip: plant holiday. Not an error; the checking prompt should flag it and a person confirms it. |
| 10 | `2025-09_Strom_WN.md` | same | 4711-09 | September | 190.000 kWh | |
| 11 | `2025-11-12_Strom_WN.md` | same | 4711-11 | 01.11.2025 bis 31.12.2025 | 410.000 kWh | **Two months on one bill** (the supplier changed its billing cycle). Harmless in a sum, but it keeps the file count at 12 and so hides the missing October. |
| 12 | `Jahresrechnung_TB_2025.md` | **Talbrück Beschichtung GmbH**, Halle 3, same street as Werk Nord | TB-2025-12 | 01.01. bis 31.12.2025 | 1.000.000 kWh | **Outside the boundary.** Joint venture, operated by the partner. |
| | *(missing)* | | 4711-10 | 01.10. bis 31.10.2025 | | **October invoice missing.** |

File count 12, months covered 11 (January to September, November, December), March twice.

**`rohdaten_2025/Werk_Nord/Zaehlerstaende_2025.csv`** (facility manager's month-end readings, semicolon, German decimals). Columns `datum;zaehler;stand_kwh;erfasst_von`.

| Date | Reading (kWh) |
|---|---|
| 31.12.2024 | 3.162.300 |
| 31.01.2025 | 3.372.300 |
| 28.02.2025 | 3.567.300 |
| 31.03.2025 | 3.772.300 |
| 30.04.2025 | 3.962.300 |
| 31.05.2025 | 4.147.300 |
| 30.06.2025 | 4.327.300 |
| 31.07.2025 | 4.502.300 |
| 31.08.2025 | 4.622.300 |
| 30.09.2025 | 4.812.300 |
| 31.10.2025 | 5.012.300 |
| 31.12.2025 | 5.422.300 |

October = 5,012,300 − 4,812,300 = 200,000 kWh. Year = 5,422,300 − 3,162,300 = 2,260,000 kWh, which cross-checks the corrected bill total. (No November reading: the facility manager was on leave. A realistic small gap that does not matter because the Nov/Dec bill exists.) Meter reads kWh directly (transformer ratio 1, stated in the file header).

**`rohdaten_2025/Werk_Nord/Gas/Gas_Jahresrechnung_WN_2025.md`**
"Verbrauch 169.280 m³ × Zustandszahl 0,9600 × Brennwert 11,384 kWh/m³ = Energiemenge (Brennwert Hs) 1.850.000 kWh". Period 01.01. bis 31.12.2025.

**`rohdaten_2025/Werk_Sued/`: 3 files**
- `Jahresuebersicht_2025_Oekostrom.md`: "Tarif Ökostrom Plus · Zählpunkt DE000…WS01 · Verbrauch 2025: **1.240 MWh**". The only bill in MWh; German thousands separator.
- `HKN_Bestaetigung_2025.md`: "Herkunftsnachweise über 1.240 MWh, Erzeugungsjahr 2025, Wasserkraft, entwertet im Herkunftsnachweisregister für die Liefermenge an Fernholt Präzisionsteile GmbH, Werk Süd." Covers Werk Süd only.
- `Gas_Jahresrechnung_WS_2025.md`: "21.980 m³ × 0,9600 × 11,374 kWh/m³ = 240.000 kWh (Brennwert Hs)".

**`rohdaten_2025/Lager_Ost/`: 4 files**
`Nebenkosten_Strom_Q1_2025.md` to `_Q4_2025.md`, landlord's sub-meter statements: Q1 30.000, Q2 25.000, Q3 25.000, Q4 30.000 kWh, grey tariff. Complete; this is the control that shows the method does not flag everything.

**`rohdaten_2025/Flotte/Tankkarten_2025.csv`**
Semicolon-separated, decimal comma, one row per transaction. Columns `datum;kennzeichen;produkt;menge;einheit;betrag_eur`. Products: `Diesel` (l), `AdBlue` (l), `Waesche` (Stk), `Shop` (Stk).

| Month | Diesel (l) | AdBlue (l) | Car washes |
|---|---|---|---|
| Jan | 3.300 | 100 | 2 |
| Feb | 3.100 | 100 | 2 |
| Mar | 3.300 | 100 | 2 |
| Apr | 3.200 | 100 | 2 |
| May | 3.200 | 100 | 2 |
| Jun | 3.100 | 100 | 2 |
| Jul | 3.000 | 100 | 2 |
| Aug | 2.600 | 100 | 2 |
| Sep | 3.300 | 100 | 2 |
| Oct | 3.300 | 100 | 2 |
| Nov | 3.300 | 100 | 2 |
| Dec | 3.300 | 100 | 2 |
| **Sum** | **38.000** | **1.200** | 24 |

AdBlue is a urea solution for the exhaust system, not a fuel. Counting it adds 1,200 l.

**`vorjahr/THG_2024_Zusammenfassung.csv`** (the consultant's 2024 figures; correct, used in both runs)

| site | carrier | quantity | unit | factor_lb | t_lb | factor_mb | t_mb |
|---|---|---|---|---|---|---|---|
| WN | electricity | 2,290,000 | kWh | F-EL-LB-2024 | 961.8 | F-EL-RM-2024 | 1,374.0 |
| WS | electricity | 1,250,000 | kWh | F-EL-LB-2024 | 525.0 | F-EL-RM-2024 | 750.0 |
| LO | electricity | 110,000 | kWh | F-EL-LB-2024 | 46.2 | F-EL-RM-2024 | 66.0 |
| WN | gas (Hs) | 1,900,000 | kWh | F-GAS-HS | 342.0 | F-GAS-HS | 342.0 |
| WS | gas (Hs) | 250,000 | kWh | F-GAS-HS | 45.0 | F-GAS-HS | 45.0 |
| FL | diesel | 39,000 | l | F-DSL | 97.5 | F-DSL | 97.5 |
| **Total** | | | | | **2,017.5** | | **2,674.5** |

2024: electricity 3,650,000 kWh; Scope 2 location-based 1,533.0 t; market-based 2,190.0 t (no certificates in 2024); Scope 1 = 387.0 + 97.5 = 484.5 t.

### 3.3 The prepared data state (what the AI gets in Ask 2)

Same prompt, same factor file, same 2024 summary, same model, same date. The folder is replaced by three files:

1. **`belegtabelle_2025.csv`** (the ledger). One row per source quantity. Columns:
   `row_id; site_id; entity_on_document; in_boundary; carrier; period_start; period_end; months; qty_source; unit_source; basis; qty_norm; unit_norm; source_file; source_page; source_quote; status; reason; instrument_id; factor_lb; factor_mb; dq; prepared_by; reviewed_by`
2. **`abdeckung_standort_monat.csv`** (coverage grid, site × month, values: `1` covered, `2` doubled, `0` missing, `S` split bill).
3. **`grenzen_und_regeln.md`** (six rules, written before the AI runs):
   1. Boundary: operational control. In: WN, WS, LO, FL. Out: Talbrück Beschichtung GmbH (40%, operated by the partner); keep its row, status `excluded`, reason `boundary`.
   2. Coverage: fill the site × month grid before summing. Unique key = invoice number + period + meter. If a month is missing or doubled, stop and say which.
   3. Units: keep the original value and unit in the row. Convert with the fixed table only (MWh × 1,000 = kWh; gas stays in kWh Hs; diesel stays in litres).
   4. Factors: use factor IDs from `faktoren_lehrwerte.csv` only, for the reporting year. Never write a factor value from memory.
   5. Scope 2: always report location-based and market-based. Certificates set a site's kWh to 0 in market-based only up to the certified volume; every other kWh gets the residual mix.
   6. Citations: every number in an answer names its row IDs. Rows with status `estimate` are named in the text.

**Ledger rows (2025), as shipped in `belegtabelle_2025.csv` and as expected output:**

| row_id | site | entity on document | carrier | period | source qty | normalised | status | dq | source (file · quote) |
|---|---|---|---|---|---|---|---|---|---|
| E-WN-01 | WN | Fernholt, Werk Nord | electricity | Jan | 210.000 kWh | 210,000 kWh | actual | A | 2025-01_Strom_WN.md · "Verbrauch 210.000 kWh" |
| E-WN-02 | WN | same | electricity | Feb | 195.000 kWh | 195,000 | actual | A | 2025-02 |
| E-WN-03 | WN | same | electricity | Mar | 205.000 kWh | 205,000 | actual | A | 2025-03 · invoice 4711-03 |
| E-WN-03D | WN | same | electricity | Mar | 205.000 kWh | 0 | excluded | | Scan_Rechnung_Maerz.md · reason `duplicate of E-WN-03 (invoice 4711-03)` |
| E-WN-04 … E-WN-09 | WN | same | electricity | Apr to Sep | 190.000 / 185.000 / 180.000 / 175.000 / 120.000 / 190.000 kWh | same in kWh | actual | A | one bill each; Aug flagged `dip confirmed: plant holiday` |
| E-WN-10 | WN | same | electricity | Oct | meter 5.012.300 − 4.812.300 | 200,000 | actual (meter reading) | B | Zaehlerstaende_2025.csv rows 30.09 and 31.10 · invoice 4711-10 requested from supplier |
| E-WN-11 | WN | same | electricity | Nov to Dec (2 months) | 410.000 kWh | 410,000 | actual | A | 2025-11-12_Strom_WN.md · "01.11.2025 bis 31.12.2025" |
| E-TB-01 | TB | **Talbrück Beschichtung GmbH** | electricity | Jan to Dec | 1.000.000 kWh | 0 | excluded | | Jahresrechnung_TB_2025.md · reason `boundary: operational control lies with partner` |
| E-WS-01 | WS | Fernholt, Werk Süd | electricity | Jan to Dec | **1.240 MWh** | **1,240,000 kWh** | actual | A | Jahresuebersicht_2025_Oekostrom.md · "Verbrauch 2025: 1.240 MWh" · instrument I-WS-GO |
| E-LO-Q1 … Q4 | LO | Vermieter statement for Fernholt | electricity | quarters | 30.000 / 25.000 / 25.000 / 30.000 kWh | 110,000 | actual | A | Nebenkosten_Strom_Q1 to Q4 |
| G-WN-01 | WN | Fernholt | gas | Jan to Dec | 1.850.000 kWh | 1,850,000 kWh(Hs) | actual | A | factor F-GAS-HS · "Energiemenge (Brennwert Hs)" |
| G-WS-01 | WS | Fernholt | gas | Jan to Dec | 240.000 kWh | 240,000 kWh(Hs) | actual | A | factor F-GAS-HS |
| D-FL-01 | FL | Fernholt | diesel | Jan to Dec | 38.000 l | 38,000 l | actual | A | Tankkarten_2025.csv · produkt = Diesel |
| D-FL-02 | FL | Fernholt | AdBlue | Jan to Dec | 1.200 l | 0 | excluded | | reason `not a fuel` |
| I-WS-GO | WS | Fernholt, Werk Süd | instrument | 2025 | 1.240 MWh GO, hydro, cancelled | covers 1,240,000 kWh of E-WS-01 | actual | A | HKN_Bestaetigung_2025.md |

The 2024 summary is loaded into the same ledger as rows `V24-*` with status `prior year, consultant`, grade B (summary level, no bills attached). That is an honest limit to name in the limits act.

### 3.4 Correct answers (full arithmetic)

**Electricity in the boundary, 2025**
- Werk Nord = 210,000 + 195,000 + 205,000 + 190,000 + 185,000 + 180,000 + 175,000 + 120,000 + 190,000 + 200,000 (Oct, meter) + 410,000 (Nov to Dec) = **2,260,000 kWh**
- Werk Süd = 1,240 MWh × 1,000 = **1,240,000 kWh**
- Lager Ost = 30,000 + 25,000 + 25,000 + 30,000 = **110,000 kWh**
- Total = **3,610,000 kWh** (2024: 3,650,000 kWh; change −40,000 kWh = −1.1%)

**Scope 2, location-based:** 3,610,000 × 0.40 = 1,444,000 kg = **1,444.0 t**

**Scope 2, market-based:**
- Werk Süd, covered by guarantees of origin: 1,240,000 × 0.00 = 0
- Grey power WN + LO = 2,370,000 kWh × 0.60 = **1,422.0 t**

**Scope 1:**
- Gas = (1,850,000 + 240,000) kWh(Hs) × 0.18 = 2,090,000 × 0.18 = **376.2 t** (WN 333.0; WS 43.2)
- Diesel = 38,000 l × 2.50 = **95.0 t**
- Scope 1 = **471.2 t**

**Totals 2025**
- Scope 1 + 2, location-based = 471.2 + 1,444.0 = **1,915.2 t**
- Scope 1 + 2, market-based = 471.2 + 1,422.0 = **1,893.2 t**

**Against 2024**
- Location-based: 1,915.2 − 2,017.5 = **−102.3 t = −5.1%**
- Market-based: 1,893.2 − 2,674.5 = **−781.3 t = −29.2%**
- Scope 1 alone: 471.2 − 484.5 = −13.3 t (−2.7%)

**What drove the change (the insight scene).** Convention, stated on the slide: consumption effects are valued at the 2024 factor; the factor effect uses 2025 consumption.

Location-based, −102.3 t:

| Driver | Arithmetic | t | Share |
|---|---|---|---|
| Grid factor (0.42 → 0.40) | 3,610,000 × (0.40 − 0.42) | −72.2 | 71% |
| Less electricity | (3,610,000 − 3,650,000) × 0.42 | −16.8 | |
| Less gas | (2,090,000 − 2,150,000) × 0.18 | −10.8 | |
| Less diesel | (38,000 − 39,000) × 2.50 | −2.5 | |
| Own use, together | | **−30.1** | 29% |
| Sum | | **−102.3** ✓ | |

Market-based, −781.3 t:

| Driver | Arithmetic | t | Share |
|---|---|---|---|
| Guarantees of origin for Werk Süd | 1,240,000 × 0.60 | −744.0 | 95% |
| Less electricity | (3,610,000 − 3,650,000) × 0.60 | −24.0 | |
| Less gas and diesel (Scope 1) | −10.8 − 2.5 | −13.3 | |
| Own use, together | | **−37.3** | 5% |
| Sum | | **−781.3** ✓ | |

What the data cannot say: whether the lower use came from efficiency or from lower output. The folder has no production volumes. The honest sentence says "used less", not "became more efficient".

**Secondary figures (VSME-style, appendix)**
- Renewable share of electricity = 1,240,000 / 3,610,000 = 34.3%. "100% green electricity" is false.
- Energy total with gas on Hs basis = 3,610 + 2,090 + 380 (diesel at 10.0 kWh/l) = 6,080 MWh. On Hi basis gas is 2,090 / 1.11 = 1,882.9 MWh. State the basis.
- Per employee (location-based) = 1,915.2 / 180 = 10.6 t (2024: 11.2 t).

### 3.5 The plausible wrong answer (Ask 1, raw folder)

**Label on every slide until real runs exist:** "Constructed from documented failure modes, not a recorded run." Once runs are captured (§3.9), replace with "Recorded AI run · <model> · <date> · run k of 5".

**What the AI does on the raw folder:**
1. Sums all 12 Werk Nord electricity files: duplicate in, October missing, JV in.
2. Reads "1.240 MWh" as 1.24 MWh = 1,240 kWh.
3. Picks F-GAS-HI because "emission factors are usually per net calorific value", and applies it to kWh Hs.
4. Sums the fuel-card column `menge` for all rows with unit `l`, so AdBlue is included.
5. For market-based, sets Werk Süd to 0 (it saw the certificate) and uses the grid average 0.40 for all other kWh, because "no supplier-specific factor is given".

**Arithmetic:**
- Werk Nord own bills = 2,260,000 − 200,000 (Oct) + 205,000 (duplicate) = 2,265,000 kWh
- Electricity = 2,265,000 + 1,000,000 (JV) + 1,240 (WS misread) + 110,000 (LO) = 3,376,240 kWh
- Scope 2 location-based = 3,376,240 × 0.40 = **1,350.5 t**
- Scope 1 = 2,090,000 × 0.20 = 418.0 t gas + (38,000 + 1,200) × 2.50 = 98.0 t diesel = **516.0 t**
- Scope 1 + 2 location-based = **1,866.5 t**
- Scope 2 "market-based" = (2,265,000 + 1,000,000 + 110,000) × 0.40 + 1,240 × 0 = **1,350.0 t**; with Scope 1 = 1,866.0 t

**The answer text as shown (constructed, EN; DE version in the deck notes):**

> "Fernholt's 2025 emissions: Scope 1 516.0 t CO₂e, Scope 2 1,350.5 t CO₂e (location-based), total 1,866.5 t. That is 7.5% below 2024 (2,017.5 t). Scope 2 market-based: 1,350.0 t, because Werk Süd buys green electricity. The reduction comes mainly from efficiency measures at Werk Nord. Scope 1 rose by 6.5%, probably due to higher heating demand."

**Why it passes the checks people actually do:**

| Check | Result on the wrong answer | Passes? |
|---|---|---|
| Compare with last year | −7.5%, a normal-looking year | yes |
| Compare with the right answer (unknown to the room) | 48.7 t apart, 2.5% | would pass |
| Per employee | 10.4 t (last year 11.2 t) | yes |
| "Are all months there?" by file count | 12 files in the Werk Nord folder | yes |
| Does the AI show its work? | yes, a sum per folder and per factor | yes |

**Effect of each trap (for reveals and the waterfall; location-based unless stated):**

| Trap | Change in input | Effect on the total | Caught by |
|---|---|---|---|
| Duplicate March (invoice 4711-03 twice) | +205,000 kWh | +82.0 t | unique key: invoice + period + meter |
| October missing | −200,000 kWh | −80.0 t | site × month grid |
| Two-month bill Nov/Dec | 0 in the sum | 0 t, but it hides the gap: 12 files, 11 months | days-covered column |
| JV bill included | +1,000,000 kWh | +400.0 t | entity-on-document column + boundary rule |
| "1.240 MWh" read as 1,240 kWh | −1,238,760 kWh | −495.5 t | original value + unit kept; kWh per employee per site |
| Hi factor on Hs kWh | 0.20 instead of 0.18 on 2,090,000 kWh | +41.8 t | factor ID must match the basis on the bill |
| AdBlue counted as diesel | +1,200 l | +3.0 t | product filter |
| **Net** | | **−48.7 t** | |

**Waterfall from wrong to right, Scope 1 + 2 location-based:**

| Step | Change | Running total |
|---|---|---|
| Raw-folder answer | | 1,866.5 t |
| Remove duplicate March | −82.0 | 1,784.5 |
| Add October from meter readings | +80.0 | 1,864.5 |
| Exclude Talbrück (JV) | −400.0 | 1,464.5 |
| Read Werk Süd as 1,240 MWh | +495.5 | 1,960.0 |
| Use the Hs gas factor | −41.8 | 1,918.2 |
| Drop AdBlue | −3.0 | **1,915.2 t** ✓ |

The running total swings between 1,464.5 and 1,960.0 and lands 48.7 t from where it started. That swing is the slide.

**Waterfall, Scope 2 market-based:**

| Step | Change | Running total |
|---|---|---|
| Raw-folder "market-based" | | 1,350.0 t |
| Remove duplicate March (at 0.40) | −82.0 | 1,268.0 |
| Add October (at 0.40) | +80.0 | 1,348.0 |
| Exclude Talbrück | −400.0 | 948.0 |
| Residual mix instead of grid average for 2,370,000 grey kWh (+0.20 × 2,370,000) | +474.0 | **1,422.0 t** ✓ |

The Werk Süd unit error moves nothing in market-based (Werk Süd is 0 there either way). The method error dominates it. The two Scope 2 numbers go wrong in different ways, which is one more reason to report both.

**What the wrong answer gets wrong beyond the total:**
- Site split: Werk Süd shows 0.5 t, the JV 400.0 t. A reduction plan built on this would ignore Fernholt's second-largest electricity user.
- Direction and cause: it reports −7.5% (right: −5.1%) and names "efficiency measures". It reports Scope 1 up 6.5% (right: down 2.7%) and invents "higher heating demand"; gas kWh actually fell 2.8%.
- Method drift: its market-based figure uses the grid average, while 2024 used the residual mix. Its 30.2% "drop" in market-based partly measures a change of method.
- Fragility: next year the JV bill moves to its own folder or Werk Süd bills in kWh, and the total jumps by 400 to 500 t. Fernholt would then have to explain a rise it never had.
- Audit: a bank or customer who picks one number and asks for the rows behind it gets no rows.

**What a good assistant should say on the raw folder** (target behaviour, shown in the rematch and in the ask-back scene):

> "I can give a provisional figure, but five points need your decision first:
> 1. October is missing for Werk Nord. The meter file shows 200,000 kWh for 30.09. to 31.10. Should I use it?
> 2. Two files carry invoice number 4711-03. I counted March once.
> 3. One bill is addressed to Talbrück Beschichtung GmbH. Is it inside your boundary? I left it out.
> 4. Werk Süd reports '1.240 MWh'. I read this as 1,240 MWh = 1,240,000 kWh.
> 5. The gas bills state kWh at gross calorific value (Hs). I used F-GAS-HS.
> With these assumptions: Scope 1 = 471.2 t; Scope 2 location-based = 1,444.0 t; market-based = 1,422.0 t. Each figure is traceable to rows in the attached list."

### 3.6 The rematch answer (Ask 2, ledger)

> "Scope 1 2025: 471.2 t CO₂e (rows G-WN-01, G-WS-01, D-FL-01). Scope 2 location-based: 1,444.0 t (E-WN-01 to E-WN-11, E-WS-01, E-LO-Q1 to Q4; factor F-EL-LB-2025). Scope 2 market-based: 1,422.0 t (Werk Süd at 0 under I-WS-GO; 2,370,000 kWh at F-EL-RM-2025). Scope 1 + 2: 1,915.2 t location-based, 5.1% below 2024 (2,017.5 t); 1,893.2 t market-based, 29.2% below 2024 (2,674.5 t). One row is a meter reading, not an invoice (E-WN-10, grade B). Two rows are excluded: E-WN-03D (duplicate), E-TB-01 (outside the boundary)."

Database-style check shown beside it ("Recalculated in the spreadsheet"): 1,444.0 ✓ · 1,422.0 ✓ · 471.2 ✓.

Known gap to show honestly if the captured run has it (example of what to look for): "did not say that 71% of the location-based drop is the grid factor" (the question did not ask why; the decomposition is a separate step).

### 3.7 Improvements over the research datasets

- JV bill raised from 800,000 to 1,000,000 kWh and renamed, so the location-based errors cancel to 2.5% (research version: 12% off, which a careful reader might catch).
- 2024 comparison year added, because the fixed question asks "did they go down". The 2024 site data make the decomposition possible and keep the boundary unchanged between years (no divestment in the main path; the Werk 3 baseline case moves to the appendix as optional material).
- Gas Hs/Hi and AdBlue are part of the wrong answer, so Scope 1 also goes wrong in a visible direction (up 6.5% instead of down 2.7%).
- Meter-reading file extended to all month-ends so it cross-checks the corrected annual total (2,260,000 kWh).
- Gas bills show m³ × Zustandszahl × Brennwert with numbers that multiply out exactly.

### 3.8 Trap selection: which are headline, which are background

Headline (a scene each): the month grid (duplicate + missing + two-month bill), the unit "1.240 MWh", the JV boundary, one certificate and two Scope 2 numbers. Background (shown together on the anatomy scene): Hs/Hi, AdBlue. Reserve (appendix and guide only): wrong factor year, averaging rates, supplier Scope 3 number, restated baseline.

### 3.9 Capture protocol before publication

- Hold constant: model and version, tool surface (Claude app with file upload and analysis enabled, or Claude Code), prompt text, factor file, 2024 summary, date.
- Condition A: raw folder. Condition B: ledger + coverage grid + rules. Optional condition C: raw folder without the factor file (shows factors from memory).
- Five runs per condition. Score fixed items: Scope 1, Scope 2 LB, Scope 2 MB, change vs 2024 (LB), and flags for October, duplicate, JV, MWh, Hs basis, AdBlue.
- Publish the per-run table in `aufzeichnungen/` and on the demo page with model, date and prompt.
- If current models with code execution catch some traps, show that as it happened ("caught the duplicate in 3 of 5 runs; never questioned the JV"). The workshop's claim is "the folder decides what even a good model can know", not "AI gets this wrong".

---

## 4. The seven-act spine and the scene list

### 4.1 Acts and minutes

Route stations (the `data-route-stations` attribute): `Wrong answer | Why it failed | The fix | Ask again | Honest limits | Your turn`

| Act | Station | Scenes | Seconds | Minutes | Learner action |
|---|---|---|---|---|---|
| 0 | (before the route) | cover, host, the-case, the-arc | 270 | 4.5 | none |
| 1 | Wrong answer | raw-folder, raw-answer | 510 | 8.5 | vote |
| 2 | Why it failed | month-grid, one-unit, whose-bill, anatomy | 1,005 | 16.75 | three votes, one prediction |
| 3 | The fix | same-and-changed, the-ledger, six-rules, two-scope-2 | 1,020 | 17 | two votes |
| 4 | Ask again | rematch, what-drove-it | 630 | 10.5 | vote |
| 5 | Honest limits | ask-back, limits | 480 | 8 | sort five requests |
| 6 | Your turn | your-bill, resolution | 660 | 11 | write five boxes, callback vote |
| | **Main path** | **20 scenes** | **4,575** | **76.25** | |
| | Questions and slack | | | 13.75 | |

The main path (76.25 min) sits under the standard's limit of slot minus 15% (76.5 min). Longest stretch without a learner action: about 9 minutes (the-ledger to six-rules). Cut list (frees 11.5 min without losing an outcome): drop `host` to one line on `the-case` (−45 s), merge `same-and-changed` into `the-ledger` (−150 s), shorten `anatomy` to the waterfall only (−120 s), shorten `limits` to the label list (−90 s), run `your-bill` as pairs without room sharing (−150 s), run `ask-back` with three requests (−120 s).

### 4.2 Scene list (main path)

Format per scene: id · act · seconds · mode. Titles are plain statements or questions. "Press n" = step n of the step engine. Presenter notes are spoken voice.

---

**1. `cover`** · act 0 · 45 s · listen
- **Title:** ESG Reporting with AI. One question, held fixed.
- **On screen:** graphit cover with the globe (Germany traced in Mennige), kicker "Workshop 04 · <date>", dark q-card with the fixed question, meta line "76 minutes · fictional company · teaching factors".
- **Steps:** 0 only.
- **Presenter note:** "Today we ask one question about one fictional company, and we keep asking it until the end. It is the question your bank or your biggest customer sends you every spring. By the end you will know why the first answer looked right and was not."

**2. `host`** · act 0 · 45 s · listen
- **Title:** Your host
- **On screen:** host card as in W03, plus one line: "Fictional company, invented numbers, teaching factors. No employer data."
- **Presenter note:** "I build the data pipelines that sit behind reports like this one. Nothing you see today comes from a real company, and none of the emission factors are official values. That is on purpose, so you can check every number with a phone calculator."

**3. `the-case`** · act 0 · 105 s · listen
- **Title:** A bank and a customer ask the same question every spring.
- **On screen:** the q-card with the fixed question. Left: Fernholt fact strip (180 staff, three sites, metal parts, €42m). Right: three sender cards, each with an icon: "House bank: Scope 1 and 2 for loan pricing", "OEM customer: supplier questionnaire", "Voluntary standard (VSME-based): energy and Scope 1 and 2". Footer: "Fernholt is outside CSRD scope. It still gets asked."
- **Steps:** press 1 the three senders; press 2 underline "did they go down" in Mennige.
- **Presenter note:** "Fernholt has 180 people, so the EU reporting law no longer covers it. The bank and the car maker still want this number, and they want to know whether it went down. Keep the second half of the question in mind; it is where most of today's trouble sits."

**4. `the-arc`** · act 0 · 75 s · listen
- **Title:** One question, asked twice.
- **On screen:** the arc drawing: raw folder (hatched) → AI → answer 1; prepared ledger (solid ink) → same AI → answer 2. Route stations appear under it. Line: "Same question. Same AI. Same factor table. Only the data state changes."
- **Steps:** press 1 route fades in (`data-route="final"`).
- **Presenter note:** "We ask the AI twice. The first time it gets the folder as Fernholt has it today. The second time it gets the same information, prepared into one table with rules. The model does not change between the two runs."

**5. `raw-folder`** · act 1 · 180 s · listen
- **Title:** What the AI gets: 22 files from 2025.
- **On screen:** folder tree as a list with file-type icons (`i-invoice`, `i-meter`, csv). Counts per folder: Werk Nord electricity 12, Werk Nord gas 1, meter readings 1, Werk Süd 3, Lager Ost 4, fleet 1. Below: "Plus: last year's figures from the consultant, and the factor table." Two bill thumbnails (WebP renderings): a Werk Nord monthly bill and the Werk Süd annual overview.
- **Steps:** press 1 folders expand; press 2 the "12" next to Werk Nord gets a plain ink box (no reveal of the trap yet).
- **Presenter note:** "This is a normal folder: monthly bills from the utility, one annual overview, quarterly statements from the landlord, and a fuel-card export. Twelve bills for Werk Nord, which looks like a full year. We give all of it to the AI, together with last year's figures and a table of emission factors."

**6. `raw-answer`** · act 1 · 330 s · vote
- **Title:** The AI's answer from the raw folder
- **On screen:** q-card; answer card (hatched lane) with the answer text from §3.5; label "Constructed from documented failure modes, not a recorded run" (or the recorded-run label). Right column: five sanity checks with ink ticks: "7.5% below last year", "10.4 t per employee", "12 files in Werk Nord", "shows its sums", "both Scope 2 numbers given".
- **Steps:** press 1 answer; press 2 checks; press 3 room vote.
- **Room vote (`.room-vote`, y 776 to 968):** "Send this to the bank?" Send · Ask back first · Refuse. "Remember your hand."
- **Presenter note:** "Here is the answer. It is down 7.5 percent, the per-head figure looks normal, and there are twelve bills for twelve months. Hands up: who would send this to the bank today? Remember your hand; we come back to it at the end."

**7. `month-grid`** · act 2 · 300 s · vote
- **Title:** Twelve files, eleven months
- **On screen:** site × month grid (rows WN, WS, LO, fleet, gas; columns Jan to Dec). Werk Nord electricity row: March shows "2" (Mennige), October empty and dashed, November and December bracketed as one bill, plus an extra cell off the grid labelled "Talbrück Beschichtung GmbH · 12 months".
- **Steps:** press 1 the empty grid with only the file count "12"; press 2 room vote; press 3 the filled grid; press 4 the two bills with invoice number 4711-03 side by side, with the OCR noise visible; press 5 the meter-reading rows 30.09 and 31.10 → 200,000 kWh.
- **Room vote:** "How many months does the Werk Nord folder cover?" 12 · 11 · Can't tell from the file count.
- **Presenter note:** "Twelve files is not twelve months. March is in twice, because purchasing forwarded the same invoice and someone scanned it again. October is missing, and the November and December bill covers two months in one file, so the count still comes out at twelve. The facility manager's meter file has October: 200,000 kilowatt hours."

**8. `one-unit`** · act 2 · 240 s · vote
- **Title:** What does "1.240 MWh" mean?
- **On screen:** crop of the Werk Süd annual overview (WebP) with the line "Verbrauch 2025: 1.240 MWh" in Mennige outline. Three option cards.
- **Steps:** press 1 room vote; press 2 reveal C; press 3 the effect bar: 1,240 kWh vs 1,240,000 kWh; "−495.5 t location-based".
- **Room vote:** A) 1.24 MWh · B) 1,240 kWh · C) 1,240 MWh = 1,240,000 kWh.
- **Presenter note:** "On a German bill the dot is a thousands separator, so this is one thousand two hundred forty megawatt hours. A and B are the same mistake by a factor of a thousand, and they make Fernholt's second-largest site almost disappear: minus 495 tonnes. The fix is dull: keep the original value and unit in the row, and let a fixed rule convert it."

**9. `whose-bill`** · act 2 · 195 s · vote
- **Title:** Whose bill is this?
- **On screen:** the Talbrück annual bill (WebP), addressee line highlighted: "Talbrück Beschichtung GmbH, Halle 3". Side note: "Fernholt holds 40%. The partner runs it. Fernholt's purchasing handles the contract."
- **Steps:** press 1 room vote; press 2 reveal; press 3 effect: "+1,000,000 kWh, +400.0 t location-based, +600.0 t at residual mix".
- **Room vote:** Include 100% (it's in our folder) · Include 40% (our share) · Leave it out and note it (operational control).
- **Presenter note:** "Under the operational control approach Fernholt chose, this bill is out, because the partner runs the plant. Forty percent would be right only if Fernholt had chosen the equity-share approach, and that choice gets written down before anyone opens the folder. The AI can flag a different company name on a bill; it cannot decide your boundary."

**10. `anatomy`** · act 2 · 270 s · vote (prediction)
- **Title:** Six errors, 48.7 tonnes apart
- **On screen:** at step 0 a prediction band: "How far is the AI's total from the right one?" Then the waterfall from 1,866.5 to 1,915.2 (§3.5), bars in ink, the running-total line in slate, the final bar solid ink. Two small cards at the right for the background traps: "Gas bill says Brennwert (Hs); the AI picked a Hi factor: +41.8 t" and "AdBlue is not diesel: +3.0 t".
- **Steps:** press 1 room vote (prediction); press 2 duplicate and October bars (+82.0, −80.0); press 3 JV and unit bars (−400.0, +495.5); press 4 gas and AdBlue (−41.8, −3.0); press 5 the band 1,464.5 to 1,960.0 in Mennige with "The total was right by accident."
- **Room vote:** Less than 5% · About 10% · More than 20%.
- **Presenter note:** "Six errors, and the total ends up only 2.5 percent off. Two pairs cancel almost exactly: the duplicate and the missing month, and the joint-venture bill and the unit error. That is why no sanity check on the total caught it; next year the errors will not line up so kindly."

**11. `same-and-changed`** · act 3 · 150 s · listen
- **Title:** What stayed the same, and what changed
- **On screen:** W03's controlled-comparison layout. "Same": question, AI (model named), prompt, factor table, 2024 figures. "Changed": 22 raw files → one ledger, one coverage grid, one page of rules.
- **Steps:** press 1 "same" column; press 2 "changed" column.
- **Presenter note:** "Before we fix anything, here is what we hold constant: the question, the model, the prompt and the factor table. The only thing we change is how the data arrives. If the second answer is better, the data preparation earned it."

**12. `the-ledger`** · act 3 · 300 s · listen / do (call-out)
- **Title:** One row per quantity, and every row points to a page
- **On screen:** ledger excerpt with 8 visible columns: `row_id`, `entity_on_document`, `period`, `qty_source`, `unit_source`, `qty_norm`, `status`, `source (file · quote)`. Rows E-WN-03, E-WN-03D (excluded), E-WN-10 (meter, B), E-TB-01 (excluded), E-WS-01 (1.240 MWh → 1,240,000 kWh), G-WN-01 (Hs), D-FL-02 (AdBlue, excluded). One row expanded to show the bill crop with the quoted line highlighted.
- **Steps:** press 1 columns; press 2 the three excluded rows; press 3 the expanded evidence; press 4 the room call-out "Which column would have caught the JV bill?" (answer: `entity_on_document`).
- **Presenter note:** "A ledger is a table with one row for each quantity on a document. Excluded rows stay in the table with a reason, so anyone can see what was left out and why. Every row names the file and quotes the line it came from."

**13. `six-rules`** · act 3 · 300 s · vote
- **Title:** Six rules written down before the AI runs
- **On screen:** the six rules from §3.3 as numbered rows, each with its trap icon. Right: the pinned factor table excerpt with IDs, source, year, region, and "teaching values" label.
- **Steps:** press 1 rules 1 to 3; press 2 rules 4 to 6; press 3 room vote on factors; press 4 reveal C with the effect: "Last year's factor (0.42) on 2025 electricity adds 72.2 t, the whole grid effect in this year's change."
- **Room vote:** "Where should the grid factor come from?" The AI knows it · The AI searches the web · A pinned table; the AI only picks an ID.
- **Presenter note:** "The rules are plain sentences a controller would agree with. The factor rule matters most for the comparison: the AI picks an ID from our table and never types a factor from memory. Last year's factor looks almost the same and would wipe out the entire grid effect we are about to find."

**14. `two-scope-2`** · act 3 · 270 s · vote
- **Title:** One certificate, two Scope 2 numbers
- **On screen:** the HKN confirmation crop ("1.240 MWh … Werk Süd"). A stacked bar of Fernholt's 3,610 MWh: Werk Süd 1,240 (34%) covered, WN + LO 2,370 uncovered.
- **Steps:** press 1 room vote; press 2 reveal C: location-based 1,444.0 t, market-based 1,422.0 t; press 3 wrong options: A = 0 t, B = 948.0 t (474.0 t too low); press 4 claim line: "'100% green electricity' is false. 34% is true."
- **Room vote:** A) Market-based = 0 for the whole company · B) 0 for Werk Süd, grid average for the rest · C) 0 for Werk Süd, residual mix for the rest, and location-based as well.
- **Presenter note:** "Location-based uses the grid average wherever the power is used. Market-based uses what you bought, and the certificate covers Werk Süd only; every other kilowatt hour gets the residual mix. Report both numbers, every time, and do not let one certificate turn into a sentence about the whole company."

**15. `rematch`** · act 4 · 270 s · listen
- **Title:** The same question on the ledger
- **On screen:** q-card "Unchanged"; answer card (solid ink lane) with the rematch text (§3.6), row IDs visible; slate check column "Recalculated in the spreadsheet: 1,444.0 ✓ 1,422.0 ✓ 471.2 ✓". Side-by-side mini table: raw folder 1,866.5 t / −7.5% vs ledger 1,915.2 t / −5.1% (location-based) and 1,893.2 t / −29.2% (market-based).
- **Steps:** press 1 answer; press 2 check; press 3 side-by-side; press 4 "Known gap" line from the captured run.
- **Presenter note:** "Same question, same model. This time every figure names its rows, the meter reading is labelled as a meter reading, and both Scope 2 numbers use the right method. The total moved by only 48.7 tonnes; what changed is that we can now show where each tonne comes from."

**16. `what-drove-it`** · act 4 · 360 s · vote
- **Title:** What actually made the number go down?
- **On screen:** two bridges, 2024 → 2025. Location-based: 2,017.5 → grid factor −72.2 → own use −30.1 → 1,915.2. Market-based: 2,674.5 → certificates −744.0 → own use −37.3 → 1,893.2. The AI's sentence from Ask 1 struck through in ink ("mainly thanks to efficiency measures"). Line: "No production volumes in the folder: 'used less' is supported, 'more efficient' is not."
- **Steps:** press 1 room vote; press 2 location-based bridge; press 3 market-based bridge; press 4 the rewritten sentence (below).
- **Room vote:** "What made location-based emissions fall 102.3 t?" Our efficiency measures · A cleaner grid · We produced less.
- **Rewritten sentence on screen:** "Scope 1 and 2 fell 5.1% location-based (−102.3 t). 72.2 t of that comes from a lower grid factor, 30.1 t from using less electricity, gas and diesel. Market-based fell 29.2%, 744.0 t of it because guarantees of origin cover Werk Süd since January 2025."
- **Presenter note:** "Seventy-one percent of the drop is the German grid getting cleaner, which is real but not Fernholt's doing. The market-based drop is almost all the certificate for Werk Süd. Fernholt's own use fell by about 30 tonnes, and without production figures nobody can call that efficiency yet."

**17. `ask-back`** · act 5 · 300 s · do (sort)
- **Title:** Calculate, ask back or refuse?
- **On screen:** five request cards, sorted into three columns (Calculate from the ledger / Ask back / Refuse or rewrite):
  1. "Sum Scope 2 for 2025." → Calculate: both numbers, with rows.
  2. "Fill in October." → Ask back: meter reading or an estimate with a stated method, labelled.
  3. "Write that we run on green electricity." → Rewrite: "34% of our electricity, at Werk Süd."
  4. "Write that we are climate-neutral." → Refuse (offset-based claims; EU consumer rules apply from 27 Sep 2026).
  5. "Explain why emissions fell." → Calculate first (the bridge), then draft citing rows.
- **Steps:** press 1 cards unsorted; press 2 to 4 each column fills (after the room calls out).
- **Presenter note:** "A useful assistant does three different things, and you should expect all three. It calculates what the ledger supports, asks back where a person has to decide, and refuses claims the evidence cannot carry. Since yesterday, the climate-neutral sentence is also a legal risk in consumer marketing."

**18. `limits`** · act 5 · 180 s · listen
- **Title:** What this does not prove
- **On screen:** five labelled rows:
  - "One fictional case. The raw-folder answer is constructed (or: recorded, n runs, date)."
  - "Published ESG extraction systems get about 3 in 4 numbers right (ESGReveal 76.9%, ESG Insight 78.2%)."
  - "A ledger makes a number checkable. A wrong bill stays wrong."
  - "The 2024 figures are the consultant's summary, grade B, with no bills attached."
  - "Teaching factors, not official values. Not legal or audit advice. Rules as of 26 Sep 2026."
- **Presenter note:** "Here is what today does not show. It does not show that any tool gets this right or wrong in general, and the ledger does not make a bad bill good. It makes every number traceable, so the next person can find the mistake."

**19. `your-bill`** · act 6 · 480 s · write / pair
- **Title:** Your turn: one bill, five boxes
- **On screen:** the transfer sheet (§6.3) with the Werk Süd worked example in grey beside each box. Line: "Use an invented or anonymised bill. Do not enter company data into any tool."
- **Steps:** press 1 to 5 each box is highlighted in turn ("Now: Source", "Now: Period", …); press 6 "Compare with a partner. Two pairs share their hardest box."
- **Timing:** 6 min alone, 2 min pairs (the room shares during `resolution` if time allows).
- **Presenter note:** "Take one bill you know from your own work, or invent a realistic one. Fill the five boxes: where it comes from, which period, which unit, whether it is inside your boundary, and which factor with which year. Then tell your neighbour which box was hardest."

**20. `resolution`** · act 6 · 180 s · vote (callback)
- **Title:** What changed between the two answers?
- **On screen:** both answers side by side (hatched vs solid ink), both totals, both "did they go down" lines, and the four questions to ask any AI tool: "Does each number link to its document? Which factor version? What was excluded, and why? Who approved it?" Closing sentence template from the transfer sheet.
- **Steps:** press 1 side by side; press 2 callback room vote; press 3 four questions.
- **Room vote:** "Send the raw-folder answer to the bank now?" Send · Ask back first · Refuse. (Callback to scene 6.)
- **Presenter note:** "At the start, many of you would have sent the first number. It was close to right and the explanation was wrong. The second answer is a number you can defend line by line, and a sentence about the change that says who caused what."

### 4.3 Appendix scenes (data-kind="appendix", 0 s, reached from notes)

**A1. `appendix-arithmetic`** · Title: "Every calculation on one page" · The full arithmetic of §3.4 and §3.5 as a two-column sheet (2024 | 2025). Note: "For questions like 'where does 1,422 come from?'"

**A2. `appendix-factors`** · Title: "Where real factors come from" · Teaching table next to real sources: UBA grid factor (published yearly; 433 / 386 / 363 g CO₂/kWh for 2022 to 2024), AIB residual mix (new each May; 2025 results published 26 May 2026), DESNZ (UK only for electricity), IEA and ecoinvent (licensed; may not be pasted into external tools or a kit). Note: "Always source, version, year, region, licence."

**A3. `appendix-run-record`** · Title: "How the two answers were produced" · Model, tool, date, prompt, files per condition, five runs each, per-trap catch table. Until captured: "Constructed from documented failure modes. Capture planned before publication."

**A4. `appendix-regulation`** · Title: "What is true on 26 September 2026" · The statements of §8 with sources and the footer "Check before you present: German CSRD transposition, Green Claims Directive status, GHG Protocol timeline."

**A5. `appendix-claims`** · Title: "Six sentences from an AI draft, checked" · The claims table from research §11.3, adapted to this case: efficiency attribution (misleading), "100% green electricity" (false; 34%), climate-neutral (remove), "Scope 1 rose due to heating demand" (false cause; gas kWh −2.8%), accident rate averaged across sites (56.8 vs 34.7 per million hours), "all suppliers assessed" (unsupported).

**A6. `appendix-steel`** · Title: "Which number from the supplier's reply?" · Scope 3 hotspot, research §10: 2,400 t steel both years; supplier-specific 1.650 kg CO₂e/t → 3,960 t; Scope 1+2 intensity 0.12 → 288 t (−93%); spend-based nominal 5,184 t "+20%" while tonnage was flat. Steel alone is larger than Scope 1 and 2 combined.

### 4.4 Presenter-notes schema per scene

Every `data-note-key` gets `say`, `sayAt`, `ask` (for the votes above, with `options` and `expected`), `expectedAudience`, `revealOrder` (one line per step, step 0 included), `cut`, and `appendixRoutes` (e.g. `raw-answer` → `appendix-run-record`; `six-rules` → `appendix-factors`; `rematch` → `appendix-arithmetic`; `ask-back` → `appendix-claims`; `limits` → `appendix-regulation`). `revealOrder` and `cut` are required once an entry exists (map-deck-engine §2.5). Namespace: `esg-berichte-mit-ki-deck` / `-presenter`.

### 4.5 Visual encodings (design-direction §7.7)

Hatch = raw input (bills, exports). Solid ink = ledger row or approved figure. Slate = recalculation check. Dashed = estimate, meter reading or missing month. Mennige = the one figure under discussion per step. New pictograms in the sprite style: `i-invoice`, `i-meter`, `i-factor`, `i-scope`, `i-certificate`.

---

## 5. Interactive demo (`demo.html`)

**The one question at the top:** "How can a total be almost right when six of its parts are wrong?"

Self-contained static HTML, W03 design system, data inline as a JS object, no `fetch`, no storage, no inline handlers, no iframes. **Final state visible on load:** both answers, the full waterfall, all traps shown as fixed, the bridge. Nothing waits for a "play" button. Replay animation is optional per section. Label at the top: "Fictional company · teaching factors · raw-folder answer constructed (or recorded on <date>, <model>, run k of 5)."

### Sections

1. **The question and the two answers.** q-card; two lanes side by side (hatched raw folder, solid ink ledger) with Scope 1, Scope 2 LB, Scope 2 MB, total and "vs 2024". Differences in Mennige only on the one figure the learner is looking at.

2. **Trap switches and the waterfall (the core).** Seven rows, each a switch: duplicate March, October missing, two-month bill (switch shows "0 t, hides the gap"), JV included, MWh misread, Hi factor, AdBlue. On load all are **off** (the correct state) and the waterfall shows the stored path from 1,866.5 to 1,915.2. Turning a trap **on** adds its bar and moves the running total live; a meter at the right shows "distance from the right answer" in t and %, and a second meter shows "change vs 2024". A method selector switches the chart between location-based and market-based (in market-based the MWh switch shows "no effect here" and an extra switch "grid average instead of residual mix" appears). Preset buttons: "The AI's raw-folder run" (switches on the six that fired), "All fixed". Learning moment: switching on only the JV (+400 t, total 2,315.2 t, +14.8% vs 2024) makes the number obviously wrong; switching on the MWh error as well brings it back to "plausible".

3. **Open a document.** Folder tree on the left (22 files). Selecting a file shows its text rendering in a bill layout, with the quoted line highlighted, and below it the ledger row(s) it produced, status chip (actual / meter / excluded + reason) and factor ID. For the duplicate, both bills show side by side with the matching invoice number marked. For October, the "missing" slot opens the two meter-file rows and the subtraction.

4. **The coverage grid.** Site × month grid, final state filled (Oct = meter reading, dashed). A toggle "as the folder arrived" shows the raw state: March 2, October empty, Nov/Dec bracket, JV cell off the grid.

5. **What drove the change.** Two bridges (LB and MB), 2024 → 2025, with the rewritten sentence under them and the struck-through AI sentence. Tapping a bar shows its arithmetic line and the ledger rows behind it.

6. **Run record.** Model, date, prompt text (collapsible), files per condition, per-run table. If not captured: the "constructed" label and the capture protocol in three lines.

### Mobile behaviour (390 px)

- Lanes stack (raw folder first, ledger second), each with its total in large tabular figures.
- The waterfall turns into a vertical list of rows: trap name, switch, signed bar growing left or right from a centre line, running total at the row end. The two meters stick to the top of the section while it is in view.
- The document viewer becomes a list; tapping a file opens it full width with a "Back to folder" link; the ledger row sits under the document.
- The coverage grid scrolls horizontally inside its own frame only (months), with the site column pinned; no page-level horizontal scroll.
- Controls are at least 44 px high; switches have visible text "on/off"; everything works with keyboard and screen reader (switch = `button[aria-pressed]`).
- Reduced motion: bars change without animation.

Time budget: 10 minutes. Linked from `anatomy` and `rematch` notes and from the web page as optional.

---

## 6. Learner guide, field card, transfer sheet, kit

### 6.1 Learner guide (`guide.html`, phone-first, about 2,200 words, 20 to 25 min read)

Structure mirrors the acts. Each section: the question, a short answer, a "Reveal the explanation" retrieval prompt (details/summary), one key point. The workshop-family frame (`wf-strip`) at the top.

1. **The question** · Why a 180-person firm gets asked · Fernholt in five lines · the fixed question.
2. **The first answer** · The folder, the answer, the five checks it passed · Reveal: "Which check would you have trusted most?"
3. **Twelve files, eleven months** · Duplicate, missing October, the two-month bill · Reveal: "Why did the Werk Nord sum end up only 5,000 kWh off?"
4. **A dot that means a thousand** · "1.240 MWh" · Reveal: "What does the misread do to market-based?" (nothing; Werk Süd is 0 there)
5. **Whose bill is it?** · Operational control vs equity share · Reveal: "When would 40% be right?"
6. **Why the total looked right** · The waterfall · Reveal: "Which two pairs cancel?"
7. **The ledger** · Columns and why excluded rows stay · Reveal: "Which column catches the JV bill?"
8. **Six rules and a pinned factor table** · Reveal: "What happens with last year's grid factor?" (+72.2 t)
9. **Two Scope 2 numbers** · Location-based vs market-based · Reveal: "Why is 948 t wrong?"
10. **The rematch** · The answer with row IDs.
11. **What drove the change** · The two bridges · Reveal: "Why can't we say 'efficiency'?"
12. **Calculate, ask back, refuse** · Five requests.
13. **Limits** · What the case does not prove · regulation as of 26 Sep 2026 (compact, with sources).
14. **Your bill** · Link to the transfer sheet and field card.
15. **After a week** (follow-up) · Four recall questions with reveals: "Name the unique key for a bill." "What gets the residual mix?" "Which part of a year-on-year change is not your doing?" "What does a good assistant do when a month is missing?" Stretch task (30 min): build the ledger from `rohdaten_2025/` yourself, compare with `erwartet/belegtabelle_2025.csv`.
16. **Glossary** · Scope 1, 2, 3; location-based; market-based; residual mix; guarantee of origin (Herkunftsnachweis); operational control; equity share; Brennwert (Hs) / Heizwert (Hi); activity data; emission factor; ledger (Belegtabelle); coverage grid; data-quality grade A/B/C; VSME; CSRD; EmpCo.

### 6.2 Field card (`field-card.html`, one A4 page, print CSS): "Before you trust an ESG number"

Seven blocks. Each: the check, a Do line, a Don't line, one number from the case, and the scene it comes from.

| # | Check | Do | Don't | Case number | Scene |
|---|---|---|---|---|---|
| 1 | Months, not files | Fill a site × month grid before summing | Count files and call the year complete | 12 files, 11 months | month-grid |
| 2 | One bill once | Key = invoice no. + period + meter | Trust that a rescanned bill looks different | +205,000 kWh | month-grid |
| 3 | Unit as printed | Keep original value and unit next to kWh | Convert in your head or in the prompt | "1.240 MWh" = −495.5 t if misread | one-unit |
| 4 | Whose name is on it | Check the addressee against your written boundary | Include what sits in your folder | +400.0 t | whose-bill |
| 5 | Factor with ID and year | Pick from a pinned table: source, year, region, basis (Hs/Hi) | Let the AI supply a value | Last year's factor: +72.2 t | six-rules |
| 6 | Two Scope 2 numbers | Location-based and market-based; certificates only for the kWh they cover | Turn one certificate into "green power" | 1,444.0 t and 1,422.0 t; 34% covered | two-scope-2 |
| 7 | Split the change | Grid factor, certificates, own use; say which is yours | Write "efficiency" without production data | −102.3 t: 72.2 grid, 30.1 own use | what-drove-it |

Footer: "Fictional case, teaching factors. Rules as of 26 Sep 2026. Not legal or audit advice."

### 6.3 Transfer sheet (`transfer.html` + `vorlagen/transfer.md`, one A4)

Header: "One bill, five boxes. Use an invented or anonymised bill. No company data in any tool."

| Box | Prompt | Worked example (Fernholt, Werk Süd) |
|---|---|---|
| 1 Source | File, page, the exact line you read | `Jahresuebersicht_2025_Oekostrom.md`, p. 1, "Verbrauch 2025: 1.240 MWh" |
| 2 Period | From, to, months covered; gaps or overlaps with other bills | 01.01.2025 to 31.12.2025, 12 months, no overlap |
| 3 Unit | Value and unit as printed → normalised value, and the rule used | 1.240 MWh → 1,240,000 kWh (MWh × 1,000; German thousands dot) |
| 4 Boundary | Legal entity on the document; in or out; which rule | Fernholt Präzisionsteile GmbH, Werk Süd; in; operational control |
| 5 Factor | Factor ID, source, year, region, method; any certificate | LB: F-EL-LB-2025 (teaching value 0.40); MB: 0 under I-WS-GO (HKN 1,240 MWh, cancelled) |

Closing sentence template:
- EN: "This number comes from [document, line], covers [period], was converted by [rule], belongs to [entity] under [boundary rule], and uses [factor ID, year]. Still open: [one thing]."
- DE: „Diese Zahl stammt aus [Beleg, Zeile], deckt [Zeitraum] ab, wurde mit [Regel] umgerechnet, gehört zu [Gesellschaft] nach [Grenzregel] und nutzt [Faktor-ID, Jahr]. Noch offen: [eine Sache]."

### 6.4 Kit (`esg-kit.zip`, text only, target < 200 KB)

All entries are CSV, MD, TXT or HTML without active content (no fetch, storage, `innerHTML`, `eval`, `window.open`). No forbidden basenames (`notes.md`, `todo.md`, `claude.md`, …). ASCII file names, no umlauts, no 40+ character mixed tokens.

| Path | Purpose |
|---|---|
| `START-HERE.md` | Five lines: what to open first; the fixed question; "all data fictional, factors are teaching values"; which file answers which scene |
| `LICENSE.txt` | Licence for the teaching data and text |
| `CHANGELOG.md` | Dated versions; date of the last AI capture with model name |
| `rohdaten_2025/Werk_Nord/Strom/*.md` (12) | Text-rendered electricity bills incl. duplicate scan, two-month bill, JV bill |
| `rohdaten_2025/Werk_Nord/Gas/Gas_Jahresrechnung_WN_2025.md` | Gas bill with m³, Zustandszahl, Brennwert, kWh Hs |
| `rohdaten_2025/Werk_Nord/Zaehlerstaende_2025.csv` | Month-end meter readings (source for October) |
| `rohdaten_2025/Werk_Sued/*.md` (3) | Annual electricity overview in MWh, HKN confirmation, gas bill |
| `rohdaten_2025/Lager_Ost/*.md` (4) | Landlord's quarterly sub-meter statements |
| `rohdaten_2025/Flotte/Tankkarten_2025.csv` | Fuel-card transactions incl. AdBlue, car washes, shop |
| `vorjahr/THG_2024_Zusammenfassung.csv` | Consultant's 2024 figures by site and carrier |
| `faktoren/faktoren_lehrwerte.csv` | Pinned teaching factors: id, value, unit, basis, year, region, source note, "not official" |
| `belegtabelle/belegtabelle_2025_leer.csv` | Empty ledger with headers and one worked row (faded practice: 1 worked, 1 half-filled, rest alone) |
| `belegtabelle/abdeckung_standort_monat_leer.csv` | Empty coverage grid |
| `belegtabelle/grenzen_und_regeln.md` | The six rules and the boundary decision |
| `prompts/01_auslesen.md` | Extraction prompt (below) |
| `prompts/02_pruefen.md` | Checking prompt (below) |
| `prompts/03_textentwurf.md` | Narrative prompt (below) |
| `vorlagen/datenanfrage_email.md` | Data request e-mail templates (below) |
| `vorlagen/transfer.md` | The five-box transfer sheet |
| `vorlagen/merkkarte.md` | Field card as Markdown |
| `erwartet/belegtabelle_2025.csv` | Expected ledger, all rows incl. excluded ones |
| `erwartet/abdeckung_standort_monat.csv` | Expected coverage grid |
| `erwartet/ergebnisse_2025.md` | Correct answers with full arithmetic (§3.4) |
| `erwartet/wasserfall.csv` | Trap effects and running totals, LB and MB |
| `erwartet/zerlegung_2024_2025.csv` | Driver split, LB and MB |
| `aufzeichnungen/lauf_rohordner.md`, `aufzeichnungen/lauf_belegtabelle.md` | Captured runs: model, date, prompt, answers, trap flags (or "constructed" with the protocol) |

**Prompt pack (text as shipped; EN with DE versions in the same files):**

`prompts/01_auslesen.md` (extraction)
```
You read energy documents and return rows. You do not add, estimate or convert.
For each quantity on each document return one row as CSV with these columns:
source_file; source_page; source_quote; entity_on_document; invoice_no; meter_id;
period_start; period_end; qty_as_printed; unit_as_printed; basis_as_printed; carrier
Rules:
- source_quote is the exact line you read, copied character for character.
- qty_as_printed keeps the German format as printed (e.g. "1.240").
- If a field is not on the document, write NOT_ON_DOCUMENT. Never guess.
- One document can give several rows. A document with no quantity gives one row with a note.
After the table, list every document you could not read and why.
```

`prompts/02_pruefen.md` (checking)
```
You check an extracted table against the rules in grenzen_und_regeln.md. You do not fix anything.
Return a list of flags, each with row IDs and the rule it breaks:
1. Coverage: build the site x month grid. Name every month that is missing, doubled or split.
2. Duplicates: rows with the same invoice number, period and meter.
3. Units: every unit other than kWh or l, and every number in German format; state the reading you propose.
4. Boundary: every entity_on_document that is not on the site list.
5. Basis: every gas row, with its basis (Hs or Hi) and the matching factor ID.
6. Anomalies: month-to-month changes above 25% per site; suggest a question for a person to answer.
End with: "Ready to sum: yes/no", and if no, the decisions a person has to make.
```

`prompts/03_textentwurf.md` (narrative)
```
You draft sentences for a report from the approved ledger and the driver table only.
- Every sentence with a number ends with the row IDs or driver line it uses, in brackets.
- Report Scope 2 location-based and market-based together.
- When you explain a change, use only the drivers in zerlegung_2024_2025.csv, and name
  which part is not the company's own action (grid factor, certificates).
- Do not use: climate-neutral, CO2-neutral, green, eco-friendly, sustainable, "100%",
  efficiency (unless production data are in the ledger).
- If a sentence needs a fact that is not in the ledger, write it as a question for a person.
```

**Data request e-mail (`vorlagen/datenanfrage_email.md`, German, two variants):**

Variant 1, to the utility (missing invoice):
```
Betreff: Rechnung Oktober 2025, Zählpunkt [Zählpunkt], Kundennummer [Nr.]

Guten Tag,
für unsere Energie- und Emissionsbilanz 2025 fehlt uns die Stromrechnung für den
Zeitraum 01.10.2025 bis 31.10.2025 (Rechnungsnummer vermutlich [4711-10]).
Bitte schicken Sie uns die Rechnung oder eine Verbrauchsübersicht mit
Zeitraum, Menge in kWh und Zählpunkt bis zum [Datum].
Falls die Abrechnung mit einem anderen Zeitraum zusammengefasst wurde,
nennen Sie uns bitte den Zeitraum.
Vielen Dank
[Name], [Funktion], [Telefon]
```

Variant 2, to a landlord or JV partner (boundary and sub-meter):
```
Betreff: Stromverbrauch 2025, Unterzähler [Nr.]

Guten Tag,
für unsere Bilanz 2025 brauchen wir je Quartal die Menge in kWh für den
Unterzähler [Nr.], den Zeitraum und den Namen der Gesellschaft, auf die der
Zähler läuft. Bitte teilen Sie uns außerdem mit, ob es sich um einen Ökostromtarif
handelt und ob dafür Herkunftsnachweise entwertet wurden (Menge, Erzeugungsjahr).
Vielen Dank
[Name]
```
(Placeholder addresses only `@example.com`, per the repository's content rules.)

### 6.5 Other static files in the bundle

`slides.html`, `presenter.html`, `guide.html`, `demo.html`, `field-card.html`, `transfer.html`, `esg-kit.zip`, `card-preview.webp` (1024×576), `assets/bills/*.webp` (rendered bill crops, manifest rows required), `PUBLICATION.md` (provenance). No PDF anywhere; "print to PDF" is left to the learner's browser.

---

## 7. Web detail page content

Registry rules: no en/em dashes, summary ≤ 160 characters, exactly 3 decision-lab facts, duration `~90 Minuten` / `~90 minutes`, `accessNote` ≤ 2 sentences, material labels without parentheses or "English", non-HTML labels end in `.zip`. Banned outcome verbs: verstehen, kennen(lernen), understand, know, learn about.

### 7.1 German (du-form)

- **title:** ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen
- **eyebrow:** Workshop 04 · ESG-Berichte
- **summary (148 characters):** Dieselbe Frage nach Scope 1 und 2 an einen Ordner voller Rechnungen und an eine Belegtabelle. Du siehst, welche Fehler sich in der Summe verstecken.
- **description:**
  Die fiktive Fernholt Präzisionsteile GmbH (180 Beschäftigte, drei Standorte) will wissen, wie hoch ihre Scope-1- und Scope-2-Emissionen 2025 waren und ob sie gegenüber 2024 gesunken sind. Auf den Ordner mit 22 Rechnungen und Exporten antwortet die KI mit 1.866,5 t CO₂e, 7,5 % weniger als im Vorjahr. Die Zahl liegt nur 2,5 % neben der richtigen, obwohl sechs Fehler darin stecken: eine doppelte Märzrechnung, ein fehlender Oktober, die Rechnung eines Gemeinschaftsunternehmens, „1.240 MWh" als 1.240 kWh gelesen, ein Gasfaktor auf der falschen Basis und AdBlue als Diesel gezählt. Mit einer Belegtabelle, sechs Regeln und festen Faktoren beantwortet dieselbe KI die Frage richtig: 1.915,2 t standortbasiert (−5,1 %) und 1.893,2 t marktbasiert (−29,2 %). Danach zerlegst du die Veränderung. 72,2 t des Rückgangs kommen vom Strommix, 744,0 t der marktbasierten Senkung von Herkunftsnachweisen für einen Standort, 30,1 t vom eigenen Verbrauch. Alle Zahlen sind erfunden, die Faktoren sind Lehrwerte.
- **format:** Interaktiver Kurs
- **duration:** ~90 Minuten
- **accessNote:** Kurs, Demo und Kit brauchen kein Konto und keine Installation; das Material ist auf Englisch, die Belege im Kit sind deutsche Rechnungen. Die gezeigte KI-Antwort auf den Rohordner ist aus dokumentierten Fehlerarten konstruiert und keine Live-Abfrage.
  (After capture, replace the second sentence with: „Die gezeigten KI-Antworten wurden am <Datum> mit <Modell> aufgezeichnet und sind keine Live-Abfragen.")
- **outcome (artefact):** Fünf-Felder-Blatt für eine eigene Rechnung
- **outcomes:**
  1. Du baust für einen Standort eine Monatstabelle und findest doppelte, fehlende und zweimonatige Rechnungen, bevor jemand summiert.
  2. Du schreibst eine Zeile einer Belegtabelle: Quelle mit zitierter Zeile, Zeitraum, Wert und Einheit wie gedruckt, Gesellschaft mit Grenze, Faktor mit Jahr.
  3. Du rechnest Scope 2 standortbasiert und marktbasiert aus und nennst, für welche Kilowattstunden ein Herkunftsnachweis gilt.
  4. Du zerlegst die Veränderung zum Vorjahr in Strommix, Herkunftsnachweise und eigenen Verbrauch und schreibst dazu einen Satz, der jede Zahl belegt.
- **agenda (steps, minutes):**
  - 01 · Die Frage und die erste Antwort · 13 Min. · Du siehst den Ordner und die Antwort der KI und stimmst ab, ob du sie an die Bank schicken würdest. · tool: Kurs · Die falsche Antwort
  - 02 · Warum die Summe trotzdem passt · 17 Min. · Du prüfst Monate, Einheit und Grenze in drei Abstimmungen und siehst, wie sich sechs Fehler bis auf 48,7 t aufheben. · tool: Kurs · Der Fehler
  - 03 · Belegtabelle, Regeln, zwei Scope-2-Zahlen · 17 Min. · Du siehst, welche Spalten jede Falle abfangen, und entscheidest, woher der Stromfaktor kommt und was ein Herkunftsnachweis abdeckt. · tool: Kurs · Die Reparatur
  - 04 · Dieselbe Frage noch einmal, und was die Zahl gesenkt hat · 11 Min. · Du vergleichst beide Antworten und zerlegst den Rückgang in Strommix, Nachweise und eigenen Verbrauch. · tool: Kurs · Noch einmal fragen
  - 05 · Rechnen, nachfragen, ablehnen · 8 Min. · Du sortierst fünf Aufträge an die KI, darunter „Schreib, dass wir klimaneutral sind". · tool: Kurs · Grenzen
  - 06 · Deine Rechnung in fünf Feldern · 11 Min. · Du füllst das Transferblatt für eine erfundene oder anonymisierte eigene Rechnung und vergleichst es mit einer Partnerin oder einem Partner. · tool: Transferblatt
  - 07 · Optional: die Fallen selbst schalten · 10 Min. · In der Demo schaltest du jede Falle einzeln ein und siehst, wie weit sich die Summe bewegt. · tool: Interaktive Demo · etwa 10 Minuten
  - Program 76 min + 14 min questions.
- **Du brauchst:** Einen Browser, für die Folien am besten einen großen Bildschirm im Querformat · Papier und Stift für die fünf Felder · einen Taschenrechner oder das Handy.
- **Du brauchst nicht:** Programmierkenntnisse · Vorwissen zur THG-Bilanz über „Scope 1 und 2" hinaus · ein KI-Konto · eigene Firmendaten (alles ist erfunden und im Kit).
- **Nicht in diesem Workshop:** Keine Rechtsberatung und keine Prüfung durch Wirtschaftsprüfer. Kein Durchgang durch CSRD oder ESRS. Keine vollständige Scope-3-Bilanz (ein Stahl-Beispiel steht im Anhang). Keine amtlichen Emissionsfaktoren: Die Lehrwerte dienen nur der Rechnung im Kurs. Kein Vergleich von ESG-Software.
- **audience (3):**
  - Nachhaltigkeits-, Finanz- und Controlling-Teams im Mittelstand, die Scope 1 und 2 für Bank oder Kunden liefern
  - Betriebs- und Energieverantwortliche, bei denen die Rechnungen liegen
  - Einsteiger ohne Programmier- oder Statistikkenntnisse
- **decisionLab:**
  - kicker: Entscheidung 01 · Rohdaten
  - title: 1.866,5 Tonnen, 7,5 % weniger als 2024. Weiterschicken?
  - prompt: Die KI hat alle Rechnungen im Ordner gelesen und meldet für 2025 1.866,5 t CO₂e, 7,5 % unter dem Vorjahr. Die Bank wartet auf die Zahl. Was tust du?
  - facts (exactly 3): „KI-Antwort 2025: 1.866,5 t CO₂e" · „Vorjahr 2024: 2.017,5 t CO₂e" · „Ordner Werk Nord: 12 Stromrechnungen"
  - decisionLegend: Deine erste Entscheidung · evidenceLegend: Der stärkste Beleg
  - choices:
    - `check-coverage`: Erst je Standort eine Monatstabelle bauen und jede Rechnung einmal zählen, dann rechnen.
    - `send-total`: Die Zahl schicken: Sie liegt nah am Vorjahr und die KI zeigt ihre Summen.
    - `ask-again`: Die KI bitten, noch einmal genauer zu rechnen, und die zweite Zahl schicken.
  - evidence:
    - `files-not-months`: Zwölf Dateien sagen nicht, ob zwölf Monate abgedeckt sind. Eine Rechnung kann doppelt sein, eine fehlen.
    - `close-to-last-year`: Die Zahl liegt nur 7,5 % unter dem Vorjahr, das ist ein normales Jahr.
    - `shown-sums`: Die KI hat jede Summe Schritt für Schritt gezeigt.
  - recommendedChoiceId: `check-coverage` · strongestEvidenceId: `files-not-months`
  - submitLabel: Entscheidung prüfen · resetLabel: Neu entscheiden · privacyNote: Läuft nur auf dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet. · resultLabel: Auswertung der Entscheidung
  - feedback:
    - aligned: title „Zwölf Rechnungen, elf Monate." body „Im Ordner steckt der März doppelt, der Oktober fehlt, und eine Rechnung gehört einer anderen Firma. Die Monatstabelle zeigt das, bevor jemand summiert. Richtig sind 1.915,2 t."
    - decisionOnly: title „Richtiger Schritt, schwacher Grund." body „Eine Zahl nah am Vorjahr und sauber gezeigte Summen beweisen nicht, dass jede Rechnung einmal zählt. Der Beleg ist die Monatstabelle: 12 Dateien decken hier 11 Monate ab."
    - evidenceOnly: title „Dein Beleg spricht gegen deine Entscheidung." body „Wenn zwölf Dateien keine zwölf Monate belegen, darf die Summe so nicht raus. Erst die Monatstabelle, dann die Zahl."
    - unsupported: title „Plausibel ist nicht geprüft." body „Sechs Fehler heben sich hier fast auf: Die Summe liegt nur 48,7 t neben der richtigen. Weder der Vorjahresvergleich noch eine zweite Rechnung der KI findet die doppelte Märzrechnung."
- **caseStudy:**
  - companyName: Fernholt Präzisionsteile GmbH
  - isFictional: true
  - location: Erfundener Standort in Hessen
  - sector: Metallteile für Autoindustrie und Maschinenbau (Stanzen, CNC-Fertigung)
  - period: Geschäftsjahr 2025, Vergleich mit 2024
  - narrative: Fernholt hat 180 Beschäftigte, zwei Werke und ein gemietetes Lager. Die Bank und ein Autohersteller fragen nach Scope 1 und 2 für 2025 und nach der Veränderung zum Vorjahr. Dieselbe Frage geht an einen Ordner mit 22 Rechnungen und Exporten und an eine Belegtabelle mit sechs Regeln. Die Faktoren sind Lehrwerte.
  - metrics (4): „Beschäftigte · 180" · „Belege 2025 · 22" · „Abstand der KI-Summe zur richtigen · 48,7 t" · „Anteil des Strommix am Rückgang · 71 %"
  - decisionQuestion: Welche Prüfungen brauchst du, bevor du eine Emissionszahl aus einem Rechnungsordner an Bank oder Kunden schickst?
  - dataLimitations (4):
    1. Firma, Rechnungen und Mengen sind erfunden; die Emissionsfaktoren sind Lehrwerte und keine amtlichen Werte.
    2. Die Antwort der KI auf den Rohordner ist aus dokumentierten Fehlerarten konstruiert, bis aufgezeichnete Läufe mit Datum vorliegen.
    3. Die Zahlen für 2024 stammen aus einer Zusammenfassung ohne Einzelrechnungen.
    4. Ohne Produktionsmengen lässt sich nicht sagen, ob der geringere Verbrauch aus Effizienz oder aus weniger Produktion kommt.
- **materials:**
  - `Kurs · 26 Szenen` → `slides.html` (html, en): „Etwa 76 Minuten Kurs und 14 Minuten Fragen. Pfeiltasten führen weiter, P öffnet die Moderationsansicht. Am besten auf einem großen Bildschirm im Querformat."
  - `Lernbegleiter` → `guide.html`: „Der Kurs zum Nachlesen, mit Fragen zum Aufdecken und einem Glossar. Auch für das Smartphone."
  - `Interaktive Demo · 10 Min.` → `demo.html`: „Schalte jede Falle einzeln ein, öffne jede Rechnung und sieh die Zeile, die daraus in der Belegtabelle wird."
  - `Merkkarte` → `field-card.html`: „Sieben Prüfungen auf einer A4-Seite, bevor du einer ESG-Zahl traust."
  - `Transferblatt` → `transfer.html`: „Fünf Felder für eine eigene Rechnung, mit dem Beispiel aus dem Kurs daneben."
  - `ESG-Kit · .zip` → `esg-kit.zip` (zip, en): „Alle Rechnungen als Text, Faktoren, leere und erwartete Belegtabelle, drei Prompts und eine Vorlage für Datenanfragen. Nur CSV und Markdown."

### 7.2 English

- **title:** ESG reporting with AI: from raw inputs to clearer insights
- **eyebrow:** Workshop 04 · ESG reporting
- **summary (140 characters):** The same Scope 1 and 2 question, asked of a folder of bills and of a prepared ledger. See which errors hide inside a total that looks right.
- **description:**
  Fictional Fernholt Präzisionsteile GmbH (180 staff, three sites) wants to know its Scope 1 and 2 emissions for 2025 and whether they went down compared with 2024. From a folder of 22 bills and exports, the AI answers 1,866.5 t CO₂e, 7.5% below last year. That is only 2.5% from the right figure, even though six errors are inside it: a duplicate March bill, a missing October, a joint venture's bill, "1.240 MWh" read as 1,240 kWh, a gas factor on the wrong basis and AdBlue counted as diesel. With a ledger, six rules and pinned factors, the same AI answers correctly: 1,915.2 t location-based (−5.1%) and 1,893.2 t market-based (−29.2%). Then you split the change: 72.2 t of the decrease comes from the grid mix, 744.0 t of the market-based decrease from guarantees of origin for one site, and 30.1 t from lower own use. All numbers are invented; the factors are teaching values.
- **format:** Interactive course
- **duration:** ~90 minutes
- **accessNote:** The course, demo and kit need no account or installation; materials are in English and the bills in the kit are German documents. The AI answer on the raw folder is constructed from documented failure modes, not a live request.
- **outcome:** Five-box sheet for one of your own bills
- **outcomes:**
  1. Build a month grid for one site and spot duplicate, missing and two-month bills before anyone adds them up.
  2. Write one ledger row: source with the quoted line, period, value and unit as printed, legal entity and boundary, factor with its year.
  3. Work out Scope 2 location-based and market-based, and name the kilowatt hours a guarantee of origin covers.
  4. Split the change against last year into grid mix, certificates and own use, and write one sentence that cites every number.
- **agenda:** same seven steps and minutes as DE:
  - 01 · The question and the first answer · 13 min
  - 02 · Why the total still looks right · 17 min
  - 03 · Ledger, rules, two Scope 2 numbers · 17 min
  - 04 · The same question again, and what lowered the number · 11 min
  - 05 · Calculate, ask back, refuse · 8 min
  - 06 · Your bill in five boxes · 11 min
  - 07 · Optional: switch the traps yourself · 10 min
- **What you need:** A browser, ideally a large landscape screen for the slides · paper and pen for the five boxes · a calculator or phone.
- **What you don't need:** Programming skills · carbon accounting knowledge beyond "Scope 1 and 2" · an AI account · your own company data (everything is invented and in the kit).
- **Not in this workshop:** No legal advice and no audit. No walk-through of CSRD or ESRS. No full Scope 3 inventory (one steel example is in the appendix). No official emission factors: the teaching values are for the course arithmetic only. No comparison of ESG software.
- **audience:**
  - Sustainability, finance and controlling teams in mid-sized companies who send Scope 1 and 2 to banks or customers
  - Operations and energy managers who hold the bills
  - Beginners without programming or statistics background
- **decisionLab:**
  - kicker: Decision 01 · Raw data
  - title: 1,866.5 tonnes, 7.5% below 2024. Send it?
  - prompt: The AI read every bill in the folder and reports 1,866.5 t CO₂e for 2025, 7.5% below last year. The bank is waiting for the number. What do you do?
  - facts: "AI answer 2025: 1,866.5 t CO₂e" · "Last year 2024: 2,017.5 t CO₂e" · "Werk Nord folder: 12 electricity bills"
  - choices (same ids): `check-coverage` "Build a month grid per site and count each bill once, then calculate." · `send-total` "Send it: it is close to last year and the AI shows its sums." · `ask-again` "Ask the AI to calculate more carefully and send the second number."
  - evidence (same ids): `files-not-months` "Twelve files do not show that twelve months are covered. A bill can be in twice and another missing." · `close-to-last-year` "The number is only 7.5% below last year, which is a normal year." · `shown-sums` "The AI showed every sum step by step."
  - feedback:
    - aligned: "Twelve bills, eleven months." / "March is in the folder twice, October is missing, and one bill belongs to another company. A month grid shows this before anyone adds up. The right total is 1,915.2 t."
    - decisionOnly: "Right step, weak reason." / "A number close to last year and neatly shown sums do not prove each bill counts once. The evidence is the month grid: here 12 files cover 11 months."
    - evidenceOnly: "Your evidence argues against your decision." / "If twelve files do not prove twelve months, the total cannot go out yet. Month grid first, then the number."
    - unsupported: "Plausible is not checked." / "Six errors almost cancel here: the total is only 48.7 t from the right one. Neither last year's figure nor a second AI calculation finds the duplicate March bill."
- **caseStudy:** companyName Fernholt Präzisionsteile GmbH · isFictional true · location "Invented site in Hesse, Germany" · sector "Metal parts for automotive and machinery (stamping, CNC machining)" · period "Financial year 2025, compared with 2024" · narrative "Fernholt has 180 staff, two plants and a leased warehouse. The bank and a car maker ask for Scope 1 and 2 for 2025 and the change against last year. The same question goes to a folder of 22 bills and exports and to a ledger with six rules. The factors are teaching values." · metrics "Staff · 180", "Documents 2025 · 22", "Gap between AI total and right total · 48.7 t", "Share of the decrease from the grid mix · 71%" · decisionQuestion "Which checks do you need before you send an emissions figure from a folder of bills to a bank or customer?" · dataLimitations: the four DE items in English.
- **materials:** same hrefs, kinds and order; labels `Course · 26 scenes`, `Learner guide`, `Interactive demo · 10 min`, `Field card`, `Transfer sheet`, `ESG kit · .zip`.

Registry notes: 26 scenes = 20 main + 6 appendix. Choice and evidence ids identical in both locales. The `workshops.test.ts` material-language assertions (all English) hold as long as every material is `language: "en"`; the German bills inside the English kit are described in `accessNote`.

---

## 8. Regulation: what is true on 26 September 2026

For the `appendix-regulation` scene, the guide's limits section and the case-study context. Footer on the scene: "Rules as of 26 Sep 2026. Not legal advice."

1. **Fernholt is outside CSRD.** Since Directive (EU) 2026/470 (Omnibus I) entered into force on 18 March 2026, the CSRD covers companies with more than 1,000 employees and more than €450m turnover; both conditions must be met. Source: Council press release, 24 Feb 2026, https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/
2. **Customers can ask, within a cap.** Suppliers with up to 1,000 employees can refuse data requests from reporting customers that go beyond the voluntary standard based on the VSME, published as Delegated Regulation (EU) 2026/1560 on 21 Sep 2026. Sources: https://www.europarl.europa.eu/news/en/press-room/20251211IPR32164/simplified-sustainability-reporting-and-due-diligence-rules-for-businesses ; https://eur-lex.europa.eu/eli/reg_del/2026/1560/oj/eng
3. **The VSME Basic Module asks for Scope 1 and 2.** It has 11 disclosures, including energy and Scope 1 and 2 emissions, and needs no double materiality assessment and no auditor. Source: https://www.efrag.org/en/news-and-calendar/news/efrag-releases-the-voluntary-sustainability-reporting-standard-for-nonlisted-smes
4. **Scope 2 is reported twice.** The 2015 GHG Protocol Scope 2 Guidance requires a location-based and a market-based figure. It still applies; the joint GHG Protocol/ISO standard is planned for consultation in Q2 2027 and publication in Q4 2028. Sources: https://ghgprotocol.org/sites/default/files/2023-03/Scope%202%20Guidance.pdf ; https://ghgprotocol.org/blog/ghg-protocol-announces-key-standard-development-updates
5. **Green claims rules apply from 27 September 2026.** Directive (EU) 2024/825 (Empowering Consumers) bans generic environmental claims without proof and product claims of climate neutrality based on offsets in consumer communication. Sources: https://eur-lex.europa.eu/eli/dir/2024/825/oj/eng ; Commission FAQ https://commission.europa.eu/document/download/3c257883-bb2a-4dd9-a6dc-501d587bb34f_en?filename=faq-empowerting-consumers-gtd.pdf
6. **Limited assurance stays.** For companies that must report, assurance stays at limited level; the route to reasonable assurance was removed. Source: https://accountancyeurope.eu/wp-content/uploads/2026/01/260129-Omnibus-explained-CSRD-factsheet.pdf

**Three things the workshop must not claim**

1. **That Germany has, or has not, finished transposing the CSRD, or how Germany's UWG amendment for EmpCo reads in detail.** Final passage of the CSRD-Umsetzungsgesetz is UNVERIFIED (last verified step: Bundestag hearing, 13 Apr 2026), and the German EmpCo transposition is confirmed only by secondary sources. Say "check the current status" instead.
2. **That AI output, or this ledger, is audit-ready or produces a compliant report.** No source supports it. Published extraction systems get about three in four numbers right, and reports need management judgement, traceable data and, where required, external assurance.
3. **That the teaching factors or any factor quoted from memory are official values, or that new Scope 2 rules (hourly matching, deliverability) already apply.** The factors in this workshop are invented round numbers; hourly matching was a consultation proposal and today's Scope 2 Guidance (2015) still applies.

Also avoid on every slide: "CSRD was scrapped", "SMEs must use the VSME", "the threshold is 1,000 employees or €450m", and any "climate-neutral" example built on offsets.

---

## 9. Open items before build

- Capture the two conditions (§3.9) and replace every "constructed" label, or keep the label and say so on the page.
- Handelsregister check for "Fernholt Präzisionsteile GmbH", "Talbrück Beschichtung GmbH", "Lindmark Energie GmbH".
- Test run with three people who are not the author; replace the planned minutes with the measured median.
- Decide whether the web page shows a German translation of the fixed question on the deck cover (W03 shows English only).
- `workshops.test.ts` requires an identical material list in both locales; the six materials above satisfy it.
