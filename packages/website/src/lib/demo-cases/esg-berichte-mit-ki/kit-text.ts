import "server-only";

import { readFileSync } from "node:fs";
import { publicFile } from "@/lib/demo-takehome.server";
import { takeHomeFor } from "@/lib/demo-takehome";
import type { Locale } from "@/lib/i18n/locale";
import { readZipText } from "@/lib/zip/read";
import { CERT_LINES, CLAIM_LINE, DRAFT_LINE, FILE_NAMES, KIT_ROOT, type FileId } from "./kit";

/*
 * The kit's own lines, read from the shipped zip on the server, so the stage
 * quotes the files a visitor downloads, word for word, and the copy pack never
 * holds a kit line (the kit writes stamps in capitals, the page's sentences do
 * not). Plain data: index.tsx hands one language to the client.
 */

const SLUG = "esg-berichte-mit-ki";

export interface KitLine {
  readonly n: number;
  readonly text: string;
}

export interface KitDoc {
  readonly name: string;
  readonly lines: readonly KitLine[];
}

export interface KitText {
  /** Line 1 of every kit file: the invented-data label. */
  readonly invented: string;
  readonly certificate: KitDoc;
  readonly draft: KitDoc;
  /** strom_2025.csv lines 2 (header) to 14. */
  readonly strom: KitDoc;
  readonly stromText: string;
  readonly wasserName: string;
  /** anfragen/2-werbeaussagen.md line 10: the claim and where it goes. */
  readonly claim: { readonly text: string; readonly place: string };
  /** anfragen/3-bankformular.md line 12: the bank's question, without "F2. ". */
  readonly f2: string;
  readonly invoiceName: string;
  readonly fileNames: Readonly<Record<FileId, string>>;
}

const PATHS = {
  de: { root: "crvena-zemja-nachweisprobe/", claims: "anfragen/2-werbeaussagen.md", bank: "anfragen/3-bankformular.md", invoice: "nachreichung/rechnung-EL-25-09.png" },
  en: { root: "crvena-zemja-esg-kit/", claims: "requests/2-marketing-claims.md", bank: "requests/3-bank-form.md", invoice: "late-document/invoice-EL-25-09.png" },
} as const;

/** The bank form's line 12 is "F2. <question>". */
export const BANK_F2_LINE = 12;

export function kitZip(locale: Locale): Uint8Array {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no ${locale} kit`);
  return new Uint8Array(readFileSync(publicFile(kit.href)));
}

function text(zip: Uint8Array, path: string): string {
  const value = readZipText(zip, path);
  if (value === null) throw new Error(`${SLUG}: the kit has no ${path}`);
  return value;
}

const linesOf = (source: string) => source.replace(/\r\n?/g, "\n").split("\n");

function doc(lines: readonly string[], name: string, numbers: readonly number[]): KitDoc {
  return { name, lines: numbers.map((n) => ({ n, text: lines[n - 1] ?? "" })) };
}

/** "| 3 | „Zertifizierte Bio-Weinberge“ | Regalkarte, alle Weine |" to its claim and place. */
export function claimRow(line: string): { text: string; place: string } {
  const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
  const claim = (cells[1] ?? "").replace(/^[„"“]|[“”"]$/g, "");
  const place = cells[2] ?? "";
  if (!claim || !place) throw new Error(`${SLUG}: claim row not readable: ${line}`);
  // The kit writes the English place in lower case ("shelf card, all wines"); the card starts it with a capital.
  return { text: claim, place: place.charAt(0).toUpperCase() + place.slice(1) };
}

export function kitText(locale: Locale): KitText {
  const zip = kitZip(locale);
  const paths = PATHS[locale];
  const file = (id: FileId) => `${KIT_ROOT[locale]}${FILE_NAMES[id][locale]}`;
  const cert = linesOf(text(zip, file("bio")));
  const draft = linesOf(text(zip, file("entwurf")));
  const stromSource = text(zip, file("strom"));
  const strom = linesOf(stromSource);
  const claims = linesOf(text(zip, `${paths.root}${paths.claims}`));
  const bank = linesOf(text(zip, `${paths.root}${paths.bank}`));
  const f2 = (bank[BANK_F2_LINE - 1] ?? "").replace(/^F2\.\s*/, "");
  if (!f2) throw new Error(`${SLUG}: no F2 in the bank form`);
  const fileNames = Object.fromEntries(Object.entries(FILE_NAMES).map(([id, names]) => [id, names[locale]])) as Record<FileId, string>;
  return {
    invented: cert[0] ?? "",
    certificate: doc(cert, FILE_NAMES.bio[locale], CERT_LINES),
    draft: doc(draft, FILE_NAMES.entwurf[locale], [1, DRAFT_LINE.status, DRAFT_LINE.figure]),
    strom: doc(strom, FILE_NAMES.strom[locale], Array.from({ length: 13 }, (_, at) => at + 2)),
    stromText: stromSource,
    wasserName: FILE_NAMES.wasser[locale],
    claim: claimRow(claims[CLAIM_LINE - 1] ?? ""),
    f2,
    invoiceName: paths.invoice.split("/").pop() ?? paths.invoice,
    fileNames,
  };
}

export const INVOICE_PATHS = { de: `${PATHS.de.root}${PATHS.de.invoice}`, en: `${PATHS.en.root}${PATHS.en.invoice}` } as const;
