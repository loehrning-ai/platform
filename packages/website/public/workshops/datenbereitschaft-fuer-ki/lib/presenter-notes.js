/* Generated from facilitator/speaker-notes.json. Do not edit by hand.
   sayAt maps a say[] index to the press(es) it belongs to (0 = scene entry); the console shows those
   lines under "Say this" at that press. Lines without an entry stay in the full note. */
window.FOLDLINE_PRESENTER_NOTES = Object.freeze({
  "cover": {
    "clock": {
      "start": "00:00",
      "end": "00:45",
      "budget_seconds": 45
    },
    "mode": "Opening · no recorded AI run or database check on screen",
    "purpose": "Fix the exact business question and the controlled experiment.",
    "say": [
      "Presenter cue: start the timer on the first word, read the question aloud once, press on “change the interface”.",
      "A database can return valid SQL and still be unfit for an AI. We hold the question, the data and the AI route the same, change only the interface around the data, and measure what the answer does.",
      "Say “same AI route”, never “same model”: the recording does not establish the model version. No agenda, framework or architecture on the cover.",
      "[Sources]\nOriginal course text; no external claim or asset.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0], "2": [0, 1]},
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Title, edition line, the question card and the footer",
      "The experiment line: three Same stamps, then Change the interface and Measure the answer"
    ],
    "cut": "No expansion; advance at 00:45.",
    "appendixRoutes": []
  },
  "host": {
    "clock": {
      "start": "00:45",
      "end": "01:45",
      "budget_seconds": 60
    },
    "mode": "Opening · biography only, no evidence on screen",
    "purpose": "Establish relevant credibility and the synthetic-data boundary.",
    "say": [
      "Presenter cue: speak the scripted bio (hard 60-second cap); press on “Before that” to show experience and education.",
      "I’m Tim Löhr, a data engineer at Meta. Before that I worked as a data scientist at Red Bull and Apple, after starting in data at Amazon. I build the pipelines behind business reporting: the models, transformations and checks that turn stored records into numbers people can use. That is why this course starts before the prompt. An AI can write valid SQL and still answer the wrong business question when the data surface, metric or access rules are unclear. Today we will make those layers visible, one at a time. Everything you will see uses a synthetic company and synthetic data. It is a teaching system, not an employer system.",
      "The portrait and introduction are restored from the earlier courses. Social labels identify the presenter; they are not slide controls. No company artwork or employment years.",
      "[Sources]\nPresenter-supplied biography; no employer-system claim.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0, 1]},
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Portrait, name, role, short biography, social labels and the synthetic-case line",
      "Experience and education replace the short biography; portrait, name, social labels and the synthetic-case line remain"
    ],
    "cut": "Hard 60-second cap; do not read every experience or education entry aloud.",
    "appendixRoutes": []
  },
  "the-case": {
    "clock": {
      "start": "01:45",
      "end": "03:15",
      "budget_seconds": 90
    },
    "mode": "Opening · course definitions only; synthetic company facts, no AI run or database check",
    "purpose": "Define the company, the question, and the three words inside it, before any of them are used as jargon.",
    "say": [
      "Presenter cue: ask with hands, no slide. Land “never below zero” and tell the room to hold on to it.",
      "FOLDLINE is a made-up company selling software subscriptions to 144 business accounts. Everything is synthetic. SaaS simply means software sold as a service.",
      "MRR means monthly recurring revenue: the monthly value of the subscriptions. Ten customers at €20 per month means €200 MRR. If one leaves, ending MRR becomes €180 and the change is minus €20. The amount remaining and the amount that changed answer different questions. FOLDLINE's ending MRR cannot be negative.",
      "Ending means the value on each month's last day. It is not cash collected or total invoices. We freeze the example clock at 1 July 2026: the last complete quarter is April to June. The teaching date does not move that clock.",
      "Those three definitions are the vocabulary of this session. Every disagreement we find today is about one of them, and one of them is about to be broken in front of you.",
      "[Sources]\nOriginal course text; synthetic FOLDLINE fixture foldline-v1. No external claim or asset.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0], "2": [1], "3": [2, 3], "4": [3]},
    "ask": [
      {
        "at": 0,
        "text": "Who has been handed two different numbers for the same metric in one week?",
        "aloud": true,
        "expected": "Most hands go up. Do not collect stories yet; the your-data scene is where they land."
      }
    ],
    "expectedAudience": [
      "Most hands go up. Do not collect stories yet; the your-data scene is where they land."
    ],
    "revealOrder": [
      "Title, the question card and the FOLDLINE line",
      "MRR is underlined; the tank rises and its level grows: monthly recurring revenue, never below zero here",
      "Ending is underlined; the month strip appears and month-end ticks stamp on Apr, May and Jun",
      "Last complete quarter is underlined; the bracket grows over April–June 2026 and Jul–Sep hatch in as Q3 not finished"
    ],
    "cut": "If behind, keep the three definitions and drop the show of hands.",
    "appendixRoutes": []
  },
  "the-arc": {
    "clock": {
      "start": "03:15",
      "end": "04:45",
      "budget_seconds": 90
    },
    "mode": "Opening · session map only, no evidence on screen",
    "purpose": "Show the whole shape of the session before starting it, and name what participants leave with.",
    "say": [
      "Here is the whole session as one route. We ask one question twice. The data never changes and the AI route never changes. Only what the AI can see changes.",
      "Six stops. Wrong answer: seven export tables, and the answer sounds right. Why it failed: four decisions nobody wrote down. The fix: approved views and a written definition. Ask again: the same question, a second time. Honest limits: when to refuse, warn and test. Your turn: your own question.",
      "You leave with one filled page for a real question of your own. That page is the deliverable, not the slides.",
      "Presenter cue: on the last press point at the top band: “Wherever we are, this line tells you.”",
      "[Sources]\nOriginal course text; no external claim or asset.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [1], "2": [2]},
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Title, lead line, and the route drawing itself with six station names",
      "The question travels from Wrong answer to Your turn; each station caption appears as the question passes it",
      "Lead and captions clear; the outcome card rises under the row, hanging from Your turn; the Route fades into the top band with a pointer to it"
    ],
    "cut": "Hard 90-second cap. Name the six stops and the takeaway; do not preview their content.",
    "appendixRoutes": []
  },
  "bad-architecture": {
    "clock": {
      "start": "04:45",
      "end": "08:30",
      "budget_seconds": 225
    },
    "mode": "Architecture walkthrough: no AI run and no database check on screen",
    "purpose": "Show a working export database that offers several reasonable-looking tables and never says which one means month-end MRR.",
    "say": [
      "A database stores tables, like structured spreadsheets. SQL is the instruction used to ask those tables a question. The data interface is the tables, explanations and permissions the AI gets to work with.",
      "Nothing here is broken. Every table works and every query runs. The AI gets seven plausible tables, and nothing written down says which one means ending MRR.",
      "Before press 3, ask aloud (no slide vote): \"If you had to answer ending MRR, which table would you open?\" Take two answers; do not say why yet.",
      "Keep the per-table traps off this scene (each month's change, retry duplicates, June only). They belong to failure-anatomy's cause card and appendix-architecture, so the bad-ask temptation survives.",
      "Evidence level, for your own vocabulary: SYSTEM WALKTHROUGH. The identifiers stay in appendix-architecture: saas_bad.public, role foldline_bad_reader, Ask :3210 → openai-compatible → bridge :8789 → claude-cli → PostgreSQL :55432.",
      "[Sources]\nSynthetic repository evidence: demo/db/bad and versioned privilege-check definitions. [/Sources]"
    ],
    "sayAt": {"0": [0], "1": [1, 4]},
    "ask": [
      {
        "at": 2,
        "text": "If you had to answer ending MRR, which table would you open?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Two answers aloud (monthly_revenue, billing_events or subscription_export are all fair picks). No verdict yet."
    ],
    "revealOrder": [
      "Title, Export tables badge, Question → AI app → AI model with dashed connectors",
      "The database opens into a stack of seven named export tables; Same company data · 144 accounts below the stack",
      "Login node: sees all 7 tables; the query travels AI model → login → tables; once it arrives, a dashed result returns",
      "Three look-alike tables (monthly_revenue, billing_events, subscription_export) get an outline and a ?; callout: three of them sound like the answer",
      "Callout clears; stamp under the node row points into the stack: every table works, every query runs, none says what its numbers mean"
    ],
    "cut": "Press through to the stamp; keep the spoken table question. Never explain the per-table traps here.",
    "appendixRoutes": [
      "appendix-architecture",
      "appendix-ask-boundary"
    ]
  },
  "bad-ask": {
    "clock": {
      "start": "08:30",
      "end": "14:30",
      "budget_seconds": 360
    },
    "mode": "Recorded AI run: one run on the export tables, no database check",
    "purpose": "Show the recorded answer first and let the room judge it on the signals people usually trust, before any database value.",
    "say": [
      "Let the room read the numbers in silence for five seconds, take hands for each option and say the split out loud (you recall it at 72:30).",
      "One recorded run, forced to answer directly on both databases; not the tool's default. On the default path the tool stopped at its ambiguity check before writing any SQL.",
      "Every tick on the checklist is true of this run: it executed without error, the SQL is valid, the column is named ending_mrr and there are three tidy rows. None of that says the numbers are right.",
      "No verdict, no database value and no pointer at April on this scene. The database check comes on failure-anatomy.",
      "Evidence level, for your own vocabulary: MODEL CAPTURE (bad:G01, uncached, skipClarify=true, reported model label claude-cli via openai-compatible).",
      "Act bridge on the last press: \"April is negative. How?\"",
      "[Sources]\nSynthetic repository evidence: validated G01 bad-lane capture and manifest.\n[/Sources]"
    ],
    "sayAt": {"0": [3], "1": [1], "2": [2], "3": [0]},
    "ask": [
      {
        "at": 3,
        "text": "Put this in the board pack?",
        "options": [
          "Trust",
          "Challenge",
          "Refuse"
        ],
        "expected": "No verdict yet: the next press only asks the room to remember its hand. failure-anatomy and resolution pay it off."
      }
    ],
    "expectedAudience": [
      "Hands for Trust, Challenge and Refuse; the split is said aloud and recalled at resolution. No grade on this scene."
    ],
    "revealOrder": [
      "Title, the exact question card, mini route strip Question → AI → Export tables",
      "The packet lands on monthly_revenue, then the Recorded AI run card rises around it: Apr −€19,960 · May €9,775 · Jun €42,565",
      "Strip clears; the Looks trustworthy checklist rises with ink ticks",
      "The question card and checklist stay in place beside the run card; room vote: Put this in the board pack? Trust · Challenge · Refuse",
      "Vote band clears; full-width holding line: Remember your hand. Next: we check it against the database."
    ],
    "cut": "Never cut the question, the run card label, the picked table or the three values; keep the vote short and press on.",
    "appendixRoutes": [
      "appendix-run-metadata",
      "appendix-ask-boundary"
    ]
  },
  "failure-anatomy": {
    "clock": {
      "start": "14:30",
      "end": "18:30",
      "budget_seconds": 240
    },
    "mode": "Recorded AI run, then database check",
    "purpose": "Trace April's negative value to its cause and to four decisions nobody wrote down, then check the run against the database.",
    "say": [
      "Must say: still the same one forced run from bad-ask, graded now against the database. An observation, not a benchmark.",
      "The model did not invent a table. We offered a plausible table without enough written meaning to reject it.",
      "On press 5: \"Add them up. That's the true net new MRR.\"",
      "The AI added up each month's change instead of reading the month-end balance: the right answer to a different question. Never say the AI meant to compute net new MRR.",
      "Cause source: demo/db/bad/30-bad-surface.sql L98–106 defines monthly_revenue.amount = sum(new + expansion − contraction − churned) per month and segment; the capture's SQL sums monthly_revenue.amount per month.",
      "Verbatim capture SQL for bad:G01 (notes only, never on screen):\nWITH monthly_totals AS (\n    SELECT\n        DATE_TRUNC('month', mr.dt)::date AS revenue_month,\n        SUM(mr.amount) AS mrr\n    FROM monthly_revenue AS mr\n    WHERE mr.dt >= DATE '2026-04-01'\n      AND mr.dt < DATE '2026-07-01'\n    GROUP BY DATE_TRUNC('month', mr.dt)\n)\nSELECT\n    mt.revenue_month,\n    mt.mrr AS ending_mrr\nFROM monthly_totals AS mt\nORDER BY mt.revenue_month",
      "Arithmetic behind press 5: −19,960 + 9,775 + 42,565 = 32,380 (database net new MRR, Q2 2026); 344,450 − 334,675 = 9,775; 387,015 − 344,450 = 42,565.",
      "Evidence levels, for your own vocabulary: steps 0–3 MODEL CAPTURE (bad:G01); step 4 DB PROOF on ready:G01 (live check in the background, replay fallback); step 5 DB PROOF on G02 net new MRR.",
      "[Sources]\nSynthetic repository evidence: G01 bad-lane capture, sealed expected result, and fixed-evidence manifest.\n[/Sources]"
    ],
    "sayAt": {"1": [2], "3": [2, 5], "6": [5]},
    "ask": [
      {
        "at": 1,
        "text": "So what did the AI calculate?",
        "options": [
          "Month-end balances, with a bug",
          "Each month's change"
        ],
        "expected": "Each month's change: the cause card shows the table's formula."
      }
    ],
    "expectedAudience": [
      "Most hands go to \"with a bug\"; the next press shows it was each month's change, so the room sees the cause before any database value."
    ],
    "revealOrder": [
      "Title; the three recorded AI bars grow, April last below zero; callout: ending MRR can't be negative here",
      "Room vote: So what did the AI calculate? Month-end balances, with a bug · Each month's change",
      "Vote and callout clear; cause card: monthly_revenue stores each month's change (new + expansion − contraction − churn)",
      "Four Blanks with a ?: Kind of number? · Rows per what? · Which months? · Which table? Nobody wrote these down.",
      "Database check: €334,675 · €344,450 · €387,015 grow beside each AI bar; Doesn't match",
      "Formula clears; −€19,960 + €9,775 + €42,565 = €32,380 = database net new MRR; stamp: Right answer to a different question."
    ],
    "cut": "Keep the vote, the cause card and the database check; press through the blanks without discussion. No SQL teaching.",
    "appendixRoutes": [
      "appendix-run-metadata",
      "appendix-evaluation"
    ]
  },
  "controlled-comparison": {
    "clock": {
      "start": "18:30",
      "end": "21:00",
      "budget_seconds": 150
    },
    "mode": "How the two recorded runs were set up (course record; no answer on screen)",
    "purpose": "Show that the question, data, AI route and answer settings stayed the same, and only what the AI could see, the context it got and its login changed.",
    "say": [
      "On press 1: “These recorded fields stayed the same, so we can compare the answers.”",
      "We changed a package: tables, definitions, examples and permissions. This helps us inspect failures; it does not isolate which change caused the improvement. One run each and an unrecorded model version cannot prove that.",
      "Say aloud: “In default mode the tool stopped to ask what we meant, so both sides were forced to answer directly.”",
      "Must say: one recorded run per lane, forced to answer directly on both databases. The tool's default path stopped at its ambiguity check before writing any SQL, so this is not the tool's default behaviour.",
      "Must say: the recording names the route and the reported model label (claude-cli via openai-compatible), not an underlying model version. Never say “same model”.",
      "Held the same (README): the question, the source facts and checksum, the provider path and reported model label, the forced direct-answer settings, uncached. Changed: the tables or views the AI could see, the Ask context (metric definitions and verified question pairs), and the database login.",
      "[Sources]\nSynthetic repository evidence: dataset manifest, model-capture manifest, and release ledger. The historical Ask/DataLens setup (two synthetic course PostgreSQL connections) is summarised as text on appendix-ask-boundary; third-party interface screenshots are omitted from this public edition.\n[/Sources]"
    ],
    "sayAt": {"1": [2], "2": [3]},
    "ask": [
      {
        "at": 0,
        "text": "Which of these must stay the same before the comparison means anything?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Held the same: question, company data, AI route and answer settings.",
      "Changed: what the AI could see (7 export tables or 5 approved views), the context it got, and its login.",
      "The recording names the AI route, not the model version: it does not prove the same underlying model."
    ],
    "revealOrder": [
      "two identical-looking lanes: Question, Data, AI route, Settings, Database",
      "the four shared parts merge into one block marked Same (144 accounts, Q2 2026)",
      "the database column splits: 7 export tables vs 5 approved views, marked Changed",
      "small print: one run per lane, forced to answer directly; the recording names the AI route, not the model version"
    ],
    "cut": "Press through quickly if late, but read press 3's small print word for word.",
    "appendixRoutes": [
      "appendix-run-metadata",
      "appendix-ask-boundary"
    ]
  },
  "ready-architecture": {
    "clock": {
      "start": "21:00",
      "end": "27:00",
      "budget_seconds": 360
    },
    "mode": "Walkthrough of the course database setup (no AI run on screen)",
    "purpose": "Show that the ready interface is smaller, not just cleaner: a database permission hides private data and a read-only login reaches only five approved views.",
    "say": [
      "A view is a saved way of selecting or summarising a table. An approved view gives this job the right columns and rows. Read-only means the login cannot change data; it still needs limits on which data it can read.",
      "On press 3: “Smaller, not merely cleaner.”",
      "Say aloud: “Two databases keep this test clean; at work, schemas, roles or views in one database do the same.”",
      "Must say: the two databases are a teaching control, not a prescription. The same boundary works with schemas, roles, views, catalogs or separate serving systems (appendix-architecture).",
      "If asked: the account key in the views is pseudonymous, not anonymous. It is a stable, joinable analytics key (appendix-access-controls).",
      "What the ready login cannot do (README): read source, core or direct identifiers; write or create temporary tables; connect to the export database. PostgreSQL grants, read-only transactions, connection limits and timeouts enforce it. View names, the role name and grants wait for the appendix; column detail waits for Q&A.",
      "[Sources]\nSynthetic repository evidence: demo/db/ready and versioned PostgreSQL privilege-test definitions. [/Sources]"
    ],
    "sayAt": {"0": [0], "2": [1], "5": [4]},
    "ask": [
      {
        "at": 2,
        "text": "Before the next press: what should the AI's login be allowed to see?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Only the five approved views; nothing private (raw accounts, billing, identifiers)."
    ],
    "revealOrder": [
      "shared top row in the same positions as bad-architecture: Question, AI app, AI model; Approved views badge; Same company data",
      "the private-data stack rises with a lock, built from the same company data",
      "the hatched database permission wall rises in front of the private data",
      "five view panes rise on the AI side and the AI model stands in front of them; the numbered list fills where bad-architecture showed the export tables; sight lines run from the AI to each view",
      "key badge on the AI model (read-only login: views only); a packet from the AI aimed at private data reaches the wall, then the stop bar and No access"
    ],
    "cut": "Keep the wall and the five views; press through the packet quickly if late. Columns and grants go to the appendix.",
    "appendixRoutes": [
      "appendix-architecture",
      "appendix-access-controls"
    ]
  },
  "semantic-contract": {
    "clock": {
      "start": "27:00",
      "end": "33:00",
      "budget_seconds": 360
    },
    "mode": "Walkthrough of the written definition (no AI run and no database check on screen)",
    "purpose": "A written, owned definition fills the four blanks, so nobody (person or AI) has to guess meaning, grain, period or table.",
    "say": [
      "A metric contract is a written agreement about what a number means. Grain means what one row represents: one month here. These are business decisions before they become code.",
      "Before press 3 ask aloud (no slide vote): “Last complete quarter: one number, or three?” Then: “The business owner decides this, not the room and not the AI.”",
      "Writing the definition down does not make the AI correct. Bridge to the next scene: “Who actually reads it?”",
      "Each line is one field of demo/semantic/metrics/ending_mrr.yml. Kind of number: aggregation snapshot. Rows per what: result_grain monthly. Which months: time_behavior period_rule end_of_period, default_period last_complete_quarter. Which table: model analytics.mrr_summary_monthly. Footer: unit EUR, freshness_sla_hours 36, owner revenue_analytics. The rule chip is the limitation “Never sum ending MRR across months.”",
      "The same four blanks were empty on failure-anatomy and come back on your-data. If someone wants the actual file, the verbatim YAML is on appendix-semantic-contract.",
      "[Sources]\nSynthetic repository evidence: demo/semantic and current compiler output.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "2": [5], "4": [4]},
    "ask": [
      {
        "at": 2,
        "text": "Last complete quarter: one number, or three?",
        "aloud": true,
        "expected": "Three: one month-end balance for each complete month, never added together. The business owner decides."
      },
      {
        "at": 5,
        "text": "Who actually reads it?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Three month-end balances, one for each complete month (April, May, June), never added together; the owner decides, not the room or the AI."
    ],
    "revealOrder": [
      "Title; the contract document with four blank lines, each with a ?: Kind of number? · Rows per what? · Which months? · Which table?; caption: The four blanks the AI had to guess.",
      "Line 1 fills: The month-end balance, a level; its ? goes and the level tank returns",
      "Line 2 fills: One row per month; many account rows collapse into one row per month; the caption clears",
      "Line 3 fills: Each complete month: Apr, May, Jun; the three months mark on the mini calendar; the rule stamps: Never add months together",
      "Line 4 fills: Only MRR summary by month; beside it one table stands out in ink and the other tables stay faint",
      "Footer fills: EUR · warn after 36 hours; the stamp lands: Approved: Revenue Analytics"
    ],
    "cut": "Keep lines 1 and 3 with the rule chip; press through line 4 and the footer without discussion.",
    "appendixRoutes": [
      "appendix-semantic-contract",
      "appendix-lineage-freshness"
    ]
  },
  "contract-consumers": {
    "clock": {
      "start": "33:00",
      "end": "38:00",
      "budget_seconds": 300
    },
    "mode": "Walkthrough of the course setup, with two counts from the recorded AI runs",
    "purpose": "The definition compiles for four readers, but loaded is not the same as used, and the two real locks sit outside it.",
    "say": [
      "Compile means turn one written definition into the formats each tool can read. A verified example is a reviewed question with its expected query. A citation tells us which definition the answer actually relied on.",
      "On press 2 slow down: “It had the definition available. The recorded runs never cited it. Keep that; it's the gap at the end.”",
      "Never imply the AI used the metric definition. In the three recorded ready runs (G01–G03), certified verified-question evidence was present 3 of 3 and governed metric citations were 0 of 3 (README).",
      "Say: We loaded descriptions, but the recorded evidence does not show that the AI used them. Technical reference for Q&A: 40 enrichments are stored, read back and loaded into genCtx; with retrievedManifest, sqlGenerator bypasses buildSchemaContext(..., enrichments), and traces expose no enrichment content (appendix-ask-boundary).",
      "“Guide for coding assistants” is generated/claude/CLAUDE.md. It guides Claude Code only; it does not configure the AI app's requests and enforces nothing.",
      "The two locks sit outside the definition: course policy is not imported into the AI app and refuses before a query; PostgreSQL grants enforce the final boundary.",
      "Evidence level, for your own vocabulary: the two counts on press 2 are MODEL CAPTURE summary fields for the ready lane (3 runs); everything else is a walkthrough of the course setup.",
      "Act bridge at the last press: “Delivered is not the same as used. Did it work?”",
      "[Sources]\nSynthetic repository evidence: compiler manifest, Ask bootstrap read-back, retrieval audit, and privilege tests. Anthropic, Manage Claude's memory, https://code.claude.com/docs/en/memory, accessed 2026-08-23, documentation terms apply.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "3": [2], "4": [1], "5": [3]},
    "ask": [
      {
        "at": 3,
        "text": "Delivered is not the same as used. Did it work?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "The AI tool had the definition loaded but never cited it; the locks that actually stop a bad query are the course rules before the query and the database permission."
    ],
    "revealOrder": [
      "Title; the Definition node; caption: A file on disk changes nothing by itself.",
      "Caption clears; a packet travels into Compile; once it lands, four connectors fan out to AI tool: definitions + examples · Test cases · Guide for coding assistants · Catalog for people",
      "Frame on the AI tool; callout: Runs used an approved example 3 of 3, cited the definition 0 of 3. Loaded is not the same as used.",
      "“Loaded is not the same as used” clears; the hatched band draws; Locks: Course rules: refuse before a query, outside the AI tool · Database permission: the lock (the small wall closes)"
    ],
    "cut": "Keep the 3 of 3 / 0 of 3 callout and both locks; press through the fan-out quickly. Never cut the AI tool, course-rules or guide limitations.",
    "appendixRoutes": [
      "appendix-semantic-contract",
      "appendix-ask-boundary",
      "appendix-access-controls"
    ]
  },
  "ready-rematch": {
    "clock": {
      "start": "38:00",
      "end": "44:30",
      "budget_seconds": 390
    },
    "mode": "Recorded AI run on the approved views (one run), then a database check",
    "purpose": "Ask the unchanged question through the approved views: the recorded run picks the right view and matches the database on all three months, and both known gaps are shown.",
    "say": [
      "Before press 1, ask aloud (no slide vote): “Will it match this time?”",
      "Reconfirm: same question, same data, same AI route, one run; we did not record the model version.",
      "Must say: one recorded run, forced to answer directly on both databases; not the tool's default. On the default path the tool stopped at its ambiguity check before writing any SQL.",
      "“Values match” means the three values match the database. It is not a fully governed end-to-end pass.",
      "Say: The query used a short table name. A connection setting supplied the missing address; move it elsewhere and it may fail or find something else. Technical reference for Q&A: mrr_summary_monthly resolves to analytics.mrr_summary_monthly through search_path analytics,public. Portable SQL names the schema explicitly.",
      "The run used an approved example question (verified question id 1) but cited no metric definition: loaded is not the same as used. That is the first known gap on screen.",
      "Evidence level, for your own vocabulary: MODEL CAPTURE (ready:G01, uncached, skipClarify=true, reported model label claude-cli via openai-compatible) → DB PROOF (independent G01 truth).",
      "[Sources]\nSynthetic repository evidence: validated G01 ready-lane capture, sealed expected result, and fixed-evidence manifest.\n[/Sources]"
    ],
    "sayAt": {"1": [0], "3": [2, 3], "4": [3], "5": [3]},
    "ask": [
      {
        "at": 0,
        "text": "Will it match this time?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Most expect a match; the database check on press 2 confirms all three months, and press 3 shows what still is not proven."
    ],
    "revealOrder": [
      "Title, the exact question card with the Unchanged stamp, mini route strip Question → AI → key → Approved views",
      "The packet travels through the key to the views and lands on MRR summary by month, then the Recorded AI run card rises around it: Apr €334,675 · May €344,450 · Jun €387,015",
      "Strip clears; the Database check card rises beside the run; “=” connectors draw row by row; three Matches marks stamp",
      "Question card and row marks clear; Values match chip; both known gaps: did not cite the metric definition · SQL needed a connection setting to find the view"
    ],
    "cut": "Never cut the three values, the database check or either known-gap line; press through the strip and packet quickly if late.",
    "appendixRoutes": [
      "appendix-run-metadata",
      "appendix-evaluation",
      "appendix-ask-boundary"
    ]
  },
  "generalization": {
    "clock": {
      "start": "44:30",
      "end": "50:00",
      "budget_seconds": 330
    },
    "mode": "Recorded AI runs on both databases (one run per question), then a database check per question",
    "purpose": "Show that the approved views also answer a change (net new MRR) and a rate (logo churn) correctly in the recorded runs, while the export tables get neither.",
    "say": [
      "Net new MRR means how much the monthly subscription value grew or shrank over the quarter. Logo churn means the share of customer accounts that left; logo means customer, and a segment is a customer group. Four of forty leaving is ten percent.",
      "“Last time a level, now a change, then a rate. There is no single always-add-it-up rule.”",
      "On net new MRR (press 1–2): “It treated two monthly changes as balances again.”",
      "Say at press 2: It subtracted two monthly changes as if they were balances. Technical reference for Q&A: June change 42,565 minus March change 60,160 equals −17,595 in the captured SQL.",
      "Say at press 4: It searched for the word active, but this table stores the code A. It found no starting customers, so it cannot calculate a rate. Zero divided by zero is not zero percent. Exact SQL and codes A, C, N stay in the appendix.",
      "The export database's own fixed-query numbers for these questions are not the AI's answers; never quote them as such.",
      "One recorded run per question per database. The runs used an approved example 3 of 3 and cited the definition 0 of 3.",
      "Evidence level, for your own vocabulary: MODEL CAPTURE (bad:G02, ready:G02, bad:G03, ready:G03; uncached, skipClarify=true, reported model label claude-cli via openai-compatible) → DB PROOF (independent G02 and G03 truth).",
      "Act bridge on the last press: “Great, but when should it not answer?”",
      "[Sources]\nSynthetic repository evidence: validated G02/G03 capture records and sealed expected results.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0], "5": [3], "6": [5]},
    "ask": [
      {
        "at": 0,
        "text": "Net new MRR: a balance or a change? Logo churn: a count or a rate?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Net new MRR is a change over the quarter; logo churn is a rate over the accounts that started the quarter."
    ],
    "revealOrder": [
      "Title and the two exact question cards with their shape tags: a change · a rate",
      "Net new MRR recorded runs: the line through zero draws (− left of zero, + right); Export tables −€17,595 and Approved views €32,380 stamp",
      "Net new MRR card collapses to its short name; the database check travels to €32,380 and, as it lands, Doesn't match · Matches; Same €32,380 as before.",
      "Net new MRR collapses to one result card: approved views matched €32,380 · Export tables: doesn't match ✗; logo churn recorded runs: Export tables 0 of 0, no rate · Approved views 4 of 40 · 10%",
      "Logo churn card collapses to its short name; database check cohort grid, 4 of 40 left per segment, 10%: bracket labels Stayed (36 outlined squares) · Left (4 filled squares); the two run rows get their ✗ and ✓; cause line: It searched 'active'; the table says 'A'.",
      "Logo churn collapses to one result card: approved views matched 10% per segment · Export tables: no rate ✗; summary across three questions: Export tables 0 of 3 · Approved views 3 of 3 · Cited the definition 0 of 3; one recorded run per question per database"
    ],
    "cut": "First content cut: press straight from step 2 to step 5.",
    "appendixRoutes": [
      "appendix-evaluation",
      "appendix-semantic-contract"
    ]
  },
  "honest-no": {
    "clock": {
      "start": "50:00",
      "end": "56:00",
      "budget_seconds": 360
    },
    "mode": "Course rules and database checks (no AI run on screen)",
    "purpose": "Show that a ready system also says no, in two layers: course rules ask back or refuse before any query, and the database permission denies what must never be read.",
    "say": [
      "Before each of presses 1–4 ask aloud: “Answer, ask back, refuse or block?”",
      "After press 4: “If the rule ever fails, the wall still holds.”",
      "Customer emails + lifetime value resolves to Refuse only, before any query. The forced private read is a separate request that the database denies. Never say “both answers are right”.",
      "Say the small print as written: these are course rules and database checks, not AI runs. No identifier values are read or shown.",
      "What each stamp rests on (sealed record): ask back “Specify the MRR meaning: ending MRR, net-new MRR, or an MRR movement component.” · refuse: no cost, COGS, recognized-revenue or approved profit definition · refuse before SQL: direct customer identifiers are outside the approved surface · deny: “PostgreSQL denied access to the non-approved schema.”",
      "Evidence levels, for your own vocabulary: C01/R01/R02 course policy (ready:C01, ready:R01, ready:R02); D01 DB PROOF (ready:D01), live check in the background with replay fallback.",
      "On press 5, read the closing stamp and the small print aloud: “Two locks: refuse early, enforce anyway.” These are course rules and database checks, not AI runs.",
      "[Sources]\nSynthetic repository evidence: course-policy C01/R01/R02 and PostgreSQL-enforced D01. PostgreSQL Global Development Group, Privileges, https://www.postgresql.org/docs/current/ddl-priv.html, accessed 2026-08-23, PostgreSQL License.\n[/Sources]"
    ],
    "sayAt": {"2": [3, 4], "3": [5]},
    "ask": [
      {
        "at": 0,
        "text": "How much MRR? Answer, ask back, refuse or block?",
        "aloud": true
      },
      {
        "at": 1,
        "text": "Profit by plan? Answer, ask back, refuse or block?",
        "aloud": true
      },
      {
        "at": 2,
        "text": "Customer emails + lifetime value? Answer, ask back, refuse or block?",
        "aloud": true
      },
      {
        "at": 3,
        "text": "A forced private read? Answer, ask back, refuse or block?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "How much MRR: ask back (which MRR?). Profit by plan: refuse (no cost data). Customer emails + lifetime value: refuse before any query. Forced private read: the database denies it."
    ],
    "revealOrder": [
      "Title; the two layers draw (Course rules panel, Database permission wall); four request cards",
      "How much MRR? travels into the course rules; as it arrives, stamp Ask back: which MRR?",
      "Profit by plan? travels into the course rules; as it arrives, stamp Refuse: no cost data",
      "Customer emails + lifetime value travels into the course rules; as it arrives, stamp Refuse before any query",
      "The forced private read passes under the rules on a dashed path and climbs straight into the wall; as it arrives, a stop bar ends it: stamp Database denies it",
      "Closing stamp Two locks: refuse early, enforce anyway. Small print: Course rules and database checks, not AI runs."
    ],
    "cut": "Press through How much MRR and Profit by plan quickly; never cut Customer emails + lifetime value or the forced private read.",
    "appendixRoutes": [
      "appendix-access-controls",
      "appendix-evaluation"
    ]
  },
  "freshness": {
    "clock": {
      "start": "56:00",
      "end": "60:00",
      "budget_seconds": 240
    },
    "mode": "What-if on the slide only (no database rerun)",
    "purpose": "Separate right meaning from data age: the definition warns after 36 hours, so 60-hour-old data is answered with a warning, not silently and not blocked.",
    "say": [
      "On press 4: “We moved only the clock on the slide. The database and the data did not change.”",
      "Correct meaning and fresh data are separate promises. A warning rule is not a block rule.",
      "Sealed facts: data loaded 2026-07-01 06:00 UTC, checked at the sealed evaluation clock 2026-07-01 09:00 UTC (3 hours old). The metric definition warns after 36 hours (freshness_sla_hours: 36 in ending_mrr.yml). No hard-expiry block rule exists.",
      "The 72-hour tick is only the end of the ruler. Do not invent an expiry.",
      "Evidence level, for your own vocabulary: COUNTERFACTUAL on a frozen fixture; nothing is rerun.",
      "[Sources]\nSynthetic repository evidence: versioned freshness contract and sealed evaluation-clock fixture.\n[/Sources]"
    ],
    "sayAt": {"1": [3], "2": [0, 1], "3": [1]},
    "ask": [
      {
        "at": 2,
        "text": "Same data, 60 hours old. What should happen?",
        "options": [
          "Answer",
          "Warn",
          "Block"
        ],
        "expected": "Warn: answer and disclose staleness; there is no block rule."
      }
    ],
    "expectedAudience": [
      "Most hands on Warn; some on Block. The next press shows Answer with a warning and that no block rule was written."
    ],
    "revealOrder": [
      "Title; Q2 2026 data with Loaded 06:00 UTC · checked 09:00 UTC; the ruler draws and the needle moves to 3 hours old; as it lands, Fresh: answer",
      "The 36-hour marker draws and the zone beyond it shades grey with a dashed edge: Rule: warn after 36 hours",
      "Room vote: Same data, 60 hours old. What should happen? Answer · Warn · Block",
      "Vote and Fresh chip clear; the needle travels to 60 hours and a dashed ghost stays at 3 hours; as it lands, 60 hours and stamp Answer with a warning; No block rule was written.",
      "The needle returns to 3 hours; a dashed ghost marker stays at 60 hours; as it lands, What-if only. The data did not change."
    ],
    "cut": "Keep the vote, the 60-hour answer and the return to 3 hours; never skip the what-if line.",
    "appendixRoutes": [
      "appendix-lineage-freshness"
    ]
  },
  "evaluation": {
    "clock": {
      "start": "60:00",
      "end": "65:00",
      "budget_seconds": 300
    },
    "mode": "Recorded AI runs, then database checks (two separate claims)",
    "purpose": "Show the recorded AI runs on three questions first, then the nine fixed database checks, without turning 9 of 9 into an AI score.",
    "say": [
      "Before press 1, ask the room to call the five behaviours: answer, ask back, refuse, refuse, deny.",
      "On press 4: “Two different claims. Never add them together.”",
      "On press 4, say “No.” before reading the scope line; the screen carries only: They test the database and course rules, not the AI.",
      "Recorded AI runs are observations: one forced run per question on each database, three questions. Export tables 0 of 3 right; approved views 3 of 3 right (the board shows the counts only); the runs cited the metric definition 0 of 3.",
      "The nine database checks (G01–G05, C01, R01, R02, D01) pass 9 of 9. They test the database and course rules, not the AI. There is no AI recording for C01, R01, R02 or D01.",
      "If asked: relation 3 of 3 and verified example 3 of 3 are on appendix-evaluation, as is the export database's 0 of 5 applicable.",
      "Evidence levels, for your own vocabulary: MODEL CAPTURE summary (six uncached runs) on step 2; DB PROOF corpus 9/9 (live check in the background, replay fallback) on step 4.",
      "Act bridge on the last press: “9 of 9, so the AI is reliable? No.”",
      "[Sources]\nSynthetic repository evidence: model-observation artifact, independent grade output, and nine-case fixed-evidence manifest.\n[/Sources]"
    ],
    "sayAt": {"3": [2], "4": [4]},
    "ask": [
      {
        "at": 0,
        "text": "Call them out: for each of these five requests, should it answer, ask back, refuse or deny?",
        "aloud": true
      },
      {
        "at": 3,
        "text": "9 of 9 tests pass. Does the AI score 9 of 9?",
        "options": [
          "Yes",
          "No"
        ],
        "expected": "No: the database board appears with its scope line; the tests check the database and course rules, not the AI."
      }
    ],
    "expectedAudience": [
      "Behaviours: answer, ask back, refuse, refuse, deny. Vote: some hands on Yes; the next press shows No with the scope line."
    ],
    "revealOrder": [
      "Title; five cases: Ending MRR · How much MRR? · Profit by plan? · Customer emails? · Private read (honest-no's forced private read)",
      "Expected behaviour labels stamp in under their questions: → Answer · → Ask back · → Refuse (one bracket over both refusals) · → Deny",
      "The Recorded AI runs board rises (one run each): Export tables 0 of 3 · Approved views 3 of 3 · Cited the definition 0 of 3 · An observation, not a benchmark. Case questions and behaviours stay.",
      "Title clears (it would give the answer away) and the vote question takes the title band: 9 of 9 tests pass. Does the AI score 9 of 9? The cases and both boards stay where they are; room vote band: Yes · No",
      "Vote clears; the Database checks board fills cell by cell; 9 of 9 counts up; the scope line becomes the headline: They test the database and course rules, not the AI. Say the “No.” aloud."
    ],
    "cut": "Press through the behaviour call-out if behind; never merge the two boards, never show 9 of 9 without its scope line, never show the database checks before the recorded runs.",
    "appendixRoutes": [
      "appendix-evaluation",
      "appendix-run-metadata"
    ]
  },
  "your-data": {
    "clock": {
      "start": "65:00",
      "end": "72:30",
      "budget_seconds": 450
    },
    "mode": "Room exercise: each participant's own worksheet, no recorded run and no database check",
    "purpose": "Each participant defines the smallest ready interface for one question of their own: question, approved view, the four blanks, one boundary and one test.",
    "say": [
      "Don't redesign the warehouse. Define the smallest interface and one test that would stop a wrong release.",
      "Press on the clock marks, not on the room (there is no timer on screen): 65:45 box 2, 66:45 box 3, 68:15 box 4, 69:15 box 5, 70:30 recovery.",
      "Say the privacy sentence once at 65:00; it stays on screen on every step: Use a synthetic or generic example. Do not enter employer, customer, personal, or sensitive data.",
      "The grey worked example is the course's own G01 case: Ending MRR by month, Q2 · MRR summary by month · Level · Month · Apr–Jun · MRR summary · No customer identifiers · Answer must match truth. It clears at 70:30 so only the room's own boxes remain.",
      "Box 3 is the same four blanks as failure-anatomy and semantic-contract, in the same order: Kind of number? · Rows per what? · Which months? · Which table? Its grey example answers them in that order: Level · Month · Apr–Jun · MRR summary.",
      "70:30–72:30 is protected recovery or a two-pair debrief, never new teaching. Never borrow from resolution.",
      "If someone asks for a clean copy of the five boxes: the question card (QUESTION-CARD.md) is in the worksheet kit on the workshop page, /workshops/datenbereitschaft-fuer-ki, and the guide lists the same five boxes. You name the path once at the end of resolution.",
      "[Sources]\nOriginal participant-kit exercise: data-readiness-kit/QUESTION-CARD.md and data-readiness-kit/readiness-lab.html. [/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0, 1, 2, 3, 4], "4": [2], "5": [5]},
    "ask": [
      {
        "at": 0,
        "text": "Write one business question and what should happen.",
        "aloud": true
      },
      {
        "at": 4,
        "text": "Swap tests with a partner: would yours stop a wrong release?",
        "aloud": true
      },
      {
        "at": 5,
        "text": "Two pairs: say your question and your hardest box.",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Each participant has one question, the smallest approved view, the four blanks filled, one thing the AI must never reach and one test; two pairs name their hardest box."
    ],
    "revealOrder": [
      "65:00 · Canvas of five boxes, privacy sentence and grey worked example; box 1 active. Now: write one business question and what should happen.",
      "65:45 · Box 2 active. Now: name the smallest approved view it needs.",
      "66:45 · Box 3 active. Now: fill the four blanks: kind of number, rows, months, table.",
      "68:15 · Box 4 active. Now: one thing the AI must never reach.",
      "69:15 · Box 5 active. Now: write one test. Compare with a partner.",
      "70:30 · Protected recovery / debrief: grey examples clear, the outline surrounds the whole canvas. Two pairs: say your question and your hardest box."
    ],
    "cut": "Work 65:00–70:30 is protected; 70:30–72:30 is recovery or debrief only; never borrow from resolution. If late, press through the box prompts on the clock marks and keep the recovery.",
    "appendixRoutes": [
      "appendix-semantic-contract",
      "appendix-access-controls",
      "appendix-evaluation"
    ]
  },
  "resolution": {
    "clock": {
      "start": "72:30",
      "end": "75:00",
      "budget_seconds": 150
    },
    "mode": "Recorded AI runs on both databases, then the database check",
    "purpose": "Resolve the opening judgment: only the interface changed; the approved-views answer matched the database in one recorded run per question, with named gaps, which earns a limited pilot, not an AI-ready stamp.",
    "say": [
      "Say once: \"The recording names the AI route, not the model version.\"",
      "Callback to bad-ask: recall the room's Trust / Challenge / Refuse split out loud, then take hands for the new vote before the next press.",
      "The question and facts stayed fixed. The AI route and reported model label stayed fixed (claude-cli via openai-compatible); the capture does not establish an underlying Anthropic model/version. The interface changed.",
      "Both runs were forced to answer directly on both databases (skipClarify=true, uncached); on the default path the tool stopped at its ambiguity check before writing any SQL.",
      "Search path in full: the approved-views SQL named mrr_summary_monthly without a schema; it resolved to analytics.mrr_summary_monthly only because the connection's search_path is analytics,public. Portable SQL would qualify the view.",
      "No governed metric citation was recorded (0 of 3), so ready end-to-end evidence fails. The deterministic 9 of 9 database proof tests the database and course rules, not Claude.",
      "If asked: the fresh 18-call protocol is NOT RUN (0/18) and the AI deployment is BLOCKED. The verdict code BOUNDED PILOT · CITATION GATE RED lives on appendix-run-metadata.",
      "Evidence levels, for your own vocabulary: step 1 MODEL CAPTURE bad:G01 and ready:G01 beside DB PROOF on ready:G01 (live check in the background, replay fallback); step 2 DB PROOF corpus 9/9, a separate claim.",
      "Must say, word for word, on the last press, then stop at 75:00 (a further press does nothing): A ready system answers the right questions, refuses the wrong ones, and shows which definition and data state produced the answer.",
      "Materials, once, right after the closing sentence as Q&A opens: “Everything is on the workshop page, loehrning.ai/workshops/datenbereitschaft-fuer-ki: the learner guide (guide.html) walks the whole course again, the worksheet kit has the question card and templates, and the browser lab lets you practise on the synthetic data.” Say the path aloud once and paste it into the chat if the room has one.",
      "[Sources]\nSynthetic repository evidence: validated capture summary, independent grade, fixed-evidence manifest, and release-ledger limitations.\n[/Sources]"
    ],
    "sayAt": {"1": [0], "2": [1], "5": [2], "9": [3]},
    "ask": [
      {
        "at": 0,
        "text": "Which answer goes in the board pack now?",
        "options": [
          "Export tables",
          "Approved views",
          "Neither yet"
        ],
        "expected": "No single right option: take two reasons tied to view, definition, lock or test, recall the bad-ask split, then press to the chart."
      }
    ],
    "expectedAudience": [
      "Use the approved-views values only with the database check beside them; keep the named gaps (no definition cited, SQL leaned on a connection setting, one recorded run per question) and keep 9 of 9 separate from the AI."
    ],
    "revealOrder": [
      "Title, the exact question card under it, room vote: Which answer goes in the board pack now? Export tables · Approved views · Neither yet",
      "Vote and question card clear; the Truth Chart grows series by series in its final place: export tables −€19,960 · €9,775 · €42,565; approved views €334,675 · €344,450 · €387,015, equal to the database check (an \"=\" badge between each pair); chips Doesn't match · Matches",
      "Chart and key stay put; Known gaps: did not cite the metric definition · SQL needed a connection setting to find the view · one recorded run per question; separate line: 9 of 9 tests the setup, not the AI",
      "Title, gaps list and 9 of 9 clear; Verdict: limited pilot, not signed off. The closing sentence becomes the headline; short gap line; lockup. Stop at 75:00."
    ],
    "cut": "If under 60 seconds: press to the chart, name the three gaps (no definition cited, SQL leaned on a setting, one run each), press to the verdict, deliver the closing sentence and stop at 75:00.",
    "appendixRoutes": [
      "appendix-architecture",
      "appendix-semantic-contract",
      "appendix-access-controls",
      "appendix-evaluation",
      "appendix-lineage-freshness",
      "appendix-ask-boundary",
      "appendix-run-metadata",
      "appendix-research"
    ]
  },
  "appendix-architecture": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: repository files and the recorded route label; no AI run, no database check on this page",
    "purpose": "Show the full answer path with its real identifiers, what each look-alike export table hides, and why two databases are a teaching control.",
    "say": [
      "Use for “how do the pieces connect”, “why these tables?” and “do I need two databases?”.",
      "The model is one box in a nine-stop path; every other stop can change the answer without touching the model.",
      "Two-databases caveat: two databases keep the comparison legible and avoid a current Ask schema-identity limit; schemas, roles or views in one database apply the same principles.",
      "Route and reported label: claude-cli reached through openai-compatible and the bridge. It names the route, not the model version, and it is not a direct Anthropic API run.",
      "This page does not prove current provider availability or the underlying model version.",
      "[Sources]\nSynthetic repository evidence: bad/ready schemas, connection definitions, and versioned privilege-check definitions.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: the path Browser → Ask :3210 → openai-compatible → bridge :8789 → claude-cli → generated SQL → read-only SQL guard → PostgreSQL :55432 → result, the four trust boundaries, both lanes, what the look-alike tables hide and the two-databases caveat"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-semantic-contract": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: the definition file, verbatim; no AI run",
    "purpose": "Show the actual ending_mrr file and how the four plain-language blanks map onto fields a compiler checks.",
    "say": [
      "“Show me the actual file.” These eleven lines are verbatim from demo/semantic/metrics/ending_mrr.yml, including time_behavior default_period last_complete_quarter (the “Which months?” answer).",
      "Kind of number is aggregation: snapshot, the blank the export-table run got wrong when it added up monthly changes.",
      "Compiled is not consumed: the compiler writes Ask metrics, verified question pairs, evidence cases, the coding-assistant guide and a human catalog, but only metrics and verified pairs reach Ask generation. Jump to the Ask boundary appendix if asked.",
      "[Sources]\nSynthetic repository evidence: versioned semantic YAML, compiler manifest, and generated consumers. dbt Labs, dbt Semantic Layer, https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl, accessed 2026-08-23, documentation terms apply.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: the eleven verbatim YAML lines with aggregation marked, the Four Blanks mapped to aggregation, result_grain, time_behavior and model, and the compiler fan-out with its not-consumed caveat"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-access-controls": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: course rules and database checks, not AI runs",
    "purpose": "Separate guidance, course policy and the SQL guard from the PostgreSQL role, which is the final boundary.",
    "say": [
      "Use to separate instructions, application policy and least privilege.",
      "The SQL guard is defence in depth; PostgreSQL least privilege is the final relation boundary.",
      "R02 is a course-policy refusal before any SQL; D01 is a separate forced read that the database itself denied.",
      "If asked: account_key is an approved pseudonymous analytics key, not anonymous. Course policy is not imported into Ask.",
      "[Sources]\nSynthetic repository evidence: course-policy cases and versioned PostgreSQL denial-test definitions. PostgreSQL Global Development Group, Privileges, https://www.postgresql.org/docs/current/ddl-priv.html, accessed 2026-08-23, PostgreSQL License.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: Guide → Course policy → Read-only SQL guard → PostgreSQL role (the final lock), the grants, the recorded R02 refusal and D01 denial, and what foldline_ready_reader cannot do"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-evaluation": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: database checks and recorded AI runs, shown as two separate boards",
    "purpose": "Inspect all nine database checks and the six recorded runs without merging them into one score.",
    "say": [
      "Use for “how is it graded” and “is 9/9 the AI score”: no. The nine checks test the database and course rules, not the AI.",
      "The recorded runs are one forced run per case and lane, skipClarify=true, uncached: an observation, not a benchmark.",
      "Grades behaviour and result, not one exact SQL string.",
      "Evidence level, for your own vocabulary: DB PROOF (deterministic ready corpus 9/9) on the left, MODEL CAPTURE on the right.",
      "[Sources]\nSynthetic repository evidence: sealed nine-case corpus, independent grader output, and release ledger.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: the nine database checks with export and approved grades, the summary approved 9/9 · export 0/5 applicable · not an AI score, and the separate recorded-runs board (value 0/3 vs 3/3, citation 0/3)"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-lineage-freshness": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: sealed dataset record with a frozen clock; nothing rerun",
    "purpose": "Answer fixture-age, load-delay and lineage questions without making a current freshness claim.",
    "say": [
      "Use for fixture age, load delay and lineage questions.",
      "The clock is frozen: loaded 2026-07-01 06:00 UTC, evaluated 09:00 UTC, three hours apart. The rule warns after 36 hours and has no hard expiry.",
      "This is not a September 2026 freshness claim, and the 60-hour freshness scene was a what-if, not a rerun.",
      "[Sources]\nSynthetic repository evidence: dataset manifest, sealed evaluation clock, lineage fields, and freshness contract.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: source → core → analytics lineage, the sealed clock (load, evaluation clock 3 h later, warn after 36 h, no hard expiry) and the dataset envelope with foldline-v1"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-ask-boundary": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: text summaries of a historical local capture and recorded traces; current health not claimed",
    "purpose": "State precisely what reaches Ask generation, where the prompt gap is, and where the search-path dependency lives.",
    "say": [
      "State the boundary precisely; this is where the search-path identifier lives.",
      "Search-path dependency in full: the ready G01 SQL is unqualified; the captured search_path analytics,public resolves it to analytics.mrr_summary_monthly. SQL needed a connection setting to find the view.",
      "40 enrichments are stored and loaded into genCtx, but with retrievedManifest sqlGenerator bypasses buildSchemaContext, so their influence is unproven. Loaded is not the same as used.",
      "The two text panels summarise a local capture from 23 Aug 2026; the screenshots are omitted from this public edition, and the capture is historical: it never implies current health.",
      "CLAUDE.md guides Claude Code only; course policy is not imported into Ask.",
      "[Sources]\nSynthetic repository evidence: Ask source audit, bridge tests, runtime-status record, and sanitized traces. Anthropic, Manage Claude's memory, https://code.claude.com/docs/en/memory, accessed 2026-08-23, documentation terms apply.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: both text summary panels (Two synthetic connections · Three recorded questions) with their provenance line, the two known gaps (search path, enrichment retrieval) and the boundary stack Ask generation → Prompt gap → Application → PostgreSQL"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-run-metadata": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: recorded AI runs and database checks, mapped to the four formal evidence labels",
    "purpose": "Map “Recorded AI run” and “Database check” to the four formal evidence labels, the run envelope and the release state.",
    "say": [
      "Use the four labels exactly when asked what “recorded” and “database check” mean: MODEL CAPTURE (Recorded AI run), DB PROOF LIVE and DB PROOF REPLAY (Database check); LIVE MODEL is reserved and never invoked.",
      "Forced direct answer on both databases (execute=true, highAccuracy=false, history=[], skipClarify=true, uncached): not Ask default behaviour. The default G01 export-lane probe stopped at the ambiguity pre-pass before SQL.",
      "The capture names the route Ask 3210 → openai-compatible → bridge 8789 → claude-cli → PG 55432; the underlying Anthropic model and version are not established by the capture.",
      "If asked: the fresh 18-call protocol is NOT RUN 0/18 and the AI deployment is BLOCKED. Verdict code BOUNDED PILOT · CITATION GATE RED; on screen elsewhere this is “Verdict: limited pilot, not signed off.”",
      "Verified query IDs 1, 2, 3 appear in the ready traces; metric citations are absent in all six runs.",
      "[Sources]\nSynthetic repository evidence: validated model-observation manifest, sanitized run metadata, and release ledger.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: the model plane (MODEL CAPTURE, both capture records, the default-probe note) beside the separate deterministic plane (DB PROOF LIVE, DB PROOF REPLAY, corpus 9/9), the run envelope, the verdict record and what it does not prove"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-research": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix: published sources; nothing redistributed, no logos",
    "purpose": "List the primary source families behind the question, meaning, boundary and evidence choices, with rights routed to the ledgers.",
    "say": [
      "Reference only. Full URLs and rights live in the Sources block below and in research/source-ledger.md.",
      "[Sources]\nSpider 2.0 project, Spider 2.0, https://spider2-sql.github.io/, accessed 2026-08-23; site terms apply and no content is redistributed in the deck. dbt Labs, dbt Semantic Layer, https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl, accessed 2026-08-23; documentation terms apply. Open Data Contract Standard, Standard documentation, https://docs.datacontract.com/open-data-contract-standard, accessed 2026-08-23; documentation terms apply. PostgreSQL Global Development Group, Privileges, https://www.postgresql.org/docs/current/ddl-priv.html, accessed 2026-08-23; PostgreSQL License. NIST, AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, accessed 2026-08-23; U.S. government publication, with no broader reuse claim made here. OpenLineage, Object Model, https://openlineage.io/docs/spec/object-model/, accessed 2026-08-23; documentation terms apply. Direct source and rights-status ledger: research/source-ledger.md. Participant-kit rights status: data-readiness-kit/ASSET-RIGHTS.md. Deck asset rights status: facilitator/asset-provenance.md.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry: Question (Spider 2.0) → Meaning (dbt Semantic Layer, ODCS) → Boundary (PostgreSQL privileges) → Evidence (NIST AI RMF, OpenLineage), and the pointer to the ledgers"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  }
});
