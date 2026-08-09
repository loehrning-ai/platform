import { beforeEach, describe, expect, it } from "vitest";
import { __resetClaudeLessonCacheForTests } from "./data";
import {
  __resetClaudeCourseLocaleRegistryForTests,
  getClaudeCourseLocaleRegistry,
} from "./localization";

const MACHINE_KEYS = new Set([
  "id",
  "trackId",
  "courseSlug",
  "lessonId",
  "cpId",
  "kind",
  "placement",
  "correct",
  "correctOrder",
]);

function visibleStrings(value: unknown, key = ""): string[] {
  if (MACHINE_KEYS.has(key)) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => visibleStrings(item));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([childKey, child]) =>
      visibleStrings(child, childKey),
    );
  }
  return [];
}

beforeEach(() => {
  __resetClaudeLessonCacheForTests();
  __resetClaudeCourseLocaleRegistryForTests();
});

describe("Claude course claim hygiene", () => {
  it("rejects obsolete metrics, product absolutes, anthropomorphic copy, and prompt-only security advice in both locales", async () => {
    const registry = await getClaudeCourseLocaleRegistry();
    const english = visibleStrings(registry.get("en").content).join("\n");
    const german = visibleStrings(registry.get("de").content).join("\n");

    const bannedEnglish = [
      /queries placed.{0,80}up to 30%/iu,
      /1 word.{0,20}1\.3 tokens/iu,
      /(?:100-300 words|2-5 input\/output examples)/iu,
      /(?:brilliant|world-class) new hire/iu,
      /single most impactful lever/iu,
      /prompt engineering is a science/iu,
      /most hallucinations happen/iu,
      /Claude wants to be honest/iu,
      /Claude with hands/iu,
      /much of the codebase.{0,40}Claude Code/iu,
      /everything you paste is logged/iu,
      /prefill.{0,80}(?:forces|force the shape)/iu,
      /safe to paste/iu,
    ];
    const bannedGerman = [
      /bis zu 30\s?%/iu,
      /1 Wort.{0,24}1[,.]3 Tokens/iu,
      /(?:100-300 Wörter|2-5 Eingabe-\/Ausgabebeispiele)/iu,
      /(?:fähige[nr]?|kompetente[nr]?) neue[nr]? Mitarbeiter/iu,
      /Prompt Engineering ist eine Wissenschaft/iu,
      /die meisten Halluzinationen/iu,
      /Claude möchte ehrlich sein/iu,
      /Claude mit Händen/iu,
      /Großteil der Codebasis.{0,40}Claude Code/iu,
      /alles, was du einfügst.{0,40}protokolliert/iu,
      /Antwort vorab ausfüllen.{0,100}erzwingt/iu,
      /sicher (?:einzufügen|zum Einfügen)/iu,
    ];

    for (const pattern of bannedEnglish) {
      expect(english, pattern.source).not.toMatch(pattern);
    }
    for (const pattern of bannedGerman) {
      expect(german, pattern.source).not.toMatch(pattern);
    }
  });
});
