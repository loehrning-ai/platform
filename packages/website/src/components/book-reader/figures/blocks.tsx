import type { ReactNode } from "react";
import {
  BarsFigure,
  DotplotFigure,
  FigureFrame,
  DumbbellFigure,
  FunnelFigure,
  LorenzFigure,
  TickerFigure,
  TilemapFigure,
  WaffleFigure,
  type DataTableSpec,
  type RegionSummary,
  type TickerSpec,
  type WaffleChip,
} from "@/components/book-figures/basic";
import { HeroFigure } from "@/components/book-figures/hero";
import {
  AiActTimeline,
  Calculator,
  IcebergScrub,
  Placement,
  SurveyLadder,
  WaterfallStory,
  type PlacementCell,
  type PlacementData,
  type StoryStep,
  type SurveyDetail,
  type TimelineStepText,
} from "@/components/book-figures/story";
import { figureKey, type Directive } from "@/lib/book-directives";
import { FigureLoadError, isPreRescan, type BookFigures } from "@/lib/book-figures";
import {
  figureTable,
  formatDecimal,
  quantityFor,
  resolveToken,
  resolveTokens,
  resolveTokensDeep,
  type FigureKind,
  type FigureSpec,
  type FigureSpecOf,
} from "@/lib/figures";
import { parseTickerRef } from "@/lib/book-reader-content";
import type { Locale } from "@/lib/i18n/locale";
import { FIGURE_ANNOTATIONS } from "./annotations";

/**
 * Server-side builders: one function per figure id turns the frozen JSON of
 * the book (and its copy file) into the right island. Everything that is
 * text or a number comes from content/books/<slug>/figures; no figure reads
 * the fixtures of the story islands (those are for the island tests only).
 */

interface BlockContext {
  readonly figures: BookFigures;
  readonly bookSlug: string;
  readonly locale: Locale;
  /** Public folder of the CSV files. */
  readonly dataBase: string;
}

type Builder = (ctx: BlockContext) => ReactNode;

function spec<K extends FigureKind>(ctx: BlockContext, id: string, kind: K): FigureSpecOf<K> {
  const found = ctx.figures.specs.get(id);
  if (!found) throw new FigureLoadError(`${ctx.bookSlug}: figure "${id}" has no JSON in content/books/${ctx.bookSlug}/figures`);
  if (found.kind !== kind) throw new FigureLoadError(`${ctx.bookSlug}: figure "${id}" is a ${found.kind}, expected ${kind}`);
  return found as FigureSpecOf<K>;
}

/** The figure's own annotation, with number tokens resolved. */
function annotated<S extends FigureSpec>(ctx: BlockContext, figure: S): S {
  const note = FIGURE_ANNOTATIONS[figure.id.toLowerCase()];
  if (!note) return figure;
  return { ...figure, annotation: { id: note.id, text: resolveTokens(note.text, ctx.figures.lookup, ctx.locale) } };
}

function copyOf<T>(ctx: BlockContext, id: string): T {
  const raw = ctx.figures.copy.get(id);
  if (raw === undefined) throw new FigureLoadError(`${ctx.bookSlug}: figures/copy/${id}.json is missing`);
  return resolveTokensDeep(raw as T, ctx.figures.lookup, ctx.locale);
}

const csvHref = (ctx: BlockContext, id: string): string | undefined =>
  ctx.figures.specs.has(id) ? `${ctx.dataBase}/${id}.csv` : undefined;

const tag = (figure: FigureSpec | undefined): boolean => isPreRescan(figure);

/* ---------------------------------------------------------------- builders */

