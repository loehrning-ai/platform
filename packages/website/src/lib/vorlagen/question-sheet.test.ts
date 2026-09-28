/**
 * The question sheet "KI in der Ausbildung: Fragen für JAV und Betriebsrat".
 *
 * Two layers: the real DE and EN files must parse and stay in parity (same
 * groups, same questions, the same laws cited per question, the same "Hinweis"
 * and "Offen" asides), and the parser must refuse every malformed edit that
 * would otherwise render a question without its legal basis.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { SITE_ORIGIN } from "@/lib/seo/entity";
import {
  SHEET_LABELS,
  SheetFormatError,
  formatSheetDate,
  parseQuestionSheet,
  type QuestionSheet,
  type SheetLocale,
} from "./question-sheet";
import { VORLAGEN } from "./registry";

const CONTENT_ROOT = path.join(process.cwd(), "content", "vorlagen");
const ENTRY = VORLAGEN.find((item) => item.slug === "ki-in-der-ausbildung-fragen")!;

function readSheet(locale: SheetLocale): string {
  return readFileSync(path.join(CONTENT_ROOT, ENTRY.files[locale]), "utf8");
}

const RAW: Record<SheetLocale, string> = { de: readSheet("de"), en: readSheet("en") };
const SHEETS: Record<SheetLocale, QuestionSheet> = {
  de: parseQuestionSheet(RAW.de, "de"),
  en: parseQuestionSheet(RAW.en, "en"),
};

/** Law names per locale, in the same order, so counts compare index by index. */
const LAWS: Record<SheetLocale, readonly RegExp[]> = {
  de: [/\bBetrVG\b/g, /\bBBiG\b/g, /\bJArbSchG\b/g, /\bDSGVO\b/g, /\bKI-VO\b/g],
  en: [/\bBetrVG\b/g, /\bBBiG\b/g, /\bJArbSchG\b/g, /\bGDPR\b/g, /\bAI Act\b/g],
};

function lawCounts(text: string, locale: SheetLocale): number[] {
  return LAWS[locale].map((pattern) => (text.match(pattern) ?? []).length);
}

function allQuestions(sheet: QuestionSheet) {
  return sheet.groups.flatMap((group) => group.questions);
}

/** The superseded Article 4 wording, as public-content-claims.test.ts forbids it. */
const SUPERSEDED_ART_4 =
  /maßnahmen (?:für ein angemessenes niveau an|zur entwicklung (?:der|von)) ki-kompetenz|measures to ensure an appropriate level of ai literacy|measures to develop the ai literacy|measures that develop the ai literacy/iu;

