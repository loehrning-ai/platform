// Ported verbatim from course-data.js's MODULES[3] ("operations", M04).
import type { AiNativeOperatorLesson } from "../types";

export const OPERATIONS_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "operations/1",
    moduleId: "operations",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Async-default meetings",
    subtitle:
      "Reclaim a third of your week by routing status through async + AI summary instead of synchronous time.",
    objective:
      "Reclaim a third of your week by routing status through async + AI summary instead of synchronous time.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The status meeting is dead",
        readTimeMinutes: 5,
        content:
          "Five people each report what they did. Four of them are reporting it to four others who do not need to know. The decision-makers wait through the rest. This ritual was never efficient, it was a coordination tax. AI removes the tax.",
      },
      {
        id: "s2",
        title: "The new ritual",
        readTimeMinutes: 5,
        content:
          "Each person posts a one-paragraph status to a channel. An agent summarizes the channel. The summary surfaces conflicts, blockers, and decisions needed. The leader spends 5 minutes reading. A 30-minute meeting only happens when a real-time decision is required.",
      },
      {
        id: "s3",
        title: "What you lose, and how to recover it",
        readTimeMinutes: 4,
        content:
          'You lose serendipity, the side conversations that produced unexpected ideas. Recover this through a different ritual: a weekly "open hour" where the team is together with no agenda. The serendipity was never in the status meeting; it was in being in the same room.',
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/1",
          cpId: "exercise",
          title: "Meeting Audit",
          scenario:
            "List your five most frequent recurring meetings. For each, mark whether it is a decision meeting (keep) or a status meeting (kill, replace with async + AI summary).",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "operations/2",
    moduleId: "operations",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "AI in every doc",
    subtitle: "Eliminate the blank page from your team's working life.",
    objective: "Eliminate the blank page from your team's working life.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The blank-page tax",
        readTimeMinutes: 6,
        content:
          "Most knowledge work begins by staring at a blank page for 20 minutes. AI eliminates this tax. The first draft is no longer where you spend your effort, it is where you start your effort. The blank page should never appear again in your team's life.",
      },
      {
        id: "s2",
        title: "The brief-first habit",
        readTimeMinutes: 6,
        content:
          "For every doc, design, technical, planning, performance, comms, start with a one-paragraph brief. The agent drafts. You sharpen. The shape of the work has changed: 80% editor, 20% writer. The output quality is higher, not lower, because editing is harder than writing and you spend the time on the harder part.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/2",
          cpId: "exercise",
          scenario:
            "Pick one doc on your plate this week. Write the one-paragraph brief now. (You can paste this brief into your tool of choice when you sit down to draft.)",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "operations/3",
    moduleId: "operations",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Ticket triage agents",
    subtitle:
      "Set up an agent that classifies, enriches, deduplicates, and assigns inbound tickets, leaving humans to handle exceptions only.",
    objective:
      "Set up an agent that classifies, enriches, deduplicates, and assigns inbound tickets, leaving humans to handle exceptions only.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The triage pipeline",
        readTimeMinutes: 6,
        content:
          "Inbound ticket → agent reads → agent classifies (severity, area, owner) → agent enriches (links related tickets, recent context) → agent assigns. Human reviews exceptions only, the ones where the agent flagged uncertainty.",
      },
      {
        id: "s2",
        title: "The 95/5 rule",
        readTimeMinutes: 6,
        content:
          "A well-designed triage agent handles 95% of tickets without human touch. The remaining 5% are the genuinely ambiguous ones, and they go to a human with full context. The human spends 1 hour a day on triage instead of 4, and the work is more interesting because all the easy cases are gone.",
      },
      {
        id: "s3",
        title: "The escalation path",
        readTimeMinutes: 5,
        content:
          "When the agent is wrong, what happens? The eng team needs a clear escalation path: who reviews, who fixes, who closes the loop with the user. Triage agents fail silently if you let them. Build the loop.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/3",
          cpId: "exercise",
          title: "Triage Pipeline",
          scenario:
            "Sketch your triage pipeline. Inputs, classification dimensions, enrichment sources, escalation rules.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "operations/4",
    moduleId: "operations",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 4, knowledge check",
    subtitle: "Operational basics, locked.",
    objective: "Operational basics, locked.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-operations-q1",
        questionText:
          "A weekly status meeting with 8 attendees mostly reports information already in writing. The right move is:",
        answerOptions: [
          { id: "a", text: "Make the meeting shorter.", isCorrect: false },
          {
            id: "b",
            text: "Replace with async status + AI summary; reserve sync time for decisions.",
            isCorrect: true,
          },
          { id: "c", text: "Add an agenda.", isCorrect: false },
          { id: "d", text: "Rotate the meeting time.", isCorrect: false },
        ],
        explanation:
          "When a status meeting is mostly information that already exists in writing, the fix is to route it async and let an agent summarize the channel for conflicts, blockers, and decisions needed, reserving the synchronous time for moments that actually require a live decision. Shortening or reorganizing the same ritual doesn't remove the coordination tax, it just trims it.",
      },
      {
        id: "ano-operations-q2",
        questionText:
          "A well-designed ticket triage agent handles ~95% of tickets without human touch. The 5% that escalate to humans should be:",
        answerOptions: [
          { id: "a", text: "Random sample.", isCorrect: false },
          { id: "b", text: "The oldest tickets.", isCorrect: false },
          { id: "c", text: "The cases where the agent flagged uncertainty.", isCorrect: true },
          { id: "d", text: "The ones from VIP customers only.", isCorrect: false },
        ],
        explanation:
          "A well-designed triage agent should escalate the cases where it is genuinely unsure, not a random sample or an arbitrary rule like ticket age or customer tier, flagged uncertainty is the signal that a human's judgment is actually needed. Escalating anything else wastes the human's attention on cases the agent could already handle.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
