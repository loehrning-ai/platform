"use client";

import { useEffect, useState } from "react";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { QUARTER, T1_EXPECTED } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { CARD_SIDE, FILES, SETTLE_MS, type DemoState, type FileId, type GradeId, type Side } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import type { Fmt } from "./fmt";
import type { TubGeometry } from "./tub";
import { PLOT, y } from "./tub-geometry";
import { hit, useDrop } from "./use-drop";

const SIDE_ATTR = "data-w03-side";
/** The tub carries this attribute in scene 5 move 2: the Prüfliste is dropped on it. */
export const TUB_DROP_ATTR = "data-w03-tubdrop";

/** The sentence a file gets when it lands: the card's view of it, then why. `matched` is the visitor's own placement, not where the file ended up. */
export function fileSentences(pack: Pack, file: FileId, matched: boolean): readonly string[] {
  const p = pack.projekt;
  const why = file === "contacts" ? p.sentences.contacts : file === "testlist" ? p.sentences.testlist : file === "export" ? p.sentences.export : p.sentences.in;
  return [matched ? p.same : p.moved, why];
}

function FileChip({
  pack,
  file,
  selected,
  pending,
  drag,
  onSelect,
}: {
  readonly pack: Pack;
  readonly file: FileId;
  readonly selected: boolean;
  readonly pending: boolean;
  readonly drag: ReturnType<typeof useDrop>;
  readonly onSelect: (file: FileId) => void;
}) {
  const entry = pack.projekt.files[file];
  return (
    <button
      type="button"
      className="w03-file-chip"
      data-file={file}
      data-selected={selected ? "" : undefined}
      data-pending={pending ? "" : undefined}
      data-dragging={drag.moved(file) ? "" : undefined}
      aria-pressed={selected}
      aria-label={`${entry.file}, ${entry.name}`}
      style={drag.styleFor(file)}
      onClick={() => drag.tapped() && onSelect(file)}
      {...drag.handlers(file)}
      data-w03-file={file}
    >
      {file === "contacts" ? (
        <svg viewBox="0 0 16 16" className="w03-lock" aria-hidden="true">
          <rect x="3" y="7" width="10" height="7" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </svg>
      ) : null}
      <span className="w03-file-name">{entry.file}</span>
      <span className="w03-file-what">{entry.name}</span>
    </button>
  );
}

/**
 * Scene 5 move 1: six files between the Project tray and the visitor's desk.
 * Drag a file to a side, or tap the file and then the side. The moment it
 * lands it is compared with the card; a file the card puts elsewhere keeps
 * an outline and glides over after SETTLE_MS (it jumps under reduced motion).
 */
export function ProjectSort({
  pack,
  fmt,
  state,
  onPlace,
  onSettle,
  reducedMotion,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly state: DemoState;
  readonly onPlace: (file: FileId, side: Side) => void;
  readonly onSettle: () => void;
  readonly reducedMotion: boolean;
}) {
  const p = pack.projekt;
  const [selected, setSelected] = useState<FileId | null>(null);
  const drag = useDrop((item, x, yy) => {
    const side = hit(x, yy, SIDE_ATTR);
    if (side === "in" || side === "out") {
      setSelected(null);
      onPlace(item as FileId, side);
    }
  });

  useEffect(() => {
    if (!state.pending) return;
    const timer = setTimeout(onSettle, reducedMotion ? 0 : SETTLE_MS);
    return () => clearTimeout(timer);
  }, [onSettle, reducedMotion, state.pending]);

  const chips = (where: Side | null) =>
    FILES.filter((file) => state.placed[file] === where).map((file) => (
      <FileChip key={file} pack={pack} file={file} selected={selected === file} pending={state.pending === file} drag={drag} onSelect={(chosen) => setSelected(selected === chosen ? null : chosen)} />
    ));

  const zone = (side: Side) => {
    const name = side === "in" ? p.tray : p.desk;
    const selectedName = selected ? p.files[selected].file : "";
    return (
      <div className="w03-zone" data-side={side} {...{ [SIDE_ATTR]: side }} data-w03-zone={side}>
        <p className="w03-zone-name">{name}</p>
        <div className="w03-zone-chips">{chips(side)}</div>
        {selected ? (
          <button
            type="button"
            className="w03-zone-target"
            onClick={() => {
              onPlace(selected, side);
              setSelected(null);
            }}
            aria-label={fmt.t(side === "in" ? p.moveTo.in : p.moveTo.out, { file: selectedName })}
            data-w03-place={side}
          >
            <span className="w03-zone-target-long">{fmt.t(side === "in" ? p.moveTo.in : p.moveTo.out, { file: selectedName })}</span>
            <span className="w03-zone-target-short">{p.placeHere}</span>
          </button>
        ) : null}
      </div>
    );
  };

  const unplaced = chips(null);
  return (
    <div className="w03-project" data-reduced={reducedMotion ? "" : undefined}>
      {zone("in")}
      {unplaced.length > 0 ? (
        <div className="w03-pile" role="group" aria-label={p.pile}>
          <p className="w03-zone-name">{p.pile}</p>
          <div className="w03-zone-chips">{unplaced}</div>
        </div>
      ) : null}
      {zone("out")}
      <p className="w03-project-line">{p.takehomeLine}</p>
    </div>
  );
}

