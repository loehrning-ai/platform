// TEMPORARY, UNCOMMITTED: course-app screenshots in the mocked-session tier.
import { test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CANONICAL_LESSON_IDS,
  lessonCompletionEvidenceCheckpointId,
} from "../../../src/lib/courses/completion";
import { UNIFIED_STORAGE_KEY } from "../../../src/lib/progress/types";

const OUT = "/tmp/claude-0/-home-user-loehrning-ai/bfc93b1f-24e0-5535-b305-4dab74996882/scratchpad/course-shots";
const ROOT = process.cwd();

type Slug = "ki-fuehrerschein" | "ai-native";
const COURSES: readonly {
  slug: Slug;
  hub: string;
  lesson: string;
  lessonFile: string;
  quizFile: string;
}[] = [
  {
    slug: "ki-fuehrerschein",
    hub: "/ki-fuehrerschein/kurs",
    lesson: "/ki-fuehrerschein/kurs/block_1",
    lessonFile: "content/ki-fuehrerschein/block-1-daten-lessons.json",
    quizFile: "content/ki-fuehrerschein/quiz/questions.json",
  },
  {
    slug: "ai-native",
    hub: "/ai-native/kurs",
    lesson: "/ai-native/kurs/modul_1/messen-1-1",
    lessonFile: "content/ai-native/modul-1-lessons.json",
    quizFile: "content/ai-native/quiz/questions.json",
  },
];

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
} as const;

async function settle(page: Page, ms = 1800) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(ms);
}

async function open(page: Page, url: string, ms = 1800) {
  await page.goto(url);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const local = page.getByRole("button", { name: /lokal weiterlernen|continue locally/i });
  if (await local.isVisible().catch(() => false)) {
    await local.click({ timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(400);
  }
  await settle(page, ms);
}

async function seed(page: Page, slug: Slug, count: number, quizPassed = false) {
  const ids = CANONICAL_LESSON_IDS[slug].slice(0, count);
  const cp = lessonCompletionEvidenceCheckpointId(slug);
  const ok = await page.evaluate(
    ({ key, slug, ids, cp, quizPassed }) => {
      const storeKey = Object.keys(window.localStorage).find((k) => k.endsWith(key));
      if (!storeKey) return `no key among ${Object.keys(window.localStorage).join(",")}`;
      const state = JSON.parse(window.localStorage.getItem(storeKey) ?? "{}");
      const now = new Date().toISOString();
      state.courses ??= {};
      const slice = (state.courses[slug] ??= {
        lessons: {},
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: now,
        lastActivity: now,
      });
      for (const id of ids) {
        slice.lessons[id] = {
          sectionsRead: [`${id}_concept`, `${id}_exercise`],
          quizScore: 1,
          quizTotal: 2,
          completed: true,
          exercisesCompleted: {},
        };
        state.checkpoints[`${id}::${cp}`] = true;
        state.checkpoints[`${slug}:${id}::exercise`] = true;
      }
      if (quizPassed) slice.workshopQuiz = { passed: true, score: 0.95, completedAt: now };
      slice.lastActivity = now;
      window.localStorage.setItem(storeKey, JSON.stringify(state));
      return "ok";
    },
    { key: UNIFIED_STORAGE_KEY, slug, ids, cp, quizPassed },
  );
  if (ok !== "ok") throw new Error(ok);
}

function lessonChecks(file: string) {
  const data = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  return data.lessons[0].checks as { options: { text: string; correct: boolean }[] }[];
}

function quizAnswers(file: string): Map<string, string> {
  const data = JSON.parse(readFileSync(join(ROOT, file), "utf8")) as {
    questionText: string;
    answerOptions: { text: string; isCorrect: boolean }[];
  }[];
  return new Map(data.map((q) => [q.questionText, q.answerOptions.find((o) => o.isCorrect)!.text]));
}

for (const [device, use] of Object.entries(VIEWPORTS)) {
  test.describe(`course app shots ${device}`, () => {
    test.use(use);
    test.setTimeout(240_000);
    for (const course of COURSES) {
      test(`${course.slug} ${device}`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "konto-dom-mocked");
        const shot = (name: string, fullPage = false) =>
          page.screenshot({ path: `${OUT}/${course.slug}-${device}-${name}.png`, fullPage });

        page.setDefaultTimeout(15_000);
        // Hub, fresh. Choose local progress so the reader can save.
        await open(page, course.hub);
        await shot("hub-start");
        await shot("hub-start-full", true);

        // Lesson: Verstehen.
        await open(page, course.lesson);
        await shot("lesson-1-verstehen");
        // Ausprobieren.
        await page.locator("#lesson-exercise").scrollIntoViewIfNeeded();
        await page.evaluate(() => document.getElementById("lesson-exercise")?.scrollIntoView({ block: "start" }));
        await settle(page, 900);
        await shot("lesson-2-ausprobieren");
        // Prüfen: answer one wrong, then both correctly.
        await page.evaluate(() => document.getElementById("lesson-checks")?.scrollIntoView({ block: "start" }));
        await settle(page, 600);
        const checks = lessonChecks(course.lessonFile);
        const firstWrong = checks[0].options.find((o) => !o.correct)!;
        await page.getByRole("button", { name: firstWrong.text, exact: true }).click();
        await page.waitForTimeout(500);
        await shot("lesson-3-pruefen-feedback");
        for (const check of checks) {
          await page.getByRole("button", { name: check.options.find((o) => o.correct)!.text, exact: true }).click();
          await page.waitForTimeout(300);
        }
        await page.evaluate(() => document.getElementById("lesson-checks")?.scrollIntoView({ block: "start" }));
        await settle(page, 800);
        await shot("lesson-3-pruefen-solved");
        await page.evaluate(() => document.querySelector("[data-lesson-status]")?.scrollIntoView({ block: "center" }));
        await settle(page, 600);
        await shot("lesson-4-status");
        await shot("lesson-full", true);

        // Hub with progress.
        await seed(page, course.slug, 3);
        await open(page, course.hub, 2200);
        await shot("hub-progress");
        await shot("hub-progress-full", true);

        // Completed lesson moment.
        await open(page, course.lesson);
        await page.evaluate(() => document.querySelector("[data-lesson-status]")?.scrollIntoView({ block: "center" }));
        await settle(page, 600);
        await shot("lesson-5-complete");

        // Quiz.
        await seed(page, course.slug, CANONICAL_LESSON_IDS[course.slug].length);
        await open(page, `${course.hub}/quiz`, 1200);
        await shot("quiz-question");
        const answers = quizAnswers(course.quizFile);
        for (let index = 0; index < 40; index += 1) {
          const heading = page.locator("h2[id^='workshop-quiz-question-']");
          if ((await heading.count()) === 0) break;
          const text = (await heading.first().innerText()).trim();
          const answer = answers.get(text);
          if (!answer) throw new Error(`no answer for ${text}`);
          await page.getByRole("radio", { name: answer }).first().click();
          await page.waitForTimeout(250);
          if (index === 0) await shot("quiz-feedback");
          const next = page.locator("[data-quiz-action-bar] button");
          const label = (await next.innerText()).trim();
          await next.click();
          await page.waitForTimeout(450);
          if (/Ergebnis|Result/.test(label)) break;
        }
        await settle(page, 2000);
        await shot("quiz-result");
        await shot("quiz-result-full", true);

        // Certificate.
        await open(page, `${course.hub}/zertifikat`, 1200);
        await page.getByRole("textbox").first().fill("Alex Beispiel");
        await page.waitForTimeout(300);
        await shot("certificate");
        await shot("certificate-full", true);
      });
    }
  });
}
