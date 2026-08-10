import glossaryData from "../../../content/ai-native/glossary.json";
import glossaryDataEn from "../../../content/ai-native/en/glossary.json";
import type { Locale } from "@/lib/i18n/locale";

export type GlossaryCategory =
  | "claude"
  | "obsidian"
  | "automation"
  | "mindset"
  | "regulatorik"
  | "pedagogy"
  | "technik";

export interface GlossaryEntry {
  readonly term: string;
  readonly category: GlossaryCategory;
  readonly definition: string;
  readonly related: readonly string[];
}

export interface GlossaryMeta {
  readonly title: string;
  readonly version: string;
  readonly last_updated: string;
}

export interface Glossary {
  readonly _meta: GlossaryMeta;
  readonly categories: Record<GlossaryCategory, string>;
  readonly entries: readonly GlossaryEntry[];
}

const GLOSSARIES: Partial<Record<Locale, Glossary>> = {
  de: glossaryData as Glossary,
  en: glossaryDataEn as Glossary,
};

function glossary(locale: Locale): Glossary {
  const value = GLOSSARIES[locale];
  if (!value) {
    throw new Error(
      `AI-Native has no audited "${locale}" glossary registered.`,
    );
  }
  return value;
}

export function getGlossary(locale: Locale = "de"): Glossary {
  return glossary(locale);
}

export function getGlossaryEntries(
  locale: Locale = "de",
): readonly GlossaryEntry[] {
  return glossary(locale).entries;
}

export function getEntriesByCategory(
  category: GlossaryCategory,
  locale: Locale = "de",
): readonly GlossaryEntry[] {
  return glossary(locale).entries.filter((e) => e.category === category);
}

export function getGlossaryTerm(
  term: string,
  locale: Locale = "de",
): GlossaryEntry | undefined {
  return glossary(locale).entries.find(
    (e) => e.term.toLowerCase() === term.toLowerCase(),
  );
}

export function getCategoryLabel(
  category: GlossaryCategory,
  locale: Locale = "de",
): string {
  return glossary(locale).categories[category];
}

export const CATEGORY_ORDER: readonly GlossaryCategory[] = [
  "mindset",
  "claude",
  "obsidian",
  "automation",
  "technik",
  "regulatorik",
  "pedagogy",
];
