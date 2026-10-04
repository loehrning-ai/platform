import type {
  BlockDefinition,
  BlockId,
  CourseConfig,
  CourseSlug,
  GlossaryEntry,
  Lesson,
  QuizQuestion,
} from "./types";
import type { Widget } from "@/lib/widgets/types";
import type { Locale } from "@/lib/i18n/locale";
import { isEngineLesson, projectEngineLesson } from "@/lib/lesson-engine/lesson";

// Course configs live in ./config (performance hardening) so config-only client
// components avoid this module's heavy JSON graph. Re-exported below for
// backward compatibility — server-side callers keep importing from ./data.
import {
  AI_NATIVE_EN_CONFIG,
  AI_NATIVE_CONFIG,
  EU_AI_ACT_KURS_EN_CONFIG,
  EU_AI_ACT_KURS_CONFIG,
  getCourseConfig,
  KI_FUEHRERSCHEIN_CONFIG,
  KI_FUEHRERSCHEIN_EN_CONFIG,
  KI_UND_GESELLSCHAFT_CONFIG,
  KI_UND_GESELLSCHAFT_EN_CONFIG,
} from "./config";

export {
  getCourseConfig,
  getCourseBlockIds,
  getRegisteredCourseSlugs,
  isCourseRegistered,
  getWorkshopPassThreshold,
  getWorkshopQuestionCount,
  getWorkshopTimeLimitMinutes,
} from "./config";

// ─── KI-Führerschein content ───────────────────────────────────

import kfBlock1 from "../../../content/ki-fuehrerschein/block-1-daten-lessons.json";
import kfBlock2 from "../../../content/ki-fuehrerschein/block-2-briefen-lessons.json";
import kfBlock3 from "../../../content/ki-fuehrerschein/block-3-pruefen-lessons.json";
import kfBlock4 from "../../../content/ki-fuehrerschein/block-4-regeln-lessons.json";
import kfWorkshop from "../../../content/ki-fuehrerschein/quiz/questions.json";
import kfEnBlock1 from "../../../content/ki-fuehrerschein/en/block-1-daten-lessons.json";
import kfEnBlock2 from "../../../content/ki-fuehrerschein/en/block-2-briefen-lessons.json";
import kfEnBlock3 from "../../../content/ki-fuehrerschein/en/block-3-pruefen-lessons.json";
import kfEnBlock4 from "../../../content/ki-fuehrerschein/en/block-4-regeln-lessons.json";
import kfEnWorkshop from "../../../content/ki-fuehrerschein/en/quiz/questions.json";

// ─── EU AI Act Kurs content ────────────────────────────────────

import eaBlock1 from "../../../content/eu-ai-act-kurs/block-1-grundlagen-lessons.json";
import eaBlock2 from "../../../content/eu-ai-act-kurs/block-2-risikoklassen-lessons.json";
import eaBlock3 from "../../../content/eu-ai-act-kurs/block-3-hochrisiko-lessons.json";
import eaBlock4 from "../../../content/eu-ai-act-kurs/block-4-gpai-transparenz-lessons.json";
import eaBlock5 from "../../../content/eu-ai-act-kurs/block-5-governance-lessons.json";
import eaBlock6 from "../../../content/eu-ai-act-kurs/block-6-praxis-lessons.json";
import eaWorkshop from "../../../content/eu-ai-act-kurs/quiz/questions.json";
import eaEnBlock1 from "../../../content/eu-ai-act-kurs/en/block-1-grundlagen-lessons.json";
import eaEnBlock2 from "../../../content/eu-ai-act-kurs/en/block-2-risikoklassen-lessons.json";
import eaEnBlock3 from "../../../content/eu-ai-act-kurs/en/block-3-hochrisiko-lessons.json";
import eaEnBlock4 from "../../../content/eu-ai-act-kurs/en/block-4-gpai-transparenz-lessons.json";
import eaEnBlock5 from "../../../content/eu-ai-act-kurs/en/block-5-governance-lessons.json";
import eaEnBlock6 from "../../../content/eu-ai-act-kurs/en/block-6-praxis-lessons.json";
import eaEnWorkshop from "../../../content/eu-ai-act-kurs/en/quiz/questions.json";

