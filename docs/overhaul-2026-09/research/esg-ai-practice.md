# AI in ESG reporting, 2025–2026: what works in practice, where it fails, and a design for Workshop 04

Research brief for Workshop 04, "ESG Reporting with AI: From Raw Inputs to Clearer Insights".
Prepared 2026-09-26. Companion to `scratchpad/research/esg-regulation.md`, which covers the legal status (Omnibus I, revised ESRS, VSME, EmpCo, GHG Protocol timeline). This file covers practice: the data workflow, AI failure modes, tools, research evidence, and a ready-to-build workshop design with synthetic data and checked arithmetic.

---

## 0. Method and limits (read first)

- **How this was researched.** The sandbox proxy blocked direct page fetches from almost every domain tried (watershed.com, persefoni.com, arxiv.org, aclanthology.org, umweltbundesamt.de, aib-net.org, ghgprotocol.org, ecoinvent.org, gov.uk, huggingface.co, wikipedia). Facts below come from web-search result summaries that point to the named page. The session's web-search budget ran out part-way, so some vendors (Plan A, Normative, Greenly) were not re-checked.
- **Labels.** `[S]` = confirmed by a search result that points to the cited page. `[V]` = vendor's own claim, not independently tested. `[BK]` = background knowledge from before this session, not re-verified today; check before it goes on a slide.
- **All arithmetic in sections 9–11 was computed with a script** (`scratchpad/tmp/esg_calc.py`, Python `Decimal`) and cross-checked by hand. Every emission factor in those sections is an **illustrative teaching value, not an official factor**.
- None of this is legal or audit advice.

---

## 1. Key findings

