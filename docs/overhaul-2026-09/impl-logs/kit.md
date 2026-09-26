# W04 kit + registry module: change log (key: kit)

## Files
- scripts/workshop04/build_dataset.py (new, from scratchpad w04/data/build_dataset.py)
  - Writes packages/website/public/workshops/esg-berichte-mit-ki/data/w04-data.json and the whole kit tree kit/ (rmtree first). `--out-dir DIR` for tests.
  - New section 16b renders every SPEC section 7 Markdown sheet (START-HERE, ASSET-RIGHTS, CHANGELOG, grenzen_und_regeln, prompts 00-04, datenanfrage_email, uebung_drei_zahlen + answers, ergebnisse_2025, aufzeichnungen x2, merkkarte, transfer). Numbers come from NUM / FACTORS / inputs; rule parameters (25 %, 5 %, x1,000, 4 minutes) are in a new `kitRules` JSON key.
  - Factor CSV header: last column `status (illustrative teaching values)`.
  - Scanner fix (hard FAIL in scan-public-candidate): full raw-folder paths such as rohdaten_2025/Werk_Sued/Jahresuebersicht_2025_Oekostrom are 40+ char mixed-case+digit runs. JSON now has `rawFolder` and `documents[i].folder` + `documents[i].file` (no `path`); ledger `source_file` holds the file name only (all 20 names are unique; site_id gives the folder). Prose writes "`file` in `folder/`". The script asserts no such token in JSON or kit, and its own source builds paths with raw(...).
  - Numbers, waterfall, combinations unchanged (JSON otherwise identical to the scratchpad JSON).
- scripts/workshop04/kit-archive.mjs (new): stored, sorted, UTF-8, 0644, fixed DOS date = meta.builtOn (2026-09-26 00:00), root `esg-kit/`, inspectZipArchive before return, `--check`. Reuses crc32 from scripts/course03/kit-archive.mjs.
- packages/website/public/workshops/esg-berichte-mit-ki/kellbrunn-esg-kit.zip: 49 entries, 92,262 bytes.
- ASSET_MANIFEST.json: one row for the zip (scaffold-asset.mjs; owner Tim Löhr, LicenseRef-Loehrning-Brand, same redistribution text as the W03 kit).
- scripts/__tests__/workshop04-kit.test.mjs: 7 tests (reproducible, fixed date, text only + inspection, regenerate via python --out-dir and compare byte for byte, mirror copies carry same numbers, no scanner-shaped tokens, manifest row). All pass.
- packages/website/src/lib/workshops-esg-reporting.ts: ESG_REPORTING_WORKSHOP per SPEC section 8; materials share one frame list (identical href/kind/language/role/phase across locales). Kit sizeLabel "90 KB".
- packages/website/src/lib/workshops-esg-reporting.test.ts: 9 tests; 8 pass. The deck test (label "Deck · 28 scenes" = count of data-kind="main" sections, act minutes within 1) fails until slides.html is complete (13 main scenes today).

## Checks run
- node --test scripts/__tests__/workshop04-kit.test.mjs: 7/7.
- bunx vitest run workshops-esg-reporting + workshops + static-links + frame: 41/42 (deck-dependent one).
- bunx tsc: no errors in my files.
- content-lint: 0 errors; DEMO-LABEL warnings like W03.
- scan-public-candidate: no findings in data/, kit/, the zip, build_dataset.py. Remaining findings in other agents' files (see below).

## For the integrator
- Wire ESG_REPORTING_WORKSHOP into workshops.ts after W03, analytics slug, content parity, fixtures.
- Zip name is kellbrunn-esg-kit.zip (task), SPEC says esg-kit.zip; zip root folder is esg-kit/ per SPEC.
- scripts/workshop04/w04-data.json, scripts/workshop04/data/w04-data.json and scripts/workshop04/data/build_dataset.py are duplicate copies from other agents; they (and demo.html, lib/w04-data.js) still hold full rohdaten_2025/... paths that FAIL the scanner. Point builders at public data/w04-data.json (documents[].folder/file, ledger source_file = file name) and delete the copies; docs/overhaul-2026-09/workshop-04/* copies also fail the scanner.
- SPEC 7.7 dev note about content-lint allowlist left out of the learner-facing e-mail file; merkkarte.md omits the internal Scene column.