// ─── KI und Gesellschaft content (lesson engine) ────────────────────

import kugBlock1 from "../../../content/ki-und-gesellschaft/block-1-arbeit-lessons.json";
import kugBlock2 from "../../../content/ki-und-gesellschaft/block-2-fakes-lessons.json";
import kugBlock3 from "../../../content/ki-und-gesellschaft/block-3-fairness-lessons.json";
import kugWorkshop from "../../../content/ki-und-gesellschaft/quiz/questions.json";
import kugEnBlock1 from "../../../content/ki-und-gesellschaft/en/block-1-arbeit-lessons.json";
import kugEnBlock2 from "../../../content/ki-und-gesellschaft/en/block-2-fakes-lessons.json";
import kugEnBlock3 from "../../../content/ki-und-gesellschaft/en/block-3-fairness-lessons.json";
import kugEnWorkshop from "../../../content/ki-und-gesellschaft/en/quiz/questions.json";

// ─── AI-Native workshop quiz (shared course architecture) ─

import anWorkshop from "../../../content/ai-native/quiz/questions.json";
import anEnWorkshop from "../../../content/ai-native/en/quiz/questions.json";

// ─── KI-Führerschein glossary (shared course architecture) ──────────────
// The 42-term glossary was previously unimported dead data. It now has a
// typed loader so lessons can wire it as `Flashcards` drills (and a future
// glossary page can reuse the same accessor).

import kfGlossary from "../../../content/ki-fuehrerschein/glossary.json";
import kfEnGlossary from "../../../content/ki-fuehrerschein/en/glossary.json";

// ─── EU AI Act Kurs glossary (shared course architecture) ───────────────
// Risikostufen + Verordnung (EU) 2024/1689 terminology. Registered below in
// GLOSSARIES so the same auto-injection machinery surfaces a per-block
// Flashcards review deck (filtered via `relatedBlocks`).

import eaGlossary from "../../../content/eu-ai-act-kurs/glossary.json";
import eaEnGlossary from "../../../content/eu-ai-act-kurs/en/glossary.json";

// ─── Shared types ──────────────────────────────────────────────

type BlockMeta = {
  title: string;
  description: string;
  durationMinutes: number;
};

type RawBlockContent = {
  readonly lessons: Lesson[];
  readonly lastReviewed?: string;
  readonly nextReview?: string;
  readonly riskClass?: string;
};

type CourseData = {
  readonly config: CourseConfig;
  readonly blockMeta: Partial<Record<BlockId, BlockMeta>>;
  readonly lessonData: Partial<Record<BlockId, RawBlockContent>>;
  readonly workshopQuestions: QuizQuestion[];
  readonly glossary: readonly GlossaryEntry[];
  readonly glossaryFlashcardsTitle: string;
};

// ─── KI-Führerschein course config ─────────────────────────────

