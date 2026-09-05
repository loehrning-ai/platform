import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runVoiceLint } from "../content-lint.mjs";
import {
  classifyLearnerFile,
  collectLearnerFacingFiles,
  extractTsStringLiterals,
} from "../content-prose.mjs";
import {
  VOICE_PHRASE_RULES,
  VOICE_TERM_RULES,
  validateVoiceConfig,
} from "../content-voice-rules.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "fixtures", "voice");
const websiteRoot = path.resolve(here, "..", "..");

const FORM_MAP = {
  default: "du",
  courses: {
    "content/ki-fuehrerschein": "du",
    "content/eu-ai-act-kurs": "sie",
    "content/ki-und-gesellschaft": "du",
  },
};

function config({ strict = [], entries = [] } = {}) {
  return validateVoiceConfig({
    scope: { strict },
    allowlist: { entries },
    formMap: FORM_MAP,
  });
}

function lint(fixture, options = {}) {
  const result = runVoiceLint({
    root: path.join(fixtures, fixture),
    config: config(options),
  });
  return { ...result, all: [...result.errors, ...result.warnings] };
}

const byRule = (findings, rule) => findings.filter((f) => f.rule === rule);
const byPhrase = (findings, phrase) => findings.filter((f) => f.phrase === phrase);

const GERMAN_JSON = "content/ki-fuehrerschein/block-1-test-lessons.json";
const GERMAN_MD = "content/books/testbuch/01_kapitel.md";
const ENGLISH_JSON = "content/ki-fuehrerschein/en/block-1-test-lessons.json";
const ENGLISH_TS = "src/lib/codex/lessons/l99-fixture.ts";

const GERMAN_EXPECTATIONS = [
  ["VOICE-OPENER", "de-opener-heutige-zeit"],
  ["VOICE-OPENER", "de-opener-zunehmend-digitalisiert"],
  ["VOICE-OPENER", "de-opener-in-diesem-kapitel"],
  ["VOICE-FILLER", "de-filler-ganzheitlich"],
  ["VOICE-FILLER", "de-filler-umfassend"],
  ["VOICE-FILLER", "de-filler-grundlegend"],
  ["VOICE-FILLER", "de-filler-eigentlich"],
  ["VOICE-FILLER", "de-filler-im-prinzip"],
  ["VOICE-FILLER", "de-filler-grundsaetzlich"],
  ["VOICE-FILLER", "de-filler-quasi"],
  ["VOICE-FILLER", "de-filler-sozusagen"],
  ["VOICE-FILLER", "de-filler-halt"],
  ["VOICE-HEDGE", "de-hedge-wichtig-zu-betonen"],
  ["VOICE-HEDGE", "de-hedge-sei-darauf-hingewiesen"],
  ["VOICE-HEDGE", "de-hedge-anzumerken"],
  ["VOICE-COUNT-LESSON", "de-hedge-moeglicherweise"],
  ["VOICE-TRANSITION", "de-transition-darueber-hinaus"],
  ["VOICE-TRANSITION", "de-transition-zusammenfassend"],
  ["VOICE-TRANSITION", "de-transition-blick-werfen"],
  ["VOICE-TRANSITION", "de-transition-wie-bereits-erwaehnt"],
  ["VOICE-TRANSITION", "de-transition-wie-oben-erwaehnt"],
  ["VOICE-TRANSITION", "de-transition-wie-du-weisst"],
  ["VOICE-CLAIM", "de-claim-experten-einig"],
  ["VOICE-CLAIM", "claim-disruptive"],
  ["VOICE-CLAIM", "de-claim-standortbestimmung"],
  ["VOICE-CLAIM", "de-claim-schulungsnachweis"],
  ["VOICE-CLAIM", "de-claim-compliance-nachweis"],
  ["VOICE-COUNT-COURSE", "de-count-stell-dir-vor"],
  ["VOICE-COUNT-LESSON", "de-count-sowohl-als-auch"],
  ["VOICE-COUNT-LESSON", "de-count-nicht-nur-sondern-auch"],
  ["VOICE-FORM", "form-of-address"],
  ["VOICE-TERM", "de-term-zertifikat"],
  ["VOICE-TERM", "de-term-lernnachweis"],
  ["VOICE-PARAGRAPH", "paragraph-length"],
  ["VOICE-CLOSER", "trailing-summary"],
  ["VOICE-LISTS", "three-item-lists"],
];

