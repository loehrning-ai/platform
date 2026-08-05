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

// Course configs live in ./config (performance hardening) so config-only client
// components avoid this module's heavy JSON graph. Re-exported below for
// backward compatibility — server-side callers keep importing from ./data.
import {
  AI_NATIVE_CONFIG,
  EU_AI_ACT_KURS_CONFIG,
  KI_FUEHRERSCHEIN_CONFIG,
  KI_UND_GESELLSCHAFT_CONFIG,
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

// ─── EU AI Act Kurs content ────────────────────────────────────

import eaBlock1 from "../../../content/eu-ai-act-kurs/block-1-grundlagen-lessons.json";
import eaBlock2 from "../../../content/eu-ai-act-kurs/block-2-risikoklassen-lessons.json";
import eaBlock3 from "../../../content/eu-ai-act-kurs/block-3-hochrisiko-lessons.json";
import eaBlock4 from "../../../content/eu-ai-act-kurs/block-4-gpai-transparenz-lessons.json";
import eaBlock5 from "../../../content/eu-ai-act-kurs/block-5-governance-lessons.json";
import eaBlock6 from "../../../content/eu-ai-act-kurs/block-6-praxis-lessons.json";
import eaWorkshop from "../../../content/eu-ai-act-kurs/quiz/questions.json";

// ─── KI und Gesellschaft content (KI und Gesellschaft course review) ────────────────────

import kugBlock1 from "../../../content/ki-und-gesellschaft/block-1-arbeit-lessons.json";
import kugBlock2 from "../../../content/ki-und-gesellschaft/block-2-deepfakes-lessons.json";
import kugBlock3 from "../../../content/ki-und-gesellschaft/block-3-ethik-lessons.json";
import kugWorkshop from "../../../content/ki-und-gesellschaft/quiz/questions.json";

// ─── AI-Native workshop quiz (shared course architecture) ─

import anWorkshop from "../../../content/ai-native/quiz/questions.json";

// ─── KI-Führerschein glossary (shared course architecture) ──────────────
// The 42-term glossary was previously unimported dead data. It now has a
// typed loader so lessons can wire it as `Flashcards` drills (and a future
// glossary page can reuse the same accessor).

import kfGlossary from "../../../content/ki-fuehrerschein/glossary.json";

// ─── EU AI Act Kurs glossary (shared course architecture) ───────────────
// Risikostufen + Verordnung (EU) 2024/1689 terminology. Registered below in
// GLOSSARIES so the same auto-injection machinery surfaces a per-block
// Flashcards review deck (filtered via `relatedBlocks`).

import eaGlossary from "../../../content/eu-ai-act-kurs/glossary.json";

// ─── Shared types ──────────────────────────────────────────────

type BlockMeta = {
  title: string;
  description: string;
  durationMinutes: number;
};

type CourseData = {
  readonly config: CourseConfig;
  readonly blockMeta: Partial<Record<BlockId, BlockMeta>>;
  readonly lessonData: Partial<Record<BlockId, { lessons: Lesson[] }>>;
  readonly workshopQuestions: QuizQuestion[];
};

// ─── KI-Führerschein course config ─────────────────────────────

const KI_FUEHRERSCHEIN: CourseData = {
  config: KI_FUEHRERSCHEIN_CONFIG,
  blockMeta: {
    block_1: {
      title: "KI ist schon da",
      description: "Erkenne, welche KI-Systeme du bereits täglich nutzt — und warum das der erste Schritt ist.",
      durationMinutes: 10,
    },
    block_2: {
      title: "Datenschutz und KI",
      description: "4-Stufen-Datenklassifikation für KI-Tools. Wissen, welche Daten in welches Tool gehören.",
      durationMinutes: 15,
    },
    block_3: {
      title: "KI anwenden",
      description: "4 praktische Aufgaben: E-Mail, Meeting-Protokoll, Datenanalyse, Bericht.",
      durationMinutes: 30,
    },
    block_4: {
      title: "KI-Output prüfen",
      description: "3-Schritt-Prüfung, Halluzinationen erkennen, Vertrauensgrenzen kennen.",
      durationMinutes: 20,
    },
    block_5: {
      title: "KI-Richtlinie Schritt für Schritt",
      description: "So entsteht eine KI-Nutzungsrichtlinie Schritt für Schritt. Was Art. 4 dazu zu sagen hat.",
      durationMinutes: 25,
    },
  },
  lessonData: {
    block_1: kfBlock1 as { lessons: Lesson[] },
    block_2: kfBlock2 as { lessons: Lesson[] },
    block_3: kfBlock3 as { lessons: Lesson[] },
    block_4: kfBlock4 as { lessons: Lesson[] },
    block_5: kfBlock5 as { lessons: Lesson[] },
  },
  workshopQuestions: kfWorkshop as unknown as QuizQuestion[],
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
    block_1: eaBlock1 as { lessons: Lesson[] },
    block_2: eaBlock2 as { lessons: Lesson[] },
    block_3: eaBlock3 as { lessons: Lesson[] },
    block_4: eaBlock4 as { lessons: Lesson[] },
    block_5: eaBlock5 as { lessons: Lesson[] },
    block_6: eaBlock6 as { lessons: Lesson[] },
  },
  workshopQuestions: eaWorkshop as unknown as QuizQuestion[],
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
      description: "Was sagen OECD und Bundesagentur wirklich? Ehrliche Bilanz, Amplifier-Modell und konkrete Handlungsoptionen.",
      durationMinutes: 16,
    },
    block_2: {
      title: "Deepfakes erkennen",
      description: "Wie synthetische Medien entstehen, drei kostenlose Prüfwerkzeuge und was du tust, wenn du einen Deepfake findest.",
      durationMinutes: 14,
    },
    block_3: {
      title: "Ethik und Bias",
      description: "COMPAS, Amazon und Buolamwini: wie Bias entsteht, drei Handlungsebenen und was du als Bürgerin oder Bürger tun kannst.",
      durationMinutes: 16,
    },
  },
  lessonData: {
    block_1: kugBlock1 as { lessons: Lesson[] },
    block_2: kugBlock2 as { lessons: Lesson[] },
    block_3: kugBlock3 as { lessons: Lesson[] },
  },
  workshopQuestions: kugWorkshop as unknown as QuizQuestion[],
};

