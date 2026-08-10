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

import kfBlock1 from "../../../content/ki-fuehrerschein/block-1-entdeckung-lessons.json";
import kfBlock2 from "../../../content/ki-fuehrerschein/block-2-datenschutz-lessons.json";
import kfBlock3 from "../../../content/ki-fuehrerschein/block-3-anwendung-lessons.json";
import kfBlock4 from "../../../content/ki-fuehrerschein/block-4-verifikation-lessons.json";
import kfBlock5 from "../../../content/ki-fuehrerschein/block-5-richtlinie-lessons.json";
import kfWorkshop from "../../../content/ki-fuehrerschein/quiz/questions.json";
import kfEnBlock1 from "../../../content/ki-fuehrerschein/en/block-1-entdeckung-lessons.json";
import kfEnBlock2 from "../../../content/ki-fuehrerschein/en/block-2-datenschutz-lessons.json";
import kfEnBlock3 from "../../../content/ki-fuehrerschein/en/block-3-anwendung-lessons.json";
import kfEnBlock4 from "../../../content/ki-fuehrerschein/en/block-4-verifikation-lessons.json";
import kfEnBlock5 from "../../../content/ki-fuehrerschein/en/block-5-richtlinie-lessons.json";
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

// ─── KI und Gesellschaft content (KI und Gesellschaft course review) ────────────────────

import kugBlock1 from "../../../content/ki-und-gesellschaft/block-1-arbeit-lessons.json";
import kugBlock2 from "../../../content/ki-und-gesellschaft/block-2-deepfakes-lessons.json";
import kugBlock3 from "../../../content/ki-und-gesellschaft/block-3-ethik-lessons.json";
import kugWorkshop from "../../../content/ki-und-gesellschaft/quiz/questions.json";
import kugEnBlock1 from "../../../content/ki-und-gesellschaft/en/block-1-arbeit-lessons.json";
import kugEnBlock2 from "../../../content/ki-und-gesellschaft/en/block-2-deepfakes-lessons.json";
import kugEnBlock3 from "../../../content/ki-und-gesellschaft/en/block-3-ethik-lessons.json";
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

const KI_FUEHRERSCHEIN: CourseData = {
  config: KI_FUEHRERSCHEIN_CONFIG,
  blockMeta: {
    block_1: {
      title: "KI ist schon da",
      description:
        "Erkenne, welche KI-Systeme du bereits täglich nutzt — und warum das der erste Schritt ist.",
      durationMinutes: 10,
    },
    block_2: {
      title: "Datenschutz und KI",
      description:
        "4-Stufen-Datenklassifikation für KI-Tools. Wissen, welche Daten in welches Tool gehören.",
      durationMinutes: 15,
    },
    block_3: {
      title: "KI anwenden",
      description:
        "4 praktische Aufgaben: E-Mail, Meeting-Protokoll, Datenanalyse, Bericht.",
      durationMinutes: 30,
    },
    block_4: {
      title: "KI-Output prüfen",
      description:
        "3-Schritt-Prüfung, Halluzinationen erkennen, Vertrauensgrenzen kennen.",
      durationMinutes: 20,
    },
    block_5: {
      title: "KI-Richtlinie Schritt für Schritt",
      description:
        "So entsteht eine KI-Nutzungsrichtlinie Schritt für Schritt. Was Art. 4 dazu zu sagen hat.",
      durationMinutes: 25,
    },
  },
  lessonData: {
    block_1: kfBlock1 as RawBlockContent,
    block_2: kfBlock2 as RawBlockContent,
    block_3: kfBlock3 as RawBlockContent,
    block_4: kfBlock4 as RawBlockContent,
    block_5: kfBlock5 as RawBlockContent,
  },
  workshopQuestions: kfWorkshop as unknown as QuizQuestion[],
  glossary: kfGlossary as unknown as GlossaryEntry[],
  glossaryFlashcardsTitle: "Glossar-Karten zu diesem Block",
};

