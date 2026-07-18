import kiFuehrerscheinGlossary from "../../../content/ki-fuehrerschein/glossary.json";
import euAiActGlossary from "../../../content/eu-ai-act-kurs/glossary.json";
import aiNativeGlossary from "../../../content/ai-native/glossary.json";

export interface GlossaryEntry {
  term: string;
  definition: string;
  english?: string;
  category: string;
  kursLink: string;
  kursTitle: string;
  additionalDefinition?: string;
}

interface RawEntry {
  term: string;
  definition: string;
  english?: string;
  category?: string;
  [key: string]: unknown;
}

export function mergeGlossaries(): GlossaryEntry[] {
  const merged = new Map<string, GlossaryEntry>();

  // KI-Führerschein terms (highest priority)
  for (const item of kiFuehrerscheinGlossary as RawEntry[]) {
    merged.set(item.term.toLowerCase(), {
      term: item.term,
      definition: item.definition,
      english: item.english,
      category: String(item.category ?? ""),
      kursLink: "/ki-fuehrerschein",
      kursTitle: "KI-Führerschein",
    });
  }

  // EU AI Act terms (merge, dedup with additional definition for duplicates)
  for (const item of euAiActGlossary as RawEntry[]) {
    const key = item.term.toLowerCase();
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      merged.set(key, { ...existing, additionalDefinition: item.definition });
    } else {
      merged.set(key, {
        term: item.term,
        definition: item.definition,
        english: item.english,
        category: String(item.category ?? ""),
        kursLink: "/eu-ai-act-kurs",
        kursTitle: "EU AI Act Kurs",
      });
    }
  }

  // AI-Native terms
  const aiNativeEntries = (aiNativeGlossary as { entries?: RawEntry[] }).entries ?? [];
  if (aiNativeEntries.length === 0) {
    console.warn("AI-Native-Glossar ist leer; die übrigen Glossare werden weiter geladen.");
  } else {
    for (const item of aiNativeEntries) {
      const key = item.term.toLowerCase();
      if (!merged.has(key)) {
        merged.set(key, {
          term: item.term,
          definition: item.definition,
          category: String(item.category ?? ""),
          kursLink: "/ai-native",
          kursTitle: "AI-Native Arbeitskurs",
        });
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    a.term.localeCompare(b.term, "de"),
  );
}
