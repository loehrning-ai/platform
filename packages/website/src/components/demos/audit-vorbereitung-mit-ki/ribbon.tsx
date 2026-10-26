"use client";

import type { ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";

/**
 * The request ribbon: R1 to R8 with their status, docked under the site
 * header while the sections below the stage scroll by, so a station always
 * says which item it is about. The one glass surface of this demo (floating
 * chrome over moving content); never on the stage, a card or a table.
 */
export function Ribbon({
  model,
  copy,
  shown,
  selected,
  onSelect,
}: {
  readonly model: Model;
  readonly copy: W05Copy;
  readonly shown: boolean;
  readonly selected: ItemId | null;
  readonly onSelect: (id: ItemId) => void;
}) {
  return (
    <nav className="w05-ribbon glass" aria-label={copy.ribbon} data-w05-ribbon="">
      <ul className="w05-ribbon-list">
        {model.rows.map((row) => (
          <li key={row.item.id}>
            <button
              type="button"
              className="w05-ribbon-chip"
              aria-pressed={selected === row.item.id}
              data-status={shown ? row.best.status : undefined}
              onClick={() => onSelect(row.item.id)}
            >
              <b>{row.item.id}</b>
              {shown ? (
                <>
                  <i className="w05-ribbon-square" aria-hidden="true" />
                  <span className="w05-ribbon-word">{copy.status[row.best.status]}</span>
                </>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