1. **The bottleneck is data preparation, not model intelligence.** Vendors and researchers agree that AI helps most with reading documents, unit conversion, de-duplication and gap spotting, and least with deciding what the numbers mean. Watershed's own 2026 assessment says general-purpose models "often cannot distinguish a defensible estimate from a hallucinated one" [S][V]. The workshop should teach the data path, not prompting tricks.
2. **Extraction accuracy from real documents is still well short of audit grade.** Published ESG extraction systems report about 77–78% accuracy on quantitative values: GPT-4 at 76.9% in ESGReveal, DeepSeek at 78.2% in ESG Insight [S]. Accuracy drops further on tables and charts than on plain text (MMESGBench) [S]. A 2026 paper on financial QA found that the errors are mechanical rather than linguistic: the adjacent column, the prior-year column, a hallucinated denominator [S].
3. **Classification help is real but needs a human pick.** On Watershed's ATLAS benchmark (10,000 synthetic spend lines), the best LLM set-up picked the right emission-factor category 57.3% of the time on the first guess and 72.2% within three guesses. The authors conclude that a "suggest the top three, human picks" workflow is useful and full automation is not [S].
4. **The systems that work split the job.** The LLM locates pages, reads tables and proposes mappings. Deterministic code does the parsing, unit conversion, factor lookup, arithmetic and evidence checks (Scope3Trace's hybrid rule–LLM design) [S]. Several 2026 papers find that deterministic verification beats chain-of-thought prompting for numerical accuracy [S].
5. **The expensive errors are silent and often cancel out.** In the synthetic dataset below, a duplicate March invoice and a missing October invoice change the Werk Nord total by only 5,000 kWh (0.2%). A misfiled joint-venture bill and a misread MWh value partly cancel too. The raw-folder answer ends up 12% too low, which is inside most people's plausibility range. A total-level sanity check does not catch these; a period-coverage table and a source-row check do.
6. **Scope 2 is where non-experts go wrong most.** Typical mistakes: applying one green-tariff certificate to the whole company; using the grid average instead of the residual mix for uncovered power in the market-based figure; reporting only one Scope 2 number. The 2015 Scope 2 Guidance requires both methods, and the 2025 revision proposal keeps dual reporting [S].
7. **Factor provenance is a first-class data item.** Grid factors move every year: UBA reports 433 g CO₂/kWh for 2022, 386 for 2023 and 363 for 2024 [S]. DESNZ publishes a new UK set every June [S], and AIB publishes a new residual mix each year [S]. A factor without source, version, year and region is an unreviewable number. Licensed databases (ecoinvent, IEA) restrict redistribution [S], so they cannot simply be pasted into a public chatbot or a workshop kit.
8. **Headline reductions need decomposition before anyone writes a sentence about them.** In the synthetic baseline case, a "−39% since 2023" headline breaks down into 29.9 points from selling a site, 5.7 points from a cleaner grid, and 3.8 points from the company's own consumption cuts. An LLM asked to "explain the reduction" writes "efficiency measures" unless the decomposition is in its input.
9. **Greenwashing exposure rises from 27 Sep 2026**, one day after this brief. The Empowering Consumers Directive bans generic environmental claims and offset-based "climate neutral" product claims in consumer marketing [S]. Germany transposed it through the third UWG amendment [S, secondary]. An AI drafting tool that produces "we are climate neutral" or "100% green power" by default is now a legal risk, not just a style problem.
10. **The target audience is mostly outside CSRD.** A 180-person manufacturer is out of CSRD scope after Omnibus I (>1,000 employees and >€450m turnover). Its drivers are customer questionnaires, banks, and the VSME-based voluntary standard, which caps what CSRD-scope customers may demand [S] (see esg-regulation.md §2.4). So the workshop should anchor on Scope 1 and 2 from bills, one Scope 3 hotspot, and claims hygiene. It should not try to cover ESRS datapoint mapping in depth.
11. **Tool vendors converged on "agents plus audit trail" in 2025–2026.** Watershed (data-cleaning agents, Apr 2026), Persefoni (Analytics Agent, May 2026), Sweep (agents for disclosures and factor assignment, late 2025), Workiva (Sustainability Disclosure Agent) and SAP (AI factor mapping with confidence scores) all announced agent features [S][V]. Microsoft went the other way: it deprecated the invoice data-capture feature in Sustainability Manager from 5 Jan 2026 and pointed customers to build their own OCR [S]. That is a useful reality check to show on a slide.

---

## 2. Why a Mittelstand company does this at all (one paragraph for the deck)

After Omnibus I (Directive (EU) 2026/470, in force since 18 Mar 2026), CSRD applies only to companies with more than 1,000 employees *and* more than €450m turnover [S]. A 180-person manufacturer reports voluntarily, but it still gets asked. OEM customers send supplier questionnaires, banks ask for Scope 1 and 2 for loan pricing, and from 27 Sep 2026 its marketing claims fall under stricter consumer law [S]. Customers in CSRD scope may not demand more than the voluntary standard based on the VSME (the "value-chain cap") [S]. The VSME Basic Module asks for energy use and Scope 1 and 2 emissions, among 11 disclosures (esg-regulation.md §4, fact 6). So for this audience, "ESG reporting" in practice means: answer the questionnaire correctly, back every number with a document, and do not overclaim.

---

## 3. The practical workflow, step by step: where AI helps and where it breaks

### 3.1 Raw inputs a Mittelstand company actually has

| Input | Typical form | What goes wrong |
|---|---|---|
| Electricity bills | Monthly PDF (large sites with registering load metering, RLM), annual bill plus monthly advance payments (small sites), supplier portal exports | Bills spanning two months; year-end periods (e.g. 18.12.–17.01.); advance-payment notices (Abschläge) mistaken for consumption; values in MWh; German number format [BK] |
| Gas bills | Annual bill; kWh computed as m³ × Zustandszahl × Brennwert | kWh on the bill is **gross calorific value (Hs)**; many factors are per **net value (Hi)**; Hs is about 11% higher than Hi for natural gas [S: gasberechnen.de, ENTEGA] |
| Fuel cards | CSV export per transaction | AdBlue, car wash and shop items in the same file; litres and € in adjacent columns; private use of company cars [BK] |
| Meter readings | Facility manager's spreadsheet | Transformer ratio (Wandlerfaktor) not applied; meter swapped mid-year [BK] |
| Green tariff proof | Supplier letter, certificate of cancelled guarantees of origin (Herkunftsnachweise, UBA register) | Covers one site or part of the volume; wrong generation year [BK] |
| Travel data | Travel agency export, expense reports | Return trips as one row; cancelled bookings; booking date ≠ travel date [BK] |
| Purchasing / AP ledger | ERP export (spend, supplier, material group) | Energy invoices also sit in the AP ledger, so spend-based Scope 3 double counts them; price inflation read as volume [BK] |
| Supplier questionnaires | PDF/Excel replies | Company totals vs product footprints; kg vs t; reference year; boundary (cradle-to-gate or not) [BK] |
| HR data | Payroll/HR system export | Headcount vs FTE; agency workers; year-end vs average headcount; rates that cannot be averaged [BK] |
| Refrigerant top-ups | Service invoice from the refrigeration contractor | Not recognised as Scope 1 at all; GWP from different IPCC report versions [BK] |

### 3.2 Extraction (document AI, OCR, LLM reading)

- **Where AI helps.** Turning 40 PDFs into rows with period, quantity, unit, meter ID and invoice number. Vendors report large time savings. Watershed claims utility bills are processed "7x faster" and data cleaning "80%" faster [S][V]. Microsoft now tells customers to build invoice OCR with Copilot Studio, AI Builder and Power Automate, or to use the Arcadia connector, after deprecating its own data-capture solution (deprecated from 5 Jan 2026; the preview was deprecated 7 Nov 2025) [S].
- **Where it breaks.** Tables and charts are harder than text (MMESGBench: accuracy "declines significantly for tables, images, and especially charts") [S]. The typical error is picking the wrong cell: the adjacent period column or the prior-year value [S: arXiv 2603.04663]. German number formats are a Mittelstand-specific trap: "1.240 MWh" means one thousand two hundred forty megawatt hours. An English-locale reader, or a model primed on English documents, can take it as 1.24 [BK].
- **Control.** Every extracted row carries a pointer to the file and page. ChatReport's design principle, answers traceable to the source to limit hallucination harm, is the right model [S]. Research systems ask the LLM for page numbers so values can be traced [S].

### 3.3 Normalisation: units, periods, sites, currencies

- **Units.** Convert everything to one energy unit (kWh or MWh) in a separate column and keep the original value and unit next to it. Litres of diesel to kWh needs a stated conversion value (illustrative 10.0 kWh/l below). Gas needs a stated Hs/Hi basis.
- **Periods.** Build a coverage table (site × month) before summing anything. A bill covering 01.11.–31.12. counts as two months. Year-end-spanning bills are split pro rata by days, and the split rule is written down [BK].
- **Sites.** Each row gets a site ID from a fixed list. Anything not on the list is flagged, not dropped.
- **Currencies and prices.** Spend-based factors are tied to a currency and a price year. 2025 spend in USD or CHF must be converted, and nominal spend should be deflated to the factor's price year, or else price increases show up as emission increases [BK].
- **AI role.** An LLM can propose the normalisation (e.g. "this bill is in MWh"). The conversion itself should be a fixed rule in a spreadsheet or code, so the same input always gives the same output.

### 3.4 Organisational boundary

- The GHG Protocol Corporate Standard lets a company choose equity share, financial control or operational control. The choice must be applied consistently [BK; ghgprotocol.org/corporate-standard].
- Typical Mittelstand traps: a joint venture's bill handled by the company's purchasing team; a leased warehouse (under operational control, usually in Scope 1/2); a site sold mid-year; a sister company under the same family holding [BK].
- **AI role.** None in the decision. The boundary is a management decision written down *before* the AI sees the folder. The AI can flag documents addressed to other legal entities.

### 3.5 Mapping activity data to emission factors

- **Sources in German practice.**
  - UBA grid electricity: 363 g CO₂/kWh for 2024, 386 for 2023, 433 for 2022 [S]. That figure is direct CO₂ without the upstream chain; UBA also publishes CO₂-equivalent values including upstream [BK]. The 2025 value page exists ("nur leicht gesunken") but was not readable here [S].
  - AIB European residual mix for market-based Scope 2: the European average fell by 42 g to 452 g CO₂/kWh for 2024 [S]. The 2025 results were published 26 May 2026 [S]. In Germany the residual mix is usually well above the grid average, because the renewable attributes sold as guarantees of origin are removed from it [BK; check the national value in the AIB table].
  - DESNZ/DEFRA conversion factors: the 2025 set was published 10 June 2025, with UK electricity down 15% [S]. A 2026 set and methodology report also exist [S]. Its fuel factors are widely used outside the UK. **Its electricity factor is UK grid only** and is wrong for German sites [BK].
  - IEA emission factors: annual paid data product, licence-restricted [S].
  - ecoinvent: licensed as a complete database. Individual factors cannot be bought, and some platforms cannot show raw ecoinvent factors because of licence terms [S]. Before pasting licensed factor tables into a third-party AI tool or a shared workbook, read the EULA [BK].
  - German-specific extras: BAFA's CO₂ factor information sheet for fuels and UBA's ProBas/GEMIS [BK].
- **Location- vs market-based.** Location-based uses the grid average where the power is used. Market-based uses contractual instruments (supplier-specific mix, guarantees of origin, PPAs); uncovered consumption gets the residual mix [S: esg-regulation.md §2.9 citing the Scope 2 Guidance]. The 2025 revision proposed hourly matching and deliverability for market-based claims. It went out for consultation from 20 Oct 2025 to 31 Jan 2026 and is now folded into a joint GHG Protocol/ISO standard planned for Q4 2028 [S].
- **AI role.** Suggest the factor ID from a *pinned* factor table with confidence (SAP SFM and Climatiq Autopilot both show confidence scores and an audit trail) [S][V]. Never let the model supply factor values from memory: it will give a plausible number with the wrong year or country.

### 3.6 Scope 3: spend-based vs activity-based vs supplier-specific

- **Methods, from weakest to strongest:** spend-based (EUR × sector factor), average-data (tonnes × generic factor), hybrid, supplier-specific (supplier's product footprint) [BK; GHG Protocol Scope 3 Standard and Technical Guidance].
- **AI's real contribution** is classifying thousands of AP-ledger lines to factor categories. ATLAS: 57.3% top-1 and 72.2% top-3 with few-shot Claude 3.5 Sonnet, versus 40.6% zero-shot [S]. IBM and Climatiq describe the same use case [S]. An LLM-plus-retrieval study on product-footprint factor matching reports 95% precision for its best set-up [S: MDPI Sustainability 18(11) 5444]. Treat that as an upper bound for a curated database, not for a messy ERP export.
- **Known traps.**
  - Spend-based factors turn price inflation into "emissions growth".
  - Energy invoices in the AP ledger get counted again in Category 1.
  - Input-output-based Scope 3 categories overlap with each other; Rabobank quantified this overlap [S].
  - A supplier's company-wide Scope 1+2 intensity is not the product's cradle-to-gate footprint [BK].

### 3.7 Data-quality scoring

- The GHG Protocol Scope 3 Standard rates data on technological, temporal and geographical representativeness, completeness and reliability. PCAF uses a 1–5 score [BK].
- **Workshop-sized version (proposal):** A = measured and documented (invoice, meter). B = calculated from documented data (meter difference, allocation). C = estimated (average, spend-based, extrapolated). Rule: every C row is named in the report text.
- **AI role.** Proposes the grade from the row's source type. The human confirms it.

### 3.8 Anomaly detection

- Useful rules [BK]:
  - month-over-month change above a threshold;
  - kWh per production hour;
  - heating gas against degree days;
  - the same invoice number twice;
  - overlapping or missing periods;
  - negative meter differences;
  - a meter ID change.
- Watershed markets anomaly-flagging agents [S][V].
- **Pattern that works:** a rule raises the flag. The AI drafts a candidate explanation ("August: plant holiday?"). A person confirms or rejects it. An AI that explains anomalies without a rule-based flag tends to explain away real errors.

### 3.9 Double materiality assessment support

- The revised ESRS keep double materiality but allow a "top-down" assessment at topic level, with qualitative reasoning where the answer is clear [S: generationimpact.global, ecoPRISM]. The VSME Basic Module needs no double materiality assessment (esg-regulation.md fact 6).
- **AI helps with:** drafting the long list from the ESRS topic list, summarising interview notes and customer questionnaires, and grouping impacts, risks and opportunities. Sweep offered "suggested mapping of financial and impact materiality based on industry benchmarks" as early as March 2024 [S][V].
- **AI fails at:** inventing stakeholder concerns nobody raised, marking everything material, and copying sector benchmarks as if they were the company's own assessment [BK]. The decision and its evidence belong to management.

### 3.10 ESRS / VSME datapoint mapping

- The revised ESRS (adopted 3 Jul 2026; mandatory from FY2027) cut mandatory datapoints by 61% and all datapoints by more than 70% [S]. Any mapping built on the 2023 ESRS datapoint list is now partly stale [BK].
- **AI helps with:** gap analysis, meaning "which datapoints do we have evidence for?" Workiva's Sustainability Disclosure Agent scans existing disclosures against standards and lists gaps [S][V].
- **AI fails at:** mapping to datapoints that no longer exist, confusing near-identical datapoints (gross Scope 2 location- vs market-based), and mixing ESRS and VSME numbering [BK].
- For this audience, map the ledger to VSME B3 (energy and GHG) and the customer's questionnaire, not to full ESRS E1.

### 3.11 Drafting narrative disclosures with evidence citations

- **Rule:** every sentence that contains a number or a claim cites a ledger row ID or a document. Sentences without evidence are deleted or rewritten as intentions ("we plan to…").
- ClimateBERT's analysis of corporate climate disclosures found that TCFD support was "mostly cheap talk" and that firms cherry-picked non-material risk information [S]. LLM-drafted sustainability text drifts towards the same pattern: generic commitments, positive framing, no numbers. CLIMATE-FEVER (1,535 real claims, 7,675 claim–evidence pairs) shows how hard claim verification is even for purpose-built systems [S].
- ESG-Bench (AAAI) reports that a four-step chain-of-thought prompt raised supported-answer accuracy from 76% to 96% on its ESG QA set [S]. That is an argument for structured checking prompts, not for unchecked drafting.

### 3.12 Assurance readiness

- CSRD assurance stays at limited assurance. ISSA 5000 applies to periods beginning on or after 15 Dec 2026 [S].
- A Mittelstand company outside CSRD may still face verification requests from customers or banks (e.g. ISO 14064-3 verification) [BK].
- **What an assurer or diligent customer does [BK]:** picks a reported number, asks for the rows behind it, picks a row, asks for the source document, and checks the factor version and who reviewed it.
- **Minimum audit trail:**
  - row ID;
  - source file and page;
  - original value and unit;
  - normalised value;
  - status (actual / estimated / excluded, plus a reason);
  - factor ID and version;
  - preparer, reviewer and date (four-eyes);
  - a change log for restatements.
- **AI outputs should be kept as working papers,** stating the model, date and prompt, and should never be the only record of a number.

### 3.13 Greenwashing risk

- From 27 Sep 2026 the Empowering Consumers Directive bans generic environmental claims without recognised excellent performance, and bans offset-based climate-neutrality claims about products [S]. In Germany it applies through the third amendment of the UWG. Secondary sources report Bundestag passage and publication in early 2026, and a last-minute transitional rule for existing stock (§ 15b UWG-E) scheduled for a Bundestag vote on 24 Sep 2026 [S, secondary; verify].
- The German Federal Court of Justice (BGH) ruled in June 2024 (I ZR 98/23, "klimaneutral") that the ambiguous term has to be explained in the advertisement itself [BK; verify the citation before use].
- **AI-specific risk.** Drafting tools reproduce the language of published reports, which is full of "climate neutral", "green" and "sustainable". A draft that says "100% green electricity" because one site has a green tariff is a claim the evidence does not support.

---

## 4. Failure-mode catalogue (with examples from the synthetic data in §9–11)

| # | Failure mode | Concrete example (Fernholt data) | Why models do it | Check that catches it | Control |
|---|---|---|---|---|---|
| 1 | **Invented numbers** | October invoice missing; model writes "October: approx. 195,000 kWh" as if it were read from a document, or quotes "0.366 kg/kWh (UBA 2025)" from memory | LLMs complete patterns; a gap looks like a missing value to fill | Every number must resolve to a row ID; rows with status "estimated" need a method | Ledger with source column; model gets factor table, not freedom |
| 2 | **Unit errors (kWh vs MWh, kg vs t, Hs vs Hi)** | Werk Süd "1.240 MWh" read as 1,240 kWh (−495.5 t CO₂e); supplier PCF "1.650 kg CO₂e/t" read as 1.65 kg/t (factor 1,000); gas factor per Hi applied to Hs kWh (+41.8 t) | Number format and unit tokens are small; units vary within one folder | Unit column is mandatory; per-site kWh per employee or per machine hour vs prior year | Fixed conversion table; original value kept next to normalised value |
| 3 | **Double counting across sources** | March invoice scanned twice (+205,000 kWh); energy invoices in the AP ledger also classified as Scope 3 spend; fuel card and leasing report both list diesel | Duplicates look like valid documents; the model has no invoice-number key | Uniqueness check on invoice number + period + meter | De-duplication rule in code, not in the prompt |
| 4 | **Mixing organisational boundaries** | JV bill (Pulverbeschichtung Mitte, 40%, run by the partner) in the Werk Nord folder: +800,000 kWh (+320 t location-based) | Folder structure implies membership; addressee line ignored | Addressee/legal entity column; site list with boundary flag | Written boundary rule before any AI run |
| 5 | **Wrong factor year or region** | 2023 grid factor used for 2025 (+180.5 t); UK DESNZ electricity factor used for a German site | Memory holds many versions; year and region rarely in the prompt | Factor ID includes year and region; reviewer checks the version | Pinned factor table with source, version, licence |
| 6 | **Confusing market- and location-based** | Green certificate for Werk Süd applied to whole company (market-based = 0); grid average used for grey power in market-based (948.0 t instead of 1,422.0 t); only one Scope 2 number reported | Two methods, similar names; "green tariff" reads as "zero" | Report template has two Scope 2 lines; certificate volume ≤ covered consumption | Instrument table: which kWh are covered by which certificate |
| 7 | **Averaging percentages or rates** | Accident rate: average of three site rates = 56.82 per million hours; correct pooled rate = 34.72 | Averaging is the default summary operation | Recompute every rate from numerator and denominator totals | Ledger stores counts and hours, never only rates |
| 8 | **Silently dropping missing months** | Werk Nord October absent; folder still holds 12 files (duplicate March and the misfiled JV bill fill the gaps) | "12 files = 12 months" heuristic; no coverage check | Site × month coverage table | AI instruction: list periods covered before summing; stop if a month is missing |
| 9 | **Restated baselines ignored** | "−39% since 2023" includes Werk 3, sold in 2024; like-for-like reduction is −13.5% | Model compares the two totals it is given | Structural-change log; base-year recalculation policy | Baseline restated when boundary changes, documented in the ledger |
| 10 | **Confident narrative without evidence** | "Reduction achieved through targeted efficiency measures"; "steel emissions rose 20% due to higher volumes" (tonnage was flat; price rose) | Fluent causal language is the model's default | Claims table: each sentence → evidence row, verdict | Draft only from the approved ledger; unsupported claims removed |
| 11 | **Partial periods / wrong period attribution** | Nov–Dec bill counted as one month (monthly average skewed); a 15.12.–14.01. bill assigned wholly to one year | Periods are text, not dates, for the model | Days-covered check per row | Pro-rata rule in code |
| 12 | **Spend-based price and currency effects** | Steel spend +20% (price 750 → 900 €/t) at flat 2,400 t → spend-based emissions +20% | Spend is the easiest field to read | Compare spend-based result with tonnes | Deflate to factor price year; prefer activity data for hotspots |
| 13 | **Wrong number from a supplier reply** | Supplier's company-wide Scope 1+2 intensity (0.12 t/t) used instead of product cradle-to-gate (1.65 t/t): 288 t instead of 3,960 t | Questionnaires contain several similar numbers | Boundary field (cradle-to-gate?) required for each supplier value | Supplier data template with named fields |
| 14 | **Adjacent-column / prior-year pick** | Reading the 2024 column in a supplier table for a 2025 value | Documented as the dominant failure in financial QA [S: arXiv 2603.04663] | Year field extracted and checked | Extraction returns the column header with the value |

---

## 5. Tools landscape (as found; vendor claims marked)

| Tool | Where AI is used (as announced) | Source | Fit for a 180-person manufacturer |
|---|---|---|---|
| **Watershed** | Data-cleaning and analysis agents (Apr 2026), claimed 80% faster time to actionable data; utility-bill processing claimed 7x faster; anomaly flags; ATLAS benchmark for spend classification. Named a leader in the Forrester Wave 2026 [V] | globenewswire.com 2026-04-21; sustainabilitymag.com; watershed.com blog (2026); climatechange.ai (ATLAS) | Enterprise-priced. Useful as reference architecture and for its honest "what doesn't work" writing |
| **Persefoni** | Persefoni Analytics Agent (May 2026) for querying emissions data; Copilot chat on "Persefoni LLM"; free "Persefoni Pro" tier | businesswire.com 2026-05-05; persefoni.com/persefoniai | Free tier makes it a realistic option to show; check data residency |
| **Sweep** | "Sweepy" assistant (Mar 2024): data ingestion, suggested materiality mapping; late 2025 agents for disclosure writing, raw-data mapping and factor assignment; approval workflows and audit trail [V] | sweep.net newsroom; esgtoday.com (UK SRS launch) | Mid-to-enterprise; the materiality suggestion is a good discussion example ("whose assessment is this?") |
| **Workiva** | Sustainability Disclosure Agent: scans disclosures against standards and lists gaps; agentic platform across finance, GRC, sustainability; states customer data is not used for training [V] | esgtoday.com; workiva.com | Mostly listed and large companies; relevant as the "report assembly" end of the chain |
| **Microsoft Sustainability Manager** | Invoice data capture **deprecated from 5 Jan 2026** (preview from 7 Nov 2025); alternative is custom OCR via Copilot Studio / AI Builder / Power Automate or the Arcadia connector; Sustainability API deprecated 30 May 2025 | learn.microsoft.com "What's deprecated" | Signal for the room: even a large vendor stepped back from generic bill capture |
| **SAP Sustainability Footprint Management / Green Ledger** | AI-assisted emission-factor mapping against LCA databases with confidence scores; Green Ledger (launched end of 2024) ties carbon to financial postings; Joule copilot for carbon postings [V] | sap.com product pages; bearingpoint.services; technologymagazine.com | Relevant if the company runs S/4HANA; shows "carbon in the ERP" direction |
| **Climatiq** | Autopilot: NLP model matches unstructured text (invoices, BOMs, ERP lines) to emission factors, with confidence levels and audit trail; API access to factor sources incl. ecoinvent under licence limits | climatiq.io blog, API docs, ecoinvent guide | Developer-oriented; good example of "AI suggests factor, confidence shown" |
| **Plan A** | SME/bank-focused carbon accounting and ESG reporting (Berlin) [BK, not re-verified] | plana.earth | German-market relevance; check current AI features before naming |
| **Normative** | Carbon accounting engine, SME focus, published Omnibus explainers [BK; site referenced in search results] | normative.io | Check current AI features before naming |
| **Greenly** | SME carbon accounting (France), heavy use of spend-based data from accounting connections [BK, not re-verified] | greenly.earth | Good example for the spend-based price-effect trap |

Recommendation for the deck: show the pattern, not a vendor ranking. Everyone now sells "agents". The questions to ask any tool are the same:

- Does each number link to its source document?
- Which factor version was used?
- Can I see what was excluded and why?
- Who approved it?

---

## 6. Research and evaluations

| Work | What it tested | Result | Use in the workshop |
|---|---|---|---|
| **ChatReport** (Ni et al., EMNLP 2023 demo; arXiv 2307.15770) | LLM analysis of sustainability reports against TCFD; answers traceable to source; expert-in-the-loop | Released analyses of 1,015 reports; traceability used to reduce hallucination harm [S] | "Every answer points to a page" as a design rule |
| **ClimateBERT** (Webersinke et al., arXiv 2110.12010) and "Cheap talk and cherry-picking" (Finance Research Letters 2022) | Climate-domain language model (1.6M paragraphs); applied to disclosures | TCFD support "mostly cheap talk"; cherry-picking of non-material risks; cheap talk correlates with negative news and higher emissions growth [S] | Why generic narrative is a risk signal |
| **CLIMATE-FEVER** (Diggelmann et al., arXiv 2012.00614) | Verification of 1,535 real climate claims against evidence | 7,675 claim–evidence pairs; disputed claims with both supporting and refuting evidence [S] | Claim checking is hard even for purpose-built systems |
| **ESGReveal** (J. Cleaner Production; arXiv 2312.17264) | RAG + LLM extraction from 166 HK-listed companies' ESG reports | GPT-4: 76.9% data extraction, 83.7% disclosure analysis [S] | "About three in four numbers right" is not audit grade |
| **ESG Insight** (Int. J. ML & Cybernetics, 2026) | Structured extraction and evaluation | DeepSeek: 78.2% quantitative extraction, 85.1% disclosure identification [S] | Same order of magnitude in 2026 |
| **MMESGBench** (arXiv 2507.18932) | Multimodal ESG document QA | Accuracy "declines significantly for tables, images, and especially charts"; retrieval of 5 pages improved accuracy ~30% [S] | Bills are tables; this is the hard case |
| **ESG-Bench** (AAAI; arXiv 2603.13154) | Hallucination in long ESG reports | 4-step CoT: up to 96% vs 76% standard prompting [S] | Structured checking prompts help; they do not replace data prep |
| **Scope3Trace** (arXiv 2607.17122) | Scope 3 extraction from reports | Hybrid: LLM for page localisation and table reconstruction; rules for numeric parsing, category mapping, evidence verification [S] | Split the job: model reads, code counts |
| **ATLAS** (Watershed, NeurIPS 2024 CCAI workshop) | Spend-line classification to factor categories (10,000 synthetic lines) | Few-shot LLM 57.3% top-1, 72.2% top-3; zero-shot 40.6% [S] | "Suggest three, a human picks" |
| **EF matching with LLM + retrieval** (MDPI Sustainability 18(11) 5444) | Product-footprint factor matching | Best model 95% matching precision [S] | Upper bound on curated data |
| **AutoPCF** (arXiv 2308.04241) | LLM-generated product carbon footprints | GPT-3.5/4 produced better inventories than other LLMs tested [S] | Early evidence; not a factor source |
| **Financial numeric hallucination papers, 2026** (arXiv 2607.11414 "Confidently Wrong"; 2603.04663 deterministic fact ledgers; SSRN 6856159) | Numeric QA over filings | Reasoning errors harder to detect than factual ones (AUROC ≈0.73–0.79 vs ≈0.9–1.0); failures are mechanical: adjacent column, hallucinated denominator; deterministic verification beats CoT [S] | Direct support for "ledger first" |
| **EulerESG** (arXiv 2511.21712), **ESGLens** (arXiv 2604.19779), EU Taxonomy KPI extraction (arXiv 2512.24289), **ESGBench** explainable QA (arXiv 2511.16438) | Further LLM pipelines for ESG disclosure analysis | Titles and abstracts only seen; not summarised here | Further reading |

---

## 7. What this means for teaching (design rules for Workshop 04)

1. **Show the data path, not the model.** Same model, same question, two inputs. The difference comes from the data (mirrors W03's "One question, asked twice").
2. **Split the job visibly.** AI reads and suggests. The ledger and a spreadsheet count. People decide the boundary, the estimation method, the claims wording and the sign-off.
3. **The right answer to a messy folder is often a question.** Teach what a good assistant should say when October is missing (§11.4).
4. **Every number needs a row ID.** Every row needs a document, and every factor needs a version.
5. **Two Scope 2 numbers, always.**
6. **Decompose before you narrate.** Boundary change, factor change and own action are three different stories.
7. **Keep the arithmetic small enough to check with a phone calculator.** The datasets below use round teaching factors for this reason.
8. **Say what you did not test.** If the demo replays captured model outputs, show model, date and prompt. If an example is constructed from documented failure modes rather than captured, label it so.

---

## 8. (a) Decision moments for the 90-minute workshop

Audience: sustainability, finance and operations staff in German Mittelstand companies, not technical. The frame is **one question, asked twice**:

> "What were Fernholt's Scope 1 and Scope 2 emissions in 2025? Give Scope 2 location-based and market-based."
> DE: „Wie hoch waren die Scope-1- und Scope-2-Emissionen von Fernholt im Jahr 2025? Scope 2 bitte standortbasiert und marktbasiert."

Ask 1 runs on the raw folder, Ask 2 on the prepared ledger. The decision moments sit between the two asks. Each one is a single on-screen choice with three options, a reveal, and one number that shows the effect.

### DM1: Which bills belong in our footprint? (Boundary)
DE: *Welche Rechnungen gehören zu uns?*
- **On screen:** the Werk Nord folder with 12 PDFs. One is addressed to "Pulverbeschichtung Mitte GmbH", a 40% joint venture run by the partner. Fernholt's purchasing team handles its energy contract.
- **Options:** A) include 100%, it's in our folder. B) include 40%, our share. C) exclude under operational control, note it separately.
- **Reveal:** C, if Fernholt uses the operational control approach (write that choice down first). B would be correct only under the equity-share approach. Effect of A: +800,000 kWh, i.e. +320.0 t location-based and +480.0 t market-based.
- **Failure mode taught:** mixing organisational boundaries.
- **AI's job:** flag documents addressed to other legal entities. It does not decide.

### DM2: Twelve files, eleven months (Completeness)
DE: *Zwölf Dateien, elf Monate*
- **On screen:** the same folder, now as a month grid. March appears twice (same invoice number 4711-03), October is missing, and one bill covers November and December.
- **Options:** A) 12 files means the year is complete. B) ask the AI to sum all bills. C) build the month grid first, remove the duplicate, and recover October.
- **Reveal:** C. October is in the facility manager's meter-reading file (200,000 kWh). The punchline: the duplicate March (+205,000) and the missing October (−200,000) almost cancel, so the folder sum is only 5,000 kWh off. A plausibility check on the total would not catch it.
- **Failure modes taught:** silently dropping missing months; double counting.
- **AI's job:** list the periods covered per site before summing, and stop if a month is missing.

