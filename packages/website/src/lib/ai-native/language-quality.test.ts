import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const CONTENT_FILES = [
  "course.json",
  "modules.json",
  "modul-1-lessons.json",
  "modul-2-lessons.json",
  "modul-3-lessons.json",
  "modul-4-lessons.json",
  "glossary.json",
  "challenges.json",
  "quiz/questions.json",
] as const;

const CLAIM_KEYS = new Set([
  "content",
  "critique",
  "definition",
  "description",
  "explanation",
  "hint",
  "keyTakeaway",
  "modelSolution",
  "prompt",
  "question",
  "questionText",
  "rotationNote",
  "rubric",
  "scenario",
  "subtitle",
  "tagline",
  "title",
  "voiceAnchor",
]);

const FORBIDDEN_CLAIMS = [
  /hidden superpower|versteckte(?:r|n|s)? superkraft/i,
  /prompt[- ]?mastery/i,
  /productivity[- ]?multiplier|produktivitäts[- ]?multiplikator/i,
  /lifetime[- ]?(?:return|rendite)/i,
  /power[- ]?tier/i,
  /SOPs? (?:are|sind) (?:dead|tot)/i,
  /you direct.{0,50}claude executes|du dirigierst.{0,50}claude führt aus/i,
  /claude (?:is|ist) (?:your|dein|der) (?:colleague|kollege)/i,
  /draft in 2 minutes|entwurf in 2 minuten/i,
  /60\s?% starting code|60\s?% startcode/i,
  /set up in 30 minutes|setup.{0,24}30 minuten/i,
  /7[–-]14 (?:hours|stunden)|10 (?:to|bis) 15 (?:hours|stunden)/i,
  /12 minutes with claude|12 minuten mit claude/i,
  /Claude (?:Opus|Sonnet|Haiku) \d(?:\.\d+)?/i,
  /datenschutzkonform nach dsgvo|gdpr-compliant automation/i,
  /maßnahmen für ein angemessenes niveau an ki-kompetenz|measures to ensure an appropriate level of ai literacy/i,
] as const;

function load(locale: "de" | "en", filename: (typeof CONTENT_FILES)[number]): JsonValue {
  const relative =
    locale === "de"
      ? `content/ai-native/${filename}`
      : `content/ai-native/en/${filename}`;
  return JSON.parse(
    readFileSync(resolve(process.cwd(), relative), "utf8"),
  ) as JsonValue;
}

function collectStringLeaves(value: JsonValue, result: string[]): void {
  if (typeof value === "string") {
    result.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child) => collectStringLeaves(child, result));
    return;
  }
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => collectStringLeaves(child, result));
  }
}

function collectApprovedClaims(value: JsonValue, key?: string, result: string[] = []): string[] {
  if (key === "answerOptions" && Array.isArray(value)) {
    for (const option of value) {
      if (
        option !== null &&
        typeof option === "object" &&
        !Array.isArray(option) &&
        option.isCorrect === true &&
        typeof option.text === "string"
      ) {
        result.push(option.text);
      }
    }
    return result;
  }

  if (key && CLAIM_KEYS.has(key)) {
    collectStringLeaves(value, result);
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((child) => collectApprovedClaims(child, undefined, result));
  } else if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([childKey, child]) =>
      collectApprovedClaims(child, childKey, result),
    );
  }
  return result;
}

describe("AI-Native bilingual language quality", () => {
  it.each(["de", "en"] as const)(
    "%s learner copy rejects removed hype, speed, provider and compliance claims",
    (locale) => {
      const copy = CONTENT_FILES.flatMap((filename) =>
        collectApprovedClaims(load(locale, filename)),
      ).join("\n");

      for (const pattern of FORBIDDEN_CLAIMS) {
        expect(copy, pattern.source).not.toMatch(pattern);
      }
    },
  );

  it("keeps removed claims and versioned provider labels out of learner-facing source", () => {
    const componentFiles = [
      "src/components/ai-native/fluency-test.tsx",
      "src/components/ai-native/hero.tsx",
      "src/components/ai-native/prompt-playground.tsx",
      "src/components/ai-native/terminal-demo.tsx",
      "src/components/ai-native/demos/agent-demo.tsx",
      "src/components/ai-native/demos/doc-demo.tsx",
      "src/components/ai-native/demos/finetune-demo.tsx",
      "src/components/ai-native/demos/logistics-demo.tsx",
      "src/components/ai-native/demos/observ-demo.tsx",
      "src/components/ai-native/demos/roi-demo.tsx",
      "src/components/ai-native/demos/word-demo.tsx",
      "src/components/ai-native/demos/workflow-demo.tsx",
    ];
    const source = componentFiles
      .map((filename) => readFileSync(resolve(process.cwd(), filename), "utf8"))
      .join("\n");

    for (const pattern of FORBIDDEN_CLAIMS) {
      expect(source, pattern.source).not.toMatch(pattern);
    }
    expect(source).not.toMatch(/34 Mittelstand|5[×x] schneller|97% confidence/i);
  });

  it("does not leak common German prose into English metadata and assessment copy", () => {
    const english = [
      "course.json",
      "modules.json",
      "challenges.json",
      "quiz/questions.json",
    ] as const;
    const copy = english
      .flatMap((filename) => collectApprovedClaims(load("en", filename)))
      .join("\n");

    expect(copy).not.toMatch(
      /[äöüß]|\b(?:Aufgabe|Datenschutz|Entwurf|Ergebnis|Freigabe|Lektion|Prüfung|Stunden|Verantwortung|Warum|Welche|Wie|Wofür)\b/u,
    );
  });
});