describe("the published sheets", () => {
  it("parse in both locales with the published shape", () => {
    for (const locale of ["de", "en"] as const) {
      const sheet = SHEETS[locale];
      expect(sheet.meta.locale).toBe(locale);
      expect(sheet.groups.map((group) => group.letter)).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
      // A published document: adding or removing a question is a deliberate
      // edit that updates this line, never a side effect.
      expect(sheet.groups.map((group) => group.questions.length)).toEqual([2, 3, 4, 4, 2, 2, 3]);
      expect(sheet.questionCount).toBe(allQuestions(sheet).length);
      expect(sheet.usage.steps.length).toBeGreaterThan(0);
      expect(sheet.limits.length).toBeGreaterThan(0);
    }
  });

  it("keep DE and EN in parity question by question", () => {
    const de = SHEETS.de;
    const en = SHEETS.en;
    expect(de.questionCount).toBe(en.questionCount);
    expect(de.usage.steps.length).toBe(en.usage.steps.length);
    expect(de.groups.map((group) => [group.letter, group.questions.length])).toEqual(
      en.groups.map((group) => [group.letter, group.questions.length]),
    );
    expect(de.meta.lastReviewed).toBe(en.meta.lastReviewed);
    expect(de.meta.nextReview).toBe(en.meta.nextReview);
    expect(de.meta.sources.map((source) => source.url)).toEqual(
      en.meta.sources.map((source) => source.url),
    );

    const deQuestions = allQuestions(de);
    const enQuestions = allQuestions(en);
    deQuestions.forEach((question, index) => {
      const other = enQuestions[index]!;
      const label = `question ${question.number}`;
      expect(other.number, label).toBe(question.number);
      expect(lawCounts(other.legalBasis, "en"), label).toEqual(lawCounts(question.legalBasis, "de"));
      expect(other.note === undefined, `${label} note`).toBe(question.note === undefined);
      expect(other.open === undefined, `${label} open`).toBe(question.open === undefined);
    });
  });

  it("ask real questions, each with a named law", () => {
    for (const locale of ["de", "en"] as const) {
      for (const question of allQuestions(SHEETS[locale])) {
        const label = `${locale} question ${question.number}`;
        expect(question.text.endsWith("?"), label).toBe(true);
        expect(lawCounts(question.legalBasis, locale).some((count) => count > 0), label).toBe(true);
        expect(question.answer.length, label).toBeGreaterThan(0);
      }
    }
  });

  it("stay reviewable and point at the page that publishes them", () => {
    for (const locale of ["de", "en"] as const) {
      const { meta } = SHEETS[locale];
      expect(meta.nextReview > SITE_CONTENT_DATE).toBe(true);
      expect(meta.license).toBe("CC BY 4.0");
      expect(meta.hostPath).toBe(ENTRY.hostPaths[locale]);
      expect(meta.attribution.endsWith(`${SITE_ORIGIN}${meta.hostPath}`)).toBe(true);
      expect(meta.attribution.startsWith("loehrning.ai, Tim Löhr, ")).toBe(true);
      // The status line repeats the review date and the licence.
      expect(SHEETS[locale].status.startsWith(`${formatSheetDate(meta.lastReviewed, locale)}.`)).toBe(true);
      expect(SHEETS[locale].status).toContain("CC BY 4.0");
    }
    expect(SHEETS.de.status).toContain("Keine Rechtsberatung.");
    expect(SHEETS.en.status).toContain("This is not legal advice.");
  });

  it("use no en or em dash and only the current Article 4 wording", () => {
    for (const locale of ["de", "en"] as const) {
      expect(RAW[locale].includes("–"), locale).toBe(false);
      expect(RAW[locale].includes("—"), locale).toBe(false);
      expect(RAW[locale]).not.toMatch(SUPERSEDED_ART_4);
    }
    expect(RAW.de).toContain("Maßnahmen, die die Entwicklung der KI-Kompetenz");
    expect(RAW.en).toContain("measures that support the development of AI literacy");
  });

  it("claim no check that did not happen and no certificate duty", () => {
    for (const locale of ["de", "en"] as const) {
      const raw = RAW[locale];
      expect(raw, locale).not.toMatch(/am Gesetzestext geprüft|against the statute text/iu);
      expect(raw, locale).not.toMatch(/abgerufen am|accessed on/iu);
      expect(raw, locale).not.toMatch(/Zertifikat|certificate/iu);
      expect(raw, locale).not.toMatch(/Azubi-Recruiting/iu);
    }
    // An open point stays open: no claim about what a court has not decided.
    expect(RAW.de).not.toContain("hat das Bundesarbeitsgericht noch nicht entschieden");
    expect(RAW.en).not.toContain("has not yet decided");
  });

  it("keep the status label that content-lint exempts from the date registry", () => {
    const lint = readFileSync(path.join(process.cwd(), "scripts", "content-lint.mjs"), "utf8");
    expect(SHEET_LABELS.de.status).toBe("**Letzte redaktionelle Prüfung:**");
    expect(lint).toContain("Letzte redaktionelle Prüfung:\\*\\*");
  });

  it("refuse the wrong locale", () => {
    expect(() => parseQuestionSheet(RAW.de, "en")).toThrow(SheetFormatError);
    expect(() => parseQuestionSheet(RAW.en, "de")).toThrow(SheetFormatError);
  });
});

describe("formatSheetDate", () => {
  it("writes the review date in each locale", () => {
    expect(formatSheetDate("2026-09-27", "de")).toBe("27. September 2026");
    expect(formatSheetDate("2026-09-27", "en")).toBe("27 September 2026");
    expect(formatSheetDate("2027-01-15", "de")).toBe("15. Januar 2027");
    expect(formatSheetDate("2026-03-01", "de")).toBe("1. März 2026");
  });

  it.each([
    "2026-9-27",
    "27.09.2026",
    "2026-13-01",
    "2026-00-10",
    "2026-01-32",
    "2026-02-30",
    "2027-02-29",
    "2026-04-31",
    "",
  ])(
    "rejects %j",
    (value) => {
      expect(() => formatSheetDate(value, "de")).toThrow(SheetFormatError);
    },
  );
});

/** A small valid sheet; each failure case changes exactly one thing. */
const FIXTURE = `---
title: "Testliste"
locale: de
version: 1
owner: Tim Löhr
lastReviewed: "2026-09-27"
nextReview: "2027-01-15"
reviewCadence: quarterly
riskClass: high
sources:
  - title: "Betriebsverfassungsgesetz (BetrVG)"
    url: "https://www.gesetze-im-internet.de/betrvg/"
license: CC BY 4.0
attribution: "loehrning.ai, Tim Löhr, https://loehrning.ai/blog/test"
hostPath: /blog/test
---

# Testliste

Eine Einleitung.

**Letzte redaktionelle Prüfung:** 27. September 2026. Keine Rechtsberatung.

## So setzt ihr die Liste ein

1. Erster Schritt.
2. Zweiter Schritt.

## A. Erste Gruppe

### 1. Erste Frage?

Rechtsgrundlage: § 80 Abs. 2 BetrVG

Die Antwort sollte enthalten: etwas.

### 2. Zweite Frage?

Rechtsgrundlage: § 90 BetrVG

Die Antwort sollte enthalten: noch etwas.

Offen: ein offener Punkt.

## Grenzen dieser Liste

Eine Grenze.

## Quellen

- Betriebsverfassungsgesetz (BetrVG): https://www.gesetze-im-internet.de/betrvg/
`;

