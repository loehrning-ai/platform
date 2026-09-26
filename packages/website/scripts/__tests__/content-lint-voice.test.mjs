import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { findWorkshopHtmlDashes, runVoiceLint } from "../content-lint.mjs";
import {
  classifyLearnerFile,
  collectLearnerFacingFiles,
  extractHtmlUnits,
  extractTsStringLiterals,
  isLearnerFacingFile,
} from "../content-prose.mjs";
import {
  SHAPE_RULES,
  VOICE_ADVISORY_PHRASES,
  VOICE_PHRASE_RULES,
  VOICE_RULE_IDS,
  VOICE_STRICT_RULES,
  VOICE_TERM_RULES,
  severityFor,
  startsWithCloser,
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
  ["VOICE-AMBIGUOUS", "de-ambiguous-grundsaetzlich"],
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

test("every phrase, term and shape rule is covered by the language fixtures", () => {
  const seen = new Set(
    [...lint("german").all, ...lint("english").all, ...lint("slop-v2").all].map((f) => f.phrase),
  );
  const structural = ["stacked-colons", "fragment-run", "tail-negation-density", "sentence-cv"];
  for (const id of [...VOICE_PHRASE_RULES, ...VOICE_TERM_RULES, ...SHAPE_RULES].map((entry) => entry.id).concat(structural)) {
    assert.ok(seen.has(id), `rule ${id} is not exercised by a fixture`);
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
  for (const rule of ["VOICE-AMBIGUOUS", "VOICE-TERM", "VOICE-PARAGRAPH", "VOICE-CLOSER", "VOICE-LISTS"]) {
    assert.ok(!errorRules.has(rule), `${rule} stays a warning`);
    assert.ok(strict.warnings.some((f) => f.rule === rule && f.relFile === GERMAN_JSON));
  }
  assert.ok(
    strict.warnings.some((f) => f.relFile === GERMAN_MD && f.rule === "VOICE-TRANSITION"),
    "the chapter outside the strict prefix keeps warnings",
  );
  assert.equal(relaxed.all.length, strict.all.length, "scope changes severity, never the set of findings");
});

test("grundsaetzlich is ambiguous, not filler: a warning in and out of strict scope, never an error", () => {
  const word = "grunds\u00e4tzlich";
  assert.ok(VOICE_RULE_IDS.includes("VOICE-AMBIGUOUS"), "the rule id is known to the allowlist");
  assert.ok(!VOICE_STRICT_RULES.has("VOICE-AMBIGUOUS"), "the strict scope never promotes the rule");
  const matching = VOICE_PHRASE_RULES.filter((entry) => entry.pattern.test(word));
  assert.equal(matching.length, 1, "exactly one phrase rule matches the word");
  assert.equal(matching[0].category, "ambiguous", "and it is neither a filler rule nor any other error-producing rule");

  const relaxed = lint("german");
  const hits = byPhrase(relaxed.all, "de-ambiguous-grundsaetzlich");
  assert.deepEqual(
    hits.map((f) => [f.relFile, f.rule]),
    [[GERMAN_MD, "VOICE-AMBIGUOUS"], [GERMAN_JSON, "VOICE-AMBIGUOUS"]],
    "the normative sentence in the chapter and the casual one in the lesson get the same finding",
  );
  assert.ok(relaxed.all.every((f) => !(f.rule === "VOICE-FILLER" && f.message.includes(word))), "no VOICE-FILLER finding names the word");
  for (const hit of hits) {
    assert.match(hit.message, /keep it in a normative sentence/);
    assert.match(hit.message, /cut it in a casual sentence/);
  }

  const strict = lint("german", { strict: ["content/ki-fuehrerschein/", "content/books/testbuch/"] });
  assert.ok(strict.errors.length > 0, "the strict scope is in force for both files");
  assert.equal(byRule(strict.errors, "VOICE-AMBIGUOUS").length, 0, "strict scope does not promote the rule");
  assert.deepEqual(
    byPhrase(strict.warnings, "de-ambiguous-grundsaetzlich").map((f) => f.relFile),
    [GERMAN_MD, GERMAN_JSON],
    "both findings stay warnings",
  );
  assert.equal(severityFor({ rule: "VOICE-AMBIGUOUS", relFile: GERMAN_JSON }, ["content/ki-fuehrerschein/"]), "warn");
  assert.equal(severityFor({ rule: "VOICE-FILLER", relFile: GERMAN_JSON }, ["content/ki-fuehrerschein/"]), "error", "the other filler words keep their strict severity");
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

// ---------------------------------------------------------------------------
// Slop patterns, second pass (fixtures/voice/slop-v2)
// ---------------------------------------------------------------------------

const SLOP_DE = "content/ki-fuehrerschein/block-9-slop-lessons.json";
const SLOP_EN = "content/ki-fuehrerschein/en/block-9-slop-lessons.json";
const SLOP_MD = "content/books/slopbuch/01_kapitel.md";
const SLOP_HTML = "public/workshops/fixture-deck/slides.html";
const SLOP_COPY = "src/lib/fixture-copy.de.ts";

// Each German fixture section trips exactly one finding; the negative
// controls at the end of the lesson trip none.
const SLOP_DE_EXPECTATIONS = [
  ["VOICE-CONTRAST", "de-contrast-kein-das-ist"],
  ["VOICE-CONTRAST", "de-contrast-es-geht-nicht"],
  ["VOICE-CONTRAST", "de-contrast-mehr-als-nur"],
  ["VOICE-COUNT-LESSON", "de-count-nicht-sondern"],
  ["VOICE-COUNT-LESSON", "de-count-kein-sondern"],
  ["VOICE-PUFFERY", "de-puffery-buzz"],
  ["VOICE-PUFFERY", "de-puffery-rolle-spielen"],
  ["VOICE-PUFFERY", "de-puffery-eintauchen"],
  ["VOICE-PUFFERY", "de-puffery-potenzial"],
  ["VOICE-PUFFERY", "de-puffery-reise"],
  ["VOICE-COUNT-LESSON", "de-count-entscheidend"],
  ["VOICE-COUNT-COURSE", "de-count-spannend"],
  ["VOICE-RESIDUE", "de-residue-chat"],
  ["VOICE-RESIDUE", "de-residue-sycophancy"],
  ["VOICE-OPENER", "de-opener-signpost"],
  ["VOICE-HEDGE", "de-hedge-stack"],
  ["VOICE-TRANSITION", "de-transition-adverb"],
  ["VOICE-NOMINAL", "de-nominal-funktionsverb"],
  ["VOICE-COUNT-LESSON", "de-count-amtsdeutsch"],
  ["VOICE-CLAIM", "de-claim-untersuchungen-zeigen"],
  ["VOICE-APHORISM", "de-aphorism"],
  ["VOICE-SHAPE", "de-shape-colon-reveal"],
  ["VOICE-SHAPE", "shape-count-fragment"],
  ["VOICE-SHAPE", "shape-list-colon-opener"],
  ["VOICE-SHAPE", "shape-rhetorical-reveal"],
  ["VOICE-SHAPE", "stacked-colons"],
  ["VOICE-RHYTHM", "fragment-run"],
];

const SLOP_EN_EXPECTATIONS = [
  ["VOICE-CONTRAST", "en-contrast-its-not-its"],
  ["VOICE-CONTRAST", "en-contrast-question-isnt"],
  ["VOICE-CONTRAST", "en-contrast-not-just"],
  ["VOICE-PUFFERY", "en-puffery-vocab"],
  ["VOICE-PUFFERY", "en-puffery-plays-role"],
  ["VOICE-COUNT-LESSON", "en-count-crucial"],
  ["VOICE-PUFFERY", "en-puffery-copula"],
  ["VOICE-RESIDUE", "en-residue-chat"],
  ["VOICE-RESIDUE", "en-residue-sycophancy"],
  ["VOICE-OPENER", "en-opener-signpost"],
  ["VOICE-HEDGE", "en-hedge-stack"],
  ["VOICE-TRANSITION", "en-transition-adverb"],
  ["VOICE-NOMINAL", "en-nominal"],
  ["VOICE-CLAIM", "en-claim-studies-show"],
  ["VOICE-APHORISM", "en-aphorism"],
  ["VOICE-SHAPE", "en-shape-colon-reveal"],
  ["VOICE-SHAPE", "shape-count-fragment"],
];

const pairs = (findings, relFile) =>
  findings
    .filter((f) => f.relFile === relFile)
    .map((f) => [f.rule, f.phrase])
    .sort((a, b) => a.join().localeCompare(b.join()));
const sortedPairs = (expectations) => [...expectations].sort((a, b) => a.join().localeCompare(b.join()));

test("the slop-v2 German lesson trips every new German rule exactly once and no negative control fires", () => {
  const { all, errors, configErrors } = lint("slop-v2");
  assert.deepEqual(configErrors, []);
  assert.deepEqual(errors, [], "nothing is strict, so every finding is a warning");
  assert.deepEqual(pairs(all, SLOP_DE), sortedPairs(SLOP_DE_EXPECTATIONS));
});

test("the slop-v2 English lesson trips every new English rule exactly once and no negative control fires", () => {
  const { all } = lint("slop-v2");
  assert.deepEqual(pairs(all, SLOP_EN), sortedPairs(SLOP_EN_EXPECTATIONS));
});

test("density rules fire on the uniform chapter only: tailing negations and sentence-length variation", () => {
  const { all } = lint("slop-v2");
  assert.deepEqual(pairs(all, SLOP_MD), [
    ["VOICE-RHYTHM", "sentence-cv"],
    ["VOICE-SHAPE", "tail-negation-density"],
  ]);
  const density = byPhrase(all, "tail-negation-density")[0];
  assert.match(density.message, /90 tailing negations/);
  assert.match(byPhrase(all, "sentence-cv")[0].message, /CV 0\.00 across 90 sentences/);
});

test("strict scope promotes contrast, puffery and residue, keeps shape and rhythm advisory, and never promotes public/", () => {
  const relaxed = lint("slop-v2");
  const strict = lint("slop-v2", { strict: ["content/ki-fuehrerschein/", "content/books/slopbuch/", "public/", "src/lib/"] });
  assert.equal(relaxed.all.length, strict.all.length, "scope changes severity, never the set of findings");

  const errorPhrases = new Set(strict.errors.map((f) => f.phrase));
  for (const phrase of [
    "de-contrast-mehr-als-nur",
    "en-contrast-not-just",
    "de-puffery-rolle-spielen",
    "de-puffery-eintauchen",
    "en-puffery-vocab",
    "de-residue-chat",
    "de-residue-sycophancy",
    "en-residue-chat",
    "en-residue-sycophancy",
    "de-opener-signpost",
    "en-hedge-stack",
    "de-transition-adverb",
    "de-claim-untersuchungen-zeigen",
    "de-count-kein-sondern",
  ]) {
    assert.ok(errorPhrases.has(phrase), `${phrase} should be an error in strict scope`);
  }
  for (const rule of ["VOICE-SHAPE", "VOICE-RHYTHM", "VOICE-NOMINAL", "VOICE-APHORISM"]) {
    assert.equal(byRule(strict.errors, rule).length, 0, `${rule} stays a warning`);
    assert.ok(byRule(strict.warnings, rule).length > 0, `${rule} is still reported`);
  }
  for (const phrase of VOICE_ADVISORY_PHRASES) {
    assert.equal(byPhrase(strict.errors, phrase).length, 0, `${phrase} is advisory until its current hits are rewritten`);
  }
  assert.ok(byPhrase(strict.warnings, "de-contrast-kein-das-ist").length === 1);
  const publicFindings = strict.all.filter((f) => f.relFile === SLOP_HTML);
  assert.deepEqual(publicFindings.map((f) => [f.rule, f.phrase]), [["VOICE-RESIDUE", "de-residue-sycophancy"]]);
  assert.equal(strict.errors.filter((f) => f.relFile.startsWith("public/")).length, 0, "workshop materials are never errors");
  assert.equal(severityFor({ rule: "VOICE-RESIDUE", relFile: SLOP_HTML, phrase: "de-residue-sycophancy" }, ["public/"]), "warn");
  assert.equal(severityFor({ rule: "VOICE-RESIDUE", relFile: SLOP_DE, phrase: "de-residue-sycophancy" }, ["content/"]), "error");
  for (const rule of ["VOICE-CONTRAST", "VOICE-PUFFERY", "VOICE-RESIDUE"]) {
    assert.ok(VOICE_STRICT_RULES.has(rule));
  }
  for (const rule of ["VOICE-NOMINAL", "VOICE-APHORISM", "VOICE-SHAPE", "VOICE-RHYTHM"]) {
    assert.ok(VOICE_RULE_IDS.includes(rule), `${rule} is known to the allowlist`);
    assert.ok(!VOICE_STRICT_RULES.has(rule), `${rule} is warning-only`);
  }
});

test("ESRS terms of art never match a puffery, contrast, residue or aphorism rule", () => {
  const terms = [
    "wesentlich",
    "wesentliche Auswirkungen",
    "Wesentlichkeit",
    "doppelte Wesentlichkeit",
    "Wesentlichkeitsanalyse",
    "eine wesentliche Rolle spielt die Lieferkette",
    "material",
    "materiality",
    "double materiality",
    "material impacts, risks and opportunities",
  ];
  const guarded = VOICE_PHRASE_RULES.filter((entry) =>
    ["puffery", "contrast", "residue", "aphorism", "filler", "claim"].includes(entry.category) ||
    entry.id === "de-count-entscheidend",
  );
  for (const term of terms) {
    for (const entry of guarded) {
      assert.ok(!new RegExp(entry.pattern.source, entry.pattern.flags).test(term), `${entry.id} must not match "${term}"`);
    }
  }
  const { all } = lint("slop-v2");
  assert.ok(all.every((f) => !/Wesentlich|materiality/i.test(f.message)));
});

// Positive and negative examples per phrase rule (from the research self-test).
const PHRASE_CASES = {
  "de-contrast-kein-das-ist": [["Das ist kein Tippfehler. Das ist der teuerste Satz."], ["Das ist kein Problem. Du kannst weitermachen."]],
  "de-contrast-es-geht-nicht": [["Es geht nicht um Tempo, sondern um Kontrolle."], ["Es geht nicht ohne Freigabe."]],
  "de-contrast-mehr-als-nur": [["Das ist mehr als nur eine Liste."], ["Das kostet mehr als 100 Euro."]],
  "de-count-nicht-sondern": [["Der Login ist nicht das Ende, sondern der Anfang."], ["Das gilt nicht nur f\u00fcr Teams, sondern auch f\u00fcr Slack."]],
  "de-count-kein-sondern": [["Am Ende steht keine Zusammenfassung, sondern eine Entscheidung."], ["Keine Sorge, das geht."]],
  "en-contrast-its-not-its": [["It's not a tool, it's a mindset."], ["It is not clear whether this is enough."]],
  "en-contrast-question-isnt": [["The question isn't which model. It's which process."], ["The question is not answered in the report."]],
  "en-contrast-not-just": [["It's not just a dashboard.", "More than just a checklist."], ["The inventory is not only a list but also a tool.", "Check the variant, not just the brand."]],
  "de-puffery-buzz": [["Die nahtlose Integration.", "Das Herzst\u00fcck des Kurses."], ["Die Naht h\u00e4lt."]],
  "de-puffery-rolle-spielen": [["Daten spielen eine entscheidende Rolle.", "Eine zentrale Rolle spielt der Mensch."], ["Die Rolle des Betreibers ist definiert.", "Eine wesentliche Rolle spielt die Lieferkette."]],
  "de-puffery-eintauchen": [["Tauchen wir ein.", "Lass uns in die Welt der Agenten eintauchen."], ["Taucht ein nicht freigegebenes Verzeichnis auf, stoppst du."]],
  "de-puffery-potenzial": [["So kannst du dein Potenzial entfalten."], ["Das Potenzial liegt bei 12 Prozent."]],
  "de-puffery-reise": [["Auf deiner KI-Reise."], ["Die Reisekosten steigen."]],
  "de-count-entscheidend": [["Das ist entscheidend."], ["Die Entscheidung f\u00e4llt morgen."]],
  "de-count-spannend": [["Eine spannende Frage."], ["Die Spannung steigt."]],
  "en-puffery-vocab": [["A pivotal moment.", "This underscores the need."], ["The pivot table."]],
  "en-puffery-plays-role": [["Data plays a crucial role."], ["Role play works."]],
  "en-puffery-copula": [["The page serves as a hub."], ["She stands by the door."]],
  "en-count-crucial": [["This is crucial."], ["A crucible."]],
  "en-residue-chat": [["Great question! The answer is 4."], ["The question is great."]],
  "de-residue-chat": [["Gute Frage! Die Antwort ist 4."], ["Eine gute Fragestellung."]],
  "en-residue-sycophancy": [["Don't worry, it's easy."], ["Worry about the data first."]],
  "de-residue-sycophancy": [["Keine Sorge, das ist einfach.", "Kennst du das? Der Bericht ist zu lang."], ["Sorgfalt ist Pflicht."]],
  "en-opener-signpost": [["Here's the thing: it breaks.", "This is where RAG comes in."], ["Here is the file."]],
  "de-opener-signpost": [["Hier kommt RAG ins Spiel.", "Werfen wir einen Blick auf Excel."], ["Die Folgen sind klar."]],
  "en-hedge-stack": [["This may potentially help."], ["This may help."]],
  "de-hedge-stack": [["Das k\u00f6nnte m\u00f6glicherweise helfen."], ["Das kann helfen."]],
  "en-transition-adverb": [["Additionally, it logs."], ["It is additionally logged."]],
  "de-transition-adverb": [["Des Weiteren gilt Artikel 4."], ["Weiteres folgt."]],
  "de-nominal-funktionsverb": [["Die Regel kommt zur Anwendung.", "Die Pr\u00fcfung erfolgt durch das Team."], ["Wende die Regel an."]],
  "de-count-amtsdeutsch": [["Im Rahmen der Pr\u00fcfung."], ["Der Rahmen h\u00e4lt."]],
  "en-nominal": [["We carry out a review.", "In order to start."], ["Order to start."]],
  "en-claim-studies-show": [["Studies show that AI helps."], ["The study shows a 12% gap."]],
  "de-claim-untersuchungen-zeigen": [["Untersuchungen zeigen, dass KI hilft."], ["Die Untersuchung zeigt 12 Prozent."]],
  "en-aphorism": [["The real question is trust.", "The value sits in the process."], ["The question is whether trust holds."]],
  "de-aphorism": [["Die eigentliche Frage ist Vertrauen.", "Daten sind das A und O."], ["Die Frage ist offen."]],
};

const SHAPE_CASES = {
  "de-shape-colon-reveal": [["Das Ergebnis: 40 Prozent.", "Das Herzst\u00fcck: Der Skill liegt im Kit."], ["Ergebnis der Messung sind 40 Prozent.", "Die Regel lautet: Projekte haben eine Frist."]],
  "en-shape-colon-reveal": [["The result: 40 percent.", "In short: Claude continues text."], ["The result of the test was 40 percent."]],
  "shape-count-fragment": [["F\u00fcnf Prompts, ein Analyst.", "One launch, three numbers, and constrained supply:", "Eine Frage, zwei Datenst\u00e4nde, zwei Antworten."], ["F\u00fcnf Prompts reichen f\u00fcr den Bericht.", "Two sites, however, need approval.", "Zwei Entw\u00fcrfe, eine Stoppuhr"]],
  "shape-list-colon-opener": [["Memos, Briefe, Vorlagen: jeden Tag dieselbe Arbeit.", "Recherche, Synthese, Kritik, Redaktion: vier Schritte."], ["Titel und Problem: bitte ausf\u00fcllen."]],
  "shape-rhetorical-reveal": [["Das Ergebnis?", "Why?"], ["Warum steigt der Wert?"]],
};

test("each new phrase and shape rule matches its examples and none of its counter-examples", () => {
  const byId = new Map(VOICE_PHRASE_RULES.map((entry) => [entry.id, entry]));
  for (const [id, [positives, negatives]] of Object.entries(PHRASE_CASES)) {
    const entry = byId.get(id);
    assert.ok(entry, `${id} exists`);
    const pattern = () => new RegExp(entry.pattern.source, entry.pattern.flags);
    for (const text of positives) assert.ok(pattern().test(text), `${id} should match "${text}"`);
    for (const text of negatives) assert.ok(!pattern().test(text), `${id} must not match "${text}"`);
  }
  for (const rule of SHAPE_RULES) {
    const [positives, negatives] = SHAPE_CASES[rule.id];
    for (const text of positives) assert.ok(rule.test.test(text), `${rule.id} should match "${text}"`);
    for (const text of negatives) assert.ok(!rule.test.test(text), `${rule.id} must not match "${text}"`);
  }
});

test("new closer markers end a lesson on a restating summary", () => {
  for (const text of ["Unterm Strich sparst du Zeit.", "Das Wichtigste in K\u00fcrze", "Alles in allem passt es.", "Overall, it works.", "The bottom line is clear.", "## All in all"]) {
    assert.ok(startsWithCloser(text), text);
  }
  assert.ok(!startsWithCloser("Das Wichtigste steht in Spalte B."));
});

test("workshop HTML is read through its visible prose; dashes there are warnings with placeholders exempt", () => {
  const raw = [
    "<p>Eins \u2014 zwei drei.</p>",
    "<script>const x = \"Keine Sorge\";</script>",
    "<td>\u2014</td>",
    "<li>Ein <em>Wort</em>, dann <strong>zwei</strong>.</li>",
    "<p>Zeile<br>neu &amp; fertig&nbsp;jetzt.</p>",
  ].join("\n");
  const [lesson] = extractHtmlUnits(raw);
  assert.deepEqual(
    lesson.segments.map((s) => [s.text, s.line]),
    [
      ["Eins \u2014 zwei drei.", 1],
      ["Ein Wort, dann zwei.", 4],
      ["Zeile neu & fertig jetzt.", 5],
    ],
  );
  assert.deepEqual(findWorkshopHtmlDashes(path.join(fixtures, "slop-v2")), [
    { relFile: SLOP_HTML, line: 11, rule: "EM-DASH" },
    { relFile: SLOP_HTML, line: 15, rule: "EN-DASH" },
  ], "prose em dash and a month range fire; the attribute, the placeholder cells, the digit range, the style, the script and the comment do not");
});

test("discovery covers workshop HTML, locale copy modules and the workshop registry modules", () => {
  assert.deepEqual(collectLearnerFacingFiles(path.join(fixtures, "slop-v2")), [
    SLOP_MD,
    SLOP_DE,
    SLOP_EN,
    SLOP_HTML,
    SLOP_COPY,
    "src/lib/workshops-data-readiness.ts",
    "src/lib/workshops-esg-reporting.ts",
  ]);
  assert.deepEqual(classifyLearnerFile(SLOP_HTML), { kind: "html", lang: "mixed", surface: "public/workshops/fixture-deck" });
  assert.equal(classifyLearnerFile("src/app/hilfe/eigene-ki/eigene-ki-copy.de.ts").surface, "copy modules");
  assert.ok(isLearnerFacingFile("public/workshops/ki-prognosen-einschaetzen/case-study/index.html"));
  assert.ok(!isLearnerFacingFile("public/workshops/datenbereitschaft-fuer-ki/lib/deck-runtime.js"), "scripts stay out of scope");
  assert.ok(!isLearnerFacingFile("public/index.html"), "only workshop materials are read under public/");
  const real = collectLearnerFacingFiles(websiteRoot);
  assert.ok(real.includes("src/lib/workshops-data-readiness.ts"));
  assert.ok(real.includes("public/workshops/datenbereitschaft-fuer-ki/slides.html"));
  assert.ok(real.includes("src/app/hilfe/eigene-ki/eigene-ki-copy.de.ts"));
});
