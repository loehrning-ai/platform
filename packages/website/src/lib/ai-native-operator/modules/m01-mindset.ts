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
          "In 2023 you could still treat AI as a curiosity, a tab you opened when you needed a haiku or a regex. By 2025 the floor moved. Tobi Lütke at Shopify wrote what every executive was thinking but few had the courage to say: before you ask for headcount, prove an AI cannot do the job. Klarna replaced 700 customer-service agents with one assistant and reported CSAT on par with humans. Microsoft's Work Trend Index put a number on the office worker's lift, roughly fourteen hours per month back, every month, forever. Compounded across a workforce, that is not a productivity bump. It is a different company.",
      },
      {
        id: "s2",
        title: "The competitive math",
        readTimeMinutes: 5,
        content:
          "A team that adopts AI-native operating gets two things at once: more output per person, and a faster learning loop. The output gain is what most leaders see first, more shipped, fewer hours. The learning loop is what kills you if you are on the other side of it. An AI-native team runs more experiments, sees more outcomes, and gets smarter faster. Six months in, the gap is not 20%, it is generational.",
      },
      {
        id: "s3",
        title: 'What "AI-first" actually means',
        readTimeMinutes: 4,
        content:
          'It does not mean "use AI more." It means: every new task starts with the question, "what if a model did this?", and you only do by hand the work that genuinely requires you. The artifact you produce is no longer the work; the artifact is the judgment about whether the work is right. Your job description is half the words it used to be, and the words that remain are heavier.',
      },
    ],
    callout: {
      kind: "quote",
      text: "Reflexive AI usage is now a baseline expectation. Before asking for more headcount, teams must demonstrate why AI cannot do the job.",
      attr: "Tobi Lütke · Shopify · 2025",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/1",
          cpId: "exercise",
          scenario:
            "List three tasks you did this week that took more than 30 minutes. For each, write one sentence describing how an AI could have done the first 80%.",
          rows: 3,
        },
      },
    ],
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
        title: "L0, Spectator",
        readTimeMinutes: 3,
        content:
          "AI is something other people talk about. You have an account somewhere; you have not opened it this week. Real work happens in tabs you have already mastered. There is no shame in L0, most of the world is here. There is, however, a clock.",
      },
      {
        id: "s2",
        title: "L1, User",
        readTimeMinutes: 3,
        content:
          'You use AI for "small stuff." Phrasing an email, summarizing a meeting, writing a regex. Trust is fragile: one hallucination ends the experiment for the week. AI sits on the side of your work, never in the middle of it.',
      },
      {
        id: "s3",
        title: "L2, Operator",
        readTimeMinutes: 3,
        content:
          "AI is the default first draft for everything. You do not write the doc, you brief the model, then edit. You do not investigate the bug, the agent investigates, you adjudicate. The interface of work has changed: you spend more time reviewing, less time generating.",
      },
      {
        id: "s4",
        title: "L3, Conductor",
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
    widgets: [
      {
        kind: "self-rate",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/2",
          cpId: "exercise",
          title: "Self-Rating",
          scenario: "Rate yourself on each axis. Be honest. The scoring is for you alone.",
          axes: [
            {
              id: "tasks",
              label: "Default task posture",
              anchors: ["Hand-do everything", "Sometimes ask AI", "AI drafts first", "Delegate by default"],
            },
            {
              id: "tools",
              label: "Tool depth",
              anchors: ["Browser tab", "Copilot autocomplete", "Agent IDE daily", "Multi-agent fleets"],
            },
            {
              id: "trust",
              label: "Trust calibration",
              anchors: ["No trust", "Brittle trust", "Verification habits", "Calibrated by domain"],
            },
          ],
        },
      },
    ],
  },
  {
    id: "mindset/3",
    moduleId: "mindset",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Trust calibration: the new senior skill",
    subtitle:
      "Build a personal practice for knowing when to trust an AI output and when to verify, without slipping into either blind faith or paranoia.",
    objective:
      "Build a personal practice for knowing when to trust an AI output and when to verify, without slipping into either blind faith or paranoia.",
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
          "Some errors are cheap, a typo in an internal email is undone in seconds. Some errors are expensive, a wrong number in a board deck or a leaked customer record. Calibrate verification effort to cost-of-error, not to your mood. A useful rule: if the cost of being wrong is more than the cost of verifying, verify. If less, ship.",
      },
      {
        id: "s3",
        title: "Building the habit",
        readTimeMinutes: 5,
        content:
          "Pick one task per week where you let an AI be wrong on purpose, and you must catch it. Run agents on tasks where you have ground truth. Note the failure modes, they cluster. Within a month you will know, without thinking, which kinds of outputs to scan and which to trust.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Failure mode: the senior who never verifies",
      text: "A common pattern: confident senior + confident agent + no verification = a wrong answer that nobody catches. The seniority of the human is a multiplier, not a corrective. Build the habit before the cost.",
    },
    exerciseKind: "matrix-grid",
    widgets: [
      {
        kind: "matrix-grid",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/3",
          cpId: "exercise",
          title: "Verification Matrix",
          scenario:
            "For each task type below, mark how much you should verify in your current role. There is no right answer, calibrate to your context.",
          rows: [
            "Internal email draft",
            "External customer email",
            "Code patch under 50 lines",
            "Code patch over 200 lines",
            "Board-facing number",
            "Performance review draft",
          ],
          cols: ["Skim", "Read carefully", "Verify against source", "Have a second human review"],
        },
      },
    ],
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
          "The most common resistance comes from senior individual contributors who built their identity around manual mastery. Take them seriously. Their craft is real. The path forward is not to dismiss it, it is to redirect: the same taste, the same standards, applied to specs, evals, and review. Their craft scales now.",
      },
    ],
    exerciseKind: "plays",
    widgets: [
      {
        kind: "plays",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/4",
          cpId: "exercise",
          title: "Your Next Moves",
          scenario: "Pick three plays you will personally adopt this month.",
          minPick: 3,
          options: [
            'For every new task, write a one-line "AI delegation plan" before starting.',
            "Run one weekly retro with my team about what AI did and didn't do well.",
            "Publicly share one delegation per week, what worked, what didn't.",
            "Stop celebrating long hours. Start celebrating leveraged outcomes.",
            "Ask one peer to call me out when I revert to manual habits.",
          ],
        },
      },
    ],
  },
  {
    id: "mindset/5",
    moduleId: "mindset",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Module 1, knowledge check",
    subtitle: "Confirm you can articulate the why, the levels, and the practice, in your own words.",
    objective: "Confirm you can articulate the why, the levels, and the practice, in your own words.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-mindset-q1",
        questionText:
          'A teammate says "I tried AI and it gave me a wrong answer, so I don\'t trust it." What is the most useful response?',
        answerOptions: [
          { id: "a", text: "Agree, AI is unreliable for serious work.", isCorrect: false },
          {
            id: "b",
            text: "Trust is calibrated per task type. The question is when you should verify, not whether to use it.",
            isCorrect: true,
          },
          { id: "c", text: "Use a different model.", isCorrect: false },
          { id: "d", text: "Wait six months for the technology to improve.", isCorrect: false },
        ],
        explanation:
          "Trust is a calibrated, domain-specific function of how often a model is right on a given task and what failure costs, not a single global verdict earned or lost from one interaction. Dismissing AI after one wrong answer is the same error as blindly trusting it after one right one; both skip the calibration step that separates senior practitioners from everyone else.",
      },
      {
        id: "ano-mindset-q2",
        questionText: "Which best describes L3 (Conductor)?",
        answerOptions: [
          { id: "a", text: "You use Cursor or Claude Code for autocomplete daily.", isCorrect: false },
          { id: "b", text: "AI writes your first draft of every doc.", isCorrect: false },
          {
            id: "c",
            text: "You direct multiple agents in parallel; the unit of work is a delegation, not a keystroke.",
            isCorrect: true,
          },
          { id: "d", text: "You have read three books on AI.", isCorrect: false },
        ],
        explanation:
          "L3 is defined by the unit of work changing from a keystroke to a delegation: the operator directs multiple agents in parallel, assigning, checking in, redirecting, while the agents do the spec-to-PR work. Daily autocomplete use (L1) and AI-first-draft habits (L2) are real progress, but neither involves orchestrating a fleet.",
      },
      {
        id: "ano-mindset-q3",
        questionText:
          'A senior engineer hand-codes a feature overnight to "prove they still can." In an AI-native culture, the leader\'s response is:',
        answerOptions: [
          { id: "a", text: "Celebrate the heroic effort publicly.", isCorrect: false },
          {
            id: "b",
            text: "Privately appreciate the craft, then redirect: ask them to scale that taste through specs and evals.",
            isCorrect: true,
          },
          { id: "c", text: "Punish them for not using AI.", isCorrect: false },
          { id: "d", text: "Ignore it.", isCorrect: false },
        ],
        explanation:
          "The craft behind a hand-coded overnight feature is real and worth acknowledging privately, but publicly celebrating solo heroics re-anchors the culture on hours and individual effort instead of leverage. The AI-native move is to redirect that same taste and standards toward specs, evals, and review, where it scales across a whole fleet of agents instead of one person's night.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
