"use client";

import { itemById } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { GENERIC_ITEM_IDS } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/classify";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import { FileName } from "./stage-links";
import type { OwnFolder } from "./use-own-folder";
import { filesLabel, type Loc } from "./words";

/** Beat 7: the visitor's own folder, item by item, at most "höchstens SCHWACH" or "OFFEN", never BELEGT. */
export function OwnStage({ own, copy, locale }: { readonly own: OwnFolder; readonly copy: W05Copy; readonly locale: Loc }) {
  const result = own.result;
  const files = filesLabel(copy, result?.files.length ?? 0);
  return (
    <div className="w05-stage w05-own" data-w05-stage="own">
      <div className="w05-head">
        <p className="w05-head-a">{copy.folder.heading}</p>
        <p className="w05-head-b">
          {!result ? copy.own.empty : own.windowFrom ? fill(copy.own.summary, { files, window: formatShort(own.windowFrom, locale) }) : fill(copy.own.noAudit, { files })}
        </p>
      </div>
      <ol className="w05-own-rows">
        {GENERIC_ITEM_IDS.map((id) => {
          const ownItem = result?.items.find((entry) => entry.id === id);
          const off = !own.enabled.has(id);
          const best = ownItem?.candidates[0];
          return (
            <li key={id} className="w05-own-row" data-bound={ownItem?.bound} data-off={off ? "" : undefined}>
              <span className="w05-req">
                <b>{id}</b> <span className="w05-req-label">{itemById(id).short[locale]}</span>
              </span>
              <span className="w05-own-bound">{ownItem ? copy.own.bound[ownItem.bound] : copy.folder.unknown}</span>
              <span className="w05-own-file">{best ? <FileName name={best.entry.name} /> : null}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Beat 8: what goes home, as a list; each row is a download or the skill. */
export function TakehomeStage({
  copy,
  onDownload,
}: {
  readonly copy: W05Copy;
  readonly onDownload: (which: "instructions" | "index" | "gapList") => void;
}) {
  const [skill, instructions, index, gapList] = copy.takehome.rows;
  const rows = [
    { row: instructions, which: "instructions" as const },
    { row: index, which: "index" as const },
    { row: gapList, which: "gapList" as const },
  ];
  return (
    <div className="w05-stage w05-home" data-w05-stage="takehome">
      <div className="w05-head">
        <p className="w05-head-a">{copy.takehome.caption}</p>
      </div>
      <ul className="w05-home-rows">
        <li className="w05-home-row">
          <a className="w05-home-link" href="/skills/audit-nachweise.zip" download>
            <span className="w05-chip">{skill[0]}.zip</span>
            <span className="w05-home-line">{skill[1]}</span>
          </a>
        </li>
        {rows.map(({ row, which }) => (
          <li key={which} className="w05-home-row">
            <button type="button" className="w05-home-link" onClick={() => onDownload(which)} data-w05-download={which}>
              <span className="w05-chip">{row[0]}</span>
              <span className="w05-home-line">{row[1]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
