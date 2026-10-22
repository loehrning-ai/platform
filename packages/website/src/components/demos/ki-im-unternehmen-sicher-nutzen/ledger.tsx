"use client";

import { fmt } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import { slotFrame } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import type { W05Text } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import type { SceneId } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { LightGlyph, LightLabel } from "./glyphs";
import type { DemoState } from "./store";

interface SlotProps {
  readonly state: DemoState;
  readonly text: W05Text;
  /** The scene whose glyph is dropping, and its slot t. */
  readonly dropping: { readonly id: SceneId; readonly t: number } | null;
  readonly onSelect: (id: SceneId) => void;
}

/**
 * Phone: eight 44px slots, no visible label. Before a commit a slot shows the first two letters
 * of the name, after it the key glyph. Not sticky.
 */
export function SlotRow({ state, text, dropping, onSelect }: SlotProps) {
  const copy = text.ui;
  return (
    // The initials say what the row is; the name stays for screen readers.
    <nav aria-label={copy.slotsLabel} data-slots="">
      <div className="w05-slots">
        {text.scenes.map((scene) => {
          const run = state.runs[scene.id];
          const picked = run.picked;
          const frame = slotFrame(dropping?.id === scene.id ? dropping.t : 1);
          return (
            <button
              key={scene.id}
              type="button"
              className="w05-slot anti-btn"
              aria-current={state.current === scene.id ? "step" : undefined}
              aria-label={
                picked
                  ? fmt(copy.slotName, {
                      person: scene.person,
                      answer: copy.lights[scene.key].word,
                      you: copy.lights[picked].word,
                    })
                  : fmt(copy.slotNameOpen, { person: scene.person })
              }
              data-slot={scene.id}
              onClick={() => onSelect(scene.id)}
            >
              {picked ? (
                <span
                  aria-hidden="true"
                  className="inline-grid"
                  data-t={frame.opacity.toFixed(2)}
                  style={{ opacity: frame.opacity, transform: `scale(${frame.scale})` }}
                >
                  <LightGlyph light={scene.key} className="size-6" />
                </span>
              ) : (
                // Named, never numbered: the deck counts the pastes differently.
                <span aria-hidden="true" data-slot-initials="">
                  {scene.person.slice(0, 2)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface TableProps {
  readonly state: DemoState;
  readonly text: W05Text;
  readonly headingId: string;
  /** In the island the person names open their scene; in Freitag they are text. */
  readonly onSelect?: (id: SceneId) => void;
  readonly dropping?: { readonly id: SceneId; readonly t: number } | null;
}

/** "Deine acht Ampeln": Person, Konto, Du, Lösung, Ausprobiert. */
export function LedgerTable({ state, text, headingId, onSelect, dropping = null }: TableProps) {
  const copy = text.ui;
  return (
    // The host is a size container: on a narrow phone the table drops the
    // light words (glyph only, the word stays for screen readers) to fit.
    <div className="w05-table-host">
      <table className="w05-table" aria-labelledby={headingId} data-ledger={onSelect ? "island" : "friday"}>
        <thead>
          <tr>
            <th scope="col">{copy.tableCols.person}</th>
            <th scope="col">{copy.tableCols.account}</th>
            <th scope="col">{copy.tableCols.you}</th>
            <th scope="col">{copy.tableCols.answer}</th>
            <th scope="col">{copy.tableCols.tried}</th>
          </tr>
        </thead>
        <tbody>
          {text.scenes.map((scene) => {
            const run = state.runs[scene.id];
            const picked = run.picked;
            const current = onSelect !== undefined && state.current === scene.id;
            const frame = slotFrame(dropping?.id === scene.id ? dropping.t : 1);
            return (
              <tr key={scene.id} data-current={current ? "true" : undefined} data-row={scene.id}>
                <th scope="row">
                  {onSelect ? (
                    <button
                      type="button"
                      className="w05-person anti-link"
                      aria-current={current ? "step" : undefined}
                      aria-label={fmt(copy.openScene, { person: scene.person })}
                      onClick={() => onSelect(scene.id)}
                    >
                      {scene.person}
                    </button>
                  ) : (
                    <span className="font-bold">{scene.person}</span>
                  )}
                </th>
                <td>{scene.short}</td>
                <td>{picked ? <LightLabel light={picked} copy={copy} className="w05-cell-light" /> : <Dot label={copy.open} />}</td>
                <td>
                  {picked ? (
                    <span
                      className="inline-flex"
                      style={{ opacity: frame.opacity, transform: `scale(${frame.scale})` }}
                    >
                      <LightLabel light={scene.key} copy={copy} className="w05-cell-light" />
                    </span>
                  ) : (
                    <Dot label={copy.open} />
                  )}
                </td>
                <td>{picked ? (run.tried ? copy.yes : copy.open) : <Dot label={copy.open} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Dot({ label }: { readonly label: string }) {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        ·
      </span>
      <span className="sr-only">{label}</span>
    </>
  );
}