// ─── Course registry ───────────────────────────────────────────

const COURSES: Partial<Record<CourseSlug, CourseData>> = {
  "ki-fuehrerschein": KI_FUEHRERSCHEIN,
  "eu-ai-act-kurs": EU_AI_ACT_KURS,
  "ai-native": AI_NATIVE,
  "ki-und-gesellschaft": KI_UND_GESELLSCHAFT,
};

function course(courseSlug: CourseSlug): CourseData {
  const data = COURSES[courseSlug];
  if (!data) {
    throw new Error(
      `Course "${courseSlug}" is not registered in the shared engine.`,
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
): Widget | null {
  const terms = getGlossaryTerms(courseSlug, blockId);
  if (terms.length === 0) return null;
  return {
    kind: "flashcards",
    placement: "end",
    courseSlug: courseSlug as Widget["courseSlug"],
    props: {
      lessonId: `${courseSlug}:${lessonId}`,
      cpId: `glossar-${blockId}`,
      title: "Glossar-Karten zu diesem Block",
      cards: terms.map((t) => ({
        term: t.english,
        q: t.term,
        a: t.definition,
      })),
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
): readonly Lesson[] {
  if (lessons.length === 0) return lessons;
  const widget = glossaryFlashcardsWidget(
    courseSlug,
    blockId,
    lessons[lessons.length - 1].id,
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

export function getBlocks(courseSlug: CourseSlug): readonly BlockDefinition[] {
  const data = course(courseSlug);
  return data.config.blockIds.map((id, i) => {
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
      ),
    };
  });
}

export function getBlock(
  courseSlug: CourseSlug,
  blockId: BlockId,
): BlockDefinition | undefined {
  return getBlocks(courseSlug).find((b) => b.id === blockId);
}

export function getBlockLessons(
  courseSlug: CourseSlug,
  blockId: BlockId,
): readonly Lesson[] {
  return withGlossaryFlashcards(
    courseSlug,
    blockId,
    course(courseSlug).lessonData[blockId]?.lessons ?? [],
  );
}

export function getAllLessons(courseSlug: CourseSlug): readonly Lesson[] {
  const data = course(courseSlug);
  return data.config.blockIds.flatMap((id) =>
    withGlossaryFlashcards(courseSlug, id, data.lessonData[id]?.lessons ?? []),
  );
}

export function getTotalLessonCount(courseSlug: CourseSlug): number {
  return getAllLessons(courseSlug).length;
}

export function getBlockLessonCount(
  courseSlug: CourseSlug,
  blockId: BlockId,
): number {
  return getBlockLessons(courseSlug, blockId).length;
}

export function getBlockLessonIds(
  courseSlug: CourseSlug,
  blockId: BlockId,
): readonly string[] {
  return getBlockLessons(courseSlug, blockId).map((l) => l.id);
}

// ─── Workshop quiz queries ─────────────────────────────────────
//
// Sync accessor for server/test use. Client components load questions via
// `loadWorkshopQuestions` in ./questions (per-course dynamic import) so the
// quiz JSON stays out of the initial route bundles (performance hardening).

export function getWorkshopQuestions(
  courseSlug: CourseSlug,
): readonly QuizQuestion[] {
  return course(courseSlug).workshopQuestions;
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

type RawBlockJson = {
  readonly lastReviewed?: string;
  readonly nextReview?: string;
  readonly riskClass?: string;
};

const BLOCK_FRESHNESS: Partial<Record<CourseSlug, Partial<Record<BlockId, BlockFreshness>>>> = {
  "ki-fuehrerschein": {
    block_1: extractFreshness(kfBlock1 as RawBlockJson),
    block_2: extractFreshness(kfBlock2 as RawBlockJson),
    block_3: extractFreshness(kfBlock3 as RawBlockJson),
    block_4: extractFreshness(kfBlock4 as RawBlockJson),
    block_5: extractFreshness(kfBlock5 as RawBlockJson),
  },
  "eu-ai-act-kurs": {
    block_1: extractFreshness(eaBlock1 as RawBlockJson),
    block_2: extractFreshness(eaBlock2 as RawBlockJson),
    block_3: extractFreshness(eaBlock3 as RawBlockJson),
    block_4: extractFreshness(eaBlock4 as RawBlockJson),
    block_5: extractFreshness(eaBlock5 as RawBlockJson),
    block_6: extractFreshness(eaBlock6 as RawBlockJson),
  },
  "ki-und-gesellschaft": {
    block_1: extractFreshness(kugBlock1 as RawBlockJson),
    block_2: extractFreshness(kugBlock2 as RawBlockJson),
    block_3: extractFreshness(kugBlock3 as RawBlockJson),
  },
};

function extractFreshness(raw: RawBlockJson): BlockFreshness {
  return {
    lastReviewed: raw.lastReviewed ?? "",
    nextReview: raw.nextReview ?? "",
    riskClass: raw.riskClass ?? "",
  };
}

export function getBlockFreshness(
  courseSlug: CourseSlug,
  blockId: BlockId,
): BlockFreshness | null {
  return BLOCK_FRESHNESS[courseSlug]?.[blockId] ?? null;
}

/** Alias retained for block-page-shell.tsx compatibility. */
export function getBlockFreshnessMeta(
  courseSlug: CourseSlug,
  blockId: BlockId,
): BlockFreshness | null {
  return getBlockFreshness(courseSlug, blockId);
}

// ─── Glossary queries (shared course architecture + 12) ─────────────────
//
// KI-Führerschein and EU-AI-Act-Kurs each ship a glossary.
// The accessor is keyed by course slug so a future AI-Native glossary drops
// in here with zero call-site churn. Courses without a glossary return an
// empty list.

const GLOSSARIES: Partial<Record<CourseSlug, readonly GlossaryEntry[]>> = {
  "ki-fuehrerschein": kfGlossary as unknown as GlossaryEntry[],
  "eu-ai-act-kurs": eaGlossary as unknown as GlossaryEntry[],
};

/**
 * Return the glossary terms for a course, optionally filtered to those tagged
 * with a given block via `relatedBlocks`. Returns a stable, term-sorted copy
 * (immutable — never mutates the imported JSON).
 */
export function getGlossaryTerms(
  courseSlug: CourseSlug,
  blockId?: BlockId,
): readonly GlossaryEntry[] {
  const all = GLOSSARIES[courseSlug] ?? [];
  const filtered = blockId
    ? all.filter((t) => t.relatedBlocks?.includes(blockId))
    : all;
  return [...filtered].sort((a, b) => a.term.localeCompare(b.term, "de"));
}

export function getGlossaryTermCount(courseSlug: CourseSlug): number {
  return (GLOSSARIES[courseSlug] ?? []).length;
}
