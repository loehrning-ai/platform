import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "@/lib/zip/read";
import { COPY } from "./copy";
import { FILE_IDS, FILE_NAMES, KIT_ROOT, SEPTEMBER_INVOICE, STROM, WASSER, type FileId } from "./kit";
import { formatLines, LEDGER } from "./ledger";

/*
 * The demo is the kit visualized: every line the stage quotes and every row
 * it counts is read back from the two published zips here. A kit rebuild that
 * moves a line fails this test before it reaches the page.
 */
const ZIPS = {
  de: { href: "/workshops/esg-berichte-mit-ki/crvena-zemja-nachweisprobe.zip", root: "crvena-zemja-nachweisprobe/" },
  en: { href: "/workshops/esg-berichte-mit-ki/crvena-zemja-esg-kit.zip", root: "crvena-zemja-esg-kit/" },
} as const;

const zip = (locale: "de" | "en") => new Uint8Array(readFileSync(path.join(process.cwd(), "public", ZIPS[locale].href)));
const lines = (locale: "de" | "en", file: string) => {
  const text = readZipText(zip(locale), `${ZIPS[locale].root}${file}`);
  expect(text, `${locale}: ${file}`).not.toBeNull();
  return (text ?? "").replace(/\r\n/g, "\n").split("\n");
};
const folder = (locale: "de" | "en") => KIT_ROOT[locale].slice(ZIPS[locale].root.length);

/** How the solutions file names each folder file in its "Datei, Zeile" cells. */
const SHORT: Readonly<Record<"de" | "en", Readonly<Record<FileId, string>>>> = {
  de: {
    strom: "strom_2025.csv", entwurf: "entwurf", bio: "bio", kompensation: "kompensation", wasser: "wasser",
    firmenprofil: "firmenprofil", flaschen: "flaschen", personal: "personal", arbeitsschutz: "arbeitsschutz",
    richtlinien: "richtlinien", pv: "pv_angebot", regeln: "regeln", vsme: "vsme_basismodul",
  },
  en: {
    strom: "electricity_2025.csv", entwurf: "draft", bio: "organic", kompensation: "carbon_offsets", wasser: "water",
    firmenprofil: "company_profile", flaschen: "bottles", personal: "headcount", arbeitsschutz: "health_safety",
    richtlinien: "policies", pv: "solar_offer", regeln: "green_claims_rules", vsme: "vsme_basic_module",
  },
};

describe.each(["de", "en"] as const)("kit lockstep (%s)", (locale) => {
  const pack = COPY[locale];

  it("has all 13 folder files under the names the demo uses", () => {
    for (const id of FILE_IDS) lines(locale, `${folder(locale)}${FILE_NAMES[id][locale]}`);
  });

  it("quotes the certificate lines verbatim", () => {
    expect(pack.satz1.file).toBe(FILE_NAMES.bio[locale]);
    const file = lines(locale, `${folder(locale)}${pack.satz1.file}`);
    for (const [line, text] of pack.satz1.lines) expect(file[line - 1], `${pack.satz1.file}:${line}`).toBe(text);
  });

  it("quotes the lines of sentences 2 and 3 verbatim", () => {
    for (const sentence of pack.three.sentences) {
      const file = lines(locale, `${folder(locale)}${sentence.file}`);
      for (const [line, text] of sentence.lines) expect(file[line - 1], `${sentence.file}:${line}`).toBe(text);
    }
    const rules = lines(locale, `${folder(locale)}${FILE_NAMES.regeln[locale]}`);
    expect(rules[pack.three.banLine[0] - 1], "ban list 4c").toBe(pack.three.banLine[1]);
    expect(pack.three.sentences.map((sentence) => sentence.file)).toEqual([FILE_NAMES.entwurf[locale], FILE_NAMES.kompensation[locale], FILE_NAMES.wasser[locale]]);
  });

  it("counts the same bill rows as the CSV files", () => {
    for (const [id, rows] of [["strom", STROM], ["wasser", WASSER]] as const) {
      const file = lines(locale, `${folder(locale)}${FILE_NAMES[id][locale]}`);
      const data = file.slice(2).filter((line) => line.trim() !== "");
      expect(data).toHaveLength(rows.length);
      for (const row of rows) {
        const cells = file[row.line - 1]!.split(",");
        expect([cells[0], cells[1], Number(cells[2])], `${id}:${row.line}`).toEqual([row.month, row.invoice, row.amount]);
      }
    }
  });

  it("takes sentences 1, 3 and 4 from the marketing request, sentence 2 from the draft", () => {
    const requests = lines(locale, locale === "de" ? "anfragen/2-werbeaussagen.md" : "requests/2-marketing-claims.md").join("\n");
    expect(requests).toContain(pack.satz1.text);
    expect(requests).toContain(pack.three.sentences[1]!.text);
    expect(requests).toContain(pack.three.sentences[2]!.text);
    expect(lines(locale, `${folder(locale)}${pack.three.sentences[0]!.file}`)[4]).toContain(pack.three.sentences[0]!.text);
  });

  it("draws the late invoice with the numbers of the solutions file", () => {
    const answers = lines(locale, locale === "de" ? "loesungen/LOESUNGEN.md" : "answers/ANSWERS.md").join("\n");
    const format = (value: number) => new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(value);
    for (const value of [SEPTEMBER_INVOICE.kwh, SEPTEMBER_INVOICE.meterNew, SEPTEMBER_INVOICE.meterOld, SEPTEMBER_INVOICE.totalMkd]) {
      expect(answers).toContain(format(value));
    }
    expect(answers).toContain(SEPTEMBER_INVOICE.invoice);
    expect(answers).toMatch(locale === "de" ? /10 BELEGT, 4 SCHWACH, 7 LÜCKE/ : /10 COVERED, 4 WEAK, 7 GAP/);
    expect(answers).toMatch(locale === "de" ? /9 BELEGT, 3 SCHWACH, 9 LÜCKE/ : /9 COVERED, 3 WEAK, 9 GAP/);
  });

  it("cites every register row with the file and lines of the solutions file", () => {
    const answers = lines(locale, locale === "de" ? "loesungen/LOESUNGEN.md" : "answers/ANSWERS.md");
    const step2 = answers.findIndex((line) => /^## (?:Schritt|Step) 2/.test(line));
    for (const row of LEDGER) {
      const at = row.group === "werbung"
        ? answers.findIndex((line, index) => index > step2 && line.startsWith(`| ${row.id.slice(1)} |`))
        : answers.findIndex((line) => line.startsWith(`| ${row.id} |`));
      const line = answers[at] ?? "";
      expect(line, `${row.id} in the solutions file`).not.toBe("");
      expect(row.lines.length, row.id).toBeGreaterThan(0);
      for (const [file, refs] of row.lines) {
        expect(line, `${row.id}: ${file}`).toContain(`${SHORT[locale][file]} ${formatLines(refs, pack.range)}`);
      }
    }
  });

  it("states the objective word for word as the skill does", () => {
    const skill = readFileSync(path.join(process.cwd(), "content/skills/esg-nachweise/SKILL.md"), "utf8").replace(/\s+/g, " ");
    if (locale === "de") expect(skill).toContain(pack.regel.objective);
    const card = lines(locale, locale === "de" ? "nachweisprobe.md" : "evidence-check.md").join("\n");
    for (const status of Object.values(pack.statuses)) expect(card).toContain(status);
  });
});
