// Ported verbatim from course-data.js's MODULES[2] ("product", M03).
import type { AiNativeOperatorLesson } from "../types";

export const PRODUCT_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "product/1",
    moduleId: "product",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "The death of the chat bubble",
    subtitle: 'Recognize when "AI feature" is a bolt-on and when it is the actual product.',
    objective: 'Recognize when "AI feature" is a bolt-on and when it is the actual product.',
    durationMinutes: 13,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The bolt-on era",
        readTimeMinutes: 4,
        content:
          '2023–2024 produced a generation of products with a chat bubble in the corner. The bubble said "Ask AI anything." Most of them died. They died because the bubble did not change the product — it was a separate room nobody visited. The interface stayed static, the flows stayed long, the value stayed the same.',
      },
      {
        id: "s2",
        title: "The integrated era",
        readTimeMinutes: 5,
        content:
          'The products that won made the AI invisible and the value loud. The interface adapts to user intent. Forms ask one question instead of twelve. The reasoning system is the engine; the UI is a thin shell. When you use them, you do not say "I used AI" — you say "I got the thing I wanted, faster."',
      },
      {
        id: "s3",
        title: "The diagnostic question",
        readTimeMinutes: 4,
        content:
          "Ask of any AI product: if you removed the AI, would the product still work? If yes, the AI is a feature. If no, the AI is the product. Only the second category matters.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "product/2",
    moduleId: "product",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Find the intent moment",
    subtitle:
      "Identify the moment in any flow where the user states intent — and replace the next five steps with one delegation.",
    objective:
      "Identify the moment in any flow where the user states intent — and replace the next five steps with one delegation.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Where intent lives",
        readTimeMinutes: 6,
        content:
          "In every flow there is a moment when the user expresses what they want. It might be a search query, a button click, an email subject line, a verbal request. Before that moment, the product is exploration. After it, the product is execution. The AI-native opportunity is at and after that moment: collapse the next N steps into one delegated action.",
      },
      {
        id: "s2",
        title: "The five-to-one rule",
        readTimeMinutes: 6,
        content:
          'A useful design heuristic: take any flow with more than five steps after intent and ask, "what would it take to compress this to one?" Sometimes you cannot. Often you can. The teams that consistently apply this rule are the ones whose flows feel like magic.',
      },
      {
        id: "s3",
        title: "The structured + conversational hybrid",
        readTimeMinutes: 6,
        content:
          "Pure chat is rarely the right UI. Mix conversation with structured controls. Let the AI choose the surface — a form, a chat, a calendar, a map — for the moment. The user does not care about modality; they care about getting the thing they wanted.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "product/3",
    moduleId: "product",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Generative UI",
    subtitle: "Stop designing every screen. Design the system that designs screens.",
    objective: "Stop designing every screen. Design the system that designs screens.",
    durationMinutes: 21,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "From screens to systems",
        readTimeMinutes: 7,
        content:
          "The classical PM and designer ship screens — wireframes, mockups, prototypes. The AI-native PM and designer ship a system: a library of components, a set of constraints, a few patterns. The model assembles screens from that vocabulary in response to intent.",
      },
      {
        id: "s2",
        title: "The constraint hierarchy",
        readTimeMinutes: 7,
        content:
          "Generative UI is only useful when the constraints are right. Too few constraints and you get a chaotic experience that violates brand and accessibility. Too many constraints and you get the same product everyone has. The art is in the middle — define the components, the patterns, the dos and donts. Let the model improvise the rest.",
      },
      {
        id: "s3",
        title: "When NOT to generate",
        readTimeMinutes: 7,
        content:
          "Some screens should never be generated: legal flows, payment, anything where consistency is the value. Identify these explicitly. Generative UI is a tool, not an ideology.",
      },
    ],
    callout: {
      kind: "note",
      h: "A pragmatic starting point",
      text: "Pick one surface in your product where users have wildly different goals — a dashboard, a homepage, a settings panel. Make that surface generative. Leave the rest static for now.",
    },
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "product/4",
    moduleId: "product",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Real-time evals on user-facing AI",
    subtitle: "Score every AI response in production. Detect regressions before users do.",
    objective: "Score every AI response in production. Detect regressions before users do.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The production reality",
        readTimeMinutes: 6,
        content:
          "Internal evals catch most regressions. Some they will not. A model upgrade, a prompt tweak, a new tool — any of these can shift behavior in production in ways your eval suite did not anticipate. Real-time evals are the safety net.",
      },
      {
        id: "s2",
        title: "What to score",
        readTimeMinutes: 6,
        content:
          "Score every AI-facing response on a small set of dimensions: correctness (where you can verify), helpfulness (proxied by user signal), safety (rule-based filters). Sample for human review. Watch the distributions, not the individual scores.",
      },
      {
        id: "s3",
        title: "The auto-rollback discipline",
        readTimeMinutes: 5,
        content:
          "When a real-time eval crosses a threshold, the system rolls back automatically. The human reads the postmortem after. This discipline takes work to build and saves you the day a model upgrade quietly breaks 12% of your traffic.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "product/5",
    moduleId: "product",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Module 3 — knowledge check",
    subtitle: "Confirm the product mindset shift is internalized.",
    objective: "Confirm the product mindset shift is internalized.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [],
    sections: [],
    widgets: [],
  },
];