const c3: Builder = (ctx) => {
  const waffle = spec(ctx, "c3", "waffle");
  const evidence = spec(ctx, "c3-evidence", "bars");
  // The two readings of "konkret" are nested: the broad one contains the narrow one.
  const narrow = waffle.data.groups.find((g) => g.id === "narrow")?.dots ?? 0;
  const broad = narrow + (waffle.data.groups.find((g) => g.id === "broad")?.dots ?? 0);
  const chips: WaffleChip[] = [
    { id: "narrow", label: "Enge Lesart", dots: narrow },
    { id: "broad", label: "Weite Lesart", dots: broad },
  ];
  const tables: DataTableSpec[] = [waffle, evidence].map((s) => ({
    title: s.title,
    table: figureTable(s),
    fileStem: s.id,
    href: `${ctx.dataBase}/${s.id}.csv`,
  }));
  return <WaffleFigure spec={waffle} chips={chips} tables={tables} provisional={tag(waffle)} />;
};

const c4: Builder = (ctx) => {
  const waterfall = annotated(ctx, spec(ctx, "c4", "waterfall"));
  const { steps } = copyOf<{ steps: StoryStep[] }>(ctx, "c4");
  if (steps.length !== (waterfall.steps?.length ?? 0)) {
    throw new FigureLoadError(`${ctx.bookSlug}: figures/copy/c4.json has ${steps.length} steps, the figure has ${waterfall.steps?.length ?? 0}`);
  }
  return <WaterfallStory spec={waterfall} steps={steps} provisional={tag(waterfall)} csvHref={csvHref(ctx, "c4")} />;
};

const bars =
  (id: string): Builder =>
  (ctx) => {
    const figure = annotated(ctx, spec(ctx, id, "bars"));
    return <BarsFigure spec={figure} provisional={tag(figure)} dataBase={ctx.dataBase} />;
  };

const c6: Builder = (ctx) => {
  const figure = annotated(ctx, spec(ctx, "c6", "dotplot"));
  return <DotplotFigure spec={figure} provisional={tag(figure)} dataBase={ctx.dataBase} />;
};

const c7: Builder = (ctx) => {
  const figure = spec(ctx, "c7", "tilemap");
  const copy = copyOf<{ regions: { id: "ost" | "west"; label: string; ref: string }[] }>(ctx, "c7");
  const regions: RegionSummary[] = copy.regions.map((region) => {
    const q = quantityFor(figure, region.ref);
    if (!q || q.lo === undefined || q.hi === undefined || q.n === undefined) {
      throw new FigureLoadError(`${ctx.bookSlug}: c7 needs value, lo, hi and n for "${region.ref}" in meta.values`);
    }
    return { id: region.id, label: region.label, value: q.value, lo: q.lo, hi: q.hi, n: q.n };
  });
  return <TilemapFigure spec={figure} regions={regions} provisional={tag(figure)} dataBase={ctx.dataBase} />;
};

const c8: Builder = (ctx) => {
  const figure = annotated(ctx, spec(ctx, "c8", "funnel"));
  return <FunnelFigure spec={figure} provisional={tag(figure)} dataBase={ctx.dataBase} />;
};

const c10: Builder = (ctx) => {
  const lorenz = spec(ctx, "c10", "lorenz");
  const shares = spec(ctx, "c10-bars", "bars");
  return <LorenzFigure spec={lorenz} bars={shares} provisional={tag(lorenz)} dataBase={ctx.dataBase} />;
};

const c11: Builder = (ctx) => {
  const figure = annotated(ctx, spec(ctx, "c11", "dumbbell"));
  const { aLabel, bLabel, reference } = figure.data;
  const details: Record<string, string> = {};
  for (const row of figure.data.rows) {
    const a = row.a === null ? "weniger als 5 Treffer, deshalb ohne Wert" : formatDecimal(row.a, 0);
    const b = row.b === null ? "weniger als 5 Treffer, deshalb ohne Wert" : formatDecimal(row.b, 0);
    details[row.id] = `${row.label}: ${aLabel} ${a}. ${bLabel} ${b}.${reference ? ` ${reference.label}.` : ""}`;
  }
  return <DumbbellFigure spec={figure} details={details} provisional={tag(figure)} dataBase={ctx.dataBase} />;
};

