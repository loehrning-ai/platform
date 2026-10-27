/**
 * Test helper: both published kit zips, read with the site's own zip reader,
 * and a small CSV parser for the three data files. Imported by tests only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listZipEntries, readZipText } from "@/lib/zip/read";

export const KIT_ROOT = "northwind-analyst-kit";
export const KITS = {
  en: "public/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit.zip",
  de: "public/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit-de.zip",
} as const;

export type KitLocale = keyof typeof KITS;

const cache = new Map<KitLocale, Uint8Array>();

export function kitBytes(locale: KitLocale): Uint8Array {
  const hit = cache.get(locale);
  if (hit) return hit;
  const bytes = new Uint8Array(readFileSync(join(process.cwd(), KITS[locale])));
  cache.set(locale, bytes);
  return bytes;
}

export function kitPaths(locale: KitLocale): readonly string[] {
  return listZipEntries(kitBytes(locale)).map((entry) => entry.path);
}

export function kitText(locale: KitLocale, file: string): string {
  const text = readZipText(kitBytes(locale), `${KIT_ROOT}/${file}`);
  if (text === null) throw new Error(`${KITS[locale]} has no ${file}`);
  return text;
}

/** One CSV as records; product_lines.csv quotes its colour list, nothing else holds a comma. */
export function csvRows(text: string): readonly Record<string, string>[] {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const keys = (head ?? "").split(",");
  return lines.map((line) => {
    const cells = line.match(/("[^"]*"|[^,]*)(,|$)/g)?.map((cell) => cell.replace(/,$/, "").replace(/^"|"$/g, "")) ?? [];
    return Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""]));
  });
}