const KI_FUEHRERSCHEIN_EN: CourseData = {
  config: KI_FUEHRERSCHEIN_EN_CONFIG,
  blockMeta: {
    block_1: {
      title: "AI is already here",
      description:
        "Identify the AI systems you already use and the decisions they influence.",
      durationMinutes: 10,
    },
    block_2: {
      title: "Data protection and AI",
      description:
        "Classify data before it enters an AI tool and assess the product, contract, and configuration.",
      durationMinutes: 15,
    },
    block_3: {
      title: "Applying AI at work",
      description:
        "Work through four concrete tasks: email, meeting notes, data analysis, and reporting.",
      durationMinutes: 30,
    },
    block_4: {
      title: "Checking AI output",
      description:
        "Use a three-step review, identify hallucinations, and set clear trust boundaries.",
      durationMinutes: 20,
    },
    block_5: {
      title: "Building an AI use policy",
      description:
        "Define approved tools, data rules, review duties, and incident handling for an organization.",
      durationMinutes: 25,
    },
  },
  lessonData: {
    block_1: kfEnBlock1 as RawBlockContent,
    block_2: kfEnBlock2 as RawBlockContent,
    block_3: kfEnBlock3 as RawBlockContent,
    block_4: kfEnBlock4 as RawBlockContent,
    block_5: kfEnBlock5 as RawBlockContent,
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
      title: "Warum & Für wen",
      description:
        "Weshalb die KI-Verordnung existiert, wer betroffen ist und welche Fristen jetzt zählen.",
      durationMinutes: 16,
    },
    block_2: {
      title: "Die 4 Risikoklassen",
      description:
        "Verboten, hochriskant, begrenzt oder minimal: so klassifizierst du KI-Systeme sicher.",
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
        "Basismodelle, KI-Kompetenz als Organisationspflicht und Regeln für generative KI.",
      durationMinutes: 20,
    },
    block_5: {
      title: "Governance & Sanktionen",
      description:
        "AI Office, nationale Behörden, Bußgelder bis 35 Mio EUR, Sandboxes, Meldewege.",
      durationMinutes: 16,
    },
    block_6: {
      title: "Praxis: Umsetzung im Mittelstand",
      description:
        "5-Schritte-Audit, DSGVO-Brücke, Vorlagen und ein Mittelstand-Fallbeispiel.",
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
        "Identify who the Regulation covers, distinguish provider and deployer roles, and map the dates that apply.",
      durationMinutes: 16,
    },
    block_2: {
      title: "Risk categories and classification",
      description:
        "Work through prohibited practices, high-risk systems, transparency duties, and minimal-risk uses.",
      durationMinutes: 18,
    },
    block_3: {
      title: "High-risk system obligations",
      description:
        "Separate provider and deployer duties for risk management, documentation, oversight, and conformity assessment.",
      durationMinutes: 20,
    },
    block_4: {
      title: "GPAI, AI literacy, and transparency",
      description:
        "Assess general-purpose AI duties, Article 4 measures, and Article 50 disclosure requirements.",
      durationMinutes: 20,
    },
    block_5: {
      title: "Governance and penalties",
      description:
        "Understand the roles of EU and national authorities, enforcement routes, sandboxes, and penalty limits.",
      durationMinutes: 16,
    },
    block_6: {
      title: "Implementation for smaller organizations",
      description:
        "Build an evidence-based inventory, connect AI Act and GDPR work, and assign accountable next steps.",
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
// Three-block mini-course: KI und Arbeit (block_1), Deepfakes erkennen
// (block_2), Ethik und Bias (block_3). Workshop quiz (15 questions) wired in
// the shared course engine.
const KI_UND_GESELLSCHAFT: CourseData = {
  config: KI_UND_GESELLSCHAFT_CONFIG,
  blockMeta: {
    block_1: {
      title: "KI und Arbeit",
      description:
        "Ordne Befunde zu Automatisierung ein: Aufgaben statt ganzer Berufe, Datenbasis, Zeithorizont und konkrete Handlungsoptionen.",
      durationMinutes: 16,
    },
    block_2: {
      title: "Deepfakes erkennen",
      description:
        "Verstehe, wie synthetische Medien entstehen, und kombiniere Quellen-, Kontext- und Werkzeugprüfung.",
      durationMinutes: 14,
    },
    block_3: {
      title: "Ethik und Bias",
      description:
        "Untersuche dokumentierte Bias-Fälle und trenne Probleme in Daten, Modellen, Entscheidungen und Verantwortlichkeit.",
      durationMinutes: 16,
    },
  },
  lessonData: {
    block_1: kugBlock1 as RawBlockContent,
    block_2: kugBlock2 as RawBlockContent,
    block_3: kugBlock3 as RawBlockContent,
  },
  workshopQuestions: kugWorkshop as unknown as QuizQuestion[],
  glossary: [],
  glossaryFlashcardsTitle: "Glossar-Karten zu diesem Block",
};

const KI_UND_GESELLSCHAFT_EN: CourseData = {
  config: KI_UND_GESELLSCHAFT_EN_CONFIG,
  blockMeta: {
    block_1: {
      title: "AI and work",
      description:
        "Separate changes to individual tasks from changes to entire occupations, examine the available evidence, and identify practical responses.",
      durationMinutes: 16,
    },
    block_2: {
      title: "Assessing deepfakes",
      description:
        "Understand how synthetic media is made, apply source and context checks, and decide what to do when media appears manipulated.",
      durationMinutes: 14,
    },
    block_3: {
      title: "Bias, ethics, and accountability",
      description:
        "Trace how bias enters data and decisions, examine documented cases, and identify action at individual, organizational, and public levels.",
      durationMinutes: 16,
    },
  },
  lessonData: {
    block_1: kugEnBlock1 as RawBlockContent,
    block_2: kugEnBlock2 as RawBlockContent,
    block_3: kugEnBlock3 as RawBlockContent,
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
        data.lessonData[id]?.lessons ?? [],
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
    course(courseSlug, locale).lessonData[blockId]?.lessons ?? [],
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
      data.lessonData[id]?.lessons ?? [],
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
