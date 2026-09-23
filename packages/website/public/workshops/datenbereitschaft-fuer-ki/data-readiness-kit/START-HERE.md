# Start here

During the lesson, fill the five boxes at the top of `QUESTION-CARD.md`. No coding or setup is
needed. The browser lab below is a separate, optional 12-minute practice exercise after the lesson.

Your mission: repair a believable wrong answer without changing the question. This lab is a fixed
simulation in your browser: no AI request, real database, sign-in, or API key is involved.

Work in a group of three. The **operator** drives the five architecture decisions and the run
button. The **witness** records the run hash and the first weak control onto `READY-CANVAS.md`.
The **skeptic** checks that changing a decision invalidates the previous receipts.

Use a synthetic or generic example. Do not enter employer, customer, personal, or sensitive data.

## The 12-minute run

### 0:00–2:00 — Inspect the seal

Open [the public browser lab](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html). Confirm the exact question, synthetic surface, fixture ID, and safety
boundary. Do not replace them with employer data. Typed scope edits are never saved; reload
restores the sealed synthetic defaults, and copy or print omits custom text.

### 2:00–5:00 — Configure

Choose which data is visible, what the number means, what is off limits, how to handle old data,
and which tests to run. Every
select opens on its ungoverned option — nothing is pre-configured for you.

### 5:00–8:00 — Execute

Run the cases and read the values, refusal, denial, stale path and run hash. Your first run will
not execute all six: a yardstick that covers one happy-path query cannot report on the other five.
That gap is the first finding, not a defect. Only executable PASS receipts unlock Proven.

### 8:00–10:00 — Repair

Change one failed architecture decision, re-run, and repeat until all six cases execute and pass.
The skeptic verifies that each change invalidated the previous receipts.

### 10:00–12:00 — Export

Copy or print the gate. State the first weak control and next test. The receipt proves only the
sealed synthetic FOLDLINE run.

## What counts as bounded ready

Every control must be proven for one question and surface. Re-run after every schema, metric,
policy, data, or model change.

This weakest-control result is not a maturity level. It applies only to the declared question and
surface represented by the recorded evidence.