// KI-Führerschein runs on the lesson engine (docs/lesson-engine.md): four
// modules (block_1..block_4), two lessons each, about 45 minutes.
const KI_FUEHRERSCHEIN: CourseData = {
  config: KI_FUEHRERSCHEIN_CONFIG,
  blockMeta: {
    block_1: {
      title: "Was darf rein?",
      description:
        "Daten einstufen und schwärzen, bevor sie in ein KI-Tool gehen.",
      durationMinutes: 12,
    },
    block_2: {
      title: "Gut briefen",
      description:
        "Aufträge schreiben, deren Ergebnis du prüfen kannst.",
      durationMinutes: 11,
    },
    block_3: {
      title: "Prüfen",
      description:
        "Fehler gegen Quellen finden und die Prüftiefe nach Wirkung wählen.",
      durationMinutes: 11,
    },
    block_4: {
      title: "Regeln fürs Team",
      description:
        "Freigaben entscheiden und eine einseitige Team-Richtlinie erstellen.",
      durationMinutes: 11,
    },
  },
  lessonData: {
    block_1: kfBlock1 as unknown as RawBlockContent,
    block_2: kfBlock2 as unknown as RawBlockContent,
    block_3: kfBlock3 as unknown as RawBlockContent,
    block_4: kfBlock4 as unknown as RawBlockContent,
  },
  workshopQuestions: kfWorkshop as unknown as QuizQuestion[],
  glossary: kfGlossary as unknown as GlossaryEntry[],
  glossaryFlashcardsTitle: "Glossar-Karten zu diesem Block",
};

const KI_FUEHRERSCHEIN_EN: CourseData = {
  config: KI_FUEHRERSCHEIN_EN_CONFIG,
  blockMeta: {
    block_1: {
      title: "What may go in?",
      description:
        "Classify and redact data before it enters an AI tool.",
      durationMinutes: 12,
    },
    block_2: {
      title: "Brief well",
      description:
        "Write briefs whose results you can check.",
      durationMinutes: 11,
    },
    block_3: {
      title: "Check",
      description:
        "Find errors against sources and choose the review depth by impact.",
      durationMinutes: 11,
    },
    block_4: {
      title: "Rules for the team",
      description:
        "Decide approvals and build a one-page team policy.",
      durationMinutes: 11,
    },
  },
  lessonData: {
    block_1: kfEnBlock1 as unknown as RawBlockContent,
    block_2: kfEnBlock2 as unknown as RawBlockContent,
    block_3: kfEnBlock3 as unknown as RawBlockContent,
    block_4: kfEnBlock4 as unknown as RawBlockContent,
  },
  workshopQuestions: kfEnWorkshop as unknown as QuizQuestion[],
  glossary: kfEnGlossary as unknown as GlossaryEntry[],
  glossaryFlashcardsTitle: "Glossary cards for this block",
};

// ─── EU AI Act Kurs course config ──────────────────────────────

const EU_AI_ACT_KURS: CourseData = {
  config: EU_AI_ACT_KURS_CONFIG,
  blockMeta: {
    block_1: {
      title: "Geltungsbereich, Rollen und Fristen",
      description:
        "Wer erfasst ist, welche Rollen es gibt und welche Fristen gelten.",
      durationMinutes: 16,
    },
    block_2: {
      title: "Die 4 Risikoklassen",
      description:
        "KI-Systeme als verboten, hochriskant, begrenzt oder minimal einordnen.",
      durationMinutes: 18,
    },
    block_3: {
      title: "Hochrisiko-Pflichten",
      description:
        "Risikomanagement, Dokumentation, Aufsicht und Konformitätsbewertung (Art. 9-43).",
      durationMinutes: 20,
    },
    block_4: {
      title: "GPAI, Art. 4 & Transparenz",
      description:
        "Basismodelle, KI-Kompetenz nach Art. 4 und Transparenz nach Art. 50.",
      durationMinutes: 20,
    },
    block_5: {
      title: "Governance & Sanktionen",
      description:
        "AI Office, nationale Behörden, Bußgelder bis 35 Mio. EUR oder 7 % des Umsatzes, Sandboxes, Meldewege.",
      durationMinutes: 16,
    },
    block_6: {
      title: "Praxis: Umsetzung im Mittelstand",
      description:
        "Audit in fünf Schritten, Abgleich mit der DSGVO, Vorlagen und ein Fallbeispiel aus dem Mittelstand.",
      durationMinutes: 20,
    },
  },
  lessonData: {
    block_1: eaBlock1 as RawBlockContent,
    block_2: eaBlock2 as RawBlockContent,
    block_3: eaBlock3 as RawBlockContent,
    block_4: eaBlock4 as RawBlockContent,
    block_5: eaBlock5 as RawBlockContent,
    block_6: eaBlock6 as RawBlockContent,
  },
  workshopQuestions: eaWorkshop as unknown as QuizQuestion[],
  glossary: eaGlossary as unknown as GlossaryEntry[],
  glossaryFlashcardsTitle: "Glossar-Karten zu diesem Block",
};

