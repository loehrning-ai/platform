// Ported verbatim from course-data.js's MODULES[0] ("mindset", M01).
import type { AiNativeOperatorLesson } from "../types";

export const MINDSET_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "mindset/1",
    moduleId: "mindset",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: 'Why "AI-first" is no longer optional',
    subtitle:
      "Understand the economic and competitive forces that have made reflexive AI use a baseline expectation, not an aspiration.",
    objective:
      "Understand the economic and competitive forces that have made reflexive AI use a baseline expectation, not an aspiration.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The reckoning that already happened",
        readTimeMinutes: 5,
        content:
          "In 2023 you could still treat AI as a curiosity — a tab you opened when you needed a haiku or a regex. By 2025 the floor moved. Tobi Lütke at Shopify wrote what every executive was thinking but few had the courage to say: before you ask for headcount, prove an AI cannot do the job. Klarna replaced 700 customer-service agents with one assistant and reported CSAT on par with humans. Microsoft's Work Trend Index put a number on the office worker's lift — roughly fourteen hours per month back, every month, forever. Compounded across a workforce, that is not a productivity bump. It is a different company.",
      },
      {
        id: "s2",
        title: "The competitive math",
        readTimeMinutes: 5,
        content:
          "A team that adopts AI-native operating gets two things at once: more output per person, and a faster learning loop. The output gain is what most leaders see first — more shipped, fewer hours. The learning loop is what kills you if you are on the other side of it. An AI-native team runs more experiments, sees more outcomes, and gets smarter faster. Six months in, the gap is not 20% — it is generational.",
      },
      {
        id: "s3",
        title: 'What "AI-first" actually means',
        readTimeMinutes: 4,
        content:
          'It does not mean "use AI more." It means: every new task starts with the question, "what if a model did this?" — and you only do by hand the work that genuinely requires you. The artifact you produce is no longer the work; the artifact is the judgment about whether the work is right. Your job description is half the words it used to be, and the words that remain are heavier.',
      },
    ],
    callout: {
      kind: "quote",
      text: "Reflexive AI usage is now a baseline expectation. Before asking for more headcount, teams must demonstrate why AI cannot do the job.",
      attr: "Tobi Lütke · Shopify · 2025",
    },
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "mindset/2",
    moduleId: "mindset",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "The four maturity levels",
    subtitle: "Place yourself, your team, and your org honestly on the L0 → L3 maturity ladder.",
    objective: "Place yourself, your team, and your org honestly on the L0 → L3 maturity ladder.",
    durationMinutes: 11,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "L0 — Spectator",
        readTimeMinutes: 3,
        content:
          "AI is something other people talk about. You have an account somewhere; you have not opened it this week. Real work happens in tabs you have already mastered. There is no shame in L0 — most of the world is here. There is, however, a clock.",
      },
      {
        id: "s2",
        title: "L1 — User",
        readTimeMinutes: 3,
        content:
          'You use AI for "small stuff." Phrasing an email, summarizing a meeting, writing a regex. Trust is fragile: one hallucination ends the experiment for the week. AI sits on the side of your work — never in the middle of it.',
      },
      {
        id: "s3",
        title: "L2 — Operator",
        readTimeMinutes: 3,
        content:
          "AI is the default first draft for everything. You do not write the doc — you brief the model, then edit. You do not investigate the bug — the agent investigates, you adjudicate. The interface of work has changed: you spend more time reviewing, less time generating.",
      },
      {
        id: "s4",
        title: "L3 — Conductor",
        readTimeMinutes: 2,
        content:
          "You direct fleets of agents. The unit of work is a delegation, not a keystroke. Agents spec, write, test, refactor, and open PRs while you orchestrate. Humans choose, judge, and ship; agents do the in-between. This is where the leverage compounds.",
      },
    ],
    callout: {
      kind: "note",
      h: "A note on honesty",
      text: "Most people overestimate their level by one. The senior engineer who uses Cursor for autocomplete thinks they are L2; they are L1. The L2 engineer thinks they are L3; they are L2. Calibrate down. The course is more useful that way.",
    },
    exerciseKind: "self-rate",
    widgets: [],
  },
  {
    id: "mindset/3",
    moduleId: "mindset",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Trust calibration: the new senior skill",
    subtitle:
      "Build a personal practice for knowing when to trust an AI output and when to verify — without slipping into either blind faith or paranoia.",
    objective:
      "Build a personal practice for knowing when to trust an AI output and when to verify — without slipping into either blind faith or paranoia.",
    durationMinutes: 16,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Trust is not a binary",
        readTimeMinutes: 5,
        content:
          'The L0 mindset says "AI lies, so don\'t use it." The naive L1 mindset says "AI was right last time, so it\'s right now." Both are wrong. Trust is a calibrated, domain-specific function: how often is this model right on this kind of task with this kind of context, and what does failure cost? The senior practitioner internalizes that function and moves accordingly.',
      },
      {
        id: "s2",
        title: "The cost-of-error frame",
        readTimeMinutes: 6,
        content:
          "Some errors are cheap — a typo in an internal email is undone in seconds. Some errors are expensive — a wrong number in a board deck or a leaked customer record. Calibrate verification effort to cost-of-error, not to your mood. A useful rule: if the cost of being wrong is more than the cost of verifying, verify. If less, ship.",
      },
      {
        id: "s3",
        title: "Building the habit",
        readTimeMinutes: 5,
        content:
          "Pick one task per week where you let an AI be wrong on purpose, and you must catch it. Run agents on tasks where you have ground truth. Note the failure modes — they cluster. Within a month you will know, without thinking, which kinds of outputs to scan and which to trust.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Failure mode: the senior who never verifies",
      text: "A common pattern: confident senior + confident agent + no verification = a wrong answer that nobody catches. The seniority of the human is a multiplier, not a corrective. Build the habit before the cost.",
    },
    exerciseKind: "matrix-grid",
    widgets: [],
  },
  {
    id: "mindset/4",
    moduleId: "mindset",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Killing the hero artisan",
    subtitle:
      "Recognize and dismantle the cultural patterns that reward heroic individual effort over leveraged outcomes.",
    objective:
      "Recognize and dismantle the cultural patterns that reward heroic individual effort over leveraged outcomes.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The 2 a.m. PR is no longer the move",
        readTimeMinutes: 4,
        content:
          "For twenty years, software culture celebrated the person who hand-coded a feature alone overnight. That person was the hero. In 2026, that person is a bottleneck. The new hero shipped three features by Tuesday with agents and was home for dinner. Recognize this shift and the comp/promo signals that go with it.",
      },
      {
        id: "s2",
        title: "What leaders should publicly praise",
        readTimeMinutes: 4,
        content:
          "Praise the engineer who set up the eval suite that caught a regression. Praise the PM who replaced a five-step flow with one delegated agent. Praise the manager who shrank their team by 30% and grew its output. The signal you send shapes the culture more than any policy.",
      },
      {
        id: "s3",
        title: "Resistance from senior ICs",
        readTimeMinutes: 4,
        content:
          "The most common resistance comes from senior individual contributors who built their identity around manual mastery. Take them seriously. Their craft is real. The path forward is not to dismiss it — it is to redirect: the same taste, the same standards, applied to specs, evals, and review. Their craft scales now.",
      },
    ],
    exerciseKind: "plays",
    widgets: [],
  },
  {
    id: "mindset/5",
    moduleId: "mindset",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Module 1 — knowledge check",
    subtitle: "Confirm you can articulate the why, the levels, and the practice — in your own words.",
    objective: "Confirm you can articulate the why, the levels, and the practice — in your own words.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [],
    sections: [],
    widgets: [],
  },
];