### DM3: What does "1.240 MWh" mean? (Units and number format)
DE: *Was heißt „1.240 MWh"?*
- **On screen:** Werk Süd's annual statement: "Verbrauch 2025: 1.240 MWh".
- **Options:** A) 1.24 MWh. B) 1,240 kWh. C) 1,240 MWh = 1,240,000 kWh.
- **Reveal:** C. A and B are the same error (factor 1,000) and remove 495.5 t from location-based Scope 2. Optional second card: the gas bill states kWh at gross calorific value (Brennwert); using a net-value factor adds 11% (+41.8 t).
- **Failure mode taught:** unit errors.
- **AI's job:** keep the original value and unit, and propose a conversion that a fixed rule applies.

### DM4: Which factor, from which year? (Factor provenance)
DE: *Welcher Faktor, aus welchem Jahr?*
- **On screen:** three candidate grid factors: "0.45 (2023)", "0.40 (2025)", and a UK factor (for discussion only).
- **Options:** A) let the AI use what it knows. B) let the AI search the web. C) give the AI a pinned factor table with source, version, year, region and licence, and let it only pick IDs.
- **Reveal:** C. The wrong year alone adds 180.5 t (+12.5%). Mention licensing: some databases may not be pasted into external tools.
- **Failure modes taught:** wrong factor year or region; invented factors.
- **AI's job:** suggest the factor ID with a confidence score. It never supplies the value.

