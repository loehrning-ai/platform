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
