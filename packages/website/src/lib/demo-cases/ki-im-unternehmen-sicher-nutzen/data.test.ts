import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  ACCOUNTS,
  CARD_TEMPLATES,
  DECK05,
  FACTS_AS_OF,
  FIX_OVERRIDES,
  FRIDAY_ROWS,
  NOT_IN_FILES,
  RULE_LINES,
  SCENES,
  STORED_LINE,
  UI,
  W05_FACTS,
  citeExists,
} from "./index";

const KIT = join(
  process.cwd(),
  "public/workshops/ki-im-unternehmen-sicher-nutzen/ai-at-work-kit.zip",
);

/** One entry of a zip, read from its local header (stored or deflate). */
function readZipEntry(zip: Buffer, name: string): string {
  let offset = 0;
  while (offset + 30 <= zip.length && zip.readUInt32LE(offset) === 0x04034b50) {
    const method = zip.readUInt16LE(offset + 8);
    const compressed = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const entryName = zip.toString("utf8", offset + 30, offset + 30 + nameLength);
    const start = offset + 30 + nameLength + extraLength;
    const data = zip.subarray(start, start + compressed);
    if (entryName === name) {
      if (method === 0) return data.toString("utf8");
      if (method === 8) return inflateRawSync(data).toString("utf8");
      throw new Error(`Unsupported zip method ${method}`);
    }
    offset = start + compressed;
  }
  throw new Error(`${name} not found in the kit`);
}

const zip = readFileSync(KIT);
const kit = (file: string) => readZipEntry(zip, `ai-at-work-kit/${file}`);

describe("the facts mirror the kit's facts.md verbatim", () => {
  const facts = kit("facts.md");

  it("finds every used fact line, with its dates as one list", () => {
    for (const fact of W05_FACTS) {
      expect(facts, `F${fact.id}`).toContain(
        `${fact.id}. ${fact.statementEn} | ${fact.source} | ${fact.dates.join(", ")}`,
      );
    }
  });

  it("mirrors the 'Not in the files' sentence and the check date", () => {
    expect(facts).toContain(NOT_IN_FILES.en);
    expect(facts).toContain("Checked 18 Oct 2026.");
    expect(FACTS_AS_OF.de).toContain("18. Oktober 2026");
  });

  it("cites only facts that exist", () => {
    for (const account of Object.values(ACCOUNTS)) {
      for (const row of account.route ?? []) expect(citeExists(row.cite), account.id).toBe(true);
      if (account.note) expect(citeExists(account.note.cite)).toBe(true);
    }
    for (const scene of SCENES) if (scene.flag) expect(citeExists(scene.flag.cite)).toBe(true);
  });

  it("keeps the facts the strip depends on", () => {
    expect(facts).toContain("Chat data is stored in the US.");
    expect(facts).toContain("Processing may run in the US, Europe, Asia and Australia.");
    expect(STORED_LINE.en).toContain("may also run");
  });
});

describe("the case mirrors scenes.md, company-notes.md, customer-email.md and ANSWERS.md", () => {
  const scenes = kit("scenes.md");
  const notes = kit("company-notes.md");
  const email = kit("customer-email.md");
  const answers = kit("ANSWERS.md");

  it("has the eight people in kit order", () => {
    const people = [...scenes.matchAll(/^Scene \d\n(\w+),/gm)].map((match) => match[1]);
    expect(people).toEqual(SCENES.map((scene) => scene.person));
  });

  it("quotes the boss's draft and the customer's questions", () => {
    for (const row of FRIDAY_ROWS) expect(email).toContain(`${row.n}. ${row.sentence.en}`);
    expect(email).toContain("Customer data stays in the EU or EEA unless the customer agrees in writing.");
    expect(email).toContain("Which AI tools do your people use with our data?");
  });

  it("takes the English true sentences from the ANSWERS.md sample page", () => {
    for (const row of FRIDAY_ROWS) expect(answers, `sentence ${row.n}`).toContain(row.trueSentence.en);
  });

  it("takes the vendor questions word for word", () => {
    for (const line of CARD_TEMPLATES.en.mail.split("\n").filter((entry) => /^\d\. /.test(entry))) {
      expect(answers).toContain(line);
    }
  });

  it("uses the survey and IT notes as written", () => {
    expect(notes).toContain("61 use AI weekly. 38 of those sometimes use a personal account.");
    expect(notes).toContain("Some support agents use a free chatbot on their phones.");
    expect(notes).toContain("Claude Team since 1 September. 25 seats. The owner is the IT lead.");
    expect(answers).toContain("Six of eight matching is good.");
    expect(answers).toContain("Enterprise does not turn red into green.");
  });
});

/* Copy hygiene -------------------------------------------------------- */

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (typeof value === "function") {
    const fn = value as (...args: string[]) => unknown;
    const result = fn("X", "Y", "Z");
    if (typeof result === "string") out.push(result);
  } else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) collectStrings(item, out);
  return out;
}

const ALL = collectStrings([
  UI,
  SCENES,
  ACCOUNTS,
  RULE_LINES,
  FIX_OVERRIDES,
  FRIDAY_ROWS,
  CARD_TEMPLATES,
  DECK05,
  NOT_IN_FILES,
  STORED_LINE,
  W05_FACTS.map((fact) => fact.statementDe),
]);

describe("copy hygiene", () => {
  it("has no em or en dashes", () => {
    for (const text of ALL) expect(text, text).not.toMatch(/[–—]/);
  });

  it("never claims compliance or certification", () => {
    for (const text of ALL) {
      const withoutNever = text.replace(/Nie schreiben:.*$/s, "").replace(/Never write.*$/s, "");
      expect(withoutNever, text).not.toMatch(/compliant|konform|zertifiziert|certified/i);
    }
  });

  it("uses real umlauts", () => {
    const ascii =
      /\b(?:fuer|ueber|Loesung|Gruen|pruef\w*|Schluessel|moeglich|waere|zurueck|Aenderung|geaendert|loesch\w*|Gespraech\w*|Gehaltswuensche|Vertraege|Lebenslaeufe|Betraege|naechste|oeffentlich\w*)\b/i;
    expect(ascii.test("fuer")).toBe(true);
    for (const text of ALL) expect(text, text).not.toMatch(ascii);
  });

  it("never names the poster metaphors in the UI", () => {
    for (const text of ALL) expect(text, text).not.toMatch(/Stellwerk|Hauptbuch|ledger/i);
  });

  it("has the same keys in German and English", () => {
    expect(Object.keys(UI.de).sort()).toEqual(Object.keys(UI.en).sort());
    expect(Object.keys(CARD_TEMPLATES.de).sort()).toEqual(Object.keys(CARD_TEMPLATES.en).sort());
  });

  it("says du in the UI and Sie only in the vendor mail", () => {
    const ui = collectStrings(UI.de).join(" ");
    expect(ui).not.toMatch(/\b(?:Sie|Ihre|Ihnen)\b/);
    expect(CARD_TEMPLATES.de.mail).toContain("beantworten Sie uns schriftlich");
  });
});
