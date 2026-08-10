import type { DataInfraLesson } from "./types";
import type { Widget } from "@/lib/widgets/types";

interface DataInfraSectionTranslation {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly keyTakeaway?: string;
}

interface DataInfraQuizTranslation {
  readonly kind: "quiz";
  readonly cpId: string;
  readonly title: string;
  readonly question: string;
  readonly options: readonly string[];
  readonly explanation: string;
}

interface DataInfraFlashcardTranslation {
  readonly term?: string;
  readonly q: string;
  readonly a: string;
}

interface DataInfraFlashcardsTranslation {
  readonly kind: "flashcards";
  readonly cpId: string;
  readonly title: string;
  readonly cards: readonly DataInfraFlashcardTranslation[];
}

type DataInfraWidgetTranslation =
  DataInfraQuizTranslation | DataInfraFlashcardsTranslation;

export interface DataInfraLessonTranslation {
  readonly title: string;
  readonly subtitle: string;
  readonly hook: string;
  readonly keyConcepts: readonly string[];
  readonly sections: readonly DataInfraSectionTranslation[];
  readonly widgets: readonly DataInfraWidgetTranslation[];
  /**
   * Learner-visible technical terms and proper names which remain unchanged in
   * German. Every unchanged string must be declared here explicitly.
   */
  readonly preserve?: readonly string[];
}

const LESSON_KEYS = [
  "durationMinutes",
  "hook",
  "id",
  "keyConcepts",
  "number",
  "quiz",
  "sections",
  "subtitle",
  "title",
  "trackId",
  "widgets",
] as const;

const QUIZ_COPY = new Map([
  ["Check", "Prüfung"],
  ["Answer options", "Antwortmöglichkeiten"],
  ["Correct.", "Richtig."],
  ["Not quite.", "Noch nicht richtig."],
]);

