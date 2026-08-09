import { buildSections } from "./blocks";
import type { CodexBlock, CodexLesson, CodexSection } from "./types";

export type CodexTranslationPair = readonly [source: string, target: string];

export interface CodexLessonTranslation {
  readonly translations: readonly CodexTranslationPair[];
  /**
   * Visible source strings which must remain byte-for-byte identical, such as
   * shell commands, code, paths, product identifiers and placeholders.
   */
  readonly preserve?: readonly string[];
}

const COMMON_GERMAN_TRANSLATIONS = [
  ["Quick check", "Kurzprüfung"],
  ["Check", "Prüfung"],
  ["Answer options", "Antwortmöglichkeiten"],
  ["Correct.", "Richtig."],
  ["Not quite.", "Noch nicht richtig."],
  ["Compare", "Vergleich"],
  ["Review", "Wiederholung"],
  ["Click to reveal ↻", "Zum Aufdecken klicken ↻"],
  ["Answer", "Antwort"],
  ["Click to flip back", "Zum Zurückdrehen klicken"],
  ["← Prev", "← Zurück"],
  ["Next →", "Weiter →"],
  ["No cards available.", "Keine Karten verfügbar."],
  [
    "Flashcard {current} of {total}. Press Space or click to flip.",
    "Lernkarte {current} von {total}. Leertaste drücken oder zum Umdrehen klicken.",
  ],
  ["weak", "schwach"],
  ["meh", "mittel"],
  ["strong", "stark"],
  ["incomplete", "unvollständig"],
  ["partial", "teilweise"],
  ["reviewable", "prüfbar"],
] as const satisfies readonly CodexTranslationPair[];

const MACHINE_STRING_KEYS = new Set([
  "id",
  "trackId",
  "kind",
  "placement",
  "courseSlug",
  "lessonId",
  "cpId",
  "tone",
  "type",
  "windowTitle",
  "file",
]);

function translationMap(
  lessonId: string,
  pairs: readonly CodexTranslationPair[],
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const [source, target] of [...COMMON_GERMAN_TRANSLATIONS, ...pairs]) {
    if (source.length === 0 || target.length === 0) {
      throw new Error(`Codex ${lessonId} contains an empty translation pair.`);
    }
    const existing = map.get(source);
    if (existing !== undefined && existing !== target) {
      throw new Error(
        `Codex ${lessonId} translates ${JSON.stringify(source)} inconsistently.`,
      );
    }
    map.set(source, target);
  }
  return map;
}

function translatedString(
  lessonId: string,
  source: string,
  key: string | null,
  map: ReadonlyMap<string, string>,
  preserved: ReadonlySet<string>,
): string {
  if (source.length === 0 || (key !== null && MACHINE_STRING_KEYS.has(key))) {
    return source;
  }
  if (map.has(source)) return map.get(source)!;
  if (preserved.has(source)) return source;
  throw new Error(
    `Codex ${lessonId} has unreviewed German copy at ${key ?? "text"}: ${JSON.stringify(source)}`,
  );
}

function translateUnknown(
  lessonId: string,
  value: unknown,
  key: string | null,
  map: ReadonlyMap<string, string>,
  preserved: ReadonlySet<string>,
): unknown {
  if (typeof value === "string") {
    return translatedString(lessonId, value, key, map, preserved);
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      translateUnknown(lessonId, entry, null, map, preserved),
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        translateUnknown(lessonId, entryValue, entryKey, map, preserved),
      ]),
    );
  }
  return value;
}

function translateBlock(
  lessonId: string,
  block: CodexBlock,
  map: ReadonlyMap<string, string>,
  preserved: ReadonlySet<string>,
): CodexBlock {
  switch (block.kind) {
    case "prose":
      return {
        kind: block.kind,
        markdown: translatedString(
          lessonId,
          block.markdown,
          "markdown",
          map,
          preserved,
        ),
      };
    case "pull-quote":
      return {
        kind: block.kind,
        text: translatedString(lessonId, block.text, "text", map, preserved),
      };
    case "callout":
      return {
        kind: block.kind,
        ...(block.title
          ? {
              title: translatedString(
                lessonId,
                block.title,
                "title",
                map,
                preserved,
              ),
            }
          : {}),
        body: translatedString(lessonId, block.body, "body", map, preserved),
      };
    case "card-grid":
      return {
        kind: block.kind,
        cards: block.cards.map((card) => ({
          eyebrow: translatedString(
            lessonId,
            card.eyebrow,
            "eyebrow",
            map,
            preserved,
          ),
          title: translatedString(
            lessonId,
            card.title,
            "title",
            map,
            preserved,
          ),
          body: translatedString(lessonId, card.body, "body", map, preserved),
        })),
      };
  }
}

/**
 * Build a German lesson from the reviewed English source while translating
 * every visible string explicitly. Machine fields are copied unchanged. Any
 * unreviewed visible string throws at module load instead of leaking English.
 */
export function localizeCodexLessonToGerman(
  canonical: CodexLesson,
  translation: CodexLessonTranslation,
): CodexLesson {
  const map = translationMap(canonical.id, translation.translations);
  const preserved = new Set(translation.preserve ?? []);

  const translatedSections = buildSections(
    canonical.sections.map((section): Omit<CodexSection, "content"> => ({
      id: section.id,
      title: translatedString(
        canonical.id,
        section.title,
        "title",
        map,
        preserved,
      ),
      readTimeMinutes: section.readTimeMinutes,
      blocks: section.blocks.map((block) =>
        translateBlock(canonical.id, block, map, preserved),
      ),
      ...(section.keyTakeaway
        ? {
            keyTakeaway: translatedString(
              canonical.id,
              section.keyTakeaway,
              "keyTakeaway",
              map,
              preserved,
            ),
          }
        : {}),
      ...(section.sources ? { sources: section.sources } : {}),
    })),
  );

  return Object.freeze({
    ...canonical,
    title: translatedString(
      canonical.id,
      canonical.title,
      "title",
      map,
      preserved,
    ),
    subtitle: translatedString(
      canonical.id,
      canonical.subtitle,
      "subtitle",
      map,
      preserved,
    ),
    hook: translatedString(
      canonical.id,
      canonical.hook,
      "hook",
      map,
      preserved,
    ),
    keyConcepts: canonical.keyConcepts.map((concept) =>
      translatedString(canonical.id, concept, "keyConcept", map, preserved),
    ),
    sections: translatedSections,
    widgets: canonical.widgets?.map((widget) =>
      translateUnknown(canonical.id, widget, null, map, preserved),
    ) as CodexLesson["widgets"],
  });
}