const ENGLISH_EXPECTATIONS = [
  ["VOICE-OPENER", "en-opener-in-todays"],
  ["VOICE-OPENER", "en-opener-in-an-increasingly"],
  ["VOICE-OPENER", "en-opener-in-this-lesson"],
  ["VOICE-OPENER", "en-opener-whether-you-are"],
  ["VOICE-OPENER", "en-opener-lets-dive-in"],
  ["VOICE-OPENER", "en-opener-lets-explore"],
  ["VOICE-FILLER", "en-filler-delve"],
  ["VOICE-COUNT-LESSON", "en-filler-robust"],
  ["VOICE-FILLER", "en-filler-comprehensive"],
  ["VOICE-FILLER", "en-filler-holistic"],
  ["VOICE-FILLER", "en-filler-seamless"],
  ["VOICE-FILLER", "en-filler-cutting-edge"],
  ["VOICE-FILLER", "en-filler-best-in-class"],
  ["VOICE-FILLER", "en-filler-game-changer"],
  ["VOICE-COUNT-LESSON", "en-filler-landscape"],
  ["VOICE-HEDGE", "en-hedge-important-to-note"],
  ["VOICE-HEDGE", "en-hedge-worth-noting"],
  ["VOICE-HEDGE", "en-hedge-should-be-noted"],
  ["VOICE-TRANSITION", "en-transition-furthermore"],
  ["VOICE-TRANSITION", "en-transition-moreover"],
  ["VOICE-TRANSITION", "en-transition-in-conclusion"],
  ["VOICE-TRANSITION", "en-transition-to-sum-up"],
  ["VOICE-TRANSITION", "en-transition-as-mentioned-above"],
  ["VOICE-TRANSITION", "en-transition-as-you-already-know"],
  ["VOICE-CLAIM", "en-claim-experts-agree"],
  ["VOICE-CLAIM", "claim-disruptive"],
  ["VOICE-CLAIM", "en-claim-leverage"],
  ["VOICE-CLAIM", "en-claim-empower"],
  ["VOICE-CLAIM", "en-claim-unlock-potential"],
  ["VOICE-CLAIM", "en-claim-synergy"],
  ["VOICE-COUNT-COURSE", "en-count-imagine"],
  ["VOICE-COUNT-LESSON", "en-count-not-only-but-also"],
  ["VOICE-COUNT-LESSON", "en-count-both-and"],
  ["VOICE-TERM", "en-term-certificate"],
  ["VOICE-PARAGRAPH", "paragraph-length"],
  ["VOICE-CLOSER", "trailing-summary"],
  ["VOICE-LISTS", "three-item-lists"],
];

test("the German fixture trips every German rule with one named finding per pattern", () => {
  const { all, errors, configErrors } = lint("german");
  assert.deepEqual(configErrors, []);
  assert.deepEqual(errors, [], "nothing is strict, so every finding is a warning");
  for (const [rule, phrase] of GERMAN_EXPECTATIONS) {
    const hits = all.filter((f) => f.rule === rule && f.phrase === phrase);
    assert.ok(hits.length >= 1, `expected ${rule} / ${phrase}`);
  }
  const single = GERMAN_EXPECTATIONS.filter(
    ([rule]) => rule !== "VOICE-TRANSITION" && rule !== "VOICE-TERM",
  );
  for (const [rule, phrase] of single) {
    const hits = all.filter(
      (f) => f.relFile === GERMAN_JSON && f.rule === rule && f.phrase === phrase,
    );
    assert.equal(hits.length, 1, `expected exactly one ${rule} / ${phrase} in ${GERMAN_JSON}`);
  }
});

test("per-course and per-lesson counters allow the budget and report the excess", () => {
  const { all } = lint("german");
  const course = byPhrase(byRule(all, "VOICE-COUNT-COURSE"), "de-count-stell-dir-vor");
  assert.equal(course.length, 1);
  assert.match(course[0].message, /used 2 times in content\/ki-fuehrerschein; allowed 1 per course/);
  const sowohl = byPhrase(all, "de-count-sowohl-als-auch");
  assert.equal(sowohl.length, 1);
  assert.match(sowohl[0].message, /lesson lesson-1/);
  const hedge = byPhrase(all, "de-hedge-moeglicherweise");
  assert.equal(hedge.length, 1, "the first use is free, the second is reported");
});

