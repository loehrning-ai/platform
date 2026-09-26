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
import { BUTTON_CLASSES, cx, FILTER_CHIP_CLASS } from "@/components/werk";
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

  const selectClass =
    "min-h-11 w-full rounded-none border border-border bg-background px-3 text-label text-foreground";

  return (
    <div ref={atlasRef} data-demo-atlas>
      <div data-demo-filter-console>
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-2 border-foreground pt-4">
          <h2
            id="demo-gallery-heading"
            className="text-fluid-h2 font-bold text-foreground"
          >
            {copy.galleryHeading}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4">
            <p
              role="status"
              aria-live="polite"
              className="text-caption text-muted-foreground tabular-nums"
            >
              {filtered.length}{" "}
              {filtered.length === 1 ? copy.resultSingular : copy.resultPlural}
              {industry ? ` · ${copy.industryPrefix}: ${industry}` : ""}
            </p>
            {isFiltered && filtered.length > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className={BUTTON_CLASSES.paper.text}
              >
                {copy.reset}
              </button>
            ) : null}
          </div>
        </header>

        <div className="mt-4 border-b border-hairline">
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
                className={selectClass}
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
                className={selectClass}
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
                className={cx(selectClass, "sm:max-w-xs")}
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
        <div className="mt-8 flex max-w-[64ch] flex-col items-start gap-3 border-b border-hairline pb-8">
          <h3 className="text-fluid-h3 font-bold text-foreground">
            {copy.emptyTitle}
          </h3>
          <p className="text-body text-muted-foreground">{copy.emptyBody}</p>
          <button
            type="button"
            onClick={clearAll}
            className={BUTTON_CLASSES.paper.ink}
          >
            {copy.reset}
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Uniform 3/2/1 grid (blueprint 6.14): no spans, no tile borders,
              whitespace between tiles. Works for any filtered subset. */}
          {filtered.map((d) => (
            <DemoTile key={d.slug} demo={d} locale={locale} />
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
    <div
      className="grid min-w-0 gap-2 border-t border-hairline py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-4"
      role="group"
      aria-label={label}
    >
      <span className="text-label text-muted-foreground">{label}</span>
      {/* Below sm the select stands in for the chips; the hidden one takes
          no grid cell, so the label column pairs with whichever is shown. */}
      {children ? (
        <>
          {mobileControl ? (
            <div className="min-w-0 sm:hidden">{mobileControl}</div>
          ) : null}
          <div
            className={
              mobileControl
                ? "hidden min-w-0 flex-wrap gap-2 sm:flex"
                : "flex min-w-0 flex-wrap gap-2"
            }
          >
            {children}
          </div>
        </>
      ) : (
        <div className="min-w-0">{mobileControl}</div>
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
      className={cx(FILTER_CHIP_CLASS, "tabular-nums")}
    >
      {children}
    </button>
  );
}
