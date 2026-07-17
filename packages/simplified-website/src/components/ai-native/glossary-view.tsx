"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";
import {
  type GlossaryCategory,
  type GlossaryEntry,
} from "@/lib/ai-native/glossary";
import { cn } from "@/lib/utils";

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
}

export function GlossaryView({ groups, totalTerms, version, lastUpdated }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(groups[0]?.key ?? "");

  /* Scroll-spy to sync sidebar */
  useEffect(() => {
    const onScroll = () => {
      let current = groups[0]?.key ?? "";
      for (const g of groups) {
        const el = document.getElementById(`cat-${g.key}`);
        if (el && el.getBoundingClientRect().top < 200) current = g.key;
      }
      setActiveCat(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [groups]);

  const allTerms = useMemo(
    () => groups.flatMap((g) => g.entries.map((e) => ({ group: g, entry: e }))),
    [groups],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allTerms.filter(
      ({ entry }) =>
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q),
    );
  }, [query, allTerms]);

  return (
    <>
      {/* Hero */}
      <section className="border-b-[1px] border-foreground py-16 md:py-20">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
            <nav
              aria-label="Breadcrumb"
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              <Link href="/ai-native" className="hover:text-brand-orange">
                Kurs
              </Link>
              <span className="mx-2 opacity-40">/</span>
              <span className="text-brand-orange">Glossar</span>
            </nav>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {totalTerms} Einträge · {groups.length} Kategorien
            </span>
          </div>
          <ClipHeading
            as="h1"
            className="font-bold leading-[0.92] tracking-[-0.04em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
          >
            Glossar.
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-5 max-w-[640px] text-[18px] leading-[1.6] text-muted-foreground">
              Die Begriffe, die im AI-Native Arbeitskurs fallen, kurz, scharf,
              ohne Beratungs-Floskel. Referenz-Ressource. Verlinke was du
              brauchst.
            </p>
          </FadeBlock>
          <FadeBlock delay={2}>
            <div className="mt-10 flex max-w-[480px] items-center gap-2 border-b border-foreground">
              <span className="pr-1 font-mono text-[12px] font-bold tracking-[0.12em] text-brand-orange">
                ⌕
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche: DSGVO, MCP, PARA …"
                className="flex-1 bg-transparent py-3 text-[16px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-orange"
                aria-label="Glossar durchsuchen"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand-orange"
                >
                  Clear
                </button>
              )}
            </div>
          </FadeBlock>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Version {version} · zuletzt aktualisiert {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-18">
            {/* Sidebar — sticky on lg+ */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Kategorien
              </p>
              <ul className="grid gap-1.5">
                {groups.map((g) => {
                  const isActive = activeCat === g.key;
                  return (
                    <li key={g.key}>
                      <a
                        href={`#cat-${g.key}`}
                        aria-current={isActive ? "location" : undefined}
                        className={cn(
                          "grid grid-cols-[28px_1fr_auto] items-baseline gap-2.5 border-l-2 py-2 pl-3 transition-colors",
                          isActive
                            ? "border-brand-orange text-brand-orange"
                            : "border-transparent text-foreground hover:text-brand-orange",
                        )}
                      >
                        <span
                          className={cn(
                            "font-mono text-[10px] font-bold tracking-[0.12em]",
                            isActive ? "text-brand-orange" : "text-muted-foreground",
                          )}
                        >
                          § {g.num}
                        </span>
                        <span className="text-[14px] font-semibold">
                          {g.label}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {g.entries.length}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Terms */}
            <div className="max-w-[760px]">
              {filtered ? (
                <div>
                  <p
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="mb-5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange"
                  >
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "Treffer" : "Treffer"}
                  </p>
                  {filtered.length === 0 ? (
                    <p className="text-[15px] text-muted-foreground">
                      Keine Treffer. Versuche einen anderen Begriff.
                    </p>
                  ) : (
                    <dl className="grid gap-6">
                      {filtered.map(({ group, entry }) => (
                        <div
                          key={`${group.key}-${entry.term}`}
                          id={`term-${encodeURIComponent(entry.term.toLowerCase())}`}
                          className="border-t border-dashed border-border pt-4 scroll-mt-24"
                        >
                          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            § {group.num} · {group.label}
                          </p>
                          <dt className="mt-1.5 font-mono text-[17px] font-bold text-brand-orange">
                            {entry.term}
                          </dt>
                          <dd className="mt-2 max-w-[64ch] text-[15.5px] leading-[1.65] text-foreground">
                            {entry.definition}
                          </dd>
                          {entry.related.length > 0 && (
                            <dd className="mt-2 font-mono text-[12px] text-muted-foreground">
                              →{" "}
                              {entry.related.map((rel, i) => (
                                <span key={rel}>
                                  <a
                                    href={`#term-${encodeURIComponent(rel.toLowerCase())}`}
                                    className="border-b border-dotted border-brand-amber text-brand-amber transition-colors hover:text-brand-orange"
                                  >
                                    {rel}
                                  </a>
                                  {i < entry.related.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </dd>
                          )}
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ) : (
                groups.map((g) => (
                  <section
                    key={g.key}
                    id={`cat-${g.key}`}
                    className="mb-20 scroll-mt-24"
                  >
                    <div className="mb-6 flex flex-wrap items-baseline gap-5 border-t-[3px] border-brand-orange pt-4">
                      <span className="font-mono text-[12px] font-bold tracking-[0.14em] text-brand-orange">
                        § {g.num}
                      </span>
                      <h2
                        className="font-bold leading-none tracking-[-0.035em] text-foreground"
                        style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
                      >
                        {g.label}.
                      </h2>
                      <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {g.entries.length} Begriffe
                      </span>
                    </div>
                    <dl className="grid gap-0">
                      {g.entries.map((entry, i) => (
                        <div
                          key={entry.term}
                          id={`term-${encodeURIComponent(entry.term.toLowerCase())}`}
                          className={cn(
                            "grid grid-cols-[auto_1fr] gap-7 pb-5 scroll-mt-24",
                            i < g.entries.length - 1 &&
                              "mb-5 border-b border-border",
                          )}
                        >
                          <span className="pt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <dt className="font-mono text-[17px] font-bold text-brand-orange">
                              {entry.term}
                            </dt>
                            <dd className="mt-2 max-w-[64ch] text-[15.5px] leading-[1.65] text-foreground">
                              {entry.definition}
                            </dd>
                            {entry.related.length > 0 && (
                              <dd className="mt-2 font-mono text-[12px] text-muted-foreground">
                                →{" "}
                                {entry.related.map((rel, j) => (
                                  <span key={rel}>
                                    <a
                                      href={`#term-${encodeURIComponent(rel.toLowerCase())}`}
                                      className="border-b border-dotted border-brand-amber text-brand-amber transition-colors hover:text-brand-orange"
                                    >
                                      {rel}
                                    </a>
                                    {j < entry.related.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </dd>
                            )}
                          </div>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-[960px] px-6 text-[13px] text-muted-foreground lg:px-12">
          Begriffe und Definitionen werden bei inhaltlichen Kursupdates
          ergänzt. Diese Referenz bleibt frei zugänglich.
        </div>
      </footer>
    </>
  );
}

export function useGlossaryEyebrow() {
  return <Eyebrow>Referenz · Glossar</Eyebrow>;
}