const c1: Builder = (ctx) => {
  const base = spec(ctx, "c1", "ladder");
  // Our own measure on the ladder is the weighted headline of C4, never a second copy of the number.
  const headline = ctx.figures.specs.get("c4");
  const q = headline ? quantityFor(headline, "weighted_share") : undefined;
  const ladder: FigureSpecOf<"ladder"> =
    base.data.ours && q && q.lo !== undefined && q.hi !== undefined
      ? { ...base, data: { ...base.data, ours: { ...base.data.ours, value: q.value, lo: q.lo, hi: q.hi } } }
      : base;
  const details = copyOf<{ details: SurveyDetail[] }>(ctx, "c1").details;
  return <SurveyLadder spec={ladder} details={details} provisional={tag(headline)} csvHref={csvHref(ctx, "c1")} />;
};

const c2: Builder = (ctx) => {
  return <IcebergScrub spec={spec(ctx, "c2", "iceberg")} csvHref={csvHref(ctx, "c2")} />;
};

const c12: Builder = (ctx) => {
  const timeline = spec(ctx, "c12", "timeline");
  const texts = copyOf<{ steps: TimelineStepText[] }>(ctx, "c12").steps;
  return <AiActTimeline spec={timeline} stepTexts={texts} provisional={tag(timeline)} csvHref={csvHref(ctx, "c12")} />;
};

const c13: Builder = (ctx) => <Calculator csvHref={csvHref(ctx, "c13")} />;

/** Builds the lookup data of the C14 placement from the dotplot JSON (ids group__region). */
export function placementFrom(figure: FigureSpecOf<"dotplot">, regionNotes: Readonly<Record<string, string>>): PlacementData {
  const items = new Map(figure.data.items.map((item) => [item.id, item]));
  const parts = figure.data.items.map((item) => {
    const [group = "", region = ""] = item.id.split("__");
    return { item, group, region };
  });
  const cut = (label: string, suffix: RegExp): string => label.replace(suffix, "").trim();
  const industries = parts
    .filter((p) => p.region === "alle" && p.group !== "alle")
    .map((p) => ({ id: p.group, label: cut(p.item.label, /, alle Regionen$/) }));
  const regions = parts
    .filter((p) => p.group === "alle" && p.region !== "alle")
    .map((p) => ({
      id: p.region,
      label: cut(p.item.label, /^Alle Branchen, /),
      note: regionNotes[p.region] ?? "",
    }));
  const cells: Record<string, PlacementCell> = {};
  for (const { item, group, region } of parts) {
    if (group === "alle") continue;
    const key = `${group}|${region === "alle" ? "all" : region}`;
    const few = item.value === null || item.value === undefined;
    cells[key] = few
      ? { n: item.n ?? null, hits: null, value: null, lo: null, hi: null }
      : {
          n: item.n ?? null,
          hits: Math.round(((item.value as number) / 100) * (item.n ?? 0)),
          value: item.value as number,
          lo: item.lo ?? null,
          hi: item.hi ?? null,
        };
  }
  const total = items.get("alle__alle");
  if (!total || total.value === null || total.lo === undefined || total.hi === undefined || total.n === undefined) {
    throw new FigureLoadError("c14: the item alle__alle needs value, lo, hi and n");
  }
  return {
    industries,
    regions,
    cells,
    overall: { value: total.value, lo: total.lo, hi: total.hi, n: total.n },
    asOf: figure.asOf,
    source: figure.source,
  };
}

const c14: Builder = (ctx) => {
  const figure = spec(ctx, "c14", "dotplot");
  const notes = copyOf<{ regionNotes: Record<string, string> }>(ctx, "c14").regionNotes;
  return <Placement data={placementFrom(figure, notes)} provisional={tag(figure)} csvHref={csvHref(ctx, "c14")} />;
};

const BUILDERS: Readonly<Record<string, Builder>> = {
  c1,
  c2,
  c3,
  c4,
  c5: bars("c5"),
  c6,
  c7,
  c8,
  c9: bars("c9"),
  c10,
  c11,
  c12,
  c13,
  c14,
  "c3-evidence": bars("c3-evidence"),
  "c10-bars": bars("c10-bars"),
};

