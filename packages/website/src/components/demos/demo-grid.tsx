"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEMO_CATEGORIES,
  DEMO_LEVEL_LABELS,
  DEMO_LEVELS,
  demos,
  filterDemos,
  type Demo,
} from "@/lib/demos";
import { trackDemoFilter } from "@/lib/analytics";
import { DemoTile } from "./demo-tile";

export function DemoGrid() {
  const params = useSearchParams();
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Filter state lives in React, seeded once from the URL so deep links like
  // /demos?cat=RAG still render filtered. Chip clicks update this state and
  // sync the URL via the History API — NOT router.replace, which on the
  // mobile/WebKit profile scrolls the page to the top even with scroll:false
  // (a measured 405px jump; performance and release hardening E2E follow-up).
  const [level, setLevel] = useState<string>(params.get("level") ?? "alle");
  const [cat, setCat] = useState<string>(params.get("cat") ?? "Alle");
  const [industry, setIndustry] = useState<string>(params.get("industry") ?? "");

  const filtered = useMemo<readonly Demo[]>(
    () => filterDemos({ level, category: cat, industry }),
    [level, cat, industry],
  );

  useEffect(() => {
    trackDemoFilter(cat, level, industry || ", ");
  }, [cat, level, industry]);

  const syncUrl = useCallback((nextLevel: string, nextCat: string, nextIndustry: string) => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams();
    if (nextLevel && nextLevel !== "alle") sp.set("level", nextLevel);
    if (nextCat && nextCat !== "Alle") sp.set("cat", nextCat);
    if (nextIndustry) sp.set("industry", nextIndustry);
    const qs = sp.toString();
    // History API updates the URL (deep-link / share) without a Next
    // navigation, so the scroll position is left untouched.
    window.history.replaceState(null, "", qs ? `/demos?${qs}` : "/demos");
  }, []);

  const setParam = useCallback(
    (key: "level" | "cat", value: string, fallback: string) => {
      const resolved = value || fallback;
      if (key === "level") {
        setLevel(resolved);
        syncUrl(resolved, cat, industry);
      } else {
        setCat(resolved);
        syncUrl(level, resolved, industry);
      }
    },
    [level, cat, industry, syncUrl],
  );

  const clearAll = useCallback(() => {
    setLevel("alle");
    setCat("Alle");
    setIndustry("");
    syncUrl("alle", "Alle", "");
  }, [syncUrl]);

  // Keyboard shortcuts: J/K to tab tiles, / to focus filter chip bar, Esc to clear
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      const grid = gridRef.current;
      if (!grid) return;

      if (e.key === "/") {
        e.preventDefault();
        const firstChip = grid.parentElement?.querySelector<HTMLButtonElement>(
          "[data-filter-chip]",
        );
        firstChip?.focus();
        return;
      }
      if (e.key === "Escape") {
        clearAll();
        return;
      }
      if (e.key === "j" || e.key === "k") {
        const tiles = Array.from(grid.querySelectorAll<HTMLElement>("[data-demo-tile]"));
        if (tiles.length === 0) return;
        const currentIdx = tiles.findIndex((t) => t === document.activeElement);
        const nextIdx =
          e.key === "j"
            ? Math.min(tiles.length - 1, currentIdx + 1)
            : Math.max(0, currentIdx - 1);
        tiles[nextIdx === -1 ? 0 : nextIdx]?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [clearAll]);

  return (
    <div>
      {/* Filter chips */}
      <div className="space-y-3 border-y border-border/40 bg-card/20 px-4 py-4 md:px-6">
        <FilterRow label="Reifegrad">
          <Chip active={level === "alle"} onClick={() => setParam("level", "alle", "alle")}>
            Alle ({demos.length})
          </Chip>
          {DEMO_LEVELS.map((l) => {
            const n = demos.filter((d) => d.level === l).length;
            return (
              <Chip
                key={l}
                active={level === l}
                onClick={() => setParam("level", l, "alle")}
              >
                {DEMO_LEVEL_LABELS[l]} ({n})
              </Chip>
            );
          })}
        </FilterRow>

        <FilterRow label="Kategorie">
          <Chip active={cat === "Alle"} onClick={() => setParam("cat", "Alle", "Alle")}>
            Alle
          </Chip>
          {DEMO_CATEGORIES.map((c) => {
            const n = demos.filter((d) => d.category === c).length;
            if (n === 0) return null;
            return (
              <Chip
                key={c}
                active={cat === c}
                onClick={() => setParam("cat", c, "Alle")}
              >
                {c} ({n})
              </Chip>
            );
          })}
        </FilterRow>

        <div
          role="status"
          aria-live="polite"
          className="pt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
        >
          <span>
            {filtered.length} {filtered.length === 1 ? "Praxisbeispiel" : "Praxisbeispiele"}
            {industry ? ` · Arbeitskontext: ${industry}` : ""}
          </span>
        </div>
      </div>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 border border-dashed border-border px-6 py-16 text-center">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            ◆ Filter-Ergebnis
          </div>
          <div className="text-xl font-bold tracking-[-0.02em] text-foreground">
            Keine Treffer.
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Diese Kombination aus Reifegrad und Kategorie gibt es noch nicht. Setze die Filter
            zurück oder wähle nur einen.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-2 inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="mt-6 demo-gallery-grid"
        >
          {filtered.map((d) => (
            <DemoTile key={d.slug} demo={d} total={demos.length} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}:
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-filter-chip
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
        active
          ? "border-brand-orange bg-brand-orange text-white"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
