# Forecast check: kit for Workshop 1

You check a weekly forecast against its own past errors before anyone plans with it.
One column, actual minus forecast, answers four questions:

1. Baseline: are the errors smaller than those of "same as last week"?
2. Range: did the actual land inside the 80 % range as often as it promises?
3. Planning number: what quantity follows from the cost of one missing and one leftover unit?
4. Rule: in which week does the forecast run alone, and in which does a person decide?

The company is invented: Suppenwerk Feldmark cooks lentil soup (500 ml, fresh) every
Monday for organic shops. The numbers are invented. The flaws in the file are the ones
real exports have: one row twice, one week without a stored forecast, two weeks sold
out.

## Order (40 minutes)

1. Look at data/ (5 minutes).
2. exercise.md, tasks 1 to 4 (30 minutes).
3. Compare with solutions.md (5 minutes).
4. Then: your own series in template/my-data.csv, fill in release-rule.md.

## Three ways, the same numbers

- Browser: loehrning.ai/en/demos/ki-prognosen-einschaetzen. In the step "My data" with
  your own file. Nothing leaves your device.
- Claude: upload loehrning.ai/skills/prognose-pruefen.zip as a skill (steps below;
  the same skill sits unpacked in claude/prognose-pruefen/). Then drop the
  CSV into the chat and write: "Check this forecast. A missing jar costs €1.50, a
  leftover jar €0.40." Without the skill: paste claude/project-instructions.md into a
  project's instructions.
- Without Claude, with Python 3 and no extra packages:
  `python3 pruefen.py data/lentil-soup-weekly.csv --fehlmenge 1.50 --rest 0.40`

All three ways run the same code and arrive at the same numbers as solutions.md. The
skill and the script are written in German; Claude answers in your language.

## The columns

    woche;ist;prognose;hinweis

The file keeps its German column names. The English names week, actual, forecast and
note work too, and so does stock_end.

- woche (week): the Monday of the week, 2025-04-07 or 07.04.2025.
- ist (actual): the quantity sold. Empty in the week you plan.
- prognose (forecast): the number that was in the system at the time. Never recompute it later.
- hinweis (note): free text. If it says "ausverkauft" or "sold out", the week does not
  count. A column bestand_ende (stock_end) with 0 has the same effect.

## What the kit cannot do

- It builds no forecast. It checks one that already exists.
- Without stored past forecasts there is no check 1. Start storing them today.
- A new product has no error list. There, a person decides.
- The planning number holds for goods that lose their value after the week.

## How the skill gets into your Claude

{{CLAUDE_UI}}