import { downloadPathFor } from "@/lib/vorlagen/registry";
import { PrintSheetButton } from "../../_components/print-sheet-button";
import { QuestionSheetView } from "../../_components/question-sheet-view";
import { SHEET_SLUG } from "../post-copy";
import { Rich } from "./rich";
import { SectionHead, copyFor, type SectionProps } from "./shared";

/**
 * The sheet must stay a direct child of #fragen: the print scope in
 * post-wz.css hides every other child of the article and of this section.
 * The exercise sits in its own .wz-body so it lines up with the title column.
 */
export function Fragen({ locale, sheet, context }: SectionProps) {
  const copy = copyFor(locale).fragen;

  return (
    <section className="wz-section" id="fragen" aria-labelledby="fragen-h">
      <SectionHead id="fragen" index="03" locale={locale} />
      <div className="wz-body">
        <p className="wz-prose">
          <Rich source={copy.intro} context={context} />
        </p>
        <div className="wz-sheet-tools">
          <PrintSheetButton label={copy.print} />
          {/* A route handler serves the file, so this is a plain download link, never localized. */}
          <a
            className="wz-btn"
            href={downloadPathFor(SHEET_SLUG, locale)}
            download
            type="text/markdown"
          >
            {copy.download}
          </a>
          <span className="wz-caption">{copy.printNote}</span>
        </div>
      </div>
      <QuestionSheetView sheet={sheet} locale={locale} />
      <div className="wz-body">
        <div className="wz-task">
          <p className="wz-task__label">{copy.exerciseLabel}</p>
          <p>
            <Rich source={copy.exercise} context={context} />
          </p>
        </div>
      </div>
    </section>
  );
}