function mutate(from: string, to: string): string {
  expect(FIXTURE.split(from).length - 1, `fixture contains ${from} once`).toBe(1);
  return FIXTURE.replace(from, to);
}

describe("parseQuestionSheet on fixtures", () => {
  it("parses the valid fixture", () => {
    const sheet = parseQuestionSheet(FIXTURE, "de");
    expect(sheet.questionCount).toBe(2);
    expect(sheet.usage.steps).toEqual(["Erster Schritt.", "Zweiter Schritt."]);
    expect(sheet.groups[0]!.questions[1]!.open).toBe("ein offener Punkt.");
    expect(sheet.groups[0]!.questions[0]!.note).toBeUndefined();
  });

  it.each([
    [
      "a question without its legal basis",
      "Rechtsgrundlage: § 90 BetrVG\n\n",
      "",
    ],
    ["a question out of order", "### 2. Zweite Frage?", "### 3. Zweite Frage?"],
    ["an unlabelled block", "Offen: ein offener Punkt.", "Ein Absatz ohne Label."],
    ["a duplicated block", "Offen: ein offener Punkt.", "Die Antwort sollte enthalten: doppelt."],
    ["an unquoted date", 'lastReviewed: "2026-09-27"', "lastReviewed: 2026-09-27"],
    [
      "body sources that differ from the frontmatter",
      "- Betriebsverfassungsgesetz (BetrVG): https://www.gesetze-im-internet.de/betrvg/",
      "- Betriebsverfassungsgesetz: https://www.gesetze-im-internet.de/betrvg/",
    ],
    [
      "a status date that differs from lastReviewed",
      "**Letzte redaktionelle Prüfung:** 27. September 2026.",
      "**Letzte redaktionelle Prüfung:** 12. Oktober 2026.",
    ],
    ["a question without a question mark", "### 1. Erste Frage?", "### 1. Erste Frage."],
    ["a group out of order", "## A. Erste Gruppe", "## B. Erste Gruppe"],
    ["an H1 that differs from the title", "# Testliste", "# Andere Liste"],
    ["a licence other than CC BY 4.0", "license: CC BY 4.0", "license: CC BY-SA 4.0"],
    ["a next review before the last review", 'nextReview: "2027-01-15"', 'nextReview: "2026-01-15"'],
    ["a usage step out of order", "2. Zweiter Schritt.", "3. Zweiter Schritt."],
    ["an impossible review date", 'lastReviewed: "2026-09-27"', 'lastReviewed: "2026-02-30"'],
    ["an impossible next review", 'nextReview: "2027-01-15"', 'nextReview: "2027-02-31"'],
    [
      "text after the sources",
      "https://www.gesetze-im-internet.de/betrvg/\n",
      "https://www.gesetze-im-internet.de/betrvg/\n\nNachtrag.\n",
    ],
  ])("throws SheetFormatError for %s", (_label, from, to) => {
    const broken = mutate(from, to);
    expect(() => parseQuestionSheet(broken, "de")).toThrow(SheetFormatError);
  });
});

describe("parseQuestionSheet front matter", () => {
  const flag = "__questionSheetFrontMatterRan";

  it.each([
    // Without the guard, gray-matter would eval() these blocks and set the flag.
    ["---js", `---js\n{ title: (globalThis.${flag} = true, 'x') }\n---\n# x\n`],
    ["---javascript", `---javascript\n({ locale: (globalThis.${flag} = true, 'de') })\n---\n# x\n`],
    ["---coffee", "---coffee\ntitle: 'x'\n---\n# x\n"],
    ["a leading blank line", "\n" + FIXTURE],
  ])("refuses %s before any engine runs", (_label, raw) => {
    delete (globalThis as Record<string, unknown>)[flag];
    expect(() => parseQuestionSheet(raw, "de")).toThrow(SheetFormatError);
    expect((globalThis as Record<string, unknown>)[flag]).toBeUndefined();
  });

  it("accepts CRLF line endings after the opening delimiter", () => {
    const sheet = parseQuestionSheet(FIXTURE.replace(/^---\n/, "---\r\n"), "de");
    expect(sheet.meta.title).toBe("Testliste");
  });
});
