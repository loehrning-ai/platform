/**
 * book-voice-structure.mjs
 *
 * Structural slop checks for German book chapters in Markdown. This is the
 * JavaScript twin of the private linter de_slop_lint.py: same parsing, same
 * rules, same thresholds, so a chapter gets the same verdict from both.
 * Keep the two in step.
 *
 * It measures structure, not vocabulary (vocabulary is the job of the
 * platform's content-voice-rules.mjs): sentence-length mix, bold labels,
 * wrong quotation marks, staged contrast, closers, triads, repeated openers,
 * question plus answer, announcers, dashes between words, hollow intensifiers.
 *
 * The module is pure: text in, report out. No file access, no network.
 * Regexes are spelled with \u escapes so the source stays ASCII-only.
 */

export const SHORT_WORDS = 15;
export const LONG_WORDS = 25;
export const MIN_SENTENCES = 15;

/** Hard failures: the targets of the book plan, section 5. */
export const GATE = Object.freeze({
  shortShareMax: 0.65,
  longShareMin: 0.1,
  sdMin: 9.0,
  boldLabelsMax: 2,
  wrongQuotesMax: 0,
  stagedContrastMax: 1,
  dashesBetweenWordsMax: 0,
});

/** Warnings: reported, never failing unless the caller asks. */
export const WARN = Object.freeze({
  shortShareMin: 0.55,
  closersMax: 2,
  questionAnswerMax: 1,
  announcersMax: 0,
  repeatedOpenersMax: 1,
  triadsPer1kMax: 6.0,
  intensifiersPer1kMax: 4.0,
  lexiconMax: 0,
});

const W = "\\p{L}\\p{N}_";
const RX = (source, flags = "u") => new RegExp(source, flags.includes("u") ? flags : `${flags}u`);
const START = `(?<![${W}])`;
const END = `(?![${W}])`;

const ABBR = new Set(
  ("z b d h u a o \u00e4 i e g v s f ff bzw ca etc usw vgl ggf inkl evtl max min nr abs art bsp mio mrd " +
    "tsd dr prof sog zzgl vs gg\u00fc tel std bzgl ehem dt lt lfd gem ggfs co inc ltd str jh jhd geb ges").split(" "),
);
const MONTHS =
  "januar|februar|m\u00e4rz|april|mai|juni|juli|august|september|oktober|november|dezember";

const WORD_RE = RX(`[${W}]+(?:[-\u2019'/.,][${W}]+)*`, "gu");
const TERM_RE = RX(`([.!?\u2026]+)(["\u201c\u201d\u00ab\u00bb)\\]\u2019]*)(\\s+)`, "gu");

const EM = "\u2014";
const EN = "\u2013";

// ---------------------------------------------------------------- parsing ---

function stripFrontMatter(lines) {
  if (lines.length > 0 && lines[0].trim() === "---") {
    for (let i = 1; i < lines.length; i++) if (lines[i].trim() === "---") return i + 1;
  }
  return 0;
}

