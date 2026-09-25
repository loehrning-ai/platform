# Claude setup: three ways to give Claude the approved lane

## In plain words

The semantic layer (`semantic/`) says what each FOLDLINE number means. Claude does not read those
YAML files by magic. You give Claude a **compiled copy** in the place Claude actually reads, and a
data surface that holds only approved data.

There are three setups. Pick the one that fits your tools.

| Setup | Claude feature | You need | Claude reads the data from | Time |
| --- | --- | --- | --- | --- |
| **A** | A Claude Project (instructions + knowledge files) | A Claude account with Projects. No code | CSV copies of the five approved views | 10 minutes |
| **B** | Claude Code: `CLAUDE.md` + an Agent Skill + an optional hook | Claude Code in a repository | The same CSV copies, or Setup C | 20 minutes |
| **C** | Claude Code + a database connector (MCP server) | The warehouse from `warehouse/`, a reviewed PostgreSQL MCP server | The five views, live, as `foldline_ready_reader` | An hour |

Every setup has the same rule: **instructions guide, grants enforce.** Instructions help Claude
refuse early and politely. Only what Claude cannot reach is locked: in a Project, the files you did
not upload; with a connector, the database grants.

---

## Which file guides and which enforces

| File in this folder | Copy it to | Kind | What it does |
| --- | --- | --- | --- |
| `project/PROJECT-INSTRUCTIONS.txt` | The Project's instructions (Setup A) | Guides | Read the data status first, trace every answer, ask back, refuse |
| `project/metric-definitions.md` | The Project's knowledge (Setup A) | Guides | The compiled `metric.yml`: five approved metrics, name and version |
| `project/*.csv` (five files) | The Project's knowledge (Setup A) | Data surface | Approved views only. In a Project, what you upload is all Claude can see |
| `CLAUDE.example.md` | Your repository root, renamed to `CLAUDE.md` (Setups B, C) | Guides | Project memory for Claude Code: the five views, the meaning rules, the trace, no DSN in files |
| `skills/foldline-analytics/SKILL.md` | `.claude/skills/foldline-analytics/SKILL.md` (Setups B, C) | Guides | An Agent Skill. Claude loads it when its `description` matches the question |
| `skills/foldline-analytics/references/metrics.md` | `.claude/skills/foldline-analytics/references/metrics.md` | Guides | The compiled metric table the Skill points to |
| `hooks/sql_guard.py` | `hooks/sql_guard.py` (Setups B, C) | Guardrail (application) | Checks SQL before a connector tool runs it. Exit code 2 blocks the call |
| `settings.example.json` | `.claude/settings.json` | Guardrail | Registers the hook for the connector's tools; denies `psql` through the shell |
| `mcp.example.json` | `.mcp.json` at the repository root (Setup C) | Configuration | Starts the connector. Names the secret `${FOLDLINE_READY_DSN}`; never contains it |
| `CONNECTOR.md` | (read it) | Instructions for you | Setup C step by step, and how to prove the lock |
| `../warehouse/sql/60_access.sql` | Your database | **Enforces** | Grants SELECT on five views to `foldline_ready_reader`. Everything else fails with 42501 |

Two locks: refuse early, enforce anyway.

---

## Setup A: a Claude Project (no code)

1. Create a Project in Claude.
2. Paste the text of `project/PROJECT-INSTRUCTIONS.txt` into the Project instructions.
3. Add six files to the Project knowledge: `project/metric-definitions.md` and the five CSV files
   (`mrr_summary_monthly.csv`, `logo_churn_by_segment_quarter.csv`,
   `expansion_mrr_by_country_monthly.csv`, `account_mrr_monthly.csv`, `data_status_by_view.csv`).
4. Do **not** add the export CSVs, `CHECK-YOUR-RESULT.md`, the YAML files or anything else "for context".
5. Open a new chat inside the Project and ask the question, word for word:
   `Today is 1 July 2026. Show ending MRR by month for the last complete quarter.`
6. Check the answer against `../claude-demo/CHECK-YOUR-RESULT.md` on your own screen. Log it in
   `../claude-demo/AI-RUN-LOG.md`.

No Projects? Attach the six files to a new chat and paste the instructions as your first message.
It works the same way, but you must repeat it for every chat.

**Done when** the Trace names `ending_mrr` **and** `1.0.0`, the file and column, the load time and
the age at the stated clock.

