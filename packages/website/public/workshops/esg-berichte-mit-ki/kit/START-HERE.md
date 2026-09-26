# ESG kit · Workshop 04 · ESG Reporting with AI

1. Only want the take-home sheets? Open `vorlagen/transfer.md` and `vorlagen/merkkarte.md`.
2. Practice: open `rohdaten_2025/` and `belegtabelle/belegtabelle_2025_leer.csv`, fill the ledger, then compare with `erwartet/`.
3. The question: "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?"
4. Everything is invented. The factors in `faktoren/` are illustrative teaching values; never use them in a real report.
5. Do not put company data into any AI tool with this kit.

## What is where

| Folder | Contents |
|---|---|
| `rohdaten_2025/` | The raw folder the AI gets in the first run: 20 bills as text files and 2 CSV exports. German documents with German number format, as in real life. |
| `vorjahr/` | The consultant's 2024 summary (grade B, no bills). |
| `faktoren/` | The pinned factor table. Illustrative teaching values. |
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
| What does "1.240 MWh" mean? | `Jahresuebersicht_2025_Oekostrom.md` in `rohdaten_2025/Werk_Sued/` |
| Whose bill is this? | `Jahresrechnung_TB_2025.md` in `rohdaten_2025/Werk_Nord/Strom/` |
| Six errors, 48.7 tonnes apart | `erwartet/wasserfall.csv` |
| The ledger | `belegtabelle/belegtabelle_2025_leer.csv`, `erwartet/belegtabelle_2025.csv`, `erwartet/kontrollsumme_strom_2025.csv` |
| Trace three figures | `vorlagen/uebung_drei_zahlen.md`, answers in `erwartet/uebung_drei_zahlen_antworten.md` |
| What made the number go down? | `erwartet/zerlegung_2024_2025.csv` |

## Help

- The zip unpacked into a folder inside a folder: open the inner `esg-kit/`.
- Umlauts look broken in Excel: import the CSV as UTF-8 (Data > From Text/CSV).
