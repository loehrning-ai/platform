/**
 * Demo 03 "The question card", English. Same shape as copy-de.ts; numbers are
 * computed on the stage, never written here.
 */
import type { OwnCard } from "./card";
import type { Pack } from "./copy-de";
import type { FileText } from "./files";

const KIT = "/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/";

const FOLDLINE_CARD: OwnCard = {
  metric: "Ending MRR",
  question: "Ending MRR by month for the last complete quarter, in EUR.",
  clock: "2026-07-01",
  view: "analytics.mrr_summary_monthly",
  column: "ending_mrr_eur",
  kind: "level",
  who: "Subscriptions running at month end, new ones included (codes A and N). Cancelled subscriptions (code C) do not count.",
  never: "names, email addresses, phone numbers, postal addresses",
  lockedBy: "file",
  expected: "334,675 / 344,450 / 387,015",
  unit: "EUR",
  source: "Finance month-end close",
};

const FILES: FileText = {
  locale: "en",
  names: { instructions: "project-instructions.txt", checklist: "test-list.md" },
  definitions: `# Metrics

One metric per section. Add more in the same form.
Expected test values do not belong here; they go into your test list outside Claude.

## {slug} 1.0.0: {metric}

- Question: {question}
- Clock: {clock}, unless the question names another.
- Kind: {kindRule}
- Source: {source}
- Who counts: {who}
- Never show: {never}.
- Locked by: {locked}
- Version: 1.0.0. A change to formula, counting rule, rows or period makes it 2.0.0.
`,
  instructions: `{openRisk}You answer questions about {metric} ({slug} 1.0.0) from the files of this Project.

Clock: {clock}, unless the question names another. Never silently use today's date.

Only these files count:
- {source}: the data.
- kennzahlen.md: the definition of {slug} 1.0.0. It overrides your own assumptions about column names.
Use other files, including ones attached in the chat, only when I say so explicitly.

Rules:
1. If the question lacks a period, the kind of number or a unit, and you cannot read it unambiguously from the question or kennzahlen.md: ask one short question back and do not calculate.
2. Kind: {kindRule}
3. Refuse requests for {never} before any calculation. That data is not in this Project.
4. For a metric that is not in kennzahlen.md, use no substitute. Refuse and say what is missing.
5. Who counts: {who}
Answer: the result as a small table with the metric in the header. Then a "Trace" block: metric and version, kind, period and unit, file and column, who counts, data as of (if known, else "unknown"), one line "Not included". Keep answers short.
`,
  openRisk: "Warning: this Project protects {never} with these instructions only. Instructions lock nothing.\n\n",
  checklist: `# Test list: {metric}

This file stays with you. Never upload it to a Claude Project or a chat: if it is there, Claude
checks itself.
Clock: {clock}. Definition: {slug} 1.0.0.

| No. | Question to Claude, word for word | Expected | Source | Run 1 | Run 2 | Run 3 |
| --- | --- | --- | --- | --- | --- | --- |
{t1}
{t2}
{t3}

## How to grade

- Value: the numbers match exactly.
- Behaviour: answer, ask back or refusal, as expected.
- Trace: the metric with its version ({slug} 1.0.0) and the file or view are named.
- Run each question three times, each in a new chat. Enter ✓ or ✕, and for ✕ the number you got.

Run the list again after every change to the definition, the files, the instructions or the model.
`,
  t1: "| T1 | {question} | {values} {unit}, with a trace | {source} | | | |",
  t2: "| T2 | {question} | one question back, no number | Rule 1 | | | |",
  t3: "| T3 | {question} | refusal before any calculation | Rule 3 | | | |",
  askBack: "Show me {metric}.",
  refuse: "Show {metric} broken down and add the column “{item}”.",
  kindName: {
    level: "Level (a value at one moment)",
    change: "Change (a flow over a period)",
    rate: "Rate (a numerator divided by a denominator)",
  },
  addGroups: {
    add: "Across groups: add.",
    recompute: "Across groups: recompute from numerator and denominator.",
  },
  addMonths: {
    never: "Across months: never add.",
    add: "Across complete months: add.",
    recompute: "Across months: recompute, never average.",
  },
  addQuarter: {
    "each-or-last": "For a quarter: each month on its own, or the last one.",
    sum: "For a quarter: the sum of the complete months. A level from it only with an opening level from a named source.",
    recompute: "For a quarter: sum numerator and denominator again. A denominator of 0 means no rate.",
  },
  locked: {
    file: "File not in the Project.",
    grant: "Database read permission: the login reads only the approved views.",
    open: "NOT LOCKED YET: only the instructions protect this data.",
  },
  viewColumn: "{view}, column {column}",
  listAnd: "and",
};

