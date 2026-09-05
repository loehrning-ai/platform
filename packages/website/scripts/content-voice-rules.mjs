/**
 * content-voice-rules.mjs
 *
 * Voice rules for learner-facing prose in both languages, shared by
 * content-lint.mjs (findings) and content-voice-report.mjs (metrics).
 *
 * Rule ids reported by the lint:
 *   VOICE-OPENER        throat-clearing openers
 *   VOICE-FILLER        filler words and hype adjectives
 *   VOICE-HEDGE         hedging frames
 *   VOICE-TRANSITION    connective crutches and back-references
 *   VOICE-CLAIM         unverifiable authority or sales framing
 *   VOICE-COUNT-COURSE  a phrase allowed once per course, used again
 *   VOICE-COUNT-LESSON  a phrase over its per-lesson budget
 *   VOICE-FORM          Du/Sie mixed against the course's form of address
 *   VOICE-TERM          completion terminology (warning only for now)
 *   VOICE-PARAGRAPH     paragraph with more than five sentences (warning)
 *   VOICE-CLOSER        trailing paragraph or heading that restates (warning)
 *   VOICE-LISTS         more than 60 percent of a file's lists have three items (warning)
 *   VOICE-CONFIG        an invalid scope, allowlist or form-map file (error)
 *
 * Phrase patterns are spelled with \u escapes so this module stays ASCII-only.
 * Every rule applies to every learner-facing file regardless of language; the
 * phrases are language-specific strings, so a German pattern never fires on
 * English prose and vice versa. The form check runs on German files only.
 */

import { existsSync, readFileSync } from "node:fs";

import {
  blankOutCodeFences,
  countWords,
  isProseSegment,
  splitParagraphs,
  splitSentences,
} from "./content-prose.mjs";

// ---------------------------------------------------------------------------
// Pattern helpers
// ---------------------------------------------------------------------------

const LETTER_OR_DIGIT = "\\p{L}\\p{N}_";

/** Word-bounded, Unicode-aware pattern (JS `\b` is ASCII-only). */
export function wordPattern(source, flags = "") {
  return new RegExp(
    `(?<![${LETTER_OR_DIGIT}])(?:${source})(?![${LETTER_OR_DIGIT}])`,
    flags.includes("u") ? flags : `${flags}u`,
  );
}

function globalPattern(pattern) {
  return new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );
}

const CLAUSE = "[^.!?\\n]{0,120}?";

// ---------------------------------------------------------------------------
// Rule tables
// ---------------------------------------------------------------------------

export const VOICE_RULE_IDS = [
  "VOICE-OPENER",
  "VOICE-FILLER",
  "VOICE-HEDGE",
  "VOICE-TRANSITION",
  "VOICE-CLAIM",
  "VOICE-COUNT-COURSE",
  "VOICE-COUNT-LESSON",
  "VOICE-FORM",
  "VOICE-TERM",
  "VOICE-PARAGRAPH",
  "VOICE-CLOSER",
  "VOICE-LISTS",
];

/** Rules that become errors inside the strict voice scope. */
export const VOICE_STRICT_RULES = new Set([
  "VOICE-OPENER",
  "VOICE-FILLER",
  "VOICE-HEDGE",
  "VOICE-TRANSITION",
  "VOICE-CLAIM",
  "VOICE-COUNT-COURSE",
  "VOICE-COUNT-LESSON",
  "VOICE-FORM",
]);

const CATEGORY_RULE = {
  opener: "VOICE-OPENER",
  filler: "VOICE-FILLER",
  hedge: "VOICE-HEDGE",
  transition: "VOICE-TRANSITION",
  claim: "VOICE-CLAIM",
};

/**
 * Phrase rules. `perLesson` / `perCourse` turn an entry into a budget: only
 * occurrences beyond the budget are reported (VOICE-COUNT-LESSON /
 * VOICE-COUNT-COURSE). Entries without a budget report every occurrence under
 * their category's rule id.
 */
