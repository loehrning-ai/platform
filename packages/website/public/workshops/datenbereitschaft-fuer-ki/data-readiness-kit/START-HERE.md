# Start here

This kit goes with Workshop 03, "Data Readiness for AI". It uses FOLDLINE, a made-up subscription
software company. The lesson needs no coding or setup.

Use a synthetic or generic example. Do not enter employer, customer, personal, or sensitive data.

The [guide glossary](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html#glossary)
explains the terms.

## Files, in order

Only step 2 is needed during the lesson.

| Step | File | When | What |
| --- | --- | --- | --- |
| 1 | [Learner guide](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html) | Before or after | The course route and its words. |
| 2 | [`QUESTION-CARD.md`](./QUESTION-CARD.md) | During the lesson | Fill the five boxes for one question. |
| 3 | [Browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html) | Optional, 12 minutes | Repair a wrong answer on made-up data. |
| 4 | [`READY-CANVAS.md`](./READY-CANVAS.md) | Optional | Log your lab runs and the evidence for the ten checks. |
| 5 | [`FOLDLINE-SCENARIOS.md`](./FOLDLINE-SCENARIOS.md) | Optional | The lab's six test cases with expected results. |
| 6 | [`semantic-template/`](./semantic-template/metric.yml) | Technical | Commented example definition files. |
| 7 | [`agent/CLAUDE.example.md`](./agent/CLAUDE.example.md) | Technical | Example instructions for an AI assistant. They guide; they do not enforce. |
| 8 | [`builder/README.md`](./builder/README.md) | To build it for real | Hand-over steps for a technical team, also as a [builder guide](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/builder.html). |

## Words used in this kit

- **Fixture:** the fixed practice data, `FOLDLINE-AGG-001`.
- **Sealed:** fixed on purpose, so every run is comparable.
- **Run hash:** a short code printed after each run. A new code means a new set of choices.
- **Run record:** the copyable or printable summary of one run: your choices and which checks passed.
  Each check line is a receipt. It proves only that run on the practice data.
- **Check:** one of the ten things the lab grades, two per gate (R1, R2 and so on). The lab's
  counters call them controls.

## The optional 12-minute lab

Repair a believable wrong answer without changing the question. The lab runs in your browser with
no AI request, database, sign-in or API key.

Work in threes; alone, take all three roles.

- The **operator** makes the five choices and presses **Test my choices**.
- The **witness** logs each run in the "Lab run log" of `READY-CANVAS.md`: run hash, case counts,
  verdict, first weak check. The run hash is under "Run details for auditors" and in the run record.
- The **skeptic** checks that each changed choice marks the old results as out of date.

### Minutes 0 to 2: read the question

Open [the browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html)
and read the fixed question. The lab grades only this question. Your own wording goes in the notes,
which are never graded, saved, copied or printed. The lab keeps your choices, last run and evidence
levels in this browser until you press **Reset lab**.

### Minutes 2 to 5: set five choices

Which data the AI can see, what number we mean, what is off limits, what happens when data is old,
and how we check it. Every choice starts on its weak option.

### Minutes 5 to 8: press Test my choices

Read the values and the run hash. Your first run tests one ordinary question, so the other five
cases show NOT RUN, not FAIL: missing evidence, which is your first finding. Choice 05 runs all six,
including the refusal, denial and old-data warning.

### Minutes 8 to 10: repair one choice and run again

Change one weak choice and run again until all six cases run and pass. The skeptic confirms that
each change made the old results out of date.

Check A2 stays "Documented", because a correct value does not show that the answer used the written
definition. The lab therefore stops at PILOT ONLY; the best run shows "6 / 6 cases · 9 / 10 controls".

### Minutes 10 to 12: copy or print the run record

Name the first weak check and one next test. The record covers only the FOLDLINE practice run.

## What counts as bounded ready

All ten checks must be proven for one question and one data surface. "Proven" means a repeatable test
passed; a written document alone is "Documented". Run the tests again after every change to the
schema, metric, policy, data, or model.

The weakest check sets the result, not an average. It is not a maturity level. It applies only to the declared question and
surface in your recorded evidence.