const EU_AI_ACT_KURS_EN: CourseData = {
  config: EU_AI_ACT_KURS_EN_CONFIG,
  blockMeta: {
    block_1: {
      title: "Scope, roles, and application dates",
      description:
        "Who is covered, which roles exist and which dates apply.",
      durationMinutes: 16,
    },
    block_2: {
      title: "Risk categories and classification",
      description:
        "Classify AI systems as prohibited, high-risk, limited or minimal risk.",
      durationMinutes: 18,
    },
    block_3: {
      title: "High-risk system obligations",
      description:
        "Risk management, documentation, oversight and conformity assessment (Art. 9-43).",
      durationMinutes: 20,
    },
    block_4: {
      title: "GPAI, AI literacy, and transparency",
      description:
        "Foundation models, AI literacy under Article 4, transparency under Article 50.",
      durationMinutes: 20,
    },
    block_5: {
      title: "Governance and penalties",
      description:
        "AI Office, national authorities, fines up to EUR 35 million or 7% of turnover, sandboxes, reporting routes.",
      durationMinutes: 16,
    },
    block_6: {
      title: "Implementation for smaller organizations",
      description:
        "Five-step audit, alignment with GDPR, templates and an SME case study.",
      durationMinutes: 20,
    },
  },
  lessonData: {
    block_1: eaEnBlock1 as RawBlockContent,
    block_2: eaEnBlock2 as RawBlockContent,
    block_3: eaEnBlock3 as RawBlockContent,
    block_4: eaEnBlock4 as RawBlockContent,
    block_5: eaEnBlock5 as RawBlockContent,
    block_6: eaEnBlock6 as RawBlockContent,
  },
  workshopQuestions: eaEnWorkshop as unknown as QuizQuestion[],
  glossary: eaEnGlossary as unknown as GlossaryEntry[],
  glossaryFlashcardsTitle: "Glossary cards for this block",
};

// ─── AI-Native course config (shared course architecture) ──
//
// AI-Native folds into the shared engine so it gets the same workshop-quiz +
// certificate + verification components as the two free courses. Its lessons
// live in `lib/ai-native` (keyed by `ModuleId`, not `BlockId`), so the
// shared block-based lesson queries are intentionally empty here: the shared
// quiz, certificate, and verification pages only read `config` and
// `workshopQuestions`.
const AI_NATIVE: CourseData = {
  config: AI_NATIVE_CONFIG,
  blockMeta: {},
  lessonData: {},
  workshopQuestions: anWorkshop as unknown as QuizQuestion[],
  glossary: [],
  glossaryFlashcardsTitle: "Glossar-Karten zu diesem Block",
};

const AI_NATIVE_EN: CourseData = {
  config: AI_NATIVE_EN_CONFIG,
  blockMeta: {},
  lessonData: {},
  workshopQuestions: anEnWorkshop as unknown as QuizQuestion[],
  glossary: [],
  glossaryFlashcardsTitle: "Glossary cards for this module",
};

