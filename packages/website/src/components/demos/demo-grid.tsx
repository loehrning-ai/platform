"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEMO_CATEGORIES,
  DEMO_LEVELS,
  demos,
  type Demo,
  type DemoCategory,
  type DemoLevel,
} from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { trackDemoFilter } from "@/lib/analytics";
import { DemoTile } from "./demo-tile";

export interface DemoGridInitialFilters {
  readonly level: DemoLevel | "alle";
  readonly category: DemoCategory | "Alle";
  readonly industry: string;
}

interface DemoGridProps {
  readonly initialFilters: DemoGridInitialFilters;
  readonly locale?: Locale;
  readonly catalog?: readonly Demo[];
}

export function DemoGrid({
  initialFilters,
  locale = "de",
  catalog = demos,
}: DemoGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const copy = DEMOS_PAGE_COPY[locale].catalog;
  const levelLabels = DEMO_LEVEL_LABELS_BY_LOCALE[locale];
  const categoryLabels = DEMO_CATEGORY_LABELS[locale];

  // The server resolves and validates URL filters before rendering so the
  // complete filtered gallery exists without JavaScript. Chip clicks remain
  // local React state and sync through the History API — NOT router.replace,
  // which on the mobile/WebKit profile scrolls the page to the top even with
  // scroll:false (a measured 405px jump).
  const [level, setLevel] = useState<string>(initialFilters.level);
  const [cat, setCat] = useState<string>(initialFilters.category);
  const [industry, setIndustry] = useState<string>(initialFilters.industry);

  const filtered = useMemo<readonly Demo[]>(
    () => catalog.filter((demo) => {
      if (cat && cat !== "Alle" && demo.category !== cat) return false;
      if (level && level !== "alle" && demo.level !== level) return false;
      if (industry && !demo.industries.includes(industry)) return false;
      return true;
    }),
    [catalog, level, cat, industry],
  );

  useEffect(() => {
    trackDemoFilter(cat, level, industry || "alle");
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
    const catalogPath = localizeHref("/demos", locale);
    window.history.replaceState(null, "", qs ? `${catalogPath}?${qs}` : catalogPath);
  }, [locale]);

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
      <div className="space-y-4 border-y border-foreground/20 bg-card/30 px-3 py-4 sm:px-5 md:px-6">
        <FilterRow label={copy.level}>
          <Chip active={level === "alle"} onClick={() => setParam("level", "alle", "alle")}>
            {copy.all} ({catalog.length})
          </Chip>
          {DEMO_LEVELS.map((l) => {
            const n = catalog.filter((d) => d.level === l).length;
            return (
              <Chip
                key={l}
                active={level === l}
                onClick={() => setParam("level", l, "alle")}
              >
                {levelLabels[l]} ({n})
              </Chip>
            );
          })}
        </FilterRow>

        <FilterRow label={copy.category}>
          <Chip active={cat === "Alle"} onClick={() => setParam("cat", "Alle", "Alle")}>
            {copy.all}
          </Chip>
          {DEMO_CATEGORIES.map((c) => {
            const n = catalog.filter((d) => d.category === c).length;
            if (n === 0) return null;
            return (
              <Chip
                key={c}
                active={cat === c}
                onClick={() => setParam("cat", c, "Alle")}
              >
                {categoryLabels[c]} ({n})
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
            {filtered.length}{" "}
            {filtered.length === 1 ? copy.resultSingular : copy.resultPlural}
            {industry ? ` · ${copy.industryPrefix}: ${industry}` : ""}
          </span>
        </div>
      </div>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 border border-dashed border-border px-6 py-16 text-center">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.emptyKicker}
          </div>
          <div className="text-xl font-bold tracking-[-0.02em] text-foreground">
            {copy.emptyTitle}
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            {copy.emptyBody}
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-2 inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
          >
            {copy.reset}
          </button>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="mt-6 demo-gallery-grid"
        >
          {filtered.map((d) => (
            <DemoTile key={d.slug} demo={d} total={catalog.length} locale={locale} />
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
      className={`min-h-11 border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
        active
          ? "border-brand-orange bg-brand-orange text-white"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