/** Figure ids the reader can place. Exported for the coverage test. */
export const PLACEABLE_FIGURES: readonly string[] = Object.keys(BUILDERS);

/** The big opening number of a chapter, built from a number token. */
function ticker(ctx: BlockContext, directive: Directive): ReactNode {
  const ref = parseTickerRef(directive.attrs["ref"] as string);
  const figure = ref ? ctx.figures.specs.get(ref.figure.toLowerCase()) : undefined;
  if (!ref || !figure) throw new FigureLoadError(`${directive.source}: ref must name a known figure and key`);
  const q = quantityFor(figure, ref.key);
  if (!q) throw new FigureLoadError(`${directive.source}: ${figure.id} has no key "${ref.key}"`);
  // Throws for a suppressed value, like every other token.
  resolveToken(figure, ref.key, "value", undefined, ctx.locale);
  const spec: TickerSpec = {
    id: `${figure.id}-${ref.key}`.replace(/[^a-z0-9_-]/gi, "-"),
    title: directive.attrs["title"] ?? figure.title,
    value: q.value,
    fmt: q.fmt,
    tail: directive.attrs["tail"] as string,
    interval: q.lo !== undefined && q.hi !== undefined ? [q.lo, q.hi] : undefined,
    n: q.n ?? figure.n,
    nNote: q.n === undefined ? figure.nNote : undefined,
    source: figure.source,
    asOf: figure.asOf,
    limitation: figure.limitation,
  };
  return <TickerFigure spec={spec} provisional={tag(figure)} />;
}

/**
 * A figure of the insight spine has no dedicated builder: the generic hero
 * island draws it from its JSON. Inside the pinned stage (attrs.stage) it draws
 * bare, because the shell prints numeral, claim, unit line and source line, and
 * attrs.variants lists the detent id per step ("s1,s3,,s10"; an empty entry
 * keeps the reader's choice). Outside a stage it sits in the figure frame with
 * caption, visible source line, the data table and the CSV link.
 */
function heroIsland(ctx: BlockContext, directive: Directive, id: string): ReactNode {
  const found = ctx.figures.specs.get(id);
  if (!found) throw new FigureLoadError(`${ctx.bookSlug}: figure "${id}" has no JSON in content/books/${ctx.bookSlug}/figures`);
  const inStage = directive.attrs["stage"] === "true";
  const listed = directive.attrs["variants"];
  const stepVariants = inStage && listed ? listed.split(",").map((entry) => (entry.trim() === "" ? undefined : entry.trim())) : undefined;
  const island = <HeroFigure spec={found} bare={inStage} stepVariants={stepVariants} lang={ctx.locale} />;
  if (inStage) return island;
  const tables: DataTableSpec[] = [{ title: found.title, table: figureTable(found), fileStem: found.id, href: `${ctx.dataBase}/${found.id}.csv` }];
  return (
    <FigureFrame meta={found} kind={found.kind} tables={tables}>
      {island}
    </FigureFrame>
  );
}

/** Renders the node for one directive of a chapter. */
export function renderDirective(ctx: BlockContext, directive: Directive): ReactNode {
  if (directive.name === "ticker") return ticker(ctx, directive);
  const id = figureKey(directive.attrs["id"] as string);
  const build = BUILDERS[id];
  if (!build) {
    if (ctx.figures.specs.has(id)) return heroIsland(ctx, directive, id);
    throw new FigureLoadError(`${ctx.bookSlug}: no island for ::figure{id="${directive.attrs["id"]}"}. Known: ${[...PLACEABLE_FIGURES, ...ctx.figures.specs.keys()].join(", ")}`);
  }
  return build(ctx);
}

export function blockContext(figures: BookFigures, locale: Locale): BlockContext {
  return { figures, bookSlug: figures.bookSlug, locale, dataBase: `/books/${figures.bookSlug}/data` };
}
