import { describe, expect, it } from "vitest";
import type { DataInfraLesson } from "./types";
import batchEltEn from "./lessons/batch-elt";
import batchEltDe from "./lessons/de/batch-elt";
import streamingEn from "./lessons/streaming";
import streamingDe from "./lessons/de/streaming";
import cdcLambdaKappaEn from "./lessons/cdc-lambda-kappa";
import cdcLambdaKappaDe from "./lessons/de/cdc-lambda-kappa";
import idempotencyEn from "./lessons/idempotency";
import idempotencyDe from "./lessons/de/idempotency";
import slaQualityEn from "./lessons/sla-quality";
import slaQualityDe from "./lessons/de/sla-quality";
import interviewPlaybookEn, {
  INTERVIEW_MOVES as INTERVIEW_MOVES_EN,
} from "./lessons/interview-playbook";
import interviewPlaybookDe, {
  INTERVIEW_MOVES as INTERVIEW_MOVES_DE,
} from "./lessons/de/interview-playbook";
import {
  localizeDataInfraLessonToGerman,
  type DataInfraLessonTranslation,
} from "./translate-lesson";

const LESSON_PAIRS = [
  [batchEltEn, batchEltDe],
  [streamingEn, streamingDe],
  [cdcLambdaKappaEn, cdcLambdaKappaDe],
  [idempotencyEn, idempotencyDe],
  [slaQualityEn, slaQualityDe],
  [interviewPlaybookEn, interviewPlaybookDe],
] as const;

const EXPECTED_IDS = [
  "batch-elt",
  "streaming",
  "cdc-lambda-kappa",
  "idempotency",
  "sla-quality",
  "interview-playbook",
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
  "ELT",
  "Lineage",
  "Sensor",
  "Watermark",
  "ISR",
  "At-most-once",
  "At-least-once",
  "Exactly-once",
  "Backpressure",
  "CDC, Lambda & Kappa",
  "Change Data Capture",
  "WAL/binlog",
  "Debezium",
  "WAL / binlog",
  "Tombstone",
  "Outbox",
  "Freshness",
  "SLA / SLO / SLI",
  "Great Expectations",
  "Monte Carlo",
  "OpenLineage",
  "CAP",
  "PACELC",
  "Idempotent",
  "CDC",
  "Clustering",
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
      collectVisibleEntries(
        child,
        path + "[" + String(index) + "]",
        null,
        entries,
      ),
    );
    return entries;
  }
  if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([childKey, child]) =>
      collectVisibleEntries(child, path + "." + childKey, childKey, entries),
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

function inlineCode(value: string): readonly string[] {
  return [...value.matchAll(/(?<!\x60)\x60([^\x60\n]+)\x60(?!\x60)/gu)].map(
    (match) => match[1],
  );
}

function fencedCode(value: string): readonly string[] {
  return [...value.matchAll(/\x60\x60\x60([\s\S]*?)\x60\x60\x60/gu)].map(
    (match) => match[1],
  );
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
      throw new Error(
        "Unexpected Data Infrastructure widget " + widget.kind + ".",
      );
    }),
    preserve: [...new Set(unchanged)],
  };
}