/** Whether a file sits where the card puts it (for the e2e and the glyphs). */
export function placedRight(state: DemoState, file: FileId): boolean {
  return state.placed[file] === CARD_SIDE[file];
}

/**
 * Scene 5 move 2, drawn on the tub: once tested, the three expected values
 * as Mennige marks on the water, and the graded answer as a dashed bar in
 * each quarter column. Where the answer misses, a line runs from its value
 * to the expected one, with a short readout in April.
 */
export function TestMarks({
  pack,
  fmt,
  geometry,
  tested,
  grade,
  values,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly geometry: TubGeometry;
  readonly tested: boolean;
  readonly grade: GradeId;
  readonly values: readonly number[] | null;
}) {
  if (!tested) return null;
  const p = pack.projekt;
  const april = geometry.col(QUARTER[0] as string);
  const aprilGot = values?.[0];
  const aprilWant = T1_EXPECTED[0] ?? 0;
  return (
    <g className="w03-marks" aria-hidden="true" data-w03-grade-marks={grade}>
      {QUARTER.map((month, index) => {
        const c = geometry.col(month);
        if (!c) return null;
        const cx = (c.x0 + c.x1) / 2;
        const want = T1_EXPECTED[index] ?? 0;
        const got = values?.[index];
        return (
          <g key={month} className="w03-mark" style={{ animationDelay: `${index * 90}ms` }}>
            {got != null ? <line x1={c.x0 + 3} x2={c.x1 - 3} y1={y(got)} y2={y(got)} className="w03-got" data-hit={got === want ? "" : undefined} /> : null}
            <circle cx={cx} cy={y(want)} r="5.5" />
            <path d={`M${cx - 2.6},${y(want)}l1.8,1.9l3.6,-3.8`} className="w03-mark-tick" />
          </g>
        );
      })}
      {april && aprilGot != null && aprilGot !== aprilWant ? (
        <g className="w03-miss">
          <line x1={(april.x0 + april.x1) / 2} x2={(april.x0 + april.x1) / 2} y1={y(aprilGot)} y2={y(aprilWant) + 7} />
          <text x={april.x0 + 3} y={y(aprilGot) - 6} className="w03-miss-label">
            {fmt.t(p.gradeRow, { source: p.grades[grade], got: fmt.n(aprilGot) })}
          </text>
        </g>
      ) : null}
      {april && values === null ? (
        <text x={PLOT.l + 6} y={PLOT.t + 28} className="w03-miss-label">
          {fmt.t(p.gradeRowNone, { source: p.grades[grade] })}
        </text>
      ) : null}
    </g>
  );
}

/** The Prüfliste as a chip the visitor drags onto the tub, then as the opened test card. */
export function TestCard({
  pack,
  fmt,
  tested,
  onTest,
  grade,
  values,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly tested: boolean;
  readonly onTest: () => void;
  readonly grade: GradeId;
  readonly values: readonly number[] | null;
}) {
  const p = pack.projekt;
  const drag = useDrop((_item, x, yy) => {
    if (hit(x, yy, TUB_DROP_ATTR) !== null) onTest();
  });
  if (!tested) {
    return (
      <div className="w03-test-start">
        <button
          type="button"
          className="w03-file-chip"
          data-file="testlist"
          data-dragging={drag.moved("testlist") ? "" : undefined}
          style={drag.styleFor("testlist")}
          aria-label={`${p.files.testlist.file}, ${p.testButton}`}
          onClick={() => drag.tapped() && onTest()}
          {...drag.handlers("testlist")}
          data-w03-testchip=""
        >
          <span className="w03-file-name">{p.files.testlist.file}</span>
          <span className="w03-file-what">{p.files.testlist.name}</span>
        </button>
        <p className="w03-test-hint">{p.dropHere}</p>
      </div>
    );
  }
  return (
    <div className="w03-test-card" data-w03-test-card="">
      <p className="w03-test-title">{p.testCard}</p>
      <ul>
        {QUARTER.map((month, index) => {
          const got = values?.[index];
          return (
            <li key={month}>
              <span>{fmt.t(p.testRow, { month: fmt.monthShort(month), want: fmt.n(T1_EXPECTED[index] ?? 0) })}</span>
              <span className="w03-test-got" data-hit={got === T1_EXPECTED[index] ? "" : undefined}>
                {got == null ? fmt.t(p.gradeRowNone, { source: p.grades[grade] }) : fmt.t(p.gradeRow, { source: p.grades[grade], got: fmt.n(got) })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
