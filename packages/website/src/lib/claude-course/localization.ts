import deQuestionsJson from "../../../content/claude/de/quiz/questions.json";
import enQuestionsJson from "../../../content/claude/quiz/questions.json";
import { CLAUDE_CONFIG, CLAUDE_CONFIG_DE } from "@/lib/course/config";
import type { QuizQuestion } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import {
  createTechnicalCourseLocaleRegistry,
  defineTechnicalCourseContentIdentity,
  defineTechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleRegistry,
} from "@/lib/technical-courses/localization";
import { technicalCourseConfigForBundle } from "@/lib/technical-courses/localization";
import { getAllClaudeLessons, getClaudeTracks } from "./data";
import type { ClaudeLesson, ClaudeTrack } from "./types";

export interface ClaudeCourseLocaleContent {
  readonly tracks: readonly ClaudeTrack[];
  readonly lessons: readonly ClaudeLesson[];
  readonly questions: readonly QuizQuestion[];
}

type ClaudeCourseRegistry = TechnicalCourseLocaleRegistry<
  "claude",
  ClaudeCourseLocaleContent
>;

const QUESTIONS_BY_LOCALE: Readonly<Record<Locale, readonly QuizQuestion[]>> = {
  de: deQuestionsJson as readonly QuizQuestion[],
  en: enQuestionsJson as readonly QuizQuestion[],
};

function checkpointKeys(lessons: readonly ClaudeLesson[]): readonly string[] {
  return lessons
    .flatMap((lesson) =>
      (lesson.widgets ?? []).map((widget) => {
        const props = widget.props ?? {};
        const lessonId = props.lessonId;
        const cpId = props.cpId;
        if (lessonId === undefined && cpId === undefined) return [];
        if (typeof lessonId !== "string" || typeof cpId !== "string") {
          throw new Error(
            `Claude widget "${widget.kind}" in lesson "${lesson.id}" has no stable checkpoint identity.`,
          );
        }
        if (lessonId !== lesson.id) {
          throw new Error(
            `Claude widget checkpoint "${lessonId}::${cpId}" is registered under lesson "${lesson.id}".`,
          );
        }
        return [`${lessonId}::${cpId}`];
      }),
    )
    .flat();
}

function contentIdentity(content: ClaudeCourseLocaleContent) {
  return defineTechnicalCourseContentIdentity("claude", {
    unitIds: content.tracks.map(({ id }) => id),
    contentItemIds: content.lessons.map(({ id }) => id),
    progressKeys: content.lessons.map(({ id }) => id),
    sectionIdsByProgressKey: Object.fromEntries(
      content.lessons.map((lesson) => [
        lesson.id,
        lesson.sections.map(({ id }) => id),
      ]),
    ),
    workshopQuestions: content.questions.map((question) => ({
      id: question.id,
      answerOptions: question.answerOptions.map((option) => ({
        id: option.id,
        isCorrect: option.isCorrect,
      })),
    })),
    checkpointKeys: checkpointKeys(content.lessons),
  });
}

async function contentForLocale(
  locale: Locale,
): Promise<ClaudeCourseLocaleContent> {
  const lessons = await getAllClaudeLessons(locale);
  if (lessons.length !== 12) {
    throw new Error(
      `Claude course locale "${locale}" resolved ${lessons.length} of 12 lessons.`,
    );
  }
  return Object.freeze({
    tracks: getClaudeTracks(locale),
    lessons,
    questions: QUESTIONS_BY_LOCALE[locale],
  });
}

async function createRegistry(): Promise<ClaudeCourseRegistry> {
  const [deContent, enContent] = await Promise.all([
    contentForLocale("de"),
    contentForLocale("en"),
  ]);
  const deBundle = defineTechnicalCourseLocaleBundle({
    courseSlug: "claude",
    locale: "de",
    config: technicalCourseConfigForBundle("claude", "de", CLAUDE_CONFIG_DE),
    identity: contentIdentity(deContent),
    content: deContent,
  });
  const enBundle = defineTechnicalCourseLocaleBundle({
    courseSlug: "claude",
    locale: "en",
    config: technicalCourseConfigForBundle("claude", "en", CLAUDE_CONFIG),
    identity: contentIdentity(enContent),
    content: enContent,
  });

  return createTechnicalCourseLocaleRegistry({
    courseSlug: "claude",
    sourceLocale: "en",
    bundles: { de: deBundle, en: enBundle },
  });
}

let registryPromise: Promise<ClaudeCourseRegistry> | null = null;

export function getClaudeCourseLocaleRegistry(): Promise<ClaudeCourseRegistry> {
  registryPromise ??= createRegistry();
  return registryPromise;
}

export async function getClaudeCourseBundle(locale: Locale) {
  return (await getClaudeCourseLocaleRegistry()).get(locale);
}

export function __resetClaudeCourseLocaleRegistryForTests(): void {
  registryPromise = null;
}
