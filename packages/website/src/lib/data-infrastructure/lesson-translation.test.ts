import { describe, expect, it } from "vitest";
import type { DataInfraLesson } from "./types";
import mentalModelEn from "./lessons/mental-model";
import mentalModelDe from "./lessons/de/mental-model";
import capPacelcEn from "./lessons/cap-pacelc";
import capPacelcDe from "./lessons/de/cap-pacelc";
import modelingEn from "./lessons/modeling";
import modelingDe from "./lessons/de/modeling";
import storageFormatsEn from "./lessons/storage-formats";
import storageFormatsDe from "./lessons/de/storage-formats";
import lakehouseEn from "./lessons/lakehouse";
import lakehouseDe from "./lessons/de/lakehouse";
import partitioningEn from "./lessons/partitioning";
import partitioningDe from "./lessons/de/partitioning";
import {
  localizeDataInfraLessonToGerman,
  type DataInfraLessonTranslation,
} from "./translate-lesson";

const LESSON_PAIRS = [
  [mentalModelEn, mentalModelDe],
  [capPacelcEn, capPacelcDe],
  [modelingEn, modelingDe],
  [storageFormatsEn, storageFormatsDe],
  [lakehouseEn, lakehouseDe],
  [partitioningEn, partitioningDe],
] as const;

const EXPECTED_IDS = [
  "mental-model",
  "cap-pacelc",
  "modeling",
  "storage-formats",
  "lakehouse",
  "partitioning",
] as const;

const MACHINE_STRING_KEYS = new Set([
  "id",
  "trackId",
  "kind",
  "placement",
  "courseSlug",
  "lessonId",
  "cpId",
]);

const REVIEWED_UNCHANGED_TERMS = new Set([
  "Log",
  "OLTP",
  "OLAP",
  "ETL vs ELT",
  "Bronze / Silver / Gold",
  "Lakehouse",
  "Quorum",
  "Data Vault",
  "ORC",
  "Avro",
  "Copy-on-Write",
  "Merge-on-Read",
  "Snapshot",
  "VACUUM",
  "OCC",
  "Salt",
]);

interface VisibleEntry {
  readonly path: string;
  readonly value: string;
}

function collectVisibleEntries(
  value: unknown,
  path = "lesson",
  key: string | null = null,
  entries: VisibleEntry[] = [],
): VisibleEntry[] {
  if (typeof value === "string") {
    if (value.length > 0 && !MACHINE_STRING_KEYS.has(key ?? "")) {
      entries.push({ path, value });
    }
    return entries;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      collectVisibleEntries(child, `${path}[${index}]`, null, entries),
    );
    return entries;
  }
  if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([childKey, child]) =>
      collectVisibleEntries(child, `${path}.${childKey}`, childKey, entries),
    );
  }
  return entries;
}

function visibleByPath(lesson: DataInfraLesson): ReadonlyMap<string, string> {
  return new Map(
    collectVisibleEntries(lesson).map(({ path, value }) => [path, value]),
  );
}

function widgetMachineProjection(lesson: DataInfraLesson) {
  return (lesson.widgets ?? []).map((widget) => {
    const props = (widget.props ?? {}) as Record<string, unknown>;
    return {
      kind: widget.kind,
      placement: widget.placement,
      courseSlug: widget.courseSlug,
      lessonId: props.lessonId,
      cpId: props.cpId,
      correct: props.correct,
      optionCount: Array.isArray(props.options) ? props.options.length : null,
      cardCount: Array.isArray(props.cards) ? props.cards.length : null,
    };
  });
}

function machineProjection(lesson: DataInfraLesson) {
  return {
    id: lesson.id,
    number: lesson.number,
    durationMinutes: lesson.durationMinutes,
    trackId: lesson.trackId,
    quiz: lesson.quiz,
    sections: lesson.sections.map((section) => ({
      id: section.id,
      readTimeMinutes: section.readTimeMinutes,
      sources: section.sources,
    })),
    widgets: widgetMachineProjection(lesson),
  };
}

