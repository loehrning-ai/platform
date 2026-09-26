# Workshop 04 concept C: "From pile to one clear page"

Working title (EN): ESG Reporting with AI: From Raw Inputs to Clearer Insights
Seitentitel (DE): ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen
Slug `esg-berichte-mit-ki` · number `"04"` · topic "ESG-Berichte" / "ESG reporting"
Concept written 2026-09-26. All arithmetic re-computed with `scratchpad/w04/calc_C.py` (Python `Decimal`).

Angle: the deliverable is fixed from minute one. It is the single page a CFO, a bank or an OEM customer asks for: Scope 1, Scope 2 location-based and market-based, emissions per tonne of parts shipped, the top three drivers, and the data gaps. The AI does three jobs on the way to that page, and each job gets its own trust level, its own typical failure and its own check:

| Role | What the AI does | Trust level | Typical failure (Kellbrunn data) | Check that catches it |
|---|---|---|---|---|
| Reader (Leser) | Reads bills and exports, returns one row per quantity with file, page and a verbatim quote | Trust a row only after its quote matches the value and unit | "1.240 MWh" read as 1,240 kWh; "Brennwert (Hs)" note on page 2 not carried into the row | Quote match (value and unit appear in the quote); plausibility per site (kWh per employee) |
| Clerk (Sachbearbeiter) | Normalises units, periods, sites and duplicates. The AI may *propose* rules; a spreadsheet or script *applies* them, and a person approves the rule list | Trust the rule, never the model's mental arithmetic | 12 files read as 12 months; duplicate March summed; JV bill counted; AdBlue counted as diesel; Hi factor on Hs kWh; JV tonnage in the denominator | Site × month coverage grid; uniqueness key; boundary list; control total (documents = included + excluded with reason) |
| Writer (Texter) | Drafts the sentences on the page | Trust no sentence that does not cite a ledger row | "Werk Süd runs on 100% green electricity and has almost no emissions"; "no data gaps"; "efficient for metalworking" | Claims table: each sentence gets a row ID or is deleted; banned-claims list |

The controlled comparison from Workshop 03 still anchors the story: same model, same prompt, same factor table, two data states (raw folder vs prepared ledger). What changes between the two pages is the data path, not the model.

---

## 1. The fixed question and the promise

**The one fixed question (verbatim, on the q-card of every scene, the web page and the decision lab):**

- EN: "What were Kellbrunn's Scope 1 and Scope 2 emissions in 2025, location-based and market-based, per tonne of parts shipped, what drove them, and what is missing?"
- DE: „Wie hoch waren die Scope-1- und Scope-2-Emissionen von Kellbrunn 2025, standort- und marktbasiert, je Tonne ausgelieferter Teile, was hat sie getrieben, und was fehlt?"

The answer to the question is always the same object: the one page (`Die eine Seite` / `The one page`), with six fields. Slides draw it as a fixed card so the room sees the same six boxes filled twice.

| Field | EN label | DE label |
|---|---|---|
| 1 | Scope 1 | Scope 1 |
| 2 | Scope 2, location-based | Scope 2, standortbasiert |
| 3 | Scope 2, market-based | Scope 2, marktbasiert |
| 4 | Per tonne shipped (kg CO₂e/t) | Je Tonne ausgeliefert (kg CO₂e/t) |
| 5 | Top 3 drivers | Die drei größten Treiber |
| 6 | Data gaps and estimates | Datenlücken und Schätzungen |

**Promise (one sentence):**

- EN: "After 90 minutes you can turn a folder of energy bills into the one page a customer asks for, and show for every number on it the ledger row and the line in the document it comes from."
- DE: „Nach 90 Minuten machst du aus einem Ordner Energierechnungen die eine Seite, die ein Kunde verlangt, und zeigst zu jeder Zahl darauf die Zeile in der Belegtabelle und die Stelle im Dokument."

---

## 2. The fictional company

### 2.1 Name check

The research proposed "Fernholt Präzisionsteile GmbH". A web search (2026-09-26) found no company of that exact name, but it found **W. u. H. Fernholz GmbH & Co. KG**, a real packaging manufacturer in Meinerzhagen (NRW), one letter away and in manufacturing, plus a Norwegian "Fernholt Consulting AS". A fictional Mittelstand manufacturer one letter from a real NRW Mittelstand manufacturer is avoidable risk, so this concept uses a different name.

**Chosen name: Kellbrunn Präzisionsteile GmbH** ("Kellbrunn" for short). Searches for "Kellbrunn" and "Kellbrunn GmbH" returned no company; the nearest hits are the Swiss village Kollbrunn and the Kallbrunnalm (Austria). The name is invented for this workshop. Every slide footer and every kit file header carries "Fiktives Unternehmen, alle Zahlen erfunden" / "Fictional company, all numbers invented". Before publication, a person runs one Handelsregister and DPMA trademark lookup and records the date in `PUBLICATION.md`.

