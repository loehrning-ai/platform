import type { Metadata } from "next";
import {
  getGlossary,
  getEntriesByCategory,
  getCategoryLabel,
  CATEGORY_ORDER,
} from "@/lib/ai-native/glossary";
import { GlossaryView } from "@/components/ai-native/glossary-view";

export const metadata: Metadata = {
  title: "Glossar, AI-Native Arbeitskurs",
  description:
    "Alle ~70 Begriffe aus dem AI-Native Arbeitskurs erklärt: Claude, MCP, Obsidian, n8n, EU AI Act, PARA, RCTFC, Capstone und mehr. Deutsche Definitionen, kategorisiert.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://loehrning.ai/ai-native/glossar" },
  openGraph: {
    title: "AI-Native Arbeitskurs Glossar",
    description:
      "70+ Begriffe erklärt: Claude, MCP, Obsidian, n8n, EU AI Act, PARA, RCTFC. Referenz-Doku für den Arbeitskurs.",
    url: "https://loehrning.ai/ai-native/glossar",
    type: "website",
  },
};

export default function GlossarPage() {
  const { _meta, entries } = getGlossary();
  const groups = CATEGORY_ORDER.map((cat, i) => ({
    key: cat,
    num: `0${i + 1}`.slice(-2),
    label: getCategoryLabel(cat),
    entries: getEntriesByCategory(cat)
      .slice()
      .sort((a, b) => a.term.localeCompare(b.term, "de")),
  })).filter((g) => g.entries.length > 0);

  return (
    <GlossaryView
      groups={groups}
      totalTerms={entries.length}
      version={_meta.version}
      lastUpdated={_meta.last_updated}
    />
  );
}
