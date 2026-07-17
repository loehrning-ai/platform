import glossaryData from "../../../content/ai-native/glossary.json";

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

const GLOSSARY = glossaryData as Glossary;

export function getGlossary(): Glossary {
  return GLOSSARY;
}

export function getGlossaryEntries(): readonly GlossaryEntry[] {
  return GLOSSARY.entries;
}

export function getEntriesByCategory(
  category: GlossaryCategory,
): readonly GlossaryEntry[] {
  return GLOSSARY.entries.filter((e) => e.category === category);
}

export function getGlossaryTerm(term: string): GlossaryEntry | undefined {
  return GLOSSARY.entries.find(
    (e) => e.term.toLowerCase() === term.toLowerCase(),
  );
}

export function getCategoryLabel(category: GlossaryCategory): string {
  return GLOSSARY.categories[category];
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