describe("Data Infrastructure German lessons 7-12", () => {
  it("loads all six reviewed bundles without an English fallback", () => {
    expect(LESSON_PAIRS.map(([source]) => source.id)).toEqual(EXPECTED_IDS);
    expect(LESSON_PAIRS.map(([, german]) => german.id)).toEqual(EXPECTED_IDS);
    expect(LESSON_PAIRS.map(([, german]) => german.number)).toEqual([
      7, 8, 9, 10, 11, 12,
    ]);

    const germanLessons = LESSON_PAIRS.map(([, german]) => german);
    expect(
      germanLessons.reduce((sum, lesson) => sum + lesson.sections.length, 0),
    ).toBe(49);
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
    ).toBe(543);
  });

  it("preserves lesson, section, checkpoint, scoring, and ordering identity", () => {
    for (const [source, german] of LESSON_PAIRS) {
      expect(machineProjection(german), source.id).toEqual(
        machineProjection(source),
      );
      expect(german.quiz, source.id).toEqual([]);
      for (const widget of german.widgets ?? []) {
        const props = widget.props as Record<string, unknown>;
        expect(props.lessonId, source.id + "/" + String(props.cpId)).toBe(
          "di-" + source.id,
        );
      }
    }
  });

  it("preserves code, SQL, JSON, paths, formulas, and config values at their actual paths", () => {
    for (const [source, german] of LESSON_PAIRS) {
      const sourceEntries = visibleByPath(source);
      const germanEntries = visibleByPath(german);
      expect([...germanEntries.keys()], source.id).toEqual([
        ...sourceEntries.keys(),
      ]);

      for (const [path, sourceValue] of sourceEntries) {
        const germanValue = germanEntries.get(path);
        expect(germanValue, path).toBeDefined();
        expect(inlineCode(germanValue!), path).toEqual(inlineCode(sourceValue));
        expect(fencedCode(germanValue!), path).toEqual(fencedCode(sourceValue));
      }
    }
  });

  it("contains reviewed German copy and only declared unchanged technical terms", () => {
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
      .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/gu, "")
      .replace(/\x60[^\x60]*\x60/gu, "");
    for (const englishSourceFragment of [
      "The boring parts that pay the bills.",
      "Why event time",
      "The whole field is engineered around two clocks",
      "How operational DBs become analytical streams",
      "The phrase that separates IC4 from IC5.",
      "Every messaging or pipeline system promises one of three",
      "Five layers of monitoring.",
      "How to never debug at 2am again.",
      "A complete IC5 system design walkthrough",
      "Every data system design interview",
    ]) {
      expect(prose).not.toContain(englishSourceFragment);
    }
  });

  it("rebuilds all six German lessons from the actual pairs", () => {
    for (const [source, german] of LESSON_PAIRS) {
      expect(
        localizeDataInfraLessonToGerman(
          source,
          reviewedTranslationFromPair(source, german),
        ),
      ).toEqual(german);
    }
  });

  it("fails closed for copied English or future learner-visible fields", () => {
    const reviewed = reviewedTranslationFromPair(batchEltEn, batchEltDe);
    expect(() =>
      localizeDataInfraLessonToGerman(batchEltEn, {
        ...reviewed,
        title: batchEltEn.title,
      }),
    ).toThrow(/unreviewed German copy/u);

    const drifted = {
      ...batchEltEn,
      futureSummary: "New learner-visible source copy.",
    } as unknown as DataInfraLesson;
    expect(() => localizeDataInfraLessonToGerman(drifted, reviewed)).toThrow(
      /fields changed/u,
    );

    const firstWidget = batchEltEn.widgets![0];
    const firstProps = firstWidget.props as Record<string, unknown>;
    const driftedCopy = {
      ...batchEltEn,
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
        ...batchEltEn.widgets!.slice(1),
      ],
    };
    expect(() =>
      localizeDataInfraLessonToGerman(driftedCopy, reviewed),
    ).toThrow(/fields changed/u);
  });

  it("translates all 12 interview moves while preserving their machine contract", () => {
    expect(INTERVIEW_MOVES_DE).toHaveLength(12);
    expect(INTERVIEW_MOVES_DE.map(({ tag }) => tag)).toEqual(
      INTERVIEW_MOVES_EN.map(({ tag }) => tag),
    );
    expect(
      INTERVIEW_MOVES_DE.map(({ title }) => title.match(/^\d{2}:\d{2}/u)?.[0]),
    ).toEqual(
      INTERVIEW_MOVES_EN.map(({ title }) => title.match(/^\d{2}:\d{2}/u)?.[0]),
    );

    for (let index = 0; index < INTERVIEW_MOVES_EN.length; index += 1) {
      const source = INTERVIEW_MOVES_EN[index];
      const german = INTERVIEW_MOVES_DE[index];
      expect(german.title, source.tag).not.toBe(source.title);
      expect(german.body, source.tag).not.toBe(source.body);
      expect(german.note, source.tag).not.toBe(source.note);
      expect(german.body.trim().length, source.tag).toBeGreaterThan(40);
      expect(german.note.trim().length, source.tag).toBeGreaterThan(20);
    }

    const germanWalkthrough = INTERVIEW_MOVES_DE.map(
      ({ title, body, note }) => title + "\n" + body + "\n" + note,
    ).join("\n");
    for (const machineValue of [
      "GET /sellers/:id/dashboard",
      "WS  /sellers/:id/updates",
      "event_id, order_id, seller_id, operation, source_commit_position, occurred_at, amount_minor, currency, schema_version",
      "10,000",
      "864 GB",
      "as_of",
    ]) {
      expect(germanWalkthrough, machineValue).toContain(machineValue);
    }
    expect(germanWalkthrough).not.toContain("This is not throat-clearing.");
    expect(germanWalkthrough).not.toContain(
      "The thing I'd watch in production",
    );
  });
});