export function cleanInline(text) {
  let t = text;
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  t = t.replace(/\[\^[^\]]*\]/g, "");
  t = t.replace(/`[^`]*`/g, "X");
  t = t.replace(/<[^>\n]+>/g, " ");
  t = t.replace(/\{\{[^}]*\}\}/g, "0");
  t = t.replace(RX(`\\*\\*|__|(?<![${W}])\\*(?=\\S)|(?<=\\S)\\*(?![${W}])`, "gu"), "");
  t = t.replace(/\s+/g, " ");
  return t.trim();
}

export function parse(text) {
  const lines = text.split(/\r?\n/);
  const start = stripFrontMatter(lines);
  const paragraphs = [];
  const listItems = [];
  const headings = [];
  const allTextLines = [];
  const boldLines = [];
  const followers = [];
  let inFence = false;
  let fenceMark = "";
  let current = null;

  const flush = () => {
    if (current) {
      paragraphs.push(current);
      followers.push("para");
    }
    current = null;
  };
  const markNext = (kind) => {
    if (followers.length > 0) followers[followers.length - 1] = kind;
  };

  for (let idx = start; idx < lines.length; idx++) {
    const no = idx + 1;
    const raw = lines[idx];
    const stripped = raw.trim();
    const fence = stripped.match(/^(```+|~~~+)/);
    if (fence) {
      flush();
      if (!inFence) {
        inFence = true;
        fenceMark = fence[1].slice(0, 3);
      } else if (stripped.startsWith(fenceMark)) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;
    if (stripped === "") {
      flush();
      continue;
    }
    allTextLines.push([no, raw]);
    const lead = stripped.replace(/^(?:>\s*)?(?:[-*+]\s+|\d+[.)]\s+)?/, "");
    if (/^\*\*/.test(lead)) boldLines.push([no, raw]);
    if (/^#{1,6}\s/.test(stripped)) {
      flush();
      markNext("heading");
      headings.push([no, stripped]);
      continue;
    }
    if (stripped.startsWith("|")) {
      flush();
      markNext("other");
      continue;
    }
    if (/^(?:[-*+]|\d+[.)])\s+/.test(stripped)) {
      flush();
      markNext("other");
      listItems.push([no, cleanInline(stripped.replace(/^(?:[-*+]|\d+[.)])\s+/, ""))]);
      continue;
    }
    let body = stripped.replace(/^>\s?/, "");
    body = body.replace(/^\[!\w+\]\s*/, "");
    if (body === "") {
      flush();
      continue;
    }
    const cleaned = cleanInline(body);
    if (cleaned === "") continue;
    if (current === null) current = [no, []];
    current[1].push([no, cleaned]);
  }
  flush();
  return { paragraphs, listItems, headings, allTextLines, boldLines, followers };
}

// -------------------------------------------------------------- sentences ---

const isUpper = (ch) => RX("^\\p{Lu}$").test(ch);
const isLower = (ch) => RX("^\\p{Ll}$").test(ch);

export function splitSentences(text) {
  const out = [];
  let pos = 0;
  for (const m of text.matchAll(TERM_RE)) {
    const start = m.index;
    const end = start + m[0].length;
    const nxt = text.slice(end, end + 1);
    if (!nxt) continue;
    if (start < pos) continue;
    const term = m[1];
    const before = text.slice(pos, start);
    const last = before.match(RX(`([${W}]+)$`));
    const token = last ? last[1] : "";
    if (term === "." && token) {
      const low = token.toLowerCase();
      if (token.length === 1 && RX("^\\p{L}$").test(token)) continue;
      if (ABBR.has(low) && (token === low || token.length <= 3)) continue;
      if (/^\d+$/.test(token) && token.length <= 2) {
        const rest = text.slice(end, end + 12).toLowerCase();
        if (isLower(rest.slice(0, 1)) || RX(`^(?:${MONTHS})`).test(rest)) continue;
      }
    }
    if (!(isUpper(nxt) || /^\d$/.test(nxt) || "\u201e\"\u201c\u00bb([\u201a".includes(nxt))) continue;
    out.push(text.slice(pos, end).trim());
    pos = end;
  }
  const tail = text.slice(pos).trim();
  if (tail) out.push(tail);
  return out;
}

export function wordCount(sentence) {
  return (sentence.match(WORD_RE) ?? []).length;
}

function sentenceRecords(parsed) {
  const records = [];
  parsed.paragraphs.forEach(([pLine, plines], p) => {
    let joined = "";
    const offsets = [];
    for (const [no, t] of plines) {
      offsets.push([joined.length, no]);
      joined += (joined ? " " : "") + t;
    }
    splitSentences(joined).forEach((s, i) => {
      const at = joined.indexOf(s.slice(0, Math.min(s.length, 30)));
      let line = pLine;
      for (const [off, no] of offsets) if (off <= Math.max(at, 0)) line = no;
      records.push({ p, i, line, text: s, words: wordCount(s) });
    });
  });
  return records;
}

function groupByParagraph(records) {
  const map = new Map();
  for (const r of records) {
    if (!map.has(r.p)) map.set(r.p, []);
    map.get(r.p).push(r);
  }
  return map;
}

// ------------------------------------------------------------------ rules ---