A Project has no database connection. The CSV files are copies, frozen when they were exported. So
"freshness" means the age of the export, and the "lock" is only what you did not upload.

## Setup B: Claude Code with CLAUDE.md, a Skill and a hook

Copy into your repository:

```text
your-repo/
  CLAUDE.md                                   <- claude/CLAUDE.example.md
  .claude/
    settings.json                             <- claude/settings.example.json
    skills/foldline-analytics/
      SKILL.md                                <- claude/skills/foldline-analytics/SKILL.md
      references/metrics.md                   <- claude/skills/foldline-analytics/references/metrics.md
  hooks/
    sql_guard.py                              <- claude/hooks/sql_guard.py
```

- **CLAUDE.md** is project memory: Claude Code reads it at the start of every session in this
  repository. Keep it short and about routing: which views, which rules, the trace. No DSN.
- **The Skill** is a folder with a `SKILL.md` file. Its frontmatter has a `name` and a
  `description`. Claude reads the descriptions of all Skills and loads the full Skill only when the
  description matches the task. So the description must name the trigger words: ending MRR, net
  new MRR, logo churn, expansion MRR, top accounts.
- **The hook** runs before a matching tool call. It only matters once Claude can run SQL, so it
  pairs with Setup C. Without a connector, point Claude at the CSV files and keep the hook for later.

Test the hook without Claude: `python3 hooks/sql_guard.py --self-test`.

## Setup C: a database connector with a read-only login

Follow `CONNECTOR.md`. In short: build the warehouse, set `FOLDLINE_READY_DSN` in your environment,
copy `mcp.example.json` to `.mcp.json` with your reviewed PostgreSQL MCP server, keep the Setup B
files, and prove the lock with `psql` as `foldline_ready_reader` (42501 on `core.accounts`).

---

## What works and what does not

| What works | What does not | Why the second one fails |
| --- | --- | --- |
| Upload the five approved CSVs and the definitions | Add `monthly_revenue.csv` "for context" (AP-C04) | Claude may pick it. The look-alike returns, and the Chat A failure is back |
| Require a Trace with metric name **and** version | "The definitions are in the Project, so they are used" | Loaded is not the same as used. The recorded runs cited the definition 0 of 3 (AP-C02) |
| `description:` naming ending MRR, net new MRR, logo churn, expansion, top accounts | `description: analytics helper` (AP-C03) | Claude loads a Skill by its description. A vague one never triggers, or triggers everywhere |
| `${FOLDLINE_READY_DSN}` in `.mcp.json` | A connection string in `CLAUDE.md`, a Skill or `.mcp.json` (AP-A05) | Claude reads those files and they are usually committed |
| The connector logs in as `foldline_ready_reader` | The builder's or the owner's login (AP-A04) | Every instruction becomes the only lock |
| Schema-qualified names (`analytics.mrr_summary_monthly`) | Unqualified names that work through `search_path` (AP-C05) | The recorded ready run needed `analytics,public`. Another connection finds nothing, or something else |
| The check sheet stays outside Claude | Upload `CHECK-YOUR-RESULT.md` "so it can check itself" | Claude grades itself against the key it was just given. A test inside the AI's context is not a test |
| "Claude refused; now prove the database denies it too" | "Claude refused, so we are safe" (AP-C01) | A refusal guides. D01 (42501) enforces |

## Keep the copies in step with the source

There is no compiler in this kit. You copy `semantic/metric.yml` into `project/metric-definitions.md`
and `skills/foldline-analytics/references/metrics.md` by hand. When a metric version changes:

1. Change `metric.yml` and the view's `COMMENT` (test Q06 checks the version in the catalog).
2. Change both copies here. The name and version must match everywhere.
3. Re-run the AI cases. Old AI receipts no longer count (see `../claude-demo/AI-RUN-LOG.md`).

## Evidence rules

- One run is an observation, not a benchmark. Run each case three times, in fresh chats.
- Say "same AI route", never "same model". The files, instructions and settings are part of the route.
- The database checks test the setup and the course rules, not Claude.
- FOLDLINE's verdict stays "limited pilot, not signed off".

Claude's features, menus and file formats change. Verify Projects, Skills, hooks and `.mcp.json`
against the current Claude documentation before you rely on them. All data here is synthetic.
