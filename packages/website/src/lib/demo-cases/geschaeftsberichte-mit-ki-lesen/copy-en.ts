/**
 * English: every word of "Die Zahl, die trägt". Imported only by server
 * code (copy.ts); the client receives this object as a prop.
 */

import type { NorthwindCopy } from "./copy-types";

export const en: NorthwindCopy = {
  intro: {
    facts: "4 stations · about 10 min · no account",
    half: "This is the half of the workshop without AI; Claude does the other half in the kit.",
    stationsLabel: "Stations",
  },
  stationLinks: {
    bericht: "Report",
    vergleichen: "1 Compare",
    maengel: "2 Defects",
    pruefen: "3 Check",
    entscheiden: "4 Decide",
    mitnehmen: "Take away",
  },
  headings: {
    bericht: "What the report says",
    vergleichen: "1 · Compare",
    maengel: "2 · Defects",
    pruefen: "3 · Check",
    entscheiden: "4 · Decide",
    mitnehmen: "To take with you",
  },
  verdict: { holds: "holds", misleads: "misleads", absent: "not in the data" },
  empty: "Pick an answer.",
  lines: {
    AURA: "AURA",
    CRAFT: "CRAFT",
    ECHO: "ECHO",
    NEST: "NEST",
    BREW: "BREW",
    PULSE: "PULSE",
    BEAM: "BEAM",
    TOTAL: "Company",
  },
  report: {
    figuresLabel: "The three figures the September report opens with",
    figures: [
      { value: "+26%", label: "units vs August", note: "Report, section 1" },
      { value: "€4.12M", label: "CRAFT, on 9,162 units, avg €450", note: "Report, section 2" },
      { value: "23", label: "defect reports on CRAFT, the most of any line", note: "Report, section 3" },
    ],
    quote:
      "CRAFT is our premium cash engine … €4.12M on our thinnest volume proves the appetite is there. Let's move more of Q3's marketing budget behind it … The defects are a manufacturing problem to fix in parallel, not a reason to slow the growth.",
    attribution: "VP of Sales, report section 6, shortened",
    gutLegend: "Your gut call, before you calculate",
    gutNote: "You will see it next to your sheet at the end.",
  },
  decisionLabel: {
    rework: "Rework first, hold the extra budget for one month",
    marketing: "More Q3 marketing now, and fix the defects in parallel",
  },
  decisionShort: { rework: "Rework first", marketing: "More Q3 marketing" },
  compare: {
    legend: "What do you compare a month against?",
    options: {
      "line-month": {
        label: "Each line, September total against August total",
        result:
          "CRAFT\u00a0+22.4%, the company +26.0%. September has five week starts, August four: one extra week alone makes +25%.",
        bridge: "Blank 4 · Compare: each line, September total against August total.",
      },
      "total-week": {
        label: "The whole company, per shipping week",
        result:
          "+0.8% per week. The total hides three lines that shrink per week: PULSE\u00a0−3.5%, CRAFT\u00a0−2.1%, NEST\u00a0−0.4%.",
        bridge: "Blank 4 · Compare: the whole company against the prior month, per shipping week.",
      },
      "line-week": {
        label: "Each line on its own, per shipping week",
        result:
          "Per shipping week, three lines shrink: PULSE\u00a0−3.5%, CRAFT\u00a0−2.1%, NEST\u00a0−0.4%. Section 1 says all seven grew.",
        bridge:
          "Blank 4 · Compare: each line against its own prior month, per shipping week, never the company total alone.",
      },
    },
    headline: {
      "line-month": "Company, September total against August total",
      "total-week": "Company, per shipping week",
      "line-week": "CRAFT, per shipping week",
    },
    report:
      "In the report: +0.8% sits in section 7, at the very end. The +26% sits in section 1. CRAFT's\u00a0−2.1% is nowhere; you calculate it here.",
    figureCaption:
      "Units per week start in the extract, August and September. The week from 30 Sep counts as September although six of its seven days fall in October. Source: demand_actuals.csv, column week_start.",
    figureAug: "August",
    figureSep: "September",
    figureFrom: "from 30 Sep",
    figurePerWeek: "average per week",
    barsHeading: "Units against August",
    barsBasis: {
      report: "How the report calculates: monthly total against monthly total.",
      month: "Monthly total against monthly total.",
      week: "Per shipping week.",
    },
    totalOnly: "The seven lines sit inside this one figure.",
  },
  defects: {
    legend: "What counts as a defect?",
    options: {
      count: {
        label: "Defect reports (NCRs) per line, as a monthly count",
        result:
          "CRAFT 23, NEST 19: 21% more. Raw counts follow volume, and NEST ships 1.8 times CRAFT's units.",
        bridge: "Blank 1 · Defects: defects are production NCRs, per line and month, as a count.",
      },
      per1000: {
        label: "Defect reports (NCRs) per 1,000\u00a0units shipped",
        result:
          "CRAFT 2.51 per 1,000, NEST 1.13: 2.2 times. Counted in production, divided by units shipped, as the report does in section 7.",
        bridge:
          "Blank 1 · Defects: defects are production NCRs, per line and month, compared per 1,000\u00a0units shipped. Not customer returns.",
      },
      returns: {
        label: "Customer returns per line, as the NCR feed counts them",
        result:
          "The NCR feed counts faults in production, before shipping. Returns are linked to no line: this figure does not exist here.",
        bridge: "Blank 1 · Defects: defects are customer returns per line, from the NCR feed.",
      },
    },
    report:
      "In the report: 2.51 against 1.13 in section 7. Section 3 shows only raw counts, and section 6 argues with them.",
    ladderCaption: "Defects per line, September. Source: ncr_records.csv and demand_actuals.csv.",
    ladderScale: {
      count: "Number of reports, 0 to 25",
      per1000: "Reports per 1,000\u00a0units, 0 to 3",
      returns: "Customer returns per line",
    },
    noReport: "no report",
    notInData: "not in the data",
    echo: "no NCR, but an open P2 escalation: battery swelling, PL",
    flagged: "flagged",
    noise: "noise",
    lineHeader: "Line",
    valueHeader: "Value",
  },
  flag: {
    legend: "When do you flag a line before budget flows?",
    markedAbove: "Marked in the ladder above:",
    options: {
      chronic: {
        label: "Highest price band and highest rate, two months running",
        result:
          "Flagged: CRAFT. €199 to €699, 3.21 per 1,000 in August, 2.51 in September, the highest rate both times. The rate falls, the scrap rises: 12.3% of CRAFT units in August, 16.8% in September. At list price that is €691k, 16.8% of CRAFT revenue (1,539 units × €449, the mean of the three list prices); what the units cost is in no file.",
        bridge:
          "Blank 5 · Flag: flag the line with the highest price band and the highest defect rate per 1,000. Two months running: rework first, then budget. The flag is a question, not a verdict.",
      },
      rising: {
        label: "Every line whose defect rate rises against the prior month",
        result:
          "Flagged: AURA, NEST, PULSE. PULSE for 0.70 → 0.71, which is noise. CRAFT goes free because 3.21 falls to 2.51, although 2.51 is the highest rate.",
        bridge: "Blank 5 · Flag: flag every line whose defect rate rises against the prior month.",
      },
      "most-reports": {
        label: "The line with the most reports, two months running",
        result:
          "Flagged: CRAFT, with 24 and 23 reports. Right line, wrong reason: NEST is only four behind with 19 and ships 1.8 times as much. That is how the report argues in section 6. With more NEST volume this rule flags NEST, although CRAFT fails 2.2 times as often per 1,000\u00a0units.",
        bridge: "Blank 5 · Flag: flag the line with the most defect reports, two months running.",
      },
    },
    evidenceRate: "Defects per 1,000\u00a0units",
    evidenceScrap: "Scrap, share of CRAFT units",
    evidenceValue: "Scrap in September, at list price",
    evidenceShare: "of CRAFT revenue",
    falls: "falls",
    rises: "rises",
  },
  bridge: {
    title: "For prompt 2",
    caption:
      "Send prompt 2 first. When Claude asks for blank 1, paste this as your answer. These are your answers, weak ones included: change them above before you copy.",
    disabled: "Station 1 or 2 first.",
    lead: {
      one: "These are my own answers to blank {answered}. Only ask me blanks {rest}.",
      other: "These are my own answers to blanks {answered}. Only ask me blanks {rest}.",
    },
    listAnd: "and",
    limits: {
      marketing:
        "Blank 6 · Limits: name the limit in the same sentence as the number. Still open: margin per line, returns per line, whether marketing moves CRAFT.",
      weeks:
        "Blank 6 · Limits: name the limit in the same sentence as the number. Still open: margin per line, returns per line, whether September had more shipping weeks.",
      rate: "Blank 6 · Limits: name the limit in the same sentence as the number. Still open: margin per line, defects per 1,000\u00a0units, whether marketing moves CRAFT.",
    },
  },
  check: {
    intro:
      "This is what an answer from Claude can look like: number and source. Prepared for this exercise, not every claim holds. Say first what the source shows.",
    group: "What does the source show?",
    truth: { match: "matches", differs: "differs", nowhere: "nowhere" },
    claims: {
      "craft-units": {
        label: "CRAFT units, September",
        source: "Source: demand_actuals.csv, column units_actual",
        result:
          "Matches. 95 CRAFT rows with a September week start, units_actual summed: 9,162. This is the check prompt 3 asks for.",
        total: "Sum of units_actual, 95 rows: 9,162",
      },
      "nest-ncr": {
        label: "NEST defects, September",
        source: "Source: ncr_records.csv, rows with line = NEST",
        result:
          "Differs. September has 19 NEST rows in ncr_records.csv. 12 is the August value: right file, wrong period.",
        total: "NEST rows in September: 19. In August: 12.",
      },
      "craft-revenue": {
        label: "CRAFT revenue, September",
        source: "Source: demand_actuals.csv × product_lines.csv, quantity × list price",
        result:
          "Matches. 95 rows, each quantity × its model's list price: €4,124,238. Calculated, and the source says so. That is how a calculated number may look.",
        total: "Sum over 95 rows: €4,124,238",
      },
      "craft-marketing": {
        label: "CRAFT marketing",
        source: "Source: campaign_master.csv, column budget_eur",
        result:
          "Nowhere. campaign_master.csv has no line column, and its start dates run from 2021 to 2024. €2,032,716 ÷ 7 lines = €290,388: divided, not read, with the right file as the source.",
        total: "Sum of budget_eur, all campaigns 2021 to 2024: €2,032,716",
      },
    },
    echo: {
      same: "You said: {said}. The source agrees.",
      differs: "You said: {said}. The source shows: {truth}.",
    },
    sourceShows: "Source shows {value}",
    sourceNone: "Source shows: no line",
    more: "+ {count} more rows",
    missingColumn: "line?",
    counter: "Checked: {count} of {of}",
    closing: "The source check below asks exactly this: file, column, period, calculated or read.",
  },
  decide: {
    intro: "Six lines for the VP of Sales. Every line has to be in the data.",
    rows: {
      decision: "Decision",
      number: "The number that holds",
      cost: "What being wrong costs",
      open: "What the data leaves open",
      counter: "Strongest counterargument",
      trigger: "When the money flows",
    },
    sheetRows: {
      decision: "Decision",
      number: "The number",
      cost: "Cost of being wrong",
      open: "Open",
      counter: "Counterargument",
      trigger: "Release",
    },
    options: {
      decision: {
        rework: {
          label: "Rework first, hold the extra budget for one month",
          fact: "The workshop decides the same. It only holds with the five lines below.",
          sheet: "rework first, hold the extra budget for one month.",
        },
        marketing: {
          label: "More Q3 marketing now, and fix the defects in parallel",
          fact: "No figure here shows more demand: per shipping week CRAFT ships 2.1% less than in August. One shows the scrap: 16.8% of CRAFT units in September.",
          sheet: "more Q3 marketing now, and fix the defects in parallel.",
        },
      },
      number: {
        "craft-mom": {
          label: "+22.4% more CRAFT units than in August",
          fact: "One extra week alone makes +25%. Per shipping week: CRAFT\u00a0−2.1%.",
          sheet:
            "+22.4% more CRAFT units than in August (demand_actuals.csv, August and September 2023).",
        },
        "rate-251": {
          label: "2.51 defects per 1,000\u00a0units, 2.2 times NEST",
          fact: "True however many weeks the month has (report, section 7).",
          sheet:
            "2.51 defects per 1,000\u00a0units, 2.2 times NEST (ncr_records.csv and demand_actuals.csv, September 2023).",
        },
        "rev-412": {
          label: "€4.12M revenue on only 9,162 units",
          fact: "Revenue here is quantity × list price, not margin: unit costs are in no file. And per shipping week CRAFT ships 2.1% fewer units.",
          sheet:
            "€4.12M revenue on only 9,162 units (demand_actuals.csv and product_lines.csv, September 2023).",
        },
        "scrap-691": {
          label: "€691k of scrap, valued at list price",
          fact: "The limit sits in the same sentence: valued at list price. What the units cost is in no file.",
          sheet:
            "€691k of scrap, valued at list price (ncr_records.csv and product_lines.csv, September 2023).",
        },
        "ncr-23": {
          label: "23 defect reports, more than every other line",
          vp: "NEST has 19. You brake my line over four reports?",
          fact: "Per 1,000\u00a0units: CRAFT 2.51, NEST 1.13, 2.2 times. NEST ships 1.8 times as many units.",
          sheet: "23 defect reports, more than every other line (ncr_records.csv, September 2023).",
        },
      },
      cost: {
        "both-ways": {
          label: "Brake too early and we lose revenue, fund too early and we buy scrap",
          fact: "Costs in both directions.",
          sheet: "brake too early and we lose revenue, fund too early and we buy scrap.",
        },
        "lost-revenue": {
          label: "Every month without the extra budget costs CRAFT up to €4.12M revenue",
          fact: "What the extra budget moves is in no file: budgets are booked per campaign, not per line. €4.12M is CRAFT's whole September revenue.",
          sheet: "every month without extra budget costs CRAFT up to €4.12M revenue.",
        },
        "scrap-on-top": {
          label: "With the extra budget, €691k of scrap (list price) is added every month",
          vp: "The scrap happens even if I get no budget.",
          fact: "He is right there: the €691k at list price happens without extra budget too. Being wrong costs in both directions.",
          sheet: "with extra budget, €691k of scrap (list price) is added every month.",
        },
      },
      open: {
        weeks: {
          label: "Margin per line, returns per line, whether September had more shipping weeks",
          fact: "The weeks are in the data: five week starts in September in demand_actuals.csv. What is open is whether marketing moves CRAFT.",
          sheet: "margin per line, returns per line, whether September had more shipping weeks.",
        },
        marketing: {
          label: "Margin per line, returns per line, whether marketing moves CRAFT",
          fact: "Exactly the three limits no file closes.",
          sheet: "margin per line, returns per line, whether marketing moves CRAFT.",
        },
        rate: {
          label: "Margin per line, defects per 1,000\u00a0units, whether marketing moves CRAFT",
          fact: "The rate is in the data: ncr_records.csv divided by demand_actuals.csv. What is open is returns per line.",
          sheet: "margin per line, defects per 1,000\u00a0units, whether marketing moves CRAFT.",
        },
      },
      counter: {
        "price-margin": {
          label: "CRAFT earns 2.4 times AURA's average price, so the best margin",
          fact: "Price is not margin. Unit costs are in no file.",
          sheet: "CRAFT earns 2.4 times AURA's average price, so the best margin.",
        },
        "count-fell": {
          label: "The reports are already falling: 24 in August, only 23 in September",
          fact: "One report fewer, in a month with one extra week. The VP has the stronger argument: per 1,000\u00a0units the rate fell 22%.",
          sheet: "the reports are already falling: 24 in August, only 23 in September.",
        },
        "rate-fell": {
          label: "Only CRAFT's rate fell: from 3.21 to 2.51 per 1,000\u00a0units",
          fact: "That point is his, and it is why the hold lasts one month. Meanwhile scrap rose from 12.3% to 16.8% of units.",
          sheet: "only CRAFT's rate fell, from 3.21 to 2.51 per 1,000\u00a0units.",
        },
      },
      trigger: {
        "rate-only": {
          label: "October below 2.51 defects per 1,000\u00a0units shipped",
          fact: "September already did that against August: rate 3.21 → 2.51, scrap 12.3% → 16.8% of units. Without a scrap condition you release while more gets scrapped.",
          sheet: "October below 2.51 defects per 1,000\u00a0units shipped.",
        },
        revenue: {
          label: "CRAFT's October revenue above €4.12M, on the same marketing budget",
          fact: "Revenue measures demand, not defects. And October has four week starts in the extract (7, 14, 21, 28), September five: the bar fails on the calendar alone.",
          sheet: "CRAFT's October revenue above €4.12M, on the same marketing budget.",
        },
        "rate-and-scrap": {
          label: "October below 2.51 per 1,000 and scrap under 8% of revenue",
          fact: "Below 2.51 only asks the trend to hold. The workshop takes it anyway: the hold should cost one month, not a quarter, and the second condition asks to more than halve the scrap (16.8% → under 8%).",
          sheet: "October below 2.51 per 1,000 and scrap under 8% of revenue.",
        },
      },
    },
    against: {
      marketing:
        "Your number argues against your decision: it argues for rework first, because it shows the defects the extra budget would pay for too.",
      rework:
        "Your number argues against your decision: it is an argument for more budget, not for rework first, and it does not even hold for that.",
    },
    vpLabel: "The VP's objection",
    dataLabel: "What the data says",
    sheetHeading: "Your sheet",
    sheetHolds: "Your sheet holds: 6 of 6 lines.",
    sheetHolding: { one: "{count} of 6 lines holds.", other: "{count} of 6 lines hold." },
    sheetOpen: { one: "{count} line open.", other: "{count} lines open." },
    gut: {
      turned: "Gut: {gut}. Sheet: {decision}. Your rules turned the decision.",
      "same-holds": "Gut and sheet agree, now with figures that hold.",
      "same-weak": "Gut and sheet agree, but the sheet does not hold yet.",
    },
    workshopHeading: "How the workshop decides",
    workshop:
      "Rework CRAFT first. Hold the extra Q3 marketing for one month. One euro of product in six is scrapped before it ships, valued at list price, and most of the +26% is the fifth shipping week. Trigger, agreed now: October below 2.51 per 1,000 and scrap under 8% of revenue. Where the VP is right: CRAFT's rate fell 22% in a month, the only line with reports that improved. That is why the hold lasts one month. Still open: margin, returns per line and whether marketing moves CRAFT.",
    workshopSource: "Slide 16 of the workshop.",
    weakTag: { misleads: "[misleads]", absent: "[not in the data]" },
  },
  takeaways: {
    traps: {
      title: "Four traps",
      text: [
        "Read what the report cannot tell you first, then the headline. Then check four traps:",
        "1. Unequal periods: does the month have more weeks, working days or booking days than the one before? Then compare per week or per day.",
        "2. Counts instead of rates: compare defects, returns and tickets per 1,000\u00a0units, never as raw counts across lines.",
        "3. The \"only if it rises\" rule: it lets the worst line through as soon as it improves a little. Flag by level, not only by direction.",
        "4. Calculated instead of read: ask for file, column and period for every number. A divided total is not a measured figure, and the right value from the wrong month is a wrong value.",
      ].join("\n"),
      caption: "Every trap occurred in this September report.",
    },
    check: {
      title: "The source check",
      text: "For every number in your last answer, show me the file, column and period it came from. Which numbers did you calculate or infer rather than read?",
      caption:
        "After any answer with numbers, in any tool. \"Period\" catches the 12 from August, \"calculate\" catches the divided total.",
    },
    sheet: {
      title: "The decision sheet",
      text: [
        "Decision: …",
        "The number: … (with file and period)",
        "Cost of being wrong: … (both directions)",
        "Open: … (what no file shows)",
        "Counterargument: … (the strongest, from the data)",
        "Release: … (one number and one date)",
      ].join("\n"),
      caption: "The six lines fit any monthly report.",
      exampleTitle: "Your NORTHWIND sheet, as the example",
    },
  },
  ui: {
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy failed. Select the text.",
    reset: "Start over",
    resetNote: "Clears every station.",
    provenance:
      "Figures: NORTHWIND kit, August and September 2023, invented. Recalculated in the browser.",
  },
};
