# Workshop 04 concept, angle B: "The headline that fell apart"

Working title (EN): ESG Reporting with AI: From Raw Inputs to Clearer Insights
Working title (DE): ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen
Slug: `esg-berichte-mit-ki` · Number: `04` · Slot: 90 minutes (77 min programme, 13 min questions)
Date of concept: 2026-09-26. Status: concept for review, nothing built.

Sources used: `research/esg-ai-practice.md` (datasets, failure modes, decision moments), `research/esg-regulation.md` (legal status on 26 Sep 2026), `research/workshop-standard.md` (spine, components, detail page), `research/map-deck-engine.md` (scene contract, notes schema), `research/design-direction.md` (visual language), `research/map-workshop-touchpoints.md` (hard constraints), `research/slop-language.md` (voice). Arithmetic was recomputed with `w04/calc_B.py` (Python `Decimal`); every figure below comes from that script.

---

## 0. The idea in five sentences

1. A customer questionnaire and the annual brochure need one sentence about emissions, and an AI drafts it from the company's raw energy folder: "Since 2023 we have cut our CO₂ emissions by 43% through targeted efficiency measures, and our production runs on 100% green power."
2. The workshop takes that sentence apart as a waterfall of bars in tonnes: 945 t from selling a site, 180.5 t from a cleaner grid, 119.3 t from using less energy, and 128.7 t from data errors in the folder.
3. The data-error bar looks small because six traps cancel each other (+446.8 t and −575.5 t), so the room opens it bar by bar: a duplicate invoice, a missing month, a joint-venture bill, "1.240 MWh" read as kWh, a gas factor on the wrong calorific basis, and AdBlue counted as diesel.
4. Fixing the data moves the headline from 43% to 39%, and the sentence still falls apart: 29.9 of the 39.4 points come from the site sale, like for like the cut is 13.5%, and the green-power certificate covers one site, 34% of the electricity.
5. The rebuilt sentence cites a ledger row for every number, and the September 2026 consumer-protection rules mark the honest limit of what any sentence may claim.