test("incorrect quiz options are skipped and Markdown chapters are scanned", () => {
  const { all } = lint("german");
  const transitions = byPhrase(all, "de-transition-darueber-hinaus");
  assert.deepEqual(
    transitions.map((f) => f.relFile),
    [GERMAN_MD, GERMAN_JSON],
    "one hit in the prose and one in the chapter; the wrong quiz option must not count",
  );
  const closers = byRule(all, "VOICE-CLOSER");
  assert.deepEqual(
    closers.map((f) => [f.relFile, f.line]),
    [[GERMAN_MD, 9], [GERMAN_JSON, 36]],
    "the chapter closes on a Fazit heading, the lesson on a Fazit paragraph",
  );
  const lists = byRule(all, "VOICE-LISTS");
  assert.deepEqual(lists.map((f) => f.relFile), [GERMAN_JSON], "one list in the chapter is below the minimum");
});

test("the German form finding names the course form and the offending lines", () => {
  const { all } = lint("german");
  const form = byRule(all, "VOICE-FORM");
  assert.equal(form.length, 1);
  assert.equal(form[0].relFile, GERMAN_JSON);
  assert.match(form[0].message, /form of address is "du" \(content\/ki-fuehrerschein\) but 2 Sie-form marker\(s\)/);
});

test("the English fixture trips every English rule with one named finding per pattern", () => {
  const { all, errors, configErrors } = lint("english");
  assert.deepEqual(configErrors, []);
  assert.deepEqual(errors, []);
  for (const [rule, phrase] of ENGLISH_EXPECTATIONS) {
    const hits = all.filter((f) => f.rule === rule && f.phrase === phrase);
    assert.ok(hits.length >= 1, `expected ${rule} / ${phrase}`);
  }
  const single = ENGLISH_EXPECTATIONS.filter(
    ([rule, phrase]) =>
      rule !== "VOICE-TRANSITION" && phrase !== "en-opener-lets-explore",
  );
  for (const [rule, phrase] of single) {
    const hits = all.filter(
      (f) => f.relFile === ENGLISH_JSON && f.rule === rule && f.phrase === phrase,
    );
    assert.equal(hits.length, 1, `expected exactly one ${rule} / ${phrase} in ${ENGLISH_JSON}`);
  }
  assert.equal(byPhrase(all, "en-count-both-and").length, 1, "three uses of both ... and exceed the budget of two by one");
  assert.equal(byRule(all, "VOICE-FORM").length, 0, "English files are never form-checked");
});

test("TypeScript lessons are scanned through their string literals only", () => {
  const { all } = lint("english");
  const inTs = all.filter((f) => f.relFile === ENGLISH_TS);
  assert.deepEqual(
    inTs.map((f) => [f.rule, f.phrase, f.line]).sort(),
    [
      ["VOICE-FILLER", "en-filler-delve", 20],
      ["VOICE-OPENER", "en-opener-lets-explore", 7],
      ["VOICE-TRANSITION", "en-transition-furthermore", 15],
      ["VOICE-TRANSITION", "en-transition-moreover", 15],
    ],
    "the comment's Furthermore is silent, the template literal maps to its physical line",
  );
  const imagine = byPhrase(all, "en-count-imagine");
  assert.deepEqual(imagine.map((f) => f.relFile), [ENGLISH_JSON], "a different surface owns its own per-course budget");
});

test("every phrase and term rule is covered by the two language fixtures", () => {
  const seen = new Set(
    [...lint("german").all, ...lint("english").all].map((f) => f.phrase),
  );
  for (const entry of [...VOICE_PHRASE_RULES, ...VOICE_TERM_RULES]) {
    assert.ok(seen.has(entry.id), `rule ${entry.id} is not exercised by a fixture`);
  }
});