function excerpt(text, n = 110) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}\u2026`;
}

const QUOTE_PATTERNS = [
  ["open_low_close_straight", RX('\u201e[^\u201c\u201d"\u201e\\n]{1,400}"', "gu")],
  ["open_low_close_right", RX("\u201e[^\u201c\u201d\"\u201e\\n]{1,400}\u201d", "gu")],
  ["english_curly", RX('\u201c[^\u201c\u201d\u201e"\\n]{1,400}\u201d', "gu")],
  ["straight_pair", RX(`(?<![${W}=])"[^"\\n]{1,300}"(?![${W}])`, "gu")],
];

function proseOnly(raw) {
  return raw
    .replace(/<[^>\n]+>/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/`[^`]*`/g, "X");
}

function checkQuotes(parsed) {
  const found = [];
  const seen = new Set();
  for (const [no, raw] of parsed.allTextLines) {
    const line = proseOnly(raw);
    for (const [kind, rx] of QUOTE_PATTERNS) {
      for (const m of line.matchAll(rx)) {
        const key = `${no}:${m.index}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ rule: "wrong_quote", kind, line: no, excerpt: excerpt(m[0], 60) });
      }
    }
  }
  return found;
}

const DASH_RE = RX(`(\\S)(\\s*)(${EM}|${EN}|--|-)(\\s*)(\\S)`, "gu");
const DASH_LEFT_HYPHEN = RX(`^(?:[${W}]|[)\\]\u201d\u201c"])$`);
const DASH_RIGHT_HYPHEN = RX(`^[${W}(\\[\u201e"\u201c]$`);
const DASH_LEFT = RX(`^[${W})\\]\u201d\u201c"%\u20ac]$`);
const DASH_RIGHT = RX(`^[${W}(\\[\u201e"\u201c\u20ac]$`);

function checkDashes(parsed) {
  const between = [];
  const ranges = [];
  for (const [no, raw] of parsed.allTextLines) {
    const line = proseOnly(raw);
    if (/^\s*\|?[\s:|-]+\|?\s*$/.test(line)) continue;
    for (const m of line.matchAll(DASH_RE)) {
      const [, a, sp1, d, sp2, b] = m;
      if (d === "-") {
        if (!(sp1 && sp2)) continue;
        if (!(DASH_LEFT_HYPHEN.test(a) && DASH_RIGHT_HYPHEN.test(b))) continue;
      }
      if ((d === EN || d === EM || d === "--") && /^\d$/.test(a) && /^\d$/.test(b) && !sp1 && !sp2) {
        ranges.push({ rule: "dash_number_range", line: no, excerpt: excerpt(line.slice(Math.max(0, m.index - 15), m.index + m[0].length + 15), 50) });
        continue;
      }
      if (!(DASH_LEFT.test(a) && DASH_RIGHT.test(b))) continue;
      between.push({ rule: "dash_between_words", line: no, excerpt: excerpt(line.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25), 70) });
    }
  }
  return { between, ranges };
}

const BOLD_LABEL = /^\s*(?:>\s*)?(?:[-*+]\s+|\d+[.)]\s+)?\*\*([^*\n]{1,80}?)\*\*[:.]?\s+\S/;

function checkBoldLabels(parsed) {
  return parsed.boldLines
    .filter(([, raw]) => BOLD_LABEL.test(raw))
    .map(([no, raw]) => ({ rule: "bold_label", line: no, excerpt: excerpt(raw.trim(), 70) }));
}

const RX_NICHT_START = RX("^Nicht(?![\\p{L}\\p{N}_])");
const RX_SONDERN_START = RX("^(?:Sondern|Vielmehr)(?![\\p{L}\\p{N}_])");
const RX_DAS_IST_KEIN = RX(`^(?:Das|Dies|Es) (?:ist|sind|war|waren) (?:kein|keine|keinen|keiner|nicht)${END}`, "iu");
const RX_DAS_IST = RX(`^(?:Das|Dies|Es) (?:ist|sind|war|waren)${END}`, "iu");
const RX_GEHT_NICHT = RX(`${START}geht (?:hier |es )?nicht (?:um|darum)${END}`, "iu");
const RX_GEHT_UM = RX(`^Es geht (?:hier )?(?:um|darum)${END}`, "iu");
const RX_NICHT_NUR = RX(`${START}nicht nur${END}.{1,200}?${START}sondern (?:auch|zus\u00e4tzlich)${END}`, "iu");
const RX_SOWOHL = RX(`${START}sowohl${END}.{1,200}?${START}als auch${END}`, "iu");
const RX_KOMMA_SONDERN = RX(`,\\s+sondern${END}`, "u");

