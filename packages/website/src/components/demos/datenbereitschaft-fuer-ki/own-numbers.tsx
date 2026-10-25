"use client";

import type { Fields, Read } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/input";
import type { DemoPack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/pack";
import type { Reading } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/series";
import { Radios } from "./radios";

const INPUT_PROPS = { autoComplete: "off", autoCapitalize: "off", spellCheck: false } as const;

/** The visitor's own numbers: paste a row or column, a start, a name, a table. Nothing leaves the device. */
export function OwnNumbers({
  fields,
  read,
  override,
  onFields,
  onOverride,
  onSample,
  onReset,
  onCommit,
  pack,
}: {
  readonly fields: Fields;
  readonly read: Read;
  readonly override: Reading | null;
  readonly onFields: (next: Fields) => void;
  readonly onOverride: (reading: Reading) => void;
  readonly onSample: (kind: Reading) => void;
  readonly onReset: () => void;
  /** The visitor is done with a field (paste, leaving it, a sample): show the numbers on the stage. */
  readonly onCommit: (when: "paste" | "done") => void;
  readonly pack: DemoPack;
}) {
  const { own } = pack;
  const field = (patch: Partial<Fields>) => onFields({ ...fields, ...patch });
  const guess =
    read.status === "ok"
      ? read.likely === "change"
        ? own.likelyChange
        : read.likely === "level"
          ? own.likelyLevel
          : own.unclear
      : null;
  const failReason = read.status === "fail" ? { count: own.failCount, token: own.failToken, start: own.failStart }[read.reason] : "";
  const startNote =
    read.status === "ok" ? (read.series.startNote === "zero" ? ` ${own.assumedStart}` : read.series.startNote === "first" ? ` ${own.firstIsStart}` : "") : "";
  const status = read.status === "fail" ? `${own.parseFail} ${failReason} ${own.exampleStays}` : read.status === "ok" ? `${own.loaded}${startNote}` : "";
  return (
    <section className="dr3-own" aria-labelledby="dr3-own-title">
      <h2 id="dr3-own-title" className="dr3-h">
        {own.title}
      </h2>
      <div className="dr3-actions">
        <button type="button" className="dr3-btn" onClick={() => { onSample("change"); onCommit("done"); }}>
          {own.sampleChange}
        </button>
        <button type="button" className="dr3-btn" onClick={() => { onSample("level"); onCommit("done"); }}>
          {own.sampleLevel}
        </button>
        <button type="button" className="dr3-btn" onClick={onReset}>
          {own.loadExample}
        </button>
      </div>
      <div className="dr3-fields">
        <label className="dr3-field dr3-field-wide">
          <span>{own.valuesLabel}</span>
          <textarea
            {...INPUT_PROPS}
            rows={2}
            inputMode="text"
            value={fields.values}
            placeholder={own.valuesPlaceholder}
            onChange={(event) => field({ values: event.target.value })}
            onPaste={() => onCommit("paste")}
            onBlur={() => onCommit("done")}
          />
        </label>
        <label className="dr3-field">
          <span>{own.startLabel}</span>
          <input {...INPUT_PROPS} type="text" inputMode="decimal" value={fields.start} onChange={(event) => field({ start: event.target.value })} onBlur={() => onCommit("done")} />
        </label>
        <label className="dr3-field">
          <span>{own.nameLabel}</span>
          <input {...INPUT_PROPS} type="text" inputMode="text" maxLength={40} value={fields.name} placeholder="ending_mrr" onChange={(event) => field({ name: event.target.value })} />
        </label>
        <label className="dr3-field dr3-field-wide">
          <span>{own.tableLabel}</span>
          <input {...INPUT_PROPS} type="text" inputMode="text" maxLength={40} value={fields.table} onChange={(event) => field({ table: event.target.value })} />
        </label>
        <label className="dr3-check">
          <input type="checkbox" checked={fields.neverNeg} onChange={(event) => field({ neverNeg: event.target.checked })} />
          <span>{own.neverNeg}</span>
        </label>
      </div>
      <p className="dr3-status" role="status" data-state={read.status}>
        {status}
      </p>
      {guess ? (
        <div className="dr3-guess">
          <p>{guess}</p>
          <Radios
            className="dr3-kind"
            label={own.kindGroup}
            value={override ?? (read.status === "ok" && read.kind !== "unclear" ? read.kind : null)}
            onChange={onOverride}
            options={[
              { id: "change", label: pack.ui.wordChange.replace("?", "") },
              { id: "level", label: pack.ui.wordLevel.replace("!", "") },
            ]}
          />
        </div>
      ) : null}
      <p className="dr3-device">{own.device}</p>
    </section>
  );
}
