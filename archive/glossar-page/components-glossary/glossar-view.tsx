"use client";

import { useState, useMemo } from "react";
import type { GlossaryEntry } from "@/lib/glossary/merge";

interface Props {
  entries: GlossaryEntry[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function GlossarView({ entries }: Props) {
  const [search, setSearch] = useState("");
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = entries;
    if (letterFilter) {
      result = result.filter((e) => e.term.toUpperCase().startsWith(letterFilter));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q),
      );
    }
    return result;
  }, [entries, search, letterFilter]);

  return (
    <div>
      <input
        type="search"
        placeholder="Begriff suchen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border-2 border-foreground bg-background px-4 py-3 font-mono text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange"
        aria-label="Glossar durchsuchen"
      />
      <div className="mt-4 flex flex-wrap gap-1">
        <button
          onClick={() => setLetterFilter(null)}
          aria-pressed={!letterFilter}
          className={`border px-2 py-1 font-mono text-[11px] uppercase ${!letterFilter ? "border-brand-orange bg-brand-orange text-white" : "border-foreground text-muted-foreground hover:text-foreground"}`}
        >
          Alle
        </button>
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            onClick={() => setLetterFilter(letterFilter === letter ? null : letter)}
            aria-pressed={letterFilter === letter}
            className={`border px-2 py-1 font-mono text-[11px] uppercase ${letterFilter === letter ? "border-brand-orange bg-brand-orange text-white" : "border-foreground text-muted-foreground hover:text-foreground"}`}
          >
            {letter}
          </button>
        ))}
      </div>
      <dl className="mt-8 space-y-6" aria-live="polite">
        {filtered.map((entry) => (
          <div key={entry.term} className="border-b border-border pb-4">
            <dt className="text-[17px] font-bold text-foreground">
              {entry.term}
              {entry.english && (
                <span className="ml-2 font-mono text-[12px] text-muted-foreground">
                  ({entry.english})
                </span>
              )}
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {entry.definition}
            </dd>
            {entry.additionalDefinition && (
              <dd className="mt-2 border-l-2 border-border pl-3 text-[13px] leading-relaxed text-muted-foreground">
                EU AI Act: {entry.additionalDefinition}
              </dd>
            )}
            <dd className="mt-2">
              <a
                href={entry.kursLink}
                className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-orange hover:underline"
              >
                Im {entry.kursTitle} →
              </a>
            </dd>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-[15px] text-muted-foreground">Keine Begriffe gefunden.</div>
        )}
      </dl>
    </div>
  );
}