export const VOICE_PHRASE_RULES = [
  // German openers
  {
    id: "de-opener-heutige-zeit",
    lang: "de",
    category: "opener",
    label: "In der heutigen Zeit",
    pattern: wordPattern("In der heutigen Zeit", "i"),
  },
  {
    id: "de-opener-zunehmend-digitalisiert",
    lang: "de",
    category: "opener",
    label: "In einer zunehmend digitalisierten",
    pattern: wordPattern("In einer zunehmend digitalisierten", "i"),
  },
  {
    id: "de-opener-in-diesem-kapitel",
    lang: "de",
    category: "opener",
    label: "In diesem Kapitel / Modul / dieser Lektion lernst du",
    pattern: wordPattern(
      `In (?:diesem (?:Kapitel|Modul|Abschnitt)|dieser (?:Lektion|Einheit))${CLAUSE}(?:lernst du|lernen Sie|lernt ihr|erf\u00e4hrst du|erfahren Sie)`,
      "i",
    ),
  },
  // German filler
  {
    id: "de-filler-ganzheitlich",
    lang: "de",
    category: "filler",
    label: "ganzheitlich",
    pattern: wordPattern("ganzheitlich(?:e[nmrs]?)?", "i"),
  },
  {
    id: "de-filler-umfassend",
    lang: "de",
    category: "filler",
    label: "umfassend",
    pattern: wordPattern("umfassend(?:e[nmrs]?)?", "i"),
  },
  {
    id: "de-filler-grundlegend",
    lang: "de",
    category: "filler",
    label: "grundlegend",
    pattern: wordPattern("grundlegend(?:e[nmrs]?)?", "i"),
  },
  {
    id: "de-filler-eigentlich",
    lang: "de",
    category: "filler",
    label: "eigentlich",
    pattern: wordPattern("eigentlich", "i"),
  },
  {
    id: "de-filler-im-prinzip",
    lang: "de",
    category: "filler",
    label: "im Prinzip",
    pattern: wordPattern("im Prinzip", "i"),
  },
  {
    id: "de-filler-grundsaetzlich",
    lang: "de",
    category: "filler",
    label: "grunds\u00e4tzlich",
    pattern: wordPattern("grunds\u00e4tzlich(?:e[nmrs]?)?", "i"),
  },
  {
    id: "de-filler-quasi",
    lang: "de",
    category: "filler",
    label: "quasi",
    pattern: wordPattern("quasi", "i"),
  },
  {
    id: "de-filler-sozusagen",
    lang: "de",
    category: "filler",
    label: "sozusagen",
    pattern: wordPattern("sozusagen", "i"),
  },
  {
    id: "de-filler-halt",
    lang: "de",
    category: "filler",
    label: "halt (particle)",
    // Lower-case only: "Halt" the noun and the imperative stay allowed.
    pattern: wordPattern("halt"),
  },
  // German hedges
  {
    id: "de-hedge-wichtig-zu-betonen",
    lang: "de",
    category: "hedge",
    label: "Es ist wichtig zu betonen",
    pattern: wordPattern("Es ist wichtig,? zu betonen", "i"),
  },
  {
    id: "de-hedge-sei-darauf-hingewiesen",
    lang: "de",
    category: "hedge",
    label: "Es sei darauf hingewiesen",
    pattern: wordPattern("Es sei darauf hingewiesen", "i"),
  },
  {
    id: "de-hedge-anzumerken",
    lang: "de",
    category: "hedge",
    label: "Es ist anzumerken",
    pattern: wordPattern("Es ist anzumerken", "i"),
  },
  {
    id: "de-hedge-moeglicherweise",
    lang: "de",
    category: "hedge",
    label: "m\u00f6glicherweise",
    pattern: wordPattern("m\u00f6glicherweise", "i"),
    perLesson: 1,
  },
  // German transitions
  {
    id: "de-transition-darueber-hinaus",
    lang: "de",
    category: "transition",
    label: "Dar\u00fcber hinaus",
    pattern: wordPattern("Dar\u00fcber hinaus", "i"),
  },
  {
    id: "de-transition-zusammenfassend",
    lang: "de",
    category: "transition",
    label: "Zusammenfassend l\u00e4sst sich sagen",
    pattern: wordPattern(
      "Zusammenfassend l\u00e4sst sich (?:sagen|festhalten)",
      "i",
    ),
  },
  {
    id: "de-transition-blick-werfen",
    lang: "de",
    category: "transition",
    label: "Lass(en Sie) uns einen Blick werfen",
    pattern: wordPattern("Lass(?:t|en Sie)? uns einen Blick", "i"),
  },
  {
    id: "de-transition-wie-bereits-erwaehnt",
    lang: "de",
    category: "transition",
    label: "wie bereits erw\u00e4hnt",
    pattern: wordPattern("wie (?:bereits|schon) erw\u00e4hnt", "i"),
  },
  {
    id: "de-transition-wie-oben-erwaehnt",
    lang: "de",
    category: "transition",
    label: "wie oben erw\u00e4hnt",
    pattern: wordPattern("wie oben erw\u00e4hnt", "i"),
  },
  {
    id: "de-transition-wie-du-weisst",
    lang: "de",
    category: "transition",
    label: "wie du bereits wei\u00dft",
    pattern: wordPattern(
      "wie (?:du|Sie|ihr) (?:bereits|schon) (?:wei\u00dft|wissen|wisst)",
      "i",
    ),
  },
  // German claims
  {
    id: "de-claim-experten-einig",
    lang: "de",
    category: "claim",
    label: "Experten sind sich einig",
    pattern: wordPattern("Expert(?:en|innen) sind sich einig", "i"),
  },
  {
    // Shared with English: "disruptive" and the German inflections. The bare
    // "disruptiv" is already a BANNED-PHRASE error, so the "e" is required
    // here and nothing reports twice.
    id: "claim-disruptive",
    lang: "both",
    category: "claim",
    label: "disruptive",
    pattern: wordPattern("disruptive[nmrs]?", "i"),
  },
  {
    id: "de-claim-standortbestimmung",
    lang: "de",
    category: "claim",
    label: "Standortbestimmung",
    pattern: wordPattern("Standortbestimmung(?:en)?"),
  },
  {
    id: "de-claim-schulungsnachweis",
    lang: "de",
    category: "claim",
    label: "Schulungsnachweis",
    pattern: wordPattern("Schulungsnachweis(?:e|es|en)?"),
  },
  {
    id: "de-claim-compliance-nachweis",
    lang: "de",
    category: "claim",
    label: "Compliance-Nachweis",
    pattern: wordPattern("Compliance-Nachweis(?:e|es|en)?"),
  },
  // German counters
  {
    id: "de-count-stell-dir-vor",
    lang: "de",
    category: "counter",
    label: "Stell dir vor / Stellen Sie sich vor",
    pattern: wordPattern(
      "Stell(?:e)? dir vor|Stellen Sie sich vor|Stellt euch vor",
      "i",
    ),
    perCourse: 1,
  },
  {
    id: "de-count-sowohl-als-auch",
    lang: "de",
    category: "counter",
    label: "sowohl ... als auch",
    pattern: wordPattern(`sowohl${CLAUSE}als auch`, "i"),
    perLesson: 1,
  },
  {
    id: "de-count-nicht-nur-sondern-auch",
    lang: "de",
    category: "counter",
    label: "nicht nur ... sondern auch",
    pattern: wordPattern(`nicht nur${CLAUSE}sondern auch`, "i"),
    perLesson: 1,
  },
  // English openers
  {
    id: "en-opener-in-todays",
    lang: "en",
    category: "opener",
    label: "In today's",
    pattern: wordPattern("In today['\u2019]s", "i"),
  },
  {
    id: "en-opener-in-an-increasingly",
    lang: "en",
    category: "opener",
    label: "In an increasingly",
    pattern: wordPattern("In an increasingly", "i"),
  },
  {
    id: "en-opener-in-this-lesson",
    lang: "en",
    category: "opener",
    label: "In this lesson you will learn",
    pattern: wordPattern(
      `In this (?:lesson|module|chapter|section)${CLAUSE}you(?:['\u2019]ll| will) learn`,
      "i",
    ),
  },
  {
    id: "en-opener-whether-you-are",
    lang: "en",
    category: "opener",
    label: "Whether you are a ... or a ...",
    pattern: wordPattern(
      "Whether you(?:['\u2019]re| are) an? [^.!?\\n]{0,80}? or an?",
      "i",
    ),
  },
  {
    id: "en-opener-lets-dive-in",
    lang: "en",
    category: "opener",
    label: "Let's dive in",
    pattern: wordPattern("Let['\u2019]?s dive (?:in|into|right in)", "i"),
  },
  {
    id: "en-opener-lets-explore",
    lang: "en",
    category: "opener",
    label: "Let's explore",
    pattern: wordPattern("Let['\u2019]?s explore", "i"),
  },
  // English filler
  {
    id: "en-filler-delve",
    lang: "en",
    category: "filler",
    label: "delve",
    pattern: wordPattern("delv(?:e|es|ed|ing)", "i"),
  },
  {
    id: "en-filler-robust",
    lang: "en",
    category: "filler",
    label: "robust",
    pattern: wordPattern("robust(?:ly|ness)?", "i"),
    perLesson: 1,
  },
  {
    id: "en-filler-comprehensive",
    lang: "en",
    category: "filler",
    label: "comprehensive",
    pattern: wordPattern("comprehensive(?:ly)?", "i"),
  },
  {
    id: "en-filler-holistic",
    lang: "en",
    category: "filler",
    label: "holistic",
    pattern: wordPattern("holistic(?:ally)?", "i"),
  },
  {
    id: "en-filler-seamless",
    lang: "en",
    category: "filler",
    label: "seamless",
    pattern: wordPattern("seamless(?:ly)?", "i"),
  },
  {
    id: "en-filler-cutting-edge",
    lang: "en",
    category: "filler",
    label: "cutting-edge",
    pattern: wordPattern("cutting[- ]edge", "i"),
  },
  {
    id: "en-filler-best-in-class",
    lang: "en",
    category: "filler",
    label: "best-in-class",
    pattern: wordPattern("best[- ]in[- ]class", "i"),
  },
  {
    id: "en-filler-game-changer",
    lang: "en",
    category: "filler",
    label: "game-changer",
    pattern: wordPattern("game[- ]?chang(?:er|ers|ing)", "i"),
  },
  {
    id: "en-filler-landscape",
    lang: "en",
    category: "filler",
    label: "landscape (figurative)",
    pattern: wordPattern("landscapes?", "i"),
    perLesson: 1,
  },
  // English hedges
  {
    id: "en-hedge-important-to-note",
    lang: "en",
    category: "hedge",
    label: "It is important to note",
    pattern: wordPattern("It is important to note", "i"),
  },
  {
    id: "en-hedge-worth-noting",
    lang: "en",
    category: "hedge",
    label: "It's worth noting",
    pattern: wordPattern("It['\u2019]?s worth noting", "i"),
  },
  {
    id: "en-hedge-should-be-noted",
    lang: "en",
    category: "hedge",
    label: "It should be noted",
    pattern: wordPattern("It should be noted", "i"),
  },
  // English transitions
  {
    id: "en-transition-furthermore",
    lang: "en",
    category: "transition",
    label: "Furthermore",
    pattern: wordPattern("Furthermore", "i"),
  },
  {
    id: "en-transition-moreover",
    lang: "en",
    category: "transition",
    label: "Moreover",
    pattern: wordPattern("Moreover", "i"),
  },
  {
    id: "en-transition-in-conclusion",
    lang: "en",
    category: "transition",
    label: "In conclusion",
    pattern: wordPattern("In conclusion", "i"),
  },
  {
    id: "en-transition-to-sum-up",
    lang: "en",
    category: "transition",
    label: "To sum up",
    pattern: wordPattern("To sum up", "i"),
  },
  {
    id: "en-transition-as-mentioned-above",
    lang: "en",
    category: "transition",
    label: "As mentioned above",
    pattern: wordPattern("As mentioned (?:above|earlier|before)", "i"),
  },
  {
    id: "en-transition-as-you-already-know",
    lang: "en",
    category: "transition",
    label: "As you already know",
    pattern: wordPattern("As you already know", "i"),
  },
  // English claims
  {
    id: "en-claim-experts-agree",
    lang: "en",
    category: "claim",
    label: "Experts agree",
    pattern: wordPattern("Experts agree", "i"),
  },
  {
    id: "en-claim-leverage",
    lang: "en",
    category: "claim",
    label: "leverage (verb)",
    pattern: wordPattern("leverag(?:e|es|ed|ing)", "i"),
  },
  {
    id: "en-claim-empower",
    lang: "en",
    category: "claim",
    label: "empower",
    pattern: wordPattern("empower(?:s|ed|ing|ment)?", "i"),
  },
  {
    id: "en-claim-unlock-potential",
    lang: "en",
    category: "claim",
    label: "unlock the potential",
    pattern: wordPattern(
      "unlock(?:s|ed|ing)? (?:the |your |its |their )?(?:full )?potential",
      "i",
    ),
  },
  {
    id: "en-claim-synergy",
    lang: "en",
    category: "claim",
    label: "synergy",
    pattern: wordPattern("synerg(?:y|ies|istic|ize|izes)", "i"),
  },
  // English counters
  {
    id: "en-count-imagine",
    lang: "en",
    category: "counter",
    label: "Imagine",
    // Sentence-initial only: "you can imagine" is not the opener tell.
    pattern: wordPattern("Imagine"),
    perCourse: 1,
  },
  {
    id: "en-count-not-only-but-also",
    lang: "en",
    category: "counter",
    label: "not only ... but also",
    pattern: wordPattern(`not only${CLAUSE}but also`, "i"),
    perLesson: 1,
  },
  {
    id: "en-count-both-and",
    lang: "en",
    category: "counter",
    label: "both ... and",
    pattern: wordPattern("both [^.!?\\n]{0,80}? and", "i"),
    perLesson: 2,
  },
];