### DM5: One green certificate, two Scope 2 numbers (Market- vs location-based)
DE: *Ein Ökostrom-Nachweis, zwei Scope-2-Zahlen*
- **On screen:** a guarantee-of-origin confirmation for Werk Süd, 1,240 MWh, cancelled.
- **Options:** A) market-based Scope 2 = 0 for the whole company. B) 0 for Werk Süd, grid average for the rest. C) 0 for Werk Süd, residual mix for the rest; report location-based as well.
- **Reveal:** C. Location-based 1,444.0 t, market-based 1,422.0 t. Option B gives 948.0 t, 474 t too low. Option A gives 0. The certificate covers 34.35% of electricity, so "100% green power" is false.
- **Failure mode taught:** confusing market- and location-based.
- **AI's job:** match certificate volume to covered kWh and flag uncovered volume.

### DM6: Calculate, ask back, or refuse? (Role of the AI)
DE: *Rechnen, nachfragen oder ablehnen?* (mirrors W03's "What should the AI do with each request?")
- **On screen:** five requests, each sorted into *calculate from the ledger* / *ask back* / *refuse or rewrite*:
  1. "Sum Scope 2 for 2025." → Calculate, from the ledger.
  2. "Fill in October." → Ask back: use the meter reading, or estimate with a stated method and label it C.
  3. "Write that we are climate-neutral." → Refuse or rewrite (offset-based claims; EmpCo applies from 27 Sep 2026).
  4. "Enter our Scope 3 total in the customer questionnaire." → Ask back: only Category 1 steel is calculated, so say what is covered.
  5. "Explain why emissions fell." → Calculate first: decompose, then draft (DM7).
- **Failure modes taught:** invented numbers; confident narrative without evidence.

### DM7: Why did emissions fall 39%? (Baseline and narrative)
DE: *Warum sind die Emissionen um 39 % gesunken?*
- **On screen:** an AI-drafted sentence: "Since 2023 we have reduced our CO₂ emissions by 39% through targeted efficiency measures."
- **Options:** A) publish. B) soften the wording. C) decompose first.
- **Reveal:** C. 29.9 points come from selling Werk 3 in 2024, 5.7 points from a cleaner grid, and 3.8 points from Fernholt's own consumption cuts. Against the restated baseline the reduction is −13.5%.
- **Failure modes taught:** restated baselines; confident narrative.

