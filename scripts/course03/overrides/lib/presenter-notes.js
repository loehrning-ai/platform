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
    "mode": "Opening",
    "purpose": "The question and the experiment.",
    "say": [
      "Presenter cue: start the clock on your first word, read the question once, press on “change the interface”.",
      "A database can return valid SQL and still be unfit for an AI. We keep the question, the data and the AI route the same, change only the interface around the data, and measure the answer.",
      "Say “same AI route”, never “same model”: the recording does not establish the model version.",
      "[Sources]\nOriginal course text; no external claim or asset.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0], "2": [0, 1]},
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Title, question card, footer",
      "Held fixed (three Same stamps) → Change the interface → Measure the answer"
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
    "mode": "Opening · biography",
    "purpose": "Credibility and the synthetic-data boundary.",
    "say": [
      "Presenter cue: speak the bio (hard 60-second cap); press on “Before that”.",
      "I’m Tim Löhr, a data engineer at Meta. Before that I was a data scientist at Red Bull and Apple, after starting in data at Amazon. I build the pipelines behind business reporting: the models, transformations and checks that turn stored records into usable numbers. An AI can write valid SQL and still answer the wrong question when the data surface, metric or access rules are unclear, so this course starts before the prompt. Everything you see uses a synthetic company and synthetic data.",
      "Social labels identify the presenter; they are not slide controls.",
      "[Sources]\nPresenter-supplied biography; no employer-system claim.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0, 1]},
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Portrait, name, short bio, synthetic-case line",
      "Experience and education replace the bio"
    ],
    "cut": "Hard 60-second cap; don't read every entry.",
    "appendixRoutes": []
  },
  "the-case": {
    "clock": {
      "start": "01:45",
      "end": "03:15",
      "budget_seconds": 90
    },
    "mode": "Opening · definitions",
    "purpose": "Define company, question and its three words.",
    "say": [
      "Presenter cue: ask for hands (no slide vote). Land “never below zero” and tell the room to hold on to it.",
      "FOLDLINE is a made-up SaaS company (software sold as a subscription) with 144 business accounts. Everything is synthetic.",
      "MRR is monthly recurring revenue. Ten customers at €20 per month make €200 MRR. If one leaves, ending MRR is €180 and the change is minus €20. The amount remaining and the amount that changed answer different questions. FOLDLINE's ending MRR cannot be negative.",
      "Ending means the value on each month's last day, not cash collected or invoices. The clock is frozen at 1 July 2026, whatever today's date, so the last complete quarter is April to June.",
      "Every disagreement today is about one of these three words.",
      "[Sources]\nOriginal course text; synthetic FOLDLINE fixture foldline-v1. No external claim or asset.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0], "2": [1], "3": [2, 3], "4": [3]},
    "ask": [
      {
        "at": 0,
        "text": "Who has been handed two different numbers for the same metric in one week?",
        "aloud": true,
        "expected": "Most hands go up. Save the stories for your-data."
      }
    ],
    "expectedAudience": [
      "Most hands go up. Save the stories for your-data."
    ],
    "revealOrder": [
      "Title, question card",
      "MRR: the tank, never below zero",
      "Ending: month-end ticks on Apr, May, Jun",
      "Last complete quarter: April to June 2026; Jul to Sep unfinished"
    ],
    "cut": "If behind, keep the three definitions, drop the hands.",
    "appendixRoutes": []
  },
  "the-arc": {
    "clock": {
      "start": "03:15",
      "end": "04:45",
      "budget_seconds": 90
    },
    "mode": "Opening · session map",
    "purpose": "The session's shape and the takeaway.",
    "say": [
      "We ask one question twice. The data and the AI route never change; only what the AI can see changes.",
      "Six stops. Wrong answer: seven export tables, and the answer sounds right. Why it failed: four decisions nobody wrote down. The fix: approved views and a written definition. Ask again. Honest limits: when to refuse, warn and test. Your turn: your own question.",
      "You leave with one filled page for a real question of your own.",
      "Presenter cue: on the last press point at the top band: “Wherever we are, this line tells you.”",
      "[Sources]\nOriginal course text; no external claim or asset.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [1], "2": [2]},
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Title, route with six stations",
      "The question travels the route",
      "Outcome card; the route moves into the top band"
    ],
    "cut": "Hard 90-second cap. Name the six stops; don't preview them.",
    "appendixRoutes": []
  },
  "bad-architecture": {
    "clock": {
      "start": "04:45",
      "end": "08:30",
      "budget_seconds": 225
    },
    "mode": "Walkthrough · no run",
    "purpose": "Plausible tables, no written meaning.",
    "say": [
      "A database stores tables, like spreadsheets. SQL asks them a question. The data interface is the tables, explanations and permissions the AI gets.",
      "Every query runs. The AI gets seven plausible tables, and nothing written down says which one means ending MRR.",
      "Before press 3, ask aloud (no slide vote): \"If you had to answer ending MRR, which table would you open?\" Take two answers; don't say why yet.",
      "Keep the per-table traps (monthly changes, retry duplicates, June only) for failure-anatomy and appendix-architecture.",
      "Evidence level: SYSTEM WALKTHROUGH. Identifiers: saas_bad.public, role foldline_bad_reader, Ask :3210 → openai-compatible → bridge :8789 → claude-cli → PostgreSQL :55432.",
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
      "Two answers; monthly_revenue, billing_events or subscription_export are all fair. No verdict."
    ],
    "revealOrder": [
      "Question → AI app → AI model",
      "Seven export tables; 144 accounts",
      "The login sees all 7 tables; a query returns",
      "Three look-alikes get a ?",
      "Stamp: every table works, none says what its numbers mean"
    ],
    "cut": "Keep the spoken table question. Never explain the per-table traps here.",
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
    "mode": "Recorded run · export tables",
    "purpose": "The room judges the answer before any check.",
    "say": [
      "Let the room read the numbers for five seconds, take hands for each option and say the split aloud (you recall it at 72:30).",
      "One recorded run, forced to answer directly on both databases; on its default path the tool stopped to ask before writing SQL.",
      "Every tick is true: no error, valid SQL, a column named ending_mrr, three tidy rows. None of that says the numbers are right.",
      "Here is the AI's recorded answer from the export tables. Judge it like a colleague's report; we check it next.",
      "Evidence level: MODEL CAPTURE bad:G01 (uncached, skipClarify=true).",
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
        "expected": "No verdict yet; the room remembers its hand."
      }
    ],
    "expectedAudience": [
      "Hands for Trust, Challenge, Refuse; say the split aloud. No grade."
    ],
    "revealOrder": [
      "Question card, Question → AI → Export tables",
      "Run card on monthly_revenue: Apr −€19,960 · May €9,775 · Jun €42,565",
      "Looks trustworthy checklist",
      "Vote: Put this in the board pack? Trust · Challenge · Refuse",
      "Remember your hand. Next: the database check."
    ],
    "cut": "Never cut the question, the picked table or the three values; keep the vote short.",
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
    "mode": "Recorded run, then database check",
    "purpose": "April's negative value, its cause, four blanks.",
    "say": [
      "Must say: the same forced run from bad-ask, now graded against the database. An observation, not a benchmark.",
      "The model did not invent a table. We offered a plausible table without enough written meaning to reject it.",
      "On press 5: \"Add them up. That's the true net new MRR.\"",
      "The AI added up each month's change instead of reading the month-end balance: that is net new MRR, a different metric. Never say the AI meant to compute net new MRR.",
      "Cause source: demo/db/bad/30-bad-surface.sql L98–106 defines monthly_revenue.amount = sum(new + expansion − contraction − churned) per month and segment; the capture's SQL sums monthly_revenue.amount per month.",
      "Verbatim capture SQL for bad:G01 (notes only, never on screen):\nWITH monthly_totals AS (\n    SELECT\n        DATE_TRUNC('month', mr.dt)::date AS revenue_month,\n        SUM(mr.amount) AS mrr\n    FROM monthly_revenue AS mr\n    WHERE mr.dt >= DATE '2026-04-01'\n      AND mr.dt < DATE '2026-07-01'\n    GROUP BY DATE_TRUNC('month', mr.dt)\n)\nSELECT\n    mt.revenue_month,\n    mt.mrr AS ending_mrr\nFROM monthly_totals AS mt\nORDER BY mt.revenue_month",
      "Arithmetic behind press 5: −19,960 + 9,775 + 42,565 = 32,380 (database net new MRR, Q2 2026); 344,450 − 334,675 = 9,775; 387,015 − 344,450 = 42,565.",
      "Evidence levels: steps 0 to 3 MODEL CAPTURE bad:G01; step 4 DB PROOF ready:G01; step 5 DB PROOF G02.",
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
        "expected": "Each month's change: see the cause card."
      }
    ],
    "expectedAudience": [
      "Most pick “with a bug”; the next press shows each month's change."
    ],
    "revealOrder": [
      "AI bars ×3 taller, April below zero",
      "Vote: So what did the AI calculate?",
      "Cause card: monthly_revenue stores each month's change",
      "Four blanks nobody wrote down",
      "Database check: €334,675 · €344,450 · €387,015; Doesn't match",
      "−€19,960 + €9,775 + €42,565 = €32,380, net new MRR"
    ],
    "cut": "Keep vote, cause card and database check; press through the blanks. No SQL teaching.",
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
    "mode": "Run setup · no answer",
    "purpose": "What stayed the same, what changed.",
    "say": [
      "On press 1: “These recorded fields stayed the same, so we can compare the answers.”",
      "We changed a package: tables, definitions, examples and permissions. One run each and an unrecorded model version cannot show which change caused the improvement.",
      "Say aloud: “In default mode the tool stopped to ask what we meant, so both sides were forced to answer directly.”",
      "Must say: one recorded run per lane, forced to answer directly. Not the tool's default behaviour.",
      "Must say: the recording names the route and model label (claude-cli via openai-compatible), not a model version. Never say “same model”.",
      "Same: question, source facts and checksum, provider path and model label, forced settings, uncached. Changed: the tables or views, the Ask context (metric definitions, verified question pairs), the database login.",
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
      "Same: question, data, AI route, settings.",
      "Changed: what the AI could see (7 tables or 5 views), its context, its login."
    ],
    "revealOrder": [
      "Two identical lanes",
      "Shared parts merge; stamp Same (144 accounts · Q2 2026)",
      "7 export tables vs 5 approved views: Changed",
      "Small print: one forced run per lane; route, not model version"
    ],
    "cut": "If late, press through, but read press 3's small print word for word.",
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
    "mode": "Walkthrough · no run",
    "purpose": "A smaller interface behind a permission.",
    "say": [
      "A view is a saved selection or summary of a table; an approved view has the right columns and rows for this job. Read-only means the login cannot change data; it still needs limits on what it reads.",
      "On press 3: “Smaller, not merely cleaner.”",
      "Say aloud: “Two databases keep this test clean; at work, schemas, roles or views in one database do the same.”",
      "Must say: the two databases are a teaching control, not a prescription; catalogs or separate serving systems also work (appendix-architecture).",
      "If asked: the account key in the views is pseudonymous, not anonymous: a stable, joinable analytics key (appendix-access-controls).",
      "The ready login cannot read source, core or identifiers, write, create temporary tables or reach the export database. Grants, read-only transactions, connection limits and timeouts enforce this.",
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
      "Question, AI app, AI model; Approved views",
      "Private data behind a lock",
      "Permission wall",
      "Five views on the AI side",
      "Read-only key; a packet hits the wall: No access"
    ],
    "cut": "Keep the wall and the five views. Grants go to the appendix, columns to Q&A.",
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
    "mode": "Walkthrough · definition",
    "purpose": "A written, owned definition fills the four blanks.",
    "say": [
      "Read the caption once. A metric contract is one entry in that layer. Grain means what one row represents, here one month. These are business decisions before they become code.",
      "Before press 3 ask aloud (no slide vote): “Last complete quarter: one number, or three?” Then: “The business owner decides this, not the room and not the AI.”",
      "Writing the definition down does not make the AI correct. Bridge: “Who actually reads it?”",
      "Fields of demo/semantic/metrics/ending_mrr.yml: aggregation snapshot; result_grain monthly; time_behavior period_rule end_of_period, default_period last_complete_quarter; model analytics.mrr_summary_monthly; unit EUR, freshness_sla_hours 36, owner revenue_analytics; limitation “Never sum ending MRR across months.”",
      "The verbatim YAML is on appendix-semantic-contract.",
      "[Sources]\nSynthetic repository evidence: demo/semantic and current compiler output.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "2": [5], "4": [4]},
    "ask": [
      {
        "at": 2,
        "text": "Last complete quarter: one number, or three?",
        "aloud": true,
        "expected": "Three month-end balances, never added. The owner decides."
      },
      {
        "at": 5,
        "text": "Who actually reads it?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Three month-end balances, never added; the owner decides."
    ],
    "revealOrder": [
      "Contract with four blanks; caption",
      "Line 1: month-end balance, a level",
      "Line 2: one row per month",
      "Line 3: Apr, May, Jun; Never add months together",
      "Line 4: MRR summary by month",
      "Footer: EUR · warn after 36 hours; Approved: Revenue Analytics"
    ],
    "cut": "Keep lines 1 and 3 and the rule; press through line 4 and the footer.",
    "appendixRoutes": [
      "appendix-semantic-contract",
      "appendix-fix",
      "appendix-lineage-freshness"
    ]
  },
  "contract-consumers": {
    "clock": {
      "start": "33:00",
      "end": "38:00",
      "budget_seconds": 300
    },
    "mode": "Walkthrough · two run counts",
    "purpose": "Loaded, but never cited; the locks sit outside.",
    "say": [
      "Compile means turning one definition into formats each tool reads. A verified example is a reviewed question with its expected query. A citation shows which definition an answer relied on.",
      "On press 2 slow down: “It had the definition available. The recorded runs never cited it. That's the gap at the end.”",
      "Never imply the AI used the metric definition: in the three ready runs (G01 to G03), verified-question evidence was present 3 of 3, metric citations 0 of 3.",
      "Say: We loaded descriptions, but the evidence does not show that the AI used them. Technical reference for Q&A: 40 enrichments are stored, read back and loaded into genCtx; with retrievedManifest, sqlGenerator bypasses buildSchemaContext(..., enrichments), and traces expose no enrichment content (appendix-ask-boundary).",
      "“Guide for coding assistants” is generated/claude/CLAUDE.md. It guides Claude Code only; it does not configure the AI app's requests and enforces nothing.",
      "The locks sit outside the definition: course policy refuses before a query (not imported into the AI app); PostgreSQL grants enforce the boundary.",
      "Evidence level: press 2 counts are MODEL CAPTURE summary fields (ready lane, 3 runs); the rest is a walkthrough.",
      "Act bridge at the last press: “Loaded, but never cited. Did it work?”",
      "[Sources]\nSynthetic repository evidence: compiler manifest, Ask bootstrap read-back, retrieval audit, and privilege tests. Anthropic, Manage Claude's memory, https://code.claude.com/docs/en/memory, accessed 2026-08-23, documentation terms apply.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "3": [2], "4": [1], "5": [3]},
    "ask": [
      {
        "at": 3,
        "text": "Loaded, but never cited. Did it work?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Loaded but never cited; the course rules and the database permission stop a bad query."
    ],
    "revealOrder": [
      "Definition node: The file only works where a tool reads it.",
      "Compile fans out to four readers",
      "Approved example 3 of 3, definition cited 0 of 3",
      "Locks: course rules, database permission"
    ],
    "cut": "Keep the 3 of 3 / 0 of 3 callout and both locks; press through the fan-out. Never cut the guide or course-rules limitations.",
    "appendixRoutes": [
      "appendix-semantic-contract",
      "appendix-fix",
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
    "mode": "Recorded run · approved views, then check",
    "purpose": "Same question, right view, two known gaps.",
    "say": [
      "Before press 1, ask aloud (no slide vote): “Will it match this time?”",
      "Same question, data and AI route, one run; the model version was not recorded.",
      "Must say: one recorded run, forced to answer directly on both databases; not the tool's default.",
      "“Values match” means the three values match the database. It is not a fully governed end-to-end pass.",
      "Say: The query used a short table name, and a connection setting supplied the rest; change the setting and it may fail or find something else. Technical reference for Q&A: mrr_summary_monthly resolves to analytics.mrr_summary_monthly through search_path analytics,public. Portable SQL names the schema.",
      "The run used an approved example (verified question id 1) but cited no metric definition. That is the first known gap.",
      "Evidence level: MODEL CAPTURE ready:G01 → DB PROOF G01.",
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
      "Most expect a match; press 2 confirms it, press 3 shows the gaps."
    ],
    "revealOrder": [
      "Question card: Unchanged",
      "Run card on MRR summary by month: €334,675 · €344,450 · €387,015",
      "Database check: three Matches",
      "Values match; two known gaps"
    ],
    "cut": "Never cut the three values, the check or the gap lines.",
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
    "mode": "Recorded runs, then checks",
    "purpose": "A change and a rate: only the views get both.",
    "say": [
      "Net new MRR is how much the monthly subscription value grew or shrank over the quarter. Logo churn is the share of customer accounts that left; a segment is a customer group. Four of forty leaving is ten percent.",
      "“Last time a level, now a change, then a rate. There is no single always-add-it-up rule.”",
      "On net new MRR: “It subtracted two monthly changes as if they were balances.” Technical reference for Q&A: June change 42,565 minus March change 60,160 equals −17,595 in the captured SQL.",
      "Say at press 4: It searched for the word active, but this table stores the code A. It found no starting customers, so it cannot calculate a rate; zero divided by zero is not zero percent.",
      "The export database's fixed-query numbers are not the AI's answers; never quote them as such.",
      "One run per question per database. Approved example used 3 of 3, definition cited 0 of 3.",
      "Evidence level: MODEL CAPTURE bad:G02, ready:G02, bad:G03, ready:G03 → DB PROOF G02, G03.",
      "Act bridge on the last press: “Great, but when should it not answer?”",
      "[Sources]\nSynthetic repository evidence: validated G02/G03 capture records and sealed expected results.\n[/Sources]"
    ],
    "sayAt": {"0": [0], "1": [0], "2": [1, 2], "4": [3], "5": [5]},
    "ask": [
      {
        "at": 0,
        "text": "Net new MRR: a balance or a change? Logo churn: a count or a rate?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Net new MRR: a change. Logo churn: a rate."
    ],
    "revealOrder": [
      "Two question cards: a change · a rate",
      "Net new MRR: −€17,595 vs €32,380",
      "Check €32,380: Doesn't match · Matches",
      "Logo churn: 0 of 0, no rate · 4 of 40, 10%",
      "Check: 4 of 40 per segment; It searched 'active'; the table says 'A'.",
      "Summary: export 0 of 3 · views 3 of 3 · cited 0 of 3"
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
    "mode": "Course rules and checks · no run",
    "purpose": "Ask back, refuse, deny.",
    "say": [
      "Before each of presses 1–4 ask aloud: “Answer, ask back, refuse or deny?”",
      "Customer emails + lifetime value is refused before any query. The forced private read is a separate request the database denies. Never say “both answers are right”.",
      "Sealed basis: ask back “Specify the MRR meaning: ending MRR, net-new MRR, or an MRR movement component.” · refuse: no cost, COGS, recognized-revenue or approved profit definition · refuse before SQL: direct customer identifiers are outside the approved surface · deny: “PostgreSQL denied access to the non-approved schema.”",
      "Evidence levels: C01, R01, R02 course policy; D01 DB PROOF.",
      "On press 5, read aloud: “Course rules refuse first; the database blocks the read. Course rules and database checks, not AI runs.” No identifier values are read or shown.",
      "[Sources]\nSynthetic repository evidence: course-policy C01/R01/R02 and PostgreSQL-enforced D01. PostgreSQL Global Development Group, Privileges, https://www.postgresql.org/docs/current/ddl-priv.html, accessed 2026-08-23, PostgreSQL License.\n[/Sources]"
    ],
    "sayAt": {"1": [3, 4], "4": [5]},
    "ask": [
      {
        "at": 0,
        "text": "How much MRR? Answer, ask back, refuse or deny?",
        "aloud": true
      },
      {
        "at": 1,
        "text": "Profit by plan? Answer, ask back, refuse or deny?",
        "aloud": true
      },
      {
        "at": 2,
        "text": "Customer emails + lifetime value? Answer, ask back, refuse or deny?",
        "aloud": true
      },
      {
        "at": 3,
        "text": "A forced private read? Answer, ask back, refuse or deny?",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "Ask back · refuse · refuse before any query · database denies."
    ],
    "revealOrder": [
      "Course rules, permission wall, four requests",
      "How much MRR? → Ask back",
      "Profit by plan? → Refuse: no cost data",
      "Customer emails + lifetime value → Refuse before any query",
      "Forced private read → Database denies it",
      "Course rules refuse first; the database blocks the read."
    ],
    "cut": "Press through the first two; never cut the last two.",
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
    "mode": "What-if · no rerun",
    "purpose": "Right meaning is not the same as fresh data.",
    "say": [
      "On press 4: “We moved only the clock on the slide. The data did not change.”",
      "Correct meaning and fresh data are separate promises. A warning rule is not a block rule.",
      "Sealed facts: loaded 2026-07-01 06:00 UTC, checked 09:00 UTC (3 hours old). The definition warns after 36 hours (freshness_sla_hours: 36). No block rule exists.",
      "The 72-hour tick is the end of the ruler. Don't invent an expiry.",
      "Evidence level: COUNTERFACTUAL on a frozen fixture.",
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
      "Most on Warn, some on Block."
    ],
    "revealOrder": [
      "3 hours old: Fresh: answer",
      "Rule: warn after 36 hours",
      "Vote: Same data, 60 hours old? Answer · Warn · Block",
      "60 hours: Answer with a warning; no block rule",
      "Back to 3 hours: What-if only."
    ],
    "cut": "Keep the vote, the 60-hour answer and the what-if line.",
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
    "mode": "Recorded runs, then checks",
    "purpose": "Two claims; 9 of 9 is not an AI score.",
    "say": [
      "Before press 1, ask the room to call the five behaviours: answer, ask back, refuse, refuse, deny.",
      "On press 4 say “No”, then read the scope line: two different claims, never added together.",
      "Recorded runs are observations: one forced run per question per database. Export tables 0 of 3, approved views 3 of 3; definition cited 0 of 3.",
      "The nine database checks (G01 to G05, C01, R01, R02, D01) pass 9 of 9. There is no AI recording for C01, R01, R02 or D01.",
      "If asked: relation 3 of 3, verified example 3 of 3 and export 0 of 5 applicable are on appendix-evaluation.",
      "Evidence levels: MODEL CAPTURE summary (six runs) on step 2; DB PROOF 9/9 on step 4.",
      "Act bridge on the last press: “9 of 9, so the AI is reliable? No.”",
      "[Sources]\nSynthetic repository evidence: model-observation artifact, independent grade output, and nine-case fixed-evidence manifest.\n[/Sources]"
    ],
    "sayAt": {"2": [2], "3": [4]},
    "ask": [
      {
        "at": 0,
        "text": "For each of the five requests: answer, ask back, refuse or deny?",
        "aloud": true
      },
      {
        "at": 3,
        "text": "9 of 9 tests pass. Does the AI score 9 of 9?",
        "options": [
          "Yes",
          "No"
        ],
        "expected": "No: the tests check the database and course rules, not the AI."
      }
    ],
    "expectedAudience": [
      "Answer, ask back, refuse, refuse, deny. Some vote Yes."
    ],
    "revealOrder": [
      "Five cases",
      "Expected behaviours",
      "Recorded runs: 0 of 3 · 3 of 3 · cited 0 of 3",
      "Vote: Does the AI score 9 of 9? Yes · No",
      "Database checks 9 of 9: not the AI"
    ],
    "cut": "Never merge the two boards, show 9 of 9 without its scope line, or show the database checks before the recorded runs.",
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
    "mode": "Room exercise",
    "purpose": "Each person: one question, one ready interface.",
    "say": [
      "Don't redesign the warehouse. Define the smallest interface and one test that would stop a wrong release.",
      "Press on the clock marks (no timer on screen): 65:45 box 2, 66:45 box 3, 68:15 box 4, 69:15 box 5, 70:30 recovery.",
      "Say the privacy sentence once at 65:00: Use a synthetic or generic example. Do not enter employer, customer, personal, or sensitive data.",
      "The grey example is the G01 case; it clears at 70:30.",
      "Box 3 holds the four blanks in the same order as before.",
      "70:30–72:30 is recovery or a two-pair debrief, never new teaching. Never borrow from resolution.",
      "Clean copy: QUESTION-CARD.md in the kit on the workshop page.",
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
        "text": "Compare tests with a partner: would yours stop a wrong release?",
        "aloud": true
      },
      {
        "at": 5,
        "text": "Two pairs share with the room: your question and your hardest box.",
        "aloud": true
      }
    ],
    "expectedAudience": [
      "One question, one view, four blanks, one boundary, one test each."
    ],
    "revealOrder": [
      "65:00 · Box 1: one business question and what should happen",
      "65:45 · Box 2: the smallest approved view",
      "66:45 · Box 3: the four blanks",
      "68:15 · Box 4: one thing the AI must never reach",
      "69:15 · Box 5: one test; compare with a partner",
      "70:30 · Recovery; two pairs share their question and hardest box"
    ],
    "cut": "65:00 to 70:30 is protected; if late, press on the clock marks and keep the recovery.",
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
    "mode": "Recorded runs, then check",
    "purpose": "The verdict: a limited pilot.",
    "say": [
      "Say once: \"The recording names the AI route, not the model version.\"",
      "Callback to bad-ask: recall the room's Trust / Challenge / Refuse split aloud, then take hands for the new vote before the next press.",
      "Question, facts, AI route and model label (claude-cli via openai-compatible) stayed fixed; the interface changed. Both runs were forced to answer directly on both databases (skipClarify=true, uncached).",
      "Search path in full: the approved-views SQL named mrr_summary_monthly without a schema; it resolved to analytics.mrr_summary_monthly only because search_path is analytics,public.",
      "No metric citation was recorded (0 of 3), so ready end-to-end evidence fails. The 9 of 9 tests the database and course rules, not the AI.",
      "If asked: the fresh 18-call protocol is NOT RUN (0/18) and the AI deployment is BLOCKED (appendix-run-metadata).",
      "Evidence levels: step 1 MODEL CAPTURE bad:G01, ready:G01 and DB PROOF ready:G01; step 2 DB PROOF 9/9, a separate claim.",
      "Must say, word for word, on the last press, then stop at 75:00 (a further press does nothing): A ready system answers the right questions, refuses the wrong ones, and shows which definition and data state produced the answer.",
      "Materials, once, after the closing sentence: “Everything is on loehrning.ai/workshops/datenbereitschaft-fuer-ki: the guide, the worksheet kit with the question card, and the browser lab.” Paste the path into the chat.",
      "[Sources]\nSynthetic repository evidence: validated capture summary, independent grade, fixed-evidence manifest, and release-ledger limitations.\n[/Sources]"
    ],
    "sayAt": {"1": [0], "2": [1], "4": [2], "8": [3]},
    "ask": [
      {
        "at": 0,
        "text": "Which answer goes in the board pack now?",
        "options": [
          "Export tables",
          "Approved views",
          "Neither yet"
        ],
        "expected": "No single right option: take two reasons (view, definition, lock or test), then press on."
      }
    ],
    "expectedAudience": [
      "Views' values only with the check beside them; name the three gaps; keep 9 of 9 apart from the AI."
    ],
    "revealOrder": [
      "Vote: Which answer goes in the board pack now?",
      "Truth chart: export tables vs approved views = database check",
      "Known gaps; 9 of 9 tests the setup, not the AI",
      "Verdict: limited pilot, not signed off; closing sentence; materials. Stop at 75:00."
    ],
    "cut": "Under 60 seconds: chart, three gaps, verdict, closing sentence, stop at 75:00.",
    "appendixRoutes": [
      "appendix-architecture",
      "appendix-semantic-contract",
      "appendix-fix",
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
    "mode": "Appendix",
    "purpose": "The full answer path.",
    "say": [
      "Use for “how do the pieces connect”, “why these tables?” and “do I need two databases?”.",
      "The model is one box in a nine-stop path; every other stop can change the answer.",
      "Two databases keep the comparison legible and avoid a current Ask schema-identity limit; schemas, roles or views in one database work the same way.",
      "The route label names the route, not the model version; it is not a direct Anthropic API run.",
      "This page does not prove current provider availability.",
      "[Sources]\nSynthetic repository evidence: bad/ready schemas, connection definitions, and versioned privilege-check definitions.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
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
    "mode": "Appendix",
    "purpose": "The ending_mrr file, verbatim.",
    "say": [
      "“Show me the actual file.” Eleven lines verbatim from demo/semantic/metrics/ending_mrr.yml; default_period last_complete_quarter answers “Which months?”.",
      "aggregation: snapshot is the blank the export-table run got wrong.",
      "Of the compiler's outputs, only metrics and verified pairs reach Ask generation.",
      "[Sources]\nSynthetic repository evidence: versioned semantic YAML, compiler manifest, and generated consumers. dbt Labs, dbt Semantic Layer, https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl, accessed 2026-08-23, documentation terms apply.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  },
  "appendix-fix": {
    "clock": {
      "start": "75:00",
      "end": "75:00",
      "budget_seconds": 0
    },
    "mode": "Appendix",
    "purpose": "A fix in four files.",
    "say": [
      "Thirty seconds: the FOLDLINE trap, on stock. Asked for helmets on hand per month in Q2, an AI adds three month-end counts: Q2 stock = 315. The shelf never held 315; the answer is 110, 95 and 110. The fix: an approved view with readable names, a read-only grant on it, a metric file saying units on hand is never added across months, and a Skill telling Claude to read that file first and query only the views.",
      "If asked: only the grant (2) enforces. The view (1) and the metric file (3) describe; the Skill (4) guides.",
      "If asked which tool: none is required; BigQuery, Snowflake, Databricks or PostgreSQL, with dbt Semantic Layer, Cube, LookML or plain YAML. PostgreSQL starter: data-readiness-kit/builder/.",
      "[Sources]\nSynthetic kit example (bike shop, Harbour store, helmets); original course text.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
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
    "mode": "Appendix",
    "purpose": "Guidance, policy, guard, role.",
    "say": [
      "Use to separate instructions, application policy and least privilege.",
      "The SQL guard is defense in depth; PostgreSQL least privilege is the final boundary.",
      "R02 is a course-policy refusal before any SQL; D01 is a separate forced read that the database itself denied.",
      "If asked: account_key is pseudonymous, not anonymous. Course policy is not imported into Ask.",
      "[Sources]\nSynthetic repository evidence: course-policy cases and versioned PostgreSQL denial-test definitions. PostgreSQL Global Development Group, Privileges, https://www.postgresql.org/docs/current/ddl-priv.html, accessed 2026-08-23, PostgreSQL License.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
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
    "mode": "Appendix",
    "purpose": "Checks and runs, never one score.",
    "say": [
      "Use for “how is it graded” and “is 9/9 the AI score”: no.",
      "Recorded runs: one forced run per case and lane, uncached: an observation, not a benchmark.",
      "Grades behaviour and result, not one exact SQL string.",
      "Evidence level: DB PROOF on the left, MODEL CAPTURE on the right.",
      "[Sources]\nSynthetic repository evidence: sealed nine-case corpus, independent grader output, and release ledger.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
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
    "mode": "Appendix",
    "purpose": "Fixture age and lineage.",
    "say": [
      "Use for fixture age, load delay and lineage questions.",
      "Frozen clock: loaded 2026-07-01 06:00 UTC, evaluated 09:00 UTC. Warn after 36 hours, no hard expiry.",
      "Not a September 2026 freshness claim; the 60-hour scene was a what-if.",
      "[Sources]\nSynthetic repository evidence: dataset manifest, sealed evaluation clock, lineage fields, and freshness contract.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
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
    "mode": "Appendix",
    "purpose": "What reaches Ask generation.",
    "say": [
      "The search-path identifier lives here.",
      "The ready G01 SQL is unqualified; search_path analytics,public resolves it to analytics.mrr_summary_monthly.",
      "40 enrichments are loaded into genCtx, but with retrievedManifest sqlGenerator bypasses buildSchemaContext, so their influence is unproven.",
      "The two panels summarise a local capture from 23 Aug 2026; screenshots are omitted, and the capture never implies current health.",
      "CLAUDE.md guides Claude Code only; course policy is not imported into Ask.",
      "[Sources]\nSynthetic repository evidence: Ask source audit, bridge tests, runtime-status record, and sanitized traces. Anthropic, Manage Claude's memory, https://code.claude.com/docs/en/memory, accessed 2026-08-23, documentation terms apply.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
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
    "mode": "Appendix",
    "purpose": "The four evidence labels.",
    "say": [
      "Labels: MODEL CAPTURE (Recorded AI run), DB PROOF LIVE and DB PROOF REPLAY (Database check); LIVE MODEL is reserved and never invoked.",
      "Forced direct answer (execute=true, highAccuracy=false, history=[], skipClarify=true, uncached), not Ask default behaviour; the default G01 export probe stopped at the ambiguity pre-pass before SQL.",
      "Route: Ask 3210 → openai-compatible → bridge 8789 → claude-cli → PG 55432; the Anthropic model and version are not established.",
      "If asked: the fresh 18-call protocol is NOT RUN 0/18 and the AI deployment is BLOCKED. Verdict code LIMITED PILOT · CITATION GATE RED.",
      "Verified query IDs 1, 2, 3 appear in the ready traces; metric citations are absent in all six runs.",
      "Run envelope: dataset foldline_saas_2026q2 · checksum 55b8975be7ed08e263719485cf0363d4 · loaded 2026-07-01T06:00:00Z · evaluated 2026-07-01T09:00:00Z · captured 2026-08-23. Export: public.monthly_revenue, value and relation fail. Governed: analytics.mrr_summary_monthly, value + relation pass, VQ present.",
      "[Sources]\nSynthetic repository evidence: validated model-observation manifest, sanitized run metadata, and release ledger.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
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
    "mode": "Appendix",
    "purpose": "Primary sources.",
    "say": [
      "Reference only; rights are in research/source-ledger.md.",
      "[Sources]\nSpider 2.0 project, Spider 2.0, https://spider2-sql.github.io/, accessed 2026-08-23; site terms apply and no content is redistributed in the deck. dbt Labs, dbt Semantic Layer, https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl, accessed 2026-08-23; documentation terms apply. Open Data Contract Standard, Standard documentation, https://docs.datacontract.com/open-data-contract-standard, accessed 2026-08-23; documentation terms apply. PostgreSQL Global Development Group, Privileges, https://www.postgresql.org/docs/current/ddl-priv.html, accessed 2026-08-23; PostgreSQL License. NIST, AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, accessed 2026-08-23; U.S. government publication, with no broader reuse claim made here. OpenLineage, Object Model, https://openlineage.io/docs/spec/object-model/, accessed 2026-08-23; documentation terms apply. Direct source and rights-status ledger: research/source-ledger.md. Participant-kit rights status: data-readiness-kit/ASSET-RIGHTS.md. Deck asset rights status: facilitator/asset-provenance.md.\n[/Sources]"
    ],
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Complete on entry"
    ],
    "cut": "Return to the calling scene.",
    "appendixRoutes": []
  }
});
