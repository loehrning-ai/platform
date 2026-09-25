# Start here

This kit goes with Workshop 03, "Data Readiness for AI". It uses FOLDLINE, a made-up subscription
software company. No coding or setup is needed for the lesson.

Use a synthetic or generic example. Do not enter employer, customer, personal, or sensitive data.

## How to use this kit

Work through the files in this order. Only step 2 is needed during the lesson.

| Step | File | When | Why |
| --- | --- | --- | --- |
| 1 | [Learner guide](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/guide.html) | Before or after the lesson | The course route and the words you need, in plain language. |
| 2 | [`QUESTION-CARD.md`](./QUESTION-CARD.md) | During the lesson | Fill the five boxes for one question. |
| 3 | [Browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html) | Optional, 12 minutes after the lesson | Practise repairing a wrong answer on made-up data. |
| 4 | [`READY-CANVAS.md`](./READY-CANVAS.md) | Optional follow-up | Log your lab runs. Then record evidence for the ten checks. |
| 5 | [`FOLDLINE-SCENARIOS.md`](./FOLDLINE-SCENARIOS.md) | Optional follow-up | The six test cases the lab runs, with expected results. |
| 6 | [`semantic-template/`](./semantic-template/metric.yml) | Technical follow-up | Commented example definition files. Every line explains itself. |
| 7 | [`agent/CLAUDE.example.md`](./agent/CLAUDE.example.md) | Technical follow-up | Example instructions for an AI assistant. They guide; they do not enforce. |
| 8 | `builder/README.md` | When you want to build it for real | Hand-over steps for a technical team. Online in the kit folder next to the lab. |

## Words used in this kit

- **Fixture:** the fixed practice data the lab uses. Its name is `FOLDLINE-AGG-001`.
- **Sealed:** fixed on purpose. You cannot change the sealed question or data, so every run is comparable.
- **Run hash:** a short code the lab prints after each run. A new code means a new set of choices.
- **Receipt:** the lab's record of one run. It proves only that run on the practice data.
- **Check:** one of the ten things the lab grades, two per gate (for example R1, R2).

## The optional 12-minute lab run

Your mission: repair a believable wrong answer without changing the question. The lab is a fixed
simulation in your browser. It makes no AI request. It uses no real database, sign-in, or API key.

Work in a group of three. Working alone, take all three roles.

- The **operator** makes the five choices and presses **Test My Choices**.
- The **witness** writes each run into the "Lab run log" at the top of `READY-CANVAS.md`: the run
  hash, the case counts, the verdict and the first weak check.
- The **skeptic** checks that each changed choice marks the old results as out of date.

### Minutes 0 to 2: read the fixed question

Open [the browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html).
Read the fixed question and the made-up data boundary. The lab grades only this one FOLDLINE
question. You may type notes about your own question, but they are never graded, saved, copied or
printed. Reloading the page clears them.

### Minutes 2 to 5: set five choices

The five choices are: which data the AI can see, what number we mean, what is off limits, what
happens when data is old, and how we check it. Every choice starts on its weak option. Nothing is
set up for you.

### Minutes 5 to 8: press Test My Choices

Read the values, the refusal, the denial, the old-data warning and the run hash. Your first run will
not run all six cases: a test set with one ordinary question cannot report on the other five. A
check you did not run is missing evidence, even if the first answer looks right. That gap is your
first finding, not a defect.

### Minutes 8 to 10: repair one choice and run again

Change one weak choice. Run again. Repeat until all six cases run and pass. The skeptic confirms that
each change made the old results out of date.

Even then, check A2 stays "Documented". A correct value does not show that the answer used the
written definition. That is the course's main lesson, so the lab stops at PILOT ONLY.

### Minutes 10 to 12: copy or print the receipt

State the first weak check and one next test. The receipt proves only the fixed FOLDLINE practice
run. It says nothing about your own systems.

## What counts as bounded ready

All ten checks must be proven for one question and one data surface. "Proven" means a repeatable
test passed. A written document alone is "Documented", not proven.

Run the tests again after every change to the schema, metric, policy, data, or model.

The result is set by the weakest check, not by an average. It is not a maturity level. It applies
only to the declared question and surface in your recorded evidence.