Why this angle works with the W03 pattern: one question held fixed (the sentence for the customer), asked on two data states (raw folder, prepared ledger), a plausible wrong answer (43% and 100% green), the anatomy of the error (the waterfall), the fix (ledger plus decomposition), the rematch (same question, ledger input), honest limits (claims rules, estimates, teaching factors) and transfer (one sentence from the learner's own work).

A design choice worth naming: the brief's example headline says 39%. In this dataset 39.4% is what a **correct** ledger gives. The AI on the raw folder writes 43%. That lets the workshop make its central point twice: first the number is wrong (43 → 39), then the correct number still does not support the sentence (39 → 13.5 like for like, 3.8 points of own action on the original base).

---

## 1. The fixed question and the promise

### 1.1 The fixed question (verbatim)

EN (deck, kit, guide):
> "How much did Fernholt's Scope 1 and 2 emissions change from 2023 to 2025, why, and how much of the electricity was green? Answer in one sentence we can send to the customer."

DE (detail page, decision lab):
> „Um wie viel haben sich die Scope-1- und Scope-2-Emissionen von Fernholt von 2023 bis 2025 verändert, warum, und wie viel des Stroms war Ökostrom? Antworte in einem Satz, den wir dem Kunden schicken können.“

The question contains the word "why" on purpose. Without it, an AI can give a correct total and stop. With it, the AI has to explain the change, and that is where the sentence breaks.

### 1.2 The promise

EN: "After 90 minutes you can take a sustainability sentence that an AI drafted, split its number into bars you can trace to a document, and rewrite it so that every figure has a source."

DE: „Nach 90 Minuten kannst du einen Nachhaltigkeitssatz, den eine KI entworfen hat, in Balken zerlegen, jeden Balken zu einem Beleg zurückverfolgen und den Satz so neu schreiben, dass jede Zahl eine Quelle hat.“

---

## 2. The fictional company

### 2.1 Name check

- Proposed name: **Fernholt Präzisionsteile GmbH**. Web searches on 2026-09-26 for `"Fernholt Präzisionsteile"` and `"Fernholt" GmbH` found no company with this name. The nearest hit is **W.u.H. Fernholz GmbH & Co. KG**, a packaging maker in Meinerzhagen with about 200 staff (bloomberg.com, linkedin.com, fernholz.biz). The names differ by one letter and the sector differs, so confusion is unlikely but possible for a reader in Südwestfalen.
- Recommendation: keep "Fernholt", print "fiktives Unternehmen / fictional company" on every scene that shows the name, and run a Handelsregister and DPMA check before publishing. If the owner wants zero risk, the fallback is **Haldenried Präzisionsteile GmbH** (not searched; check it the same way).
- Joint venture name **Pulverbeschichtung Mitte GmbH**: a search for the exact name found no company (only other powder coaters with different names). Same check before publishing.
- The steel supplier from the research (Bandstahl Wendelin GmbH) is not used in the main path.
- Content rules: none of the banned dummy names (`Müller Maschinenbau`, `Schmidt GmbH`, `Meier AG`, `Keller KG`, `Max Mustermann`) appear. Any email in the kit uses `@example.com`.

### 2.2 Profile

| Field | Value |
|---|---|
| Name | Fernholt Präzisionsteile GmbH (fictional) |
| Sector | Metal parts supplier: stamping, CNC machining, assembly; customers are automotive and machinery OEMs |
| Size | 180 employees, turnover €42m (illustrative) |
| Reporting status | Outside CSRD scope after Omnibus I (needs >1,000 staff **and** >€450m). Reports because an OEM customer and the house bank ask. |
| Why now | OEM questionnaire due 31 Oct 2026 asks for "Scope 1+2 emissions 2025", "reduction since base year" and "share of renewable electricity". The same sentence is planned for the website brochure "Nachhaltigkeit 2025". |
| Base year | 2023 (first inventory, done by an intern with the 2023 factor set) |
| Organisational boundary | **Operational control**, written down in `Basisjahr/Strukturaenderungen_2024.md` |

### 2.3 Sites and boundary

| Site ID | Site | Activity | Staff | In boundary 2025? | Note |
|---|---|---|---|---|---|
| WN | Werk Nord (HQ) | Stamping, assembly, offices | 110 | Yes (owned) | Electricity billed monthly, gas annually |
| WS | Werk Süd | CNC machining | 55 | Yes (owned) | Green tariff with guarantees of origin since 2025 |
| LO | Lager Ost | Leased warehouse with own sub-meter | 15 | Yes (leased, operated by Fernholt) | Landlord bills quarterly |
| JV | Pulverbeschichtung Mitte GmbH | Powder coating | none of Fernholt's staff | **No** | Fernholt holds 40%, the partner operates it. Fernholt's purchasing handles its energy contract, so its bill lands in the Werk Nord folder. |
| W3 | Werk 3 (foundry) | Casting | none in 2025 | **No** (sold 1 Jul 2024) | In the 2023 base year with 945.0 t |

---

## 3. The dataset

All documents are synthetic. Bills are written in German, with German number format, because the number format is one of the traps. All instructions, prompts and the deck are in English. No PDF, XLSX or DOCX anywhere: bills ship as Markdown files laid out like a bill (`.md`), tables as `.csv` (semicolon, decimal comma, as a German ERP export would be). The deck and demo show the bills as rendered HTML "paper" cards, not images of PDFs.

### 3.1 Illustrative teaching factors (NOT official values)

Shipped as `data/factors/Faktoren_Lehrwerte.csv`. Every scene that uses a factor carries the caption "Teaching values, rounded for mental arithmetic. Not official factors."

| factor_id | Description | Value | Unit | Order-of-magnitude anchor (not used in any calculation) |
|---|---|---|---|---|
| F-EL-LB-2025 | Grid electricity DE, location-based, 2025 | 0.40 | kg CO₂e/kWh | UBA: 363 g CO₂/kWh for 2024, direct CO₂ only |
| F-EL-LB-2023 | Grid electricity DE, location-based, 2023 | 0.45 | kg CO₂e/kWh | UBA: 386 g CO₂/kWh for 2023 |
| F-EL-RM-2025 | Residual mix DE, market-based, 2025 | 0.60 | kg CO₂e/kWh | AIB publishes a residual mix every year; the German value is usually above the grid average |
| F-EL-GO | Electricity covered by cancelled guarantees of origin | 0.00 | kg CO₂e/kWh | Scope 2 Guidance (2015), market-based method |
| F-GAS-HS | Natural gas per kWh gross calorific value (Brennwert, Hs) | 0.18 | kg CO₂e/kWh(Hs) | about 0.20 per kWh(Hi) divided by 1.11 |
| F-GAS-HI | Natural gas per kWh net calorific value (Heizwert, Hi) | 0.20 | kg CO₂e/kWh(Hi) | common published values around 0.20 |
| F-DSL | Diesel, road | 2.50 | kg CO₂e/litre | published values roughly 2.5 to 2.7 |
| C-DSL-E | Diesel energy content | 10.0 | kWh/litre | about 9.8 to 10.0 net |
| C-HS-HI | Gross to net ratio, natural gas | 1.11 | ratio | |

Real values move every year and some databases are licensed. The appendix scene `appendix-factors` says so; the kit's `START-HERE.md` tells learners never to copy these numbers into a real report.

### 3.2 The raw folder (Ask 1 input), 22 files

Folder name in the kit: `data/raw/`. The AI in Ask 1 receives all 22 files plus the factor table.

**`Energie_2025/Werk_Nord/Strom/`: 12 files, electricity bills from "Stadtwerke Beispielstadt" (fictional supplier)**

| # | File | Period printed on the bill | Quantity printed | Invoice no. | Trap |
|---|---|---|---|---|---|
| 1 | `2025-01_Strom_WN.md` | 01.01.2025 bis 31.01.2025 | 210.000 kWh | 4711-01 | |
| 2 | `2025-02_Strom_WN.md` | 01.02. bis 28.02.2025 | 195.000 kWh | 4711-02 | |
| 3 | `2025-03_Strom_WN.md` | 01.03. bis 31.03.2025 | 205.000 kWh | 4711-03 | |
| 4 | `Scan_Rechnung_Maerz.md` | 01.03. bis 31.03.2025 | 205.000 kWh | 4711-03 | **Duplicate.** Same invoice number, saved again from purchasing's email; header line "Weitergeleitet: Rechnung März" |
| 5 | `2025-04_Strom_WN.md` | April | 190.000 kWh | 4711-04 | |
| 6 | `2025-05_Strom_WN.md` | May | 185.000 kWh | 4711-05 | |
| 7 | `2025-06_Strom_WN.md` | June | 180.000 kWh | 4711-06 | |
| 8 | `2025-07_Strom_WN.md` | July | 175.000 kWh | 4711-07 | |
| 9 | `2025-08_Strom_WN.md` | August | 120.000 kWh | 4711-08 | Low because of the plant holiday. Real, not an error. Tests whether the AI "corrects" a true value. |
| 10 | `2025-09_Strom_WN.md` | September | 190.000 kWh | 4711-09 | |
| 11 | `2025-11-12_Strom_WN.md` | 01.11. bis 31.12.2025 | 410.000 kWh | 4711-11 | **One bill for two months.** The supplier switched to a two-month cycle. This is why 12 files do not mean 12 months. |
| 12 | `Jahresrechnung_PBM_2025.md` | 01.01. bis 31.12.2025 | 800.000 kWh | PBM-2025 | **Outside the boundary.** Addressed to "Pulverbeschichtung Mitte GmbH", the joint venture. |
| none | *(missing)* | 01.10. bis 31.10.2025 | | 4711-10 | **October bill is missing.** |

Every bill file has the same layout: supplier block, "Rechnungsempfänger" block (Fernholt Präzisionsteile GmbH, Werk Nord, or Pulverbeschichtung Mitte GmbH for #12), Zählpunkt (meter ID `DE000123WN01`, JV: `DE000123PB07`), Abrechnungszeitraum, Verbrauch, Arbeitspreis, Netto, USt, Brutto, and an "Abschlag" line for next month's advance payment in € (a small extra trap: an AI should not read the € figure as consumption).

**`Energie_2025/Werk_Nord/`**
- `Gas_Jahresrechnung_WN_2025.md`: "Abrechnungszeitraum 01.01. bis 31.12.2025 · Energiemenge 1.850.000 kWh · abgerechnet nach Brennwert (Hs)".
- `Zaehlerstaende_WN_2025.csv`: the facility manager's monthly meter readings for meter `DE000123WN01`. Columns `Datum;Zaehlerstand_kWh;Ablesung_durch`. Relevant rows: `30.09.2025;4.812.300;Hausmeister` and `31.10.2025;5.012.300;Hausmeister`. October = 5,012,300 − 4,812,300 = **200,000 kWh**. The file sits in the folder the AI reads; the number was available all along.

**`Energie_2025/Werk_Sued/`**
- `Jahresuebersicht_2025_Oekostrom.md`: "Tarif Ökostrom Plus · Lieferstelle Werk Süd · Verbrauch 2025: **1.240 MWh**". Unit MWh, German thousands point.
- `HKN_Bestaetigung_2025.md`: "Herkunftsnachweise über **1.240 MWh**, Erzeugungsjahr 2025, Wasserkraft, entwertet im Herkunftsnachweisregister für die Lieferstelle Werk Süd". Covers Werk Süd only.
- `Gas_Jahresrechnung_WS_2025.md`: "Energiemenge 240.000 kWh · abgerechnet nach Brennwert (Hs)".

**`Energie_2025/Lager_Ost/`**
- `Untermessung_LO_2025.md`: landlord's statement for the sub-meter, four quarterly lines: Q1 30.000 kWh, Q2 25.000 kWh, Q3 25.000 kWh, Q4 30.000 kWh. Standard tariff (no green instrument).

**`Energie_2025/Tankkarten_2025.csv`**: monthly export from the fuel-card portal. Columns `Monat;Produkt;Menge;Einheit;Betrag_EUR`.
- 12 diesel rows (litres): Jan 3.300; Feb 3.100; Mar 3.300; Apr 3.200; May 3.200; Jun 3.100; Jul 3.000; Aug 2.600; Sep 3.300; Oct 3.300; Nov 3.300; Dec 3.300. Sum **38,000 l**. Amount at 1,60 €/l, e.g. `2025-01;Diesel;3.300,0;l;5.280,00`.
- 4 AdBlue rows (litres), 300 l each in Mar, Jun, Sep, Dec: **1,200 l**. `2025-03;AdBlue;300,0;l;270,00`. AdBlue is urea solution, not a fuel.
- 12 car-wash rows: `2025-01;Waschanlage;1;Stk;45,00`.

**`Basisjahr/`**
- `THG-Bilanz_2023.csv`: the base-year inventory as first reported (location-based only; gas on Hs basis; factor 0.45 for electricity):

  | Standort | Strom_kWh | Gas_kWh_Hs | Diesel_l |
  |---|---|---|---|
  | Werk Nord | 2.400.000 | 1.950.000 | |
  | Werk Süd | 1.300.000 | 250.000 | |
  | Lager Ost | 120.000 | | |
  | Werk 3 | 900.000 | 3.000.000 | |
  | Fuhrpark | | | 40.000 |
  | Summe t CO₂e | | | **3.160,0** |

- `Strukturaenderungen_2024.md`: two lines. "Werk 3 (Gießerei) verkauft zum 01.07.2024." and "Abgrenzung: operative Kontrolle. Beteiligungen ohne operative Kontrolle (Pulverbeschichtung Mitte GmbH, 40 %) nicht in Scope 1 und 2."

**`Anfrage/`**
- `Kundenfragebogen_OEM_2025.md`: three fields from the customer's supplier questionnaire, due 31.10.2026: "Scope 1 + 2 emissions 2025 (t CO₂e)", "Reduction since base year (%, with explanation)", "Share of renewable electricity (%)".

**The AI draft** (the output of Ask 1, also shipped as `Anfrage/Entwurf_Satz_KI.md` with the label "constructed example, see 3.6"):
> "Since 2023 we have cut our CO₂ emissions by 43% through targeted efficiency measures, and our production runs on 100% green power."
> DE: „Seit 2023 haben wir unsere CO₂-Emissionen durch gezielte Effizienzmaßnahmen um 43 % gesenkt, und unsere Produktion läuft zu 100 % mit Ökostrom.“

### 3.3 The prepared ledger (Ask 2 input)

`expected/ledger_energie_2025.csv`. One row per source quantity. Columns:
`row_id;site;in_boundary;carrier;period_start;period_end;months;qty_source;unit_source;kwh;source_file;source_place;quote;status;instrument;factor_id;dq;note;prepared_by;reviewed_by`

`source_place` is the line or section in the bill file (the kit files have numbered lines), and `quote` is the exact text from the document, for example `Verbrauch 2025: 1.240 MWh`.

| row_id | site | carrier | period | qty on document | kWh (normalised) | status | factor | DQ | note |
|---|---|---|---|---|---|---|---|---|---|
| E-WN-01 … E-WN-09 | WN | Electricity | Jan to Sep | as in 3.2 | 1,650,000 in total | actual | F-EL-LB-2025 / F-EL-RM-2025 | A | |
| E-WN-03D | WN | Electricity | Mar | 205.000 kWh | 0 | excluded: duplicate of E-WN-03 (invoice 4711-03) | | | |
| E-WN-10 | WN | Electricity | Oct | meter 5.012.300 minus 4.812.300 | 200,000 | actual, from meter reading | same | B | invoice 4711-10 requested from supplier |
| E-WN-11 | WN | Electricity | Nov to Dec | 410.000 kWh | 410,000 | actual | same | A | two-month bill |
| E-JV-01 | JV | Electricity | Jan to Dec | 800.000 kWh | 0 | excluded: outside boundary (operational control) | | | listed separately for a possible Scope 3 cat. 15 note |
| E-WS-01 | WS | Electricity | Jan to Dec | 1.240 MWh | 1,240,000 | actual | F-EL-LB-2025 / F-EL-GO | A | instrument row I-WS-01 |
| E-LO-01 … E-LO-04 | LO | Electricity | quarters | 30.000 / 25.000 / 25.000 / 30.000 kWh | 110,000 | actual | F-EL-LB-2025 / F-EL-RM-2025 | A | |
| G-WN-01 | WN | Natural gas | Jan to Dec | 1.850.000 kWh (Hs) | 1,850,000 (Hs) | actual | F-GAS-HS | A | basis Hs stated on bill |
| G-WS-01 | WS | Natural gas | Jan to Dec | 240.000 kWh (Hs) | 240,000 (Hs) | actual | F-GAS-HS | A | |
| D-FL-01 | fleet | Diesel | Jan to Dec | 38.000 l (12 rows) | 380,000 (at 10.0 kWh/l) | actual | F-DSL | A | |
| D-FL-X1 | fleet | AdBlue | Mar, Jun, Sep, Dec | 1.200 l | 0 | excluded: not a fuel | | | |
| D-FL-X2 | fleet | Car wash | monthly | 12 Stk, € only | 0 | excluded: no emissions quantity | | | |
| I-WS-01 | WS | Instrument | 2025 | GO 1.240 MWh, hydro, cancelled | covers 1,240,000 kWh of E-WS-01 | | | A | covers WS only |
| B-23-01 … B-23-05 | all | Base year | 2023 | from THG-Bilanz_2023.csv | | reported | F-EL-LB-2023, F-GAS-HS, F-DSL | B | B-23-04 = Werk 3, flagged "divested 01.07.2024" |

Plus a one-paragraph boundary note (`expected/boundary_note.md`) and a site-by-month coverage grid (`expected/coverage_grid.csv`) that shows WN, WS, LO, gas and diesel complete for January to December after the October fix.

### 3.4 Correct answers, with full arithmetic

**Electricity in the boundary, 2025**
- Werk Nord = 210,000 + 195,000 + 205,000 + 190,000 + 185,000 + 180,000 + 175,000 + 120,000 + 190,000 (Jan to Sep = 1,650,000) + 200,000 (Oct, meter) + 410,000 (Nov to Dec) = **2,260,000 kWh**
- Werk Süd = 1,240 MWh × 1,000 = **1,240,000 kWh**
- Lager Ost = 30,000 + 25,000 + 25,000 + 30,000 = **110,000 kWh**
- Total = **3,610,000 kWh (3,610 MWh)**

**Scope 2, location-based:** 3,610,000 × 0.40 = 1,444,000 kg = **1,444.0 t**

**Scope 2, market-based:** Werk Süd 1,240,000 × 0.00 = 0; Werk Nord + Lager Ost 2,370,000 × 0.60 = 1,422,000 kg. Total **1,422.0 t**

**Scope 1:** gas (1,850,000 + 240,000) = 2,090,000 kWh(Hs) × 0.18 = **376.2 t** (WN 333.0, WS 43.2); diesel 38,000 l × 2.50 = **95.0 t**. Scope 1 = **471.2 t**

**Totals 2025:** location-based 471.2 + 1,444.0 = **1,915.2 t**; market-based 471.2 + 1,422.0 = **1,893.2 t**

**Base year 2023 as reported:** electricity (2,400,000 + 1,300,000 + 120,000 + 900,000) = 4,720,000 × 0.45 = 2,124.0 t; gas 5,200,000 × 0.18 = 936.0 t; diesel 40,000 × 2.50 = 100.0 t. Total **3,160.0 t**.

**Headline change (correct data):** 1,915.2 − 3,160.0 = −1,244.8 t = **−39.4%** (−39.39%).

**Restated base year (Werk 3 removed):** Werk 3 in 2023 = 900,000 × 0.45 + 3,000,000 × 0.18 = 405.0 + 540.0 = **945.0 t**. Restated 2023 = 3,160.0 − 945.0 = **2,215.0 t**. Like for like: 1,915.2 − 2,215.0 = −299.8 t = **−13.5%** (−13.53%).

**Decomposition of the like-for-like −299.8 t** (remaining sites, 2023 electricity 3,820,000 kWh):
- Less electricity used: (3,610,000 − 3,820,000) × 0.45 = **−94.5 t**
- Grid factor change: 3,610,000 × (0.40 − 0.45) = **−180.5 t**
- Less gas used: (2,090,000 − 2,200,000) × 0.18 = **−19.8 t**
- Less diesel used: (38,000 − 40,000) × 2.50 = **−5.0 t**
- Sum −299.8 t ✓. "Less energy used" = 94.5 + 19.8 + 5.0 = **119.3 t**.
- As share of the restated base: energy use −5.4 points (119.3 / 2,215.0 = 5.39%), grid factor −8.1 points (180.5 / 2,215.0 = 8.15%). Sum 13.5 ✓.

**The 39.4 points split (share of the original 3,160.0 t):**

| Bar | Tonnes | Points of the headline | What it is |
|---|---|---|---|
| Werk 3 sold (1 Jul 2024) | −945.0 | 29.9 | Structural change. Not a reduction by Fernholt's actions. |
| Grid emission factor 0.45 → 0.40 | −180.5 | 5.7 | Real in the location-based figure, but the grid got cleaner, not Fernholt. |
| Less energy used (electricity, gas, diesel) | −119.3 | 3.8 | Fernholt's own change. The folder does not say whether this came from measures or from lower output. |
| **Total** | **−1,244.8** | **39.4** | |

**Renewable share:** 1,240,000 / 3,610,000 = **34.3%** of electricity. Energy total (gas on Hs basis) 3,610 + 2,090 + 380 = 6,080 MWh; renewable share of all energy 1,240 / 6,080 = 20.4%. (On an Hi basis gas is 1,882.9 MWh; the basis must be stated.)

### 3.5 The plausible wrong answer and exactly which traps produce it

What the AI computes on the raw folder, trap by trap (location-based, 2025 factor, which it picks correctly):

| Trap | What the AI did | Change vs correct | Effect in t CO₂e |
|---|---|---|---|
| T1 Duplicate | Counted `Scan_Rechnung_Maerz.md` as a second March | +205,000 kWh | **+82.0** |
| T2 Missing month | Saw 12 files, assumed 12 months, never opened `Zaehlerstaende_WN_2025.csv` | −200,000 kWh | **−80.0** |
| T3 Boundary | Counted `Jahresrechnung_PBM_2025.md` because it sits in the Werk Nord folder | +800,000 kWh | **+320.0** |
| T4 Unit and number format | Read "1.240 MWh" as 1,240 kWh | −1,238,760 kWh | **−495.5** |
| T5 Calorific basis | Applied F-GAS-HI (0.20) to kWh billed on Hs | 2,090,000 × 0.02 | **+41.8** |
| T6 Fuel card | Summed every litre row, AdBlue included: 39,200 l | +1,200 l | **+3.0** |
| **Net** | | | **−128.7** (+446.8 and −575.5) |

- AI total 2025 = 1,915.2 − 128.7 = **1,786.5 t** (exact 1,786.496). Scope 2 location-based 1,270.5 t (3,176,240 kWh × 0.40); Scope 1 516.0 t (gas 418.0, diesel 98.0).
- AI change vs 2023: 1,786.5 − 3,160.0 = −1,373.5 t = **−43.5%**, written as "43%".
- "through targeted efficiency measures": the AI has no evidence for a cause. The phrase is the default narrative when the decomposition is missing from its input (failure mode 10 in esg-ai-practice.md).
- "100% green power": T7, **certificate scope**. The folder contains a file named `..._Oekostrom.md` and a guarantee-of-origin confirmation. The AI generalised one site's instrument to the company. True value 34.3%.

**Why nobody catches it:** the AI total (1,786.5 t) is 6.7% below the correct 1,915.2 t, inside most people's "looks plausible" range. The two largest errors (+320.0 and −495.5) almost cancel. A total-level sanity check passes; a coverage grid and a source-row check do not.

**The full waterfall, 2023 reported to the AI's 2025 figure** (the main drawing of the workshop):

| Step | Change (t) | Running total (t) |
|---|---|---|
| 2023 as reported | | 3,160.0 |
| Werk 3 sold | −945.0 | 2,215.0 |
| Grid factor | −180.5 | 2,034.5 |
| Less energy used | −119.3 | 1,915.2 ← correct 2025 |
| Data errors in the folder (T1 to T6) | −128.7 | 1,786.5 ← what the AI summed |

The four bars add up to the AI's −1,373.5 t. Only 119.3 t of it (8.7% of the claimed reduction, 3.8 points of 43.5) is Fernholt's own change.

### 3.6 Honesty about the AI answers

- Until real runs are recorded, the raw-folder answer is labelled on every surface: "Constructed from documented failure modes, not a recorded run."
- Recording plan (before launch): same model, same prompt, same factor table, two conditions (raw folder; ledger plus boundary note), five runs each, recorded with model name, date, settings and full prompt, scored on six numbers (Scope 1, Scope 2 LB, Scope 2 MB, change %, like-for-like %, renewable share) and seven flags (T1 to T7).
- If a current model with code execution catches some traps, the deck shows that honestly and the claim becomes "the folder decides what even a careful model can know". The workshop never says "AI gets this wrong".

### 3.7 The target answer for Ask 2 (rematch)

What a good assistant should return on the ledger, and the sentence the workshop rebuilds:

> EN: "Our Scope 1 and 2 emissions (location-based) fell from 3,160 t CO₂e in 2023 to 1,915 t in 2025. 945 t of the decrease comes from selling our Werk 3 foundry in July 2024. At the sites we still run, emissions fell 13.5%: 5.4 points because we used less energy and 8.1 points because the grid emission factor fell. In 2025, 34% of our electricity (Werk Süd, 1,240 MWh) was backed by cancelled guarantees of origin. [rows B-23-01…05, E-*, G-*, D-FL-01, I-WS-01]"

> DE: „Unsere Scope-1- und Scope-2-Emissionen (standortbasiert) sanken von 3.160 t CO₂e im Jahr 2023 auf 1.915 t im Jahr 2025. 945 t davon entfallen auf den Verkauf unserer Gießerei Werk 3 im Juli 2024. An den Standorten, die wir weiter betreiben, sanken die Emissionen um 13,5 %: 5,4 Punkte, weil wir weniger Energie verbraucht haben, und 8,1 Punkte, weil der Emissionsfaktor des Stromnetzes gesunken ist. 2025 war 34 % unseres Stroms (Werk Süd, 1.240 MWh) durch entwertete Herkunftsnachweise gedeckt.“

Plus the questionnaire fields: Scope 1+2 2025 = 1,915 t location-based / 1,893 t market-based; base year 2023 = 3,160 t (as reported) and 2,215 t (restated without Werk 3); renewable electricity 34%. Plus one open item: "Why energy use fell (measures or lower output) is not in the data."

The assistant also lists what it decided and what it needs from a person: October from meter reading (grade B, invoice requested); JV excluded under operational control; 2023 market-based figure does not exist, so no market-based change is given.

---

## 4. The seven-act spine and scene list

### 4.1 Acts and minutes

| Act | Station on the route bar | Minutes | Learner does | Scenes |
|---|---|---|---|---|
| 0 | (before the route) Open | 4 | Reads the question and the customer's three fields | cover, the-case, the-arc |
| 1 | The sentence | 9 | **Votes**: send it to the customer? | the-folder, the-draft |
| 2 | The bars | 9 | **Predicts** which bar is biggest, then sees the split | the-waterfall, the-error-bar |
| 3 | The ledger | 17 | **Votes** on boundary and units, **fills** one ledger row together | whose-bill, month-grid, units, one-certificate, one-row |
| 4 | The rematch | 13 | **Traces** two bars to their documents on the worksheet | rematch, trace-two |
| 5 | The limits | 12 | **Sorts** five requests: calculate, ask back, refuse | ask-or-refuse, claims-rules, what-this-does-not-prove |
| 6 | Your sentence | 13 | **Writes** the transfer sheet, shares in pairs, **revotes** | your-sentence, resolution |
| | Questions and slack | 13 | | |
| **Total** | | **77 + 13 = 90** | | 19 main scenes, 6 appendix |

Route stations (for `data-route-stations`): `The sentence|The bars|The ledger|The rematch|The limits|Your sentence`.

Interaction cadence (minute of the main path): vote at ~11, prediction at ~14, votes at ~23 and ~31, row fill at ~37, tracing 44 to 51, sorting at ~55, writing 64 to 73, revote at ~75. No stretch longer than 9 minutes without a vote, prediction or task.

### 4.2 Main scenes

Seconds are `data-seconds`. Sum of main path = 4,620 s = 77 min. Encodings follow design-direction §7.7: hatch = raw document, solid ink = approved ledger figure, slate = recomputed check, dashed = estimate or gap, Mennige = the one figure under discussion.

---

**1 · `cover` · Act 0 · 45 s** · Title: "Does this sentence hold?"
- Screen: graphit cover with the globe (Germany traced in Mennige), kicker "Workshop 04 · ESG reporting", title, dark q-card with the fixed question, meta line "Fictional company · teaching factors · rules as of 26 Sep 2026".
- Steps: 0 title and q-card.
- Vote: none.
- Note: "One question stays on the screen for the whole session: how much did emissions change, why, and how much of the power was green. We ask it twice, on the same company's files, and the only thing that changes is how the files are prepared. The company is made up; the problems in its folder are common."

**2 · `the-case` · Act 0 · 120 s** · Title: "A customer wants three numbers by 31 October."
- Screen: left, the OEM questionnaire card with its three fields (hatched, empty). Right, a site map as four boxes: Werk Nord, Werk Süd, Lager Ost inside a solid boundary line; Pulverbeschichtung Mitte (40%, partner operates) outside it with a dashed line; Werk 3 greyed with "sold 01.07.2024". Caption: "Boundary: operational control. Written down in 2024."
- Steps: 0 questionnaire; 1 sites and boundary; 2 "The same sentence goes into the website brochure."
- Vote: none.
- Note: "Fernholt makes metal parts, 180 people, three sites it runs itself. It is outside CSRD, but its biggest customer and its bank ask anyway, and this customer wants three fields by the end of October. Note the joint venture outside the line and the foundry that was sold; both come back."

**3 · `the-arc` · Act 0 · 75 s** · Title: "Today we take one sentence apart."
- Screen: the route with six stations drawn large; under it the artefact learners leave with: a thumbnail of the filled transfer sheet ("one sentence, five boxes").
- Steps: 0 stations; 1 artefact; 2 route shrinks into the chrome bar (`data-route="final"`).
- Vote: none.
- Note: "Here is the route: the sentence an AI wrote, the bars inside its number, the ledger that fixes them, the same question again, the limits, and then your own sentence. You leave with one page for a number you report at work. No company data goes into anything today."

**4 · `the-folder` · Act 1 · 180 s** · Title: "22 files, one sentence to write."
- Screen: the folder tree `Energie_2025/`, `Basisjahr/`, `Anfrage/` as hatched file cards, grouped by site. Werk Nord's `Strom/` folder shows "12 files". Next to it the factor table card ("teaching values").
- Steps: 0 tree; 1 highlight the count "12" on the Werk Nord folder (no explanation yet); 2 the prompt card: the fixed question plus "Use the files and the factor table."
- Vote: ask aloud (not graded): "Hands up if your own energy folder looks tidier than this."
- Note: "This is what a real folder looks like: bills from the supplier, a meter spreadsheet from the facility manager, a fuel-card export and last year's inventory. We give all of it to the AI with our factor table and ask the question. Remember the number 12 on the Werk Nord folder."

**5 · `the-draft` · Act 1 · 360 s** · Title: "The AI's sentence looks ready to send."
- Screen: the AI answer card (hatched ground, label "Constructed from documented failure modes, not a recorded run" until a real capture exists): the sentence, and its small table 2023 3,160.0 t · 2025 1,786.5 t · change −43.5% · renewable 100%. Beside it a checklist "Looks trustworthy" with ink ticks: cites file names, uses the factor table, arithmetic adds up, one decimal, plausible size.
- Steps: 0 sentence; 1 table; 2 checklist ticks one by one; 3 room vote band; 4 holding line "Remember your hand."
- Vote (room vote card): "Send this sentence to the customer?" **Send · Ask back first · Stop**. Say the split aloud; it is recalled at `resolution`.
- Note: "Read it the way you would read a draft from a colleague. Every tick on the right is true: it named the files, it used our factors, the sums add up. Hands for send, ask back, or stop, and I will say the split out loud so we can come back to it at the end."

**6 · `the-waterfall` · Act 2 · 330 s** · Title: "Where did 1,373 tonnes go?"
- Screen: waterfall in tonnes from 3,160.0 (2023 as reported) down to 1,786.5 (AI's 2025). Bars: Werk 3 sold −945.0 (ink), grid factor −180.5 (slate), less energy used −119.3 (ink, the one Mennige bar), data errors −128.7 (hatched). A marker at 1,915.2 labelled "correct 2025". Right margin: points of the headline 29.9 / 5.7 / 3.8 / 4.1.
- Steps: 0 empty axis with start and end totals only and the prediction band; 1 Werk 3 bar; 2 grid bar; 3 own-energy bar in Mennige; 4 data-error bar; 5 the sentence under the chart with "targeted efficiency measures" struck through and "3.8 of 43.5 points" beside it.
- Vote (prediction): "Which part of the 1,373 t is biggest?" **Our own measures · A cleaner grid · Selling a site · Errors in the files**.
- Note: "Before I draw the bars, guess which one is biggest. Most of the drop is the foundry we sold in 2024, 945 tonnes; the grid got cleaner, 180; and the part Fernholt did itself is 119 tonnes, less than one tenth of the claim. The sentence says 'efficiency measures', and the data does not even tell us whether the drop came from measures or from making fewer parts."

**7 · `the-error-bar` · Act 2 · 210 s** · Title: "The error bar is small because two big errors cancel."
- Screen: the hatched −128.7 bar opens into six thin bars: duplicate March +82.0, joint venture +320.0, gas basis +41.8, AdBlue +3.0 (up), October missing −80.0, "1.240 MWh" read as kWh −495.5 (down). Each bar is labelled with its file name. Bottom line: "+446.8 and −575.5 net to −128.7. The total looked plausible."
- Steps: 0 the closed bar; 1 up-bars; 2 down-bars; 3 net line; 4 act bridge "Each bar is one decision nobody wrote down."
- Vote: none (short input).
- Note: "Inside the small bar are six mistakes, and the two biggest point in opposite directions: 320 tonnes too much from the joint venture, 495 too little from one misread unit. That is why the total passed the 'does this look right' test. The next act fixes them one decision at a time."

**8 · `whose-bill` · Act 3 · 210 s** · Title: "Whose bill is this?"
- Screen: `Jahresrechnung_PBM_2025.md` rendered as a paper bill, the "Rechnungsempfänger: Pulverbeschichtung Mitte GmbH" block highlighted in Mennige; the boundary line from `the-case`; `Strukturaenderungen_2024.md` line "operative Kontrolle".
- Steps: 0 bill; 1 vote band; 2 reveal with the three effects: 100% +800,000 kWh (+320.0 t); 40% +320,000 kWh (+128.0 t); excluded 0 t, listed separately; 3 rule card "The boundary is written before the AI opens the folder. The AI flags other addressees; a person decides."
- Vote: "The joint-venture bill in our folder counts as" **100%, it is in our folder · 40%, our share · 0%, we do not run it**.
- Note: "The folder says Werk Nord, the addressee says someone else. Under the operational control rule Fernholt wrote down in 2024, this bill is out; 40% would be right only if Fernholt had chosen the equity-share approach. The AI can spot a different addressee; the choice of rule belongs to a person, before the run."

**9 · `month-grid` · Act 3 · 210 s** · Title: "Twelve files, eleven months."
- Screen: a site-by-month grid for Werk Nord electricity, Jan to Dec. Cells fill from the 12 files: March shows "2" in Mennige, Nov and Dec share one bar ("one bill, two months"), August shows a low value with the word "plant holiday", October is an empty dashed cell. Then the meter file slides in and fills October (dashed ink, "from meter reading, grade B").
- Steps: 0 empty grid; 1 files drop in; 2 March double and Oct gap highlighted; 3 meter reading fills Oct: 5,012,300 − 4,812,300 = 200,000 kWh; 4 net line: +205,000 − 200,000 = +5,000 kWh, "the total was 0.2% off".
- Vote (ask aloud): "August is 120,000 kWh, a third below July. Error or real?" (expected: real, plant holiday; do not let the AI 'fix' true values).
- Note: "Before anyone sums, draw the grid. One March counted twice, October missing, and a bill that covers two months, which is why twelve files looked like a full year. The October number was in the folder the whole time, in the facility manager's meter file."

**10 · `units` · Act 3 · 150 s** · Title: "What does „1.240 MWh“ mean?"
- Screen: the Werk Süd annual statement line "Verbrauch 2025: 1.240 MWh" large. Below, small print card: the gas bill line "abgerechnet nach Brennwert (Hs)" and the fuel-card row "AdBlue 300,0 l".
- Steps: 0 the line; 1 vote; 2 reveal: 1,240 MWh = 1,240,000 kWh; misreading costs 495.5 t in location-based Scope 2; 3 the two small traps: Hs vs Hi +41.8 t, AdBlue +3.0 t; 4 rule: "Keep the original value and unit in the ledger. A fixed conversion rule does the maths, not the prompt."
- Vote: "„1.240 MWh“ is" **1.24 MWh · 1,240 kWh · 1,240,000 kWh**.
- Note: "In German the point separates thousands, so this is one thousand two hundred forty megawatt hours. Options one and two are the same mistake by a factor of a thousand, and it hides half a thousand tonnes. The gas and AdBlue items are small, but they show the rule: the unit and its basis are data, so they get their own column."

**11 · `one-certificate` · Act 3 · 210 s** · Title: "One certificate, one site."
- Screen: `HKN_Bestaetigung_2025.md` with "Lieferstelle Werk Süd" highlighted. A horizontal bar of 3,610 MWh electricity: Werk Süd 1,240 MWh solid ink with "GO", Werk Nord 2,260 and Lager Ost 110 hatched. Label 34.3%. Then two Scope 2 figures side by side: location-based 1,444.0 t, market-based 1,422.0 t.
- Steps: 0 certificate; 1 vote; 2 the 34% bar; 3 two Scope 2 numbers; 4 small line: "Grid average instead of residual mix for the uncovered power would give 948.0 t, 474 t too low" (link to `appendix-scope2`).
- Vote: "What share of Fernholt's electricity is green?" **100% · 34% · We cannot tell from this folder**.
- Note: "The certificate names one delivery point, Werk Süd, for 1,240 megawatt hours; the company used 3,610, so the honest figure is 34%. Scope 2 is always reported twice: location-based uses the grid, market-based uses the contracts, and the uncovered power gets the residual mix, not zero and not the grid average. The draft's '100% green power' is simply false."

**12 · `one-row` · Act 3 · 240 s** · Title: "Every number gets a row."
- Screen: the ledger as a table (solid ink ground) with columns row_id, source_file, source_place, quote, qty, unit, kWh, status, factor_id, DQ. Rows E-WN-01 (worked), E-WS-01 (half-filled, blanks for kWh and factor), E-WN-10 (blank row). Below, the coverage grid thumbnail, all green-checked.
- Steps: 0 worked row; 1 half-filled row: room calls out kWh (1,240,000) and factor (F-EL-LB-2025 for location, F-EL-GO for market); 2 blank row: room fills October (meter reading, 200,000, status actual from meter, DQ B); 3 rule: "The AI proposes rows with a quote. A spreadsheet adds them up."
- Learner action: completion problem, called out loud; also on worksheet side A.
- Note: "This is the fix, and it is boring on purpose: one row per number on a document, with the exact quote and where it sits. Fill the middle row with me, then the October row; notice October gets grade B because it comes from a meter reading, not a bill. The AI is good at proposing these rows; the adding up happens in a sheet, so the same input always gives the same total."

**13 · `rematch` · Act 4 · 330 s** · Title: "Same question, ledger in."
- Screen: the q-card unchanged. Left lane: the raw folder (hatched) with the old sentence, struck. Right lane: ledger plus boundary note (ink) with the new answer card (label: constructed or "recorded on <date>"): the sentence from §3.7 with row IDs as small superscripts. Under it the corrected waterfall: 3,160.0 → −945.0 → −180.5 → −119.3 → 1,915.2; second axis for like for like: 2,215.0 → 1,915.2 (−13.5%). Slate check card: "Recomputed from ledger: 1,915.2 t ✓ · 34.3% ✓".
- Steps: 0 q-card and lanes; 1 new answer; 2 waterfall; 3 like-for-like line; 4 check card; 5 "What stayed the same: model, prompt, factor table. What changed: the input."
- Vote: none; ask aloud: "Which of the four numbers in this sentence would you check first?"
- Note: "Same question, same model, same factor table; the only difference is that the AI now reads the ledger. The number moves from 43 to 39, and the sentence changes more than the number: it names the sale, the grid, and the 13.5% at the sites Fernholt still runs. Every figure points to a row, so anyone can check it."

**14 · `trace-two` · Act 4 · 450 s** (`data-recovery-seconds="120"`) · Title: "Trace two bars to paper."
- Screen: worksheet side B shown large: three bars to trace. Bar 1 worked ("Werk 3 sold, 945.0 t" → B-23-04 → `THG-Bilanz_2023.csv` line "Werk 3; 900.000; 3.000.000" → 405.0 + 540.0). Bar 2 half-filled ("Grid factor, 180.5 t": which rows, which two factor IDs). Bar 3 alone ("34.3% green": which rows, which quote). Expected answers revealed on the last step.
- Steps: 0 task; 1 timer 5 min (pairs); 2 expected answers; 3 "If yours differs" hints (most common: using 3,820,000 instead of 3,610,000 kWh for the grid bar).
- Learner action: pairs trace on paper; kit files numbered for lookup.
- Note: "Work in pairs on side B of your sheet: the first bar is done, the second is half done, the third is yours. You have five minutes; if you get stuck, the numbers are on the bill cards in front of you. Then we compare, and the most common slip is using the 2023 consumption for the grid bar."

**15 · `ask-or-refuse` · Act 5 · 300 s** · Title: "Calculate, ask back, or refuse?"
- Screen: five request cards, sorted one by one into three columns.
  1. "Sum Scope 2 location-based for 2025." → Calculate, from the ledger.
  2. "Fill in October." → Ask back: meter reading or a stated estimate, labelled B or C.
  3. "Write that we are climate-neutral since 2025; we bought offsets." → Refuse and rewrite (offset-based product claims to consumers banned from 27 Sep 2026; misleading to a customer too).
  4. "Give the customer our market-based reduction since 2023." → Ask back: no 2023 market-based figure exists.
  5. "Explain why energy use fell." → Ask back: the folder has no production or project data.
- Steps: one per card, 5 reveals.
- Vote per card: **Calculate · Ask back · Refuse**.
- Note: "A good assistant does not answer everything. Vote on each card; the interesting ones are four and five, where the right move is a question because the data to answer simply is not there. Card three is the one that changed this week."

**16 · `claims-rules` · Act 5 · 240 s** · Title: "What changed on 27 September 2026."
- Screen: three plain statements with source lines and a footer "Rules as of 26 Sep 2026. Not legal advice. Check the German transposition before you quote it." (1) Directive (EU) 2024/825 applies from 27 Sep 2026: generic environmental claims without recognised excellent performance and offset-based climate-neutral claims about products are banned in consumer marketing. (2) The separate Green Claims Directive is stalled, not in force. (3) Fernholt's three phrases checked: "climate-neutral" (offsets) remove; "100% green power" false, write 34% with the site; "sustainable production" generic, replace with a number.
- Steps: 0 statement 1; 1 statement 2; 2 the three phrases with verdicts; 3 "The questionnaire is B2B. The brochure is on the website."
- Vote: none (input).
- Note: "From tomorrow, relative to this concept's date, consumer marketing in the EU may not use vague green words or offset-based neutrality claims. A customer questionnaire is business to business, but the brochure is public, and a false number is false everywhere. I am not giving legal advice here; check the German law and your own counsel before you rely on any of this."

**17 · `what-this-does-not-prove` · Act 5 · 180 s** · Title: "What today's numbers cannot tell you."
- Screen: a plain list of five limits, each with its evidence: teaching factors, not official; the AI answer is constructed (or recorded on a date, N runs); no market-based 2023, so no market-based change; the ledger shows less energy used, not why; Scope 3 not covered (steel alone would be about 3,960 t, larger than Scope 1 and 2 together: appendix only).
- Steps: 0 to 4, one limit per press.
- Vote: none.
- Note: "Here is what we did not show. The factors are rounded teaching values, the first AI answer is built from known failure types, and the biggest part of a metal-parts company's footprint, the steel it buys, is not in today's folder at all. If someone asks 'so what is Fernholt's real footprint', the honest answer is: we checked Scope 1 and 2, and nothing else."

**18 · `your-sentence` · Act 6 · 540 s** (`data-recovery-seconds="120"`) · Title: "Your sentence, five boxes."
- Screen: the transfer sheet, five boxes with the Fernholt example beside each (see §6.3). Timer. Instruction line: "Use an invented or anonymised example. No company data goes into any tool."
- Steps: 0 boxes; 1 timer 6 min alone; 2 pairs share their hardest box (2 min); 3 two pairs report to the room (1 min).
- Learner action: writes on paper.
- Note: "Pick one number you or your company reports, or an invented one, and fill the five boxes; the Fernholt example sits beside each box. Six minutes alone, then tell your neighbour which box was hardest. Nothing you write goes into a tool today."

**19 · `resolution` · Act 6 · 240 s** · Title: "Would you send it now?"
- Screen: the opening vote split recalled. Left: the old sentence (struck). Right: the new sentence. Between them the number ladder: 43.5% (raw folder) → 39.4% (correct data) → 13.5% (like for like) → 3.8 points (own energy use on the original base). Bottom: the field card thumbnail and "What you take home: transfer sheet, field card, kit".
- Steps: 0 recall of the opening split; 1 revote; 2 ladder; 3 closing line and materials.
- Vote: the same question as `the-draft`: **Send · Ask back first · Stop**, now about the new sentence.
- Note: "At the start the room split as I said out loud; now vote on the new sentence. The number went from 43 to 39 once the files were right, and the sentence still had to change, because most of the drop was a site we sold. Take the field card to your desk; the next time an AI hands you a percentage, ask for the bars."

### 4.3 Main-path timing check

| Act | Scenes (s) | Total s | Min |
|---|---|---|---|
| 0 | 45 + 120 + 75 | 240 | 4 |
| 1 | 180 + 360 | 540 | 9 |
| 2 | 330 + 210 | 540 | 9 |
| 3 | 210 + 210 + 150 + 210 + 240 | 1,020 | 17 |
| 4 | 330 + 450 | 780 | 13 |
| 5 | 300 + 240 + 180 | 720 | 12 |
| 6 | 540 + 240 | 780 | 13 |
| **Sum** | 19 scenes | **4,620** | **77** |

77 min is 14.4% below 90, so it sits 30 s above the standard's strict "slot minus 15%" line of 76.5 min (the standard's own spine table allows 75 to 80). If the build lint enforces 76.5 strictly, cut `the-folder` to 150 s (main path 4,590 s = 76.5 min). Cut list (frees 12 min without losing an outcome): `the-error-bar` into a single press on `the-waterfall` (−3 min), `what-this-does-not-prove` into the facilitator's last sentence of `claims-rules` (−3 min), `ask-or-refuse` down to cards 3 to 5 (−2 min), `your-sentence` pairs share only (−4 min).

### 4.4 Appendix scenes (`data-kind="appendix"`, `data-seconds="0"`)

| id | Title | On screen | For questions like |
|---|---|---|---|
| `appendix-factors` | "Where real factors come from" | The teaching factor table beside the real sources: UBA grid factor per year (363 g for 2024, 386 g for 2023, direct CO₂), AIB residual mix published yearly, DESNZ/DEFRA (UK electricity is wrong for German sites), licensed databases (ecoinvent, IEA) that must not be pasted into public tools. Rule: factor ID = source + year + region + version. | "Which factor should we use?" |
| `appendix-gas-basis` | "Brennwert or Heizwert?" | The gas bill line, the formula m³ × Zustandszahl × Brennwert, Hs about 11% above Hi, the +41.8 t effect. | Controllers who know their gas bill |
| `appendix-scope2` | "Two Scope 2 numbers" | Location-based 1,444.0 t, market-based 1,422.0 t; the wrong variants: certificate applied company-wide (0 t), grid average for uncovered power (948.0 t). GHG Protocol/ISO revision: consultation Q2 2027, publication Q4 2028; the 2015 guidance applies today. | "Why is market-based higher?" |
| `appendix-baseline` | "When to restate the base year" | Werk 3 sale → restated base 2,215.0 t; the JV under equity share (40% = 128.0 t) vs operational control; grid factor changes are not restated in location-based figures. | "Is it cheating to restate?" |
| `appendix-prompts` | "The three prompts in the kit" | Extraction prompt, checking prompt, narrative prompt (short versions of §6.5). | "What do I type?" |
| `appendix-rules` | "What is true on 26 September 2026" | The six statements of §8 with source and date. | Regulation questions |

### 4.5 Presenter-notes entries

Each main scene gets an entry in `lib/presenter-notes.js` with the seven fields the console reads: `say` (the notes above, split into lines, plus a "Must say" line where needed), `sayAt`, `ask` (room votes from above; `aloud: true` for the ask-aloud items), `expectedAudience`, `revealOrder` (one string per step, as listed), `cut` (from §4.3) and `appendixRoutes`. Must-say lines:
- `the-draft`: "This answer is constructed from documented failure modes" (until a recording exists).
- `the-waterfall`: "Only 119 of the 1,373 tonnes are Fernholt's own change."
- `one-certificate`: "Scope 2 is always reported twice."
- `claims-rules`: "Not legal advice. Check the German transposition."
- `your-sentence`: "No company data goes into any tool today."

---

## 5. The interactive demo (`demo.html`)

**The one question at the top:** "Which parts of '43% less CO₂ and 100% green power' survive the evidence?"

**Principle:** the final, corrected state is visible on load. Every trap starts **fixed**; the learner can switch fixes off to see the AI's version return. Nothing is empty, nothing waits for a play button. Self-contained HTML, inline CSS/JS allowed by the CSP but no external requests, no storage, no `innerHTML` assignment (build DOM nodes), listeners via `addEventListener`.

### 5.1 Sections, top to bottom

1. **Q-card and the sentence.** The fixed question, then the AI draft with its four claims underlined as clickable spans: "43%", "since 2023", "targeted efficiency measures", "100% green power". Below it, the rebuilt sentence (§3.7), whose numbers are live: they update when toggles change. Clicking a claim scrolls to the bar or meter that tests it.
2. **The waterfall with trap switches beside it.** Chart: 2023 as reported 3,160.0 → Werk 3 sold → grid factor → less energy used → data errors (one hatched bar per active trap) → 2025 figure. Right of the chart, seven switches, one per trap (T1 duplicate, T2 October, T3 JV, T4 MWh, T5 Hs/Hi, T6 AdBlue, T7 certificate scope). Each switch reads "Fixed" / "As the AI did it" and shows its effect in tonnes. With all fixed: 1,915.2 t, −39.4%. With all off: 1,786.5 t, −43.5%, and the sentence above shows "43%" in Mennige. Two extra controls:
   - **Base year:** "as reported (3,160.0 t)" / "restated without Werk 3 (2,215.0 t)"; switches the headline between −39.4% and −13.5% and removes the Werk 3 bar.
   - **Boundary approach** (inside T3): operational control (0 t) / equity share 40% (+128.0 t) / "all bills in our folder" (+320.0 t).
   - A slate check line under the chart recomputes the total from the visible rows: "Sum of rows = chart total ✓".
3. **Green power meter.** 3,610 MWh bar, Werk Süd segment 1,240 MWh solid. With T7 off, the whole bar turns solid and the label reads "100% (claimed)"; with T7 fixed, "34.3% (Werk Süd only)". Two Scope 2 figures beneath: 1,444.0 / 1,422.0 t, and with T7 off market-based shows 0 t with a dashed outline and the note "certificate applied beyond its delivery point".
4. **Evidence drawer: from bar to paper.** Click any bar, any number in the rebuilt sentence, or any ledger row → a panel opens with (a) the raw document rendered as a paper bill with the quoted line highlighted in Mennige, (b) the extracted ledger row with `source_file`, `source_place`, `quote`, `qty`, `unit`, `kwh`, `status`, `factor_id`, `dq`, and (c) the arithmetic for that bar. For the October row the drawer shows the meter file and the subtraction; for the JV row, the addressee block; for the duplicate, both March bills side by side with the same invoice number.
5. **Month grid.** The Werk Nord site-by-month grid, final state (complete, October dashed as grade B). Toggling T1 or T2 in section 2 changes the grid too (March shows "2", October empty), so the learner sees the same trap in both views.
6. **Provenance footer.** "All figures fictional. Factors are rounded teaching values, not official. The raw-folder answer is constructed from documented failure modes [or: recorded on <date>, model <name>, 5 runs]. Rules as of 26 Sep 2026. Nothing you click is stored or sent."

### 5.2 What the learner manipulates, in order (≤ 10 min)

1. Predict: before touching anything, "Which switch moves the total most?" (a small inline question with three options; answer revealed by toggling).
2. Switch off T3 and T4 together: the total barely moves (−175.5 t), which is the cancelling lesson.
3. Switch the base year to restated: 39.4% becomes 13.5%.
4. Switch off T7: watch "100%" come back and market-based drop to 0.
5. Open the evidence drawer from "945 t" in the sentence and from "34%".

### 5.3 Mobile behaviour (390 px and 320 px)

- Single column. The q-card and sentence first, then the chart.
- The waterfall becomes a vertical list of horizontal bars (one row per step, label left, bar right, running total at the row end), so bars stay readable without horizontal scroll.
- The seven switches sit directly under the chart as a list of full-width rows (tap target ≥ 44 px), each with its tonne effect; a sticky mini-total ("2025: 1,915.2 t · −39.4%") stays at the top while the list scrolls.
- The evidence drawer opens as a full-width sheet with a close button and returns focus to the element that opened it.
- The month grid becomes 12 rows (one per month) instead of 12 columns.
- Reduced motion: bars change without animation; otherwise 200 to 320 ms transitions on bar length only.
- Keyboard: switches are real checkboxes/radios with labels; bars are buttons; the drawer is a dialog with focus trap and `Esc`.

---

## 6. Learner guide, field card, transfer sheet, kit

### 6.1 Learner guide (`guide.html`, read-afterwards, phone-first)

Top line: "Learner guide · to read after the session · 25 min". Sections mirror the acts; each has the question, a short answer, a "Reveal the explanation" retrieval prompt and one key point.

1. **The sentence** (the case, the question, the AI draft). Reveal prompt: "Before you read on: which part of 'since 2023 we cut 43%' would you check first, and in which file?"
2. **The bars** (the waterfall, 945 / 180.5 / 119.3 / 128.7). Reveal: "Why is the data-error bar only 128.7 t when one error alone is 495.5 t?"
3. **The ledger** (boundary, month grid, units and bases, certificate scope, one row per number). Four short subsections, each with the Fernholt file quoted. Reveal: "What grade does the October row get, and why not A?"
4. **The rematch** (same question, ledger in; the new sentence with row IDs; like for like). Reveal: "Recompute the grid bar from two numbers on this page."
5. **The limits** (calculate, ask back, refuse; the 27 Sep 2026 rules; what the numbers cannot tell). Reveal: "Which of the five requests needed a question back, and what was missing?"
6. **Your sentence** (the transfer sheet with the worked example, how to use it with a real bill).
7. **Try it with an AI (optional, 10 min, needs an AI account):** use the three kit prompts on the kit folder, with the expected results to compare. Never with company data in a tool your company has not approved.
8. **One week later:** four recall questions behind reveals (e.g. "Name two traps that point in opposite directions", "What does F-EL-GO do to the market-based figure?").
9. **Glossary** (about 20 terms): Scope 1, Scope 2, Scope 3, location-based, market-based, residual mix, guarantee of origin (Herkunftsnachweis), cancelled (entwertet), emission factor, factor ID, operational control, equity share, base year, restatement, like for like, gross/net calorific value (Brennwert/Heizwert, Hs/Hi), coverage grid, ledger row, data-quality grade A/B/C, VSME, value-chain cap, EmpCo.
10. **Where to go deeper** (links only): GHG Protocol Corporate Standard and Scope 2 Guidance, UBA grid factor page, AIB residual mix, EFRAG VSME, Directive 2024/825.

Length target 2,000 to 2,600 words; works at 390 px; passes the copy lint.

### 6.2 Field card (`field-card.html`, one A4 page, print CSS)

Title: "Before you trust an ESG number". Eight blocks, each with a rule, a Do line, a Don't line, a Fernholt number and the scene it comes from.

| # | Rule | Do | Don't | Fernholt number | Scene |
|---|---|---|---|---|---|
| 1 | Decompose before you narrate. | Split any change into structure, factor and own action before writing a cause. | Accept "efficiency measures" without a bar that shows them. | 945 / 180.5 / 119.3 t | the-waterfall |
| 2 | Write the boundary first. | Name the approach (operational control, equity share) before any AI run; flag other addressees. | Count a bill because it sits in your folder. | JV +320.0 t | whose-bill |
| 3 | Draw the month grid before you sum. | One row per site, one column per month; mark doubles and gaps. | Assume 12 files are 12 months. | 12 files, 11 months | month-grid |
| 4 | The unit is data. | Keep original value, unit and basis (kWh, MWh, Hs, Hi) in their own columns. | Let a prompt convert "1.240 MWh". | −495.5 t | units |
| 5 | Every factor has an ID. | Source, year, region, version in the factor ID; the AI picks IDs from your table. | Let the AI supply factor values from memory. | 0.45 vs 0.40: 180.5 t | appendix-factors |
| 6 | Two Scope 2 numbers, one certificate scope. | Report location- and market-based; match certificate MWh to the site it names. | Turn one site's green tariff into "100% green". | 34.3%, not 100% | one-certificate |
| 7 | Every sentence cites a row. | Row ID, file, place and quote for every number in a text. | Publish a number nobody can trace. | E-WS-01 → 1,240 MWh | one-row, rematch |
| 8 | Claims follow the evidence. | Say what, where, how much, which year. | "climate-neutral", "green", "sustainable" without a number; offset-based neutrality claims to consumers (banned from 27 Sep 2026). | "34% of our electricity (Werk Süd)" | claims-rules |

Footer: "Fictional teaching data · not legal advice · rules as of 26 Sep 2026 · loehrning.ai/workshops/esg-berichte-mit-ki".

### 6.3 Transfer sheet (`transfer.html` + `templates/transfer-sheet.md`, one A4, five boxes)

Instruction line: "Use an invented or anonymised example. Put no company data into any tool. 10 minutes."

| Box | Prompt | Fernholt worked example |
|---|---|---|
| 1 · The sentence | Write the sentence you (or an AI) would send. Underline every number and every cause word. | "Since 2023 we have cut our CO₂ emissions by <u>43%</u> through <u>targeted efficiency measures</u>, and run on <u>100% green power</u>." |
| 2 · The bars | Split the main number into what changed: structure (sites, products), factors, own action, errors. | 945.0 t site sale · 180.5 t grid factor · 119.3 t less energy used · 128.7 t data errors |
| 3 · One row | Pick the biggest bar and write its row: file, place, quote, value, unit, period. | B-23-04 · `THG-Bilanz_2023.csv` · line "Werk 3" · 900.000 kWh and 3.000.000 kWh (Hs) · 2023 |
| 4 · Boundary and gaps | What is in, what is out, what is estimated, what is missing? | In: WN, WS, LO. Out: JV (40%, not operated). Estimated: none. From meter: October (B). Missing: 2023 market-based; why energy use fell. |
| 5 · The rewrite | Rewrite the sentence so every number has a row and every cause has a bar. | "Scope 1 and 2 (location-based) fell from 3,160 t (2023) to 1,915 t (2025); 945 t is the sale of Werk 3. Like for like −13.5%. 34% of electricity (Werk Süd) backed by guarantees of origin." |

Closing sentence template: "For <claim>, the number <X> comes from <rows>; <Y> of it is <structure or factor>, <Z> is our own change; <gap> is still open."

### 6.4 Kit file list (text only: CSV, MD, HTML; target < 200 KB zipped)

Zip name `esg-kit.zip`, label on the page `ESG-Kit · .zip`. No `notes.md`, `todo.md`, `claude.md`; no nested archives; HTML without `fetch`, storage, `innerHTML =` or `eval`.

| Path | Format | Purpose |
|---|---|---|
| `START-HERE.md` | MD | What to open first (5 lines), what each folder is for, the time needed, "teaching factors are not official", "no company data into any tool" |
| `data/raw/Energie_2025/Werk_Nord/Strom/*.md` (12 files) | MD | The electricity bills as in §3.2, numbered lines |
| `data/raw/Energie_2025/Werk_Nord/Gas_Jahresrechnung_WN_2025.md` | MD | Gas bill, Hs basis |
| `data/raw/Energie_2025/Werk_Nord/Zaehlerstaende_WN_2025.csv` | CSV | Meter readings with the October answer |
| `data/raw/Energie_2025/Werk_Sued/Jahresuebersicht_2025_Oekostrom.md` | MD | "1.240 MWh" statement |
| `data/raw/Energie_2025/Werk_Sued/HKN_Bestaetigung_2025.md` | MD | Guarantee-of-origin confirmation, Werk Süd only |
| `data/raw/Energie_2025/Werk_Sued/Gas_Jahresrechnung_WS_2025.md` | MD | Gas bill, Hs basis |
| `data/raw/Energie_2025/Lager_Ost/Untermessung_LO_2025.md` | MD | Landlord's four quarterly readings |
| `data/raw/Energie_2025/Tankkarten_2025.csv` | CSV | Diesel, AdBlue and car-wash rows |
| `data/raw/Basisjahr/THG-Bilanz_2023.csv` | CSV | 2023 inventory as reported |
| `data/raw/Basisjahr/Strukturaenderungen_2024.md` | MD | Werk 3 sale and the boundary rule |
| `data/raw/Anfrage/Kundenfragebogen_OEM_2025.md` | MD | The customer's three fields |
| `data/raw/Anfrage/Entwurf_Satz_KI.md` | MD | The AI draft, labelled constructed or recorded |
| `data/factors/Faktoren_Lehrwerte.csv` | CSV | Teaching factor table with "not official" header row |
| `templates/ledger_vorlage.csv` | CSV | Empty ledger with the column set of §3.3 |
| `templates/coverage_grid.csv` | CSV | Empty site-by-month grid |
| `templates/claims_check.csv` | CSV | Columns: sentence, number, row_id, verdict, rewrite |
| `templates/transfer-sheet.md` | MD | The five boxes with the worked example |
| `templates/data-request-email.md` | MD | Email to a supplier, landlord or colleague asking for a missing document (see 6.6) |
| `prompts/01-extract-rows.md` | MD | Extraction prompt (6.5) |
| `prompts/02-check-ledger.md` | MD | Checking prompt (6.5) |
| `prompts/03-write-from-ledger.md` | MD | Narrative prompt (6.5) |
| `expected/ledger_energie_2025.csv` | CSV | The correct ledger |
| `expected/coverage_grid.csv` | CSV | The filled grid |
| `expected/waterfall.csv` | CSV | Every bar with tonnes, points and rows |
| `expected/claims_check.csv` | CSV | The draft's four claims with verdicts and rewrites |
| `expected/answers.md` | MD | All arithmetic of §3.4 and §3.5, plus the target answer of §3.7 |
| `worksheet.html` | HTML | Sides A (one row) and B (trace two bars), print CSS |
| `field-card.html` | HTML | Copy of the field card for offline printing |
| `LICENSE.md` | MD | Licence for the synthetic data and texts |
| `CHANGELOG.md` | MD | Dated changes and "prompts last tested with <tool> on <date>" |

### 6.5 Prompt pack (full text lives in the kit; core rules here)

**01 Extract rows** (one document at a time):
> "You read one document from an energy folder. Return a CSV with the columns `source_file;source_place;quote;qty_source;unit_source;period_start;period_end;addressee;meter_id;invoice_no`. `quote` is the exact text from the document, copied character for character, including German number format. `source_place` is the line number or section heading. Do not convert units, do not calculate, do not fill gaps. If a value is not on the document, leave the field empty and add a row `note;...` saying what is missing. If the addressee is not Fernholt Präzisionsteile GmbH, say so in a note."

**02 Check the ledger** (whole ledger plus boundary note and factor table):
> "Check this ledger. Do not change it; report findings as a list with row_id and reason. Check: (1) every site has every month from January to December exactly once; list doubles and gaps; (2) every invoice number appears once; (3) every unit is one of kWh, MWh, kWh(Hs), kWh(Hi), l; `kwh` equals `qty_source` converted with the rule in the factor table; (4) every row with `in_boundary = no` has a reason; (5) every certificate covers no more kWh than the rows it names; (6) every factor_id exists in the factor table for the right year and region. End with 'No findings' only if all six checks pass."

**03 Write from the ledger** (ledger, waterfall table, boundary note):
> "Write at most three sentences for a customer questionnaire. You may use only numbers that appear in the ledger or waterfall table, and after each number put its row_id in square brackets. Name the cause of a change only if a bar in the waterfall table shows it. Do not use the words climate-neutral, CO₂-neutral, green, sustainable or eco without a number and a scope. If the question cannot be answered from the rows, say which row is missing instead of answering."

### 6.6 Data request email template (`templates/data-request-email.md`)

> Subject: Missing electricity invoice October 2025, meter DE000123WN01
>
> Hello <name>,
>
> for our 2025 energy statement we are missing the electricity invoice for October 2025 (meter DE000123WN01, Werk Nord, invoice series 4711). We have the meter readings (30.09.2025: 4,812,300 kWh; 31.10.2025: 5,012,300 kWh) and will use them until the invoice arrives.
>
> Could you send the invoice as a file by <date>? If the billing period differs from 01.10. to 31.10.2025, please tell us the exact dates.
>
> Thank you,
> <name>, <role>, Fernholt Präzisionsteile GmbH · energie@fernholt.example.com

The kit adds two variants in the same file: to the landlord (sub-meter statement) and to the certificate supplier (which delivery points the guarantees of origin were cancelled for).

---

## 7. Web detail page content

All copy below avoids em and en dashes. Summaries are counted: DE 146 characters, EN 141 characters.

### 7.1 Registry fields

| Field | DE | EN |
|---|---|---|
| title | ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen | ESG Reporting with AI: From Raw Inputs to Clearer Insights |
| eyebrow | Workshop 04 · ESG-Berichte | Workshop 04 · ESG reporting |
| topic | ESG-Berichte | ESG reporting |
| summary (≤ 160) | Eine KI schreibt „43 % weniger CO₂ und 100 % Ökostrom“. Du zerlegst die Zahl in Balken, prüfst jeden gegen einen Beleg und schreibst den Satz neu. | An AI writes "43% less CO₂ and 100% green power". You split the number into bars, check each one against a document and rewrite the sentence. |
| duration | ~90 Minuten | ~90 minutes |
| format | Folien + Selbstlern-Kit | Slides + self-study kit |
| outcome (hub label) | Ein Satz mit Beleg für jede Zahl | One sentence with a source for every number |
| accessNote (≤ 2 sentences) | Kein KI-Konto nötig; alles läuft im Browser und auf Papier. Alle Firmendaten und Faktoren sind erfunden. | No AI account needed; everything runs in the browser and on paper. All company data and factors are made up. |

**description (DE):** „Fernholt Präzisionsteile, ein erfundener Zulieferer mit 180 Leuten, soll einem Kunden bis Ende Oktober drei Zahlen schicken. Eine KI liest den Energieordner und schreibt: 43 % weniger CO₂ seit 2023, 100 % Ökostrom. Du zerlegst diese 43 % in vier Balken und prüfst jeden gegen Rechnung, Zählerstand oder Nachweis. Am Ende stehen 39 % mit korrekten Daten, 13,5 % an den Standorten, die Fernholt noch betreibt, und 34 % Ökostrom für ein Werk. Du gehst mit einer Seite für eine Zahl aus deiner eigenen Arbeit.“

**description (EN):** "Fernholt Präzisionsteile, a made-up supplier with 180 staff, has to send a customer three numbers by the end of October. An AI reads the energy folder and writes: 43% less CO₂ since 2023, 100% green power. You split that 43% into four bars and check each one against a bill, a meter reading or a certificate. You end with 39% on correct data, 13.5% at the sites Fernholt still runs, and 34% green power for one plant. You leave with one page for a number from your own work."

### 7.2 Outcomes (3 to 4, observable verbs)

| # | DE | EN | Practised in |
|---|---|---|---|
| 1 | Du zerlegst eine Veränderung zwischen zwei Jahren in Standortverkauf, Faktoränderung und eigenen Verbrauch und rechnest jeden Teil in Tonnen aus. | Split a change between two years into site sale, factor change and own consumption, and work out each part in tonnes. | Akt 2 · Die Balken / Act 2 · The bars |
| 2 | Du prüfst einen Rechnungsordner mit einem Monatsraster auf Doppel, Lücken, falsche Einheiten und fremde Standorte, bevor jemand summiert. | Check an invoice folder with a month grid for duplicates, gaps, wrong units and other companies' sites before anyone sums it. | Akt 3 · Das Ledger / Act 3 · The ledger |
| 3 | Du ordnest jeder Zahl in einem Satz eine Zeile mit Datei, Stelle und Zitat zu und streichst jede Zahl ohne Beleg. | Link every number in a sentence to a row with file, place and quote, and delete every number without one. | Akt 4 · Die Revanche / Act 4 · The rematch |
| 4 | Du entscheidest für eine Anfrage an die KI, ob sie rechnen, nachfragen oder ablehnen soll, und begründest es mit dem fehlenden Beleg. | Decide for a request to an AI whether it should calculate, ask back or refuse, and name the missing evidence. | Akt 5 · Die Grenzen / Act 5 · The limits |

### 7.3 Agenda (minutes from deck data)

| id | DE station | EN station | Min | Mode |
|---|---|---|---|---|
| open | Du liest die Frage des Kunden und siehst die Standorte. | You read the customer's question and see the sites. | 4 | listen |
| sentence | Du stimmst ab: Würdest du den KI-Satz so abschicken? | You vote: would you send the AI's sentence? | 9 | vote |
| bars | Du tippst, welcher Balken der größte ist, und siehst die Aufteilung. | You guess which bar is biggest and see the split. | 9 | vote |
| ledger | Du entscheidest über Grenze, Monate, Einheit und Nachweis und füllst eine Ledger-Zeile. | You decide on boundary, months, unit and certificate and fill one ledger row. | 17 | do |
| rematch | Du verfolgst zwei Balken bis zum Beleg. | You trace two bars back to the document. | 13 | pair |
| limits | Du sortierst fünf Anfragen: rechnen, nachfragen, ablehnen. | You sort five requests: calculate, ask back, refuse. | 12 | vote |
| your-sentence | Du füllst fünf Felder für eine eigene Zahl und stimmst noch einmal ab. | You fill five boxes for a number of your own and vote again. | 13 | write |
| (Q&A) | Fragen | Questions | 13 | |

### 7.4 What you need / what you don't

- **Du brauchst:** einen Browser (für Folien und Demo einen großen Bildschirm) · Papier und Stift · einen Taschenrechner oder das Handy · optional ein KI-Konto für den 10-Minuten-Versuch im Lernbegleiter.
- **Du brauchst nicht:** Programmierkenntnisse · Excel-Formeln über Summe hinaus · Vorwissen zu CSRD oder ESRS · eigene Firmendaten (alles ist erfunden und mitgeliefert) · ein KI-Konto.
- EN: a browser (a large screen for slides and demo) · paper and pen · a calculator or phone · optionally an AI account for the 10-minute try in the learner guide. You do not need: programming · spreadsheet formulas beyond a sum · prior knowledge of CSRD or ESRS · your own company data · an AI account.

### 7.5 Not covered (Nicht in diesem Workshop)

- Keine Rechtsberatung und keine Prüfung, ob dein Unternehmen berichtspflichtig ist. / No legal advice and no check of whether your company must report.
- Kein Durchgang durch ESRS- oder VSME-Datenpunkte. / No walk-through of ESRS or VSME datapoints.
- Keine Scope-3-Berechnung (der eingekaufte Stahl kommt nur im Anhang vor). / No Scope 3 calculation (purchased steel appears only in the appendix).
- Kein Vergleich von ESG-Software oder KI-Anbietern. / No comparison of ESG software or AI vendors.
- Keine Vorbereitung auf eine Prüfung durch Wirtschaftsprüfer. / No preparation for an audit or assurance engagement.

### 7.6 Audience (3 lines)

- DE: Nachhaltigkeitsverantwortliche im Mittelstand, die Kundenfragebögen zu Scope 1 und 2 beantworten. / EN: Sustainability leads in mid-sized companies who answer customer questionnaires on Scope 1 and 2.
- DE: Controllerinnen und Controller, die Energie- und Emissionszahlen für Bank oder Geschäftsbericht zusammenstellen. / EN: Controllers who compile energy and emissions figures for the bank or the annual report.
- DE: Leute aus Einkauf, Facility Management und Betrieb, deren Rechnungen und Zählerstände in diesen Zahlen landen. / EN: People in purchasing, facility management and operations whose invoices and meter readings end up in these numbers.
- "Eher nicht für dich, wenn": du bereits nach ESRS berichtest und ein Prüfungsteam hast. / "Probably not for you if": you already report under ESRS with an assurance team.

### 7.7 Decision lab (warm-up = the deck's opening vote)

Fixed labels per test: decisionLegend "Deine erste Entscheidung" / "Your first decision", evidenceLegend "Der stärkste Beleg" / "The strongest evidence", submitLabel "Entscheidung prüfen" / "Check decision".

- **kicker:** Entscheidung 01 · Nachhaltigkeitsaussage / Decision 01 · Sustainability claim
- **title:** Geht dieser Satz so an den Kunden? / Does this sentence go to the customer as it is?
- **prompt (DE):** „Eine KI hat den Energieordner von Fernholt gelesen und schreibt für den Kundenfragebogen: „Seit 2023 haben wir unsere CO₂-Emissionen durch gezielte Effizienzmaßnahmen um 43 % gesenkt, und unsere Produktion läuft zu 100 % mit Ökostrom.“ Was machst du mit dem Satz?“
- **prompt (EN):** "An AI read Fernholt's energy folder and writes for the customer questionnaire: 'Since 2023 we have cut our CO₂ emissions by 43% through targeted efficiency measures, and our production runs on 100% green power.' What do you do with this sentence?"
- **facts (exactly 3):**
  1. DE: Die KI rechnet 3.160 t CO₂e für 2023 und 1.786,5 t für 2025, beides aus Fernholts eigenen Dateien. / EN: The AI calculates 3,160 t CO₂e for 2023 and 1,786.5 t for 2025, both from Fernholt's own files.
  2. DE: Werk 3, die Gießerei, wurde am 1. Juli 2024 verkauft; 2023 verursachte es 945 t. / EN: Werk 3, the foundry, was sold on 1 July 2024; in 2023 it caused 945 t.
  3. DE: Im Ordner liegt ein Ökostrom-Nachweis über 1.240 MWh für die Lieferstelle Werk Süd. / EN: The folder holds a green-power certificate for 1,240 MWh for the Werk Süd delivery point.
- **choices (ids identical in both locales):**
  - `send`: DE „Abschicken: Die Zahlen kommen aus unseren eigenen Dateien.“ / EN "Send it: the numbers come from our own files." (misconception: own files means correct)
  - `round`: DE „Abschicken, aber „rund 40 %“ schreiben, damit es vorsichtiger klingt.“ / EN "Send it, but write 'about 40%' so it sounds more careful." (misconception: precision is the problem)
  - `stop` ✓: DE „Anhalten: erst die 43 % in Balken zerlegen und jede Zahl einem Beleg zuordnen.“ / EN "Stop: split the 43% into bars first and link every number to a document."
- **evidence (ids identical):**
  - `read-all`: DE „Die KI hat alle 22 Dateien im Ordner gelesen.“ / EN "The AI read all 22 files in the folder." (reading is not checking)
  - `certificate` ✓: DE „Der Nachweis nennt nur Werk Süd; alle Standorte zusammen verbrauchten 3.610 MWh Strom.“ / EN "The certificate names only Werk Süd; all sites together used 3,610 MWh of electricity."
  - `deadline`: DE „Der Kunde braucht die Antwort bis 31. Oktober.“ / EN "The customer needs the answer by 31 October." (time pressure is not evidence)
- **recommendedChoiceId:** `stop` · **strongestEvidenceId:** `certificate`
- **feedback (≤ 40 words each):**
  - aligned: DE „Richtig. 1.240 von 3.610 MWh sind 34 %, nicht 100 %. Und 945 t der Senkung sind der Verkauf von Werk 3, keine Effizienz. Im Workshop zerlegst du die Zahl in vier Balken.“ / EN "Right. 1,240 of 3,610 MWh is 34%, not 100%. And 945 t of the drop is the sale of Werk 3, not efficiency. In the workshop you split the number into four bars."
  - decisionOnly: DE „Anhalten stimmt. Der stärkste Grund ist aber der Nachweis: Er deckt 1.240 von 3.610 MWh, also 34 %. Damit ist „100 % Ökostrom“ nachweislich falsch.“ / EN "Stopping is right. The strongest reason is the certificate: it covers 1,240 of 3,610 MWh, so 34%. That makes '100% green power' demonstrably false."
  - evidenceOnly: DE „Der Beleg stimmt: 1.240 von 3.610 MWh sind 34 %. Dann darf der Satz so nicht raus, auch nicht gerundet. Erst zerlegen, dann schreiben.“ / EN "The evidence is right: 1,240 of 3,610 MWh is 34%. So the sentence cannot go out, rounded or not. Split first, then write."
  - unsupported: DE „Eigene Dateien sind noch keine geprüften Zahlen. Der Nachweis deckt nur Werk Süd, 34 % des Stroms, und 945 t der Senkung sind ein verkaufter Standort.“ / EN "Your own files are not yet checked numbers. The certificate covers only Werk Süd, 34% of the power, and 945 t of the drop is a site that was sold."
- Lab JSON contains none of `localStorage|sessionStorage|cookie|upload`.

### 7.8 Case study block

- **companyName:** Fernholt Präzisionsteile GmbH
- **isFictional:** true
- **location:** DE „Zwei Werke und ein Lager in Deutschland (erfunden)“ / EN "Two plants and a warehouse in Germany (fictional)"
- **sector:** DE „Metallteile: Stanzen, CNC-Fertigung, Montage; Zulieferer für Automobil- und Maschinenbau“ / EN "Metal parts: stamping, CNC machining, assembly; supplier to automotive and machinery OEMs"
- **period:** DE „Geschäftsjahr 2025 im Vergleich zum Basisjahr 2023“ / EN "Financial year 2025 compared with base year 2023"
- **narrative (DE):** „Fernholt hat 180 Beschäftigte und fällt nicht unter die CSRD. Ein Automobilkunde will trotzdem bis 31. Oktober die Scope-1- und Scope-2-Emissionen 2025, die Senkung seit 2023 und den Ökostromanteil. Im Ordner liegen 22 Dateien: Strom- und Gasrechnungen, Zählerstände, ein Tankkartenexport und die Bilanz von 2023. Eine KI macht daraus 43 % weniger CO₂ und 100 % Ökostrom.“
- **narrative (EN):** "Fernholt has 180 staff and is outside CSRD. An automotive customer still wants, by 31 October, the 2025 Scope 1 and 2 emissions, the reduction since 2023 and the share of green power. The folder holds 22 files: electricity and gas bills, meter readings, a fuel-card export and the 2023 inventory. An AI turns them into 43% less CO₂ and 100% green power."
- **metrics (4):**
  1. DE „3.160 t CO₂e · Basisjahr 2023, wie berichtet“ / EN "3,160 t CO₂e · base year 2023, as reported"
  2. DE „1.915 t CO₂e · 2025, standortbasiert, korrigiert“ / EN "1,915 t CO₂e · 2025, location-based, corrected"
  3. DE „945 t · Anteil des verkauften Werks 3 an der Senkung“ / EN "945 t · share of the drop from selling Werk 3"
  4. DE „34 % · Strom mit entwerteten Herkunftsnachweisen“ / EN "34% · electricity backed by cancelled guarantees of origin"
- **decisionQuestion:** DE „Welcher Satz über die Emissionen 2023 bis 2025 hält jeder Nachfrage des Kunden stand?“ / EN "Which sentence about emissions from 2023 to 2025 holds up to every question the customer might ask?"
- **dataLimitations (4, same count in both locales):**
  1. DE „Alle Emissionsfaktoren sind gerundete Lehrwerte, keine amtlichen Werte.“ / EN "All emission factors are rounded teaching values, not official ones."
  2. DE „Für 2023 gibt es nur eine standortbasierte Bilanz; eine marktbasierte Veränderung lässt sich nicht angeben.“ / EN "2023 has only a location-based inventory, so no market-based change can be given."
  3. DE „Die Daten zeigen, dass weniger Energie verbraucht wurde, aber nicht, ob durch Maßnahmen oder geringere Produktion.“ / EN "The data shows that less energy was used, but not whether that came from measures or lower output."
  4. DE „Scope 3, vor allem der eingekaufte Stahl, ist nicht Teil des Falls.“ / EN "Scope 3, above all purchased steel, is not part of the case."

### 7.9 Steps (registry `steps`, 5 to 7, same `n` in both locales)

Seven steps matching the acts (`n` = "00" to "06"), each with a one-line description and `tool` ("Folien", "Folien + Demo", "Arbeitsblatt", "Papier"). The agenda of §7.3 is the source.

### 7.10 Materials (same order and kinds in DE and EN; kinds stay `html | zip`)

| Label | kind | Phase | Min | Note |
|---|---|---|---|---|
| Folien · 77 Min. / Slides · 77 min | html (`slides.html`) | during | 77 | primary for hosts |
| Moderationsansicht / Presenter view | html (`presenter.html`) | during | | for hosts |
| Interaktive Demo · 10 Min. / Interactive demo · 10 min | html (`demo.html`) | during/after | 10 | |
| Arbeitsblatt / Worksheet | html (`worksheet.html`) | during | | print |
| Transferblatt / Transfer sheet | html (`transfer.html`) | during | 10 | print |
| Lernbegleiter · 25 Min. / Learner guide · 25 min | html (`guide.html`) | after | 25 | primary for self-study |
| Merkkarte / Field card | html (`field-card.html`) | after | | print, one A4 |
| ESG-Kit · .zip | zip (`esg-kit.zip`) | before to after | | text only |

Labels avoid parentheses, "öffnen", "Open" and language words (registry test). All materials are English, so the existing "all materials in English" tests hold.

---

## 8. What is true in regulation today (26 Sep 2026)

Six plain statements for `appendix-rules` and the guide. Sources from `research/esg-regulation.md`; primary URLs must be clicked before the session.

1. **A company like Fernholt is outside the CSRD.** Since Directive (EU) 2026/470 entered into force on 18 Mar 2026, the CSRD covers EU companies with more than 1,000 employees **and** more than €450m net turnover. Source: Council press release 24 Feb 2026 (consilium.europa.eu/…/2026/02/24/council-signs-off-simplification…); EUR-Lex eli/dir/2026/470.
2. **Suppliers with up to 1,000 employees can refuse data requests beyond the voluntary standard.** The value-chain cap is in Directive 2026/470; the voluntary standard, based on the VSME, was published in the Official Journal on 21 Sep 2026 as Delegated Regulation (EU) 2026/1560. Sources: EP press release 2025-12 (europarl.europa.eu/…/20251211IPR32164); eur-lex.europa.eu/eli/reg_del/2026/1560/oj/eng.
3. **The VSME Basic Module asks for energy use and Scope 1 and 2 emissions, among 11 disclosures, with no double materiality assessment and no assurance.** Source: EFRAG VSME release (Dec 2024); Commission Recommendation (EU) 2025/1710 of 30 Jul 2025.
4. **Scope 2 is reported twice, location-based and market-based, under the GHG Protocol Scope 2 Guidance (2015).** The GHG Protocol and ISO plan one merged corporate standard, with consultation in Q2 2027 and publication in Q4 2028; until then today's rules apply. Sources: ghgprotocol.org Scope 2 Guidance PDF; ghgprotocol.org blog "key standard development updates" (29 Jul 2026).
5. **From 27 Sep 2026, Directive (EU) 2024/825 applies:** in consumer marketing it bans generic environmental claims without recognised excellent environmental performance and claims that a product has a neutral, reduced or positive climate impact based on offsetting. Sources: eur-lex.europa.eu/eli/dir/2024/825/oj/eng; Commission FAQ on the directive.
6. **The separate Green Claims Directive is stalled and not in force.** The Commission signalled withdrawal on 20 Jun 2025; the file has been formally pending since. Its status in Sep 2026 is UNVERIFIED. Source: EP legislative train "Substantiating green claims".

Footer on every regulatory scene: "Rules as of 26 Sep 2026 · not legal advice · check before you present: German transposition of the CSRD (last verified step: Bundestag hearing 13 Apr 2026) and of Directive 2024/825 (UWG amendment, secondary sources only)."

### 8.1 Three things the workshop must not claim

1. **That Germany has passed, or has not passed, its CSRD implementation law.** The latest verified step is the committee hearing on 13 Apr 2026; final passage is UNVERIFIED. Wording: "Germany is transposing the CSRD; check the BMJV procedure page."
2. **That the teaching factors are official values, or that any factor or rule under consultation already applies.** 0.40, 0.45, 0.60, 0.18 and 2.50 are rounded teaching values; hourly matching and deliverability for Scope 2 are consultation proposals, not rules.
3. **That the EmpCo bans apply directly to a B2B customer questionnaire, or that the German UWG details (including the § 15b transitional rule) are settled.** The directive targets consumer commercial practices; the German transposition is known from secondary sources only. The workshop says: the brochure is public, a false number is false everywhere, ask your counsel.

---

## 9. Alignment matrix (outcome → evidence → activity)

| On-the-job action | Outcome | Evidence in the workshop | Act | Material |
|---|---|---|---|---|
| Before a reduction goes into a text, split it into bars | 1 | Prediction and reveal on `the-waterfall`; transfer box 2 | 2, 6 | Deck, demo, transfer sheet |
| Before summing bills, draw the month grid and write the boundary | 2 | Votes on `whose-bill`, `month-grid`, `units` | 3 | Deck, worksheet side A, field card |
| Every number in a sentence gets a row | 3 | `one-row` fill, `trace-two` with expected answers | 3, 4 | Worksheet side B, kit `expected/` |
| Give the AI a request it can answer, or ask back | 4 | Five-card sort on `ask-or-refuse` | 5 | Deck, prompt pack |

---

## 10. Open items and risks

- **Record the AI runs** (§3.6) before launch; until then every AI answer is labelled constructed.
- **Name checks**: Fernholt (one-letter distance to W.u.H. Fernholz, packaging, Meinerzhagen), Pulverbeschichtung Mitte GmbH, Stadtwerke Beispielstadt. Handelsregister and DPMA.
- **Verify before the session**: German CSRD and UWG transposition status; Green Claims Directive status.
- **Time**: 77 min main path sits 0.5 min above the strict "slot minus 15%" line; the facilitator cut list frees 12 min.
- **Hs/Hi trap**: judged teachable only as a small bar with an appendix scene; it stays out of the main vote so non-technical rooms do not stall on it.
- **Printing**: worksheet, transfer sheet and field card print from HTML (browser print-to-PDF); no PDF is shipped.