test("strict scope turns the strict rules into errors and leaves the advisory rules as warnings", () => {
  const relaxed = lint("german");
  assert.equal(relaxed.errors.length, 0);

  const strict = lint("german", { strict: ["content/ki-fuehrerschein/"] });
  assert.ok(strict.errors.length > 0);
  assert.ok(strict.errors.every((f) => f.relFile === GERMAN_JSON));
  const errorRules = new Set(strict.errors.map((f) => f.rule));
  for (const rule of ["VOICE-OPENER", "VOICE-FILLER", "VOICE-HEDGE", "VOICE-TRANSITION", "VOICE-CLAIM", "VOICE-COUNT-COURSE", "VOICE-COUNT-LESSON", "VOICE-FORM"]) {
    assert.ok(errorRules.has(rule), `${rule} should be an error in strict scope`);
  }
  for (const rule of ["VOICE-TERM", "VOICE-PARAGRAPH", "VOICE-CLOSER", "VOICE-LISTS"]) {
    assert.ok(!errorRules.has(rule), `${rule} stays a warning`);
    assert.ok(strict.warnings.some((f) => f.rule === rule && f.relFile === GERMAN_JSON));
  }
  assert.ok(
    strict.warnings.some((f) => f.relFile === GERMAN_MD && f.rule === "VOICE-TRANSITION"),
    "the chapter outside the strict prefix keeps warnings",
  );
  assert.equal(relaxed.all.length, strict.all.length, "scope changes severity, never the set of findings");
});

test("an allowlist entry without a reason is rejected", () => {
  const entry = { file: GERMAN_JSON, rule: "VOICE-OPENER" };
  const validated = validateVoiceConfig({
    scope: { strict: [] },
    allowlist: { entries: [entry, { ...entry, reason: "   " }] },
    formMap: FORM_MAP,
  });
  assert.equal(validated.errors.length, 2);
  for (const problem of validated.errors) {
    assert.equal(problem.file, "content-lint.allowlist.json");
    assert.match(problem.message, /reason is mandatory/);
  }
  assert.deepEqual(validated.allowlist, [], "an invalid entry never suppresses anything");
  const result = lint("german", { entries: [entry] });
  assert.equal(result.configErrors.length, 1);
  assert.ok(byRule(result.all, "VOICE-OPENER").length >= 3);
});

test("an allowlist entry with a reason suppresses exactly its rule, and an unused entry is reported", () => {
  const result = lint("german", {
    entries: [
      { file: GERMAN_JSON, rule: "VOICE-OPENER", reason: "fixture proves suppression" },
      { file: GERMAN_JSON, rule: "VOICE-FILLER", phrase: "de-filler-quasi", reason: "narrowed to one phrase" },
      { file: "content/books/testbuch/", rule: "VOICE-CLAIM", reason: "matches nothing on purpose" },
    ],
  });
  assert.deepEqual(result.configErrors, []);
  assert.equal(byRule(result.all, "VOICE-OPENER").length, 0);
  assert.equal(result.suppressed.filter((f) => f.rule === "VOICE-OPENER").length, 3);
  assert.equal(byPhrase(result.all, "de-filler-quasi").length, 0);
  assert.ok(byPhrase(result.all, "de-filler-sozusagen").length === 1, "other filler phrases stay reported");
  const unused = byRule(result.warnings, "VOICE-ALLOWLIST-UNUSED");
  assert.equal(unused.length, 1);
  assert.match(unused[0].message, /content\/books\/testbuch\/ \/ VOICE-CLAIM/);
});

test("an unknown rule id in the allowlist is rejected", () => {
  const validated = validateVoiceConfig({
    scope: { strict: [] },
    allowlist: { entries: [{ file: GERMAN_JSON, rule: "VOICE-NOPE", reason: "typo" }] },
    formMap: FORM_MAP,
  });
  assert.equal(validated.errors.length, 1);
  assert.match(validated.errors[0].message, /rule must be one of/);
});

test("the form map catches Du/Sie mixing only in German course directories", () => {
  const { all, configErrors } = lint("form");
  assert.deepEqual(configErrors, []);
  const form = byRule(all, "VOICE-FORM");
  assert.deepEqual(
    form.map((f) => f.relFile).sort(),
    [
      "content/eu-ai-act-kurs/block-1-lessons.json",
      "content/ki-fuehrerschein/block-1-lessons.json",
    ],
  );
  const sieCourse = form.find((f) => f.relFile.startsWith("content/eu-ai-act-kurs/"));
  assert.match(sieCourse.message, /form of address is "sie" \(content\/eu-ai-act-kurs\) but 2 Du-form marker\(s\)/);
  const duCourse = form.find((f) => f.relFile.startsWith("content/ki-fuehrerschein/"));
  assert.match(duCourse.message, /form of address is "du" .* but 2 Sie-form marker\(s\)/);
});

