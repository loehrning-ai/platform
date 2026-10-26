import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readZipEntry, readZipText } from "@/lib/zip/read";
import invoiceSource from "@/components/demos/esg-berichte-mit-ki/invoice-source.json";
import { CARD_WORDS } from "./card-words";
import { COPY } from "./copy";
import { figures } from "./figures";
import { BIO, CERT_LINE, DRAFT_LINE, FILE_IDS, FILE_NAMES, KIT_ROOT, PROFILE_TANK_LINE, SEPTEMBER_INVOICE, STROM, WASSER, type FileId } from "./kit";
import { INVOICE_PATHS, kitText } from "./kit-text";
import { formatLines, LEDGER } from "./ledger";
import { THREADS } from "./threads";

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

  it("reads the certificate, the draft and the requests from the zip, with the facts the scenes connect to", () => {
    const kit = kitText(locale);
    const cert = new Map(kit.certificate.lines.map((line) => [line.n, line.text]));
    const date = (d: { year: number; month: number; day: number }) => `${String(d.day).padStart(2, "0")}.${String(d.month).padStart(2, "0")}.${d.year}`;
    expect(kit.certificate.name).toBe(FILE_NAMES.bio[locale]);
    expect(cert.get(CERT_LINE.body)).toContain(BIO.controlBody);
    expect(cert.get(CERT_LINE.scope)).toMatch(new RegExp(`\\b${BIO.haCertified}\\b`));
    expect(cert.get(CERT_LINE.scope)).toMatch(new RegExp(`\\b${BIO.haTotal}\\b`));
    expect(cert.get(CERT_LINE.from)).toContain(date(BIO.validFrom));
    expect(cert.get(CERT_LINE.until)).toContain(date(BIO.validUntil));
    expect(cert.get(CERT_LINE.renewal)).toContain(date(BIO.renewalBooked));
    for (const thread of Object.values(THREADS)) for (const line of thread.accepted) expect(cert.get(line), `line ${line}`).toBeTruthy();
    const draft = new Map(kit.draft.lines.map((line) => [line.n, line.text]));
    expect(draft.get(DRAFT_LINE.figure)).toContain(figures(locale).mwh11);
    expect(draft.get(DRAFT_LINE.status)).toMatch(locale === "de" ? /ENTWURF/ : /DRAFT/);
    expect(kit.claim.text).toBe(locale === "de" ? "Zertifizierte Bio-Weinberge" : "Certified organic vineyards");
    expect(kit.f2).toMatch(/MWh/);
    expect(kit.invented).toMatch(locale === "de" ? /[Ee]rfunden/ : /[Ii]nvented|[Ff]ictional/);
    const profile = lines(locale, `${folder(locale)}${FILE_NAMES.firmenprofil[locale]}`);
    expect(profile[PROFILE_TANK_LINE - 1]).toMatch(locale === "de" ? /September/ : /September/);
  });

  it("shows the invoice photo derived from the PNG in this zip", () => {
    const entry = (invoiceSource as Record<string, { source: string; sha256: string }>)[locale]!;
    expect(entry.source).toBe(INVOICE_PATHS[locale]);
    const png = readZipEntry(zip(locale), entry.source);
    expect(png).not.toBeNull();
    expect(createHash("sha256").update(png!).digest("hex")).toBe(entry.sha256);
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
        expect(line, `${row.id}: ${file}`).toContain(`${SHORT[locale][file]} ${formatLines(refs, pack.own.words.to)}`);
      }
    }
  });

  it("states the objective word for word as the skill does", () => {
    const skill = readFileSync(path.join(process.cwd(), "content/skills/esg-nachweise/SKILL.md"), "utf8").replace(/\s+/g, " ");
    if (locale === "de") expect(skill).toContain(pack.regel.objective);
    const card = lines(locale, locale === "de" ? "nachweisprobe.md" : "evidence-check.md").join("\n");
    for (const word of [...CARD_WORDS[locale].checks, ...CARD_WORDS[locale].statuses]) expect(card.toLowerCase()).toContain(word.toLowerCase());
  });
});