/**
 * Completion terminology. Reported as VOICE-TERM (a warning everywhere until
 * the terminology sweep finishes). URL segments and identifiers stay quiet:
 * the German terms are case-sensitive so `/zertifikat` never matches, and the
 * English term skips "certificate of participation" and infrastructure
 * certificates.
 */
export const VOICE_TERM_RULES = [
  {
    id: "de-term-zertifikat",
    lang: "de",
    label: "Zertifikat (use Teilnahmebest\u00e4tigung)",
    pattern: wordPattern("Zertifikat(?:e|es|en|s)?"),
  },
  {
    id: "de-term-lernnachweis",
    lang: "de",
    label: "Lernnachweis (use Teilnahmebest\u00e4tigung)",
    pattern: wordPattern("Lernnachweis(?:e|es|en)?"),
  },
  {
    id: "en-term-certificate",
    lang: "en",
    label: "certificate (use certificate of participation)",
    pattern: wordPattern(
      "(?<!(?:TLS|SSL|X\\.509|root|client|server|digital|signing|CA|participation) )certificates?(?! of participation)",
      "i",
    ),
  },
];

/** Connectors counted by the voice report (overuse indicator). */
export const CONNECTOR_RULES = [
  { id: "sowohl-als-auch", lang: "de", pattern: wordPattern(`sowohl${CLAUSE}als auch`, "i") },
  { id: "nicht-nur-sondern-auch", lang: "de", pattern: wordPattern(`nicht nur${CLAUSE}sondern auch`, "i") },
  { id: "darueber-hinaus", lang: "de", pattern: wordPattern("dar\u00fcber hinaus", "i") },
  { id: "zudem", lang: "de", pattern: wordPattern("zudem", "i") },
  { id: "ausserdem", lang: "de", pattern: wordPattern("au\u00dferdem", "i") },
  { id: "des-weiteren", lang: "de", pattern: wordPattern("des Weiteren", "i") },
  { id: "zusammenfassend", lang: "de", pattern: wordPattern("zusammenfassend", "i") },
  { id: "not-only-but-also", lang: "en", pattern: wordPattern(`not only${CLAUSE}but also`, "i") },
  { id: "both-and", lang: "en", pattern: wordPattern("both [^.!?\\n]{0,80}? and", "i") },
  { id: "furthermore", lang: "en", pattern: wordPattern("furthermore", "i") },
  { id: "moreover", lang: "en", pattern: wordPattern("moreover", "i") },
  { id: "additionally", lang: "en", pattern: wordPattern("additionally", "i") },
  { id: "in-addition", lang: "en", pattern: wordPattern("in addition", "i") },
  { id: "in-conclusion", lang: "en", pattern: wordPattern("in conclusion", "i") },
  { id: "however", lang: "en", pattern: wordPattern("however", "i") },
];