const FLASHCARDS_COPY = new Map([
  ["Review", "Wiederholung"],
  [
    "Click or press Enter to reveal ↻",
    "Klicken oder Eingabetaste drücken, um die Antwort aufzudecken ↻",
  ],
  ["Answer", "Antwort"],
  [
    "Click or press Enter to flip back",
    "Klicken oder Eingabetaste drücken, um zurückzudrehen",
  ],
  ["← Prev", "← Zurück"],
  ["Next →", "Weiter →"],
  ["No cards available.", "Keine Karten verfügbar."],
  [
    "Flashcard {current} of {total}. Activate to reveal the answer.",
    "Lernkarte {current} von {total}. Aktivieren, um die Antwort aufzudecken.",
  ],
]);

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Data Infrastructure ${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    throw new Error(
      `Data Infrastructure ${label} fields changed. Expected ${wanted.join(", ")}; received ${actual.join(", ")}.`,
    );
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Data Infrastructure ${label} must be a non-empty string.`);
  }
  return value;
}

function translateVisible(
  source: string,
  target: string,
  label: string,
  preserved: ReadonlySet<string>,
  usedPreserved: Set<string>,
): string {
  requireString(target, `${label} translation`);
  if (source === target) {
    if (!preserved.has(source)) {
      throw new Error(
        `Data Infrastructure has unreviewed German copy at ${label}: ${JSON.stringify(source)}.`,
      );
    }
    usedPreserved.add(source);
  }
  return target;
}

function translateFixedCopy(
  value: unknown,
  translations: ReadonlyMap<string, string>,
  expectedKeys: readonly string[],
  label: string,
): Record<string, string> {
  const source = asRecord(value, label);
  assertExactKeys(source, expectedKeys, label);
  return Object.fromEntries(
    Object.entries(source).map(([key, raw]) => {
      const sourceText = requireString(raw, `${label}.${key}`);
      const target = translations.get(sourceText);
      if (!target) {
        throw new Error(
          `Data Infrastructure has unreviewed German widget copy at ${label}.${key}: ${JSON.stringify(sourceText)}.`,
        );
      }
      return [key, target];
    }),
  );
}

function translateQuizWidget(
  lessonId: string,
  widget: Widget,
  translation: DataInfraQuizTranslation,
  preserved: ReadonlySet<string>,
  usedPreserved: Set<string>,
): Widget {
  const props = asRecord(widget.props, `${lessonId}/${translation.cpId}`);
  assertExactKeys(
    props,
    [
      "copy",
      "correct",
      "cpId",
      "explanation",
      "lessonId",
      "options",
      "question",
      "title",
    ],
    `${lessonId}/${translation.cpId} quiz props`,
  );
  if (props.cpId !== translation.cpId) {
    throw new Error(
      `Data Infrastructure ${lessonId} widget order changed at ${translation.cpId}.`,
    );
  }
  if (!Array.isArray(props.options)) {
    throw new Error(
      `Data Infrastructure ${lessonId}/${translation.cpId} options must be an array.`,
    );
  }
  if (props.options.length !== translation.options.length) {
    throw new Error(
      `Data Infrastructure ${lessonId}/${translation.cpId} option count changed.`,
    );
  }

  return {
    ...widget,
    props: {
      lessonId: props.lessonId,
      cpId: props.cpId,
      title: translateVisible(
        requireString(props.title, `${lessonId}/${translation.cpId}.title`),
        translation.title,
        `${lessonId}/${translation.cpId}.title`,
        preserved,
        usedPreserved,
      ),
      copy: translateFixedCopy(
        props.copy,
        QUIZ_COPY,
        ["correctLabel", "incorrectLabel", "kindLabel", "optionsAriaLabel"],
        `${lessonId}/${translation.cpId}.copy`,
      ),
      question: translateVisible(
        requireString(
          props.question,
          `${lessonId}/${translation.cpId}.question`,
        ),
        translation.question,
        `${lessonId}/${translation.cpId}.question`,
        preserved,
        usedPreserved,
      ),
      options: props.options.map((raw, index) =>
        translateVisible(
          requireString(
            raw,
            `${lessonId}/${translation.cpId}.options[${index}]`,
          ),
          translation.options[index],
          `${lessonId}/${translation.cpId}.options[${index}]`,
          preserved,
          usedPreserved,
        ),
      ),
      correct: props.correct,
      explanation: translateVisible(
        requireString(
          props.explanation,
          `${lessonId}/${translation.cpId}.explanation`,
        ),
        translation.explanation,
        `${lessonId}/${translation.cpId}.explanation`,
        preserved,
        usedPreserved,
      ),
    },
  };
}

function translateFlashcardsWidget(
  lessonId: string,
  widget: Widget,
  translation: DataInfraFlashcardsTranslation,
  preserved: ReadonlySet<string>,
  usedPreserved: Set<string>,
): Widget {
  const props = asRecord(widget.props, `${lessonId}/${translation.cpId}`);
  assertExactKeys(
    props,
    ["cards", "copy", "cpId", "lessonId", "title"],
    `${lessonId}/${translation.cpId} flashcards props`,
  );
  if (props.cpId !== translation.cpId) {
    throw new Error(
      `Data Infrastructure ${lessonId} widget order changed at ${translation.cpId}.`,
    );
  }
  if (
    !Array.isArray(props.cards) ||
    props.cards.length !== translation.cards.length
  ) {
    throw new Error(
      `Data Infrastructure ${lessonId}/${translation.cpId} card count changed.`,
    );
  }

  return {
    ...widget,
    props: {
      lessonId: props.lessonId,
      cpId: props.cpId,
      title: translateVisible(
        requireString(props.title, `${lessonId}/${translation.cpId}.title`),
        translation.title,
        `${lessonId}/${translation.cpId}.title`,
        preserved,
        usedPreserved,
      ),
      copy: translateFixedCopy(
        props.copy,
        FLASHCARDS_COPY,
        [
          "ariaLabelTemplate",
          "backLabel",
          "emptyLabel",
          "flipBackHint",
          "kindLabel",
          "nextLabel",
          "prevLabel",
          "revealHint",
        ],
        `${lessonId}/${translation.cpId}.copy`,
      ),
      cards: props.cards.map((rawCard, index) => {
        const source = asRecord(
          rawCard,
          `${lessonId}/${translation.cpId}.cards[${index}]`,
        );
        const target = translation.cards[index];
        const expectedKeys = Object.hasOwn(source, "term")
          ? ["a", "q", "term"]
          : ["a", "q"];
        assertExactKeys(
          source,
          expectedKeys,
          `${lessonId}/${translation.cpId}.cards[${index}]`,
        );
        if (Object.hasOwn(source, "term") !== (target.term !== undefined)) {
          throw new Error(
            `Data Infrastructure ${lessonId}/${translation.cpId}.cards[${index}] term shape changed.`,
          );
        }
        return {
          ...(target.term !== undefined
            ? {
                term: translateVisible(
                  requireString(
                    source.term,
                    `${lessonId}/${translation.cpId}.cards[${index}].term`,
                  ),
                  target.term,
                  `${lessonId}/${translation.cpId}.cards[${index}].term`,
                  preserved,
                  usedPreserved,
                ),
              }
            : {}),
          q: translateVisible(
            requireString(
              source.q,
              `${lessonId}/${translation.cpId}.cards[${index}].q`,
            ),
            target.q,
            `${lessonId}/${translation.cpId}.cards[${index}].q`,
            preserved,
            usedPreserved,
          ),
          a: translateVisible(
            requireString(
              source.a,
              `${lessonId}/${translation.cpId}.cards[${index}].a`,
            ),
            target.a,
            `${lessonId}/${translation.cpId}.cards[${index}].a`,
            preserved,
            usedPreserved,
          ),
        };
      }),
    },
  };
}

/**
 * Builds one reviewed German lesson from the canonical English bundle. The
 * adapter copies machine identity only. Every learner-visible field must be
 * supplied in the translation object; schema drift throws during import.
 */
export function localizeDataInfraLessonToGerman(
  canonical: DataInfraLesson,
  translation: DataInfraLessonTranslation,
): DataInfraLesson {
  assertExactKeys(
    canonical as unknown as Record<string, unknown>,
    LESSON_KEYS,
    `${canonical.id} lesson`,
  );
  if (canonical.quiz.length !== 0) {
    throw new Error(
      `Data Infrastructure ${canonical.id} has learner-visible quiz fields outside its widgets.`,
    );
  }
  if (canonical.keyConcepts.length !== translation.keyConcepts.length) {
    throw new Error(
      `Data Infrastructure ${canonical.id} key-concept count changed.`,
    );
  }
  if (canonical.sections.length !== translation.sections.length) {
    throw new Error(
      `Data Infrastructure ${canonical.id} section count changed.`,
    );
  }
  if ((canonical.widgets?.length ?? 0) !== translation.widgets.length) {
    throw new Error(
      `Data Infrastructure ${canonical.id} widget count changed.`,
    );
  }

  const preserved = new Set(translation.preserve ?? []);
  const usedPreserved = new Set<string>();

  const sections = canonical.sections.map((section, index) => {
    const target = translation.sections[index];
    const expectedKeys = [
      "content",
      "id",
      ...(section.keyTakeaway !== undefined ? ["keyTakeaway"] : []),
      "readTimeMinutes",
      ...(section.sources !== undefined ? ["sources"] : []),
      "title",
    ];
    assertExactKeys(
      section as unknown as Record<string, unknown>,
      expectedKeys,
      `${canonical.id}/${section.id} section`,
    );
    if (target.id !== section.id) {
      throw new Error(
        `Data Infrastructure ${canonical.id} section order changed at ${section.id}.`,
      );
    }
    if (
      (target.keyTakeaway !== undefined) !==
      (section.keyTakeaway !== undefined)
    ) {
      throw new Error(
        `Data Infrastructure ${canonical.id}/${section.id} takeaway shape changed.`,
      );
    }
    return {
      id: section.id,
      title: translateVisible(
        section.title,
        target.title,
        `${canonical.id}/${section.id}.title`,
        preserved,
        usedPreserved,
      ),
      readTimeMinutes: section.readTimeMinutes,
      content: translateVisible(
        section.content,
        target.content,
        `${canonical.id}/${section.id}.content`,
        preserved,
        usedPreserved,
      ),
      ...(section.keyTakeaway !== undefined && target.keyTakeaway !== undefined
        ? {
            keyTakeaway: translateVisible(
              section.keyTakeaway,
              target.keyTakeaway,
              `${canonical.id}/${section.id}.keyTakeaway`,
              preserved,
              usedPreserved,
            ),
          }
        : {}),
      ...(section.sources !== undefined ? { sources: section.sources } : {}),
    };
  });

  const widgets = (canonical.widgets ?? []).map((widget, index): Widget => {
    assertExactKeys(
      widget as unknown as Record<string, unknown>,
      ["kind", "placement", "props"],
      `${canonical.id} widget ${index}`,
    );
    const target = translation.widgets[index];
    if (widget.kind !== target.kind) {
      throw new Error(
        `Data Infrastructure ${canonical.id} widget kind changed at index ${index}.`,
      );
    }
    if (widget.kind === "quiz" && target.kind === "quiz") {
      return translateQuizWidget(
        canonical.id,
        widget,
        target,
        preserved,
        usedPreserved,
      );
    }
    if (widget.kind === "flashcards" && target.kind === "flashcards") {
      return translateFlashcardsWidget(
        canonical.id,
        widget,
        target,
        preserved,
        usedPreserved,
      );
    }
    throw new Error(
      `Data Infrastructure ${canonical.id} has unsupported learner-visible widget kind ${widget.kind}.`,
    );
  });

  const title = translateVisible(
    canonical.title,
    translation.title,
    `${canonical.id}.title`,
    preserved,
    usedPreserved,
  );
  const subtitle = translateVisible(
    canonical.subtitle,
    translation.subtitle,
    `${canonical.id}.subtitle`,
    preserved,
    usedPreserved,
  );
  const hook = translateVisible(
    canonical.hook,
    translation.hook,
    `${canonical.id}.hook`,
    preserved,
    usedPreserved,
  );
  const keyConcepts = canonical.keyConcepts.map((source, index) =>
    translateVisible(
      source,
      translation.keyConcepts[index],
      `${canonical.id}.keyConcepts[${index}]`,
      preserved,
      usedPreserved,
    ),
  );

  const unusedPreserved = [...preserved].filter(
    (value) => !usedPreserved.has(value),
  );
  if (unusedPreserved.length > 0) {
    throw new Error(
      `Data Infrastructure ${canonical.id} has unused preserved strings: ${unusedPreserved.join(", ")}.`,
    );
  }

  return Object.freeze({
    ...canonical,
    title,
    subtitle,
    hook,
    keyConcepts,
    sections,
    widgets,
  });
}
