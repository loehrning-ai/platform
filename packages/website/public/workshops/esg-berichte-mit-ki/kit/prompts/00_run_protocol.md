# Run protocol: the same question on two data states

Goal: show what the data state changes, with everything else held constant.

Hold constant, and write down:
- model name and version, tool (app with file upload and analysis, or an agent in a terminal), date
- the prompt text below, copied exactly
- `faktoren/faktoren_lehrwerte.csv` and `vorjahr/thg_2024_zusammenfassung.csv`

Prompt for both conditions:
"What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024? Use the attached files."

Condition A: attach everything in `rohdaten_2025/` plus the two files above.
Condition B: attach `erwartet/belegtabelle_2025.csv`, `erwartet/abdeckung_standort_monat.csv`, `belegtabelle/grenzen_und_regeln.md` plus the two files above.
Optional condition C: condition A without the factor file (shows factors from memory).

Run each condition 5 times in fresh conversations. For each run record in `aufzeichnungen/`:
Scope 1 · Scope 2 location-based · Scope 2 market-based · change vs 2024 · caught: duplicate March, missing October, Talbrück, 1.240 MWh, Hs basis, AdBlue (yes/no each) · market-based method used · August flagged without changing it · asked about other Scope 1 sources.

Report what happened, run by run. Say "caught the duplicate in 3 of 5 runs"; never "AI fails".
Use only the invented kit files. No company data.