### DM8 (reserve / advanced group): Which number from the supplier's reply? (Scope 3)
DE: *Welche Zahl aus dem Lieferantenfragebogen?*
- **On screen:** the steel supplier's reply lists a company total, a Scope 1+2 intensity and a product footprint.
- **Options:** A) company total. B) Scope 1+2 intensity 0.12 t/t. C) product footprint 1.650 kg CO₂e/t, cradle-to-gate.
- **Reveal:** C gives 3,960 t. B gives 288 t (−93%). Spend-based says emissions "rose 20%", but tonnage was flat and the price rose. Steel alone is larger than all of Scope 1 and 2 combined; business travel is 2.1 t.
- **Failure modes taught:** spend vs activity confusion; wrong supplier number; misplaced effort.

### Suggested run sheet (90 min)

| Min | Block | Content |
|---|---|---|
| 0–5 | Opening | The question; who asks it (customer questionnaire, bank) |
| 5–13 | Ask 1 | AI on the raw folder; its answer (1,270.5 t location-based, 1,270.0 t "market-based") looks plausible |
| 13–48 | DM1–DM5 | ~7 min each: choice, reveal, one number |
| 48–56 | Ask 2 | Same question on the prepared ledger: 1,444.0 / 1,422.0 / 471.2 t. What changed: the data, not the model (waterfall, §9.6) |
| 56–63 | DM6 | Calculate / ask back / refuse |
| 63–72 | DM7 | Decompose the 39% |
| 72–84 | Your turn | "One row, five boxes": each participant takes one real bill from their company and fills in *Source, Period, Unit, Boundary, Factor (+version)* |
| 84–90 | Close | Four questions to ask any AI tool (§5); checklist; DM8 as take-home |

---

## 9. (b) Synthetic dataset 1: "Energy 2025", Scope 1 and 2 from raw bills

### 9.1 The company (fictional)

**Fernholt Präzisionsteile GmbH**, fictional. The name was coined for this workshop; run a quick Handelsregister/trademark check before publishing, and mark "fiktives Unternehmen" on every slide.

- 180 employees, metal parts supplier (stamping, CNC machining) to automotive and machinery OEMs. Turnover €42m (illustrative).
- **Organisational boundary: operational control.**

| Site ID | Site | Activity | Staff | In boundary? |
|---|---|---|---|---|
| WN | Werk Nord (HQ) | Stamping, assembly, offices | 110 | Yes (owned) |
| WS | Werk Süd | CNC machining | 55 | Yes (owned) |
| LO | Lager Ost | Leased warehouse, own sub-meter | 15 | Yes (leased, operated by Fernholt) |
| JV | Pulverbeschichtung Mitte GmbH | Powder coating; Fernholt holds 40%, partner operates | — | **No** (no operational control); candidate for Scope 3 Cat. 15 disclosure |
| W3 | Werk 3 (foundry) | Sold 1 Jul 2024 | — | Not in 2025; in the original 2023 baseline (Dataset 3) |

### 9.2 Illustrative teaching factors (NOT official values)

> Every value in this table is a rounded teaching value, chosen so the arithmetic is easy to follow. Do not use them for real reporting. The "real-world anchor" column shows only that the teaching values sit in a plausible range.

| Factor ID | Description | Value | Unit | Real-world anchor (not used) |
|---|---|---|---|---|
| F-EL-LB-2025 | Grid electricity DE, location-based, 2025 | 0.40 | kg CO₂e/kWh | UBA: 363 g CO₂/kWh for 2024, direct CO₂ only [S] |
| F-EL-LB-2024 | same, 2024 | 0.42 | kg CO₂e/kWh | — |
| F-EL-LB-2023 | same, 2023 | 0.45 | kg CO₂e/kWh | UBA: 386 g CO₂/kWh for 2023 [S] |
| F-EL-RM-2025 | Residual mix DE, market-based, 2025 | 0.60 | kg CO₂e/kWh | AIB 2024 European average 452 g/kWh; DE typically above grid average [S][BK] |
| F-EL-GO | Electricity covered by cancelled guarantees of origin | 0.00 | kg CO₂e/kWh (Scope 2 market-based) | Scope 2 Guidance quality criteria [BK] |
| F-GAS-HS | Natural gas, per kWh gross calorific value (Brennwert, Hs) | 0.18 | kg CO₂e/kWh(Hs) | ≈0.2 per kWh(Hi) [S], ÷1.11 |
| F-GAS-HI | Natural gas, per kWh net calorific value (Heizwert, Hi) | 0.20 | kg CO₂e/kWh(Hi) | ≈0.201 [S] |
| F-DSL | Diesel, road, pump blend | 2.50 | kg CO₂e/litre | DESNZ-type values ~2.5–2.7 [BK] |
| C-DSL-E | Diesel energy content | 10.0 | kWh/litre | ~9.8–10.0 net [BK] |
| C-HS-HI | Gross/net ratio natural gas | 1.11 | — | [S] |

### 9.3 The raw folder (what the AI gets in Ask 1)

German number format is used on all documents, as on real German bills.

**`Energie_2025/Werk_Nord/Strom/`: 12 PDFs**

| # | File | Period on document | Quantity on document | Note (hidden from participants until DM2) |
|---|---|---|---|---|
| 1 | 2025-01_Strom_WN.pdf | 01.01.–31.01.2025 | 210.000 kWh | |
| 2 | 2025-02_Strom_WN.pdf | 01.02.–28.02.2025 | 195.000 kWh | |
| 3 | 2025-03_Strom_WN.pdf | 01.03.–31.03.2025 | 205.000 kWh | Invoice no. 4711-03 |
| 4 | Scan_Rechnung_Maerz.pdf | 01.03.–31.03.2025 | 205.000 kWh | **Duplicate**: same invoice no. 4711-03, scanned from purchasing's e-mail |
| 5 | 2025-04_Strom_WN.pdf | April | 190.000 kWh | |
| 6 | 2025-05_Strom_WN.pdf | May | 185.000 kWh | |
| 7 | 2025-06_Strom_WN.pdf | June | 180.000 kWh | |
| 8 | 2025-07_Strom_WN.pdf | July | 175.000 kWh | |
| 9 | 2025-08_Strom_WN.pdf | August | 120.000 kWh | Plant holiday (real, not an error) |
| 10 | 2025-09_Strom_WN.pdf | September | 190.000 kWh | |
| 11 | 2025-11-12_Strom_WN.pdf | 01.11.–31.12.2025 | 410.000 kWh | **Two months** on one bill (supplier changed billing cycle) |
| 12 | Jahresrechnung_PBM_2025.pdf | 01.01.–31.12.2025 | 800.000 kWh | **Outside boundary**: addressed to Pulverbeschichtung Mitte GmbH (JV) |
| — | *(missing)* | 01.10.–31.10.2025 | — | **October invoice missing** |

**`Energie_2025/Werk_Nord/Zaehlerstaende_2025.xlsx`** (facility manager): meter reading 30.09.2025 = 4.812.300 kWh; 31.10.2025 = 5.012.300 kWh → October = **200.000 kWh**.

**`Energie_2025/Werk_Sued/`**
- `Jahresuebersicht_2025_Oekostrom.pdf`: "Tarif Ökostrom Plus, Verbrauch 2025: **1.240 MWh**" (**in MWh**, German thousands separator).
- `HKN_Bestaetigung_2025.pdf`: "Herkunftsnachweise über **1.240 MWh**, Erzeugungsjahr 2025, Wasserkraft, entwertet im Herkunftsnachweisregister für Liefermenge an Werk Süd" (**green-tariff certificate**, covering Werk Süd only).
- `Gas_Jahresrechnung_WS_2025.pdf`: 240.000 kWh (Brennwert).

**`Energie_2025/Lager_Ost/`**: 4 quarterly sub-meter statements from the landlord: Q1 30.000, Q2 25.000, Q3 25.000, Q4 30.000 kWh (grey tariff).

**`Energie_2025/Werk_Nord/Gas_Jahresrechnung_WN_2025.pdf`**: 1.850.000 kWh, stated as "Energiemenge (Brennwert Hs)".

**`Energie_2025/Tankkarten_2025.csv`** (semicolon-separated, decimal comma): Diesel per month in litres: Jan 3.300; Feb 3.100; Mar 3.300; Apr 3.200; May 3.200; Jun 3.100; Jul 3.000; Aug 2.600; Sep 3.300; Oct 3.300; Nov 3.300; Dec 3.300 (sum 38.000 l). Plus **AdBlue 1.200 l** (not a fuel) and car-wash lines in €.

### 9.4 The prepared ledger (what the AI gets in Ask 2)

`ledger_energie_2025.csv`, with one row per source quantity. Columns: `row_id, site, in_boundary, carrier, period_start, period_end, months, qty_source, unit_source, kwh, source_file, status, instrument, factor_lb, factor_mb, dq, note, prepared_by, reviewed_by`.