test("sentence-initial Sie is ambiguous and never counts against a Du course", () => {
  const { all } = lint("form");
  const consistent = all.filter(
    (f) => f.relFile === "content/ki-und-gesellschaft/block-1-lessons.json" && f.rule === "VOICE-FORM",
  );
  assert.deepEqual(consistent, []);
});

test("English twins and mixed-locale copy modules are exempt from the form check", () => {
  const files = collectLearnerFacingFiles(path.join(fixtures, "form"));
  assert.ok(files.includes("content/ki-fuehrerschein/en/block-1-lessons.json"));
  assert.ok(files.includes("src/lib/courses/course-hub-copy.ts"));
  assert.equal(classifyLearnerFile("content/ki-fuehrerschein/en/block-1-lessons.json").lang, "en");
  assert.equal(classifyLearnerFile("src/lib/courses/course-hub-copy.ts").lang, "mixed");
  const { all } = lint("form");
  assert.ok(
    all.every(
      (f) =>
        f.rule !== "VOICE-FORM" ||
        (!f.relFile.includes("/en/") && !f.relFile.endsWith("-copy.ts")),
    ),
  );
});

test("file discovery is deterministic and never picks up test fixtures", () => {
  assert.deepEqual(collectLearnerFacingFiles(path.join(fixtures, "german")), [
    GERMAN_MD,
    GERMAN_JSON,
  ]);
  assert.deepEqual(collectLearnerFacingFiles(path.join(fixtures, "english")), [
    ENGLISH_JSON,
    ENGLISH_TS,
  ]);
  const real = collectLearnerFacingFiles(websiteRoot);
  assert.ok(real.length > 100);
  assert.ok(real.every((relFile) => !relFile.includes("__tests__") && !relFile.includes("fixtures")));
  assert.ok(real.every((relFile) => !relFile.endsWith(".test.ts")));
  assert.ok(real.includes("src/lib/workshops.ts"));
  assert.ok(real.includes("content/books/ki-landschaft/en/01_eisberg.md"));
});

test("path classification maps every surface and language", () => {
  const cases = [
    ["content/ki-fuehrerschein/block-1-entdeckung-lessons.json", "content/ki-fuehrerschein", "de"],
    ["content/ki-fuehrerschein/en/quiz/questions.json", "content/ki-fuehrerschein/en", "en"],
    ["content/claude/de/lessons/agents.json", "content/claude", "de"],
    ["content/claude/quiz/questions.json", "content/claude/en", "en"],
    ["content/ai-native-operator/quiz/questions.json", "content/ai-native-operator/en", "en"],
    ["content/books/ki-landschaft/01_eisberg.md", "content/books/ki-landschaft", "de"],
    ["content/books/ki-landschaft/en/01_eisberg.md", "content/books/ki-landschaft/en", "en"],
    ["content/changelog.en.md", "content/changelog/en", "en"],
    ["src/lib/codex/lessons/l01-mental-model.ts", "src/lib/codex", "en"],
    ["src/lib/codex/lessons/de/l01-mental-model.ts", "src/lib/codex/de", "de"],
    ["src/lib/ai-native-operator/modules/de/m01-mindset.ts", "src/lib/ai-native-operator/de", "de"],
    ["src/lib/codex/config.ts", "src/lib/codex", "mixed"],
    ["src/lib/codex/course-copy.ts", "src/lib/codex", "mixed"],
    ["src/lib/workshops.ts", "copy modules", "mixed"],
    ["src/app/login/login-copy.ts", "copy modules", "mixed"],
  ];
  for (const [relFile, surface, lang] of cases) {
    const actual = classifyLearnerFile(relFile);
    assert.equal(actual.surface, surface, relFile);
    assert.equal(actual.lang, lang, relFile);
  }
});

test("the TypeScript literal scanner skips comments, regexes and module specifiers", () => {
  const source = [
    'import x from "./skipped";',
    "// 'not a string' and \"neither\"",
    "/* `nor this` */",
    'const a = "double \\"quoted\\"";',
    "const b = 'single';",
    "const re = /don't \"match\"/g;",
    "const c = `tpl ${a + \"inner\"} end`;",
    'const d = await import("./also-skipped");',
  ].join("\n");
  const literals = extractTsStringLiterals(source);
  assert.deepEqual(
    literals.map((l) => [l.text, l.line, l.template]),
    [
      ['double "quoted"', 4, false],
      ["single", 5, false],
      ["inner", 7, false],
      ["tpl   end", 7, true],
    ],
  );
});
