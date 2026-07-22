// Ported verbatim from course-data.js's MODULES[6] ("data", M07).
import type { AiNativeOperatorLesson } from "../types";

export const DATA_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "data/1",
    moduleId: "data",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "The unified context layer",
    subtitle: "Stand up a single retrieval surface (RAG/MCP) over docs, code, tickets, and conversations.",
    objective:
      "Stand up a single retrieval surface (RAG/MCP) over docs, code, tickets, and conversations.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Why context is everything",
        readTimeMinutes: 8,
        content:
          "The same model, with rich context, gives expert-level answers. Without context, generic ones. The investment that compounds is the context layer, the unified, permissioned, queryable surface over all of your work artifacts.",
      },
      {
        id: "s2",
        title: "What to include",
        readTimeMinutes: 8,
        content:
          "Docs (Confluence, Notion, Drive). Code (Git). Tickets (Jira, Linear). Conversations (Slack, email, with care). Calendars. CRMs. The agent should see the same surface a thoughtful new hire would, after their first month, but on day one.",
      },
      {
        id: "s3",
        title: "The build",
        readTimeMinutes: 8,
        content:
          "Most teams should not build the context layer from scratch. Use MCP-compatible connectors. Standardize on identity and permissions. Invest in the index quality and the freshness, the quality of agent answers is downstream.",
      },
    ],
    callout: {
      kind: "note",
      h: "A useful sequencing",
      text: "Phase 1: docs + code (most ROI per week of work). Phase 2: tickets + recent decisions. Phase 3: conversations (only with explicit privacy review). Skipping straight to phase 3 is the most common path to disaster.",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/1",
          cpId: "exercise",
          title: "Context Sources",
          scenario:
            "List the top 5 sources of context your team's agents need. For each: who owns it, what is the access model, how stale is it.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "data/2",
    moduleId: "data",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Permission-aware retrieval",
    subtitle: "Make the agent see exactly what the user sees, nothing more, nothing less.",
    objective: "Make the agent see exactly what the user sees, nothing more, nothing less.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The leak that ends the program",
        readTimeMinutes: 7,
        content:
          "A single incident, agent returns a doc the user shouldn't see, agent leaks a customer record, sets the program back two years. Permission-aware retrieval is the discipline that prevents this.",
      },
      {
        id: "s2",
        title: "How it works",
        readTimeMinutes: 7,
        content:
          'The agent inherits the calling user\'s identity. Every retrieval is filtered by the user\'s ACLs. The index stores ACLs alongside the content. There is no "agent identity" with elevated access, the agent is always acting on behalf of a specific user, with that user\'s permissions.',
      },
      {
        id: "s3",
        title: "The audit",
        readTimeMinutes: 6,
        content:
          "Every retrieval is logged: user, query, results returned, ACLs applied. When something goes wrong, you can reconstruct exactly what happened. Without this, you are guessing in incident response.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/2",
          cpId: "exercise",
          scenario:
            'For your context layer, can you answer: "Which user, on which day, retrieved which document via which agent, with which ACLs applied?" If no, name the gap.',
          rows: 3,
        },
      },
    ],
  },
  {
    id: "data/3",
    moduleId: "data",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Live knowledge graphs",
    subtitle: "Move from snapshot indexes to live, governed knowledge, agents working with fresh context.",
    objective:
      "Move from snapshot indexes to live, governed knowledge, agents working with fresh context.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Snapshots are radioactive",
        readTimeMinutes: 11,
        content:
          "A nightly index is fine for some uses. For agentic workflows, it is poison: the agent answers based on yesterday's reality, takes action in today's, and the answer is wrong. The bar for fresh context is minutes, not days.",
      },
      {
        id: "s2",
        title: "The investment that pays",
        readTimeMinutes: 11,
        content:
          "Streaming change events into the index. Per-source freshness SLAs. Stale-data detection, the agent should know when it's working with stale context and warn the user.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/3",
          cpId: "exercise",
          scenario:
            "For each major source of context, what is the current freshness? What is the target freshness? Where is the gap?",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "data/4",
    moduleId: "data",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 7, knowledge check",
    subtitle: "Confirm context discipline.",
    objective: "Confirm context discipline.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-data-q1",
        questionText:
          "An agent returns a confidential document the calling user should not see. The right architectural fix is:",
        answerOptions: [
          { id: "a", text: "Add a content filter on the response.", isCorrect: false },
          {
            id: "b",
            text: "Permission-aware retrieval: agent inherits user identity, retrieval is filtered by user ACLs.",
            isCorrect: true,
          },
          { id: "c", text: "Hide the agent from senior users.", isCorrect: false },
          { id: "d", text: "Disable retrieval temporarily.", isCorrect: false },
        ],
        explanation:
          "The architectural fix is permission-aware retrieval: the agent inherits the calling user's identity, and every retrieval is filtered by that user's real ACLs, so there is never an \"agent identity\" with elevated access. A response-level content filter is a patch on the symptom; the leak keeps being possible until the retrieval layer itself respects permissions.",
      },
      {
        id: "ano-data-q2",
        questionText: 'Why are nightly snapshots "radioactive" for agentic workflows?',
        answerOptions: [
          { id: "a", text: "They are slow to build.", isCorrect: false },
          { id: "b", text: "They use too much storage.", isCorrect: false },
          {
            id: "c",
            text: "The agent answers based on yesterday's reality, takes action in today's, and the answer is wrong.",
            isCorrect: true,
          },
          { id: "d", text: "They miss new files.", isCorrect: false },
        ],
        explanation:
          "Nightly snapshots are dangerous for agentic workflows specifically because the agent reasons from yesterday's state but acts in today's reality, a deleted record, a changed price, a closed ticket won't show up until the next sync, and the agent will confidently act on stale facts. Build cost and storage are real concerns but not the reason this pattern is called out as dangerous.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