// ─── KI und Gesellschaft ────────────────────────────────────────────────────
//
// Runs on the lesson engine (docs/lesson-engine.md): three modules
// (block_1..block_3), eight lessons, about 40 minutes. Workshop quiz
// (15 questions) wired in the shared course engine.
const KI_UND_GESELLSCHAFT: CourseData = {
  config: KI_UND_GESELLSCHAFT_CONFIG,
  blockMeta: {
    block_1: {
      title: "Jobzahlen lesen",
      description:
        "Exposition, Potenzial und Prognose trennen und das eigene Aufgabenprofil bewerten.",
      durationMinutes: 10,
    },
    block_2: {
      title: "Fakes prüfen",
      description:
        "Herkunft prüfen, Detektorwerte nachrechnen und den richtigen Meldeweg wählen.",
      durationMinutes: 15,
    },
    block_3: {
      title: "Fairness messen",
      description:
        "Fehler je Gruppe lesen, den Zielkonflikt der Fairness-Maße erleben und Verantwortung zuordnen.",
      durationMinutes: 15,
    },
  },
  lessonData: {
    block_1: kugBlock1 as unknown as RawBlockContent,
    block_2: kugBlock2 as unknown as RawBlockContent,
    block_3: kugBlock3 as unknown as RawBlockContent,
  },
  workshopQuestions: kugWorkshop as unknown as QuizQuestion[],
  glossary: [],
  glossaryFlashcardsTitle: "Glossar-Karten zu diesem Block",
};

const KI_UND_GESELLSCHAFT_EN: CourseData = {
  config: KI_UND_GESELLSCHAFT_EN_CONFIG,
  blockMeta: {
    block_1: {
      title: "Reading jobs figures",
      description:
        "Separate exposure, potential and forecasts, and assess your own task profile.",
      durationMinutes: 10,
    },
    block_2: {
      title: "Checking fakes",
      description:
        "Trace provenance, work out what detector scores mean and choose the right reporting route.",
      durationMinutes: 15,
    },
    block_3: {
      title: "Measuring fairness",
      description:
        "Read errors per group, experience the trade-off between fairness measures and assign accountability.",
      durationMinutes: 15,
    },
  },
  lessonData: {
    block_1: kugEnBlock1 as unknown as RawBlockContent,
    block_2: kugEnBlock2 as unknown as RawBlockContent,
    block_3: kugEnBlock3 as unknown as RawBlockContent,
  },
  workshopQuestions: kugEnWorkshop as unknown as QuizQuestion[],
  glossary: [],
  glossaryFlashcardsTitle: "Glossary cards for this block",
};

// ─── Course registry ───────────────────────────────────────────

const COURSES: Partial<
  Record<CourseSlug, Partial<Record<Locale, CourseData>>>
> = {
  "ki-fuehrerschein": {
    de: KI_FUEHRERSCHEIN,
    en: KI_FUEHRERSCHEIN_EN,
  },
  "eu-ai-act-kurs": {
    de: EU_AI_ACT_KURS,
    en: EU_AI_ACT_KURS_EN,
  },
  "ai-native": { de: AI_NATIVE, en: AI_NATIVE_EN },
  "ki-und-gesellschaft": {
    de: KI_UND_GESELLSCHAFT,
    en: KI_UND_GESELLSCHAFT_EN,
  },
};

function course(courseSlug: CourseSlug, locale?: Locale): CourseData {
  const contentLocale: Locale = locale ?? "de";
  const data = COURSES[courseSlug]?.[contentLocale];
  if (!data) {
    throw new Error(
      locale === undefined
        ? `Course "${courseSlug}" is not registered in the shared engine.`
        : `Course "${courseSlug}" has no audited "${locale}" content bundle registered.`,
    );
  }
  return data;
}

/**
 * Authored lessons of one block. Lesson-engine lessons get their legacy
 * `sections`/`quiz` projection here (see lib/lesson-engine/lesson.ts), so
 * old- and new-format courses flow through the same queries during the
 * transition.
 */
function authoredBlockLessons(
  data: CourseData,
  blockId: BlockId,
): readonly Lesson[] {
  return (data.lessonData[blockId]?.lessons ?? []).map(projectEngineLesson);
}

