"use client";

import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { TEST_ORDER } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { drawIn, frame, type LinkFrame } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/motion";
import { dateLine, defectOf, type Loc } from "./words";

/**
 * Where a file name may be cut. A date in a name proves nothing, so a name
 * that ends in one ("access-review_2026-08-14.csv") keeps its words and only
 * its extension is sure to stay; the date gives way first. A version or a
 * draft word ("_v4_DRAFT.md", "_FINAL.md") does matter and stays whole.
 * Otherwise the last 14 characters stay.
 */
export function tailStart(name: string): number {
  const underscore = name.lastIndexOf("_");
  const dot = name.lastIndexOf(".");
  const last = underscore > 0 ? name.slice(underscore + 1, dot > underscore ? dot : undefined) : "";
  if (dot > 0 && /^[\d-]+$/.test(last)) return dot;
  if (underscore > 0 && name.length - underscore <= 16) return underscore;
  return Math.max(0, name.length - 14);
}

/** A file name cut in the middle: the start shrinks, the tail (date or version and extension) stays. */
export function FileName({ name, className }: { readonly name: string; readonly className?: string }) {
  const cut = tailStart(name);
  return (
    <span className={`w05-fname ${className ?? ""}`} title={name}>
      <span className="w05-fname-a">{name.slice(0, cut)}</span>
      <span className="w05-fname-b">{name.slice(cut)}</span>
    </span>
  );
}

/** The link between a request and its file: drawn in, then dashed (SCHWACH) or broken (LÜCKE). Pure in its inputs. */
function Link({ draw, link, failPass }: { readonly draw: number; readonly link: LinkFrame; readonly failPass: number }) {
  const gap = 14 * link.breakT;
  return (
    <svg className="w05-link-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {link.broken ? (
        <>
          <line x1="0" y1="5" x2={Math.max(0, 50 - gap)} y2="5" className="w05-line is-gap" vectorEffect="non-scaling-stroke" />
          <line x1={Math.min(100, 50 + gap)} y1="5" x2="100" y2="5" className="w05-line is-gap" vectorEffect="non-scaling-stroke" />
        </>
      ) : (
        <line
          x1="0"
          y1="5"
          x2="100"
          y2="5"
          pathLength={100}
          className={`w05-line ${link.dashed ? "is-weak" : ""}`}
          strokeDasharray={link.dashed ? "7 5" : "100 100"}
          strokeDashoffset={link.dashed ? 0 : 100 * (1 - draw)}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {TEST_ORDER.map((test, index) => {
        const reached = link.passReached >= index;
        const failed = failPass === index && (link.dashed || link.broken);
        return (
          <rect
            key={test}
            x={30 + index * 11}
            y="7.2"
            width="7"
            height="2.8"
            className={failed ? "w05-tick is-fail" : reached ? "w05-tick is-pass" : "w05-tick"}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

interface Props {
  readonly model: Model;
  readonly copy: W05Copy;
  readonly locale: Loc;
  /** The commit beat's progress: the lines draw in. */
  readonly drawT: number;
  /** The reveal beat's progress (0 before it): the four passes. */
  readonly runT: number;
}

/** Beats 1 and 2: eight requests, eleven files, a line from each request to the file whose name fits; then the four tests. */
export function LinkStage({ model, copy, locale, drawT, runT }: Props) {
  const run = frame(
    runT,
    model.rows.map((row) => ({ failsAt: row.failsAt, status: row.status })),
  );
  const pass = run.pass;
  return (
    <div className="w05-stage w05-links" data-w05-stage="links" data-pass={pass}>
      <div className="w05-head">
        <p className="w05-head-a">{copy.caseLine}</p>
        <p className="w05-head-b">
          {pass >= 0 && pass < 4
            ? fill(copy.running, { n: pass + 1, test: copy.test[TEST_ORDER[pass] ?? "date"] })
            : fill(copy.auditLine, { exercise: formatShort(model.exercise, locale), date: formatShort(model.context.audit, locale) })}
        </p>
      </div>
      <ol className="w05-rows">
        {model.rows.map((row, index) => {
          const link = run.links[index] as LinkFrame;
          const failPass = row.failsAt ? TEST_ORDER.indexOf(row.failsAt) : -1;
          const failed = link.dashed || link.broken;
          const defect = failed || run.tallyOpacity > 0 ? defectOf(row.naive, copy, locale, true) : null;
          const draft = row.naive.doc.meta.draft && failed;
          return (
            <li
              key={row.item.id}
              className="w05-row"
              data-item={row.item.id}
              data-state={link.broken ? "gap" : link.dashed ? "weak" : run.tallyOpacity >= 1 ? row.status : "open"}
            >
              <span className="w05-req">
                <b>{row.item.id}</b> <span className="w05-req-label">{row.item.short[locale]}</span>
              </span>
              <span className="w05-link">
                <Link draw={drawIn(drawT, index)} link={link} failPass={failPass} />
                <span className="w05-verdict" style={{ opacity: link.labelOpacity }} data-status={row.status}>
                  {copy.status[row.status]}
                </span>
              </span>
              <span className={`w05-file ${failed ? "is-failed" : ""}`}>
                <FileName name={row.item.naive} className="w05-file-name" />
                <span className="w05-file-sub">
                  {defect && failed ? (
                    <span className="w05-defect" style={{ opacity: Math.max(0.35, link.defectT) }}>
                      {defect}
                    </span>
                  ) : (
                    <span className="w05-file-date">
                      {dateLine(row.naive, copy)} · {copy.type[row.naive.doc.type]}
                    </span>
                  )}
                </span>
                {draft ? (
                  <span className="w05-draft-mark" aria-hidden="true" style={{ opacity: 0.18 * link.defectT }}>
                    {copy.draftMark}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="w05-unlinked">
        <span className="w05-unlinked-count w05-chip">{fill(copy.unlinkedCount, { n: model.unlinked.length })}</span>
        <span className="w05-unlinked-files">
          <span className="w05-unlinked-label">{copy.unlinked}</span>
          {model.unlinked.map((file) => (
            <FileName key={file} name={file} className="w05-chip" />
          ))}
        </span>
      </p>
    </div>
  );
}
