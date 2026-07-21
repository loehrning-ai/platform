// ─── Data Engineering Fundamentals course types ──
//
// Own separate content module (mirroring `lib/data-infrastructure`/
// `lib/codex`'s precedent), keyed by the source's own flat chapter-id scheme
// ("home".."cap", matching `src/chapters/App.js`'s `CHAPTERS` array), NOT the
// shared BlockId JSON system. This course has no track/module grouping in
// source (unlike data-infrastructure's 4 tracks) — 12 chapters, flat.
//
// Chapter count reconciliation: the source's real `CHAPTERS` array (read
// directly from `src/chapters/App.js`) has 12 entries — home, fund, ingest,
// stream, store, comp, orch, qual, disc, serve, gov, cap — not the 10 the
// pre-existing `catalog.ts` ImportedCourse entry claimed. Stage 12
// reconciles `totalLessons`/`unitCount` to 12.

import type { BaseLesson, LessonSection } from "@/lib/course/types";

export const DEF_CHAPTER_IDS = [
  "home",
  "fund",
  "ingest",
  "stream",
  "store",
  "comp",
  "orch",
  "qual",
  "disc",
  "serve",
  "gov",
  "cap",
] as const;

export type DefChapterId = (typeof DEF_CHAPTER_IDS)[number];

export function isDefChapterId(value: unknown): value is DefChapterId {
  return (
    typeof value === "string" &&
    (DEF_CHAPTER_IDS as readonly string[]).includes(value)
  );
}

/** Per-chapter metadata, ported verbatim from `App.js`'s `CHAPTERS` array. */
export interface ChapterMeta {
  readonly id: DefChapterId;
  /** 0-based order, matching source array position. */
  readonly number: number;
  /** Source's own display label ("-", "00".."10"). */
  readonly displayNumber: string;
  readonly title: string;
  readonly subtitle: string;
  /** Parsed from source's "N min" string. */
  readonly estimatedMinutes: number;
  /** Source's `hex` — sidebar accent color for this chapter. */
  readonly accentHex: string;
  /** Source's `ink` — darker ink variant for text-on-accent contexts. */
  readonly inkHex: string;
}

/**
 * Verbatim port of `App.js`'s `CHAPTERS` array. Cheap and eager (unlike the
 * heavier per-chapter body content in ./content, which loads via per-chapter
 * dynamic `import()`) — mirrors `lib/data-infrastructure/types.ts`'s
 * `DATA_INFRA_TRACKS` precedent of keeping small structural metadata
 * eagerly available.
 */
export const DEF_CHAPTERS: readonly ChapterMeta[] = [
  { id: "home", number: 0, displayNumber: "-", title: "Overview", subtitle: "The pipeline, end to end", estimatedMinutes: 3, accentHex: "#6B7787", inkHex: "#646F7E" },
  { id: "fund", number: 1, displayNumber: "00", title: "Core Fundamentals", subtitle: "Storage, formats, engines", estimatedMinutes: 8, accentHex: "#0F1729", inkHex: "#0F1729" },
  { id: "ingest", number: 2, displayNumber: "01", title: "Ingest", subtitle: "Where data is born", estimatedMinutes: 9, accentHex: "#7C5CFF", inkHex: "#6E4BFF" },
  { id: "stream", number: 3, displayNumber: "02", title: "Streaming", subtitle: "The bridge to the warehouse", estimatedMinutes: 7, accentHex: "#22D3EE", inkHex: "#0B798A" },
  { id: "store", number: 4, displayNumber: "03", title: "Store", subtitle: "Where data lives", estimatedMinutes: 8, accentHex: "#2D7DFF", inkHex: "#0060FD" },
  { id: "comp", number: 5, displayNumber: "04", title: "Compute", subtitle: "How data is read", estimatedMinutes: 9, accentHex: "#FF7A59", inkHex: "#D32A00" },
  { id: "orch", number: 6, displayNumber: "05", title: "Orchestrate", subtitle: "Airflow & idempotency", estimatedMinutes: 8, accentHex: "#31A24C", inkHex: "#267E3B" },
  { id: "qual", number: 7, displayNumber: "06", title: "Quality", subtitle: "Pipeline ran ≠ number is right", estimatedMinutes: 8, accentHex: "#E41E3F", inkHex: "#D81A39" },
  { id: "disc", number: 8, displayNumber: "07", title: "Discover", subtitle: "Six shortcuts over four hours", estimatedMinutes: 7, accentHex: "#B8770A", inkHex: "#986308" },
  { id: "serve", number: 9, displayNumber: "08", title: "Serve", subtitle: "Metrics & semantic models", estimatedMinutes: 8, accentHex: "#0091FF", inkHex: "#0070C5" },
  { id: "gov", number: 10, displayNumber: "09", title: "Govern", subtitle: "The deploy gate", estimatedMinutes: 7, accentHex: "#8B5CF6", inkHex: "#7D48F5" },
  { id: "cap", number: 11, displayNumber: "10", title: "Capstone", subtitle: "Build dim_users E2E", estimatedMinutes: 15, accentHex: "#E85D04", inkHex: "#BB4B03" },
];

export function getDefChapterMeta(id: DefChapterId): ChapterMeta {
  const meta = DEF_CHAPTERS.find((c) => c.id === id);
  if (!meta) {
    throw new Error(`Unknown data-engineering-fundamentals chapter id "${id}".`);
  }
  return meta;
}

/**
 * DefChapter: folds into the shared `BaseLesson` (kept for consistency with
 * every other course's content module + the shared progress/certificate
 * types, even though this course has no quiz mechanism — see below). `quiz`
 * stays `[]`: grepping all 14 source chapter files for a "Quiz" component
 * returns nothing (`DiscoverySpeedrun` is a timed practice game with
 * regex-matched free-text input, not a pass/fail quiz gate). `widgets` stays
 * unset: none of this course's 17 named interactive components map to the
 * shared Tier-A widget registry (`quiz`/`flashcards`/etc.) — every one is a
 * bespoke, always-inline, RAF/SVG-driven component, deliberately kept out of
 * `src/lib/widgets/types.ts` per the plan's own scope decision.
 */
export interface DefChapter extends BaseLesson {
  readonly id: DefChapterId;
  readonly sections: readonly LessonSection[];
}