| row_id | site | carrier | period | months | source qty | kWh (normalised) | status | DQ | note |
|---|---|---|---|---|---|---|---|---|---|
| E-WN-01 … E-WN-09 | WN | Electricity | Jan…Sep | 9 | as table above | 210,000; 195,000; 205,000; 190,000; 185,000; 180,000; 175,000; 120,000; 190,000 | actual | A | |
| E-WN-03D | WN | Electricity | Mar | — | 205.000 kWh | 0 | **excluded: duplicate of E-WN-03** (invoice 4711-03) | — | |
| E-WN-10 | WN | Electricity | Oct | 1 | meter 5.012.300 − 4.812.300 | 200,000 | actual (meter reading) | B | invoice requested from supplier |
| E-WN-11 | WN | Electricity | Nov–Dec | 2 | 410.000 kWh | 410,000 | actual | A | two-month bill |
| E-JV-01 | JV | Electricity | Jan–Dec | 12 | 800.000 kWh | 0 | **excluded: outside boundary** (op. control) | — | note for Scope 3 Cat. 15 |
| E-WS-01 | WS | Electricity | Jan–Dec | 12 | 1.240 MWh | 1,240,000 | actual | A | instrument: GO 1,240 MWh (HKN_Bestaetigung_2025.pdf) |
| E-LO-Q1…Q4 | LO | Electricity | quarters | 12 | 30.000 / 25.000 / 25.000 / 30.000 kWh | 110,000 | actual | A | grey tariff |
| G-WN-01 | WN | Natural gas | Jan–Dec | 12 | 1.850.000 kWh (Hs) | 1,850,000 (Hs) | actual | A | factor F-GAS-HS |
| G-WS-01 | WS | Natural gas | Jan–Dec | 12 | 240.000 kWh (Hs) | 240,000 (Hs) | actual | A | factor F-GAS-HS |
| D-FL-01 | fleet | Diesel | Jan–Dec | 12 | 38.000 l | 380,000 (at 10.0 kWh/l) | actual | A | AdBlue 1.200 l excluded: not a fuel |

Coverage check (site × month): WN, WS, LO and gas are complete for Jan–Dec after the October fix.

### 9.5 Correct answers (show the arithmetic)

**Electricity in boundary**
- Werk Nord = 210,000 + 195,000 + 205,000 + 190,000 + 185,000 + 180,000 + 175,000 + 120,000 + 190,000 + 200,000 (Oct) + 410,000 (Nov–Dec) = **2,260,000 kWh**
- Werk Süd = 1,240 MWh × 1,000 = **1,240,000 kWh**
- Lager Ost = 30,000 + 25,000 + 25,000 + 30,000 = **110,000 kWh**
- Total = 2,260,000 + 1,240,000 + 110,000 = **3,610,000 kWh = 3,610 MWh**

**Scope 2, location-based**
3,610,000 kWh × 0.40 kg/kWh = 1,444,000 kg = **1,444.0 t CO₂e**

**Scope 2, market-based**
- Werk Süd, covered by guarantees of origin: 1,240,000 × 0.00 = 0 kg
- Grey power (WN + LO) = 2,260,000 + 110,000 = 2,370,000 kWh × 0.60 kg/kWh (residual mix) = 1,422,000 kg
- Total = **1,422.0 t CO₂e**

**Scope 1**
- Gas = (1,850,000 + 240,000) kWh(Hs) × 0.18 = 2,090,000 × 0.18 = 376,200 kg = **376.2 t** (WN 333.0 t; WS 43.2 t)
- Diesel = 38,000 l × 2.50 = 95,000 kg = **95.0 t**
- **Scope 1 = 376.2 + 95.0 = 471.2 t CO₂e**

**Totals**
- Scope 1 + 2 (location-based) = 471.2 + 1,444.0 = **1,915.2 t**
- Scope 1 + 2 (market-based) = 471.2 + 1,422.0 = **1,893.2 t**

**Secondary figures (VSME-style)**
- Renewable share of electricity = 1,240,000 / 3,610,000 = **34.35%**
- Energy total (gas on Hs basis) = 3,610 + 2,090 + 380 = **6,080 MWh**. The renewable share of total energy is 1,240 / 6,080 = **20.39%**.
  - On an Hi basis, gas = 2,090 / 1.11 = 1,882.9 MWh. **State the basis.**
- GHG intensity (illustrative turnover €42m) = 1,915.2 / 42 = **45.6 t per €m** (location-based) or 1,893.2 / 42 = **45.1 t per €m** (market-based).

### 9.6 Effect of each trap (for reveals and a waterfall chart)

| Trap | Change in kWh or input | Effect, location-based | Effect, market-based |
|---|---|---|---|
| Duplicate March counted | +205,000 kWh | +82.0 t | +123.0 t |
| October silently dropped | −200,000 kWh | −80.0 t | −120.0 t |
| JV bill included | +800,000 kWh | +320.0 t | +480.0 t |
| "1.240 MWh" read as 1,240 kWh | −1,238,760 kWh | −495.5 t | 0 (Werk Süd is 0 in market-based anyway) |
| Grid average used for grey power in market-based | — | — | 948.0 t instead of 1,422.0 t (−474.0 t) |
| Certificate applied to whole company | — | — | 0 instead of 1,422.0 t |
| 2023 factor (0.45) used for 2025 | — | 1,624.5 t (+180.5 t) | — |
| Net-value (Hi) gas factor on gross-value (Hs) kWh | — | Scope 1 gas 418.0 t (+41.8 t) | same |
| AdBlue counted as diesel | +1,200 l | Scope 1 diesel 98.0 t (+3.0 t) | same |

**A plausible raw-folder answer**, constructed from the traps above; label it "constructed" unless it was captured from a real run:
- Werk Nord folder sum = 2,265,000 kWh: duplicate included, October missing, so only 5,000 kWh off the correct 2,260,000.
- Plus JV 800,000, plus Werk Süd misread as 1,240 kWh, plus Lager 110,000 = 3,176,240 kWh.
- Location-based = 3,176,240 × 0.40 = **1,270.5 t**. That is **12.0% too low**, and would pass most "does this look plausible?" checks.
- "Market-based" with grid average for grey and 0 for Werk Süd = (2,265,000 + 800,000 + 110,000) × 0.40 = **1,270.0 t**.

**Waterfall, location-based (exact):**

| Step | Change | Running total |
|---|---|---|
| Start: raw-folder answer | | 1,270.5 t |
| Remove duplicate March | −82.0 | 1,188.5 |
| Add October from meter readings | +80.0 | 1,268.5 |
| Exclude JV | −320.0 | 948.5 |
| Fix Werk Süd unit | +495.5 | **1,444.0 t** ✓ |

**Waterfall, market-based:**

| Step | Change | Running total |
|---|---|---|
| Start: raw-folder "market-based" answer | | 1,270.0 t |
| Remove duplicate March | −82.0 | 1,188.0 |
| Add October from meter readings | +80.0 | 1,268.0 |
| Exclude JV | −320.0 | 948.0 |
| Replace grid average with residual mix for 2,370,000 kWh (+0.20 × 2,370,000) | +474.0 | **1,422.0 t** ✓ |

Teaching point from the two waterfalls: the unit error disappears from the market-based figure, while the method error dominates it. The two Scope 2 numbers go wrong in different ways, which is one more reason to report both.

---

## 10. (b) Synthetic dataset 2: "Steel and suppliers", Scope 3 hotspot and spend vs activity

### 10.1 Raw inputs

- `Einkauf_Stahl_2024_2025.xlsx` (ERP export): cold-rolled steel strip from one supplier.
  - FY2024: 2,400 t, €1,800,000 (750 €/t).
  - FY2025: 2,400 t, €2,160,000 (900 €/t). **Same tonnage, price +20%.**
- `Lieferantenfragebogen_Bandstahl_2025.pdf`: supplier "Bandstahl Wendelin GmbH" (fictional), a cold-rolling mill that buys hot-rolled coil. Its answers:
  - Company Scope 1+2 emissions 2024: **186.000 t CO₂e**
  - Scope 1+2 intensity: **0,12 t CO₂e/t product**
  - Product carbon footprint, cold-rolled strip, cradle-to-gate, reference year 2024, third-party verified: **1.650 kg CO₂e/t**
  - Share of renewable electricity: 38%
- `Reisen_2025.csv` (travel agency export):
  - MUC–HAM, return, 2 travellers, 600 km one-way
  - STR–BER, return, 1 traveller, 510 km one-way
  - FRA–ORD, return, 1 traveller, 6,960 km one-way
  - MUC–VIE, return, 1 traveller, 355 km one-way, **status "storniert"** (cancelled)
  - Rail Stuttgart–Köln, return, 4 travellers, 370 km one-way
- Also in the AP ledger, for the double-counting discussion: electricity and gas invoices for 2025. These are already in Scope 1/2 and must not be classified again as purchased goods.

### 10.2 Illustrative teaching factors (NOT official)

| ID | Description | Value |
|---|---|---|
| F-ST-SPEND | Iron and steel products, spend-based, **price base 2024** | 2.4 kg CO₂e per EUR |
| F-ST-AVG | Cold-rolled strip, average data, cradle-to-gate | 2.0 t CO₂e/t |
| F-FL-SH | Flight, short-haul, economy, without radiative-forcing uplift | 0.15 kg CO₂e/pkm |
| F-FL-LH | Flight, long-haul, economy, without radiative-forcing uplift | 0.11 kg CO₂e/pkm |
| F-RAIL | Long-distance rail | 0.03 kg CO₂e/pkm |

### 10.3 Correct answers and method comparison (Category 1, steel, FY2025)