const CLOSER_MARKER = wordPattern(
  "Zusammenfassung|Fazit|Kurz gesagt|In conclusion|To sum up",
  "i",
);

/** True when a paragraph or heading opens with a restating marker. */
export function startsWithCloser(blockText) {
  const stripped = blockText
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/^[\s*_>"\u201e\u201c]+/, "")
    .trim();
  const match = CLOSER_MARKER.exec(stripped);
  return match !== null && match.index === 0;
}

// ---------------------------------------------------------------------------
// Form of address
// ---------------------------------------------------------------------------

const DU_FORM = wordPattern(
  "du|dich|dir|dein|deine|deinem|deinen|deiner|deines|euch|euer|eure|eurem|euren|eurer",
  "gi",
);
const SIE_FORM = wordPattern("Sie|Ihnen|Ihr|Ihre|Ihrem|Ihren|Ihrer|Ihres", "g");
const SENTENCE_START_BEFORE = /(?:^|[.!?:\n]|^\s*(?:[-*+]|\d+[.)]))[\s"'(\u201e\u201c\u2018\u2019*_>-]*$/;

/**
 * Finds Du-form and Sie-form markers. A capitalised Sie/Ihr word counts only
 * inside a sentence; at a sentence start it is ambiguous with "sie" (they)
 * and "ihr" (her/their/you plural) and is ignored.
 */
export function findFormMarkers(text) {
  const markers = [];
  for (const match of text.matchAll(globalPattern(DU_FORM))) {
    markers.push({ form: "du", index: match.index, word: match[0] });
  }
  for (const match of text.matchAll(globalPattern(SIE_FORM))) {
    const before = text.slice(Math.max(0, match.index - 40), match.index);
    if (SENTENCE_START_BEFORE.test(before)) continue;
    markers.push({ form: "sie", index: match.index, word: match[0] });
  }
  return markers.sort((a, b) => a.index - b.index);
}

// ---------------------------------------------------------------------------
// Configuration: strict scope, allowlist, form map
// ---------------------------------------------------------------------------

const FORMS = new Set(["du", "sie"]);

function isRelativePosixPath(value) {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.split("/").includes("..")
  );
}

