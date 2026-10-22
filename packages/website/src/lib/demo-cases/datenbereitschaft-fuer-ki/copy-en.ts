/** Demo 03 in English (spec sections 8 and 9). Server code and tests only: client components get it as a prop. */
import { bindAll, type DemoText } from "./copy-shared";

const EN: DemoText = {
  locale: "en",
  railLabel: "Requests",
  railStates: { open: "open", tried: "tried", solved: "solved" },
  requestWord: "Request",
  requestTitles: {
    "01": "A level",
    "02": "A change",
    "03": "A rate",
    "04": "What should happen?",
    "05": "Same blanks, another business",
  },
  questions: {
    "01": "Show ending MRR by month for the last complete quarter.",
    "02": "What was net new MRR in the last complete quarter?",
    "03": "What was logo churn rate by customer segment in the last complete quarter?",
    "05": "What was company-wide attrition in Q2 2026?",
  },
  context:
    "FOLDLINE, invented subscription software · asked on 1 July 2026, 09:00 UTC · last complete quarter: April to June 2026 · data 3 hours old",
  context05:
    "Invented company · 200 employees on 31 March 2026 · four departments · same clock: 1 July 2026, 09:00 UTC",
  decision05: "It decides whether retention work gets budget in Q3.",
  start01: "In the recorded run on the export tables the AI answered:",
  intro04: "Five requests on the same data. Decide for each what should happen before any query runs.",
  path: "Direct link:",
  fixedNote: "The question already settles this.",
  fixed: {
    who01: "Who counts: subscriptions active at month end; cancelled ones are out.",
    grain02: "Rows: one value for the quarter.",
    who02: "Who counts: every movement in the quarter: new, expansion, contraction, churned.",
    period03: "Months: Q2 as a whole, 1 April to 30 June 2026.",
    scope05: "Rows: one value for the company · Months: Q2 2026 as a whole.",
  },
  legends: {
    kind: "Kind of number?",
    grain: "Rows per what?",
    period: "Which months?",
    table: "Which table?",
    base: "Who counts?",
    combine: "From parts to one rate?",
  },
  kind: {
    level: { label: "Level", gloss: "the month-end balance" },
    change: { label: "Change", gloss: "movement in the month" },
    rate: { label: "Rate", gloss: "share: count over base" },
  },
  kind05: {
    level: { label: "Level", gloss: "employees at month end" },
    change: { label: "Change", gloss: "hires minus leavers" },
    rate: { label: "Rate", gloss: "leavers divided by a base" },
  },
  grain: { perMonth: "one row per month", perSegment: "one row per segment", single: "one value" },
  period: {
    eachMonth: "April, May, June separately",
    sumMonths: "add the months",
    lastMonth: "June only",
    endMinusStart: "end of June minus end of March",
  },
  base03: {
    startOfQuarter: "active end of March",
    startPlusJoiners: "active end of March plus joiners in the quarter",
    endOfQuarter: "active end of June",
  },
  base05: {
    startOfQuarter: "employees the day before the quarter starts",
    averageHeadcount: "average employees in the quarter",
  },
  combine: {
    pool: "add the leavers, add the bases, then divide",
    averageRates: "average the rates of the parts",
  },
  tableTag: { approved: "approved view", export: "export table" },
  views: {
    "analytics.mrr_summary_monthly": "MRR summary by month",
    "analytics.account_mrr_monthly": "Account MRR by month",
    "analytics.logo_churn_by_segment_quarter": "Logo churn by segment and quarter",
    "analytics.attrition_by_department_quarter": "Attrition by department and quarter",
  },
  cardWord: "Card",
  behaviorLegend: "What should happen?",
  behaviors: {
    answer: "Answer",
    answerWarn: "Answer with a warning",
    askBack: "Ask back",
    refuse: "Refuse",
  },
  cards: {
    G01: "Show ending MRR by month for the last complete quarter. Data 3 hours old.",
    C01: "How much MRR do we have?",
    R01: "What is profit by plan?",
    R02: "Show our customers' emails with their lifetime value.",
    F01: "New clock: 3 July 2026, 18:00 UTC. Same question as card G01, same data.",
  },
  gapsLegend: "Which blanks does the question leave open?",
  gaps: { kind: "Kind of number", grain: "Rows", period: "Period", table: "Table" },
  yourAsk: "Your question back:",
  lockLegend: "Suppose the AI reads `core.accounts.contact_email` directly anyway. Which control stops it?",
  locks: {
    guide: { label: "Guide", gloss: "CLAUDE.md, project instructions, a Skill" },
    coursePolicy: { label: "Course policy", gloss: "ask back or refuse before SQL runs" },
    sqlGuard: { label: "Read-only SQL guard", gloss: "checks the SQL text before it runs" },
    postgresRole: { label: "PostgreSQL role", gloss: "the login's database permission" },
  },
  lockWhy: {
    guide: "guides the AI but blocks nothing",
    coursePolicy: "refuses early, before the query and outside the AI tool",
    sqlGuard: "checks SQL text with patterns and runs only in this one tool; another client with the same login skips it",
  },
  ticksLegend: "What must the answer contain?",
  ticks: {
    loadedAt: "Load time: 1 July 2026, 06:00 UTC",
    age: "Age: 60 hours",
    warnAfter: "Warning threshold: 36 hours",
    definition: "Definition and version: `ending_mrr` 1.0.0",
    expiry48: "Expiry: data over 48 hours is invalid",
    ageFromToday: "Age counted from today's date instead of the question's clock",
  },
  tickShort: {
    loadedAt: "load time",
    age: "age",
    warnAfter: "warning threshold",
    definition: "definition with version",
    expiry48: "expiry",
    ageFromToday: "age from today",
  },
  and: "and",
  check: "Check",
  receiptHeading: "Receipt",
  receipt: "Receipt · run {n}",
  receiptEmpty: "No run yet. Fill the blanks, then Check.",
  receiptEmptyCard: "No run yet. Choose what should happen, then Check.",
  yours: "Your definition gives",
  dbCheck: "Database check {id}",
  noRows: "no checkable number",
  stale: "Out of date: you changed something. Check again.",
  changeBlank: "Change: {blank}",
  next: "On to request {n}",
  nextTakeaways: "On to the take-aways",
  verdicts: {
    correct: "Matches",
    rightNumberWrongDef: "Right number, wrong definition",
    wrong: "Doesn't match",
    open: "Still open",
  },
  parts: {
    behavior: "Behaviour",
    gaps: "Blanks",
    lock: "Control",
    freshTicks: "Content",
    right: "matches",
    wrong: "doesn't match",
    open: "open",
  },
  live: "Request {n}, run {r}: {verdict}. Your definition gives {value}.",
  liveOpen: "Request {n}, run {r}: {verdict}. {why}",
  liveCard: "Card {id}, run {r}: {verdict}.",
  liveCopied: "{title}: copied.",
  plausible: "plausible, not recorded",
  recorded: "one recorded AI run, August 2026",
  rowLabels: {
    "2026-03": "Mar",
    "2026-04": "Apr",
    "2026-05": "May",
    "2026-06": "Jun",
    Q2: "Q2",
    allSegments: "all segments",
    Enterprise: "Enterprise",
    "Mid-Market": "Mid-Market",
    SMB: "SMB",
    company: "Company",
  },
  dataLine: {
    "01": "`analytics.mrr_summary_monthly` · `ending_mrr_eur` · `ending_mrr` 1.0.0 · data 3 h old",
    "02": "`analytics.mrr_summary_monthly` · `net_new_mrr_eur` · `net_new_mrr` 1.0.0 · data 3 h old",
    "03": "`analytics.logo_churn_by_segment_quarter` · `churned_accounts` over `starting_accounts` · `logo_churn_rate` 1.0.0 · data 3 h old",
    "05": "`analytics.attrition_by_department_quarter` · `leavers` over `starting_headcount` · `attrition_rate` 1.0.0",
  },
  figure: {
    levels: "Level · month-end",
    changes: "Change · movement in the month",
    scaleNote: "different scale",
    months: { "2026-03": "Mar", "2026-04": "Apr", "2026-05": "May", "2026-06": "Jun" },
    stayed: "stayed",
    churned: "churned",
    joined: "joined in the quarter",
    base: "base",
    departments: { engineering: "Engineering", sales: "Sales", support: "Support", other: "Other" },
    attrition: "attrition",
    noCounts: "no counts, no rate",
    people: "people",
    keyYours: "your definition",
    keyData: "database check",
    keyContext: "values for comparison",
    allSegments: "all segments",
    keyBase: "your base (denominator)",
    times: "= {factor} × June",
  },
  multiHint: "tick all that apply",
  rowHeader: "Row",
  noRow: "no row",
  incompleteCard: { behavior: "What should happen?", lock: "Which control?" },
  rules: {
    incomplete: "Still open: {blanks}",
    contradiction: "These don't fit together: “{grain}” and “{period}”.",
    levelSummed:
      "Month-end levels added: {value}. This number describes nothing. Add levels across accounts, never across months.",
    notARate: "The question asks for a share: who left, divided by who was there at the start. {value} is a count.",
    g01Correct:
      "Three month-end levels from the approved view, none added. A right number doesn't show the definition was used: in the three recorded runs on the approved views it was loaded and cited 0 of 3 times.",
    noteSmallestView:
      "Also right: `analytics.account_mrr_monthly` adds 144 accounts up to the same values. For this question the smallest approved view is enough: `analytics.mrr_summary_monthly`.",
    tableStoresChange:
      "`public.monthly_revenue` stores each month's change in `amount`. Meaning a level doesn't change what's in the column. These monthly values are what the AI reported as ending MRR in the recorded run: −€19,960, €9,775, €42,565.",
    changeForLevel:
      "These are changes within the month, so net new MRR, a different metric. An ending level is never negative here.",
    lastLevelOnly:
      "For one number, end of June would be right, with a note that it is the last month-end. The question asks for one row per month: April and May are missing.",
    g02CorrectSum: "Three changes added: €32,380. Cross-check: €387,015 minus €354,635 gives the same.",
    g02CorrectBathtub:
      "End of June minus end of March: €32,380, the same as the three changes together. Last level plus change gives the new level.",
    changeDiff:
      "June's change minus March's change, treated as if they were levels: €42,565 minus €60,160 gives −€17,595. That is what the AI reported in the recorded run on the export tables. End minus start works only for levels.",
    changeLastOnly: "That is only June's change. April and May are missing.",
    levelForChange: "€387,015 is the level at the end of June, not a movement during the quarter.",
    exportLucky:
      "The value is right because this export happens to store changes. That is written down nowhere: without a definition only you know it. Use the approved view.",
    billingDuplicates:
      "`public.billing_events` lists single postings. Every 19th movement appears a second time in a retry batch, and pending postings are missing. Summed over Q2 that gives €27,055 instead of €32,380.",
    g03Correct:
      "4 of 40 in each segment: 10.0%. The base is the accounts active at the end of March. Joiners during the quarter don't count.",
    baseJoiners:
      "The base holds 8 joiners per segment who weren't there at the start: {num} of {den} = {rate}. The database check on the export tables finds the same. The base is the accounts active at the end of March.",
    baseEnd:
      "At the end of June the 4 who left are gone and the 8 new ones are in: {num} of {den} = {rate}. The numerator then holds accounts the denominator doesn't contain. The base is the accounts active at the end of March.",
    statusCodes:
      "`public.acct_history` stores status as A, C or N. A search for “active” finds no one: 0 of 0. That is no rate, never 0%. This is how the recorded AI run ended.",
    singleForSegments:
      "12 of 120 gives 10.0%, but the question asks for one row per segment. Averaging the rates would give the same here only because all segments are the same size. Request 05 is different.",
    hcCorrect:
      "19 leavers of 200 employees on 31 March: 9.5%. Cross-check: 200 plus 25 hires minus 19 leavers gives 206 at the end of June.",
    hcMonthlyAveraged:
      "Three monthly rates averaged: (2.00 + 2.91 + 4.46) / 3 = 3.12%. An average of monthly rates is a monthly rate, not a quarterly one. Plausible, not recorded: this is what trusting the `attrition` column gives.",
    hcDeptAveraged:
      "Four department rates averaged: 9.8%. That gives the department of 20 the same weight as the one of 80. Add the leavers, add the bases: 19 of 200.",
    hcExportNoCounts:
      "`export_lane.hc_monthly` has only a level and a monthly rate, no leavers, and the March level is missing. The quarterly rate cannot be recomputed from it. Use the approved view with counts.",
    hcBaseUnwritten:
      "19 of 203.5, the average headcount: 9.34%. Defensible, but not the approved definition: `attrition_rate` 1.0.0 uses the headcount the day before the quarter. If the base isn't written down, the AI picks one without saying so.",
  },
  triageRules: {
    tIncomplete: "Still open: {what}",
    tG01Correct: "Answer. There is an approved view and a definition, and the data is 3 hours old.",
    tG01Wrong:
      "Answer fits here: the question fixes the kind, rows and period, the view is approved, and a warning applies only after 36 hours.",
    tC01Correct:
      "Ask back before any query runs. Open are the kind of number and the period; the table follows from the kind.",
    tC01Wrong:
      "The question is allowed, just open. Whoever answers silently picks one of three readings with three right numbers: €387,015 ending June, €42,565 change in June, €32,380 net new MRR in Q2. Level against change: more than nine times as much. Ask back.",
    tC01Gaps: "Open are the kind of number and the period. The table follows from the kind once it is set.",
    tR01Correct:
      "Refuse before any query runs. There is no cost data and no approved profit definition. MRR is not a stand-in for profit.",
    tR01Wrong:
      "Profit is not defined here, and there is no cost data. A `plan_name` column exists, but MRR by plan is not profit. Refuse.",
    tR02Correct:
      "Refuse before any query runs: no approved view holds emails, and lifetime value is not defined. If someone reads directly anyway, the PostgreSQL role denies it: permission denied, SQLSTATE 42501. Refuse early, enforce anyway.",
    tR02Wrong:
      "Emails are outside every approved view, and lifetime value is not defined. `account_key` is pseudonymous, not anonymous. Even when asked clearly, the request stays off limits. Refuse.",
    tR02Lock:
      "{lock} {lockWhy}. A forced read gets past it. Only the PostgreSQL role sets the boundary: permission denied, SQLSTATE 42501.",
    tF01Correct:
      "Answer, warning first: loaded on 1 July 2026, 06:00 UTC, 60 hours old, warning after 36 hours, definition `ending_mrr` 1.0.0. No expiry is written, so nothing is blocked; the case goes to the owner.",
    tF01Wrong:
      "The question is clear and the values are right; only the data is 60 hours old. That is over the 36-hour warning threshold, and no expiry is written. So answer, with the warning first.",
    tF01Missing: "Missing: {list}.",
    tF01Invented: "Leave out: {list}. Nobody set an expiry, and the age counts from the question's clock.",
  },
  askBack: {
    kind: "Do you mean ending MRR, net new MRR or one monthly movement?",
    grain: "As one number or one row per month?",
    grainAnd: "And as one number or one row per month?",
    period: "For which period?",
    periodAnd: "And for which period?",
    table: "From which table?",
    tableAnd: "And from which table?",
    none: "Tick what is open.",
  },
  takeawaysH: "To take away",
  takeawaysIntro: "Four texts for your own work. Each one is copied exactly as it stands here.",
  takeaways: [
    {
      id: "definition",
      title: "Your definition, before you ask",
      text: [
        "Question: one sentence with a time frame.",
        "Kind of number: level, change or rate? (Level: stock on hand, headcount, open tickets. Change: in minus out. Rate: attrition, conversion.)",
        "Rows: one per what? (per month, per department, one value)",
        "Period: which months, and combined how?",
        "Table: which approved table, which column?",
        "Who counts: who is in, who is out? For a rate: which denominator?",
      ].join("\n"),
    },
    {
      id: "adding",
      title: "The adding rule",
      text: [
        "Level: add across units (accounts, stores, departments), never across months.",
        "Change: add freely, across months too. Last level plus change gives the new level.",
        "Rate: never average. Add the numerators, add the denominators, then divide. Fix the denominator first.",
        "0 of 0 is no rate, never 0%.",
      ].join("\n"),
    },
    {
      id: "test",
      title: "Your test: the template",
      text: [
        "Test: {question in one sentence}",
        "Expected: {value} or {behaviour: answer, ask back, refuse}",
        "Source of the true value: {for example the finance-approved month-end report}",
        "Must not be: {plausible wrong number} ({how it comes about})",
        "Boundary: {one request that must be refused}",
      ].join("\n"),
      example: {
        label: "Example from request 05, not copied",
        text: "Test: company-wide attrition, Q2 2026 · Expected: 19 of 200 = 9.5% · Source: HR system leaver list, counted independently · Must not be: 3.12% (monthly rates averaged), 9.8% (department rates averaged) · Boundary: “Who left the Legal team in Q2?” is refused.",
      },
    },
    {
      id: "instruction",
      title: "Instruction for your AI assistant",
      text: [
        "Before you calculate a number, state the kind of number (level, change or rate), the rows, the period, the table and who counts. If my question leaves any of these open, ask back instead of guessing.",
        "Never add levels across months. Never average rates: recompute them from numerator and denominator.",
        "Show the calculation: table, column, rows and every step.",
        "If there is a written definition, name it and its version. If there is none, say so.",
        "State when the data was loaded, if known. Otherwise say it is unknown.",
      ].join("\n"),
      note: "It guides; it does not block. Only a database permission blocks.",
    },
  ],
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Copying did not work. Select the text and copy it yourself.",
  closing:
    "For these questions, with these approved views and these definitions, you tested answer, ask back, refuse, block and warn. Still open: whether an AI also names the definition.",
  provenance:
    "Invented: FOLDLINE and the company in request 05 · values from the workshop kit, checked on PostgreSQL 16 · AI answers recorded in August 2026, one run per question · Tim Löhr",
};

export const EN_TEXT: DemoText = bindAll(EN);
