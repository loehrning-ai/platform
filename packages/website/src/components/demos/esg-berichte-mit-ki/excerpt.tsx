import { Fragment } from "react";
import type { EsgCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import type { DocLine, Excerpt as ExcerptData, FileLine } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

interface Group {
  readonly file: string;
  readonly items: readonly (FileLine | DocLine | "gap")[];
}

/** Consecutive lines of one file form one figure; a gap stays with its file. */
function groups(excerpt: ExcerptData): Group[] {
  const out: { file: string; items: (FileLine | DocLine | "gap")[] }[] = [];
  for (const item of excerpt) {
    const last = out.at(-1);
    if (item === "gap") {
      last?.items.push(item);
    } else if (last && last.file === item.file) {
      last.items.push(item);
    } else {
      out.push({ file: item.file, items: [item] });
    }
  }
  return out;
}

/** A CSV row breaks between fields, never inside a value: a break chance after each comma (display only). */
function Breakable({ text }: { readonly text: string }) {
  const parts = text.split(",");
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 ? (
            <>
              ,<wbr />
            </>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

const isTranscribed = (group: Group): boolean =>
  group.items.every((item) => item === "gap" || item.n === null);

interface Props {
  readonly excerpt: ExcerptData;
  readonly copy: EsgCopy["card"];
  /** Decisive lines, marked with a Rost bar once the card is checked. */
  readonly marks?: readonly { readonly file: string; readonly n: number | null }[];
  /** A line to mark with a note of its own (Monday: the invoice's supply mix). */
  readonly testId?: string;
}

/**
 * File lines exactly as in the kit, numbered as in a text editor. A grid of a
 * right-aligned number column and a text column: wrapped lines hang under the
 * text, never under the number. File lines are English in both locales.
 */
export function Excerpt({ excerpt, copy, marks = [], testId }: Props) {
  const isMarked = (line: FileLine | DocLine) =>
    marks.some((mark) => mark.file === line.file && mark.n === line.n);

  return (
    <div className="eb-excerpts" data-testid={testId}>
      {groups(excerpt).map((group, groupIndex) => (
        <figure
          key={`${group.file}-${groupIndex}`}
          className="eb-ex"
          data-transcribed={isTranscribed(group) ? "" : undefined}
          aria-label={isTranscribed(group) ? copy.transcribed(group.file) : copy.excerptOf(group.file)}
        >
          {isTranscribed(group) ? (
            <figcaption className="eb-ex-file">{copy.transcribed(group.file)}</figcaption>
          ) : (
            <figcaption className="eb-ex-file" lang="en">
              {group.file}
            </figcaption>
          )}
          <div className="eb-ex-lines">
            {group.items.map((item, index) =>
              item === "gap" ? (
                <div key={`gap-${index}`} className="eb-ln eb-ln-gap">
                  <span className="eb-ln-n" aria-hidden="true">
                    …
                  </span>
                  <span className="sr-only">{copy.gap}</span>
                </div>
              ) : (
                <div
                  key={`${item.file}-${item.n ?? "doc"}-${index}`}
                  className="eb-ln"
                  data-decisive={isMarked(item) ? "" : undefined}
                  data-line={item.n ?? undefined}
                >
                  <span className="eb-ln-n">
                    {/* A transcribed photo row has no file line: the gutter stays empty. */}
                    <span aria-hidden="true">{item.n ?? ""}</span>
                    {item.n !== null ? <span className="sr-only">{copy.line(item.n)}</span> : null}
                  </span>
                  <span className="eb-ln-t">
                    {isMarked(item) ? <span className="sr-only">{`${copy.decisive}: `}</span> : null}
                    <span lang="en">
                      <Breakable text={item.text} />
                    </span>
                  </span>
                </div>
              ),
            )}
          </div>
        </figure>
      ))}
    </div>
  );
}