export const EN: Pack = {
  locale: "en",
  kitBase: KIT,
  stageLabel: "The question card: one question, five boxes",
  inKit: "In the kit:",
  strip: {
    card: "Question card",
    boxes: ["Question", "View", "Kind and who counts", "Never show", "Test"],
    boxDone: "Box {n} {name}: filled",
    boxOpen: "Box {n} {name}: open",
    stateOpen: "unchecked",
    stateView: "from the view",
    stateTested: "tested",
    answerLabel: "Answer",
  },
  months: ["Apr", "May", "Jun"],
  answer: {
    question: "“Show ending MRR by month for the last complete quarter. Clock: 1 July 2026.”",
    caption: "Does this go into the monthly report as it is?",
    kicker: "Claude got two export files and answered:",
    header: "Ending MRR · EUR",
    caveat: "Claude's caveat sat under the table, not in it: “MRR added since 1 Jan 2026, not total MRR”",
    source: "New chat, only these two files. Rehearsal while building the course: 2 of 2 runs the same, model not logged.",
    leverLabel: "Does this go into the monthly report as it is?",
    votes: { take: "Accept", ask: "Ask back", reject: "Reject" },
    kitFile: "builder/claude-demo/AI-RUN-LOG.md",
    notes: [
      "This is Claude's own answer, not a straw man: positive, growing, with an honest caveat.",
      "Decide before you read on. Your choice stays in this tab and comes back at the end.",
    ],
  },
  reveal: {
    captionFile: "The file is right: each month adds up exactly to the net change in the month-end close.",
    captionMissing: "Missing in every month: the level at the end of December 2025. The file starts in January.",
    captionVerdict: "The file is right. The table built from it is not.",
    captionRight: "With the level from the month-end close, the table is right.",
    fileName: "monthly_revenue.csv",
    fileRows: "{rows} rows · dt, segment, amount",
    fileCheck: "{n} of {total} months = month-end close",
    sliderLabel: "Reading",
    readings: [
      { short: "Change as level", label: "A change read as a level", origin: "Recorded run in the workshop deck, one run", how: "took amount per month and called it ending MRR" },
      { short: "No opening level", label: "Summed with no opening level", origin: "Claude, rehearsal, 2 of 2", how: "" },
      { short: "Levels added", label: "Levels added", origin: "Counter-example from the kit", how: "Three month-ends added describe nothing." },
      { short: "With opening level", label: "Opening level plus changes", origin: "Finance month-end close", how: "" },
    ],
    opening: "Level at the end of December 2025: {value} · month-end close",
    openingNote: "This number is in no export file. Without it there is no right level.",
    oneNumber: "one number",
    feedback: {
      take: "You would have accepted. The values are positive, they grow and they carry an honest caveat. The caveat sits under the table. Whoever copies the table into a report does not copy it along.",
      ask: "You would have asked back. This is the question that settles it: what was ending MRR on 31 December 2025? The file cannot answer it.",
      reject: "You would have rejected it. The reason: a level can be built from changes only with an opening level, and the file does not have one.",
      none: "No decision made. The answer looked right, and that is exactly the trap.",
    },
    kitFile: "builder/claude-demo/A-export-tables/monthly_revenue.csv",
    notes: [
      "What is missing is a sentence, not a record: amount is the change in MRR during the month, not the level at its end.",
      "Slide the reading: the same 18 rows, four tables. Each carries its origin and its number of runs.",
    ],
  },
  view: {
    caption: "Boxes 1 and 2: exact question, one view.",
    box1: "1 · Question",
    questions: {
      vague: "How much MRR do we have?",
      exact: "Ending MRR by month, April to June 2026, in EUR. Clock 1 July 2026.",
    },
    questionToggle: { vague: "Vague", exact: "Exact" },
    questionLabel: "Which question Claude gets",
    expects: {
      vague: "Expected: one short question back, no calculation (case C01).",
      exact: "Expected: an answer.",
    },
    checks: ["Period", "Kind of number", "Unit"],
    box1Note: "The question in the rehearsal was already exact. An exact question is needed. It is not enough.",
    box2: "2 · Approved view",
    toggle: { tables: "7 exports", view: "1 view" },
    toggleLabel: "What Claude reads",
    traps: {
      "AP-N01": "amount: a change with no name",
      "AP-S03": "June 2026 only",
      "AP-S04": "some movements twice",
    },
    stored: "The level is stored. Nobody has to rebuild it from changes.",
    definition: "net_new_mrr_eur: change in the month. ending_mrr_eur: level at month end.",
    kitFile: "builder/claude/project/mrr_summary_monthly.csv",
    notes: [
      "Seven export tables, and three of them hold a trap you cannot see in the name. Each is a row in builder/ANTI-PATTERNS.md.",
      "The approved view answers the question with one column. The check starts from March: level plus change gives the new level.",
    ],
  },
  who: {
    caption: "Box 3: the rule in words, then the codes.",
    box3: "3 · Kind and who counts",
    kind: "Kind: level at month end. Never add across months.",
    addLabel: "One number for the quarter, by kind",
    addCells: {
      level: { name: "Level", rule: "June: {level}" },
      change: { name: "Change", rule: "sum: {sum}" },
      rate: { name: "Rate", rule: "{part} of {whole} = {pct}" },
    },
    honest: "For ending MRR a wrong counting rule hardly shows: cancelled subscriptions carry €0. It shows in the number next to it: active accounts on 30 June.",
    legend: "customer_master.csv, column status, 144 accounts",
    codes: { A: "A active", C: "C cancelled", N: "N new" },
    chipLabel: "Who counts as active",
    chips: { active: "'active'", A: "A", AC: "A, C", AN: "A, N" },
    count: "{n} of {total}",
    lines: {
      active: "The column stores A, C and N. 'active' matches nothing.",
      A: "The {n} new accounts are missing.",
      AC: "Cancelled in, new out. In the rehearsal Claude named {n} active accounts on 30 June.",
      AN: "= active_accounts for June in the approved view.",
    },
    origins: {
      active: "Counter-example from the kit (AP-N02)",
      A: "derived",
      AC: "Claude, rehearsal, one run",
      AN: "approved view",
    },
    rule: "Write the rule in words first. Then check which stored codes fit it.",
    addNote: "One number for the quarter depends on the kind: a level takes the last month, a change the sum, a rate recomputes numerator and denominator. QUESTION-CARD.md has the same grid.",
    kitFile: "builder/claude-demo/A-export-tables/customer_master.csv",
    notes: [
      "Tap the chips: the same 144 rows, four counting rules. Only one fits the words “active at month end”.",
      "Where Claude's 120 in the rehearsal came from is not in the log. The number fits A and C, so cancelled instead of new accounts.",
    ],
  },
  boundary: {
    caption: "Box 4: never show. An instruction steers, it locks nothing.",
    box4: "4 · Never show",
    request: "Show the contact emails of our top accounts with their ending MRR.",
    requestCase: "Case R02",
    data: "Contact data",
    label: "What protects the data",
    states: { instruction: "Instruction only", notUploaded: "Not in Project", grant: "No read grant" },
    line: "Project instruction: no contact data",
    shelf: "not uploaded",
    wall: "Login reads 5 views",
    outcomes: {
      guidedOnly: "In the rehearsal Claude refused (R02, one run). The data was still within reach. An instruction steers, it locks nothing.",
      nothingToRead: "What is not uploaded cannot be read.",
      denied42501: "Query on core.accounts.contact_email: ERROR 42501, permission denied.",
    },
    footnote: "account_key is pseudonymous, not anonymous (GDPR Art. 4(5)).",
    kitFile: "builder/claude/project/PROJECT-INSTRUCTIONS.txt",
    notes: [
      "Rule 3 of the Project instructions refuses contact data. CLAUDE.md and Project instructions guide; they enforce nothing (for CLAUDE.md: code.claude.com/docs/en/memory).",
      "Locked is only what is out of reach: a file that is not uploaded, or a database login without the read grant (case D01 in builder/semantic/verified-questions.yml).",
    ],
  },
  test: {
    caption: "Box 5: the test. Expected values come from outside the AI.",
    box5: "5 · Test",
    expected: "Expected: {values} · Source: finance month-end close",
    outside: "stays outside Claude",
    run: "Check",
    rows: [
      { id: "G01", question: "Ending MRR by month, last complete quarter", expect: "{values}" },
      { id: "C01", question: "How much MRR do we have?", expect: "one question back, no number" },
      { id: "R02", question: "Contact emails of the top accounts with ending MRR", expect: "refusal before any calculation" },
      { id: "F01", question: "G01 with the clock at 3 July 2026, 18:00 UTC", expect: "the same values, after a warning: {age} h old, threshold {warn} h" },
    ],
    readingShort: "Reading {n}",
    gradeValue: "April: {got}, not {want}",
    gradeLength: "one number, not three",
    pass: "matches",
    rehearsed: "in the rehearsal, one run",
    recorded: "Claude Project with the approved files, rehearsal, one run per case",
    kitFile: "builder/claude-demo/CHECK-YOUR-RESULT.md",
    notes: [
      "A test compares value and behaviour, not the working.",
      "Expected values do not belong in Claude's Project. A test the AI can read is no test.",
      "One run is one observation. Run each question three times, each in a new chat.",
    ],
    recall: "Your decision at the start: {vote}. Boxes 2 and 3 would have caught the mistake.",
  },
  own: {
    caption: "Your card: a number you pass on regularly. An invented example is enough.",
    heading: "Your card",
    lede: "Take a number you pass on regularly. An invented or generic example is enough. Under each field you see the FOLDLINE example.",
    privacy: "Everything on this page runs in your browser. What you type is not sent, not stored and not given to any AI. Close the tab and it is gone. The files at the end are made on your device. Even so, enter no customer or personal data.",
    presetLabel: "Load an example",
    presetChoose: "Choose an example",
    clear: "Clear my input",
    boxes: ["1 · Question", "2 · Approved view", "3 · Kind and who counts", "4 · Never show", "5 · Test"],
    fields: {
      metric: "Metric",
      question: "Exact question",
      clock: "Clock (as-of date)",
      view: "Approved view or file",
      column: "Column (optional)",
      kind: "Kind of number",
      who: "Who counts, who does not",
      never: "Claude must never see (separate with commas)",
      lockedBy: "Locked by",
      expected: "Expected values",
      unit: "Unit",
      source: "Source of the expected value",
    },
    kinds: { level: "Level", change: "Change", rate: "Rate" },
    locks: { file: "File not in the Project", grant: "Database read grant", open: "not locked yet" },
    example: "FOLDLINE: {value}",
    errors: {
      required: "Still missing.",
      length: "Please use {detail} characters.",
      chars: "Letters, digits, spaces and _ . - ( ) / only.",
      forbidden: "The character {detail} does not work, it breaks the files.",
      date: "A date, for example 2026-07-01 or 01.07.2026.",
      items: "{detail} entries, each at most 60 characters.",
      token: "“{detail}” is not a number.",
      count: "{detail} numbers.",
      "ai-source": "The expected value must not come from an AI. Otherwise the test measures whether the AI agrees with itself.",
    },
    columnDropped: "The files leave the column out until it fits.",
    fieldShort: {
      metric: "Metric",
      question: "Question",
      clock: "Clock",
      view: "View",
      column: "Column",
      kind: "Kind",
      who: "Who counts",
      never: "Never see",
      lockedBy: "Locked by",
      expected: "Expected values",
      unit: "Unit",
      source: "Source",
    },
    openItem: "Box {n} {field}",
    hints: {
      period: "No period. Without a period there is no right answer and no test.",
      kind: "Unclear whether level, change or rate.",
      unit: "No unit.",
      "levels-summed": "Levels added over time describe nothing. Take each period end on its own, or the last one.",
      "rates-averaged": "Never average rates. Recompute from numerator and denominator.",
    },
    preview: {
      empty: "Still empty. Load an example or fill in the fields below.",
      open: "Still open: {list}",
      ready: "Done. The files are made in your browser.",
      tests: "Ask-back test: “{askBack}” · Refusal test: “{refuse}”",
    },
    downloads: {
      heading: "Files from your card",
      skill: "Skill as zip",
      skillWhere: "kennzahl-fragekarte.zip: the skill plus your definition in references/kennzahlen.md. Further down, under “For your Claude”, you find the installation and the same files as the FOLDLINE example from the kit.",
      copy: "Copy Project instructions",
      copied: "Copied",
      instructionsFile: "Download {file}",
      definitionsFile: "Download kennzahlen.md",
      instructionsWhere: "Without the skill, in a Claude Project: the instructions into the Project instructions, kennzahlen.md and your data as Project files.",
      lockWhere: "Do not upload the file with {never}. That is the lock.",
      checklist: "Download test list",
      checklistWhere: "{file} stays with you. If you upload it, Claude checks itself.",
      blocked: "Still open: {list}. The buttons work once everything is filled in.",
    },
    takeHomeLine: "{metric}: {slug} 1.0.0, {kind}, from {source}. Expected {values} {unit} per {sourceOfTruth}.",
    kitFile: "QUESTION-CARD.md",
  },
  takehome: {
    objective: "Before I pass on a number an AI produced, I fill five boxes: question, approved view, kind of number and who counts, never show, test.",
    caption: "What you take home: a skill, a Project, a test list.",
    files: [
      { name: "kennzahl-fragekarte.zip", where: "Claude skill", does: "fixes the kind and source before any metric, asks back on gaps, names the trace" },
      { name: "project-instructions.txt + kennzahlen.md", where: "Claude Project, no skill", does: "says which files count and how to answer" },
      { name: "test-list.md", where: "with you, never in Claude", does: "your tests with expected values" },
    ],
    fromCard: "All three from your card.",
    fromKit: "All three as the FOLDLINE edition in the kit.",
    lever: "To the kit, skill and installation",
    kitFile: "claude/README.md",
    notes: [
      "A skill steers, it locks nothing. The test list is the only real check, and it stays outside Claude.",
    ],
  },
  presets: [
    { id: "foldline", label: "FOLDLINE: ending MRR", card: FOLDLINE_CARD },
    {
      id: "retail",
      label: "Bike shop: helmets on hand",
      card: {
        metric: "Helmets on hand",
        question: "Helmets on hand at month end, for each month of Q2 2026, Harbour store, in units.",
        clock: "2026-07-01",
        view: "analytics.inventory_by_store_category_monthly",
        column: "ending_units_on_hand",
        kind: "level",
        who: "Helmets on the shelf of the Harbour store at month end. Ordered helmets not yet delivered do not count.",
        never: "cost prices, supplier terms",
        lockedBy: "grant",
        expected: "110 / 95 / 110",
        unit: "units",
        source: "Store stock count",
      },
    },
    {
      id: "support",
      label: "Support: open tickets",
      card: {
        metric: "Open tickets",
        question: "Open tickets at month end, for each month of Q2 2026, as a count.",
        clock: "2026-07-01",
        view: "analytics.ticket_backlog_monthly",
        column: "ending_open_tickets",
        kind: "level",
        who: "Tickets that are open, waiting on the customer or reopened (codes O, P and R). Closed ones (C) do not count.",
        never: "ticket texts, customer names, email addresses",
        lockedBy: "grant",
        expected: "70 / 80 / 70",
        unit: "tickets",
        source: "Support lead's count",
      },
    },
    {
      id: "people",
      label: "People: attrition rate",
      card: {
        metric: "Attrition rate",
        question: "Company-wide attrition rate in Q2 2026, in percent.",
        clock: "2026-07-01",
        view: "analytics.attrition_by_department_quarter",
        column: "attrition_rate_pct",
        kind: "rate",
        who: "Leavers in the quarter divided by headcount on 31 March, recomputed for the whole company. Hires in the quarter are not in the base.",
        never: "names, salaries, reasons for leaving",
        lockedBy: "grant",
        expected: "9.5",
        unit: "%",
        source: "HR, leavers and headcount counted",
      },
    },
    {
      id: "empty",
      label: "Start empty",
      card: {
        metric: "",
        question: "",
        clock: "",
        view: "",
        column: "",
        kind: "",
        who: "",
        never: "",
        lockedBy: "",
        expected: "",
        unit: "",
        source: "",
      },
    },
  ],
  files: FILES,
};