| Method | Arithmetic | Result |
|---|---|---|
| Spend-based, nominal 2025 € (wrong: price year mismatch) | 2,160,000 € × 2.4 kg/€ | 5,184 t |
| Spend-based, deflated to 2024 prices | 2,160,000 ÷ 1.20 = 1,800,000 € × 2.4 | 4,320 t |
| Average data | 2,400 t × 2.0 t/t | 4,800 t |
| **Supplier-specific (recommended)** | 2,400 t × 1.650 kg/t = 2,400 × 1.65 t/t | **3,960 t** |
| Wrong supplier number: Scope 1+2 intensity | 2,400 × 0.12 | 288 t (−93%) |
| Wrong supplier number: company total | 186,000 t | absurd: larger than Fernholt's entire footprint many times over |
| Number-format misread: "1.650" as 1.65 kg/t | 2,400 × 1.65 kg | 3,960 kg = 3.96 t (factor 1,000 low) |

- **Year-over-year:** spend-based (nominal) goes 4,320 t (2024) → 5,184 t (2025), +20%. Activity-based goes 4,800 t → 4,800 t, 0%. An AI asked to explain the rise will cite "higher volumes" unless tonnes are in its input.
- **Spread between defensible methods:** 3,960–5,184 t, so the highest is 30.9% above the lowest. Method choice matters as much as many reduction projects. Disclose the method and the data-quality grade (supplier-specific = A/B; average = C; spend-based = C).
- **Supplier value caveat:** the reference year is 2024 while the reporting year is 2025. That is acceptable if disclosed.

**Business travel (Category 6):**
- MUC–HAM: 600 × 2 legs × 2 travellers = 2,400 pkm × 0.15 = 360.0 kg
- STR–BER: 510 × 2 × 1 = 1,020 pkm × 0.15 = 153.0 kg
- FRA–ORD: 6,960 × 2 × 1 = 13,920 pkm × 0.11 = 1,531.2 kg
- Rail STR–CGN: 370 × 2 × 4 = 2,960 pkm × 0.03 = 88.8 kg
- MUC–VIE: cancelled, excluded (it would have added 710 pkm × 0.15 = 106.5 kg)
- **Total 2,133.0 kg ≈ 2.1 t.** Reading return trips as one-way halves it to 1,066.5 kg.

**Prioritisation insight:** steel (3,960 t) is 67.4% of steel + Scope 1 + 2 (location-based) combined. Business travel is 0.054% of the steel figure. Spend workshop and project time accordingly.

---

## 11. (b) Synthetic dataset 3: "Baseline, claims and people", narrative check

### 11.1 Raw inputs

**`THG-Bilanz_2023_original.xlsx`** (the 2023 inventory as first reported, using F-EL-LB-2023 = 0.45):

| Site | Electricity kWh | Gas kWh (Hs) | Diesel l |
|---|---|---|---|
| Werk Nord | 2,400,000 | 1,950,000 | |
| Werk Süd | 1,300,000 | 250,000 | |
| Lager Ost | 120,000 | — | |
| Werk 3 (foundry, sold 1 Jul 2024) | 900,000 | 3,000,000 | |
| Fleet | | | 40,000 |

- `Strukturaenderungen.docx`: "Werk 3 verkauft zum 01.07.2024."
- `HR_Sicherheit_2025.xlsx`: per-site headcount, hours worked, recordable accidents, women (§11.4).
- `Entwurf_Nachhaltigkeitstext.docx`: the AI-drafted paragraph with six claims (§11.3).

### 11.2 Correct baseline arithmetic

**Original 2023:**
- Scope 2 (location-based) = 4,720,000 kWh × 0.45 = **2,124.0 t**
- Gas = 5,200,000 × 0.18 = 936.0 t; diesel = 40,000 × 2.5 = 100.0 t; Scope 1 = **1,036.0 t**
- Total = **3,160.0 t**

**Headline:** 2025 (1,915.2 t) vs 2023 (3,160.0 t) = −1,244.8 t = **−39.39%**.

**Restated baseline:** remove Werk 3 (structural change: divestment):
- Werk 3 in 2023 = 900,000 × 0.45 + 3,000,000 × 0.18 = 405.0 + 540.0 = **945.0 t**
- Restated 2023 = 3,160.0 − 945.0 = **2,215.0 t**
- Change 2025 vs restated = 1,915.2 − 2,215.0 = −299.8 t = **−13.53%**

**Decomposition of the like-for-like −299.8 t:**
- Electricity, own consumption: (3,610,000 − 3,820,000) × 0.45 = **−94.5 t**
- Electricity, grid factor change: 3,610,000 × (0.40 − 0.45) = **−180.5 t**
  - Check: 1,719.0 → 1,444.0 = −275.0 = −94.5 − 180.5 ✓
- Gas, own consumption: (2,090,000 − 2,200,000) × 0.18 = **−19.8 t**
- Diesel, own consumption: (38,000 − 40,000) × 2.5 = **−5.0 t**
- Sum: −94.5 − 180.5 − 19.8 − 5.0 = −299.8 ✓

**The 39.39-point headline, split:**
- Divestment: 945.0 / 3,160.0 = **29.91 points**
- Grid factor: 180.5 / 3,160.0 = **5.71 points**
- Own consumption: 119.3 / 3,160.0 = **3.78 points**
- Sum: 1,244.8 t ✓

Note for facilitators: location-based baselines are normally not restated for grid-factor updates, because the grid really did get cleaner. The factor effect is a real reduction in the reported number. It is not the company's action, and the text must not say it is.

### 11.3 Claims check (the AI draft vs the evidence)

| # | Draft sentence (AI) | Evidence | Verdict | Evidence-based rewrite |
|---|---|---|---|---|
| 1 | "Since 2023 we have cut CO₂ emissions by 39% through targeted efficiency measures." | §11.2 | **Misleading attribution** | "Scope 1 and 2 emissions (location-based) fell from 3,160 t (2023) to 1,915 t (2025). Most of the decrease comes from selling the Werk 3 foundry in 2024 (945 t). Like for like, emissions fell 13.5%: about 5.4 points from lower consumption and about 8.1 points from a lower grid emission factor." |
| 2 | "Our production runs on 100% green electricity." | Certificate covers 1,240 of 3,610 MWh | **False** | "Werk Süd has used electricity backed by guarantees of origin since 2025. That is 34% of our electricity." |
| 3 | "Fernholt has been climate-neutral since 2025." | Based on purchased offsets only | **Remove** (offset-based claims are banned in consumer marketing from 27 Sep 2026; misleading in B2B too) | Report emissions and any credits separately; no neutrality claim |
| 4 | "Emissions from purchased steel rose 20% due to higher volumes." | Tonnage flat; price +20%; spend-based artefact | **False cause** | "Purchased steel was 2,400 t in both years. Using the supplier's verified footprint, it accounts for about 3,960 t CO₂e." |
| 5 | "Our accident rate is 56.8 per million hours worked." | Average of site rates | **Wrong calculation** | "34.7 recordable accidents per million hours worked (10 accidents, 288,000 hours)." |
| 6 | "All suppliers were assessed for environmental risks." | 14 of 62 suppliers answered the questionnaire (illustrative) | **Unsupported** | "14 of 62 suppliers answered our questionnaire in 2025; they cover X% of purchasing volume." |

### 11.4 HR and safety data (averaging trap)

| Site | Headcount | Hours worked | Recordable accidents | Rate per 1M hours | Women | Share of women |
|---|---|---|---|---|---|---|
| Werk Nord | 110 | 176,000 | 6 | 34.09 | 22 | 20.0% |
| Werk Süd | 55 | 88,000 | 1 | 11.36 | 22 | 40.0% |
| Lager Ost | 15 | 24,000 | 3 | 125.00 | 3 | 20.0% |
| **Total** | **180** | **288,000** | **10** | **34.72** (= 10 / 288,000 × 1,000,000) | **47** | **26.1%** (= 47 / 180) |
| Wrong: average of site values | | | | 56.82 (= (34.09 + 11.36 + 125.00) / 3) | | 26.7% |

- The small warehouse with a high rate dominates the unweighted average (+64%). Always recompute rates from summed numerators and denominators.
- The multiplier (1,000,000 hours here) differs between frameworks, so check which one your framework uses [BK].
- Extension traps for HR data: headcount vs FTE, agency workers (Leiharbeitnehmer), year-end vs average headcount.

### 11.5 What a good assistant should answer on the raw folder (the "ask back" model answer)

For DM6 and as the target behaviour after the workshop:

> "I can give a provisional figure, but four points need your decision first:
> 1. **October is missing** for Werk Nord. The meter-reading file shows 200,000 kWh for 30.09.–31.10. Should I use it?
> 2. **Two March invoices share the number 4711-03.** I have counted March once.
> 3. **One bill is addressed to Pulverbeschichtung Mitte GmbH.** Is this company inside your reporting boundary? I have left it out for now.
> 4. **Werk Süd reports '1.240 MWh'.** I read this as 1,240 MWh = 1,240,000 kWh.
>
> With these assumptions and your factor table (version: teaching set 2025): Scope 1 = 471.2 t; Scope 2 location-based = 1,444.0 t; Scope 2 market-based = 1,422.0 t. Each figure is traceable to rows in the attached list."

---

## 12. Running the controlled comparison honestly

- **Hold everything constant except the input.** Same model, same prompt text, same factor table (as a file in both runs), same date.
  - Condition A: raw folder (the files in §9.3).
  - Condition B: prepared ledger (§9.4) plus the one-paragraph boundary note.
  - Optional condition C: raw folder *without* the factor table, to show invented or wrong-year factors.