function protectedNumbers(value: string): readonly string[] {
  return (
    value.match(/(?:~|≥|>|<)?\d+(?:[.,]\d+)*(?:%|x|ms|MB|GB|TB|bit|M)?/gu) ?? []
  ).map((token) => token.replace(/[.,]$/u, ""));
}

function inlineCode(value: string): readonly string[] {
  return [...value.matchAll(/(?<!`)`([^`\n]+)`(?!`)/gu)].map(
    (match) => match[1],
  );
}

function fencedCode(value: string): readonly string[] {
  return [...value.matchAll(/```([\s\S]*?)```/gu)].map((match) => match[1]);
}

function reviewedTranslationFromPair(
  source: DataInfraLesson,
  german: DataInfraLesson,
): DataInfraLessonTranslation {
  const germanEntries = visibleByPath(german);
  const unchanged = collectVisibleEntries(source)
    .filter(({ path, value }) => germanEntries.get(path) === value)
    .map(({ value }) => value);

  return {
    title: german.title,
    subtitle: german.subtitle,
    hook: german.hook,
    keyConcepts: german.keyConcepts,
    sections: german.sections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
      ...(section.keyTakeaway !== undefined
        ? { keyTakeaway: section.keyTakeaway }
        : {}),
    })),
    widgets: (german.widgets ?? []).map((widget) => {
      const props = (widget.props ?? {}) as Record<string, unknown>;
      if (widget.kind === "quiz") {
        return {
          kind: "quiz" as const,
          cpId: props.cpId as string,
          title: props.title as string,
          question: props.question as string,
          options: props.options as readonly string[],
          explanation: props.explanation as string,
        };
      }
      if (widget.kind === "flashcards") {
        const cards = props.cards as readonly Record<string, unknown>[];
        return {
          kind: "flashcards" as const,
          cpId: props.cpId as string,
          title: props.title as string,
          cards: cards.map((card) => ({
            ...(card.term !== undefined ? { term: card.term as string } : {}),
            q: card.q as string,
            a: card.a as string,
          })),
        };
      }
      throw new Error(`Unexpected Data Infrastructure widget ${widget.kind}.`);
    }),
    preserve: [...new Set(unchanged)],
  };
}

describe("Data Infrastructure German lessons 1-6", () => {
  it("loads the six actual bundles with the complete reviewed structure", () => {
    expect(LESSON_PAIRS.map(([source]) => source.id)).toEqual(EXPECTED_IDS);
    expect(LESSON_PAIRS.map(([, german]) => german.id)).toEqual(EXPECTED_IDS);
    expect(LESSON_PAIRS.map(([, german]) => german.number)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);

    const germanLessons = LESSON_PAIRS.map(([, german]) => german);
    expect(
      germanLessons.reduce((sum, lesson) => sum + lesson.sections.length, 0),
    ).toBe(47);
    expect(
      germanLessons.reduce(
        (sum, lesson) => sum + (lesson.widgets?.length ?? 0),
        0,
      ),
    ).toBe(19);
    expect(
      germanLessons.reduce(
        (sum, lesson) =>
          sum +
          (lesson.widgets ?? []).filter(({ kind }) => kind === "quiz").length,
        0,
      ),
    ).toBe(13);
    expect(
      germanLessons.reduce(
        (sum, lesson) =>
          sum +
          (lesson.widgets ?? []).filter(({ kind }) => kind === "flashcards")
            .length,
        0,
      ),
    ).toBe(6);
    expect(
      germanLessons.reduce(
        (sum, lesson) => sum + collectVisibleEntries(lesson).length,
        0,
      ),
    ).toBe(468);
  });

  it("derives identical lesson, section, checkpoint, scoring and ordering identity", () => {
    for (const [source, german] of LESSON_PAIRS) {
      expect(machineProjection(german), source.id).toEqual(
        machineProjection(source),
      );
      expect(german.quiz, source.id).toEqual([]);
      for (const widget of german.widgets ?? []) {
        const props = widget.props as Record<string, unknown>;
        expect(props.lessonId, `${source.id}/${String(props.cpId)}`).toBe(
          `di-${source.id}`,
        );
      }
    }
  });

  it("preserves code, SQL, paths, formulas and numeric facts at their actual content paths", () => {
    for (const [source, german] of LESSON_PAIRS) {
      const sourceEntries = visibleByPath(source);
      const germanEntries = visibleByPath(german);
      expect([...germanEntries.keys()], source.id).toEqual([
        ...sourceEntries.keys(),
      ]);

      for (const [path, sourceValue] of sourceEntries) {
        const germanValue = germanEntries.get(path);
        expect(germanValue, path).toBeDefined();
        expect(protectedNumbers(germanValue!), path).toEqual(
          protectedNumbers(sourceValue),
        );
        expect(inlineCode(germanValue!), path).toEqual(inlineCode(sourceValue));
        expect(fencedCode(germanValue!), path).toEqual(fencedCode(sourceValue));
      }
    }
  });

  it("contains reviewed German copy with only declared technical terms unchanged", () => {
    const unchanged = new Set<string>();
    const germanValues: string[] = [];

    for (const [source, german] of LESSON_PAIRS) {
      const sourceEntries = visibleByPath(source);
      const germanEntries = visibleByPath(german);
      for (const [path, sourceValue] of sourceEntries) {
        const germanValue = germanEntries.get(path);
        expect(germanValue?.trim().length, path).toBeGreaterThan(0);
        germanValues.push(germanValue!);
        if (germanValue === sourceValue) unchanged.add(sourceValue);
      }
    }

    expect(unchanged).toEqual(REVIEWED_UNCHANGED_TERMS);

    const prose = germanValues
      .join("\n")
      .replace(/```[\s\S]*?```/gu, "")
      .replace(/`[^`]*`/gu, "");
    expect(prose).not.toMatch(
      /\b(?:the|you|which|what|why|when|because|every|this|that|from|into|without|they|their|should|would|could|does|did|with|are|were|has|have|can)\b/iu,
    );
    expect(prose).not.toMatch(/[–—]/u);
  });

  it("rebuilds each German lesson from the actual pair without fallback", () => {
    for (const [source, german] of LESSON_PAIRS) {
      const translation = reviewedTranslationFromPair(source, german);
      expect(localizeDataInfraLessonToGerman(source, translation)).toEqual(
        german,
      );
    }
  });

  it("fails closed for a copied source string or a new learner-visible field", () => {
    const reviewed = reviewedTranslationFromPair(mentalModelEn, mentalModelDe);
    expect(() =>
      localizeDataInfraLessonToGerman(mentalModelEn, {
        ...reviewed,
        title: mentalModelEn.title,
      }),
    ).toThrow(/unreviewed German copy/u);

    const drifted = {
      ...mentalModelEn,
      futureSummary: "New learner-visible source copy.",
    } as unknown as DataInfraLesson;
    expect(() => localizeDataInfraLessonToGerman(drifted, reviewed)).toThrow(
      /fields changed/u,
    );

    const firstWidget = mentalModelEn.widgets![0];
    const firstProps = firstWidget.props as Record<string, unknown>;
    const driftedCopy = {
      ...mentalModelEn,
      widgets: [
        {
          ...firstWidget,
          props: {
            ...firstProps,
            copy: {
              ...(firstProps.copy as Record<string, unknown>),
              futureLabel: "Future learner-visible widget copy.",
            },
          },
        },
        ...mentalModelEn.widgets!.slice(1),
      ],
    };
    expect(() =>
      localizeDataInfraLessonToGerman(driftedCopy, reviewed),
    ).toThrow(/fields changed/u);
  });
});
