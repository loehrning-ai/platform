import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(join(__dirname, relativePath), "utf8");
}

const sources = {
  workspace: read("../course-projects/course-workspace-frame.tsx"),
  exerciseShell: read("../ai-native/exercises/_shell.tsx"),
  contextBudget: read("../ai-native/exercises/context-budget.tsx"),
  fixPrompt: read("../ai-native/exercises/fix-prompt.tsx"),
  freeResponse: read("../ai-native/exercises/free-response.tsx"),
  piiSpotter: read("../ai-native/exercises/pii-spotter.tsx"),
  promptDiff: read("../ai-native/exercises/prompt-diff.tsx"),
  rctfcChecklist: read("../ai-native/exercises/rctfc-checklist.tsx"),
  roleScenario: read("../ai-native/exercises/role-scenario.tsx"),
  workflowBuilder: read("../ai-native/exercises/workflow-builder.tsx"),
  copyableMarkdown: read("kurs/markdown-copyable.tsx"),
  lessonQuiz: read("kurs/lesson-quiz.tsx"),
  workshopQuiz: read("kurs/workshop-quiz-page.tsx"),
  assessment: read("kurs/course-assessment-cta.tsx"),
  verification: read("kurs/verification-page.tsx"),
  euAiActOverview: read("../../app/eu-ai-act-kurs/kurs/kurs-content.tsx"),
  aiLiteracyOverview: read("../../app/ki-fuehrerschein/kurs/kurs-content.tsx"),
  aiSocietyOverview: read(
    "../../app/ki-und-gesellschaft/kurs/kurs-content.tsx",
  ),
} as const;

function count(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0;
}

describe("course interaction design contract", () => {
  it("gives every independent learner control a 44px target", () => {
    const extraTargetCount = {
      workspace: 0,
      exerciseShell: 0,
      contextBudget: 1,
      fixPrompt: 1,
      freeResponse: 1,
      piiSpotter: 1,
      promptDiff: 0,
      rctfcChecklist: 1,
      roleScenario: 1,
      workflowBuilder: 0,
      copyableMarkdown: 0,
      lessonQuiz: 1,
      workshopQuiz: 0,
      assessment: 0,
      verification: 0,
      euAiActOverview: 0,
      aiLiteracyOverview: 0,
      aiSocietyOverview: 0,
    } satisfies Record<keyof typeof sources, number>;

    for (const [name, source] of Object.entries(sources) as Array<
      [keyof typeof sources, string]
    >) {
      const elementControls = count(source, /<(?:button|Link)\b/g);
      const targetDeclarations = count(source, /\bmin-h-11\b/g);

      expect(
        targetDeclarations,
        `${name} must declare one 44px target per independent control`,
      ).toBeGreaterThanOrEqual(elementControls + extraTargetCount[name]);
    }

    expect(sources.workspace).toContain("min-w-11");
    expect(sources.workspace).toContain('role="separator"');
  });

  it("keeps routine cards and submit actions flat", () => {
    for (const source of [
      sources.exerciseShell,
      sources.contextBudget,
      sources.fixPrompt,
      sources.freeResponse,
      sources.piiSpotter,
      sources.rctfcChecklist,
      sources.lessonQuiz,
      sources.workshopQuiz,
      sources.assessment,
      sources.verification,
      sources.euAiActOverview,
      sources.aiLiteracyOverview,
      sources.aiSocietyOverview,
    ]) {
      expect(source).not.toMatch(/shadow-\[/);
      expect(source).not.toMatch(/hover:-translate/);
    }
  });

  it("caps course shell spacing at the 48px platform step", () => {
    const oversizedTailwindSpacing =
      /(?:^|[\s"'`])(?:[mp][trblxy]?|gap)-(?:14|16|20|24|28|32|36|40|48|64|72|80|96)(?=$|[\s"'`])/m;

    for (const source of Object.values(sources)) {
      expect(source).not.toMatch(oversizedTailwindSpacing);
    }

    expect(sources.workshopQuiz).toContain("min-h-[100svh]");
    expect(sources.verification).toContain("min-h-[100svh]");
  });
});