- **Repeat each condition several times** (e.g. 5 runs) and show the spread. Models vary between runs, and a single lucky or unlucky run proves little.
- **Score on fixed items:**
  - the five numbers: Scope 1, Scope 2 location-based, Scope 2 market-based, energy MWh, renewable share;
  - the four flags: October missing, duplicate, JV, MWh.
- **Record model name and version, date, settings and full prompt,** and show them on the demo page, as W03 does for its replayed runs.
- **Label clearly.** If live runs are not captured, the raw-folder answer in §9.6 must be labelled "constructed from documented failure modes". Current models with code execution may catch some traps. The workshop's claim should be "the folder decides what even a good model can know", not "AI gets this wrong".
- **Suggested demo interaction** (replacing a weak "chat replay"):
  1. Folder view.
  2. The AI's raw answer.
  3. Traps as toggles. Each toggle moves one bar in the waterfall (§9.6), and participants see which trap moves the total by how much.
  4. The same question on the ledger.
  5. Click any number to see its ledger rows, then the source document excerpt.

---

## 13. Sources

Web-search-confirmed pages; see §0 for how each was read.

**Vendors and tools**
- Watershed, "Sustainability AI in 2026: what works, what doesn't": https://watershed.com/blog/sustainability-ai-in-2026-what-works-what-doesnt-and-why-the-difference-matters
- Watershed AI agents launch (2026-04-21): https://www.globenewswire.com/news-release/2026/04/21/3277603/0/en/watershed-launches-new-ai-agents-and-sustainability-ai-fellowship.html ; https://sustainabilitymag.com/news/watershed-launches-ai-agents-to-automate-sustainability-data
- Watershed ATLAS: https://www.climatechange.ai/papers/neurips2024/70 ; https://watershed.com/blog/how-we-built-atlas-a-benchmark-for-spend-classification-in-scope-3-carbon-accounting ; paper PDF https://s3.us-east-1.amazonaws.com/climate-change-ai/papers/neurips2024/70/paper.pdf
- Persefoni Analytics Agent (2026-05-05): https://www.businesswire.com/news/home/20260505500619/en/Persefoni-Unveils-New-Agentic-AI-Agent-to-Accelerate-Emissions-Analysis-and-Fast-Track-the-Path-to-Net-Zero ; https://www.persefoni.com/persefoniai ; https://www.persefoni.com/blog/ai-in-carbon-accounting
- Sweep: https://www.sweep.net/newsroom/sweep-launches-cutting-edge-generative-ai-solutions-for-regulatory-reporting ; https://www.esgtoday.com/sweep-launches-uk-srs-sustainability-reporting-solution/
- Workiva: https://www.esgtoday.com/workiva-launches-agentic-ai-sustainability-reporting-solution/ ; https://www.workiva.com/blog/intelligent-sustainability-how-workiva-ai-transforming-sustainability
- Microsoft deprecations: https://learn.microsoft.com/en-us/industry/sustainability/whats-new-deprecations
- SAP: https://www.sap.com/products/scm/sustainability-footprint-management.html ; https://www.sap.com/products/financial-management/green-ledger.html ; https://bearingpoint.services/emissions-calculator/en/news/latest-updates-to-sap-sustainability-footprint-management-data-exchange-2025/ ; https://technologymagazine.com/news/how-saps-green-ledger-turns-carbon-emissions-into-data
- Climatiq Autopilot: https://www.climatiq.io/blog/introducing-climatiq-autopilot ; https://www.climatiq.io/docs/api-reference/autopilot ; ecoinvent via Climatiq: https://www.climatiq.io/docs/guides/emission-factor-database/data-sources/ecoinvent
- Normative (Omnibus explainer): https://normative.io/insight/the-omnibus-simplification-package-explained/
- IBM on LLMs for Scope 3: https://www.ibm.com/think/insights/accelerating-scope-3-emissions-accounting-llms-to-the-rescue
- Rabobank, overlap in IO-based Scope 3: https://www.rabobank.com/knowledge/d011439980-double-checking-double-counting-quantifying-the-overlap-in-input-output-table-based-scope-3-emissions

**Research**
- ChatReport: https://arxiv.org/abs/2307.15770 ; https://aclanthology.org/2023.emnlp-demo.3/
- ClimateBERT: https://arxiv.org/abs/2110.12010 ; Cheap talk and cherry-picking: https://www.sciencedirect.com/science/article/pii/S1544612322000897
- CLIMATE-FEVER: https://arxiv.org/abs/2012.00614 ; https://github.com/tdiggelm/climate-fever-dataset
- ESGReveal: https://arxiv.org/abs/2312.17264 ; https://www.sciencedirect.com/science/article/abs/pii/S0959652624040216
- ESG Insight: https://link.springer.com/article/10.1007/s13042-026-03146-w
- MMESGBench: https://arxiv.org/html/2507.18932v2
- ESG-Bench: https://arxiv.org/abs/2603.13154 ; https://ojs.aaai.org/index.php/AAAI/article/view/41281
- Scope3Trace: https://arxiv.org/abs/2607.17122
- EulerESG: https://arxiv.org/pdf/2511.21712 ; ESGLens: https://arxiv.org/html/2604.19779v1 ; EU Taxonomy KPI extraction: https://arxiv.org/pdf/2512.24289 ; ESGBench: https://arxiv.org/pdf/2511.16438
- Emission-factor matching with LLM + retrieval: https://www.mdpi.com/2071-1050/18/11/5444
- AutoPCF: https://arxiv.org/pdf/2308.04241
- Numeric hallucination in financial QA: https://arxiv.org/html/2607.11414 ; https://arxiv.org/html/2603.04663 ; https://papers.ssrn.com/sol3/Delivery.cfm/6856159.pdf?abstractid=6856159&mirid=1

**Factors and methods**
- UBA grid factor 2024: https://www.umweltbundesamt.de/themen/co2-emissionen-pro-kilowattstunde-strom-2024 ; 2025: https://www.umweltbundesamt.de/themen/co2-emissionen-pro-kilowattstunde-strom-2025-nur ; Climate Change 13/2025: https://www.umweltbundesamt.de/sites/default/files/medien/11850/publikationen/13_2025_cc.pdf
- AIB residual mix 2024: https://www.aib-net.org/facts/european-residual-mix/2024 ; 2025 results: https://www.aib-net.org/sites/default/files/assets/eecs/Residual%20Mix/AIB_2025_Residual_Mix_Final%20Results_%2026052026.pdf
- IEA Emissions Factors 2025 (licensed): https://www.iea.org/data-and-statistics/data-product/emissions-factors-2025
- DESNZ 2025 methodology: https://assets.publishing.service.gov.uk/media/6846b0870392ed9b784c0187/2025-GHG-CF-methodology-paper.pdf ; 2026 methodology: https://assets.publishing.service.gov.uk/media/6a2940543b15d05a7ce3202e/2026-GHG-conversion-factors-methodology-report.pdf ; https://circularecology.com/news/desnz-defra-2025-ghg-emissions-factors-released
- ecoinvent licences: https://ecoinvent.org/licenses/ ; https://support.ecoinvent.org/eula ; https://resources.cozero.io/wiki/ecoinvent-data-access-and-key-concepts
- Gas Hs/Hi and m³ → kWh: https://gasberechnen.de/gas-umrechner-m3-kwh/ ; https://www.entega.de/ratgeber/gas/gasverbrauch/heizwert-gas/
- GHG Protocol Scope 2 consultation: https://ghgprotocol.org/blog/release-ghg-protocol-opens-public-consultations-scope-2-and-electricity-sector-consequential ; https://ghgprotocol.org/sites/default/files/2025-10/GHG-Protocol-Scope2-Public-Consultation.pdf ; Scope 2 Guidance (2015): https://ghgprotocol.org/sites/default/files/2023-03/Scope%202%20Guidance.pdf

**Regulation and assurance** (details in esg-regulation.md)
- Omnibus I, Directive (EU) 2026/470: https://www.garrigues.com/en_GB/new/publication-directive-eu-2026470-simplifying-corporate-sustainability-reporting-csrd-and-due ; https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/
- Revised ESRS adopted 3 Jul 2026: https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-reduce-administrative-burdens-eu-2026-07-03_en ; https://viewpoint.pwc.com/gx/en/pwc/in-briefs/2026/ib_int202617.html
- Double materiality in revised ESRS: https://generationimpact.global/blog/simplified-esrs-2026/ ; https://ecoprism.com/resources/insights/esrs-simplification-2026
- VSME recommendation (30 Jul 2025): https://ec.europa.eu/finance/docs/law/250730-recommendation-vsme_en.pdf
- ISSA 5000: https://www.iaasb.org/focus-areas/understanding-international-standard-sustainability-assurance-5000 ; https://www.iaasb.org/publications/issa-5000-frequently-asked-questions-applicability-matters
- EmpCo (applies 27 Sep 2026): https://www.lw.com/en/insights/eu-empowering-consumers-directive-new-rules-on-green-claims-apply-from-27-september-2026 ; Commission FAQ: https://commission.europa.eu/document/download/3c257883-bb2a-4dd9-a6dc-501d587bb34f_en?filename=faq-empowerting-consumers-gtd.pdf
- Germany (UWG amendment, secondary): https://www.ebnerstolz.de/de/unser-angebot/leistungen/rechtsberatung/wirtschaftsrecht-commercial/umsetzung-empco-richtlinie-99600.html ; https://kpmg-law.de/die-empco-tritt-in-kraft-antworten-auf-die-wichtigsten-praxisfragen/ ; https://www.fieldfisher.com/de-de/locations/germany/insights/last-minute-rettung-fur-altbestande-nach-der-empco-richtlinie
