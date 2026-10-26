"use client";

import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { ENDING_MRR, NET_NEW_2026, SUMMARY } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { CHIP_GAP, CHIP_ORDER, GAPS, RIGHT_CHIPS, TILES, type ChipId, type DemoState, type GapId, type TileId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import type { Fmt } from "./fmt";
import { hit, useDrop } from "./use-drop";

const GAP_ATTR = "data-w03-gap";
const BOX_ATTR = "data-w03-box2";

/**
 * Scene 3, box 1: the question as a sentence with four gaps. Chips are
 * dragged into a gap with a mouse or a pen, or tapped to go to their gap
 * (the touch and keyboard path). A distractor stays in its gap with its one
 * sentence until it is swapped.
 */
export function QuestionBuilder({ pack, fmt, state, onChip, onUnchip }: { readonly pack: Pack; readonly fmt: Fmt; readonly state: DemoState; readonly onChip: (chip: ChipId) => void; readonly onUnchip: (gap: GapId) => void }) {
  const s = pack.sicht;
  const drop = useDrop((item, x, y) => {
    const gap = hit(x, y, GAP_ATTR);
    if (gap && CHIP_GAP[item as ChipId] === gap) onChip(item as ChipId);
  });
  const slot = (gap: GapId) => {
    const chip = state.gaps[gap];
    const right = chip !== null && RIGHT_CHIPS.includes(chip);
    return (
      <span key={gap} className="w03-gap" {...{ [GAP_ATTR]: gap }} data-filled={chip ? "" : undefined} data-right={right ? "" : undefined}>
        {chip ? (
          <button type="button" className="w03-gap-chip" onClick={() => onUnchip(gap)} aria-label={`${s.chips[chip]}, ${s.gapNames[gap]}`}>
            {s.chips[chip]}
          </button>
        ) : (
          <span className="w03-gap-empty">{s.gapNames[gap]}</span>
        )}
      </span>
    );
  };
  const words = s.frame.map((word, index) => {
    const match = /^\{(\w+)\}(.*)$/.exec(word);
    if (!match) return <span key={index}>{word}</span>;
    return (
      <span key={index} className="w03-gap-wrap">
        {slot(match[1] as GapId)}
        {match[2]}
      </span>
    );
  });
  const rings = GAPS.map((gap) => (state.gaps[gap] !== null && RIGHT_CHIPS.includes(state.gaps[gap] as ChipId) ? "full" : state.gaps[gap] ? "half" : "empty"));
  return (
    <div className="w03-question">
      <p className="w03-question-from">{s.from}</p>
      <p className="w03-question-sentence" data-w03-sentence="">
        {words}
      </p>
      <p className="w03-rings" aria-hidden="true">
        {rings.map((ring, index) => (
          <span key={index} className="w03-ring" data-fill={ring} />
        ))}
      </p>
      <div className="w03-tray" role="group" aria-label={s.trayLabel}>
        {CHIP_ORDER.filter((chip) => state.gaps[CHIP_GAP[chip]] !== chip).map((chip) => (
          <button
            key={chip}
            type="button"
            className="w03-word"
            data-dragging={drop.moved(chip) ? "" : undefined}
            style={drop.styleFor(chip)}
            aria-label={fmt.t(s.chipAction, { chip: s.chips[chip], gap: s.gapNames[CHIP_GAP[chip]] })}
            onClick={() => drop.tapped() && onChip(chip)}
            {...drop.handlers(chip)}
            data-w03-chip={chip}
          >
            {s.chips[chip]}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Scene 3, box 2: eight tiles, the seven export tables and the approved
 * view. An export tile lands, says its one sentence and springs back; the
 * approved view lands and stays, and shows its rows March to June.
 */
export function ViewPicker({ pack, fmt, state, onTile }: { readonly pack: Pack; readonly fmt: Fmt; readonly state: DemoState; readonly onTile: (tile: TileId) => void }) {
  const s = pack.sicht;
  const drop = useDrop((item, x, y) => {
    if (hit(x, y, BOX_ATTR)) onTile(item as TileId);
  });
  const landed = state.viewPlaced ? "view" : null;
  const rows = SUMMARY.filter((row) => row.month >= "2026-03");
  return (
    <div className="w03-picker">
      <div className="w03-box2" {...{ [BOX_ATTR]: "" }} data-filled={landed ? "" : undefined} data-w03-box2="">
        <p className="w03-box2-title">{s.box2}</p>
        {landed ? (
          <div className="w03-view-card" data-w03-view-card="">
            <p className="w03-view-name">
              {s.tiles.view.title} <span className="w03-file">{s.viewFile}</span>
            </p>
            <table className="w03-view-table">
              <caption className="sr-only">{s.viewRows}</caption>
              <thead>
                <tr>
                  <th scope="col">month_start</th>
                  <th scope="col">ending_mrr_eur</th>
                  <th scope="col">net_new_mrr_eur</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.month}>
                    <th scope="row">{fmt.monthShort(row.month)}</th>
                    <td>{fmt.n(row.ending)}</td>
                    <td>{fmt.n(row.netNew)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="w03-view-sentence">{fmt.t(s.viewSentence, { mar: fmt.eur(ENDING_MRR["2026-03"]), change: fmt.eur(NET_NEW_2026[3] ?? 0), apr: fmt.eur(ENDING_MRR["2026-04"]) })}</p>
          </div>
        ) : state.lastTile && state.lastTile !== "view" ? (
          <p className="w03-box2-bounce" key={state.lastTile} data-w03-bounce={state.lastTile}>
            <strong>{s.tiles[state.lastTile].title}</strong> {s.tiles[state.lastTile].sentence}
          </p>
        ) : (
          <p className="w03-box2-empty">{s.box2Empty}</p>
        )}
      </div>
      {!landed ? (
        <div className="w03-tiles" role="group" aria-label={s.tilesLabel}>
          {TILES.map((tile) => (
            <button
              key={tile}
              type="button"
              className="w03-tile"
              data-view={tile === "view" ? "" : undefined}
              data-last={state.lastTile === tile ? "" : undefined}
              data-dragging={drop.moved(tile) ? "" : undefined}
              style={drop.styleFor(tile)}
              aria-label={fmt.t(s.pick, { title: s.tiles[tile].title })}
              onClick={() => drop.tapped() && onTile(tile)}
              {...drop.handlers(tile)}
              data-w03-tile={tile}
            >
              <span className="w03-tile-title">{s.tiles[tile].title}</span>
              {tile === "view" ? <span className="w03-file">{s.viewFile}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
