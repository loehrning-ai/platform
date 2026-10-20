import type { ReactNode } from "react";
import { sourceLineFieldsOf } from "@/components/book-figures/shared/source-line";
import type { ChapterSegment } from "@/components/book-reader/chapter-markdown";
import { ChapterStage } from "@/components/book-reader/stage/chapter-stage";
import { stripFit } from "@/components/book-reader/stage/strip-fit";
import { stageCopyProblems, type StageStepCopy } from "@/components/book-reader/stage/stage-protocol";
import { Explorer } from "@/components/book-reader/explorer/explorer";
import { figureKey, type Directive } from "@/lib/book-directives";
import { FigureLoadError, loadBookFigures, type BookFigures } from "@/lib/book-figures";
import { loadExplorerModel } from "@/lib/explorer/load";
import { resolveTokensDeep } from "@/lib/figures";
import type { Locale } from "@/lib/i18n/locale";
import { blockContext, renderDirective } from "./blocks";

/**
 * One node per segment of a chapter: the figure for a directive segment, null
 * for a text run. This module is the only importer of the island builders, and
 * the chapter page loads it with a dynamic import, so the islands are bundled
 * and shipped only for chapters that hold a figure line.
 *
 * Three directives are placed here:
 *   ::figure{id}   a finite figure inside the text column (the islands of blocks.tsx)
 *   ::stage{id}    the chapter's hero figure inside the pinned stage; the island builder gets
 *                  attrs.stage = "true" (draw bare) and attrs.variants (detent id per step)
 *   ::explorer{}   the placement instrument "Wo stehe ich?"
 */

interface StageCopyFile {
  readonly stage?: { readonly steps?: readonly Partial<StageStepCopy>[] };
}

/** The steps of a stage: figures/copy/<id>.json `stage.steps`, tokens resolved; the spec's own step labels as a fallback. */
function stageSteps(figures: BookFigures, id: string, locale: Locale): StageStepCopy[] {
  const spec = figures.specs.get(id);
  if (!spec) throw new FigureLoadError(`${figures.bookSlug}: ::stage{id="${id}"} has no JSON in content/books/${figures.bookSlug}/figures`);
  // The step cards are words, so an English chapter reads figures/copy/<id>.en.json when it exists.
  const raw = (locale === "en" ? figures.copy.get(`${id}.en`) : undefined) ?? figures.copy.get(id);
  const copy = raw === undefined ? undefined : resolveTokensDeep(raw as StageCopyFile, figures.lookup, locale);
  const fromCopy = copy?.stage?.steps;
  const steps: StageStepCopy[] = fromCopy
    ? fromCopy.map((step, i) => ({
        id: step.id ?? `s${i + 1}`,
        label: step.label ?? step.text ?? `Schritt ${i + 1}`,
        text: step.text ?? "",
        numeral: step.numeral,
        claim: step.claim,
        unit: step.unit,
        variant: step.variant,
      }))
    : (spec.steps ?? []).map((step) => ({ id: step.id, label: step.label, text: step.label }));
  if (steps.length === 0) {
    steps.push({ id: "s1", label: spec.title, text: spec.caption });
  }
  const problems = stageCopyProblems(steps);
  if (problems.length > 0) {
    throw new FigureLoadError(`${figures.bookSlug}: stage "${id}": ${problems.join("; ")}`);
  }
  return steps;
}

function buildStage(figures: BookFigures, locale: Locale, directive: Directive): ReactNode {
  const id = figureKey(directive.attrs["id"] as string);
  const steps = stageSteps(figures, id, locale);
  const spec = figures.specs.get(id);
  if (!spec) throw new FigureLoadError(`${figures.bookSlug}: ::stage{id="${id}"} has no JSON`);
  const ctx = blockContext(figures, locale);
  // The island learns it sits in a stage from attrs.stage: it draws without numeral and claim (the shell prints them).
  // attrs.variants lists the detent id per step ("roh,,10-stufen": an empty entry keeps the reader's choice).
  const variants = steps.map((step) => step.variant ?? "");
  const attrs: Record<string, string> = { id, stage: "true" };
  if (variants.some(Boolean)) attrs["variants"] = variants.join(",");
  const island = renderDirective(ctx, { name: "figure", attrs, source: directive.source });
  return (
    <ChapterStage
      id={id}
      label={spec.title}
      steps={steps}
      source={sourceLineFieldsOf(spec)}
      locale={locale === "en" ? "en" : "de"}
      csv={[{ href: `${ctx.dataBase}/${spec.id}.csv`, label: "Daten als CSV", fileName: `${spec.id}.csv` }]}
      strip={stripFit(spec)}
    >
      {island}
    </ChapterStage>
  );
}

export async function buildChapterFigureBlocks(
  bookSlug: string,
  locale: Locale,
  segments: readonly ChapterSegment[],
): Promise<(ReactNode | null)[]> {
  const figures = await loadBookFigures(bookSlug);
  const ctx = blockContext(figures, locale);
  const needsExplorer = segments.some((segment) => segment.kind === "directive" && segment.directive.name === "explorer");
  const model = needsExplorer ? await loadExplorerModel(bookSlug, undefined, locale === "en" ? "en" : "de") : null;
  return segments.map((segment) => {
    if (segment.kind !== "directive") return null;
    if (segment.directive.name === "stage") return buildStage(figures, locale, segment.directive);
    if (segment.directive.name === "explorer") return model ? <Explorer model={model} locale={locale === "en" ? "en" : "de"} /> : null;
    return renderDirective(ctx, segment.directive);
  });
}