Search sources: [Bloomberg: W und H Fernholz](https://www.bloomberg.com/profile/company/6456427Z:GR), [Fernholz Verpackungen](https://www.fernholz.biz/en/company/), [Creditsafe: Fernholt Consulting AS](https://www.creditsafe.com/business-index/en-gb/company/fernholt-consulting-as-no01343232), [Wikipedia: Kollbrunn](https://en.wikipedia.org/wiki/Kollbrunn).

Other invented names in the case: the joint venture **Ahlental Pulverbeschichtung GmbH** ("ABL"), the utility **Stadtwerke Ahlental** (Werk Nord), the green-tariff supplier **Talstrom Energie GmbH** (Werk Süd), the landlord **Ostpark Logistikimmobilien GmbH** (Lager Ost). All carry the fictional label; e-mail addresses use `@example.com`.

### 2.2 Company facts

- Kellbrunn Präzisionsteile GmbH, fictional. Metal parts supplier: stamping, CNC machining and assembly for machinery and automotive OEMs.
- 180 employees, turnover €42m (illustrative), outside CSRD scope after Omnibus I.
- Why it needs the page: an OEM customer's supplier questionnaire (due in six weeks) and the house bank's annual credit review both ask for Scope 1 and 2 for 2025. The CFO, Frau Ahrens (fictional), asks the sustainability coordinator for "one page I can send to both".
- **Organisational boundary: operational control**, written down in `Standorte_und_Grenze.md` before any AI run.

| Site ID | Site | Activity | Staff | In boundary? |
|---|---|---|---|---|
| WN | Werk Nord (HQ) | Stamping, assembly, offices | 110 | Yes, owned |
| WS | Werk Süd | CNC machining | 55 | Yes, owned |
| LO | Lager Ost | Leased warehouse with own sub-meter | 15 | Yes, leased and operated by Kellbrunn |
| ABL | Ahlental Pulverbeschichtung GmbH | Powder coating of Kellbrunn parts; Kellbrunn holds 40%, the partner operates the plant | (not Kellbrunn staff) | **No**: no operational control. Named on the page as excluded; candidate for Scope 3 category 15 (not calculated) |

Kellbrunn's purchasing team also handles the JV's electricity contract, which is why the JV's annual bill sits in the Werk Nord folder.

---

## 3. The dataset

### 3.1 Illustrative teaching factors (NOT official values)

File `reference/Faktoren_Lehrwerte_2025.csv`. The same file is given to the AI in both conditions. The header line of the file and every slide that shows a factor say: "Lehrwerte, gerundet, keine amtlichen Faktoren. Nicht für echte Berichte verwenden." / "Rounded teaching values, not official factors. Do not use for real reporting."

| factor_id | description | value | unit | basis | real-world anchor (order of magnitude only, not used) |
|---|---|---|---|---|---|
| F-EL-LB-2025 | Grid electricity DE, location-based, 2025 | 0.40 | kg CO₂e/kWh | | UBA: 363 g CO₂/kWh for 2024, direct CO₂ only |
| F-EL-RM-2025 | Residual mix DE, market-based, 2025 | 0.60 | kg CO₂e/kWh | | AIB European residual mix 2024: 452 g/kWh; the German value is usually above the grid average |
| F-EL-GO | Electricity covered by cancelled guarantees of origin | 0.00 | kg CO₂e/kWh | market-based only | Scope 2 Guidance quality criteria |
| F-GAS-HI | Natural gas | 0.20 | kg CO₂e/kWh | Hi (Heizwert, net) | about 0.20 per kWh Hi |
| F-GAS-HS | Natural gas | 0.18 | kg CO₂e/kWh | Hs (Brennwert, gross) | 0.20 ÷ 1.11 |
| F-DSL | Diesel, road | 2.50 | kg CO₂e/l | | DESNZ-type values about 2.5 to 2.7 |
| C-DSL-E | Diesel energy content | 10.0 | kWh/l | | about 9.8 to 10.0 |

Row order in the file matters for the trap: `F-GAS-HI` comes first and is labelled "Erdgas".

### 3.2 The raw folder (Condition A, what the AI gets in the first ask)

Twenty files. All documents use German number format (thousands point, decimal comma), as real German bills do. Bills are **text-rendered**: in the kit each bill is a Markdown file laid out like the bill (header, addressee, period, table, small print, page markers `--- Seite 2 ---`). On slides and in the demo the same text is drawn as an HTML/CSS "paper" card, so the repository needs no PDFs and no images of bills.

**`raw/werk-nord/strom/` (12 files, Stadtwerke Ahlental, meter WN-E-01)**

| # | File | Period on document | Quantity on document | Trap (hidden until act 2) |
|---|---|---|---|---|
| 1 | `2025-01_Strom_WN.md` | 01.01.2025 bis 31.01.2025 | 210.000 kWh | |
| 2 | `2025-02_Strom_WN.md` | 01.02. bis 28.02.2025 | 195.000 kWh | |
| 3 | `2025-03_Strom_WN.md` | 01.03. bis 31.03.2025 | 205.000 kWh | Invoice no. 4711-03 |
| 4 | `Scan_Rechnung_Maerz.md` | 01.03. bis 31.03.2025 | 205.000 kWh | **Duplicate**: same invoice no. 4711-03, a copy purchasing forwarded by e-mail (header line "Weitergeleitet von: einkauf@kellbrunn.example") |
| 5 | `2025-04_Strom_WN.md` | April | 190.000 kWh | |
| 6 | `2025-05_Strom_WN.md` | May | 185.000 kWh | |
| 7 | `2025-06_Strom_WN.md` | June | 180.000 kWh | |
| 8 | `2025-07_Strom_WN.md` | July | 175.000 kWh | |
| 9 | `2025-08_Strom_WN.md` | August | 120.000 kWh | Plant holiday. Real, not an error (the anomaly that must *not* be "fixed") |
| 10 | `2025-09_Strom_WN.md` | September | 190.000 kWh | |
| 11 | `2025-11-12_Strom_WN.md` | 01.11. bis 31.12.2025 | 410.000 kWh | **Two months on one bill** (supplier changed its billing cycle; small print: "Abrechnungszeitraum umgestellt") |
| 12 | `Jahresrechnung_ABL_2025.md` | 01.01. bis 31.12.2025 | 800.000 kWh | **Outside the boundary**: addressed to "Ahlental Pulverbeschichtung GmbH, z. Hd. Einkauf Kellbrunn" |
| (none) | | 01.10. bis 31.10.2025 | | **October invoice missing** |

The folder holds 12 files. One of them covers two months, so the file names suggest 13 month-slots for a 12-month year. That arithmetic is the cheapest check in the workshop and the decision lab is built on it.

**`raw/werk-nord/Zaehlerstaende_WN_2025.csv`** (facility manager's month-end readings of meter WN-E-01, transformer ratio already applied, stated in the header):

```
datum;zaehler;stand_kwh;erfasst_von
31.12.2024;WN-E-01;3.162.300;Haustechnik
30.09.2025;WN-E-01;4.812.300;Haustechnik
31.10.2025;WN-E-01;5.012.300;Haustechnik
31.12.2025;WN-E-01;5.422.300;Haustechnik
```

October = 5.012.300 − 4.812.300 = **200.000 kWh**. Year = 5.422.300 − 3.162.300 = **2.260.000 kWh**, an independent cross-check of the Werk Nord total.

**`raw/werk-nord/Gas_Jahresrechnung_WN_2025.md`**: page 1 table "Energiemenge 1.850.000 kWh". Page 2 small print: "Die Energiemenge wurde aus dem Volumen mit Zustandszahl 0,9531 und Brennwert (Hs) 11,2 kWh/m³ ermittelt." (**Hs vs Hi trap**: the basis is only on page 2.)

**`raw/werk-sued/`** (3 files)

- `Jahresuebersicht_Strom_WS_2025.md`: "Tarif Talstrom Öko Plus · Verbrauch 2025: **1.240 MWh** · Vorjahr: 1.310 MWh". (**MWh with German thousands point.**)
- `HKN_Bestaetigung_WS_2025.md`: "Herkunftsnachweise über **1.240 MWh**, Erzeugungsjahr 2025, Wasserkraft, entwertet im Herkunftsnachweisregister für die Liefermenge an die Abnahmestelle Werk Süd, Kellbrunn Präzisionsteile GmbH." (**Green certificate covering one site only.**)
- `Gas_Jahresrechnung_WS_2025.md`: "Energiemenge (Brennwert Hs) 240.000 kWh". (Here the basis is on page 1.)

**`raw/lager-ost/Untermessung_LO_2025.md`**: landlord's quarterly sub-meter statement: Q1 30.000, Q2 25.000, Q3 25.000, Q4 30.000 kWh, grey tariff.

**`raw/flotte/Tankkarten_2025.csv`** (semicolon, decimal comma; 22 lines):

```
datum;karte;kennzeichen;produkt;menge;einheit;betrag_eur
31.01.2025;TK-01..06;Sammel;Diesel;3.300;l;5.346,00
... (one aggregated Diesel line per month: Jan 3.300; Feb 3.100; Mar 3.300; Apr 3.200; May 3.200; Jun 3.100; Jul 3.000; Aug 2.600; Sep 3.300; Oct 3.300; Nov 3.300; Dec 3.300; sum 38.000 l)
31.03.2025;TK-01..06;Sammel;AdBlue;300;l;189,00
... (AdBlue 300 l in Mar, Jun, Sep, Dec: 1.200 l)
15.02.2025;TK-02;XX-KB 102;Waesche;1;Stk;14,90
... (6 car-wash and shop lines in €)
```

Trap: summing `menge` where `einheit = l` gives 39.200 l, because AdBlue (a urea solution, not a fuel) is also in litres.

**`raw/produktion/Produktion_2025.csv`** (ERP export, tonnes):

```
werk;stufe;menge_t;kommentar
WN;Stanzen und Montage, ausgeliefert;2.600;
WS;CNC, ausgeliefert;1.400;
ABL;Lohnbeschichtung Ahlental;900;beschichtete Kellbrunn-Teile, Ruecklieferung an WN
```

Trap: the 900 t are Kellbrunn parts that went to the JV for coating and came back. They are already inside the 2.600 t and 1.400 t shipped, and the JV is outside the boundary. The correct denominator is **4.000 t shipped**.

**`reference/`** (given in both conditions, not counted in the 20 raw files): `Faktoren_Lehrwerte_2025.csv` and `Standorte_und_Grenze.md` (the site table in §2.2 plus one sentence: "Wir berichten nach operativer Kontrolle.").

### 3.3 The prepared ledger (Condition B)

`ledger/ledger_energie_2025.csv`, one row per source quantity. Columns:

`row_id; site; in_boundary; carrier; period_start; period_end; months; qty_source; unit_source; basis; kwh; source_file; page; quote; status; exclusion_reason; instrument; factor_lb; factor_mb; dq; prepared_by; reviewed_by`

| row_id | site | carrier | months | source quantity (as on document) | normalised | status | DQ |
|---|---|---|---|---|---|---|---|
| E-WN-01 to E-WN-09 | WN | electricity | Jan to Sep, 9 | as table above | 210,000; 195,000; 205,000; 190,000; 185,000; 180,000; 175,000; 120,000; 190,000 kWh | actual | A |
| E-WN-03D | WN | electricity | Mar | 205.000 kWh | 0 | excluded: duplicate of E-WN-03 (invoice 4711-03) | |
| E-WN-10 | WN | electricity | Oct, 1 | meter 5.012.300 − 4.812.300 | 200,000 kWh | actual, meter reading; invoice requested | B |
| E-WN-11 | WN | electricity | Nov to Dec, 2 | 410.000 kWh | 410,000 kWh | actual | A |
| E-ABL-01 | ABL | electricity | Jan to Dec | 800.000 kWh | 0 | excluded: outside boundary (operational control); Scope 3 cat. 15 candidate | |
| E-WS-01 | WS | electricity | 12 | 1.240 MWh | 1,240,000 kWh | actual; instrument HKN 1,240 MWh | A |
| E-LO-01 to E-LO-04 | LO | electricity | 4 quarters | 30.000 / 25.000 / 25.000 / 30.000 kWh | 110,000 kWh | actual, landlord's sub-meter | B |
| G-WN-01 | WN | natural gas | 12 | 1.850.000 kWh | 1,850,000 kWh (Hs) | actual | A |
| G-WS-01 | WS | natural gas | 12 | 240.000 kWh | 240,000 kWh (Hs) | actual | A |
| D-FL-01 | fleet | diesel | 12 | 38.000 l | 380,000 kWh (at 10.0 kWh/l) | actual | A |
| D-FL-02 | fleet | AdBlue | 4 | 1.200 l | 0 | excluded: not a fuel | |
| P-WN-01 | WN | production | 12 | 2.600 t | 2,600 t | actual | A |
| P-WS-01 | WS | production | 12 | 1.400 t | 1,400 t | actual | A |
| P-ABL-01 | ABL | production | 12 | 900 t | 0 | excluded: coating step of parts already counted; outside boundary | |

Companion files: `coverage_grid_2025.csv` (site × month, each cell = row_id or `MISSING`), `instrument_table_2025.csv` (one row: HKN 1,240 MWh → E-WS-01, covers 1,240,000 of 3,610,000 kWh), and the control total in §3.4.

### 3.4 Correct answers, with arithmetic

**Electricity in the boundary**
- Werk Nord = 210,000 + 195,000 + 205,000 + 190,000 + 185,000 + 180,000 + 175,000 + 120,000 + 190,000 + 200,000 (Oct, meter) + 410,000 (Nov to Dec) = **2,260,000 kWh** (matches the meter-year cross-check)
- Werk Süd = 1,240 MWh × 1,000 = **1,240,000 kWh**
- Lager Ost = 30,000 + 25,000 + 25,000 + 30,000 = **110,000 kWh**
- Total = **3,610,000 kWh**

**Control total (clerk's reconciliation, electricity kWh on documents):** the Werk Nord folder's 12 files are 10 genuine bills (1,650,000 Jan to Sep + 410,000 Nov to Dec = 2,060,000 kWh) + the duplicate (205,000) + the JV bill (800,000) = 3,065,000 kWh. All electricity documents = 3,065,000 + 1,240,000 (WS) + 110,000 (LO) = 4,415,000 kWh. Minus excluded 1,005,000 (duplicate + JV) = 3,410,000. Plus October from the meter reading 200,000 = **3,610,000 kWh** ✓.

**Scope 2, location-based:** 3,610,000 × 0.40 = 1,444,000 kg = **1,444.0 t CO₂e**

**Scope 2, market-based:**
- Werk Süd, covered by cancelled guarantees of origin: 1,240,000 × 0.00 = 0 t
- Werk Nord + Lager Ost without instrument: 2,370,000 × 0.60 (residual mix) = **1,422.0 t**
- Total **1,422.0 t CO₂e**

**Scope 1:**
- Gas (Hs basis): (1,850,000 + 240,000) × 0.18 = 2,090,000 × 0.18 = **376.2 t** (Werk Nord 333.0, Werk Süd 43.2)
- Diesel: 38,000 l × 2.50 = **95.0 t**
- **Scope 1 = 471.2 t CO₂e**

**Totals:** Scope 1 + 2 location-based = **1,915.2 t**; market-based = **1,893.2 t**.

**Per tonne shipped (denominator 4,000 t):**
- location-based: 1,915.2 t ÷ 4,000 t = **478.8 kg CO₂e/t**
- market-based: 1,893.2 t ÷ 4,000 t = **473.3 kg CO₂e/t**

**Top three drivers** (this is the "clearer insight" field, and it depends on the method):

| Rank | Location-based (of 1,915.2 t) | Market-based (of 1,893.2 t) |
|---|---|---|
| 1 | Werk Nord electricity 904.0 t (47.2%) | Werk Nord electricity 1,356.0 t (71.6%) |
| 2 | Werk Süd electricity 496.0 t (25.9%) | Werk Nord gas 333.0 t (17.6%) |
| 3 | Werk Nord gas 333.0 t (17.4%) | Fleet diesel 95.0 t (5.0%) |
| rest | diesel 95.0, Lager Ost electricity 44.0, Werk Süd gas 43.2 | Lager Ost electricity 66.0, Werk Süd gas 43.2, Werk Süd electricity 0 |

Werk Süd drops out of the market-based top three because of the certificate, not because it used less power. The page must say which method the ranking uses.

**The insight line for the page:** "Market-based Scope 2 is only 22 t below location-based. The certificate removes 496 t at Werk Süd (1,240,000 × 0.40), and the residual mix adds 474 t on the 2,370 MWh without certificates (2,370,000 × (0.60 − 0.40))." 496 − 474 = 22 ✓.

**Secondary figures:** renewable share of electricity 1,240 / 3,610 = **34.3%**; total energy 3,610 + 2,090 (gas, Hs) + 380 (diesel) = **6,080 MWh** (state the Hs basis).

**Data gaps and estimates (field 6 of the correct page):**
1. Werk Nord October: from the meter reading, not an invoice (DQ B, row E-WN-10). Invoice requested from Stadtwerke Ahlental.
2. Lager Ost: landlord's sub-meter statements, no own invoice (DQ B, rows E-LO-01 to 04).
3. Ahlental Pulverbeschichtung (40% JV) excluded under operational control; its 800 MWh are not in this page (row E-ABL-01). Scope 3 not calculated.
4. Refrigerant top-ups (Scope 1) not checked: no service invoices in the folder.
5. All factors are teaching values (reference/Faktoren_Lehrwerte_2025.csv). A real page needs the current UBA and AIB values with version and year.

### 3.5 The plausible wrong page (Condition A)

Labelled on every surface: **"Konstruiert aus dokumentierten Fehlerarten, kein aufgezeichneter Lauf"** / "Constructed from documented failure modes, not a recorded run", until real runs are captured (protocol in §4, scene A4). If captured runs differ, the deck shows the captured page and keeps this one in the appendix as "what the traps would do".

| Field | AI on the raw folder | How it got there (traps) | Correct |
|---|---|---|---|
| Scope 1 | **516.0 t** | Gas 2,090,000 × 0.20 (Hi factor on Hs kWh) = 418.0; diesel 39,200 l incl. AdBlue × 2.50 = 98.0 | 471.2 t (+9.5% too high) |
| Scope 2 LB | **1,270.5 t** | Werk Nord folder summed: 10 bills 2,060,000 + duplicate 205,000 + JV 800,000 = 3,065,000; October missing. Werk Süd "1.240 MWh" read as 1,240 kWh. Lager Ost 110,000. Total 3,176,240 × 0.40 = 1,270.496 | 1,444.0 t (−12.0%) |
| Scope 2 MB | **1,270.0 t** | Werk Süd set to 0 ("Ökostrom"), everything else at grid average 0.40 instead of residual mix: (3,065,000 + 110,000) × 0.40 | 1,422.0 t (−10.7%) |
| Per tonne | **365 kg/t** (LB) | (516.0 + 1,270.5) ÷ 4,900 t, JV coating tonnage counted | 478.8 kg/t (−23.9%) |
| Top 3 drivers | Werk Nord electricity 1,226 t; Werk Nord gas 370 t; fleet diesel 98 t | JV and duplicate inside "Werk Nord"; Werk Süd electricity 0.5 t | see §3.4 |
| Data gaps | **"Keine"** | 12 files read as 12 months | five gaps (§3.4) |
| Sentence | "Werk Süd bezieht 100 % Ökostrom und verursacht kaum Emissionen. Mit 365 kg je Tonne liegt Kellbrunn auf einem effizienten Niveau für die Metallbearbeitung." | writer with no row IDs, no benchmark | see S11 |

Why it survives a sanity check: Scope 1 + 2 is 1,786 t against a true 1,915 t, 6.7% low. The errors partly cancel: the duplicate (+82 t) and the missing October (−80 t) change the total by 2 t; the JV (+320 t) hides two thirds of the unit error (−495.5 t). Werk Süd's 1,240 kWh would mean 23 kWh per CNC employee per year, which one plausibility check per site catches immediately.

### 3.6 Waterfalls (one bar per trap)

**Scope 1 + 2, location-based (from the wrong page to the right one):**

| Step | Role that owns it | Change | Running total |
|---|---|---|---|
| Wrong page | | | 1,786.5 t |
| Remove duplicate March | Clerk | −82.0 | 1,704.5 |
| Add October from meter | Clerk | +80.0 | 1,784.5 |
| Exclude JV bill | Clerk | −320.0 | 1,464.5 |
| Read "1.240 MWh" as 1,240,000 kWh | Reader | +495.5 | 1,960.0 |
| Gas: Hs factor for Hs kWh | Reader (missed qualifier) + Clerk (rule) | −41.8 | 1,918.2 |
| Drop AdBlue | Clerk | −3.0 | **1,915.2 t** ✓ |

**Scope 1 + 2, market-based:**

| Step | Change | Running total |
|---|---|---|
| Wrong page | | 1,786.0 t |
| Remove duplicate | −82.0 | 1,704.0 |
| Add October | +80.0 | 1,784.0 |
| Exclude JV | −320.0 | 1,464.0 |
| Residual mix instead of grid average on 2,370,000 kWh | +474.0 | 1,938.0 |
| Gas Hs factor | −41.8 | 1,896.2 |
| Drop AdBlue | −3.0 | **1,893.2 t** ✓ |

The unit error has **no effect** on market-based (Werk Süd is 0 there either way), while the method error dominates it. The two Scope 2 figures go wrong in different ways, which is the reason to report both.

**Per tonne, location-based:** 364.6 kg/t → fix numerator (1,915.2 t, still ÷ 4,900) = 390.9 kg/t → fix denominator (÷ 4,000) = **478.8 kg/t**. The boundary rule "same boundary above and below the line" is worth 88 kg/t on its own.

### 3.7 Trap register (one line per trap, used by deck, demo, guide and field card)

| # | Trap | File | Role | Effect | Check |
|---|---|---|---|---|---|
| T1 | "1.240 MWh" | Jahresuebersicht_Strom_WS_2025.md | Reader | S2 LB −495.5 t; MB 0 | Quote shows unit; 23 kWh per employee is impossible; prior year 1.310 MWh on the same page |
| T2 | Brennwert note on page 2 | Gas_Jahresrechnung_WN_2025.md | Reader, then Clerk | S1 +41.8 t | Gas row without basis is blocked by rule |
| T3 | Duplicate March | Scan_Rechnung_Maerz.md | Clerk | +82.0 t LB | Uniqueness key invoice no. + period + meter |
| T4 | October missing, hidden by T3, T5 and the two-month bill | (none) | Clerk | −80.0 t LB | Coverage grid counts months, not files |
| T5 | JV bill in the Werk Nord folder | Jahresrechnung_ABL_2025.md | Clerk | +320.0 t LB, +480.0 t at residual mix | Addressee vs boundary list |
| T6 | Certificate for one site treated as "Ökostrom" for the page; grid average for the rest | HKN_Bestaetigung_WS_2025.md | Clerk (method), Writer (claim) | MB −474.0 t; false "100 % Ökostrom" | Instrument table: certificate kWh ≤ covered kWh; residual mix for the rest |
| T7 | AdBlue in litres | Tankkarten_2025.csv | Clerk | +3.0 t | Product filter list |
| T8 | JV coating tonnage in denominator | Produktion_2025.csv | Clerk | −88 kg/t | Same boundary above and below the line |
| T9 | "No data gaps", "efficient", "kaum Emissionen" | (writer output) | Writer | wrong page text | No row, no sentence |

The two-month bill is not an error in itself (410,000 kWh is right). It is what makes "12 files" look like a full year.

---

## 4. The seven-act spine and scene list

Main path 4,500 s = **75 min**, plus 15 min questions. Interaction at least every 15 minutes (marked `vote`, `do`, `pair`, `write`). Route stations on the route bar (`data-route-stations`): `The page | The pile | Anatomy | Three jobs | Rematch | Limits | Your page`.

| Act | Minutes | Scenes |
|---|---|---|
| 0 · Open: who asks for the page | 5 | S01 to S04 |
| 1 · The wrong page | 8 | S05, S06 |
| 2 · Why it is wrong | 7 | S07, S08 |
| 3 · Fix: reader, clerk, writer | 17 | S09, S10, S11 |
| 4 · Rematch and your go | 15 | S12, S13, S14 |
| 5 · Honest limits | 11 | S15, S16, S17 |
| 6 · Your page, and the first vote again | 12 | S18, S19 |
| Questions | 15 | |

### Main scenes

**S01 · ESG Reporting with AI** (act 0, listen, 45 s)
- Screen: graphit cover with globe; title; subtitle "From a folder of bills to the one page a customer asks for"; footer "Fictional company, all numbers invented. Rules as of 26 September 2026. Not legal advice."
- Steps: none.
- Note: "This is about one page that someone at your company gets asked for every spring. We build it twice from the same folder, once badly and once properly, and the AI is in both runs. Everything you see is invented, including the company."

**S02 · Someone asks for this page every spring.** (act 0, listen, 105 s)
- Screen: the customer's e-mail (fictional OEM, "Lieferantenfragebogen, Frist 14.11.") and the bank's request, then the empty one-page card with its six fields and the fixed question on the q-card.
- Steps: 1 e-mail; 2 bank letter; 3 empty page with six fields; 4 the q-card.
- Note: "A customer and a bank both want the same six boxes. Nobody in this room is under CSRD because of these requests, but the answers still go out under your company's name. Keep this empty page in mind; we fill it twice."

**S03 · Kellbrunn: three sites, one joint venture, 180 people.** (act 0, listen, 90 s)
- Screen: site map drawing (WN, WS, LO solid; ABL hatched outside a dashed boundary line), staff and activity per site, the boundary sentence "Wir berichten nach operativer Kontrolle."
- Steps: 1 three sites; 2 JV outside the line; 3 the written boundary sentence.
- Note: "Kellbrunn makes metal parts. It owns 40% of a coating company but does not run it, and that sentence about operational control was written down before any AI saw a file. We will need it in about twenty minutes."

**S04 · Three jobs for the AI, and the route.** (act 0, listen, 60 s)
- Screen: route bar with seven stations; three role cards: Reader (reads and quotes), Clerk (rules count), Writer (every sentence cites a row); "You leave with: a one-page template and a checklist".
- Steps: 1 route; 2 three role cards; 3 what you leave with.
- Note: "Today the AI does three different jobs, and we trust it differently in each. Reading documents it does well if it quotes; counting it should hand to rules; writing it may only do from rows we approved."

**S05 · The pile: twenty files in one folder.** (act 1, listen, 150 s)
- Screen: folder tree of `Energie_2025/` (20 files) as hatched paper cards; three opened as samples: a Werk Nord monthly bill, the Werk Süd annual statement, the fuel-card CSV. Factor table and boundary note shown to the side as "given in both runs".
- Steps: 1 folder tree; 2 open monthly bill; 3 open Werk Süd statement; 4 open fuel-card CSV; 5 "given in both runs" chip.
- Note: "This is what a real folder looks like: bills, a scan someone forwarded, a CSV from the fuel-card provider, and a production export. Do not look for errors yet; just notice that nothing here is a table of emissions. The AI gets exactly this plus the factor table."

**S06 · The page the AI wrote from the pile.** (act 1, vote, 330 s)
- Screen: the filled one-page card: Scope 1 516.0 t; Scope 2 LB 1,270.5 t; MB 1,270.0 t; 365 kg/t; drivers WN electricity 1,226 t, WN gas 370 t, diesel 98 t; data gaps "Keine"; the two sentences. Label: "Constructed from documented failure modes, not a recorded run" (or the capture date once recorded). Model, prompt and factor file named in a footer chip.
- Steps: 1 numbers; 2 drivers and gaps; 3 the sentences; 4 vote card.
- **Room vote (same as the web decision lab):** "Would you send this page to the customer? A Send it · B Ask back first: build a month grid per site · C Regenerate with a stronger model." Hands up, count, write the split on the flip chart. No reveal.
- Note: "Read the page as if the CFO had just forwarded it to you. Vote now and remember your answer, because we come back to it at the end. I am not going to say what is wrong yet."

**S07 · Six traps moved the page, and they cancel each other.** (act 2, vote, 270 s)
- Screen: waterfall from 1,786.5 t to 1,915.2 t (location-based), one bar per trap, each bar tagged with its file.
- Steps: 1 prediction card: "Which single trap moved the total most? duplicate March · JV bill · 1.240 MWh"; 2 duplicate −82 and October +80 appear together ("net 2 t"); 3 JV −320; 4 MWh +495.5 (Mennige bar); 5 gas and AdBlue; 6 end total with ✓.
- Room vote: the prediction in step 1, by show of hands.
- Note: "Most rooms pick the duplicate, because duplicates feel like the classic error. It moves the total by 82 tonnes, and the missing October takes 80 of them back, so a total-level check sees nothing. The biggest error is a single dot in '1.240 MWh', and the JV bill hides two thirds of it."

**S08 · Each trap belongs to one job.** (act 2, listen, 150 s)
- Screen: the trap register T1 to T9 sorted into three columns: Reader (T1, T2), Clerk (T3 to T8), Writer (T9, plus the claim half of T6). Each chip shows its tonnes.
- Steps: 1 reader column; 2 clerk column; 3 writer column; 4 caption "Most tonnes sit in the clerk's column".
- Note: "Seven of the nine traps are counting and sorting problems, not reading problems. That is good news: counting and sorting can be done by rules that give the same answer every time. The next three scenes take one job each."

**S09 · Reader: every row carries its quote.** (act 3, vote, 300 s)
- Screen: left, the Werk Süd statement as a paper card; right, the extracted row: `qty 1.240 · unit MWh · file Jahresuebersicht_Strom_WS_2025.md · page 1 · quote "Verbrauch 2025: 1.240 MWh"`. Below: the extraction prompt's four rules (one row per quantity; copy value and unit as printed; give file, page, verbatim quote; write `UNSURE` instead of guessing).
- Steps: 1 bill; 2 vote card; 3 row with quote highlighted; 4 plausibility line "1,240 kWh ÷ 55 staff = 23 kWh per person per year; last year 1.310 MWh"; 5 Brennwert note on page 2 and the row with `basis: Hs` filled.
- **Room vote:** "What is '1.240 MWh'? A 1.24 MWh · B 1,240 kWh · C 1,240,000 kWh". Reveal C; A and B are the same factor-1,000 error.
- Note: "A reader that copies '1.240' and 'MWh' as printed, with the quote, gives you something you can check in five seconds. The plausibility line is the second net: twenty-three kilowatt hours would not run one CNC machine for an afternoon. Published extraction systems get about three in four numbers right, so we check quotes, not confidence."

**S10 · Clerk: count months, not files.** (act 3, do, 420 s)
- Screen: Werk Nord coverage grid (12 month columns) empty; the 12 file names as chips; three rules printed next to it: uniqueness key (invoice no. + period + meter), boundary list (addressee must be a site in `Standorte_und_Grenze.md`), product list for fuel (Diesel only).
- Steps: 1 empty grid and file chips; 2 **learners call out** where each file goes (facilitator drags); 3 March shows two chips (same invoice no.), ABL chip has no column; 4 October cell turns dashed `MISSING`; 5 meter file fills October with 200,000 (DQ B); 6 control total: documents 4,415,000 − excluded 1,005,000 + October 200,000 = 3,610,000 kWh ✓; 7 two more rules: gas rows need a basis (Hs/Hi), denominator uses the same site list.
- Learner action: the room places the 12 files on the grid out loud; pairs with the kit do it on `coverage_grid_2025.csv`.
- Note: "This is the job where the model should not work in its head. It can propose the rules, and it is good at that, but a spreadsheet applies them and a person approves the list. The control total is the line an auditor or a careful customer will ask for first."

**S11 · Writer: no row, no sentence.** (act 3, do, 300 s)
- Screen: the two sentences from the wrong page, split into five claims, each with an empty "row ID" box; next to it the writer prompt's rule ("Use only rows from the attached ledger. After every number write the row ID in brackets. If a claim has no row, do not write it; list it under 'not supported'.") and the banned-claims list (klimaneutral, 100 % Ökostrom for the company, umweltfreundlich, "effizient" without a benchmark).
- Steps: 1 five claims; 2 learners mark each "row / no row"; 3 verdicts appear (two keep with corrected numbers, one rewrite, two delete); 4 rewritten sentence: "Werk Süd's 1,240 MWh are covered by cancelled guarantees of origin (E-WS-01). That is 34% of our electricity."
- Learner action: mark each claim on the kit's `claims_check.csv` or by hand signal.
- Note: "The writer is the most fluent of the three jobs and the one we trust least. A sentence that names no row is deleted, however good it sounds. From 27 September 2026 vague green claims in consumer advertising are also a legal problem, so the rule protects more than the report."

**S12 · Same question, prepared ledger.** (act 4, listen, 240 s)
- Screen: the one-page card twice, side by side: hatched (raw) left, solid ink (ledger) right. Right side: 471.2 / 1,444.0 / 1,422.0 / 478.8 and 473.3 kg/t / drivers per method / five gaps; every number with a row-ID chip. Footer: "Same model, same prompt, same factor table. Only the input changed."
- Steps: 1 left page; 2 right page numbers; 3 row-ID chips; 4 data gaps field; 5 the ask-back paragraph the good run produced for the raw folder (four points: October, duplicate, ABL addressee, MWh reading).
- Note: "The model is the same in both runs. On the ledger it gives numbers you can trace, and on the raw folder the best it can do is to ask you four questions. If your tool never asks back on a folder like ours, that tells you something about the tool."

**S13 · One certificate, two Scope 2 numbers.** (act 4, vote, 240 s)
- Screen: the HKN confirmation card; two bars (LB 1,444.0; MB 1,422.0) with a bridge: −496 t (certificate at Werk Süd) and +474 t (residual mix on 2,370 MWh).
- Steps: 1 certificate; 2 vote card; 3 LB bar; 4 −496 bridge; 5 +474 bridge; 6 MB bar; 7 top-3 table per method (Werk Süd drops out in MB).
- **Room vote:** "The certificate covers all of Werk Süd. How far below location-based is market-based? A about 500 t lower · B zero, we buy green power · C only about 20 t lower". Reveal C.
- Note: "People expect the green tariff to show up as a big drop. It removes 496 tonnes at one site, but everything without a certificate is priced at the residual mix, which is higher than the grid average, and that adds 474 back. This is the insight line that belongs on the page, and it is why the ranking of drivers must name its method."

**S14 · Your go: trace two numbers to the paper.** (act 4, pair, 420 s)
- Screen: task card: "Trace (1) Scope 1 gas 376.2 t and (2) 478.8 kg/t to ledger rows and to the quote in the source file. Write row IDs, file, page, quote." Timer 6 min. Then expected result.
- Steps: 1 task; 2 timer; 3 expected result: (1) G-WN-01 + G-WS-01; `Gas_Jahresrechnung_WN_2025.md` p.1 "Energiemenge 1.850.000 kWh" and p.2 "Brennwert (Hs)"; `Gas_Jahresrechnung_WS_2025.md` p.1 "Energiemenge (Brennwert Hs) 240.000 kWh"; factor F-GAS-HS 0.18; 2,090,000 × 0.18 = 376.2. (2) numerator 1,915.2 t (Scope 1 + LB); denominator P-WN-01 + P-WS-01 = 4,000 t; P-ABL-01 excluded; 1,915.2 ÷ 4,000 = 478.8 kg/t. 4 "If it does not match" line: most common slip is 0.20 instead of 0.18, or 4,900 t.
- Learner action: pairs, on the printed ledger extract or the kit.
- Note: "Work in pairs and write it down; do not use a tool. If you get 418 for gas, look at page 2 of the Werk Nord bill. This is exactly what a customer's auditor does with your page: pick a number, ask for the rows, pick a row, ask for the paper."

**S15 · Calculate, ask back, or refuse?** (act 5, vote, 300 s)
- Screen: five requests to the AI, each with three buttons: "Sum Scope 2 for 2025" · "Fill in October" · "Write that we are climate neutral" · "Put our Scope 3 total in the questionnaire" · "Explain why emissions fell since 2023".
- Steps: one reveal per request: calculate from the ledger · ask back (meter reading or stated estimate, label DQ B/C) · refuse or rewrite (offset-based claims) · ask back (Scope 3 not calculated; say what is covered) · calculate first, then write (decompose; the 2023 baseline contained a site sold in 2024, appendix A6).
- **Room vote:** per request, three fingers (1 calculate, 2 ask back, 3 refuse).
- Note: "The right answer to a messy request is often a question. An assistant that fills in October without saying so has invented a number, however reasonable. The last request is a trap of its own: a headline drop can come from selling a site, and the appendix shows that case."

**S16 · What this method does not catch.** (act 5, listen, 240 s)
- Screen: five plain limits, each with a number or a source: (1) the factors here are teaching values; real ones change every year (UBA: 386 g for 2023, 363 g for 2024); (2) extraction benchmarks: about 77 to 78% of numbers right (ESGReveal 76.9%, ESG Insight 78.2%); (3) the wrong page is constructed, captured runs are dated and listed in A4; (4) rules catch what they are written for; an unknown source (refrigerant top-ups) stays invisible until someone lists it; (5) this is not an audit and not legal advice.
- Steps: one line per limit.
- Note: "The ledger makes errors visible; it does not make them impossible. Nothing on today's page covers refrigerants, because nobody put a service invoice in the folder. Say what you did not check on the page itself, in the data-gaps field."

**S17 · What is true today (26 September 2026).** (act 5, listen, 120 s)
- Screen: five statements from §8.1 with source chips and the footer "Rules as of 26.09.2026. Check before you present: German CSRD transposition, GHG Protocol timeline."
- Steps: one statement per step.
- Note: "Most of you are not under CSRD, but your customers may be, and they may ask you for what the voluntary standard covers. Scope 1 and 2 with both Scope 2 numbers are in it. I am not giving legal advice; these are the dates as of today."

**S18 · Your page: five boxes.** (act 6, write, 540 s)
- Screen: the transfer sheet (§6.3) with the Kellbrunn worked example beside each box. Instructions: "Use an invented or anonymised example. No company data in any tool." Timer 6 min writing + 3 min "two pairs share their hardest box".
- Steps: 1 sheet; 2 worked example; 3 timer; 4 share prompt.
- Learner action: writes the five boxes on paper.
- Note: "Pick one number someone actually asks you for. Box 3, the month grid, is where most people get stuck, so start there if you only have time for one. Two pairs will share their hardest box."

**S19 · Would you send the first page now?** (act 6, vote, 180 s)
- Screen: the wrong page from S06 again, now with the nine trap tags visible; the S06 vote split from the flip chart; the field card preview.
- Steps: 1 wrong page with tags; 2 repeat vote; 3 the two results side by side; 4 "You leave with: one-page template, field card, prompt pack."
- **Room vote:** the S06 vote again.
- Note: "Same page, same vote. If you moved from 'send' to 'ask back', you now know which four questions to ask. Take the field card; it is the page you check before any ESG number leaves the building."

Main path: 45 + 105 + 90 + 60 + 150 + 330 + 270 + 150 + 300 + 420 + 300 + 240 + 240 + 420 + 300 + 240 + 120 + 540 + 180 = **4,500 s = 75:00**. Longest stretch without an interaction: S07 (vote) to S09 (vote) = 270 + 150 s, under 15 minutes everywhere.

**Cut list (frees 11 min):** S04 merged into S02 (−60 s), S08 shown as a 30 s overlay on S07 (−120 s), S15 reduced to three requests (−120 s), S16 and S17 merged (−120 s), S18 sharing dropped (−180 s), S05 to three file openings (−60 s). Total −660 s. No outcome is lost.

### Appendix scenes (data-kind="appendix", 0 s)

- **A1 · The full ledger.** All rows of `ledger_energie_2025.csv` with status, DQ grade and exclusion reason; the control total.
- **A2 · The factor table and what it is not.** The teaching values next to their real-world anchors (UBA 2023/2024, AIB 2024 European residual mix), the licence note (IEA and ecoinvent restrict redistribution; do not paste licensed tables into external tools).
- **A3 · The prompt pack.** Reader, checker and writer prompts in full (§6.4).
- **A4 · How the two runs were made.** Protocol: same model and version, same date, same prompt text, same factor file; Condition A raw folder, Condition B ledger + boundary note; five runs per condition; scored on six numbers and four flags (October, duplicate, ABL addressee, MWh). Table of captured runs with date, or the "constructed" label. Sentence: "Current models with code execution may catch some of these traps. The claim here is that the folder decides what even a good model can know."
- **A5 · The data request e-mail.** Template to Stadtwerke Ahlental (October invoice) and to the landlord (sub-meter readings), from `templates/data-request-email.md`.
- **A6 · Why did emissions fall 39%?** The baseline case from the research (2023: 3,160.0 t incl. Werk 3, sold 1 Jul 2024; restated 2,215.0 t; like-for-like −13.5%; the 39.4 points split into 29.9 divestment, 5.7 grid factor, 3.8 own consumption). Used when S15's last request raises questions.

---

## 5. The interactive demo (`demo.html`)

**Question at the top:** "Which trap moves which number on the one page?" / „Welche Falle verschiebt welche Zahl auf der Seite?"

**Final state on load:** both pages (raw and ledger) are filled, all traps are shown as "fixed", the waterfall is drawn, and the evidence drawer is open on Scope 2 market-based. No button needs to be pressed to see a result. A "Replay from the raw page" button is optional.

**Sections, top to bottom:**

1. **q-card and the two pages.** The fixed question; two one-page cards side by side (hatched raw, solid ink ledger), six fields each. A metric switch above them (square tabs): Scope 1 · Scope 2 LB · Scope 2 MB · kg per tonne. The selected field is outlined on both pages.
2. **Trap switchboard with waterfall.** Nine rows (T1 to T9), each with a two-state switch "trap active / fixed", the file name, the role tag (Reader / Clerk / Writer) and its effect in tonnes for the selected metric. Next to it a horizontal waterfall from the raw value to the correct value for the selected metric. Turning a trap back on moves its bar and updates the right-hand page live. Traps that do not affect the selected metric show "0 t for this number" (T1 on market-based is the teaching case). T9 toggles the sentence block on the page between the raw text and the cited version. A "Only this trap" link per row sets all other traps to fixed, so learners can see T3 and T4 cancel (net −2 t) on their own.
3. **Evidence drawer ("Behind this number").** Click any number on the ledger page to open: the formula with values, the ledger rows it uses (row ID, qty as printed, unit, basis, status, DQ), and the source document rendered as paper with the quoted line highlighted in Mennige. Excluded rows are shown struck through with their reason. For "Data gaps" the drawer shows the coverage grid with the dashed October cell.
4. **Three jobs.** A compact strip, one column per role: what the AI did, the check, and which traps it owns (links scroll to the switchboard rows).
5. **Provenance footer.** "Fictional company, invented numbers, teaching factors. The raw page is constructed from documented failure modes / recorded on <date> with <model>. Runs only on this page; nothing is stored or sent."

**Mechanics:** one self-contained HTML file, inline data (the ledger rows, the raw rows, the trap deltas precomputed from `calc_C.py` and checked at load by recomputing from rows), no fetch, no storage. Encodings from the design direction: hatch = raw input, solid ink = approved figure, slate = recomputed check, dashed = estimate or gap, one Mennige mark = the number under discussion.

**Mobile (390 px):** the two pages stack (ledger page first, raw page collapsed under "Show the AI's raw page"); the metric switch becomes a horizontal scroll row of four tabs; the switchboard is a list with the switch at the right edge and the effect in tonnes under the name; the waterfall turns into a vertical list of signed bars under the switchboard; the evidence drawer opens as a full-width section directly below the tapped number, not a modal. Minimum tap target 44 px; no horizontal page scroll.

**Time:** about 10 minutes; linked from S07 and S12 for self-study, never required in the live path.

---

## 6. Learner materials

### 6.1 Learner guide (`guide.html`, read afterwards, phone first, about 2,000 words)

Sections mirror the acts. Each section: the question, a short answer, a "Reveal the explanation" retrieval prompt, one key point.

1. **Who asks for the page.** The six fields; the customer and the bank; why a 180-person company gets asked (value-chain cap, VSME Basic Module includes Scope 1 and 2). Reveal: "Which two Scope 2 numbers does the page need, and why both?"
2. **The pile.** The 20 files, what each contains. Reveal: "Twelve files in the Werk Nord folder, one covering two months. What does that tell you before you open any file?"
3. **The wrong page and its waterfall.** The constructed page, the six bars, why it passes a total check. Reveal: "Which two traps cancel each other, and by how much?"
4. **Reader.** Quote-first extraction; German number format; plausibility per site. Reveal: "What is '1.240 MWh' in kWh?"
5. **Clerk.** Coverage grid, uniqueness key, boundary list, product list, gas basis, same boundary above and below the line, control total. Reveal: "Why does the JV's 900 t not belong in the denominator?"
6. **Writer.** No row, no sentence; banned claims; the insight line. Reveal: "Why is market-based only 22 t lower?"
7. **Limits.** Teaching factors, extraction accuracy, constructed runs, unlisted sources, not legal advice. Reveal: "What would the method miss at Kellbrunn?" (refrigerants)
8. **Your page.** The five boxes and the closing sentence, with the Kellbrunn example.
9. **Glossary.** Scope 1, Scope 2 location-based, Scope 2 market-based, residual mix, guarantee of origin (Herkunftsnachweis), operational control, Brennwert (Hs) / Heizwert (Hi), emission factor, intensity, coverage grid, control total, DQ grade A/B/C, VSME, value-chain cap.
10. **One week later (follow-up).** Four recall questions with reveals and a stretch task: build the ledger for `raw/` yourself from `ledger_template.csv` and compare to `expected/`.

### 6.2 Field card (`field-card.html`, one A4, print CSS): "Before you trust an ESG number"

Eight blocks, each with a rule, Do, Don't, a Kellbrunn number and the scene it comes from.

1. **Quote.** Do: every number has file, page and the quoted line. Don't: accept a number the AI cannot point to. (Werk Süd: "Verbrauch 2025: 1.240 MWh", S09)
2. **Unit and format.** Do: keep the value and unit as printed next to the normalised value. Don't: convert in your head; "1.240" is one thousand two hundred forty. (−495.5 t, S09)
3. **Months, not files.** Do: fill a site × month grid before any sum. Don't: count files. (12 files, 11 months, S10)
4. **Once only.** Do: key on invoice number + period + meter. Don't: sum a forwarded copy. (+82 t, S10)
5. **Boundary.** Do: check the addressee against your written site list, and use the same list above and below the line of any intensity. Don't: include a bill because it is in your folder. (+320 t; 88 kg/t, S10)
6. **Factor.** Do: take factors from a pinned table with source, version, year, region and basis (Hs/Hi). Don't: let the model supply a factor from memory. (+41.8 t, S09/S10)
7. **Scope 2 twice.** Do: report location-based and market-based; certificate kWh ≤ covered kWh; residual mix for the rest. Don't: call one site's certificate "100 % Ökostrom". (1,444.0 vs 1,422.0 t, S13)
8. **No row, no sentence.** Do: cite a ledger row after every number and list the gaps. Don't: write "klimaneutral", "effizient" or "keine Datenlücken" without evidence. (S11, S15)

Footer: "Fictional example. Teaching factors. Rules as of 26.09.2026. Not legal advice."

### 6.3 Transfer sheet (`transfer.html` + `templates/transfer_one-page.md`, one A4)

Five boxes, template on the left, Kellbrunn worked example on the right. Header: "Use an invented or anonymised example. Put no company data into any tool."

| Box | Prompt | Worked example (Kellbrunn) |
|---|---|---|
| 1 · The number and who asks | Which number, which year, who asks, by when? | Scope 2 market-based 2025, OEM questionnaire, due 14.11. |
| 2 · The documents | Which files, who holds them, what format? | 12 monthly bills (Stadtwerke Ahlental, purchasing), WS annual statement + HKN (Talstrom), landlord statement LO |
| 3 · Boundary and months | Which sites are in, which out? Draw the month grid; mark gaps | WN, WS, LO in; ABL out (op. control). WN October missing, meter reading 200,000 kWh |
| 4 · Units and factors | Unit as printed, conversion rule, factor ID with source, version, year, basis | "1.240 MWh" → ×1,000; F-EL-RM-2025 0.60 (teaching value; real: AIB residual mix DE, 2025 edition) |
| 5 · Who does what | Reader / Clerk / Writer: what the AI does, what the rule does, what a person checks | AI extracts with quotes; spreadsheet dedupes and fills grid; controller signs the control total; every sentence cites a row |

Closing sentence: "For **[number]** in **[year]** we use **[documents]** for **[sites]**. The AI reads and quotes, the rules in **[file]** count, and every sentence cites a row. Still missing: **[gap]**, owner **[name/role]**, by **[date]**."
Kellbrunn: "For Scope 2 market-based in 2025 we use 11 bills, one meter reading, the WS statement with its HKN and the landlord statement for WN, WS and LO. The AI reads and quotes, the rules in ledger_energie_2025.csv count, and every sentence cites a row. Still missing: the October invoice, owner purchasing, by 31.10."

### 6.4 Kit (`esg-reporting-kit.zip`, text only: CSV, MD, HTML)

No PDF, XLSX, DOCX or PPTX. No `fetch`, storage or `innerHTML` in any HTML inside the zip. No root files named `notes.md`, `todo.md`, `claude.md`, `agents.md`.

| Path | Purpose |
|---|---|
| `START-HERE.md` | Five lines: what this is, open `raw/` first, then `prompts/01_reader_extraction.md`, compare with `expected/`, all data invented |
| `PUBLICATION.md` | Provenance: author, licence, synthetic data, teaching factors, name check date, run capture dates |
| `CHANGELOG.md` | Dated changes and the date of the last test with an AI tool |
| `LICENSE.md` | Licence for kit contents |
| `raw/werk-nord/strom/*.md` (12 files) | Text-rendered monthly bills incl. duplicate scan, two-month bill and the ABL annual bill |
| `raw/werk-nord/Gas_Jahresrechnung_WN_2025.md` | Gas bill; Brennwert note on page 2 |
| `raw/werk-nord/Zaehlerstaende_WN_2025.csv` | Month-end meter readings; source for October and the year cross-check |
| `raw/werk-sued/Jahresuebersicht_Strom_WS_2025.md` | "1.240 MWh" annual statement with prior year |
| `raw/werk-sued/HKN_Bestaetigung_WS_2025.md` | Guarantee-of-origin confirmation for Werk Süd only |
| `raw/werk-sued/Gas_Jahresrechnung_WS_2025.md` | Gas bill, Hs stated on page 1 |
| `raw/lager-ost/Untermessung_LO_2025.md` | Landlord sub-meter statement, four quarters |
| `raw/flotte/Tankkarten_2025.csv` | Fuel-card export with Diesel, AdBlue, car wash |
| `raw/produktion/Produktion_2025.csv` | Shipped tonnes incl. the JV coating line |
| `reference/Faktoren_Lehrwerte_2025.csv` | Teaching factors with basis column and "not official" header |
| `reference/Standorte_und_Grenze.md` | Site list, boundary approach, JV status |
| `ledger/ledger_template.csv` | Empty ledger with all columns and two worked rows |
| `ledger/ledger_energie_2025.csv` | The prepared ledger (Condition B) |
| `ledger/coverage_grid_2025.csv` | Site × month grid, filled |
| `ledger/instrument_table_2025.csv` | Certificate to site and kWh mapping |
| `prompts/00_run_protocol.md` | How to run the comparison fairly (same model, prompt, factor file; five runs; what to record) |
| `prompts/01_reader_extraction.md` | Extraction prompt: one row per quantity; fields `file, page, quote, qty_as_printed, unit_as_printed, basis, period_start, period_end, addressee, invoice_no, meter_id`; copy numbers exactly as printed; write `UNSURE` rather than guess; never convert units; never sum |
| `prompts/02_checker.md` | Checking prompt: given the extracted rows and the source files, verify for each row that value and unit appear verbatim in the quote, flag rows whose addressee is not on the site list, flag duplicate invoice numbers, list months with no row per site, list rows missing a basis; output a flag table only, no totals |
| `prompts/03_writer.md` | Narrative prompt: may use only the attached ledger and one-page numbers; row ID in brackets after every number; no benchmark, no cause, no claim without a row; banned words list; must fill "Data gaps" from rows with status ≠ actual or DQ ≠ A; end with a "not supported" list of anything it was asked but could not cite |
| `prompts/04_ask-back.md` | Model answer for the raw folder: the four questions a good assistant asks before giving numbers |
| `templates/one-page_template.md` | The six-field page with row-ID slots and the insight line |
| `templates/data-request-email.md` | DE and EN e-mails: to the utility for a missing invoice (meter ID, period, invoice number format), to a landlord for sub-meter readings, to a JV partner for its own figures (for Scope 3 cat. 15 later) |
| `templates/claims_check.csv` | Sentence · row ID · verdict (keep, rewrite, delete) · rewrite |
| `templates/transfer_one-page.md` | The five-box transfer sheet |
| `field-card.html` | Printable field card (same as public) |
| `transfer.html` | Printable transfer sheet (same as public) |
| `expected/expected_one-page_2025.md` | The correct page with all arithmetic |
| `expected/raw_page_constructed.md` | The wrong page, labelled constructed, with its trap trace |
| `expected/trace_exercise_answers.md` | S14 answers and the "if it does not match" hints |
| `expected/claims_check_answers.csv` | S11 verdicts |

Data request e-mail (EN version, for the kit):

> Subject: Missing electricity invoice October 2025, meter WN-E-01, customer no. 55-0192
>
> Hello,
> for our 2025 energy records we are missing the electricity invoice for 01.10.2025 to 31.10.2025 for meter WN-E-01 at Werk Nord. Our own readings show 4.812.300 kWh on 30.09. and 5.012.300 kWh on 31.10. Could you send the invoice, or a statement of the billed quantity, by 31.10.? A text or CSV file is enough.
> Thank you,
> [Name], Kellbrunn Präzisionsteile GmbH (fictional), energie@kellbrunn.example

---

## 7. Web detail page content

### 7.1 German (du-form)

- **title:** ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen
- **eyebrow:** Workshop 04 · ESG-Berichte
- **summary (137 characters):** Aus einem Ordner Energierechnungen wird die eine Seite, die Kunden und Banken verlangen. Du prüfst jede Zahl bis zur Zeile und zum Beleg.
- **description:** Die erfundene Kellbrunn Präzisionsteile GmbH soll einem Kunden und ihrer Bank eine Seite schicken: Scope 1, Scope 2 standort- und marktbasiert, Emissionen je Tonne ausgelieferter Teile, die drei größten Treiber und die Datenlücken für 2025. Aus dem Rohordner mit 20 Dateien liefert eine KI 1.270 t Scope 2 und „keine Datenlücken". Richtig sind 1.444 t standortbasiert und 1.422 t marktbasiert, und unter anderem fehlt die Oktoberrechnung. Du siehst, welche Fallen das verursachen, und teilst die Arbeit der KI in drei Aufgaben: lesen mit Zitat, zählen nach Regeln, schreiben nur mit Beleg. Dann stellst du dieselbe Frage an die vorbereitete Belegtabelle und schreibst die Seite für einen eigenen Fall. Alle Daten und Emissionsfaktoren sind erfundene Lehrwerte.
- **format:** Interaktiver Kurs · **duration:** ~90 Minuten
- **accessNote (2 sentences):** Für Kurs, Demo und Kit brauchst du kein Konto und keine Installation; die Materialien sind auf Englisch. Die gezeigte KI-Seite aus dem Rohordner ist aus dokumentierten Fehlerarten konstruiert, bis aufgezeichnete Läufe mit Datum vorliegen.
- **outcome:** Eine-Seite-Vorlage und Merkkarte
- **Danach kannst du (outcomes):**
  1. Du baust aus einem Ordner Energierechnungen eine Belegtabelle, in der jede Zeile Datei, Seite und Zitat nennt. *(geübt in: Akt 3 · Leser, Übung S14)*
  2. Du prüfst mit einem Monatsraster und drei Regeln, ob Rechnungen fehlen, doppelt sind oder nicht zu deiner Firma gehören. *(Akt 3 · Sachbearbeiter)*
  3. Du rechnest Scope 2 standort- und marktbasiert aus und begründest, warum ein Herkunftsnachweis nur einen Standort abdeckt. *(Akt 4)*
  4. Du streichst aus einem KI-Entwurf jeden Satz, der keine Zeile der Belegtabelle nennt. *(Akt 3 · Texter, Akt 5)*
- **Ablauf (agenda):**
  - Ankommen · 5 Min. · Du siehst die Anfrage des Kunden und die leere Seite mit sechs Feldern.
  - Die falsche Seite · 8 Min. · Du stimmst ab: Würdest du die Seite der KI so rausschicken?
  - Warum sie falsch ist · 7 Min. · Du tippst, welche Falle die Summe am stärksten verschiebt.
  - Lesen, zählen, schreiben · 17 Min. · Du ordnest zwölf Rechnungen in ein Monatsraster und prüfst fünf Sätze auf Belege.
  - Zweiter Versuch · 15 Min. · Du verfolgst zu zweit zwei Zahlen bis zur Zeile im Dokument.
  - Grenzen · 11 Min. · Du entscheidest bei fünf Aufträgen: rechnen, nachfragen oder ablehnen.
  - Deine Seite · 12 Min. · Du füllst fünf Felder für eine eigene Zahl und stimmst noch einmal ab.
  - Fragen · 15 Min.
- **Steps (registry, 7):**
  01 Die Anfrage · 02 Die Seite aus dem Rohordner · 03 Sechs Fallen, eine Summe · 04 Lesen, zählen, schreiben · 05 Dieselbe Frage an die Belegtabelle · 06 Grenzen und Stand der Regeln · 07 Deine Seite in fünf Feldern. *(Each gets a one-sentence description built from the agenda lines; `tool` e.g. "Kurs · Akt 1".)*
- **Du brauchst:** einen Browser, am besten einen großen Bildschirm für die Folien · Papier und Stift für die fünf Felder · optional ein Tabellenprogramm, um die CSV-Dateien des Kits zu öffnen.
- **Du brauchst nicht:** kein KI-Konto · keine Programmierkenntnisse · keine Vorkenntnisse zu CSRD oder ESRS · keine eigenen Firmendaten, alles ist erfunden und im Kit.
- **Nicht in diesem Workshop:** keine Rechtsberatung und keine Prüfung, ob deine Firma berichtspflichtig ist · kein Durchgang durch ESRS oder VSME Datenpunkt für Datenpunkt · keine Scope-3-Berechnung (nur ein Ausblick im Anhang) · keine amtlichen Emissionsfaktoren, nur Lehrwerte · kein Vergleich von ESG-Software.
- **Für wen (audience, 3 lines):**
  - Nachhaltigkeitsverantwortliche im Mittelstand, die Kundenfragebögen zu Scope 1 und 2 beantworten
  - Controlling und Finanzen, die Emissionszahlen an Banken oder Geschäftsführung weitergeben
  - Technik und Einkauf, die Energierechnungen, Zählerstände und Tankkarten verwalten
- **Decision lab:**
  - kicker: `Entscheidung 01 · Datenlücken`
  - title: Zwölf Dateien für zwölf Monate?
  - prompt: Eine KI hat aus dem Rohordner die Seite für den Kunden erstellt: Scope 1 516 t, Scope 2 standortbasiert 1.270 t, marktbasiert 1.270 t, Datenlücken keine. Im Ordner Werk Nord liegen zwölf Stromrechnungen. Schickst du die Seite so raus?
  - facts (exactly 3): „Ordner Werk Nord: 12 Stromrechnungen" · „Eine Rechnung deckt November und Dezember" · „KI-Seite: Datenlücken keine"
  - decisionLegend: Deine erste Entscheidung · evidenceLegend: Der stärkste Beleg
  - choices:
    - `send-now`: Rausschicken. Alle sechs Felder sind gefüllt und die Werte wirken plausibel.
    - `check-coverage`: Erst je Standort ein Monatsraster füllen und die Rechnungen zuordnen, dann schicken.
    - `stronger-model`: Die Seite mit einem stärkeren Modell neu erzeugen lassen.
  - evidence:
    - `month-count`: Zwölf Dateien, eine davon für zwei Monate: Das ergibt 13 Monate für ein Jahr. Mindestens eine Datei gehört nicht in die Summe.
    - `method-named`: Die KI nennt zu jeder Zahl die Methode und den Faktor.
    - `all-filled`: Kein Feld der Seite ist leer.
  - recommendedChoiceId: `check-coverage` · strongestEvidenceId: `month-count`
  - submitLabel: Entscheidung prüfen · resetLabel: Neu entscheiden
  - privacyNote: Läuft nur auf dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.
  - feedback:
    - aligned: title „Die Dateien ergeben 13 Monate." body „Richtig. Im Ordner liegen eine doppelte Märzrechnung und die Rechnung einer Beteiligung, und der Oktober fehlt. Das Monatsraster zeigt alle drei, bevor jemand rechnet."
    - decisionOnly: title „Richtige Entscheidung, schwacher Beleg." body „Das Raster ist richtig. Der Grund ist die Zählung: zwölf Dateien, eine für zwei Monate, also 13 Monate für ein Jahr. Methode und volle Felder sagen nichts über fehlende Belege."
    - evidenceOnly: title „Dein Beleg spricht gegen deine Entscheidung." body „Wenn zwölf Dateien 13 Monate abdecken, gehört mindestens eine nicht in die Summe. Das klärt kein neuer Lauf und kein Versand, sondern ein Monatsraster je Standort."
    - unsupported: title „Volle Felder sind noch keine vollständigen Daten." body „Die Seite meldet keine Lücken, obwohl der Oktober fehlt und zwei Dateien nicht in die Summe gehören. Ein stärkeres Modell sieht denselben Ordner. Erst das Monatsraster zeigt es."
    *(evidenceOnly contains one `nicht …, sondern`; this is the budgeted contrast for the lab, correcting the belief the learner just chose.)*
- **Der Fall (caseStudy):**
  - companyName: Kellbrunn Präzisionsteile GmbH · isFictional: true
  - location: Erfundenes Unternehmen mit drei Standorten in Deutschland
  - sector: Metallteile (Stanzen, CNC-Bearbeitung) für Maschinenbau und Automobilindustrie
  - period: Geschäftsjahr 2025, eingefrorener Übungsstand
  - narrative: Kellbrunn hat 180 Beschäftigte, drei Standorte und 40 % an einer Pulverbeschichtung, die der Partner betreibt. Ein Kunde und die Hausbank verlangen dieselbe Seite zu Scope 1 und 2 für 2025. Grundlage ist ein Ordner mit 20 Dateien: Rechnungen, Zählerstände, ein Tankkarten-Export und ein Produktionsauszug.
  - metrics (4): Beschäftigte · 180 | Standorte in der Grenze · 3 | Dateien im Rohordner · 20 | Ausgelieferte Teile 2025 · 4.000 t
  - decisionQuestion: Welche Zahlen darf Kellbrunn auf die Seite schreiben, und welche Lücken muss die Seite selbst nennen?
  - dataLimitations (4):
    1. Unternehmen, Rechnungen und Mengen sind erfunden.
    2. Alle Emissionsfaktoren sind gerundete Lehrwerte und keine amtlichen Werte von UBA oder AIB.
    3. Die KI-Seite aus dem Rohordner ist aus dokumentierten Fehlerarten konstruiert; aufgezeichnete Läufe werden mit Datum ergänzt.
    4. Der Fall deckt Scope 1 und 2 aus Energie ab. Kältemittel und Scope 3 sind nicht berechnet.

### 7.2 English

- **title:** ESG Reporting with AI: From Raw Inputs to Clearer Insights
- **eyebrow:** Workshop 04 · ESG reporting
- **summary (135 characters):** Turn a folder of energy bills into the one page customers and banks ask for, and trace every number on it back to a row and a document.
- **description:** The fictional Kellbrunn Präzisionsteile GmbH has to send one page to a customer and its bank: Scope 1, Scope 2 location-based and market-based, emissions per tonne of parts shipped, the top three drivers and the data gaps for 2025. From a raw folder of 20 files, an AI reports 1,270 t of Scope 2 and "no data gaps". The right figures are 1,444 t location-based and 1,422 t market-based, and the October invoice is missing, among other gaps. You see which traps cause this and split the AI's work into three jobs: reading with a quote, counting by rules, and writing only from evidence. Then you ask the same question of the prepared ledger and write the page for a case of your own. All data and emission factors are invented teaching values.
- **format:** Interactive course · **duration:** ~90 minutes
- **accessNote:** You need no account and no installation for the course, demo and kit. The AI page from the raw folder is constructed from documented failure modes until dated recorded runs are added.
- **outcome:** One-page template and field card
- **After this you can:**
  1. Build a ledger from a folder of energy bills in which every row names the file, page and quote.
  2. Check with a month grid and three rules whether bills are missing, duplicated or belong to another company.
  3. Work out Scope 2 location-based and market-based, and explain why a guarantee of origin covers only one site.
  4. Delete every sentence from an AI draft that does not cite a ledger row.
- **Agenda:** Open · 5 min · You see the customer's request and the empty page with six fields. / The wrong page · 8 min · You vote: would you send the AI's page as it is? / Why it is wrong · 7 min · You predict which trap moves the total most. / Read, count, write · 17 min · You sort twelve bills into a month grid and check five sentences for evidence. / Second run · 15 min · In pairs, you trace two numbers to the line in the document. / Limits · 11 min · For five requests you decide: calculate, ask back or refuse. / Your page · 12 min · You fill five boxes for a number of your own and vote again. / Questions · 15 min.
- **What you need:** a browser, ideally a large screen for the slides · paper and pen for the five boxes · optionally a spreadsheet program to open the kit's CSV files.
- **What you don't need:** an AI account · programming · prior knowledge of CSRD or ESRS · your own company data; everything is invented and in the kit.
- **Not covered:** legal advice or whether your company must report · a datapoint-by-datapoint walk through ESRS or VSME · Scope 3 calculation (only an outlook in the appendix) · official emission factors (teaching values only) · a comparison of ESG software.
- **Audience:** Sustainability leads in mid-sized companies who answer customer questionnaires on Scope 1 and 2 · Controllers and finance staff who pass emissions figures to banks or management · Facilities and purchasing staff who handle energy bills, meter readings and fuel cards
- **Decision lab:** kicker `Decision 01 · Data gaps`; title "Twelve files for twelve months?"; prompt "An AI built the customer page from the raw folder: Scope 1 516 t, Scope 2 location-based 1,270 t, market-based 1,270 t, data gaps none. The Werk Nord folder holds twelve electricity bills. Do you send the page as it is?"; facts "Werk Nord folder: 12 electricity bills" · "One bill covers November and December" · "AI page: data gaps none"; decisionLegend "Your first decision"; evidenceLegend "The strongest evidence"; choices `send-now` "Send it. All six fields are filled and the values look plausible." · `check-coverage` "First fill a month grid per site and place each bill, then send." · `stronger-model` "Have a stronger model generate the page again."; evidence `month-count` "Twelve files, one covering two months: that is 13 months for one year. At least one file does not belong in the sum." · `method-named` "The AI names the method and factor for every number." · `all-filled` "No field on the page is empty."; recommended `check-coverage` / `month-count`; submitLabel "Check decision"; resetLabel "Decide again"; privacyNote "Runs only on this page. Your selection and result are neither stored nor sent."; feedback aligned "The files add up to 13 months." / "Right. The folder holds a duplicate March bill and a joint venture's bill, and October is missing. The month grid shows all three before anyone calculates." · decisionOnly "Right decision, weak evidence." / "The grid is right. The reason is the count: twelve files, one for two months, so 13 months for one year. A named method and full fields say nothing about missing bills." · evidenceOnly "Your evidence argues against your decision." / "If twelve files cover 13 months, at least one does not belong in the sum. Neither sending nor a new run settles that. A month grid per site does." · unsupported "Full fields are not complete data." / "The page reports no gaps although October is missing and two files do not belong in the sum. A stronger model sees the same folder. The month grid shows it."
- **Case study:** companyName Kellbrunn Präzisionsteile GmbH; isFictional true; location "Fictional company with three sites in Germany"; sector "Metal parts (stamping, CNC machining) for machinery and automotive"; period "Financial year 2025, frozen practice data"; narrative "Kellbrunn has 180 employees, three sites and a 40% stake in a powder-coating company run by its partner. A customer and the house bank ask for the same page on Scope 1 and 2 for 2025. The source is a folder of 20 files: bills, meter readings, a fuel-card export and a production extract."; metrics Employees 180 · Sites in the boundary 3 · Files in the raw folder 20 · Parts shipped 2025 4,000 t; decisionQuestion "Which numbers may Kellbrunn put on the page, and which gaps must the page itself name?"; dataLimitations: "The company, bills and quantities are invented." · "All emission factors are rounded teaching values, not official UBA or AIB values." · "The AI page from the raw folder is constructed from documented failure modes; recorded runs will be added with their dates." · "The case covers Scope 1 and 2 from energy. Refrigerants and Scope 3 are not calculated."

Copy checks for the build: no U+2013/U+2014 anywhere in the registry payload (the tables above use none); summaries under 160 characters; outcomes use bauen, prüfen, ausrechnen, begründen, streichen / build, check, work out, explain, delete (no verstehen/kennen/understand); no "klimaneutral" except as a quoted banned claim; material labels without "öffnen"/"Open"/parentheses, e.g. `Kurs · 19 Szenen`, `Lernbegleiter`, `Interaktive Demo · 10 Min.`, `Merkkarte`, `Transferblatt`, `ESG-Kit · .zip`.

---

## 8. Regulation: what is true today, and what the workshop must not claim

### 8.1 True as of 26 September 2026 (for S17; sources from `esg-regulation.md`)

1. **Since 18 March 2026, the EU sustainability reporting law (CSRD) covers only companies with more than 1,000 employees and more than €450 million net turnover; both conditions must be met.** Directive (EU) 2026/470. [Consilium, 24 Feb 2026](https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/)
2. **Suppliers with up to 1,000 employees can refuse data requests from reporting customers that go beyond the EU's voluntary standard based on the VSME.** That standard was published on 21 Sep 2026 as Delegated Regulation (EU) 2026/1560. [EP press release, Dec 2025](https://www.europarl.europa.eu/news/en/press-room/20251211IPR32164/simplified-sustainability-reporting-and-due-diligence-rules-for-businesses); [EUR-Lex 2026/1560](https://eur-lex.europa.eu/eli/reg_del/2026/1560/oj/eng)
3. **The VSME Basic Module has 11 disclosures, including Scope 1 and Scope 2 emissions, and needs no double materiality assessment and no auditor.** [EFRAG](https://www.efrag.org/en/news-and-calendar/news/efrag-releases-the-voluntary-sustainability-reporting-standard-for-nonlisted-smes); Commission Recommendation (EU) 2025/1710 [Commission](https://finance.ec.europa.eu/publications/commission-presents-voluntary-sustainability-reporting-standard-ease-burden-smes_en)
4. **Scope 2 is reported twice: location-based (average grid) and market-based (contracts and certificates).** The 2015 GHG Protocol Scope 2 Guidance still applies; a joint GHG Protocol/ISO standard is planned for consultation in Q2 2027 and publication in Q4 2028. [Scope 2 Guidance](https://ghgprotocol.org/sites/default/files/2023-03/Scope%202%20Guidance.pdf); [GHG Protocol update, 29 Jul 2026](https://ghgprotocol.org/blog/ghg-protocol-announces-key-standard-development-updates)
5. **From 27 September 2026, EU consumer law bans vague environmental claims such as "eco-friendly" without proof, and "climate neutral" product claims based on offsets.** Directive (EU) 2024/825. [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2024/825/oj/eng); [Commission FAQ](https://commission.europa.eu/document/download/3c257883-bb2a-4dd9-a6dc-501d587bb34f_en?filename=faq-empowerting-consumers-gtd.pdf)
6. **The revised ESRS were published on 21 Sep 2026 (Delegated Regulation (EU) 2026/1563), with more than 60% fewer mandatory datapoints according to the Commission; mandatory from financial year 2027.** [Commission, 3 Jul 2026](https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-reduce-administrative-burdens-eu-2026-07-03_en)

Footer on S17: "Rules as of 26.09.2026. Not legal advice. Check before you present: status of Germany's CSRD transposition (last verified step: Bundestag hearing 13 Apr 2026, final passage UNVERIFIED), and the GHG Protocol timeline."

### 8.2 The workshop must not claim

1. **Anything about the final status of Germany's CSRD implementation law** ("passed" or "not passed"). The latest verified step is the committee hearing of 13 April 2026; final passage is UNVERIFIED. Say "Germany is transposing the CSRD; check the BMJV procedure page."
2. **That AI output, or the method taught here, is audit-ready, compliant or "ESRS-konform".** No source supports it. Reports need management judgement, traceable data and (for CSRD companies) limited assurance. Also do not state absolute ESRS datapoint counts ("1,073 to 320"): UNVERIFIED.
3. **That hourly matching or a new Scope 2 standard applies from 2027, or that market-based replaces location-based.** Hourly matching is a consultation proposal; the 2015 guidance with dual reporting applies today. Related: do not say the Green Claims Directive is in force or formally withdrawn (it is stalled but pending), and do not quote the national UWG transposition details (§ 15b transitional rule) as settled; they are secondary-source only.
