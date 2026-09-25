# Builder kit: build the approved lane for your own question

## In plain words

The workshop asked one question twice: *"Show ending MRR by month for the last complete
quarter."* Seven export tables gave a believable wrong answer: **−€19,960 / €9,775 / €42,565**.
Five approved views, with a written definition, a read-only login and tests, gave the right one:
**€334,675 / €344,450 / €387,015**.

The written part in the middle has a name: a **semantic layer**. It is the written layer between
your tables and the AI. It says what each number means, which view answers it, and what must be
refused.

This kit shows you how to build all of it for one question: the views, the semantic layer, the
login, the Claude setup and the tests. Everything uses FOLDLINE, the synthetic company from the
workshop, so every number here matches the deck.

You do not need SQL for the first two doors.

---

## Pick your door

| Time | Who it is for | You need | Open | You finish with |
| --- | --- | --- | --- | --- |
| **5 minutes** | Anyone | A browser | [builder.html](https://loehrning.ai/workshops/datenbereitschaft-fuer-ki/builder.html) (on the workshop site) modules 1–3, then "Try yours" in module 11 (or `../QUESTION-CARD.md`), plus `CHEATSHEET.md` | The four blanks filled for one question |
| **30 minutes** | Claude users, no SQL | A Claude account with Projects | `claude-demo/README.md`, then `claude/README.md`, Setup A | The same question answered two ways, logged in `claude-demo/AI-RUN-LOG.md` |
| **An afternoon** | Data builders | PostgreSQL 14+ and `psql` | `warehouse/README.md` | `DB CHECKS n of n PASS` on your own machine |
| **First real setup** | A small team | Your own warehouse, an owner, a tester | `BUILD-ORDER.md` | A tested, Claude-ready lane for one question, gated by `READY-CANVAS.md` |

---

## What is in each folder

| Folder or file | What it holds |
| --- | --- |
| `CHEATSHEET.md` | One printable page: every rule a beginner needs at the desk |
| `BUILD-ORDER.md` | The build order, step 0 to 11, with who, output and "done when" |
| `ANTI-PATTERN-GALLERY.md` | The most important anti-patterns as worked cards (symptom, cause, fix, FOLDLINE moment, test). Start here |
| `ANTI-PATTERNS.md` | The full table: every known failure, each with the FOLDLINE example and the test that catches it |
| `semantic/` | What a semantic layer is (`SEMANTIC-LAYER.md`), level vs change vs rate (`METRICS.md`), the four annotated YAML files, a vague definition taken apart (`VAGUE-DEFINITION.md`), and every field explained (`FIELD-REFERENCE.md`) |
| `naming/` | Naming rules taught through FOLDLINE's real bad names, a review worksheet and a SQL lint |
| `warehouse/` | Layers (source, core, analytics), serving-view rules, least-privilege access, freshness and lineage, tests, and runnable SQL |
| `claude/` | `README.md` with Setups A (Project), B (Claude Code: `CLAUDE.example.md`, Agent Skill, hook) and C (database connector, `CONNECTOR.md`); the Project upload set in `project/`; the Skill, the SQL guard hook and the examples `mcp.example.json` and `settings.example.json` (copy them to `CLAUDE.md`, `.mcp.json` and `.claude/settings.json` in your project). Which file guides and which enforces |
| `claude-demo/` | The live demo files, the check sheet (`CHECK-YOUR-RESULT.md`), the AI run log and presenter notes |
| `domains/` | The same ideas in four other domains: bike-shop inventory, headcount, web-shop conversion, support backlog |

---

## Start with a good first question

| | Question | Why |
| --- | --- | --- |
| Good | "Show ending MRR by month for the last complete quarter." | It has a period (last complete quarter), a shape (ending = a level, by month) and a grain (one row per month) |
| Bad | "Make our data AI-ready." | It has no question, so it has no test. You cannot tell when you are done |
| Bad | "How much revenue?" | No period, no level-or-change, no unit. Even FOLDLINE's approved lane must ask back (C01) |

Pick one question that someone asks every month or quarter and that has an owner. Build that one
end to end before you add a second.

---

## Evidence rules

These rules come from the workshop. Use them word for word when you report results.

- One run is an observation, not a benchmark.
- Say "same AI route", never "same model".
- The database checks test the setup and course rules, not the AI.
- Loaded is not the same as used: the runs cited the definition 0 of 3.
- Two locks: refuse early, enforce anyway.
- FOLDLINE's verdict stays "limited pilot, not signed off".

---

## New lesson from the dry runs

A better AI route moves the failure. It does not remove it.

In dry runs before the next live session, a fresh Claude chat given only the export CSVs did
**not** repeat −19,960. It noticed April was negative and read `amount` as a monthly change.
Then it added the changes from January and labelled the result "Ending MRR":
**75,890 / 85,665 / 128,230**, with a caveat that the opening balance was missing. The true
values are €258,785 higher. That was one run per prompt: an observation, not a benchmark.

The fix is the same as before: serve the level (`ending_mrr_eur`) in an approved view and write
down what it means.

---

## Safety

- Synthetic data only. Do not put employer, customer or personal data into any file, chat or
  demo.
- No credentials in any file. Connection strings come from environment variables
  (for example `FOLDLINE_READY_DSN`), never from `CLAUDE.md`, a Skill, a Project file or a
  committed config.
- Nothing in this kit certifies production readiness. It shows how to produce evidence for one
  question and one surface.

Finish the way the workshop does:

> "For this question, using this approved data and this definition, we tested these boundaries;
> the next unknown is this one."