// ─── Glossary-driven flashcards injection (shared course architecture) ──
//
// The 42-term glossary is the single source: rather than copy card text into
// the block JSON (drift risk), we derive a `flashcards` widget for each block
// from `getGlossaryTerms(slug, blockId)` and attach it to the LAST lesson of
// the block (placement "end"), so the learner reviews that block's vocabulary
// once they have worked through it. Checkpoint storage is global, so both the
// course and lesson must participate in the key. Several courses intentionally
// reuse block/lesson ids; leaving the course out would complete another
// course's glossary checkpoint.

function glossaryFlashcardsWidget(
  courseSlug: CourseSlug,
  blockId: BlockId,
  lessonId: string,
  locale?: Locale,
): Widget | null {
  const terms = getGlossaryTerms(courseSlug, blockId, locale);
  if (terms.length === 0) return null;
  const data = course(courseSlug, locale);
  return {
    kind: "flashcards",
    placement: "end",
    courseSlug: courseSlug as Widget["courseSlug"],
    props: {
      lessonId: `${courseSlug}:${lessonId}`,
      cpId: `glossar-${blockId}`,
      title: data.glossaryFlashcardsTitle,
      cards: terms.map((t) => ({
        term: locale === "en" ? t.term : t.english,
        q: locale === "en" ? t.english : t.term,
        a: t.definition,
      })),
      ...(locale === "en"
        ? {
            copy: {
              kindLabel: "Cards",
              revealHint: "Select to reveal",
              backLabel: "Answer",
              flipBackHint: "Select to return",
              prevLabel: "Previous",
              nextLabel: "Next",
              emptyLabel: "No cards available.",
              ariaLabelTemplate:
                "Card {current} of {total}. Press Space or select to flip.",
            },
          }
        : {}),
    },
  };
}

/**
 * Return the block's lessons with the glossary flashcards widget appended to
 * the last lesson (immutable: produces new lesson objects, never mutates the
 * imported JSON). Lessons that already declare an "end" flashcards widget are
 * left untouched so authored JSON wins over the auto-injected deck.
 */
function withGlossaryFlashcards(
  courseSlug: CourseSlug,
  blockId: BlockId,
  lessons: readonly Lesson[],
  locale?: Locale,
): readonly Lesson[] {
  if (lessons.length === 0) return lessons;
  // Lesson-engine lessons carry exactly one exercise; the glossary deck is a
  // legacy add-on and is not injected into them.
  if (lessons.some((lesson) => isEngineLesson(lesson))) return lessons;
  const widget = glossaryFlashcardsWidget(
    courseSlug,
    blockId,
    lessons[lessons.length - 1].id,
    locale,
  );
  if (!widget) return lessons;
  const lastIndex = lessons.length - 1;
  return lessons.map((lesson, i) => {
    if (i !== lastIndex) return lesson;
    const existing = lesson.widgets ?? [];
    const alreadyHasGlossary = existing.some(
      (w) => w.kind === "flashcards" && w.placement === "end",
    );
    if (alreadyHasGlossary) return lesson;
    return { ...lesson, widgets: [...existing, widget] };
  });
}

// ─── Block + lesson queries ────────────────────────────────────

export function getBlocks(
  courseSlug: CourseSlug,
  locale?: Locale,
): readonly BlockDefinition[] {
  const data = course(courseSlug, locale);
  return getCourseConfig(courseSlug, locale).blockIds.map((id, i) => {
    const meta = data.blockMeta[id];
    return {
      id,
      title: meta?.title ?? id,
      description: meta?.description ?? "",
      durationMinutes: meta?.durationMinutes ?? 0,
      orderIndex: i,
      lessons: withGlossaryFlashcards(
        courseSlug,
        id,
        authoredBlockLessons(data, id),
        locale,
      ),
    };
  });
}

export function getBlock(
  courseSlug: CourseSlug,
  blockId: BlockId,
  locale?: Locale,
): BlockDefinition | undefined {
  return getBlocks(courseSlug, locale).find((b) => b.id === blockId);
}