function readJsonFile(path, errors, label) {
  if (!existsSync(path)) {
    errors.push({ file: label, message: `${label} is missing` });
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (cause) {
    errors.push({ file: label, message: `${label} is not valid JSON: ${cause.message}` });
    return null;
  }
}

/** Validates in-memory config objects; returns { strict, allowlist, formMap, errors }. */
export function validateVoiceConfig({ scope, allowlist, formMap }, labels = {}) {
  const errors = [];
  const scopeLabel = labels.scope ?? "content-lint.voice-scope.json";
  const allowLabel = labels.allowlist ?? "content-lint.allowlist.json";
  const formLabel = labels.formMap ?? "content-lint.form-map.json";

  const strict = [];
  if (scope !== null) {
    if (!scope || typeof scope !== "object" || !Array.isArray(scope.strict)) {
      errors.push({ file: scopeLabel, message: "expected { \"strict\": [paths] }" });
    } else {
      scope.strict.forEach((entry, index) => {
        if (!isRelativePosixPath(entry)) {
          errors.push({ file: scopeLabel, message: `strict[${index}] must be a relative posix path` });
        } else {
          strict.push(entry);
        }
      });
    }
  }

  const entries = [];
  if (allowlist !== null) {
    if (!allowlist || typeof allowlist !== "object" || !Array.isArray(allowlist.entries)) {
      errors.push({ file: allowLabel, message: "expected { \"entries\": [{ file, rule, reason }] }" });
    } else {
      allowlist.entries.forEach((entry, index) => {
        const where = `entries[${index}]`;
        if (!entry || typeof entry !== "object") {
          errors.push({ file: allowLabel, message: `${where} must be an object` });
          return;
        }
        const problems = [];
        if (!isRelativePosixPath(entry.file)) problems.push("file must be a relative posix path");
        if (!VOICE_RULE_IDS.includes(entry.rule)) problems.push(`rule must be one of ${VOICE_RULE_IDS.join(", ")}`);
        if (typeof entry.reason !== "string" || entry.reason.trim() === "") problems.push("reason is mandatory and must be a non-empty string");
        if (entry.phrase !== undefined && (typeof entry.phrase !== "string" || entry.phrase.trim() === "")) problems.push("phrase must be a non-empty string when present");
        if (problems.length > 0) {
          errors.push({ file: allowLabel, message: `${where} (${entry.file ?? "?"}, ${entry.rule ?? "?"}): ${problems.join("; ")}` });
          return;
        }
        entries.push({ file: entry.file, rule: entry.rule, phrase: entry.phrase, reason: entry.reason.trim() });
      });
    }
  }

  const courses = {};
  let defaultForm = null;
  if (formMap !== null) {
    if (!formMap || typeof formMap !== "object") {
      errors.push({ file: formLabel, message: "expected { \"default\": \"du\" | \"sie\", \"courses\": {} }" });
    } else {
      if (formMap.default !== undefined) {
        if (FORMS.has(formMap.default)) defaultForm = formMap.default;
        else errors.push({ file: formLabel, message: "default must be \"du\" or \"sie\"" });
      }
      const map = formMap.courses ?? {};
      if (!map || typeof map !== "object" || Array.isArray(map)) {
        errors.push({ file: formLabel, message: "courses must be an object of directory -> form" });
      } else {
        for (const [dir, form] of Object.entries(map)) {
          if (!isRelativePosixPath(dir)) errors.push({ file: formLabel, message: `courses key "${dir}" must be a relative posix path` });
          else if (!FORMS.has(form)) errors.push({ file: formLabel, message: `courses["${dir}"] must be "du" or "sie"` });
          else courses[dir.replace(/\/$/, "")] = form;
        }
      }
    }
  }

  return { strict, allowlist: entries, formMap: { default: defaultForm, courses }, errors };
}

/** Loads and validates the three config files. Missing files are errors. */
export function loadVoiceConfig({ scopePath, allowlistPath, formMapPath }) {
  const errors = [];
  const scope = readJsonFile(scopePath, errors, "content-lint.voice-scope.json");
  const allowlist = readJsonFile(allowlistPath, errors, "content-lint.allowlist.json");
  const formMap = readJsonFile(formMapPath, errors, "content-lint.form-map.json");
  const validated = validateVoiceConfig({ scope, allowlist, formMap });
  return { ...validated, errors: [...errors, ...validated.errors] };
}

function pathMatches(relFile, entry) {
  if (entry.endsWith("/")) return relFile.startsWith(entry);
  return relFile === entry || relFile.startsWith(`${entry}/`);
}

export function isStrictFile(relFile, strict) {
  return strict.some((entry) => pathMatches(relFile, entry));
}

/** Longest-prefix lookup of a German file's course form; null when unmapped. */
export function resolveCourseForm(relFile, formMap) {
  let best = null;
  for (const [dir, form] of Object.entries(formMap.courses)) {
    if (pathMatches(relFile, dir) && (best === null || dir.length > best.dir.length)) {
      best = { dir, form };
    }
  }
  if (best) return { form: best.form, source: best.dir };
  if (formMap.default) return { form: formMap.default, source: "default" };
  return null;
}

// ---------------------------------------------------------------------------
// Analysis: units -> findings
// ---------------------------------------------------------------------------

function segmentLine(segment, offset) {
  if (!segment.physical) return segment.line;
  let line = segment.line;
  for (let i = 0; i < offset && i < segment.text.length; i++) {
    if (segment.text[i] === "\n") line++;
  }
  return line;
}

function blockLine(segment, block) {
  return segment.physical ? segment.line + block.lineIndex : segment.line;
}

function ruleIdFor(entry) {
  if (entry.perCourse) return "VOICE-COUNT-COURSE";
  if (entry.perLesson) return "VOICE-COUNT-LESSON";
  return CATEGORY_RULE[entry.category];
}

function collectMatches(unit) {
  const perLesson = [];
  for (const lesson of unit.lessons) {
    const matches = [];
    lesson.segments.forEach((segment, segmentIndex) => {
      const text = blankOutCodeFences(segment.text);
      for (const entry of VOICE_PHRASE_RULES) {
        for (const match of text.matchAll(globalPattern(entry.pattern))) {
          matches.push({
            entry,
            segmentIndex,
            index: match.index,
            line: segmentLine(segment, match.index),
            text: match[0],
          });
        }
      }
    });
    matches.sort((a, b) => a.segmentIndex - b.segmentIndex || a.index - b.index);
    perLesson.push({ lesson, matches });
  }
  return perLesson;
}

function finding(unit, line, rule, phrase, message) {
  return { relFile: unit.relFile, line, rule, phrase, message, surface: unit.surface };
}

/**
 * Analyses prose units (see content-prose.mjs) and returns findings sorted by
 * file and line. Units must be sorted by relFile so the first allowed use of
 * a per-course phrase is deterministic.
 */
export function analyzeVoice(units, { formMap }) {
  const findings = [];
  const courseCounters = new Map();

  for (const unit of units) {
    for (const { lesson, matches } of collectMatches(unit)) {
      const lessonCounters = new Map();
      for (const match of matches) {
        const { entry } = match;
        const rule = ruleIdFor(entry);
        if (entry.perCourse) {
          const key = `${unit.surface}|${entry.id}`;
          const seen = (courseCounters.get(key) ?? 0) + 1;
          courseCounters.set(key, seen);
          if (seen > entry.perCourse) {
            findings.push(finding(unit, match.line, rule, entry.id, `"${entry.label}" used ${seen} times in ${unit.surface}; allowed ${entry.perCourse} per course`));
          }
        } else if (entry.perLesson) {
          const seen = (lessonCounters.get(entry.id) ?? 0) + 1;
          lessonCounters.set(entry.id, seen);
          if (seen > entry.perLesson) {
            findings.push(finding(unit, match.line, rule, entry.id, `"${entry.label}" used ${seen} times in lesson ${lesson.id}; allowed ${entry.perLesson} per lesson`));
          }
        } else {
          findings.push(finding(unit, match.line, rule, entry.id, `"${match.text}" (${entry.category}: ${entry.label})`));
        }
      }
    }

    analyzeTerms(unit, findings);
    analyzeStructure(unit, findings);
    analyzeForm(unit, formMap, findings);
  }

  return findings.sort(
    (a, b) => a.relFile.localeCompare(b.relFile) || a.line - b.line || a.rule.localeCompare(b.rule),
  );
}

function analyzeTerms(unit, findings) {
  for (const lesson of unit.lessons) {
    for (const segment of lesson.segments) {
      const text = blankOutCodeFences(segment.text);
      for (const entry of VOICE_TERM_RULES) {
        for (const match of text.matchAll(globalPattern(entry.pattern))) {
          findings.push(finding(unit, segmentLine(segment, match.index), "VOICE-TERM", entry.id, `"${match[0]}" (${entry.label})`));
        }
      }
    }
  }
}

export const PARAGRAPH_SENTENCE_LIMIT = 5;
export const THREE_ITEM_LIST_SHARE_LIMIT = 0.6;
export const THREE_ITEM_LIST_MINIMUM = 3;

function analyzeStructure(unit, findings) {
  let lists = 0;
  let threeItemLists = 0;
  let firstListLine = null;
  for (const lesson of unit.lessons) {
    for (const segment of lesson.segments) {
      const blocks = splitParagraphs(segment.text);
      for (const block of blocks) {
        if (block.type === "list") {
          lists++;
          if (block.items === 3) threeItemLists++;
          if (firstListLine === null) firstListLine = blockLine(segment, block);
        }
        if (block.type === "text") {
          const sentences = splitSentences(block.text).length;
          if (sentences > PARAGRAPH_SENTENCE_LIMIT) {
            findings.push(finding(unit, blockLine(segment, block), "VOICE-PARAGRAPH", "paragraph-length", `paragraph has ${sentences} sentences; keep paragraphs at ${PARAGRAPH_SENTENCE_LIMIT} or fewer, or vary them`));
          }
        }
      }
      if (blocks.length >= 2) {
        const lastHeading = [...blocks].reverse().find((b) => b.type === "heading");
        const lastText = [...blocks].reverse().find((b) => b.type === "text");
        const closer =
          lastHeading && startsWithCloser(lastHeading.text)
            ? lastHeading
            : lastText && startsWithCloser(lastText.text)
              ? lastText
              : null;
        if (closer) {
          findings.push(finding(unit, blockLine(segment, closer), "VOICE-CLOSER", "trailing-summary", `trailing "${closer.text.replace(/^\s{0,3}#{1,6}\s+/, "").split(/\s+/).slice(0, 3).join(" ")}" restates the lesson; end with the point or the next action`));
        }
      }
    }
  }
  if (lists >= THREE_ITEM_LIST_MINIMUM && threeItemLists / lists > THREE_ITEM_LIST_SHARE_LIMIT) {
    findings.push(finding(unit, firstListLine ?? 1, "VOICE-LISTS", "three-item-lists", `${threeItemLists} of ${lists} lists have exactly three items; vary list lengths`));
  }
}

function analyzeForm(unit, formMap, findings) {
  if (unit.lang !== "de") return;
  const resolved = resolveCourseForm(unit.relFile, formMap);
  if (!resolved) return;
  const offending = [];
  let du = 0;
  let sie = 0;
  for (const lesson of unit.lessons) {
    for (const segment of lesson.segments) {
      for (const marker of findFormMarkers(blankOutCodeFences(segment.text))) {
        if (marker.form === "du") du++;
        else sie++;
        if (marker.form !== resolved.form) {
          offending.push({ line: segmentLine(segment, marker.index), word: marker.word });
        }
      }
    }
  }
  if (offending.length === 0) return;
  const other = resolved.form === "du" ? "Sie" : "Du";
  const lines = [...new Set(offending.map((o) => o.line))];
  const shown = lines.slice(0, 5).join(", ") + (lines.length > 5 ? ", ..." : "");
  findings.push(finding(unit, offending[0].line, "VOICE-FORM", "form-of-address", `form of address is "${resolved.form}" (${resolved.source}) but ${offending.length} ${other}-form marker(s) found on line(s) ${shown}; du-form ${du}, Sie-form ${sie}`));
}

// ---------------------------------------------------------------------------
// Allowlist and severity
// ---------------------------------------------------------------------------

function allowlistMatches(entry, item) {
  if (entry.rule !== item.rule) return false;
  if (!pathMatches(item.relFile, entry.file)) return false;
  return entry.phrase === undefined || entry.phrase === item.phrase;
}

/** Splits findings into kept and suppressed; reports entries that matched nothing. */
export function applyAllowlist(findings, allowlist) {
  const used = new Set();
  const kept = [];
  const suppressed = [];
  for (const item of findings) {
    const index = allowlist.findIndex((entry) => allowlistMatches(entry, item));
    if (index === -1) kept.push(item);
    else {
      used.add(index);
      suppressed.push({ ...item, reason: allowlist[index].reason });
    }
  }
  const unused = allowlist.filter((_, index) => !used.has(index));
  return { kept, suppressed, unused };
}

export function severityFor(item, strict) {
  if (!VOICE_STRICT_RULES.has(item.rule)) return "warn";
  return isStrictFile(item.relFile, strict) ? "error" : "warn";
}

// ---------------------------------------------------------------------------
// Metrics (voice report)
// ---------------------------------------------------------------------------

function standardDeviation(values, mean) {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Text metrics for one prose unit. Sentence statistics cover text and quote
 * paragraphs of prose segments (three words or more); lists, headings and
 * tables are counted separately.
 */
export function computeVoiceMetrics(unit) {
  const lengths = [];
  let words = 0;
  let paragraphs = 0;
  let longParagraphs = 0;
  let lists = 0;
  let threeItemLists = 0;
  const listHistogram = {};
  const connectors = {};
  let connectorTotal = 0;
  let du = 0;
  let sie = 0;

  for (const lesson of unit.lessons) {
    for (const segment of lesson.segments) {
      const text = blankOutCodeFences(segment.text);
      words += countWords(text);
      for (const marker of findFormMarkers(text)) {
        if (marker.form === "du") du++;
        else sie++;
      }
      for (const connector of CONNECTOR_RULES) {
        const count = [...text.matchAll(globalPattern(connector.pattern))].length;
        if (count > 0) {
          connectors[connector.id] = (connectors[connector.id] ?? 0) + count;
          connectorTotal += count;
        }
      }
      const prose = isProseSegment(text);
      for (const block of splitParagraphs(text)) {
        if (block.type === "list") {
          lists++;
          listHistogram[block.items] = (listHistogram[block.items] ?? 0) + 1;
          if (block.items === 3) threeItemLists++;
          continue;
        }
        if (!prose || (block.type !== "text" && block.type !== "quote")) continue;
        const sentences = splitSentences(block.text);
        if (sentences.length === 0) continue;
        paragraphs++;
        if (sentences.length > PARAGRAPH_SENTENCE_LIMIT) longParagraphs++;
        for (const sentence of sentences) lengths.push(countWords(sentence));
      }
    }
  }

  const sentenceCount = lengths.length;
  const sum = lengths.reduce((a, b) => a + b, 0);
  const mean = sentenceCount === 0 ? 0 : sum / sentenceCount;
  const form = du > 0 && sie > 0 ? "mixed" : du > 0 ? "du" : sie > 0 ? "sie" : "none";

  return {
    words,
    sentences: sentenceCount,
    sentenceLengthMean: mean,
    sentenceLengthSd: standardDeviation(lengths, mean),
    sentenceLengthSum: sum,
    sentenceLengthSumSq: lengths.reduce((a, b) => a + b * b, 0),
    paragraphs,
    longParagraphs,
    longParagraphShare: paragraphs === 0 ? 0 : longParagraphs / paragraphs,
    lists,
    threeItemLists,
    threeItemListShare: lists === 0 ? 0 : threeItemLists / lists,
    listHistogram,
    connectors,
    connectorTotal,
    du,
    sie,
    form,
  };
}
