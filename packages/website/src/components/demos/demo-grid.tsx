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
  getDemoIndustries,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";
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
  const atlasRef = useRef<HTMLDivElement | null>(null);
  const copy = DEMOS_PAGE_COPY[locale].catalog;
  const levelLabels = DEMO_LEVEL_LABELS_BY_LOCALE[locale];
  const categoryLabels = DEMO_CATEGORY_LABELS[locale];
  const industries = useMemo(() => getDemoIndustries(locale), [locale]);

  // The server resolves and validates URL filters before rendering so the
  // complete filtered gallery exists without JavaScript. Chip clicks remain
  // local React state and sync through the History API — NOT router.replace,
  // which on the mobile/WebKit profile scrolls the page to the top even with
  // scroll:false (a measured 405px jump).
  const [level, setLevel] = useState<string>(initialFilters.level);
  const [cat, setCat] = useState<string>(initialFilters.category);
  const [industry, setIndustry] = useState<string>(initialFilters.industry);

  const filtered = useMemo<readonly Demo[]>(
    () =>
      catalog.filter((demo) => {
        if (cat && cat !== "Alle" && demo.category !== cat) return false;
        if (level && level !== "alle" && demo.level !== level) return false;
        if (industry && !demo.industries.includes(industry)) return false;
        return true;
      }),
    [catalog, level, cat, industry],
  );
  const isFiltered = level !== "alle" || cat !== "Alle" || Boolean(industry);

  useEffect(() => {
    trackDemoFilter(cat, level, industry || "alle");
  }, [cat, level, industry]);

  const syncUrl = useCallback(
    (nextLevel: string, nextCat: string, nextIndustry: string) => {
      if (typeof window === "undefined") return;
      const sp = new URLSearchParams();
      if (nextLevel && nextLevel !== "alle") sp.set("level", nextLevel);
      if (nextCat && nextCat !== "Alle") sp.set("cat", nextCat);
      if (nextIndustry) sp.set("industry", nextIndustry);
      const qs = sp.toString();
      // History API updates the URL (deep-link / share) without a Next
      // navigation, so the scroll position is left untouched.
      const catalogPath = localizeHref("/demos", locale);
      window.history.replaceState(
        null,
        "",
        qs ? `${catalogPath}?${qs}` : catalogPath,
      );
      notifyUrlStateChanged();
    },
    [locale],
  );

  const setParam = useCallback(
    (key: "level" | "cat" | "industry", value: string, fallback: string) => {
      const resolved = value || fallback;
      if (key === "level") {
        setLevel(resolved);
        syncUrl(resolved, cat, industry);
      } else if (key === "cat") {
        setCat(resolved);
        syncUrl(level, resolved, industry);
      } else {
        setIndustry(resolved);
        syncUrl(level, cat, resolved);
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
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const atlas = atlasRef.current;
      if (!atlas) return;

      if (e.key === "/") {
        e.preventDefault();
        const firstChip =
          atlas.querySelector<HTMLButtonElement>("[data-filter-chip]");
        firstChip?.focus();
        return;
      }
      if (e.key === "Escape") {
        clearAll();
        return;
      }
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        const tiles = Array.from(
          atlas.querySelectorAll<HTMLElement>("[data-demo-tile]"),
        );
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
    <div ref={atlasRef} data-demo-atlas>
      <div
        className="border border-foreground/60 bg-card"
        data-demo-filter-console
      >
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
          <p
            role="status"
            aria-live="polite"
            className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground"
          >
            <span className="text-brand-orange tabular-nums">
              {String(filtered.length).padStart(2, "0")}
            </span>{" "}
            {filtered.length === 1 ? copy.resultSingular : copy.resultPlural}
            {industry ? ` · ${copy.industryPrefix}: ${industry}` : ""}
          </p>
          {isFiltered && filtered.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex min-h-11 items-center border border-border bg-background px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground outline-none transition-[background-color,border-color,color] duration-150 hover:border-brand-orange hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange motion-reduce:transition-none"
            >
              {copy.reset}
            </button>
          ) : null}
        </div>

        <div className="grid divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <FilterRow
            label={copy.level}
            mobileControl={
              <select
                data-filter-select="level"
                aria-label={copy.level}
                value={level}
                onChange={(event) =>
                  setParam("level", event.currentTarget.value, "alle")
                }
                className="min-h-11 w-full border border-border bg-background px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <option value="alle">
                  {copy.all} ({catalog.length})
                </option>
                {DEMO_LEVELS.map((item) => {
                  const count = catalog.filter(
                    (demo) => demo.level === item,
                  ).length;
                  return (
                    <option key={item} value={item}>
                      {levelLabels[item]} ({count})
                    </option>
                  );
                })}
              </select>
            }
          >
            <Chip
              active={level === "alle"}
              onClick={() => setParam("level", "alle", "alle")}
            >
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

          <FilterRow
            label={copy.category}
            mobileControl={
              <select
                data-filter-select="category"
                aria-label={copy.category}
                value={cat}
                onChange={(event) =>
                  setParam("cat", event.currentTarget.value, "Alle")
                }
                className="min-h-11 w-full border border-border bg-background px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <option value="Alle">{copy.all}</option>
                {DEMO_CATEGORIES.map((item) => {
                  const count = catalog.filter(
                    (demo) => demo.category === item,
                  ).length;
                  if (count === 0) return null;
                  return (
                    <option key={item} value={item}>
                      {categoryLabels[item]} ({count})
                    </option>
                  );
                })}
              </select>
            }
          >
            <Chip
              active={cat === "Alle"}
              onClick={() => setParam("cat", "Alle", "Alle")}
            >
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

          <FilterRow
            label={copy.industryPrefix}
            mobileControl={
              <select
                data-filter-select="industry"
                aria-label={copy.industryPrefix}
                value={industry}
                onChange={(event) =>
                  setParam("industry", event.currentTarget.value, "")
                }
                className="min-h-11 w-full border border-border bg-background px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <option value="">{copy.all}</option>
                {industries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            }
          />
        </div>
      </div>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-3 border border-border border-l-[3px] border-l-brand-orange px-4 py-6">
          <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
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
            className="inline-flex min-h-11 items-center gap-2 border border-brand-orange bg-brand-orange px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white hover:border-foreground hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {copy.reset}
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-flow-row-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:auto-rows-[minmax(16rem,auto)] lg:grid-cols-4">
          {/* grid-flow-row-dense is a safety net for FILTERED subsets, not the
              mechanism. The unfiltered catalog packs exactly (see the tiling
              invariant in lib/demos.ts), so dense changes nothing in the
              default view. An arbitrary filtered subset can leave a span-area
              that no four-column packing closes; dense backfills those gaps
              instead of leaving visible holes. DOM order stays catalog order,
              so reading and tab order are unaffected. */}
          {filtered.map((d) => (
            <DemoTile
              key={d.slug}
              demo={d}
              total={catalog.length}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
  mobileControl,
}: {
  label: string;
  // Omitted for a select-only row (e.g. industry, with too many distinct
  // values for a readable chip row): the control then shows at every width
  // instead of only below sm.
  children?: React.ReactNode;
  mobileControl?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4" role="group" aria-label={label}>
      <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}:
      </span>
      {children ? (
        <>
          {mobileControl ? <div className="sm:hidden">{mobileControl}</div> : null}
          <div
            className={`flex flex-wrap gap-1.5 ${mobileControl ? "hidden sm:flex" : ""}`}
          >
            {children}
          </div>
        </>
      ) : (
        mobileControl
      )}
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
      className={`min-h-11 border px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] outline-none transition-[background-color,border-color,color] duration-150 focus-visible:ring-2 focus-visible:ring-brand-orange motion-reduce:transition-none ${
        active
          ? "border-brand-orange bg-brand-orange text-white"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