function checkContrast(records) {
  const nichtSondern = [];
  const dasIst = [];
  const nichtNur = [];
  for (const sents of groupByParagraph(records).values()) {
    sents.forEach((r, i) => {
      const t = r.text;
      const nxt = i + 1 < sents.length ? sents[i + 1].text : "";
      let hit = null;
      if (RX_NICHT_START.test(t) && RX_SONDERN_START.test(nxt)) hit = "nicht_sondern_two_sentences";
      else if (RX_NICHT_START.test(t) && RX_KOMMA_SONDERN.test(t)) hit = "nicht_komma_sondern";
      else if (RX_GEHT_NICHT.test(t) && (RX_KOMMA_SONDERN.test(t) || RX_GEHT_UM.test(nxt))) hit = "es_geht_nicht_um";
      if (hit) {
        nichtSondern.push({ rule: "nicht_x_sondern_y", kind: hit, line: r.line, excerpt: excerpt(`${t} ${nxt}`, 90) });
        return;
      }
      if (RX_DAS_IST_KEIN.test(t) && (RX_DAS_IST.test(nxt) || RX_KOMMA_SONDERN.test(t))) {
        dasIst.push({ rule: "das_ist_kein_x", line: r.line, excerpt: excerpt(`${t} ${nxt}`, 90) });
        return;
      }
      if (RX_NICHT_NUR.test(t)) nichtNur.push({ rule: "nicht_nur_sondern_auch", line: r.line, excerpt: excerpt(t, 90) });
      else if (RX_SOWOHL.test(t)) nichtNur.push({ rule: "sowohl_als_auch", line: r.line, excerpt: excerpt(t, 90) });
    });
  }
  return { nichtSondern, dasIst, nichtNur };
}

function checkClosers(parsed, records) {
  const found = [];
  const byPar = groupByParagraph(records);
  const lastPar = Math.max(-1, ...byPar.keys());
  for (const [pIdx, sents] of byPar) {
    const last = sents[sents.length - 1];
    if (sents.length >= 3 && last.words <= 6) {
      found.push({ rule: "closer", kind: "short_last_sentence", line: last.line, excerpt: excerpt(last.text, 80) });
    } else if (sents.length === 1 && last.words <= 8 && pIdx > 0) {
      const prev = byPar.get(pIdx - 1) ?? [];
      const follower = pIdx < parsed.followers.length ? parsed.followers[pIdx] : "eof";
      if (prev.length >= 2 && ["heading", "eof", "other"].includes(follower) && pIdx === lastPar) {
        found.push({ rule: "closer", kind: "one_line_paragraph_end", line: last.line, excerpt: excerpt(last.text, 80) });
      } else if (prev.length >= 2 && follower === "heading") {
        found.push({ rule: "closer", kind: "one_line_section_end", line: last.line, excerpt: excerpt(last.text, 80) });
      }
    }
  }
  return found;
}

const RX_TRIAD = RX(
  `(?<![${W}])([${W}-]+(?: [${W}-]+)?), ([${W}-]+(?: [${W}-]+)?),? (?:und|oder|sowie) ([${W}-]+(?: [${W}-]+)?)(?=[\\s.,;:!?)]|$)`,
);

function checkTriads(records) {
  const found = [];
  for (const r of records) {
    const m = RX_TRIAD.exec(r.text);
    if (m) found.push({ rule: "triad", line: r.line, excerpt: excerpt(m[0], 70) });
  }
  return found;
}

