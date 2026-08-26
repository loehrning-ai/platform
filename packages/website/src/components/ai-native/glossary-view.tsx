"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TechnicalCourseFrame,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
import type { GlossaryCategory, GlossaryEntry } from "@/lib/ai-native/glossary";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";

interface CategoryGroup {
  readonly key: GlossaryCategory;
  readonly num: string;
  readonly label: string;
  readonly entries: readonly GlossaryEntry[];
}

interface Props {
  readonly groups: readonly CategoryGroup[];
  readonly totalTerms: number;
  readonly version: string;
  readonly lastUpdated: string;
  readonly locale?: Locale;
}

export function GlossaryView({
  groups,
  totalTerms,
  version,
  lastUpdated,
  locale = "de",
}: Props) {
  const copy =
    locale === "en"
      ? {
          course: "Course",
          glossary: "Glossary",
          counts: `${totalTerms} entries · ${groups.length} categories`,
          intro:
            "Definitions for the technical, organizational and regulatory terms used in the course. Terms retain established product names where translation would reduce precision.",
          placeholder: "Search: GDPR, MCP, PARA …",
          searchLabel: "Search glossary",
          clear: "Clear",
          updated: `Version ${version} · last updated ${lastUpdated}`,
          categories: "Categories",
          results: (count: number) =>
            `${count} ${count === 1 ? "result" : "results"}`,
          noResults: "No results. Try another term.",
          terms: "terms",
          footer:
            "Definitions are reviewed with the course content. This reference remains publicly accessible.",
          status: "Reference status",
        }
      : {
          course: "Kurs",
          glossary: "Glossar",
          counts: `${totalTerms} Einträge · ${groups.length} Kategorien`,
          intro:
            "Definitionen für die technischen, organisatorischen und regulatorischen Begriffe des Kurses. Etablierte Produktnamen bleiben unverändert, wenn eine Übersetzung ungenau wäre.",
          placeholder: "Suche: DSGVO, MCP, PARA …",
          searchLabel: "Glossar durchsuchen",
          clear: "Leeren",
          updated: `Version ${version} · zuletzt aktualisiert ${lastUpdated}`,
          categories: "Kategorien",
          results: (count: number) => `${count} Treffer`,
          noResults: "Keine Treffer. Versuche einen anderen Begriff.",
          terms: "Begriffe",
          footer:
            "Definitionen werden zusammen mit dem Kursinhalt geprüft. Diese Referenz bleibt frei zugänglich.",
          status: "Referenzstatus",
        };
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(groups[0]?.key ?? "");

  useEffect(() => {
    setHydrated(true);
    const onScroll = () => {
      let current = groups[0]?.key ?? "";
      for (const group of groups) {
        const element = document.getElementById(`cat-${group.key}`);
        if (element && element.getBoundingClientRect().top < 200) {
          current = group.key;
        }
      }
      setActiveCat(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [groups]);

  const allTerms = useMemo(
    () =>
      groups.flatMap((group) =>
        group.entries.map((entry) => ({ group, entry })),
      ),
    [groups],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return null;
    return allTerms.filter(
      ({ entry }) =>
        entry.term.toLowerCase().includes(normalizedQuery) ||
        entry.definition.toLowerCase().includes(normalizedQuery),
    );
  }, [query, allTerms]);

  const renderRelatedTerms = (entry: GlossaryEntry) =>
    entry.related.length > 0 ? (
      <dd className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
        →{" "}
        {entry.related.map((related, index) => (
          <span key={related}>
            <a
              href={`#term-${encodeURIComponent(related.toLowerCase())}`}
              className="border-b border-dotted border-brand-amber text-brand-amber transition-colors hover:text-brand-orange"
            >
              {related}
            </a>
            {index < entry.related.length - 1 ? ", " : ""}
          </span>
        ))}
      </dd>
    ) : null;

  return (
    <TechnicalCourseFrame courseId="ai-native-glossary" lang={locale}>
      <header className="border-y border-foreground py-6 sm:py-8">
        <nav
          aria-label={locale === "en" ? "Breadcrumb" : "Brotkrümelnavigation"}
          className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
        >
          <Link
            href={localizeHref("/ai-native", locale)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.course}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-brand-orange">{copy.glossary}</span>
        </nav>

        <div className="mt-5 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.counts}
            </p>
            <h1 className="mt-3 text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-[48px]">
              {copy.glossary}
            </h1>
            <p className="mt-4 max-w-[680px] text-sm leading-relaxed text-muted-foreground">
              {copy.intro}
            </p>
          </div>

          <aside className="min-w-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <label
              htmlFor="ai-native-glossary-search"
              className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground"
            >
              {copy.searchLabel}
            </label>
            <div
              role="search"
              className="mt-2 flex min-w-0 items-center border-y border-foreground"
            >
              <input
                id="ai-native-glossary-search"
                type="search"
                value={query}
                readOnly={!hydrated}
                aria-disabled={!hydrated}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.placeholder}
                className="min-h-12 min-w-0 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                aria-label={copy.searchLabel}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                >
                  {copy.clear}
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </header>

      <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {copy.categories}
          </p>
          <ul className="mt-2 grid border-t border-border sm:grid-cols-2 lg:grid-cols-1">
            {groups.map((group) => {
              const isActive = activeCat === group.key;
              return (
                <li key={group.key} className="border-b border-border">
                  <a
                    href={`#cat-${group.key}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "grid min-h-11 grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-2 border-l-2 px-2 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
                      isActive
                        ? "border-brand-orange text-brand-orange"
                        : "border-transparent text-foreground hover:border-brand-orange hover:text-brand-orange",
                    )}
                  >
                    <span className="text-muted-foreground">§ {group.num}</span>
                    <span className="break-words font-sans text-sm font-semibold">
                      {group.label}
                    </span>
                    <span className="text-right text-muted-foreground">
                      {group.entries.length}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0 max-w-[780px]">
          {filtered ? (
            <section aria-label={copy.searchLabel}>
              <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange"
              >
                {copy.results(filtered.length)}
              </p>
              {filtered.length === 0 ? (
                <p className="mt-5 border-y border-border py-5 text-sm text-muted-foreground">
                  {copy.noResults}
                </p>
              ) : (
                <dl className="mt-4 border-t border-foreground">
                  {filtered.map(({ group, entry }) => (
                    <div
                      key={`${group.key}-${entry.term}`}
                      id={`term-${encodeURIComponent(entry.term.toLowerCase())}`}
                      className="scroll-mt-24 border-b border-border py-4"
                    >
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        § {group.num} · {group.label}
                      </p>
                      <dt className="mt-1 font-mono text-base font-bold text-brand-orange">
                        {entry.term}
                      </dt>
                      <dd className="mt-1.5 max-w-[68ch] text-[15px] leading-relaxed text-foreground">
                        {entry.definition}
                      </dd>
                      {renderRelatedTerms(entry)}
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ) : (
            groups.map((group) => (
              <section
                key={group.key}
                id={`cat-${group.key}`}
                className="mb-10 scroll-mt-24 last:mb-0"
              >
                <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-t-2 border-brand-orange pt-4">
                  <TechnicalCourseSectionHeading
                    eyebrow={`§ ${group.num}`}
                    title={`${group.label}.`}
                  />
                  <span className="pb-1 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    {group.entries.length} {copy.terms}
                  </span>
                </div>
                <dl className="mt-4 border-t border-border">
                  {group.entries.map((entry, index) => (
                    <div
                      key={entry.term}
                      id={`term-${encodeURIComponent(entry.term.toLowerCase())}`}
                      className="grid scroll-mt-24 grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-b border-border py-4"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <dt className="break-words font-mono text-base font-bold text-brand-orange">
                          {entry.term}
                        </dt>
                        <dd className="mt-1.5 max-w-[68ch] text-[15px] leading-relaxed text-foreground">
                          {entry.definition}
                        </dd>
                        {renderRelatedTerms(entry)}
                      </div>
                    </div>
                  ))}
                </dl>
              </section>
            ))
          )}
        </div>
      </div>

      <details className="mt-10 border-y border-border">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
          {copy.status}
          <span className="text-brand-orange" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="border-t border-border py-4 text-[13px] leading-relaxed text-muted-foreground">
          <p>{copy.updated}</p>
          <p className="mt-2">{copy.footer}</p>
        </div>
      </details>
    </TechnicalCourseFrame>
  );
}

export function useGlossaryEyebrow(locale: Locale = "de") {
  return (
    <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
      {locale === "en" ? "Reference · Glossary" : "Referenz · Glossar"}
    </p>
  );
}