export function getBlockLessons(
  courseSlug: CourseSlug,
  blockId: BlockId,
  locale?: Locale,
): readonly Lesson[] {
  return withGlossaryFlashcards(
    courseSlug,
    blockId,
    authoredBlockLessons(course(courseSlug, locale), blockId),
    locale,
  );
}

export function getAllLessons(
  courseSlug: CourseSlug,
  locale?: Locale,
): readonly Lesson[] {
  const data = course(courseSlug, locale);
  return getCourseConfig(courseSlug, locale).blockIds.flatMap((id) =>
    withGlossaryFlashcards(
      courseSlug,
      id,
      authoredBlockLessons(data, id),
      locale,
    ),
  );
}

export function getTotalLessonCount(
  courseSlug: CourseSlug,
  locale?: Locale,
): number {
  return getAllLessons(courseSlug, locale).length;
}

export function getBlockLessonCount(
  courseSlug: CourseSlug,
  blockId: BlockId,
  locale?: Locale,
): number {
  return getBlockLessons(courseSlug, blockId, locale).length;
}

export function getBlockLessonIds(
  courseSlug: CourseSlug,
  blockId: BlockId,
  locale?: Locale,
): readonly string[] {
  return getBlockLessons(courseSlug, blockId, locale).map((l) => l.id);
}

// ─── Workshop quiz queries ─────────────────────────────────────
//
// Sync accessor for server/test use. Client components load questions via
// `loadWorkshopQuestions` in ./questions (per-course dynamic import) so the
// quiz JSON stays out of the initial route bundles (performance hardening).

export function getWorkshopQuestions(
  courseSlug: CourseSlug,
  locale?: Locale,
): readonly QuizQuestion[] {
  return course(courseSlug, locale).workshopQuestions;
}

// ─── Block freshness queries ─────────────────────────────────────────────────
//
// The lesson block JSON files carry top-level freshness metadata added in
// This accessor lets server components (BlockPageShell)
// read the block's review date + risk class to render a <FreshnessBadge>.

export interface BlockFreshness {
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly riskClass: string;
}

function extractFreshness(raw: RawBlockContent): BlockFreshness {
  return {
    lastReviewed: raw.lastReviewed ?? "",
    nextReview: raw.nextReview ?? "",
    riskClass: raw.riskClass ?? "",
  };
}

export function getBlockFreshness(
  courseSlug: CourseSlug,
  blockId: BlockId,
  locale?: Locale,
): BlockFreshness | null {
  const raw = course(courseSlug, locale).lessonData[blockId];
  return raw ? extractFreshness(raw) : null;
}

/** Alias retained for block-page-shell.tsx compatibility. */
export function getBlockFreshnessMeta(
  courseSlug: CourseSlug,
  blockId: BlockId,
  locale?: Locale,
): BlockFreshness | null {
  return getBlockFreshness(courseSlug, blockId, locale);
}

// ─── Glossary queries (shared course architecture + 12) ─────────────────
//
// KI-Führerschein and EU-AI-Act-Kurs each ship a glossary.
// The accessor is keyed by course slug so a future AI-Native glossary drops
// in here with zero call-site churn. Courses without a glossary return an
// empty list.

/**
 * Return the glossary terms for a course, optionally filtered to those tagged
 * with a given block via `relatedBlocks`. Returns a stable, term-sorted copy
 * (immutable — never mutates the imported JSON).
 */
export function getGlossaryTerms(
  courseSlug: CourseSlug,
  blockId?: BlockId,
  locale?: Locale,
): readonly GlossaryEntry[] {
  const all = course(courseSlug, locale).glossary;
  const filtered = blockId
    ? all.filter((t) => t.relatedBlocks?.includes(blockId))
    : all;
  return [...filtered].sort((a, b) =>
    a.term.localeCompare(b.term, locale ?? "de"),
  );
}

export function getGlossaryTermCount(
  courseSlug: CourseSlug,
  locale?: Locale,
): number {
  return course(courseSlug, locale).glossary.length;
}