function firstWord(text) {
  const m = RX(`^[${W}]+`).exec(text);
  return m ? m[0].toLowerCase() : "";
}

function checkRepeatedOpeners(records) {
  const found = [];
  for (const sents of groupByParagraph(records).values()) {
    const firsts = sents.map((s) => firstWord(s.text));
    let i = 0;
    while (i < sents.length) {
      let j = i;
      while (j + 1 < sents.length && firsts[j + 1] === firsts[i] && firsts[i]) j++;
      if (j - i + 1 >= 3) found.push({ rule: "repeated_openers", line: sents[i].line, excerpt: `${j - i + 1}x '${firsts[i]}'` });
      i = j + 1;
    }
  }
  return found;
}

function checkQuestions(records) {
  const qa = [];
  let total = 0;
  for (const sents of groupByParagraph(records).values()) {
    sents.forEach((r, i) => {
      if (r.text.replace(/[\u201d\u201c")]+$/u, "").endsWith("?")) {
        total++;
        if (r.words <= 6 && i + 1 < sents.length) {
          qa.push({ rule: "question_answer", line: r.line, excerpt: excerpt(`${r.text} ${sents[i + 1].text}`, 80) });
        }
      }
    });
  }
  return { qa, total };
}

const ANNOUNCERS = RX(
  `^(?:Und )?(?:jetzt|nun) (?:kommt|der|die|das)${END}|${START}Hier wird es (?:spannend|interessant)${END}|${START}Die Wahrheit (?:ist|lautet)${END}` +
    `|^Die Antwort\\?|^Aber jetzt${END}|${START}Der entscheidende Punkt${END}|^Und genau (?:das|hier)${END}|${START}Bleib dran${END}`,
  "iu",
);

function checkAnnouncers(records) {
  return records
    .filter((r) => ANNOUNCERS.test(r.text))
    .map((r) => ({ rule: "announcer", line: r.line, excerpt: excerpt(r.text, 80) }));
}

const INTENSIFIERS = RX(
  `${START}(sehr|wirklich|extrem|absolut|\u00e4u\u00dferst|unglaublich|enorm|wahnsinnig|definitiv|durchaus|geradezu|` +
    `v\u00f6llig|komplett|ziemlich|total|mega|schlichtweg|massiv|gewaltig|ungemein|\u00fcberaus|hochgradig)${END}`,
  "giu",
);

function checkIntensifiers(records) {
  const found = [];
  for (const r of records) {
    for (const m of r.text.matchAll(INTENSIFIERS)) found.push({ rule: "intensifier", line: r.line, excerpt: m[0].toLowerCase() });
  }
  return found;
}

const WCHARS = `[${W}]*`;
const LEXICON = [
  ["opener_heutige_welt", `${START}In der heutigen${END}|${START}Im Zeitalter${END}|${START}In einer zunehmend${END}|${START}Seit jeher${END}`],
  ["connector_crutch", `${START}Dar\u00fcber hinaus${END}|${START}Zusammenfassend${END}|${START}Abschlie\u00dfend${END}|${START}Nicht zuletzt${END}|${START}Insgesamt l\u00e4sst sich${END}`],
  ["importance_meta", `${START}Es ist wichtig zu betonen${END}|${START}Es sei darauf hingewiesen${END}|${START}von (?:entscheidender|zentraler) Bedeutung${END}|${START}spielt eine (?:wichtige|entscheidende|zentrale) Rolle${END}`],
  ["marker_vocab", `${START}(?:ganzheitlich${WCHARS}|nahtlos${WCHARS}|zukunftssicher${WCHARS}|ma\u00dfgeschneidert${WCHARS}|Synergien|Paradigmenwechsel|Herzst\u00fcck)${END}`],
  ["ad_adjective", `${START}(?:atemberaubend${WCHARS}|bahnbrechend${WCHARS}|revolution\u00e4r${WCHARS}|einzigartig${WCHARS}|faszinierend${WCHARS})${END}`],
  ["vague_authority", `${START}Experten sind sich einig${END}|${START}Studien zeigen${END}|${START}Branchenberichte (?:belegen|zeigen)${END}|${START}Viele Experten${END}`],
  ["pseudo_analysis_tail", `,\\s+was (?:die Bedeutung|zeigt, dass|verdeutlicht|unterstreicht)${END}`],
  ["chat_residue", `${START}Gerne!|${START}Ich hoffe, das hilft${END}|${START}Als KI-Modell${END}|${START}oaicite${END}|utm_source=chatgpt|${START}Gute Frage!`],
  ["self_reference", `${START}In diesem Kapitel (?:lernst|lernen|erf\u00e4hrst)${END}|${START}wie (?:oben|bereits) erw\u00e4hnt${END}|${START}wie wir gesehen haben${END}`],
  ["fake_depth", `${START}Im Kern${END}|${START}In Wirklichkeit${END}|${START}das eigentliche${END}|${START}der eigentliche${END}|${START}die eigentliche${END}`],
].map(([name, src]) => [name, RX(src, "giu")]);

function checkLexicon(records, listItems) {
  const found = [];
  const texts = [...records.map((r) => [r.line, r.text]), ...listItems];
  for (const [line, t] of texts) {
    for (const [name, rx] of LEXICON) {
      for (const m of t.matchAll(rx)) found.push({ rule: "lexicon", kind: name, line, excerpt: excerpt(m[0], 50) });
    }
  }
  return found;
}

function addressCounts(records) {
  let du = 0;
  let sie = 0;
  let ambiguous = 0;
  const duRx = /^(?:du|dir|dich|dein|deine|deinem|deinen|deiner|deines)$/i;
  const sieRx = /^(?:Sie|Ihr|Ihre|Ihrem|Ihren|Ihrer|Ihres|Ihnen)$/;
  for (const r of records) {
    const toks = r.text.match(RX(`[${W}]+`, "gu")) ?? [];
    toks.forEach((tok, i) => {
      if (duRx.test(tok)) du++;
      else if (sieRx.test(tok)) {
        if (i === 0) ambiguous++;
        else sie++;
      }
    });
  }
  return { du, sie, sentence_initial_ambiguous: ambiguous };
}

// ---------------------------------------------------------------- analysis ---

function round(x, d) {
  const f = 10 ** d;
  return Math.round((x + Number.EPSILON) * f) / f;
}

export function sentenceStats(records) {
  const n = records.length;
  if (n === 0) return { sentences: 0 };
  const lens = records.map((r) => r.words);
  const mean = lens.reduce((a, b) => a + b, 0) / n;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const short = lens.filter((x) => x < SHORT_WORDS).length;
  const long = lens.filter((x) => x >= LONG_WORDS).length;
  return {
    sentences: n,
    mean_words: round(mean, 2),
    sd_words: round(Math.sqrt(variance), 2),
    short_share: round(short / n, 3),
    mid_share: round((n - short - long) / n, 3),
    long_share: round(long / n, 3),
    max_words: Math.max(...lens),
  };
}

/** Lints one chapter. Returns { file, words, stats, counts, address, gate, findings }. */
export function lintChapter(text, name) {
  const parsed = parse(text);
  const records = sentenceRecords(parsed);
  const stats = sentenceStats(records);
  const words = records.reduce((a, r) => a + r.words, 0) + parsed.listItems.reduce((a, [, t]) => a + wordCount(t), 0);
  const quotes = checkQuotes(parsed);
  const dashes = checkDashes(parsed);
  const bold = checkBoldLabels(parsed);
  const { nichtSondern, dasIst, nichtNur } = checkContrast(records);
  const closers = checkClosers(parsed, records);
  const triads = checkTriads(records);
  const openers = checkRepeatedOpeners(records);
  const { qa, total: questions } = checkQuestions(records);
  const announcers = checkAnnouncers(records);
  const intens = checkIntensifiers(records);
  const lex = checkLexicon(records, parsed.listItems);
  const per1k = (c) => (words ? round((c * 1000) / words, 2) : 0.0);
  const boldAll = parsed.allTextLines.map(([, r]) => r).join("\n").match(/\*\*[^*\n]+\*\*/g) ?? [];

  const counts = {
    wrong_quotes: quotes.length,
    bold_labels: bold.length,
    bold_total: boldAll.length,
    nicht_x_sondern_y: nichtSondern.length,
    das_ist_kein_x: dasIst.length,
    nicht_nur_sondern_auch: nichtNur.length,
    staged_contrast_total: nichtSondern.length + dasIst.length + nichtNur.length,
    closers: closers.length,
    triads: triads.length,
    triads_per_1k: per1k(triads.length),
    repeated_openers: openers.length,
    question_answer: qa.length,
    questions,
    announcers: announcers.length,
    dashes_between_words: dashes.between.length,
    dash_number_ranges: dashes.ranges.length,
    intensifiers: intens.length,
    intensifiers_per_1k: per1k(intens.length),
    lexicon: lex.length,
    list_items: parsed.listItems.length,
    headings: parsed.headings.length,
  };
  const findings = [
    ...quotes, ...bold, ...nichtSondern, ...dasIst, ...nichtNur, ...closers, ...triads,
    ...openers, ...qa, ...announcers, ...dashes.between, ...intens, ...lex,
  ].sort((a, b) => a.line - b.line || (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0));

  const failures = [];
  const warnings = [];
  const enough = stats.sentences >= MIN_SENTENCES;
  if (enough) {
    if (stats.short_share > GATE.shortShareMax) failures.push(`short_share ${stats.short_share} > ${GATE.shortShareMax}`);
    if (stats.long_share < GATE.longShareMin) failures.push(`long_share ${stats.long_share} < ${GATE.longShareMin}`);
    if (stats.sd_words <= GATE.sdMin) failures.push(`sd_words ${stats.sd_words} <= ${GATE.sdMin}`);
    if (stats.short_share < WARN.shortShareMin) warnings.push(`short_share ${stats.short_share} < ${WARN.shortShareMin} (target band 0.55 to 0.65)`);
  }
  if (counts.bold_labels > GATE.boldLabelsMax) failures.push(`bold_labels ${counts.bold_labels} > ${GATE.boldLabelsMax}`);
  if (counts.wrong_quotes > GATE.wrongQuotesMax) failures.push(`wrong_quotes ${counts.wrong_quotes} > ${GATE.wrongQuotesMax}`);
  if (counts.staged_contrast_total > GATE.stagedContrastMax) failures.push(`staged_contrast_total ${counts.staged_contrast_total} > ${GATE.stagedContrastMax}`);
  if (counts.dashes_between_words > GATE.dashesBetweenWordsMax) failures.push(`dashes_between_words ${counts.dashes_between_words} > ${GATE.dashesBetweenWordsMax}`);
  if (counts.closers > WARN.closersMax) warnings.push(`closers ${counts.closers} > ${WARN.closersMax}`);
  if (counts.question_answer > WARN.questionAnswerMax) warnings.push(`question_answer ${counts.question_answer} > ${WARN.questionAnswerMax}`);
  if (counts.announcers > WARN.announcersMax) warnings.push(`announcers ${counts.announcers} > ${WARN.announcersMax}`);
  if (counts.repeated_openers > WARN.repeatedOpenersMax) warnings.push(`repeated_openers ${counts.repeated_openers} > ${WARN.repeatedOpenersMax}`);
  if (enough && counts.triads_per_1k > WARN.triadsPer1kMax) warnings.push(`triads_per_1k ${counts.triads_per_1k} > ${WARN.triadsPer1kMax}`);
  if (counts.intensifiers_per_1k > WARN.intensifiersPer1kMax) warnings.push(`intensifiers_per_1k ${counts.intensifiers_per_1k} > ${WARN.intensifiersPer1kMax}`);
  if (counts.lexicon > WARN.lexiconMax) warnings.push(`lexicon ${counts.lexicon} > ${WARN.lexiconMax}`);

  return {
    file: name,
    words,
    stats: enough ? stats : { ...stats, note: `insufficient: fewer than ${MIN_SENTENCES} prose sentences, share gates skipped` },
    counts,
    address: addressCounts(records),
    gate: { pass: failures.length === 0, failures, warnings },
    findings,
  };
}
